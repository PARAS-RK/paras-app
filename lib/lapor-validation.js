export const LAPOR_LIMITS = {
  locationMin: 5,
  locationMax: 200,
  detailsMin: 20,
  detailsMax: 2000,
  maxFileBytes: 4 * 1024 * 1024,
};

// reports_media.file_type hanya mengizinkan 'image' | 'video'
export const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function validateFile(file) {
  if (!file || typeof file === 'string') return 'Lampirkan minimal satu bukti foto';
  if (!ALLOWED_IMAGE_TYPES[file.type]) return 'Format file harus JPG, PNG, atau WebP';
  if (file.size === 0) return 'File kosong, pilih file lain';
  if (file.size > LAPOR_LIMITS.maxFileBytes) {
    return `Ukuran file maksimal ${LAPOR_LIMITS.maxFileBytes / 1024 / 1024}MB`;
  }
  return null;
}

export function validateReportFields({ category, location, details, file }) {
  const errors = {};
  const loc = (location ?? '').trim();
  const det = (details ?? '').trim();

  if (!category) errors.category = 'Pilih kategori laporan';

  if (loc.length < LAPOR_LIMITS.locationMin) {
    errors.location = 'Tuliskan detail lokasi (jalan, RT/RW, atau patokan)';
  } else if (loc.length > LAPOR_LIMITS.locationMax) {
    errors.location = `Detail lokasi maksimal ${LAPOR_LIMITS.locationMax} karakter`;
  }

  if (det.length < LAPOR_LIMITS.detailsMin) {
    errors.details = `Uraikan laporan minimal ${LAPOR_LIMITS.detailsMin} karakter`;
  } else if (det.length > LAPOR_LIMITS.detailsMax) {
    errors.details = `Uraian maksimal ${LAPOR_LIMITS.detailsMax} karakter`;
  }

  const fileError = validateFile(file);
  if (fileError) errors.file = fileError;

  return errors;
}

export function detectImageType(bytes) {
  const ascii = (a, b) => String.fromCharCode(...bytes.slice(a, b));

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) {
    return 'image/png';
  }
  if (bytes.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') {
    return 'image/webp';
  }
  return null;
}
