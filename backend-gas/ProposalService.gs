/**
 * SIPROREVIEW - LP2M STPM Santa Ursula Ende
 * File: ProposalService.gs
 * Deskripsi: Pengajuan Proposal, Validasi PDF, Penyimpanan ke Google Drive Terstandarisasi, & Akses File Terotorisasi
 */

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

function submitProposalWithPdf(token, proposal, pdfBase64) {
  const session = verifySessionToken(token);
  if (session.mustChangePassword || !session.profileCompleted) {
    throw new Error('Wajib mengganti password sementara dan melengkapi profil sebelum mengajukan proposal.');
  }
  if (!proposal.title || !proposal.proposal_type || !proposal.originality_declared) {
    throw new Error('Data wajib proposal dan pernyataan orisinalitas harus dilengkapi.');
  }
  if (!pdfBase64) {
    throw new Error('Dokumen proposal dalam format PDF wajib diunggah.');
  }

  const decodedBytes = Utilities.base64Decode(pdfBase64);
  if (decodedBytes.length > MAX_PDF_BYTES) {
    throw new Error('Ukuran file PDF melebihi batas maksimal 10 MB.');
  }

  // Validasi header magic bytes %PDF-
  const headerStr = Utilities.newBlob(decodedBytes.slice(0, 5)).getDataAsString();
  if (headerStr !== '%PDF-') {
    throw new Error('File yang diunggah bukan dokumen PDF yang valid.');
  }

  const year = String(proposal.submission_year || new Date().getFullYear());
  const prefix = proposal.proposal_type === 'PKM' ? 'PKM' : 'PENELITIAN';
  const proposalCode = prefix + '-' + year + '-' + Math.floor(1000 + Math.random() * 9000);
  const standardizedName = prefix + '_' + year + '_' + session.nidn + '_' + proposalCode + '.pdf';

  const folders = initializeDriveFolders();
  const targetFolderId = proposal.proposal_type === 'PKM'
    ? (folders.pkmByYear[year] || folders.rootId)
    : (folders.penelitianByYear[year] || folders.rootId);

  const folder = DriveApp.getFolderById(targetFolderId);
  const blob = Utilities.newBlob(decodedBytes, 'application/pdf', standardizedName);
  const driveFile = folder.createFile(blob);
  driveFile.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PROPOSALS');
  const proposalId = 'PROP-' + new Date().getTime();
  const nowIso = new Date().toISOString();

  sheet.appendRow([
    proposalId, proposalCode, proposal.period_id || 'PER-2026-1',
    proposal.proposal_type, proposal.scheme_category || 'Reguler Internal LP2M',
    proposal.title, session.userId, session.nidn, session.fullName,
    proposal.prodi || session.prodi, JSON.stringify(proposal.team_members || []),
    year, proposal.focus_area || '', proposal.abstract_summary || '',
    proposal.keywords || '', Number(proposal.budget_requested) || 0,
    driveFile.getId(), standardizedName, decodedBytes.length,
    1, true, 'SUBMITTED', '', '', '', nowIso, nowIso
  ]);

  logSystemActivity(session.userId, session.username, session.role, 'SUBMIT_PROPOSAL', 'PROPOSALS', proposalId, 'Mengajukan proposal ' + proposalCode + ' (' + standardizedName + ')');

  return {
    proposalId: proposalId,
    proposalCode: proposalCode,
    standardizedFilename: standardizedName,
    driveFileId: driveFile.getId(),
    status: 'SUBMITTED'
  };
}

/**
 * Mengambil dokumen PDF dari Google Drive berdasarkan Google Drive File ID
 * Hanya dapat diakses oleh: (1) Admin LP2M, (2) Pengusul pemilik proposal, atau (3) Reviewer yang ditugaskan
 */
function getAuthorizedProposalPdf(token, proposalId) {
  const session = verifySessionToken(token);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const propSheet = ss.getSheetByName('PROPOSALS');
  const props = propSheet.getDataRange().getValues();

  let targetProposal = null;
  for (let i = 1; i < props.length; i++) {
    if (props[i][0] === proposalId) {
      targetProposal = props[i];
      break;
    }
  }
  if (!targetProposal) throw new Error('Proposal tidak ditemukan.');

  const ownerUserId = targetProposal[6];
  const driveFileId = targetProposal[16];

  let isAuthorized = (session.role === 'ADMIN') || (session.userId === ownerUserId);
  if (!isAuthorized) {
    const assignSheet = ss.getSheetByName('REVIEW_ASSIGNMENTS');
    const assigns = assignSheet.getDataRange().getValues();
    for (let j = 1; j < assigns.length; j++) {
      if (assigns[j][1] === proposalId && assigns[j][5] === session.userId) {
        isAuthorized = true;
        break;
      }
    }
  }
  if (!isAuthorized) {
    logSystemActivity(session.userId, session.username, session.role, 'UNAUTHORIZED_PDF_ACCESS', 'PROPOSALS', proposalId, 'Percobaan akses PDF tanpa otorisasi ditolak.');
    throw new Error('Akses ditolak: Anda tidak memiliki otorisasi untuk membaca dokumen proposal ini.');
  }

  const file = DriveApp.getFileById(driveFileId);
  const base64Pdf = Utilities.base64Encode(file.getBlob().getBytes());
  return {
    proposalId: proposalId,
    fileName: targetProposal[17],
    base64Pdf: base64Pdf
  };
}
