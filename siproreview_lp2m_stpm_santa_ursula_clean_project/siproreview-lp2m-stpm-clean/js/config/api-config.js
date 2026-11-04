/**
 * ============================================================================
 * SIPROREVIEW – LP2M STPM SANTA URSULA ENDE
 * File: js/config/api-config.js
 * Deskripsi: Konfigurasi Utama Integrasi Google Apps Script, Spreadsheet & Drive
 * ============================================================================
 */
window.SIPRO_API_CONFIG = {
  // TEMPELKAN URL WEB APP GOOGLE APPS SCRIPT ANDA DI BAWAH INI:
  // Contoh: 'https://script.google.com/macros/s/AKfycbx.../exec'
  GAS_WEB_APP_URL: '',

  // Jika GAS_WEB_APP_URL belum diisi, sistem otomatis berjalan dalam Mode Hybrid/Simulasi
  // menggunakan penyimpanan lokal (localStorage) sehingga antarmuka tetap dapat diuji penuh.
  ENABLE_HYBRID_FALLBACK: true,

  INSTITUTION_NAME: 'STPM Santa Ursula Ende',
  UNIT_NAME: 'Lembaga Penelitian dan Pengabdian kepada Masyarakat (LP2M)',
  MAX_PDF_SIZE_MB: 10,
  MIN_REVIEWERS_PER_PROPOSAL: 2,
  DISCREPANCY_THRESHOLD: 15.0
};
