// Turso (LibSQL) Cloud Client with Local JSON Fallback
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_DB_FILE = path.join(__dirname, '..', 'data_store.json');

function ensureLocalStore() {
  if (!fs.existsSync(LOCAL_DB_FILE)) {
    const initialData = {
      entries: [
        {
          id: 'compulsory',
          word: 'Compulsory',
          pos: 'Adjective',
          azMeaning: 'Məcburi',
          definition: 'Required by law or a rule; obligatory.',
          toneContext: 'Formal / Academic',
          synonyms: ['Forced', 'Mandatory', 'Obligatory', 'Compulsive'],
          antonyms: ['Optional'],
          notes: '',
          createdAt: new Date().toISOString()
        },
        {
          id: 'forced',
          word: 'Forced',
          pos: 'Adjective',
          azMeaning: 'Məcburi',
          definition: 'Done or produced with effort or against one\'s will.',
          toneContext: 'General Spoken',
          synonyms: ['Compulsory', 'Mandatory', 'Obligatory', 'Compulsive'],
          antonyms: ['Voluntary'],
          notes: '',
          createdAt: new Date().toISOString()
        }
      ]
    };
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

export class TursoClient {
  isTursoConfigured() {
    const url = (process.env.TURSO_DATABASE_URL || '').toLowerCase();
    const token = (process.env.TURSO_AUTH_TOKEN || '').toLowerCase();

    if (!url || !token) return false;
    if (url.includes('your-') || url.includes('your_') || url.includes('example')) return false;
    if (token.includes('your-') || token.includes('your_') || token.includes('example')) return false;
    
    return true;
  }

  getHttpUrl() {
    const urlStr = process.env.TURSO_DATABASE_URL || '';
    if (!urlStr) return null;
    let url = urlStr.trim();
    if (url.startsWith('libsql://')) {
      url = 'https://' + url.substring(9);
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    if (!url.endsWith('/v2/pipeline')) {
      url = url.replace(/\/+$/, '') + '/v2/pipeline';
    }
    return url;
  }

  async executeSql(sql, args = []) {
    const url = this.getHttpUrl();
    const token = process.env.TURSO_AUTH_TOKEN || '';
    if (!url || !token) {
      throw new Error('Turso credentials missing');
    }

    const payload = {
      requests: [
        {
          type: 'execute',
          stmt: {
            sql,
            args: args.map(arg => {
              if (arg === null || arg === undefined) return { type: 'null' };
              if (typeof arg === 'number') return { type: 'integer', value: String(arg) };
              return { type: 'text', value: String(arg) };
            })
          }
        },
        { type: 'close' }
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Turso HTTP Error (${response.status}): ${errText}`);
    }

    const resJson = await response.json();
    const resultReq = resJson.results?.[0];
    if (resultReq?.type === 'error') {
      throw new Error(resultReq.error?.message || 'Turso SQL execution error');
    }

    const cols = resultReq?.response?.result?.cols?.map(c => c.name) || [];
    const rows = resultReq?.response?.result?.rows || [];

    return rows.map(row => {
      const obj = {};
      row.forEach((cell, idx) => {
        obj[cols[idx]] = cell.value !== undefined ? cell.value : null;
      });
      return obj;
    });
  }

  async initTables() {
    if (!this.isTursoConfigured()) return false;
    try {
      await this.executeSql(`
        CREATE TABLE IF NOT EXISTS entries (
          id TEXT PRIMARY KEY,
          word TEXT NOT NULL UNIQUE,
          pos TEXT NOT NULL DEFAULT 'Idiom',
          az_meaning TEXT NOT NULL,
          definition TEXT,
          tone_context TEXT,
          synonyms TEXT,
          antonyms TEXT,
          notes TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );
      `);
      return true;
    } catch (err) {
      console.error('Failed to init Turso tables:', err.message);
      return false;
    }
  }

  async getEntries() {
    if (this.isTursoConfigured()) {
      try {
        await this.initTables();
        const rows = await this.executeSql('SELECT * FROM entries ORDER BY created_at DESC');
        return rows.map(r => ({
          id: r.id,
          word: r.word,
          pos: r.pos,
          azMeaning: r.az_meaning,
          definition: r.definition || '',
          toneContext: r.tone_context || '',
          synonyms: r.synonyms ? JSON.parse(r.synonyms) : [],
          antonyms: r.antonyms ? JSON.parse(r.antonyms) : [],
          notes: r.notes || '',
          createdAt: r.created_at
        }));
      } catch (err) {
        console.warn('Turso fetch failed, using local store:', err.message);
      }
    }

    ensureLocalStore();
    const data = JSON.parse(fs.readFileSync(LOCAL_DB_FILE, 'utf-8'));
    return data.entries || [];
  }

  async saveEntry(entry) {
    // 1. Save locally
    ensureLocalStore();
    const data = JSON.parse(fs.readFileSync(LOCAL_DB_FILE, 'utf-8'));
    const idx = data.entries.findIndex(e => e.id === entry.id || e.word.toLowerCase() === entry.word.toLowerCase());
    
    if (idx >= 0) {
      data.entries[idx] = { ...data.entries[idx], ...entry };
    } else {
      data.entries.unshift(entry);
    }
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');

    // 2. Save to Turso if configured
    if (this.isTursoConfigured()) {
      try {
        await this.initTables();
        const sql = `
          INSERT INTO entries (id, word, pos, az_meaning, definition, tone_context, synonyms, antonyms, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            word=excluded.word,
            pos=excluded.pos,
            az_meaning=excluded.az_meaning,
            definition=excluded.definition,
            tone_context=excluded.tone_context,
            synonyms=excluded.synonyms,
            antonyms=excluded.antonyms,
            notes=excluded.notes;
        `;
        await this.executeSql(sql, [
          entry.id,
          entry.word,
          entry.pos,
          entry.azMeaning,
          entry.definition || '',
          entry.toneContext || '',
          JSON.stringify(entry.synonyms || []),
          JSON.stringify(entry.antonyms || []),
          entry.notes || '',
          entry.createdAt || new Date().toISOString()
        ]);
      } catch (err) {
        console.error('Failed to sync entry to Turso:', err.message);
      }
    }
    return entry;
  }

  async deleteEntry(id) {
    // 1. Delete locally
    ensureLocalStore();
    const data = JSON.parse(fs.readFileSync(LOCAL_DB_FILE, 'utf-8'));
    data.entries = data.entries.filter(e => e.id !== id);
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');

    // 2. Delete from Turso if configured
    if (this.isTursoConfigured()) {
      try {
        await this.executeSql('DELETE FROM entries WHERE id = ?', [id]);
      } catch (err) {
        console.error('Failed to delete entry from Turso:', err.message);
      }
    }
  }
}
