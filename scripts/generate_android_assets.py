import os
import sys
import urllib.request
import subprocess

LOGO_URL = 'https://i.ibb.co.com/F4MKM3R2/20260527-055637.png'
SPLASH_URL = 'https://i.ibb.co/R4BCPZ0B/20250130-143124.png'

RAW_LOGO_PATH = '/tmp/raw_logo.png'
RAW_SPLASH_PATH = '/tmp/raw_splash.png'

def download_file(url, target_path):
    print(f"Downloading {url} -> {target_path}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response, open(target_path, 'wb') as out_file:
        out_file.write(response.read())
    print(f"Successfully downloaded {target_path} ({os.path.getsize(target_path)} bytes)")

def generate_assets():
    os.makedirs('/tmp', exist_ok=True)
    
    # Check for local uploaded images first
    local_logo = 'ic_launcher_icon.png'
    local_splash = 'splash_screen.png'

    if os.path.exists(local_logo) and os.path.getsize(local_logo) > 0:
        print(f"Using local file {local_logo} for launcher icon.")
        subprocess.run(['cp', local_logo, RAW_LOGO_PATH], check=True)
    else:
        download_file(LOGO_URL, RAW_LOGO_PATH)

    if os.path.exists(local_splash) and os.path.getsize(local_splash) > 0:
        print(f"Using local file {local_splash} for splash screen.")
        subprocess.run(['cp', local_splash, RAW_SPLASH_PATH], check=True)
    else:
        download_file(SPLASH_URL, RAW_SPLASH_PATH)

    # Launcher icons mapping: (path, size, mode)
    # mode: 'square', 'round', 'foreground'
    icon_assets = [
        ('android/app/src/main/res/mipmap-mdpi/ic_launcher.png', 48, 'square'),
        ('android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png', 48, 'round'),
        ('android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png', 108, 'foreground'),

        ('android/app/src/main/res/mipmap-hdpi/ic_launcher.png', 72, 'square'),
        ('android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png', 72, 'round'),
        ('android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png', 162, 'foreground'),

        ('android/app/src/main/res/mipmap-xhdpi/ic_launcher.png', 96, 'square'),
        ('android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png', 96, 'round'),
        ('android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png', 216, 'foreground'),

        ('android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png', 144, 'square'),
        ('android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png', 144, 'round'),
        ('android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png', 324, 'foreground'),

        ('android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', 192, 'square'),
        ('android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png', 192, 'round'),
        ('android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png', 432, 'foreground'),
    ]

    for path, sz, mode in icon_assets:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        if mode == 'foreground':
            # For adaptive icon foreground, put logo in center (~65% of size) with transparent background
            inner_sz = int(sz * 0.65)
            cmd = [
                'convert', '-size', f'{sz}x{sz}', 'xc:none',
                '(', RAW_LOGO_PATH, '-resize', f'{inner_sz}x{inner_sz}', ')',
                '-gravity', 'center', '-composite', path
            ]
        elif mode == 'round':
            # Resize logo and apply round mask
            cmd = [
                'convert', RAW_LOGO_PATH, '-resize', f'{sz}x{sz}!',
                '(', '+clone', '-threshold', '-1', '-negate', '-fill', 'white', '-draw', f'circle {sz/2},{sz/2} {sz/2},0', ')',
                '-alpha', 'off', '-composite', path
            ]
        else: # square
            cmd = ['convert', RAW_LOGO_PATH, '-resize', f'{sz}x{sz}!', path]
        
        subprocess.run(cmd, check=True)
        print(f"Generated launcher icon: {path}")

    # Splash screen mapping: (path, width, height)
    splash_assets = [
        ('android/app/src/main/res/drawable/splash.png', 512, 512),
        ('android/app/src/main/res/drawable-port-mdpi/splash.png', 320, 480),
        ('android/app/src/main/res/drawable-port-hdpi/splash.png', 480, 800),
        ('android/app/src/main/res/drawable-port-xhdpi/splash.png', 720, 1280),
        ('android/app/src/main/res/drawable-port-xxhdpi/splash.png', 960, 1600),
        ('android/app/src/main/res/drawable-port-xxxhdpi/splash.png', 1280, 1920),
        ('android/app/src/main/res/drawable-land-mdpi/splash.png', 480, 320),
        ('android/app/src/main/res/drawable-land-hdpi/splash.png', 800, 480),
        ('android/app/src/main/res/drawable-land-xhdpi/splash.png', 1280, 720),
        ('android/app/src/main/res/drawable-land-xxhdpi/splash.png', 1600, 960),
        ('android/app/src/main/res/drawable-land-xxxhdpi/splash.png', 1920, 1280),
    ]

    for path, w, h in splash_assets:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        # Calculate logo size centered on splash canvas (e.g. 40% of smallest dimension)
        logo_sz = int(min(w, h) * 0.45)
        # Clean background (white canvas or transparent/dark)
        cmd = [
            'convert', '-size', f'{w}x{h}', 'xc:#FFFFFF',
            '(', RAW_SPLASH_PATH, '-resize', f'{logo_sz}x{logo_sz}', ')',
            '-gravity', 'center', '-composite', path
        ]
        subprocess.run(cmd, check=True)
        print(f"Generated splash screen: {path}")

if __name__ == '__main__':
    generate_assets()
