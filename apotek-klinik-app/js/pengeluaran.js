/**
 * pengeluaran.js
 * Pengeluaran operasional & lainnya — CRUD
 */

window.AppPengeluaran = {

    data: [],
    filterDate: '',
    kategoriList: ['Operasional', 'Gaji', 'Listrik & Air', 'Sewa', 'Perawatan', 'ATK', 'Lainnya'],

    /* =========================================
       RENDER
       ========================================= */
    render: function() {
        AppPengeluaran.filterDate = Utils.today();

        var html = '<div class="page-enter max-w-4xl">';
        html += '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">';
        html += '<div>';
        html += '<h2 class="text-xl font-bold text-gray-800">Pengeluaran</h2>';
        html += '<p class="text-sm text-gray-500">Catatan pengeluaran operasional</p>';
        html += '</div>';
        html += '<button onclick="AppPengeluaran.renderFormTambah()" class="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-2 self-start"><i data-lucide="plus" class="w-4 h-4"></i> Tambah Pengeluaran</button>';
        html += '</div>';

        html += '<div class="mb-4">';
        html += '<label class="block text-xs text-gray-500 mb-1">Tanggal</label>';
        html += '<input type="date" id="pp-filter-date" value="' + AppPengeluaran.filterDate + '" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '</div>';

        html += '<div id="pp-list"></div>';
        html += '</div>';
        return html;
    },

    /* =========================================
       INIT
       ========================================= */
    init: function() {
        AppPengeluaran.load();

        var dateEl = document.getElementById('pp-filter-date');
        if (dateEl) {
            dateEl.addEventListener('change', function() {
                AppPengeluaran.filterDate = dateEl.value;
                AppPengeluaran.load();
            });
        }
    },

    /* =========================================
       LOAD
       ========================================= */
    load: function() {
        Utils.showLoading('pp-list');
        db.collection('pengeluaran').where('tanggal', '==', AppPengeluaran.filterDate).orderBy('createdAt', 'desc').get()
            .then(function(snap) {
                AppPengeluaran.data = [];
                snap.forEach(function(doc) {
                    var d = doc.data();
                    d.id = doc.id;
                    AppPengeluaran.data.push(d);
                });
                AppPengeluaran.renderList();
            })
            .catch(function(err) {
                Utils.toast('Gagal memuat: ' + err.message, 'error');
            });
    },

    /* =========================================
       RENDER LIST
       ========================================= */
    renderList: function() {
        var container = document.getElementById('pp-list');
        if (!container) return;

        var totalHariIni = 0;
        
        if (AppPengeluaran.data.length === 0) {
            container.innerHTML = '<div class="bg-white rounded-xl border border-gray-200 p-8 text-center"><p class="text-sm text-gray-400">Tidak ada pengeluaran hari ini</p></div>';
            return;
        }

        var html = '<div class="space-y-2">';
        for (var i = 0; i < AppPengeluaran.data.length; i++) {
            var p = AppPengeluaran.data[i];
            var jumlah = p.jumlah || 0;
            totalHariIni += jumlah;
            var safeKet = (p.keterangan || '-').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

            html += '<div class="bg-white rounded-xl border border-gray-200 p-4">';
            html += '<div class="flex items-start justify-between gap-3">';
            html += '<div class="flex-1 min-w-0">';
            html += '<div class="flex items-center gap-2 flex-wrap">';
            html += '<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">' + Utils.escapeHtml(p.kategori || '-') + '</span>';
            html += '<span class="text-xs text-gray-400">' + (p.metodeBayar || '-') + '</span>';
            html += '</div>';
            html += '<p class="text-sm font-medium text-gray-800 mt-1">' + Utils.escapeHtml(p.keterangan || '-') + '</p>';
            html += '</div>';
            html += '<div class="text-right flex-shrink-0 flex items-start gap-3">';
            html += '<p class="text-sm font-bold text-red-600">' + Utils.formatRupiah(jumlah) + '</p>';
            html += '<button onclick="AppPengeluaran.hapus(\'' + p.id + '\',\'' + safeKet + '\')" class="p-1.5 text-gray-400 hover:text-red-500 rounded-lg" title="Hapus"><i data-lucide="trash-2" class="w-4 h-4"></i></button>';
            html += '</div></div></div>';
        }
        html += '</div>';

        // Footer total
        html += '<div class="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex justify-between items-center">';
        html += '<span class="text-sm font-medium text-red-700">Total Pengeluaran</span>';
        html += '<span class="text-lg font-bold text-red-700">' + Utils.formatRupiah(totalHariIni) + '</span>';
        html += '</div>';

        container.innerHTML = html;
        lucide.createIcons({ nodes: [container] });
    },

    /* =========================================
       FORM TAMBAH
       ========================================= */
    renderFormTambah: function() {
        var html = '<div class="p-6">';
        html += '<div class="flex items-center justify-between mb-5">';
        html += '<h3 class="text-lg font-semibold text-gray-800">Tambah Pengeluaran</h3>';
        html += '<button onclick="Utils.closeModal()" class="p-1.5 hover:bg-gray-100 rounded-lg"><i data-lucide="x" class="w-5 h-5 text-gray-400"></i></button>';
        html += '</div>';

        html += '<form id="form-pengeluaran" class="space-y-4">';

        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>';
        html += '<select id="pp-kategori" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '<option value="">-- Pilih --</option>';
        for (var k = 0; k < AppPengeluaran.kategoriList.length; k++) {
            html += '<option value="' + AppPengeluaran.kategoriList[k] + '">' + AppPengeluaran.kategoriList[k] + '</option>';
        }
        html += '</select></div>';

        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Keterangan *</label>';
        html += '<input type="text" id="pp-keterangan" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Bayar listrik bulan ini">';
        html += '</div>';

        html += '<div class="grid grid-cols-2 gap-4">';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp) *</label>';
        html += '<input type="number" id="pp-jumlah" required min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="0">';
        html += '</div>';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Metode Bayar</label>';
        html += '<select id="pp-metode" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '<option value="tunai">Tunai</option>';
        html += '<option value="transfer">Transfer</option>';
        html += '</select></div></div>';

        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>';
        html += '<input type="date" id="pp-tanggal" value="' + Utils.today() + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '</div>';

        html += '<div class="flex justify-end gap-2 pt-2">';
        html += '<button type="button" onclick="Utils.closeModal()" class="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>';
        html += '<button type="submit" id="btn-simpan-pp" class="px-6 py-2.5 text-sm bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition">Simpan</button>';
        html += '</div>';

        html += '</form></div>';

        Utils.openModal(html);

        document.getElementById('form-pengeluaran').addEventListener('submit', function(e) {
            e.preventDefault();
            AppPengeluaran.simpan();
        });
    },

    /* =========================================
       SIMPAN
       ========================================= */
    simpan: function() {
        var btn = document.getElementById('btn-simpan-pp');
        btn.disabled = true;
        btn.textContent = 'Menyimpan...';

        var obj = {
            kategori: document.getElementById('pp-kategori').value,
            keterangan: document.getElementById('pp-keterangan').value.trim(),
            jumlah: parseFloat(document.getElementById('pp-jumlah').value) || 0,
            metodeBayar: document.getElementById('pp-metode').value,
            tanggal: document.getElementById('pp-tanggal').value,
            buktiUrl: '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (!obj.keterangan || obj.jumlah <= 0) {
            Utils.toast('Keterangan dan Jumlah wajib diisi dengan benar', 'error');
            btn.disabled = false;
            btn.textContent = 'Simpan';
            return;
        }

        db.collection('pengeluaran').add(obj)
            .then(function() {
                Utils.toast('Pengeluaran berhasil disimpan', 'success');
                Utils.closeModal();
                AppPengeluaran.load();
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
    hapus: function(id, keterangan) {
        if (!confirm('Hapus pengeluaran "' + keterangan + '"?')) return;

        db.collection('pengeluaran').doc(id).delete()
            .then(function() {
                Utils.toast('Pengeluaran berhasil dihapus', 'success');
                AppPengeluaran.load();
            })
            .catch(function(err) {
                Utils.toast('Gagal menghapus: ' + err.message, 'error');
            });
    }
};
