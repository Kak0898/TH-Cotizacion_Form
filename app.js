const IVA = 0.19;
const BASE_LAST_COTIZACION = 11865;
const LOGO_SRC = 'assets/th-logo.jpeg';
const CLP = new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0});
const today = new Date().toISOString().slice(0,10);

const defaultDoc = {
  id:null,
  tipo:'COTIZACIÃ“N',
  numero:String(BASE_LAST_COTIZACION + 1),
  numeroReservado:false,
  fecha:today,
  vcto:'',
  rutEmpresa:'76.171.450-3',
  cliente:'LogÃ­stica Transportes y Servicios Ltda.',
  contacto:'Sr. Guillermo Tell',
  rut:'78.954.200-7',
  direccion:'Av. Eduardo Frei Montalva 8301',
  giro:'LogÃ­stica',
  comuna:'Quilicura',
  telefono:'991448386',
  ciudad:'Santiago',
  email:'Guillermo.tell@walmart.com',
  referencia:'Mantenimientos Preventivos Equipos LTS Quilicura JUNIO 2026',
  garantia:'30 dÃ­as',
  condiciones:'',
  observaciones:'El mantenimiento preventivo se realizarÃ¡ de acuerdo al manual del fabricante.\nEl mantenimiento se realizarÃ¡ en instalaciones del cliente.\nEl mantenimiento preventivo no incluye repuestos, tampoco reparaciones.\nEl mantenimiento de los equipos incluye informe tÃ©cnico.',
  items:[{codigo:'1.000.00', descripcion:'Transpaletas PE â€“ PC â€“ SP â€“ PR - WP', cantidad:70, um:'UN', precio:105300, dscto:0}],
  savedAt:null,
  savedInSupabase:false,
  dirty:true
};

let state = loadCurrent();
let saved = JSON.parse(localStorage.getItem('th_saved')||'[]');
let counterStatus = { type:'warn', text:'NÃºmero generado en modo local. Configura Supabase para varios computadores.' };
let saveStatus = { type:'warn', text:'Guarda el documento para activar PDF / Imprimir.' };
let loadingNumber = false;
let savingDoc = false;
let supabaseClient = null;

function loadCurrent(){
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem('th_current') || 'null'); } catch(e) { cached = null; }
  const doc = cached ? {...defaultDoc, ...cached} : {...defaultDoc};
  doc.tipo = 'COTIZACIÃ“N';
  const n = Number(doc.numero);
  if (!Number.isFinite(n) || n < BASE_LAST_COTIZACION + 1 || String(doc.numero).length > 7) {
    doc.numero = String(BASE_LAST_COTIZACION + 1);
    doc.numeroReservado = false;
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
    counterStatus = { type:'ok', text:'Supabase conectado para contador y guardado.' };
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
function canExport(){return Boolean(state.savedAt && !state.dirty)}

function localNextNumber(){
  const stored = Number(localStorage.getItem('th_last_cotizacion') || BASE_LAST_COTIZACION);
  const current = Number(state.numero) || BASE_LAST_COTIZACION;
  const last = Math.max(stored, BASE_LAST_COTIZACION, state.numeroReservado ? current : BASE_LAST_COTIZACION);
  const next = last + 1;
  localStorage.setItem('th_last_cotizacion', String(next));
  return next;
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
      throw new Error('NÃºmero invÃ¡lido recibido del contador.');
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
    counterStatus = { type:'bad', text:'Supabase no respondiÃ³. Se usÃ³ contador local de respaldo.' };
    persist();
  } finally {
    loadingNumber = false;
    render();
  }
}

function buildDbPayload(){
  const t = totals();
  const numero = Number(state.numero);
  return {
    tipo: 'COTIZACIÃ“N',
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
    tipo: row.tipo || 'COTIZACIÃ“N',
    numero: String(row.numero || d.numero || ''),
    numeroReservado: true,
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
      .order('numero', { ascending:false })
      .limit(50);
    if (error) throw error;
    saved = (data || []).map(row => ({id: row.id, doc: docFromDb(row), source:'supabase'}));
    localStorage.setItem('th_saved', JSON.stringify(saved));
  } catch (err) {
    console.error(err);
    saveStatus = { type:'bad', text:'No se pudo cargar documentos desde Supabase. Revisa tabla y polÃ­ticas.' };
  }
  render();
}

async function newDoc(){
  state = {
    ...defaultDoc,
    id:null,
    numero:'',
    numeroReservado:false,
    fecha:today,
    vcto:'',
    cliente:'', contacto:'', rut:'', direccion:'', giro:'', comuna:'', telefono:'', ciudad:'', email:'',
    referencia:'', garantia:'30 dÃ­as', condiciones:'',
    items:[{codigo:'',descripcion:'',cantidad:1,um:'UN',precio:0,dscto:0}],
    savedAt:null,
    savedInSupabase:false,
    dirty:true
  };
  saveStatus = { type:'warn', text:'Nueva cotizaciÃ³n sin guardar. PDF / Imprimir bloqueado.' };
  persist();
  await reserveNextNumber({force:true});
}

async function saveDoc(){
  if (savingDoc) return;
  if (!state.numero) await reserveNextNumber({force:true});
  savingDoc = true;
  saveStatus = { type:'warn', text:'Guardando documento...' };
  render();

  try {
    if (supabaseClient) {
      const payload = buildDbPayload();
      const { data, error } = await supabaseClient
        .from('th_documentos')
        .upsert(payload, { onConflict:'numero' })
        .select('*')
        .single();
      if (error) throw error;
      state = docFromDb(data);
      saveStatus = { type:'ok', text:'Documento guardado en Supabase. PDF / Imprimir habilitado.' };
      persist();
      await loadSavedDocs();
    } else {
      state.savedAt = new Date().toLocaleString('es-CL');
      state.savedInSupabase = false;
      state.dirty = false;
      const id = Date.now();
      const existing = saved.findIndex(x => String(x.doc.numero) === String(state.numero));
      const record = {id, doc:JSON.parse(JSON.stringify(state)), source:'local'};
      if (existing >= 0) saved[existing] = record; else saved.unshift(record);
      localStorage.setItem('th_saved',JSON.stringify(saved.slice(0,50)));
      saveStatus = { type:'warn', text:'Guardado local. Configura Supabase para guardar en base de datos. PDF / Imprimir habilitado.' };
      persist();
    }
  } catch (err) {
    console.error(err);
    saveStatus = { type:'bad', text:'No se pudo guardar en Supabase. Revisa SQL, URL, anon key y polÃ­ticas RLS.' };
  } finally {
    savingDoc = false;
    render();
  }
}

function loadDoc(id){
  const found = saved.find(x=>String(x.id)===String(id));
  if (!found) return;
  state = JSON.parse(JSON.stringify(found.doc));
  state.tipo='COTIZACIÃ“N';
  state.numeroReservado = true;
  state.dirty = false;
  state.savedAt = state.savedAt || new Date().toISOString();
  saveStatus = { type:'ok', text:'Documento cargado y guardado. PDF / Imprimir habilitado.' };
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
  document.getElementById('app').innerHTML=`
  <main class="app">
    <aside class="panel">
      <h1>TH Cotizaciones</h1>
      <p class="sub">Formato actual de TÃ©cnica HidrÃ¡ulica, con logo, nÃºmero bloqueado, contador y guardado en Supabase.</p>

      <div class="section-title">Documento</div>
      <div class="status"><span class="dot ${statusClass}"></span><span>${esc(counterStatus.text)}</span></div>
      <div class="status"><span class="dot ${saveClass}"></span><span>${esc(saveStatus.text)}</span></div>
      <div class="grid">
        <div class="field">
          <label>Tipo</label>
          <input readonly value="COTIZACIÃ“N">
        </div>
        <div class="field">
          <label>NÂ° CotizaciÃ³n</label>
          <input class="locked-number" readonly value="${loadingNumber ? '...' : esc(state.numero)}" title="NÃºmero bloqueado">
          <span class="small">Bloqueado: no se puede escribir encima.</span>
        </div>
        <div class="field"><label>Fecha emisiÃ³n</label><input type="date" value="${esc(state.fecha)}" oninput="setSilent('fecha',this.value)" onchange="render()"></div>
        <div class="field"><label>Fecha vencimiento</label><input type="date" value="${esc(state.vcto)}" oninput="setSilent('vcto',this.value)" onchange="render()"></div>
      </div>

      <div class="section-title">Cliente</div>
      <div class="field"><label>SeÃ±or(es)</label><input value="${esc(state.cliente)}" oninput="setSilent('cliente',this.value)" onchange="render()"></div>
      <div class="grid">
        <div class="field"><label>Contacto</label><input value="${esc(state.contacto)}" oninput="setSilent('contacto',this.value)" onchange="render()"></div>
        <div class="field"><label>RUT</label><input value="${esc(state.rut)}" oninput="setSilent('rut',this.value)" onchange="render()"></div>
        <div class="field"><label>DirecciÃ³n</label><input value="${esc(state.direccion)}" oninput="setSilent('direccion',this.value)" onchange="render()"></div>
        <div class="field"><label>Giro</label><input value="${esc(state.giro)}" oninput="setSilent('giro',this.value)" onchange="render()"></div>
        <div class="field"><label>Comuna</label><input value="${esc(state.comuna)}" oninput="setSilent('comuna',this.value)" onchange="render()"></div>
        <div class="field"><label>Ciudad/RegiÃ³n</label><input value="${esc(state.ciudad)}" oninput="setSilent('ciudad',this.value)" onchange="render()"></div>
        <div class="field"><label>TelÃ©fono</label><input value="${esc(state.telefono)}" oninput="setSilent('telefono',this.value)" onchange="render()"></div>
        <div class="field"><label>E-mail</label><input value="${esc(state.email)}" oninput="setSilent('email',this.value)" onchange="render()"></div>
      </div>

      <div class="field"><label>Referencia</label><textarea oninput="setSilent('referencia',this.value)" onchange="render()">${esc(state.referencia)}</textarea></div>

      <div class="section-title">Ãtems</div>
      ${state.items.map((it,i)=>`
        <div class="item-row">
          <div class="grid">
            <div class="field"><label>CÃ³digo</label><input value="${esc(it.codigo)}" oninput="setItemSilent(${i},'codigo',this.value)" onchange="render()"></div>
            <div class="field"><label>DescripciÃ³n</label><input value="${esc(it.descripcion)}" oninput="setItemSilent(${i},'descripcion',this.value)" onchange="render()"></div>
            <div class="field"><label>Cantidad</label><input type="number" value="${esc(it.cantidad)}" oninput="setItemSilent(${i},'cantidad',this.value)" onchange="render()"></div>
            <div class="field"><label>U.M.</label><input value="${esc(it.um)}" oninput="setItemSilent(${i},'um',this.value)" onchange="render()"></div>
            <div class="field"><label>Precio</label><input type="number" value="${esc(it.precio)}" oninput="setItemSilent(${i},'precio',this.value)" onchange="render()"></div>
            <div class="field"><label>Dscto %</label><input type="number" value="${esc(it.dscto)}" oninput="setItemSilent(${i},'dscto',this.value)" onchange="render()"></div>
            <div class="field"><label>Subtotal</label><input readonly value="$ ${money(subtotalItem(it))}"></div>
            <button class="danger" onclick="delItem(${i})">Eliminar</button>
          </div>
        </div>`).join('')}
      <button class="ghost" onclick="addItem()">+ Agregar Ã­tem</button>

      <div class="section-title">Observaciones</div>
      <div class="field"><label>Observaciones</label><textarea oninput="setSilent('observaciones',this.value)" onchange="render()">${esc(state.observaciones)}</textarea></div>
      <div class="field"><label>GarantÃ­a</label><input value="${esc(state.garantia)}" oninput="setSilent('garantia',this.value)" onchange="render()"></div>
      <div class="field"><label>Condiciones</label><textarea oninput="setSilent('condiciones',this.value)" onchange="render()">${esc(state.condiciones||'')}</textarea></div>

      <div class="btns sticky-actions">
        <button class="green" onclick="window.print()" ${exportDisabled ? 'disabled title="Primero guarda el documento"' : ''}>Exportar PDF / Imprimir</button>
        <button class="yellow" onclick="saveDoc()" ${savingDoc?'disabled':''}>${savingDoc?'Guardando...':'Guardar'}</button>
        <button class="primary" onclick="newDoc()" ${loadingNumber || savingDoc?'disabled':''}>+ Nueva CotizaciÃ³n</button>
      </div>

      <div class="section-title">Guardadas</div>
      <div class="saved-list">${saved.map(s=>`<div class="saved"><b>COTIZACIÃ“N NÂ° ${esc(s.doc.numero)}</b><span>${esc(s.doc.cliente)} Â· ${esc(s.doc.savedAt||'')}</span><div class="btns"><button class="ghost" onclick="loadDoc('${s.id}')">Abrir</button><button class="danger" onclick="deleteSaved('${s.id}')">Borrar</button></div></div>`).join('')||'<p class="small">AÃºn no hay documentos guardados.</p>'}</div>
    </aside>

    <section class="preview-wrap">
      <article class="sheet">
        <header class="sheet-header">
          <div class="brand-block">
            <div class="brand-name">TÃ‰CNICA HIDRÃULICA LIMITADA</div>
            <div class="brand-desc">COMERCIALIZADORA E IMPORTADORA DE REPUESTOS INDUST.</div>
            <div>CILINDROS HIDRÃULICOS Y NEUMÃTICOS Â· PARAGUAY 4415, ESTACIÃ“N CENTRAL, SANTIAGO</div>
            <div class="brand-contact"><b>TelÃ©fono:</b> 979671127 Â· <b>E-mail:</b> ventas@tecnicahidraulica.cl</div>
            <img class="brand-logo" src="${LOGO_SRC}" alt="Logo TÃ©cnica HidrÃ¡ulica Ltda">
          </div>

          <div class="quote-block">
            <div class="quote-main">
              <div class="quote-label">COTIZACIÃ“N NÂ°</div>
              <div class="quote-number">${loadingNumber ? '...' : esc(state.numero)}</div>
            </div>
            <div class="date-block date-block-under">
              <div class="date-row"><b>Fecha EmisiÃ³n:</b><div class="date-value">${esc(state.fecha)}</div></div>
              <div class="date-row"><b>Fecha Vcto:</b><div class="date-value">${esc(state.vcto||'-')}</div></div>
              <div class="date-row"><b>R.U.T.:</b><div class="date-value">${esc(state.rutEmpresa)}</div></div>
            </div>
          </div>
        </header>

        <table class="client">
          <tr><th colspan="4">DATOS CLIENTE</th></tr>
          <tr><td class="label">SeÃ±or(es)</td><td>${esc(state.cliente)}</td><td class="label">Contacto</td><td>${esc(state.contacto)}</td></tr>
          <tr><td class="label">Rut</td><td>${esc(state.rut)}</td><td class="label">DirecciÃ³n</td><td>${esc(state.direccion)}</td></tr>
          <tr><td class="label">Giro</td><td>${esc(state.giro)}</td><td class="label">Comuna</td><td>${esc(state.comuna)}</td></tr>
          <tr><td class="label">TelÃ©fono</td><td>${esc(state.telefono)}</td><td class="label">Ciudad/RegiÃ³n</td><td>${esc(state.ciudad)}</td></tr>
          <tr><td class="label">E-mail</td><td>${esc(state.email)}</td><td class="label">Fecha</td><td>${esc(state.fecha)}</td></tr>
        </table>

        <div class="ref">Referencia: ${esc(state.referencia)}</div>

        <table class="items">
          <tr><th>COD.</th><th>DESCRIPCIÃ“N</th><th>CANT.</th><th>U.M.</th><th>PRECIO UNIT.</th><th>DSCTO.</th><th>SUBTOTAL</th></tr>
          ${state.items.map(it=>`<tr><td>${esc(it.codigo)}</td><td class="desc-cell">${esc(it.descripcion)}</td><td class="num">${esc(it.cantidad)}</td><td class="center">${esc(it.um)}</td><td class="num">$ ${money(it.precio)}</td><td class="num">${esc(it.dscto||0)}%</td><td class="num">$ ${money(subtotalItem(it))}</td></tr>`).join('')}
        </table>

        <div class="obs-totals">
          <div class="obs"><b>OBSERVACIONES:</b>\n${esc(state.observaciones)}\n\n<b>GarantÃ­a:</b> ${esc(state.garantia)}${state.condiciones ? `\n<b>Condiciones:</b> ${esc(state.condiciones)}` : ''}</div>
          <table class="totals">
            <tr><td>SUBTOTAL</td><td class="num">$ ${money(t.neto)}</td></tr>
            <tr><td>NETO</td><td class="num">$ ${money(t.neto)}</td></tr>
            <tr><td>I.V.A. (19%)</td><td class="num">$ ${money(t.iva)}</td></tr>
            <tr class="total-final"><td>TOTAL</td><td class="num">$ ${money(t.total)}</td></tr>
          </table>
        </div>

        <div class="bank">Datos para Orden de Compra<br>RazÃ³n Social: TÃ‰CNICA HIDRÃULICA LTDA. RUT: 76.171.450-3<br>E-mail: ventas@tecnicahidraulica.cl</div>
      </article>
    </section>
  </main>`;
}

async function boot(){
  initSupabase();
  render();
  await loadSavedDocs();
  await reserveNextNumber();
}
boot();