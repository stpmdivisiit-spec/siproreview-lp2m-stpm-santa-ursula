/**
 * Modul Pengajuan Proposal PKM & Penelitian Dosen
 * Validasi PDF (Maks 10MB, Header %PDF-), Konversi Base64, & Upload ke Google Drive
 */
window.SiproProposalModule = {
  async submitProposal(proposalObj, pdfFile) {
    let pdfBase64 = '';
    if (pdfFile) {
      pdfBase64 = await window.SiproGasClient.fileToBase64(pdfFile);
    }
    return await window.SiproGasClient.callApi('submitProposal', {
      proposal: proposalObj,
      pdfBase64: pdfBase64
    });
  },
  async verifyProposal(proposalId, status, note) {
    return await window.SiproGasClient.callApi('verifyProposal', { proposalId, status, note });
  }
};
