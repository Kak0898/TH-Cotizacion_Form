const IVA = 0.19;
const BASE_LAST_COTIZACION = 11865;
const LOGO_SRC = 'assets/th-logo.jpeg';
const CLP = new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0});
const today = new Date().toISOString().slice(0,10);

const defaultDoc = {
  tipo:'COTIZACIÓN',
  numero:String(BASE_LAST_COTIZACION + 1),
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
  savedAt:null
};

let state = loadCurrent();
let saved = JSON.parse(localStorage.getItem('th_saved')||'[]');
let counterStatus = { type:'warn', text:'Contador local listo. Configura Supabase para contador compartido.' };
let loadingNumber = false;
let supabaseClient = null;

function loadCurrent(){
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem('th_current') || 'null'); } catch(e) { cached = null; }
  const doc = cached ? {...defaultDoc, ...cached} : {...defaultDoc};
  doc.tipo = 'COTIZACIÓN';
  const n = Number(doc.numero);
  if (!Number.isFinite(n) || n < BASE_LAST_COTIZACION + 1 || String(doc.numero).length > 7) {
    doc.numero = String(BASE_LAST_COTIZACION + 1);
    doc.numeroReservado = false;
  }
  if (!Array.isArray(doc.items) || !doc.items.length) {
    doc.items = [{codigo:'', descripcion:'', cantidad:1, um:'UN', precio:0, dscto:0}];
  }
  return doc;
}

function initSupabase(){
  const cfg = window.TH_SUPABASE || {};
  if (cfg.url && cfg.anonKey && window.supabase) {
    supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey);
    counterStatus = { type:'ok', text:'Supabase conectado para contador de cotizaciones.' };
  }
}

function money(v){
  return CLP.format(Math.round(Number(v)||0)).replace(/^CLP\s?/, '').trim();
}
function subtotalItem(it){return (Number(it.cantidad)||0)*(Number(it.precio)||0)*(1-(Number(it.dscto)||0)/100)}
function totals(){const neto=state.items.reduce((s,it)=>s+subtotalItem(it),0); const iva=neto*IVA; return {neto,iva,total:neto+iva}}
function persist(){localStorage.setItem('th_current',JSON.stringify(state))}
function setSilent(k,v){state[k]=v; persist()}
function setItemSilent(i,k,v){state.items[i][k]=v; persist()}
function addItem(){state.items.push({codigo:'',descripcion:'',cantidad:1,um:'UN',precio:0,dscto:0});persist();render()}
function delItem(i){state.items.splice(i,1);persist();render()}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

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
      throw new Error('Número inválido recibido del contador.');
    }

    state.numero = String(nextNum);
    state.numeroReservado = true;
    persist();
  } catch (err) {
    console.error(err);
    const fallback = localNextNumber();
    state.numero = String(fallback);
    state.numeroReservado = true;
    counterStatus = { type:'bad', text:'Supabase no respondió. Se usó contador local de respaldo.' };
    persist();
  } finally {
    loadingNumber = false;
    render();
  }
}

async function newDoc(){
  state = {
    ...defaultDoc,
    numero:'',
    numeroReservado:false,
    fecha:today,
    vcto:'',
    cliente:'', contacto:'', rut:'', direccion:'', giro:'', comuna:'', telefono:'', ciudad:'', email:'',
    referencia:'', garantia:'30 días', condiciones:'',
    items:[{codigo:'',descripcion:'',cantidad:1,um:'UN',precio:0,dscto:0}],
    savedAt:null
  };
  persist();
  await reserveNextNumber({force:true});
}

function saveDoc(){
  state.tipo = 'COTIZACIÓN';
  state.savedAt = new Date().toLocaleString('es-CL');
  const id = Date.now();
  saved.unshift({id,doc:JSON.parse(JSON.stringify(state))});
  localStorage.setItem('th_saved',JSON.stringify(saved.slice(0,50)));
  persist();
  render();
}
function loadDoc(id){
  const found = saved.find(x=>x.id==id);
  if (!found) return;
  state = JSON.parse(JSON.stringify(found.doc));
  state.tipo='COTIZACIÓN';
  state.numeroReservado = true;
  persist();
  render();
}
function deleteSaved(id){saved=saved.filter(x=>x.id!=id);localStorage.setItem('th_saved',JSON.stringify(saved));render()}

function render(){
  const t=totals();
  const statusClass = counterStatus.type === 'ok' ? 'ok' : counterStatus.type === 'bad' ? 'bad' : 'warn';
  document.getElementById('app').innerHTML=`
  <main class="app">
    <aside class="panel">
      <h1>TH Cotizaciones</h1>
      <p class="sub">Formato actual de Técnica Hidráulica, con logo, número bloqueado y contador en Supabase.</p>

      <div class="section-title">Documento</div>
      <div class="status"><span class="dot ${statusClass}"></span><span>${esc(counterStatus.text)}</span></div>
      <div class="grid">
        <div class="field">
          <label>Tipo</label>
          <input readonly value="COTIZACIÓN">
        </div>
        <div class="field">
          <label>N° Cotización</label>
          <input class="locked-number" readonly value="${loadingNumber ? '...' : esc(state.numero)}" title="Número bloqueado">
          <span class="small">Bloqueado: no se puede escribir encima.</span>
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
            <div class="field"><label>Descripción</label><input value="${esc(it.descripcion)}" oninput="setItemSilent(${i},'descripcion',this.value)" onchange="render()"></div>
            <div class="field"><label>Cantidad</label><input type="number" value="${esc(it.cantidad)}" oninput="setItemSilent(${i},'cantidad',this.value)" onchange="render()"></div>
            <div class="field"><label>U.M.</label><input value="${esc(it.um)}" oninput="setItemSilent(${i},'um',this.value)" onchange="render()"></div>
            <div class="field"><label>Precio</label><input type="number" value="${esc(it.precio)}" oninput="setItemSilent(${i},'precio',this.value)" onchange="render()"></div>
            <div class="field"><label>Dscto %</label><input type="number" value="${esc(it.dscto)}" oninput="setItemSilent(${i},'dscto',this.value)" onchange="render()"></div>
            <div class="field"><label>Subtotal</label><input readonly value="$ ${money(subtotalItem(it))}"></div>
            <button class="danger" onclick="delItem(${i})">Eliminar</button>
          </div>
        </div>`).join('')}
      <button class="ghost" onclick="addItem()">+ Agregar ítem</button>

      <div class="section-title">Observaciones</div>
      <div class="field"><label>Observaciones</label><textarea oninput="setSilent('observaciones',this.value)" onchange="render()">${esc(state.observaciones)}</textarea></div>
      <div class="field"><label>Garantía</label><input value="${esc(state.garantia)}" oninput="setSilent('garantia',this.value)" onchange="render()"></div>
      <div class="field"><label>Condiciones</label><textarea oninput="setSilent('condiciones',this.value)" onchange="render()">${esc(state.condiciones||'')}</textarea></div>

      <div class="btns">
        <button class="green" onclick="window.print()">Exportar PDF / Imprimir</button>
        <button class="yellow" onclick="saveDoc()">Guardar</button>
        <button class="primary" onclick="newDoc()" ${loadingNumber?'disabled':''}>+ Nueva Cotización</button>
      </div>

      <div class="section-title">Guardadas</div>
      <div class="saved-list">${saved.map(s=>`<div class="saved"><b>COTIZACIÓN N° ${esc(s.doc.numero)}</b><span>${esc(s.doc.cliente)} · ${esc(s.doc.savedAt||'')}</span><div class="btns"><button class="ghost" onclick="loadDoc(${s.id})">Abrir</button><button class="danger" onclick="deleteSaved(${s.id})">Borrar</button></div></div>`).join('')||'<p class="small">Aún no hay documentos guardados.</p>'}</div>
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
              <div class="quote-label">COTIZACIÓN N°</div>
              <div class="quote-number">${loadingNumber ? '...' : esc(state.numero)}</div>
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
          ${state.items.map(it=>`<tr><td>${esc(it.codigo)}</td><td class="desc-cell">${esc(it.descripcion)}</td><td class="num">${esc(it.cantidad)}</td><td class="center">${esc(it.um)}</td><td class="num">$ ${money(it.precio)}</td><td class="num">${esc(it.dscto||0)}%</td><td class="num"> ${money(subtotalItem(it))}</td></tr>`).join('')}
        </table>

        <div class="obs-totals">
          <div class="obs"><b>OBSERVACIONES:</b>\n${esc(state.observaciones)}\n\n<b>Garantía:</b> ${esc(state.garantia)}${state.condiciones ? `\n<b>Condiciones:</b> ${esc(state.condiciones)}` : ''}</div>
          <table class="totals">
            <tr><td>SUBTOTAL</td><td class="num"> ${money(t.neto)}</td></tr>
            <tr><td>NETO</td><td class="num"> ${money(t.neto)}</td></tr>
            <tr><td>I.V.A. (19%)</td><td class="num"> ${money(t.iva)}</td></tr>
            <tr class="total-final"><td>TOTAL</td><td class="num"> ${money(t.total)}</td></tr>
          </table>
        </div>

        <div class="bank">Datos para Orden de Compra<br>Razón Social: TÉCNICA HIDRÁULICA LTDA. RUT: 76.171.450-3<br>E-mail: ventas@tecnicahidraulica.cl</div>
      </article>
    </section>
  </main>`;
}

initSupabase();
render();
reserveNextNumber();
