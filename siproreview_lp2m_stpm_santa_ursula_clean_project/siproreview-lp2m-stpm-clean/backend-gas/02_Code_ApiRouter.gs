/**
 * ============================================================================
 * SIPROREVIEW – LP2M STPM SANTA URSULA ENDE
 * File: 02_Code_ApiRouter.gs
 * Deskripsi: Web App Entry Point (doGet & doPost) dengan Dukungan CORS-Safe JSON
 * ============================================================================
 */

function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const action = params.action || 'health';
  return routeApiRequest(action, params);
}

function doPost(e) {
  let body = {};
  if (e && e.postData && e.postData.contents) {
    body = JSON.parse(e.postData.contents);
  }
  const action = body.action || 'health';
  return routeApiRequest(action, body);
}

function routeApiRequest(action, payload) {
  try {
    let data = {};
    switch (action) {
      case 'health':
        data = {
          system: 'SIPROREVIEW – LP2M STPM Santa Ursula Ende',
          status: 'ONLINE',
          spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId(),
          timestamp: new Date().toISOString()
        };
        break;
      case 'login':
        data = handleUserLogin(payload.username, payload.password);
        break;
      case 'changePassword':
        data = handlePasswordChange(payload.token, payload.newPassword, payload.profileData);
        break;
      case 'syncAllData':
        data = handleSyncAllData(payload.token);
        break;
      case 'submitProposal':
        data = handleProposalSubmission(payload.token, payload.proposal, payload.pdfBase64);
        break;
      case 'getProposalPdf':
        data = handleGetProposalPdfBase64(payload.token, payload.proposalId);
        break;
      case 'verifyProposal':
        data = handleAdminVerifyProposal(payload.token, payload.proposalId, payload.status, payload.note);
        break;
      case 'assignReviewers':
        data = handleAdminAssignReviewers(payload.token, payload.proposalId, payload.reviewerIds, payload.deadline, payload.blindMode);
        break;
      case 'submitReview':
        data = handleReviewerSubmitScore(payload.token, payload.assignmentId, payload.reviewPayload, payload.isFinal);
        break;
      case 'unlockReview':
        data = handleAdminUnlockReview(payload.token, payload.assignmentId, payload.reason);
        break;
      case 'setFinalDecision':
        data = handleAdminFinalDecision(payload.token, payload.proposalId, payload.decision, payload.notes, payload.publish);
        break;
      default:
        throw new Error('Action API tidak dikenali: ' + action);
    }
    return createJsonResponse({ status: 'success', data: data });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.message });
  }
}

function createJsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
