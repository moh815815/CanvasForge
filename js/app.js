let canvas, canvasContainer, previewOverlay, previewCanvas, previewFrame;
let propertiesContent, canvasPlaceholder, layersContent;
let previewBtn, exitPreviewBtn, undoBtn, redoBtn, clearBtn, exportBtn, shortcutsBtn;
let zoomInBtn, zoomOutBtn, zoomResetBtn, zoomLevel;
let alignLeftBtn, alignCenterBtn, alignRightBtn;
let ctxMenu, closeShortcutsBtn;
let isDraggingElement = false, dragElementId = null, dragOffX = 0, dragOffY = 0;
let zoom = 1, rafId = null;
let copiedEl = null;
const LS_KEY = 'canvasforge_data';

function initApp() {
  canvas = document.getElementById('canvas');
  canvasContainer = document.getElementById('canvasContainer');
  previewOverlay = document.getElementById('previewOverlay');
  previewCanvas = document.getElementById('previewCanvas');
  previewFrame = document.getElementById('previewFrame');
  propertiesContent = document.getElementById('propertiesContent');
  canvasPlaceholder = document.getElementById('canvasPlaceholder');
  layersContent = document.getElementById('layersContent');
  previewBtn = document.getElementById('previewBtn');
  exitPreviewBtn = document.getElementById('exitPreviewBtn');
  undoBtn = document.getElementById('undoBtn');
  redoBtn = document.getElementById('redoBtn');
  clearBtn = document.getElementById('clearBtn');
  exportBtn = document.getElementById('exportBtn');
  shortcutsBtn = document.getElementById('shortcutsBtn');
  zoomInBtn = document.getElementById('zoomInBtn');
  zoomOutBtn = document.getElementById('zoomOutBtn');
  zoomResetBtn = document.getElementById('zoomResetBtn');
  zoomLevel = document.getElementById('zoomLevel');
  alignLeftBtn = document.getElementById('alignLeftBtn');
  alignCenterBtn = document.getElementById('alignCenterBtn');
  alignRightBtn = document.getElementById('alignRightBtn');
  ctxMenu = document.getElementById('ctxMenu');
  closeShortcutsBtn = document.getElementById('closeShortcutsBtn');

  loadFromStorage();
  if (App.state.elements.length === 0) App.saveState();

  previewBtn.addEventListener('click', togglePreview);
  exitPreviewBtn.addEventListener('click', togglePreview);
  undoBtn.addEventListener('click', () => { if (!App.state.preview) { App.undo(); selectElement(null); } });
  redoBtn.addEventListener('click', () => { if (!App.state.preview) { App.redo(); selectElement(null); } });
  clearBtn.addEventListener('click', clearCanvas);
  exportBtn.addEventListener('click', showExportModal);
  shortcutsBtn.addEventListener('click', showShortcutsModal);
  if (closeShortcutsBtn) closeShortcutsBtn.addEventListener('click', hideShortcutsModal);

  zoomInBtn.addEventListener('click', () => setZoom(zoom + 0.1));
  zoomOutBtn.addEventListener('click', () => setZoom(zoom - 0.1));
  zoomResetBtn.addEventListener('click', () => setZoom(1));

  alignLeftBtn.addEventListener('click', () => alignSelected('left'));
  alignCenterBtn.addEventListener('click', () => alignSelected('center'));
  alignRightBtn.addEventListener('click', () => alignSelected('right'));

  document.querySelectorAll('.device-btn').forEach(btn => {
    btn.addEventListener('click', () => switchDevice(btn.dataset.device));
  });

  document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', () => switchSidebarTab(tab.dataset.tab));
  });

  document.addEventListener('keydown', handleKeydown);

  canvas.addEventListener('click', (e) => {
    if (e.target === canvas || e.target.closest('#canvasPlaceholder')) selectElement(null);
  });

  canvas.addEventListener('contextmenu', (e) => {
    const el = e.target.closest('.canvas-element');
    if (el) { e.preventDefault(); showContextMenu(el.dataset.id, e.clientX, e.clientY); }
    else hideContextMenu();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#ctxMenu')) hideContextMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideContextMenu();
  });

  // Context menu actions
  document.getElementById('ctxMenu').addEventListener('click', (e) => {
    const item = e.target.closest('.ctx-item');
    if (!item) return;
    const action = item.dataset.action;
    const id = ctxMenu.dataset.elId;
    if (!id) return;
    switch (action) {
      case 'bringFront': bringToFront(id); break;
      case 'sendBack': sendToBack(id); break;
      case 'duplicate': duplicateElement(id); break;
      case 'copy': copyElement(id); break;
      case 'delete': deleteElement(id); break;
    }
    hideContextMenu();
  });

  initDragDrop();
  initProperties();
  renderCanvas();
}

/* ─── Storage ─── */
function saveToStorage() {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ elements: App.state.elements, nextId: App.state.nextId })); }
  catch (_) { /* storage full or unavailable */ }
}
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.elements) App.state.elements = data.elements;
    if (data.nextId) App.state.nextId = data.nextId;
  } catch (_) { /* ignore corrupt data */ }
}
function clearStorage() {
  try { localStorage.removeItem(LS_KEY); } catch (_) {}
}

/* ─── Context Menu ─── */
function showContextMenu(id, x, y) {
  ctxMenu.dataset.elId = id;
  ctxMenu.style.left = Math.min(x, window.innerWidth - 200) + 'px';
  ctxMenu.style.top = Math.min(y, window.innerHeight - 200) + 'px';
  ctxMenu.classList.add('show');
}
function hideContextMenu() { ctxMenu.classList.remove('show'); delete ctxMenu.dataset.elId; }

/* ─── Z-Index ─── */
function bringToFront(id) {
  const el = App.state.elements.find(e => e.id === id);
  if (!el) return;
  const maxZ = Math.max(...App.state.elements.map(e => e.styles.zIndex || 1), 1);
  el.styles.zIndex = maxZ + 1;
  App.saveState(); renderCanvas();
}
function sendToBack(id) {
  const el = App.state.elements.find(e => e.id === id);
  if (!el) return;
  const minZ = Math.min(...App.state.elements.map(e => e.styles.zIndex || 1), 1);
  el.styles.zIndex = Math.max(0, minZ - 1);
  App.saveState(); renderCanvas();
}

/* ─── Copy / Paste ─── */
function copyElement(id) {
  const el = App.state.elements.find(e => e.id === id);
  if (el) { copiedEl = JSON.parse(JSON.stringify(el)); }
}
function pasteElement() {
  if (!copiedEl) return;
  const c = JSON.parse(JSON.stringify(copiedEl));
  c.id = App.newId();
  c.styles.left += 30;
  c.styles.top += 30;
  App.state.elements.push(c);
  App.saveState(); renderCanvas(); selectElement(c.id);
}

/* ─── Shortcuts Modal ─── */
function showShortcutsModal() {
  const m = document.getElementById('shortcutsModal');
  if (m) { m.removeAttribute('hidden'); m.classList.add('active'); document.getElementById('closeShortcutsBtn')?.focus(); }
}
function hideShortcutsModal() {
  const m = document.getElementById('shortcutsModal');
  if (m) { m.setAttribute('hidden', ''); m.classList.remove('active'); shortcutsBtn?.focus(); }
}

function switchSidebarTab(tab) {
  document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.toggle('active', t.id === 'tab' + tab.charAt(0).toUpperCase() + tab.slice(1)));
}

function handleKeydown(e) {
  if (App.state.preview && e.key === 'Escape') { togglePreview(); return; }
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    if (e.key === 'Escape') { e.target.blur(); return; }
    return;
  }

  if (e.key === '?' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); showShortcutsModal(); return; }
  if (e.key === 'Escape') { hideShortcutsModal(); selectElement(null); if (App.state.preview) togglePreview(); hideContextMenu(); }

  if (e.ctrlKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); App.undo(); selectElement(null); }
  if ((e.ctrlKey && e.key === 'z' && e.shiftKey) || (e.ctrlKey && e.key === 'Z')) { e.preventDefault(); App.redo(); selectElement(null); }
  if ((e.key === 'Delete' || e.key === 'Backspace') && App.state.selectedId) { e.preventDefault(); deleteElement(App.state.selectedId); }
  if (e.ctrlKey && e.key === 'd') { e.preventDefault(); if (App.state.selectedId) duplicateElement(App.state.selectedId); }
  if (e.ctrlKey && e.key === 'p') { e.preventDefault(); togglePreview(); }
  if (e.ctrlKey && e.key === '=') { e.preventDefault(); setZoom(zoom + 0.1); }
  if (e.ctrlKey && e.key === '-') { e.preventDefault(); setZoom(zoom - 0.1); }
  if (e.ctrlKey && e.key === '0') { e.preventDefault(); setZoom(1); }

  // Copy / Paste
  if (e.ctrlKey && (e.key === 'c' || e.key === 'C') && App.state.selectedId) { e.preventDefault(); copyElement(App.state.selectedId); }
  if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) { e.preventDefault(); pasteElement(); }
}

function renderCanvas() {
  canvas.innerHTML = '';
  if (App.state.elements.length === 0) {
    const ph = canvasPlaceholder.cloneNode(true);
    ph.id = 'canvasPlaceholder';
    canvas.appendChild(ph);
  }
  const sorted = [...App.state.elements].sort((a, b) => (a.styles.zIndex || 1) - (b.styles.zIndex || 1));
  sorted.forEach(el => canvas.appendChild(createElementDOM(el)));
  updateUndoRedo();
  renderPreview();
  renderLayers();
}

function renderPreview() {
  previewCanvas.innerHTML = '';
  const sorted = [...App.state.elements].sort((a, b) => (a.styles.zIndex || 1) - (b.styles.zIndex || 1));
  sorted.forEach(el => previewCanvas.appendChild(createElementDOM(el, true)));
}

function createElementDOM(el, isPreview) {
  const s = el.styles;
  const div = document.createElement('div');
  div.className = 'canvas-element' + (App.state.selectedId === el.id && !isPreview ? ' selected' : '');
  div.dataset.id = el.id;
  div.style.cssText = `position:absolute;left:${s.left}px;top:${s.top}px;width:${typeof s.width==='number'?s.width+'px':s.width};${s.height&&s.height!=='auto'?'height:'+(typeof s.height==='number'?s.height+'px':s.height)+';':''}color:${s.color};background:${s.backgroundColor};font-size:${s.fontSize}px;font-family:${s.fontFamily};font-weight:${s.fontWeight};font-style:${s.fontStyle||'normal'};text-decoration:${s.textDecoration||'none'};text-align:${s.textAlign};padding:${s.padding};border-radius:${s.borderRadius}px;opacity:${s.opacity};z-index:${s.zIndex||1};line-height:${s.lineHeight||1.5};letter-spacing:${s.letterSpacing||'normal'};${s.borderWidth?'border:'+s.borderWidth+'px '+(s.borderStyle||'solid')+' '+(s.borderColor||'transparent')+';':''}`;

  switch (el.type) {
    case 'heading': div.innerHTML = `<h2>${esc(el.content)}</h2>`; break;
    case 'paragraph': case 'text': div.innerHTML = `<p>${esc(el.content)}</p>`; break;
    case 'button': div.innerHTML = `<button class="el-btn" style="background:${s.buttonBg||'#6c5ce7'};color:${s.buttonTextColor||'#fff'};border-radius:${s.buttonBorderRadius||s.borderRadius||8}px;padding:${s.buttonPadding||'14px 32px'}">${esc(el.content)}</button>`; break;
    case 'image': div.innerHTML = `<img src="${esc(el.src)}" alt="${esc(el.alt||'')}" loading="lazy" />`; break;
    case 'video': div.innerHTML = `<div class="video-wrap"><iframe src="${esc(el.embedUrl)}" allowfullscreen loading="lazy"></iframe></div>`; break;
    case 'container': div.innerHTML = `<div style="width:100%;height:100%;pointer-events:none;display:flex;align-items:center;justify-content:center;font-size:12px;opacity:0.4;color:inherit">${esc(el.content||'Container')}</div>`; break;
    case 'divider': div.innerHTML = `<hr style="border-top-width:${s.dividerThickness||1}px;border-color:${s.color||'#2a2a2e'}" />`; break;
    case 'spacer': div.style.minHeight = '1px'; break;
    case 'icon': div.innerHTML = `<span class="el-icon"><i class="fas ${el.icon||'fa-star'}"></i></span>`; break;
    case 'input': div.innerHTML = `<input class="el-input" type="text" placeholder="${esc(el.content)}" readonly />`; break;
    case 'textarea': div.innerHTML = `<textarea class="el-textarea" placeholder="${esc(el.content)}" readonly></textarea>`; break;
  }

  if (!isPreview) {
    const acts = document.createElement('div');
    acts.className = 'el-actions';
    acts.innerHTML = `<button class="el-dup" title="Duplicate (Ctrl+D)"><i class="fas fa-copy"></i></button><button class="el-del" title="Delete (Del)"><i class="fas fa-trash"></i></button>`;
    div.appendChild(acts);

    ['nw','ne','sw','se','n','s','e','w'].forEach(p => {
      const h = document.createElement('div');
      h.className = 'resize-handle ' + p;
      div.appendChild(h);
    });

    div.addEventListener('click', (e) => { e.stopPropagation(); selectElement(el.id); });
    div.addEventListener('mousedown', (e) => { if (e.target.closest('.el-actions')||e.target.closest('.resize-handle')) return; e.preventDefault(); startMove(el.id, e); });

    if (['heading','paragraph','text','button','input','textarea'].includes(el.type)) {
      div.addEventListener('dblclick', (e) => { e.stopPropagation(); startInlineEdit(el.id); });
    }
  }
  return div;
}

function selectElement(id) {
  if (App.state.preview) return;
  App.state.selectedId = id;
  renderCanvas();
  id ? showProperties(id) : hideProperties();
}

function clearCanvas() {
  if (App.state.elements.length === 0) return;
  if (!confirm('Clear all elements from the canvas?')) return;
  App.state.elements = []; App.state.history = []; App.state.historyIndex = -1;
  selectElement(null);
  clearStorage();
  App.saveState();
  renderCanvas();
}

function deleteElement(id) {
  const i = App.state.elements.findIndex(e => e.id === id);
  if (i === -1) return;
  App.state.elements.splice(i, 1);
  if (App.state.selectedId === id) selectElement(null);
  App.saveState();
  renderCanvas();
}

function duplicateElement(id) {
  const el = App.state.elements.find(e => e.id === id);
  if (!el) return;
  const c = JSON.parse(JSON.stringify(el));
  c.id = App.newId();
  c.styles.left += 20; c.styles.top += 20;
  App.state.elements.push(c);
  App.saveState();
  renderCanvas();
  selectElement(c.id);
}

function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function updateUndoRedo() {
  undoBtn.style.opacity = App.state.historyIndex <= 0 ? '0.35' : '1';
  redoBtn.style.opacity = App.state.historyIndex >= App.state.history.length - 1 ? '0.35' : '1';
}

/* Preview */
function togglePreview() {
  App.state.preview = !App.state.preview;
  previewOverlay.classList.toggle('active', App.state.preview);
  previewBtn.classList.toggle('active', App.state.preview);
  if (App.state.preview) renderPreview();
  else document.activeElement?.blur();
}

function switchDevice(device) {
  App.state.device = device;
  previewCanvas.className = 'canvas preview-' + device;
  document.querySelectorAll('.device-btn').forEach(b => b.classList.toggle('active', b.dataset.device === device));
}

/* Zoom */
function setZoom(v) {
  zoom = Math.max(0.25, Math.min(2, v));
  zoom = Math.round(zoom * 100) / 100;
  canvas.style.transform = `scale(${zoom})`;
  canvas.style.transformOrigin = 'top center';
  canvasContainer.style.minHeight = 700 * zoom + 'px';
  zoomLevel.textContent = Math.round(zoom * 100) + '%';
}

/* Export */
function showExportModal() {
  const html = generateHTML();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.id = 'exportModal';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header"><h3><i class="fas fa-file-export" style="color:var(--accent);margin-right:8px"></i>Export HTML</h3><button class="tool-btn" id="closeExportBtn"><i class="fas fa-times"></i></button></div>
      <div class="modal-body"><textarea id="exportCode" readonly></textarea></div>
      <div class="modal-footer">
        <button class="tool-btn" id="copyExportBtn"><i class="fas fa-copy"></i> Copy</button>
        <button class="tool-btn primary" id="downloadExportBtn"><i class="fas fa-download"></i> Download</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('exportCode').value = html;
  document.getElementById('closeExportBtn').onclick = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('copyExportBtn').onclick = () => {
    navigator.clipboard.writeText(html).then(() => {
      const btn = document.getElementById('copyExportBtn');
      btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i> Copy'; }, 2000);
    });
  };
  document.getElementById('downloadExportBtn').onclick = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'canvasforge-page.html';
    a.click();
  };
}

function generateHTML() {
  const els = App.state.elements;
  if (els.length === 0) return '<!-- Canvas is empty -->';

  let bodyStyle = 'margin:0;padding:20px;font-family:Inter,sans-serif;background:#ffffff;min-height:100vh';
  let elements = '';

  els.forEach(el => {
    const s = el.styles;
    let style = `position:relative;left:${s.left}px;top:${s.top}px;width:${typeof s.width==='number'?s.width+'px':s.width};${s.height&&s.height!=='auto'?'height:'+(typeof s.height==='number'?s.height+'px':s.height)+';':''}color:${s.color};background:${s.backgroundColor};font-size:${s.fontSize}px;font-family:${s.fontFamily};font-weight:${s.fontWeight};font-style:${s.fontStyle||'normal'};text-decoration:${s.textDecoration||'none'};text-align:${s.textAlign};padding:${s.padding};border-radius:${s.borderRadius}px;opacity:${s.opacity};line-height:${s.lineHeight||1.5};letter-spacing:${s.letterSpacing||'normal'};${s.borderWidth?'border:'+s.borderWidth+'px '+(s.borderStyle||'solid')+' '+(s.borderColor||'transparent')+';':''}margin-bottom:10px`;

    let content = '';
    switch (el.type) {
      case 'heading': content = `<h2 style="${style}">${esc(el.content)}</h2>`; break;
      case 'paragraph': case 'text': content = `<p style="${style}">${esc(el.content)}</p>`; break;
      case 'button': content = `<div style="${style}"><button style="background:${s.buttonBg||'#6c5ce7'};color:${s.buttonTextColor||'#fff'};border:none;border-radius:${s.buttonBorderRadius||s.borderRadius||8}px;padding:${s.buttonPadding||'14px 32px'};font-size:${s.fontSize}px;font-weight:${s.fontWeight};cursor:pointer;font-family:inherit">${esc(el.content)}</button></div>`; break;
      case 'image': content = `<div style="${style}"><img src="${esc(el.src)}" alt="${esc(el.alt||'')}" style="width:100%;height:auto;border-radius:inherit;display:block" /></div>`; break;
      case 'video': content = `<div style="${style};padding-bottom:56.25%;height:0;position:relative;overflow:hidden"><iframe src="${esc(el.embedUrl)}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none" allowfullscreen></iframe></div>`; break;
      case 'icon': content = `<div style="${style};display:flex;align-items:center;justify-content:center;font-size:${s.fontSize}px"><i class="fas ${el.icon||'fa-star'}"></i></div>`; break;
      case 'input': content = `<input type="text" placeholder="${esc(el.content)}" style="${style};padding:${s.padding||'0 14px'};border:${s.borderWidth||1}px ${s.borderStyle||'solid'} ${s.borderColor||'#ddd'}" />`; break;
      case 'textarea': content = `<textarea placeholder="${esc(el.content)}" style="${style};padding:${s.padding||'10px 14px'};border:${s.borderWidth||1}px ${s.borderStyle||'solid'} ${s.borderColor||'#ddd'};resize:vertical"></textarea>`; break;
      case 'container': content = `<div style="${style};min-height:${typeof s.height==='number'?s.height+'px':s.height||'200px'};display:flex;align-items:center;justify-content:center;color:${s.color};opacity:0.5;font-size:12px">${esc(el.content||'Container')}</div>`; break;
      case 'divider': content = `<hr style="${style};border:none;border-top:${s.dividerThickness||1}px solid ${s.color||'#ddd'};margin:0" />`; break;
      case 'spacer': content = `<div style="${style};min-height:${typeof s.height==='number'?s.height+'px':s.height||'40px'};background:transparent"></div>`; break;
    }
    elements += content + '\n    ';
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Page</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
</head>
<body style="${bodyStyle}">
  ${elements}
</body>
</html>`;
}

/* Layers */
function renderLayers() {
  if (!layersContent) return;
  const els = App.state.elements;
  if (els.length === 0) {
    layersContent.innerHTML = '<div class="layers-empty">No elements yet</div>';
    return;
  }
  let h = '';
  els.forEach((el, i) => {
    const sel = App.state.selectedId === el.id ? ' active' : '';
    const names = { heading:'Heading', paragraph:'Paragraph', text:'Text', button:'Button', image:'Image', video:'Video', container:'Container', divider:'Divider', spacer:'Spacer', icon:'Icon', input:'Input', textarea:'Textarea' };
    const icons = { heading:'fa-heading', paragraph:'fa-paragraph', text:'fa-font', button:'fa-hand-pointer', image:'fa-image', video:'fa-video', container:'fa-border-all', divider:'fa-grip-lines', spacer:'fa-arrows-alt-v', icon:'fa-star', input:'fa-i-cursor', textarea:'fa-align-left' };
    h += `<div class="layer-item${sel}" data-id="${el.id}">
      <i class="fas ${icons[el.type]||'fa-cube'}"></i>
      <span class="layer-name">${esc(names[el.type]||el.type)} ${el.content ? '- ' + esc(el.content.slice(0,30)) : ''}</span>
      <span class="layer-type">${el.type}</span>
    </div>`;
  });
  layersContent.innerHTML = h;
  layersContent.querySelectorAll('.layer-item').forEach(item => {
    item.addEventListener('click', () => selectElement(item.dataset.id));
  });
}

/* Align */
function alignSelected(align) {
  if (!App.state.selectedId) return;
  const el = App.state.elements.find(e => e.id === App.state.selectedId);
  if (!el) return;
  if (align === 'left') el.styles.textAlign = 'left';
  else if (align === 'center') el.styles.textAlign = 'center';
  else if (align === 'right') el.styles.textAlign = 'right';
  App.saveState();
  renderCanvas();
  showProperties(el.id);
}

/* Element movement */
function startMove(id, e) {
  if (App.state.preview) return;
  isDraggingElement = true;
  dragElementId = id;
  const el = App.state.elements.find(el => el.id === id);
  if (!el) { isDraggingElement = false; return; }
  const r = canvas.getBoundingClientRect();
  dragOffX = (e.clientX - r.left) / zoom - el.styles.left;
  dragOffY = (e.clientY - r.top) / zoom - el.styles.top;
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', stopMove);
}

function onMove(e) {
  if (!isDraggingElement || !dragElementId) return;
  const el = App.state.elements.find(el => el.id === dragElementId);
  if (!el) return;
  const r = canvas.getBoundingClientRect();
  el.styles.left = Math.max(0, (e.clientX - r.left) / zoom - dragOffX);
  el.styles.top = Math.max(0, (e.clientY - r.top) / zoom - dragOffY);
  if (!rafId) {
    rafId = requestAnimationFrame(() => {
      rafId = null;
      renderCanvas();
      if (App.state.selectedId === dragElementId) showProperties(dragElementId);
    });
  }
}

function stopMove() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  if (isDraggingElement && dragElementId) { renderCanvas(); App.saveState(); }
  isDraggingElement = false; dragElementId = null;
  document.removeEventListener('mousemove', onMove);
  document.removeEventListener('mouseup', stopMove);
}

/* Inline editing */
function startInlineEdit(id) {
  const el = App.state.elements.find(e => e.id === id);
  if (!el) return;
  const dom = canvas.querySelector(`[data-id="${id}"]`);
  if (!dom) return;
  let ce = dom.querySelector('h2, p, button, .el-input, .el-textarea');
  if (!ce) return;
  const isForm = el.type === 'input' || el.type === 'textarea';

  if (isForm) {
    ce.removeAttribute('readonly');
    ce.focus();
    const done = () => {
      ce.setAttribute('readonly', '');
      el.content = ce.value || ce.textContent.trim();
      App.saveState();
      if (App.state.selectedId === id) showProperties(id);
    };
    const kd = (e) => {
      if (e.key === 'Escape') { ce.value = el.content; ce.blur(); }
    };
    ce.addEventListener('blur', done, { once: true });
    ce.addEventListener('keydown', kd);
    ce.addEventListener('mousedown', (e) => e.stopPropagation());
    return;
  }

  ce.contentEditable = true;
  ce.focus();
  const r = document.createRange(); r.selectNodeContents(ce);
  const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);

  const done = () => {
    ce.contentEditable = false;
    el.content = ce.textContent.trim();
    App.saveState();
    if (App.state.selectedId === id) showProperties(id);
    ce.removeEventListener('blur', done);
    ce.removeEventListener('keydown', kd);
  };
  const kd = (e) => {
    if (e.key === 'Enter' && el.type === 'button') { e.preventDefault(); ce.blur(); }
    if (e.key === 'Escape') { ce.textContent = el.content; ce.blur(); }
  };
  ce.addEventListener('blur', done);
  ce.addEventListener('keydown', kd);
}

document.addEventListener('DOMContentLoaded', initApp);
