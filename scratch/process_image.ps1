Add-Type -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public class ImageProcessor {
    public static void MakeTransparent(string inputPath, string outputPath, int startX, int startY) {
        Bitmap bmp = new Bitmap(inputPath);
        
        Bitmap newBmp = new Bitmap(bmp.Width, bmp.Height, PixelFormat.Format32bppArgb);
        using (Graphics g = Graphics.FromImage(newBmp)) {
            g.DrawImage(bmp, 0, 0);
        }
        
        int width = newBmp.Width;
        int height = newBmp.Height;
        
        BitmapData data = newBmp.LockBits(new Rectangle(0, 0, width, height), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        int stride = data.Stride;
        IntPtr ptr = data.Scan0;
        int bytes = Math.Abs(stride) * height;
        byte[] rgbValues = new byte[bytes];
        Marshal.Copy(ptr, rgbValues, 0, bytes);
        
        int targetIndex = (startY * stride) + (startX * 4);
        byte bTarget = rgbValues[targetIndex];
        byte gTarget = rgbValues[targetIndex + 1];
        byte rTarget = rgbValues[targetIndex + 2];
        
        Stack<Point> pixels = new Stack<Point>();
        pixels.Push(new Point(startX, startY));
        
        rgbValues[targetIndex + 3] = 0; 
        
        int tol = 40; 
        
        while (pixels.Count > 0) {
            Point a = pixels.Pop();
            int x = a.X;
            int y = a.Y;
            
            int[] dx = {-1, 1, 0, 0};
            int[] dy = {0, 0, -1, 1};
            
            for(int i=0; i<4; i++) {
                int nx = x + dx[i];
                int ny = y + dy[i];
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    int index = (ny * stride) + (nx * 4);
                    byte alpha = rgbValues[index + 3];
                    if (alpha > 0) {
                        byte b = rgbValues[index];
                        byte g = rgbValues[index + 1];
                        byte r = rgbValues[index + 2];
                        
                        if (Math.Abs(b - bTarget) <= tol && Math.Abs(g - gTarget) <= tol && Math.Abs(r - rTarget) <= tol) {
                            rgbValues[index + 3] = 0; 
                            pixels.Push(new Point(nx, ny));
                        }
                    }
                }
            }
        }
        
        Marshal.Copy(rgbValues, 0, ptr, bytes);
        newBmp.UnlockBits(data);
        newBmp.Save(outputPath, ImageFormat.Png);
        Console.WriteLine("Done! Dimensions: " + width + "x" + height);
    }
}
"@ -ReferencedAssemblies System.Drawing

$inputPath = "c:\Users\HP\Desktop\ITA\Finalisé\ITA ARENA\public\events\POLIO CAMPAGNE SOUTIEN.jpg"
$outputPath = "c:\Users\HP\Desktop\ITA\Finalisé\ITA ARENA\public\events\POLIO_FRAME.png"

try {
    # We guess 500,500 is white space. Let's try 500,400.
    [ImageProcessor]::MakeTransparent($inputPath, $outputPath, 500, 400)
} catch {
    Write-Host $_.Exception.Message
}
