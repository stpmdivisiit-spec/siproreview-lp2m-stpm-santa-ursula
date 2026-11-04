/**
 * SIPROREVIEW - LP2M STPM Santa Ursula Ende
 * File: Code.gs
 * Deskripsi: API Gateway Utama (doGet & doPost), Autentikasi RBAC, Pengelolaan Proposal, Review & Penilaian
 */

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'health';
  return handleRequest('GET', action, e.parameter || {});
}

function doPost(e) {
  let payload = {};
  if (e && e.postData && e.postData.contents) {
    payload = JSON.parse(e.postData.contents);
  }
  const action = payload.action || 'unknown';
  return handleRequest('POST', action, payload);
}

function handleRequest(method, action, data) {
  try {
    let result = {};
    switch (action) {
      case 'health':
        result = { ok: true, system: 'SIPROREVIEW LP2M STPM Santa Ursula Ende', version: '2.0.0' };
        break;
      case 'login':
        result = authenticateUser(data.username, data.password);
        break;
      case 'changePassword':
        result = changeUserPassword(data.token, data.oldPassword, data.newPassword, data.profileData);
        break;
      case 'submitProposal':
        result = submitProposalWithPdf(data.token, data.proposal, data.pdfBase64);
        break;
      case 'verifyProposal':
        result = verifyProposalByAdmin(data.token, data.proposalId, data.decision, data.note);
        break;
      case 'assignReviewers':
        result = assignProposalReviewers(data.token, data.proposalId, data.reviewerIds, data.deadline, data.blindMode);
        break;
      case 'submitReview':
        result = saveOrSubmitReview(data.token, data.assignmentId, data.reviewData, data.isFinal);
        break;
      case 'unlockReview':
        result = unlockSubmittedReview(data.token, data.assignmentId, data.reason);
        break;
      case 'setFinalDecision':
        result = recordFinalAdminDecision(data.token, data.proposalId, data.decision, data.notes, data.publish);
        break;
      case 'getPdfBase64':
        result = getAuthorizedProposalPdf(data.token, data.proposalId);
        break;
      default:
        throw new Error('Action tidak dikenali: ' + action);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Validasi Konflik Kepentingan & Perhitungan Skor Otomatis
 * Nilai Akhir = Σ (Skor / Skor Maksimal × Bobot)
 */
function calculateWeightedScore(scoresMap, rubricList) {
  let totalWeight = 0;
  let finalScore = 0;
  rubricList.forEach(item => {
    const weight = Number(item.weight_percent) || 0;
    const maxScore = Number(item.max_score) || 5;
    const rawScore = Number(scoresMap[item.aspect_id]) || 0;
    if (rawScore < 1 || rawScore > maxScore) {
      throw new Error('Skor indikator ' + item.aspect_name + ' harus berada pada rentang 1-' + maxScore);
    }
    totalWeight += weight;
    finalScore += (rawScore / maxScore) * weight;
  });
  if (Math.round(totalWeight) !== 100) {
    throw new Error('Total bobot instrumen harus 100% (saat ini: ' + totalWeight + '%)');
  }
  return Number(finalScore.toFixed(2));
}
