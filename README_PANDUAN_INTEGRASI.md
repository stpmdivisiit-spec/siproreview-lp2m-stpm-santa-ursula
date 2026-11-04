# Panduan Lengkap Integrasi Google Spreadsheet, Google Apps Script & Google Drive
# SIPROREVIEW – LP2M STPM Santa Ursula Ende (Clean Project Edition)

Dokumen ini memandu tim IT dan pengelola **LP2M [STPM Santa Ursula Ende](https://stpmsantaursula.ac.id/)** dalam mengintegrasikan paket kode **SIPROREVIEW Clean Project** (`siproreview_lp2m_stpm_santa_ursula_clean_project.zip`) dengan **Google Spreadsheet** (14 tabel database), **Google Drive** (repositori PDF otomatis), dan **Google Apps Script** (API Backend).

## 1. Struktur Folder Clean Project (`siproreview_lp2m_stpm_santa_ursula_clean_project.zip`)

Seluruh halaman demo bawaan template SB Admin Pro yang tidak diperlukan (seperti *blog-management*, *multi-tenant*, *knowledge-base*, *pricing*, dan *invoice*) telah dibersihkan, sehingga struktur proyek kini murni berisi file inti aplikasi:

```
siproreview-lp2m-stpm-santa-ursula/
├── index.html                              # Aplikasi Utama SIPROREVIEW (Auth + Dashboard Admin + Dashboard Dosen)
├── README_PANDUAN_INTEGRASI.md             # Panduan Integrasi Langkah-demi-Langkah (Dokumen ini)
├── css/
│   ├── styles.css                          # Core Stylesheet SB Admin Pro v2.0.4 (Asli)
│   └── siproreview-theme.css               # Override Identitas Warna STPM Santa Ursula (#1E6B4A, #2F5D4A, #BE8F3B, #FFF8D4, #FDF2BD)
├── js/
│   ├── scripts.js                          # Core Script SB Admin Pro v2.0.4
│   ├── config/
│   │   └── api-config.js                   # Tempat menempelkan URL Web App Google Apps Script Anda
│   ├── services/
│   │   └── gas-api-client.js               # HTTP Client bebas-CORS (text/plain JSON) ke Google Apps Script
│   └── modules/
│       ├── auth-module.js                  # Autentikasi SHA-256 + Salt, Rate Limit 5x & Aktivasi Login Pertama
│       ├── proposal-module.js              # Pengajuan PKM/Penelitian, Validasi PDF Base64 & Penamaan Standar
│       ├── review-module.js                # Distribusi Reviewer, Anti-Conflict of Interest, Blind Review & Lock
│       ├── rubric-scoring-module.js        # Kalkulasi Skor Otomatis Rubrik PKM (10 Aspek) & Penelitian (16 Aspek)
│       ├── pdf-viewer-module.js            # Integrasi PDF.js Viewer & Stream Dokumen Terotorisasi dari Drive
│       └── report-export-module.js         # Generator 9 Laporan Resmi ber-Kop LP2M (PDF & CSV/Excel)
├── assets/
│   ├── fonts/metropolis/                   # Font Resmi SB Admin Pro
│   └── img/                                # Favicon & Ilustrasi Akademik Inti
├── backend-gas/
│   ├── appsscript.json                     # Manifest Konfigurasi OAuth Scopes & Timezone Asia/Makassar (WITA)
│   ├── 01_SetupDatabaseAndDrive.gs         # Generator Otomatis 14 Sheet Database + Seed Data + Folder Drive
│   ├── 02_Code_ApiRouter.gs                # Router API Utama (doGet & doPost)
│   ├── 03_AuthAndSecurityService.gs        # Service Keamanan, Session Token CacheService & Audit Log
│   ├── 04_ProposalAndDriveService.gs       # Service Upload PDF ke Google Drive & Validasi Hak Akses File ID
│   └── 05_ReviewAndScoringService.gs       # Service Penugasan Reviewer, Perhitungan Skor & Keputusan Akhir
├── database-migration/
│   └── schema_mysql8.sql                   # Skema SQL Lengkap 14 Tabel untuk Migrasi ke PHP 8+ & MySQL 8+
└── docs/
    └── Blueprint_Arsitektur_SIPROREVIEW_LP2M_STPM_Santa_Ursula.md
```

## 2. Tahap 1: Membuat Google Spreadsheet & Membuka Google Apps Script

1. Masuk ke akun Google resmi pengelola **LP2M STPM Santa Ursula Ende** melalui [Google Sheets](https://docs.google.com/spreadsheets/).
2. Buat sebuah **Spreadsheet Kosong (*Blank Spreadsheet*)** baru, lalu beri nama:
   `DB_SIPROREVIEW_LP2M_STPM_SANTA_URSULA`
3. Pada menu bagian atas Google Spreadsheet, klik **Extensions (Ekstensi)** $\rightarrow$ **Apps Script**.
4. Jendela baru **Google Apps Script Editor** akan terbuka. Beri nama proyek Apps Script Anda:
   `Backend_API_SIPROREVIEW_LP2M_STPM`

## 3. Tahap 2: Memasukkan Kode Backend ke Google Apps Script

Di dalam jendela **Google Apps Script Editor**, salin (*copy-paste*) isi file dari folder `backend-gas/` pada Clean Project sesuai urutan berikut:

| Urutan | Nama File di Apps Script Editor | Sumber File pada Clean Project | Fungsi Utama |
| :-: | :--- | :--- | :--- |
| **1** | `Code.gs` *(ganti isi bawaan)* | `backend-gas/01_SetupDatabaseAndDrive.gs` | Membangun otomatis 14 Sheet, mengisi data awal (*seed data*), dan membuat pohon folder Google Drive |
| **2** | Klik ikon **`+`** $\rightarrow$ **Script** $\rightarrow$ beri nama `02_Code_ApiRouter` | `backend-gas/02_Code_ApiRouter.gs` | Menangani request `doGet(e)` dan `doPost(e)` dari aplikasi web frontend |
| **3** | Klik ikon **`+`** $\rightarrow$ **Script** $\rightarrow$ beri nama `03_AuthAndSecurityService` | `backend-gas/03_AuthAndSecurityService.gs` | Mengelola login Admin & Dosen (`SHA-256 + salt`), *rate limiting* 5x percobaan, sesi `CacheService`, dan `ACTIVITY_LOG` |
| **4** | Klik ikon **`+`** $\rightarrow$ **Script** $\rightarrow$ beri nama `04_ProposalAndDriveService` | `backend-gas/04_ProposalAndDriveService.gs` | Menerima unggahan PDF (`base64`), menamai file sesuai standar, menyimpan ke Google Drive, dan memvalidasi izin baca berdasarkan `drive_file_id` |
| **5** | Klik ikon **`+`** $\rightarrow$ **Script** $\rightarrow$ beri nama `05_ReviewAndScoringService` | `backend-gas/05_ReviewAndScoringService.gs` | Mengelola verifikasi proposal, distribusi reviewer (*anti-conflict of interest*), kalkulasi skor rubrik, dan keputusan akhir LP2M |

### Mengatur Zona Waktu WITA (`Asia/Makassar`)
1. Klik ikon **Project Settings (Setelan Proyek / Roda Gigi)** di bilah kiri Apps Script Editor.
2. Centang kotak **Show "appsscript.json" manifest file in editor (Tampilkan file manifes "appsscript.json" di editor)**.
3. Kembali ke tab **Editor (`< >`)**, klik file `appsscript.json`, lalu ganti isinya dengan isi file `backend-gas/appsscript.json` dari Clean Project, kemudian tekan **Ctrl + S** (Simpan).

## 4. Tahap 3: Menjalankan Inisialisasi Otomatis 14 Sheet & Struktur Folder Google Drive

Anda **tidak perlu** membuat ke-14 sheet atau membuat folder Google Drive satu per satu secara manual. Semuanya dibuat otomatis oleh fungsi `setupSiproreviewComplete()`:

1. Pada toolbar atas di dalam **Apps Script Editor**, klik file `Code.gs` (`01_SetupDatabaseAndDrive.gs`).
2. Pada dropdown daftar fungsi di sebelah tombol **Debug**, pilih fungsi **`setupSiproreviewComplete`**.
3. Klik tombol **Run (Jalankan)**.
4. Saat muncul dialog **Authorization required (Diperlukan otorisasi)**:
   - Klik **Review permissions (Tinjau izin)** $\rightarrow$ pilih akun Google LP2M Anda.
   - Klik **Advanced (Lanjutan)** $\rightarrow$ klik **Go to Backend_API_SIPROREVIEW_LP2M_STPM (unsafe)** $\rightarrow$ klik **Allow (Izinkan)**.
5. Tunggu sekitar 5–10 detik hingga muncul pesan `=== INISIALISASI SIPROREVIEW SELESAI ===` pada panel **Execution log**.

### Apa yang Otomatis Terbentuk Setelah Anda Menjalankan `setupSiproreviewComplete`?
- **Di Google Spreadsheet Anda:** Terbentuk lengkap **14 Sheet** dengan header berwarna Hijau Institusi (`#1E6B4A`) beserta data awal (*seed data*):
  1. `USERS` (Akun `admin` dengan password awal `STPM2025` ter-hash SHA-256 + 5 akun dosen STPM Santa Ursula dengan password awal `Stpm12345`)
  2. `PROPOSALS`
  3. `REVIEWERS`
  4. `REVIEW_ASSIGNMENTS`
  5. `REVIEW_PKM`
  6. `REVIEW_PENELITIAN`
  7. `RUBRIC_PKM` (10 aspek penilaian PKM dengan total bobot 100%)
  8. `RUBRIC_PENELITIAN` (16 aspek penilaian Penelitian Dosen dengan total bobot 100%)
  9. `REVIEW_COMMENTS`
  10. `FINAL_DECISIONS`
  11. `ANNOUNCEMENTS`
  12. `PERIODS`
  13. `ACTIVITY_LOG`
  14. `SYSTEM_SETTINGS` (Otomatis menyimpan seluruh ID Folder Google Drive yang baru dibuat)
- **Di Google Drive Anda:** Terbentuk otomatis struktur folder tertutup (`PRIVATE`):
  ```
  LP2M_STPM_SANTA_URSULA/
  ├── PROPOSAL_PKM/
  │   ├── 2026/
  │   └── 2027/
  ├── PROPOSAL_PENELITIAN/
  │   ├── 2026/
  │   └── 2027/
  ├── HASIL_REVIEW/
  │   ├── PKM/
  │   └── PENELITIAN/
  ├── LAPORAN/
  └── ARSIP/
  ```

## 5. Tahap 4: Deploy Google Apps Script sebagai Web App API

Agar aplikasi website frontend dapat berkomunikasi dengan Google Spreadsheet dan Google Drive secara aman:

1. Di sudut kanan atas **Apps Script Editor**, klik tombol biru **Deploy (Terapkan)** $\rightarrow$ pilih **New deployment (Deployment baru)**.
2. Klik ikon roda gigi di samping **Select type (Pilih jenis)** $\rightarrow$ pilih **Web app (Aplikasi web)**.
3. Isi konfigurasi deployment tepat seperti tabel di bawah ini:

| Parameter Deployment | Nilai Konfigurasi Wajib | Penjelasan Teknis |
| :--- | :--- | :--- |
| **Description (Deskripsi)** | `API SIPROREVIEW LP2M STPM v2.0` | Penanda versi produksi |
| **Execute as (Jalankan sebagai)** | **Me / Saya** (`lp2m@...`) | Agar script mengeksekusi baca/tulis ke Google Sheets & Google Drive menggunakan otorisasi akun pemilik LP2M tanpa meminta login Google ke masing-masing dosen |
| **Who has access (Siapa yang memiliki akses)** | **Anyone (Siapa saja)** | Agar browser frontend dapat mengirim request HTTP POST/GET ke endpoint API (otentikasi user tetap divalidasi ketat di dalam script melalui token sesi SHA-256) |

4. Klik **Deploy (Terapkan)**.
5. Salin **Web app URL** yang muncul (berakhiran `/exec`, contoh: `https://script.google.com/macros/s/AKfycbx.../exec`).

## 6. Tahap 5: Menghubungkan URL Web App ke Frontend Clean Project

Terdapat **dua cara mudah** untuk menghubungkan URL Web App Google Apps Script tersebut ke Frontend SIPROREVIEW:

### Cara A – Melalui File Konfigurasi Kode Sumber (`js/config/api-config.js`)
Buka file `js/config/api-config.js` di dalam folder Clean Project, lalu tempelkan URL `/exec` Anda pada properti `GAS_WEB_APP_URL`:

```javascript
window.SIPRO_API_CONFIG = {
  GAS_WEB_APP_URL: 'https://script.google.com/macros/s/ISI_DENGAN_ID_DEPLOYMENT_ANDA/exec',
  ENABLE_HYBRID_FALLBACK: true,
  INSTITUTION_NAME: 'STPM Santa Ursula Ende',
  UNIT_NAME: 'Lembaga Penelitian dan Pengabdian kepada Masyarakat (LP2M)',
  MAX_PDF_SIZE_MB: 10,
  MIN_REVIEWERS_PER_PROPOSAL: 2,
  DISCREPANCY_THRESHOLD: 15.0
};
```

### Cara B – Langsung Melalui Menu Pengaturan Sistem di Dashboard Admin
1. Buka aplikasi `index.html` di browser dan login sebagai **Admin LP2M** (`admin` / `STPM2025`).
2. Buka menu sidebar **9. Pengaturan & Drive/Sheets**.
3. Tempelkan URL Web App `/exec` Anda pada kolom **Google Apps Script Web App Endpoint URL**, lalu klik **Simpan Konfigurasi** dan klik tombol **Uji Koneksi Live ke Google Apps Script**.

## 7. Penanganan CORS & Pengiriman File PDF ke Google Drive

Pada arsitektur Google Apps Script, pengiriman request `POST` dengan header `application/json` dari domain eksternal akan memicu *preflight request* `OPTIONS` yang diblokir oleh kebijakan CORS Google. Oleh karena itu, file `js/services/gas-api-client.js` pada Clean Project telah menerapkan standar komunikasi bebas-CORS:
- Menggunakan header `'Content-Type': 'text/plain;charset=utf-8'` dengan isi body berupa string JSON (`JSON.stringify(payload)`), serta opsi `redirect: 'follow'`.
- Saat dosen mengunggah dokumen PDF proposal, fungsi `fileToBase64(file)` mengubah dokumen PDF menjadi string Base64 di sisi browser, memvalidasi ukuran maksimal 10 MB dan ekstensi `.pdf`, lalu mengirimkannya ke action `submitProposal` di Google Apps Script untuk disimpan sebagai file PDF asli (`PKM_2026_NIDN_KODEPROPOSAL.pdf` atau `PENELITIAN_2026_NIDN_KODEPROPOSAL.pdf`) di dalam folder Google Drive yang sesuai.
