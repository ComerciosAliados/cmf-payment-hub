// Panel interno del Hub de Pagos (demo).
let state = loadState();
let me = null;

const SESSION_KEY = 'hubPagosDemo.session';

const NAV = [
  { route: 'inicio', label: 'Inicio', icon: '◧', perm: 'ver_dashboard' },
  { route: 'nuevo', label: 'Nuevo cobro', icon: '＋', perm: 'crear_cobro' },
  { route: 'cobros', label: 'Cobros', icon: '≡', perm: 'ver_dashboard' },
  { route: 'clientes', label: 'Clientes', icon: '☺', perm: 'ver_clientes' },
  { sep: 'Administración' },
  { route: 'usuarios', label: 'Usuarios y permisos', icon: '⚿', perm: 'gestionar_usuarios' },
  { route: 'auditoria', label: 'Auditoría', icon: '⌕', perm: 'ver_auditoria' },
  { route: 'integraciones', label: 'Integraciones y API', icon: '⇄', perm: 'ver_dashboard' },
];

const $ = (sel) => document.querySelector(sel);

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

function log(action, detail) {
  state.audit.push({ at: new Date().toISOString(), user: me.name, action, detail });
  saveState(state);
}

function visibleCharges() {
  const all = state.charges.map(refreshStatus);
  return can(me.role, 'ver_todos') ? all : all.filter((c) => c.createdBy === me.id);
}

function refreshStatus(ch) {
  if (ch.status === 'pendiente' && ch.dueDate && ch.dueDate < new Date().toISOString().slice(0, 10)) ch.status = 'vencido';
  return ch;
}

function typeBadge(t) {
  return `<span class="badge ${t === 'abono' ? 'b-pendiente' : 'b-info'}">${CHARGE_TYPES[t] || CHARGE_TYPES.pago_completo}</span>`;
}

function badge(status) {
  return `<span class="badge b-${status}">${status[0].toUpperCase() + status.slice(1)}</span>`;
}

// ---------------- Login ----------------
function showLogin() {
  $('#app').classList.add('hidden');
  $('#login').classList.remove('hidden');
  $('#role-buttons').innerHTML = USERS.filter((u) => u.id !== 'u4').map((u) => `
    <button class="btn role-btn" data-uid="${u.id}">Entrar como ${esc(ROLES[u.role].name)}
      <span>${esc(u.name)} · ${esc(ROLES[u.role].desc)}</span></button>`).join('');
  document.querySelectorAll('[data-uid]').forEach((b) => b.addEventListener('click', () => login(b.dataset.uid)));
}

function login(uid) {
  me = USERS.find((u) => u.id === uid);
  try { sessionStorage.setItem(SESSION_KEY, uid); } catch (e) { /* ignorar */ }
  log('Inició sesión', `Perfil: ${ROLES[me.role].name}`);
  $('#login').classList.add('hidden');
  $('#app').classList.remove('hidden');
  if (!location.hash || location.hash === '#/') location.hash = '#/inicio';
  render();
}

function logout() {
  log('Cerró sesión', '');
  me = null;
  try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignorar */ }
  location.hash = '';
  showLogin();
}

// ---------------- Shell ----------------
function renderShell(route) {
  $('#nav').innerHTML = NAV.map((n) => {
    if (n.sep) return `<div class="sep">${n.sep}</div>`;
    if (!can(me.role, n.perm)) return '';
    return `<a href="#/${n.route}" class="${n.route === route ? 'active' : ''}"><span>${n.icon}</span>${n.label}</a>`;
  }).join('');
  $('#user-box').innerHTML = `<b>${esc(me.name)}</b>${esc(ROLES[me.role].name)}
    <div style="display:flex;gap:.4rem;flex-wrap:wrap">
      <button class="btn btn-sm" id="logout">Cambiar perfil</button>
      <button class="btn btn-sm" id="reset" title="Restaura los datos de ejemplo">Reiniciar demo</button>
    </div>`;
  $('#logout').onclick = logout;
  $('#reset').onclick = () => {
    if (!confirm('¿Restaurar los datos de ejemplo? Se perderán los cobros creados en esta demo.')) return;
    resetState();
    state = loadState();
    toast('Datos de ejemplo restaurados');
    render();
  };
  $('#sidebar').classList.remove('open');
}

function render() {
  if (!me) return showLogin();
  state = loadState();
  const route = (location.hash.replace('#/', '') || 'inicio').split('?')[0];
  const item = NAV.find((n) => n.route === route);
  renderShell(route);
  const view = $('#view');
  if (!item || !can(me.role, item.perm)) {
    view.innerHTML = `<div class="card"><h2>Sin acceso</h2><p class="muted">Tu perfil (${esc(ROLES[me.role].name)}) no tiene permiso para ver esta sección.</p></div>`;
    log('Acceso denegado', `Intentó abrir: ${route}`);
    return;
  }
  ({ inicio: viewDashboard, cobros: viewCharges, nuevo: viewNew, clientes: viewClients, usuarios: viewUsers, auditoria: viewAudit, integraciones: viewIntegrations })[route](view);
  window.scrollTo(0, 0);
}

// ---------------- Dashboard ----------------
function viewDashboard(v) {
  const list = visibleCharges();
  const paid = list.filter((c) => c.status === 'pagado');
  const pending = list.filter((c) => c.status === 'pendiente');
  const sum = (arr) => arr.reduce((a, c) => a + c.amount, 0);
  const sent = list.filter((c) => c.status !== 'anulado').length;
  const conv = sent ? Math.round((paid.length / sent) * 100) : 0;
  const byMethod = Object.keys(METHODS).map((k) => ({ k, total: sum(paid.filter((c) => c.paidMethod === k)), n: paid.filter((c) => c.paidMethod === k).length }));
  const max = Math.max(1, ...byMethod.map((m) => m.total));
  const recent = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  v.innerHTML = `
    <div class="page-head"><div><h1>Hola, ${esc(me.name.split(' ')[0])}</h1>
      <div class="muted">${can(me.role, 'ver_todos') ? 'Resumen de todos los cobros' : 'Resumen de tus cobros'}</div></div>
      ${can(me.role, 'crear_cobro') ? '<a class="btn btn-primary" href="#/nuevo">＋ Nuevo cobro</a>' : ''}</div>
    <div class="kpis">
      <div class="card kpi"><div class="label">Total recaudado</div><div class="value">${fmtMoney(sum(paid))}</div><div class="muted small">${paid.length} pagos</div></div>
      <div class="card kpi"><div class="label">Por cobrar</div><div class="value">${fmtMoney(sum(pending))}</div><div class="muted small">${pending.length} links pendientes</div></div>
      <div class="card kpi"><div class="label">Tasa de pago</div><div class="value">${conv}%</div><div class="muted small">links pagados / enviados</div></div>
      <div class="card kpi"><div class="label">Vencidos</div><div class="value">${list.filter((c) => c.status === 'vencido').length}</div><div class="muted small">requieren seguimiento</div></div>
    </div>
    <div class="two-col">
      <div class="card"><h2>Últimos cobros</h2><div class="table-wrap"><table>
        <thead><tr><th>Cobro</th><th>Cliente</th><th class="num">Monto</th><th>Estado</th></tr></thead>
        <tbody>${recent.map((c) => `<tr><td><b>${c.id}</b><div class="muted small">${fmtDate(c.createdAt)}</div></td><td>${esc(c.clientName)}</td><td class="num">${fmtMoney(c.amount)}</td><td>${badge(c.status)}</td></tr>`).join('')}</tbody>
      </table></div><p><a href="#/cobros">Ver todos →</a></p></div>
      <div class="card"><h2>Recaudo por método</h2><p class="muted small" style="margin-top:0">Qué eligen los clientes cuando reciben el link.</p>
        <div class="bars">${byMethod.map((m) => `<div class="row"><span>${METHODS[m.k].replace(' Visa/Mastercard', '')}</span><div class="track"><div class="fill" style="width:${(m.total / max) * 100}%"></div></div><span class="num small">${fmtMoney(m.total)}</span></div>`).join('')}</div>
      </div>
    </div>`;
}

// ---------------- Cobros ----------------
function viewCharges(v) {
  v.innerHTML = `
    <div class="page-head"><div><h1>Cobros</h1><div class="muted">${can(me.role, 'ver_todos') ? 'Todos los gestores' : 'Solo los cobros que creaste'}</div></div>
      ${can(me.role, 'crear_cobro') ? '<a class="btn btn-primary" href="#/nuevo">＋ Nuevo cobro</a>' : ''}</div>
    <div class="card">
      <div class="toolbar">
        <input id="q" placeholder="Buscar cliente o número…">
        <select id="f-status"><option value="">Todos los estados</option><option>pendiente</option><option>pagado</option><option>vencido</option><option>anulado</option></select>
        <select id="f-company"><option value="">Todas las empresas</option>${COMPANIES.map((c) => `<option>${esc(c)}</option>`).join('')}</select>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Cobro</th><th>Cliente</th><th>Concepto</th><th>Tipo</th><th class="num">Monto</th><th>Estado</th><th>Pagado con</th><th></th></tr></thead>
        <tbody id="rows"></tbody>
      </table></div>
    </div>`;
  const draw = () => {
    const q = $('#q').value.toLowerCase();
    const st = $('#f-status').value;
    const co = $('#f-company').value;
    const rows = visibleCharges()
      .filter((c) => (!q || (c.clientName + c.id).toLowerCase().includes(q)) && (!st || c.status === st) && (!co || c.company === co))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    $('#rows').innerHTML = rows.length ? rows.map((c) => `
      <tr><td><b>${c.id}</b><div class="muted small">${fmtDate(c.createdAt)}</div></td>
      <td>${esc(c.clientName)}<div class="muted small">${esc(c.company)}</div></td>
      <td>${esc(c.concept)}${c.externalRef ? `<div class="muted small">${esc(c.externalRef)}</div>` : ''}</td>
      <td>${typeBadge(c.chargeType)}</td><td class="num">${fmtMoney(c.amount)}</td><td>${badge(c.status)}</td>
      <td>${c.paidMethod ? esc(METHODS[c.paidMethod]) + `<div class="muted small">${c.txn}</div>` : '<span class="muted">—</span>'}</td>
      <td style="white-space:nowrap">
        ${c.status === 'pendiente' ? `<button class="btn btn-sm" data-share="${c.id}">Enviar link</button>` : ''}
        ${c.status === 'pendiente' && can(me.role, 'anular_cobro') ? `<button class="btn btn-sm btn-danger" data-void="${c.id}">Anular</button>` : ''}
      </td></tr>`).join('') : '<tr><td colspan="8" class="muted">No hay cobros con esos filtros.</td></tr>';
    document.querySelectorAll('[data-share]').forEach((b) => b.onclick = () => shareModal(state.charges.find((c) => c.id === b.dataset.share)));
    document.querySelectorAll('[data-void]').forEach((b) => b.onclick = () => {
      const ch = state.charges.find((c) => c.id === b.dataset.void);
      if (!confirm(`¿Anular ${ch.id}? El link dejará de funcionar.`)) return;
      ch.status = 'anulado';
      log('Anuló cobro', ch.id);
      saveState(state);
      toast(`${ch.id} anulado`);
      draw();
    });
  };
  ['#q', '#f-status', '#f-company'].forEach((s) => $(s).addEventListener('input', draw));
  draw();
}

// ---------------- Nuevo cobro ----------------
function viewNew(v) {
  const due = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  v.innerHTML = `
    <div class="page-head"><div><h1>Nuevo cobro</h1><div class="muted">Ingresa el monto y a quién cobrar. El cliente elige cómo pagar.</div></div></div>
    <form class="card" id="f" style="max-width:720px">
      <div class="grid-2">
        <div class="field"><label>Empresa</label><select id="company">${COMPANIES.map((c) => `<option>${esc(c)}</option>`).join('')}</select></div>
        <div class="field"><label>Cliente</label><select id="client"><option value="">— Cliente nuevo —</option>${CLIENTS.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Nombre del cliente</label><input id="cname" required></div>
        <div class="field"><label>WhatsApp</label><input id="cphone" placeholder="+507 6000-0000"></div>
      </div>
      <div class="field"><label>Correo (opcional)</label><input id="cemail" type="email"></div>
      <div class="grid-2">
        <div class="field"><label>Monto (B/.)</label><input id="amount" type="number" min="1" step="0.01" required placeholder="0.00" style="font-size:1.2rem;font-weight:700"></div>
        <div class="field"><label>Vence</label><input id="due" type="date" value="${due}"></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Tipo de cobro</label><select id="ctype">${Object.entries(CHARGE_TYPES).map(([k, n]) => `<option value="${k}">${n}</option>`).join('')}</select></div>
        <div class="field"><label>N.º de cotización o factura</label><input id="extref" placeholder="Ej. COT-5231 o FAC-1234"></div>
      </div>
      <div class="field"><label>Concepto</label><input id="concept" required placeholder="Ej. Abono 30% instalación de equipo, mantenimiento mensual…">
        <div class="muted small" style="margin-top:.3rem">Para pagos por etapas (ej. 30-30-40), crea un cobro tipo <b>Abono</b> por cada etapa con el mismo n.º de documento.</div></div>
      <div class="field"><label>Métodos de pago permitidos</label>
        ${Object.entries(METHODS).map(([k, n]) => `<label class="check"><input type="checkbox" name="m" value="${k}" checked> ${n}</label>`).join('')}</div>
      <button class="btn btn-primary" type="submit">Generar link de pago</button>
    </form>`;
  $('#client').onchange = (e) => {
    const c = CLIENTS.find((x) => x.id === e.target.value);
    $('#cname').value = c ? c.name : '';
    $('#cphone').value = c ? c.phone : '';
    $('#cemail').value = c ? c.email : '';
  };
  $('#f').onsubmit = (e) => {
    e.preventDefault();
    const methods = [...document.querySelectorAll('[name=m]:checked')].map((x) => x.value);
    if (!methods.length) return toast('Selecciona al menos un método de pago');
    const ch = {
      id: 'COB-' + String(state.seq++).padStart(5, '0'),
      company: $('#company').value,
      clientId: $('#client').value || null,
      clientName: $('#cname').value.trim(),
      phone: $('#cphone').value.trim(),
      email: $('#cemail').value.trim(),
      concept: $('#concept').value.trim(),
      chargeType: $('#ctype').value,
      externalRef: $('#extref').value.trim(),
      amount: Math.round(parseFloat($('#amount').value) * 100) / 100,
      methods,
      createdBy: me.id,
      createdAt: new Date().toISOString(),
      dueDate: $('#due').value,
      status: 'pendiente',
    };
    state.charges.push(ch);
    log('Creó cobro', `${ch.id} · ${fmtMoney(ch.amount)} · ${ch.clientName}`);
    saveState(state);
    shareModal(ch, true);
  };
}

function shareModal(ch, isNew = false) {
  const link = payLink(ch);
  const msg = `Hola ${ch.clientName}, tienes un pago pendiente con ${ch.company} por ${fmtMoney(ch.amount)} (${(CHARGE_TYPES[ch.chargeType] || 'Pago').toLowerCase()}: ${ch.concept}${ch.externalRef ? ', ' + ch.externalRef : ''}). Puedes pagar aquí con Tarjeta CMF, Visa/Mastercard, Clave, ACH o Yappy: ${link}`;
  const phone = (ch.phone || '').replace(/\D/g, '');
  $('#modal-root').innerHTML = `
    <div class="modal-bg" id="mbg"><div class="modal" role="dialog" aria-modal="true">
      ${isNew ? '<div class="success-ic">✓</div>' : ''}
      <h2 style="text-align:center">${isNew ? 'Link de pago generado' : 'Enviar link de pago'}</h2>
      <p class="muted" style="text-align:center;margin-top:0">${ch.id} · ${esc(ch.clientName)} · <b>${fmtMoney(ch.amount)}</b></p>
      <div class="linkbox"><input id="lnk" readonly value="${esc(link)}"><button class="btn" id="copy">Copiar</button></div>
      <div class="share">
        <a class="btn" target="_blank" rel="noopener" href="https://wa.me/${phone}?text=${encodeURIComponent(msg)}">WhatsApp</a>
        <a class="btn" href="mailto:${esc(ch.email)}?subject=${encodeURIComponent('Link de pago ' + ch.id)}&body=${encodeURIComponent(msg)}">Correo</a>
        <a class="btn btn-primary" target="_blank" rel="noopener" href="${esc(link)}">Ver como cliente</a>
      </div>
      <p class="muted small">Tip para la demo: abre “Ver como cliente”, paga, y vuelve a <b>Cobros</b>: el estado cambia a <b>Pagado</b>.</p>
      <button class="btn btn-block" id="close" style="margin-top:.5rem">Cerrar</button>
    </div></div>`;
  const close = () => { $('#modal-root').innerHTML = ''; if (isNew) location.hash = '#/cobros'; };
  $('#close').onclick = close;
  $('#mbg').onclick = (e) => { if (e.target.id === 'mbg') close(); };
  $('#copy').onclick = async () => {
    try { await navigator.clipboard.writeText(link); } catch (e) { $('#lnk').select(); document.execCommand('copy'); }
    log('Copió link', ch.id);
    toast('Link copiado');
  };
}

// ---------------- Clientes ----------------
function viewClients(v) {
  const list = visibleCharges();
  v.innerHTML = `
    <div class="page-head"><div><h1>Clientes</h1><div class="muted">Fase 2: se sincronizan desde Odoo.</div></div></div>
    <div class="card"><div class="table-wrap"><table>
      <thead><tr><th>Cliente</th><th>Documento</th><th>Contacto</th><th class="num">Pagado</th><th class="num">Pendiente</th></tr></thead>
      <tbody>${CLIENTS.map((c) => {
        const mine = list.filter((x) => x.clientId === c.id);
        const s = (st) => mine.filter((x) => x.status === st).reduce((a, x) => a + x.amount, 0);
        return `<tr><td><b>${esc(c.name)}</b></td><td>${esc(c.doc)}</td><td>${esc(c.phone)}<div class="muted small">${esc(c.email)}</div></td>
          <td class="num">${fmtMoney(s('pagado'))}</td><td class="num">${fmtMoney(s('pendiente'))}</td></tr>`;
      }).join('')}</tbody></table></div></div>`;
}

// ---------------- Usuarios y permisos ----------------
function viewUsers(v) {
  const roleKeys = Object.keys(ROLES);
  v.innerHTML = `
    <div class="page-head"><div><h1>Usuarios y permisos</h1><div class="muted">Control de acceso por roles.</div></div>
      <button class="btn btn-primary" id="inv">＋ Invitar usuario</button></div>
    <div class="card" style="margin-bottom:1rem"><h2>Usuarios</h2><div class="table-wrap"><table>
      <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>2FA</th><th>Estado</th></tr></thead>
      <tbody>${USERS.map((u) => `<tr><td><b>${esc(u.name)}</b></td><td>${esc(u.email)}</td><td>${esc(ROLES[u.role].name)}</td><td><span class="badge b-pagado">Activo</span></td><td><span class="badge b-info">Activo</span></td></tr>`).join('')}</tbody>
    </table></div></div>
    <div class="card"><h2>Matriz de permisos</h2><div class="table-wrap"><table class="perm-table">
      <thead><tr><th>Permiso</th>${roleKeys.map((r) => `<th>${ROLES[r].name}</th>`).join('')}</tr></thead>
      <tbody>${PERMISSIONS.map((p) => `<tr><td>${p[1]}</td>${roleKeys.map((r) => p[2].includes(r) ? '<td class="yes">✓</td>' : '<td class="no">—</td>').join('')}</tr>`).join('')}</tbody>
    </table></div>
    <p class="muted small">Además: contraseñas con política de complejidad, 2FA obligatorio, bloqueo tras intentos fallidos, sesiones con expiración y registro de toda acción en la bitácora.</p></div>`;
  $('#inv').onclick = () => toast('En la versión real se envía una invitación por correo.');
}

// ---------------- Auditoría ----------------
function viewAudit(v) {
  const rows = [...state.audit].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 80);
  v.innerHTML = `
    <div class="page-head"><div><h1>Bitácora de auditoría</h1><div class="muted">Registro inmutable de quién hizo qué y cuándo.</div></div></div>
    <div class="card"><div class="table-wrap"><table>
      <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Detalle</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td class="small" style="white-space:nowrap">${fmtDate(r.at, true)}</td><td>${esc(r.user)}</td><td><b>${esc(r.action)}</b></td><td class="small">${esc(r.detail)}</td></tr>`).join('')}</tbody>
    </table></div></div>`;
}

// ---------------- Integraciones ----------------
function viewIntegrations(v) {
  v.innerHTML = `
    <div class="page-head"><div><h1>Integraciones y API</h1><div class="muted">Hoja de ruta del hub.</div></div></div>
    <div class="int-grid">
      <div class="card"><span class="badge b-pagado">Fase 1</span><h3 style="margin-top:.6rem">Pasarela de pagos</h3>
        <p class="muted small">Tarjeta CMF, Visa/Mastercard, Clave, ACH y Yappy, usando las APIs de la pasarela existente.</p></div>
      <div class="card"><span class="badge b-pendiente">Fase 2</span><h3 style="margin-top:.6rem">Odoo (ERP)</h3>
        <p class="muted small">Catálogo de precios y servicios, clientes y facturas. Los pagos se registran de vuelta en Odoo automáticamente.</p></div>
      <div class="card"><span class="badge b-info">Fase 3</span><h3 style="margin-top:.6rem">WhatsApp Business</h3>
        <p class="muted small">El cliente consulta su saldo, recibe su link y paga sin hablar con un gestor.</p></div>
    </div>
    <div class="card"><h2>API del hub (borrador)</h2>
      <p class="muted small" style="margin-top:0">Para que otros sistemas se conecten. Autenticación con token por sistema, permisos por alcance y registro en auditoría.</p>
      <pre class="code"><code>POST /api/v1/cobros            Crear cobro y obtener link de pago
GET  /api/v1/cobros/{id}       Consultar estado de un cobro
GET  /api/v1/cobros?cliente=…  Listar cobros de un cliente
POST /api/v1/cobros/{id}/anular
GET  /api/v1/clientes/{id}/saldo

Webhook saliente →  cobro.pagado  (para Odoo / WhatsApp)</code></pre>
      <pre class="code"><code>// Ejemplo: crear cobro
POST /api/v1/cobros
{
  "empresa": "rapid-servicios",
  "cliente": { "nombre": "Juan Herrera", "whatsapp": "+50760000002" },
  "monto": 125.50,
  "tipo": "abono",               // "abono" | "pago_completo"
  "referencia": "COT-5231",      // cotización o factura en el sistema de la empresa
  "concepto": "Abono 30% instalación",
  "metodos": ["cmf", "tarjeta", "clave", "ach", "yappy"]
}

// Respuesta
{ "id": "COB-01025", "estado": "pendiente", "link": "https://…/pagar/abc123" }</code></pre>
    </div>`;
}

// ---------------- Init ----------------
window.addEventListener('hashchange', render);
// Refresca al volver de la página de pago (sin borrar un formulario a medio llenar).
const softRefresh = () => { if (me && !location.hash.startsWith('#/nuevo') && !$('#modal-root').innerHTML) render(); };
window.addEventListener('focus', softRefresh);
window.addEventListener('storage', softRefresh);
$('#menu-btn').onclick = () => $('#sidebar').classList.toggle('open');

(function init() {
  let uid = null;
  try { uid = sessionStorage.getItem(SESSION_KEY); } catch (e) { /* ignorar */ }
  me = USERS.find((u) => u.id === uid) || null;
  if (me) {
    $('#app').classList.remove('hidden');
    if (!location.hash) location.hash = '#/inicio';
    render();
  } else {
    showLogin();
  }
})();
