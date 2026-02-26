let allBibleData = {}; 
let currentFileName = "";
let currentBookName = "";
let currentChapterNum = "1";

// Local Storage Data
let bookmarks = JSON.parse(localStorage.getItem('wog_bookmarks')) || [];
let readHistory = JSON.parse(localStorage.getItem('wog_history')) || [];
let userHighlights = JSON.parse(localStorage.getItem('wog_highlights')) || {};
let userNotes = JSON.parse(localStorage.getItem('wog_notes')) || {};

// Parallel Bible Variables
let kjvBibleData = null; 
let isParallelMode = localStorage.getItem('wog_parallel') === 'true';

let currentFontSize = 22; 
let initialDistance = null;
let selectedVerses = []; 
let currentEditingNoteId = null; 

// Swipe Variables
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;

const bookFiles = [
    "ఆదికాండము.json", "నిర్గమకాండము.json", "లేవీయకాండము.json", "సంఖ్యాకాండము.json", "ద్వితీయోపదేశకాండము.json",
    "యెహోషువ.json", "న్యాయాధిపతులు.json", "రూతు.json", "1సమూయేలు.json", "2సమూయేలు.json",
    "1రాజులు.json", "2రాజులు.json", "1దినవృత్తాంతములు.json", "2దినవృత్తాంతములు.json", "ఎజ్రా.json",
    "నెహెమ్యా.json", "ఎస్తేరు.json", "యోబు.json", "కీర్తనలు.json", "సామెతలు.json",
    "ప్రసంగి.json", "పరమగీతము.json", "యెషయా.json", "యిర్మీయా.json", "విలాపవాక్యములు.json",
    "యెహెజ్కేలు.json", "దానియేలు.json", "హోషేయ.json", "యోవేలు.json", "ఆమోసు.json",
    "ఓబద్యా.json", "యోనా.json", "మీకా.json", "నహూము.json", "హబక్కూకు.json",
    "జెఫన్యా.json", "హగ్గయి.json", "జెకర్యా.json", "మలాకీ.json",
    "మత్తయి.json", "మార్కు.json", "లూకా.json", "యోహాను.json", "అపొస్తలుల కార్యములు.json",
    "రోమీయులకు.json", "1కొరింథీయులకు.json", "2కొరింథీయులకు.json", "గలతీయులకు.json", "ఎఫెసీయులకు.json",
    "ఫిలిప్పీయులకు.json", "కొలస్సయులకు.json", "1థెస్సలొనీకయులకు.json", "2థెస్సలొనీకయులకు.json", "1తిమోతికి.json",
    "2తిమోతికి.json", "తీతుకు.json", "ఫిలేమోనుకు.json", "హెబ్రీయులకు.json", "యాకోబు.json",
    "1పేతురు.json", "2పేతురు.json", "1యోహాను.json", "2యోహాను.json", "3యోహాను.json",
    "యూదా.json", "ప్రకటన గ్రంథం.json"
];

const otFiles = bookFiles.slice(0, 39);
const ntFiles = bookFiles.slice(39, 66);

function init() {
    populateSidebar();
    checkDarkMode();
    checkParallelMode();
    loadKjvData(); 
    setupPinchZoom();
    setupSwipe(); 
    
    history.replaceState({page: 'home'}, "Home", "?view=home");
    showHome(false); 
}

// ------------------------------------
// UI Toggles & Theme
// ------------------------------------
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('open');
}

function toggleSearch() {
    document.getElementById('search-modal').classList.toggle('open');
}

function toggleSettingsModal() {
    document.getElementById('settings-modal').classList.toggle('open');
}

function toggleMusicModal() {
    document.getElementById('music-modal').classList.toggle('open');
}

function openHighlightPalette() {
    document.getElementById('highlight-modal').classList.add('open');
}

function closeHighlightPalette() {
    document.getElementById('highlight-modal').classList.remove('open');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    document.getElementById('theme-icon').innerText = isDark ? 'light_mode' : 'dark_mode';
    localStorage.setItem('wog_dark_mode', isDark);
}

function checkDarkMode() {
    const isDark = localStorage.getItem('wog_dark_mode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-icon').innerText = 'light_mode';
    } else {
        document.getElementById('theme-icon').innerText = 'dark_mode';
    }
}

// ------------------------------------
// Navigation (History API)
// ------------------------------------
function hideAllViews() {
    document.querySelectorAll('.view-container').forEach(v => v.style.display = 'none');
    clearVerseSelection(); 
}

window.onpopstate = function(event) {
    hideAllViews();
    if (event.state) {
        const page = event.state.page;
        if (page === 'home') document.getElementById('home-view').style.display = 'block';
        else if (page === 'chapters') document.getElementById('chapters-view').style.display = 'block';
        else if (page === 'reading') { document.getElementById('reading-view').style.display = 'block'; openChapterReading(currentChapterNum, null, null, false); }
        else if (page === 'bookmarks') { document.getElementById('bookmarks-view').style.display = 'block'; renderBookmarks(); }
        else if (page === 'notes') { document.getElementById('notes-view').style.display = 'block'; renderNotesList(); }
        else if (page === 'note-editor') document.getElementById('note-editor-view').style.display = 'block';
        else if (page === 'history') { document.getElementById('history-view').style.display = 'block'; renderHistory(); }
        else if (page === 'about') document.getElementById('about-view').style.display = 'block';
    } else {
        document.getElementById('home-view').style.display = 'block';
    }
};

function goBack() { history.back(); }

function showHome(pushState = true) {
    hideAllViews();
    document.getElementById('home-view').style.display = 'block';
    if(pushState) history.pushState({page: 'home'}, "Home", "?view=home");
}

function showBookmarksView(pushState = true) {
    hideAllViews();
    document.getElementById('bookmarks-view').style.display = 'block';
    renderBookmarks();
    if(pushState) history.pushState({page: 'bookmarks'}, "Bookmarks", "?view=bookmarks");
}

function showNotesView(pushState = true) {
    hideAllViews();
    document.getElementById('notes-view').style.display = 'block';
    renderNotesList();
    if(pushState) history.pushState({page: 'notes'}, "Notes", "?view=notes");
}

function showHistoryView(pushState = true) {
    hideAllViews();
    document.getElementById('history-view').style.display = 'block';
    renderHistory();
    if(pushState) history.pushState({page: 'history'}, "History", "?view=history");
}

function showAboutView(pushState = true) {
    hideAllViews();
    document.getElementById('about-view').style.display = 'block';
    if(pushState) history.pushState({page: 'about'}, "About", "?view=about");
}

// ------------------------------------
// Core Bible Logic
// ------------------------------------
function populateSidebar() {
    const sidebarList = document.getElementById('sidebar-books');
    let otHeader = document.createElement('div'); otHeader.className = 'book-cat'; otHeader.innerText = 'పాత నిబంధన (OT)'; sidebarList.appendChild(otHeader);
    otFiles.forEach(file => {
        let btn = document.createElement('button'); btn.className = 'menu-book-btn'; btn.innerText = file.replace('.json', '');
        btn.onclick = () => { toggleSidebar(); loadBookData(file); }; sidebarList.appendChild(btn);
    });

    let ntHeader = document.createElement('div'); ntHeader.className = 'book-cat'; ntHeader.innerText = 'కొత్త నిబంధన (NT)'; sidebarList.appendChild(ntHeader);
    ntFiles.forEach(file => {
        let btn = document.createElement('button'); btn.className = 'menu-book-btn'; btn.innerText = file.replace('.json', '');
        btn.onclick = () => { toggleSidebar(); loadBookData(file); }; sidebarList.appendChild(btn);
    });
}

function openSection(section) {
    toggleSidebar();
    const sidebarList = document.getElementById('sidebar-books');
    if(section === 'nt') sidebarList.scrollTop = sidebarList.scrollHeight / 2;
    else sidebarList.scrollTop = 0;
}

async function loadBookData(fileName, targetChapter = null, targetVerse = null, highlightQuery = null) {
    currentFileName = fileName;
    document.getElementById('chapters-book-title').innerText = "Loading...";
    hideAllViews();
    document.getElementById('chapters-view').style.display = 'block';
    
    if(!targetChapter) history.pushState({page: 'chapters'}, "Chapters", `?view=chapters&book=${fileName}`);

    if (!allBibleData[fileName]) {
        try {
            let response = await fetch(fileName);
            if (!response.ok) throw new Error("File not found");
            let data = await response.json();
            allBibleData[fileName] = data;
        } catch (error) {
            console.error("Error loading JSON:", error);
            document.getElementById('chapters-book-title').innerText = `${fileName} లోడ్ అవ్వలేదు.`;
            return;
        }
    }

    currentBookName = Object.keys(allBibleData[fileName])[0]; 
    document.getElementById('chapters-book-title').innerText = currentBookName;
    
    if (targetChapter) { openChapterReading(targetChapter, targetVerse, highlightQuery); } 
    else { renderChaptersGrid(); }
}

function renderChaptersGrid() {
    const gridContainer = document.getElementById('chapter-grid-container');
    gridContainer.innerHTML = '';
    const chapters = allBibleData[currentFileName][currentBookName];

    for (let chapterNum in chapters) {
        const btn = document.createElement('button');
        btn.className = 'grid-num-btn'; btn.innerText = chapterNum;
        btn.onclick = () => { openChapterReading(chapterNum); };
        gridContainer.appendChild(btn);
    }
}
function openChapterReading(chapterNum, targetVerse = null, highlightQuery = null, pushState = true) {
    clearVerseSelection(); 
    hideAllViews();
    document.getElementById('reading-view').style.display = 'block';
    
    // Swipe History fix
    if (pushState) {
        history.pushState({page: 'reading'}, "Reading", `?view=reading&book=${currentFileName}&chap=${chapterNum}`);
    } else {
        history.replaceState({page: 'reading'}, "Reading", `?view=reading&book=${currentFileName}&chap=${chapterNum}`);
    }
    
    currentChapterNum = chapterNum;
    addToHistory(currentFileName, currentBookName, chapterNum);

    const chaptersList = document.getElementById('quick-chapters-list');
    chaptersList.innerHTML = '';
    const chapters = allBibleData[currentFileName][currentBookName];
    
    for (let cNum in chapters) {
        const btn = document.createElement('button');
        btn.className = 'chapter-btn';
        btn.innerText = `Ch ${cNum}`;
        if (cNum === chapterNum) btn.classList.add('active');
        btn.onclick = () => { openChapterReading(cNum); };
        chaptersList.appendChild(btn);
    }

    const versesContainer = document.getElementById('verses-container');
    versesContainer.innerHTML = ''; 
    const verses = chapters[chapterNum];
    
    document.getElementById('reading-book-title').innerText = `${currentBookName} - ${chapterNum}`;

    for (let verseNum in verses) {
        const verseId = `${currentBookName}_${chapterNum}_${verseNum}`;
        const verseDiv = document.createElement('div');
        verseDiv.className = 'verse';
        verseDiv.id = `verse-${verseNum}`; 
        
        const numSpan = document.createElement('span');
        numSpan.className = 'verse-num'; numSpan.innerText = verseNum;
        
        const textSpan = document.createElement('span');
        textSpan.className = 'verse-text';
        textSpan.id = `verse-text-${verseId}`; 
        
        let rawVerseText = verses[verseNum].trim();
        let displayVerseText = rawVerseText;

        if (targetVerse && highlightQuery) {
            const regex = new RegExp(highlightQuery, 'gi');
            displayVerseText = displayVerseText.replace(regex, match => `<span class="highlight">${match}</span>`);
        }
        
        if (userHighlights[verseId] && userHighlights[verseId] !== 'none') {
            textSpan.style.backgroundColor = userHighlights[verseId];
        }

        if (userNotes[verseId]) {
            displayVerseText += ` <span class="material-icons note-indicator" title="View Note">edit_note</span>`;
        }

        textSpan.innerHTML = displayVerseText;
        
        const bIndex = bookFiles.indexOf(currentFileName);
        const enVerseText = getKjvVerse(bIndex, chapterNum, verseNum);
        if (enVerseText) {
            const enSpan = document.createElement('div');
            enSpan.className = 'verse-text-en';
            enSpan.innerText = enVerseText;
            textSpan.appendChild(enSpan);
        }

        textSpan.onclick = () => toggleVerseSelection(verseDiv, currentBookName, chapterNum, verseNum, rawVerseText);

        const isSaved = isBookmarked(currentBookName, chapterNum, verseNum);
        const bmBtn = document.createElement('button');
        bmBtn.className = `bookmark-btn ${isSaved ? 'saved' : ''}`;
        bmBtn.innerHTML = isSaved ? '<span class="material-icons">bookmark</span>' : '<span class="material-icons-outlined">bookmark_border</span>';
        bmBtn.onclick = () => toggleBookmark(currentBookName, chapterNum, verseNum, rawVerseText, bmBtn);
        
        verseDiv.appendChild(numSpan);
        verseDiv.appendChild(textSpan);
        verseDiv.appendChild(bmBtn);
        versesContainer.appendChild(verseDiv);
    }

    if (targetVerse) {
        setTimeout(() => {
            const targetElement = document.getElementById(`verse-${targetVerse}`);
            if (targetElement) { targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        }, 300);
    } else {
        window.scrollTo(0,0);
    }
}

// ------------------------------------
// Swipe to Change Chapters Logic 
// ------------------------------------
function setupSwipe() {
    const readingView = document.getElementById('reading-view');
    if(!readingView) return;
    
    readingView.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, {passive: true});

    readingView.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, {passive: true});
}

function handleSwipe() {
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        let currentChapInt = parseInt(currentChapterNum);
        let chapters = Object.keys(allBibleData[currentFileName][currentBookName]);
        
        if (diffX > 0) {
            if (currentChapInt > 1) {
                openChapterReading((currentChapInt - 1).toString(), null, null, false);
            }
        } else {
            if (chapters.includes((currentChapInt + 1).toString())) {
                openChapterReading((currentChapInt + 1).toString(), null, null, false);
            }
        }
    }
}

// ------------------------------------
// Multi-Verse Selection & Share Logic (Live Fetch)
// ------------------------------------
function toggleVerseSelection(verseDiv, book, chapter, verseNum, text) {
    const verseId = `${book}_${chapter}_${verseNum}`;
    const index = selectedVerses.findIndex(v => v.id === verseId);

    if (index > -1) {
        selectedVerses.splice(index, 1);
        verseDiv.classList.remove('selected');
    } else {
        const bIndex = bookFiles.indexOf(currentFileName);
        const liveEnText = getKjvVerse(bIndex, chapter, verseNum);
        
        selectedVerses.push({ id: verseId, book, chapter, verseNum, text, enText: liveEnText, file: currentFileName });
        verseDiv.classList.add('selected');
    }

    const actionBar = document.getElementById('selection-action-bar');
    if (selectedVerses.length > 0) {
        actionBar.style.display = 'block';
    } else {
        actionBar.style.display = 'none';
    }
}

function clearVerseSelection() {
    selectedVerses = [];
    document.querySelectorAll('.verse.selected').forEach(el => el.classList.remove('selected'));
    const actionBar = document.getElementById('selection-action-bar');
    if(actionBar) actionBar.style.display = 'none';
}

function shareSelectedVerses() {
    if (selectedVerses.length === 0) return;
    selectedVerses.sort((a, b) => parseInt(a.verseNum) - parseInt(b.verseNum));

    let shareTextStr = `📖 ${selectedVerses[0].book} - అధ్యాయం ${selectedVerses[0].chapter}\n\n`;
    selectedVerses.forEach(v => { 
        shareTextStr += `${v.verseNum}. ${v.text}\n`; 
        if (v.enText && v.enText.trim() !== "") {
            shareTextStr += `(${v.enText})\n`;
        }
        shareTextStr += `\n`;
    });
    shareTextStr += `- WORLD OF GOD Bible App`;

    shareTextFn(shareTextStr, 'WORLD OF GOD - Bible Verses');
    clearVerseSelection();
}

async function shareTextFn(text, title) {
    if (navigator.share) {
        try {
            await navigator.share({ title: title, text: text });
            return; 
        } catch (err) { console.log('Share cancelled:', err); }
    } 
    try {
        await navigator.clipboard.writeText(text);
        alert("టెక్స్ట్ కాపీ చేయబడింది! (Copied)\nమీరు వాట్సాప్ లో పేస్ట్ చేసి పంపవచ్చు.");
    } catch (err) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            alert("టెక్స్ట్ కాపీ చేయబడింది! (Copied)\nమీరు వాట్సాప్ లో పేస్ట్ చేసి పంపవచ్చు.");
        } catch (e) { alert("షేర్/కాపీ చేయడం విఫలమైంది."); }
        document.body.removeChild(textArea);
    }
}

// ------------------------------------
// Highlights Logic
// ------------------------------------
function applyHighlight(color) {
    if(selectedVerses.length === 0) return;
    selectedVerses.forEach(v => {
        const textSpan = document.getElementById(`verse-text-${v.id}`);
        if (color === 'none') {
            delete userHighlights[v.id];
            if(textSpan) textSpan.style.backgroundColor = 'transparent';
        } else {
            userHighlights[v.id] = color;
            if(textSpan) textSpan.style.backgroundColor = color;
        }
    });
    localStorage.setItem('wog_highlights', JSON.stringify(userHighlights));
    closeHighlightPalette();
    clearVerseSelection();
}

// ------------------------------------
// Advanced Notes Editor Logic
// ------------------------------------
function createNewNote() {
    currentEditingNoteId = 'custom_' + Date.now();
    document.getElementById('note-title-input').value = "";
    document.getElementById('note-content-input').value = "";
    document.getElementById('note-save-status').innerText = "";
    hideAllViews();
    document.getElementById('note-editor-view').style.display = 'block';
    history.pushState({page: 'note-editor'}, "Edit Note", "?view=note-editor");
}

function openNoteEditorForVerse() {
    if(selectedVerses.length === 0) return;
    selectedVerses.sort((a, b) => parseInt(a.verseNum) - parseInt(b.verseNum));
    let refTitle = `${selectedVerses[0].book} ${selectedVerses[0].chapter}:${selectedVerses.map(v => v.verseNum).join(',')}`;
    
    let combinedText = selectedVerses.map(v => {
        let txt = `${v.verseNum}. ${v.text}`;
        if(v.enText && v.enText.trim() !== "") txt += `\n(${v.enText})`;
        return txt;
    }).join('\n\n');
    
    currentEditingNoteId = selectedVerses[0].id; 
    let existingNote = userNotes[currentEditingNoteId];
    document.getElementById('note-title-input').value = existingNote ? existingNote.title : refTitle;
    document.getElementById('note-content-input').value = existingNote ? existingNote.text : combinedText + "\n\n(మీ నోట్స్ ఇక్కడ ప్రారంభించండి...)\n";
    document.getElementById('note-save-status').innerText = "";
    
    hideAllViews();
    document.getElementById('note-editor-view').style.display = 'block';
    history.pushState({page: 'note-editor'}, "Edit Note", "?view=note-editor");
    clearVerseSelection();
}

function openExistingNote(noteId) {
    currentEditingNoteId = noteId;
    let existingNote = userNotes[noteId];
    if(existingNote) {
        document.getElementById('note-title-input').value = existingNote.title || "";
        document.getElementById('note-content-input').value = existingNote.text || "";
        document.getElementById('note-save-status').innerText = "";
        hideAllViews();
        document.getElementById('note-editor-view').style.display = 'block';
        history.pushState({page: 'note-editor'}, "Edit Note", "?view=note-editor");
    }
}

let saveTimeout;
function autoSaveNote() {
    const title = document.getElementById('note-title-input').value;
    const text = document.getElementById('note-content-input').value;
    const statusEl = document.getElementById('note-save-status');
    statusEl.innerText = "సేవ్ అవుతోంది...";
    statusEl.style.color = "gray";

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        if(!title.trim() && !text.trim()) {
            delete userNotes[currentEditingNoteId];
        } else {
            let noteObj = userNotes[currentEditingNoteId] || {};
            noteObj.title = title;
            noteObj.text = text;
            noteObj.date = Date.now();
            userNotes[currentEditingNoteId] = noteObj;
        }
        localStorage.setItem('wog_notes', JSON.stringify(userNotes));
        statusEl.innerText = "సేవ్ చేయబడింది ✔";
        statusEl.style.color = "green";
    }, 800); 
}

function shareCurrentNote() {
    const title = document.getElementById('note-title-input').value.trim() || "My Note";
    const text = document.getElementById('note-content-input').value.trim();
    if(!text) { alert("షేర్ చేయడానికి కంటెంట్ లేదు!"); return; }
    let shareTextData = `${title}\n\n${text}\n\n- WORLD OF GOD Notes`;
    shareTextFn(shareTextData, title); 
}

function deleteCurrentNote() {
    if(confirm("ఈ నోట్ ని ఖచ్చితంగా డిలీట్ చేయాలనుకుంటున్నారా?")) {
        delete userNotes[currentEditingNoteId];
        localStorage.setItem('wog_notes', JSON.stringify(userNotes));
        goBack();
    }
}

function renderNotesList() {
    const container = document.getElementById('notes-list-container');
    container.innerHTML = '';
    const noteKeys = Object.keys(userNotes);

    if (noteKeys.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:gray; padding: 30px;">మీరు ఇంకా ఎలాంటి నోట్స్ వ్రాయలేదు.</p>';
        return;
    }
    const sortedNotes = noteKeys.map(k => ({id: k, ...userNotes[k]})).sort((a,b) => b.date - a.date);
    sortedNotes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'list-card';
        card.innerHTML = `
            <div class="ref"><span class="material-icons-outlined" style="font-size: 16px;">edit_note</span> ${note.title || "Untitled Note"}</div>
            <div class="user-note">${note.text}</div>
        `;
        card.onclick = () => { openExistingNote(note.id); };
        container.appendChild(card);
    });
}

// ------------------------------------
// History Logic
// ------------------------------------
function addToHistory(fileName, bookName, chapterNum) {
    const id = `${fileName}_${chapterNum}`;
    readHistory = readHistory.filter(h => h.id !== id);
    let preview = "";
    if(allBibleData[fileName] && allBibleData[fileName][bookName][chapterNum]["1"]) {
        preview = allBibleData[fileName][bookName][chapterNum]["1"].substring(0, 60) + "...";
    }
    readHistory.unshift({ id, fileName, bookName, chapterNum, preview, date: new Date().getTime() });
    if (readHistory.length > 50) readHistory = readHistory.slice(0, 50);
    localStorage.setItem('wog_history', JSON.stringify(readHistory));
}

function renderHistory() {
    const container = document.getElementById('history-container');
    container.innerHTML = '';
    if (readHistory.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:gray; padding: 30px;">చరిత్ర ఖాళీగా ఉంది.</p>';
        return;
    }
    readHistory.forEach(h => {
        const card = document.createElement('div');
        card.className = 'list-card';
        card.innerHTML = `
            <div class="ref">${h.bookName} - అధ్యాయం ${h.chapterNum}</div>
            <div class="text" style="font-size: 18px; color: var(--text);">${h.preview}</div>
        `;
        card.onclick = () => { loadBookData(h.fileName, h.chapterNum); };
        container.appendChild(card);
    });
}

// ------------------------------------
// Bookmarks Logic (With Delete Feature)
// ------------------------------------
function toggleBookmark(book, chapter, verseNum, text, btnElement) {
    const id = `${book}_${chapter}_${verseNum}`;
    const index = bookmarks.findIndex(b => b.id === id);

    if (index > -1) {
        bookmarks.splice(index, 1);
        btnElement.classList.remove('saved'); 
        btnElement.innerHTML = '<span class="material-icons-outlined">bookmark_border</span>';
    } else {
        bookmarks.push({ id, book, chapter, verseNum, text, file: currentFileName });
        btnElement.classList.add('saved'); 
        btnElement.innerHTML = '<span class="material-icons">bookmark</span>';
    }
    localStorage.setItem('wog_bookmarks', JSON.stringify(bookmarks));
}

function isBookmarked(book, chapter, verseNum) {
    return bookmarks.some(b => b.id === `${book}_${chapter}_${verseNum}`);
}

function deleteBookmarkFromList(event, id) {
    event.stopPropagation(); 
    if(confirm("ఈ బుక్‌మార్క్‌ ని డిలీట్ చేయాలనుకుంటున్నారా?")) {
        bookmarks = bookmarks.filter(b => b.id !== id);
        localStorage.setItem('wog_bookmarks', JSON.stringify(bookmarks));
        renderBookmarks(); 
    }
}

function renderBookmarks() {
    const container = document.getElementById('bookmarks-container');
    container.innerHTML = '';
    if (bookmarks.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:gray; padding: 30px;">మీరు ఇంకా ఏ వచనాలను సేవ్ చేయలేదు.</p>';
        return;
    }
    bookmarks.forEach(bm => {
        const card = document.createElement('div');
        card.className = 'list-card';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="flex: 1;">
                    <div class="ref">${bm.book} ${bm.chapter}:${bm.verseNum}</div>
                    <div class="text">${bm.text}</div>
                </div>
                <button class="icon-btn" style="color: #e74c3c; padding: 5px; margin-left: 10px;" onclick="deleteBookmarkFromList(event, '${bm.id}')">
                    <span class="material-icons-outlined">delete</span>
                </button>
            </div>
        `;
        card.onclick = (e) => { 
            if(!e.target.closest('button')) {
                loadBookData(bm.file || bm.book+".json", bm.chapter, bm.verseNum); 
            }
        };
        container.appendChild(card);
    });
}

// ------------------------------------
// Search Logic 
// ------------------------------------
async function executeSearch() {
    const query = document.getElementById('search-input').value.trim();
    const scope = document.getElementById('search-scope').value;

    if (!query) { alert("దయచేసి పదాన్ని ఎంటర్ చేయండి."); return; }

    toggleSearch(); 
    hideAllViews();
    document.getElementById('reading-view').style.display = 'block';
    history.pushState({page: 'reading'}, "Search", `?view=search`);

    const versesContainer = document.getElementById('verses-container');
    versesContainer.innerHTML = '<h3 style="color:var(--accent); text-align:center; padding: 30px;">వెతుకుతున్నాము, దయచేసి వేచి ఉండండి...</h3>';
    document.getElementById('reading-book-title').innerText = "Searching...";
    document.getElementById('quick-chapters-list').innerHTML = ""; 

    let filesToSearch = [];
    let scopeTitle = "";

    if (scope === 'book') {
        if(!currentFileName) currentFileName = bookFiles[0]; 
        filesToSearch = [currentFileName];
        scopeTitle = `ప్రస్తుత పుస్తకంలో`;
    } else if (scope === 'ot') { filesToSearch = otFiles; scopeTitle = "పాత నిబంధన (OT) లో";
    } else if (scope === 'nt') { filesToSearch = ntFiles; scopeTitle = "కొత్త నిబంధన (NT) లో"; 
    } else if (scope === 'all') { filesToSearch = bookFiles; scopeTitle = "బైబిల్ మొత్తం లో"; }

    let fetchPromises = filesToSearch.map(async (file) => {
        if (!allBibleData[file]) {
            try {
                let res = await fetch(file);
                if (res.ok) { 
                    let data = await res.json(); 
                    allBibleData[file] = data; 
                }
            } catch (e) {}
        }
    });

    await Promise.all(fetchPromises);

    versesContainer.innerHTML = '';
    let foundCount = 0;

    for (let file of filesToSearch) {
        if (!allBibleData[file]) continue;
        const bookData = allBibleData[file];
        const bookName = Object.keys(bookData)[0];
        const chapters = bookData[bookName];

        for (let chap in chapters) {
            const verses = chapters[chap];
            for (let vNum in verses) {
                const verseText = verses[vNum];
                if (verseText.toLowerCase().includes(query.toLowerCase())) {
                    foundCount++;
                    const verseDiv = document.createElement('div');
                    verseDiv.className = 'verse search-result';
                    verseDiv.onclick = () => { openChapterReading(chap, vNum, query); loadBookData(file, chap, vNum, query); };
                    
                    const numSpan = document.createElement('span');
                    numSpan.className = 'verse-num'; 
                    numSpan.innerText = `${bookName} ${chap}:${vNum}`;
                    numSpan.style.minWidth = '120px';
                    
                    const textSpan = document.createElement('span');
                    textSpan.className = 'verse-text';
                    const regex = new RegExp(query, 'gi');
                    textSpan.innerHTML = verseText.replace(regex, match => `<span class="highlight">${match}</span>`);
                    
                    verseDiv.appendChild(numSpan); 
                    verseDiv.appendChild(textSpan);
                    versesContainer.appendChild(verseDiv);
                }
            }
        }
    }

    if (foundCount === 0) {
        versesContainer.innerHTML = `<p style="font-size: 18px; color: #e74c3c; text-align:center; padding: 30px;">'${query}' దొరకలేదు.</p>`;
    }
    document.getElementById('reading-book-title').innerText = `${scopeTitle} ఫలితాలు (${foundCount})`;
}

// ------------------------------------
// Parallel Bible Smart Loading Logic
// ------------------------------------
async function loadKjvData() {
    try {
        let response = await fetch('kjv.json');
        if (response.ok) {
            kjvBibleData = await response.json();
            console.log("KJV Bible Loaded Successfully!");
        }
    } catch (error) {
        console.log("KJV Bible load error:", error);
    }
}

function checkParallelMode() {
    if (isParallelMode) {
        document.body.classList.add('show-parallel');
    }
}

function toggleParallelBible() {
    isParallelMode = !isParallelMode;
    localStorage.setItem('wog_parallel', isParallelMode);
    document.body.classList.toggle('show-parallel');
}

function getKjvVerse(bookIndex, chapterNum, verseNum) {
    if (!kjvBibleData || bookIndex === -1) return "";

    try {
        if (kjvBibleData.verses && Array.isArray(kjvBibleData.verses)) {
            let v = kjvBibleData.verses.find(v => (v.book == bookIndex + 1 || v.book_id == bookIndex + 1) && v.chapter == chapterNum && v.verse == verseNum);
            if (v && v.text) return v.text;
        }

        if (kjvBibleData.books && Array.isArray(kjvBibleData.books)) {
            let enBook = kjvBibleData.books[bookIndex];
            if (enBook && enBook.chapters) {
                let enChapter = enBook.chapters[chapterNum - 1] || enBook.chapters[chapterNum]; 
                if (Array.isArray(enChapter)) {
                    return enChapter[verseNum - 1] || "";
                } else if (typeof enChapter === 'object') {
                    return enChapter[verseNum] || "";
                }
            }
        }

        let coreData = kjvBibleData.bible || kjvBibleData.text || kjvBibleData;
        let keys = Object.keys(coreData).filter(k => k !== 'metadata' && k !== 'info' && k !== 'version');
        
        if (keys.length > bookIndex) {
            let enBookName = keys[bookIndex];
            let enChapter = coreData[enBookName][chapterNum] || coreData[enBookName][chapterNum - 1]; 
            if (enChapter) {
                if (Array.isArray(enChapter)) return enChapter[verseNum - 1] || "";
                return enChapter[verseNum] || "";
            }
        }
    } catch(e) {
        console.error("KJV parsing error:", e);
    }
    return ""; 
}

// ------------------------------------
// NEW: MUSIC PLAYER LOGIC
// ------------------------------------
let currentAudioBtn = null;

function playMusic(src, btnId) {
    const audio = document.getElementById('bg-audio');
    
    // పాత బటన్స్ అన్నీ రీసెట్ చేస్తున్నాం
    document.querySelectorAll('.music-btn').forEach(btn => {
        btn.classList.remove('active');
        let icon = btn.querySelector('.status-icon');
        if(icon) icon.innerText = 'play_circle';
    });

    // ఒకవేళ ప్లే అవుతున్న బటన్ నే మళ్ళీ నొక్కితే పాజ్ అవ్వాలి
    if (currentAudioBtn === btnId && !audio.paused) {
        audio.pause();
        currentAudioBtn = null;
        return;
    }

    // కొత్త ఆడియో ప్లే
    audio.src = src;
    audio.play().catch(e => {
        alert("ఆడియో ఫైల్ కనుగొనబడలేదు. దయచేసి 'rain.mp3', 'nature.mp3', 'piano.mp3' ఫైల్స్ ని మీ ఫోల్డర్ లో వేసుకోండి.");
    });
    
    // ఆక్టివ్ బటన్ డిజైన్ మారుస్తున్నాం
    const activeBtn = document.getElementById(btnId);
    activeBtn.classList.add('active');
    activeBtn.querySelector('.status-icon').innerText = 'pause_circle';
    currentAudioBtn = btnId;
}

function stopMusic() {
    const audio = document.getElementById('bg-audio');
    audio.pause();
    audio.currentTime = 0; // మొదటకి తీసుకొస్తున్నాం
    currentAudioBtn = null;
    
    document.querySelectorAll('.music-btn').forEach(btn => {
        btn.classList.remove('active');
        let icon = btn.querySelector('.status-icon');
        if(icon) icon.innerText = 'play_circle';
    });
}

function changeVolume() {
    const audio = document.getElementById('bg-audio');
    const vol = document.getElementById('music-volume').value;
    audio.volume = vol;
}

// Start App
init();
