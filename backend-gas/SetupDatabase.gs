/**
 * SIPROREVIEW - LP2M STPM Santa Ursula Ende
 * File: SetupDatabase.gs
 * Deskripsi: Inisialisasi otomatis 14 Sheet Google Spreadsheet & Struktur Folder Google Drive
 */

const SYSTEM_CONFIG = {
  APP_NAME: 'SIPROREVIEW – LP2M STPM Santa Ursula Ende',
  ROOT_FOLDER_NAME: 'LP2M_STPM_SANTA_URSULA',
  YEARS: ['2026', '2027']
};

/**
 * Jalankan fungsi ini satu kali di Google Apps Script Editor untuk membangun
 * seluruh 14 tabel (Sheets) dan struktur folder Google Drive secara otomatis.
 */
function initializeSiproreviewInfrastructure() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const schemas = getDatabaseSchemas();

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
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  });

  const driveStructure = initializeDriveFolders();
  seedInitialData(ss, driveStructure);
  return {
    status: 'success',
    spreadsheetId: ss.getId(),
    driveFolders: driveStructure
  };
}

function getDatabaseSchemas() {
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
      'reviewer_id', 'reviewer_user_id', 'reviewer_Order',
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
      'weight_percent', 'min_score', 'max_score', 'criteria_1_desc',
      'criteria_2_desc', 'criteria_3_desc', 'criteria_4_desc',
      'criteria_5_desc', 'is_active', 'updated_at'
    ],
    RUBRIC_PENELITIAN: [
      'aspect_id', 'aspect_number', 'aspect_group', 'aspect_name',
      'indicator_description', 'weight_percent', 'min_score', 'max_score',
      'criteria_rubric_json', 'is_active', 'updated_at'
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
      'announcement_id', 'title', 'category', 'content_html',
      'target_role', 'attachment_drive_id', 'is_pinned',
      'published_by', 'published_at', 'expires_at'
    ],
    PERIODS: [
      'period_id', 'period_name', 'academic_year', 'proposal_type',
      'submission_start', 'submission_end', 'review_start', 'review_end',
      'min_reviewers_per_proposal', 'max_file_size_mb', 'status', 'created_at'
    ],
    ACTIVITY_LOG: [
      'log_id', 'timestamp', 'user_id', 'username', 'role',
      'action_type', 'target_entity', 'target_id', 'description',
      'metadata_json', 'session_hash'
    ],
    SYSTEM_SETTINGS: [
      'setting_key', 'setting_value', 'setting_group', 'description',
      'updated_by', 'updated_at'
    ]
  };
}

/**
 * Membuat struktur folder Google Drive resmi LP2M STPM Santa Ursula Ende
 */
function initializeDriveFolders() {
  const rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), SYSTEM_CONFIG.ROOT_FOLDER_NAME);
  const pkmRoot = getOrCreateFolder(rootFolder, 'PROPOSAL_PKM');
  const penRoot = getOrCreateFolder(rootFolder, 'PROPOSAL_PENELITIAN');
  const hasilRoot = getOrCreateFolder(rootFolder, 'HASIL_REVIEW');
  const laporanRoot = getOrCreateFolder(rootFolder, 'LAPORAN');
  const arsipRoot = getOrCreateFolder(rootFolder, 'ARSIP');

  const pkmYears = {};
  const penYears = {};
  SYSTEM_CONFIG.YEARS.forEach(yr => {
    pkmYears[yr] = getOrCreateFolder(pkmRoot, yr).getId();
    penYears[yr] = getOrCreateFolder(penRoot, yr).getId();
  });

  const hasilPkm = getOrCreateFolder(hasilRoot, 'PKM');
  const hasilPen = getOrCreateFolder(hasilRoot, 'PENELITIAN');

  // Set private access (restricted to domain/service account)
  rootFolder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);

  return {
    rootId: rootFolder.getId(),
    pkmByYear: pkmYears,
    penelitianByYear: penYears,
    hasilReviewPkmId: hasilPkm.getId(),
    hasilReviewPenelitianId: hasilPen.getId(),
    laporanId: laporanRoot.getId(),
    arsipId: arsipRoot.getId()
  };
}

function getOrCreateFolder(parent, name) {
  const iter = parent.getFoldersByName(name);
  if (iter.hasNext()) return iter.next();
  return parent.createFolder(name);
}
