/**
 * pengaturan-profil.js
 * Halaman pengaturan profil apotek & klinik
 */

window.AppPengaturanProfil = {

    render: function() {
        var p = App.pengaturan || {};
        var html = '';
        html += '<div class="page-enter max-w-2xl">';
        html += '  <h2 class="text-xl font-bold text-gray-800 mb-1">Profil Apotek & Klinik</h2>';
        html += '  <p class="text-sm text-gray-500 mb-6">Data ini tampil di kwitansi dan laporan</p>';
        html += '  <form id="form-profil" class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">';
        html += '    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">';
        html += '      <div>';
        html += '        <label class="block text-sm font-medium text-gray-700 mb-1">Nama Apotek</label>';
        html += '        <input type="text" id="p-nama-apotek" value="' + (p.namaApotek || '') + '" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '      </div>';
        html += '      <div>';
        html += '        <label class="block text-sm font-medium text-gray-700 mb-1">Nama Klinik</label>';
        html += '        <input type="text" id="p-nama-klinik" value="' + (p.namaKlinik || '') + '" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '      </div>';
        html += '    </div>';
        html += '    <div>';
        html += '      <label class="block text-sm font-medium text-gray-700 mb-1">Alamat</label>';
        html += '      <input type="text" id="p-alamat" value="' + (p.alamat || '') + '" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '    </div>';
        html += '    <div>';
        html += '      <label class="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>';
        html += '      <input type="text" id="p-telp" value="' + (p.telp || '') + '" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '    </div>';
        html += '    <button type="submit" class="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm">Simpan Perubahan</button>';
        html += '  </form>';
        html += '</div>';
        return html;
    },

    init: function() {
        document.getElementById('form-profil').addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Menyimpan...';

            db.collection('pengaturan').doc('global').update({
                namaApotek: document.getElementById('p-nama-apotek').value.trim(),
                namaKlinik: document.getElementById('p-nama-klinik').value.trim(),
                alamat: document.getElementById('p-alamat').value.trim(),
                telp: document.getElementById('p-telp').value.trim(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(function() {
                App.pengaturan.namaApotek = document.getElementById('p-nama-apotek').value.trim();
                App.pengaturan.namaKlinik = document.getElementById('p-nama-klinik').value.trim();
                App.pengaturan.alamat = document.getElementById('p-alamat').value.trim();
                App.pengaturan.telp = document.getElementById('p-telp').value.trim();
                document.getElementById('sidebar-title').textContent = App.pengaturan.namaApotek;
                document.getElementById('sidebar-subtitle').textContent = App.pengaturan.namaKlinik;
                Utils.toast('Profil berhasil disimpan', 'success');
            }).catch(function(err) {
                Utils.toast('Gagal menyimpan: ' + err.message, 'error');
            }).finally(function() {
                btn.disabled = false;
                btn.textContent = 'Simpan Perubahan';
            });
        });
    }
};
