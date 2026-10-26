# Re-encode the losslessly embedded photos of Chromium PDFs as JPEG (alpha masks stay as they are).
# Usage: python3 marketing/_pdf/compress.py marketing/pdf/*.pdf
import sys, io, zlib, pikepdf
from pikepdf import PdfImage, Name
from PIL import Image

MAXSIDE = 1400
for f in sys.argv[1:]:
    pdf = pikepdf.open(f, allow_overwriting_input=True)
    before = sum(1 for _ in [])
    n = 0
    for obj in pdf.objects:
        if not isinstance(obj, pikepdf.Stream) or obj.get('/Subtype') != Name.Image:
            continue
        if obj.get('/Filter') == Name.DCTDecode or obj.get('/ImageMask'):
            continue
        try:
            raw_len = len(obj.read_raw_bytes())
            if raw_len < 30_000:
                continue
            im = PdfImage(obj).as_pil_image()
        except Exception:
            continue
        if im.mode not in ('RGB', 'L'):
            im = im.convert('RGB')
        w, h = im.size
        if max(w, h) > MAXSIDE:
            k = MAXSIDE / max(w, h)
            im = im.resize((round(w * k), round(h * k)), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, 'JPEG', quality=82, optimize=True, progressive=False)
        if buf.tell() >= raw_len:
            continue
        obj.write(buf.getvalue(), filter=Name.DCTDecode)
        obj.Width, obj.Height = im.size
        obj.ColorSpace = Name.DeviceGray if im.mode == 'L' else Name.DeviceRGB
        obj.BitsPerComponent = 8
        for k in ('/DecodeParms', '/Decode', '/Predictor'):
            if k in obj:
                del obj[k]
        n += 1
    pdf.save(f, compress_streams=True, object_stream_mode=pikepdf.ObjectStreamMode.generate)
    print(f, 'images re-encoded:', n)
