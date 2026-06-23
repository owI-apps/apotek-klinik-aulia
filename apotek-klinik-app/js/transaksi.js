/**
 * transaksi.js
 * Transaksi penjualan: Proses Resep, Obat Bebas, Tindakan Apotek
 * Termasuk pembayaran dan cetak kwitansi
 */

window.AppTransaksi = {

    data: [],
    filterDate: '',
    filterTipe: 'semua',
    mode: 'list',

    // State untuk form obat bebas
    formItems: [],

    // State untuk form tindakan apotek
    formTindakanItems: [],
    masterTindakanApotek: [],

    // State untuk proses resep
    selectedResep: null,

    /* =========================================
       RENDER
       ========================================= */
    render: function() {
        AppTransaksi.mode = 'list';
        AppTransaksi.filterDate = Utils.today();

        var html = '<div class="page-enter">';

        html += '<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">';
        html += '<div>';
        html += '<h2 class="text-xl font-bold text-gray-800">Transaksi</h2>';
        html += '<p class="text-sm text-gray-500">Penjualan obat & tindakan apotek</p>';
        html += '</div>';
        html += '<div class="flex gap-2 flex-wrap self-start">';
        html += '<button onclick="AppTransaksi.renderSelectResep()" class="bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center gap-1.5"><i data-lucide="file-check" class="w-3.5 h-3.5"></i> Proses Resep</button>';
        html += '<button onclick="AppTransaksi.renderFormObatBebas()" class="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center gap-1.5"><i data-lucide="pill" class="w-3.5 h-3.5"></i> Obat Bebas</button>';
        html += '<button onclick="AppTransaksi.renderFormTindakanApotek()" class="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center gap-1.5"><i data-lucide="syringe" class="w-3.5 h-3.5"></i> Tindakan Apotek</button>';
        html += '</div>';
        html += '</div>';

        // Filter
        html += '<div class="flex flex-col sm:flex-row gap-3 mb-4">';
        html += '<div>';
        html += '<label class="block text-xs text-gray-500 mb-1">Tanggal</label>';
        html += '<input type="date" id="trx-filter-date" value="' + AppTransaksi.filterDate + '" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '</div>';
        html += '<div>';
        html += '<label class="block text-xs text-gray-500 mb-1">Tipe</label>';
        html += '<select id="trx-filter-tipe" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '<option value="semua"' + (AppTransaksi.filterTipe === 'semua' ? ' selected' : '') + '>Semua</option>';
        html += '<option value="resep_klinik"' + (AppTransaksi.filterTipe === 'resep_klinik' ? ' selected' : '') + '>Resep Klinik</option>';
        html += '<option value="resep_luar"' + (AppTransaksi.filterTipe === 'resep_luar' ? ' selected' : '') + '>Resep Luar</option>';
        html += '<option value="obat_bebas"' + (AppTransaksi.filterTipe === 'obat_bebas' ? ' selected' : '') + '>Obat Bebas</option>';
        html += '<option value="tindakan_apotek"' + (AppTransaksi.filterTipe === 'tindakan_apotek' ? ' selected' : '') + '>Tindakan Apotek</option>';
        html += '</select></div>';
        html += '</div>';

        html += '<div id="trx-list"></div>';
        html += '</div>';
        return html;
    },

    /* =========================================
       INIT
       ========================================= */
    init: function() {
        AppTransaksi.load();

        var dateEl = document.getElementById('trx-filter-date');
        if (dateEl) {
            dateEl.addEventListener('change', function() {
                AppTransaksi.filterDate = dateEl.value;
                AppTransaksi.load();
            });
        }

        var tipeEl = document.getElementById('trx-filter-tipe');
        if (tipeEl) {
            tipeEl.addEventListener('change', function() {
                AppTransaksi.filterTipe = tipeEl.value;
                AppTransaksi.renderList();
            });
        }
    },

    /* =========================================
       LOAD
       ========================================= */
    load: function() {
        Utils.showLoading('trx-list');
        var query = db.collection('transaksi').where('tanggal', '==', AppTransaksi.filterDate).orderBy('createdAt', 'desc');

        query.get()
            .then(function(snap) {
                AppTransaksi.data = [];
                snap.forEach(function(doc) {
                    var d = doc.data();
                    d.id = doc.id;
                    AppTransaksi.data.push(d);
                });
                AppTransaksi.renderList();
            })
            .catch(function(err) {
                Utils.toast('Gagal memuat: ' + err.message, 'error');
            });
    },

    /* =========================================
       RENDER LIST
       ========================================= */
    renderList: function() {
        var container = document.getElementById('trx-list');
        if (!container) return;

        var list = AppTransaksi.data;
        if (AppTransaksi.filterTipe !== 'semua') {
            list = list.filter(function(t) { return t.tipe === AppTransaksi.filterTipe; });
        }

        if (list.length === 0) {
            container.innerHTML = '<div class="bg-white rounded-xl border border-gray-200 p-8 text-center"><p class="text-sm text-gray-400">Belum ada transaksi</p></div>';
            return;
        }

        var tipeBadges = {
            'resep_klinik':    '<span class="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">Resep Klinik</span>',
            'resep_luar':      '<span class="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Resep Luar</span>',
            'obat_bebas':      '<span class="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">Obat Bebas</span>',
            'tindakan_apotek': '<span class="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">Tindakan Apotek</span>'
        };
        var metodeLabels = { 'tunai': 'Tunai', 'transfer': 'Transfer', 'qris': 'QRIS' };

        var html = '<div class="space-y-2">';
        for (var i = 0; i < list.length; i++) {
            var tr = list[i];
            html += '<div class="bg-white rounded-xl border border-gray-200 p-4">';
            html += '<div class="flex items-start justify-between gap-3">';
            html += '<div class="flex-1 min-w-0">';
            html += '<div class="flex items-center gap-2 flex-wrap">';
            html += '<span class="text-xs text-gray-400 font-mono">' + Utils.escapeHtml(tr.noTransaksi || '-') + '</span>';
            html += (tipeBadges[tr.tipe] || '');
            html += '</div>';
            if (tr.pasienNama) {
                html += '<p class="text-sm font-medium text-gray-800 mt-1">' + Utils.escapeHtml(tr.pasienNama) + '</p>';
            }
            html += '<p class="text-xs text-gray-500 mt-0.5">' + (metodeLabels[tr.metodeBayar] || tr.metodeBayar || '-') + ' · ' + Utils.escapeHtml(tr.kasirNama || '-') + '</p>';
            html += '</div>';
            html += '<div class="text-right flex-shrink-0">';
            html += '<p class="text-sm font-bold text-gray-800">' + Utils.formatRupiah(tr.totalBayar || 0) + '</p>';
            html += '<button onclick="AppTransaksi.cetakKwitansi(\'' + tr.id + '\')" class="mt-1 text-xs text-primary-600 hover:text-primary-700 font-medium">Cetak Kwitansi</button>';
            html += '</div></div></div>';
        }
        html += '</div>';
        html += '<p class="text-xs text-gray-400 mt-2 text-right">Total: ' + list.length + ' transaksi</p>';

        container.innerHTML = html;
    },

    /* =========================================
       PROSES RESEP — Step 1: Pilih resep
       ========================================= */
    renderSelectResep: function() {
        AppTransaksi.mode = 'select-resep';
        var container = document.getElementById('main-content');

        var html = '<div class="page-enter">';
        html += '<div class="flex items-center gap-3 mb-4">';
        html += '<button onclick="window.location.hash=\'#transaksi\'" class="p-2 hover:bg-gray-100 rounded-lg"><i data-lucide="arrow-left" class="w-5 h-5"></i></button>';
        html += '<div>';
        html += '<h2 class="text-xl font-bold text-gray-800">Pilih Resep</h2>';
        html += '<p class="text-sm text-gray-500">Pilih resep yang menunggu untuk diproses</p>';
        html += '</div></div>';
        html += '<div id="resep-pending-list"><div class="flex justify-center py-10"><div class="spinner"></div></div></div>';
        html += '</div>';

        container.innerHTML = html;
        lucide.createIcons();

        db.collection('resep').where('status', '==', 'menunggu').orderBy('createdAt', 'desc').get()
            .then(function(snap) {
                var pendingList = [];
                snap.forEach(function(doc) {
                    var d = doc.data();
                    d.id = doc.id;
                    pendingList.push(d);
                });

                var listContainer = document.getElementById('resep-pending-list');
                if (!listContainer) return;

                if (pendingList.length === 0) {
                    listContainer.innerHTML = '<div class="bg-white rounded-xl border border-gray-200 p-8 text-center"><p class="text-sm text-gray-400">Tidak ada resep yang menunggu diproses</p></div>';
                    return;
                }

                var listHtml = '<div class="space-y-2">';
                for (var i = 0; i < pendingList.length; i++) {
                    var r = pendingList[i];
                    var tipeLabel = (r.tipe === 'resep_luar') ? 'Resep Luar' : 'Resep Klinik';
                    var tipeClass = (r.tipe === 'resep_luar') ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700';
                    var obatNames = [];
                    if (r.items) {
                        for (var j = 0; j < r.items.length; j++) {
                            obatNames.push(r.items[j].namaObat);
                        }
                    }

                    listHtml += '<div class="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 transition cursor-pointer" onclick="AppTransaksi.openProsesResepForm(\'' + r.id + '\')">';
                    listHtml += '<div class="flex items-start justify-between gap-3">';
                    listHtml += '<div class="flex-1 min-w-0">';
                    listHtml += '<div class="flex items-center gap-2 flex-wrap">';
                    listHtml += '<p class="font-semibold text-gray-800">' + Utils.escapeHtml(r.pasienNama || '-') + '</p>';
                    listHtml += '<span class="text-xs px-2 py-0.5 rounded-full font-medium ' + tipeClass + '">' + tipeLabel + '</span>';
                    listHtml += '</div>';
                    if (r.dokterNama) listHtml += '<p class="text-xs text-gray-500 mt-0.5">Dokter: ' + Utils.escapeHtml(r.dokterNama) + '</p>';
                    if (r.dokterPemberiResep) listHtml += '<p class="text-xs text-gray-500 mt-0.5">Dr. Pemberi: ' + Utils.escapeHtml(r.dokterPemberiResep) + '</p>';
                    if (obatNames.length > 0) listHtml += '<p class="text-xs text-gray-500 mt-1 truncate">' + Utils.escapeHtml(obatNames.join(', ')) + '</p>';
                    listHtml += '</div>';
                    listHtml += '<div class="text-right flex-shrink-0">';
                    listHtml += '<p class="text-sm font-bold text-gray-800">' + Utils.formatRupiah(r.totalBayar || 0) + '</p>';
                    listHtml += '</div></div></div>';
                }
                listHtml += '</div>';

                listContainer.innerHTML = listHtml;
            })
            .catch(function(err) {
                Utils.toast('Gagal memuat: ' + err.message, 'error');
            });
    },

    /* =========================================
       PROSES RESEP — Step 2: Form proses
       ========================================= */
    openProsesResepForm: function(resepId) {
        AppObat.ensureObatLoaded().then(function() {
            db.collection('resep').doc(resepId).get()
                .then(function(doc) {
                    if (!doc.exists) {
                        Utils.toast('Resep tidak ditemukan', 'error');
                        return;
                    }
                    var r = doc.data();
                    r.id = doc.id;

                    // Cek stok untuk setiap item
                    var items = r.items || [];
                    var semuaCukup = true;
                    for (var i = 0; i < items.length; i++) {
                        var obat = AppObat.getById(items[i].obatId);
                        items[i].currentStok = obat ? (obat.stok || 0) : 0;
                        items[i].stokCukup = items[i].currentStok >= items[i].jumlah;
                        if (!items[i].stokCukup) semuaCukup = false;
                    }

                    AppTransaksi.selectedResep = r;
                    AppTransaksi.renderProsesResepForm(r, items, semuaCukup);
                })
                .catch(function(err) {
                    Utils.toast('Gagal memuat resep: ' + err.message, 'error');
                });
        });
    },

    renderProsesResepForm: function(r, items, semuaCukup) {
        var html = '<div class="p-6">';
        html += '<div class="flex items-center justify-between mb-5">';
        html += '<h3 class="text-lg font-semibold text-gray-800">Proses Resep</h3>';
        html += '<button onclick="Utils.closeModal()" class="p-1.5 hover:bg-gray-100 rounded-lg"><i data-lucide="x" class="w-5 h-5 text-gray-400"></i></button>';
        html += '</div>';

        // Info resep
        html += '<div class="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-700 mb-4">';
        html += '<strong>' + Utils.escapeHtml(r.pasienNama || '-') + '</strong>';
        if (r.dokterNama) html += ' · Dokter: ' + Utils.escapeHtml(r.dokterNama);
        if (r.dokterPemberiResep) html += ' · Dr. Pemberi: ' + Utils.escapeHtml(r.dokterPemberiResep);
        html += '</div>';

        if (!semuaCukup) {
            html += '<div class="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 mb-4">';
            html += '<strong>Peringatan Stok:</strong> Beberapa obat stoknya tidak mencukupi. Periksa detail di bawah.';
            html += '</div>';
        }

        // Tabel item
        html += '<div class="border border-gray-200 rounded-lg overflow-hidden mb-4">';
        html += '<div class="bg-gray-50 px-3 py-2 grid grid-cols-12 gap-1 text-xs font-semibold text-gray-500 uppercase">';
        html += '<div class="col-span-5">Obat</div>';
        html += '<div class="col-span-2">Dosis</div>';
        html += '<div class="col-span-1">Qty</div>';
        html += '<div class="col-span-2">Harga</div>';
        html += '<div class="col-span-2 text-right">Stok</div>';
        html += '</div>';
        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            var stokClass = it.stokCukup ? 'text-green-600' : 'text-red-600 font-bold';
            html += '<div class="px-3 py-2 grid grid-cols-12 gap-1 text-sm border-t border-gray-100 items-center">';
            html += '<div class="col-span-5 truncate">' + Utils.escapeHtml(it.namaObat) + '</div>';
            html += '<div class="col-span-2 text-xs text-gray-500">' + Utils.escapeHtml(it.dosis || '') + '</div>';
            html += '<div class="col-span-1">' + it.jumlah + '</div>';
            html += '<div class="col-span-2 text-gray-600">' + Utils.formatRupiah(it.hargaJual) + '</div>';
            html += '<div class="col-span-2 text-right ' + stokClass + '">' + it.currentStok + '</div>';
            html += '</div>';
        }
        html += '</div>';

        // Ringkasan
        html += '<div class="bg-gray-50 rounded-lg p-3 space-y-1 text-sm mb-4">';
        html += '<div class="flex justify-between"><span class="text-gray-500">Subtotal Obat</span><span>' + Utils.formatRupiah(r.subtotalObat || 0) + '</span></div>';
        html += '<div class="flex justify-between"><span class="text-gray-500">Jasa Resep</span><span>' + Utils.formatRupiah(r.jasaResep || 0) + '</span></div>';
        html += '<div class="flex justify-between"><span class="text-gray-500">Subtotal</span><span>' + Utils.formatRupiah((r.subtotalObat || 0) + (r.jasaResep || 0)) + '</span></div>';
        html += '<div class="flex justify-between"><span class="text-gray-500">Pembulatan</span><span class="text-amber-600">+' + Utils.formatRupiah(r.pembulatan || 0) + '</span></div>';
        html += '<hr class="border-gray-200">';
        html += '<div class="flex justify-between font-bold text-base"><span>Total Bayar</span><span class="text-primary-700">' + Utils.formatRupiah(r.totalBayar || 0) + '</span></div>';
        html += '</div>';

        // Metode bayar
        html += '<div class="mb-4">';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran *</label>';
        html += '<select id="trx-metode" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '<option value="tunai">Tunai</option>';
        html += '<option value="transfer">Transfer</option>';
        html += '<option value="qris">QRIS</option>';
        html += '</select></div>';

        // Tombol
        html += '<div class="flex justify-end gap-2">';
        html += '<button type="button" onclick="Utils.closeModal()" class="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>';
        html += '<button onclick="AppTransaksi.prosesResep()" id="btn-proses-resep" class="px-6 py-2.5 text-sm bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition">Proses & Bayar</button>';
        html += '</div>';

        html += '</div>';

        Utils.openModal(html);
    },

    /* =========================================
       PROSES RESEP — Simpan
       ========================================= */
    prosesResep: function() {
        var btn = document.getElementById('btn-proses-resep');
        btn.disabled = true;
        btn.textContent = 'Memproses...';

        var r = AppTransaksi.selectedResep;
        if (!r) {
            btn.disabled = false;
            btn.textContent = 'Proses & Bayar';
            return;
        }

        var metodeBayar = document.getElementById('trx-metode').value;
        var tanggal = r.tanggal || Utils.today();

        // Siapkan data stok yang akan dikurangi
        var stockItems = [];
        if (r.items) {
            for (var i = 0; i < r.items.length; i++) {
                stockItems.push({
                    obatId: r.items[i].obatId,
                    jumlah: r.items[i].jumlah || 0
                });
            }
        }

        var obj = {
            noTransaksi: '',
            tanggal: tanggal,
            tipe: r.tipe,
            pasienId: r.pasienId || '',
            pasienNama: r.pasienNama || '',
            resepId: r.id,
            jasaResep: r.jasaResep || 0,
            items: r.items || [],
            tindakanItems: [],
            subtotalObat: r.subtotalObat || 0,
            subtotalTindakan: 0,
            pembulatan: r.pembulatan || 0,
            totalBayar: r.totalBayar || 0,
            metodeBayar: metodeBayar,
            statusBayar: 'lunas',
            kasirId: App.currentUser.uid,
            kasirNama: App.currentUser.nama,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (r.dokterNama) obj.dokterNama = r.dokterNama;
        if (r.dokterPemberiResep) obj.dokterPemberiResep = r.dokterPemberiResep;

        // Generate nomor transaksi
        db.collection('transaksi').where('tanggal', '==', tanggal).get()
            .then(function(snap) {
                obj.noTransaksi = Utils.generateNomorTransaksi('TRX', snap.size);

                var batch = db.batch();

                // 1. Simpan transaksi
                var trxRef = db.collection('transaksi').doc();
                batch.set(trxRef, obj);

                // 2. Update status resep
                batch.update(db.collection('resep').doc(r.id), { status: 'diserahkan' });

                // 3. Kurangi stok obat
                for (var j = 0; j < stockItems.length; j++) {
                    var qty = Math.max(0, stockItems[j].jumlah);
                    if (qty > 0) {
                        batch.update(db.collection('obat').doc(stockItems[j].obatId), {
                            stok: firebase.firestore.FieldValue.increment(-qty)
                        });
                    }
                }

                return batch.commit();
            })
            .then(function() {
                Utils.toast('Resep berhasil diproses', 'success');
                Utils.closeModal();
                window.location.hash = '#transaksi';
            })
            .catch(function(err) {
                Utils.toast('Gagal: ' + err.message, 'error');
                btn.disabled = false;
                btn.textContent = 'Proses & Bayar';
            });
    },

    /* =========================================
       OBAT BEBAS — Form
       ========================================= */
    renderFormObatBebas: function() {
        AppObat.ensureObatLoaded().then(function() {
            AppTransaksi.formItems = [];
            AppTransaksi.renderObatBebasForm();
        });
    },

    renderObatBebasForm: function() {
        var html = '<div class="p-6">';
        html += '<div class="flex items-center justify-between mb-5">';
        html += '<h3 class="text-lg font-semibold text-gray-800">Obat Bebas</h3>';
        html += '<button onclick="Utils.closeModal()" class="p-1.5 hover:bg-gray-100 rounded-lg"><i data-lucide="x" class="w-5 h-5 text-gray-400"></i></button>';
        html += '</div>';

        html += '<form id="form-obat-bebas" class="space-y-4">';

        // Pasien (opsional)
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Nama Pasien (opsional)</label>';
        html += '<input type="text" id="fob-pasien" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Kosongkan jika tidak diketahui">';
        html += '</div>';

        // Tanggal
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>';
        html += '<input type="date" id="fob-tanggal" value="' + Utils.today() + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '</div>';

        // Item obat
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-2">Obat *</label>';
        html += '<div id="fob-items-container" class="space-y-2"></div>';
        html += '<button type="button" onclick="AppTransaksi.tambahObatBebasItem()" class="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"><i data-lucide="plus-circle" class="w-4 h-4"></i> Tambah Obat</button>';
        html += '</div>';

        // Total
        html += '<div class="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">';
        html += '<div class="flex justify-between"><span class="text-gray-500">Subtotal</span><span id="fob-subtotal" class="font-medium">Rp 0</span></div>';
        html += '<div class="flex justify-between"><span class="text-gray-500">Pembulatan</span><span id="fob-pembulatan" class="font-medium text-amber-600">Rp 0</span></div>';
        html += '<hr class="border-gray-200">';
        html += '<div class="flex justify-between text-base font-bold"><span>Total Bayar</span><span id="fob-total" class="text-primary-700">Rp 0</span></div>';
        html += '</div>';

        // Metode bayar
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran *</label>';
        html += '<select id="fob-metode" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '<option value="tunai">Tunai</option>';
        html += '<option value="transfer">Transfer</option>';
        html += '<option value="qris">QRIS</option>';
        html += '</select></div>';

        // Tombol
        html += '<div class="flex justify-end gap-2 pt-2">';
        html += '<button type="button" onclick="Utils.closeModal()" class="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>';
        html += '<button type="submit" id="btn-simpan-obat-bebas" class="px-6 py-2.5 text-sm bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition">Simpan & Bayar</button>';
        html += '</div>';

        html += '</form></div>';

        Utils.openModal(html);
        AppTransaksi.tambahObatBebasItem();
        AppTransaksi.hitungTotalObatBebas();

        document.getElementById('form-obat-bebas').addEventListener('submit', function(e) {
            e.preventDefault();
            AppTransaksi.simpanObatBebas();
        });
    },

    tambahObatBebasItem: function() {
        var index = AppTransaksi.formItems.length;
        AppTransaksi.formItems.push({
            obatId: '',
            namaObat: '',
            jumlah: 1,
            satuan: '',
            hargaBeli: 0,
            hargaJual: 0,
            subtotal: 0
        });
        AppTransaksi.renderObatBebasItemRow(index);
    },

    renderObatBebasItemRow: function(index) {
        var container = document.getElementById('fob-items-container');
        if (!container) return;

        var item = AppTransaksi.formItems[index];

        var html = '<div id="fobi-' + index + '" class="border border-gray-200 rounded-lg p-3 bg-white relative">';
        html += '<button type="button" onclick="AppTransaksi.removeObatBebasItem(' + index + ')" class="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-0.5"><i data-lucide="x-circle" class="w-4 h-4"></i></button>';

        html += '<div class="relative mb-2 pr-6">';
        html += '<i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"></i>';
        html += '<input type="text" id="fobi-search-' + index + '" value="' + Utils.escapeHtml(item.namaObat) + '" placeholder="Ketik nama obat..." class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm" autocomplete="off" onfocus="AppTransaksi.filterObatBebasDropdown(' + index + ')" oninput="AppTransaksi.filterObatBebasDropdown(' + index + ')">';
        html += '<div id="fobi-dropdown-' + index + '" class="hidden absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto"></div>';
        html += '</div>';

        html += '<div class="grid grid-cols-3 gap-2">';
        html += '<div>';
        html += '<label class="block text-xs text-gray-500 mb-0.5">Jumlah</label>';
        html += '<input type="number" id="fobi-jumlah-' + index + '" value="' + item.jumlah + '" min="1" class="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" oninput="AppTransaksi.updateObatBebasJumlah(' + index + ')">';
        html += '</div>';
        html += '<div>';
        html += '<label class="block text-xs text-gray-500 mb-0.5">Harga Jual</label>';
        html += '<input type="number" id="fobi-harga-' + index + '" value="' + item.hargaJual + '" min="0" class="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" oninput="AppTransaksi.updateObatBebasHarga(' + index + ')">';
        html += '<p id="fobi-stok-' + index + '" class="text-xs text-gray-400 mt-0.5"></p>';
        html += '</div>';
        html += '<div class="flex items-end">';
        html += '<p id="fobi-sub-' + index + '" class="text-sm font-medium text-gray-800">' + Utils.formatRupiah(item.subtotal) + '</p>';
        html += '</div>';
        html += '</div>';

        html += '<input type="hidden" id="fobi-obat-id-' + index + '" value="' + (item.obatId || '') + '">';
        html += '<input type="hidden" id="fobi-hpp-' + index + '" value="' + (item.hargaBeli || 0) + '">';
        html += '<input type="hidden" id="fobi-satuan-' + index + '" value="' + Utils.escapeHtml(item.satuan || '') + '">';
        html += '</div>';

        container.insertAdjacentHTML('beforeend', html);
        lucide.createIcons({ nodes: [container] });

        if (item.obatId) {
            var obat = AppObat.getById(item.obatId);
            if (obat) {
                var stokEl = document.getElementById('fobi-stok-' + index);
                if (stokEl) stokEl.textContent = 'Stok: ' + (obat.stok || 0) + ' ' + (obat.satuan || '');
            }
        }
    },

    filterObatBebasDropdown: function(index) {
        var dropdown = document.getElementById('fobi-dropdown-' + index);
        if (!dropdown) return;
        var searchEl = document.getElementById('fobi-search-' + index);
        if (!searchEl) return;
        var val = searchEl.value.trim().toLowerCase();
        if (!val) { dropdown.classList.add('hidden'); return; }

        var results = AppObat.data.filter(function(o) {
            return (o.namaObat && o.namaObat.toLowerCase().indexOf(val) !== -1)
                || (o.kodeObat && o.kodeObat.toLowerCase().indexOf(val) !== -1);
        }).slice(0, 6);

        if (results.length === 0) {
            dropdown.innerHTML = '<div class="px-3 py-2 text-sm text-gray-400">Tidak ditemukan</div>';
            dropdown.classList.remove('hidden');
            return;
        }

        var html = '';
        for (var i = 0; i < results.length; i++) {
            var o = results[i];
            html += '<button type="button" onclick="AppTransaksi.selectObatBebas(' + index + ',\'' + o.id + '\')" class="w-full text-left px-3 py-2 hover:bg-primary-50 text-sm border-b border-gray-50 last:border-0 transition">';
            html += '<div class="flex justify-between items-center gap-2">';
            html += '<div class="min-w-0"><p class="font-medium text-gray-800 truncate">' + Utils.escapeHtml(o.namaObat) + '</p>';
            html += '<p class="text-xs text-gray-500">Stok: ' + (o.stok || 0) + ' ' + Utils.escapeHtml(o.satuan || '') + '</p></div>';
            html += '<span class="text-xs text-primary-600 font-medium whitespace-nowrap">' + Utils.formatRupiah(o.hargaJual) + '</span>';
            html += '</div></button>';
        }
        dropdown.innerHTML = html;
        dropdown.classList.remove('hidden');
    },

    selectObatBebas: function(index, obatId) {
        var obat = AppObat.getById(obatId);
        if (!obat) return;

        AppTransaksi.formItems[index].obatId = obatId;
        AppTransaksi.formItems[index].namaObat = obat.namaObat;
        AppTransaksi.formItems[index].hargaBeli = obat.hargaBeli || 0;
        AppTransaksi.formItems[index].hargaJual = obat.hargaJual || 0;
        AppTransaksi.formItems[index].satuan = obat.satuan || '';
        AppTransaksi.formItems[index].subtotal = (obat.hargaJual || 0) * AppTransaksi.formItems[index].jumlah;

        var oldRow = document.getElementById('fobi-' + index);
        if (oldRow) oldRow.remove();
        AppTransaksi.renderObatBebasItemRow(index);
        AppTransaksi.hitungTotalObatBebas();
    },

    updateObatBebasJumlah: function(index) {
        var el = document.getElementById('fobi-jumlah-' + index);
        if (!el) return;
        var jumlah = Math.max(0, parseInt(el.value) || 0);
        AppTransaksi.formItems[index].jumlah = jumlah;
        AppTransaksi.formItems[index].subtotal = AppTransaksi.formItems[index].hargaJual * jumlah;
        var subEl = document.getElementById('fobi-sub-' + index);
        if (subEl) subEl.textContent = Utils.formatRupiah(AppTransaksi.formItems[index].subtotal);
        AppTransaksi.hitungTotalObatBebas();
    },

    updateObatBebasHarga: function(index) {
        var el = document.getElementById('fobi-harga-' + index);
        if (!el) return;
        var harga = Math.max(0, parseFloat(el.value) || 0);
        AppTransaksi.formItems[index].hargaJual = harga;
        AppTransaksi.formItems[index].subtotal = harga * AppTransaksi.formItems[index].jumlah;
        var subEl = document.getElementById('fobi-sub-' + index);
        if (subEl) subEl.textContent = Utils.formatRupiah(AppTransaksi.formItems[index].subtotal);
        AppTransaksi.hitungTotalObatBebas();
    },

    removeObatBebasItem: function(index) {
        var row = document.getElementById('fobi-' + index);
        if (row) row.remove();
        AppTransaksi.formItems[index] = null;
        AppTransaksi.hitungTotalObatBebas();
    },

    hitungTotalObatBebas: function() {
        var subtotal = 0;
        for (var i = 0; i < AppTransaksi.formItems.length; i++) {
            if (AppTransaksi.formItems[i] !== null) {
                subtotal += (AppTransaksi.formItems[i].subtotal || 0);
            }
        }
        var pembulatan = Utils.ceilingRibuan(subtotal) - subtotal;
        var total = subtotal + pembulatan;

        var el;
        el = document.getElementById('fob-subtotal');
        if (el) el.textContent = Utils.formatRupiah(subtotal);
        el = document.getElementById('fob-pembulatan');
        if (el) el.textContent = (pembulatan > 0 ? '+' : '') + Utils.formatRupiah(pembulatan);
        el = document.getElementById('fob-total');
        if (el) el.textContent = Utils.formatRupiah(total);
    },

    simpanObatBebas: function() {
        var btn = document.getElementById('btn-simpan-obat-bebas');
        btn.disabled = true;
        btn.textContent = 'Memproses...';

        // Validasi item
        var validItems = [];
        for (var i = 0; i < AppTransaksi.formItems.length; i++) {
            var item = AppTransaksi.formItems[i];
            if (item !== null && item.obatId && item.jumlah > 0) {
                validItems.push({
                    obatId: item.obatId,
                    namaObat: item.namaObat,
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
            btn.textContent = 'Simpan & Bayar';
            return;
        }

        var subtotalObat = 0;
        for (var j = 0; j < validItems.length; j++) {
            subtotalObat += validItems[j].subtotal;
        }
        var pembulatan = Utils.ceilingRibuan(subtotalObat) - subtotalObat;
        var totalBayar = subtotalObat + pembulatan;
        var tanggal = document.getElementById('fob-tanggal').value;
        var metodeBayar = document.getElementById('fob-metode').value;

        var obj = {
            noTransaksi: '',
            tanggal: tanggal,
            tipe: 'obat_bebas',
            pasienId: '',
            pasienNama: document.getElementById('fob-pasien').value.trim(),
            resepId: '',
            jasaResep: 0,
            items: validItems,
            tindakanItems: [],
            subtotalObat: subtotalObat,
            subtotalTindakan: 0,
            pembulatan: pembulatan,
            totalBayar: totalBayar,
            metodeBayar: metodeBayar,
            statusBayar: 'lunas',
            kasirId: App.currentUser.uid,
            kasirNama: App.currentUser.nama,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection('transaksi').where('tanggal', '==', tanggal).get()
            .then(function(snap) {
                obj.noTransaksi = Utils.generateNomorTransaksi('TRX', snap.size);

                var batch = db.batch();
                var trxRef = db.collection('transaksi').doc();
                batch.set(trxRef, obj);

                for (var k = 0; k < validItems.length; k++) {
                    var qty = Math.max(0, validItems[k].jumlah);
                    if (qty > 0) {
                        batch.update(db.collection('obat').doc(validItems[k].obatId), {
                            stok: firebase.firestore.FieldValue.increment(-qty)
                        });
                    }
                }

                return batch.commit();
            })
            .then(function() {
                Utils.toast('Transaksi obat bebas berhasil', 'success');
                Utils.closeModal();
                AppTransaksi.load();
                AppObat.load();
            })
            .catch(function(err) {
                Utils.toast('Gagal: ' + err.message, 'error');
                btn.disabled = false;
                btn.textContent = 'Simpan & Bayar';
            });
    },

    /* =========================================
       TINDAKAN APOTEK — Form
       ========================================= */
    renderFormTindakanApotek: function() {
        // Load master tindakan apotek
        db.collection('masterTindakan').where('kategori', '==', 'apotek').where('aktif', '==', true).orderBy('nama').get()
            .then(function(snap) {
                AppTransaksi.masterTindakanApotek = [];
                snap.forEach(function(doc) {
                    var d = doc.data();
                    d.id = doc.id;
                    AppTransaksi.masterTindakanApotek.push(d);
                });
                AppTransaksi.formTindakanItems = [];
                AppTransaksi.renderTindakanApotekForm();
            })
            .catch(function(err) {
                Utils.toast('Gagal memuat master tindakan: ' + err.message, 'error');
            });
    },

    renderTindakanApotekForm: function() {
        var html = '<div class="p-6">';
        html += '<div class="flex items-center justify-between mb-5">';
        html += '<h3 class="text-lg font-semibold text-gray-800">Tindakan Apotek</h3>';
        html += '<button onclick="Utils.closeModal()" class="p-1.5 hover:bg-gray-100 rounded-lg"><i data-lucide="x" class="w-5 h-5 text-gray-400"></i></button>';
        html += '</div>';

        html += '<form id="form-tindakan-apotek" class="space-y-4">';

        // Pasien
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Nama Pasien (opsional)</label>';
        html += '<input type="text" id="fta-pasien" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Kosongkan jika tidak diketahui">';
        html += '</div>';

        // Tanggal
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>';
        html += '<input type="date" id="fta-tanggal" value="' + Utils.today() + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '</div>';

        // Tindakan items
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-2">Tindakan *</label>';
        html += '<div id="fta-items-container" class="space-y-2"></div>';
        html += '<button type="button" onclick="AppTransaksi.tambahTindakanApotekItem()" class="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"><i data-lucide="plus-circle" class="w-4 h-4"></i> Tambah Tindakan</button>';
        html += '</div>';

        // Total
        html += '<div class="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">';
        html += '<div class="flex justify-between"><span class="text-gray-500">Subtotal Tindakan</span><span id="fta-subtotal" class="font-medium">Rp 0</span></div>';
        html += '<div class="flex justify-between"><span class="text-gray-500">Pembulatan</span><span id="fta-pembulatan" class="font-medium text-amber-600">Rp 0</span></div>';
        html += '<hr class="border-gray-200">';
        html += '<div class="flex justify-between text-base font-bold"><span>Total Bayar</span><span id="fta-total" class="text-primary-700">Rp 0</span></div>';
        html += '</div>';

        // Metode bayar
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran *</label>';
        html += '<select id="fta-metode" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '<option value="tunai">Tunai</option>';
        html += '<option value="transfer">Transfer</option>';
        html += '<option value="qris">QRIS</option>';
        html += '</select></div>';

        // Tombol
        html += '<div class="flex justify-end gap-2 pt-2">';
        html += '<button type="button" onclick="Utils.closeModal()" class="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>';
        html += '<button type="submit" id="btn-simpan-tindakan-apotek" class="px-6 py-2.5 text-sm bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition">Simpan & Bayar</button>';
        html += '</div>';

        html += '</form></div>';

        Utils.openModal(html);
        AppTransaksi.tambahTindakanApotekItem();
        AppTransaksi.hitungTotalTindakanApotek();

        document.getElementById('form-tindakan-apotek').addEventListener('submit', function(e) {
            e.preventDefault();
            AppTransaksi.simpanTindakanApotek();
        });
    },

    tambahTindakanApotekItem: function() {
        var index = AppTransaksi.formTindakanItems.length;
        AppTransaksi.formTindakanItems.push({
            tindakanId: '',
            nama: '',
            hargaJual: 0,
            modal: 0,
            tuslah: 0,
            petugasNama: '',
            consumables: []
        });
        AppTransaksi.renderTindakanApotekItemRow(index);
    },

    renderTindakanApotekItemRow: function(index) {
        var container = document.getElementById('fta-items-container');
        if (!container) return;

        var item = AppTransaksi.formTindakanItems[index];

        var html = '<div id="ftai-' + index + '" class="border border-gray-200 rounded-lg p-3 bg-white relative">';
        html += '<button type="button" onclick="AppTransaksi.removeTindakanApotekItem(' + index + ')" class="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-0.5"><i data-lucide="x-circle" class="w-4 h-4"></i></button>';

        // Pilih tindakan
        html += '<div class="mb-2 pr-6">';
        html += '<select id="ftai-tindakan-' + index + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onchange="AppTransaksi.selectTindakanApotek(' + index + ')">';
        html += '<option value="">-- Pilih Tindakan --</option>';
        for (var t = 0; t < AppTransaksi.masterTindakanApotek.length; t++) {
            var mt = AppTransaksi.masterTindakanApotek[t];
            var sel = (item.tindakanId === mt.id) ? ' selected' : '';
            html += '<option value="' + mt.id + '"' + sel + '>' + Utils.escapeHtml(mt.nama) + ' — ' + Utils.formatRupiah(mt.hargaJual) + '</option>';
        }
        html += '</select></div>';

        // Info & petugas
        html += '<div class="grid grid-cols-3 gap-2">';
        html += '<div>';
        html += '<label class="block text-xs text-gray-500 mb-0.5">Tuslah</label>';
        html += '<p id="ftai-tuslah-' + index + '" class="text-sm font-medium text-green-600">' + Utils.formatRupiah(item.tuslah) + '</p>';
        html += '</div>';
        html += '<div>';
        html += '<label class="block text-xs text-gray-500 mb-0.5">Petugas</label>';
        html += '<input type="text" id="ftai-petugas-' + index + '" value="' + Utils.escapeHtml(item.petugasNama || '') + '" class="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" placeholder="Nama petugas" oninput="AppTransaksi.updateTindakanApotekPetugas(' + index + ')">';
        html += '</div>';
        html += '<div class="flex items-end">';
        html += '<p id="ftai-sub-' + index + '" class="text-sm font-medium text-gray-800">' + Utils.formatRupiah(item.hargaJual) + '</p>';
        html += '</div>';
        html += '</div>';

        html += '<input type="hidden" id="ftai-modal-' + index + '" value="' + (item.modal || 0) + '">';
        html += '<input type="hidden" id="ftai-jual-' + index + '" value="' + (item.hargaJual || 0) + '">';
        html += '<input type="hidden" id="ftai-consumables-' + index + '" value="">';

        html += '</div>';

        container.insertAdjacentHTML('beforeend', html);
        lucide.createIcons({ nodes: [container] });
    },

    selectTindakanApotek: function(index) {
        var selEl = document.getElementById('ftai-tindakan-' + index);
        if (!selEl) return;
        var tindakanId = selEl.value;
        var mt = null;
        for (var i = 0; i < AppTransaksi.masterTindakanApotek.length; i++) {
            if (AppTransaksi.masterTindakanApotek[i].id === tindakanId) {
                mt = AppTransaksi.masterTindakanApotek[i];
                break;
            }
        }

        if (mt) {
            AppTransaksi.formTindakanItems[index].tindakanId = mt.id;
            AppTransaksi.formTindakanItems[index].nama = mt.nama;
            AppTransaksi.formTindakanItems[index].hargaJual = mt.hargaJual || 0;
            AppTransaksi.formTindakanItems[index].modal = mt.modal || 0;
            AppTransaksi.formTindakanItems[index].tuslah = (mt.hargaJual || 0) - (mt.modal || 0);
            AppTransaksi.formTindakanItems[index].consumables = (mt.consumables && Array.isArray(mt.consumables)) ? mt.consumables : [];
        } else {
            AppTransaksi.formTindakanItems[index].tindakanId = '';
            AppTransaksi.formTindakanItems[index].nama = '';
            AppTransaksi.formTindakanItems[index].hargaJual = 0;
            AppTransaksi.formTindakanItems[index].modal = 0;
            AppTransaksi.formTindakanItems[index].tuslah = 0;
            AppTransaksi.formTindakanItems[index].consumables = [];
        }

        var tuslahEl = document.getElementById('ftai-tuslah-' + index);
        if (tuslahEl) tuslahEl.textContent = Utils.formatRupiah(AppTransaksi.formTindakanItems[index].tuslah);
        var subEl = document.getElementById('ftai-sub-' + index);
        if (subEl) subEl.textContent = Utils.formatRupiah(AppTransaksi.formTindakanItems[index].hargaJual);
        var modalEl = document.getElementById('ftai-modal-' + index);
        if (modalEl) modalEl.value = AppTransaksi.formTindakanItems[index].modal;
        var jualEl = document.getElementById('ftai-jual-' + index);
        if (jualEl) jualEl.value = AppTransaksi.formTindakanItems[index].hargaJual;

        // Simpan consumables sebagai JSON string di hidden field
        var consEl = document.getElementById('ftai-consumables-' + index);
        if (consEl) consEl.value = JSON.stringify(AppTransaksi.formTindakanItems[index].consumables);

        AppTransaksi.hitungTotalTindakanApotek();
    },

    updateTindakanApotekPetugas: function(index) {
        var el = document.getElementById('ftai-petugas-' + index);
        if (el) {
            AppTransaksi.formTindakanItems[index].petugasNama = el.value.trim();
        }
    },

    removeTindakanApotekItem: function(index) {
        var row = document.getElementById('ftai-' + index);
        if (row) row.remove();
        AppTransaksi.formTindakanItems[index] = null;
        AppTransaksi.hitungTotalTindakanApotek();
    },

    hitungTotalTindakanApotek: function() {
        var subtotal = 0;
        for (var i = 0; i < AppTransaksi.formTindakanItems.length; i++) {
            if (AppTransaksi.formTindakanItems[i] !== null) {
                subtotal += (AppTransaksi.formTindakanItems[i].hargaJual || 0);
            }
        }
        var pembulatan = Utils.ceilingRibuan(subtotal) - subtotal;
        var total = subtotal + pembulatan;

        var el;
        el = document.getElementById('fta-subtotal');
        if (el) el.textContent = Utils.formatRupiah(subtotal);
        el = document.getElementById('fta-pembulatan');
        if (el) el.textContent = (pembulatan > 0 ? '+' : '') + Utils.formatRupiah(pembulatan);
        el = document.getElementById('fta-total');
        if (el) el.textContent = Utils.formatRupiah(total);
    },

    simpanTindakanApotek: function() {
        var btn = document.getElementById('btn-simpan-tindakan-apotek');
        btn.disabled = true;
        btn.textContent = 'Memproses...';

        var validItems = [];
        var stockItems = [];

        for (var i = 0; i < AppTransaksi.formTindakanItems.length; i++) {
            var item = AppTransaksi.formTindakanItems[i];
            if (item !== null && item.tindakanId) {
                validItems.push({
                    tindakanId: item.tindakanId,
                    nama: item.nama,
                    hargaJual: item.hargaJual,
                    modal: item.modal,
                    tuslah: item.tuslah,
                    petugasNama: item.petugasNama,
                    consumables: item.consumables || []
                });

                // Kumpulkan consumables untuk pengurangan stok
                if (item.consumables && Array.isArray(item.consumables)) {
                    for (var c = 0; c < item.consumables.length; c++) {
                        var cons = item.consumables[c];
                        if (cons.obatId) {
                            stockItems.push({
                                obatId: cons.obatId,
                                jumlah: cons.jumlah || 1
                            });
                        }
                    }
                }
            }
        }

        if (validItems.length === 0) {
            Utils.toast('Tambahkan minimal 1 tindakan', 'error');
            btn.disabled = false;
            btn.textContent = 'Simpan & Bayar';
            return;
        }

        var subtotalTindakan = 0;
        for (var j = 0; j < validItems.length; j++) {
            subtotalTindakan += validItems[j].hargaJual;
        }
        var pembulatan = Utils.ceilingRibuan(subtotalTindakan) - subtotalTindakan;
        var totalBayar = subtotalTindakan + pembulatan;
        var tanggal = document.getElementById('fta-tanggal').value;
        var metodeBayar = document.getElementById('fta-metode').value;

        var obj = {
            noTransaksi: '',
            tanggal: tanggal,
            tipe: 'tindakan_apotek',
            pasienId: '',
            pasienNama: document.getElementById('fta-pasien').value.trim(),
            resepId: '',
            jasaResep: 0,
            items: [],
            tindakanItems: validItems,
            subtotalObat: 0,
            subtotalTindakan: subtotalTindakan,
            pembulatan: pembulatan,
            totalBayar: totalBayar,
            metodeBayar: metodeBayar,
            statusBayar: 'lunas',
            kasirId: App.currentUser.uid,
            kasirNama: App.currentUser.nama,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection('transaksi').where('tanggal', '==', tanggal).get()
            .then(function(snap) {
                obj.noTransaksi = Utils.generateNomorTransaksi('TRX', snap.size);

                var batch = db.batch();
                var trxRef = db.collection('transaksi').doc();
                batch.set(trxRef, obj);

                for (var k = 0; k < stockItems.length; k++) {
                    var qty = Math.max(0, stockItems[k].jumlah);
                    if (qty > 0) {
                        batch.update(db.collection('obat').doc(stockItems[k].obatId), {
                            stok: firebase.firestore.FieldValue.increment(-qty)
                        });
                    }
                }

                return batch.commit();
            })
            .then(function() {
                Utils.toast('Transaksi tindakan apotek berhasil', 'success');
                Utils.closeModal();
                AppTransaksi.load();
                AppObat.load();
            })
            .catch(function(err) {
                Utils.toast('Gagal: ' + err.message, 'error');
                btn.disabled = false;
                btn.textContent = 'Simpan & Bayar';
            });
    },

    /* =========================================
       CETAK KWITANSI
       ========================================= */
    cetakKwitansi: function(transaksiId) {
        // Cari di data lokal dulu
        var trx = null;
        for (var i = 0; i < AppTransaksi.data.length; i++) {
            if (AppTransaksi.data[i].id === transaksiId) {
                trx = AppTransaksi.data[i];
                break;
            }
        }

        if (trx) {
            AppTransaksi.doPrint(trx);
        } else {
            // Load dari Firestore
            db.collection('transaksi').doc(transaksiId).get()
                .then(function(doc) {
                    if (doc.exists) {
                        AppTransaksi.doPrint(doc.data());
                    } else {
                        Utils.toast('Data transaksi tidak ditemukan', 'error');
                    }
                })
                .catch(function(err) {
                    Utils.toast('Gagal memuat: ' + err.message, 'error');
                });
        }
    },

    doPrint: function(trx) {
        var p = App.pengaturan || {};
        var tipeLabels = {
            'resep_klinik': 'Resep Klinik',
            'resep_luar': 'Resep Luar',
            'obat_bebas': 'Obat Bebas',
            'tindakan_apotek': 'Tindakan Apotek'
        };
        var metodeLabels = { 'tunai': 'Tunai', 'transfer': 'Transfer', 'qris': 'QRIS' };

        var h = '';
        h += '<p style="text-align:center;font-weight:bold;font-size:12px;">' + Utils.escapeHtml(p.namaApotek || 'APOTEK') + '</p>';
        h += '<p style="text-align:center;font-size:9px;">' + Utils.escapeHtml(p.alamat || '') + '</p>';
        h += '<p style="text-align:center;font-size:9px;">Telp: ' + Utils.escapeHtml(p.telp || '') + '</p>';
        h += '<p style="text-align:center;">================================</p>';
        h += '<p>No     : ' + Utils.escapeHtml(trx.noTransaksi || '-') + '</p>';
        h += '<p>Tanggal: ' + Utils.formatTanggal(trx.tanggal) + '</p>';
        h += '<p>Kasir  : ' + Utils.escapeHtml(trx.kasirNama || '-') + '</p>';
        if (trx.pasienNama) h += '<p>Pasien : ' + Utils.escapeHtml(trx.pasienNama) + '</p>';
        h += '<p>Tipe   : ' + (tipeLabels[trx.tipe] || trx.tipe || '-') + '</p>';
        if (trx.dokterNama) h += '<p>Dokter : ' + Utils.escapeHtml(trx.dokterNama) + '</p>';
        if (trx.dokterPemberiResep) h += '<p>Dr.Pemberi: ' + Utils.escapeHtml(trx.dokterPemberiResep) + '</p>';
        h += '<p>--------------------------------</p>';

        // Item obat
        if (trx.items && trx.items.length > 0) {
            for (var i = 0; i < trx.items.length; i++) {
                var it = trx.items[i];
                h += '<p><strong>' + Utils.escapeHtml(it.namaObat) + '</strong></p>';
                h += '<p>  ' + Utils.escapeHtml(it.dosis || '-') + '  ' + it.jumlah + ' ' + Utils.escapeHtml(it.satuan || '') + '  @ ' + Utils.formatRupiah(it.hargaJual) + ' = ' + Utils.formatRupiah(it.subtotal) + '</p>';
            }
        }

        // Item tindakan
        if (trx.tindakanItems && trx.tindakanItems.length > 0) {
            for (var j = 0; j < trx.tindakanItems.length; j++) {
                var ti = trx.tindakanItems[j];
                h += '<p><strong>' + Utils.escapeHtml(ti.nama) + '</strong></p>';
                h += '<p>  Tuslah: ' + Utils.formatRupiah(ti.tuslah) + '</p>';
                if (ti.petugasNama) h += '<p>  Petugas: ' + Utils.escapeHtml(ti.petugasNama) + '</p>';
            }
        }

        h += '<p>--------------------------------</p>';

        if (trx.subtotalObat && trx.subtotalObat > 0) {
            h += '<p>Subtotal Obat    : ' + Utils.formatRupiah(trx.subtotalObat) + '</p>';
        }
        if (trx.subtotalTindakan && trx.subtotalTindakan > 0) {
            h += '<p>Subtotal Tindakan: ' + Utils.formatRupiah(trx.subtotalTindakan) + '</p>';
        }
        if (trx.jasaResep && trx.jasaResep > 0) {
            h += '<p>Jasa Resep       : ' + Utils.formatRupiah(trx.jasaResep) + '</p>';
        }
        if (trx.pembulatan && trx.pembulatan > 0) {
            h += '<p>Pembulatan       : ' + Utils.formatRupiah(trx.pembulatan) + '</p>';
        }

        h += '<p>================================</p>';
        h += '<p style="font-weight:bold;">TOTAL: ' + Utils.formatRupiah(trx.totalBayar || 0) + '</p>';
        h += '<p>================================</p>';
        h += '<p>Metode: ' + (metodeLabels[trx.metodeBayar] || trx.metodeBayar || '-') + '</p>';
        h += '<p style="text-align:center;margin-top:10px;">Terima Kasih</p>';

        // Buat elemen print
        var printDiv = document.createElement('div');
        printDiv.id = 'print-area';
        printDiv.innerHTML = h;
        document.body.appendChild(printDiv);

        window.print();

        setTimeout(function() {
            printDiv.remove();
        }, 1000);
    }
};
