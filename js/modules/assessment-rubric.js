/**
 * SIPROREVIEW - LP2M STPM Santa Ursula Ende
 * File: js/modules/assessment-rubric.js
 * Deskripsi: Definisi Instrumen & Rubrik Penilaian Akademik PKM (10 Aspek) dan Penelitian Dosen (16 Aspek)
 *            beserta Kalkulasi Nilai Akhir = Σ (Skor / Skor Maksimal × Bobot)
 */

export const RUBRIC_PKM_DEFAULT = [
  { id: 'PKM-01', no: 1, aspect: 'Relevansi dan urgensi permasalahan', indicator: 'Ketajaman analisis situasi mitra/masyarakat dan urgensi persoalan yang diangkat sesuai skema PKM.', weight: 10 },
  { id: 'PKM-02', no: 2, aspect: 'Ketepatan identifikasi masalah', indicator: 'Kesesuaian perumusan masalah prioritas dengan data lapangan dan kebutuhan sasaran.', weight: 10 },
  { id: 'PKM-03', no: 3, aspect: 'Kesesuaian tujuan dan sasaran kegiatan', indicator: 'Kejelasan keterukuran tujuan, target capaian, dan ketepatan khalayak sasaran.', weight: 10 },
  { id: 'PKM-04', no: 4, aspect: 'Kebaruan dan kreativitas gagasan', indicator: 'Inovasi solusi, orisinalitas ide kreatif mahasiswa, dan nilai tambah pendekatan.', weight: 15 },
  { id: 'PKM-05', no: 5, aspect: 'Ketepatan metode pelaksanaan', indicator: 'Sistematika tahapan pelaksanaan, partisipasi mitra/masyarakat, dan ketepatan pendekatan.', weight: 15 },
  { id: 'PKM-06', no: 6, aspect: 'Kelayakan program dan jadwal kegiatan', indicator: 'Realisme jadwal kerja, pembagian peran tim mahasiswa-dosen pendamping, dan ketercapaian.', weight: 8 },
  { id: 'PKM-07', no: 7, aspect: 'Kesesuaian anggaran dan RAB', indicator: 'Kewajaran rincian biaya, kepatuhan proporsi operasional vs administrasi sesuai pedoman PKM.', weight: 10 },
  { id: 'PKM-08', no: 8, aspect: 'Potensi keberlanjutan program', indicator: 'Peluang kemandirian mitra dan keberlanjutan dampak program pasca-pendanaan.', weight: 7 },
  { id: 'PKM-09', no: 9, aspect: 'Dampak dan manfaat bagi masyarakat', indicator: 'Kontribusi nyata terhadap pemberdayaan sosial, ekonomi, tata kelola desa, atau edukasi masyarakat.', weight: 10 },
  { id: 'PKM-10', no: 10, aspect: 'Kualitas penulisan dan sistematika proposal', indicator: 'Kepatuhan format administrasi, tata bahasa akademik, sitasi, dan kelengkapan lampiran.', weight: 5 }
];

export const RUBRIC_PENELITIAN_DEFAULT = [
  { id: 'PEN-01', no: 1, aspect: 'Relevansi dan urgensi penelitian', indicator: 'Ketajaman latar belakang fenomena sosial/pemerintahan dan urgensi pemecahan masalah.', weight: 7 },
  { id: 'PEN-02', no: 2, aspect: 'Orisinalitas dan kebaruan penelitian', indicator: 'Kebaruan gagasan (novelty) dan pembeda nyata dari riset terdahulu.', weight: 8 },
  { id: 'PEN-03', no: 3, aspect: 'Rumusan masalah dan pertanyaan penelitian', indicator: 'Kejelasan, fokus, dan ketajaman pertanyaan penelitian secara akademik.', weight: 6 },
  { id: 'PEN-04', no: 4, aspect: 'Tujuan dan manfaat penelitian', indicator: 'Kesesuaian tujuan spesifik dengan rumusan masalah serta manfaat teoretis dan praktis.', weight: 5 },
  { id: 'PEN-05', no: 5, aspect: 'Tinjauan pustaka dan landasan teori', indicator: 'Kemutakhiran referensi primer (jurnal bereputasi 5-10 tahun terakhir) dan kedalaman teori.', weight: 7 },
  { id: 'PEN-06', no: 6, aspect: 'State of the Art dan Research Gap', indicator: 'Pemetaan peta jalan riset terdahulu dan ketajaman celah penelitian (research gap).', weight: 8 },
  { id: 'PEN-07', no: 7, aspect: 'Kerangka konseptual atau kerangka berpikir', indicator: 'Koherensi alur logika antarkonsep/variabel dan proposisi/hipotesis penelitian.', weight: 6 },
  { id: 'PEN-08', no: 8, aspect: 'Ketepatan metode penelitian', indicator: 'Kesesuaian jenis/pendekatan riset (kualitatif, kuantitatif, mixed-methods, PAR) dengan masalah.', weight: 8 },
  { id: 'PEN-09', no: 9, aspect: 'Populasi, sampel, atau informan penelitian', indicator: 'Ketepatan teknik penentuan informan kunci/sampel dan lokasi penelitian.', weight: 5 },
  { id: 'PEN-10', no: 10, aspect: 'Teknik pengumpulan data', indicator: 'Validitas instrumen observasi, wawancara mendalam, FGD, kuesioner, atau dokumentasi.', weight: 6 },
  { id: 'PEN-11', no: 11, aspect: 'Teknik analisis data', indicator: 'Ketepatan prosedur analisis data, uji keabsahan/triangulasi data, atau pemodelan.', weight: 7 },
  { id: 'PEN-12', no: 12, aspect: 'Kesesuaian jadwal penelitian', indicator: 'Kelayakan tahapan waktu riset dari persiapan, lapangan, analisis hingga pelaporan.', weight: 4 },
  { id: 'PEN-13', no: 13, aspect: 'Kelayakan anggaran penelitian', indicator: 'Kewajaran RAB berbasis standar biaya masukan dan efisiensi alokasi komponen riset.', weight: 6 },
  { id: 'PEN-14', no: 14, aspect: 'Target luaran penelitian', indicator: 'Kejelasan luaran wajib (jurnal terindeks SINTA/Scopus, buku ajar, policy brief, HKI).', weight: 7 },
  { id: 'PEN-15', no: 15, aspect: 'Potensi publikasi ilmiah', indicator: 'Kelayakan substansi dan metodologi untuk menembus jurnal ilmiah terakreditasi nasional/internasional.', weight: 6 },
  { id: 'PEN-16', no: 16, aspect: 'Kesesuaian format dan sistematika penulisan', indicator: 'Kepatuhan penuh terhadap template LP2M STPM Santa Ursula Ende dan gaya selingkung sitasi.', weight: 4 }
];

export const GRADE_THRESHOLDS_DEFAULT = [
  { min: 85, max: 100, label: 'Sangat Layak', recommendation: 'Direkomendasikan', badge: 'success' },
  { min: 75, max: 84.99, label: 'Layak dengan Revisi Minor', recommendation: 'Direkomendasikan dengan Revisi', badge: 'primary' },
  { min: 60, max: 74.99, label: 'Perlu Revisi Substansial', recommendation: 'Perlu Perbaikan Substansial', badge: 'warning' },
  { min: 0, max: 59.99, label: 'Tidak Direkomendasikan', recommendation: 'Tidak Direkomendasikan', badge: 'danger' }
];

export function computeFinalScore(scoresById, rubricItems) {
  let sumWeighted = 0;
  let totalWeight = 0;
  rubricItems.forEach(item => {
    const score = Number(scoresById[item.id] || 0);
    const weight = Number(item.weight || 0);
    totalWeight += weight;
    sumWeighted += (score / 5) * weight;
  });
  return {
    weightedScore: Number(sumWeighted.toFixed(2)),
    totalWeight: Number(totalWeight.toFixed(2))
  };
}

export function interpretScoreCategory(score, thresholds = GRADE_THRESHOLDS_DEFAULT) {
  const val = Number(score);
  for (const t of thresholds) {
    if (val >= t.min && val <= t.max) return t;
  }
  return thresholds[thresholds.length - 1];
}
