  localStorage.setItem('th_saved',JSON.stringify(saved));
  render();
}

function render(){
  const t=totals();
  const statusClass = counterStatus.type === 'ok' ? 'ok' : counterStatus.type === 'bad' ? 'bad' : 'warn';
  const saveClass = saveStatus.type === 'ok' ? 'ok' : saveStatus.type === 'bad' ? 'bad' : 'warn';
  const exportDisabled = !canExport();
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
        <button class="green" onclick="window.print()" ${exportDisabled ? 'disabled title="Primero guarda el documento"' : ''}>Exportar PDF / Imprimir</button>
        <button class="yellow" onclick="saveDoc()" ${savingDoc?'disabled':''}>${savingDoc?'Guardando...':'Guardar'}</button>
        <button class="primary" onclick="newDoc()" ${loadingNumber || savingDoc?'disabled':''}>+ Nueva Cotización</button>
      </div>

      <div class="section-title">Guardadas</div>
      <div class="saved-list">${saved.map(s=>`<div class="saved"><b>COTIZACIÓN N° ${esc(s.doc.numero)}</b><span>${esc(s.doc.cliente)} · ${esc(s.doc.savedAt||'')}</span><div class="btns"><button class="ghost" onclick="loadDoc('${s.id}')">Abrir</button><button class="danger" onclick="deleteSaved('${s.id}')">Borrar</button></div></div>`).join('')||'<p class="small">Aún no hay documentos guardados.</p>'}</div>
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
  await reserveNextNumber();
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
