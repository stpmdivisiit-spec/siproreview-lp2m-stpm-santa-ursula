/**
 * ============================================================================
 * SIPROREVIEW – LP2M STPM SANTA URSULA ENDE
 * File: 03_AuthAndSecurityService.gs
 * Deskripsi: Autentikasi RBAC, SHA-256 Hashing + Salt, Rate Limit 5x, & Audit Log
 * ============================================================================
 */

const MAX_FAILED_LOGIN = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 Menit
const SESSION_CACHE_SEC = 21600; // 6 Jam

function hashPasswordWithSalt(plainPassword, salt) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(plainPassword) + '::' + String(salt),
    Utilities.Charset.UTF_8
  );
  return digest.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

function handleUserLogin(username, password) {
  if (!username || !password) {
    throw new Error('Username/NIDN dan password wajib diisi.');
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('USERS');
  const rows = sheet.getDataRange().getValues();
  const now = new Date();

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const uName = String(r[1]).trim();
    const uNidn = String(r[2]).trim();

    if (uName === String(username).trim() || uNidn === String(username).trim()) {
      const userId = r[0];
      const failedCount = Number(r[15]) || 0;
      const lockedUntil = r[16] ? new Date(r[16]) : null;

      if (lockedUntil && lockedUntil > now) {
        throw new Error('Akun terkunci sementara hingga ' + lockedUntil.toLocaleTimeString('id-ID'));
      }

      const expectedHash = String(r[11]);
      const salt = String(r[12]);
      const inputHash = hashPasswordWithSalt(password, salt);

      if (inputHash !== expectedHash) {
        const nextFail = failedCount + 1;
        sheet.getRange(i + 1, 16).setValue(nextFail);
        if (nextFail >= MAX_FAILED_LOGIN) {
          sheet.getRange(i + 1, 17).setValue(new Date(now.getTime() + LOCK_DURATION_MS).toISOString());
        }
        appendActivityLog(userId, uName, r[6], 'LOGIN_FAILED', 'USERS', userId, 'Percobaan login gagal ke-' + nextFail);
        throw new Error('Password tidak valid. Sisa percobaan: ' + Math.max(0, MAX_FAILED_LOGIN - nextFail));
      }

      sheet.getRange(i + 1, 16).setValue(0);
      sheet.getRange(i + 1, 17).setValue('');
      sheet.getRange(i + 1, 19).setValue(now.toISOString());

      const token = Utilities.getUuid() + '-' + Utilities.getUuid();
      const userProfile = {
        user_id: userId,
        username: uName,
        nidn: uNidn,
        full_name: r[3],
        email: r[4],
        phone: r[5],
        role: r[6],
        prodi: r[7],
        functional_rank: r[8],
        expertise: r[9],
        sinta_id: r[10],
        must_change_password: Boolean(r[13]),
        profile_completed: Boolean(r[14])
      };

      CacheService.getScriptCache().put('SIPRO_TOKEN_' + token, JSON.stringify(userProfile), SESSION_CACHE_SEC);
      appendActivityLog(userId, uName, r[6], 'LOGIN_SUCCESS', 'USERS', userId, 'Login berhasil ke SIPROREVIEW.');
      return { token: token, user: userProfile };
    }
  }
  throw new Error('Username atau NIDN tidak ditemukan.');
}

function requireAuthSession(token, requiredRole) {
  if (!token) throw new Error('Token sesi tidak ditemukan. Silakan login kembali.');
  const raw = CacheService.getScriptCache().get('SIPRO_TOKEN_' + token);
  if (!raw) throw new Error('Sesi telah berakhir. Silakan login kembali.');
  const user = JSON.parse(raw);
  if (requiredRole && user.role !== requiredRole && user.role !== 'ADMIN') {
    throw new Error('Akses ditolak: Membutuhkan hak akses ' + requiredRole);
  }
  return user;
}

function handlePasswordChange(token, newPassword, profileData) {
  const user = requireAuthSession(token);
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password baru minimal 6 karakter.');
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('USERS');
  const rows = sheet.getDataRange().getValues();
  const newSalt = 'salt_' + Utilities.getUuid().slice(0, 12);
  const newHash = hashPasswordWithSalt(newPassword, newSalt);

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === user.user_id) {
      sheet.getRange(i + 1, 12).setValue(newHash);
      sheet.getRange(i + 1, 13).setValue(newSalt);
      sheet.getRange(i + 1, 14).setValue(false); // must_change_password = false
      sheet.getRange(i + 1, 15).setValue(true);  // profile_completed = true
      if (profileData) {
        if (profileData.full_name) sheet.getRange(i + 1, 4).setValue(profileData.full_name);
        if (profileData.email) sheet.getRange(i + 1, 5).setValue(profileData.email);
        if (profileData.phone) sheet.getRange(i + 1, 6).setValue(profileData.phone);
        if (profileData.expertise) sheet.getRange(i + 1, 10).setValue(profileData.expertise);
      }
      sheet.getRange(i + 1, 21).setValue(new Date().toISOString());
      break;
    }
  }
  appendActivityLog(user.user_id, user.username, user.role, 'CHANGE_PASSWORD', 'USERS', user.user_id, 'Mengganti password dan mengaktifkan akun.');
  return { updated: true };
}

function appendActivityLog(userId, username, role, actionType, targetEntity, targetId, description) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('ACTIVITY_LOG');
  if (!sheet) return;
  sheet.appendRow([
    'LOG-' + new Date().getTime(),
    new Date().toISOString(),
    userId,
    username,
    role,
    actionType,
    targetEntity,
    targetId,
    description
  ]);
}
