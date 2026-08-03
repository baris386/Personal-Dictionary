// Client-side Application Logic for Personal Dictionary

document.addEventListener('DOMContentLoaded', () => {
  // State
  let synonymsList = [];
  let antonymsList = [];
  let modalSynonymsList = [];
  let modalAntonymsList = [];

  let currentPosFilter = 'all';
  let searchQuery = '';
  let allDatabaseEntries = [];

  // Helper: Capitalize first letter of a string (e.g., "compulsory" -> "Compulsory")
  function capitalizeFirstLetter(str) {
    if (!str) return '';
    const trimmed = String(str).trim();
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  // DOM Elements - Navigation & Search
  const navButtons = document.querySelectorAll('.nav-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  const filterPills = document.querySelectorAll('.filter-pill');
  const resultsCount = document.getElementById('results-count');
  const entriesGrid = document.getElementById('entries-grid');
  const toast = document.getElementById('toast');

  // Form Elements - Add Tab
  const addEntryForm = document.getElementById('add-entry-form');
  const wordInput = document.getElementById('word-input');
  const posSelect = document.getElementById('pos-select');
  const azMeaningInput = document.getElementById('az-meaning-input');
  const definitionInput = document.getElementById('definition-input');
  const notesInput = document.getElementById('notes-input');
  const fillPresetBtn = document.getElementById('fill-preset-btn');
  const synonymsTagBox = document.getElementById('synonyms-tag-box');
  const synonymTagInput = document.getElementById('synonym-tag-input');
  const synonymSuggestions = document.getElementById('synonym-suggestions');
  const antonymsTagBox = document.getElementById('antonyms-tag-box');
  const antonymTagInput = document.getElementById('antonym-tag-input');

  // Modal Elements - Edit Popup
  const editModal = document.getElementById('edit-modal');
  const closeEditModalBtn = document.getElementById('close-edit-modal-btn');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const editModalTitle = document.getElementById('edit-modal-title');
  const modalEditForm = document.getElementById('modal-edit-form');
  const modalEntryId = document.getElementById('modal-entry-id');
  const modalWordInput = document.getElementById('modal-word-input');
  const modalPosSelect = document.getElementById('modal-pos-select');
  const modalAzMeaningInput = document.getElementById('modal-az-meaning-input');
  const modalDefinitionInput = document.getElementById('modal-definition-input');
  const modalNotesInput = document.getElementById('modal-notes-input');
  const modalSynonymsTagBox = document.getElementById('modal-synonyms-tag-box');
  const modalSynonymTagInput = document.getElementById('modal-synonym-tag-input');
  const modalSynonymSuggestions = document.getElementById('modal-synonym-suggestions');
  const modalAntonymsTagBox = document.getElementById('modal-antonyms-tag-box');
  const modalAntonymTagInput = document.getElementById('modal-antonym-tag-input');

  // --- TAB NAVIGATION ---
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      navButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');

      if (targetTab === 'search-tab') loadEntries();
      if (targetTab === 'add-tab') fetchDatabaseWordsForAutocomplete();
    });
  });

  // --- TOAST NOTIFICATION ---
  function showToast(message) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }

  // --- FETCH ALL DATABASE WORDS FOR AUTOCOMPLETE ---
  async function fetchDatabaseWordsForAutocomplete() {
    try {
      const res = await fetch('/api/entries');
      const data = await res.json();
      if (data.success) {
        allDatabaseEntries = data.entries || [];
      }
    } catch (err) {
      console.error('Failed to load database words:', err);
    }
  }

  // --- SEARCH & FILTER LOGIC ---
  async function loadEntries() {
    try {
      resultsCount.textContent = 'Searching database...';
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (currentPosFilter && currentPosFilter !== 'all') params.append('pos', currentPosFilter);

      const res = await fetch(`/api/entries?${params.toString()}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      const entries = data.entries || [];
      allDatabaseEntries = entries;
      resultsCount.textContent = `Found ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`;

      renderEntriesGrid(entries);
    } catch (err) {
      resultsCount.textContent = 'Error loading entries';
      entriesGrid.innerHTML = `<div class="error-state">Failed to load entries: ${err.message}</div>`;
    }
  }

  function renderEntriesGrid(entries) {
    if (entries.length === 0) {
      entriesGrid.innerHTML = `
        <div class="empty-state glass-card" style="grid-column: 1 / -1; padding: 40px; text-align: center;">
          <h3>No Dictionary Entries Found</h3>
          <p style="color: var(--text-muted); margin-top: 8px;">Try refining your search query or add a new word/idiom.</p>
        </div>
      `;
      return;
    }

    entriesGrid.innerHTML = entries.map(entry => {
      const formattedWord = capitalizeFirstLetter(entry.word);

      const synChips = (entry.synonyms || []).map(s => {
        return `<span class="chip">${escapeHtml(capitalizeFirstLetter(s))}</span>`;
      }).join(' ') || '<span class="text-dim">None</span>';

      const antChips = (entry.antonyms || []).map(a => {
        return `<span class="chip">${escapeHtml(capitalizeFirstLetter(a))}</span>`;
      }).join(' ') || '<span class="text-dim">None</span>';

      const defHtml = entry.definition ? `<div class="card-definition">${escapeHtml(entry.definition)}</div>` : '';
      const notesQuote = entry.notes ? `<div class="notes-quote">${escapeHtml(entry.notes)}</div>` : '';

      return `
        <div class="entry-card glass-card" data-id="${entry.id}">
          <div>
            <div class="card-top">
              <h3 class="card-word">${escapeHtml(formattedWord)}</h3>
              <span class="pos-tag">${escapeHtml(entry.pos)}</span>
            </div>
            
            <div class="az-meaning">🌐 ${escapeHtml(capitalizeFirstLetter(entry.azMeaning))}</div>
            ${defHtml}

            <div class="card-section-title">Synonyms</div>
            <div class="synonyms-wrapper">${synChips}</div>

            <div class="card-section-title">Antonyms</div>
            <div class="antonyms-wrapper">${antChips}</div>

            ${notesQuote}
          </div>

          <div class="card-actions">
            <button class="edit-btn" data-id="${entry.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Edit
            </button>
            <button class="card-delete-btn" data-id="${entry.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Delete
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach event listeners for Edit and Delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const entryToEdit = allDatabaseEntries.find(e => e.id === id);
        if (entryToEdit) {
          openEditModal(entryToEdit);
        }
      });
    });

    document.querySelectorAll('.card-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const entryToDelete = allDatabaseEntries.find(e => e.id === id);
        const name = entryToDelete ? capitalizeFirstLetter(entryToDelete.word) : 'this entry';

        if (confirm(`Are you sure you want to delete "${name}"?`)) {
          await fetch(`/api/entries/${id}`, { method: 'DELETE' });
          showToast(`Deleted "${name}"`);
          loadEntries();
        }
      });
    });
  }

  // --- EDIT MODAL POPUP HANDLERS ---
  function openEditModal(entry) {
    modalEntryId.value = entry.id;
    modalWordInput.value = capitalizeFirstLetter(entry.word);
    modalPosSelect.value = entry.pos || 'Idiom';
    modalAzMeaningInput.value = capitalizeFirstLetter(entry.azMeaning);
    modalDefinitionInput.value = entry.definition || '';
    modalNotesInput.value = entry.notes || '';

    modalSynonymsList = Array.isArray(entry.synonyms) ? entry.synonyms.map(s => capitalizeFirstLetter(s)) : [];
    modalAntonymsList = Array.isArray(entry.antonyms) ? entry.antonyms.map(a => capitalizeFirstLetter(a)) : [];

    renderModalSynonymTags();
    renderModalAntonymTags();

    editModalTitle.textContent = `Edit Entry: ${capitalizeFirstLetter(entry.word)}`;
    editModal.classList.remove('hidden');
  }

  function closeEditModal() {
    editModal.classList.add('hidden');
  }

  closeEditModalBtn.addEventListener('click', closeEditModal);
  modalCancelBtn.addEventListener('click', closeEditModal);

  // Modal Synonym Tag Helpers
  function addModalSynonymTag(val) {
    const formattedVal = capitalizeFirstLetter(val);
    if (formattedVal && !modalSynonymsList.some(s => s.toLowerCase() === formattedVal.toLowerCase())) {
      modalSynonymsList.push(formattedVal);
      modalSynonymTagInput.value = '';
      modalSynonymSuggestions.classList.add('hidden');
      renderModalSynonymTags();
    }
  }

  function renderModalSynonymTags() {
    modalSynonymsTagBox.querySelectorAll('.editable-tag').forEach(t => t.remove());

    modalSynonymsList.forEach((tag, idx) => {
      const tagEl = document.createElement('span');
      tagEl.className = 'editable-tag';
      tagEl.innerHTML = `${escapeHtml(tag)} <span class="remove-tag" data-idx="${idx}">&times;</span>`;
      modalSynonymsTagBox.insertBefore(tagEl, modalSynonymTagInput);
    });

    modalSynonymsTagBox.querySelectorAll('.remove-tag').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        modalSynonymsList.splice(idx, 1);
        renderModalSynonymTags();
      });
    });
  }

  modalSynonymTagInput.addEventListener('input', () => {
    const query = modalSynonymTagInput.value.trim().toLowerCase();
    if (!query) {
      modalSynonymSuggestions.classList.add('hidden');
      return;
    }

    const matches = allDatabaseEntries.filter(e => 
      e.word.toLowerCase().includes(query) && !modalSynonymsList.some(s => s.toLowerCase() === e.word.toLowerCase())
    );

    if (matches.length === 0) {
      modalSynonymSuggestions.classList.add('hidden');
      return;
    }

    modalSynonymSuggestions.innerHTML = matches.map(m => `
      <div class="suggestion-item" data-word="${escapeHtml(capitalizeFirstLetter(m.word))}">
        <span>${escapeHtml(capitalizeFirstLetter(m.word))}</span>
        <span class="suggestion-pos">${escapeHtml(m.pos)}</span>
      </div>
    `).join('');

    modalSynonymSuggestions.classList.remove('hidden');

    modalSynonymSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        addModalSynonymTag(item.dataset.word);
      });
    });
  });

  modalSynonymTagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (modalSynonymTagInput.value.trim()) {
        addModalSynonymTag(modalSynonymTagInput.value);
      }
    }
  });

  // Modal Antonym Tag Helpers
  modalAntonymTagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = capitalizeFirstLetter(modalAntonymTagInput.value);
      if (val && !modalAntonymsList.some(a => a.toLowerCase() === val.toLowerCase())) {
        modalAntonymsList.push(val);
        modalAntonymTagInput.value = '';
        renderModalAntonymTags();
      }
    }
  });

  function renderModalAntonymTags() {
    modalAntonymsTagBox.querySelectorAll('.editable-tag').forEach(t => t.remove());

    modalAntonymsList.forEach((tag, idx) => {
      const tagEl = document.createElement('span');
      tagEl.className = 'editable-tag';
      tagEl.innerHTML = `${escapeHtml(tag)} <span class="remove-tag" data-idx="${idx}">&times;</span>`;
      modalAntonymsTagBox.insertBefore(tagEl, modalAntonymTagInput);
    });

    modalAntonymsTagBox.querySelectorAll('.remove-tag').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        modalAntonymsList.splice(idx, 1);
        renderModalAntonymTags();
      });
    });
  }

  // Modal Submit (Save Changes)
  modalEditForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const formattedWord = capitalizeFirstLetter(modalWordInput.value);

      const payload = {
        id: modalEntryId.value,
        word: formattedWord,
        pos: modalPosSelect.value,
        azMeaning: capitalizeFirstLetter(modalAzMeaningInput.value),
        definition: modalDefinitionInput.value.trim(),
        synonyms: modalSynonymsList.map(s => capitalizeFirstLetter(s)),
        antonyms: modalAntonymsList.map(a => capitalizeFirstLetter(a)),
        notes: modalNotesInput.value.trim()
      };

      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast(`Updated "${formattedWord}"!`);
      closeEditModal();
      loadEntries();
      fetchDatabaseWordsForAutocomplete();
    } catch (err) {
      alert(`Error updating entry: ${err.message}`);
    }
  });

  // --- SEARCH INPUT LISTENERS ---
  let searchDebounce = null;
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    if (searchQuery) clearSearchBtn.classList.remove('hidden');
    else clearSearchBtn.classList.add('hidden');

    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => loadEntries(), 250);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    loadEntries();
  });

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentPosFilter = pill.dataset.pos;
      loadEntries();
    });
  });

  // --- ADD FORM TAG HANDLER ---
  function addSynonymTag(val) {
    const formattedVal = capitalizeFirstLetter(val);
    if (formattedVal && !synonymsList.some(s => s.toLowerCase() === formattedVal.toLowerCase())) {
      synonymsList.push(formattedVal);
      synonymTagInput.value = '';
      synonymSuggestions.classList.add('hidden');
      renderSynonymTags();
    }
  }

  function renderSynonymTags() {
    synonymsTagBox.querySelectorAll('.editable-tag').forEach(t => t.remove());

    synonymsList.forEach((tag, idx) => {
      const tagEl = document.createElement('span');
      tagEl.className = 'editable-tag';
      tagEl.innerHTML = `${escapeHtml(tag)} <span class="remove-tag" data-idx="${idx}">&times;</span>`;
      synonymsTagBox.insertBefore(tagEl, synonymTagInput);
    });

    synonymsTagBox.querySelectorAll('.remove-tag').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        synonymsList.splice(idx, 1);
        renderSynonymTags();
      });
    });
  }

  synonymTagInput.addEventListener('input', () => {
    const query = synonymTagInput.value.trim().toLowerCase();
    if (!query) {
      synonymSuggestions.classList.add('hidden');
      return;
    }

    const matches = allDatabaseEntries.filter(e => 
      e.word.toLowerCase().includes(query) && !synonymsList.some(s => s.toLowerCase() === e.word.toLowerCase())
    );

    if (matches.length === 0) {
      synonymSuggestions.classList.add('hidden');
      return;
    }

    synonymSuggestions.innerHTML = matches.map(m => `
      <div class="suggestion-item" data-word="${escapeHtml(capitalizeFirstLetter(m.word))}">
        <span>${escapeHtml(capitalizeFirstLetter(m.word))}</span>
        <span class="suggestion-pos">${escapeHtml(m.pos)}</span>
      </div>
    `).join('');

    synonymSuggestions.classList.remove('hidden');

    synonymSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        addSynonymTag(item.dataset.word);
      });
    });
  });

  synonymTagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (synonymTagInput.value.trim()) {
        addSynonymTag(synonymTagInput.value);
      }
    }
  });

  document.addEventListener('click', (e) => {
    if (!synonymsTagBox.contains(e.target) && !synonymSuggestions.contains(e.target)) {
      synonymSuggestions.classList.add('hidden');
    }
    if (!modalSynonymsTagBox.contains(e.target) && !modalSynonymSuggestions.contains(e.target)) {
      modalSynonymSuggestions.classList.add('hidden');
    }
  });

  // Antonym Tag Handler
  antonymTagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = capitalizeFirstLetter(antonymTagInput.value);
      if (val && !antonymsList.some(a => a.toLowerCase() === val.toLowerCase())) {
        antonymsList.push(val);
        antonymTagInput.value = '';
        renderAntonymTags();
      }
    }
  });

  function renderAntonymTags() {
    antonymsTagBox.querySelectorAll('.editable-tag').forEach(t => t.remove());

    antonymsList.forEach((tag, idx) => {
      const tagEl = document.createElement('span');
      tagEl.className = 'editable-tag';
      tagEl.innerHTML = `${escapeHtml(tag)} <span class="remove-tag" data-idx="${idx}">&times;</span>`;
      antonymsTagBox.insertBefore(tagEl, antonymTagInput);
    });

    antonymsTagBox.querySelectorAll('.remove-tag').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        antonymsList.splice(idx, 1);
        renderAntonymTags();
      });
    });
  }

  // Fill Preset Sample Button
  fillPresetBtn.addEventListener('click', () => {
    wordInput.value = 'Furious';
    posSelect.value = 'Adjective';
    azMeaningInput.value = 'Extremely angry, enraged';
    definitionInput.value = 'Extremely angry; full of fury.';
    notesInput.value = 'Stronger than angry.';
    
    synonymsList = ['Angry', 'Mad'];
    antonymsList = ['Calm', 'Peaceful'];

    renderSynonymTags();
    renderAntonymTags();
  });

  // Add Entry Form Submit
  addEntryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const formattedWord = capitalizeFirstLetter(wordInput.value);

      const payload = {
        word: formattedWord,
        pos: posSelect.value,
        azMeaning: capitalizeFirstLetter(azMeaningInput.value),
        definition: definitionInput.value.trim(),
        synonyms: synonymsList.map(s => capitalizeFirstLetter(s)),
        antonyms: antonymsList.map(a => capitalizeFirstLetter(a)),
        notes: notesInput.value.trim()
      };

      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast(`Added "${formattedWord}"!`);

      // Reset form
      addEntryForm.reset();
      synonymsList = [];
      antonymsList = [];
      renderSynonymTags();
      renderAntonymTags();

      // Refresh DB autocomplete list & navigate to search
      await fetchDatabaseWordsForAutocomplete();
      document.querySelector('[data-tab="search-tab"]').click();
    } catch (err) {
      alert(`Error saving entry: ${err.message}`);
    }
  });

  // Helper
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initial load
  loadEntries();
  fetchDatabaseWordsForAutocomplete();
});
