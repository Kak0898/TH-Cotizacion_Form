const IVA = 0.19;
const BASE_LAST_COTIZACION = 11865;
const LOGO_SRC = 'assets/th-logo.jpeg';
const CLP = new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0});
const today = new Date().toISOString().slice(0,10);

const defaultDoc = {
  id:null,
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
  doc.tipo = 'COTIZACIÓN';
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
  const numero = Number(state.numero);
  return {
    tipo: 'COTIZACIÓN',
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
    tipo: row.tipo || 'COTIZACIÓN',
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
