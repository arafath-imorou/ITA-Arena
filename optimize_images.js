/**
 * Script d'optimisation des images candidates pour ITA Arena
 * 
 * Ce script :
 * 1. Télécharge chaque image originale depuis Supabase
 * 2. Convertit en WebP à 75% de qualité, max 800px de large
 * 3. Upload une version optimisée dans vote_uploads/candidates-optimized/
 * 4. Met à jour le photo_url dans la base de données
 * 
 * Les originaux sont CONSERVÉS dans vote_uploads/candidates/
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const env = {};
const lines = fs.readFileSync('.env.local', 'utf-8').split('\n');
for (const line of lines) {
    if (line.includes('=')) {
        const parts = line.split('=');
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
}

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];
const BUCKET = 'vote_uploads';
const OPTIMIZED_PREFIX = 'candidates-optimized';
const TMP_DIR = './tmp_images_optimization';

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

async function downloadImage(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
    const buffer = await res.arrayBuffer();
    return Buffer.from(buffer);
}

async function optimizeImage(inputBuffer, filename) {
    const outPath = path.join(TMP_DIR, filename.replace(/\.(png|jpg|jpeg)$/i, '.webp'));
    
    const info = await sharp(inputBuffer)
        .resize({ width: 800, height: 1200, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 75 })
        .toFile(outPath);
    
    console.log(`  Optimized: ${(inputBuffer.length / 1024).toFixed(0)} KB → ${(info.size / 1024).toFixed(0)} KB (${info.width}x${info.height})`);
    return { path: outPath, size: info.size };
}

async function uploadOptimizedImage(localPath, fileName) {
    const fileBuffer = fs.readFileSync(localPath);
    const storagePath = `${OPTIMIZED_PREFIX}/${fileName}`;

    // Delete old optimized version if exists
    await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`, {
        method: 'DELETE',
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
        }
    });
    
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`, {
        method: 'POST',
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'image/webp',
            'Cache-Control': 'public, max-age=31536000, immutable'
        },
        body: fileBuffer
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Upload failed: ${JSON.stringify(data)}`);

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
    return publicUrl;
}

async function updateCandidatePhoto(candidateId, newPhotoUrl) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/vote_candidates?id=eq.${candidateId}`, {
        method: 'PATCH',
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({ photo_url: newPhotoUrl })
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`DB update failed: ${err}`);
    }
}

async function getCandidates() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/vote_candidates?select=id,name,photo_url&order=name.asc`, {
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
        }
    });
    return await res.json();
}

async function main() {
    console.log('🚀 ITA Arena - Optimisation des images candidates');
    console.log('=' .repeat(60));
    
    const candidates = await getCandidates();
    console.log(`\n📋 ${candidates.length} candidates trouvées\n`);
    
    const results = [];
    
    for (const candidate of candidates) {
        if (!candidate.photo_url) {
            console.log(`⚠️  ${candidate.name}: pas de photo_url, ignorée.`);
            continue;
        }
        
        console.log(`\n🖼️  Traitement de ${candidate.name}...`);
        
        try {
            // Extract filename from URL
            const urlParts = candidate.photo_url.split('/');
            const originalFilename = urlParts[urlParts.length - 1];
            const optimizedFilename = originalFilename.replace(/\.(png|jpg|jpeg)$/i, '.webp');
            
            // Skip if already optimized (in candidates-optimized folder)
            if (candidate.photo_url.includes('candidates-optimized')) {
                console.log(`  ✅ Déjà optimisée, ignorée.`);
                results.push({ name: candidate.name, status: 'already_optimized' });
                continue;
            }
            
            const originalSizeKb = 'unknown';
            
            // 1. Download original
            console.log(`  ⬇️  Téléchargement...`);
            const imageBuffer = await downloadImage(candidate.photo_url);
            const downloadedSizeKb = (imageBuffer.length / 1024).toFixed(0);
            console.log(`  📁 Taille originale: ${downloadedSizeKb} KB`);
            
            // 2. Optimize
            console.log(`  🔧 Optimisation (WebP 75%, max 800px)...`);
            const { path: optimizedPath, size: optimizedSize } = await optimizeImage(imageBuffer, originalFilename);
            
            // 3. Upload optimized
            console.log(`  ⬆️  Upload vers ${OPTIMIZED_PREFIX}/...`);
            const newPhotoUrl = await uploadOptimizedImage(optimizedPath, optimizedFilename);
            
            // 4. Update DB
            console.log(`  💾 Mise à jour en base...`);
            await updateCandidatePhoto(candidate.id, newPhotoUrl);
            
            const reduction = ((1 - optimizedSize / imageBuffer.length) * 100).toFixed(1);
            console.log(`  ✅ ${candidate.name}: ${downloadedSizeKb} KB → ${(optimizedSize / 1024).toFixed(0)} KB (-${reduction}%)`);
            
            results.push({
                name: candidate.name,
                status: 'success',
                originalKb: parseInt(downloadedSizeKb),
                optimizedKb: Math.round(optimizedSize / 1024),
                reduction: `${reduction}%`,
                newUrl: newPhotoUrl
            });
            
            // Cleanup temp file
            fs.unlinkSync(optimizedPath);
            
        } catch (err) {
            console.error(`  ❌ Erreur pour ${candidate.name}: ${err.message}`);
            results.push({ name: candidate.name, status: 'error', error: err.message });
        }
    }
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RAPPORT FINAL D\'OPTIMISATION');
    console.log('=' .repeat(60));
    
    let totalOriginal = 0;
    let totalOptimized = 0;
    
    results.forEach(r => {
        if (r.status === 'success') {
            console.log(`✅ ${r.name}: ${r.originalKb} KB → ${r.optimizedKb} KB (${r.reduction})`);
            totalOriginal += r.originalKb;
            totalOptimized += r.optimizedKb;
        } else if (r.status === 'already_optimized') {
            console.log(`⏭️  ${r.name}: déjà optimisée`);
        } else {
            console.log(`❌ ${r.name}: ${r.error}`);
        }
    });
    
    if (totalOriginal > 0) {
        const totalReduction = ((1 - totalOptimized / totalOriginal) * 100).toFixed(1);
        console.log('\n' + '-' .repeat(60));
        console.log(`📉 Total avant : ${(totalOriginal / 1024).toFixed(2)} MB`);
        console.log(`📈 Total après : ${(totalOptimized / 1024).toFixed(2)} MB`);
        console.log(`🎯 Réduction   : -${totalReduction}%`);
        console.log(`💾 Économie    : ${((totalOriginal - totalOptimized) / 1024).toFixed(2)} MB par chargement complet de la page`);
    }
    
    // Cleanup temp dir
    if (fs.existsSync(TMP_DIR)) fs.rmdirSync(TMP_DIR, { recursive: true });
    
    console.log('\n✨ Optimisation terminée !');
    console.log('Les photos originales sont conservées dans vote_uploads/candidates/');
    console.log('Les photos optimisées sont dans vote_uploads/candidates-optimized/');
}

main().catch(console.error);
