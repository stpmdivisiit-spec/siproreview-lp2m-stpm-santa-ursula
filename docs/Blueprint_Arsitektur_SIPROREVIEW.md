# Dokumen Spesifikasi Teknis, Arsitektur Sistem, Database & Instrumen Akademik
# SIPROREVIEW – Sistem Informasi Proposal Review LP2M STPM Santa Ursula Ende

**Institusi:** [Sekolah Tinggi Pembangunan Masyarakat (STPM) Santa Ursula Ende](https://stpmsantaursula.ac.id/) (NPSN: 153007)  
**Alamat:** Jl. Wirajaya No. 3, Kec. Ende Tengah, Kab. Ende, Provinsi Nusa Tenggara Timur  
**Unit Pengelola:** Lembaga Penelitian dan Pengabdian kepada Masyarakat (LP2M) – Pengelola [Jurnal Pengabdian dan Pemberdayaan Masyarakat (JPPM)](https://ejurnal.stpmsantaursula.ac.id/index.php/JPPM)  
**Program Studi Terintegrasi:**  
1. [Program Studi Pembangunan Sosial (Akreditasi Unggul)](https://rri.co.id/ende/regional/2626081/program-studi-pembangunan-sosial-stpm-santa-ursula-raih-predikat-unggul) *(transformasi nomenklatur dari [Program Studi Ilmu Sosiatri pada Januari 2026](https://stpmsantaursula.ac.id/kemendiktisaintek-resmi-ubah-nama-prodi-ilmu-sosiatri-stpm-santa-ursula-ende/))*  
2. [Program Studi Ilmu Pemerintahan](https://stpmsantaursula.ac.id/dosen-prodi-ilmu-pemerintahan/)  

## 1. Analisis Source Code Template SB Admin Pro (`templates_projects`)

Berdasarkan bedah kode sumber pada arsip `stpmdivisiit-spec/templates_projects` (**Start Bootstrap – SB Admin Pro v2.0.4**, berbasis **Bootstrap v5.1.3**), karakteristik arsitektur UI/UX template asli yang dipertahankan secara utuh meliputi:

| Komponen Template | File Sumber pada Arsip | Struktur DOM & Kelas Utama yang Dipertahankan | Adaptasi Identitas Visual STPM Santa Ursula Ende |
| :--- | :--- | :--- | :--- |
| **Core Stylesheet & CSS Variables** | `css/styles.css` | Variabel root `--bs-primary`, `--bs-secondary`, `--bs-warning`, `--bs-*-soft`, font `Metropolis`, `.card-header-actions`, `.timeline`, `.page-header`, `.icon-stack` | Override variabel CSS melalui `css/siproreview-theme.css` ke palet resmi: Hijau Institusi (`#1E6B4A`), Hijau Sekunder (`#2F5D4A`), Emas (`#BE8F3B`), Kuning Akademik (`#FDF2BD`), Kuning Muda (`#FFF8D4`), Putih (`#FFFFFF`) |
| **Top Navigation Bar** | `dashboard-1.html`, `main_layout.html` | `<body class="nav-fixed">` dengan `<nav class="topnav navbar navbar-expand shadow ... bg-white" id="sidenavAccordion">`, tombol `#sidebarToggle`, `.dropdown-notifications`, `.dropdown-user` | Ditambahkan badge Role aktif (`ADMIN LP2M` / `DOSEN`), pengalih tema (`Light` / `Dark` / `System`), lonceng notifikasi tenggat review, dan indikator periode aktif |
| **Collapsible Sidebar Navigation** | `dashboard-1.html`, `js/scripts.js` | `<div id="layoutSidenav"><div id="layoutSidenav_nav"><nav class="sidenav shadow-right sidenav-light">` dengan `.sidenav-menu-heading`, `.nav-link`, `.sidenav-collapse-arrow`, dan `.sidenav-footer` | Memuat 12 menu terstruktur untuk **Admin LP2M** dan 8 menu terstruktur untuk **Dosen (Pengusul & Reviewer)** dengan state aktif `#FFF8D4` & aksen kiri `#1E6B4A` |
| **Page Header & Overlap Layout** | `dashboard-1.html`, `header-overlap.html` | `<header class="page-header page-header-dark bg-gradient-primary-to-secondary pb-10">` diikuti `<div class="container-xl px-4 mt-n10">` | Menggunakan gradien hijau institusi ke hijau sekunder dan aksen emas (`#1E6B4A` -> `#2F5D4A` -> `#BE8F3B`) disertai breadcrumb dan filter periode akademik |
| **Authentication Layout** | `auth-login-basic.html`, `auth-password-basic.html` | `<div id="layoutAuthentication"><div id="layoutAuthentication_content">` dengan kartu login `.card.shadow-lg.border-0.rounded-lg.mt-5` | Mendukung login Admin (`admin`) dan Dosen (`NIDN`), validasi percobaan login, serta modal wajib ganti password sementara dan lengkapi profil pada login pertama |
| **DataTables, Charts & Modals** | `tables.html`, `charts.html`, `modals.html`, `toasts.html` | Integrasi `Chart.js`, `DataTables`, `Feather Icons`, `Font Awesome 6`, `SweetAlert2`, dan `PDF.js` | Digunakan untuk 6 grafik analitik LP2M, tabel interaktif dengan filter/ekspor, pratinjau dokumen PDF terintegrasi, dan lembar rubrik penilaian real-time |

## 2. Arsitektur Sistem & Keamanan Integrasi (Zero-Credential Frontend)

Sistem dirancang menggunakan pola **Three-Tier Serverless Academic Architecture** yang memisahkan lapisan presentasi (Frontend SB Admin Pro) dari lapisan logika bisnis dan penyimpanan dokumen (Google Apps Script, Google Spreadsheet, dan Google Drive), serta menyediakan skema migrasi langsung ke **PHP 8.2+ dan MySQL 8.0+**.

```
+-----------------------------------------------------------------------------------+
|                        LAPISAN PRESENTASI (FRONTEND WEB APP)                      |
|  SB Admin Pro v2.0.4 + Bootstrap 5 + Chart.js + DataTables + PDF.js + SweetAlert2 |
|  [Halaman Auth]  [Dashboard Admin LP2M (12 Menu)]  [Dashboard Dosen (8 Menu)]     |
+-----------------------------------------+-----------------------------------------+
                                          |
                     HTTPS JSON Request   |  Bearer Session Token (SHA-256 HMAC)
                     (Tanpa API Key/Kredensial Google di Sisi Client/Browser)
                                          v
+-----------------------------------------------------------------------------------+
|                   LAPISAN BACKEND / API GATEWAY (GOOGLE APPS SCRIPT)              |
|  - Code.gs (Router doGet & doPost + Validasi Request & Sanitasi Input)            |
|  - AuthService.gs (RBAC, SHA-256 + Salt Password Hashing, Rate Limit 5x, Session) |
|  - ProposalService.gs (Validasi Magic Bytes %PDF-, Batas 10MB, Penamaan Standar)  |
|  - ReviewService.gs (Deteksi Conflict of Interest, Blind Review, Kalkulasi Skor)  |
+-------------------+-------------------------------------------+-------------------+
                    |                                           |
     SpreadsheetApp | (Operasi CRUD Terindeks)         DriveApp | (Akses Private via File ID)
                    v                                           v
+---------------------------------------+   +---------------------------------------+
|   DATABASE UTAMA: GOOGLE SPREADSHEET  |   |   REPOSITORI DOKUMEN: GOOGLE DRIVE    |
|  14 Sheet Terelasi (USERS, PROPOSALS, |   |  Folder: LP2M_STPM_SANTA_URSULA/      |
|  REVIEWERS, REVIEW_ASSIGNMENTS, dll.) |   |  Akses PRIVATE (Bukan Link Publik)    |
+---------------------------------------+   +---------------------------------------+
```

### Prinsip Keamanan & Integritas Data (15 Kontrol Keamanan)
1. **Zero-Credential Exposure pada Frontend:** Browser hanya berkomunikasi dengan endpoint Web App Google Apps Script (`Code.gs`) atau endpoint REST PHP menggunakan token sesi. ID kredensial servis, akses tulis Google Sheets, dan izin baca/tulis folder Google Drive dieksekusi sepenuhnya di sisi server.
2. **Password Hashing & Salting:** Password tidak pernah disimpan dalam bentuk teks biasa (*plain text*), melainkan di-hash menggunakan algoritma `SHA-256(password + "::" + random_salt_32_hex)`. Kredensial awal (`STPM2025` untuk Admin dan `Stpm12345` untuk Dosen) ditandai dengan flag `must_change_password = TRUE`.
3. **Pembatasan Percobaan Login (Rate Limiting):** Percobaan gagal dicatat pada kolom `failed_attempts`. Jika mencapai 5 kali berturut-turut, akun dikunci otomatis selama 15 menit (`locked_until`).
4. **Pencegahan Konflik Kepentingan (*Conflict of Interest Guard*):** Algoritma distribusi menolak penugasan apabila `reviewer.user_id == proposal.proposer_user_id`, `reviewer.nidn == proposal.proposer_nidn`, atau NIDN reviewer tercantum di dalam `proposal.team_members_json`.
5. **Mekanisme *Double-Blind Peer Review*:** Saat opsi `blind_mode = TRUE` diaktifkan oleh Admin LP2M, metadata nama pengusul, NIDN, dan susunan anggota tim disamarkan secara otomatis (`[IDENTITAS DISAMARKAN - BLIND REVIEW LP2M]`) pada layar kerja reviewer.
6. **Proteksi Manipulasi Skor & Penguncian Review:** Perhitungan nilai akhir dilakukan ulang di sisi backend menggunakan bobot resmi dari tabel `RUBRIC_PKM` atau `RUBRIC_PENELITIAN`. Setelah reviewer menekan **Kirim Hasil Review Final**, status `is_locked = TRUE` aktif dan hanya Admin LP2M yang dapat membuka kunci (*unlock*) disertai alasan wajib yang tercatat di tabel `ACTIVITY_LOG`.

## 3. Struktur Folder Otomatis Google Drive

Seluruh dokumen PDF disimpan di bawah struktur direktori tertutup (`DriveApp.Access.PRIVATE`) yang dibangun otomatis oleh fungsi `initializeDriveFolders()` pada `SetupDatabase.gs`:

```
LP2M_STPM_SANTA_URSULA/
├── PROPOSAL_PKM/
│   ├── 2026/
│   │   ├── PKM_2026_0812048801_PKM-2026-101.pdf
│   │   └── PKM_2026_0823079002_PKM-2026-102.pdf
│   └── 2027/
├── PROPOSAL_PENELITIAN/
│   ├── 2026/
│   │   ├── PENELITIAN_2026_0815098503_PENELITIAN-2026-201.pdf
│   │   └── PENELITIAN_2026_0804118904_PENELITIAN-2026-202.pdf
│   └── 2027/
├── HASIL_REVIEW/
│   ├── PKM/
│   └── PENELITIAN/
├── LAPORAN/
└── ARSIP/
```

Standar penamaan otomatis file saat diunggah:
- **Proposal PKM:** `PKM_<TAHUN>_<NIDN>_<KODEPROPOSAL>.pdf`
- **Proposal Penelitian Dosen:** `PENELITIAN_<TAHUN>_<NIDN>_<KODEPROPOSAL>.pdf`
- **Revisi Proposal:** Menyimpan versi dokumen baru (`document_version = 2, 3, ...`) dengan memindahkan file versi sebelumnya ke subfolder `ARSIP/` sehingga histori penilaian tahap awal tidak hilang.

## 4. Rancangan Database: 14 Sheet Google Spreadsheet & Relasi Entitas (ERD)

### Diagram Relasi Logis Antar-Tabel (ERD)

```
[USERS] (1) ──────< (N) [PROPOSALS] (N) >────── (1) [PERIODS]
   │                        │
   │ (1:1)                  ├──────< (N) [REVIEW_ASSIGNMENTS] >────── (1) [REVIEWERS]
   ▼                        │                     │
[REVIEWERS]                 │                     ├── (1:1) ──> [REVIEW_PKM] <── (N) [RUBRIC_PKM]
                            │                     ├── (1:1) ──> [REVIEW_PENELITIAN] <── (N) [RUBRIC_PENELITIAN]
                            │                     └── (1:N) ──> [REVIEW_COMMENTS]
                            │
                            └────── (1:1) ──────> [FINAL_DECISIONS]

Tabel Pendukung & Tata Kelola:
[ANNOUNCEMENTS] (Pengumuman LP2M)   |   [ACTIVITY_LOG] (Audit Trail)   |   [SYSTEM_SETTINGS] (Konfigurasi)
```

### Spesifikasi Kolom 14 Sheet Google Spreadsheet

| No | Nama Sheet | Primary Key | Foreign Key(s) | Daftar Kolom Lengkap |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `USERS` | `user_id` | - | `user_id`, `username`, `nidn`, `full_name`, `email`, `phone`, `role`, `prodi`, `functional_rank`, `expertise`, `sinta_id`, `password_hash`, `password_salt`, `must_change_password`, `profile_completed`, `failed_attempts`, `locked_until`, `is_active`, `last_login`, `created_at`, `updated_at` |
| 2 | `PROPOSALS` | `proposal_id` | `period_id`, `proposer_user_id` | `proposal_id`, `proposal_code`, `period_id`, `proposal_type`, `scheme_category`, `title`, `proposer_user_id`, `proposer_nidn`, `proposer_name`, `prodi`, `team_members_json`, `submission_year`, `focus_area`, `abstract_summary`, `keywords`, `budget_requested`, `drive_file_id`, `standardized_filename`, `file_size_bytes`, `document_version`, `originality_declared`, `status`, `admin_verification_note`, `verified_by`, `verified_at`, `submitted_at`, `updated_at` |
| 3 | `REVIEWERS` | `reviewer_id` | `user_id` | `reviewer_id`, `user_id`, `nidn`, `full_name`, `prodi`, `expertise_areas`, `max_quota`, `active_assignments`, `completed_reviews`, `is_certified`, `status`, `created_at` |
| 4 | `REVIEW_ASSIGNMENTS` | `assignment_id` | `proposal_id`, `reviewer_id`, `reviewer_user_id` | `assignment_id`, `proposal_id`, `proposal_code`, `proposal_type`, `reviewer_id`, `reviewer_user_id`, `reviewer_order`, `assigned_by`, `assignment_method`, `blind_mode`, `assigned_at`, `deadline_at`, `review_status`, `is_locked`, `unlocked_by`, `unlock_reason`, `completed_at` |
| 5 | `REVIEW_PKM` | `review_pkm_id` | `assignment_id`, `proposal_id`, `reviewer_id` | `review_pkm_id`, `assignment_id`, `proposal_id`, `reviewer_id`, `scores_json`, `weighted_score_total`, `strengths`, `weaknesses`, `improvement_notes`, `reviewer_recommendation`, `submitted_status`, `revision_version`, `submitted_at`, `updated_at` |
| 6 | `REVIEW_PENELITIAN` | `review_penelitian_id` | `assignment_id`, `proposal_id`, `reviewer_id` | `review_penelitian_id`, `assignment_id`, `proposal_id`, `reviewer_id`, `scores_json`, `weighted_score_total`, `special_assessment_json`, `integrity_evaluation_json`, `section_notes_json`, `critique_suggestions`, `reviewer_recommendation`, `submitted_status`, `revision_version`, `submitted_at`, `updated_at` |
| 7 | `RUBRIC_PKM` | `aspect_id` | - | `aspect_id`, `aspect_number`, `aspect_name`, `indicator_description`, `weight_percent`, `min_score`, `max_score`, `criteria_1_desc`, `criteria_2_desc`, `criteria_3_desc`, `criteria_4_desc`, `criteria_5_desc`, `is_active`, `updated_at` |
| 8 | `RUBRIC_PENELITIAN` | `aspect_id` | - | `aspect_id`, `aspect_number`, `aspect_group`, `aspect_name`, `indicator_description`, `weight_percent`, `min_score`, `max_score`, `criteria_rubric_json`, `is_active`, `updated_at` |
| 9 | `REVIEW_COMMENTS` | `comment_id` | `assignment_id`, `proposal_id`, `reviewer_id`, `aspect_id` | `comment_id`, `assignment_id`, `proposal_id`, `reviewer_id`, `aspect_id`, `section_name`, `comment_text`, `created_at` |
| 10 | `FINAL_DECISIONS` | `decision_id` | `proposal_id` | `decision_id`, `proposal_id`, `proposal_code`, `reviewer_1_score`, `reviewer_2_score`, `reviewer_3_score`, `score_difference`, `discrepancy_flag`, `average_score`, `auto_grade_category`, `auto_recommendation`, `final_admin_decision`, `budget_approved`, `admin_decision_notes`, `is_published_to_proposer`, `decided_by`, `decided_at` |
| 11 | `ANNOUNCEMENTS` | `announcement_id` | - | `announcement_id`, `title`, `category`, `content_html`, `target_role`, `attachment_drive_id`, `is_pinned`, `published_by`, `published_at`, `expires_at` |
| 12 | `PERIODS` | `period_id` | - | `period_id`, `period_name`, `academic_year`, `proposal_type`, `submission_start`, `submission_end`, `review_start`, `review_end`, `min_reviewers_per_proposal`, `max_file_size_mb`, `status`, `created_at` |
| 13 | `ACTIVITY_LOG` | `log_id` | `user_id` | `log_id`, `timestamp`, `user_id`, `username`, `role`, `action_type`, `target_entity`, `target_id`, `description`, `metadata_json`, `session_hash` |
| 14 | `SYSTEM_SETTINGS` | `setting_key` | - | `setting_key`, `setting_value`, `setting_group`, `description`, `updated_by`, `updated_at` |

## 5. Flowchart Alur Kerja Pengajuan, Peer Review, dan Keputusan Akhir

Status proposal dikelola menggunakan *Finite State Machine* (FSM) yang ketat:

```
[DOSEN PENGUSUL]
      │
      ▼
  (1. DRAFT) ──> Simpan sementara metadata proposal
      │
      ▼ Unggah PDF + Pernyataan Orisinalitas
(2. SUBMITTED) / Menunggu Verifikasi Admin
      │
      ├──> [Admin: Dokumen/Format Belum Lengkap] ──> (REVISION_REQUIRED - Tahap Administrasi)
      │                                                      │
      │    ◄──────── Unggah Revisi Dokumen (v2) ─────────────┘
      ▼
(3. VERIFIED) / Menunggu Penugasan Reviewer
      │
      ▼ Admin menugaskan >= 2 Reviewer (Validasi Anti-Konflik Kepentingan & Blind Review)
(4. ASSIGNED)
      │
      ▼ Reviewer 1 & Reviewer 2 membuka PDF Viewer & mengisi instrumen penilaian (Draft)
(5. IN_REVIEW)
      │
      ▼ Seluruh Reviewer mengirim nilai final (Terkunci otomatis)
(6. REVIEW_COMPLETED)
      │
      ▼ Sistem menghitung Nilai Rata-rata = (R1 + R2)/2 & mendeteksi deviasi skor (> 15 poin)
(7. FINAL_EVALUATION)
      │
      ├──> [Jika selisih skor R1 & R2 > 15 poin] ──> Notifikasi Discrepancy / Tambah Reviewer Ke-3
      │
      ▼ Keputusan Akhir Ketua/Admin LP2M STPM Santa Ursula Ende + Publikasi Hasil
  ┌───┴─────────────────────────────────────────┬────────────────────────────┐
  ▼                                             ▼                            ▼
(8A. ACCEPTED / Direkomendasikan)   (8B. REVISION_REQUIRED / Revisi)   (8C. REJECTED / Ditolak)
```

## 6. Rancangan Instrumen & Rubrik Penilaian Akademik

> **Catatan Akademik & Dasar Penyusunan:**  
> Rancangan instrumen dan bobot di bawah ini disusun sebagai **rancangan awal terstruktur** yang mengadaptasi prinsip evaluasi substansi, metodologi, kelayakan, kebaruan, dan luaran dari:
> 1. [Panduan Penelitian dan Pengabdian kepada Masyarakat Tahun 2026 – Direktorat Penelitian dan Pengabdian kepada Masyarakat (DPPM) Kemdiktisaintek](https://dri.itb.ac.id/wp-content/uploads/sites/33/2025/12/Panduan-Penelitian-dan-Pengabdian-kepada-Masyarakat-Tahun-2026.pdf) serta [Buku Panduan PPM DPPM Kemdiktisaintek 2025](https://kemdiktisaintek.go.id/api/file/humas-production/2025/03/Panduan-PPM-2025-DPPM-rev5.pdf).
> 2. [Buku Panduan Program Kreativitas Mahasiswa (PKM) Tahun 2026 – Direktorat Belmawa Kemdiktisaintek](https://simbelmawa.kemdiktisaintek.go.id/portal/wp-content/uploads/2026/03/PANDUAN-PKM-2026_versi_full.pdf) dan [Panduan Umum PKM 2026](https://simbelmawa.kemdiktisaintek.go.id/portal/wp-content/uploads/2026/03/PKM-Panduan-Umum-2026_fix.pdf).
> 3. Fokus keilmuan [STPM Santa Ursula Ende](https://stpmsantaursula.ac.id/) pada bidang Pembangunan Sosial dan Ilmu Pemerintahan serta [Jurnal Pengabdian dan Pemberdayaan Masyarakat (JPPM) LP2M STPM Santa Ursula](https://ejurnal.stpmsantaursula.ac.id/index.php/JPPM).  
> Seluruh bobot persentase bersifat **dinamis dan dapat dikonfigurasi sepenuhnya oleh Admin LP2M** di dalam menu **Instrumen Penilaian** sesuai kebijakan hibah internal yang berlaku.

### Rumus Perhitungan Skor Otomatis
Skala penilaian untuk setiap aspek menggunakan rentang **1 sampai 5** (`1 = Sangat Kurang`, `2 = Kurang`, `3 = Cukup`, `4 = Baik`, `5 = Sangat Baik`):

$$\text{Nilai Akhir Reviewer} = \sum_{i=1}^{n} \left( \frac{\text{Skor}_i}{5} \times \text{Bobot}_i \right), \quad \text{dengan } \sum_{i=1}^{n} \text{Bobot}_i = 100\%$$

### A. Rubrik Penilaian Proposal PKM (10 Aspek – Total Bobot 100%)

| Kode | Aspek Penilaian | Indikator Penilaian Akademik | Bobot (%) | Deskripsi Kriteria Skala (1 s.d. 5) |
| :-: | :--- | :--- | :-: | :--- |
| `PKM-01` | Relevansi dan urgensi permasalahan | Ketajaman analisis situasi mitra/masyarakat dan urgensi persoalan yang diangkat sesuai skema PKM | **10%** | 1: Tidak relevan; 2: Kurang tajam; 3: Cukup relevan namun data terbatas; 4: Relevan & didukung data awal; 5: Sangat relevan, mendesak, & didukung data empiris kuat |
| `PKM-02` | Ketepatan identifikasi masalah | Kesesuaian perumusan masalah prioritas dengan fakta lapangan dan kebutuhan khalayak sasaran | **10%** | 1: Masalah kabur; 2: Kurang fokus; 3: Masalah teridentifikasi cukup jelas; 4: Fokus & tepat sasaran; 5: Sangat tajam dan memetakan akar masalah secara presisi |
| `PKM-03` | Kesesuaian tujuan dan sasaran kegiatan | Kejelasan keterukuran tujuan, target capaian kegiatan, dan ketepatan kelompok sasaran | **10%** | 1: Tujuan tidak terukur; 2: Sasaran terlalu umum; 3: Cukup terukur; 4: Tujuan & sasaran spesifik; 5: Sangat spesifik, terukur (SMART), dan selaras dengan masalah |
| `PKM-04` | Kebaruan dan kreativitas gagasan | Inovasi solusi, daya kreatif mahasiswa-dosen pendamping, dan nilai tambah pendekatan | **15%** | 1: Monoton/replikasi; 2: Minim kreasi; 3: Modifikasi gagasan yang ada; 4: Kreatif & solutif; 5: Sangat inovatif, orisinal, dan kontekstual bagi masyarakat lokal |
| `PKM-05` | Ketepatan metode pelaksanaan | Sistematika tahapan kerja, pendekatan partisipatif mitra/masyarakat, dan kejelasan prosedur | **15%** | 1: Metode tidak jelas; 2: Tahapan kurang logis; 3: Metode cukup runtut; 4: Metode tepat & partisipatif; 5: Metode sangat sistematis, operasional, dan memberdayakan mitra |
| `PKM-06` | Kelayakan program dan jadwal kegiatan | Realisme jadwal pelaksanaan (3–4 bulan), pembagian tugas tim, dan kelayakan operasional | **8%** | 1: Tidak realistis; 2: Jadwal tumpang tindih; 3: Cukup layak; 4: Jadwal & pembagian kerja rasional; 5: Sangat terstruktur dengan tonggak capaian (*milestone*) jelas |
| `PKM-07` | Kesesuaian anggaran dan RAB | Kewajaran rincian biaya, proporsi belanja bahan/operasional terhadap administrasi sesuai pedoman | **10%** | 1: Tidak sesuai pedoman; 2: Banyak komponen tidak wajar; 3: Cukup wajar; 4: Sesuai standar biaya & rasional; 5: Sangat efisien, akuntabel, dan patuh penuh pada pedoman |
| `PKM-08` | Potensi keberlanjutan program | Peluang kemandirian kelompok sasaran dan keberlanjutan dampak pasca-pelaksanaan program | **7%** | 1: Berhenti saat program usai; 2: Ketergantungan tinggi; 3: Ada rencana tindak lanjut; 4: Berpotensi mandiri; 5: Memiliki peta jalan keberlanjutan dan replikasi yang kuat |
| `PKM-09` | Dampak dan manfaat bagi masyarakat | Kontribusi nyata terhadap pemberdayaan sosial, ekonomi, pendidikan, atau tata kelola komunitas | **10%** | 1: Manfaat minim; 2: Dampak tidak terukur; 3: Manfaat cukup terasa; 4: Berdampak langsung pada sasaran; 5: Dampak transformatif terukur pada kesejahteraan/kapasitas mitra |
| `PKM-10` | Kualitas penulisan dan sistematika proposal | Kepatuhan format administrasi, tata bahasa akademik, sitasi, dan kelengkapan biodata/surat mitra | **5%** | 1: Banyak pelanggaran format; 2: Kurang rapi; 3: Cukup sesuai; 4: Rapi & sesuai template LP2M; 5: Sistematika sangat baik, bahasa baku, dan dokumen lengkap |
| **TOTAL** | **10 Aspek Penilaian PKM** | **Dilengkapi evaluasi kualitatif: Kekuatan, Kelemahan, Catatan Perbaikan, & Rekomendasi** | **100%** | **Skor Maksimal Ideal = 100,00** |

### B. Rubrik Penilaian Proposal Penelitian Dosen (16 Aspek – Total Bobot 100%)

| Kode | Aspek Penilaian | Indikator Penilaian Akademik | Bobot (%) | Deskripsi Kriteria Skala (1 s.d. 5) |
| :-: | :--- | :--- | :-: | :--- |
| `PEN-01` | Relevansi dan urgensi penelitian | Ketajaman latar belakang fenomena pembangunan sosial/pemerintahan dan urgensi pemecahan masalah | **7%** | 1: Tidak relevan; 2: Deskripsi dangkal; 3: Cukup relevan; 4: Tajam & didukung data; 5: Sangat mendesak, strategis, dan berbasis bukti empiris terkini |
| `PEN-02` | Orisinalitas dan kebaruan penelitian | Kebaruan gagasan (*novelty*), keaslian pendekatan, dan pembeda nyata dari penelitian terdahulu | **8%** | 1: Replikasi penuh; 2: Kebaruan lemah; 3: Ada pembeda lokasi/konteks; 4: Memiliki kebaruan konseptual/metodologis; 5: Terobosan ilmiah yang sangat orisinal |
| `PEN-03` | Rumusan masalah dan pertanyaan penelitian | Kejelasan, fokus, dan ketajaman pertanyaan penelitian secara akademik | **6%** | 1: Kabur/tidak fokus; 2: Kurang problematis; 3: Cukup jelas; 4: Tajam & terfokus; 5: Sangat bernas, analitis, dan membuka ruang temuan baru |
| `PEN-04` | Tujuan dan manfaat penelitian | Keselarasan tujuan spesifik dengan rumusan masalah serta kontribusi teoretis dan praktis | **5%** | 1: Tidak selaras; 2: Terlalu normatif; 3: Cukup selaras; 4: Tujuan & manfaat jelas; 5: Sangat koheren dan memberikan kontribusi kebijakan/praktis nyata |
| `PEN-05` | Tinjauan pustaka dan landasan teori | Kemutakhiran referensi primer (jurnal bereputasi 5–10 tahun terakhir) dan kedalaman sintesis teori | **7%** | 1: Minim pustaka primer; 2: Dominan buku tua; 3: Pustaka cukup relevan; 4: Kaya artikel jurnal terkini; 5: Sintesis teoretis sangat mendalam dari jurnal bereputasi |
| `PEN-06` | State of the Art dan Research Gap | Pemetaan perkembangan riset terkini dan ketajaman identifikasi celah penelitian (*research gap*) | **8%** | 1: Tanpa peta riset; 2: Sekadar daftar penelitian; 3: Cukup menunjukkan perbedaan; 4: Research gap jelas; 5: Pemetaan *state of the art* dan *gap* sangat tajam & meyakinkan |
| `PEN-07` | Kerangka konseptual atau kerangka berpikir | Koherensi alur logika antarkonsep/variabel dan bagan alir kerangka pemikiran penelitian | **6%** | 1: Tidak ada kerangka; 2: Alur membingungkan; 3: Cukup runtut; 4: Kerangka logis & terstruktur; 5: Sangat koheren, integratif, dan memandu operasionalisasi konsep |
| `PEN-08` | Ketepatan metode penelitian | Kesesuaian jenis dan pendekatan penelitian (kualitatif, kuantitatif, *mixed-methods*, PAR) dengan masalah | **8%** | 1: Metode keliru; 2: Kurang operasional; 3: Cukup tepat; 4: Metode tepat & terjelaskan baik; 5: Desain metodologi sangat presisi dan rigor secara ilmiah |
| `PEN-09` | Populasi, sampel, atau informan penelitian | Ketepatan teknik penentuan informan kunci (*purposive/snowball*) atau teknik *sampling* dan lokasi | **5%** | 1: Tidak jelas; 2: Kriteria kabur; 3: Cukup memadai; 4: Kriteria informan/sampel tepat; 5: Sangat representatif dengan justifikasi metodologis yang kuat |
| `PEN-10` | Teknik pengumpulan data | Validitas prosedur observasi, wawancara mendalam, FGD, survei, atau studi dokumen | **6%** | 1: Tanpa rincian teknik; 2: Instrumen lemah; 3: Cukup jelas; 4: Teknik & instrumen valid; 5: Triangulasi sumber dan teknik pengumpulan data sangat komprehensif |
| `PEN-11` | Teknik analisis data | Ketepatan tahapan analisis data (interaktif Miles-Huberman, tematik, statistik, atau analisis kebijakan) | **7%** | 1: Tidak dijelaskan; 2: Terlalu umum; 3: Cukup sesuai; 4: Prosedur analisis & uji keabsahan jelas; 5: Sangat tajam, sistematis, dan menjamin validitas/reliabilitas temuan |
| `PEN-12` | Kesesuaian jadwal penelitian | Kelayakan lini masa penelitian dari tahap persiapan, lapangan, analisis, hingga laporan akhir | **4%** | 1: Tidak layak; 2: Kurang proporsional; 3: Cukup realistis; 4: Jadwal terencana baik; 5: Sangat realistis, terukur per bulan, dan selaras dengan kalender LP2M |
| `PEN-13` | Kelayakan anggaran penelitian | Kewajaran RAB berbasis standar biaya masukan dan efisiensi alokasi komponen riset lapangan | **6%** | 1: Tidak rasional; 2: Banyak pos tidak relevan; 3: Cukup wajar; 4: Sesuai pagu & rasional; 5: Sangat proporsional, transparan, dan mendukung pencapaian luaran |
| `PEN-14` | Target luaran penelitian | Kejelasan target luaran wajib (artikel jurnal SINTA/Scopus/JPPM, buku ajar, *policy brief*, HKI) | **7%** | 1: Tanpa target jelas; 2: Luaran di bawah standar; 3: Target cukup jelas; 4: Target luaran terukur & realistis; 5: Target luaran berdampak tinggi disertai nama jurnal sasaran |
| `PEN-15` | Potensi publikasi ilmiah | Kelayakan substansi dan kebaruan data untuk menembus jurnal ilmiah terakreditasi nasional/internasional | **6%** | 1: Sangat rendah; 2: Kurang layak publikasi; 3: Berpotensi di jurnal lokal; 4: Layak di jurnal terakreditasi SINTA; 5: Sangat potensial dipublikasikan pada jurnal SINTA 1–2 / Bereputasi |
| `PEN-16` | Kesesuaian format dan sistematika penulisan | Kepatuhan terhadap panduan penulisan LP2M STPM Santa Ursula Ende dan konsistensi sitasi ilmiah | **4%** | 1: Tidak sesuai panduan; 2: Banyak kesalahan kutipan; 3: Cukup rapi; 4: Sesuai panduan & sitasi baku; 5: Sangat rapi, bebas salah ketik, dan menggunakan *reference manager* |
| **TOTAL** | **16 Aspek Penilaian Penelitian Dosen** | **Ditambah 5 Penilaian Khusus & 4 Evaluasi Integritas Akademik** | **100%** | **Skor Maksimal Ideal = 100,00** |

#### Penilaian Khusus & Evaluasi Integritas Akademik (Proposal Penelitian Dosen)
Selain 16 aspek berbobot di atas, formulir review Penelitian Dosen mewajibkan reviewer mengevaluasi:
- **5 Dimensi Penilaian Khusus:**
  1. Orisinalitas penelitian (`Tinggi` / `Sedang` / `Rendah`)
  2. Potensi kontribusi terhadap pengembangan ilmu pengetahuan (`Sangat Signifikan` / `Signifikan` / `Cukup` / `Kurang`)
  3. Relevansi terhadap bidang keilmuan Program Studi (Pembangunan Sosial / Ilmu Pemerintahan) (`Sangat Relevan` / `Relevan` / `Kurang Relevan`)
  4. Potensi penerapan hasil penelitian bagi masyarakat/pemerintah daerah (`Sangat Tinggi` / `Tinggi` / `Cukup` / `Rendah`)
  5. Kesesuaian dengan Roadmap Penelitian LP2M STPM Santa Ursula Ende (`Sesuai Prioritas Utama` / `Sesuai` / `Perlu Penyesuaian`)
- **4 Parameter Evaluasi Integritas Akademik:**
  1. Pernyataan Orisinalitas Bermeterai (`Terlampir & Valid` / `Belum Lengkap`)
  2. Kelayakan & Kemutakhiran Referensi Ilmiah (`Memenuhi Standar` / `Perlu Penambahan Referensi Primer`)
  3. Indikasi / Potensi Plagiarisme (`Aman [< 20%]` / `Waspada [20%–30%]` / `Terindikasi Tinggi [> 30%]`)
  4. Kelayakan Etika Penelitian (*Ethical Clearance* & *Informed Consent* informan/komunitas) (`Memenuhi Prinsip Etika` / `Perlu Perbaikan Protokol Etika`)
