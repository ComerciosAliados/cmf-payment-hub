// Datos 100% ficticios para la demo. Nada aquí es real.
// El estado se guarda en localStorage del navegador.

const STORE_KEY = 'hubPagosDemo.v1';

const METHODS = {
  tarjeta: 'Tarjeta Visa/Mastercard',
  clave: 'Clave',
  ach: 'ACH',
  yappy: 'Yappy',
};

const COMPANIES = ['Rapid Servicios (demo)', 'Rapid Equipos (demo)', 'CMF (demo)'];

const ROLES = {
  admin: { name: 'Administrador', desc: 'Acceso total: usuarios, permisos, configuración y auditoría.' },
  supervisor: { name: 'Supervisor de cobros', desc: 'Ve todos los cobros, crea, anula y revisa reportes.' },
  gestor: { name: 'Gestor de cobros', desc: 'Crea cobros y envía links. Solo ve sus propios cobros.' },
  auditor: { name: 'Auditor', desc: 'Solo lectura: cobros y bitácora de auditoría.' },
};

const PERMISSIONS = [
  ['ver_dashboard', 'Ver dashboard', ['admin', 'supervisor', 'gestor', 'auditor']],
  ['crear_cobro', 'Crear cobros y enviar links', ['admin', 'supervisor', 'gestor']],
  ['ver_todos', 'Ver cobros de todos los gestores', ['admin', 'supervisor', 'auditor']],
  ['anular_cobro', 'Anular cobros', ['admin', 'supervisor']],
  ['ver_clientes', 'Ver clientes', ['admin', 'supervisor', 'gestor', 'auditor']],
  ['gestionar_usuarios', 'Gestionar usuarios y permisos', ['admin']],
  ['ver_auditoria', 'Ver bitácora de auditoría', ['admin', 'auditor']],
  ['integraciones', 'Configurar integraciones y API', ['admin']],
];

function can(role, perm) {
  const p = PERMISSIONS.find((x) => x[0] === perm);
  return !!p && p[2].includes(role);
}

const USERS = [
  { id: 'u1', name: 'Ana Pérez', email: 'ana.perez@ejemplo.com', role: 'admin', active: true },
  { id: 'u2', name: 'Luis Gómez', email: 'luis.gomez@ejemplo.com', role: 'supervisor', active: true },
  { id: 'u3', name: 'María Rodríguez', email: 'maria.rodriguez@ejemplo.com', role: 'gestor', active: true },
  { id: 'u4', name: 'Carlos Díaz', email: 'carlos.diaz@ejemplo.com', role: 'gestor', active: true },
  { id: 'u5', name: 'Elena Castro', email: 'elena.castro@ejemplo.com', role: 'auditor', active: true },
];

const CLIENTS = [
  { id: 'c1', name: 'Constructora Los Pinos S.A.', doc: 'RUC 000-0001-DEMO', phone: '+507 6000-0001', email: 'pagos@lospinos.ejemplo' },
  { id: 'c2', name: 'Juan Herrera', doc: 'Céd. 0-000-0001', phone: '+507 6000-0002', email: 'juan.h@ejemplo.com' },
  { id: 'c3', name: 'Ferretería El Martillo', doc: 'RUC 000-0002-DEMO', phone: '+507 6000-0003', email: 'admin@martillo.ejemplo' },
  { id: 'c4', name: 'Sofía Morales', doc: 'Céd. 0-000-0002', phone: '+507 6000-0004', email: 'sofia.m@ejemplo.com' },
  { id: 'c5', name: 'Distribuidora Istmo', doc: 'RUC 000-0003-DEMO', phone: '+507 6000-0005', email: 'cxp@istmo.ejemplo' },
  { id: 'c6', name: 'Pedro Sánchez', doc: 'Céd. 0-000-0003', phone: '+507 6000-0006', email: 'pedro.s@ejemplo.com' },
];

function daysAgo(n, h = 10) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, (n * 17) % 60, 0, 0);
  return d.toISOString();
}

function seed() {
  const concepts = ['Alquiler de equipo', 'Servicio de mantenimiento', 'Factura pendiente', 'Abono a cuenta', 'Repuestos', 'Instalación'];
  const methodKeys = Object.keys(METHODS);
  const charges = [];
  const audit = [];
  for (let i = 0; i < 24; i++) {
    const c = CLIENTS[i % CLIENTS.length];
    const creator = USERS[2 + (i % 2)];
    const age = Math.floor(i / 2);
    const amount = Math.round((40 + ((i * 137) % 900) + ((i * 13) % 100) / 100) * 100) / 100;
    let status = 'pendiente';
    if (i % 5 !== 0 && i > 2) status = 'pagado';
    if (i % 11 === 0 && i > 0) status = 'vencido';
    if (i === 7) status = 'anulado';
    const ch = {
      id: 'COB-' + String(1024 - i).padStart(5, '0'),
      company: COMPANIES[i % 3 === 2 ? 2 : i % 2],
      clientId: c.id,
      clientName: c.name,
      phone: c.phone,
      email: c.email,
      concept: concepts[i % concepts.length],
      amount,
      methods: methodKeys,
      createdBy: creator.id,
      createdAt: daysAgo(age, 9 + (i % 7)),
      dueDate: daysAgo(age - 7).slice(0, 10),
      status,
    };
    if (status === 'pagado') {
      ch.paidAt = daysAgo(Math.max(age - 1, 0), 14);
      ch.paidMethod = methodKeys[(i + Math.floor(i / 2)) % 4];
      ch.txn = 'TXN-' + (880000 + i * 37);
    }
    charges.push(ch);
  }
  charges.forEach((ch) => {
    const u = USERS.find((x) => x.id === ch.createdBy);
    audit.push({ at: ch.createdAt, user: u.name, action: 'Creó cobro', detail: `${ch.id} · ${fmtMoney(ch.amount)} · ${ch.clientName}` });
    if (ch.paidAt) audit.push({ at: ch.paidAt, user: 'Sistema', action: 'Pago confirmado', detail: `${ch.id} vía ${METHODS[ch.paidMethod]} · ${ch.txn}` });
    if (ch.status === 'anulado') audit.push({ at: ch.createdAt, user: 'Luis Gómez', action: 'Anuló cobro', detail: ch.id });
  });
  return { charges, audit, seq: 1025 };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* almacenamiento no disponible */ }
  const s = seed();
  saveState(s);
  return s;
}

function saveState(s) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) { /* ignorar */ }
}

function resetState() {
  try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignorar */ }
}

function fmtMoney(n) {
  return 'B/. ' + Number(n).toLocaleString('es-PA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso, withTime = false) {
  const d = new Date(iso);
  const opts = { day: '2-digit', month: 'short', year: 'numeric' };
  if (withTime) Object.assign(opts, { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleString('es-PA', opts);
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Los datos del cobro viajan en el link para que funcione en cualquier dispositivo.
// En producción el link solo llevaría un token opaco firmado; el servidor tendría los datos.
function encodeCharge(ch) {
  const payload = { id: ch.id, co: ch.company, cl: ch.clientName, cn: ch.concept, a: ch.amount, m: ch.methods, d: ch.dueDate };
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function decodeCharge(str) {
  try {
    const p = JSON.parse(decodeURIComponent(escape(atob(str))));
    return { id: p.id, company: p.co, clientName: p.cl, concept: p.cn, amount: p.a, methods: p.m, dueDate: p.d };
  } catch (e) {
    return null;
  }
}

function payLink(ch) {
  const base = location.origin + location.pathname.replace(/[^/]*$/, '');
  return base + 'pagar.html?d=' + encodeURIComponent(encodeCharge(ch));
}
