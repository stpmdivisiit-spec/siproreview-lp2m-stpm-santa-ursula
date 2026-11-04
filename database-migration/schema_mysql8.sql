-- ============================================================================
-- SIPROREVIEW – LP2M STPM SANTA URSULA ENDE
-- Skema Database MySQL 8.0+ (Blueprint Migrasi dari Google Spreadsheet ke RDBMS)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS siproreview_stpm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE siproreview_stpm;

CREATE TABLE users (
    user_id VARCHAR(32) PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    nidn VARCHAR(20) NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NULL,
    role ENUM('ADMIN', 'DOSEN') NOT NULL DEFAULT 'DOSEN',
    prodi ENUM('Pembangunan Sosial', 'Ilmu Pemerintahan', 'LP2M') NOT NULL,
    functional_rank VARCHAR(60) NULL,
    expertise VARCHAR(255) NULL,
    sinta_id VARCHAR(30) NULL,
    password_hash CHAR(64) NOT NULL,
    password_salt CHAR(32) NOT NULL,
    must_change_password TINYINT(1) NOT NULL DEFAULT 1,
    profile_completed TINYINT(1) NOT NULL DEFAULT 0,
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until DATETIME NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    last_login DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE periods (
    period_id VARCHAR(32) PRIMARY KEY,
    period_name VARCHAR(150) NOT NULL,
    academic_year VARCHAR(16) NOT NULL,
    proposal_type ENUM('PKM', 'PENELITIAN', 'ALL') NOT NULL DEFAULT 'ALL',
    submission_start DATE NOT NULL,
    submission_end DATE NOT NULL,
    review_start DATE NOT NULL,
    review_end DATE NOT NULL,
    min_reviewers_per_proposal INT NOT NULL DEFAULT 2,
    max_file_size_mb INT NOT NULL DEFAULT 10,
    status ENUM('OPEN', 'REVIEW_PHASE', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE proposals (
    proposal_id VARCHAR(32) PRIMARY KEY,
    proposal_code VARCHAR(40) NOT NULL UNIQUE,
    period_id VARCHAR(32) NOT NULL,
    proposal_type ENUM('PKM', 'PENELITIAN') NOT NULL,
    scheme_category VARCHAR(100) NOT NULL,
    title VARCHAR(350) NOT NULL,
    proposer_user_id VARCHAR(32) NOT NULL,
    proposer_nidn VARCHAR(20) NOT NULL,
    proposer_name VARCHAR(150) NOT NULL,
    prodi ENUM('Pembangunan Sosial', 'Ilmu Pemerintahan') NOT NULL,
    team_members_json JSON NOT NULL,
    submission_year YEAR NOT NULL,
    focus_area VARCHAR(150) NOT NULL,
    abstract_summary TEXT NOT NULL,
    keywords VARCHAR(255) NOT NULL,
    budget_requested DECIMAL(15,2) NOT NULL DEFAULT 0,
    drive_file_id VARCHAR(128) NOT NULL,
    standardized_filename VARCHAR(180) NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    document_version INT NOT NULL DEFAULT 1,
    originality_declared TINYINT(1) NOT NULL DEFAULT 1,
    status ENUM(
        'DRAFT', 'SUBMITTED', 'VERIFIED', 'ASSIGNED',
        'IN_REVIEW', 'REVIEW_COMPLETED', 'FINAL_EVALUATION',
        'ACCEPTED', 'REVISION_REQUIRED', 'REJECTED'
    ) NOT NULL DEFAULT 'SUBMITTED',
    admin_verification_note TEXT NULL,
    verified_by VARCHAR(32) NULL,
    verified_at DATETIME NULL,
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (proposer_user_id) REFERENCES users(user_id),
    FOREIGN KEY (period_id) REFERENCES periods(period_id)
);

CREATE TABLE reviewers (
    reviewer_id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL UNIQUE,
    nidn VARCHAR(20) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    prodi ENUM('Pembangunan Sosial', 'Ilmu Pemerintahan') NOT NULL,
    expertise_areas VARCHAR(255) NOT NULL,
    max_quota INT NOT NULL DEFAULT 6,
    active_assignments INT NOT NULL DEFAULT 0,
    completed_reviews INT NOT NULL DEFAULT 0,
    is_certified TINYINT(1) NOT NULL DEFAULT 1,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE review_assignments (
    assignment_id VARCHAR(32) PRIMARY KEY,
    proposal_id VARCHAR(32) NOT NULL,
    proposal_code VARCHAR(40) NOT NULL,
    proposal_type ENUM('PKM', 'PENELITIAN') NOT NULL,
    reviewer_id VARCHAR(32) NOT NULL,
    reviewer_user_id VARCHAR(32) NOT NULL,
    reviewer_order TINYINT NOT NULL DEFAULT 1,
    assigned_by VARCHAR(32) NOT NULL,
    assignment_method ENUM('MANUAL', 'AUTO_MATCH') NOT NULL DEFAULT 'MANUAL',
    blind_mode TINYINT(1) NOT NULL DEFAULT 1,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deadline_at DATE NOT NULL,
    review_status ENUM('ASSIGNED', 'DRAFT', 'COMPLETED', 'REVISION_OPENED') NOT NULL DEFAULT 'ASSIGNED',
    is_locked TINYINT(1) NOT NULL DEFAULT 0,
    unlocked_by VARCHAR(32) NULL,
    unlock_reason TEXT NULL,
    completed_at DATETIME NULL,
    UNIQUE KEY uq_proposal_reviewer (proposal_id, reviewer_id),
    FOREIGN KEY (proposal_id) REFERENCES proposals(proposal_id),
    FOREIGN KEY (reviewer_id) REFERENCES reviewers(reviewer_id)
);

CREATE TABLE review_pkm (
    review_pkm_id VARCHAR(32) PRIMARY KEY,
    assignment_id VARCHAR(32) NOT NULL UNIQUE,
    proposal_id VARCHAR(32) NOT NULL,
    reviewer_id VARCHAR(32) NOT NULL,
    scores_json JSON NOT NULL,
    weighted_score_total DECIMAL(5,2) NOT NULL,
    strengths TEXT NOT NULL,
    weaknesses TEXT NOT NULL,
    improvement_notes TEXT NOT NULL,
    reviewer_recommendation ENUM(
        'Direkomendasikan',
        'Direkomendasikan dengan Revisi',
        'Perlu Perbaikan Substansial',
        'Tidak Direkomendasikan'
    ) NOT NULL,
    submitted_status ENUM('DRAFT', 'FINAL') NOT NULL DEFAULT 'DRAFT',
    revision_version INT NOT NULL DEFAULT 1,
    submitted_at DATETIME NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES review_assignments(assignment_id)
);

CREATE TABLE review_penelitian (
    review_penelitian_id VARCHAR(32) PRIMARY KEY,
    assignment_id VARCHAR(32) NOT NULL UNIQUE,
    proposal_id VARCHAR(32) NOT NULL,
    reviewer_id VARCHAR(32) NOT NULL,
    scores_json JSON NOT NULL,
    weighted_score_total DECIMAL(5,2) NOT NULL,
    special_assessment_json JSON NOT NULL,
    integrity_evaluation_json JSON NOT NULL,
    section_notes_json JSON NULL,
    critique_suggestions TEXT NOT NULL,
    reviewer_recommendation ENUM(
        'Direkomendasikan',
        'Direkomendasikan dengan Revisi',
        'Perlu Perbaikan Substansial',
        'Tidak Direkomendasikan'
    ) NOT NULL,
    submitted_status ENUM('DRAFT', 'FINAL') NOT NULL DEFAULT 'DRAFT',
    revision_version INT NOT NULL DEFAULT 1,
    submitted_at DATETIME NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES review_assignments(assignment_id)
);

CREATE TABLE final_decisions (
    decision_id VARCHAR(32) PRIMARY KEY,
    proposal_id VARCHAR(32) NOT NULL UNIQUE,
    proposal_code VARCHAR(40) NOT NULL,
    reviewer_1_score DECIMAL(5,2) NULL,
    reviewer_2_score DECIMAL(5,2) NULL,
    reviewer_3_score DECIMAL(5,2) NULL,
    score_difference DECIMAL(5,2) NOT NULL DEFAULT 0,
    discrepancy_flag TINYINT(1) NOT NULL DEFAULT 0,
    average_score DECIMAL(5,2) NOT NULL,
    auto_grade_category VARCHAR(60) NOT NULL,
    auto_recommendation VARCHAR(80) NOT NULL,
    final_admin_decision ENUM(
        'Direkomendasikan',
        'Direkomendasikan dengan Revisi',
        'Perlu Perbaikan Substansial',
        'Tidak Direkomendasikan'
    ) NOT NULL,
    budget_approved DECIMAL(15,2) NOT NULL DEFAULT 0,
    admin_decision_notes TEXT NULL,
    is_published_to_proposer TINYINT(1) NOT NULL DEFAULT 0,
    decided_by VARCHAR(32) NOT NULL,
    decided_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES proposals(proposal_id)
);
