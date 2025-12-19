// ========================================
// SMART DOCUMENT EDITOR - STORAGE MODULE
// ========================================

/**
 * This module handles:
 * - Autosave with debouncing
 * - Manual save to LocalStorage
 * - Load saved documents
 * - LocalStorage error handling
 * 
 * Data Format: Quill Delta (JSON)
 * Why: Preserves exact formatting, compact, native to Quill
 */

// ========================================
// CONFIGURATION
// ========================================

const STORAGE_KEY = 'smartDocEditor_content';  // LocalStorage key
const AUTOSAVE_DELAY = 2000;  // Debounce delay in milliseconds (2 seconds)

// ========================================
// STATE MANAGEMENT
// ========================================

let autosaveTimer = null;  // Timer for debouncing
let isAutosaveEnabled = true;  // Toggle autosave on/off

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initialize storage functionality when DOM loads
 * Why: Need to wait for editor.js to initialize Quill first
 */
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Quill to be initialized in editor.js
    // Using longer delay and checking for quill existence
    setTimeout(() => {
        if (typeof quill === 'undefined' || quill === null) {
            console.warn('⚠️ Quill not ready yet, retrying in 500ms...');
            // Retry after additional delay
            setTimeout(() => {
                setupStorageListeners();
                loadSavedDocument();
                updateAutosaveStatus();
            }, 500);
        } else {
            setupStorageListeners();
            loadSavedDocument();
            updateAutosaveStatus();
        }
    }, 200);
});

// ========================================
// EVENT LISTENERS SETUP
// ========================================

/**
 * Attach event listeners for storage operations
 */
function setupStorageListeners() {
    // Manual save button
    const saveBtn = document.getElementById('saveDoc');
    if (saveBtn) {
        saveBtn.addEventListener('click', manualSave);
        console.log('✅ Save button listener attached');
    } else {
        console.error('❌ Save button not found');
    }
    
    // Load button
    const loadBtn = document.getElementById('loadDoc');
    if (loadBtn) {
        loadBtn.addEventListener('click', manualLoad);
        console.log('✅ Load button listener attached');
    } else {
        console.error('❌ Load button not found');
    }
    
    // Listen for content changes in Quill editor
    if (typeof quill !== 'undefined' && quill !== null) {
        quill.on('text-change', function(delta, oldDelta, source) {
            // Only autosave user changes (not programmatic changes)
            if (source === 'user') {
                triggerAutosave();
            }
        });
        
        console.log('✅ Storage listeners attached to Quill');
    } else {
        console.error('❌ Quill editor not found. Make sure editor.js loads first.');
        console.error('   Try refreshing the page if this persists.');
    }
}

// ========================================
// AUTOSAVE FUNCTIONALITY
// ========================================

/**
 * Trigger autosave with debouncing
 * How it works: Resets timer on each keystroke, saves after user pauses
 * 
 * Interview Tip: Explain debouncing pattern
 */
function triggerAutosave() {
    if (!isAutosaveEnabled) return;
    
    // Clear existing timer (if user is still typing)
    if (autosaveTimer) {
        clearTimeout(autosaveTimer);
    }
    
    // Set new timer
    autosaveTimer = setTimeout(() => {
        performSave(true);  // true = silent autosave
    }, AUTOSAVE_DELAY);
    
    // Update UI to show "Saving..." while waiting
    updateAutosaveStatus('pending');
}

/**
 * Perform the actual save operation
 * @param {boolean} isAutomatic - true for autosave, false for manual save
 */
function performSave(isAutomatic = false) {
    try {
        // Get editor content as Delta format
        const content = quill.getContents();
        
        // Check if editor is empty (optional: prevent saving empty docs)
        const text = quill.getText().trim();
        if (text.length === 0 && isAutomatic) {
            console.log('⚠️ Empty document, skipping autosave');
            updateAutosaveStatus('disabled');
            return;
        }
        
        // Create save object with metadata
        const saveData = {
            content: content,  // Quill Delta format
            timestamp: Date.now(),
            version: '1.0',  // For future compatibility
            wordCount: text.split(/\s+/).filter(w => w.length > 0).length
        };
        
        // Save to LocalStorage
        // Why JSON.stringify? LocalStorage only stores strings
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
        
        // Update UI
        if (isAutomatic) {
            updateAutosaveStatus('saved');
            console.log('💾 Autosaved at', new Date().toLocaleTimeString());
        } else {
            updateAutosaveStatus('saved');
            alert('✅ Document saved successfully!');
            console.log('💾 Manual save at', new Date().toLocaleTimeString());
        }
        
    } catch (error) {
        handleSaveError(error, isAutomatic);
    }
}

/**
 * Handle save errors (quota exceeded, etc.)
 */
function handleSaveError(error, isAutomatic) {
    console.error('❌ Save failed:', error);
    
    // Check for quota exceeded error
    if (error.name === 'QuotaExceededError') {
        const message = 'Storage quota exceeded! Please clear some browser data or export your document.';
        if (!isAutomatic) alert(message);
        updateAutosaveStatus('error');
    } else {
        const message = 'Failed to save document. Please try again.';
        if (!isAutomatic) alert(message);
        updateAutosaveStatus('error');
    }
}

// ========================================
// MANUAL SAVE
// ========================================

/**
 * Manual save triggered by button click OR keyboard shortcut (Ctrl+S)
 * Why separate from autosave: Different UI feedback
 * Exposed globally so editor.js can call it
 */
function manualSave() {
    performSave(false);  // false = show alert notification
}

// ========================================
// LOAD FUNCTIONALITY
// ========================================

/**
 * Load saved document from LocalStorage
 * Called automatically on page load OR manually via button
 */
function loadSavedDocument() {
    try {
        // Retrieve data from LocalStorage
        const savedDataString = localStorage.getItem(STORAGE_KEY);
        
        // Check if data exists
        if (!savedDataString) {
            console.log('ℹ️ No saved document found (first-time user)');
            updateAutosaveStatus('ready');
            return;
        }
        
        // Parse JSON
        const savedData = JSON.parse(savedDataString);
        
        // Validate data structure
        if (!savedData.content || !savedData.content.ops) {
            throw new Error('Invalid save data format');
        }
        
        // Load content into editor
        quill.setContents(savedData.content);
        
        // Don't add to undo history (user didn't type this)
        quill.history.clear();
        
        // Update UI
        updateAutosaveStatus('loaded');
        console.log('📂 Document loaded from', new Date(savedData.timestamp).toLocaleString());
        
        // Show info if manually loaded
        // (skip for automatic load on page refresh)
        
    } catch (error) {
        handleLoadError(error);
    }
}

/**
 * Manual load triggered by button click
 */
function manualLoad() {
    const confirmed = confirm('Load saved document? Current unsaved changes will be lost.');
    
    if (confirmed) {
        loadSavedDocument();
        
        // Get the saved data again for confirmation message
        const savedDataString = localStorage.getItem(STORAGE_KEY);
        if (savedDataString) {
            const savedData = JSON.parse(savedDataString);
            const saveDate = new Date(savedData.timestamp).toLocaleString();
            alert(`✅ Loaded document from ${saveDate}`);
        }
    }
}

/**
 * Handle load errors (corrupted data, etc.)
 */
function handleLoadError(error) {
    console.error('❌ Load failed:', error);
    
    // Corrupted data in localStorage
    if (error instanceof SyntaxError || error.message.includes('Invalid')) {
        const confirmed = confirm(
            '⚠️ Saved document is corrupted. Clear corrupted data and start fresh?'
        );
        
        if (confirmed) {
            localStorage.removeItem(STORAGE_KEY);
            quill.setText('');
            updateAutosaveStatus('ready');
            alert('Corrupted data cleared. You can start a new document.');
        }
    } else {
        alert('Failed to load document. The saved data may be corrupted.');
        updateAutosaveStatus('error');
    }
}

// ========================================
// UI STATUS UPDATES
// ========================================

/**
 * Update autosave status in footer
 * @param {string} status - 'ready', 'pending', 'saved', 'loaded', 'error', 'disabled'
 */
function updateAutosaveStatus(status = 'ready') {
    const statusElement = document.getElementById('autoSaveStatus');
    
    const statusMessages = {
        'ready': 'Autosave: Ready',
        'pending': 'Autosave: Saving...',
        'saved': 'Autosave: ✓ Saved',
        'loaded': 'Autosave: ✓ Loaded',
        'error': 'Autosave: ⚠ Error',
        'disabled': 'Autosave: Off (empty doc)'
    };
    
    statusElement.textContent = statusMessages[status] || statusMessages['ready'];
    
    // Clear "Saved" message after 3 seconds
    if (status === 'saved' || status === 'loaded') {
        setTimeout(() => {
            updateAutosaveStatus('ready');
        }, 3000);
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Check if browser supports LocalStorage
 * Why: Some browsers in private mode disable localStorage
 */
function isLocalStorageAvailable() {
    try {
        const test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        console.warn('⚠️ LocalStorage not available:', e);
        return false;
    }
}

/**
 * Get size of stored data (for debugging/monitoring)
 * Interview Tip: Explain localStorage quota (5-10MB typically)
 */
function getStorageSize() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return 0;
    
    // Calculate size in bytes
    const bytes = new Blob([data]).size;
    const kb = (bytes / 1024).toFixed(2);
    
    console.log(`💾 Storage size: ${kb} KB`);
    return bytes;
}

/**
 * Clear saved document (for debugging or user request)
 */
function clearSavedDocument() {
    const confirmed = confirm('⚠️ Delete saved document? This cannot be undone.');
    
    if (confirmed) {
        localStorage.removeItem(STORAGE_KEY);
        alert('Saved document deleted.');
        updateAutosaveStatus('ready');
        console.log('🗑️ Saved document cleared');
    }
}

// ========================================
// BROWSER COMPATIBILITY CHECK
// ========================================

// Check localStorage availability on load
if (!isLocalStorageAvailable()) {
    alert('⚠️ LocalStorage is not available. Documents cannot be saved in this browser.');
    isAutosaveEnabled = false;
    updateAutosaveStatus('error');
}

console.log('💾 Storage module loaded successfully');
