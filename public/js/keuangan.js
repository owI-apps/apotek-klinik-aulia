/**
 * keuangan.js
 * Ringkasan keuangan bulanan
 */

window.AppKeuangan = {

    filterBulan: '',

    /* =========================================
       RENDER
       ========================================= */
    render: function() {
        AppKeuangan.filterBulan = Utils.thisMonth();

        var html = '<div class="page-enter max-w-4xl">';
        html += '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">';
        html += '<div>';
        html += '<h2 class="text-xl font-bold text-gray-800">Keuangan</h2>';
        html += '<p class="text-sm text-gray-500">Ringkasan pendapatan & pengeluaran</p>';
        html += '</div>';
        html += '<div>';
        html += '<label class="block text-xs text-gray-500 mb-1">Periode</label>';
        html += '<input type="month" id="keu-filter-bulan" value="' + AppKeuangan.filterBulan + '" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '</div></div>';

        html += '<div id="keu-cards" class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"></div>';
        html += '<div id="keu-details"></div>';
        html += '</div>';
        return html;
    },

    /* =========================================
       INIT
       ========================================= */
    init: function() {
        AppKeuangan.load();

        var bulanEl = document.getElementById('keu-filter-bulan');
        if (bulanEl) {
            bulanEl.addEventListener('change', function() {
                AppKeuangan.filterBulan = bulanEl.value;
                AppKeuangan.load();
            });
        }
    },

    /* =========================================
       HELPER: Dapatkan range tanggal Firestore
       ========================================= */
    getDateRange: function(bulan) {
        var parts = bulan.split('-');
        var y = parseInt(parts[0]);
        var m = parseInt(parts[1]);
        var nextM = m === 12 ? 1 : m + 1;
        var nextY = m === 12 ? y + 1 : y;
        return {
            start: bulan + '-01',
            end: nextY + '-' + String(nextM).padStart(2, '0') + '-01'
        };
    },

    /* =========================================
       LOAD DATA
       ========================================= */
    load: function() {
        Utils.showLoading('keu-cards');
        var range = AppKeuangan.getDateRange(AppKeuangan.filterBulan);

        var pTrx = db.collection('transaksi').where('tanggal', '>=', range.start).where('tanggal', '<', range.end).get();
        var pBeli = db.collection('pembelian').where('tanggal', '>=', range.start).where('tanggal', '<', range.end).get();
        var pPengeluaran = db.collection('pengeluaran').where('tanggal', '>=', range.start).where('tanggal', '<', range.end).get();

        Promise.all([pTrx, pBeli, pPengeluaran]).then(function(results) {
            var totalPendapatan = 0;
            var totalPembelian = 0;
            var totalPengeluaran = 0;
            var trxCount = 0;
            var beliCount = 0;

            results[0].forEach(function(doc) {
                totalPendapatan += (doc.data().totalBayar || 0);
                trxCount++;
            });

            results[1].forEach(function(doc) {
                totalPembelian += (doc.data().total || 0);
                beliCount++;
            });

            results[2].forEach(function(doc) {
                totalPengeluaran += (doc.data().jumlah || 0);
            });

            var saldo = totalPendapatan - totalPembelian - totalPengeluaran;
            AppKeuangan.renderCards(totalPendapatan, totalPembelian, totalPengeluaran, saldo, trxCount, beliCount);
            AppKeuangan.renderDetails(results, totalPendapatan, totalPembelian, totalPengeluaran);
        }).catch(function(err) {
            Utils.toast('Gagal memuat data: ' + err.message, 'error');
        });
    },

    /* =========================================
       RENDER CARDS
       ========================================= */
    renderCards: function(pendapatan, pembelian, pengeluaran, saldo, trxCount, beliCount) {
        var container = document.getElementById('keu-cards');
        if (!container) return;

        var html = '';
        html += '<div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">';
        html += '<p class="text-xs text-gray-500 mb-1">Pendapatan (' + trxCount + ' trx)</p>';
        html += '<p class="text-xl font-bold text-green-600">' + Utils.formatRupiah(pendapatan) + '</p>';
        html += '</div>';

        html += '<div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">';
        html += '<p class="text-xs text-gray-500 mb-1">Pembelian (' + beliCount + ' trx)</p>';
        html += '<p class="text-xl font-bold text-red-600">- ' + Utils.formatRupiah(pembelian) + '</p>';
        html += '</div>';

        html += '<div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">';
        html += '<p class="text-xs text-gray-500 mb-1">Pengeluaran</p>';
        html += '<p class="text-xl font-bold text-red-600">- ' + Utils.formatRupiah(pengeluaran) + '</p>';
        html += '</div>';

        var saldoColor = (saldo >= 0) ? 'text-blue-600' : 'text-red-600';
        html += '<div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">';
        html += '<p class="text-xs text-gray-500 mb-1">Saldo Bersih</p>';
        html += '<p class="text-xl font-bold ' + saldoColor + '">' + Utils.formatRupiah(saldo) + '</p>';
        html += '</div>';

        container.innerHTML = html;
    },

    /* =========================================
       RENDER DETAILS
       ========================================= */
    renderDetails: function(results, totalPendapatan, totalPembelian, totalPengeluaran) {
        var container = document.getElementById('keu-details');
        if (!container) return;

        var html = '<div class="bg-white rounded-xl border border-gray-200 p-5">';
        html += '<h3 class="font-semibold text-gray-800 mb-4">Ringkasan Bulan Ini</h3>';
        html += '<div class="space-y-3 text-sm">';
        
        html += '<div class="flex justify-between items-center py-2 border-b border-gray-100">';
        html += '<span class="text-gray-600">Total Pendapatan Transaksi</span>';
        html += '<span class="font-medium text-green-600">' + Utils.formatRupiah(totalPendapatan) + '</span>';
        html += '</div>';

        html += '<div class="flex justify-between items-center py-2 border-b border-gray-100">';
        html += '<span class="text-gray-600">Total Pembelian Obat</span>';
        html += '<span class="font-medium text-red-500">- ' + Utils.formatRupiah(totalPembelian) + '</span>';
        html += '</div>';

        html += '<div class="flex justify-between items-center py-2 border-b border-gray-100">';
        html += '<span class="text-gray-600">Total Pengeluaran Lainnya</span>';
        html += '<span class="font-medium text-red-500">- ' + Utils.formatRupiah(totalPengeluaran) + '</span>';
        html += '</div>';

        var saldo = totalPendapatan - totalPembelian - totalPengeluaran;
        var saldoColor = (saldo >= 0) ? 'text-blue-600' : 'text-red-600';
        html += '<div class="flex justify-between items-center py-2 font-bold text-base">';
        html += '<span>Saldo</span>';
        html += '<span class="' + saldoColor + '">' + Utils.formatRupiah(saldo) + '</span>';
        html += '</div>';

        html += '</div></div>';
        container.innerHTML = html;
    }
};
