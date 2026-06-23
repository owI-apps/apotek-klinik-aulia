/**
 * piutang.js
 * Piutang karyawan — Catat hutang karyawan & pelunasan
 */

window.AppPiutang = {

    data: [],

    /* =========================================
       RENDER
       ========================================= */
    render: function() {
        var html = '<div class="page-enter max-w-4xl">';
        html += '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">';
        html += '<div>';
        html += '<h2 class="text-xl font-bold text-gray-800">Piutang Karyawan</h2>';
        html += '<p class="text-sm text-gray-500">Catatan pinjaman/hutang karyawan</p>';
        html += '</div>';
        html += '<button onclick="AppPiutang.renderFormTambah()" class="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-2 self-start"><i data-lucide="plus" class="w-4 h-4"></i> Tambah Piutang</button>';
        html += '</div>';

        html += '<div id="piutang-list"></div>';
        html += '</div>';
        return html;
    },

    /* =========================================
       INIT
       ========================================= */
    init: function() {
        AppPiutang.load();
    },

    /* =========================================
       LOAD
       ========================================= */
    load: function() {
        Utils.showLoading('piutang-list');
        db.collection('piutangKaryawan').orderBy('tanggal', 'desc').get()
            .then(function(snap) {
                AppPiutang.data = [];
                snap.forEach(function(doc) {
                    var d = doc.data();
                    d.id = doc.id;
                    if (!d.riwayatBayar) d.riwayatBayar = [];
                    AppPiutang.data.push(d);
                });
                AppPiutang.renderList();
            })
            .catch(function(err) {
                Utils.toast('Gagal memuat: ' + err.message, 'error');
            });
    },

    /* =========================================
       RENDER LIST
       ========================================= */
    renderList: function() {
        var container = document.getElementById('piutang-list');
        if (!container) return;

        if (AppPiutang.data.length === 0) {
            container.innerHTML = '<div class="bg-white rounded-xl border border-gray-200 p-8 text-center"><p class="text-sm text-gray-400">Tidak ada piutang karyawan</p></div>';
            return;
        }

        var totalPiutang = 0;
        var html = '<div class="space-y-2">';

        for (var i = 0; i < AppPiutang.data.length; i++) {
            var p = AppPiutang.data[i];
            var sisa = p.sisaPiutang || 0;
            totalPiutang += sisa;

            var statusClass = 'bg-yellow-50 text-yellow-700';
            var statusLabel = 'Belum';
            if (p.status === 'sebagian') { statusClass = 'bg-blue-50 text-blue-700'; statusLabel = 'Sebagian'; }
            if (p.status === 'lunas') { statusClass = 'bg-green-50 text-green-700'; statusLabel = 'Lunas'; }

            var safeNama = (p.karyawanNama || '-').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

            html += '<div class="bg-white rounded-xl border border-gray-200 p-4">';
            html += '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">';
            html += '<div class="flex-1 min-w-0">';
            html += '<div class="flex items-center gap-2 flex-wrap">';
            html += '<p class="font-semibold text-gray-800">' + Utils.escapeHtml(p.karyawanNama || '-') + '</p>';
            html += '<span class="text-xs px-2 py-0.5 rounded-full font-medium ' + statusClass + '">' + statusLabel + '</span>';
            html += '</div>';
            html += '<p class="text-xs text-gray-500 mt-0.5">' + Utils.escapeHtml(p.keterangan || '-') + ' · ' + Utils.formatTanggalShort(p.tanggal) + '</p>';
            html += '<div class="flex gap-4 mt-1 text-xs text-gray-500">';
            html += '<span>Total: ' + Utils.formatRupiah(p.totalPiutang || 0) + '</span>';
            html += '<span>Dibayar: ' + Utils.formatRupiah(p.sudahBayar || 0) + '</span>';
            if (sisa > 0) {
                html += '<span class="font-semibold text-red-600">Sisa: ' + Utils.formatRupiah(sisa) + '</span>';
            }
            html += '</div></div>';

            html += '<div class="flex gap-2 flex-shrink-0">';
            if (sisa > 0) {
                html += '<button onclick="AppPiutang.renderFormBayar(\'' + p.id + '\')" class="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition font-medium">Bayar</button>';
            }
            html += '<button onclick="AppPiutang.hapus(\'' + p.id + '\',\'' + safeNama + '\')" class="p-2 text-gray-400 hover:text-red-500 rounded-lg" title="Hapus"><i data-lucide="trash-2" class="w-4 h-4"></i></button>';
            html += '</div></div></div>';
        }

        html += '</div>';

        // Footer total
        html += '<div class="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex justify-between items-center">';
        html += '<span class="text-sm font-medium text-red-700">Total Sisa Piutang</span>';
        html += '<span class="text-lg font-bold text-red-700">' + Utils.formatRupiah(totalPiutang) + '</span>';
        html += '</div>';

        container.innerHTML = html;
        lucide.createIcons({ nodes: [container] });
    },

    /* =========================================
       FORM TAMBAH PIUTANG
       ========================================= */
    renderFormTambah: function() {
        var html = '<div class="p-6">';
        html += '<div class="flex items-center justify-between mb-5">';
        html += '<h3 class="text-lg font-semibold text-gray-800">Tambah Piutang</h3>';
        html += '<button onclick="Utils.closeModal()" class="p-1.5 hover:bg-gray-100 rounded-lg"><i data-lucide="x" class="w-5 h-5 text-gray-400"></i></button>';
        html += '</div>';

        html += '<form id="form-piutang" class="space-y-4">';

        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Nama Karyawan *</label>';
        html += '<input type="text" id="prt-nama" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Nama karyawan">';
        html += '</div>';

        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Keterangan *</label>';
        html += '<input type="text" id="prt-keterangan" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Pinjam uang untuk keperluan...">';
        html += '</div>';

        html += '<div class="grid grid-cols-2 gap-4">';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Jumlah Piutang (Rp) *</label>';
        html += '<input type="number" id="prt-jumlah" required min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="0">';
        html += '</div>';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>';
        html += '<input type="date" id="prt-tanggal" value="' + Utils.today() + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '</div></div>';

        html += '<div class="flex justify-end gap-2 pt-2">';
        html += '<button type="button" onclick="Utils.closeModal()" class="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>';
        html += '<button type="submit" id="btn-simpan-prt" class="px-6 py-2.5 text-sm bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition">Simpan</button>';
        html += '</div>';

        html += '</form></div>';

        Utils.openModal(html);

        document.getElementById('form-piutang').addEventListener('submit', function(e) {
            e.preventDefault();
            AppPiutang.simpan();
        });
    },

    /* =========================================
       SIMPAN PIUTANG BARU
       ========================================= */
    simpan: function() {
        var btn = document.getElementById('btn-simpan-prt');
        btn.disabled = true;
        btn.textContent = 'Menyimpan...';

        var jumlah = parseFloat(document.getElementById('prt-jumlah').value) || 0;
        if (jumlah <= 0) {
            Utils.toast('Jumlah harus lebih dari 0', 'error');
            btn.disabled = false;
            btn.textContent = 'Simpan';
            return;
        }

        var obj = {
            karyawanId: '',
            karyawanNama: document.getElementById('prt-nama').value.trim(),
            totalPiutang: jumlah,
            sudahBayar: 0,
            sisaPiutang: jumlah,
            keterangan: document.getElementById('prt-keterangan').value.trim(),
            tanggal: document.getElementById('prt-tanggal').value,
            status: 'belum',
            riwayatBayar: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection('piutangKaryawan').add(obj)
            .then(function() {
                Utils.toast('Piutang berhasil dicatat', 'success');
                Utils.closeModal();
                AppPiutang.load();
            })
            .catch(function(err) {
                Utils.toast('Gagal menyimpan: ' + err.message, 'error');
                btn.disabled = false;
                btn.textContent = 'Simpan';
            });
    },

    /* =========================================
       FORM BAYAR PIUTANG
       ========================================= */
    renderFormBayar: function(id) {
        var piutang = null;
        for (var i = 0; i < AppPiutang.data.length; i++) {
            if (AppPiutang.data[i].id === id) { piutang = AppPiutang.data[i]; break; }
        }
        if (!piutang) { Utils.toast('Data tidak ditemukan', 'error'); return; }

        var sisa = piutang.sisaPiutang || 0;

        var html = '<div class="p-6">';
        html += '<div class="flex items-center justify-between mb-5">';
        html += '<h3 class="text-lg font-semibold text-gray-800">Bayar Piutang</h3>';
        html += '<button onclick="Utils.closeModal()" class="p-1.5 hover:bg-gray-100 rounded-lg"><i data-lucide="x" class="w-5 h-5 text-gray-400"></i></button>';
        html += '</div>';

        html += '<div class="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">';
        html += '<p>Karyawan: <strong>' + Utils.escapeHtml(piutang.karyawanNama || '-') + '</strong></p>';
        html += '<p>Keterangan: ' + Utils.escapeHtml(piutang.keterangan || '-') + '</p>';
        html += '<p>Sisa Piutang: <strong class="text-red-600">' + Utils.formatRupiah(sisa) + '</strong></p>';
        html += '</div>';

        html += '<form id="form-bayar-piutang" class="space-y-4">';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Jumlah Bayar *</label>';
        html += '<input type="number" id="prb-jumlah" value="' + sisa + '" required min="1" max="' + sisa + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '</div>';
        html += '<div class="flex justify-end gap-2 pt-2">';
        html += '<button type="button" onclick="Utils.closeModal()" class="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>';
        html += '<button type="submit" id="btn-bayar-prt" class="px-6 py-2.5 text-sm bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition">Proses Pembayaran</button>';
        html += '</div>';
        html += '</form></div>';

        Utils.openModal(html);

        document.getElementById('form-bayar-piutang').addEventListener('submit', function(e) {
            e.preventDefault();
            AppPiutang.prosesBayar(id);
        });
    },

    /* =========================================
       PROSES BAYAR PIUTANG (Menggunakan arrayUnion agar aman & atomik)
       ========================================= */
    prosesBayar: function(id) {
        var btn = document.getElementById('btn-bayar-prt');
        btn.disabled = true;
        btn.textContent = 'Memproses...';

        var jumlah = parseFloat(document.getElementById('prb-jumlah').value) || 0;

        if (jumlah <= 0) {
            Utils.toast('Jumlah bayar harus lebih dari 0', 'error');
            btn.disabled = false;
            btn.textContent = 'Proses Pembayaran';
            return;
        }

        var piutang = null;
        for (var i = 0; i < AppPiutang.data.length; i++) {
            if (AppPiutang.data[i].id === id) { piutang = AppPiutang.data[i]; break; }
        }
        if (!piutang) return;

        var total = piutang.totalPiutang || 0;
        var sudahBayar = (piutang.sudahBayar || 0) + jumlah;
        var sisa = total - sudahBayar;
        var status = (sisa <= 0) ? 'lunas' : 'sebagian';

        db.collection('piutangKaryawan').doc(id).update({
            sudahBayar: sudahBayar,
            sisaPiutang: Math.max(0, sisa),
            status: status,
            riwayatBayar: firebase.firestore.FieldValue.arrayUnion({
                tanggal: Utils.today(),
                jumlah: jumlah
            })
        }).then(function() {
            Utils.toast('Pembayaran piutang berhasil dicatat', 'success');
            Utils.closeModal();
            AppPiutang.load();
        }).catch(function(err) {
            Utils.toast('Gagal: ' + err.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Proses Pembayaran';
        });
    },

    /* =========================================
       HAPUS PIUTANG
       ========================================= */
    hapus: function(id, nama) {
        if (!confirm('Hapus piutang "' + nama + '"?')) return;

        db.collection('piutangKaryawan').doc(id).delete()
            .then(function() {
                Utils.toast('Piutang berhasil dihapus', 'success');
                AppPiutang.load();
            })
            .catch(function(err) {
                Utils.toast('Gagal menghapus: ' + err.message, 'error');
            });
    }
};
