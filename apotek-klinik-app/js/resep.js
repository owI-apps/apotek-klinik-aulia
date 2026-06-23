/**
 * resep.js
 * Resep dokter — resep klinik, resep luar, obat bebas
 */

window.AppResep = {

    data: [],
    items: [],          // item obat di form saat ini
    editMode: false,    // false = resep klinik, true = resep luar/obat bebas
    configPembagian: null,

    /* =========================================
       RENDER
       ========================================= */
    render: function() {
        var html = '<div class="page-enter">';

        html += '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">';
        html += '<div>';
        html += '<h2 class="text-xl font-bold text-gray-800">Resep</h2>';
        html += '<p class="text-sm text-gray-500">Daftar resep dokter</p>';
        html += '</div>';
        html += '<div class="flex gap-2 self-start flex-wrap">';
        html += '<button onclick="AppResep.renderFormResepKlinik()" class="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-2"><i data-lucide="file-text" class="w-4 h-4"></i> Resep Klinik</button>';
        html += '<button onclick="AppResep.renderFormResepLuar()" class="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-2"><i data-lucide="file-plus" class="w-4 h-4"></i> Resep Luar</button>';
        html += '</div>';
        html += '</div>';

        html += '<div id="resep-list"></div>';
        html += '</div>';
        return html;
    },

    /* =========================================
       INIT
       ========================================= */
    init: function() {
        // Cek parameter dari URL (dari rekam medis)
        var params = Utils.getHashParams();
        if (params.rekamMedis) {
            AppResep.renderFormDariRM(params.rekamMedis);
            return;
        }

        AppResep.load();
    },

    /* =========================================
       LOAD
       ========================================= */
    load: function() {
        Utils.showLoading('resep-list');
        db.collection('resep').orderBy('createdAt', 'desc').limit(50).get()
            .then(function(snap) {
                AppResep.data = [];
                snap.forEach(function(doc) {
                    var d = doc.data();
                    d.id = doc.id;
                    AppResep.data.push(d);
                });
                AppResep.renderList();
            })
            .catch(function(err) {
                Utils.toast('Gagal memuat: ' + err.message, 'error');
            });
    },

    /* =========================================
       RENDER LIST
       ========================================= */
    renderList: function() {
        var container = document.getElementById('resep-list');
        if (!container) return;

        if (AppResep.data.length === 0) {
            container.innerHTML = '<div class="bg-white rounded-xl border border-gray-200 p-8 text-center"><p class="text-sm text-gray-400">Belum ada resep</p></div>';
            return;
        }

        var tipeLabels = {
            'resep_klinik': '<span class="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">Resep Klinik</span>',
            'resep_luar':   '<span class="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Resep Luar</span>',
            'obat_bebas':   '<span class="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">Obat Bebas</span>'
        };
        var statusLabels = {
            'menunggu':   '<span class="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">Menunggu</span>',
            'diserahkan': '<span class="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Diserahkan</span>'
        };

        var html = '<div class="space-y-2">';
        for (var i = 0; i < AppResep.data.length; i++) {
            var r = AppResep.data[i];
            html += '<div class="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-primary-300 transition" onclick="AppResep.detail(\'' + r.id + '\')">';
            html += '<div class="flex items-start justify-between gap-3">';
            html += '<div class="flex-1 min-w-0">';
            html += '<div class="flex items-center gap-2 flex-wrap">';
            html += '<p class="font-semibold text-gray-800">' + Utils.escapeHtml(r.pasienNama || '-') + '</p>';
            html += (tipeLabels[r.tipe] || '');
            html += (statusLabels[r.status] || '');
            html += '</div>';
            html += '<p class="text-xs text-gray-500 mt-0.5">' + Utils.formatTanggalShort(r.tanggal);
            if (r.dokterNama) html += ' · ' + Utils.escapeHtml(r.dokterNama);
            if (r.tipe === 'resep_luar' && r.dokterPemberiResep) html += ' (Dr. ' + Utils.escapeHtml(r.dokterPemberiResep) + ')';
            html += '</p>';
            if (r.items && r.items.length > 0) {
                var obatNames = [];
                for (var j = 0; j < r.items.length; j++) {
                    obatNames.push(r.items[j].namaObat);
                }
                html += '<p class="text-xs text-gray-500 mt-1 truncate">' + Utils.escapeHtml(obatNames.join(', ')) + '</p>';
            }
            html += '</div>';
            html += '<div class="text-right flex-shrink-0">';
            html += '<p class="text-sm font-bold text-gray-800">' + Utils.formatRupiah(r.totalBayar || r.total || 0) + '</p>';
            html += '</div></div></div>';
        }
        html += '</div>';

        container.innerHTML = html;
    },

    /* =========================================
       DETAIL RESEP
       ========================================= */
    detail: function(id) {
        var r = null;
        for (var i = 0; i < AppResep.data.length; i++) {
            if (AppResep.data[i].id === id) { r = AppResep.data[i]; break; }
        }
        if (!r) { Utils.toast('Data tidak ditemukan', 'error'); return; }

        var tipeLabel = { 'resep_klinik': 'Resep Klinik', 'resep_luar': 'Resep Luar', 'obat_bebas': 'Obat Bebas' };

        var html = '<div class="p-6">';
        html += '<div class="flex items-center justify-between mb-5">';
        html += '<h3 class="text-lg font-semibold text-gray-800">Detail Resep</h3>';
        html += '<button onclick="Utils.closeModal()" class="p-1.5 hover:bg-gray-100 rounded-lg"><i data-lucide="x" class="w-5 h-5 text-gray-400"></i></button>';
        html += '</div>';

        html += '<div class="space-y-3 text-sm">';
        html += '<div class="grid grid-cols-2 gap-3">';
        html += '<div><span class="text-gray-500">Tipe:</span> <strong>' + (tipeLabel[r.tipe] || r.tipe) + '</strong></div>';
        html += '<div><span class="text-gray-500">Tanggal:</span> <strong>' + Utils.formatTanggal(r.tanggal) + '</strong></div>';
        html += '<div><span class="text-gray-500">Pasien:</span> <strong>' + Utils.escapeHtml(r.pasienNama || '-') + '</strong></div>';
        if (r.dokterNama) html += '<div><span class="text-gray-500">Dokter:</span> <strong>' + Utils.escapeHtml(r.dokterNama) + '</strong></div>';
        if (r.dokterPemberiResep) html += '<div><span class="text-gray-500">Dr. Pemberi:</span> <strong>' + Utils.escapeHtml(r.dokterPemberiResep) + '</strong></div>';
        html += '</div>';

        // Jasa Resep
        if (r.jasaResep && r.jasaResep > 0) {
            html += '<div class="bg-gray-50 rounded-lg px-3 py-2 flex justify-between"><span class="text-gray-600">Jasa Resep</span><span class="font-medium">' + Utils.formatRupiah(r.jasaResep) + '</span></div>';
        }

        // Item obat
        if (r.items && r.items.length > 0) {
            html += '<div class="border border-gray-200 rounded-lg overflow-hidden">';
            html += '<div class="bg-gray-50 px-3 py-2 grid grid-cols-12 gap-1 text-xs font-semibold text-gray-500 uppercase">';
            html += '<div class="col-span-4">Obat</div>';
            html += '<div class="col-span-3">Dosis</div>';
            html += '<div class="col-span-1">Qty</div>';
            html += '<div class="col-span-2 text-right">Harga</div>';
            html += '<div class="col-span-2 text-right">Subtotal</div>';
            html += '</div>';
            for (var j = 0; j < r.items.length; j++) {
                var item = r.items[j];
                html += '<div class="px-3 py-2 grid grid-cols-12 gap-1 text-sm border-t border-gray-100">';
                html += '<div class="col-span-4 truncate">' + Utils.escapeHtml(item.namaObat) + '</div>';
                html += '<div class="col-span-3 text-gray-600 text-xs">' + Utils.escapeHtml(item.dosis || '') + ' ' + Utils.escapeHtml(item.aturanPakai || '') + '</div>';
                html += '<div class="col-span-1 text-gray-600">' + (item.jumlah || 0) + '</div>';
                html += '<div class="col-span-2 text-right text-gray-600">' + Utils.formatRupiah(item.hargaJual) + '</div>';
                html += '<div class="col-span-2 text-right font-medium">' + Utils.formatRupiah(item.subtotal) + '</div>';
                html += '</div>';
            }
            html += '</div>';
        }

        // Total
        html += '<div class="border-t border-gray-200 pt-3 space-y-1">';
        if (r.subtotalObat) html += '<div class="flex justify-between text-sm"><span class="text-gray-500">Subtotal Obat</span><span>' + Utils.formatRupiah(r.subtotalObat) + '</span></div>';
        if (r.pembulatan && r.pembulatan > 0) html += '<div class="flex justify-between text-sm"><span class="text-gray-500">Pembulatan</span><span>' + Utils.formatRupiah(r.pembulatan) + '</span></div>';
        html += '<div class="flex justify-between text-base font-bold"><span>Total Bayar</span><span>' + Utils.formatRupiah(r.totalBayar || r.total || 0) + '</span></div>';
        html += '</div>';

        html += '</div>';
        html += '</div>';

        Utils.openModal(html);
    },

    /* =========================================
       LOAD CONFIG PEMBAGIAN
       ========================================= */
    loadConfig: function() {
        return db.collection('pengaturanPembagian').doc('global').get()
            .then(function(doc) {
                if (doc.exists) {
                    AppResep.configPembagian = doc.data();
                } else {
                    AppResep.configPembagian = null;
                }
            });
    },

    /* =========================================
       PASTIKAN DATA OBAT SUDAH LOADED
       ========================================= */
    ensureObatLoaded: function() {
        return new Promise(function(resolve) {
            if (AppObat.data.length > 0) {
                resolve();
                return;
            }
            db.collection('obat').orderBy('namaObat').get()
                .then(function(snap) {
                    AppObat.data = [];
                    snap.forEach(function(doc) {
                        var d = doc.data();
                        d.id = doc.id;
                        AppObat.data.push(d);
                    });
                    resolve();
                })
                .catch(function() { resolve(); });
        });
    },

        /* =========================================
       FORM RESEP KLINIK (dari rekam medis)
       ========================================= */
    renderFormDariRM: function(rekamMedisId) {
        db.collection('rekamMedis').doc(rekamMedisId).get()
            .then(function(doc) {
                if (!doc.exists) {
                    Utils.toast('Rekam medis tidak ditemukan', 'error');
                    AppResep.load();
                    return;
                }
                var rm = doc.data();
                rm.id = doc.id;

                AppResep.ensureObatLoaded().then(function() {
                    AppResep.loadConfig().then(function() {
                        AppResep.renderForm('resep_klinik', {
                            rekamMedisId: rm.id,
                            pasienId: rm.pasienId,
                            pasienNama: rm.pasienNama,
                            dokterId: rm.dokterId,
                            dokterNama: rm.dokterNama,
                            tanggal: rm.tanggal
                        });
                    });
                });
            })
            .catch(function(err) {
                Utils.toast('Gagal memuat: ' + err.message, 'error');
                AppResep.load();
            });
    },

    renderFormResepKlinik: function() {
        AppResep.ensureObatLoaded().then(function() {
            AppResep.loadConfig().then(function() {
                AppResep.renderForm('resep_klinik', null);
            });
        });
    },

    renderFormResepLuar: function() {
        AppResep.ensureObatLoaded().then(function() {
            AppResep.loadConfig().then(function() {
                AppResep.renderForm('resep_luar', null);
            });
        });
    },

    /* =========================================
       RENDER FORM (utama)
       ========================================= */
    renderForm: function(tipe, prefill) {
        var v = prefill || {};
        AppResep.items = [];

        var isKlinik = (tipe === 'resep_klinik');
        var isLuar = (tipe === 'resep_luar');
        var cfg = AppResep.configPembagian;

        var jasaResep = 0;
        if (cfg) {
            jasaResep = isKlinik ? (cfg.resep.nilaiResep || 0) : (cfg.resepLuar.nilaiResep || 0);
        }

        var html = '<div class="p-6">';
        html += '<div class="flex items-center justify-between mb-5">';
        html += '<h3 class="text-lg font-semibold text-gray-800">' + (isKlinik ? 'Resep Klinik' : 'Resep Luar') + '</h3>';
        html += '<button onclick="Utils.closeModal()" class="p-1.5 hover:bg-gray-100 rounded-lg"><i data-lucide="x" class="w-5 h-5 text-gray-400"></i></button>';
        html += '</div>';

        html += '<form id="form-resep" class="space-y-4">';

        // Hidden fields
        html += '<input type="hidden" id="fr-tipe" value="' + tipe + '">';
        html += '<input type="hidden" id="fr-rekam-medis-id" value="' + (v.rekamMedisId || '') + '">';
        html += '<input type="hidden" id="fr-pasien-id" value="' + (v.pasienId || '') + '">';

        // Info pasien & dokter
        if (isKlinik && v.pasienNama) {
            html += '<div class="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-700">';
            html += 'Pasien: <strong>' + Utils.escapeHtml(v.pasienNama) + '</strong> · Dokter: <strong>' + Utils.escapeHtml(v.dokterNama || '') + '</strong>';
            html += '</div>';
            html += '<input type="hidden" id="fr-pasien-nama" value="' + Utils.escapeHtml(v.pasienNama) + '">';
            html += '<input type="hidden" id="fr-dokter-id" value="' + (v.dokterId || '') + '">';
            html += '<input type="hidden" id="fr-dokter-nama" value="' + Utils.escapeHtml(v.dokterNama || '') + '">';
        } else {
            html += '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">';
            html += '<div>';
            html += '<label class="block text-sm font-medium text-gray-700 mb-1">Nama Pasien *</label>';
            html += '<input type="text" id="fr-pasien-nama" value="' + Utils.escapeHtml(v.pasienNama || '') + '" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Nama pasien">';
            html += '</div>';
            html += '<div>';
            html += '<label class="block text-sm font-medium text-gray-700 mb-1">Dokter Pemberi Resep *</label>';
            html += '<input type="text" id="fr-dokter-pemberi" value="' + Utils.escapeHtml(v.dokterPemberiResep || '') + '" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Nama dokter luar">';
            html += '</div></div>';
            html += '<input type="hidden" id="fr-dokter-id" value="">';
            html += '<input type="hidden" id="fr-dokter-nama" value="">';
        }

        // Jasa Resep
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Jasa Resep</label>';
        html += '<input type="number" id="fr-jasa-resep" value="' + jasaResep + '" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" oninput="AppResep.hitungTotal()">';
        html += '</div>';

        // Tanggal
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>';
        html += '<input type="date" id="fr-tanggal" value="' + (v.tanggal || Utils.today()) + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '</div>';

        // Item Obat
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-2">Obat</label>';
        html += '<div id="fr-items-container" class="space-y-2"></div>';
        html += '<button type="button" onclick="AppResep.tambahItem()" class="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"><i data-lucide="plus-circle" class="w-4 h-4"></i> Tambah Obat</button>';
        html += '</div>';

        // Total
        html += '<div class="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">';
        html += '<div class="flex justify-between"><span class="text-gray-500">Subtotal Obat</span><span id="fr-subtotal-obat" class="font-medium">Rp 0</span></div>';
        html += '<div class="flex justify-between"><span class="text-gray-500">Jasa Resep</span><span id="fr-display-jasa" class="font-medium">Rp 0</span></div>';
        html += '<div class="flex justify-between"><span class="text-gray-500">Subtotal</span><span id="fr-subtotal" class="font-medium">Rp 0</span></div>';
        html += '<div class="flex justify-between"><span class="text-gray-500">Pembulatan</span><span id="fr-pembulatan" class="font-medium text-amber-600">Rp 0</span></div>';
        html += '<hr class="border-gray-200">';
        html += '<div class="flex justify-between text-base font-bold"><span>Total Bayar</span><span id="fr-total-bayar" class="text-primary-700">Rp 0</span></div>';
        html += '</div>';

        // Tombol
        html += '<div class="flex justify-end gap-2 pt-2">';
        html += '<button type="button" onclick="Utils.closeModal()" class="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>';
        html += '<button type="submit" id="btn-simpan-resep" class="px-6 py-2.5 text-sm bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition">Simpan Resep</button>';
        html += '</div>';

        html += '</form></div>';

        Utils.openModal(html);

        // Tambah 1 item default setelah modal terbuka
        AppResep.tambahItem();
        AppResep.hitungTotal();

        // Event submit
        document.getElementById('form-resep').addEventListener('submit', function(e) {
            e.preventDefault();
            AppResep.simpan();
        });
    },

    /* =========================================
       TAMBAH ITEM OBAT
       ========================================= */
    tambahItem: function() {
        var index = AppResep.items.length;
        AppResep.items.push({
            obatId: '',
            namaObat: '',
            dosis: '',
            jumlah: 1,
            satuan: '',
            hargaBeli: 0,
            hargaJual: 0,
            subtotal: 0
        });
        AppResep.renderItemRow(index);
    },

    /* =========================================
       RENDER SATU ROW ITEM
       ========================================= */
    renderItemRow: function(index) {
        var container = document.getElementById('fr-items-container');
        if (!container) return;

        var item = AppResep.items[index];
        var tipeEl = document.getElementById('fr-tipe');
        var tipe = tipeEl ? tipeEl.value : 'resep_klinik';
        var isResep = (tipe === 'resep_klinik' || tipe === 'resep_luar');
        var cfg = AppResep.configPembagian;
        var marginPercent = (cfg && cfg.marginResep) ? cfg.marginResep : 35;

        var html = '<div id="fr-item-' + index + '" class="border border-gray-200 rounded-lg p-3 bg-white relative">';

        // Hapus button di pojok kanan atas
        html += '<button type="button" onclick="AppResep.removeItem(' + index + ')" class="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-0.5"><i data-lucide="x-circle" class="w-4 h-4"></i></button>';

        // Pilih obat
        html += '<div class="relative mb-2 pr-6">';
        html += '<i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"></i>';
        html += '<input type="text" id="fri-search-' + index + '" value="' + Utils.escapeHtml(item.namaObat) + '" placeholder="Ketik nama obat..." class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm" autocomplete="off" onfocus="AppResep.showObatDropdown(' + index + ')" oninput="AppResep.filterObatDropdown(' + index + ')">';
        html += '<div id="fri-dropdown-' + index + '" class="hidden absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto"></div>';
        html += '</div>';

        // Dosis + Jumlah + Harga
        html += '<div class="grid grid-cols-3 gap-2">';
        html += '<div>';
        html += '<label class="block text-xs text-gray-500 mb-0.5">Dosis & Aturan</label>';
        html += '<input type="text" id="fri-dosis-' + index + '" value="' + Utils.escapeHtml(item.dosis) + '" placeholder="3x1" class="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs">';
        html += '</div>';
        html += '<div>';
        html += '<label class="block text-xs text-gray-500 mb-0.5">Jumlah</label>';
        html += '<input type="number" id="fri-jumlah-' + index + '" value="' + item.jumlah + '" min="1" class="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" oninput="AppResep.updateItemJumlah(' + index + ')">';
        html += '</div>';
        html += '<div>';
        html += '<label class="block text-xs text-gray-500 mb-0.5">Harga Jual</label>';
        html += '<input type="number" id="fri-harga-' + index + '" value="' + item.hargaJual + '" min="0" class="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" oninput="AppResep.updateItemHarga(' + index + ')">';
        if (isResep) {
            html += '<p id="fri-info-' + index + '" class="text-xs text-gray-400 mt-0.5 truncate"></p>';
        }
        html += '</div>';
        html += '</div>';

        // Hidden fields
        html += '<input type="hidden" id="fri-obat-id-' + index + '" value="' + (item.obatId || '') + '">';
        html += '<input type="hidden" id="fri-hpp-' + index + '" value="' + (item.hargaBeli || 0) + '">';
        html += '<input type="hidden" id="fri-satuan-' + index + '" value="' + Utils.escapeHtml(item.satuan || '') + '">';
        html += '<input type="hidden" id="fri-subtotal-' + index + '" value="' + (item.subtotal || 0) + '">';

        html += '</div>';

        container.insertAdjacentHTML('beforeend', html);
        lucide.createIcons({ nodes: [container] });

        // Tampilkan info harga auto kalau sudah ada HPP
        if (isResep && item.hargaBeli > 0) {
            var infoEl = document.getElementById('fri-info-' + index);
            if (infoEl) {
                var autoHarga = Math.ceil(item.hargaBeli * (1 + marginPercent / 100));
                infoEl.textContent = 'Auto (+' + marginPercent + '%): ' + Utils.formatRupiah(autoHarga);
            }
        }
    },

    /* =========================================
       OBAT DROPDOWN
       ========================================= */
    showObatDropdown: function(index) {
        var searchEl = document.getElementById('fri-search-' + index);
        if (!searchEl) return;
        var val = searchEl.value.trim().toLowerCase();
        if (val) {
            AppResep.filterObatDropdown(index);
        }
    },

    filterObatDropdown: function(index) {
        var dropdown = document.getElementById('fri-dropdown-' + index);
        if (!dropdown) return;

        var searchEl = document.getElementById('fri-search-' + index);
        if (!searchEl) return;
        var val = searchEl.value.trim().toLowerCase();

        if (!val) { dropdown.classList.add('hidden'); return; }

        var results = AppObat.data.filter(function(o) {
            return (o.namaObat && o.namaObat.toLowerCase().indexOf(val) !== -1)
                || (o.kodeObat && o.kodeObat.toLowerCase().indexOf(val) !== -1);
        }).slice(0, 6);

        if (results.length === 0) {
            dropdown.innerHTML = '<div class="px-3 py-2 text-sm text-gray-400">Obat tidak ditemukan</div>';
            dropdown.classList.remove('hidden');
            return;
        }

        var tipeEl = document.getElementById('fr-tipe');
        var tipe = tipeEl ? tipeEl.value : 'resep_klinik';
        var isResep = (tipe === 'resep_klinik' || tipe === 'resep_luar');
        var cfg = AppResep.configPembagian;
        var marginPercent = (cfg && cfg.marginResep) ? cfg.marginResep : 35;

        var html = '';
        for (var i = 0; i < results.length; i++) {
            var o = results[i];
            var hargaDisplay = '';
            if (isResep) {
                var autoHarga = Math.ceil(o.hargaBeli * (1 + marginPercent / 100));
                hargaDisplay = Utils.formatRupiah(autoHarga) + ' (auto)';
            } else {
                hargaDisplay = Utils.formatRupiah(o.hargaJual);
            }
            html += '<button type="button" onclick="AppResep.selectObat(' + index + ',\'' + o.id + '\')" class="w-full text-left px-3 py-2 hover:bg-primary-50 text-sm border-b border-gray-50 last:border-0 transition">';
            html += '<div class="flex justify-between items-center gap-2">';
            html += '<div class="min-w-0"><p class="font-medium text-gray-800 truncate">' + Utils.escapeHtml(o.namaObat) + '</p>';
            html += '<p class="text-xs text-gray-500">Stok: ' + (o.stok || 0) + ' ' + Utils.escapeHtml(o.satuan || '') + ' · HPP: ' + Utils.formatRupiah(o.hargaBeli) + '</p></div>';
            html += '<span class="text-xs text-primary-600 font-medium whitespace-nowrap">' + hargaDisplay + '</span>';
            html += '</div></button>';
        }
        dropdown.innerHTML = html;
        dropdown.classList.remove('hidden');
    },

    /* =========================================
       SELECT OBAT KE ITEM
       ========================================= */
    selectObat: function(index, obatId) {
        var obat = AppObat.getById(obatId);
        if (!obat) return;

        var tipeEl = document.getElementById('fr-tipe');
        var tipe = tipeEl ? tipeEl.value : 'resep_klinik';
        var isResep = (tipe === 'resep_klinik' || tipe === 'resep_luar');
        var cfg = AppResep.configPembagian;
        var marginPercent = (cfg && cfg.marginResep) ? cfg.marginResep : 35;

        // Update data di array
        AppResep.items[index].obatId = obatId;
        AppResep.items[index].namaObat = obat.namaObat;
        AppResep.items[index].hargaBeli = obat.hargaBeli || 0;
        AppResep.items[index].satuan = obat.satuan || '';

        if (isResep) {
            AppResep.items[index].hargaJual = Math.ceil(obat.hargaBeli * (1 + marginPercent / 100));
        } else {
            AppResep.items[index].hargaJual = obat.hargaJual || 0;
        }
        AppResep.items[index].subtotal = AppResep.items[index].hargaJual * AppResep.items[index].jumlah;

        // Hapus row lama, render ulang
        var oldRow = document.getElementById('fr-item-' + index);
        if (oldRow) oldRow.remove();
        AppResep.renderItemRow(index);
        AppResep.hitungTotal();
    },

    /* =========================================
       UPDATE JUMLAH ITEM
       ========================================= */
    updateItemJumlah: function(index) {
        var el = document.getElementById('fri-jumlah-' + index);
        if (!el) return;
        var jumlah = parseInt(el.value) || 0;
        if (jumlah < 0) jumlah = 0;
        AppResep.items[index].jumlah = jumlah;
        AppResep.items[index].subtotal = AppResep.items[index].hargaJual * jumlah;
        var subEl = document.getElementById('fri-subtotal-' + index);
        if (subEl) subEl.value = AppResep.items[index].subtotal;
        AppResep.hitungTotal();
    },

    /* =========================================
       UPDATE HARGA ITEM (manual override)
       ========================================= */
    updateItemHarga: function(index) {
        var el = document.getElementById('fri-harga-' + index);
        if (!el) return;
        var harga = parseFloat(el.value) || 0;
        if (harga < 0) harga = 0;
        AppResep.items[index].hargaJual = harga;
        AppResep.items[index].subtotal = harga * AppResep.items[index].jumlah;
        var subEl = document.getElementById('fri-subtotal-' + index);
        if (subEl) subEl.value = AppResep.items[index].subtotal;
        AppResep.hitungTotal();
    },

    /* =========================================
       HAPUS ITEM
       ========================================= */
    removeItem: function(index) {
        var row = document.getElementById('fr-item-' + index);
        if (row) row.remove();
        AppResep.items[index] = null;
        AppResep.hitungTotal();
    },

    /* =========================================
       HITUNG TOTAL FORM
       ========================================= */
    hitungTotal: function() {
        var subtotalObat = 0;
        for (var i = 0; i < AppResep.items.length; i++) {
            if (AppResep.items[i] !== null) {
                subtotalObat += (AppResep.items[i].subtotal || 0);
            }
        }

        var jasaEl = document.getElementById('fr-jasa-resep');
        var jasaResep = jasaEl ? (parseFloat(jasaEl.value) || 0) : 0;
        var subtotal = subtotalObat + jasaResep;
        var pembulatan = Utils.ceilingRibuan(subtotal) - subtotal;
        var totalBayar = subtotal + pembulatan;

        var el;
        el = document.getElementById('fr-subtotal-obat');
        if (el) el.textContent = Utils.formatRupiah(subtotalObat);
        el = document.getElementById('fr-display-jasa');
        if (el) el.textContent = Utils.formatRupiah(jasaResep);
        el = document.getElementById('fr-subtotal');
        if (el) el.textContent = Utils.formatRupiah(subtotal);
        el = document.getElementById('fr-pembulatan');
        if (el) el.textContent = (pembulatan > 0 ? '+' : '') + Utils.formatRupiah(pembulatan);
        el = document.getElementById('fr-total-bayar');
        if (el) el.textContent = Utils.formatRupiah(totalBayar);
    },

    /* =========================================
       SIMPAN RESEP
       ========================================= */
    simpan: function() {
        var btn = document.getElementById('btn-simpan-resep');
        btn.disabled = true;
        btn.textContent = 'Menyimpan...';

        var tipeEl = document.getElementById('fr-tipe');
        var tipe = tipeEl ? tipeEl.value : 'resep_klinik';
        var pasienNamaEl = document.getElementById('fr-pasien-nama');
        var pasienNama = pasienNamaEl ? pasienNamaEl.value.trim() : '';

        if (!pasienNama) {
            Utils.toast('Nama pasien wajib diisi', 'error');
            btn.disabled = false;
            btn.textContent = 'Simpan Resep';
            return;
        }

        // Kumpulkan item yang valid (tidak null & punya obat)
        var validItems = [];
        for (var i = 0; i < AppResep.items.length; i++) {
            var item = AppResep.items[i];
            if (item !== null && item.obatId && item.jumlah > 0) {
                var dosisEl = document.getElementById('fri-dosis-' + i);
                validItems.push({
                    obatId: item.obatId,
                    namaObat: item.namaObat,
                    dosis: dosisEl ? dosisEl.value.trim() : '',
                    jumlah: item.jumlah,
                    satuan: item.satuan,
                    hargaBeli: item.hargaBeli,
                    hargaJual: item.hargaJual,
                    subtotal: item.subtotal
                });
            }
        }

        if (validItems.length === 0) {
            Utils.toast('Tambahkan minimal 1 obat', 'error');
            btn.disabled = false;
            btn.textContent = 'Simpan Resep';
            return;
        }

        // Hitung total
        var subtotalObat = 0;
        for (var j = 0; j < validItems.length; j++) {
            subtotalObat += validItems[j].subtotal;
        }
        var jasaResepEl = document.getElementById('fr-jasa-resep');
        var jasaResep = jasaResepEl ? (parseFloat(jasaResepEl.value) || 0) : 0;
        var subtotal = subtotalObat + jasaResep;
        var pembulatan = Utils.ceilingRibuan(subtotal) - subtotal;
        var totalBayar = subtotal + pembulatan;

        var obj = {
            tipe: tipe,
            tanggal: document.getElementById('fr-tanggal').value,
            pasienId: document.getElementById('fr-pasien-id').value,
            pasienNama: pasienNama,
            dokterId: document.getElementById('fr-dokter-id').value,
            dokterNama: document.getElementById('fr-dokter-nama').value,
            jasaResep: jasaResep,
            items: validItems,
            subtotalObat: subtotalObat,
            pembulatan: pembulatan,
            totalBayar: totalBayar,
            status: 'menunggu',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Dokter pemberi resep (resep luar)
        if (tipe === 'resep_luar') {
            var dpEl = document.getElementById('fr-dokter-pemberi');
            if (dpEl) obj.dokterPemberiResep = dpEl.value.trim();
        }

        // Relasi ke rekam medis
        var rmIdEl = document.getElementById('fr-rekam-medis-id');
        if (rmIdEl && rmIdEl.value) {
            obj.rekamMedisId = rmIdEl.value;
        }

        db.collection('resep').add(obj)
            .then(function() {
                Utils.toast('Resep berhasil disimpan', 'success');
                Utils.closeModal();
                AppResep.load();
            })
            .catch(function(err) {
                Utils.toast('Gagal menyimpan: ' + err.message, 'error');
                btn.disabled = false;
                btn.textContent = 'Simpan Resep';
            });
    }
};
