import os
import shutil

def copy_android_assets():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    icon_src = os.path.join(project_root, 'ic_launcher_icon.png')
    splash_src = os.path.join(project_root, 'splash_screen.png')

    if not os.path.exists(icon_src):
        raise FileNotFoundError(f"Icon source file not found: {icon_src}")
    if not os.path.exists(splash_src):
        raise FileNotFoundError(f"Splash source file not found: {splash_src}")

    mipmap_dirs = [
        'mipmap-mdpi',
        'mipmap-hdpi',
        'mipmap-xhdpi',
        'mipmap-xxhdpi',
        'mipmap-xxxhdpi'
    ]

    for m_dir in mipmap_dirs:
        target_dir = os.path.join(project_root, 'android/app/src/main/res', m_dir)
        os.makedirs(target_dir, exist_ok=True)
        for icon_name in ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png']:
            dest_path = os.path.join(target_dir, icon_name)
            shutil.copyfile(icon_src, dest_path)
            print(f"Copied icon -> {dest_path}")

    drawable_dirs = [
        'drawable',
        'drawable-port-mdpi',
        'drawable-port-hdpi',
        'drawable-port-xhdpi',
        'drawable-port-xxhdpi',
        'drawable-port-xxxhdpi',
        'drawable-land-mdpi',
        'drawable-land-hdpi',
        'drawable-land-xhdpi',
        'drawable-land-xxhdpi',
        'drawable-land-xxxhdpi'
    ]

    for d_dir in drawable_dirs:
        target_dir = os.path.join(project_root, 'android/app/src/main/res', d_dir)
        os.makedirs(target_dir, exist_ok=True)
        dest_path = os.path.join(target_dir, 'splash.png')
        shutil.copyfile(splash_src, dest_path)
        print(f"Copied splash -> {dest_path}")

    print("SUCCESS: All Android image assets copied directly from source PNGs.")

if __name__ == '__main__':
    copy_android_assets()
