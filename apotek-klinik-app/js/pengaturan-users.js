/**
 * pengaturan-users.js
 * Kelola user accounts — Lihat daftar user, assign role & link ke karyawan
 * Catatan: Pembuatan akun Auth baru dilakukan di Firebase Console
 */

window.AppPengaturanUsers = {

    data: [],
    karyawanList: [],

    /* =========================================
       RENDER
       ========================================= */
    render: function() {
        var html = '<div class="page-enter max-w-3xl">';
        html += '<div class="mb-4">';
        html += '<h2 class="text-xl font-bold text-gray-800">Kelola Users</h2>';
        html += '<p class="text-sm text-gray-500">Akun yang bisa login ke sistem</p>';
        html += '</div>';

        // Instruksi
        html += '<div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-sm text-blue-800">';
        html += '<p class="font-semibold mb-1">Cara Menambah User Baru:</p>';
        html += '<ol class="list-decimal list-inside space-y-0.5 text-xs">';
        html += '<li>Buka <a href="https://console.firebase.google.com" target="_blank" class="underline font-medium">Firebase Console</a></li>';
        html += '<li>Pilih project "apotek-klinik-aulia" → menu <strong>Authentication</strong></li>';
        html += '<li>Klik <strong>Add User</strong>, masukkan Email & Password</li>';
        html += '<li>User baru login ke app ini, lalu admin assign role di bawah</li>';
        html += '</ol>';
        html += '</div>';

        html += '<div id="users-list"><div class="flex justify-center py-6"><div class="spinner"></div></div></div>';
        html += '</div>';
        return html;
    },

    /* =========================================
       INIT
       ========================================= */
    init: function() {
        db.collection('users').orderBy('nama').get()
            .then(function(snap) {
                AppPengaturanUsers.data = [];
                snap.forEach(function(doc) {
                    var d = doc.data();
                    d.id = doc.id;
                    AppPengaturanUsers.data.push(d);
                });
                return db.collection('karyawan').orderBy('nama').get();
            })
            .then(function(snap) {
                AppPengaturanUsers.karyawanList = [];
                snap.forEach(function(doc) {
                    var d = doc.data();
                    d.id = doc.id;
                    AppPengaturanUsers.karyawanList.push(d);
                });
                AppPengaturanUsers.renderList();
            })
            .catch(function(err) {
                Utils.toast('Gagal memuat: ' + err.message, 'error');
            });
    },

    /* =========================================
       RENDER LIST
       ========================================= */
    renderList: function() {
        var container = document.getElementById('users-list');
        if (!container) return;

        if (AppPengaturanUsers.data.length === 0) {
            container.innerHTML = '<div class="bg-white rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-400">Belum ada user terdaftar</div>';
            return;
        }

        var roleLabels = { admin: 'Administrator', psa: 'PSA', klinik: 'Klinik', apotek: 'Apotek' };
        var roleColors = { admin: 'bg-red-50 text-red-700', psa: 'bg-indigo-50 text-indigo-700', klinik: 'bg-purple-50 text-purple-700', apotek: 'bg-teal-50 text-teal-700' };

        var html = '<div class="space-y-2">';
        for (var i = 0; i < AppPengaturanUsers.data.length; i++) {
            var u = AppPengaturanUsers.data[i];
            var rc = roleColors[u.role] || 'bg-gray-100 text-gray-600';
            var rl = roleLabels[u.role] || u.role;

            // Cari nama karyawan terkait
            var karNama = '-';
            if (u.karyawanId) {
                for (var k = 0; k < AppPengaturanUsers.karyawanList.length; k++) {
                    if (AppPengaturanUsers.karyawanList[k].id === u.karyawanId) {
                        karNama = AppPengaturanUsers.karyawanList[k].nama;
                        break;
                    }
                }
            }

            html += '<div class="bg-white rounded-xl border border-gray-200 p-4">';
            html += '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">';
            html += '<div class="flex-1 min-w-0">';
            html += '<p class="font-medium text-gray-800">' + Utils.escapeHtml(u.nama || '-') + '</p>';
            html += '<p class="text-xs text-gray-500">' + Utils.escapeHtml(u.email || '-') + '</p>';
            if (u.karyawanId) {
                html += '<p class="text-xs text-primary-600 mt-0.5">Karyawan: ' + Utils.escapeHtml(karNama) + '</p>';
            }
            html += '</div>';
            html += '<div class="flex items-center gap-2 flex-shrink-0">';
            html += '<span class="text-xs px-2 py-0.5 rounded-full font-medium ' + rc + '">' + rl + '</span>';
            html += '<button onclick="AppPengaturanUsers.renderFormEdit(\'' + u.id + '\')" class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition font-medium">Atur</button>';
            html += '</div></div></div>';
        }
        html += '</div>';

        container.innerHTML = html;
    },

    /* =========================================
       FORM EDIT (role & karyawan link)
       ========================================= */
    renderFormEdit: function(uid) {
        var user = null;
        for (var i = 0; i < AppPengaturanUsers.data.length; i++) {
            if (AppPengaturanUsers.data[i].id === uid) { user = AppPengaturanUsers.data[i]; break; }
        }
        if (!user) { Utils.toast('User tidak ditemukan', 'error'); return; }

        var html = '<div class="p-6">';
        html += '<div class="flex items-center justify-between mb-5">';
        html += '<h3 class="text-lg font-semibold text-gray-800">Atur User</h3>';
        html += '<button onclick="Utils.closeModal()" class="p-1.5 hover:bg-gray-100 rounded-lg"><i data-lucide="x" class="w-5 h-5 text-gray-400"></i></button>';
        html += '</div>';

        html += '<div class="bg-gray-50 rounded-lg p-3 mb-4 text-sm">';
        html += '<p><strong>' + Utils.escapeHtml(user.nama || '-') + '</strong></p>';
        html += '<p class="text-xs text-gray-500">' + Utils.escapeHtml(user.email || '-') + '</p>';
        html += '</div>';

        html += '<form id="form-edit-user" class="space-y-4">';

        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Role *</label>';
        html += '<select id="fu-role" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '<option value="admin"' + (user.role === 'admin' ? ' selected' : '') + '>Administrator</option>';
        html += '<option value="psa"' + (user.role === 'psa' ? ' selected' : '') + '>PSA</option>';
        html += '<option value="klinik"' + (user.role === 'klinik' ? ' selected' : '') + '>Klinik</option>';
        html += '<option value="apotek"' + (user.role === 'apotek' ? ' selected' : '') + '>Apotek</option>';
        html += '</select></div>';

        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Link ke Karyawan</label>';
        html += '<select id="fu-karyawan" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '<option value="">-- Tidak ada --</option>';
        for (var k = 0; k < AppPengaturanUsers.karyawanList.length; k++) {
            var kar = AppPengaturanUsers.karyawanList[k];
            var sel = (user.karyawanId === kar.id) ? ' selected' : '';
            html += '<option value="' + kar.id + '"' + sel + '>' + Utils.escapeHtml(kar.nama) + ' (' + Utils.escapeHtml(kar.jabatan || '') + ')</option>';
        }
        html += '</select></div>';

        html += '<div class="flex justify-end gap-2 pt-2">';
        html += '<button type="button" onclick="Utils.closeModal()" class="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>';
        html += '<button type="submit" id="btn-simpan-user" class="px-6 py-2.5 text-sm bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition">Simpan</button>';
        html += '</div>';

        html += '</form></div>';

        Utils.openModal(html);

        document.getElementById('form-edit-user').addEventListener('submit', function(e) {
            e.preventDefault();
            AppPengaturanUsers.simpan(uid);
        });
    },

    /* =========================================
       SIMPAN
       ========================================= */
    simpan: function(uid) {
        var btn = document.getElementById('btn-simpan-user');
        btn.disabled = true;
        btn.textContent = 'Menyimpan...';

        var obj = {
            role: document.getElementById('fu-role').value,
            karyawanId: document.getElementById('fu-karyawan').value || '',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection('users').doc(uid).update(obj)
            .then(function() {
                Utils.toast('User berhasil diperbarui', 'success');
                Utils.closeModal();
                AppPengaturanUsers.init();
            })
            .catch(function(err) {
                Utils.toast('Gagal: ' + err.message, 'error');
                btn.disabled = false;
                btn.textContent = 'Simpan';
            });
    }
};
