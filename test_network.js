/**
 * Test réseau réel - simule ce que Chrome DevTools Network tab verrait
 * Vérifie les images candidates actuellement en base + leur taille réelle transférée
 */

const fs = require('fs');
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

async function getCandidates() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/vote_candidates?select=id,name,photo_url&order=name.asc`, {
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
        }
    });
    return await res.json();
}

async function getImageInfo(url, name) {
    try {
        const start = Date.now();
        // Simulate browser request with Accept: image/webp,image/*
        const res = await fetch(url, {
            headers: {
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Chrome/120) AppleWebKit/537.36'
            }
        });
        const elapsed = Date.now() - start;
        const contentType = res.headers.get('content-type') || 'unknown';
        const contentLength = res.headers.get('content-length');
        const cacheControl = res.headers.get('cache-control');
        const etag = res.headers.get('etag');
        
        const buffer = await res.arrayBuffer();
        const sizeBytes = buffer.byteLength;
        const sizeKb = (sizeBytes / 1024).toFixed(1);
        
        // Determine image type from URL and content-type
        const isWebp = contentType.includes('webp') || url.includes('.webp');
        const isPng = contentType.includes('png') || url.includes('.png');
        const isJpeg = contentType.includes('jpeg') || contentType.includes('jpg') || url.includes('.jpg');
        const isOptimized = url.includes('candidates-optimized');
        
        return {
            name,
            url: url.replace(SUPABASE_URL, '[SUPABASE]'),
            sizeBytes,
            sizeKb,
            contentType,
            elapsed: `${elapsed}ms`,
            cacheControl,
            isWebp,
            isPng,
            isJpeg,
            isOptimized,
            status: res.status
        };
    } catch (err) {
        return { name, url, error: err.message };
    }
}

async function main() {
    console.log('🌐 TEST RÉSEAU RÉEL — Simulation Chrome DevTools Network → Img');
    console.log('=' .repeat(70));
    console.log(`Horodatage : ${new Date().toLocaleString('fr-FR')}\n`);
    
    const candidates = await getCandidates();
    
    console.log(`📋 ${candidates.length} candidates en base de données\n`);
    console.log('Téléchargement de toutes les images en parallèle...\n');
    
    // Simulate browser loading all images (like a page load)
    const results = await Promise.all(
        candidates.map(c => getImageInfo(c.photo_url, c.name))
    );
    
    console.log('─'.repeat(70));
    console.log('RÉSULTATS (format : [taille] [type] [optimisée?] [statut] — Candidate)');
    console.log('─'.repeat(70));
    
    let totalBytes = 0;
    let countWebp = 0;
    let countPng = 0;
    let countOptimized = 0;
    let countOk = 0;
    let warnings = [];
    
    results.forEach((r, i) => {
        if (r.error) {
            console.log(`❌  ${r.name}: ERREUR — ${r.error}`);
            return;
        }
        
        totalBytes += r.sizeBytes;
        if (r.isWebp) countWebp++;
        if (r.isPng) countPng++;
        if (r.isOptimized) countOptimized++;
        if (r.status === 200) countOk++;
        
        const sizeFlag = r.sizeBytes > 1000000 ? '🔴 GROS FICHIER' 
                       : r.sizeBytes > 500000 ? '🟡 MOYEN'
                       : '🟢 OK';
        
        const typeFlag = r.isWebp ? '✅ WebP' 
                       : r.isPng ? '⚠️  PNG' 
                       : r.isJpeg ? '⚠️  JPEG' 
                       : '❓ ???';
        
        const optFlag = r.isOptimized ? '✅ optimisée' : '⚠️  originale';
        
        console.log(`${sizeFlag}  ${r.sizeKb.padStart(8)} KB  ${typeFlag}  ${optFlag}  (${r.elapsed}) — ${r.name}`);
        console.log(`         URL: ${r.url}`);
        console.log(`         Cache: ${r.cacheControl || 'non défini'}`);
        
        if (r.sizeBytes > 1000000) {
            warnings.push(`⚠️  ${r.name}: ${r.sizeKb} KB est encore un fichier lourd !`);
        }
        if (!r.isOptimized) {
            warnings.push(`⚠️  ${r.name}: l'image servie n'est PAS dans candidates-optimized/`);
        }
        
        console.log();
    });
    
    const totalKb = (totalBytes / 1024).toFixed(1);
    const totalMb = (totalBytes / 1048576).toFixed(3);
    
    console.log('═'.repeat(70));
    console.log('📊 RÉCAPITULATIF — CE QUE CHROME DEVTOOLS NETWORK AFFICHERAIT');
    console.log('═'.repeat(70));
    console.log(`\n📦 Poids total transféré pour les 14 images : ${totalKb} KB (${totalMb} MB)`);
    console.log(`📁 Nombre de fichiers image chargés : ${results.filter(r => !r.error).length}`);
    console.log(`✅ Format WebP : ${countWebp}/${candidates.length}`);
    console.log(`⚠️  Format PNG  : ${countPng}/${candidates.length}`);
    console.log(`✅ Images optimisées : ${countOptimized}/${candidates.length}`);
    console.log(`✅ Statut HTTP 200 : ${countOk}/${candidates.length}`);
    
    const avgKb = (totalBytes / candidates.length / 1024).toFixed(0);
    console.log(`📊 Poids moyen par image : ${avgKb} KB`);
    
    if (countPng > 0) {
        console.log(`\n🚨 ATTENTION : ${countPng} image(s) PNG encore servie(s) ! Vérification requise.`);
    } else {
        console.log(`\n✅ AUCUN PNG de 2–4 MB détecté. Toutes les images sont optimisées.`);
    }
    
    if (warnings.length > 0) {
        console.log('\n⚠️  AVERTISSEMENTS:');
        warnings.forEach(w => console.log(`   ${w}`));
    } else {
        console.log(`\n✅ Tout est correct. Aucun fichier lourd détecté.`);
    }
    
    // Now check voting functionality
    console.log('\n' + '═'.repeat(70));
    console.log('🗳️  VÉRIFICATION DES DONNÉES DE VOTE');
    console.log('═'.repeat(70));
    
    // Get campaign info
    const campaignRes = await fetch(`${SUPABASE_URL}/rest/v1/votes_campaigns?status=eq.active&limit=5`, {
        headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
    });
    const campaigns = await campaignRes.json();
    
    console.log(`\n📋 Campagnes actives : ${campaigns.length}`);
    
    for (const camp of campaigns) {
        console.log(`\n🏆 "${camp.title}" (ID: ${camp.id})`);
        console.log(`   Statut: ${camp.status}, is_paid: ${camp.is_paid}, prix: ${camp.price_per_vote} ${camp.currency}`);
        console.log(`   Résultats visibles: ${camp.show_results}`);
        
        // Get votes for this campaign
        const votesRes = await fetch(`${SUPABASE_URL}/rest/v1/votes_cast?campaign_id=eq.${camp.id}&status=eq.valid`, {
            headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
        });
        const votes = await votesRes.json();
        
        const totalVotes = votes.reduce((sum, v) => sum + (v.vote_count || 1), 0);
        const totalRevenue = votes.reduce((sum, v) => sum + (v.amount_paid || 0), 0);
        
        console.log(`   Votes valides: ${votes.length} transactions → ${totalVotes} votes au total`);
        console.log(`   Revenu total: ${totalRevenue.toLocaleString()} FCFA`);
        
        // Get candidate vote breakdown
        const candRes = await fetch(`${SUPABASE_URL}/rest/v1/vote_candidates?campaign_id=eq.${camp.id}`, {
            headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
        });
        const cands = await candRes.json();
        
        console.log(`\n   Répartition des votes par candidate :`);
        const candVoteMap = {};
        votes.forEach(v => {
            if (!candVoteMap[v.candidate_id]) candVoteMap[v.candidate_id] = 0;
            candVoteMap[v.candidate_id] += (v.vote_count || 1);
        });
        
        const sortedCands = cands.map(c => ({
            ...c,
            totalVotes: candVoteMap[c.id] || 0
        })).sort((a, b) => b.totalVotes - a.totalVotes);
        
        sortedCands.forEach((c, idx) => {
            const pct = totalVotes > 0 ? ((c.totalVotes / totalVotes) * 100).toFixed(1) : '0.0';
            console.log(`   ${String(idx + 1).padStart(2)}. ${c.name.padEnd(25)} ${String(c.totalVotes).padStart(4)} votes (${pct}%)`);
        });
    }
    
    console.log('\n' + '═'.repeat(70));
    console.log('✅ TEST COMPLET TERMINÉ');
    console.log('═'.repeat(70));
}

main().catch(console.error);
