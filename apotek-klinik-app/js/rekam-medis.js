/**
 * rekam-medis.js
 * Rekam medis pasien — dibuat oleh dokter setelah memeriksa
 */

window.AppRekamMedis = {

    data: [],
    filterDate: '',

    /* =========================================
       RENDER
       ========================================= */
    render: function() {
        AppRekamMedis.filterDate = Utils.today();

        var html = '<div class="page-enter">';

        html += '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">';
        html += '<div>';
        html += '<h2 class="text-xl font-bold text-gray-800">Rekam Medis</h2>';
        html += '<p class="text-sm text-gray-500">Catatan pemeriksaan dokter</p>';
        html += '</div>';
        html += '<button onclick="AppRekamMedis.renderFormTambah()" class="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-2 self-start"><i data-lucide="file-plus" class="w-4 h-4"></i> Buat Baru</button>';
        html += '</div>';

        // Filter tanggal
        html += '<div class="mb-4 flex items-center gap-3">';
        html += '<label class="text-sm text-gray-600">Tanggal:</label>';
        html += '<input type="date" id="rm-filter-date" value="' + AppRekamMedis.filterDate + '" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '</div>';

        html += '<div id="rm-list"></div>';
        html += '</div>';
        return html;
    },

    /* =========================================
       INIT
       ========================================= */
    init: function() {
        // Cek parameter dari URL (dari antrian)
        var params = Utils.getHashParams();
        if (params.antrian) {
            // Langsung buka form dari antrian
            AppRekamMedis.loadForForm(params.antrian);
            return;
        }

        AppRekamMedis.load();

        var dateInput = document.getElementById('rm-filter-date');
        if (dateInput) {
            dateInput.addEventListener('change', function() {
                AppRekamMedis.filterDate = dateInput.value;
                AppRekamMedis.load();
            });
        }
    },

    /* =========================================
       LOAD
       ========================================= */
    load: function() {
        Utils.showLoading('rm-list');
        var query = db.collection('rekamMedis').orderBy('tanggal', 'desc');
        if (AppRekamMedis.filterDate) {
            query = db.collection('rekamMedis').where('tanggal', '==', AppRekamMedis.filterDate).orderBy('createdAt', 'desc');
        }

        query.get()
            .then(function(snap) {
                AppRekamMedis.data = [];
                snap.forEach(function(doc) {
                    var d = doc.data();
                    d.id = doc.id;
                    AppRekamMedis.data.push(d);
                });
                AppRekamMedis.renderList();
            })
            .catch(function(err) {
                Utils.toast('Gagal memuat: ' + err.message, 'error');
            });
    },

    /* =========================================
       LOAD DATA UNTUK FORM (dari antrian)
       ========================================= */
    loadForForm: function(antrianId) {
        db.collection('antrian').doc(antrianId).get()
            .then(function(doc) {
                if (!doc.exists) {
                    Utils.toast('Data antrian tidak ditemukan', 'error');
                    AppRekamMedis.load();
                    return;
                }
                var antrian = doc.data();
                antrian.id = doc.id;

                // Load data pasien & dokter, lalu buka form
                var pasienData = null;
                var dokterData = null;

                var p1 = db.collection('pasien').doc(antrian.pasienId).get()
                    .then(function(pd) { if (pd.exists) pasienData = pd.data(); });

                var p2 = db.collection('users').doc(antrian.dokterId).get()
                    .then(function(dd) { if (dd.exists) dokterData = dd.data(); });

                Promise.all([p1, p2]).then(function() {
                    AppRekamMedis.renderForm({
                        antrianId: antrian.id,
                        noAntrian: antrian.noAntrian,
                        pasienId: antrian.pasienId,
                        pasienNama: antrian.pasienNama || (pasienData ? pasienData.nama : ''),
                        dokterId: antrian.dokterId,
                        dokterNama: antrian.dokterNama || (dokterData ? dokterData.nama : ''),
                        tanggal: antrian.tanggal
                    });
                });
            })
            .catch(function(err) {
                Utils.toast('Gagal memuat antrian: ' + err.message, 'error');
                AppRekamMedis.load();
            });
    },

    /* =========================================
       RENDER LIST
       ========================================= */
    renderList: function() {
        var container = document.getElementById('rm-list');
        if (!container) return;

        if (AppRekamMedis.data.length === 0) {
            container.innerHTML = '<div class="bg-white rounded-xl border border-gray-200 p-8 text-center"><p class="text-sm text-gray-400">Belum ada rekam medis</p></div>';
            return;
        }

        var html = '<div class="space-y-2">';
        for (var i = 0; i < AppRekamMedis.data.length; i++) {
            var r = AppRekamMedis.data[i];
            html += '<div class="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-primary-300 transition" onclick="AppRekamMedis.detail(\'' + r.id + '\')">';
            html += '<div class="flex items-start justify-between gap-3">';
            html += '<div class="flex-1 min-w-0">';
            html += '<p class="font-semibold text-gray-800">' + Utils.escapeHtml(r.pasienNama || '-') + '</p>';
            html += '<p class="text-xs text-gray-500 mt-0.5">' + Utils.escapeHtml(r.dokterNama || '-') + ' · ' + Utils.formatTanggalShort(r.tanggal) + '</p>';
            html += '<p class="text-sm text-gray-600 mt-1">Keluhan: ' + Utils.escapeHtml(r.keluhan || '-') + '</p>';
            html += '</div>';
            html += '<div class="flex-shrink-0">';
            if (r.diagnosa) {
                html += '<span class="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-medium">' + Utils.escapeHtml(r.diagnosa) + '</span>';
            }
            html += '</div></div></div>';
        }
        html += '</div>';
        html += '<p class="text-xs text-gray-400 mt-2 text-right">Total: ' + AppRekamMedis.data.length + ' record</p>';

        container.innerHTML = html;
    },

    /* =========================================
       DETAIL REKAM MEDIS
       ========================================= */
    detail: function(id) {
        var rm = null;
        for (var i = 0; i < AppRekamMedis.data.length; i++) {
            if (AppRekamMedis.data[i].id === id) { rm = AppRekamMedis.data[i]; break; }
        }
        if (!rm) { Utils.toast('Data tidak ditemukan', 'error'); return; }

        var html = '<div class="p-6">';
        html += '<div class="flex items-center justify-between mb-5">';
        html += '<h3 class="text-lg font-semibold text-gray-800">Detail Rekam Medis</h3>';
        html += '<button onclick="Utils.closeModal()" class="p-1.5 hover:bg-gray-100 rounded-lg"><i data-lucide="x" class="w-5 h-5 text-gray-400"></i></button>';
        html += '</div>';

        html += '<div class="space-y-3 text-sm">';
        html += '<div class="grid grid-cols-2 gap-3">';
        html += '<div><span class="text-gray-500">Pasien:</span> <strong>' + Utils.escapeHtml(rm.pasienNama || '-') + '</strong></div>';
        html += '<div><span class="text-gray-500">Dokter:</span> <strong>' + Utils.escapeHtml(rm.dokterNama || '-') + '</strong></div>';
        html += '<div><span class="text-gray-500">Tanggal:</span> <strong>' + Utils.formatTanggal(rm.tanggal) + '</strong></div>';
        if (rm.noAntrian) {
            html += '<div><span class="text-gray-500">No. Antrian:</span> <strong>' + Utils.escapeHtml(rm.noAntrian) + '</strong></div>';
        }
        html += '</div>';

        html += '<hr class="border-gray-200">';
        html += '<div><span class="text-gray-500 block mb-1">Keluhan:</span><p class="text-gray-800">' + Utils.escapeHtml(rm.keluhan || '-') + '</p></div>';
        html += '<div><span class="text-gray-500 block mb-1">Diagnosa:</span><p class="text-gray-800">' + Utils.escapeHtml(rm.diagnosa || '-') + '</p></div>';
        html += '<div><span class="text-gray-500 block mb-1">Tindakan:</span><p class="text-gray-800">' + Utils.escapeHtml(rm.tindakan || '-') + '</p></div>';
        html += '<div><span class="text-gray-500 block mb-1">Catatan:</span><p class="text-gray-800">' + Utils.escapeHtml(rm.catatan || '-') + '</p></div>';
        html += '</div>';

        // Tombol buat resep
        html += '<div class="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-200">';
        html += '<button onclick="Utils.closeModal(); AppResep.renderFormDariRM(\'' + rm.id + '\')" class="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-2"><i data-lucide="clipboard-list" class="w-4 h-4"></i> Buat Resep</button>';
        html += '</div>';

        html += '</div>';

        Utils.openModal(html);
    },

    /* =========================================
       FORM TAMBAH
       ========================================= */
    renderFormTambah: function() {
        AppRekamMedis.renderForm(null);
    },

    renderForm: function(prefill) {
        var v = prefill || {};
        var isFromAntrian = !!prefill.antrianId;

        var html = '<div class="p-6">';
        html += '<div class="flex items-center justify-between mb-5">';
        html += '<h3 class="text-lg font-semibold text-gray-800">Buat Rekam Medis</h3>';
        html += '<button onclick="Utils.closeModal()" class="p-1.5 hover:bg-gray-100 rounded-lg"><i data-lucide="x" class="w-5 h-5 text-gray-400"></i></button>';
        html += '</div>';

        html += '<form id="form-rm" class="space-y-4">';

        if (isFromAntrian) {
            html += '<div class="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-700">';
            html += 'Antrian: <strong>' + Utils.escapeHtml(v.noAntrian || '') + '</strong> — ' + Utils.escapeHtml(v.pasienNama || '') + ' (Dokter: ' + Utils.escapeHtml(v.dokterNama || '') + ')';
            html += '</div>';
            html += '<input type="hidden" id="rm-antrian-id" value="' + v.antrianId + '">';
        } else {
            html += '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">';
            html += '<div>';
            html += '<label class="block text-sm font-medium text-gray-700 mb-1">Pasien</label>';
            html += '<input type="text" id="rm-pasien-nama" value="' + Utils.escapeHtml(v.pasienNama || '') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50" readonly>';
            html += '</div>';
            html += '<div>';
            html += '<label class="block text-sm font-medium text-gray-700 mb-1">Dokter</label>';
            html += '<input type="text" id="rm-dokter-nama" value="' + Utils.escapeHtml(v.dokterNama || App.currentUser.nama) + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50" readonly>';
            html += '</div></div>';
        }

        html += '<input type="hidden" id="rm-pasien-id" value="' + (v.pasienId || '') + '">';
        html += '<input type="hidden" id="rm-dokter-id" value="' + (v.dokterId || App.currentUser.uid) + '">';
        html += '<input type="hidden" id="rm-tanggal" value="' + (v.tanggal || Utils.today()) + '">';
        html += '<input type="hidden" id="rm-pasien-nama-val" value="' + Utils.escapeHtml(v.pasienNama || '') + '">';
        html += '<input type="hidden" id="rm-dokter-nama-val" value="' + Utils.escapeHtml(v.dokterNama || App.currentUser.nama) + '">';

        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Keluhan *</label>';
        html += '<textarea id="rm-keluhan" rows="2" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Keluhan pasien...">' + Utils.escapeHtml(v.keluhan || '') + '</textarea>';
        html += '</div>';

        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Diagnosa</label>';
        html += '<input type="text" id="rm-diagnosa" value="' + Utils.escapeHtml(v.diagnosa || '') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Diagnosa...">';
        html += '</div>';

        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Tindakan</label>';
        html += '<input type="text" id="rm-tindakan" value="' + Utils.escapeHtml(v.tindakan || '') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Pemeriksaan fisik, dll...">';
        html += '</div>';

        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Catatan</label>';
        html += '<textarea id="rm-catatan" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Catatan tambahan...">' + Utils.escapeHtml(v.catatan || '') + '</textarea>';
        html += '</div>';

        html += '<div class="flex justify-end gap-2 pt-2">';
        html += '<button type="button" onclick="Utils.closeModal()" class="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>';
        html += '<button type="submit" id="btn-simpan-rm" class="px-6 py-2.5 text-sm bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition">Simpan</button>';
        html += '</div>';

        html += '</form></div>';

        Utils.openModal(html);

        document.getElementById('form-rm').addEventListener('submit', function(e) {
            e.preventDefault();
            AppRekamMedis.simpan();
        });
    },

       /* =========================================
       SIMPAN
       ========================================= */
    simpan: function() {
        var btn = document.getElementById('btn-simpan-rm');
        btn.disabled = true;
        btn.textContent = 'Menyimpan...';

        var keluhan = document.getElementById('rm-keluhan').value.trim();
        if (!keluhan) {
            Utils.toast('Keluhan wajib diisi', 'error');
            btn.disabled = false;
            btn.textContent = 'Simpan';
            return;
        }

        var antrianIdField = document.getElementById('rm-antrian-id');
        var hasAntrian = antrianIdField && antrianIdField.value;

        var dokterNamaVal = document.getElementById('rm-dokter-nama-val').value;
        var dokterIdVal = document.getElementById('rm-dokter-id').value;

        var obj = {
            pasienId:   document.getElementById('rm-pasien-id').value,
            pasienNama: document.getElementById('rm-pasien-nama-val').value,
            dokterId:   dokterIdVal,
            dokterNama: dokterNamaVal,
            tanggal:    document.getElementById('rm-tanggal').value,
            keluhan:    keluhan,
            diagnosa:   document.getElementById('rm-diagnosa').value.trim(),
            tindakan:   document.getElementById('rm-tindakan').value.trim(),
            catatan:    document.getElementById('rm-catatan').value.trim(),
            createdAt:  firebase.firestore.FieldValue.serverTimestamp()
        };

        // Kalau ada antrian, ambil noAntrian dulu (async yang benar)
        var savePromise;
        if (hasAntrian) {
            savePromise = db.collection('antrian').doc(antrianIdField.value).get()
                .then(function(antrianDoc) {
                    if (antrianDoc.exists) {
                        obj.antrianId = antrianIdField.value;
                        obj.noAntrian = antrianDoc.data().noAntrian || '';
                    }
                    return db.collection('rekamMedis').add(obj);
                });
        } else {
            savePromise = db.collection('rekamMedis').add(obj);
        }

        savePromise.then(function() {
            Utils.toast('Rekam medis berhasil disimpan', 'success');
            Utils.closeModal();
            AppRekamMedis.load();
        }).catch(function(err) {
            Utils.toast('Gagal menyimpan: ' + err.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Simpan';
        });
    }
