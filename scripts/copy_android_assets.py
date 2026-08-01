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
        
        # Remove old splash.png if present so @drawable/splash resolves to splash.xml
        old_png = os.path.join(target_dir, 'splash.png')
        if os.path.exists(old_png):
            os.remove(old_png)
            
        dest_path = os.path.join(target_dir, 'splash_img.png')
        shutil.copyfile(splash_src, dest_path)
        print(f"Copied splash_img -> {dest_path}")

    # Write splash.xml layer-list drawable in main drawable directory
    main_drawable_dir = os.path.join(project_root, 'android/app/src/main/res/drawable')
    os.makedirs(main_drawable_dir, exist_ok=True)
    splash_xml_path = os.path.join(main_drawable_dir, 'splash.xml')
    splash_xml_content = '''<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item>
        <color android:color="#18181b" />
    </item>
    <item>
        <bitmap
            android:src="@drawable/splash_img"
            android:gravity="fill_horizontal|center_vertical" />
    </item>
</layer-list>
'''
    with open(splash_xml_path, 'w', encoding='utf-8') as f:
        f.write(splash_xml_content)
    print(f"Created splash.xml layer-list -> {splash_xml_path}")

    print("SUCCESS: All Android image assets copied directly from source PNGs.")

if __name__ == '__main__':
    copy_android_assets()
