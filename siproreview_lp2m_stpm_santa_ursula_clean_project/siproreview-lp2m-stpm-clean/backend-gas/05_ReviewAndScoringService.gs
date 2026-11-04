/**
 * ============================================================================
 * SIPROREVIEW – LP2M STPM SANTA URSULA ENDE
 * File: 05_ReviewAndScoringService.gs
 * Deskripsi: Verifikasi Admin, Distribusi Reviewer, Kalkulasi Skor & Keputusan Akhir
 * ============================================================================
 */

function handleAdminVerifyProposal(token, proposalId, statusDecision, note) {
  const admin = requireAuthSession(token, 'ADMIN');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PROPOSALS');
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === proposalId) {
      sheet.getRange(i + 1, 22).setValue(statusDecision); // VERIFIED atau REVISION_REQUIRED
      sheet.getRange(i + 1, 23).setValue(note || '');
      sheet.getRange(i + 1, 24).setValue(admin.user_id);
      sheet.getRange(i + 1, 25).setValue(new Date().toISOString());
      appendActivityLog(admin.user_id, admin.username, 'ADMIN', 'VERIFY_PROPOSAL', 'PROPOSALS', rows[i][1], 'Set status verifikasi: ' + statusDecision);
      return { proposalId: proposalId, status: statusDecision };
    }
  }
  throw new Error('Proposal tidak ditemukan.');
}

function handleAdminAssignReviewers(token, proposalId, reviewerUserIds, deadline, blindMode) {
  const admin = requireAuthSession(token, 'ADMIN');
  if (!Array.isArray(reviewerUserIds) || reviewerUserIds.length < 2) {
    throw new Error('Minimal 2 reviewer wajib dipilih untuk setiap proposal.');
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const propSheet = ss.getSheetByName('PROPOSALS');
  const propRows = propSheet.getDataRange().getValues();
  const assignSheet = ss.getSheetByName('REVIEW_ASSIGNMENTS');

  let prop = null;
  let propIdx = -1;
  for (let i = 1; i < propRows.length; i++) {
    if (propRows[i][0] === proposalId) {
      prop = propRows[i];
      propIdx = i + 1;
      break;
    }
  }
  if (!prop) throw new Error('Proposal tidak ditemukan.');

  reviewerUserIds.forEach((revUserId, idx) => {
    if (revUserId === prop[6]) {
      throw new Error('Konflik Kepentingan: Pengusul tidak boleh menilai proposal miliknya sendiri.');
    }
    assignSheet.appendRow([
      'ASG-' + new Date().getTime() + '-' + (idx + 1),
      proposalId, prop[1], prop[3],
      'REV-' + revUserId, revUserId, idx + 1,
      admin.user_id, 'MANUAL', Boolean(blindMode),
      new Date().toISOString(), deadline, 'ASSIGNED',
      false, '', '', ''
    ]);
  });

  propSheet.getRange(propIdx, 22).setValue('IN_REVIEW');
  appendActivityLog(admin.user_id, admin.username, 'ADMIN', 'ASSIGN_REVIEWERS', 'PROPOSALS', prop[1], 'Menugaskan ' + reviewerUserIds.length + ' reviewer.');
  return { assigned: reviewerUserIds.length };
}

function handleReviewerSubmitScore(token, assignmentId, reviewPayload, isFinal) {
  const user = requireAuthSession(token);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const assignSheet = ss.getSheetByName('REVIEW_ASSIGNMENTS');
  const assigns = assignSheet.getDataRange().getValues();

  let asgRowIdx = -1;
  let asg = null;
  for (let i = 1; i < assigns.length; i++) {
    if (assigns[i][0] === assignmentId) {
      asgRowIdx = i + 1;
      asg = assigns[i];
      break;
    }
  }
  if (!asg) throw new Error('Data penugasan review tidak ditemukan.');
  if (Boolean(asg[13]) === true) {
    throw new Error('Hasil review ini telah terkunci. Hubungi Admin LP2M jika memerlukan pembukaan kunci revisi.');
  }

  const isPkm = asg[3] === 'PKM';
  const rubricSheet = ss.getSheetByName(isPkm ? 'RUBRIC_PKM' : 'RUBRIC_PENELITIAN');
  const rubricRows = rubricSheet.getDataRange().getValues();

  let weightedTotal = 0;
  for (let r = 1; r < rubricRows.length; r++) {
    const aspectId = rubricRows[r][0];
    const weight = Number(rubricRows[r][4]) || 0;
    const maxScore = Number(rubricRows[r][6]) || 5;
    const givenScore = Number(reviewPayload.scores[aspectId] || 0);
    weightedTotal += (givenScore / maxScore) * weight;
  }
  weightedTotal = Number(weightedTotal.toFixed(2));

  const targetReviewSheet = ss.getSheetByName(isPkm ? 'REVIEW_PKM' : 'REVIEW_PENELITIAN');
  const now = new Date().toISOString();

  if (isPkm) {
    targetReviewSheet.appendRow([
      'RPKM-' + new Date().getTime(), assignmentId, asg[1], asg[4],
      JSON.stringify(reviewPayload.scores), weightedTotal,
      reviewPayload.strengths || '', reviewPayload.weaknesses || '',
      reviewPayload.improvement_notes || '', reviewPayload.recommendation || '',
      isFinal ? 'FINAL' : 'DRAFT', 1, now, now
    ]);
  } else {
    targetReviewSheet.appendRow([
      'RPEN-' + new Date().getTime(), assignmentId, asg[1], asg[4],
      JSON.stringify(reviewPayload.scores), weightedTotal,
      JSON.stringify(reviewPayload.special_assessment || {}),
      JSON.stringify(reviewPayload.integrity_evaluation || {}),
      JSON.stringify(reviewPayload.aspect_comments || {}),
      reviewPayload.improvement_notes || '', reviewPayload.recommendation || '',
      isFinal ? 'FINAL' : 'DRAFT', 1, now, now
    ]);
  }

  assignSheet.getRange(asgRowIdx, 13).setValue(isFinal ? 'COMPLETED' : 'DRAFT');
  assignSheet.getRange(asgRowIdx, 14).setValue(Boolean(isFinal));
  if (isFinal) assignSheet.getRange(asgRowIdx, 17).setValue(now);

  appendActivityLog(user.user_id, user.username, user.role, isFinal ? 'SUBMIT_REVIEW_FINAL' : 'SAVE_REVIEW_DRAFT', 'REVIEW_ASSIGNMENTS', assignmentId, 'Skor terbobot: ' + weightedTotal);
  return { assignmentId: assignmentId, weightedScore: weightedTotal, locked: Boolean(isFinal) };
}

function handleAdminUnlockReview(token, assignmentId, reason) {
  const admin = requireAuthSession(token, 'ADMIN');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const assignSheet = ss.getSheetByName('REVIEW_ASSIGNMENTS');
  const rows = assignSheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === assignmentId) {
      assignSheet.getRange(i + 1, 13).setValue('DRAFT');
      assignSheet.getRange(i + 1, 14).setValue(false);
      assignSheet.getRange(i + 1, 15).setValue(admin.user_id);
      assignSheet.getRange(i + 1, 16).setValue(reason || 'Dibuka kembali oleh Admin LP2M untuk revisi penilaian');
      appendActivityLog(admin.user_id, admin.username, 'ADMIN', 'UNLOCK_REVIEW', 'REVIEW_ASSIGNMENTS', assignmentId, 'Membuka kunci review: ' + (reason || 'Revisi'));
      return { unlocked: true };
    }
  }
  throw new Error('Penugasan review tidak ditemukan.');
}

function handleAdminFinalDecision(token, proposalId, decision, notes, publish) {
  const admin = requireAuthSession(token, 'ADMIN');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const decSheet = ss.getSheetByName('FINAL_DECISIONS');
  const propSheet = ss.getSheetByName('PROPOSALS');
  const props = propSheet.getDataRange().getValues();

  for (let i = 1; i < props.length; i++) {
    if (props[i][0] === proposalId) {
      const nextStatus = decision === 'Direkomendasikan' ? 'ACCEPTED' : (decision === 'Tidak Direkomendasikan' ? 'REJECTED' : 'REVISION_REQUIRED');
      propSheet.getRange(i + 1, 22).setValue(nextStatus);
      decSheet.appendRow([
        'DEC-' + new Date().getTime(), proposalId, props[i][1],
        0, 0, 0, 0, false, 0, decision, decision,
        decision, props[i][15], notes || '', Boolean(publish),
        admin.user_id, new Date().toISOString()
      ]);
      appendActivityLog(admin.user_id, admin.username, 'ADMIN', 'FINAL_DECISION', 'PROPOSALS', props[i][1], 'Keputusan akhir: ' + decision);
      return { decided: true, status: nextStatus };
    }
  }
  throw new Error('Proposal tidak ditemukan.');
}

function handleSyncAllData(token) {
  const user = requireAuthSession(token);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    role: user.role,
    spreadsheetName: ss.getName(),
    syncedAt: new Date().toISOString()
  };
}
