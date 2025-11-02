document.addEventListener('DOMContentLoaded', () => {
  // --- DOM ELEMENTS ---
  const themeSelect = document.getElementById('theme-select');
  const wrapToggle = document.getElementById('wrap-toggle');
  const toggleFoldBtn = document.getElementById('toggle-fold-btn');
  const formatBtn = document.getElementById('format-btn');
  const minifyBtn = document.getElementById('minify-btn');

  // --- CODEMIRROR SETUP ---
  const editor = CodeMirror.fromTextArea(document.getElementById('json-editor'), {
    mode: "application/json",
    lineNumbers: true,
    theme: "dracula",
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    extraKeys: {
      "Ctrl-F": "findPersistent",
      "Cmd-F": "findPersistent"
    }
  });

  // --- STATE ---
  let currentTheme = 'dracula';
  let wrap = false;
  let isFolded = false;

  // --- THEME HANDLING ---
  const THEMES = [
    'default', 'dracula', 'material', 'monokai', 'nord', 'solarized', 'twilight', 'base16-dark', 'base16-light'
  ];

  function loadTheme(themeName) {
    const themeLink = document.createElement('link');
    themeLink.rel = 'stylesheet';
    themeLink.href = `https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/theme/${themeName}.min.css`;
    document.head.appendChild(themeLink);
  }

  function initializeThemes() {
    themeSelect.innerHTML = THEMES.map(theme => `<option value="${theme}">${theme}</option>`).join('');
    themeSelect.value = currentTheme;
    loadTheme(currentTheme);
  }

  themeSelect.addEventListener('change', (e) => {
    currentTheme = e.target.value;
    loadTheme(currentTheme);
    editor.setOption("theme", currentTheme);
  });

  // --- EDITOR BEHAVIOR ---
  wrapToggle.addEventListener('change', (e) => {
    wrap = e.target.checked;
    editor.setOption("lineWrapping", wrap);
  });

  toggleFoldBtn.addEventListener('click', () => {
    if (isFolded) {
      editor.execCommand('unfoldAll');
    } else {
      foldToLevel(2);
    }
    isFolded = !isFolded;
  });

  function foldToLevel(level) {
    editor.operation(() => {
      for (let i = 0; i < editor.lineCount(); i++) {
        const lineInfo = editor.lineInfo(i);
        const indent = lineInfo.text.match(/^(\s*)/)[1].length;
        if (indent >= level * 2) { // Assuming 2 spaces per indent level
          editor.foldCode(i, null, "fold");
        }
      }
    });
  }

  // --- JSON PROCESSING ---
  formatBtn.addEventListener('click', formatContent);
  minifyBtn.addEventListener('click', minifyContent);

  editor.on('paste', (cm, event) => {
    const text = event.clipboardData.getData('text/plain');
    const isFullReplace = editor.getValue().trim() === '' || editor.getSelection() === editor.getValue();
    if (isFullReplace && tryFormat(text)) {
      event.preventDefault();
    }
  });

  function tryParseJson(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Invalid JSON:", e.message);
      // Optionally, display an error to the user in the UI
      return null;
    }
  }

  function formatContent() {
    const rawText = editor.getValue();
    if (!rawText.trim()) return;

    const jsonObject = tryParseJson(rawText);
    if (jsonObject) {
      const formattedJson = JSON.stringify(jsonObject, null, 2);
      editor.setValue(formattedJson);
      foldToLevel(2);
      isFolded = true;
    }
  }

  function minifyContent() {
    const rawText = editor.getValue();
    if (!rawText.trim()) return;

    const jsonObject = tryParseJson(rawText);
    if (jsonObject) {
      const minifiedJson = JSON.stringify(jsonObject);
      editor.setValue(minifiedJson);
      isFolded = false;
    }
  }

  function tryFormat(text) {
    const jsonObject = tryParseJson(text);
    if (jsonObject) {
      const formattedJson = JSON.stringify(jsonObject, null, 2);
      editor.setValue(formattedJson);
      foldToLevel(2);
      isFolded = true;
      return true;
    }
    return false;
  }

  // --- INITIALIZATION ---
  function init() {
    initializeThemes();
    wrapToggle.checked = wrap;
    editor.setOption("lineWrapping", wrap);
    editor.focus();
  }

  init();
});
