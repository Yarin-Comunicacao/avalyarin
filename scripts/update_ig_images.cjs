const mysql = require('mysql2/promise');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Read results
const data = JSON.parse(fs.readFileSync('/home/ubuntu/fetch_instagram_profile_photos.json', 'utf8'));

// Filter valid URLs (cdninstagram, fbcdn, inflact - all are direct image URLs)
const valid = data.results.filter(r => {
  const url = r.output?.profile_pic_url || '';
  return url !== 'not_found' && url !== '' && (
    url.includes('cdninstagram') || 
    url.includes('fbcdn') || 
    url.includes('inflact')
  );
});

console.log(`Found ${valid.length} establishments with valid Instagram profile pictures`);

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000 
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        downloadImage(res.headers.location, filepath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const stream = fs.createWriteStream(filepath);
      res.pipe(stream);
      stream.on('finish', () => { stream.close(); resolve(true); });
      stream.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  const downloadDir = '/home/ubuntu/webdev-static-assets/ig-profiles';
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  let successCount = 0;
  let failCount = 0;
  const updates = [];

  for (let i = 0; i < valid.length; i++) {
    const item = valid[i];
    const estId = item.output.establishment_id;
    const igUser = item.output.instagram_username;
    const picUrl = item.output.profile_pic_url;
    
    const filename = `ig-${igUser}-${estId}.jpg`;
    const filepath = path.join(downloadDir, filename);
    
    try {
      await downloadImage(picUrl, filepath);
      
      // Check file size - skip if too small (likely error page)
      const stats = fs.statSync(filepath);
      if (stats.size < 1000) {
        console.log(`[${i+1}/${valid.length}] SKIP (too small): ${igUser} (${stats.size} bytes)`);
        fs.unlinkSync(filepath);
        failCount++;
        continue;
      }
      
      updates.push({ estId, igUser, filepath, filename });
      successCount++;
      console.log(`[${i+1}/${valid.length}] Downloaded: ${igUser} (${(stats.size/1024).toFixed(1)}KB)`);
    } catch (e) {
      console.log(`[${i+1}/${valid.length}] FAIL: ${igUser} - ${e.message}`);
      failCount++;
    }
  }

  console.log(`\n=== Download Summary ===`);
  console.log(`Downloaded: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`\nNow uploading and updating database...`);

  // Upload files using manus-upload-file --webdev and update DB
  const { execSync } = require('child_process');
  let dbUpdated = 0;

  for (let i = 0; i < updates.length; i++) {
    const { estId, igUser, filepath } = updates[i];
    try {
      // Upload to webdev storage
      const output = execSync(`manus-upload-file --webdev "${filepath}"`, { encoding: 'utf8', timeout: 30000 });
      const urlMatch = output.match(/(\/manus-storage\/[^\s]+)/);
      if (!urlMatch) {
        console.log(`[${i+1}/${updates.length}] Upload failed for ${igUser}: no URL in output`);
        continue;
      }
      const storageUrl = urlMatch[1];
      
      // Update database
      await connection.execute(
        'UPDATE establishments SET image = ? WHERE id = ?',
        [storageUrl, estId]
      );
      dbUpdated++;
      console.log(`[${i+1}/${updates.length}] Updated DB: ${igUser} (ID: ${estId}) -> ${storageUrl}`);
    } catch (e) {
      console.log(`[${i+1}/${updates.length}] Error: ${igUser} - ${e.message?.substring(0, 100)}`);
    }
  }

  console.log(`\n=== Final Summary ===`);
  console.log(`Database records updated: ${dbUpdated} / ${updates.length}`);
  
  await connection.end();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
