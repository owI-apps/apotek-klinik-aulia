/**
 * dashboard.js
 * Halaman dashboard - ringkasan operasional
 */

window.AppDashboard = {

    render: function() {
        var html = '';
        html += '<div class="page-enter">';
        html += '  <h2 class="text-xl font-bold text-gray-800 mb-1">Dashboard</h2>';
        html += '  <p class="text-sm text-gray-500 mb-6">Ringkasan hari ini — ' + Utils.formatTanggal(new Date()) + '</p>';

        // Kartu ringkasan
        html += '  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">';

        html += '    <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">';
        html += '      <div class="flex items-center gap-3">';
        html += '        <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><i data-lucide="users" class="w-5 h-5 text-blue-600"></i></div>';
        html += '        <div>';
        html += '          <p class="text-xs text-gray-500">Antrian Hari Ini</p>';
        html += '          <p id="dash-antrian" class="text-xl font-bold text-gray-800">-</p>';
        html += '        </div>';
        html += '      </div>';
        html += '    </div>';

        html += '    <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">';
        html += '      <div class="flex items-center gap-3">';
        html += '        <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><i data-lucide="receipt" class="w-5 h-5 text-green-600"></i></div>';
        html += '        <div>';
        html += '          <p class="text-xs text-gray-500">Transaksi</p>';
        html += '          <p id="dash-transaksi" class="text-xl font-bold text-gray-800">-</p>';
        html += '        </div>';
        html += '      </div>';
        html += '    </div>';

        html += '    <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">';
        html += '      <div class="flex items-center gap-3">';
        html += '        <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><i data-lucide="package" class="w-5 h-5 text-amber-600"></i></div>';
        html += '        <div>';
        html += '          <p class="text-xs text-gray-500">Stok Menipis</p>';
        html += '          <p id="dash-stok" class="text-xl font-bold text-gray-800">-</p>';
        html += '        </div>';
        html += '      </div>';
        html += '    </div>';

        html += '    <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">';
        html += '      <div class="flex items-center gap-3">';
        html += '        <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><i data-lucide="trending-up" class="w-5 h-5 text-purple-600"></i></div>';
        html += '        <div>';
        html += '          <p class="text-xs text-gray-500">Pendapatan</p>';
        html += '          <p id="dash-pendapatan" class="text-xl font-bold text-gray-800">-</p>';
        html += '        </div>';
        html += '      </div>';
        html += '    </div>';

        html += '  </div>';

        // Info box
        html += '  <div class="bg-primary-50 border border-primary-200 rounded-xl p-4">';
        html += '    <div class="flex items-start gap-3">';
        html += '      <i data-lucide="info" class="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5"></i>';
        html += '      <div>';
        html += '        <p class="text-sm font-medium text-primary-800">Selamat datang di Apotek & Klinik System</p>';
        html += '        <p class="text-xs text-primary-600 mt-1">Aplikasi masih dalam tahap pengembangan. Module yang aktif saat ini: Dashboard, Pengaturan. Module lainnya akan menyusul.</p>';
        html += '      </div>';
        html += '    </div>';
        html += '  </div>';

        html += '</div>';
        return html;
    },

    /**
     * Load data dashboard (dipanggil setelah render)
     */
    init: function() {
        var db = firebase.firestore();
        var today = Utils.today();

        // Hitung antrian hari ini
        db.collection('antrian').where('tanggal', '==', today).get()
            .then(function(snap) {
                document.getElementById('dash-antrian').textContent = snap.size;
            })
            .catch(function() {
                document.getElementById('dash-antrian').textContent = '0';
            });

        // Hitung transaksi hari ini
        db.collection('transaksi').where('tanggal', '==', today).get()
            .then(function(snap) {
                document.getElementById('dash-transaksi').textContent = snap.size + ' trx';
                var total = 0;
                snap.forEach(function(doc) { total += (doc.data().totalBayar || 0); });
                document.getElementById('dash-pendapatan').textContent = Utils.formatRupiah(total);
            })
            .catch(function() {
                document.getElementById('dash-transaksi').textContent = '0 trx';
                document.getElementById('dash-pendapatan').textContent = Utils.formatRupiah(0);
            });

        // Hitung stok menipis
        db.collection('obat').where('stok', '<=', 10).get()
            .then(function(snap) {
                document.getElementById('dash-stok').textContent = snap.size + ' item';
            })
            .catch(function() {
                document.getElementById('dash-stok').textContent = '0 item';
            });

        // Render ikon Lucide di dalam dashboard
        lucide.createIcons();
    }
};
