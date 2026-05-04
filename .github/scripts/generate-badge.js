const https = require('https');
const fs = require('fs');
const { makeBadge } = require('badge-maker');

const OWNER = 'Cynacedia';
const REPO = 'VRC-Event-Creator';

// Fetch all releases from GitHub API
function fetchReleases() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/releases`,
      headers: {
        'User-Agent': 'Badge-Generator',
        'Authorization': `token ${process.env.GITHUB_TOKEN}`
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  const releases = await fetchReleases();

  // Count only .exe and .AppImage downloads from v1.0.0 and later releases.
  // Pre-1.0 (v0.9.x) downloads are excluded — they're noise from the early
  // dev period and don't reflect interest in the released app.
  let totalDownloads = 0;

  for (const release of releases) {
    if (!/^v[1-9]/.test(release.tag_name)) continue;
    for (const asset of release.assets || []) {
      if (asset.name.endsWith('.exe') || asset.name.endsWith('.AppImage')) {
        totalDownloads += asset.download_count;
      }
    }
  }

  // Generate badge SVG
  const badge = makeBadge({
    label: 'downloads',
    message: totalDownloads.toLocaleString(),
    color: 'blue',
    style: 'plastic'
  });

  // Save to file
  fs.writeFileSync('downloads-badge.svg', badge);
  console.log(`Badge generated: ${totalDownloads} downloads`);
}

main().catch(console.error);
