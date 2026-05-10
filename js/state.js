const App = {
  state: {
    elements: [],
    selectedId: null,
    history: [],
    historyIndex: -1,
    preview: false,
    device: 'desktop',
    nextId: 1
  },

  defaults: {
    heading: {
      content: 'Heading Text',
      styles: { left: 60, top: 60, width: 400, height: 'auto', color: '#e1e1e6', backgroundColor: 'transparent', fontSize: 32, fontFamily: "'Inter', sans-serif", fontWeight: 700, fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', padding: '8px 16px', borderRadius: 4, opacity: 1, zIndex: 1, lineHeight: 1.3, letterSpacing: 'normal' }
    },
    paragraph: {
      content: 'This is a paragraph block. Double-click to edit. Change its style in the properties panel.',
      styles: { left: 60, top: 140, width: 500, height: 'auto', color: '#a1a1aa', backgroundColor: 'transparent', fontSize: 16, fontFamily: "'Inter', sans-serif", fontWeight: 400, fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', padding: '8px 16px', borderRadius: 4, opacity: 1, zIndex: 1, lineHeight: 1.7, letterSpacing: 'normal' }
    },
    text: {
      content: 'Inline text block',
      styles: { left: 60, top: 300, width: 300, height: 'auto', color: '#e1e1e6', backgroundColor: 'transparent', fontSize: 18, fontFamily: "'Inter', sans-serif", fontWeight: 400, fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', padding: '8px 16px', borderRadius: 4, opacity: 1, zIndex: 1, lineHeight: 1.5, letterSpacing: 'normal' }
    },
    button: {
      content: 'Click Me', href: '',
      styles: { left: 60, top: 380, width: 200, height: 'auto', color: '#ffffff', backgroundColor: 'transparent', fontSize: 16, fontFamily: "'Inter', sans-serif", fontWeight: 600, fontStyle: 'normal', textDecoration: 'none', textAlign: 'center', padding: '0', borderRadius: 8, opacity: 1, zIndex: 1, lineHeight: 1, letterSpacing: 'normal', buttonBg: '#6c5ce7', buttonTextColor: '#ffffff', buttonBorderRadius: 8, buttonPadding: '14px 32px' }
    },
    image: {
      src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80', alt: 'Abstract art',
      styles: { left: 60, top: 480, width: 400, height: 'auto', color: '#e1e1e6', backgroundColor: '#18181c', fontSize: 16, fontFamily: "'Inter', sans-serif", fontWeight: 400, fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', padding: '0', borderRadius: 8, opacity: 1, zIndex: 1, lineHeight: 1.5, letterSpacing: 'normal' }
    },
    video: {
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      styles: { left: 60, top: 600, width: 480, height: 270, color: '#e1e1e6', backgroundColor: '#0a0a0b', fontSize: 16, fontFamily: "'Inter', sans-serif", fontWeight: 400, fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', padding: '0', borderRadius: 8, opacity: 1, zIndex: 1, lineHeight: 1.5, letterSpacing: 'normal' }
    },
    container: {
      content: 'Container',
      styles: { left: 60, top: 60, width: 600, height: 300, color: '#e1e1e6', backgroundColor: 'rgba(255,255,255,0.03)', fontSize: 16, fontFamily: "'Inter', sans-serif", fontWeight: 400, fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', padding: '20px', borderRadius: 8, opacity: 1, zIndex: 0, lineHeight: 1.5, letterSpacing: 'normal', borderWidth: 1, borderStyle: 'solid', borderColor: '#2a2a2e' }
    },
    divider: {
      styles: { left: 60, top: 60, width: 600, height: 20, color: '#2a2a2e', backgroundColor: 'transparent', fontSize: 16, fontFamily: "'Inter', sans-serif", fontWeight: 400, fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', padding: '0', borderRadius: 0, opacity: 1, zIndex: 1, lineHeight: 1.5, letterSpacing: 'normal', dividerThickness: 1 }
    },
    spacer: {
      styles: { left: 60, top: 60, width: 600, height: 40, color: '#e1e1e6', backgroundColor: 'transparent', fontSize: 16, fontFamily: "'Inter', sans-serif", fontWeight: 400, fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', padding: '0', borderRadius: 0, opacity: 1, zIndex: 1, lineHeight: 1.5, letterSpacing: 'normal' }
    },
    icon: {
      icon: 'fa-star', content: '',
      styles: { left: 60, top: 60, width: 64, height: 64, color: '#6c5ce7', backgroundColor: 'transparent', fontSize: 32, fontFamily: "'Inter', sans-serif", fontWeight: 400, fontStyle: 'normal', textDecoration: 'none', textAlign: 'center', padding: '0', borderRadius: 0, opacity: 1, zIndex: 1, lineHeight: 1, letterSpacing: 'normal' }
    },
    input: {
      content: 'Placeholder text...',
      styles: { left: 60, top: 60, width: 320, height: 44, color: '#9e9ea6', backgroundColor: '#18181c', fontSize: 14, fontFamily: "'Inter', sans-serif", fontWeight: 400, fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', padding: '0 14px', borderRadius: 6, opacity: 1, zIndex: 1, lineHeight: '44px', letterSpacing: 'normal', borderWidth: 1, borderStyle: 'solid', borderColor: '#2a2a2e' }
    },
    textarea: {
      content: 'Placeholder text...',
      styles: { left: 60, top: 60, width: 320, height: 120, color: '#9e9ea6', backgroundColor: '#18181c', fontSize: 14, fontFamily: "'Inter', sans-serif", fontWeight: 400, fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', padding: '10px 14px', borderRadius: 6, opacity: 1, zIndex: 1, lineHeight: 1.5, letterSpacing: 'normal', borderWidth: 1, borderStyle: 'solid', borderColor: '#2a2a2e' }
    }
  },

  newId() { return 'el_' + (this.state.nextId++); },

  createElement(type, x, y) {
    const def = this.defaults[type];
    if (!def) return null;
    const el = { id: this.newId(), type, content: def.content || '', src: def.src || '', alt: def.alt || '', embedUrl: def.embedUrl || '', href: def.href || '', icon: def.icon || '', styles: { ...def.styles } };
    if (x !== undefined) el.styles.left = Math.round(x);
    if (y !== undefined) el.styles.top = Math.round(y);
    return el;
  },

  _saveTimer: null,
  saveState() {
    this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
    this.state.history.push(JSON.parse(JSON.stringify(this.state.elements)));
    this.state.historyIndex = this.state.history.length - 1;
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(saveToStorage, 300);
  },

  undo() {
    if (this.state.historyIndex > 0) {
      this.state.historyIndex--;
      this.state.elements = JSON.parse(JSON.stringify(this.state.history[this.state.historyIndex]));
      renderCanvas();
    }
  },

  redo() {
    if (this.state.historyIndex < this.state.history.length - 1) {
      this.state.historyIndex++;
      this.state.elements = JSON.parse(JSON.stringify(this.state.history[this.state.historyIndex]));
      renderCanvas();
    }
  }
};
