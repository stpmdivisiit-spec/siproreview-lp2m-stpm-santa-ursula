/**
 * Modul Autentikasi & Manajemen Role (RBAC)
 * Mendukung Login Admin LP2M & Dosen (NIDN), Aktivasi Login Pertama, dan Sesi Token
 */
window.SiproAuthModule = {
  async login(username, password) {
    return await window.SiproGasClient.callApi('login', { username, password });
  },
  async changePasswordAndActivate(newPassword, profileData) {
    return await window.SiproGasClient.callApi('changePassword', { newPassword, profileData });
  }
};
