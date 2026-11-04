/**
 * Modul Distribusi Reviewer, Pencegahan Konflik Kepentingan, Blind Review & Lock
 */
window.SiproReviewModule = {
  async assignReviewers(proposalId, reviewerIds, deadline, blindMode) {
    return await window.SiproGasClient.callApi('assignReviewers', {
      proposalId, reviewerIds, deadline, blindMode
    });
  },
  async submitReview(assignmentId, reviewPayload, isFinal) {
    return await window.SiproGasClient.callApi('submitReview', {
      assignmentId, reviewPayload, isFinal
    });
  },
  async unlockReview(assignmentId, reason) {
    return await window.SiproGasClient.callApi('unlockReview', { assignmentId, reason });
  }
};
