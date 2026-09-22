import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';
import { DatabaseSync } from 'node:sqlite';

const scrypt = promisify(scryptCallback);
const root = fileURLToPath(new URL('.', import.meta.url));
const dataDirectory = join(root, 'data');
const videoFile = process.env.SOCIALRISE_VIDEO_FILE || '/home/blackhat/Descargas/09220040-jtn_final_video_4k.mp4';
await mkdir(dataDirectory, { recursive: true });
const db = new DatabaseSync(join(dataDirectory, 'socialrise.sqlite'));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL COLLATE NOCASE UNIQUE,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    balance_cents INTEGER NOT NULL DEFAULT 0 CHECK(balance_cents >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS deposits (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
    note TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'credited', 'rejected')),
    credited_by INTEGER REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TEXT
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
    items_json TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${Buffer.from(derived).toString('hex')}`;
}

async function passwordMatches(password, storedHash) {
  const [salt, saved] = storedHash.split(':');
  const derived = Buffer.from(await scrypt(password, salt, 64));
  const savedBuffer = Buffer.from(saved, 'hex');
  return savedBuffer.length === derived.length && timingSafeEqual(savedBuffer, derived);
}

const adminUsername = 'volka';
const adminPassword = process.env.SOCIALRISE_ADMIN_PASSWORD || 'Axl461268';
const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUsername);
if (!existingAdmin) {
  db.prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(adminUsername, 'admin@socialrise.local', await hashPassword(adminPassword), 'admin');
}

function json(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(body));
}

function parseCookies(request) {
  return Object.fromEntries((request.headers.cookie || '').split(';').filter(Boolean).map((part) => {
    const index = part.indexOf('=');
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }));
}

function tokenHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

function currentUser(request) {
  const token = parseCookies(request).socialrise_session;
  if (!token) return null;
  const session = db.prepare(`
    SELECT users.id, users.username, users.email, users.role, users.balance_cents
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(tokenHash(token), Date.now());
  return session || null;
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    balanceCents: user.balance_cents,
  };
}

function requireUser(request, response) {
  const user = currentUser(request);
  if (!user) {
    json(response, 401, { error: 'Inicia sesión para continuar.' });
    return null;
  }
  return user;
}

function requireAdmin(request, response) {
  const user = requireUser(request, response);
  if (!user || user.role !== 'admin') {
    if (user) json(response, 403, { error: 'No tienes permisos de administración.' });
    return null;
  }
  return user;
}

async function readBody(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 20_000) throw new Error('La solicitud es demasiado grande.');
  }
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    throw new Error('Datos inválidos.');
  }
}

function cents(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0 || number > 100000) return null;
  return Math.round(number * 100);
}

function calculateOrderCents(items) {
  if (!Array.isArray(items) || !items.length || items.length > 30) throw new Error('El pedido no es válido.');
  const allowedTypes = { Seguidores: 10000, Likes: 5000, Vistas: 5000 };
  const allowedNetworks = new Set(['Instagram', 'TikTok', 'Facebook', 'YouTube']);
  const total = items.reduce((sum, item) => {
    const amount = Number(item.amount);
    const target = typeof item.target === 'string' ? item.target.trim() : '';
    const validUsername = item.type === 'Seguidores' && /^@?[a-zA-Z0-9._-]{2,50}$/.test(target);
    let validVideoLink = false;
    if (item.type !== 'Seguidores' && target) {
      try {
        const url = new URL(target);
        validVideoLink = url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        validVideoLink = false;
      }
    }
    if (!allowedNetworks.has(item.network) || !Number.isInteger(amount) || amount < 100 || amount > 10_000_000 || !allowedTypes[item.type] || (!validUsername && !validVideoLink)) {
      throw new Error('El pedido contiene un servicio inválido.');
    }
    const regular = Math.round((amount / 10000) * allowedTypes[item.type]);
    return sum + (regular > 12000 ? Math.round(regular * 0.7) : regular);
  }, 0);
  if (total < 500) throw new Error('La compra mínima es de $5.00.');
  return total;
}

function setSession(response, userId) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 14;
  db.prepare('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)').run(userId, tokenHash(token), expiresAt);
  response.setHeader('Set-Cookie', `socialrise_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=1209600`);
}

async function handleApi(request, response, url) {
  const { pathname } = url;
  if (request.method === 'POST' && pathname === '/api/auth/register') {
    const { username = '', email = '', password = '' } = await readBody(request);
    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(cleanUsername)) return json(response, 400, { error: 'El usuario debe tener 3–24 caracteres: letras, números o guion bajo.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return json(response, 400, { error: 'Escribe un correo electrónico válido.' });
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) return json(response, 400, { error: 'La contraseña debe tener al menos 8 caracteres.' });
    try {
      const result = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)')
        .run(cleanUsername, cleanEmail, await hashPassword(password));
      setSession(response, Number(result.lastInsertRowid));
      const user = db.prepare('SELECT id, username, email, role, balance_cents FROM users WHERE id = ?').get(result.lastInsertRowid);
      return json(response, 201, { user: publicUser(user) });
    } catch (error) {
      return json(response, 409, { error: 'Ese usuario o correo electrónico ya está registrado.' });
    }
  }

  if (request.method === 'POST' && pathname === '/api/auth/login') {
    const { identifier = '', password = '' } = await readBody(request);
    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(String(identifier).trim(), String(identifier).trim().toLowerCase());
    if (!user || typeof password !== 'string' || !(await passwordMatches(password, user.password_hash))) {
      return json(response, 401, { error: 'Usuario/correo o contraseña incorrectos.' });
    }
    setSession(response, user.id);
    return json(response, 200, { user: publicUser(user) });
  }

  if (request.method === 'POST' && pathname === '/api/auth/logout') {
    const token = parseCookies(request).socialrise_session;
    if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash(token));
    response.setHeader('Set-Cookie', 'socialrise_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
    return json(response, 200, { ok: true });
  }

  if (request.method === 'GET' && pathname === '/api/auth/me') {
    const user = currentUser(request);
    return json(response, 200, { user: user ? publicUser(user) : null });
  }

  if (request.method === 'GET' && pathname === '/api/wallet') {
    const user = requireUser(request, response);
    if (!user) return;
    const deposits = db.prepare('SELECT id, amount_cents, note, status, created_at, resolved_at FROM deposits WHERE user_id = ? ORDER BY id DESC LIMIT 20').all(user.id);
    const orders = db.prepare('SELECT id, amount_cents, payment_method, created_at FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 10').all(user.id);
    return json(response, 200, { balanceCents: user.balance_cents, deposits, orders });
  }

  if (request.method === 'POST' && pathname === '/api/wallet/deposits') {
    const user = requireUser(request, response);
    if (!user) return;
    const { amount, note = '' } = await readBody(request);
    const amountCents = cents(amount);
    if (!amountCents) return json(response, 400, { error: 'Escribe un monto válido entre $0.01 y $100,000.' });
    const result = db.prepare('INSERT INTO deposits (user_id, amount_cents, note) VALUES (?, ?, ?)').run(user.id, amountCents, String(note).trim().slice(0, 240));
    return json(response, 201, { depositId: Number(result.lastInsertRowid), message: 'Solicitud enviada. El saldo se acreditará tras la revisión.' });
  }

  if (request.method === 'POST' && pathname === '/api/wallet/pay') {
    const user = requireUser(request, response);
    if (!user) return;
    const { items } = await readBody(request);
    let amountCents;
    try { amountCents = calculateOrderCents(items); } catch (error) { return json(response, 400, { error: error.message }); }
    db.exec('BEGIN IMMEDIATE');
    try {
      const fresh = db.prepare('SELECT balance_cents FROM users WHERE id = ?').get(user.id);
      if (!fresh || fresh.balance_cents < amountCents) throw new Error('Saldo insuficiente en tu wallet.');
      db.prepare('UPDATE users SET balance_cents = balance_cents - ? WHERE id = ?').run(amountCents, user.id);
      const order = db.prepare('INSERT INTO orders (user_id, amount_cents, items_json, payment_method) VALUES (?, ?, ?, ?)')
        .run(user.id, amountCents, JSON.stringify(items), 'wallet');
      db.exec('COMMIT');
      return json(response, 201, { orderId: Number(order.lastInsertRowid), amountCents, message: 'Pago con wallet confirmado.' });
    } catch (error) {
      db.exec('ROLLBACK');
      return json(response, 400, { error: error.message });
    }
  }

  if (request.method === 'GET' && pathname === '/api/admin/users') {
    const admin = requireAdmin(request, response);
    if (!admin) return;
    const users = db.prepare('SELECT id, username, email, role, balance_cents, created_at FROM users ORDER BY id DESC').all();
    const deposits = db.prepare(`
      SELECT deposits.id, deposits.amount_cents, deposits.note, deposits.status, deposits.created_at,
             users.username, users.email
      FROM deposits JOIN users ON users.id = deposits.user_id
      ORDER BY CASE deposits.status WHEN 'pending' THEN 0 ELSE 1 END, deposits.id DESC LIMIT 100
    `).all();
    return json(response, 200, { users, deposits });
  }

  const creditMatch = pathname.match(/^\/api\/admin\/deposits\/(\d+)\/credit$/);
  if (request.method === 'POST' && creditMatch) {
    const admin = requireAdmin(request, response);
    if (!admin) return;
    const depositId = Number(creditMatch[1]);
    db.exec('BEGIN IMMEDIATE');
    try {
      const deposit = db.prepare('SELECT * FROM deposits WHERE id = ?').get(depositId);
      if (!deposit || deposit.status !== 'pending') throw new Error('Esta solicitud ya fue procesada o no existe.');
      db.prepare("UPDATE deposits SET status = 'credited', credited_by = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?").run(admin.id, depositId);
      db.prepare('UPDATE users SET balance_cents = balance_cents + ? WHERE id = ?').run(deposit.amount_cents, deposit.user_id);
      db.exec('COMMIT');
      return json(response, 200, { message: 'Depósito acreditado correctamente.' });
    } catch (error) {
      db.exec('ROLLBACK');
      return json(response, 400, { error: error.message });
    }
  }

  return json(response, 404, { error: 'Ruta no encontrada.' });
}

const contentTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
};

async function serveVideo(request, response, download = false) {
  const videoStats = await stat(videoFile);
  const range = request.headers.range;
  const commonHeaders = {
    'Accept-Ranges': 'bytes',
    'Content-Type': 'video/mp4',
    'Cache-Control': 'public, max-age=3600',
    ...(download ? { 'Content-Disposition': 'attachment; filename="socialrise-video-4k.mp4"' } : {}),
  };

  if (!range) {
    response.writeHead(200, { ...commonHeaders, 'Content-Length': videoStats.size });
    if (request.method === 'HEAD') return response.end();
    return createReadStream(videoFile).pipe(response);
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) {
    response.writeHead(416, { 'Content-Range': `bytes */${videoStats.size}` });
    return response.end();
  }
  const start = match[1] ? Number(match[1]) : Math.max(videoStats.size - Number(match[2]), 0);
  const end = match[2] ? Number(match[2]) : videoStats.size - 1;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start > end || end >= videoStats.size) {
    response.writeHead(416, { 'Content-Range': `bytes */${videoStats.size}` });
    return response.end();
  }
  response.writeHead(206, {
    ...commonHeaders,
    'Content-Length': end - start + 1,
    'Content-Range': `bytes ${start}-${end}/${videoStats.size}`,
  });
  if (request.method === 'HEAD') return response.end();
  return createReadStream(videoFile, { start, end }).pipe(response);
}

async function serveStatic(response, pathname) {
  const requested = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
  const filePath = normalize(join(root, requested));
  if (!filePath.startsWith(root)) return json(response, 403, { error: 'No permitido.' });
  try {
    if (!(await stat(filePath)).isFile()) throw new Error('not-file');
    response.writeHead(200, { 'Content-Type': contentTypes[extname(filePath).toLowerCase()] || 'application/octet-stream' });
    response.end(await readFile(filePath));
  } catch {
    json(response, 404, { error: 'Archivo no encontrado.' });
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(request, response, url);
    if (request.method !== 'GET' && request.method !== 'HEAD') return json(response, 405, { error: 'Método no permitido.' });
    if (url.pathname === '/media/socialrise-video.mp4') return await serveVideo(request, response);
    if (url.pathname === '/download/socialrise-video.mp4') return await serveVideo(request, response, true);
    return await serveStatic(response, url.pathname);
  } catch (error) {
    console.error(error);
    return json(response, 500, { error: 'Ocurrió un error interno.' });
  }
});

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '0.0.0.0';
const localIps = Object.values(networkInterfaces())
  .flat()
  .filter((detail) => detail && detail.family === 'IPv4' && !detail.internal)
  .map((detail) => detail.address);

server.listen(port, host, () => {
  console.log(`SocialRise listo en http://localhost:${port}`);
  if (localIps.length) {
    for (const ip of localIps) console.log(`Red local: http://${ip}:${port}`);
  } else {
    console.log(`Red local: http://TU_IP_LOCAL:${port}`);
  }
});
