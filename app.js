const IVA = 0.19;
const BASE_LAST_COTIZACION = 11865;
const LOGO_SRC = 'assets/th-logo.jpeg';
const CLP = new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0});
const today = new Date().toISOString().slice(0,10);
const REGIONES_COMUNAS = [
  {region:'Arica y Parinacota', comunas:['Arica','Camarones','Putre','General Lagos']},
  {region:'Tarapacá', comunas:['Iquique','Alto Hospicio','Pozo Almonte','Camiña','Colchane','Huara','Pica']},
  {region:'Antofagasta', comunas:['Antofagasta','Mejillones','Sierra Gorda','Taltal','Calama','Ollagüe','San Pedro de Atacama','Tocopilla','María Elena']},
  {region:'Atacama', comunas:['Copiapó','Caldera','Tierra Amarilla','Chañaral','Diego de Almagro','Vallenar','Alto del Carmen','Freirina','Huasco']},
  {region:'Coquimbo', comunas:['La Serena','Coquimbo','Andacollo','La Higuera','Paiguano','Vicuña','Illapel','Canela','Los Vilos','Salamanca','Ovalle','Combarbalá','Monte Patria','Punitaqui','Río Hurtado']},
  {region:'Valparaíso', comunas:['Valparaíso','Casablanca','Concón','Juan Fernández','Puchuncaví','Quintero','Viña del Mar','Isla de Pascua','Los Andes','Calle Larga','Rinconada','San Esteban','La Ligua','Cabildo','Papudo','Petorca','Zapallar','Quillota','Calera','Hijuelas','La Cruz','Nogales','San Antonio','Algarrobo','Cartagena','El Quisco','El Tabo','Santo Domingo','San Felipe','Catemu','Llaillay','Panquehue','Putaendo','Santa María','Quilpué','Limache','Olmué','Villa Alemana']},
  {region:'Región Metropolitana de Santiago', comunas:['Cerrillos','Cerro Navia','Conchalí','El Bosque','Estación Central','Huechuraba','Independencia','La Cisterna','La Florida','La Granja','La Pintana','La Reina','Las Condes','Lo Barnechea','Lo Espejo','Lo Prado','Macul','Maipú','Ñuñoa','Pedro Aguirre Cerda','Peñalolén','Providencia','Pudahuel','Quilicura','Quinta Normal','Recoleta','Renca','Santiago','San Joaquín','San Miguel','San Ramón','Vitacura','Puente Alto','Pirque','San José de Maipo','Colina','Lampa','Tiltil','San Bernardo','Buin','Calera de Tango','Paine','Melipilla','Alhué','Curacaví','María Pinto','San Pedro','Talagante','El Monte','Isla de Maipo','Padre Hurtado','Peñaflor']},
  {region:'Región del Libertador Gral. Bernardo O’Higgins', comunas:['Rancagua','Codegua','Coinco','Coltauco','Doñihue','Graneros','Las Cabras','Machalí','Malloa','Mostazal','Olivar','Peumo','Pichidegua','Quinta de Tilcoco','Rengo','Requínoa','San Vicente','Pichilemu','La Estrella','Litueche','Marchihue','Navidad','Paredones','San Fernando','Chépica','Chimbarongo','Lolol','Nancagua','Palmilla','Peralillo','Placilla','Pumanque','Santa Cruz']},
  {region:'Región del Maule', comunas:['Talca','Constitución','Curepto','Empedrado','Maule','Pelarco','Pencahue','Río Claro','San Clemente','San Rafael','Cauquenes','Chanco','Pelluhue','Curicó','Hualañé','Licantén','Molina','Rauco','Romeral','Sagrada Familia','Teno','Vichuquén','Linares','Colbún','Longaví','Parral','Retiro','San Javier','Villa Alegre','Yerbas Buenas']},
  {region:'Región de Ñuble', comunas:['Cobquecura','Coelemu','Ninhue','Portezuelo','Quirihue','Ránquil','Treguaco','Bulnes','Chillán Viejo','Chillán','El Carmen','Pemuco','Pinto','Quillón','San Ignacio','Yungay','Coihueco','Ñiquén','San Carlos','San Fabián','San Nicolás']},
  {region:'Región del Biobío', comunas:['Concepción','Coronel','Chiguayante','Florida','Hualqui','Lota','Penco','San Pedro de la Paz','Santa Juana','Talcahuano','Tomé','Hualpén','Lebu','Arauco','Cañete','Contulmo','Curanilahue','Los Álamos','Tirúa','Los Ángeles','Antuco','Cabrero','Laja','Mulchén','Nacimiento','Negrete','Quilaco','Quilleco','San Rosendo','Santa Bárbara','Tucapel','Yumbel','Alto Biobío']},
  {region:'Región de la Araucanía', comunas:['Temuco','Carahue','Cunco','Curarrehue','Freire','Galvarino','Gorbea','Lautaro','Loncoche','Melipeuco','Nueva Imperial','Padre las Casas','Perquenco','Pitrufquén','Pucón','Saavedra','Teodoro Schmidt','Toltén','Vilcún','Villarrica','Cholchol','Angol','Collipulli','Curacautín','Ercilla','Lonquimay','Los Sauces','Lumaco','Purén','Renaico','Traiguén','Victoria']},
  {region:'Región de Los Ríos', comunas:['Valdivia','Corral','Lanco','Los Lagos','Máfil','Mariquina','Paillaco','Panguipulli','La Unión','Futrono','Lago Ranco','Río Bueno']},
  {region:'Región de Los Lagos', comunas:['Puerto Montt','Calbuco','Cochamó','Fresia','Frutillar','Los Muermos','Llanquihue','Maullín','Puerto Varas','Castro','Ancud','Chonchi','Curaco de Vélez','Dalcahue','Puqueldón','Queilén','Quellón','Quemchi','Quinchao','Osorno','Puerto Octay','Purranque','Puyehue','Río Negro','San Juan de la Costa','San Pablo','Chaitén','Futaleufú','Hualaihué','Palena']},
  {region:'Región Aisén del Gral. Carlos Ibáñez del Campo', comunas:['Coihaique','Lago Verde','Aisén','Cisnes','Guaitecas','Cochrane','O’Higgins','Tortel','Chile Chico','Río Ibáñez']},
  {region:'Región de Magallanes y de la Antártica Chilena', comunas:['Punta Arenas','Laguna Blanca','Río Verde','San Gregorio','Cabo de Hornos (Ex Navarino)','Antártica','Porvenir','Primavera','Timaukel','Natales','Torres del Paine']}
];

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
  cliente:'',
  contacto:'',
  rut:'',
  direccion:'',
  giro:'',
  comuna:'',
  telefono:'',
  ciudad:'',
  email:'',
  referencia:'',
  garantia:'30 días',
  condiciones:'',
  observaciones:'',
  items:[{codigo:'', descripcion:'', cantidad:1, um:'UN', precio:0, dscto:0}],
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
  const shouldRestoreDraft = cached && !cached.savedAt && !cached.id && !cached.numeroReservado;
  if (cached && !shouldRestoreDraft) localStorage.removeItem('th_current');
  const doc = shouldRestoreDraft ? {...defaultDoc, ...cached} : {...defaultDoc};
  if (doc.ciudad === 'Santiago') doc.ciudad = 'Región Metropolitana de Santiago';
  if (!REGIONES_COMUNAS.some(r => r.region === doc.ciudad)) {
    doc.ciudad = '';
    doc.comuna = '';
  } else if (doc.comuna && !getComunas(doc.ciudad).includes(doc.comuna)) {
    doc.comuna = '';
  }
  doc.rut = formatRut(doc.rut);
  doc.telefono = formatPhone(doc.telefono);
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
      : { type:'warn', text:'Supabase conectado. Guarda la PRE para imprimirla o emitirla.' };
  }
}

function money(v){
  return CLP.format(Math.round(Number(v)||0)).replace(/^CLP\s?/, '').trim();
}
function subtotalItem(it){return (Number(it.cantidad)||0)*(Number(it.precio)||0)*(1-(Number(it.dscto)||0)/100)}
function totals(){const neto=state.items.reduce((s,it)=>s+subtotalItem(it),0); const iva=neto*IVA; return {neto,iva,total:neto+iva}}
function persist(){localStorage.setItem('th_current',JSON.stringify(state))}
function markDirty(){state.dirty=true; state.savedAt=null; state.savedInSupabase=false; saveStatus={type:'warn', text:'Hay cambios sin guardar. Guarda antes de imprimir o emitir.'};}
function setSilent(k,v){state[k]=v; markDirty(); persist()}
function setItemSilent(i,k,v){state.items[i][k]=v; markDirty(); persist()}
function setRutSilent(v){state.rut=formatRut(v); markDirty(); persist()}
function setPhoneSilent(v){state.telefono=formatPhone(v); markDirty(); persist()}
function setRegionSilent(v){state.ciudad=v; if (!getComunas(v).includes(state.comuna)) state.comuna=''; markDirty(); persist(); render()}
function addItem(){state.items.push({codigo:'',descripcion:'',cantidad:1,um:'UN',precio:0,dscto:0});markDirty();persist();render()}
function delItem(i){state.items.splice(i,1);markDirty();persist();render()}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function canExport(){return Boolean(state.savedAt && !state.dirty)}
function canEmit(){return Boolean(!state.numeroReservado && state.id && state.savedAt && !state.dirty)}
function errorText(err){return err?.message || err?.details || err?.hint || String(err || 'Error desconocido')}
function getComunas(region){return REGIONES_COMUNAS.find(r=>r.region===region)?.comunas || []}
function options(list, selected, placeholder){
  return `<option value="">${esc(placeholder)}</option>` + list.map(v=>`<option value="${esc(v)}" ${v===selected?'selected':''}>${esc(v)}</option>`).join('');
}
function formatRut(value){
  const clean = String(value || '').replace(/[^0-9kK]/g,'').toUpperCase().slice(0,9);
  if (clean.length <= 1) return clean;
  const body = clean.slice(0,-1);
  const dv = clean.slice(-1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  return `${formattedBody}-${dv}`;
}
function formatPhone(value){
  return String(value || '').replace(/\D/g,'').slice(0,12);
}

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
  saveStatus = { type:'warn', text:'Nueva pre-cotización sin guardar. Guarda para imprimir/enviar al cliente.' };
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
        : { type:'ok', text:'Pre-cotización guardada. Puedes imprimir/enviar al cliente o emitir si fue aprobada.' };
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
    saveStatus = { type:'bad', text:`No se pudo guardar: ${errorText(err)}` };
  } finally {
    savingDoc = false;
    render();
  }
}

async function emitDoc(){
  if (savingDoc || state.numeroReservado) return;
  if (!canEmit()) {
    saveStatus = { type:'warn', text:'Primero guarda la pre-cotización actual antes de emitir.' };
    render();
    return;
  }
  saveStatus = { type:'warn', text:'Emitiendo cotización final...' };
  render();
  try {
    savingDoc = true;
    render();

    if (supabaseClient && state.id) {
      const { data, error } = await supabaseClient.rpc('emit_th_cotizacion', { doc_id: Number(state.id) });
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
    saveStatus = { type:'bad', text:`No se pudo emitir: ${errorText(err)}` };
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
    : { type:'ok', text:'Pre-cotización cargada. Puedes imprimirla, editarla o emitirla si fue aprobada.' };
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
  const emitDisabled = !canEmit() || savingDoc;
  const docLabel = state.numeroReservado ? 'COTIZACIÓN' : 'PRE-COTIZACIÓN';
  const displayNumber = loadingNumber ? '...' : (state.numeroReservado ? state.numero : (state.preNumero || 'SIN GUARDAR'));
  const printTitle = state.numeroReservado ? 'Exportar PDF / Imprimir' : 'Imprimir PRE / PDF';
  const exportTitle = exportDisabled ? 'Primero guarda el documento actual' : '';
  const emitTitle = emitDisabled && !state.numeroReservado ? 'Primero guarda la PRE sin cambios pendientes' : '';
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
        <div class="field"><label>RUT</label><input inputmode="text" autocomplete="off" value="${esc(state.rut)}" oninput="this.value=formatRut(this.value);setRutSilent(this.value)" onchange="render()" placeholder="12.345.678-9"></div>
        <div class="field"><label>Dirección</label><input value="${esc(state.direccion)}" oninput="setSilent('direccion',this.value)" onchange="render()"></div>
        <div class="field"><label>Giro</label><input value="${esc(state.giro)}" oninput="setSilent('giro',this.value)" onchange="render()"></div>
        <div class="field"><label>Región</label><select onchange="setRegionSilent(this.value)">${options(REGIONES_COMUNAS.map(r=>r.region), state.ciudad, 'Selecciona región')}</select></div>
        <div class="field"><label>Comuna</label><select ${state.ciudad ? '' : 'disabled'} onchange="setSilent('comuna',this.value);render()">${options(getComunas(state.ciudad), state.comuna, state.ciudad ? 'Selecciona comuna' : 'Primero selecciona región')}</select></div>
        <div class="field"><label>Teléfono</label><input inputmode="numeric" autocomplete="off" value="${esc(state.telefono)}" oninput="this.value=formatPhone(this.value);setPhoneSilent(this.value)" onchange="render()" placeholder="991448386"></div>
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
        <button class="green" onclick="window.print()" ${exportDisabled ? `disabled title="${esc(exportTitle)}"` : ''}>${esc(printTitle)}</button>
        <button class="yellow" onclick="saveDoc()" ${savingDoc?'disabled':''}>${savingDoc?'Guardando...':(state.numeroReservado?'Guardar cambios':'Guardar PRE')}</button>
        <button class="primary" onclick="emitDoc()" ${emitDisabled?'disabled':''} ${emitTitle ? `title="${esc(emitTitle)}"` : ''}>Emitir cotización</button>
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
          <tr><td class="label">Teléfono</td><td>${esc(state.telefono)}</td><td class="label">Región</td><td>${esc(state.ciudad)}</td></tr>
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
