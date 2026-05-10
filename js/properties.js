function initProperties() {}

function showProperties(id) {
  const el = App.state.elements.find(e => e.id === id);
  if (!el) { hideProperties(); return; }
  const s = el.styles;
  let h = '';

  function rg(prop, label, min, max, step, suffix) {
    const v = s[prop] ?? 0;
    return `<div class="prop-row"><label>${label}</label><input type="range" min="${min}" max="${max}" step="${step||1}" data-prop="${prop}" data-id="${id}" value="${v}" /><span class="range-val">${v}${suffix||''}</span></div>`;
  }
  function inp(prop, label, type) {
    const v = type==='number'||type==='range' ? (s[prop]??'') : (el[prop]!==undefined?el[prop]:s[prop]??'');
    return `<div class="prop-row"><label>${label}</label><input type="${type||'text'}" data-prop="${prop}" data-id="${id}" value="${esc(String(v))}" /></div>`;
  }
  function sel(prop, label, opts) {
    let o = '';
    opts.forEach(([v, lbl]) => { o += `<option value="${esc(v)}"${String(s[prop])===String(v)?' selected':''}>${lbl}</option>`; });
    return `<div class="prop-row"><label>${label}</label><select data-prop="${prop}" data-id="${id}">${o}</select></div>`;
  }
  function clr(prop, label) {
    const v = s[prop]||'#000000';
    return `<div class="prop-row"><label>${label}</label><div class="flex-group"><input type="color" data-prop="${prop}" data-id="${id}" value="${v==='transparent'?'#000000':v}" /><input type="text" data-prop="${prop}" data-id="${id}" value="${s[prop]||''}" /></div></div>`;
  }

  // Content
  if (['heading','paragraph','text','button'].includes(el.type)) {
    h += `<div class="prop-group"><div class="prop-title">Content</div>${inp('content','Text','textarea')}</div>`;
  }
  if (el.type === 'image') {
    h += `<div class="prop-group"><div class="prop-title">Source</div>${inp('src','URL')}${inp('alt','Alt')}</div>`;
  }
  if (el.type === 'video') {
    h += `<div class="prop-group"><div class="prop-title">Source</div>${inp('embedUrl','YouTube URL')}</div>`;
  }
  if (el.type === 'button') {
    h += `<div class="prop-group"><div class="prop-title">Link</div>${inp('href','URL')}</div>`;
  }

  // Icon specific
  if (el.type === 'icon') {
    h += `<div class="prop-group"><div class="prop-title">Icon</div><input type="text" data-prop="icon" data-id="${id}" value="${esc(el.icon||'fa-star')}" placeholder="fa-star" style="width:100%;padding:6px 8px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-size:12px;font-family:inherit;outline:none;margin-bottom:8px" /><div class="icon-grid">`;
    const icons = ['fa-star','fa-heart','fa-bolt','fa-fire','fa-sun','fa-moon','fa-cloud','fa-home','fa-user','fa-cog','fa-bell','fa-envelope','fa-phone','fa-map-marker','fa-search','fa-download','fa-upload','fa-share','fa-flag','fa-bookmark','fa-camera','fa-lock','fa-globe','fa-check','fa-plus','fa-minus','fa-arrow-right','fa-arrow-left','fa-arrow-up','fa-arrow-down','fa-thumbs-up','fa-info-circle','fa-exclamation-triangle','fa-question-circle','fa-shopping-cart','fa-calendar'];
    icons.forEach(ic => {
      h += `<div class="icon-opt${el.icon===ic?' sel':''}" data-icon="${ic}"><i class="fas ${ic}"></i></div>`;
    });
    h += `</div></div>`;
    h += `<div class="prop-group"><div class="prop-title">Size</div>${rg('fontSize','Icon Size',12,96,1,'px')}${clr('color','Color')}</div>`;
  }

  // Input/Textarea specific
  if (el.type === 'input' || el.type === 'textarea') {
    h += `<div class="prop-group"><div class="prop-title">Placeholder</div>${inp('content','Text')}</div>`;
  }
  h += `<div class="prop-group"><div class="prop-title">Position & Size</div>
    <div class="prop-row"><label>X</label><input type="number" data-prop="left" data-id="${id}" value="${Math.round(s.left)}" /><label>Y</label><input type="number" data-prop="top" data-id="${id}" value="${Math.round(s.top)}" /></div>
    <div class="prop-row"><label>Width</label><input type="number" data-prop="width" data-id="${id}" value="${typeof s.width==='number'?s.width:300}" /><label>H</label><input type="text" data-prop="height" data-id="${id}" value="${s.height||'auto'}" style="width:60px" /></div>
  </div>`;

  // Typography
  if (['heading','paragraph','text','button'].includes(el.type)) {
    const fb = (p, ic) => `<button class="format-btn${s[p]&&s[p]!=='none'&&s[p]!=='normal'?' active':''}" data-prop="${p}" data-id="${id}" title="${p.replace('font','')}"><i class="fas ${ic}"></i></button>`;
    h += `<div class="prop-group"><div class="prop-title">Typography</div>
      <div class="format-bar">${fb('fontWeight','fa-bold')}${fb('fontStyle','fa-italic')}${fb('textDecoration','fa-underline')}</div>
      ${sel('fontFamily','Font',[["'Inter',sans-serif",'Inter'],["'Georgia',serif",'Georgia'],["'Arial',sans-serif",'Arial'],["'Courier New',monospace",'Courier New']])}
      ${rg('fontSize','Size',8,96,1,'px')}
      ${sel('fontWeight','Weight',[[300,'Light'],[400,'Regular'],[500,'Medium'],[600,'Semi Bold'],[700,'Bold'],[800,'Extra Bold']])}
      ${sel('textAlign','Align',[['left','Left'],['center','Center'],['right','Right'],['justify','Justify']])}
      ${rg('letterSpacing','Spacing',0,5,0.1,'')}
      ${rg('lineHeight','Line H',0.5,3,0.1,'')}
    </div>`;
  }

  // Colors
  h += `<div class="prop-group"><div class="prop-title">Colors</div>${clr('color','Text')}${clr('backgroundColor','Bg')}</div>`;

  // Button style
  if (el.type === 'button') {
    h += `<div class="prop-group"><div class="prop-title">Button Style</div>
      ${clr('buttonBg','Btn Bg')}${clr('buttonTextColor','Btn Text')}
      ${inp('buttonPadding','Padding')}
      ${rg('buttonBorderRadius','Radius',0,50,1,'px')}
    </div>`;
  }

  // Border & Effects
  h += `<div class="prop-group"><div class="prop-title">Border & Effects</div>
    ${rg('borderRadius','Radius',0,50,1,'px')}
    ${rg('opacity','Opacity',0,1,0.05,'')}
    ${inp('zIndex','Z-Index','number')}
  </div>`;

  // Container border
  if (el.type === 'container') {
    h += `<div class="prop-group"><div class="prop-title">Container Border</div>
      ${inp('borderWidth','Width','number')}
      ${clr('borderColor','Color')}
    </div>`;
  }

  // Divider
  if (el.type === 'divider') {
    h += `<div class="prop-group"><div class="prop-title">Divider</div>${rg('dividerThickness','Thickness',1,10,1,'px')}</div>`;
  }

  // Spacer
  if (el.type === 'spacer') {
    h += `<div class="prop-group"><div class="prop-title">Spacer</div>${rg('height','Height',4,200,1,'px')}</div>`;
  }

  // Padding
  h += `<div class="prop-group"><div class="prop-title">Padding</div>${inp('padding','Padding')}</div>`;

  propertiesContent.innerHTML = h;

  propertiesContent.querySelectorAll('input, select, textarea').forEach(inp => {
    inp.addEventListener('input', onPropChange);
    inp.addEventListener('change', onPropChange);
  });

  // Icon picker
  propertiesContent.querySelectorAll('.icon-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      const id = el.id;
      const icon = opt.dataset.icon;
      App.state.elements.find(e => e.id === id).icon = icon;
      const textInp = propertiesContent.querySelector('input[data-prop="icon"]');
      if (textInp) textInp.value = icon;
      propertiesContent.querySelectorAll('.icon-opt').forEach(o => o.classList.toggle('sel', o === opt));
      renderCanvas();
    });
  });

  // Format buttons (toggle)
  propertiesContent.querySelectorAll('.format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const prop = btn.dataset.prop;
      const e = App.state.elements.find(el => el.id === id);
      if (!e) return;
      const s = e.styles;
      if (prop === 'fontWeight') { s[prop] = s[prop] === 700 ? 400 : 700; }
      else if (prop === 'fontStyle') { s[prop] = s[prop] === 'italic' ? 'normal' : 'italic'; }
      else if (prop === 'textDecoration') { s[prop] = s[prop] === 'underline' ? 'none' : 'underline'; }
      btn.classList.toggle('active');
      renderCanvas();
      App.saveState();
    });
  });
}

function onPropChange(e) {
  const inp = e.target;
  const id = inp.dataset.id, prop = inp.dataset.prop;
  const el = App.state.elements.find(e => e.id === id);
  if (!el) return;
  let val = inp.value;

  const numProps = ['left','top','width','fontSize','fontWeight','borderRadius','opacity','zIndex','lineHeight','letterSpacing','dividerThickness','borderWidth','buttonBorderRadius','height'];
  const styleProps = ['color','backgroundColor','fontFamily','textAlign','padding','fontStyle','textDecoration','buttonBg','buttonTextColor','buttonPadding','borderColor','borderStyle'];
  const dataProps = ['content','src','alt','embedUrl','href','icon'];

  if (inp.type === 'number' || inp.type === 'range') {
    val = inp.type === 'range' ? parseFloat(val) : Number(val);
  }
  if (prop === 'fontWeight' && typeof val === 'string') val = Number(val);

  // Sync color inputs
  if (inp.type === 'color') {
    const textI = inp.parentElement.querySelector('input[type="text"]');
    if (textI) textI.value = val;
  } else if (inp.type === 'text' && inp.previousElementSibling && inp.previousElementSibling.type === 'color') {
    try { inp.previousElementSibling.value = val; } catch(_) {}
  }

  if (numProps.includes(prop)) el.styles[prop] = val;
  else if (styleProps.includes(prop)) el.styles[prop] = val;
  else if (dataProps.includes(prop)) el[prop] = val;

  renderCanvas();

  const rv = inp.parentElement?.querySelector('.range-val');
  if (rv) {
    const suff = ['fontSize','borderRadius','buttonBorderRadius','dividerThickness','height'].includes(prop) ? 'px' : '';
    rv.textContent = val + suff;
  }
}

function hideProperties() {
  propertiesContent.innerHTML = `<div class="no-selection"><i class="fas fa-arrow-left"></i><p>Select an element on the canvas to edit its properties</p></div>`;
}


