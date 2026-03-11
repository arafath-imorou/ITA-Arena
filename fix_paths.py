import os
import re

def fix_paths(directory):
    # Get all page names (excluding special ones)
    pages = []
    for f in os.listdir(directory):
        if f.endswith('.html') and f != '404.html' and f != 'index.html':
            pages.append(os.path.splitext(f)[0])
    
    print(f"Detected pages: {pages}")

    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.html') or file.endswith('.css') or file.endswith('.js'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                rel_depth = root.replace(directory, '').count(os.sep)
                rel_prefix = '../' * rel_depth if rel_depth > 0 else './'
                
                # 1. Fix absolute paths to relative
                content = content.replace('/_next/', rel_prefix + '_next/')
                content = content.replace('/favicon.ico', rel_prefix + 'favicon.ico')
                content = content.replace('/images/', rel_prefix + 'images/')
                
                # 2. Fix href="/..." and src="/..." to relative
                content = re.sub(r'href="/(?!https?:)', f'href="{rel_prefix}', content)
                content = re.sub(r'src="/(?!https?:)', f'src="{rel_prefix}', content)
                
                # 3. CRITICAL: Fix home links for file:// compatibility
                # Replace href="./" with href="index.html"
                # Replace href="./?mode=..." with href="index.html?mode=..."
                content = content.replace(f'href="{rel_prefix}"', f'href="{rel_prefix}index.html"')
                content = content.replace(f'href="{rel_prefix}?', f'href="{rel_prefix}index.html?')
                
                # 4. Append .html to page links
                for page in pages:
                    content = content.replace(f'href="{rel_prefix}{page}"', f'href="{rel_prefix}{page}.html"')
                    content = content.replace(f'href="{rel_prefix}{page}/"', f'href="{rel_prefix}{page}.html"')

                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)

if __name__ == "__main__":
    fix_paths('out')
    print("Paths fixed successfully!")
