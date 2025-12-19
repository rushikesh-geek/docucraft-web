// ========================================
// DOCX IMPORT MODULE
// ========================================

/**
 * This module handles importing .docx files using mammoth.js
 * 
 * FLOW:
 * 1. User clicks "Import" button
 * 2. File input opens (.docx only)
 * 3. File is read as ArrayBuffer
 * 4. mammoth.js converts DOCX → HTML (with images as base64)
 * 5. HTML is sanitized and inserted into Quill
 * 6. Editor content is updated
 * 
 * IMAGE HANDLING:
 * - DOCX images are converted to base64 data URIs
 * - Inserted as <img> tags into Quill
 * - Quill's image module handles rendering
 * 
 * LIMITATIONS:
 * - Tables: Basic support only (converted to plain lists)
 * - Page breaks: Not supported
 * - Comments/Track changes: Ignored
 * - Complex formatting: May be simplified
 * - Embedded objects: Not supported
 */

document.addEventListener('DOMContentLoaded', function() {
    const importBtn = document.getElementById('importDocx');
    const fileInput = document.getElementById('docxFileInput');

    // Defensive checks
    if (!importBtn) {
        console.error('❌ Import button not found');
        return;
    }

    if (!fileInput) {
        console.error('❌ File input not found');
        return;
    }

    // Check if mammoth.js is loaded
    if (typeof mammoth === 'undefined') {
        console.error('❌ mammoth.js not loaded - disabling import');
        importBtn.disabled = true;
        importBtn.title = 'DOCX import unavailable (library not loaded)';
        return;
    }

    // Setup event listeners
    importBtn.addEventListener('click', handleImportClick);
    fileInput.addEventListener('change', handleFileSelect);

    console.log('✅ DOCX import module loaded');
});

// ========================================
// EVENT HANDLERS
// ========================================

/**
 * Handle import button click
 */
function handleImportClick() {
    if (typeof quill === 'undefined' || !quill) {
        alert('❌ Editor not initialized. Please refresh the page.');
        return;
    }

    // Trigger file input
    const fileInput = document.getElementById('docxFileInput');
    fileInput.click();
}

/**
 * Handle file selection
 */
async function handleFileSelect(event) {
    const file = event.target.files[0];

    // No file selected (user cancelled)
    if (!file) {
        return;
    }

    console.log('📄 File selected:', file.name, `(${formatFileSize(file.size)})`);

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.docx')) {
        alert('⚠️ Invalid file type. Please select a .docx file.');
        resetFileInput();
        return;
    }

    // Validate file size (max 20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
        alert('⚠️ File too large. Maximum size is 20MB.');
        resetFileInput();
        return;
    }

    // Check for existing content
    const hasContent = quill.getText().trim().length > 0;
    if (hasContent) {
        const confirmed = confirm(
            '⚠️ You have existing content in the editor.\n\n' +
            'Importing will REPLACE all current content.\n\n' +
            'Click OK to continue, or Cancel to abort.'
        );

        if (!confirmed) {
            resetFileInput();
            return;
        }
    }

    // Show loading state
    const importBtn = document.getElementById('importDocx');
    const originalText = importBtn.textContent;
    importBtn.disabled = true;
    importBtn.textContent = '⏳ Importing...';

    try {
        await importDocxFile(file);
        alert('✅ Document imported successfully!');
    } catch (error) {
        console.error('❌ Import failed:', error);
        alert(
            '❌ Failed to import document.\n\n' +
            'This could be due to:\n' +
            '• Corrupted file\n' +
            '• Unsupported DOCX format\n' +
            '• Password-protected document\n\n' +
            'Error: ' + error.message
        );
    } finally {
        // Restore button state
        importBtn.disabled = false;
        importBtn.textContent = originalText;
        resetFileInput();
    }
}

// ========================================
// CORE IMPORT LOGIC
// ========================================

/**
 * Import DOCX file and insert into editor
 */
async function importDocxFile(file) {
    console.log('🔄 Starting DOCX conversion...');

    // Read file as ArrayBuffer
    const arrayBuffer = await readFileAsArrayBuffer(file);
    console.log('✅ File read complete:', arrayBuffer.byteLength, 'bytes');

    // Convert DOCX to HTML with image support
    const result = await convertDocxToHtml(arrayBuffer);
    console.log('✅ Conversion complete');
    console.log('📊 HTML length:', result.value.length, 'characters');
    console.log('📊 Messages:', result.messages.length);

    // Log any conversion warnings
    if (result.messages.length > 0) {
        console.warn('⚠️ Conversion warnings:');
        result.messages.forEach(msg => console.warn('  -', msg.message));
    }

    // Insert HTML into Quill editor
    insertHtmlIntoQuill(result.value);

    console.log('✅ Import complete');
}

/**
 * Read file as ArrayBuffer
 */
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            resolve(event.target.result);
        };

        reader.onerror = (error) => {
            reject(new Error('Failed to read file: ' + error));
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Convert DOCX to HTML using mammoth.js
 * WITH IMAGE SUPPORT (base64 conversion)
 */
async function convertDocxToHtml(arrayBuffer) {
    const options = {
        arrayBuffer: arrayBuffer,
        
        // Style mappings for better HTML conversion
        styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Title'] => h1:fresh",
            "p[style-name='Subtitle'] => h2:fresh",
            "b => strong",
            "i => em",
            "u => u"
        ],

        // CRITICAL: Convert images to base64 data URIs
        convertImage: mammoth.images.imgElement(function(image) {
            return image.read("base64").then(function(imageBuffer) {
                // Create data URI from image buffer
                const dataUri = "data:" + image.contentType + ";base64," + imageBuffer;
                
                console.log('🖼️ Image converted:', image.contentType, `(${formatFileSize(imageBuffer.length)})`);
                
                return {
                    src: dataUri
                };
            });
        })
    };

    // Perform conversion
    return await mammoth.convertToHtml(options);
}

/**
 * Insert HTML into Quill editor safely
 */
function insertHtmlIntoQuill(html) {
    if (typeof quill === 'undefined' || !quill) {
        throw new Error('Quill editor not available');
    }

    // Clear existing content
    quill.setText('');

    // Insert HTML using Quill's clipboard API
    // This ensures proper Delta conversion and formatting
    const delta = quill.clipboard.convert(html);
    quill.setContents(delta);

    // Clear history to prevent undo back to old content
    quill.history.clear();

    // Move cursor to start
    quill.setSelection(0, 0);

    // Trigger autosave if available
    if (typeof triggerAutosave === 'function') {
        setTimeout(triggerAutosave, 500);
    }

    console.log('✅ Content inserted into editor');
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Reset file input to allow re-importing same file
 */
function resetFileInput() {
    const fileInput = document.getElementById('docxFileInput');
    if (fileInput) {
        fileInput.value = '';
    }
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if mammoth.js is available
 */
function isMammothAvailable() {
    return typeof mammoth !== 'undefined';
}

// ========================================
// KNOWN LIMITATIONS (for documentation)
// ========================================

/**
 * WHAT WORKS:
 * ✅ Headings (H1, H2, H3)
 * ✅ Bold, Italic, Underline
 * ✅ Bullet lists
 * ✅ Numbered lists
 * ✅ Paragraphs with proper spacing
 * ✅ Inline images (converted to base64)
 * ✅ Text colors (basic)
 * ✅ Links (hyperlinks)
 * 
 * PARTIAL SUPPORT:
 * ⚠️ Tables (converted to basic lists)
 * ⚠️ Font families (defaults to editor font)
 * ⚠️ Complex nested formatting
 * 
 * NOT SUPPORTED:
 * ❌ Page breaks
 * ❌ Headers/Footers
 * ❌ Footnotes/Endnotes
 * ❌ Comments
 * ❌ Track changes
 * ❌ Embedded objects (charts, SmartArt)
 * ❌ Text boxes
 * ❌ Shapes/Drawing objects
 * ❌ Macros
 * ❌ Password-protected documents
 */
