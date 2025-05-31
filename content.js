// Function to create and inject note button
function createNoteButton(poolElement) {
    const noteButton = document.createElement('button');
    noteButton.className = 'pool-note-button';
    noteButton.innerHTML = '📝';
    noteButton.title = 'Add Note';
    
    // Get unique pool identifier from the href attribute
    const poolRow = poolElement.closest('.ds-dex-table-row');
    const poolHref = poolRow?.getAttribute('href') || '';
    const poolAddress = poolHref.replace(/^\//, ''); // Remove leading slash
    
    noteButton.addEventListener('click', (e) => {
        // Prevent default behavior and stop propagation
        e.preventDefault();
        e.stopPropagation();
        showNoteInput(poolElement, poolAddress);
    });
    
    return noteButton;
}

// Function to show note input
function showNoteInput(poolElement, poolAddress) {
    const existingNote = document.querySelector('.pool-note-input');
    if (existingNote) {
        existingNote.remove();
    }
    
    const existingOverlay = document.querySelector('.note-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'note-overlay';
    document.body.appendChild(overlay);
    
    const noteInput = document.createElement('div');
    noteInput.className = 'pool-note-input';
    
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Add your note here...';
    
    // Prevent textarea events from propagating
    textarea.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    
    textarea.addEventListener('keydown', (e) => {
        e.stopPropagation();
        
        // Handle Command + Enter to save
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            const note = textarea.value;
            chrome.storage.local.set({ [poolAddress]: note }, () => {
                noteInput.remove();
                overlay.remove();
                // Update the note display
                updateNoteDisplay(poolElement, note);
            });
        }
        
        // Handle Escape to dismiss
        if (e.key === 'Escape') {
            e.preventDefault();
            noteInput.remove();
            overlay.remove();
        }
    });
    
    textarea.addEventListener('keyup', (e) => {
        e.stopPropagation();
    });
    
    textarea.addEventListener('input', (e) => {
        e.stopPropagation();
    });
    
    // Load existing note if any
    chrome.storage.local.get([poolAddress], (result) => {
        if (result[poolAddress]) {
            textarea.value = result[poolAddress];
        }
    });
    
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const note = textarea.value;
        chrome.storage.local.set({ [poolAddress]: note }, () => {
            noteInput.remove();
            overlay.remove();
            // Update the note display
            updateNoteDisplay(poolElement, note);
        });
    });
    
    noteInput.appendChild(textarea);
    noteInput.appendChild(saveButton);
    document.body.appendChild(noteInput);
    
    // Prevent clicks on the note input from propagating
    noteInput.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    
    // Close on overlay click
    overlay.addEventListener('click', () => {
        noteInput.remove();
        overlay.remove();
    });
    
    // Focus the textarea
    textarea.focus();
}

// Function to update note display
function updateNoteDisplay(poolElement, note) {
    const tokenCell = poolElement.closest('.ds-table-data-cell');
    let noteText = tokenCell.querySelector('.note-text');
    
    // Remove note button and indicator
    const noteButton = poolElement.querySelector('.pool-note-button');
    const noteIndicator = poolElement.querySelector('.note-indicator');
    if (noteButton) noteButton.remove();
    if (noteIndicator) noteIndicator.remove();
    
    if (note && note.trim()) {
        if (!noteText) {
            noteText = document.createElement('div');
            noteText.className = 'note-text';
            
            // Add multiple event listeners to ensure click is caught
            noteText.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, true);
            
            noteText.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const poolRow = poolElement.closest('.ds-dex-table-row');
                const poolHref = poolRow?.getAttribute('href') || '';
                const poolAddress = poolHref.replace(/^\//, '');
                showNoteInput(poolElement, poolAddress);
            }, true);
            
            // Prevent any parent click events
            noteText.addEventListener('mouseup', (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, true);
            
            tokenCell.appendChild(noteText);
        }
        noteText.textContent = note;
        noteText.title = note;
    } else if (noteText) {
        noteText.remove();
        // Add back the note button if no note
        const newNoteButton = createNoteButton(poolElement);
        poolElement.appendChild(newNoteButton);
    }
}

// Function to initialize notes for all pools
function initializeNotes() {
    // Find all token name elements
    const tokenNameElements = document.querySelectorAll('.ds-dex-table-row-base-token-name');
    
    tokenNameElements.forEach(element => {
        // Check if we've already added a note button to this element
        if (!element.querySelector('.pool-note-button') && !element.closest('.ds-table-data-cell').querySelector('.note-text')) {
            const noteButton = createNoteButton(element);
            element.appendChild(noteButton);
            
            // Get unique pool identifier from the href attribute
            const poolRow = element.closest('.ds-dex-table-row');
            const poolHref = poolRow?.getAttribute('href') || '';
            const poolAddress = poolHref.replace(/^\//, '');
            
            // Load existing notes
            chrome.storage.local.get([poolAddress], (result) => {
                if (result[poolAddress]) {
                    updateNoteDisplay(element, result[poolAddress]);
                }
            });
        }
    });
}

// Initialize when the page loads
initializeNotes();

// Watch for new pools being added to the page
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            initializeNotes();
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
}); 