/**
 * pasien.js
 * Data pasien — CRUD lengkap
 */

window.AppPasien = {

    data: [],

    /* =========================================
       RENDER
       ========================================= */
    render: function() {
        var html = '<div class="page-enter">';

        html += '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">';
        html += '<div>';
        html += '<h2 class="text-xl font-bold text-gray-800">Pasien</h2>';
        html += '<p class="text-sm text-gray-500">Data pasien klinik & apotek</p>';
        html += '</div>';
        html += '<button onclick="AppPasien.renderFormTambah()" class="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-2 self-start"><i data-lucide="user-plus" class="w-4 h-4"></i> Tambah Pasien</button>';
        html += '</div>';

        html += '<div class="mb-4 relative">';
        html += '<i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>';
        html += '<input type="text" id="pasien-search" placeholder="Cari nama, NIK, atau no. telepon..." class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm">';
        html += '</div>';

        html += '<div id="pasien-list"></div>';
        html += '</div>';
        return html;
    },

    /* =========================================
       INIT
       ========================================= */
    init: function() {
        AppPasien.load();
        var searchInput = document.getElementById('pasien-search');
        if (searchInput) {
            var timeout;
            searchInput.addEventListener('input', function() {
                clearTimeout(timeout);
                var val = searchInput.value.trim().toLowerCase();
                timeout = setTimeout(function() {
                    if (!val) { AppPasien.renderList(AppPasien.data); return; }
                    var filtered = AppPasien.data.filter(function(p) {
                        return (p.nama && p.nama.toLowerCase().indexOf(val) !== -1)
                            || (p.nik && p.nik.indexOf(val) !== -1)
                            || (p.noTelp && p.noTelp.indexOf(val) !== -1);
                    });
                    AppPasien.renderList(filtered);
                }, 300);
            });
        }
    },

    /* =========================================
       LOAD
       ========================================= */
    load: function() {
        Utils.showLoading('pasien-list');
        db.collection('pasien').orderBy('nama').get()
            .then(function(snap) {
                AppPasien.data = [];
                snap.forEach(function(doc) {
                    var d = doc.data();
                    d.id = doc.id;
                    AppPasien.data.push(d);
                });
                AppPasien.renderList(AppPasien.data);
            })
            .catch(function(err) {
                Utils.toast('Gagal memuat data pasien: ' + err.message, 'error');
            });
    },

    /* =========================================
       RENDER LIST
       ========================================= */
    renderList: function(list) {
        var container = document.getElementById('pasien-list');
        if (!container) return;

        if (!list || list.length === 0) {
            container.innerHTML = '<div class="bg-white rounded-xl border border-gray-200 p-8 text-center"><p class="text-sm text-gray-400">Belum ada data pasien</p></div>';
            return;
        }

        var html = '<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">';

        // Header desktop
        html += '<div class="hidden lg:grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">';
        html += '<div class="col-span-3">Nama</div>';
        html += '<div class="col-span-2">NIK</div>';
        html += '<div class="col-span-2">Tanggal Lahir</div>';
        html += '<div class="col-span-2">Telepon</div>';
        html += '<div class="col-span-1">JK</div>';
        html += '<div class="col-span-2 text-right">Aksi</div>';
        html += '</div>';

        for (var i = 0; i < list.length; i++) {
            var p = list[i];
            var namaEsc = Utils.escapeHtml(p.nama || '-');
            var safeName = (p.nama || '-').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

            html += '<div class="border-t border-gray-100 first:border-t-0">';

            // Desktop
            html += '<div class="hidden lg:grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50 text-sm">';
            html += '<div class="col-span-3 font-medium text-gray-800 truncate" title="' + namaEsc + '">' + namaEsc + '</div>';
            html += '<div class="col-span-2 text-gray-600 text-xs">' + Utils.escapeHtml(p.nik || '-') + '</div>';
            html += '<div class="col-span-2 text-gray-600 text-xs">' + Utils.formatTanggalShort(p.tglLahir) + '</div>';
            html += '<div class="col-span-2 text-gray-600 text-xs">' + Utils.escapeHtml(p.noTelp || '-') + '</div>';
            html += '<div class="col-span-1 text-gray-600 text-xs">' + Utils.escapeHtml(p.jenisKelamin || '-') + '</div>';
            html += '<div class="col-span-2 flex justify-end gap-1">';
            html += '<button onclick="AppPasien.renderFormEdit(\'' + p.id + '\')" class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="Edit"><i data-lucide="pencil" class="w-4 h-4"></i></button>';
            html += '<button onclick="AppPasien.hapus(\'' + p.id + '\',\'' + safeName + '\')" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Hapus"><i data-lucide="trash-2" class="w-4 h-4"></i></button>';
            html += '</div></div>';

            // Mobile
            html += '<div class="lg:hidden px-4 py-3">';
            html += '<div class="flex items-start justify-between gap-2">';
            html += '<div class="flex-1 min-w-0">';
            html += '<p class="font-medium text-gray-800 truncate">' + namaEsc + '</p>';
            html += '<p class="text-xs text-gray-500 mt-0.5">' + Utils.escapeHtml(p.jenisKelamin || '-') + ' · ' + Utils.formatTanggalShort(p.tglLahir) + '</p>';
            html += '<p class="text-xs text-gray-500">' + Utils.escapeHtml(p.noTelp || '-') + '</p>';
            if (p.alergiObat) {
                html += '<p class="text-xs text-red-500 mt-1">Alergi: ' + Utils.escapeHtml(p.alergiObat) + '</p>';
            }
            html += '</div>';
            html += '<div class="flex gap-1 flex-shrink-0">';
            html += '<button onclick="AppPasien.renderFormEdit(\'' + p.id + '\')" class="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg"><i data-lucide="pencil" class="w-4 h-4"></i></button>';
            html += '<button onclick="AppPasien.hapus(\'' + p.id + '\',\'' + safeName + '\')" class="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>';
            html += '</div></div></div>';

            html += '</div>';
        }

        html += '</div>';
        html += '<p class="text-xs text-gray-400 mt-2 text-right">Total: ' + list.length + ' pasien</p>';
        container.innerHTML = html;
        lucide.createIcons({ nodes: [container] });
    },

    /* =========================================
       FORM TAMBAH / EDIT
       ========================================= */
    renderFormTambah: function() {
        AppPasien.renderForm(null);
    },

    renderFormEdit: function(id) {
        var pasien = null;
        for (var i = 0; i < AppPasien.data.length; i++) {
            if (AppPasien.data[i].id === id) { pasien = AppPasien.data[i]; break; }
        }
        if (!pasien) {
            Utils.toast('Data pasien tidak ditemukan', 'error');
            return;
        }
        AppPasien.renderForm(pasien);
    },

    renderForm: function(data) {
        var isEdit = !!data;
        var title = isEdit ? 'Edit Pasien' : 'Tambah Pasien';
        var v = data || {};

        var html = '<div class="p-6">';
        html += '<div class="flex items-center justify-between mb-5">';
        html += '<h3 class="text-lg font-semibold text-gray-800">' + title + '</h3>';
        html += '<button onclick="Utils.closeModal()" class="p-1.5 hover:bg-gray-100 rounded-lg"><i data-lucide="x" class="w-5 h-5 text-gray-400"></i></button>';
        html += '</div>';

        html += '<form id="form-pasien" class="space-y-4">';

        // Nama + NIK
        html += '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>';
        html += '<input type="text" id="fp-nama" value="' + Utils.escapeHtml(v.nama || '') + '" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Nama pasien">';
        html += '</div>';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">NIK</label>';
        html += '<input type="text" id="fp-nik" value="' + Utils.escapeHtml(v.nik || '') + '" maxlength="16" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="16 digit NIK">';
        html += '</div></div>';

        // Tgl Lahir + JK + Gol Darah
        html += '<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>';
        html += '<input type="date" id="fp-tgl-lahir" value="' + (v.tglLahir || '') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '</div>';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>';
        html += '<select id="fp-jk" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '<option value="">-- Pilih --</option>';
        html += '<option value="Laki-laki"' + (v.jenisKelamin === 'Laki-laki' ? ' selected' : '') + '>Laki-laki</option>';
        html += '<option value="Perempuan"' + (v.jenisKelamin === 'Perempuan' ? ' selected' : '') + '>Perempuan</option>';
        html += '</select></div>';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Golongan Darah</label>';
        html += '<select id="fp-gol-darah" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '<option value="">-- Pilih --</option>';
        var gols = ['A', 'B', 'AB', 'O'];
        for (var g = 0; g < gols.length; g++) {
            html += '<option value="' + gols[g] + '"' + (v.golDarah === gols[g] ? ' selected' : '') + '>' + gols[g] + '</option>';
        }
        html += '</select></div></div>';

        // Telepon
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>';
        html += '<input type="text" id="fp-telp" value="' + Utils.escapeHtml(v.noTelp || '') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="08xxxxxxxxxx">';
        html += '</div>';

        // Alamat
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Alamat</label>';
        html += '<textarea id="fp-alamat" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Alamat lengkap">' + Utils.escapeHtml(v.alamat || '') + '</textarea>';
        html += '</div>';

        // Alergi
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Alergi Obat</label>';
        html += '<input type="text" id="fp-alergi" value="' + Utils.escapeHtml(v.alergiObat || '') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Pisahkan dengan koma: Penisilin, Aspirin">';
        html += '</div>';

        // Riwayat Penyakit
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Riwayat Penyakit</label>';
        html += '<textarea id="fp-riwayat" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Riwayat penyakit yang pernah diderita">' + Utils.escapeHtml(v.riwayatPenyakit || '') + '</textarea>';
        html += '</div>';

        // Tombol
        html += '<div class="flex justify-end gap-2 pt-2">';
        html += '<button type="button" onclick="Utils.closeModal()" class="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>';
        html += '<button type="submit" id="btn-simpan-pasien" class="px-6 py-2.5 text-sm bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition">Simpan</button>';
        html += '</div>';

        if (isEdit) {
            html += '<input type="hidden" id="fp-id" value="' + v.id + '">';
        }

        html += '</form></div>';

        Utils.openModal(html);

        document.getElementById('form-pasien').addEventListener('submit', function(e) {
            e.preventDefault();
            AppPasien.simpan();
        });
    },

    /* =========================================
       SIMPAN
       ========================================= */
    simpan: function() {
        var btn = document.getElementById('btn-simpan-pasien');
        btn.disabled = true;
        btn.textContent = 'Menyimpan...';

        var idField = document.getElementById('fp-id');
        var isEdit = !!idField;
        var id = isEdit ? idField.value : null;

        var nama = document.getElementById('fp-nama').value.trim();
        if (!nama) {
            Utils.toast('Nama pasien wajib diisi', 'error');
            btn.disabled = false;
            btn.textContent = 'Simpan';
            return;
        }

        var obj = {
            nama:           nama,
            nik:            document.getElementById('fp-nik').value.trim(),
            tglLahir:       document.getElementById('fp-tgl-lahir').value,
            jenisKelamin:   document.getElementById('fp-jk').value,
            golDarah:       document.getElementById('fp-gol-darah').value,
            noTelp:         document.getElementById('fp-telp').value.trim(),
            alamat:         document.getElementById('fp-alamat').value.trim(),
            alergiObat:     document.getElementById('fp-alergi').value.trim(),
            riwayatPenyakit:document.getElementById('fp-riwayat').value.trim(),
            updatedAt:      firebase.firestore.FieldValue.serverTimestamp()
        };

        var promise;
        if (isEdit) {
            promise = db.collection('pasien').doc(id).update(obj);
        } else {
            obj.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            promise = db.collection('pasien').add(obj);
        }

        promise.then(function() {
            Utils.toast(isEdit ? 'Pasien berhasil diperbarui' : 'Pasien berhasil ditambahkan', 'success');
            Utils.closeModal();
            AppPasien.load();
        }).catch(function(err) {
            Utils.toast('Gagal menyimpan: ' + err.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Simpan';
        });
    },

    /* =========================================
       HAPUS
       ========================================= */
    hapus: function(id, nama) {
        if (!confirm('Hapus pasien "' + nama + '"?\nData yang sudah dihapus tidak bisa dikembalikan.')) return;

        db.collection('pasien').doc(id).delete()
            .then(function() {
                Utils.toast('Pasien berhasil dihapus', 'success');
                AppPasien.load();
            })
            .catch(function(err) {
                Utils.toast('Gagal menghapus: ' + err.message, 'error');
            });
    }
};
