const fs = require('fs');
const sharp = require('sharp');

const env = {};
const lines = fs.readFileSync('.env.local', 'utf-8').split('\n');
for (const line of lines) {
    if (line.includes('=')) {
        const parts = line.split('=');
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
}

async function analyzeFrame() {
    const url = 'https://eqqdjqdbbwmshllqesdt.supabase.co/storage/v1/object/public/campaign_frames/298c2c96-d1ad-43e9-a194-74cabcbe4f8f/1786693801851.png';
    const res = await fetch(url);
    const buffer = Buffer.from(await res.arrayBuffer());
    
    const image = sharp(buffer);
    const metadata = await image.metadata();
    console.log('Metadata:', metadata.width, 'x', metadata.height, 'format:', metadata.format, 'channels:', metadata.channels, 'hasAlpha:', metadata.hasAlpha);

    // Analyze alpha channel to find bounding box/center of transparent region
    const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    
    let minX = info.width, maxX = 0, minY = info.height, maxY = 0;
    let transparentPixelCount = 0;
    let sumX = 0, sumY = 0;

    for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
            const idx = (y * info.width + x) * 4;
            const alpha = data[idx + 3];
            if (alpha < 128) { // Transparent pixel
                transparentPixelCount++;
                sumX += x;
                sumY += y;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    console.log(`Transparent pixels: ${transparentPixelCount}`);
    if (transparentPixelCount > 0) {
        const avgX = Math.round(sumX / transparentPixelCount);
        const avgY = Math.round(sumY / transparentPixelCount);
        console.log(`Transparent bounding box: X [${minX}, ${maxX}] (width ${maxX - minX}), Y [${minY}, ${maxY}] (height ${maxY - minY})`);
        console.log(`Transparent center (centroid): X=${avgX}, Y=${avgY}`);
        
        // Scale to 1080x1080 canvas
        const scaleX = 1080 / info.width;
        const scaleY = 1080 / info.height;
        console.log(`Scaled to 1080 canvas: Center X=${Math.round(avgX * scaleX)}, Center Y=${Math.round(avgY * scaleY)}`);
    } else {
        console.log('No transparent pixels found in frame!');
    }
}

analyzeFrame().catch(console.error);
