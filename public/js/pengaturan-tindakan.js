/**
 * pengaturan-tindakan.js
 * Master data tindakan (Cek Tensi, Cek Gula, dll)
 * Phase 1: Tampilan dasar dulu, CRUD lengkap di Phase 3
 */

window.AppPengaturanTindakan = {
    render: function() {
        return '<div class="page-enter max-w-3xl">'
            + '<h2 class="text-xl font-bold text-gray-800 mb-1">Master Tindakan</h2>'
            + '<p class="text-sm text-gray-500 mb-6">Daftar tindakan klinik & apotek beserta harga dan modal</p>'
            + '<div class="bg-white rounded-xl border border-gray-200 p-6">'
            + '  <p class="text-sm text-gray-400">Module ini akan diisi di Phase 3 (setelah module Obat & Transaksi selesai).</p>'
            + '  <p class="text-sm text-gray-400 mt-1">Data default sudah tersimpan di Firestore saat setup.</p>'
            + '</div>'
            + '</div>';
    },
    init: function() {}
};
