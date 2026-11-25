// Página de pago del cliente (demo). Todo es simulado.
const root = document.getElementById('pay');
const params = new URLSearchParams(location.search);
const charge = decodeCharge(params.get('d') || '');

const BANKS = ['Banco General', 'Banistmo', 'BAC Credomatic', 'Banesco', 'Global Bank', 'Caja de Ahorros', 'Banco Nacional de Panamá', 'Multibank', 'Credicorp Bank'];

const METHOD_INFO = {
  cmf: { ic: 'CMF', cls: 'ic-cmf', title: 'Tarjeta CMF', sub: 'Paga con tu tarjeta de crédito CMF, al contado o en cuotas' },
  tarjeta: { ic: 'VISA<br>MC', cls: 'ic-card', title: 'Tarjeta de crédito o débito', sub: 'Visa o Mastercard' },
  clave: { ic: 'CLAVE', cls: 'ic-clave', title: 'Clave', sub: 'Tarjeta de débito de tu banco' },
  ach: { ic: 'ACH', cls: 'ic-ach', title: 'Transferencia ACH', sub: 'Débito desde tu cuenta bancaria' },
  yappy: { ic: 'Yappy', cls: 'ic-yappy', title: 'Yappy', sub: 'Paga desde tu celular' },
};

function localCharge() {
  if (!charge) return null;
  const s = loadState();
  return { s, ch: s.charges.find((c) => c.id === charge.id) };
}

function header() {
  return `<div class="pay-head">
    <div class="brand" style="justify-content:center"><div class="brand-mark">HP</div><b>${esc(charge.company)}</b></div>
    <div class="muted small">Pago para ${esc(charge.clientName)}</div>
    <div class="pay-amount">${fmtMoney(charge.amount)}</div>
    <div class="muted">${esc(charge.concept)} · Ref. ${esc(charge.id)}</div>
  </div>`;
}

const secure = '<div class="secure">🔒 Pago seguro · Tus datos viajan cifrados y no se guardan en este sitio</div>';

function showError(title, text) {
  root.innerHTML = `<div class="card" style="text-align:center;margin-top:2rem"><h2>${title}</h2><p class="muted">${text}</p></div>`;
}

function chooseMethod() {
  const local = localCharge();
  if (local && local.ch) {
    if (local.ch.status === 'pagado') return showReceipt(local.ch.paidMethod, local.ch.txn, local.ch.paidAt);
    if (local.ch.status === 'anulado') return showError('Este link fue anulado', 'Comunícate con tu gestor para recibir un link nuevo.');
  }
  root.innerHTML = `${header()}
    <div class="card">
      <h2>¿Cómo quieres pagar?</h2>
      <div class="methods">${charge.methods.map((m) => `
        <button class="method" data-m="${m}"><div class="ic ${METHOD_INFO[m].cls}">${METHOD_INFO[m].ic}</div>
          <div><b>${METHOD_INFO[m].title}</b><span>${METHOD_INFO[m].sub}</span></div></button>`).join('')}</div>
    </div>${secure}`;
  root.querySelectorAll('[data-m]').forEach((b) => b.onclick = () => FORMS[b.dataset.m]());
}

function formShell(title, body, btnLabel) {
  root.innerHTML = `${header()}
    <div class="card">
      <button class="back" id="back">← Cambiar método</button>
      <h2>${title}</h2>
      <form id="pf">${body}<button class="btn btn-primary btn-block" type="submit">${btnLabel}</button></form>
    </div>${secure}`;
  document.getElementById('back').onclick = chooseMethod;
}

const FORMS = {
  cmf() {
    formShell('Tarjeta CMF', `
      <p class="muted" style="margin-top:0">Ingresa el correo y la cédula registrados en tu cuenta CMF.</p>
      <div class="field"><label>Correo electrónico</label><input required type="email" autocomplete="email" value="cliente@ejemplo.com"></div>
      <div class="field"><label>Cédula</label><input required value="0-000-0000"></div>
      <div class="field"><label>Forma de pago</label><select id="plan">
        <option value="1">Al contado · ${fmtMoney(charge.amount)}</option>
        ${[3, 6, 12].map((n) => `<option value="${n}">${n} cuotas de ${fmtMoney(charge.amount / n)}</option>`).join('')}
      </select></div>
      <p class="muted small">Demo: las cuotas y condiciones reales dependen del producto CMF del cliente.</p>`, `Pagar con Tarjeta CMF`);
    document.getElementById('pf').onsubmit = (e) => { e.preventDefault(); processing('cmf', 'Validando con CMF… te enviaremos un código para confirmar.'); };
  },
  tarjeta() {
    formShell('Tarjeta de crédito o débito', `
      <div class="field"><label>Número de tarjeta</label><input required inputmode="numeric" value="4111 1111 1111 1111"></div>
      <div class="field"><label>Nombre en la tarjeta</label><input required value="${esc(charge.clientName)}"></div>
      <div class="grid-2">
        <div class="field"><label>Vencimiento</label><input required value="12/29"></div>
        <div class="field"><label>CVV</label><input required inputmode="numeric" value="123"></div>
      </div>
      <p class="muted small">Demo: los datos ya vienen llenos con una tarjeta de prueba.</p>`, `Pagar ${fmtMoney(charge.amount)}`);
    document.getElementById('pf').onsubmit = (e) => { e.preventDefault(); processing('tarjeta', 'Procesando el pago con tu banco…'); };
  },
  clave() {
    formShell('Clave', `
      <p class="muted">Serás dirigido a la página segura de tu banco para autorizar el débito con tu tarjeta Clave.</p>
      <div class="field"><label>Tu banco</label><select required>${BANKS.map((b) => `<option>${b}</option>`).join('')}</select></div>`, 'Continuar a mi banco');
    document.getElementById('pf').onsubmit = (e) => { e.preventDefault(); processing('clave', 'Conectando con tu banco… autoriza el pago con tu PIN.'); };
  },
  ach() {
    formShell('Transferencia ACH', `
      <div class="field"><label>Banco</label><select required>${BANKS.map((b) => `<option>${b}</option>`).join('')}</select></div>
      <div class="grid-2">
        <div class="field"><label>Tipo de cuenta</label><select><option>Ahorros</option><option>Corriente</option></select></div>
        <div class="field"><label>Número de cuenta</label><input required inputmode="numeric" value="00-00-00-000000"></div>
      </div>
      <div class="field"><label>Titular de la cuenta</label><input required value="${esc(charge.clientName)}"></div>
      <label class="check"><input type="checkbox" required checked> Autorizo el débito de ${fmtMoney(charge.amount)} de mi cuenta.</label>
      <div style="height:.75rem"></div>`, 'Autorizar débito ACH');
    document.getElementById('pf').onsubmit = (e) => { e.preventDefault(); processing('ach', 'Enviando la orden de débito ACH…'); };
  },
  yappy() {
    formShell('Yappy', `
      <p class="muted">Ingresa tu número de celular registrado en Yappy. Te llegará una notificación para aprobar el pago.</p>
      <div class="field"><label>Celular</label><input required inputmode="tel" value="6000-0000"></div>`, 'Enviar solicitud a Yappy');
    document.getElementById('pf').onsubmit = (e) => { e.preventDefault(); processing('yappy', 'Abre tu app Yappy y aprueba el pago…'); };
  },
};

function processing(method, text) {
  root.innerHTML = `${header()}<div class="card" style="text-align:center"><div class="spinner"></div><p><b>${text}</b></p><p class="muted small">No cierres esta página.</p></div>`;
  setTimeout(() => {
    const txn = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
    const at = new Date().toISOString();
    const local = localCharge();
    if (local && local.ch) {
      Object.assign(local.ch, { status: 'pagado', paidMethod: method, txn, paidAt: at });
      local.s.audit.push({ at, user: 'Sistema', action: 'Pago confirmado', detail: `${local.ch.id} vía ${METHODS[method]} · ${txn}` });
      saveState(local.s);
    }
    showReceipt(method, txn, at);
  }, method === 'yappy' ? 3000 : 2200);
}

function showReceipt(method, txn, at) {
  root.innerHTML = `${header()}
    <div class="card" style="text-align:center">
      <div class="success-ic">✓</div>
      <h2>¡Pago recibido!</h2>
      <p class="muted">Gracias, ${esc(charge.clientName.split(' ')[0])}. Te enviamos el comprobante por WhatsApp y correo.</p>
      <div class="receipt" style="text-align:left;margin-top:1rem">
        <div><span class="muted">Referencia</span><b>${esc(charge.id)}</b></div>
        <div><span class="muted">Transacción</span><b>${esc(txn)}</b></div>
        <div><span class="muted">Método</span><b>${esc(METHODS[method])}</b></div>
        <div><span class="muted">Fecha</span><b>${fmtDate(at, true)}</b></div>
        <div><span class="muted">Monto</span><b>${fmtMoney(charge.amount)}</b></div>
      </div>
      <button class="btn btn-block" style="margin-top:1rem" onclick="window.print()">Descargar comprobante</button>
    </div>${secure}`;
}

if (!charge) showError('Link inválido', 'Este link de pago no es válido o está incompleto. Pide a tu gestor que te lo reenvíe.');
else chooseMethod();
