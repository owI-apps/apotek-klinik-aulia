/**
 * karyawan.js
 * Data karyawan — CRUD lengkap
 */

window.AppKaryawan = {

    data: [],
    jabatanList: ['Dokter', 'Perawat', 'Petugas Pendaftaran', 'Apoteker', 'Asisten Apoteker', 'Kasir', 'Admin', 'Lainnya'],

    /* =========================================
       RENDER
       ========================================= */
    render: function() {
        var html = '<div class="page-enter max-w-4xl">';
        html += '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">';
        html += '<div>';
        html += '<h2 class="text-xl font-bold text-gray-800">Karyawan</h2>';
        html += '<p class="text-sm text-gray-500">Data karyawan klinik & apotek</p>';
        html += '</div>';
        html += '<button onclick="AppKaryawan.renderFormTambah()" class="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-2 self-start"><i data-lucide="user-plus" class="w-4 h-4"></i> Tambah Karyawan</button>';
        html += '</div>';

        html += '<div class="mb-4 relative">';
        html += '<i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>';
        html += '<input type="text" id="kar-search" placeholder="Cari nama atau NIK..." class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm">';
        html += '</div>';

        html += '<div id="kar-list"></div>';
        html += '</div>';
        return html;
    },

    /* =========================================
       INIT
       ========================================= */
    init: function() {
        AppKaryawan.load();
        var searchInput = document.getElementById('kar-search');
        if (searchInput) {
            var timeout;
            searchInput.addEventListener('input', function() {
                clearTimeout(timeout);
                var val = searchInput.value.trim().toLowerCase();
                timeout = setTimeout(function() {
                    if (!val) { AppKaryawan.renderList(AppKaryawan.data); return; }
                    var filtered = AppKaryawan.data.filter(function(k) {
                        return (k.nama && k.nama.toLowerCase().indexOf(val) !== -1)
                            || (k.nik && k.nik.indexOf(val) !== -1);
                    });
                    AppKaryawan.renderList(filtered);
                }, 300);
            });
        }
    },

    /* =========================================
       LOAD
       ========================================= */
    load: function() {
        Utils.showLoading('kar-list');
        db.collection('karyawan').orderBy('nama').get()
            .then(function(snap) {
                AppKaryawan.data = [];
                snap.forEach(function(doc) {
                    var d = doc.data();
                    d.id = doc.id;
                    AppKaryawan.data.push(d);
                });
                AppKaryawan.renderList(AppKaryawan.data);
            })
            .catch(function(err) {
                Utils.toast('Gagal memuat: ' + err.message, 'error');
            });
    },

    /* =========================================
       RENDER LIST
       ========================================= */
    renderList: function(list) {
        var container = document.getElementById('kar-list');
        if (!container) return;

        if (!list || list.length === 0) {
            container.innerHTML = '<div class="bg-white rounded-xl border border-gray-200 p-8 text-center"><p class="text-sm text-gray-400">Belum ada data karyawan</p></div>';
            return;
        }

        var html = '<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">';
        html += '<div class="hidden lg:grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">';
        html += '<div class="col-span-3">Nama</div>';
        html += '<div class="col-span-2">Jabatan</div>';
        html += '<div class="col-span-2">Departemen</div>';
        html += '<div class="col-span-2">Gaji Pokok</div>';
        html += '<div class="col-span-1">Status</div>';
        html += '<div class="col-span-2 text-right">Aksi</div>';
        html += '</div>';

        for (var i = 0; i < list.length; i++) {
            var k = list[i];
            var namaEsc = Utils.escapeHtml(k.nama || '-');
            var safeName = (k.nama || '-').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            var depClass = (k.departemen === 'Klinik') ? 'bg-purple-50 text-purple-700' : 'bg-teal-50 text-teal-700';
            var statusClass = (k.status === 'aktif') ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500';
            var statusLabel = (k.status === 'aktif') ? 'Aktif' : 'Nonaktif';

            html += '<div class="border-t border-gray-100 first:border-t-0">';

            // Desktop
            html += '<div class="hidden lg:grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50 text-sm">';
            html += '<div class="col-span-3 font-medium text-gray-800 truncate">' + namaEsc + '</div>';
            html += '<div class="col-span-2 text-gray-600 text-xs">' + Utils.escapeHtml(k.jabatan || '-') + '</div>';
            html += '<div class="col-span-2"><span class="text-xs px-2 py-0.5 rounded-full font-medium ' + depClass + '">' + Utils.escapeHtml(k.departemen || '-') + '</span></div>';
            html += '<div class="col-span-2 text-gray-600 text-xs">' + ((k.departemen === 'Apotek') ? Utils.formatRupiah(k.gajiPokok || 0) : '-') + '</div>';
            html += '<div class="col-span-1"><span class="text-xs px-2 py-0.5 rounded-full font-medium ' + statusClass + '">' + statusLabel + '</span></div>';
            html += '<div class="col-span-2 flex justify-end gap-1">';
            html += '<button onclick="AppKaryawan.renderFormEdit(\'' + k.id + '\')" class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="Edit"><i data-lucide="pencil" class="w-4 h-4"></i></button>';
            html += '<button onclick="AppKaryawan.hapus(\'' + k.id + '\',\'' + safeName + '\')" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Hapus"><i data-lucide="trash-2" class="w-4 h-4"></i></button>';
            html += '</div></div>';

            // Mobile
            html += '<div class="lg:hidden px-4 py-3">';
            html += '<div class="flex items-start justify-between gap-2">';
            html += '<div class="flex-1 min-w-0">';
            html += '<p class="font-medium text-gray-800 truncate">' + namaEsc + '</p>';
            html += '<p class="text-xs text-gray-500 mt-0.5">' + Utils.escapeHtml(k.jabatan || '-') + '</p>';
            if (k.departemen === 'Apotek') html += '<p class="text-xs text-gray-600 mt-0.5">Gaji: ' + Utils.formatRupiah(k.gajiPokok || 0) + '</p>';
            html += '</div>';
            html += '<div class="flex items-center gap-2 flex-shrink-0">';
            html += '<span class="text-xs px-2 py-0.5 rounded-full font-medium ' + depClass + '">' + Utils.escapeHtml(k.departemen || '-') + '</span>';
            html += '<span class="text-xs px-2 py-0.5 rounded-full font-medium ' + statusClass + '">' + statusLabel + '</span>';
            html += '<button onclick="AppKaryawan.renderFormEdit(\'' + k.id + '\')" class="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg"><i data-lucide="pencil" class="w-4 h-4"></i></button>';
            html += '<button onclick="AppKaryawan.hapus(\'' + k.id + '\',\'' + safeName + '\')" class="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>';
            html += '</div></div></div>';

            html += '</div>';
        }

        html += '</div>';
        html += '<p class="text-xs text-gray-400 mt-2 text-right">Total: ' + list.length + ' karyawan</p>';
        container.innerHTML = html;
        lucide.createIcons({ nodes: [container] });
    },

    /* =========================================
       FORM
       ========================================= */
    renderFormTambah: function() {
        AppKaryawan.renderForm(null);
    },

    renderFormEdit: function(id) {
        var kar = null;
        for (var i = 0; i < AppKaryawan.data.length; i++) {
            if (AppKaryawan.data[i].id === id) { kar = AppKaryawan.data[i]; break; }
        }
        if (!kar) { Utils.toast('Data tidak ditemukan', 'error'); return; }
        AppKaryawan.renderForm(kar);
    },

    renderForm: function(data) {
        var isEdit = !!data;
        var title = isEdit ? 'Edit Karyawan' : 'Tambah Karyawan';
        var v = data || {};
        var isApotek = (v.departemen === 'Apotek');

        var html = '<div class="p-6">';
        html += '<div class="flex items-center justify-between mb-5">';
        html += '<h3 class="text-lg font-semibold text-gray-800">' + title + '</h3>';
        html += '<button onclick="Utils.closeModal()" class="p-1.5 hover:bg-gray-100 rounded-lg"><i data-lucide="x" class="w-5 h-5 text-gray-400"></i></button>';
        html += '</div>';

        html += '<form id="form-karyawan" class="space-y-4">';

        // Nama + NIK
        html += '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>';
        html += '<input type="text" id="fk-nama" value="' + Utils.escapeHtml(v.nama || '') + '" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Nama karyawan">';
        html += '</div>';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">NIK</label>';
        html += '<input type="text" id="fk-nik" value="' + Utils.escapeHtml(v.nik || '') + '" maxlength="16" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="16 digit">';
        html += '</div></div>';

        // Jabatan + Departemen
        html += '<div class="grid grid-cols-2 gap-4">';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Jabatan *</label>';
        html += '<select id="fk-jabatan" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onchange="AppKaryawan.toggleGajiPokok()">';
        html += '<option value="">-- Pilih --</option>';
        for (var j = 0; j < AppKaryawan.jabatanList.length; j++) {
            var sel = (v.jabatan === AppKaryawan.jabatanList[j]) ? ' selected' : '';
            html += '<option value="' + AppKaryawan.jabatanList[j] + '"' + sel + '>' + AppKaryawan.jabatanList[j] + '</option>';
        }
        html += '</select></div>';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Departemen *</label>';
        html += '<select id="fk-departemen" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onchange="AppKaryawan.toggleGajiPokok()">';
        html += '<option value="">-- Pilih --</option>';
        html += '<option value="Klinik"' + (v.departemen === 'Klinik' ? ' selected' : '') + '>Klinik</option>';
        html += '<option value="Apotek"' + (v.departemen === 'Apotek' ? ' selected' : '') + '>Apotek</option>';
        html += '</select></div></div>';

        // Gaji Pokok (hanya Apotek)
        html += '<div id="fk-gaji-row"' + (isApotek ? '' : ' class="hidden"') + '>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Gaji Pokok (Rp)</label>';
        html += '<input type="number" id="fk-gaji" value="' + (v.gajiPokok || 0) + '" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="0">';
        html += '</div>';

        // Telepon + Tanggal Masuk
        html += '<div class="grid grid-cols-2 gap-4">';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>';
        html += '<input type="text" id="fk-telp" value="' + Utils.escapeHtml(v.noTelp || '') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="08xxx">';
        html += '</div>';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Masuk</label>';
        html += '<input type="date" id="fk-tanggal" value="' + (v.tanggalMasuk || '') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '</div></div>';

        // Alamat
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Alamat</label>';
        html += '<textarea id="fk-alamat" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Alamat lengkap">' + Utils.escapeHtml(v.alamat || '') + '</textarea>';
        html += '</div>';

        // Status
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Status</label>';
        html += '<select id="fk-status" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '<option value="aktif"' + (v.status !== 'tidak aktif' ? ' selected' : '') + '>Aktif</option>';
        html += '<option value="tidak aktif"' + (v.status === 'tidak aktif' ? ' selected' : '') + '>Tidak Aktif</option>';
        html += '</select></div>';

        // Tombol
        html += '<div class="flex justify-end gap-2 pt-2">';
        html += '<button type="button" onclick="Utils.closeModal()" class="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>';
        html += '<button type="submit" id="btn-simpan-kar" class="px-6 py-2.5 text-sm bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition">Simpan</button>';
        html += '</div>';

        if (isEdit) {
            html += '<input type="hidden" id="fk-id" value="' + v.id + '">';
        }

        html += '</form></div>';

        Utils.openModal(html);

        document.getElementById('form-karyawan').addEventListener('submit', function(e) {
            e.preventDefault();
            AppKaryawan.simpan();
        });
    },

    /* =========================================
       TOGGLE GAJI POKOK VISIBILITY
       ========================================= */
    toggleGajiPokok: function() {
        var dep = document.getElementById('fk-departemen');
        var row = document.getElementById('fk-gaji-row');
        if (dep && row) {
            if (dep.value === 'Apotek') {
                row.classList.remove('hidden');
            } else {
                row.classList.add('hidden');
            }
        }
    },

    /* =========================================
       SIMPAN
       ========================================= */
    simpan: function() {
        var btn = document.getElementById('btn-simpan-kar');
        btn.disabled = true;
        btn.textContent = 'Menyimpan...';

        var idField = document.getElementById('fk-id');
        var isEdit = !!idField;
        var id = isEdit ? idField.value : null;

        var nama = document.getElementById('fk-nama').value.trim();
        var departemen = document.getElementById('fk-departemen').value;

        if (!nama || !departemen) {
            Utils.toast('Nama dan Departemen wajib diisi', 'error');
            btn.disabled = false;
            btn.textContent = 'Simpan';
            return;
        }

        var obj = {
            nama:          nama,
            nik:           document.getElementById('fk-nik').value.trim(),
            jabatan:       document.getElementById('fk-jabatan').value,
            departemen:    departemen,
            gajiPokok:     (departemen === 'Apotek') ? (parseFloat(document.getElementById('fk-gaji').value) || 0) : 0,
            noTelp:        document.getElementById('fk-telp').value.trim(),
            alamat:        document.getElementById('fk-alamat').value.trim(),
            tanggalMasuk:  document.getElementById('fk-tanggal').value,
            status:        document.getElementById('fk-status').value,
            userId:        '',
            updatedAt:      firebase.firestore.FieldValue.serverTimestamp()
        };

        // Pertahankan userId dari data lama jika ada
        if (isEdit) {
            for (var i = 0; i < AppKaryawan.data.length; i++) {
                if (AppKaryawan.data[i].id === id) {
                    obj.userId = AppKaryawan.data[i].userId || '';
                    break;
                }
            }
        }

        var promise;
        if (isEdit) {
            promise = db.collection('karyawan').doc(id).update(obj);
        } else {
            obj.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            promise = db.collection('karyawan').add(obj);
        }

        promise.then(function() {
            Utils.toast(isEdit ? 'Karyawan berhasil diperbarui' : 'Karyawan berhasil ditambahkan', 'success');
            Utils.closeModal();
            AppKaryawan.load();
        }).catch(function(err) {
            Utils.toast('Gagal menyimpan: ' + err.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Simpan';
        });
    },

    /* =========================================
       HAPUS (soft delete via status)
       ========================================= */
    hapus: function(id, nama) {
        if (!confirm('Nonaktifkan karyawan "' + nama + '"?\nData tidak dihapus, hanya diubah statusnya menjadi tidak aktif.')) return;

        db.collection('karyawan').doc(id).update({ status: 'tidak aktif', updatedAt: firebase.firestore.FieldValue.serverTimestamp() })
            .then(function() {
                Utils.toast('Karyawan dinonaktifkan', 'success');
                AppKaryawan.load();
            })
            .catch(function(err) {
                Utils.toast('Gagal: ' + err.message, 'error');
            });
    }
};
