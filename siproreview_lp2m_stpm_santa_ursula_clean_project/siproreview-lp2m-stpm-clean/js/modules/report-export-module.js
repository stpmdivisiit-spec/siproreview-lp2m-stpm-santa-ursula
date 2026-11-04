/**
 * Modul Rekapitulasi & Export 9 Jenis Laporan Akademik LP2M STPM Santa Ursula Ende
 */
window.SiproReportModule = {
  async saveFinalDecision(proposalId, decision, notes, publish) {
    return await window.SiproGasClient.callApi('setFinalDecision', {
      proposalId, decision, notes, publish
    });
  }
};
