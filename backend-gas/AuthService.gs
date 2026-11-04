/**
 * SIPROREVIEW - LP2M STPM Santa Ursula Ende
 * File: AuthService.gs
 * Deskripsi: Autentikasi RBAC, Password Hashing SHA-256 + Salt, Rate Limiting, Session Token
 */

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const SESSION_TTL_SECONDS = 21600; // 6 jam

function computeSha256Hash(input, salt) {
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input + '::' + salt, Utilities.Charset.UTF_8);
  return raw.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

function authenticateUser(username, password) {
  if (!username || !password) throw new Error('Username/NIDN dan password wajib diisi.');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('USERS');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const uName = String(row[1]).trim();
    const uNidn = String(row[2]).trim();
    if (uName === String(username).trim() || uNidn === String(username).trim()) {
      const userId = row[0];
      const failedAttempts = Number(row[15]) || 0;
      const lockedUntil = row[16] ? new Date(row[16]) : null;
      const now = new Date();

      if (lockedUntil && lockedUntil > now) {
        throw new Error('Akun terkunci sementara karena terlalu banyak percobaan gagal. Coba lagi setelah ' + lockedUntil.toLocaleTimeString('id-ID'));
      }

      const salt = String(row[12]);
      const expectedHash = String(row[11]);
      const candidateHash = computeSha256Hash(password, salt);

      if (candidateHash !== expectedHash) {
        const nextFailed = failedAttempts + 1;
        sheet.getRange(i + 1, 16).setValue(nextFailed);
        if (nextFailed >= MAX_LOGIN_ATTEMPTS) {
          const lockTime = new Date(now.getTime() + LOCKOUT_MINUTES * 60000);
          sheet.getRange(i + 1, 17).setValue(lockTime.toISOString());
        }
        logSystemActivity(userId, uName, row[6], 'LOGIN_FAILED', 'USERS', userId, 'Percobaan login gagal ke-' + nextFailed);
        throw new Error('Kredensial tidak valid. Sisa percobaan: ' + Math.max(0, MAX_LOGIN_ATTEMPTS - nextFailed));
      }

      // Reset failed attempts & create session token
      sheet.getRange(i + 1, 16).setValue(0);
      sheet.getRange(i + 1, 17).setValue('');
      sheet.getRange(i + 1, 19).setValue(now.toISOString());

      const token = Utilities.getUuid() + '-' + Utilities.getUuid();
      const sessionPayload = {
        userId: userId,
        username: uName,
        nidn: uNidn,
        fullName: row[3],
        role: row[6],
        prodi: row[7],
        mustChangePassword: Boolean(row[13]),
        profileCompleted: Boolean(row[14]),
        issuedAt: now.toISOString()
      };
      CacheService.getScriptCache().put('SESSION_' + token, JSON.stringify(sessionPayload), SESSION_TTL_SECONDS);
      logSystemActivity(userId, uName, row[6], 'LOGIN_SUCCESS', 'USERS', userId, 'Login berhasil ke sistem SIPROREVIEW');
      return { token: token, user: sessionPayload };
    }
  }
  throw new Error('Akun tidak ditemukan.');
}

function verifySessionToken(token, requiredRole) {
  if (!token) throw new Error('Sesi tidak ditemukan. Silakan login kembali.');
  const raw = CacheService.getScriptCache().get('SESSION_' + token);
  if (!raw) throw new Error('Sesi telah berakhir. Silakan login kembali.');
  const session = JSON.parse(raw);
  if (requiredRole && session.role !== requiredRole && session.role !== 'ADMIN') {
    throw new Error('Akses ditolak: Anda tidak memiliki hak akses (' + requiredRole + ').');
  }
  return session;
}

function logSystemActivity(userId, username, role, actionType, targetEntity, targetId, description) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName('ACTIVITY_LOG');
  if (!logSheet) return;
  logSheet.appendRow([
    'LOG-' + new Date().getTime(),
    new Date().toISOString(),
    userId,
    username,
    role,
    actionType,
    targetEntity,
    targetId,
    description,
    '{}',
    Utilities.getUuid().slice(0, 8)
  ]);
}
