#!/usr/bin/env python3
"""Generate the application icon set.

Pure standard library, so the icons can always be regenerated without adding a
build dependency. The mark is drawn from signed distance fields and sampled at
three times resolution in each axis, which gives clean edges at every size.

Run: python3 scripts/generate-icons.py
"""

from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "icons"

BACKGROUND = (10, 11, 13)
MARK = (226, 171, 78)
SAMPLES = 3


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def ring_coverage(x: float, y: float, cx: float, cy: float, radius: float, width: float) -> float:
    distance = math.hypot(x - cx, y - cy)
    return 1.0 if abs(distance - radius) <= width / 2 else 0.0


def segment_coverage(
    x: float, y: float, ax: float, ay: float, bx: float, by: float, width: float
) -> float:
    dx, dy = bx - ax, by - ay
    length_squared = dx * dx + dy * dy
    if length_squared == 0:
        return 0.0
    t = clamp(((x - ax) * dx + (y - ay) * dy) / length_squared)
    px, py = ax + t * dx, ay + t * dy
    return 1.0 if math.hypot(x - px, y - py) <= width / 2 else 0.0


def rounded_square_coverage(x: float, y: float, size: float, radius: float) -> float:
    """Signed distance to a rounded square that fills the canvas.

    The trailing radius term is what rounds the corners. Without it the shape
    collapses to a sharp square inset by the radius on every side.
    """
    half = size / 2
    qx = abs(x - half) - half + radius
    qy = abs(y - half) - half + radius
    outside = math.hypot(max(qx, 0.0), max(qy, 0.0))
    inside = min(max(qx, qy), 0.0)
    return 1.0 if outside + inside - radius <= 0 else 0.0


def draw(size: int, *, content_scale: float, squircle: bool) -> bytes:
    """Render one icon and return raw RGBA bytes."""
    pixels = bytearray(size * size * 4)

    span = size * content_scale
    origin = (size - span) / 2

    # The mark is "0x": a ring and a cross, set side by side.
    ring_r = span * 0.205
    stroke = span * 0.105
    ring_cx = origin + span * 0.255
    ring_cy = origin + span * 0.5

    cross_cx = origin + span * 0.725
    cross_cy = ring_cy
    arm = span * 0.155
    cross_stroke = stroke * 0.94

    corner = size * 0.2237  # matches the platform squircle closely enough

    for py in range(size):
        for px in range(size):
            bg_hits = 0
            mark_hits = 0
            total = SAMPLES * SAMPLES

            for sy in range(SAMPLES):
                for sx in range(SAMPLES):
                    x = px + (sx + 0.5) / SAMPLES
                    y = py + (sy + 0.5) / SAMPLES

                    if squircle:
                        inside_bg = rounded_square_coverage(x, y, size, corner)
                    else:
                        inside_bg = 1.0
                    bg_hits += inside_bg

                    if inside_bg:
                        on_mark = ring_coverage(x, y, ring_cx, ring_cy, ring_r, stroke)
                        if not on_mark:
                            on_mark = segment_coverage(
                                x,
                                y,
                                cross_cx - arm,
                                cross_cy - arm,
                                cross_cx + arm,
                                cross_cy + arm,
                                cross_stroke,
                            )
                        if not on_mark:
                            on_mark = segment_coverage(
                                x,
                                y,
                                cross_cx - arm,
                                cross_cy + arm,
                                cross_cx + arm,
                                cross_cy - arm,
                                cross_stroke,
                            )
                        mark_hits += on_mark

            alpha = bg_hits / total
            mark_alpha = mark_hits / total

            r = BACKGROUND[0] * (1 - mark_alpha) + MARK[0] * mark_alpha
            g = BACKGROUND[1] * (1 - mark_alpha) + MARK[1] * mark_alpha
            b = BACKGROUND[2] * (1 - mark_alpha) + MARK[2] * mark_alpha

            index = (py * size + px) * 4
            pixels[index] = int(round(r))
            pixels[index + 1] = int(round(g))
            pixels[index + 2] = int(round(b))
            pixels[index + 3] = int(round(alpha * 255))

    return bytes(pixels)


def write_png(path: Path, size: int, rgba: bytes) -> None:
    stride = size * 4
    raw = b"".join(
        b"\x00" + rgba[row * stride : (row + 1) * stride] for row in range(size)
    )

    def chunk(tag: bytes, payload: bytes) -> bytes:
        return (
            struct.pack(">I", len(payload))
            + tag
            + payload
            + struct.pack(">I", zlib.crc32(tag + payload) & 0xFFFFFFFF)
        )

    header = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", header)
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )
    path.write_bytes(png)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    targets = [
        # Standard icons keep the squircle so they look correct anywhere they
        # are shown unmasked.
        ("icon-192.png", 192, 0.62, True),
        ("icon-512.png", 512, 0.62, True),
        # Maskable icons fill the canvas and keep the mark inside the safe zone,
        # because the platform decides the final silhouette.
        ("icon-maskable-192.png", 192, 0.46, False),
        ("icon-maskable-512.png", 512, 0.46, False),
        # iOS never applies transparency, so this one is a full bleed square.
        ("apple-touch-icon.png", 180, 0.60, False),
        ("favicon-32.png", 32, 0.70, True),
    ]

    for name, size, scale, squircle in targets:
        write_png(OUT / name, size, draw(size, content_scale=scale, squircle=squircle))
        print(f"wrote {name} at {size}px")


if __name__ == "__main__":
    main()
