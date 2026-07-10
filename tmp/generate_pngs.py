import os
import zlib
import struct

def write_png(filename, width, height, generator_func):
    signature = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk data
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_chunk = b'IHDR' + ihdr_data
    ihdr_crc = struct.pack('>I', zlib.crc32(ihdr_chunk))
    ihdr_chunk = struct.pack('>I', len(ihdr_data)) + ihdr_chunk + ihdr_crc
    
    # Image data (scanlines)
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # Filter type 0 for each scanline
        for x in range(width):
            r, g, b, a = generator_func(x, y, width, height)
            raw_data.append(r)
            raw_data.append(g)
            raw_data.append(b)
            raw_data.append(a)
            
    idat_data = zlib.compress(raw_data)
    idat_chunk = b'IDAT' + idat_data
    idat_crc = struct.pack('>I', zlib.crc32(idat_chunk))
    idat_chunk = struct.pack('>I', len(idat_data)) + idat_chunk + idat_crc
    
    # IEND chunk
    iend_chunk = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', zlib.crc32(b'IEND'))
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    
    with open(filename, 'wb') as f:
        f.write(signature + ihdr_chunk + idat_chunk + iend_chunk)
    print(f"Generated: {filename} ({width}x{height})")

# Generator functions for beautiful visual patterns
def ic_launcher_gen(x, y, w, h):
    cx, cy = w / 2.0, h / 2.0
    dx = (x - cx) / (w / 2.0)
    dy = (y - cy) / (h / 2.0)
    r = (dx*dx + dy*dy)**0.5
    
    # Squircle background (slate-800: 30, 41, 59)
    if (abs(dx)**6 + abs(dy)**6) < 1.0:
        # Central emblem (gold color ring & star)
        if 0.3 <= r <= 0.4:
            return 234, 179, 8, 255 # yellow-500
        if (abs(dx) + abs(dy)) <= 0.22:
            return 234, 179, 8, 255
        return 30, 41, 59, 255
    return 0, 0, 0, 0

def ic_launcher_round_gen(x, y, w, h):
    cx, cy = w / 2.0, h / 2.0
    dx = (x - cx) / (w / 2.0)
    dy = (y - cy) / (h / 2.0)
    r = (dx*dx + dy*dy)**0.5
    
    # Round background
    if r < 0.95:
        if 0.3 <= r <= 0.4:
            return 234, 179, 8, 255 # yellow-500
        if (abs(dx) + abs(dy)) <= 0.22:
            return 234, 179, 8, 255
        return 30, 41, 59, 255
    return 0, 0, 0, 0

def ic_launcher_foreground_gen(x, y, w, h):
    cx, cy = w / 2.0, h / 2.0
    dx = (x - cx) / (w / 2.0)
    dy = (y - cy) / (h / 2.0)
    r = (dx*dx + dy*dy)**0.5
    
    # Transparent background, white central emblem
    if 0.3 <= r <= 0.4:
        return 255, 255, 255, 255
    if (abs(dx) + abs(dy)) <= 0.22:
        return 255, 255, 255, 255
    return 0, 0, 0, 0

def splash_gen(x, y, w, h):
    cx, cy = w / 2.0, h / 2.0
    # Background slate-900 (15, 23, 42)
    min_dim = min(w, h)
    scale = min_dim / 2.0
    dist = ((x - cx)**2 + (y - cy)**2)**0.5
    norm_dist = dist / scale
    
    # Central branding emblem (white)
    if 0.22 <= norm_dist <= 0.25:
        return 255, 255, 255, 255
    if (abs(x - cx)/scale + abs(y - cy)/scale) <= 0.15:
        return 255, 255, 255, 255
    return 15, 23, 42, 255

# Target paths and dimensions
assets = [
    # Mipmaps
    ("android/app/src/main/res/mipmap-mdpi/ic_launcher.png", 48, 48, ic_launcher_gen),
    ("android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png", 48, 48, ic_launcher_round_gen),
    ("android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png", 108, 108, ic_launcher_foreground_gen),
    
    ("android/app/src/main/res/mipmap-hdpi/ic_launcher.png", 72, 72, ic_launcher_gen),
    ("android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png", 72, 72, ic_launcher_round_gen),
    ("android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png", 162, 162, ic_launcher_foreground_gen),
    
    ("android/app/src/main/res/mipmap-xhdpi/ic_launcher.png", 96, 96, ic_launcher_gen),
    ("android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png", 96, 96, ic_launcher_round_gen),
    ("android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png", 216, 216, ic_launcher_foreground_gen),
    
    ("android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png", 144, 144, ic_launcher_gen),
    ("android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png", 144, 144, ic_launcher_round_gen),
    ("android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png", 324, 324, ic_launcher_foreground_gen),
    
    ("android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png", 192, 192, ic_launcher_gen),
    ("android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png", 192, 192, ic_launcher_round_gen),
    ("android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png", 432, 432, ic_launcher_foreground_gen),
    
    # Drawables (Splash screens)
    ("android/app/src/main/res/drawable/splash.png", 512, 512, splash_gen),
    ("android/app/src/main/res/drawable-port-mdpi/splash.png", 320, 480, splash_gen),
    ("android/app/src/main/res/drawable-port-hdpi/splash.png", 480, 800, splash_gen),
    ("android/app/src/main/res/drawable-port-xhdpi/splash.png", 720, 1280, splash_gen),
    ("android/app/src/main/res/drawable-port-xxhdpi/splash.png", 960, 1600, splash_gen),
    ("android/app/src/main/res/drawable-port-xxxhdpi/splash.png", 1280, 1920, splash_gen),
    
    ("android/app/src/main/res/drawable-land-mdpi/splash.png", 480, 320, splash_gen),
    ("android/app/src/main/res/drawable-land-hdpi/splash.png", 800, 480, splash_gen),
    ("android/app/src/main/res/drawable-land-xhdpi/splash.png", 1280, 720, splash_gen),
    ("android/app/src/main/res/drawable-land-xxhdpi/splash.png", 1600, 960, splash_gen),
    ("android/app/src/main/res/drawable-land-xxxhdpi/splash.png", 1920, 1280, splash_gen),
]

for filename, width, height, gen in assets:
    write_png(filename, width, height, gen)

print("All PNG assets successfully regenerated!")
