# 📚 Personal English Vocabulary

A modern, high-performance web application designed to help language learners curate, organize, and explore their personal vocabulary, idioms, and expressions. Built with native JavaScript, HTML5/CSS3 glassmorphism design system, and powered by **Turso (LibSQL) Cloud DB** with automated local JSON fallback storage.

---

## ✨ Features

- 🔍 **Real-Time Instant Search**: Filter entries by word, English definition, native translation, or synonyms with part-of-speech quick filters.
- 🔗 **Automatic Bidirectional Synonym Linking**: Linking *Word A* to *Word B* automatically updates *Word B* with *Word A*.
- 🔄 **Smart Shared Antonyms Sync**: Words connected in a synonym group automatically aggregate and share unique antonyms across all entries in the cluster.
- 🔤 **Automatic Capitalization**: Words, translations, synonyms, and antonyms are automatically formatted with first-letter uppercase regardless of input casing.
- ✏️ **Interactive Inline Edit Modal**: Click **Edit** on any word card to instantly edit entries in an interactive popup without leaving your search view.
- ☁️ **Turso Cloud DB & Fallback**: Native Turso HTTP pipeline Integration with zero-config local `data_store.json` fallback mode.

---

## 🛠️ Technology Stack

- **Backend**: Node.js Native HTTP Server (ES Modules)
- **Database**: Turso (LibSQL Cloud SQLite) & Local JSON fallback engine
- **Frontend**: Vanilla HTML5, Vanilla CSS3 (Custom CSS Design Tokens, Cream & Slate Glassmorphism), Native JS (ES6+)

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ installed

### 2. Installation & Running Locally

```bash
# Clone the repository
git clone https://github.com/your-username/personal-dictionary.git
cd personal-dictionary

# Install dependencies (optional / minimal)
npm install

# Start local server
npm start
```

Open your browser and navigate to **`http://localhost:3000`**.

---

## ☁️ Turso Database Integration Setup

To connect to your live cloud database on Turso:

1. Create a database on [Turso](https://turso.tech):
   ```bash
   turso db create dictionary-db
   ```

2. Get your Database URL and Authentication Token:
   ```bash
   turso db show dictionary-db --url
   turso db tokens create dictionary-db
   ```

3. Create a `.env` file in the project root:
   ```env
   TURSO_DATABASE_URL=libsql://your-database-name.turso.io
   TURSO_AUTH_TOKEN=your-turso-auth-token
   PORT=3000
   ```

4. Initialize database schema:
   ```bash
   turso db shell dictionary-db < schema.sql
   ```

If `.env` is unconfigured or missing, the application automatically uses the local `data_store.json` engine!

---

## 📝 License

Distributed under the MIT License. Feel free to use and adapt for your personal learning workflow!
