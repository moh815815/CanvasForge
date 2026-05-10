let dragType = null;
let resizeData = null;
let resizeRaf = null;

function initDragDrop() {
  document.querySelectorAll('.component-item[draggable]').forEach(item => {
    item.addEventListener('dragstart', onDragStart);
    item.addEventListener('dragend', onDragEnd);
  });

  canvas.addEventListener('dragover', onDragOver);
  canvas.addEventListener('dragleave', onDragLeave);
  canvas.addEventListener('drop', onDrop);

  canvas.addEventListener('mousedown', (e) => {
    const h = e.target.closest('.resize-handle');
    if (!h) return;
    const el = h.closest('.canvas-element');
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    startResize(el.dataset.id, h.className.split(' ')[1], e);
  });
}

/* Sidebar → Canvas drag */
function onDragStart(e) {
  dragType = e.target.dataset.type;
  e.dataTransfer.effectAllowed = 'copy';
  e.dataTransfer.setData('text/plain', dragType);
  e.target.style.opacity = '0.4';
}

function onDragEnd(e) {
  e.target.style.opacity = '1';
  canvas.classList.remove('drag-over');
  dragType = null;
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  canvas.classList.add('drag-over');
}

function onDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    canvas.classList.remove('drag-over');
  }
}

function onDrop(e) {
  e.preventDefault();
  canvas.classList.remove('drag-over');
  const type = e.dataTransfer.getData('text/plain') || dragType;
  if (!type || !App.defaults[type]) return;

  const r = canvas.getBoundingClientRect();
  const x = Math.max(0, (e.clientX - r.left) / zoom - 100);
  const y = Math.max(0, (e.clientY - r.top) / zoom - 30);

  const el = App.createElement(type, x, y);
  if (!el) return;
  App.state.elements.push(el);
  App.saveState();
  renderCanvas();
  selectElement(el.id);
}

/* Resize */
function startResize(id, handle, e) {
  const el = App.state.elements.find(el => el.id === id);
  if (!el) return;
  const r = canvas.getBoundingClientRect();
  const bw = typeof el.styles.width === 'number' ? el.styles.width : 200;
  const bh = typeof el.styles.height === 'number' ? el.styles.height : (el.type === 'video' ? 270 : 100);
  resizeData = { id, handle, startX: e.clientX, startY: e.clientY, startLeft: el.styles.left, startTop: el.styles.top, startW: bw, startH: bh, cr: r, sl: canvas.scrollLeft, st: canvas.scrollTop };
  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
}

function onResize(e) {
  if (!resizeData) return;
  const d = resizeData;
  const el = App.state.elements.find(el => el.id === d.id);
  if (!el) return;
  const dx = (e.clientX - d.startX) / zoom, dy = (e.clientY - d.startY) / zoom;
  const h = d.handle;
  let l = d.startLeft, t = d.startTop, w = d.startW, hh = d.startH;
  if (h.includes('e')) w = Math.max(40, d.startW + dx);
  if (h.includes('w')) { w = Math.max(40, d.startW - dx); l = d.startLeft + d.startW - w; }
  if (h.includes('s')) hh = Math.max(20, d.startH + dy);
  if (h.includes('n')) { hh = Math.max(20, d.startH - dy); t = d.startTop + d.startH - hh; }
  el.styles.left = l; el.styles.top = t;
  el.styles.width = Math.round(w); el.styles.height = Math.round(hh);
  if (!resizeRaf) {
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = null;
      renderCanvas();
      if (App.state.selectedId === d.id) showProperties(d.id);
    });
  }
}

function stopResize() {
  if (resizeRaf) { cancelAnimationFrame(resizeRaf); resizeRaf = null; }
  if (resizeData) { renderCanvas(); App.saveState(); }
  resizeData = null;
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
}
