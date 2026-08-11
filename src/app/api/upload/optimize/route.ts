import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = (formData.get('folder') as string) || 'candidates-optimized';
        const bucket = (formData.get('bucket') as string) || 'vote_uploads';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Read file buffer
        const arrayBuffer = await file.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);

        // Optimize: convert to WebP, max 800px wide, 75% quality
        const optimizedBuffer = await sharp(inputBuffer)
            .resize({ width: 800, height: 1200, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 75 })
            .toBuffer();

        // Generate new filename with .webp extension
        const originalName = file.name.replace(/\.(png|jpg|jpeg|gif|bmp)$/i, '');
        const timestamp = Date.now();
        const filename = `${originalName}-${timestamp}.webp`;
        const storagePath = `${folder}/${filename}`;

        // Upload optimized image
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(storagePath, optimizedBuffer, {
                contentType: 'image/webp',
                cacheControl: '31536000',
                upsert: false
            });

        if (error) {
            console.error('Upload error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(storagePath);

        const originalSizeKb = Math.round(inputBuffer.length / 1024);
        const optimizedSizeKb = Math.round(optimizedBuffer.length / 1024);
        const reduction = Math.round((1 - optimizedBuffer.length / inputBuffer.length) * 100);

        return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
            path: storagePath,
            stats: {
                originalKb: originalSizeKb,
                optimizedKb: optimizedSizeKb,
                reduction: `${reduction}%`
            }
        });
    } catch (err: any) {
        console.error('Image optimization API error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
