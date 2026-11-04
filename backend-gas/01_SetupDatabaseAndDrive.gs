/**
 * ============================================================================
 * SIPROREVIEW – LP2M STPM SANTA URSULA ENDE
 * File: 01_SetupDatabaseAndDrive.gs
 * Deskripsi: Script Otomatis Pembuat 14 Sheet Google Spreadsheet, Seed Data Awal,
 *            dan Struktur Folder Google Drive (LP2M_STPM_SANTA_URSULA)
 * ============================================================================
 * CARA PENGGUNAAN:
 * 1. Buka Google Spreadsheet baru -> beri nama: "DB_SIPROREVIEW_LP2M_STPM_SANTA_URSULA"
 * 2. Klik menu Extensions (Ekstensi) -> Apps Script
 * 3. Salin seluruh file .gs ke dalam editor Apps Script
 * 4. Pilih fungsi "setupSiproreviewComplete" pada toolbar atas, lalu klik "Run" (Jalankan)
 * 5. Berikan izin akses (Review Permissions -> Allow)
 * ============================================================================
 */

const SIPRO_CONFIG = {
  ROOT_FOLDER_NAME: 'LP2M_STPM_SANTA_URSULA',
  YEARS: ['2026', '2027'],
  TIMEZONE: 'Asia/Makassar'
};

function setupSiproreviewComplete() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const schemas = getSiproSchemas();

  // 1. Buat seluruh 14 Sheet dan format header
  Object.keys(schemas).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    const headers = schemas[sheetName];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#1E6B4A')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
  });

  // Hapus Sheet1 bawaan jika masih ada dan kosong
  const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Lembar1');
  if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() <= 1) {
    ss.deleteSheet(defaultSheet);
  }

  // 2. Bangun struktur folder Google Drive secara otomatis
  const driveFolders = createSiproDriveFolderTree();

  // 3. Isi data awal (Seed Data: Akun Admin, Dosen, Rubrik PKM 10 Aspek, Rubrik Penelitian 16 Aspek, Periode & Pengumuman)
  seedInitialDatabase(ss, driveFolders);

  Logger.log('=== INISIALISASI SIPROREVIEW SELESAI ===');
  Logger.log('Spreadsheet ID: ' + ss.getId());
  Logger.log('Root Folder Drive ID: ' + driveFolders.rootId);
  return {
    spreadsheetId: ss.getId(),
    driveFolders: driveFolders
  };
}

function getSiproSchemas() {
  return {
    USERS: [
      'user_id', 'username', 'nidn', 'full_name', 'email', 'phone',
      'role', 'prodi', 'functional_rank', 'expertise', 'sinta_id',
      'password_hash', 'password_salt', 'must_change_password',
      'profile_completed', 'failed_attempts', 'locked_until',
      'is_active', 'last_login', 'created_at', 'updated_at'
    ],
    PROPOSALS: [
      'proposal_id', 'proposal_code', 'period_id', 'proposal_type',
      'scheme_category', 'title', 'proposer_user_id', 'proposer_nidn',
      'proposer_name', 'prodi', 'team_members_json', 'submission_year',
      'focus_area', 'abstract_summary', 'keywords', 'budget_requested',
      'drive_file_id', 'standardized_filename', 'file_size_bytes',
      'document_version', 'originality_declared', 'status',
      'admin_verification_note', 'verified_by', 'verified_at',
      'submitted_at', 'updated_at'
    ],
    REVIEWERS: [
      'reviewer_id', 'user_id', 'nidn', 'full_name', 'prodi',
      'expertise_areas', 'max_quota', 'active_assignments',
      'completed_reviews', 'is_certified', 'status', 'created_at'
    ],
    REVIEW_ASSIGNMENTS: [
      'assignment_id', 'proposal_id', 'proposal_code', 'proposal_type',
      'reviewer_id', 'reviewer_user_id', 'reviewer_order',
      'assigned_by', 'assignment_method', 'blind_mode',
      'assigned_at', 'deadline_at', 'review_status',
      'is_locked', 'unlocked_by', 'unlock_reason', 'completed_at'
    ],
    REVIEW_PKM: [
      'review_pkm_id', 'assignment_id', 'proposal_id', 'reviewer_id',
      'scores_json', 'weighted_score_total', 'strengths', 'weaknesses',
      'improvement_notes', 'reviewer_recommendation', 'submitted_status',
      'revision_version', 'submitted_at', 'updated_at'
    ],
    REVIEW_PENELITIAN: [
      'review_penelitian_id', 'assignment_id', 'proposal_id', 'reviewer_id',
      'scores_json', 'weighted_score_total', 'special_assessment_json',
      'integrity_evaluation_json', 'section_notes_json',
      'critique_suggestions', 'reviewer_recommendation',
      'submitted_status', 'revision_version', 'submitted_at', 'updated_at'
    ],
    RUBRIC_PKM: [
      'aspect_id', 'aspect_number', 'aspect_name', 'indicator_description',
      'weight_percent', 'min_score', 'max_score', 'criteria_desc',
      'is_active', 'updated_at'
    ],
    RUBRIC_PENELITIAN: [
      'aspect_id', 'aspect_number', 'aspect_name', 'indicator_description',
      'weight_percent', 'min_score', 'max_score', 'criteria_desc',
      'is_active', 'updated_at'
    ],
    REVIEW_COMMENTS: [
      'comment_id', 'assignment_id', 'proposal_id', 'reviewer_id',
      'aspect_id', 'section_name', 'comment_text', 'created_at'
    ],
    FINAL_DECISIONS: [
      'decision_id', 'proposal_id', 'proposal_code', 'reviewer_1_score',
      'reviewer_2_score', 'reviewer_3_score', 'score_difference',
      'discrepancy_flag', 'average_score', 'auto_grade_category',
      'auto_recommendation', 'final_admin_decision', 'budget_approved',
      'admin_decision_notes', 'is_published_to_proposer',
      'decided_by', 'decided_at'
    ],
    ANNOUNCEMENTS: [
      'announcement_id', 'title', 'category', 'content_text',
      'target_role', 'published_by', 'published_at'
    ],
    PERIODS: [
      'period_id', 'period_name', 'academic_year', 'proposal_type',
      'submission_start', 'submission_end', 'review_start', 'review_end',
      'min_reviewers_per_proposal', 'max_file_size_mb', 'status', 'created_at'
    ],
    ACTIVITY_LOG: [
      'log_id', 'timestamp', 'user_id', 'username', 'role',
      'action_type', 'target_entity', 'target_id', 'description'
    ],
    SYSTEM_SETTINGS: [
      'setting_key', 'setting_value', 'setting_group', 'description', 'updated_at'
    ]
  };
}

function createSiproDriveFolderTree() {
  const rootFolder = getOrMakeSubFolder(DriveApp.getRootFolder(), SIPRO_CONFIG.ROOT_FOLDER_NAME);
  const pkmFolder = getOrMakeSubFolder(rootFolder, 'PROPOSAL_PKM');
  const penFolder = getOrMakeSubFolder(rootFolder, 'PROPOSAL_PENELITIAN');
  const hasilFolder = getOrMakeSubFolder(rootFolder, 'HASIL_REVIEW');
  const laporanFolder = getOrMakeSubFolder(rootFolder, 'LAPORAN');
  const arsipFolder = getOrMakeSubFolder(rootFolder, 'ARSIP');

  const pkmYears = {};
  const penYears = {};
  SIPRO_CONFIG.YEARS.forEach(yr => {
    pkmYears[yr] = getOrMakeSubFolder(pkmFolder, yr).getId();
    penYears[yr] = getOrMakeSubFolder(penFolder, yr).getId();
  });

  const hasilPkm = getOrMakeSubFolder(hasilFolder, 'PKM');
  const hasilPen = getOrMakeSubFolder(hasilFolder, 'PENELITIAN');

  try {
    rootFolder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  } catch (e) {}

  const folderMap = {
    rootId: rootFolder.getId(),
    pkm2026Id: pkmYears['2026'],
    pkm2027Id: pkmYears['2027'],
    pen2026Id: penYears['2026'],
    pen2027Id: penYears['2027'],
    hasilPkmId: hasilPkm.getId(),
    hasilPenId: hasilPen.getId(),
    laporanId: laporanFolder.getId(),
    arsipId: arsipFolder.getId()
  };

  PropertiesService.getScriptProperties().setProperty('SIPRO_FOLDERS', JSON.stringify(folderMap));
  return folderMap;
}

function getOrMakeSubFolder(parentFolder, folderName) {
  const iter = parentFolder.getFoldersByName(folderName);
  if (iter.hasNext()) return iter.next();
  return parentFolder.createFolder(folderName);
}

function seedInitialDatabase(ss, driveFolders) {
  const now = new Date().toISOString();

  // 1. Seed USERS
  const userSheet = ss.getSheetByName('USERS');
  if (userSheet.getLastRow() <= 1) {
    const adminSalt = 'stpm_salt_admin_2026';
    const dosenSalt = 'stpm_salt_dosen_2026';
    const adminHash = hashPasswordWithSalt('STPM2025', adminSalt);
    const dosenHash = hashPasswordWithSalt('Stpm12345', dosenSalt);

    const initialUsers = [
      ['USR-ADMIN-01', 'admin', '-', 'Administrator LP2M STPM Santa Ursula', 'lp2m@stpmsantaursula.ac.id', '0381-21862', 'ADMIN', 'LP2M', 'Kepala LP2M', 'Manajemen Riset & Pengabdian Masyarakat', '6011920', adminHash, adminSalt, false, true, 0, '', true, now, now, now],
      ['USR-DOS-01', '0812048801', '0812048801', 'Dr. Yosef Maria Florisan, S.IP., M.Si.', 'yosef.florisan@stpmsantaursula.ac.id', '081237889101', 'DOSEN', 'Ilmu Pemerintahan', 'Lektor Kepala', 'Tata Kelola Pemerintahan Desa, Kebijakan Publik & Ekonomi Biru', '6681421', dosenHash, dosenSalt, false, true, 0, '', true, now, now, now],
      ['USR-DOS-02', '0823079002', '0823079002', 'Maria Goreti Nona, S.Sos., M.Si.', 'mariagoreti@stpmsantaursula.ac.id', '081339401122', 'DOSEN', 'Pembangunan Sosial', 'Lektor', 'Pemberdayaan Masyarakat Pesisir, Gender & UMKM Lokal', '6720519', dosenHash, dosenSalt, false, true, 0, '', true, now, now, now],
      ['USR-DOS-03', '0815098503', '0815098503', 'Helenerius Ajo Leda, S.Sos., M.I.P.', 'helenerius.leda@stpmsantaursula.ac.id', '082144559870', 'DOSEN', 'Pembangunan Sosial', 'Lektor', 'Kelembagaan Komunitas, Sosiologi Pembangunan & Inovasi Sosial', '6694102', dosenHash, dosenSalt, false, true, 0, '', true, now, now, now],
      ['USR-DOS-04', '0804118904', '0804118904', 'Martinus Satban, S.IP., M.Si.', 'martinus.satban@stpmsantaursula.ac.id', '085239112233', 'DOSEN', 'Ilmu Pemerintahan', 'Lektor', 'Birokrasi Lokal, E-Government & Partisipasi Publik', '6711834', dosenHash, dosenSalt, false, true, 0, '', true, now, now, now],
      ['USR-DOS-05', '0819029205', '0819029205', 'Yulita Eme, S.Sos., M.Si.', 'yulita.eme@stpmsantaursula.ac.id', '081353778899', 'DOSEN', 'Pembangunan Sosial', 'Lektor', 'Kebijakan Sosial, Ketahanan Keluarga & Pemberdayaan Komunitas Adat', '6650912', dosenHash, dosenSalt, true, false, 0, '', true, '', now, now]
    ];
    userSheet.getRange(2, 1, initialUsers.length, initialUsers[0].length).setValues(initialUsers);
  }

  // 2. Seed REVIEWERS
  const revSheet = ss.getSheetByName('REVIEWERS');
  if (revSheet.getLastRow() <= 1) {
    const initialReviewers = [
      ['REV-01', 'USR-DOS-01', '0812048801', 'Dr. Yosef Maria Florisan, S.IP., M.Si.', 'Ilmu Pemerintahan', 'Tata Kelola Pemerintahan Desa, Kebijakan Publik & Ekonomi Biru', 6, 2, 2, true, 'ACTIVE', now],
      ['REV-02', 'USR-DOS-02', '0823079002', 'Maria Goreti Nona, S.Sos., M.Si.', 'Pembangunan Sosial', 'Pemberdayaan Masyarakat Pesisir, Gender & UMKM Lokal', 6, 1, 1, true, 'ACTIVE', now],
      ['REV-03', 'USR-DOS-03', '0815098503', 'Helenerius Ajo Leda, S.Sos., M.I.P.', 'Pembangunan Sosial', 'Kelembagaan Komunitas, Sosiologi Pembangunan & Inovasi Sosial', 6, 2, 2, true, 'ACTIVE', now],
      ['REV-04', 'USR-DOS-04', '0804118904', 'Martinus Satban, S.IP., M.Si.', 'Ilmu Pemerintahan', 'Birokrasi Lokal, E-Government & Partisipasi Publik', 6, 1, 1, true, 'ACTIVE', now]
    ];
    revSheet.getRange(2, 1, initialReviewers.length, initialReviewers[0].length).setValues(initialReviewers);
  }

  // 3. Seed RUBRIC_PKM (10 Aspek = 100%)
  const rubPkmSheet = ss.getSheetByName('RUBRIC_PKM');
  if (rubPkmSheet.getLastRow() <= 1) {
    const pkmRows = [
      ['PKM-01', 1, 'Relevansi dan urgensi permasalahan', 'Ketajaman analisis situasi mitra/masyarakat dan urgensi persoalan yang diangkat sesuai skema PKM.', 10, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PKM-02', 2, 'Ketepatan identifikasi masalah', 'Kesesuaian perumusan masalah prioritas dengan fakta lapangan dan kebutuhan khalayak sasaran.', 10, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PKM-03', 3, 'Kesesuaian tujuan dan sasaran kegiatan', 'Kejelasan keterukuran tujuan, target capaian kegiatan, dan ketepatan kelompok sasaran.', 10, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PKM-04', 4, 'Kebaruan dan kreativitas gagasan', 'Inovasi solusi, orisinalitas ide kreatif mahasiswa-dosen pendamping, dan nilai tambah pendekatan.', 15, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PKM-05', 5, 'Ketepatan metode pelaksanaan', 'Sistematika tahapan pelaksanaan, partisipasi mitra/masyarakat, dan ketepatan pendekatan.', 15, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PKM-06', 6, 'Kelayakan program dan jadwal kegiatan', 'Realisme jadwal pelaksanaan (3-4 bulan), pembagian peran tim, dan kelayakan operasional.', 8, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PKM-07', 7, 'Kesesuaian anggaran dan RAB', 'Kewajaran rincian biaya, kepatuhan proporsi operasional vs administrasi sesuai pedoman PKM.', 10, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PKM-08', 8, 'Potensi keberlanjutan program', 'Peluang kemandirian kelompok sasaran dan keberlanjutan dampak program pasca-pendanaan.', 7, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PKM-09', 9, 'Dampak dan manfaat bagi masyarakat', 'Kontribusi nyata terhadap pemberdayaan sosial, ekonomi, pendidikan, atau tata kelola komunitas.', 10, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PKM-10', 10, 'Kualitas penulisan dan sistematika proposal', 'Kepatuhan format administrasi, tata bahasa akademik, sitasi, dan kelengkapan lampiran.', 5, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now]
    ];
    rubPkmSheet.getRange(2, 1, pkmRows.length, pkmRows[0].length).setValues(pkmRows);
  }

  // 4. Seed RUBRIC_PENELITIAN (16 Aspek = 100%)
  const rubPenSheet = ss.getSheetByName('RUBRIC_PENELITIAN');
  if (rubPenSheet.getLastRow() <= 1) {
    const penRows = [
      ['PEN-01', 1, 'Relevansi dan urgensi penelitian', 'Ketajaman latar belakang fenomena pembangunan sosial/pemerintahan dan urgensi pemecahan masalah.', 7, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PEN-02', 2, 'Orisinalitas dan kebaruan penelitian', 'Kebaruan gagasan (novelty), keaslian pendekatan, dan pembeda nyata dari penelitian terdahulu.', 8, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PEN-03', 3, 'Rumusan masalah dan pertanyaan penelitian', 'Kejelasan, fokus, dan ketajaman pertanyaan penelitian secara akademik.', 6, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PEN-04', 4, 'Tujuan dan manfaat penelitian', 'Keselarasan tujuan spesifik dengan rumusan masalah serta kontribusi teoretis dan praktis.', 5, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PEN-05', 5, 'Tinjauan pustaka dan landasan teori', 'Kemutakhiran referensi primer (jurnal bereputasi 5-10 tahun terakhir) dan kedalaman sintesis teori.', 7, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PEN-06', 6, 'State of the Art dan Research Gap', 'Pemetaan perkembangan riset terkini dan ketajaman identifikasi celah penelitian (research gap).', 8, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PEN-07', 7, 'Kerangka konseptual atau kerangka berpikir', 'Koherensi alur logika antarkonsep/variabel dan bagan alir kerangka pemikiran penelitian.', 6, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PEN-08', 8, 'Ketepatan metode penelitian', 'Kesesuaian jenis dan pendekatan penelitian (kualitatif, kuantitatif, mixed-methods, PAR) dengan masalah.', 8, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PEN-09', 9, 'Populasi, sampel, atau informan penelitian', 'Ketepatan teknik penentuan informan kunci (purposive/snowball) atau teknik sampling dan lokasi.', 5, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PEN-10', 10, 'Teknik pengumpulan data', 'Validitas prosedur observasi, wawancara mendalam, FGD, survei, atau studi dokumen.', 6, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PEN-11', 11, 'Teknik analisis data', 'Ketepatan tahapan analisis data (interaktif Miles-Huberman, tematik, statistik, atau kebijakan).', 7, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PEN-12', 12, 'Kesesuaian jadwal penelitian', 'Kelayakan lini masa penelitian dari tahap persiapan, lapangan, analisis, hingga laporan akhir.', 4, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PEN-13', 13, 'Kelayakan anggaran penelitian', 'Kewajaran RAB berbasis standar biaya masukan dan efisiensi alokasi komponen riset lapangan.', 6, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PEN-14', 14, 'Target luaran penelitian', 'Kejelasan target luaran wajib (artikel jurnal SINTA/Scopus/JPPM, buku ajar, policy brief, HKI).', 7, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PEN-15', 15, 'Potensi publikasi ilmiah', 'Kelayakan substansi dan kebaruan data untuk menembus jurnal ilmiah terakreditasi nasional/internasional.', 6, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now],
      ['PEN-16', 16, 'Kesesuaian format dan sistematika penulisan', 'Kepatuhan terhadap panduan penulisan LP2M STPM Santa Ursula Ende dan konsistensi sitasi ilmiah.', 4, 1, 5, '1=Sangat Kurang s.d. 5=Sangat Baik', true, now]
    ];
    rubPenSheet.getRange(2, 1, penRows.length, penRows[0].length).setValues(penRows);
  }

  // 5. Seed PERIODS & SYSTEM_SETTINGS
  const perSheet = ss.getSheetByName('PERIODS');
  if (perSheet.getLastRow() <= 1) {
    perSheet.appendRow(['PER-2026-GANJIL', 'Penerimaan Proposal PKM & Penelitian Dosen TA 2026/2027', '2026/2027', 'ALL', '2026-09-01', '2026-11-15', '2026-09-15', '2026-11-30', 2, 10, 'OPEN', now]);
  }

  const setSheet = ss.getSheetByName('SYSTEM_SETTINGS');
  if (setSheet.getLastRow() <= 1) {
    const settingsRows = [
      ['DRIVE_ROOT_FOLDER_ID', driveFolders.rootId, 'DRIVE', 'ID Folder Utama LP2M_STPM_SANTA_URSULA', now],
      ['DRIVE_PKM_2026_ID', driveFolders.pkm2026Id, 'DRIVE', 'ID Folder PROPOSAL_PKM/2026', now],
      ['DRIVE_PENELITIAN_2026_ID', driveFolders.pen2026Id, 'DRIVE', 'ID Folder PROPOSAL_PENELITIAN/2026', now],
      ['DRIVE_ARSIP_ID', driveFolders.arsipId, 'DRIVE', 'ID Folder ARSIP Dokumen Revisi', now],
      ['BLIND_REVIEW_DEFAULT', 'TRUE', 'REVIEW', 'Mode Double-Blind Review Aktif Secara Default', now],
      ['DISCREPANCY_THRESHOLD', '15.0', 'SCORING', 'Ambang Notifikasi Perbedaan Skor Antarreviewer', now]
    ];
    setSheet.getRange(2, 1, settingsRows.length, settingsRows[0].length).setValues(settingsRows);
  }
}
