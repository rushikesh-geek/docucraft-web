// ========================================
// SMART DOCUMENT EDITOR - EDITOR MODULE
// ========================================

/**
 * This module handles:
 * - Quill.js editor initialization
 * - Toolbar functionality
 * - Dark mode toggle
 * - Word count tracking
 * - Undo/Redo operations
 * - New document creation
 */

// ========================================
// GLOBAL VARIABLES
// ========================================

// Quill editor instance - MUST be global for storage.js and export.js to access
var quill = null; // Using 'var' ensures true global scope (window.quill)
let wordCountTimer = null; // Timer for debouncing word count updates

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initialize the editor when DOM is fully loaded
 * Why: Ensures all HTML elements exist before accessing them
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeEditor();
    setupEventListeners();
    setupKeyboardShortcuts();
    updateWordCount();
    checkDarkModePreference();
});

// ========================================
// QUILL EDITOR INITIALIZATION
// ========================================

/**
 * Initialize Quill.js with custom configuration
 * Interview Tip: Explain the modules object and toolbar configuration
 */
function initializeEditor() {
    quill = new Quill('#editor', {
        // Theme: 'snow' gives us the clean white/snow-like toolbar
        theme: 'snow',
        
        // Modules configuration
        modules: {
            // Toolbar: Use custom toolbar from HTML (#quill-toolbar)
            toolbar: '#quill-toolbar',
            
            // History: Built-in undo/redo functionality
            history: {
                delay: 1000,        // Delay between undo steps (ms)
                maxStack: 100,      // Maximum undo stack size
                userOnly: true      // Only track user changes (not programmatic)
            }
        },
        
        // Placeholder text when editor is empty
        placeholder: 'Start writing your document...'
    });
    
    // Listen for text changes to update word count
    quill.on('text-change', function() {
        updateWordCount();
    });

    console.log('✅ Quill editor initialized successfully');
}

// ========================================
// EVENT LISTENERS SETUP
// ========================================

/**
 * Attach event listeners to all buttons
 * Why separate function: Keeps initialization clean and organized
 */
function setupEventListeners() {
    // Dark Mode Toggle
    const darkModeBtn = document.getElementById('darkModeToggle');
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', toggleDarkMode);
    } else {
        console.error('❌ Dark mode button not found');
    }
    
    // File Operations - New Document
    const newDocBtn = document.getElementById('newDoc');
    if (newDocBtn) {
        newDocBtn.addEventListener('click', createNewDocument);
    } else {
        console.error('❌ New document button not found');
    }
    
    // Undo/Redo buttons
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) {
        undoBtn.addEventListener('click', undoChange);
    } else {
        console.error('❌ Undo button not found');
    }
    
    const redoBtn = document.getElementById('redoBtn');
    if (redoBtn) {
        redoBtn.addEventListener('click', redoChange);
    } else {
        console.error('❌ Redo button not found');
    }
    
    console.log('✅ Event listeners attached');
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

/**
 * Setup custom keyboard shortcuts
 * Note: Quill handles most formatting shortcuts automatically:
 * - Ctrl+B: Bold
 * - Ctrl+I: Italic
 * - Ctrl+U: Underline
 * - Ctrl+Z: Undo
 * - Ctrl+Y / Ctrl+Shift+Z: Redo
 * 
 * We add custom shortcuts for:
 * - Ctrl+S: Save document
 * - Ctrl+P: Export PDF (optional)
 * 
 * Interview Tip: Explain preventDefault() to avoid browser defaults
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+S: Save document
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();  // Prevent browser's "Save Page" dialog
            manualSave();  // Defined in storage.js
            console.log('⌨️ Ctrl+S pressed: Save triggered');
        }
        
        // Ctrl+P: Export PDF (override browser print)
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();  // Prevent browser's print dialog
            const exportBtn = document.getElementById('exportPDF');
            if (exportBtn && !exportBtn.disabled) {
                exportBtn.click();
                console.log('⌨️ Ctrl+P pressed: PDF export triggered');
            }
        }
        
        // Escape: Clear focus from editor (for keyboard navigation)
        if (e.key === 'Escape') {
            if (document.activeElement === quill.root) {
                document.activeElement.blur();
                document.getElementById('newDoc').focus();  // Focus first toolbar button
                console.log('⌨️ Escape pressed: Focus moved to toolbar');
            }
        }
    });
    
    console.log('✅ Custom keyboard shortcuts registered');
}

// ========================================
// DARK MODE FUNCTIONALITY
// ========================================

/**
 * Toggle between light and dark mode
 * How it works: Adds/removes 'dark-mode' class on body
 * CSS variables automatically update based on this class
 */
function toggleDarkMode() {
    const body = document.body;
    const darkModeBtn = document.getElementById('darkModeToggle');
 

/**
 * Debounced word count update for performance
 * Why: Updating on every keystroke is wasteful
 * Wait 300ms after user stops typing before updating
 */
function debouncedWordCountUpdate() {
    if (wordCountTimer) {
        clearTimeout(wordCountTimer);
    }
    
    wordCountTimer = setTimeout(() => {
        updateWordCount();
    }, 300);  // 300ms delay
}   
    // Toggle the dark-mode class
    body.classList.toggle('dark-mode');
    
    // Update button icon
    if (body.classList.contains('dark-mode')) {
        darkModeBtn.textContent = '☀️'; // Sun icon for light mode option
        localStorage.setItem('theme', 'dark'); // Save preference
    } else {
        darkModeBtn.textContent = '🌙'; // Moon icon for dark mode option
        localStorage.setItem('theme', 'light');
    }
    
    console.log('🎨 Theme toggled:', body.classList.contains('dark-mode') ? 'Dark' : 'Light');
}

/**
 * Check if user previously selected dark mode
 * Why: Better UX - remembers user preference across sessions
 */
function checkDarkModePreference() {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').textContent = '☀️';
    }
}

// ========================================
// WORD COUNT FUNCTIONALITY
// ========================================

/**
 * Update word and character count in footer
 * Interview Tip: Explain why we use getText() vs getContents()
 */
function updateWordCount() {
    // Safety check: Ensure Quill is initialized
    if (!quill) {
        console.warn('⚠️ Cannot update word count: Quill not initialized yet');
        return;
    }
    
    // Get plain text content (no formatting)
    const text = quill.getText();
    
    // Remove extra whitespace and count words
    // Why trim()? Prevents counting empty spaces as words
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Character count (excluding final newline Quill adds)
    const charCount = text.trim().length;
    
    // Update footer display
    document.getElementById('wordCount').textContent = 
        `Words: ${wordCount} | Characters: ${charCount}`;
}

// ========================================
// UNDO/REDO FUNCTIONALITY
// ========================================

/**
 * Undo the last change
 * How it works: Uses Quill's built-in history module
 */
function undoChange() {
    if (!quill) {
        console.error('❌ Cannot undo: Quill editor not initialized');
        return;
    }
    quill.history.undo();
    console.log('↶ Undo performed');
}

/**
 * Redo the last undone change
 */
function redoChange() {
    if (!quill) {
        console.error('❌ Cannot redo: Quill editor not initialized');
        return;
    }
    quill.history.redo();
    console.log('↷ Redo performed');
}

// PERFORMANCE & CLEANUP
// ========================================

/**
 * Clean up resources before immediately (don't wait for debounce)
        updateWordCount();
        
        // Focus editor for immediate typing
        focusEditor(
    // Clear any pending timers
    if (wordCountTimer) {
        clearTimeout(wordCountTimer);
    }
    
    // Quill automatically cleans up its own listeners
    // Additional cleanup could go here
    
    console.log('🧹 Cleanup completed');
}

/**
 * Focus management for accessibility
 * Move focus to editor programmatically
 */
function focusEditor() {
    if (quill) {
        quill.focus();
    }
}

// ========================================
// UTILITY FUNCTIONS (Continued)======================
// DOCUMENT MANAGEMENT
// ========================================

/**
 * Create a new blank document
 * Interview Tip: Explain why we use setText vs setContents
 */
function createNewDocument() {
    // Check if editor is initialized
    if (!quill) {
        console.error('❌ Cannot create new document: Quill editor not initialized');
        return;
    }
    
    // Confirm with user to prevent accidental data loss
    const confirmed = confirm('Create a new document? Current document will be lost if not saved.');
    
    if (confirmed) {
        // Clear editor content
        quill.setText(''); // Sets plain text (alternative: quill.setContents([]))
        
        // Clear history stack (so undo doesn't restore old content)
        quill.history.clear();
        
        // Update word count
        updateWordCount();
        
        // Clear localStorage (optional - or keep old save for Load button)
        // localStorage.removeItem('smartDocEditor_content');
        
        console.log('📄 New document created');
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Get editor content as HTML
 * Used by export and storage modules
 */
function getEditorHTML() {
    if (!quill) return '';
    return quill.root.innerHTML;
}

/**
 * Get editor content as Delta format
 * Used by storage module for saving
 */
function getEditorDelta() {
    if (!quill) return null;
    return quill.getContents();
}

/**
 * Set editor content from Delta format
 * Used when loading saved documents
 */
function setEditorDelta(delta) {
    if (!quill) return;
    quill.setContents(delta);
}

// ========================================
// MODULE LOADED CONFIRMATION
// ========================================

/**
 * Note: Quill handles most shortcuts automatically:
 * - Ctrl+B: Bold
 * - Ctrl+I: Italic
 * - Ctrl+U: Underline
 * - Ctrl+Z: Undo
 * - Ctrl+Y: Redo (Ctrl+Shift+Z also works)
 * 
 * Custom shortcuts are defined in setupKeyboardShortcuts()
 */

console.log('📝 Editor module loaded successfully');
