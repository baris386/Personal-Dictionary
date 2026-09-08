// Client-side Application Logic for Personal Lexicon & Skeuomorphic Dictionary

document.addEventListener('DOMContentLoaded', () => {
  // State
  let synonymsList = [];
  let antonymsList = [];
  let modalSynonymsList = [];
  let modalAntonymsList = [];

  let currentPosFilter = 'all';
  let currentLetterFilter = 'all';
  let currentSort = 'az';
  let currentViewMode = localStorage.getItem('dictionary_view_mode') || 'grid'; // 'grid' or 'list'
  let searchQuery = '';
  let allDatabaseEntries = [];
  let displayedEntries = [];

  // Flashcards State
  let currentFlashcardIndex = 0;
  let flashcardEntries = [];

  // Saved Words (Scratchpad) State
  let savedWordsList = [];
  let savedSearchQuery = '';

  // Helper: Capitalize first letter of a string (e.g., "compulsory" -> "Compulsory")
  function capitalizeFirstLetter(str) {
    if (!str) return '';
    const trimmed = String(str).trim();
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  // --- AUDIO TEXT-TO-SPEECH HELPER ---
  function speakWord(wordText) {
    if (!('speechSynthesis' in window)) {
      showToast('Audio speech synthesis not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(wordText);
    utterance.lang = 'en-US';
    utterance.rate = 0.92; // Slightly deliberate pace for clear pronunciation
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  // DOM Elements - Navigation & Search
  const navButtons = document.querySelectorAll('.nav-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  const filterPills = document.querySelectorAll('.filter-pill');
  const alphabetTabsContainer = document.getElementById('alphabet-tabs');
  const sortSelect = document.getElementById('sort-select');
  const resultsCount = document.getElementById('results-count');
  const entriesGrid = document.getElementById('entries-grid');
  const entriesList = document.getElementById('entries-list');
  const viewGridBtn = document.getElementById('view-grid-btn');
  const viewListBtn = document.getElementById('view-list-btn');
  const toast = document.getElementById('toast');

  // Saved Words (Scratchpad) Elements
  const savedWordsCountBadge = document.getElementById('saved-words-count-badge');
  const quickSaveForm = document.getElementById('quick-save-form');
  const quickWordInput = document.getElementById('quick-word-input');
  const quickNotesInput = document.getElementById('quick-notes-input');
  const batchSaveForm = document.getElementById('batch-save-form');
  const batchWordsInput = document.getElementById('batch-words-input');
  const batchCancelBtn = document.getElementById('batch-cancel-btn');
  const modeSingleBtn = document.getElementById('mode-single-btn');
  const modeBatchBtn = document.getElementById('mode-batch-btn');
  const savedWordsStatus = document.getElementById('saved-words-status');
  const savedSearchInput = document.getElementById('saved-search-input');
  const clearSavedSearchBtn = document.getElementById('clear-saved-search');
  const savedWordsGrid = document.getElementById('saved-words-grid');
  const inscribeOriginBanner = document.getElementById('inscribe-origin-banner');
  const inscribeOriginWord = document.getElementById('inscribe-origin-word');
  const inscribeOriginId = document.getElementById('inscribe-origin-id');
  const inscribeOriginDismissBtn = document.getElementById('inscribe-origin-dismiss-btn');
  const addTabNavBtn = document.getElementById('add-tab-nav-btn');

  // Word of the Day Elements
  const wotdWidget = document.getElementById('wotd-widget');
  const wotdWord = document.getElementById('wotd-word');
  const wotdPos = document.getElementById('wotd-pos');
  const wotdMeaning = document.getElementById('wotd-meaning');
  const wotdDefinition = document.getElementById('wotd-definition');
  const wotdSynonymsList = document.getElementById('wotd-synonyms-list');
  const wotdAudioBtn = document.getElementById('wotd-audio-btn');
  const wotdRefreshBtn = document.getElementById('wotd-refresh-btn');

  // Flashcards Study Elements
  const openFlashcardsBtn = document.getElementById('open-flashcards-btn');
  const flashcardsModal = document.getElementById('flashcards-modal');
  const closeFlashcardsBtn = document.getElementById('close-flashcards-btn');
  const flashcard3d = document.getElementById('flashcard-3d');
  const fcFrontWord = document.getElementById('fc-front-word');
  const fcFrontPos = document.getElementById('fc-front-pos');
  const fcFrontAudio = document.getElementById('fc-front-audio');
  const fcBackMeaning = document.getElementById('fc-back-meaning');
  const fcBackDef = document.getElementById('fc-back-def');
  const fcBackPos = document.getElementById('fc-back-pos');
  const fcBackSynonyms = document.getElementById('fc-back-synonyms');
  const fcBackNotes = document.getElementById('fc-back-notes');
  const fcBackSynSection = document.getElementById('fc-back-syn-section');
  const fcCounter = document.getElementById('fc-counter');
  const fcPrevBtn = document.getElementById('fc-prev-btn');
  const fcNextBtn = document.getElementById('fc-next-btn');
  const fcFlipBtn = document.getElementById('fc-flip-btn');

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

  // --- INITIALIZE A–Z THUMB TABS RIBBON ---
  function initAlphabetTabs() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const tabsHtml = [
      `<button class="alpha-tab active" data-letter="all">ALL</button>`,
      ...alphabet.map(letter => `<button class="alpha-tab" data-letter="${letter}">${letter}</button>`)
    ].join('');
    alphabetTabsContainer.innerHTML = tabsHtml;

    alphabetTabsContainer.querySelectorAll('.alpha-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        alphabetTabsContainer.querySelectorAll('.alpha-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentLetterFilter = btn.dataset.letter;
        applyFiltersAndRender();
      });
    });
  }

  // --- TAB NAVIGATION ---
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      navButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');

      if (targetTab === 'search-tab') loadEntries();
      if (targetTab === 'saved-tab') loadSavedWords();
      if (targetTab === 'add-tab') fetchDatabaseWordsForAutocomplete();
    });
  });

  // --- TOAST NOTIFICATION ---
  function showToast(message) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3200);
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

  // --- VIEW MODE SWITCHER (GRID vs LIST) ---
  function setViewMode(mode) {
    currentViewMode = mode;
    localStorage.setItem('dictionary_view_mode', mode);

    if (mode === 'list') {
      viewListBtn.classList.add('active');
      viewGridBtn.classList.remove('active');
      entriesGrid.classList.add('hidden');
      entriesList.classList.remove('hidden');
    } else {
      viewGridBtn.classList.add('active');
      viewListBtn.classList.remove('active');
      entriesList.classList.add('hidden');
      entriesGrid.classList.remove('hidden');
    }

    renderCurrentView();
  }

  viewGridBtn.addEventListener('click', () => setViewMode('grid'));
  viewListBtn.addEventListener('click', () => setViewMode('list'));

  // --- SORT & FILTER PROCESSING ---
  function applyFiltersAndRender() {
    let filtered = [...allDatabaseEntries];

    // Search query filter (client-side backup & instant response)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e => {
        const wordMatch = (e.word || '').toLowerCase().includes(q);
        const azMatch = (e.azMeaning || '').toLowerCase().includes(q);
        const defMatch = (e.definition || '').toLowerCase().includes(q);
        const notesMatch = (e.notes || '').toLowerCase().includes(q);
        const synMatch = Array.isArray(e.synonyms) && e.synonyms.some(s => s.toLowerCase().includes(q));
        const antMatch = Array.isArray(e.antonyms) && e.antonyms.some(a => a.toLowerCase().includes(q));
        return wordMatch || azMatch || defMatch || notesMatch || synMatch || antMatch;
      });
    }

    // POS filter
    if (currentPosFilter && currentPosFilter !== 'all') {
      filtered = filtered.filter(e => (e.pos || '').toLowerCase() === currentPosFilter.toLowerCase());
    }

    // Alphabet letter filter
    if (currentLetterFilter && currentLetterFilter !== 'all') {
      filtered = filtered.filter(e => (e.word || '').toUpperCase().startsWith(currentLetterFilter));
    }

    // Sorting
    if (currentSort === 'az') {
      filtered.sort((a, b) => (a.word || '').localeCompare(b.word || ''));
    } else if (currentSort === 'za') {
      filtered.sort((a, b) => (b.word || '').localeCompare(a.word || ''));
    } else if (currentSort === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (currentSort === 'pos') {
      filtered.sort((a, b) => (a.pos || '').localeCompare(b.pos || '') || (a.word || '').localeCompare(b.word || ''));
    }

    displayedEntries = filtered;
    resultsCount.textContent = `Archived ${filtered.length} ${filtered.length === 1 ? 'entry' : 'entries'}`;

    renderCurrentView();
  }

  function renderCurrentView() {
    if (currentViewMode === 'list') {
      renderEntriesList(displayedEntries);
    } else {
      renderEntriesGrid(displayedEntries);
    }
  }

  // --- SEARCH & DATABASE LOAD ---
  async function loadEntries() {
    try {
      resultsCount.textContent = 'Consulting lexicon archive...';
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (currentPosFilter && currentPosFilter !== 'all') params.append('pos', currentPosFilter);

      const res = await fetch(`/api/entries?${params.toString()}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      allDatabaseEntries = data.entries || [];
      
      // Update Word of the Day on initial load
      if (allDatabaseEntries.length > 0 && (!wotdWord.dataset.initialized)) {
        updateWordOfTheDay();
        wotdWord.dataset.initialized = 'true';
      }

      applyFiltersAndRender();
    } catch (err) {
      resultsCount.textContent = 'Error accessing archive';
      entriesGrid.innerHTML = `<div class="error-state empty-state"><h3>Archive Access Failed</h3><p>${err.message}</p></div>`;
      entriesList.innerHTML = `<div class="error-state empty-state"><h3>Archive Access Failed</h3><p>${err.message}</p></div>`;
    }
  }

  // =========================================================================
  // 📖 1. RENDER GRID CARDS VIEW
  // =========================================================================
  function renderEntriesGrid(entries) {
    if (entries.length === 0) {
      entriesGrid.innerHTML = `
        <div class="empty-state parchment-card">
          <h3>No Lexicon Entries Found</h3>
          <p>Try refining your search query, clearing filters, or inscribe a new word.</p>
        </div>
      `;
      return;
    }

    entriesGrid.innerHTML = entries.map(entry => {
      const formattedWord = capitalizeFirstLetter(entry.word);

      const synChips = (entry.synonyms || []).map(s => {
        return `<span class="chip">${escapeHtml(capitalizeFirstLetter(s))}</span>`;
      }).join(' ') || '<span class="chip" style="opacity:0.6;font-style:italic;">None</span>';

      const antChips = (entry.antonyms || []).map(a => {
        return `<span class="chip chip-antonym">${escapeHtml(capitalizeFirstLetter(a))}</span>`;
      }).join(' ') || '<span class="chip chip-antonym" style="opacity:0.6;font-style:italic;">None</span>';

      const defHtml = entry.definition ? `<div class="card-definition">${escapeHtml(entry.definition)}</div>` : '';
      const notesQuote = entry.notes ? `<div class="notes-quote">📜 ${escapeHtml(entry.notes)}</div>` : '';

      return `
        <div class="entry-card parchment-card" data-id="${entry.id}">
          <div class="stitched-border"></div>
          <div>
            <div class="card-top">
              <div class="card-word-title">
                <h3 class="card-word">${escapeHtml(formattedWord)}</h3>
                <button class="skeuo-audio-btn play-audio-btn" data-word="${escapeHtml(formattedWord)}" title="Listen to pronunciation">🔊</button>
              </div>
              <span class="pos-stamp">${escapeHtml(entry.pos || 'Word')}</span>
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
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Edit
            </button>
            <button class="card-delete-btn" data-id="${entry.id}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Delete
            </button>
          </div>
        </div>
      `;
    }).join('');

    attachCardEventListeners(entriesGrid);
  }

  // =========================================================================
  // 📑 2. RENDER LEDGER LIST VIEW
  // =========================================================================
  function renderEntriesList(entries) {
    if (entries.length === 0) {
      entriesList.innerHTML = `
        <div class="empty-state parchment-card">
          <h3>No Lexicon Entries Found in Ledger</h3>
          <p>Try refining your search query, clearing filters, or inscribe a new word.</p>
        </div>
      `;
      return;
    }

    const rowsHtml = entries.map(entry => {
      const formattedWord = capitalizeFirstLetter(entry.word);
      const synCount = (entry.synonyms || []).length;
      const synSample = (entry.synonyms || []).slice(0, 3).map(s => `<span class="chip">${escapeHtml(capitalizeFirstLetter(s))}</span>`).join(' ');
      const extraSyn = synCount > 3 ? `<span class="chip" style="font-weight:700;">+${synCount - 3}</span>` : '';

      const defSnippet = entry.definition ? escapeHtml(entry.definition) : '<span style="color:var(--ink-muted);font-style:italic;">No definition recorded</span>';

      const antChips = (entry.antonyms || []).map(a => `<span class="chip chip-antonym">${escapeHtml(capitalizeFirstLetter(a))}</span>`).join(' ') || '<span style="color:var(--ink-muted);font-style:italic;">None</span>';
      const allSynChips = (entry.synonyms || []).map(s => `<span class="chip">${escapeHtml(capitalizeFirstLetter(s))}</span>`).join(' ') || '<span style="color:var(--ink-muted);font-style:italic;">None</span>';

      return `
        <div class="ledger-item-wrapper" data-id="${entry.id}">
          <div class="ledger-row">
            <!-- Col 1: Word, Audio, Native Meaning & POS -->
            <div class="ledger-col-main">
              <div class="ledger-word-line">
                <span class="ledger-word">${escapeHtml(formattedWord)}</span>
                <button class="skeuo-audio-btn play-audio-btn" data-word="${escapeHtml(formattedWord)}" title="Pronounce">🔊</button>
                <span class="pos-stamp">${escapeHtml(entry.pos || 'Word')}</span>
              </div>
              <div class="ledger-az-meaning">🌐 ${escapeHtml(capitalizeFirstLetter(entry.azMeaning))}</div>
            </div>

            <!-- Col 2: Definition Snippet -->
            <div class="ledger-col-def">
              <div>${defSnippet}</div>
            </div>

            <!-- Col 3: Synonyms Tags -->
            <div class="ledger-col-tags">
              ${synSample} ${extraSyn}
            </div>

            <!-- Col 4: Row Details & Actions -->
            <div class="ledger-col-actions">
              <button class="ledger-expand-btn toggle-details-btn" data-id="${entry.id}" title="Toggle full notes and connections">
                📜 Details ▾
              </button>
              <button class="edit-btn" data-id="${entry.id}">Edit</button>
              <button class="card-delete-btn" data-id="${entry.id}">Del</button>
            </div>
          </div>

          <!-- Expandable Detail Drawer -->
          <div class="ledger-row-details" id="details-${entry.id}">
            <div class="ledger-detail-grid">
              <div>
                <div class="card-section-title">All Synonyms</div>
                <div class="chips-row">${allSynChips}</div>
              </div>
              <div>
                <div class="card-section-title">Antonyms</div>
                <div class="chips-row">${antChips}</div>
              </div>
            </div>
            ${entry.notes ? `<div class="notes-quote" style="margin-top:10px;margin-bottom:0;">📜 ${escapeHtml(entry.notes)}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    entriesList.innerHTML = `<div class="ledger-table-card">${rowsHtml}</div>`;

    attachCardEventListeners(entriesList);

    // Expandable Drawer Toggle
    entriesList.querySelectorAll('.toggle-details-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const detailsEl = document.getElementById(`details-${id}`);
        if (detailsEl) {
          const isExpanded = detailsEl.classList.toggle('expanded');
          btn.innerHTML = isExpanded ? '📜 Hide ▴' : '📜 Details ▾';
        }
      });
    });
  }

  // --- ATTACH SHARED CARD & ROW EVENT LISTENERS ---
  function attachCardEventListeners(container) {
    // Audio Pronunciation TTS
    container.querySelectorAll('.play-audio-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        speakWord(btn.dataset.word);
      });
    });

    // Edit Button
    container.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const entryToEdit = allDatabaseEntries.find(entry => entry.id === id);
        if (entryToEdit) {
          openEditModal(entryToEdit);
        }
      });
    });

    // Delete Button
    container.querySelectorAll('.card-delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const entryToDelete = allDatabaseEntries.find(entry => entry.id === id);
        const name = entryToDelete ? capitalizeFirstLetter(entryToDelete.word) : 'this entry';

        if (confirm(`Are you sure you want to delete "${name}" from the dictionary archive?`)) {
          try {
            await fetch(`/api/entries/${id}`, { method: 'DELETE' });
            showToast(`Deleted "${name}"`);
            await loadEntries();
            fetchDatabaseWordsForAutocomplete();
          } catch (err) {
            alert(`Failed to delete: ${err.message}`);
          }
        }
      });
    });
  }

  // =========================================================================
  // 📅 3. WORD OF THE DAY (WOTD) WIDGET
  // =========================================================================
  function updateWordOfTheDay(forcedRandom = false) {
    if (allDatabaseEntries.length === 0) {
      wotdWidget.classList.add('hidden');
      return;
    }
    wotdWidget.classList.remove('hidden');

    let selectedEntry;
    if (forcedRandom) {
      const randIdx = Math.floor(Math.random() * allDatabaseEntries.length);
      selectedEntry = allDatabaseEntries[randIdx];
    } else {
      // Deterministic day-based index
      const today = new Date();
      const dayHash = today.getFullYear() * 1000 + (today.getMonth() + 1) * 31 + today.getDate();
      const idx = dayHash % allDatabaseEntries.length;
      selectedEntry = allDatabaseEntries[idx];
    }

    if (!selectedEntry) return;

    const formatted = capitalizeFirstLetter(selectedEntry.word);
    wotdWord.textContent = formatted;
    wotdPos.textContent = selectedEntry.pos || 'Word';
    wotdMeaning.textContent = `🌐 ${capitalizeFirstLetter(selectedEntry.azMeaning)}`;
    wotdDefinition.textContent = selectedEntry.definition || 'No definition recorded.';

    const synChips = (selectedEntry.synonyms || []).slice(0, 4).map(s => {
      return `<span class="chip">${escapeHtml(capitalizeFirstLetter(s))}</span>`;
    }).join(' ') || '<span class="chip" style="opacity:0.6;">None</span>';
    wotdSynonymsList.innerHTML = synChips;

    wotdAudioBtn.onclick = () => speakWord(formatted);
  }

  wotdRefreshBtn.addEventListener('click', () => updateWordOfTheDay(true));

  // =========================================================================
  // 📇 4. 3D FLASHCARD STUDY DECK LOGIC
  // =========================================================================
  function openFlashcardDeck() {
    if (allDatabaseEntries.length === 0) {
      showToast('Add some words to your dictionary before studying flashcards!');
      return;
    }

    // Shuffle entries for study deck
    flashcardEntries = [...allDatabaseEntries].sort(() => Math.random() - 0.5);
    currentFlashcardIndex = 0;
    renderFlashcard();
    flashcardsModal.classList.remove('hidden');
  }

  function closeFlashcardDeck() {
    flashcardsModal.classList.add('hidden');
    flashcard3d.classList.remove('flipped');
  }

  function renderFlashcard() {
    if (flashcardEntries.length === 0) return;
    const entry = flashcardEntries[currentFlashcardIndex];
    const formatted = capitalizeFirstLetter(entry.word);

    // Reset to front face
    flashcard3d.classList.remove('flipped');

    fcFrontWord.textContent = formatted;
    fcFrontPos.textContent = entry.pos || 'Word';
    fcFrontAudio.onclick = (e) => {
      e.stopPropagation();
      speakWord(formatted);
    };

    fcBackPos.textContent = entry.pos || 'Word';
    fcBackMeaning.textContent = `🌐 ${capitalizeFirstLetter(entry.azMeaning)}`;
    fcBackDef.textContent = entry.definition || 'No definition recorded.';

    if (Array.isArray(entry.synonyms) && entry.synonyms.length > 0) {
      fcBackSynSection.classList.remove('hidden');
      fcBackSynonyms.innerHTML = entry.synonyms.map(s => `<span class="chip">${escapeHtml(capitalizeFirstLetter(s))}</span>`).join(' ');
    } else {
      fcBackSynSection.classList.add('hidden');
    }

    if (entry.notes) {
      fcBackNotes.textContent = `📜 ${entry.notes}`;
      fcBackNotes.classList.remove('hidden');
    } else {
      fcBackNotes.classList.add('hidden');
    }

    fcCounter.textContent = `Card ${currentFlashcardIndex + 1} of ${flashcardEntries.length}`;
  }

  function toggleCardFlip() {
    flashcard3d.classList.toggle('flipped');
  }

  function nextFlashcard() {
    if (currentFlashcardIndex < flashcardEntries.length - 1) {
      currentFlashcardIndex++;
    } else {
      currentFlashcardIndex = 0; // Loop back
    }
    renderFlashcard();
  }

  function prevFlashcard() {
    if (currentFlashcardIndex > 0) {
      currentFlashcardIndex--;
    } else {
      currentFlashcardIndex = flashcardEntries.length - 1; // Loop to end
    }
    renderFlashcard();
  }

  openFlashcardsBtn.addEventListener('click', openFlashcardDeck);
  closeFlashcardsBtn.addEventListener('click', closeFlashcardDeck);
  flashcard3d.addEventListener('click', toggleCardFlip);
  fcFlipBtn.addEventListener('click', toggleCardFlip);
  fcNextBtn.addEventListener('click', nextFlashcard);
  fcPrevBtn.addEventListener('click', prevFlashcard);

  // Keyboard navigation for Flashcards
  document.addEventListener('keydown', (e) => {
    if (!flashcardsModal.classList.contains('hidden')) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggleCardFlip();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextFlashcard();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevFlashcard();
      } else if (e.key === 'Escape') {
        closeFlashcardDeck();
      }
    }
  });

  // =========================================================================
  // ✏️ 5. EDIT MODAL POPUP HANDLERS
  // =========================================================================
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

    editModalTitle.textContent = `Edit Lexicon Entry: ${capitalizeFirstLetter(entry.word)}`;
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
        <span class="pos-stamp" style="font-size:0.68rem;">${escapeHtml(m.pos)}</span>
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
      await loadEntries();
      fetchDatabaseWordsForAutocomplete();
    } catch (err) {
      alert(`Error updating entry: ${err.message}`);
    }
  });

  // =========================================================================
  // 🔍 6. SEARCH & FILTER CONTROLS LISTENERS
  // =========================================================================
  let searchDebounce = null;
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    if (searchQuery) clearSearchBtn.classList.remove('hidden');
    else clearSearchBtn.classList.add('hidden');

    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      applyFiltersAndRender();
    }, 200);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    applyFiltersAndRender();
  });

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentPosFilter = pill.dataset.pos;
      applyFiltersAndRender();
    });
  });

  sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    applyFiltersAndRender();
  });

  // =========================================================================
  // ✍️ 7. ADD FORM LOGIC
  // =========================================================================
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
        <span class="pos-stamp" style="font-size:0.68rem;">${escapeHtml(m.pos)}</span>
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
    wordInput.value = 'Mellifluous';
    posSelect.value = 'Adjective';
    azMeaningInput.value = 'Qulağa xoş gələn, axıcı və şirin';
    definitionInput.value = 'Sweet or musical; pleasant to hear (often describing a voice or tone).';
    notesInput.value = 'From Latin mel (honey) + fluere (to flow). Commonly used in literary literature.';
    
    synonymsList = ['Dulcet', 'Harmonious', 'Melodious'];
    antonymsList = ['Harsh', 'Cacophonous', 'Grating'];

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

      showToast(`Inscribed "${formattedWord}"!`);

      // If inscribed from saved backlog, delete from saved words automatically
      if (inscribeOriginId && inscribeOriginId.value) {
        try {
          await fetch(`/api/saved-words/${inscribeOriginId.value}`, { method: 'DELETE' });
          inscribeOriginId.value = '';
          inscribeOriginBanner.classList.add('hidden');
          loadSavedWords();
        } catch (e) {
          console.warn('Failed to auto-remove from saved words:', e);
        }
      }

      // Reset form
      addEntryForm.reset();
      synonymsList = [];
      antonymsList = [];
      renderSynonymTags();
      renderAntonymTags();

      // Refresh DB list & navigate to search
      await loadEntries();
      await fetchDatabaseWordsForAutocomplete();
      document.querySelector('[data-tab="search-tab"]').click();
    } catch (err) {
      alert(`Error saving entry: ${err.message}`);
    }
  });

  // =========================================================================
  // 📌 8. VOCABULARY SCRATCHPAD & SAVED FOR LATER LOGIC
  // =========================================================================

  // Mode switcher (Single Quick Add vs Batch Multi-Word Import)
  if (modeSingleBtn && modeBatchBtn) {
    modeSingleBtn.addEventListener('click', () => {
      modeSingleBtn.classList.add('active');
      modeBatchBtn.classList.remove('active');
      quickSaveForm.classList.remove('hidden');
      batchSaveForm.classList.add('hidden');
      quickWordInput.focus();
    });

    modeBatchBtn.addEventListener('click', () => {
      modeBatchBtn.classList.add('active');
      modeSingleBtn.classList.remove('active');
      batchSaveForm.classList.remove('hidden');
      quickSaveForm.classList.add('hidden');
      batchWordsInput.focus();
    });

    batchCancelBtn.addEventListener('click', () => {
      modeSingleBtn.click();
    });
  }

  // Dismiss Inscription origin link banner
  if (inscribeOriginDismissBtn) {
    inscribeOriginDismissBtn.addEventListener('click', () => {
      inscribeOriginId.value = '';
      inscribeOriginBanner.classList.add('hidden');
    });
  }

  // Load saved words from API
  async function loadSavedWords() {
    try {
      if (savedWordsStatus) savedWordsStatus.textContent = 'Consulting saved backlog...';
      const res = await fetch('/api/saved-words');
      const data = await res.json();
      if (data.success) {
        savedWordsList = data.savedWords || [];
      } else {
        savedWordsList = [];
      }
    } catch (err) {
      console.error('Failed to load saved words:', err);
      savedWordsList = [];
    }

    // Update nav counter badge
    if (savedWordsCountBadge) {
      savedWordsCountBadge.textContent = savedWordsList.length;
      savedWordsCountBadge.style.display = savedWordsList.length > 0 ? 'inline-flex' : 'none';
    }

    renderSavedWords();
  }

  // Render Saved Words Grid
  function renderSavedWords() {
    if (!savedWordsGrid) return;

    let filtered = [...savedWordsList];
    if (savedSearchQuery) {
      const q = savedSearchQuery.toLowerCase();
      filtered = filtered.filter(w => 
        (w.word || '').toLowerCase().includes(q) || 
        (w.notes || '').toLowerCase().includes(q)
      );
    }

    if (savedWordsStatus) {
      savedWordsStatus.textContent = `Pending Backlog: ${filtered.length} ${filtered.length === 1 ? 'word' : 'words'} waiting`;
    }

    if (filtered.length === 0) {
      if (savedSearchQuery) {
        savedWordsGrid.innerHTML = `
          <div class="empty-state parchment-card" style="grid-column: 1 / -1;">
            <h3>No Saved Words Match "${escapeHtml(savedSearchQuery)}"</h3>
            <p>Try clearing your filter to view all saved items.</p>
          </div>
        `;
      } else {
        savedWordsGrid.innerHTML = `
          <div class="empty-state parchment-card" style="grid-column: 1 / -1;">
            <h3>Your Word Scratchpad is Empty</h3>
            <p>Jot down new words or idioms you encounter while reading, watching sitcoms, or listening to podcasts so you can research and inscribe them later!</p>
          </div>
        `;
      }
      return;
    }

    savedWordsGrid.innerHTML = filtered.map(item => {
      const formattedWord = capitalizeFirstLetter(item.word);
      const notesHtml = item.notes 
        ? `<div class="saved-card-notes">📝 ${escapeHtml(item.notes)}</div>` 
        : '<div class="saved-card-notes" style="opacity:0.5;font-style:italic;">No context notes recorded</div>';

      const dateStr = item.createdAt 
        ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Recently';

      return `
        <div class="saved-word-card" data-id="${escapeHtml(item.id)}">
          <div class="saved-card-pin"></div>
          
          <div>
            <div class="saved-card-header">
              <div class="saved-card-word-line">
                <h3 class="saved-card-word">${escapeHtml(formattedWord)}</h3>
                <button class="skeuo-audio-btn play-audio-btn" data-word="${escapeHtml(formattedWord)}" title="Listen to pronunciation">🔊</button>
              </div>
              <span class="saved-card-badge">📌 Draft</span>
            </div>

            ${notesHtml}

            <div class="saved-card-meta">
              <span>📅 Saved: ${escapeHtml(dateStr)}</span>
            </div>
          </div>

          <div class="saved-card-actions">
            <button class="saved-inscribe-btn" data-id="${escapeHtml(item.id)}" title="Open Inscription Form with this word">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Inscribe to Lexicon</span>
            </button>
            <button class="saved-del-btn" data-id="${escapeHtml(item.id)}" title="Delete from saved words">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach Event Listeners to Saved Cards
    savedWordsGrid.querySelectorAll('.play-audio-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        speakWord(btn.dataset.word);
      });
    });

    savedWordsGrid.querySelectorAll('.saved-inscribe-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        inscribeSavedWord(id);
      });
    });

    savedWordsGrid.querySelectorAll('.saved-del-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const item = savedWordsList.find(w => w.id === id);
        const name = item ? capitalizeFirstLetter(item.word) : 'this word';
        if (confirm(`Remove "${name}" from your saved words backlog?`)) {
          await deleteSavedWord(id);
        }
      });
    });
  }

  // Inscribe a saved word into full dictionary entry
  function inscribeSavedWord(id) {
    const item = savedWordsList.find(w => w.id === id);
    if (!item) return;

    const formattedWord = capitalizeFirstLetter(item.word);
    
    // Switch to Add Tab
    addTabNavBtn.click();

    // Populate Add Entry Form
    wordInput.value = formattedWord;
    notesInput.value = item.notes || '';
    
    // Set origin banner info
    inscribeOriginId.value = item.id;
    inscribeOriginWord.textContent = formattedWord;
    inscribeOriginBanner.classList.remove('hidden');

    // Scroll to top of form and focus translation input
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      azMeaningInput.focus();
    }, 150);

    showToast(`Ready to inscribe "${formattedWord}"! Fill translation & save.`);
  }

  // Delete a saved word
  async function deleteSavedWord(id) {
    try {
      const res = await fetch(`/api/saved-words/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Word removed from scratchpad.');
        await loadSavedWords();
      }
    } catch (err) {
      alert(`Failed to delete saved word: ${err.message}`);
    }
  }

  // Quick Save Single Word Form Submit
  if (quickSaveForm) {
    quickSaveForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rawWord = quickWordInput.value.trim();
      const rawNotes = quickNotesInput.value.trim();

      if (!rawWord) return;

      try {
        const res = await fetch('/api/saved-words', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word: rawWord,
            notes: rawNotes
          })
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        showToast(`Saved "${capitalizeFirstLetter(rawWord)}" to scratchpad!`);
        quickWordInput.value = '';
        quickNotesInput.value = '';
        quickWordInput.focus();

        await loadSavedWords();
      } catch (err) {
        alert(`Error saving word: ${err.message}`);
      }
    });
  }

  // Batch Multi-Word Form Submit
  if (batchSaveForm) {
    batchSaveForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = batchWordsInput.value.trim();
      if (!text) return;

      // Parse lines and commas
      const rawTokens = text.split(/[\n,]+/);
      const words = rawTokens
        .map(t => t.trim())
        .filter(t => t.length > 0);

      if (words.length === 0) {
        alert('Please enter at least one word.');
        return;
      }

      try {
        const res = await fetch('/api/saved-words', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ words })
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        showToast(`Saved ${data.count || words.length} words to scratchpad!`);
        batchWordsInput.value = '';
        modeSingleBtn.click();
        await loadSavedWords();
      } catch (err) {
        alert(`Error saving batch words: ${err.message}`);
      }
    });
  }

  // Saved Search Filter
  if (savedSearchInput) {
    savedSearchInput.addEventListener('input', (e) => {
      savedSearchQuery = e.target.value.trim();
      if (savedSearchQuery) clearSavedSearchBtn.classList.remove('hidden');
      else clearSavedSearchBtn.classList.add('hidden');
      renderSavedWords();
    });

    clearSavedSearchBtn.addEventListener('click', () => {
      savedSearchInput.value = '';
      savedSearchQuery = '';
      clearSavedSearchBtn.classList.add('hidden');
      renderSavedWords();
    });
  }

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

  // --- INITIALIZATION ---
  initAlphabetTabs();
  setViewMode(currentViewMode);
  loadEntries();
  loadSavedWords();
  fetchDatabaseWordsForAutocomplete();
});

