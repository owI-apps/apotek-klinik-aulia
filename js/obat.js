/**
 * obat.js
 * Master data obat & alkes — CRUD lengkap
 * Module ini dibutuhkan oleh module Resep
 */

window.AppObat = {

    data: [],

    /* =========================================
       KATEGORI & SATUAN (konstanta)
       ========================================= */
    kategoriList: [
        'Obat Bebas', 'Obat Bebas Terbatas', 'Obat Keras',
        'Alat Kesehatan', 'Consumable', 'Lainnya'
    ],

    /* =========================================
       RENDER — mengembalikan HTML string
       ========================================= */
    render: function() {
        var html = '<div class="page-enter">';

        // Header
        html += '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">';
        html += '<div>';
        html += '<h2 class="text-xl font-bold text-gray-800">Obat & Stock</h2>';
        html += '<p class="text-sm text-gray-500">Master data obat dan alat kesehatan</p>';
        html += '</div>';
        html += '<button onclick="AppObat.renderFormTambah()" class="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-2 self-start"><i data-lucide="plus" class="w-4 h-4"></i> Tambah Obat</button>';
        html += '</div>';

        // Search
        html += '<div class="mb-4 relative">';
        html += '<i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>';
        html += '<input type="text" id="obat-search" placeholder="Cari nama obat atau kode..." class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm">';
        html += '</div>';

        // List container
        html += '<div id="obat-list"></div>';
        html += '</div>';
        return html;
    },

    /* =========================================
       INIT — dipanggil setelah render
       ========================================= */
    init: function() {
        AppObat.load();
        var searchInput = document.getElementById('obat-search');
        if (searchInput) {
            var timeout;
            searchInput.addEventListener('input', function() {
                clearTimeout(timeout);
                var val = searchInput.value.trim().toLowerCase();
                timeout = setTimeout(function() {
                    if (!val) { AppObat.renderList(AppObat.data); return; }
                    var filtered = AppObat.data.filter(function(o) {
                        return (o.namaObat && o.namaObat.toLowerCase().indexOf(val) !== -1)
                            || (o.kodeObat && o.kodeObat.toLowerCase().indexOf(val) !== -1);
                    });
                    AppObat.renderList(filtered);
                }, 300);
            });
        }
    },

    /* =========================================
       LOAD — ambil data dari Firestore
       ========================================= */
    load: function() {
        Utils.showLoading('obat-list');
        db.collection('obat').orderBy('namaObat').get()
            .then(function(snap) {
                AppObat.data = [];
                snap.forEach(function(doc) {
                    var d = doc.data();
                    d.id = doc.id;
                    AppObat.data.push(d);
                });
                AppObat.renderList(AppObat.data);
            })
            .catch(function(err) {
                Utils.toast('Gagal memuat data obat: ' + err.message, 'error');
            });
    },

    /* =========================================
       RENDER LIST
       ========================================= */
    renderList: function(list) {
        var container = document.getElementById('obat-list');
        if (!container) return;

        if (!list || list.length === 0) {
            container.innerHTML = '<div class="bg-white rounded-xl border border-gray-200 p-8 text-center"><p class="text-sm text-gray-400">Belum ada data obat</p></div>';
            return;
        }

        var html = '<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">';

        // Header tabel (desktop only)
        html += '<div class="hidden lg:grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">';
        html += '<div class="col-span-3">Nama Obat</div>';
        html += '<div class="col-span-1">Kode</div>';
        html += '<div class="col-span-1">Kategori</div>';
        html += '<div class="col-span-1">Stok</div>';
        html += '<div class="col-span-2">Harga Beli</div>';
        html += '<div class="col-span-2">Harga Jual</div>';
        html += '<div class="col-span-2 text-right">Aksi</div>';
        html += '</div>';

        for (var i = 0; i < list.length; i++) {
            var o = list[i];
            var stokWarning = (o.stok <= (o.stokMinimum || 0)) ? 'text-red-600 font-bold' : 'text-gray-800';
            var namaEsc = Utils.escapeHtml(o.namaObat || '-');
            var kodeEsc = Utils.escapeHtml(o.kodeObat || '-');
            var satEsc  = Utils.escapeHtml(o.satuan || '');

            html += '<div class="border-t border-gray-100 first:border-t-0">';

            // Row desktop
            html += '<div class="hidden lg:grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50 text-sm">';
            html += '<div class="col-span-3 font-medium text-gray-800 truncate" title="' + namaEsc + '">' + namaEsc + '</div>';
            html += '<div class="col-span-1 text-gray-500 text-xs">' + kodeEsc + '</div>';
            html += '<div class="col-span-1 text-gray-500 text-xs">' + Utils.escapeHtml(o.kategori || '-') + '</div>';
            html += '<div class="col-span-1 ' + stokWarning + '">' + (o.stok || 0) + ' ' + satEsc + '</div>';
            html += '<div class="col-span-2 text-gray-600">' + Utils.formatRupiah(o.hargaBeli) + '</div>';
            html += '<div class="col-span-2 text-gray-600">' + Utils.formatRupiah(o.hargaJual) + '</div>';
            html += '<div class="col-span-2 flex justify-end gap-1">';
            html += '<button onclick="AppObat.renderFormEdit(\'' + o.id + '\')" class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="Edit"><i data-lucide="pencil" class="w-4 h-4"></i></button>';
            html += '<button onclick="AppObat.hapus(\'' + o.id + '\',\'' + namaEsc.replace(/'/g, "\\'") + '\')" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Hapus"><i data-lucide="trash-2" class="w-4 h-4"></i></button>';
            html += '</div></div>';

            // Card mobile
            html += '<div class="lg:hidden px-4 py-3">';
            html += '<div class="flex items-start justify-between gap-2">';
            html += '<div class="flex-1 min-w-0">';
            html += '<p class="font-medium text-gray-800 truncate">' + namaEsc + '</p>';
            html += '<p class="text-xs text-gray-500 mt-0.5">' + kodeEsc + ' · ' + satEsc + ' · ' + Utils.escapeHtml(o.kategori || '-') + '</p>';
            html += '<p class="text-xs text-gray-600 mt-1">Beli: ' + Utils.formatRupiah(o.hargaBeli) + ' · Jual: ' + Utils.formatRupiah(o.hargaJual) + '</p>';
            html += '</div>';
            html += '<div class="flex items-center gap-2 flex-shrink-0">';
            html += '<span class="text-sm ' + stokWarning + ' whitespace-nowrap">' + (o.stok || 0) + '</span>';
            html += '<button onclick="AppObat.renderFormEdit(\'' + o.id + '\')" class="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg"><i data-lucide="pencil" class="w-4 h-4"></i></button>';
            html += '<button onclick="AppObat.hapus(\'' + o.id + '\',\'' + namaEsc.replace(/'/g, "\\'") + '\')" class="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>';
            html += '</div></div></div>';

            html += '</div>';
        }

        html += '</div>';
        html += '<p class="text-xs text-gray-400 mt-2 text-right">Total: ' + list.length + ' item</p>';
        container.innerHTML = html;
        lucide.createIcons({ nodes: [container] });
    },

    /* =========================================
       RENDER FORM (tambah / edit)
       ========================================= */
    renderFormTambah: function() {
        AppObat.renderForm(null);
    },

    renderFormEdit: function(id) {
        var obat = null;
        for (var i = 0; i < AppObat.data.length; i++) {
            if (AppObat.data[i].id === id) { obat = AppObat.data[i]; break; }
        }
        if (!obat) {
            Utils.toast('Data obat tidak ditemukan', 'error');
            return;
        }
        AppObat.renderForm(obat);
    },

    renderForm: function(data) {
        var isEdit = !!data;
        var title = isEdit ? 'Edit Obat' : 'Tambah Obat';
        var v = data || {};

        var html = '<div class="p-6">';
        html += '<div class="flex items-center justify-between mb-5">';
        html += '<h3 class="text-lg font-semibold text-gray-800">' + title + '</h3>';
        html += '<button onclick="Utils.closeModal()" class="p-1.5 hover:bg-gray-100 rounded-lg"><i data-lucide="x" class="w-5 h-5 text-gray-400"></i></button>';
        html += '</div>';

        html += '<form id="form-obat" class="space-y-4">';

        // Baris 1: Kode + Nama
        html += '<div class="grid grid-cols-1 sm:grid-cols-4 gap-4">';
        html += '<div class="sm:col-span-1">';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Kode Obat</label>';
        html += '<input type="text" id="fo-kode" value="' + Utils.escapeHtml(v.kodeObat || '') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="OBT-001">';
        html += '</div>';
        html += '<div class="sm:col-span-3">';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Nama Obat *</label>';
        html += '<input type="text" id="fo-nama" value="' + Utils.escapeHtml(v.namaObat || '') + '" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Paracetamol 500mg">';
        html += '</div>';
        html += '</div>';

        // Baris 2: Kategori + Satuan
        html += '<div class="grid grid-cols-2 gap-4">';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>';
        html += '<select id="fo-kategori" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '<option value="">-- Pilih --</option>';
        for (var k = 0; k < AppObat.kategoriList.length; k++) {
            var sel = (v.kategori === AppObat.kategoriList[k]) ? ' selected' : '';
            html += '<option value="' + AppObat.kategoriList[k] + '"' + sel + '>' + AppObat.kategoriList[k] + '</option>';
        }
        html += '</select></div>';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Satuan</label>';
        html += '<input type="text" id="fo-satuan" value="' + Utils.escapeHtml(v.satuan || '') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="tablet, botol, pcs">';
        html += '</div></div>';

        // Baris 3: Harga Beli + Harga Jual
        html += '<div class="grid grid-cols-2 gap-4">';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Harga Beli (HPP) *</label>';
        html += '<input type="number" id="fo-harga-beli" value="' + (v.hargaBeli || 0) + '" required min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="0" oninput="AppObat.previewHargaResep()">';
        html += '</div>';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Harga Jual (Obat Bebas) *</label>';
        html += '<input type="number" id="fo-harga-jual" value="' + (v.hargaJual || 0) + '" required min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="0">';
        html += '<p id="fo-harga-resep-info" class="text-xs text-gray-400 mt-1"></p>';
        html += '</div></div>';

        // Baris 4: Stok + Stok Minimum
        html += '<div class="grid grid-cols-2 gap-4">';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Stok Awal</label>';
        html += '<input type="number" id="fo-stok" value="' + (v.stok || 0) + '" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="0">';
        html += '</div>';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Stok Minimum (peringatan)</label>';
        html += '<input type="number" id="fo-stok-min" value="' + (v.stokMinimum || 0) + '" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="0">';
        html += '</div></div>';

        // Baris 5: Lokasi Rak + Expired
        html += '<div class="grid grid-cols-2 gap-4">';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Lokasi Rak</label>';
        html += '<input type="text" id="fo-rak" value="' + Utils.escapeHtml(v.lokasiRak || '') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Rak A-1">';
        html += '</div>';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Expired</label>';
        html += '<input type="date" id="fo-expired" value="' + (v.expiredDate || '') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '</div></div>';

        // Tombol
        html += '<div class="flex justify-end gap-2 pt-2">';
        html += '<button type="button" onclick="Utils.closeModal()" class="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>';
        html += '<button type="submit" id="btn-simpan-obat" class="px-6 py-2.5 text-sm bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition">Simpan</button>';
        html += '</div>';

        if (isEdit) {
            html += '<input type="hidden" id="fo-id" value="' + v.id + '">';
        }

        html += '</form></div>';

        Utils.openModal(html);
        AppObat.previewHargaResep();

        document.getElementById('form-obat').addEventListener('submit', function(e) {
            e.preventDefault();
            AppObat.simpan();
        });
    },

    /* =========================================
       PREVIEW HARGA RESEP (info di form)
       ========================================= */
    previewHargaResep: function() {
        var hpp = parseFloat(document.getElementById('fo-harga-beli').value) || 0;
        var infoEl = document.getElementById('fo-harga-resep-info');
        if (!infoEl) return;

        // Load margin dari config
        db.collection('pengaturanPembagian').doc('global').get()
            .then(function(doc) {
                if (doc.exists) {
                    var margin = doc.data().marginResep || 35;
                    var hargaResep = Math.ceil(hpp * (1 + margin / 100));
                    infoEl.textContent = 'Harga jual resep (+' + margin + '%): ' + Utils.formatRupiah(hargaResep);
                }
            })
            .catch(function() {
                infoEl.textContent = '';
            });
    },

    /* =========================================
       SIMPAN (create / update)
       ========================================= */
    simpan: function() {
        var btn = document.getElementById('btn-simpan-obat');
        btn.disabled = true;
        btn.textContent = 'Menyimpan...';

        var idField = document.getElementById('fo-id');
        var isEdit = !!idField;
        var id = isEdit ? idField.value : null;

        var hargaBeli = parseFloat(document.getElementById('fo-harga-beli').value) || 0;
        var hargaJual = parseFloat(document.getElementById('fo-harga-jual').value) || 0;
        var nama = document.getElementById('fo-nama').value.trim();

        if (!nama) {
            Utils.toast('Nama obat wajib diisi', 'error');
            btn.disabled = false;
            btn.textContent = 'Simpan';
            return;
        }

        var obj = {
            kodeObat:    document.getElementById('fo-kode').value.trim(),
            namaObat:    nama,
            kategori:    document.getElementById('fo-kategori').value,
            satuan:      document.getElementById('fo-satuan').value.trim(),
            hargaBeli:   hargaBeli,
            hargaJual:   hargaJual,
            stok:        parseFloat(document.getElementById('fo-stok').value) || 0,
            stokMinimum: parseFloat(document.getElementById('fo-stok-min').value) || 0,
            lokasiRak:   document.getElementById('fo-rak').value.trim(),
            expiredDate: document.getElementById('fo-expired').value,
            updatedAt:   firebase.firestore.FieldValue.serverTimestamp()
        };

        var promise;
        if (isEdit) {
            promise = db.collection('obat').doc(id).update(obj);
        } else {
            obj.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            promise = db.collection('obat').add(obj);
        }

        promise.then(function() {
            Utils.toast(isEdit ? 'Obat berhasil diperbarui' : 'Obat berhasil ditambahkan', 'success');
            Utils.closeModal();
            AppObat.load();
        }).catch(function(err) {
            Utils.toast('Gagal menyimpan: ' + err.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Simpan';
        });
    },

    /* =========================================
       HAPUS
       ========================================= */
    hapus: function(id, nama) {
        if (!confirm('Hapus obat "' + nama + '"?\nData yang sudah dihapus tidak bisa dikembalikan.')) return;

        db.collection('obat').doc(id).delete()
            .then(function() {
                Utils.toast('Obat berhasil dihapus', 'success');
                AppObat.load();
            })
            .catch(function(err) {
                Utils.toast('Gagal menghapus: ' + err.message, 'error');
            });
    },

    /* =========================================
       UTILITAS — dipakai oleh module lain
       ========================================= */

    /** Cari obat berdasarkan ID, return object atau null */
    getById: function(id) {
        for (var i = 0; i < AppObat.data.length; i++) {
            if (AppObat.data[i].id === id) return AppObat.data[i];
        }
        return null;
    },

    /** Cari obat berdasarkan query, return array */
    search: function(query) {
        if (!query) return AppObat.data.slice();
        var q = query.toLowerCase();
        return AppObat.data.filter(function(o) {
            return (o.namaObat && o.namaObat.toLowerCase().indexOf(q) !== -1)
                || (o.kodeObat && o.kodeObat.toLowerCase().indexOf(q) !== -1);
        });
    }
};
