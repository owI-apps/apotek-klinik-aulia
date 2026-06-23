/**
 * laporan.js
 * Halaman laporan sederhana
 */

window.AppLaporan = {

    filterBulan: '',

    /* =========================================
       RENDER
       ========================================= */
    render: function() {
        AppLaporan.filterBulan = Utils.thisMonth();

        var html = '<div class="page-enter max-w-4xl">';
        html += '<div class="mb-6">';
        html += '<h2 class="text-xl font-bold text-gray-800">Laporan</h2>';
        html += '<p class="text-sm text-gray-500">Ringkasan operasional bulanan</p>';
        html += '</div>';

        html += '<div class="mb-4">';
        html += '<label class="block text-xs text-gray-500 mb-1">Periode</label>';
        html += '<input type="month" id="lap-bulan" value="' + AppLaporan.filterBulan + '" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '</div>';

        html += '<div id="lap-content"></div>';
        html += '</div>';
        return html;
    },

    /* =========================================
       INIT
       ========================================= */
    init: function() {
        AppLaporan.load();

        var bulanEl = document.getElementById('lap-bulan');
        if (bulanEl) {
            bulanEl.addEventListener('change', function() {
                AppLaporan.filterBulan = bulanEl.value;
                AppLaporan.load();
            });
        }
    },

    /* =========================================
       LOAD
       ========================================= */
    load: function() {
        Utils.showLoading('lap-content');
        var range = AppKeuangan.getDateRange(AppLaporan.filterBulan);

        var pTrx = db.collection('transaksi').where('tanggal', '>=', range.start).where('tanggal', '<', range.end).get();
        var pAntrian = db.collection('antrian').where('tanggal', '>=', range.start).where('tanggal', '<', range.end).get();
        var pPasien = db.collection('pasien').get();

        Promise.all([pTrx, pAntrian, pPasien]).then(function(results) {
            var trxByTipe = { resep_klinik: 0, resep_luar: 0, obat_bebas: 0, tindakan_apotek: 0 };
            var totalPendapatan = 0;
            var totalPembulatan = 0;
            var trxCount = 0;

            results[0].forEach(function(doc) {
                var d = doc.data();
                var tipe = d.tipe || '';
                if (trxByTipe[tipe] !== undefined) trxByTipe[tipe]++;
                totalPendapatan += (d.totalBayar || 0);
                totalPembulatan += (d.pembulatan || 0);
                trxCount++;
            });

            var antrianCount = results[1].size;
            var pasienCount = results[2].size;

            AppLaporan.renderContent(trxByTipe, totalPendapatan, totalPembulatan, trxCount, antrianCount, pasienCount);
        }).catch(function(err) {
            Utils.toast('Gagal memuat: ' + err.message, 'error');
        });
    },

    /* =========================================
       RENDER CONTENT
       ========================================= */
    renderContent: function(trxByTipe, totalPendapatan, totalPembulatan, trxCount, antrianCount, pasienCount) {
        var container = document.getElementById('lap-content');
        if (!container) return;

        var tipeLabels = {
            resep_klinik: 'Resep Klinik',
            resep_luar: 'Resep Luar',
            obat_bebas: 'Obat Bebas',
            tindakan_apotek: 'Tindakan Apotek'
        };
        var tipeColors = {
            resep_klinik: 'bg-blue-50 text-blue-700',
            resep_luar: 'bg-green-50 text-green-700',
            obat_bebas: 'bg-amber-50 text-amber-700',
            tindakan_apotek: 'bg-teal-50 text-teal-700'
        };

        var html = '';

        // Statistik Umum
        html += '<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">';
        html += '<div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center"><p class="text-xs text-gray-500">Total Pasien</p><p class="text-xl font-bold text-gray-800">' + pasienCount + '</p></div>';
        html += '<div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center"><p class="text-xs text-gray-500">Antrian Bulan Ini</p><p class="text-xl font-bold text-gray-800">' + antrianCount + '</p></div>';
        html += '<div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center"><p class="text-xs text-gray-500">Transaksi</p><p class="text-xl font-bold text-gray-800">' + trxCount + '</p></div>';
        html += '<div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center"><p class="text-xs text-gray-500">Pendapatan</p><p class="text-xl font-bold text-green-600">' + Utils.formatRupiah(totalPendapatan) + '</p></div>';
        html += '</div>';

        // Transaksi per Tipe
        html += '<div class="bg-white rounded-xl border border-gray-200 p-5 mb-4">';
        html += '<h3 class="font-semibold text-gray-800 mb-3">Transaksi per Tipe</h3>';
        html += '<div class="space-y-2">';

        var keys = Object.keys(trxByTipe);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            html += '<div class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">';
            html += '<div class="flex items-center gap-2">';
            html += '<span class="text-xs px-2 py-0.5 rounded-full font-medium ' + (tipeColors[key] || '') + '">' + (tipeLabels[key] || key) + '</span>';
            html += '</div>';
            html += '<span class="text-sm font-medium text-gray-800">' + trxByTipe[key] + ' trx</span>';
            html += '</div>';
        }

        html += '</div></div>';

        // Info Pembulatan
        html += '<div class="bg-amber-50 border border-amber-200 rounded-xl p-4 flex justify-between items-center">';
        html += '<span class="text-sm font-medium text-amber-700">Total Pembulatan (Pool Uang Makan)</span>';
        html += '<span class="text-lg font-bold text-amber-700">' + Utils.formatRupiah(totalPembulatan) + '</span>';
        html += '</div>';

        container.innerHTML = html;
    }
};
