window.AppAntrian = {
    data: [],
    dokterList: [],
    selectedPasienId: null,
    filterStatus: 'semua',

    render: function() {
        var html = '<div class="page-enter">';
        html += '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">';
        html += '<div>';
        html += '<h2 class="text-xl font-bold text-gray-800">Antrian</h2>';
        html += '<p class="text-sm text-gray-500">' + Utils.formatTanggal(new Date()) + '</p>';
        html += '</div>';
        html += '<button onclick="AppAntrian.renderFormTambah()" class="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-2 self-start"><i data-lucide="user-plus" class="w-4 h-4"></i> Daftar Antrian</button>';
        html += '</div>';
        html += '<div class="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">';
        var tabs = [{ id: 'semua', label: 'Semua' }, { id: 'menunggu', label: 'Menunggu' }, { id: 'diperiksa', label: 'Diperiksa' }, { id: 'selesai', label: 'Selesai' }];
        for (var t = 0; t < tabs.length; t++) {
            var active = (AppAntrian.filterStatus === tabs[t].id) ? ' bg-white shadow-sm text-primary-700 font-semibold' : ' text-gray-500 hover:text-gray-700';
            html += '<button onclick="AppAntrian.setFilter(\'' + tabs[t].id + '\')" class="flex-1 py-2 text-sm rounded-md transition' + active + '">' + tabs[t].label + '</button>';
        }
        html += '</div>';
        html += '<div id="antrian-list"></div>';
        html += '</div>';
        return html;
    },

    init: function() {
        AppAntrian.loadDokter();
        AppAntrian.load();
        var searchInput = document.getElementById('antrian-search');
        if (searchInput) {
            var timeout;
            searchInput.addEventListener('input', function() {
                clearTimeout(timeout);
                var val = searchInput.value.trim().toLowerCase();
                timeout = setTimeout(function() {
                    if (!val) { AppAntrian.renderList(AppAntrian.data); return; }
                    var filtered = AppAntrian.data.filter(function(a) { return (a.pasienNama && a.pasienNama.toLowerCase().indexOf(val) !== -1); });
                    AppAntrian.renderList(filtered);
                }, 300);
            });
        }
    },

    setFilter: function(status) {
        AppAntrian.filterStatus = status;
        AppAntrian.renderList();
    },

    loadDokter: function() {
        db.collection('users').where('role', '==', 'klinik').get().then(function(snap) {
            AppAntrian.dokterList = [];
            snap.forEach(function(doc) { var d = doc.data(); d.id = doc.id; AppAntrian.dokterList.push(d); });
        }).catch(function() {});
    },

    load: function() {
        Utils.showLoading('antrian-list');
        var today = Utils.today();
        db.collection('antrian').where('tanggal', '==', today).get().then(function(snap) {
            AppAntrian.data = [];
            snap.forEach(function(doc) { var d = doc.data(); d.id = doc.id; AppAntrian.data.push(d); });
            AppAntrian.renderList();
        }).catch(function(err) {
            Utils.toast('Gagal memuat antrian: ' + err.message, 'error');
        });
    },

    renderList: function() {
        var container = document.getElementById('antrian-list');
        if (!container) return;
        var list = AppAntrian.data;
        if (AppAntrian.filterStatus !== 'semua') {
            list = list.filter(function(a) { return a.status === AppAntrian.filterStatus; });
        }
        if (list.length === 0) {
            container.innerHTML = '<div class="bg-white rounded-xl border border-gray-200 p-8 text-center"><p class="text-sm text-gray-400">Belum ada antrian hari ini</p></div>';
            return;
        }
        // Urutkan di JavaScript saja (bukan di Firestore)
        list.sort(function(a, b) {
            var na = a.noAntrian || '';
            var nb = b.noAntrian || '';
            if (na < nb) return -1;
            if (na > nb) return 1;
            return 0;
        });
        var html = '<div class="space-y-2">';
        for (var i = 0; i < list.length; i++) {
            var a = list[i];
            var statusColors = { 'menunggu': 'bg-blue-100 text-blue-700', 'diperiksa': 'bg-amber-100 text-amber-700', 'selesai': 'bg-green-100 text-green-700' };
            html += '<div class="bg-white rounded-xl border border-gray-200 p-4">';
            html += '<div class="flex items-start gap-3">';
            html += '<div class="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">';
            html += '<span class="text-sm font-bold text-primary-700">' + Utils.escapeHtml(a.noAntrian || '-') + '</span>';
            html += '</div>';
            html += '<div class="flex-1 min-w-0">';
            html += '<div class="flex items-center gap-2 flex-wrap">';
            html += '<p class="font-semibold text-gray-800">' + Utils.escapeHtml(a.pasienNama || '-') + '</p>';
            html += '<span class="text-xs px-2 py-0.5 rounded-full font-medium ' + (statusColors[a.status] || 'bg-gray-100 text-gray-600') + '">' + Utils.escapeHtml(a.status || '-') + '</span>';
            html += '</div>';
            html += '<p class="text-xs text-gray-500 mt-0.5">Dokter: ' + Utils.escapeHtml(a.dokterNama || '-') + '</p>';
            html += '<div class="flex gap-2 mt-2">';
            if (a.status === 'menunggu') {
                html += '<button onclick="AppAntrian.panggil(\'' + a.id + '\')" class="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg transition font-medium">Panggil</button>';
                html += '<button onclick="AppAntrian.hapus(\'' + a.id + '\')" class="text-xs text-gray-400 hover:text-red-600 px-2 py-1.5 rounded-lg transition">Batal</button>';
            }
            if (a.status === 'diperiksa') {
                html += '<button onclick="AppAntrian.buatRekamMedis(\'' + a.id + '\')" class="text-xs bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg transition font-medium">Buat Rekam Medis</button>';
                html += '<button onclick="AppAntrian.selesai(\'' + a.id + '\')" class="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition font-medium">Selesai</button>';
            }
            if (a.status === 'selesai') { html += '<span class="text-xs text-gray-400">Selesai diproses</span>'; }
            html += '</div></div></div></div>';
        }
        html += '</div>';
        container.innerHTML = html;
    },

    renderFormTambah: function() {
        AppAntrian.selectedPasienId = null;
        var html = '<div class="p-6">';
        html += '<div class="flex items-center justify-between mb-5">';
        html += '<h3 class="text-lg font-semibold text-gray-800">Daftar Antrian</h3>';
        html += '<button onclick="Utils.closeModal()" class="p-1.5 hover:bg-gray-100 rounded-lg"><i data-lucide="x" class="w-5 h-5 text-gray-400"></i></button>';
        html += '</div>';
        html += '<form id="form-antrian" class="space-y-4">';
        html += '<div id="antrian-pasien-selector">';
        html += '<div class="relative mb-2"><i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i><input type="text" id="fa-pasien-search" placeholder="Ketik nama pasien..." class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm" autocomplete="off"></div>';
        html += '<div id="fa-pasien-dropdown" class="hidden mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto"></div>';
        html += '<div id="fa-pasien-selected" class="hidden mt-2 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 flex items-center justify-between"><span id="fa-pasien-selected-name" class="text-sm font-medium text-primary-800"></span><button type="button" onclick="AppAntrian.clearPasienSelection()" class="text-primary-400 hover:text-primary-600 text-xs font-medium">Ganti</button></div>';
        html += '</div>';
        html += '<button type="button" onclick="AppAntrian.togglePasienBaru()" id="fa-btn-pasien-baru" class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"><i data-lucide="plus-circle" class="w-4 h-4"></i> Pasien Baru</button>';
        html += '<div id="fa-pasien-baru-form" class="hidden space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">';
        html += '<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">';
        html += '<div><label class="block text-xs font-medium text-gray-600 mb-1">Nama *</label><input type="text" id="fa-nb-nama" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Nama pasien"></div>';
        html += '<div><label class="block text-xs font-medium text-gray-600 mb-1">No. Telepon</label><input type="text" id="fa-nb-telp" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="08xxx"></div>';
        html += '<div><label class="block text-xs font-medium text-gray-600 mb-1">Jenis Kelamin</label><select id="fa-nb-jk" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="">-- Pilih --</option><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select></div>';
        html += '</div></div>';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Dokter *</label>';
        html += '<select id="fa-dokter" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="">-- Pilih Dokter --</option>';
        for (var d = 0; d < AppAntrian.dokterList.length; d++) { html += '<option value="' + AppAntrian.dokterList[d].id + '">' + Utils.escapeHtml(AppAntrian.dokterList[d].nama) + '</option>'; }
        html += '</select></div>';
        html += '<div class="flex justify-end gap-2 pt-2">';
        html += '<button type="button" onclick="Utils.closeModal()" class="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>';
        html += '<button type="submit" id="btn-simpan-antrian" class="px-6 py-2.5 text-sm bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition">Daftar</button>';
        html += '</div></form></div>';
        Utils.openModal(html);
        var searchInput = document.getElementById('fa-pasien-search');
        if (searchInput) {
            var searchTimeout;
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                var val = searchInput.value.trim().toLowerCase();
                searchTimeout = setTimeout(function() { AppAntrian.filterPasienDropdown(val); }, 200);
            });
            searchInput.addEventListener('focus', function() { if (searchInput.value.trim()) AppAntrian.filterPasienDropdown(searchInput.value.trim().toLowerCase()); });
        }
        document.addEventListener('click', function(e) {
            var dropdown = document.getElementById('fa-pasien-dropdown');
            var search = document.getElementById('fa-pasien-search');
            if (dropdown && search && !dropdown.contains(e.target) && e.target !== search) dropdown.classList.add('hidden');
        });
        document.getElementById('form-antrian').addEventListener('submit', function(e) { e.preventDefault(); AppAntrian.simpan(); });
    },

    togglePasienBaru: function() { var f = document.getElementById('fa-pasien-baru-form'); if (f) { f.classList.toggle('hidden'); if (!f.classList.contains('hidden')) document.getElementById('fa-nb-nama').focus(); } },

    filterPasienDropdown: function(query) {
        var dropdown = document.getElementById('fa-pasien-dropdown');
        if (!dropdown) return;
        if (!query) { dropdown.classList.add('hidden'); return; }
        if (AppPasien.data.length === 0) {
            db.collection('pasien').limit(50).get().then(function(snap) {
                AppPasien.data = [];
                snap.forEach(function(doc) { var d = doc.data(); d.id = doc.id; AppPasien.data.push(d); });
                AppAntrian.filterPasienDropdown(query);
            }); return;
        }
        var results = AppPasien.data.filter(function(p) { return (p.nama && p.nama.toLowerCase().indexOf(query) !== -1) || (p.noTelp && p.noTelp.indexOf(query) !== -1); }).slice(0, 8);
        if (results.length === 0) { dropdown.innerHTML = '<div class="px-3 py-2 text-sm text-gray-400">Tidak ditemukan</div>'; dropdown.classList.remove('hidden'); return; }
        var html = '';
        for (var i = 0; i < results.length; i++) {
            var p = results[i];
            html += '<button type="button" onclick="AppAntrian.selectPasien(\'' + p.id + '\')" class="w-full text-left px-3 py-2 hover:bg-primary-50 text-sm border-b border-gray-50 last:border-0 transition"><p class="font-medium text-gray-800">' + Utils.escapeHtml(p.nama) + '</p><p class="text-xs text-gray-500">' + Utils.escapeHtml(p.noTelp || '-') + ' · ' + Utils.escapeHtml(p.jenisKelamin || '-') + '</p></button>';
        }
        dropdown.innerHTML = html;
        dropdown.classList.remove('hidden');
    },

    selectPasien: function(pasienId) {
        AppAntrian.selectedPasienId = pasienId;
        var pasien = null;
        for (var i = 0; i < AppPasien.data.length; i++) { if (AppPasien.data[i].id === pasienId) { pasien = AppPasien.data[i]; break; } }
        if (!pasien) return;
        document.getElementById('fa-pasien-dropdown').classList.add('hidden');
        document.getElementById('fa-pasien-search').classList.add('hidden');
        document.getElementById('fa-pasien-selected').classList.remove('hidden');
        document.getElementById('fa-pasien-selected-name').textContent = pasien.nama;
    },

    clearPasienSelection: function() {
        AppAntrian.selectedPasienId = null;
        document.getElementById('fa-pasien-search').value = '';
        document.getElementById('fa-pasien-search').classList.remove('hidden');
        document.getElementById('fa-pasien-selected').classList.add('hidden');
        document.getElementById('fa-pasien-search').focus();
    },

    simpan: function() {
        var btn = document.getElementById('btn-simpan-antrian');
        btn.disabled = true; btn.textContent = 'Mendaftarkan...';
        var pasienBaruForm = document.getElementById('fa-pasien-baru-form');
        var isPasienBaru = !pasienBaruForm.classList.contains('hidden');
        var dokterId = document.getElementById('fa-dokter').value;
        if (!dokterId) { Utils.toast('Pilih dokter', 'error'); btn.disabled = false; btn.textContent = 'Daftar'; return; }
        var dokterNama = '';
        for (var d = 0; d < AppAntrian.dokterList.length; d++) { if (AppAntrian.dokterList[d].id === dokterId) { dokterNama = AppAntrian.dokterList[d].nama; break; } }
        var step1;
        if (isPasienBaru) {
            var namaBaru = document.getElementById('fa-nb-nama').value.trim();
            if (!namaBaru) { Utils.toast('Nama pasien baru wajib diisi', 'error'); btn.disabled = false; btn.textContent = 'Daftar'; return; }
            var pasienObj = { nama: namaBaru, noTelp: document.getElementById('fa-nb-telp').value.trim(), jenisKelamin: document.getElementById('fa-nb-jk').value, createdAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
            step1 = db.collection('pasien').add(pasienObj);
        } else if (AppAntrian.selectedPasienId) {
            step1 = Promise.resolve(AppAntrian.selectedPasienId);
        } else {
            Utils.toast('Pilih atau buat pasien', 'error'); btn.disabled = false; btn.textContent = 'Daftar'; return;
        }
        step1.then(function(pasienId) {
            var pasienNama = isPasienBaru ? namaBaru : '';
            if (!isPasienBaru) { for (var p = 0; p < AppPasien.data.length; p++) { if (AppPasien.data[p].id === pasienId) { pasienNama = AppPasien.data[p].nama; break; } }
            return db.collection('antrian').where('tanggal', '==', Utils.today()).get().then(function(snap) {
                var nomor = snap.size + 1;
                var noAntrian = 'A-' + String(nomor).padStart(3, '0');
                return db.collection('antrian').add({ noAntrian: noAntrian, tanggal: Utils.today(), pasienId: pasienId, pasienNama: pasienNama, dokterId: dokterId, dokterNama: dokterNama, status: 'menunggu', createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            });
        }).then(function() {
            Utils.toast('Antrian berhasil didaftarkan', 'success'); Utils.closeModal(); AppAntrian.load();
            if (isPasienBaru) AppPasien.load();
        }).catch(function(err) {
            Utils.toast('Gagal mendaftarkan: ' + err.message, 'error'); btn.disabled = false; btn.textContent = 'Daftar';
        });
    },

    panggil: function(id) { db.collection('antrian').doc(id).update({ status: 'diperiksa' }).then(function() { Utils.toast('Pasien dipanggil', 'success'); AppAntrian.load(); }).catch(function(err) { Utils.toast('Gagal: ' + err.message, 'error'); }); },
    selesai: function(id) { db.collection('antrian').doc(id).update({ status: 'selesai' }).then(function() { Utils.toast('Antrian selesai', 'success'); AppAntrian.load(); }).catch(function(err) { Utils.toast('Gagal: ' + err.message, 'error'); }); },
    hapus: function(id) { if (!confirm('Batalkan antrian ini?')) return; db.collection('antrian').doc(id).delete().then(function() { Utils.toast('Antrian dibatalkan', 'success'); AppAntrian.load(); }).catch(function(err) { Utils.toast('Gagal: ' + err.message, 'error'); }); },
    buatRekamMedis: function(antrianId) { window.location.hash = '#rekam-medis?antrian=' + antrianId; }
};
