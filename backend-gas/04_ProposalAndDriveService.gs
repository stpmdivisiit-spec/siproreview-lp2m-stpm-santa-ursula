/**
 * ============================================================================
 * SIPROREVIEW – LP2M STPM SANTA URSULA ENDE
 * File: 04_ProposalAndDriveService.gs
 * Deskripsi: Upload PDF Proposal ke Google Drive Terstandarisasi & Proteksi File ID
 * ============================================================================
 */

const MAX_PDF_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

function handleProposalSubmission(token, proposal, pdfBase64) {
  const user = requireAuthSession(token);
  if (user.must_change_password || !user.profile_completed) {
    throw new Error('Anda wajib mengganti password sementara dan melengkapi profil sebelum mengajukan proposal.');
  }
  if (!proposal || !proposal.title || !proposal.proposal_type) {
    throw new Error('Judul dan jenis proposal wajib diisi.');
  }
  if (!pdfBase64) {
    throw new Error('File PDF proposal wajib diunggah.');
  }

  const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
  const bytes = Utilities.base64Decode(cleanBase64);
  if (bytes.length > MAX_PDF_UPLOAD_BYTES) {
    throw new Error('Ukuran file PDF melebihi batas maksimal 10 MB.');
  }

  const year = String(proposal.submission_year || '2026');
  const typePrefix = proposal.proposal_type === 'PKM' ? 'PKM' : 'PENELITIAN';
  const randomSeq = Math.floor(100 + Math.random() * 900);
  const proposalCode = typePrefix + '-' + year + '-' + randomSeq;
  const standardizedFilename = typePrefix + '_' + year + '_' + user.nidn + '_' + proposalCode + '.pdf';

  const foldersJson = PropertiesService.getScriptProperties().getProperty('SIPRO_FOLDERS');
  const folders = foldersJson ? JSON.parse(foldersJson) : createSiproDriveFolderTree();
  const targetFolderId = typePrefix === 'PKM'
    ? (year === '2027' ? folders.pkm2027Id : folders.pkm2026Id)
    : (year === '2027' ? folders.pen2027Id : folders.pen2026Id);

  const folder = DriveApp.getFolderById(targetFolderId);
  const blob = Utilities.newBlob(bytes, 'application/pdf', standardizedFilename);
  const driveFile = folder.createFile(blob);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const propSheet = ss.getSheetByName('PROPOSALS');
  const proposalId = 'PROP-' + new Date().getTime();
  const now = new Date().toISOString();

  propSheet.appendRow([
    proposalId, proposalCode, proposal.period_id || 'PER-2026-GANJIL',
    typePrefix, proposal.scheme_category || 'Reguler LP2M',
    proposal.title, user.user_id, user.nidn, user.full_name,
    user.prodi, JSON.stringify(proposal.team_members || []),
    year, proposal.focus_area || '', proposal.abstract_summary || '',
    proposal.keywords || '', Number(proposal.budget_requested) || 0,
    driveFile.getId(), standardizedFilename, bytes.length,
    1, true, 'SUBMITTED', '', '', '', now, now
  ]);

  appendActivityLog(user.user_id, user.username, user.role, 'SUBMIT_PROPOSAL', 'PROPOSALS', proposalCode, 'Mengunggah proposal ' + standardizedFilename + ' ke Google Drive.');
  return {
    proposal_id: proposalId,
    proposal_code: proposalCode,
    standardized_filename: standardizedFilename,
    drive_file_id: driveFile.getId(),
    status: 'SUBMITTED'
  };
}

function handleGetProposalPdfBase64(token, proposalId) {
  const user = requireAuthSession(token);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rows = ss.getSheetByName('PROPOSALS').getDataRange().getValues();

  let propRow = null;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === proposalId || rows[i][1] === proposalId) {
      propRow = rows[i];
      break;
    }
  }
  if (!propRow) throw new Error('Proposal tidak ditemukan.');

  const ownerUserId = propRow[6];
  const driveFileId = propRow[16];
  let allowed = (user.role === 'ADMIN') || (user.user_id === ownerUserId);

  if (!allowed) {
    const assigns = ss.getSheetByName('REVIEW_ASSIGNMENTS').getDataRange().getValues();
    for (let j = 1; j < assigns.length; j++) {
      if (assigns[j][1] === propRow[0] && assigns[j][5] === user.user_id) {
        allowed = true;
        break;
      }
    }
  }
  if (!allowed) {
    appendActivityLog(user.user_id, user.username, user.role, 'DENIED_PDF_ACCESS', 'PROPOSALS', propRow[1], 'Akses PDF ditolak karena tidak memiliki otorisasi.');
    throw new Error('Akses ditolak: Anda tidak ditugaskan untuk mengakses dokumen PDF proposal ini.');
  }

  const file = DriveApp.getFileById(driveFileId);
  return {
    proposal_id: propRow[0],
    standardized_filename: propRow[17],
    pdfBase64: Utilities.base64Encode(file.getBlob().getBytes())
  };
}
