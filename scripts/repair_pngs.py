import os
import glob
import sys

# Import generator from generate_android_assets
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from generate_android_assets import generate_assets

def repair_pngs():
    corrupted_found = False
    png_files = glob.glob('android/app/src/main/res/**/*.png', recursive=True)
    
    if not png_files:
        print("No PNG files found, generating all assets...")
        corrupted_found = True
    else:
        for p in png_files:
            if not os.path.exists(p):
                continue
            try:
                with open(p, 'rb') as f:
                    h = f.read(4)
                if h != b'\x89PNG':
                    print(f'Corrupted PNG detected: {p} (Header: {h.hex()})')
                    corrupted_found = True
                    break
            except Exception as e:
                print(f'Error checking {p}: {e}')
                corrupted_found = True
                break

    if corrupted_found or len(png_files) < 20:
        print('Generating/repairing all launcher and splash PNG assets from official URLs...')
        try:
            generate_assets()
            print('All PNG assets successfully generated!')
        except Exception as e:
            print(f'Error generating assets: {e}')
            sys.exit(1)
    else:
        print('SUCCESS: All PNG assets are present and valid.')

if __name__ == '__main__':
    repair_pngs()
