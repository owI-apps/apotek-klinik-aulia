/**
 * pembelian.js
 * Pembelian obat dari supplier — CRUD + otomatis tambah stok
 */

window.AppPembelian = {

    data: [],
    filterDate: '',
    formItems: [],

    /* =========================================
       RENDER
       ========================================= */
    render: function() {
        AppPembelian.filterDate = Utils.today();

        var html = '<div class="page-enter">';

        html += '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">';
        html += '<div>';
        html += '<h2 class="text-xl font-bold text-gray-800">Pembelian</h2>';
        html += '<p class="text-sm text-gray-500">Pembelian obat dari supplier</p>';
        html += '</div>';
        html += '<button onclick="AppPembelian.renderFormTambah()" class="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-2 self-start"><i data-lucide="plus" class="w-4 h-4"></i> Tambah Pembelian</button>';
        html += '</div>';

        html += '<div class="mb-4">';
        html += '<label class="block text-xs text-gray-500 mb-1">Tanggal</label>';
        html += '<input type="date" id="beli-filter-date" value="' + AppPembelian.filterDate + '" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '</div>';

        html += '<div id="pembelian-list"></div>';
        html += '</div>';
        return html;
    },

    /* =========================================
       INIT
       ========================================= */
    init: function() {
        AppPembelian.load();

        var dateEl = document.getElementById('beli-filter-date');
        if (dateEl) {
            dateEl.addEventListener('change', function() {
                AppPembelian.filterDate = dateEl.value;
                AppPembelian.load();
            });
        }
    },

    /* =========================================
       LOAD
       ========================================= */
    load: function() {
        Utils.showLoading('pembelian-list');
        db.collection('pembelian').where('tanggal', '==', AppPembelian.filterDate).orderBy('createdAt', 'desc').get()
            .then(function(snap) {
                AppPembelian.data = [];
                snap.forEach(function(doc) {
                    var d = doc.data();
                    d.id = doc.id;
                    AppPembelian.data.push(d);
                });
                AppPembelian.renderList();
            })
            .catch(function(err) {
                Utils.toast('Gagal memuat: ' + err.message, 'error');
            });
    },

      /* =========================================
       RENDER LIST
       ========================================= */
    renderList: function() {
        var container = document.getElementById('pembelian-list');
        if (!container) return;

        if (AppPembelian.data.length === 0) {
            container.innerHTML = '<div class="bg-white rounded-xl border border-gray-200 p-8 text-center"><p class="text-sm text-gray-400">Belum ada pembelian</p></div>';
            return;
        }

        var html = '<div class="space-y-2">';
        for (var i = 0; i < AppPembelian.data.length; i++) {
            var b = AppPembelian.data[i];
            var statusClass = (b.statusBayar === 'lunas') ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700';
            var statusLabel = (b.statusBayar === 'lunas') ? 'Lunas' : 'Belum';
            var safeNo = (b.noPembelian || '-').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

            html += '<div class="bg-white rounded-xl border border-gray-200 p-4">';
            html += '<div class="flex items-start justify-between gap-3">';
            html += '<div class="flex-1 min-w-0">';
            html += '<div class="flex items-center gap-2 flex-wrap">';
            html += '<span class="text-xs text-gray-400 font-mono">' + Utils.escapeHtml(b.noPembelian || '-') + '</span>';
            html += '<span class="text-xs px-2 py-0.5 rounded-full font-medium ' + statusClass + '">' + statusLabel + '</span>';
            html += '</div>';
            html += '<p class="text-sm font-medium text-gray-800 mt-1">' + Utils.escapeHtml(b.supplierNama || '-') + '</p>';

            if (b.items && b.items.length > 0) {
                var obatNames = [];
                for (var j = 0; j < Math.min(b.items.length, 3); j++) {
                    obatNames.push(b.items[j].namaObat);
                }
                var suffix = b.items.length > 3 ? ' +' + (b.items.length - 3) + ' lainnya' : '';
                html += '<p class="text-xs text-gray-500 mt-0.5 truncate">' + Utils.escapeHtml(obatNames.join(', ')) + suffix + '</p>';
            }

            html += '</div>';
            html += '<div class="text-right flex-shrink-0">';
            html += '<p class="text-sm font-bold text-gray-800">' + Utils.formatRupiah(b.total || 0) + '</p>';
            html += '<button onclick="AppPembelian.hapus(\'' + b.id + '\',\'' + safeNo + '\')" class="mt-1 text-xs text-red-400 hover:text-red-600 font-medium">Hapus</button>';
            html += '</div></div></div>';
        }
        html += '</div>';
        html += '<p class="text-xs text-gray-400 mt-2 text-right">Total: ' + AppPembelian.data.length + ' pembelian</p>';

        container.innerHTML = html;
    },

    /* =========================================
       FORM TAMBAH
       ========================================= */
    renderFormTambah: function() {
        AppObat.ensureObatLoaded().then(function() {
            AppPembelian.formItems = [];
            AppPembelian.renderForm();
        });
    },

    renderForm: function() {
        var html = '<div class="p-6">';
        html += '<div class="flex items-center justify-between mb-5">';
        html += '<h3 class="text-lg font-semibold text-gray-800">Tambah Pembelian</h3>';
        html += '<button onclick="Utils.closeModal()" class="p-1.5 hover:bg-gray-100 rounded-lg"><i data-lucide="x" class="w-5 h-5 text-gray-400"></i></button>';
        html += '</div>';

        html += '<form id="form-pembelian" class="space-y-4">';

        // Tanggal
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Tanggal *</label>';
        html += '<input type="date" id="fb-tanggal" value="' + Utils.today() + '" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '</div>';

        // Supplier
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Nama Supplier *</label>';
        html += '<input type="text" id="fb-supplier" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="PT. Obat Sehat">';
        html += '</div>';

        // Status Bayar
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Status Pembayaran</label>';
        html += '<select id="fb-status-bayar" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '<option value="belum">Belum Bayar</option>';
        html += '<option value="lunas">Lunas</option>';
        html += '</select></div>';

        // Item obat
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-2">Obat yang Dibeli *</label>';
        html += '<div id="fb-items-container" class="space-y-2"></div>';
        html += '<button type="button" onclick="AppPembelian.tambahItem()" class="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"><i data-lucide="plus-circle" class="w-4 h-4"></i> Tambah Obat</button>';
        html += '</div>';

        // Total
        html += '<div class="bg-gray-50 rounded-lg p-4 text-sm">';
        html += '<div class="flex justify-between font-bold text-base"><span>Total</span><span id="fb-total" class="text-primary-700">Rp 0</span></div>';
        html += '</div>';

        // Tombol
        html += '<div class="flex justify-end gap-2 pt-2">';
        html += '<button type="button" onclick="Utils.closeModal()" class="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>';
        html += '<button type="submit" id="btn-simpan-pembelian" class="px-6 py-2.5 text-sm bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition">Simpan</button>';
        html += '</div>';

        html += '</form></div>';

        Utils.openModal(html);
        AppPembelian.tambahItem();
        AppPembelian.hitungTotalPembelian();

        document.getElementById('form-pembelian').addEventListener('submit', function(e) {
            e.preventDefault();
            AppPembelian.simpan();
        });
    },

    /* =========================================
       ITEM MANAGEMENT
       ========================================= */
    tambahItem: function() {
        var index = AppPembelian.formItems.length;
        AppPembelian.formItems.push({
            obatId: '',
            namaObat: '',
            jumlah: 1,
            satuan: '',
            hargaBeli: 0,
            subtotal: 0
        });
        AppPembelian.renderItemRow(index);
    },

    renderItemRow: function(index) {
        var container = document.getElementById('fb-items-container');
        if (!container) return;

        var item = AppPembelian.formItems[index];

        var html = '<div id="fbi-' + index + '" class="border border-gray-200 rounded-lg p-3 bg-white relative">';
        html += '<button type="button" onclick="AppPembelian.removeItem(' + index + ')" class="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-0.5"><i data-lucide="x-circle" class="w-4 h-4"></i></button>';

        // Search obat
        html += '<div class="relative mb-2 pr-6">';
        html += '<i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"></i>';
        html += '<input type="text" id="fbi-search-' + index + '" value="' + Utils.escapeHtml(item.namaObat) + '" placeholder="Ketik nama obat..." class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm" autocomplete="off" onfocus="AppPembelian.filterDropdown(' + index + ')" oninput="AppPembelian.filterDropdown(' + index + ')">';
        html += '<div id="fbi-dropdown-' + index + '" class="hidden absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto"></div>';
        html += '</div>';

        // Jumlah + Harga Beli + Subtotal
        html += '<div class="grid grid-cols-3 gap-2">';
        html += '<div>';
        html += '<label class="block text-xs text-gray-500 mb-0.5">Jumlah</label>';
        html += '<input type="number" id="fbi-jumlah-' + index + '" value="' + item.jumlah + '" min="1" class="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" oninput="AppPembelian.updateJumlah(' + index + ')">';
        html += '</div>';
        html += '<div>';
        html += '<label class="block text-xs text-gray-500 mb-0.5">Harga Beli</label>';
        html += '<input type="number" id="fbi-harga-' + index + '" value="' + item.hargaBeli + '" min="0" class="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" oninput="AppPembelian.updateHarga(' + index + ')">';
        html += '</div>';
        html += '<div class="flex items-end">';
        html += '<p id="fbi-sub-' + index + '" class="text-sm font-medium text-gray-800">' + Utils.formatRupiah(item.subtotal) + '</p>';
        html += '</div>';
        html += '</div>';

        html += '<input type="hidden" id="fbi-obat-id-' + index + '" value="' + (item.obatId || '') + '">';
        html += '<input type="hidden" id="fbi-satuan-' + index + '" value="' + Utils.escapeHtml(item.satuan || '') + '">';
        html += '</div>';

        container.insertAdjacentHTML('beforeend', html);
        lucide.createIcons({ nodes: [container] });
    },

    filterDropdown: function(index) {
        var dropdown = document.getElementById('fbi-dropdown-' + index);
        if (!dropdown) return;
        var searchEl = document.getElementById('fbi-search-' + index);
        if (!searchEl) return;
        var val = searchEl.value.trim().toLowerCase();
        if (!val) { dropdown.classList.add('hidden'); return; }

        var results = AppObat.data.filter(function(o) {
            return (o.namaObat && o.namaObat.toLowerCase().indexOf(val) !== -1)
                || (o.kodeObat && o.kodeObat.toLowerCase().indexOf(val) !== -1);
        }).slice(0, 6);

        if (results.length === 0) {
            dropdown.innerHTML = '<div class="px-3 py-2 text-sm text-gray-400">Tidak ditemukan. Stok akan tetap ditambah.</div>';
            dropdown.classList.remove('hidden');
            return;
        }

        var html = '';
        for (var i = 0; i < results.length; i++) {
            var o = results[i];
            html += '<button type="button" onclick="AppPembelian.selectObat(' + index + ',\'' + o.id + '\')" class="w-full text-left px-3 py-2 hover:bg-primary-50 text-sm border-b border-gray-50 last:border-0 transition">';
            html += '<p class="font-medium text-gray-800">' + Utils.escapeHtml(o.namaObat) + '</p>';
            html += '<p class="text-xs text-gray-500">Stok: ' + (o.stok || 0) + ' ' + Utils.escapeHtml(o.satuan || '') + ' · HPP terakhir: ' + Utils.formatRupiah(o.hargaBeli) + '</p>';
            html += '</button>';
        }
        dropdown.innerHTML = html;
        dropdown.classList.remove('hidden');
    },

    selectObat: function(index, obatId) {
        var obat = AppObat.getById(obatId);
        if (!obat) return;

        AppPembelian.formItems[index].obatId = obatId;
        AppPembelian.formItems[index].namaObat = obat.namaObat;
        AppPembelian.formItems[index].satuan = obat.satuan || '';
        AppPembelian.formItems[index].hargaBeli = obat.hargaBeli || 0;
        AppPembelian.formItems[index].subtotal = (obat.hargaBeli || 0) * AppPembelian.formItems[index].jumlah;

        var oldRow = document.getElementById('fbi-' + index);
        if (oldRow) oldRow.remove();
        AppPembelian.renderItemRow(index);
        AppPembelian.hitungTotalPembelian();
    },

    updateJumlah: function(index) {
        var el = document.getElementById('fbi-jumlah-' + index);
        if (!el) return;
        var jumlah = Math.max(0, parseInt(el.value) || 0);
        AppPembelian.formItems[index].jumlah = jumlah;
        AppPembelian.formItems[index].subtotal = AppPembelian.formItems[index].hargaBeli * jumlah;
        var subEl = document.getElementById('fbi-sub-' + index);
        if (subEl) subEl.textContent = Utils.formatRupiah(AppPembelian.formItems[index].subtotal);
        AppPembelian.hitungTotalPembelian();
    },

    updateHarga: function(index) {
        var el = document.getElementById('fbi-harga-' + index);
        if (!el) return;
        var harga = Math.max(0, parseFloat(el.value) || 0);
        AppPembelian.formItems[index].hargaBeli = harga;
        AppPembelian.formItems[index].subtotal = harga * AppPembelian.formItems[index].jumlah;
        var subEl = document.getElementById('fbi-sub-' + index);
        if (subEl) subEl.textContent = Utils.formatRupiah(AppPembelian.formItems[index].subtotal);
        AppPembelian.hitungTotalPembelian();
    },

    removeItem: function(index) {
        var row = document.getElementById('fbi-' + index);
        if (row) row.remove();
        AppPembelian.formItems[index] = null;
        AppPembelian.hitungTotalPembelian();
    },

    hitungTotalPembelian: function() {
        var total = 0;
        for (var i = 0; i < AppPembelian.formItems.length; i++) {
            if (AppPembelian.formItems[i] !== null) {
                total += (AppPembelian.formItems[i].subtotal || 0);
            }
        }
        var el = document.getElementById('fb-total');
        if (el) el.textContent = Utils.formatRupiah(total);
    },

       /* =========================================
       SIMPAN
       ========================================= */
    simpan: function() {
        var btn = document.getElementById('btn-simpan-pembelian');
        btn.disabled = true;
        btn.textContent = 'Menyimpan...';

        var supplierNama = document.getElementById('fb-supplier').value.trim();
        if (!supplierNama) {
            Utils.toast('Nama supplier wajib diisi', 'error');
            btn.disabled = false;
            btn.textContent = 'Simpan';
            return;
        }

        // Validasi & kumpulkan item yang valid
        var validItems = [];
        for (var i = 0; i < AppPembelian.formItems.length; i++) {
            var item = AppPembelian.formItems[i];
            if (item !== null && item.jumlah > 0) {
                validItems.push({
                    obatId: item.obatId,
                    namaObat: item.namaObat || 'Obat Baru',
                    jumlah: item.jumlah,
                    satuan: item.satuan || '',
                    hargaBeli: item.hargaBeli,
                    subtotal: item.subtotal
                });
            }
        }

        if (validItems.length === 0) {
            Utils.toast('Tambahkan minimal 1 obat dengan jumlah > 0', 'error');
            btn.disabled = false;
            btn.textContent = 'Simpan';
            return;
        }

        var total = 0;
        for (var j = 0; j < validItems.length; j++) {
            total += validItems[j].subtotal;
        }

        var tanggal = document.getElementById('fb-tanggal').value;
        var statusBayar = document.getElementById('fb-status-bayar').value;

        var obj = {
            noPembelian: '',
            tanggal: tanggal,
            supplierId: '',
            supplierNama: supplierNama,
            items: validItems,
            total: total,
            statusBayar: statusBayar,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Generate nomor & simpan secara batch (transaksi + update stok)
        db.collection('pembelian').where('tanggal', '==', tanggal).get()
            .then(function(snap) {
                obj.noPembelian = Utils.generateNomorTransaksi('BELI', snap.size);

                var batch = db.batch();

                // 1. Simpan dokumen pembelian baru
                var beliRef = db.collection('pembelian').doc();
                batch.set(beliRef, obj);

                // 2. Tambah stok & update HPP obat
                for (var k = 0; k < validItems.length; k++) {
                    var qty = Math.max(0, validItems[k].jumlah);
                    if (qty > 0 && validItems[k].obatId) {
                        var obatRef = db.collection('obat').doc(validItems[k].obatId);
                        batch.update(obatRef, {
                            stok: firebase.firestore.FieldValue.increment(qty),
                            hargaBeli: validItems[k].hargaBeli
                        });
                    }
                }

                return batch.commit();
            })
            .then(function() {
                Utils.toast('Pembelian berhasil disimpan. Stok obat telah ditambah.', 'success');
                Utils.closeModal();
                AppPembelian.load();
                AppObat.load(); // Refresh supaya data stok & HPP di halaman obat ikut berubah
            })
            .catch(function(err) {
                Utils.toast('Gagal menyimpan: ' + err.message, 'error');
                btn.disabled = false;
                btn.textContent = 'Simpan';
            });
    },

    /* =========================================
       HAPUS
       ========================================= */
    hapus: function(id, noPembelian) {
        if (!confirm('Hapus pembelian "' + noPembelian + '"?\n\nPERINGATAN: Stok obat yang sudah ditambahkan TIDAK akan otomatis dikurangi.')) return;

        db.collection('pembelian').doc(id).delete()
            .then(function() {
                Utils.toast('Data pembelian berhasil dihapus', 'success');
                AppPembelian.load();
            })
            .catch(function(err) {
                Utils.toast('Gagal menghapus: ' + err.message, 'error');
            });
    }
};
