/**
 * pengaturan-pembagian.js
 * Halaman pengaturan pembagian hasil — INI INTI PAYROLL
 * Semua nilai bisa di-edit dan langsung disimpan ke Firestore
 */

window.AppPengaturanPembagian = {

    data: null, // cache data pembagian

    render: function() {
        var html = '';
        html += '<div class="page-enter max-w-3xl">';
        html += '  <h2 class="text-xl font-bold text-gray-800 mb-1">Pengaturan Pembagian Hasil</h2>';
        html += '  <p class="text-sm text-gray-500 mb-6">Konfigurasi pembagian pendapatan untuk payroll bulanan</p>';
        html += '  <div id="pembagian-content"><div class="flex justify-center py-10"><div class="spinner"></div></div></div>';
        html += '</div>';
        return html;
    },

    init: function() {
        // Load data dari Firestore
        db.collection('pengaturanPembagian').doc('global').get()
            .then(function(doc) {
                if (doc.exists) {
                    AppPengaturanPembagian.data = doc.data();
                    AppPengaturanPembagian.renderForm();
                } else {
                    Utils.toast('Data pembagian belum ada. Jalankan setup ulang.', 'error');
                }
            })
            .catch(function(err) {
                Utils.toast('Gagal memuat: ' + err.message, 'error');
            });
    },

    renderForm: function() {
        var d = AppPengaturanPembagian.data;
        var html = '';

        // ===== RESEP KLINIK =====
        html += '<div class="bg-white rounded-xl border border-gray-200 p-5 mb-4">';
        html += '  <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2"><i data-lucide="file-text" class="w-4 h-4 text-blue-500"></i> Resep Klinik</h3>';
        html += '  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">';
        html += AppPengaturanPembagian.inputField('Nilai Resep', 'resep_nilaiResep', d.resep.nilaiResep, 'Rp');
        html += AppPengaturanPembagian.inputField('Jasa Medis (JM)', 'resep_jm', d.resep.jm, 'Rp');
        html += AppPengaturanPembagian.inputField('Jasa Dokter (JD)', 'resep_jd', d.resep.jd, 'Rp');
        html += AppPengaturanPembagian.inputField('Karyawan Klinik', 'resep_karyKlinik', d.resep.karyKlinik, 'Rp');
        html += AppPengaturanPembagian.inputField('Karyawan Apotek', 'resep_karyApotek', d.resep.karyApotek, 'Rp');
        html += AppPengaturanPembagian.inputField('PSA', 'resep_psa', d.resep.psa, 'Rp');
        html += '  </div>';
        html += '  <p class="text-xs text-gray-400 mt-2">Laba Apotek = Sisa dari Nilai Resep setelah semua potongan</p>';
        html += '</div>';

        // ===== RESEP LUAR =====
        html += '<div class="bg-white rounded-xl border border-gray-200 p-5 mb-4">';
        html += '  <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2"><i data-lucide="file-plus" class="w-4 h-4 text-green-500"></i> Resep Luar</h3>';
        html += '  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">';
        html += AppPengaturanPembagian.inputField('Nilai Resep', 'resepLuar_nilaiResep', d.resepLuar.nilaiResep, 'Rp');
        html += AppPengaturanPembagian.inputField('Dokter Pemberi Resep', 'resepLuar_dokter', d.resepLuar.dokter, 'Rp');
        html += AppPengaturanPembagian.inputField('PSA', 'resepLuar_psa', d.resepLuar.psa, 'Rp');
        html += '  </div>';
        html += '  <p class="text-xs text-gray-400 mt-2">Laba Apotek = Sisa</p>';
        html += '</div>';

        // ===== TINDAKAN KLINIK =====
        html += '<div class="bg-white rounded-xl border border-gray-200 p-5 mb-4">';
        html += '  <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2"><i data-lucide="stethoscope" class="w-4 h-4 text-purple-500"></i> Tindakan Klinik</h3>';
        html += '  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">';
        html += AppPengaturanPembagian.inputField('Dokter', 'tindakanKlinik_dokter', d.tindakanKlinik.dokter, '%');
        html += AppPengaturanPembagian.inputField('Karyawan Klinik', 'tindakanKlinik_karyKlinik', d.tindakanKlinik.karyKlinik, '%');
        html += '  </div>';
        html += '</div>';

        // ===== TINDAKAN APOTEK =====
        html += '<div class="bg-white rounded-xl border border-gray-200 p-5 mb-4">';
        html += '  <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2"><i data-lucide="syringe" class="w-4 h-4 text-teal-500"></i> Tindakan Apotek</h3>';
        html += '  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">';
        html += AppPengaturanPembagian.inputField('Karyawan Apotek', 'tindakanApotek_karyApotek', d.tindakanApotek.karyApotek, '%');
        html += AppPengaturanPembagian.inputField('PSA', 'tindakanApotek_psa', d.tindakanApotek.psa, '%');
        html += '  </div>';
        html += '</div>';

        // ===== SLOT KARYAWAN KLINIK =====
        html += '<div class="bg-white rounded-xl border border-gray-200 p-5 mb-4">';
        html += '  <h3 class="font-semibold text-gray-800 mb-2 flex items-center gap-2"><i data-lucide="users" class="w-4 h-4 text-indigo-500"></i> Slot Pembagian Karyawan Klinik</h3>';
        html += '  <p class="text-xs text-gray-400 mb-4">Persentase bagian masing-masing karyawan klinik (dari total pool Karyawan Klinik)</p>';
        html += '  <div id="slots-klinik" class="space-y-2">';
        d.slotKaryawanKlinik.forEach(function(slot, i) {
            html += AppPengaturanPembagian.renderSlot('klinik', i, slot);
        });
        html += '  </div>';
        html += '  <button onclick="AppPengaturanPembagian.addSlot(\'klinik\')" class="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"><i data-lucide="plus-circle" class="w-4 h-4"></i> Tambah Slot</button>';
        html += '</div>';

        // ===== SLOT KARYAWAN APOTEK =====
        html += '<div class="bg-white rounded-xl border border-gray-200 p-5 mb-4">';
        html += '  <h3 class="font-semibold text-gray-800 mb-2 flex items-center gap-2"><i data-lucide="user-cog" class="w-4 h-4 text-amber-500"></i> Slot Pembagian Karyawan Apotek</h3>';
        html += '  <p class="text-xs text-gray-400 mb-4">Persentase bagian masing-masing karyawan apotek (dari total pool Karyawan Apotek). Juga dipakai untuk Tunjangan Omzet.</p>';
        html += '  <div id="slots-apotek" class="space-y-2">';
        d.slotKaryawanApotek.forEach(function(slot, i) {
            html += AppPengaturanPembagian.renderSlot('apotek', i, slot);
        });
        html += '  </div>';
        html += '  <button onclick="AppPengaturanPembagian.addSlot(\'apotek\')" class="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"><i data-lucide="plus-circle" class="w-4 h-4"></i> Tambah Slot</button>';
        html += '</div>';

        // ===== TUNJANGAN OMZET =====
        html += '<div class="bg-white rounded-xl border border-gray-200 p-5 mb-4">';
        html += '  <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2"><i data-lucide="trending-up" class="w-4 h-4 text-emerald-500"></i> Tunjangan Omzet</h3>';
        html += '  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">';
        html += AppPengaturanPembagian.inputField('Persen dari Laba Bersih Obat', 'tunjanganOmzet_persen', d.tunjanganOmzet.persen, '%');
        html += '  </div>';
        html += '  <p class="text-xs text-gray-400 mt-2">Dibagi seperti slot Karyawan Apotek + PSA sesuai ratio Tindakan Apotek</p>';
        html += '</div>';

        // ===== TRANSPORT =====
        html += '<div class="bg-white rounded-xl border border-gray-200 p-5 mb-4">';
        html += '  <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2"><i data-lucide="truck" class="w-4 h-4 text-sky-500"></i> Transport</h3>';
        html += '  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">';
        html += AppPengaturanPembagian.inputField('Nominal per Orang', 'transport_nominal', d.transport.nominal, 'Rp');
        html += '  </div>';
        html += '  <p class="text-xs text-gray-400 mt-2">Semua karyawan (klinik + apotek) mendapat nominal yang sama</p>';
        html += '</div>';

        // ===== UANG MAKAN =====
        html += '<div class="bg-white rounded-xl border border-gray-200 p-5 mb-4">';
        html += '  <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2"><i data-lucide="utensils" class="w-4 h-4 text-orange-500"></i> Uang Makan</h3>';
        html += '  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">';
        html += AppPengaturanPembagian.inputField('Nominal per Orang', 'uangMakan_nominal', d.uangMakan.nominal, 'Rp');
        html += '  </div>';
        html += '  <p class="text-xs text-gray-400 mt-2">Diambil dari pool pembulatan transaksi. Semua karyawan mendapat nominal yang sama.</p>';
        html += '</div>';

        // ===== MARGIN OBAT RESEP =====
        html += '<div class="bg-white rounded-xl border border-gray-200 p-5 mb-4">';
        html += '  <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2"><i data-lucide="percent" class="w-4 h-4 text-rose-500"></i> Margin Obat Resep</h3>';
        html += '  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">';
        html += AppPengaturanPembagian.inputField('Margin dari HPP', 'marginResep', d.marginResep, '%');
        html += '  </div>';
        html += '  <p class="text-xs text-gray-400 mt-2">Harga Jual Obat Resep = HPP × (1 + margin%). Obat bebas tetap pakai harga jual manual.</p>';
        html += '</div>';

        // ===== TOMBOL SIMPAN =====
        html += '<div class="flex gap-3">';
        html += '  <button onclick="AppPengaturanPembagian.simpan()" class="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg transition text-sm">Simpan Semua</button>';
        html += '</div>';

        document.getElementById('pembagian-content').innerHTML = html;
        lucide.createIcons();
    },

    /**
     * Helper: buat input field
     */
    inputField: function(label, id, value, suffix) {
        return '<div>'
            + '<label class="block text-xs font-medium text-gray-600 mb-1">' + label + '</label>'
            + '<div class="relative">'
            + '<input type="number" id="pb-' + id + '" value="' + value + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm pr-10">'
            + '<span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">' + suffix + '</span>'
            + '</div>'
            + '</div>';
    },

    /**
     * Helper: render satu slot karyawan
     */
    renderSlot: function(tipe, index, slot) {
        var html = '<div class="flex items-center gap-2">';
        html += '  <input type="text" id="slot-' + tipe + '-label-' + index + '" value="' + (slot.label || '') + '" placeholder="Label" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '  <input type="number" id="slot-' + tipe + '-persen-' + index + '" value="' + (slot.persen || 0) + '" placeholder="%" class="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center">';
        html += '  <label class="flex items-center gap-1 text-xs whitespace-nowrap"><input type="checkbox" id="slot-' + tipe + '-thr-' + index + '" ' + (slot.isTHR ? 'checked' : '') + ' class="rounded"> THR</label>';
        if (index > 0) {
            html += '  <button onclick="AppPengaturanPembagian.removeSlot(\'' + tipe + '\',' + index + ')" class="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>';
        }
        html += '</div>';
        return html;
    },

    /**
     * Tambah slot baru
     */
    addSlot: function(tipe) {
        var container = document.getElementById('slots-' + tipe);
        var count = container.children.length;
        var newSlot = { label: 'Slot ' + (count + 1), karyawanId: '', persen: 0, isTHR: false };
        container.insertAdjacentHTML('beforeend', AppPengaturanPembagian.renderSlot(tipe, count, newSlot));
        lucide.createIcons({ nodes: [container] });
    },

    /**
     * Hapus slot
     */
    removeSlot: function(tipe, index) {
        var container = document.getElementById('slots-' + tipe);
        // Hapus elemen dan re-render semua slot
        AppPengaturanPembagian.collectSlotData(tipe);
        if (tipe === 'klinik') {
            AppPengaturanPembagian.data.slotKaryawanKlinik.splice(index, 1);
        } else {
            AppPengaturanPembagian.data.slotKaryawanApotek.splice(index, 1);
        }
        AppPengaturanPembagian.renderForm();
    },

    /**
     * Kumpulkan data slot dari form
     */
    collectSlotData: function(tipe) {
        var d = AppPengaturanPembagian.data;
        var key = tipe === 'klinik' ? 'slotKaryawanKlinik' : 'slotKaryawanApotek';
        var container = document.getElementById('slots-' + tipe);
        var slots = [];
        for (var i = 0; i < container.children.length; i++) {
            var labelEl = document.getElementById('slot-' + tipe + '-label-' + i);
            var persenEl = document.getElementById('slot-' + tipe + '-persen-' + i);
            var thrEl = document.getElementById('slot-' + tipe + '-thr-' + i);
            if (labelEl && persenEl) {
                slots.push({
                    label: labelEl.value,
                    karyawanId: (d[key][i] && d[key][i].karyawanId) || '',
                    persen: parseFloat(persenEl.value) || 0,
                    isTHR: thrEl ? thrEl.checked : false
                });
            }
        }
        d[key] = slots;
    },

    /**
     * Kumpulkan semua data dari form dan simpan ke Firestore
     */
    simpan: function() {
        var d = AppPengaturanPembagian.data;

        // Kumpulkan data slot dulu
        AppPengaturanPembagian.collectSlotData('klinik');
        AppPengaturanPembagian.collectSlotData('apotek');

        // Kumpulkan data lainnya
        d.resep.nilaiResep = parseFloat(document.getElementById('pb-resep_nilaiResep').value) || 0;
        d.resep.jm = parseFloat(document.getElementById('pb-resep_jm').value) || 0;
        d.resep.jd = parseFloat(document.getElementById('pb-resep_jd').value) || 0;
        d.resep.karyKlinik = parseFloat(document.getElementById('pb-resep_karyKlinik').value) || 0;
        d.resep.karyApotek = parseFloat(document.getElementById('pb-resep_karyApotek').value) || 0;
        d.resep.psa = parseFloat(document.getElementById('pb-resep_psa').value) || 0;

        d.resepLuar.nilaiResep = parseFloat(document.getElementById('pb-resepLuar_nilaiResep').value) || 0;
        d.resepLuar.dokter = parseFloat(document.getElementById('pb-resepLuar_dokter').value) || 0;
        d.resepLuar.psa = parseFloat(document.getElementById('pb-resepLuar_psa').value) || 0;

        d.tindakanKlinik.dokter = parseFloat(document.getElementById('pb-tindakanKlinik_dokter').value) || 0;
        d.tindakanKlinik.karyKlinik = parseFloat(document.getElementById('pb-tindakanKlinik_karyKlinik').value) || 0;

        d.tindakanApotek.karyApotek = parseFloat(document.getElementById('pb-tindakanApotek_karyApotek').value) || 0;
        d.tindakanApotek.psa = parseFloat(document.getElementById('pb-tindakanApotek_psa').value) || 0;

        d.tunjanganOmzet.persen = parseFloat(document.getElementById('pb-tunjanganOmzet_persen').value) || 0;
        d.transport.nominal = parseFloat(document.getElementById('pb-transport_nominal').value) || 0;
        d.uangMakan.nominal = parseFloat(document.getElementById('pb-uangMakan_nominal').value) || 0;
        d.marginResep = parseFloat(document.getElementById('pb-marginResep').value) || 0;

        d.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

        // Simpan ke Firestore
        db.collection('pengaturanPembagian').doc('global').set(d)
            .then(function() {
                Utils.toast('Pengaturan pembagian berhasil disimpan!', 'success');
            })
            .catch(function(err) {
                Utils.toast('Gagal menyimpan: ' + err.message, 'error');
            });
    }
};
