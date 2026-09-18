#!/usr/bin/env python3
"""
Ordered-dither a photo into a 1-bit alpha mask.

Stdlib only (zlib + struct) — no Pillow, no ffmpeg. Output is an RGBA PNG: the
dither lives in the ALPHA channel and `--color` fills the RGB, so the file drops
straight into an <img> and scales with `image-rendering: pixelated`. A CSS
mask-image would keep the colour tokenised but browsers smooth a scaled mask,
which softens exactly the dots that are the point.

Bayer rather than Floyd-Steinberg on purpose: the ordered matrix leaves a
regular crosshatch that reads as deliberate screen-printing, where diffusion
noise reads as a JPEG artefact.

  python3 tools/dither.py in.png out.png [--contrast 1.5] [--brightness 0.1]
                                         [--matrix 8] [--invert]
                                         [--color 141312]
"""
import struct
import sys
import zlib

# ── PNG read ──────────────────────────────────────────────────────────────
def read_png(path):
    data = open(path, 'rb').read()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'not a PNG'
    pos, idat, meta = 8, b'', None
    while pos < len(data):
        (length,) = struct.unpack('>I', data[pos:pos + 4])
        kind = data[pos + 4:pos + 8]
        body = data[pos + 8:pos + 8 + length]
        if kind == b'IHDR':
            w, h, depth, color, _, _, interlace = struct.unpack('>IIBBBBB', body)
            assert depth == 8, f'only 8-bit supported, got {depth}'
            assert interlace == 0, 'interlaced PNG not supported'
            assert color in (0, 2, 4, 6), f'unsupported colour type {color}'
            meta = (w, h, color)
        elif kind == b'IDAT':
            idat += body
        elif kind == b'IEND':
            break
        pos += 12 + length
    w, h, color = meta
    channels = {0: 1, 2: 3, 4: 2, 6: 4}[color]
    raw = zlib.decompress(idat)
    stride = w * channels
    out = bytearray(h * stride)
    prev = bytearray(stride)
    p = 0
    for y in range(h):
        ft = raw[p]; p += 1
        line = bytearray(raw[p:p + stride]); p += stride
        # undo the per-scanline filter (PNG spec 9.2)
        if ft == 1:
            for i in range(channels, stride):
                line[i] = (line[i] + line[i - channels]) & 0xFF
        elif ft == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 0xFF
        elif ft == 3:
            for i in range(stride):
                left = line[i - channels] if i >= channels else 0
                line[i] = (line[i] + ((left + prev[i]) >> 1)) & 0xFF
        elif ft == 4:
            for i in range(stride):
                a = line[i - channels] if i >= channels else 0
                b = prev[i]
                c = prev[i - channels] if i >= channels else 0
                pp = a + b - c
                pa, pb, pc = abs(pp - a), abs(pp - b), abs(pp - c)
                pred = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pred) & 0xFF
        elif ft != 0:
            raise ValueError(f'bad filter type {ft}')
        out[y * stride:(y + 1) * stride] = line
        prev = line
    return w, h, channels, out


def write_png(path, w, h, rgba):
    def chunk(kind, body):
        return (struct.pack('>I', len(body)) + kind + body
                + struct.pack('>I', zlib.crc32(kind + body) & 0xFFFFFFFF))
    raw = bytearray()
    for y in range(h):
        raw.append(0)  # filter type 0 — the payload is 1-bit, it compresses fine
        raw += rgba[y * w * 4:(y + 1) * w * 4]
    png = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(bytes(raw), 9))
           + chunk(b'IEND', b''))
    open(path, 'wb').write(png)


# ── dither ────────────────────────────────────────────────────────────────
def bayer(n):
    """Recursive Bayer matrix, normalised to 0..1 thresholds."""
    m = [[0]]
    size = 1
    while size < n:
        m = ([[4 * v for v in row] + [4 * v + 2 for v in row] for row in m]
             + [[4 * v + 3 for v in row] + [4 * v + 1 for v in row] for row in m])
        size *= 2
    d = size * size
    return [[(v + 0.5) / d for v in row] for row in m], size


def main():
    args = sys.argv[1:]
    src, dst = args[0], args[1]
    def opt(name, default):
        return float(args[args.index(name) + 1]) if name in args else default
    contrast = opt('--contrast', 1.0)
    brightness = opt('--brightness', 0.0)
    invert = '--invert' in args
    chex = args[args.index('--color') + 1] if '--color' in args else 'ffffff'
    cr, cg, cb = (int(chex[i:i + 2], 16) for i in (0, 2, 4))
    mat, msize = bayer(int(opt('--matrix', 8)))

    w, h, ch, px = read_png(src)
    out = bytearray(w * h * 4)
    on = 0
    for y in range(h):
        row = mat[y % msize]
        for x in range(w):
            i = (y * w + x) * ch
            if ch >= 3:
                # Rec.709 luma
                lum = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255
            else:
                lum = px[i] / 255
            alpha = px[i + ch - 1] / 255 if ch in (2, 4) else 1.0
            # levels, around mid grey
            v = (lum - 0.5) * contrast + 0.5 + brightness
            # ink coverage: dark pixels should end up OPAQUE
            coverage = v if invert else 1.0 - v
            bit = 1 if coverage > row[x % msize] and alpha > 0.5 else 0
            on += bit
            o = (y * w + x) * 4
            out[o], out[o + 1], out[o + 2] = cr, cg, cb
            out[o + 3] = 255 if bit else 0
    write_png(dst, w, h, out)
    print(f'{dst}  {w}x{h}  coverage {on / (w * h) * 100:.1f}%')


main()
