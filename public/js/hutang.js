/**
 * hutang.js
 * Hutang usaha (pembelian yang belum lunas)
 * Membaca dari collection 'pembelian' dengan filter statusBayar !== 'lunas'
 */

window.AppHutang = {

    data: [],

    /* =========================================
       RENDER
       ========================================= */
    render: function() {
        var html = '<div class="page-enter max-w-4xl">';
        html += '<div class="mb-4">';
        html += '<h2 class="text-xl font-bold text-gray-800">Hutang Usaha</h2>';
        html += '<p class="text-sm text-gray-500">Daftar pembelian yang belum atau belum lunas dibayar ke supplier</p>';
        html += '</div>';
        html += '<div id="hutang-list"></div>';
        html += '</div>';
        return html;
    },

    /* =========================================
       INIT
       ========================================= */
    init: function() {
        AppHutang.load();
    },

    /* =========================================
       LOAD
       ========================================= */
    load: function() {
        Utils.showLoading('hutang-list');
        db.collection('pembelian').where('statusBayar', 'in', ['belum', 'sebagian']).orderBy('tanggal', 'desc').get()
            .then(function(snap) {
                AppHutang.data = [];
                snap.forEach(function(doc) {
                    var d = doc.data();
                    d.id = doc.id;
                    AppHutang.data.push(d);
                });
                AppHutang.renderList();
            })
            .catch(function(err) {
                Utils.toast('Gagal memuat: ' + err.message, 'error');
            });
    },

    /* =========================================
       RENDER LIST
       ========================================= */
    renderList: function() {
        var container = document.getElementById('hutang-list');
        if (!container) return;

        if (AppHutang.data.length === 0) {
            container.innerHTML = '<div class="bg-white rounded-xl border border-gray-200 p-8 text-center"><p class="text-sm text-gray-400">Tidak ada hutang usaha</p></div>';
            return;
        }

        var totalHutang = 0;
        var html = '<div class="space-y-2">';

        for (var i = 0; i < AppHutang.data.length; i++) {
            var h = AppHutang.data[i];
            var total = h.total || 0;
            var sudahBayar = h.sudahBayar || 0;
            var sisa = total - sudahBayar;
            totalHutang += sisa;

            html += '<div class="bg-white rounded-xl border border-gray-200 p-4">';
            html += '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">';
            html += '<div class="flex-1 min-w-0">';
            html += '<div class="flex items-center gap-2 flex-wrap">';
            html += '<span class="text-xs text-gray-400 font-mono">' + Utils.escapeHtml(h.noPembelian || '-') + '</span>';
            html += '<span class="text-xs text-gray-400">' + Utils.formatTanggalShort(h.tanggal) + '</span>';
            html += '</div>';
            html += '<p class="text-sm font-medium text-gray-800 mt-1">' + Utils.escapeHtml(h.supplierNama || '-') + '</p>';
            html += '<div class="flex gap-4 mt-1 text-xs text-gray-500">';
            html += '<span>Total: ' + Utils.formatRupiah(total) + '</span>';
            html += '<span>Dibayar: ' + Utils.formatRupiah(sudahBayar) + '</span>';
            html += '<span class="font-semibold text-red-600">Sisa: ' + Utils.formatRupiah(sisa) + '</span>';
            html += '</div></div>';
            html += '<div class="flex gap-2 flex-shrink-0">';
            html += '<button onclick="AppHutang.renderFormBayar(\'' + h.id + '\')" class="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition font-medium">Bayar</button>';
            html += '</div></div></div>';
        }

        html += '</div>';

        // Summary footer
        html += '<div class="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex justify-between items-center">';
        html += '<span class="text-sm font-medium text-red-700">Total Sisa Hutang</span>';
        html += '<span class="text-lg font-bold text-red-700">' + Utils.formatRupiah(totalHutang) + '</span>';
        html += '</div>';

        container.innerHTML = html;
    },

    /* =========================================
       FORM BAYAR HUTANG
       ========================================= */
    renderFormBayar: function(id) {
        var hutang = null;
        for (var i = 0; i < AppHutang.data.length; i++) {
            if (AppHutang.data[i].id === id) { hutang = AppHutang.data[i]; break; }
        }
        if (!hutang) { Utils.toast('Data tidak ditemukan', 'error'); return; }

        var total = hutang.total || 0;
        var sudahBayar = hutang.sudahBayar || 0;
        var sisa = total - sudahBayar;

        var html = '<div class="p-6">';
        html += '<div class="flex items-center justify-between mb-5">';
        html += '<h3 class="text-lg font-semibold text-gray-800">Bayar Hutang</h3>';
        html += '<button onclick="Utils.closeModal()" class="p-1.5 hover:bg-gray-100 rounded-lg"><i data-lucide="x" class="w-5 h-5 text-gray-400"></i></button>';
        html += '</div>';

        html += '<div class="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">';
        html += '<p>Supplier: <strong>' + Utils.escapeHtml(hutang.supplierNama || '-') + '</strong></p>';
        html += '<p>No: ' + Utils.escapeHtml(hutang.noPembelian || '-') + '</p>';
        html += '<p>Sisa Hutang: <strong class="text-red-600">' + Utils.formatRupiah(sisa) + '</strong></p>';
        html += '</div>';

        html += '<form id="form-bayar-hutang" class="space-y-4">';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Jumlah Bayar *</label>';
        html += '<input type="number" id="bh-jumlah" value="' + sisa + '" required min="1" max="' + sisa + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '</div>';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Metode Bayar</label>';
        html += '<select id="bh-metode" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '<option value="transfer">Transfer</option>';
        html += '<option value="tunai">Tunai</option>';
        html += '<option value="qris">QRIS</option>';
        html += '</select></div>';
        html += '<div class="flex justify-end gap-2 pt-2">';
        html += '<button type="button" onclick="Utils.closeModal()" class="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>';
        html += '<button type="submit" id="btn-bayar-hutang" class="px-6 py-2.5 text-sm bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition">Proses Pembayaran</button>';
        html += '</div>';
        html += '</form></div>';

        Utils.openModal(html);

        document.getElementById('form-bayar-hutang').addEventListener('submit', function(e) {
            e.preventDefault();
            AppHutang.prosesBayar(id);
        });
    },

    /* =========================================
       PROSES BAYAR
       ========================================= */
    prosesBayar: function(id) {
        var btn = document.getElementById('btn-bayar-hutang');
        btn.disabled = true;
        btn.textContent = 'Memproses...';

        var jumlah = parseFloat(document.getElementById('bh-jumlah').value) || 0;
        var metode = document.getElementById('bh-metode').value;

        if (jumlah <= 0) {
            Utils.toast('Jumlah bayar harus lebih dari 0', 'error');
            btn.disabled = false;
            btn.textContent = 'Proses Pembayaran';
            return;
        }

        var hutang = null;
        for (var i = 0; i < AppHutang.data.length; i++) {
            if (AppHutang.data[i].id === id) { hutang = AppHutang.data[i]; break; }
        }
        if (!hutang) return;

        var total = hutang.total || 0;
        var sudahBayar = (hutang.sudahBayar || 0) + jumlah;
        var sisa = total - sudahBayar;
        var statusBayar = (sisa <= 0) ? 'lunas' : 'sebagian';

        var riwayatBayar = hutang.riwayatBayar || [];
        riwayatBayar.push({
            tanggal: Utils.today(),
            jumlah: jumlah,
            metode: metode
        });

        db.collection('pembelian').doc(id).update({
            sudahBayar: sudahBayar,
            statusBayar: statusBayar,
            riwayatBayar: riwayatBayar,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function() {
            Utils.toast('Pembayaran hutang berhasil dicatat', 'success');
            Utils.closeModal();
            AppHutang.load();
        }).catch(function(err) {
            Utils.toast('Gagal: ' + err.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Proses Pembayaran';
        });
    }
};
