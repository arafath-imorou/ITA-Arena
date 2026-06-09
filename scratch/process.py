import sys
from PIL import Image

def main():
    input_path = 'scratch/polio.jpg'
    output_path = 'scratch/polio_transparent.png'
    
    img = Image.open(input_path).convert('RGBA')
    width, height = img.size
    
    # Let's assume the white circle covers the center (width//2, height//2)
    # However, to be safe, let's pick a point slightly up and left of center
    start_x, start_y = width // 2, int(height * 0.4)
    
    pixels = img.load()
    target_color = pixels[start_x, start_y]
    
    print(f"Target color at ({start_x}, {start_y}): {target_color}")
    
    # If the target color is not close to white, we might be starting at the wrong point
    if target_color[0] < 200 or target_color[1] < 200 or target_color[2] < 200:
        print("Warning: Target color is not white!")
        
    stack = [(start_x, start_y)]
    pixels[start_x, start_y] = (255, 255, 255, 0)
    
    tol = 40
    
    visited = set()
    visited.add((start_x, start_y))
    
    while stack:
        x, y = stack.pop()
        
        for nx, ny in [(x-1, y), (x+1, y), (x, y-1), (x, y+1)]:
            if 0 <= nx < width and 0 <= ny < height:
                if (nx, ny) not in visited:
                    visited.add((nx, ny))
                    r, g, b, a = pixels[nx, ny]
                    if a > 0:
                        if abs(r - target_color[0]) <= tol and abs(g - target_color[1]) <= tol and abs(b - target_color[2]) <= tol:
                            pixels[nx, ny] = (255, 255, 255, 0)
                            stack.append((nx, ny))
                            
    img.save(output_path)
    print("Done! Saved to", output_path)

if __name__ == '__main__':
    main()
