/**
 * Modul PDF.js Viewer Terintegrasi
 * Mengambil Base64 PDF dari Google Drive via Backend berdasarkan File ID & Otorisasi Role
 */
window.SiproPdfViewerModule = {
  async fetchAuthorizedPdf(proposalId) {
    return await window.SiproGasClient.callApi('getProposalPdf', { proposalId });
  }
};
