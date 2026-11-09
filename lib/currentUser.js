/** Single source of truth for the signed-in user's identity and region. */
export const currentUser = {
    fullName: 'Sari Wulandari',
    salutation: 'Ibu',
    initials: 'SW',
    email: 'sari.wulandari@gmail.com',
    phone: '0812-3456-7890',
    rt: '04',
    rw: '05',
    kelurahan: 'Kebayoran Baru',
    kecamatan: 'Kebayoran Baru',
    kota: 'Jakarta Selatan',
    pkkStatus: 'verified',
    pkkRole: 'Anggota PKK',
    pkkVerifiedAt: '12 Oktober 2024',
    joinedDate: 'September 2024',
};
/** "Ibu Sari Wulandari" - formal display name used in headers and documents. */
export const displayName = `${currentUser.salutation} ${currentUser.fullName}`;
/** "Sari" - short name for compact lists like rankings. */
export const shortName = currentUser.fullName.split(' ')[0];
/** "Kel. Kebayoran Baru" - primary region label. */
export const areaLabel = `Kel. ${currentUser.kelurahan}`;
/** "Kel. Kebayoran Baru, Jakarta Selatan" - region label with city. */
export const areaFull = `${areaLabel}, ${currentUser.kota}`;
/** "RT 04 / RW 05, Kel. Kebayoran Baru, Kec. Kebayoran Baru, Jakarta Selatan" */
export const addressFull = `RT ${currentUser.rt} / RW ${currentUser.rw}, ${areaLabel}, Kec. ${currentUser.kecamatan}, ${currentUser.kota}`;
