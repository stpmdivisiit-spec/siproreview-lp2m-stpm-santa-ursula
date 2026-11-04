/**
 * Modul Kalkulasi Skor Otomatis Rubrik PKM (10 Aspek) & Penelitian Dosen (16 Aspek)
 * Rumus: Nilai Akhir = Σ (Skor / 5 × Bobot)
 */
window.SiproScoringModule = {
  calculateWeightedScore(scoresMap, rubricArray) {
    let totalScore = 0;
    let totalWeight = 0;
    rubricArray.forEach(item => {
      const score = Number(scoresMap[item.id] || 0);
      const weight = Number(item.weight || 0);
      totalWeight += weight;
      totalScore += (score / 5) * weight;
    });
    return {
      weightedScore: Number(totalScore.toFixed(2)),
      totalWeight: Number(totalWeight.toFixed(2))
    };
  }
};
