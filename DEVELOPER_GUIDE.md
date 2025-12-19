# 👨‍💻 Developer Quick Reference

A cheat sheet for working with the Smart Document Editor codebase.

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/doc-editor.git
cd doc-editor

# Open in browser
open index.html  # macOS
start index.html # Windows

# Or use local server
python -m http.server 8000
# Visit: http://localhost:8000
```

---

## 📁 File Structure Overview

```
doc-editor/
├── index.html              # Main entry point
├── assets/
│   ├── css/
│   │   └── style.css       # All styles (350 lines)
│   └── js/
│       ├── editor.js       # Core editor logic (400 lines)
│       ├── storage.js      # Save/load (300 lines)
│       └── export.js       # PDF export (250 lines)
├── README.md               # Main documentation
├── DEPLOYMENT.md           # Deployment guide
├── CODE_REVIEW.md          # Code quality analysis
└── DEVELOPER_GUIDE.md      # This file
```

---

## 🔑 Key Global Variables

| Variable | Type | Scope | Purpose |
|----------|------|-------|---------|
| `quill` | Quill | Global | Main editor instance |
| `wordCountTimer` | Number | Global | Debounce timer ID |
| `autosaveTimer` | Number | Global | Autosave timer ID |
| `STORAGE_KEY` | String | Constant | LocalStorage key |
| `AUTOSAVE_DELAY` | Number | Constant | 2000ms delay |

---

## 📚 Core Functions Reference

### editor.js

#### `initializeEditor()`
```javascript
// Initializes Quill.js with toolbar configuration
// Call: Automatically on DOMContentLoaded
// Returns: void
```

#### `toggleDarkMode()`
```javascript
// Toggles between light and dark themes
// Call: Click dark mode button or programmatically
// Persists: localStorage.setItem('theme', 'dark'|'light')
```

#### `updateWordCount()`
```javascript
// Counts words and characters in document
// Call: Debounced on every text-change event
// Updates: #wordCount element in footer
```

#### `createNewDocument()`
```javascript
// Clears editor and creates blank document
// Confirms: Shows confirmation dialog
// Clears: Content + undo history
```

---

### storage.js

#### `performSave(isAutomatic: boolean)`
```javascript
// Saves document to localStorage
// Format: Quill Delta JSON
// Error handling: Quota exceeded, corrupted data
// UI feedback: Updates autosave status
```

#### `loadSavedDocument()`
```javascript
// Loads document from localStorage
// Called: On page load + manual load button
// Fallback: Handles missing/corrupted data gracefully
```

#### `triggerAutosave()`
```javascript
// Debounced autosave trigger (2s delay)
// Resets timer on every keystroke
// Saves only after user pauses typing
```

---

### export.js

#### `exportToPDF()`
```javascript
// Exports document to PDF file
// Library: html2pdf.js
// Process: HTML → Canvas → PDF
// Filename: document_YYYY-MM-DD_HH-MM-SS.pdf
```

#### `createPDFContainer(content: string)`
```javascript
// Creates styled container for PDF rendering
// Applies: White background, print fonts, margins
// Positioning: Off-screen (-9999px) during render
// Returns: HTMLElement
```

---

## 🎨 CSS Architecture

### CSS Variables (Theme System)

```css
:root {
    /* Colors */
    --bg-primary: #ffffff;
    --bg-secondary: #f5f5f5;
    --text-primary: #333333;
    --accent-color: #4a90e2;
    
    /* Layout */
    --header-height: 60px;
    --toolbar-height: 50px;
    --spacing: 16px;
}

/* Dark mode overrides */
body.dark-mode {
    --bg-primary: #1e1e1e;
    --text-primary: #e0e0e0;
}
```

### Key Classes

| Class | Purpose |
|-------|---------|
| `.container` | Main flex container (full viewport) |
| `.toolbar` | Button toolbar (flex wrap) |
| `.btn` | Standard button styling |
| `.btn-icon` | Icon-only button (40×40px) |
| `.editor-wrapper` | Scrollable editor container |
| `.skip-link` | Accessibility skip navigation |

---

## ⌨️ Keyboard Shortcuts Implementation

```javascript
document.addEventListener('keydown', function(e) {
    // Ctrl+S: Save
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();  // Block browser save
        manualSave();
    }
    
    // Ctrl+P: Export PDF
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();  // Block browser print
        exportToPDF();
    }
    
    // Escape: Exit editor
    if (e.key === 'Escape') {
        document.activeElement.blur();
    }
});
```

---

## 🗄️ LocalStorage Data Structure

### Saved Document Format

```json
{
    "content": {
        "ops": [
            { "insert": "Hello ", "attributes": { "bold": true } },
            { "insert": "World\n" }
        ]
    },
    "timestamp": 1734649200000,
    "version": "1.0",
    "wordCount": 2
}
```

### Storage Key

```javascript
const STORAGE_KEY = 'smartDocEditor_content';

// Save
localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

// Load
const data = JSON.parse(localStorage.getItem(STORAGE_KEY));

// Clear
localStorage.removeItem(STORAGE_KEY);
```

---

## 🐛 Debugging Techniques

### Console Commands

```javascript
// Inspect Quill instance
console.log(quill);

// Get current content
console.log(quill.getContents());

// Get plain text
console.log(quill.getText());

// Get HTML
console.log(quill.root.innerHTML);

// Check localStorage
console.log(localStorage.getItem('smartDocEditor_content'));

// Force save
performSave(false);

// Clear storage
localStorage.clear();

// Check library loading
console.log(typeof Quill);      // "function"
console.log(typeof html2pdf);   // "function"
```

### Chrome DevTools

**Application Tab:**
- LocalStorage → file:// → smartDocEditor_content
- View/edit/delete saved documents

**Console Tab:**
- Run commands above
- Check for errors

**Network Tab:**
- Verify CDN libraries load
- Check for CORS issues

**Lighthouse Tab:**
- Run accessibility audit
- Check performance score

---

## 🧪 Testing Strategies

### Manual Test Cases

```javascript
// 1. Basic typing
// Action: Type "Hello World"
// Expected: Text appears in editor

// 2. Formatting
// Action: Select text, click Bold
// Expected: Text becomes bold

// 3. Autosave
// Action: Type, wait 2 seconds
// Expected: Footer shows "Autosave: ✓ Saved"

// 4. Page refresh
// Action: Refresh browser
// Expected: Content auto-restores

// 5. PDF export
// Action: Click "Export PDF"
// Expected: PDF downloads with formatting

// 6. Dark mode
// Action: Click moon icon
// Expected: UI switches to dark colors

// 7. Keyboard shortcuts
// Action: Press Ctrl+S
// Expected: Save alert appears
```

### Edge Cases to Test

```javascript
// 1. Empty document export
exportToPDF(); // Should show error

// 2. Very large document (10,000 lines)
// Should handle without crashing

// 3. LocalStorage full
// Fill storage, trigger save
// Should show quota error

// 4. Rapid typing
// Type as fast as possible
// Word count should update smoothly

// 5. Browser refresh during autosave
// Refresh mid-save
// Should complete save on next load
```

---

## 🔧 Common Modifications

### Change Autosave Delay

```javascript
// In storage.js
const AUTOSAVE_DELAY = 5000; // Change to 5 seconds
```

### Add Custom Toolbar Button

```html
<!-- In index.html toolbar -->
<button id="customBtn" class="btn">Custom</button>
```

```javascript
// In editor.js setupEventListeners()
document.getElementById('customBtn').addEventListener('click', () => {
    alert('Custom action!');
});
```

### Change PDF Page Size

```javascript
// In export.js PDF_OPTIONS
jsPDF: { 
    format: 'letter',  // or 'legal', 'a3'
    orientation: 'landscape'  // or 'portrait'
}
```

### Customize Dark Mode Colors

```css
/* In style.css */
body.dark-mode {
    --bg-primary: #1a1a1a;  /* Darker background */
    --accent-color: #66b3ff; /* Different accent */
}
```

---

## 📦 Adding New Features

### Feature: Find & Replace

```javascript
// 1. Add button to toolbar
<button id="findBtn" class="btn">Find</button>

// 2. Implement search function
function findInDocument(searchTerm) {
    const text = quill.getText();
    const index = text.indexOf(searchTerm);
    
    if (index !== -1) {
        quill.setSelection(index, searchTerm.length);
    } else {
        alert('Not found');
    }
}

// 3. Add event listener
document.getElementById('findBtn').addEventListener('click', () => {
    const term = prompt('Find:');
    if (term) findInDocument(term);
});
```

### Feature: Document Templates

```javascript
// 1. Define templates
const TEMPLATES = {
    letter: {
        content: { ops: [
            { insert: 'Dear [Name],\n\n' },
            { insert: 'Sincerely,\n[Your Name]' }
        ]}
    },
    resume: {
        content: { ops: [
            { insert: 'Your Name\n', attributes: { header: 1 } },
            { insert: 'Email | Phone | LinkedIn\n\n' }
        ]}
    }
};

// 2. Add load template function
function loadTemplate(templateName) {
    const template = TEMPLATES[templateName];
    quill.setContents(template.content);
}

// 3. Add UI
<select id="templateSelect">
    <option value="">Choose Template</option>
    <option value="letter">Letter</option>
    <option value="resume">Resume</option>
</select>
```

---

## 🚨 Common Errors & Solutions

### Error: "Quill is not defined"

**Cause:** Quill.js CDN failed to load  
**Solution:**
```javascript
if (typeof Quill === 'undefined') {
    alert('Editor failed to load. Please refresh.');
    console.error('Quill.js not loaded');
}
```

### Error: "Cannot read property 'getContents' of null"

**Cause:** Accessing `quill` before initialization  
**Solution:** Ensure `DOMContentLoaded` event fires first

### Error: "QuotaExceededError"

**Cause:** LocalStorage full (5-10MB limit)  
**Solution:** Already handled in `handleSaveError()`

### Error: PDF export hangs

**Cause:** Document too large (>1000 lines)  
**Solution:** Add warning for large documents

```javascript
if (quill.getText().length > 50000) {
    alert('Large document detected. Export may take 30 seconds.');
}
```

---

## 📊 Performance Tips

### Optimization Checklist

- [ ] Debounce frequent operations (word count, autosave)
- [ ] Clean up event listeners on page unload
- [ ] Lazy load non-critical libraries
- [ ] Minimize DOM manipulations
- [ ] Use CSS transforms instead of layout properties
- [ ] Cache DOM queries

### Performance Monitoring

```javascript
// Measure function performance
console.time('wordCount');
updateWordCount();
console.timeEnd('wordCount');
// Output: wordCount: 0.5ms

// Track localStorage size
const size = new Blob([
    localStorage.getItem(STORAGE_KEY)
]).size / 1024;
console.log(`Storage: ${size.toFixed(2)} KB`);
```

---

## 🎯 Interview Preparation

### Key Points to Explain

1. **Why Quill.js over ContentEditable?**
   - Cross-browser consistency
   - Built-in undo/redo
   - Delta format for data storage

2. **Debouncing vs Throttling?**
   - Debounce: Wait until user stops
   - Throttle: Execute at fixed intervals
   - Used debounce for better UX

3. **Why LocalStorage?**
   - No backend needed
   - Instant save/load
   - 5-10MB capacity (sufficient)

4. **Accessibility Implementation?**
   - ARIA labels on all buttons
   - Keyboard navigation
   - Screen reader support
   - Focus indicators

5. **How would you scale this?**
   - Add backend API (Express.js)
   - Use IndexedDB for larger storage
   - Implement real-time sync (WebSockets)
   - Add user authentication

---

## 📞 Getting Help

### Resources

- **Quill.js Docs:** https://quilljs.com/docs/
- **html2pdf.js:** https://github.com/eKoopmans/html2pdf.js
- **MDN Web Docs:** https://developer.mozilla.org/
- **Stack Overflow:** Tag: `quilljs`, `javascript`

### Debug Logs

All modules log their initialization:
```
📝 Editor module loaded successfully
💾 Storage module loaded successfully
📄 Export module loaded successfully
✅ Quill editor initialized successfully
```

Check console for these messages to verify loading.

---

**Happy Coding! 🚀**

For questions or contributions, check the main [README.md](README.md).
