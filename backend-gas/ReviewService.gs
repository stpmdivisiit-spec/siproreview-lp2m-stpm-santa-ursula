/**
 * SIPROREVIEW - LP2M STPM Santa Ursula Ende
 * File: ReviewService.gs
 * Deskripsi: Distribusi Reviewer (Anti-Conflict of Interest), Blind Review, Penguncian Skor & Rekapitulasi Otomatis
 */

function assignProposalReviewers(token, proposalId, reviewerIds, deadline, blindMode) {
  const session = verifySessionToken(token, 'ADMIN');
  if (!Array.isArray(reviewerIds) || reviewerIds.length < 2) {
    throw new Error('Setiap proposal wajib ditugaskan kepada minimal 2 reviewer.');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const propRows = ss.getSheetByName('PROPOSALS').getDataRange().getValues();
  const revRows = ss.getSheetByName('REVIEWERS').getDataRange().getValues();
  const assignSheet = ss.getSheetByName('REVIEW_ASSIGNMENTS');

  let propRowIndex = -1;
  let proposal = null;
  for (let i = 1; i < propRows.length; i++) {
    if (propRows[i][0] === proposalId) {
      propRowIndex = i + 1;
      proposal = propRows[i];
      break;
    }
  }
  if (!proposal) throw new Error('Proposal tidak ditemukan.');

  const proposerUserId = proposal[6];
  const proposerNidn = String(proposal[7]);
  const teamJson = String(proposal[10] || '[]');

  reviewerIds.forEach((revId, idx) => {
    let revRecord = null;
    for (let r = 1; r < revRows.length; r++) {
      if (revRows[r][0] === revId) {
        revRecord = revRows[r];
        break;
      }
    }
    if (!revRecord) throw new Error('Reviewer ' + revId + ' tidak ditemukan.');

    // Pencegahan Conflict of Interest (Reviewer menilai proposal sendiri atau menjadi anggota tim)
    if (revRecord[1] === proposerUserId || String(revRecord[2]) === proposerNidn || teamJson.indexOf(String(revRecord[2])) !== -1) {
      throw new Error('Konflik Kepentingan Terdeteksi: Reviewer ' + revRecord[3] + ' adalah pengusul atau anggota tim proposal ini.');
    }

    const assignmentId = 'ASG-' + new Date().getTime() + '-' + (idx + 1);
    assignSheet.appendRow([
      assignmentId, proposalId, proposal[1], proposal[3],
      revId, revRecord[1], idx + 1, session.userId,
      'MANUAL', Boolean(blindMode), new Date().toISOString(),
      deadline, 'ASSIGNED', false, '', '', ''
    ]);
  });

  ss.getSheetByName('PROPOSALS').getRange(propRowIndex, 22).setValue('ASSIGNED');
  logSystemActivity(session.userId, session.username, session.role, 'ASSIGN_REVIEWERS', 'PROPOSALS', proposalId, 'Menugaskan ' + reviewerIds.length + ' reviewer pada proposal ' + proposal[1]);
  return { proposalId: proposalId, assignedCount: reviewerIds.length, status: 'ASSIGNED' };
}
