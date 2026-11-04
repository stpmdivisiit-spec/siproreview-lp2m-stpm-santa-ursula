/**
 * ============================================================================
 * SIPROREVIEW – LP2M STPM SANTA URSULA ENDE
 * File: js/services/gas-api-client.js
 * Deskripsi: HTTP Client Bebas-CORS untuk Berkomunikasi dengan Google Apps Script
 * ============================================================================
 * Catatan Penting Google Apps Script CORS:
 * Pengiriman request POST ke script.google.com WAJIB menggunakan header
 * 'Content-Type': 'text/plain;charset=utf-8' agar browser tidak memicu preflight
 * OPTIONS request yang ditolak oleh server Google.
 */
window.SiproGasClient = {
  getEndpointUrl() {
    const customUrl = localStorage.getItem('SIPRO_CUSTOM_GAS_URL');
    if (customUrl && customUrl.startsWith('https://script.google.com/')) {
      return customUrl.trim();
    }
    return (window.SIPRO_API_CONFIG && window.SIPRO_API_CONFIG.GAS_WEB_APP_URL) || '';
  },

  async callApi(action, payload = {}) {
    const url = this.getEndpointUrl();
    if (!url) {
      return { status: 'local_mode', message: 'URL Google Apps Script belum dikonfigurasi, menggunakan database simulasi lokal.' };
    }

    const token = sessionStorage.getItem('SIPRO_AUTH_TOKEN') || '';
    const requestBody = JSON.stringify({
      action: action,
      token: token,
      ...payload
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: requestBody,
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error('HTTP Error: ' + response.status);
    }
    return await response.json();
  },

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        const base64Clean = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64Clean);
      };
      reader.onerror = err => reject(err);
      reader.readAsDataURL(file);
    });
  }
};
