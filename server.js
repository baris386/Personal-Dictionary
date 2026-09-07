// Node 20 Native HTTP Server & Express API for Personal Dictionary
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');
const ENV_FILE = path.join(__dirname, '.env');

// Auto-load .env environment variables if present
if (fs.existsSync(ENV_FILE)) {
  const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...vals] = trimmed.split('=');
      if (key && vals.length > 0) {
        process.env[key.trim()] = vals.join('=').trim();
      }
    }
  });
}

// Helper: Capitalize first letter of a string (e.g., "compulsory" -> "Compulsory")
function capitalizeFirstLetter(str) {
  if (!str) return '';
  const trimmed = String(str).trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

// Import database client
const { TursoClient } = await import('./lib/turso.js');
const db = new TursoClient();

// Helper: Sync bidirectional synonyms and merge shared antonyms across synonym groups
async function syncSynonymsAndAntonymsGroup(targetEntry) {
  const entries = await db.getEntries();
  
  // Create a map of normalized word -> entry for easy lookup
  const entryMap = new Map();
  for (const e of entries) {
    const norm = e.word.toLowerCase().trim();
    if (norm) entryMap.set(norm, e);
  }

  // Ensure targetEntry is in map
  const targetNorm = targetEntry.word.toLowerCase().trim();
  entryMap.set(targetNorm, targetEntry);

  // Find all words connected in the same synonym group
  const connectedWordsLower = new Set();
  const queue = [targetNorm];
  connectedWordsLower.add(targetNorm);

  while (queue.length > 0) {
    const currNorm = queue.shift();
    const currEntry = entryMap.get(currNorm);

    if (currEntry && Array.isArray(currEntry.synonyms)) {
      for (const syn of currEntry.synonyms) {
        const synNorm = syn.toLowerCase().trim();
        if (synNorm && !connectedWordsLower.has(synNorm)) {
          connectedWordsLower.add(synNorm);
          queue.push(synNorm);
        }
      }
    }

    // Also check if any existing entry has currNorm in its synonyms list
    for (const [otherNorm, otherEntry] of entryMap.entries()) {
      if (!connectedWordsLower.has(otherNorm) && Array.isArray(otherEntry.synonyms)) {
        if (otherEntry.synonyms.some(s => s.toLowerCase().trim() === currNorm)) {
          connectedWordsLower.add(otherNorm);
          queue.push(otherNorm);
        }
      }
    }
  }

  // Collect all unique antonyms across all entries in the connected group
  const combinedAntonymsMap = new Map(); // lower -> Capitalized
  for (const wordNorm of connectedWordsLower) {
    const entry = entryMap.get(wordNorm);
    if (entry && Array.isArray(entry.antonyms)) {
      for (const ant of entry.antonyms) {
        const capAnt = capitalizeFirstLetter(ant);
        const lowerAnt = capAnt.toLowerCase();
        if (lowerAnt && !combinedAntonymsMap.has(lowerAnt)) {
          combinedAntonymsMap.set(lowerAnt, capAnt);
        }
      }
    }
  }

  const mergedAntonymsList = Array.from(combinedAntonymsMap.values());

  // Collect all capitalized words in the connected group
  const connectedWordsCapMap = new Map();
  for (const wordNorm of connectedWordsLower) {
    const entry = entryMap.get(wordNorm);
    const capWord = entry ? capitalizeFirstLetter(entry.word) : capitalizeFirstLetter(wordNorm);
    connectedWordsCapMap.set(wordNorm, capWord);
  }

  // Update each entry in the connected group
  for (const wordNorm of connectedWordsLower) {
    const entry = entryMap.get(wordNorm);
    if (!entry) continue;

    const selfCap = capitalizeFirstLetter(entry.word);
    
    // Synonyms for this entry = all connected words EXCEPT self
    const synonymsList = [];
    for (const [otherNorm, otherCap] of connectedWordsCapMap.entries()) {
      if (otherNorm !== wordNorm) {
        synonymsList.push(otherCap);
      }
    }

    entry.word = selfCap;
    entry.synonyms = synonymsList;
    
    // Merge antonyms
    const entryAntsMap = new Map();
    for (const a of (entry.antonyms || []).concat(mergedAntonymsList)) {
      const cap = capitalizeFirstLetter(a);
      if (cap) entryAntsMap.set(cap.toLowerCase(), cap);
    }
    entry.antonyms = Array.from(entryAntsMap.values());

    await db.saveEntry(entry);
  }
}

// MIME Types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const getJsonBody = () => new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });

  // --- API ENDPOINTS ---

  // GET /api/entries - Search dictionary entries
  if (pathname === '/api/entries' && method === 'GET') {
    try {
      const q = (parsedUrl.searchParams.get('q') || '').toLowerCase().trim();
      const posFilter = parsedUrl.searchParams.get('pos') || '';
      
      let entries = await db.getEntries();

      if (posFilter && posFilter.toLowerCase() !== 'all') {
        entries = entries.filter(e => e.pos.toLowerCase() === posFilter.toLowerCase());
      }

      if (q) {
        entries = entries.filter(entry => {
          const w = (entry.word || '').toLowerCase();
          const def = (entry.definition || '').toLowerCase();
          const az = (entry.azMeaning || '').toLowerCase();
          const entrySyns = (entry.synonyms || []).map(s => s.toLowerCase());

          return w.includes(q) || def.includes(q) || az.includes(q) || entrySyns.some(s => s.includes(q));
        });
      }

      res.writeHead(200, { 'Content-Type': MIME_TYPES['.json'] });
      res.end(JSON.stringify({ success: true, entries, total: entries.length }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': MIME_TYPES['.json'] });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // POST /api/entries - Add or update a word/idiom
  if (pathname === '/api/entries' && method === 'POST') {
    try {
      const body = await getJsonBody();
      if (!body.word || !body.azMeaning) {
        res.writeHead(400, { 'Content-Type': MIME_TYPES['.json'] });
        res.end(JSON.stringify({ success: false, error: 'Word and Azerbaijani meaning are required.' }));
        return;
      }

      const formattedWord = capitalizeFirstLetter(body.word);
      const id = body.id || formattedWord.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      const rawSyns = Array.isArray(body.synonyms) 
        ? body.synonyms 
        : (body.synonyms || '').split(',');

      const synonyms = rawSyns
        .map(s => capitalizeFirstLetter(s))
        .filter(Boolean);

      const rawAnts = Array.isArray(body.antonyms)
        ? body.antonyms
        : (body.antonyms || '').split(',');

      const antonyms = rawAnts
        .map(a => capitalizeFirstLetter(a))
        .filter(Boolean);

      const entry = {
        id,
        word: formattedWord,
        pos: body.pos || 'Idiom',
        azMeaning: capitalizeFirstLetter(body.azMeaning),
        definition: (body.definition || '').trim(),
        toneContext: (body.toneContext || '').trim(),
        synonyms,
        antonyms,
        notes: (body.notes || '').trim(),
        createdAt: body.createdAt || new Date().toISOString()
      };

      // Save primary entry first
      await db.saveEntry(entry);

      // Perform group synonym & antonym merge sync
      await syncSynonymsAndAntonymsGroup(entry);

      res.writeHead(200, { 'Content-Type': MIME_TYPES['.json'] });
      res.end(JSON.stringify({ success: true, entry }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': MIME_TYPES['.json'] });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // DELETE /api/entries/:id
  if (pathname.startsWith('/api/entries/') && method === 'DELETE') {
    try {
      const id = pathname.replace('/api/entries/', '');
      await db.deleteEntry(id);

      res.writeHead(200, { 'Content-Type': MIME_TYPES['.json'] });
      res.end(JSON.stringify({ success: true, deletedId: id }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': MIME_TYPES['.json'] });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // --- STATIC FILE SERVING ---
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(data);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`Personal English Dictionary Server running at http://localhost:${PORT}`);
  console.log(`Database Mode: ${db.isTursoConfigured() ? 'Live Turso Cloud DB' : 'Local JSON Store'}`);
  console.log(`====================================================`);
});
