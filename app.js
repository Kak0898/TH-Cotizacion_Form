const IVA = 0.19;
const BASE_LAST_COTIZACION = 11865;
const LOGO_SRC = 'assets/th-logo.jpeg';
const CLP = new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0});
const today = new Date().toISOString().slice(0,10);

const defaultDoc = {
  id:null,
  tipo:'PRE-COTIZACIÓN',
  estado:'pre_cotizacion',
  preNumero:'',
  numero:'',
  numeroReservado:false,
  fecha:today,
  vcto:'',
  rutEmpresa:'76.171.450-3',
  cliente:'Logística Transportes y Servicios Ltda.',
  contacto:'Sr. Guillermo Tell',
  rut:'78.954.200-7',
  direccion:'Av. Eduardo Frei Montalva 8301',
  giro:'Logística',
  comuna:'Quilicura',
  telefono:'991448386',
  ciudad:'Santiago',
  email:'Guillermo.tell@walmart.com',
  referencia:'Mantenimientos Preventivos Equipos LTS Quilicura JUNIO 2026',
  garantia:'30 días',
  condiciones:'',
  observaciones:'El mantenimiento preventivo se realizará de acuerdo al manual del fabricante.\nEl mantenimiento se realizará en instalaciones del cliente.\nEl mantenimiento preventivo no incluye repuestos, tampoco reparaciones.\nEl mantenimiento de los equipos incluye informe técnico.',
  items:[{codigo:'1.000.00', descripcion:'Transpaletas PE – PC – SP – PR - WP', cantidad:70, um:'UN', precio:105300, dscto:0}],
  savedAt:null,
  savedInSupabase:false,
  dirty:true
};

let counterStatus = { type:'warn', text:'Número generado en modo local. Configura Supabase para varios computadores.' };
let saveStatus = { type:'warn', text:'Guarda el documento para activar PDF / Imprimir.' };
let loadingNumber = false;
let savingDoc = false;
let supabaseClient = null;
let state = loadCurrent();
let saved = JSON.parse(localStorage.getItem('th_saved')||'[]');

function loadCurrent(){
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem('th_current') || 'null'); } catch(e) { cached = null; }
  const doc = cached ? {...defaultDoc, ...cached} : {...defaultDoc};
  doc.estado = doc.estado || (doc.numeroReservado ? 'cotizacion_emitida' : 'pre_cotizacion');
  doc.tipo = doc.numeroReservado ? 'COTIZACIÓN' : 'PRE-COTIZACIÓN';
  doc.preNumero = doc.preNumero || '';
  if (doc.numero) {
    const n = Number(doc.numero);
    if (!Number.isFinite(n) || n < BASE_LAST_COTIZACION + 1 || String(doc.numero).length > 7) {
      doc.numero = '';
      doc.numeroReservado = false;
      doc.estado = 'pre_cotizacion';
      doc.tipo = 'PRE-COTIZACIÓN';
    }
  }
  if (!Array.isArray(doc.items) || !doc.items.length) {
    doc.items = [{codigo:'', descripcion:'', cantidad:1, um:'UN', precio:0, dscto:0}];
  }
  if (doc.savedAt && !doc.dirty) {
    saveStatus = { type:'ok', text:'Documento guardado. PDF / Imprimir habilitado.' };
  }
  return doc;
}

function initSupabase(){
  const cfg = window.TH_SUPABASE || {};
  if (cfg.url && cfg.anonKey && window.supabase) {
    supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey);
    counterStatus = { type:'ok', text:'Supabase conectado para pre-cotizaciones y emisión segura.' };
    saveStatus = state.savedAt && !state.dirty
      ? { type:'ok', text:'Documento guardado. PDF / Imprimir habilitado.' }
      : { type:'warn', text:'Supabase conectado. Guarda el documento para activar PDF / Imprimir.' };
  }
}

function money(v){
  return CLP.format(Math.round(Number(v)||0)).replace(/^CLP\s?/, '').trim();
}
function subtotalItem(it){return (Number(it.cantidad)||0)*(Number(it.precio)||0)*(1-(Number(it.dscto)||0)/100)}
function totals(){const neto=state.items.reduce((s,it)=>s+subtotalItem(it),0); const iva=neto*IVA; return {neto,iva,total:neto+iva}}
function persist(){localStorage.setItem('th_current',JSON.stringify(state))}
function markDirty(){state.dirty=true; state.savedAt=null; state.savedInSupabase=false; saveStatus={type:'warn', text:'Hay cambios sin guardar. PDF / Imprimir bloqueado.'};}
function setSilent(k,v){state[k]=v; markDirty(); persist()}
function setItemSilent(i,k,v){state.items[i][k]=v; markDirty(); persist()}
function addItem(){state.items.push({codigo:'',descripcion:'',cantidad:1,um:'UN',precio:0,dscto:0});markDirty();persist();render()}
function delItem(i){state.items.splice(i,1);markDirty();persist();render()}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function canExport(){return Boolean(state.numeroReservado && state.savedAt && !state.dirty)}

function localNextNumber(){
  const stored = Number(localStorage.getItem('th_last_cotizacion') || BASE_LAST_COTIZACION);
  const current = Number(state.numero) || BASE_LAST_COTIZACION;
  const last = Math.max(stored, BASE_LAST_COTIZACION, state.numeroReservado ? current : BASE_LAST_COTIZACION);
  const next = last + 1;
  localStorage.setItem('th_last_cotizacion', String(next));
  return next;
}

function localNextPreNumber(){
  const stored = Number(localStorage.getItem('th_last_pre_cotizacion') || 0);
  const next = stored + 1;
  localStorage.setItem('th_last_pre_cotizacion', String(next));
  return `PRE-${String(next).padStart(5,'0')}`;
}

async function reservePreNumber(){
  if (state.preNumero) return state.preNumero;
  try {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.rpc('next_th_pre_cotizacion');
      if (error) throw error;
      state.preNumero = String(data);
      counterStatus = { type:'ok', text:'Supabase conectado. Contador de pre-cotizaciones activo.' };
    } else {
      state.preNumero = localNextPreNumber();
      counterStatus = { type:'warn', text:'Modo local activo. Las pre-cotizaciones no son compartidas.' };
    }
  } catch (err) {
    console.error(err);
    state.preNumero = localNextPreNumber();
    counterStatus = { type:'bad', text:'Supabase no respondió. Se usó contador PRE local.' };
  }
  persist();
  return state.preNumero;
}

async function reserveNextNumber({force=false}={}){
  if (loadingNumber) return;
  if (!force && state.numeroReservado && state.numero) return;
  loadingNumber = true;
  render();

  try {
    let nextNum = null;
    if (supabaseClient) {
      const { data, error } = await supabaseClient.rpc('next_th_cotizacion');
      if (error) throw error;
      nextNum = Number(data);
      counterStatus = { type:'ok', text:'Supabase conectado. Contador de cotizaciones activo.' };
    } else {
      nextNum = localNextNumber();
      counterStatus = { type:'warn', text:'Modo local activo. Configura Supabase para usar varios computadores.' };
    }

    if (!Number.isFinite(nextNum) || nextNum < BASE_LAST_COTIZACION + 1) {
      throw new Error('Número inválido recibido del contador.');
    }

    state.numero = String(nextNum);
    state.numeroReservado = true;
    state.dirty = true;
    state.savedAt = null;
    persist();
  } catch (err) {
    console.error(err);
    const fallback = localNextNumber();
    state.numero = String(fallback);
    state.numeroReservado = true;
    state.dirty = true;
    state.savedAt = null;
    counterStatus = { type:'bad', text:'Supabase no respondió. Se usó contador local de respaldo.' };
    persist();
  } finally {
    loadingNumber = false;
    render();
  }
}

function buildDbPayload(){
  const t = totals();
  const numero = state.numero ? Number(state.numero) : null;
  return {
    tipo: state.numeroReservado ? 'COTIZACIÓN' : 'PRE-COTIZACIÓN',
    estado: state.numeroReservado ? 'cotizacion_emitida' : 'pre_cotizacion',
    pre_numero: state.preNumero || null,
    numero,
    fecha_emision: state.fecha || null,
    fecha_vcto: state.vcto || null,
    rut_empresa: state.rutEmpresa || '76.171.450-3',
    cliente_nombre: state.cliente || '',
    cliente_contacto: state.contacto || '',
    cliente_rut: state.rut || '',
    cliente_direccion: state.direccion || '',
    cliente_giro: state.giro || '',
    cliente_comuna: state.comuna || '',
    cliente_telefono: state.telefono || '',
    cliente_ciudad: state.ciudad || '',
    cliente_email: state.email || '',
    referencia: state.referencia || '',
    observaciones: state.observaciones || '',
    garantia: state.garantia || '',
    condiciones: state.condiciones || '',
    items: state.items || [],
    subtotal: Math.round(t.neto),
    neto: Math.round(t.neto),
    iva: Math.round(t.iva),
    total: Math.round(t.total),
    data: {...state, dirty:false, savedAt:new Date().toISOString()},
    updated_at: new Date().toISOString()
  };
}

function docFromDb(row){
  const d = row.data || {};
  return {
    ...defaultDoc,
    ...d,
    id: row.id,
    tipo: row.tipo || d.tipo || (row.numero ? 'COTIZACIÓN' : 'PRE-COTIZACIÓN'),
    estado: row.estado || d.estado || (row.numero ? 'cotizacion_emitida' : 'pre_cotizacion'),
    preNumero: row.pre_numero || d.preNumero || '',
    numero: String(row.numero || d.numero || ''),
    numeroReservado: Boolean(row.numero || d.numeroReservado),
    fecha: row.fecha_emision || d.fecha || today,
    vcto: row.fecha_vcto || d.vcto || '',
    rutEmpresa: row.rut_empresa || d.rutEmpresa || '76.171.450-3',
    cliente: row.cliente_nombre || d.cliente || '',
    contacto: row.cliente_contacto || d.contacto || '',
    rut: row.cliente_rut || d.rut || '',
    direccion: row.cliente_direccion || d.direccion || '',
    giro: row.cliente_giro || d.giro || '',
    comuna: row.cliente_comuna || d.comuna || '',
    telefono: row.cliente_telefono || d.telefono || '',
    ciudad: row.cliente_ciudad || d.ciudad || '',
    email: row.cliente_email || d.email || '',
    referencia: row.referencia || d.referencia || '',
    observaciones: row.observaciones || d.observaciones || '',
    garantia: row.garantia || d.garantia || '',
    condiciones: row.condiciones || d.condiciones || '',
    items: Array.isArray(row.items) ? row.items : (Array.isArray(d.items) ? d.items : defaultDoc.items),
    savedAt: row.updated_at || row.created_at || d.savedAt || null,
    savedInSupabase: true,
    dirty: false
  };
}

async function loadSavedDocs(){
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient
      .from('th_documentos')
      .select('*')
      .order('updated_at', { ascending:false })
      .limit(50);
    if (error) throw error;
    saved = (data || []).map(row => ({id: row.id, doc: docFromDb(row), source:'supabase'}));
    localStorage.setItem('th_saved', JSON.stringify(saved));
  } catch (err) {
    console.error(err);
    saveStatus = { type:'bad', text:'No se pudo cargar documentos desde Supabase. Revisa tabla y políticas.' };
  }
  render();
}

async function newDoc(){
  state = {
    ...defaultDoc,
    id:null,
    tipo:'PRE-COTIZACIÓN',
    estado:'pre_cotizacion',
    preNumero:'',
    numero:'',
    numeroReservado:false,
    fecha:today,
    vcto:'',
    cliente:'', contacto:'', rut:'', direccion:'', giro:'', comuna:'', telefono:'', ciudad:'', email:'',
    referencia:'', garantia:'30 días', condiciones:'',
    items:[{codigo:'',descripcion:'',cantidad:1,um:'UN',precio:0,dscto:0}],
    savedAt:null,
    savedInSupabase:false,
    dirty:true
  };
  saveStatus = { type:'warn', text:'Nueva pre-cotización sin guardar. Emite para obtener número final.' };
  persist();
  render();
}

async function saveDoc(){
  if (savingDoc) return;
  savingDoc = true;
  saveStatus = { type:'warn', text:'Guardando pre-cotización...' };
  render();

  try {
    if (!state.numeroReservado) await reservePreNumber();
    if (supabaseClient) {
      const payload = buildDbPayload();
      let query;
      if (state.id) {
        query = supabaseClient.from('th_documentos').update(payload).eq('id', state.id);
      } else {
        query = supabaseClient.from('th_documentos').insert(payload);
      }
      const { data, error } = await query.select('*').single();
      if (error) throw error;
      state = docFromDb(data);
      saveStatus = state.numeroReservado
        ? { type:'ok', text:'Cotización final guardada en Supabase. PDF / Imprimir habilitado.' }
        : { type:'ok', text:'Pre-cotización guardada. Puedes emitir cotización final cuando esté lista.' };
      persist();
      await loadSavedDocs();
    } else {
      state.savedAt = new Date().toLocaleString('es-CL');
      state.savedInSupabase = false;
      state.dirty = false;
      const id = state.id || Date.now();
      state.id = id;
      const existing = saved.findIndex(x => String(x.doc.numero || x.doc.preNumero) === String(state.numero || state.preNumero));
      const record = {id, doc:JSON.parse(JSON.stringify(state)), source:'local'};
      if (existing >= 0) saved[existing] = record; else saved.unshift(record);
      localStorage.setItem('th_saved',JSON.stringify(saved.slice(0,50)));
      saveStatus = { type:'warn', text:'Guardado local. Para uso multiusuario necesitas Supabase.' };
      persist();
    }
  } catch (err) {
    console.error(err);
    saveStatus = { type:'bad', text:'No se pudo guardar. Revisa SQL de pre-cotización, URL, anon key y políticas RLS.' };
  } finally {
    savingDoc = false;
    render();
  }
}

async function emitDoc(){
  if (savingDoc || state.numeroReservado) return;
  saveStatus = { type:'warn', text:'Emitiendo cotización final...' };
  render();
  try {
    if (!state.id || state.dirty) await saveDoc();
    if (supabaseClient && !state.id) throw new Error('Primero se debe guardar la pre-cotización.');
    savingDoc = true;
    render();

    if (supabaseClient && state.id) {
      const { data, error } = await supabaseClient.rpc('emit_th_cotizacion', { doc_id: state.id });
      if (error) throw error;
      state = docFromDb(data);
      saveStatus = { type:'ok', text:'Cotización emitida con número final seguro.' };
      persist();
      await loadSavedDocs();
    } else {
      const next = localNextNumber();
      state.numero = String(next);
      state.numeroReservado = true;
      state.tipo = 'COTIZACIÓN';
      state.estado = 'cotizacion_emitida';
      state.dirty = false;
      state.savedAt = new Date().toLocaleString('es-CL');
      saveStatus = { type:'warn', text:'Cotización emitida en modo local. Para multiusuario usa Supabase.' };
      const id = state.id || Date.now();
      state.id = id;
      const existing = saved.findIndex(x => String(x.id) === String(id));
      const record = {id, doc:JSON.parse(JSON.stringify(state)), source:'local'};
      if (existing >= 0) saved[existing] = record; else saved.unshift(record);
      localStorage.setItem('th_saved',JSON.stringify(saved.slice(0,50)));
      persist();
    }
  } catch (err) {
    console.error(err);
    saveStatus = { type:'bad', text:'No se pudo emitir. Ejecuta supabase_pre_cotizacion.sql y revisa RLS.' };
  } finally {
    savingDoc = false;
    render();
  }
}

function loadDoc(id){
  const found = saved.find(x=>String(x.id)===String(id));
  if (!found) return;
  state = JSON.parse(JSON.stringify(found.doc));
  state.tipo='COTIZACIÓN';
  state.numeroReservado = Boolean(state.numero);
  state.tipo = state.numeroReservado ? 'COTIZACIÓN' : 'PRE-COTIZACIÓN';
  state.estado = state.numeroReservado ? 'cotizacion_emitida' : 'pre_cotizacion';
  state.dirty = false;
  state.savedAt = state.savedAt || new Date().toISOString();
  saveStatus = state.numeroReservado
    ? { type:'ok', text:'Cotización cargada. PDF / Imprimir habilitado.' }
    : { type:'ok', text:'Pre-cotización cargada. Puedes editarla o emitirla.' };
  persist();
  render();
}
async function deleteSaved(id){
  const found = saved.find(x=>String(x.id)===String(id));
  if (supabaseClient && found?.source === 'supabase') {
    const { error } = await supabaseClient.from('th_documentos').delete().eq('id', id);
    if (error) { saveStatus = {type:'bad', text:'No se pudo borrar en Supabase.'}; render(); return; }
    await loadSavedDocs();
    return;
  }
  saved=saved.filter(x=>String(x.id)!==String(id));
  localStorage.setItem('th_saved',JSON.stringify(saved));
  render();
}

function render(){
  const t=totals();
  const statusClass = counterStatus.type === 'ok' ? 'ok' : counterStatus.type === 'bad' ? 'bad' : 'warn';
  const saveClass = saveStatus.type === 'ok' ? 'ok' : saveStatus.type === 'bad' ? 'bad' : 'warn';
  const exportDisabled = !canExport();
  const docLabel = state.numeroReservado ? 'COTIZACIÓN' : 'PRE-COTIZACIÓN';
  const displayNumber = loadingNumber ? '...' : (state.numeroReservado ? state.numero : (state.preNumero || 'SIN GUARDAR'));
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML=`
  <main class="app">
    <aside class="panel">
      <h1>TH Cotizaciones</h1>
      <p class="sub">Formato actual de Técnica Hidráulica, con logo, número bloqueado, contador y guardado en Supabase.</p>

      <div class="section-title">Documento</div>
      <div class="status"><span class="dot ${statusClass}"></span><span>${esc(counterStatus.text)}</span></div>
      <div class="status"><span class="dot ${saveClass}"></span><span>${esc(saveStatus.text)}</span></div>
      <div class="grid">
        <div class="field">
          <label>Tipo</label>
          <input readonly value="${esc(docLabel)}">
        </div>
        <div class="field">
          <label>${state.numeroReservado ? 'N° Cotización' : 'N° Pre-cotización'}</label>
          <input class="locked-number" readonly value="${esc(displayNumber)}" title="Número bloqueado">
          <span class="small">${state.numeroReservado ? 'Número final bloqueado.' : 'El número final se asigna al emitir.'}</span>
        </div>
        <div class="field"><label>Fecha emisión</label><input type="date" value="${esc(state.fecha)}" oninput="setSilent('fecha',this.value)" onchange="render()"></div>
        <div class="field"><label>Fecha vencimiento</label><input type="date" value="${esc(state.vcto)}" oninput="setSilent('vcto',this.value)" onchange="render()"></div>
      </div>

      <div class="section-title">Cliente</div>
      <div class="field"><label>Señor(es)</label><input value="${esc(state.cliente)}" oninput="setSilent('cliente',this.value)" onchange="render()"></div>
      <div class="grid">
        <div class="field"><label>Contacto</label><input value="${esc(state.contacto)}" oninput="setSilent('contacto',this.value)" onchange="render()"></div>
        <div class="field"><label>RUT</label><input value="${esc(state.rut)}" oninput="setSilent('rut',this.value)" onchange="render()"></div>
        <div class="field"><label>Dirección</label><input value="${esc(state.direccion)}" oninput="setSilent('direccion',this.value)" onchange="render()"></div>
        <div class="field"><label>Giro</label><input value="${esc(state.giro)}" oninput="setSilent('giro',this.value)" onchange="render()"></div>
        <div class="field"><label>Comuna</label><input value="${esc(state.comuna)}" oninput="setSilent('comuna',this.value)" onchange="render()"></div>
        <div class="field"><label>Ciudad/Región</label><input value="${esc(state.ciudad)}" oninput="setSilent('ciudad',this.value)" onchange="render()"></div>
        <div class="field"><label>Teléfono</label><input value="${esc(state.telefono)}" oninput="setSilent('telefono',this.value)" onchange="render()"></div>
        <div class="field"><label>E-mail</label><input value="${esc(state.email)}" oninput="setSilent('email',this.value)" onchange="render()"></div>
      </div>

      <div class="field"><label>Referencia</label><textarea oninput="setSilent('referencia',this.value)" onchange="render()">${esc(state.referencia)}</textarea></div>

      <div class="section-title">Ítems</div>
      ${state.items.map((it,i)=>`
        <div class="item-row">
          <div class="grid">
            <div class="field"><label>Código</label><input value="${esc(it.codigo)}" oninput="setItemSilent(${i},'codigo',this.value)" onchange="render()"></div>
            <div class="field item-description-field"><label>Descripción</label><textarea class="item-description-input" oninput="setItemSilent(${i},'descripcion',this.value)" onchange="render()">${esc(it.descripcion)}</textarea></div>
            <div class="field"><label>Cantidad</label><input type="number" value="${esc(it.cantidad)}" oninput="setItemSilent(${i},'cantidad',this.value)" onchange="render()"></div>
            <div class="field"><label>U.M.</label><input value="${esc(it.um)}" oninput="setItemSilent(${i},'um',this.value)" onchange="render()"></div>
            <div class="field"><label>Precio</label><input type="number" value="${esc(it.precio)}" oninput="setItemSilent(${i},'precio',this.value)" onchange="render()"></div>
            <div class="field"><label>Dscto %</label><input type="number" value="${esc(it.dscto)}" oninput="setItemSilent(${i},'dscto',this.value)" onchange="render()"></div>
            <div class="field"><label>Subtotal</label><input readonly value="${money(subtotalItem(it))}"></div>
            <button class="danger" onclick="delItem(${i})">Eliminar</button>
          </div>
        </div>`).join('')}
      <button class="ghost" onclick="addItem()">+ Agregar ítem</button>

      <div class="section-title">Observaciones</div>
      <div class="field"><label>Observaciones</label><textarea oninput="setSilent('observaciones',this.value)" onchange="render()">${esc(state.observaciones)}</textarea></div>
      <div class="field"><label>Garantía</label><input value="${esc(state.garantia)}" oninput="setSilent('garantia',this.value)" onchange="render()"></div>
      <div class="field"><label>Condiciones</label><textarea oninput="setSilent('condiciones',this.value)" onchange="render()">${esc(state.condiciones||'')}</textarea></div>

      <div class="btns sticky-actions">
        <button class="green" onclick="window.print()" ${exportDisabled ? 'disabled title="Primero emite y guarda la cotización final"' : ''}>Exportar PDF / Imprimir</button>
        <button class="yellow" onclick="saveDoc()" ${savingDoc?'disabled':''}>${savingDoc?'Guardando...':(state.numeroReservado?'Guardar cambios':'Guardar PRE')}</button>
        <button class="primary" onclick="emitDoc()" ${state.numeroReservado || savingDoc?'disabled':''}>Emitir cotización</button>
        <button class="ghost" onclick="newDoc()" ${loadingNumber || savingDoc?'disabled':''}>+ Nueva PRE</button>
      </div>

      <div class="section-title">Guardadas</div>
      <div class="saved-list">${saved.map(s=>`<div class="saved"><b>${esc(s.doc.numeroReservado ? 'COTIZACIÓN N° ' + s.doc.numero : 'PRE-COTIZACIÓN ' + (s.doc.preNumero || 'SIN N°'))}</b><span>${esc(s.doc.cliente)} · ${esc(s.doc.savedAt||'')}</span><div class="btns"><button class="ghost" onclick="loadDoc('${s.id}')">Abrir</button><button class="danger" onclick="deleteSaved('${s.id}')">Borrar</button></div></div>`).join('')||'<p class="small">Aún no hay documentos guardados.</p>'}</div>
    </aside>

    <section class="preview-wrap">
      <article class="sheet">
        <header class="sheet-header">
          <div class="brand-block">
            <div class="brand-name">TÉCNICA HIDRÁULICA LIMITADA</div>
            <div class="brand-desc">COMERCIALIZADORA E IMPORTADORA DE REPUESTOS INDUST.</div>
            <div>CILINDROS HIDRÁULICOS Y NEUMÁTICOS · PARAGUAY 4415, ESTACIÓN CENTRAL, SANTIAGO</div>
            <div class="brand-contact"><b>Teléfono:</b> 979671127 · <b>E-mail:</b> ventas@tecnicahidraulica.cl</div>
            <img class="brand-logo" src="${LOGO_SRC}" alt="Logo Técnica Hidráulica Ltda">
          </div>

          <div class="quote-block">
            <div class="quote-main">
              <div class="quote-label">${esc(docLabel)} N°</div>
              <div class="quote-number ${state.numeroReservado ? '' : 'pre-number'}">${esc(displayNumber)}</div>
            </div>
            <div class="date-block date-block-under">
              <div class="date-row"><b>Fecha Emisión:</b><div class="date-value">${esc(state.fecha)}</div></div>
              <div class="date-row"><b>Fecha Vcto:</b><div class="date-value">${esc(state.vcto||'-')}</div></div>
              <div class="date-row"><b>R.U.T.:</b><div class="date-value">${esc(state.rutEmpresa)}</div></div>
            </div>
          </div>
        </header>

        <table class="client">
          <tr><th colspan="4">DATOS CLIENTE</th></tr>
          <tr><td class="label">Señor(es)</td><td>${esc(state.cliente)}</td><td class="label">Contacto</td><td>${esc(state.contacto)}</td></tr>
          <tr><td class="label">Rut</td><td>${esc(state.rut)}</td><td class="label">Dirección</td><td>${esc(state.direccion)}</td></tr>
          <tr><td class="label">Giro</td><td>${esc(state.giro)}</td><td class="label">Comuna</td><td>${esc(state.comuna)}</td></tr>
          <tr><td class="label">Teléfono</td><td>${esc(state.telefono)}</td><td class="label">Ciudad/Región</td><td>${esc(state.ciudad)}</td></tr>
          <tr><td class="label">E-mail</td><td>${esc(state.email)}</td><td class="label">Fecha</td><td>${esc(state.fecha)}</td></tr>
        </table>

        <div class="ref">Referencia: ${esc(state.referencia)}</div>

        <table class="items">
          <tr><th>COD.</th><th>DESCRIPCIÓN</th><th>CANT.</th><th>U.M.</th><th>PRECIO UNIT.</th><th>DSCTO.</th><th>SUBTOTAL</th></tr>
          ${state.items.map(it=>`<tr><td>${esc(it.codigo)}</td><td class="desc-cell">${esc(it.descripcion)}</td><td class="num">${esc(it.cantidad)}</td><td class="center">${esc(it.um)}</td><td class="num">${money(it.precio)}</td><td class="num">${esc(it.dscto||0)}%</td><td class="num">${money(subtotalItem(it))}</td></tr>`).join('')}
        </table>

        <div class="obs-totals">
          <div class="obs"><b>OBSERVACIONES:</b>\n${esc(state.observaciones)}\n\n<b>Garantía:</b> ${esc(state.garantia)}${state.condiciones ? `\n<b>Condiciones:</b> ${esc(state.condiciones)}` : ''}</div>
          <table class="totals">
            <tr><td>SUBTOTAL</td><td class="num">${money(t.neto)}</td></tr>
            <tr><td>NETO</td><td class="num">${money(t.neto)}</td></tr>
            <tr><td>I.V.A. (19%)</td><td class="num">${money(t.iva)}</td></tr>
            <tr class="total-final"><td>TOTAL</td><td class="num">${money(t.total)}</td></tr>
          </table>
        </div>

        <div class="bank">Datos para Orden de Compra<br>Razón Social: TÉCNICA HIDRÁULICA LTDA. RUT: 76.171.450-3<br>E-mail: ventas@tecnicahidraulica.cl</div>
      </article>
    </section>
  </main>`;
}

async function boot(){
  initSupabase();
  render();
  await loadSavedDocs();
}

function showBootError(err){
  console.error(err);
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = `
    <main class="app">
      <aside class="panel">
        <h1>TH Cotizaciones</h1>
        <div class="status"><span class="dot bad"></span><span>Error al iniciar la aplicación.</span></div>
        <p class="sub">Revisa la configuración de Supabase, la consola del navegador o vuelve a publicar todos los archivos del proyecto.</p>
        <pre class="small">${esc(err?.message || err)}</pre>
      </aside>
    </main>`;
}

function startApp(){
  boot().catch(showBootError);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
