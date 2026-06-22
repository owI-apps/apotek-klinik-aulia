/**
 * auth.js
 * Menangani halaman login dan first-time setup
 */

window.AppAuth = {

    /**
     * Cek apakah ini pertama kali app dipake
     * (belum ada dokumen pengaturan/global)
     */
    checkFirstTime: function() {
        var db = firebase.firestore();
        return db.collection('pengaturan').doc('global').get()
            .then(function(doc) {
                return !doc.exists; // true kalau belum ada = first time
            })
            .catch(function() {
                return true;
            });
    },

    /**
     * Tampilkan halaman pertama kali (setup wizard)
     * Buat akun admin + setting dasar apotek & klinik
     */
    renderSetup: function() {
        var html = '';
        html += '<div class="bg-white rounded-2xl shadow-xl p-8">';
        html += '  <div class="text-center mb-6">';
        html += '    <div class="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-3">';
        html += '      <i data-lucide="pill" class="w-8 h-8 text-primary-600"></i>';
        html += '    </div>';
        html += '    <h2 class="text-2xl font-bold text-gray-800">Setup Awal</h2>';
        html += '    <p class="text-sm text-gray-500 mt-1">Buat akun Admin & pengaturan dasar</p>';
        html += '  </div>';
        html += '  <form id="form-setup" class="space-y-4">';
        html += '    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">';
        html += '      <div>';
        html += '        <label class="block text-sm font-medium text-gray-700 mb-1">Nama Apotek</label>';
        html += '        <input type="text" id="s-nama-apotek" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Apotek Aulia">';
        html += '      </div>';
        html += '      <div>';
        html += '        <label class="block text-sm font-medium text-gray-700 mb-1">Nama Klinik</label>';
        html += '        <input type="text" id="s-nama-klinik" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Klinik Sehat">';
        html += '      </div>';
        html += '    </div>';
        html += '    <div>';
        html += '      <label class="block text-sm font-medium text-gray-700 mb-1">Alamat</label>';
        html += '      <input type="text" id="s-alamat" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Jl. Contoh No. 123">';
        html += '    </div>';
        html += '    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">';
        html += '      <div>';
        html += '        <label class="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>';
        html += '        <input type="text" id="s-telp" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="08xxxxxxxxxx">';
        html += '      </div>';
        html += '      <div>';
        html += '        <label class="block text-sm font-medium text-gray-700 mb-1">Nama Admin</label>';
        html += '        <input type="text" id="s-nama-admin" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Nama lengkap">';
        html += '      </div>';
        html += '    </div>';
        html += '    <hr class="border-gray-200">';
        html += '    <p class="text-xs text-gray-500">Akun Admin untuk login ke aplikasi</p>';
        html += '    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">';
        html += '      <div>';
        html += '        <label class="block text-sm font-medium text-gray-700 mb-1">Email Admin</label>';
        html += '        <input type="email" id="s-email" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="admin@email.com">';
        html += '      </div>';
        html += '      <div>';
        html += '        <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>';
        html += '        <input type="password" id="s-password" required minlength="6" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Min. 6 karakter">';
        html += '      </div>';
        html += '    </div>';
        html += '    <button type="submit" id="btn-setup" class="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition text-sm">';
        html += '      Mulai Setup';
        html += '    </button>';
        html += '  </form>';
        html += '</div>';

        document.getElementById('login-content').innerHTML = html;
        lucide.createIcons();

        // Event submit
        document.getElementById('form-setup').addEventListener('submit', function(e) {
            e.preventDefault();
            AppAuth.doSetup();
        });
    },

    /**
     * Proses setup: buat auth user + simpan pengaturan
     */
    doSetup: function() {
        var btn = document.getElementById('btn-setup');
        btn.disabled = true;
        btn.textContent = 'Memproses...';

        var namaApotek = document.getElementById('s-nama-apotek').value.trim();
        var namaKlinik = document.getElementById('s-nama-klinik').value.trim();
        var alamat     = document.getElementById('s-alamat').value.trim();
        var telp       = document.getElementById('s-telp').value.trim();
        var namaAdmin  = document.getElementById('s-nama-admin').value.trim();
        var email      = document.getElementById('s-email').value.trim();
        var password   = document.getElementById('s-password').value;

        // 1. Buat akun Firebase Auth
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then(function(userCredential) {
                var uid = userCredential.user.uid;
                var db = firebase.firestore();

                // 2. Simpan data user
                return db.collection('users').doc(uid).set({
                    nama: namaAdmin,
                    email: email,
                    role: 'admin',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(function() {
                    // 3. Simpan pengaturan global
                    return db.collection('pengaturan').doc('global').set({
                        namaApotek: namaApotek,
                        namaKlinik: namaKlinik,
                        alamat: alamat,
                        telp: telp,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }).then(function() {
                    // 4. Simpan default pengaturan pembagian
                    return db.collection('pengaturanPembagian').doc('global').set({
                        resep: { nilaiResep: 60000, jm: 25000, jd: 1000, karyKlinik: 8000, karyApotek: 10000, psa: 2000 },
                        resepLuar: { nilaiResep: 20000, dokter: 8000, psa: 8000 },
                        tindakanKlinik: { dokter: 50, karyKlinik: 50 },
                        tindakanApotek: { karyApotek: 80, psa: 20 },
                        slotKaryawanKlinik: [
                            { label: 'Karyawan 1', karyawanId: '', persen: 50, isTHR: false },
                            { label: 'Karyawan 2', karyawanId: '', persen: 40, isTHR: false },
                            { label: 'THR Klinik', karyawanId: '', persen: 10, isTHR: true }
                        ],
                        slotKaryawanApotek: [
                            { label: 'Karyawan Apotek 1', karyawanId: '', persen: 40, isTHR: false },
                            { label: 'Karyawan Apotek 2', karyawanId: '', persen: 30, isTHR: false },
                            { label: 'Karyawan Apotek 3', karyawanId: '', persen: 20, isTHR: false },
                            { label: 'THR Karyawan Apotek', karyawanId: '', persen: 10, isTHR: true }
                        ],
                        tunjanganOmzet: { persen: 3.5 },
                        transport: { nominal: 550000 },
                        uangMakan: { nominal: 50000 },
                        marginResep: 35,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }).then(function() {
                    Utils.toast('Setup berhasil! Mengalihkan...', 'success');
                });
            })
            .catch(function(err) {
                btn.disabled = false;
                btn.textContent = 'Mulai Setup';
                var pesan = err.message;
                if (err.code === 'auth/email-already-in-use') pesan = 'Email sudah terdaftar di Firebase. Hapus dulu di Console > Authentication, atau langsung login.';
                Utils.toast(pesan, 'error');
            });
    },

    /**
     * Tampilkan halaman login biasa
     */
    renderLogin: function() {
        var html = '';
        html += '<div class="bg-white rounded-2xl shadow-xl p-8">';
        html += '  <div class="text-center mb-6">';
        html += '    <div class="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-3">';
        html += '      <i data-lucide="pill" class="w-8 h-8 text-primary-600"></i>';
        html += '    </div>';
        html += '    <h2 class="text-2xl font-bold text-gray-800">Masuk</h2>';
        html += '    <p class="text-sm text-gray-500 mt-1">Apotek & Klinik System</p>';
        html += '  </div>';
        html += '  <form id="form-login" class="space-y-4">';
        html += '    <div>';
        html += '      <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>';
        html += '      <input type="email" id="l-email" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="admin@email.com">';
        html += '    </div>';
        html += '    <div>';
        html += '      <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>';
        html += '      <input type="password" id="l-password" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="••••••••">';
        html += '    </div>';
        html += '    <button type="submit" id="btn-login" class="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition text-sm">';
        html += '      Masuk';
        html += '    </button>';
        html += '  </form>';
        html += '</div>';

        document.getElementById('login-content').innerHTML = html;
        lucide.createIcons();

        document.getElementById('form-login').addEventListener('submit', function(e) {
            e.preventDefault();
            AppAuth.doLogin();
        });
    },

    /**
     * Proses login
     */
    doLogin: function() {
        var btn = document.getElementById('btn-login');
        btn.disabled = true;
        btn.textContent = 'Memproses...';

        var email    = document.getElementById('l-email').value.trim();
        var password = document.getElementById('l-password').value;

        firebase.auth().signInWithEmailAndPassword(email, password)
            .catch(function(err) {
                btn.disabled = false;
                btn.textContent = 'Masuk';
                Utils.toast(err.message, 'error');
            });
    }
};
