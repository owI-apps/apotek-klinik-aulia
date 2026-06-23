window.AppPengaturanTindakan = {
    data: [],
    filterKategori: 'semua',
    formConsumables: [],

    render: function() {
        var html = '<div class="page-enter max-w-3xl">';
        html += '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">';
        html += '<div>';
        html += '<h2 class="text-xl font-bold text-gray-800">Master Tindakan</h2>';
        html += '<p class="text-sm text-gray-500">Daftar tindakan klinik & apotek beserta harga dan modal</p>';
        html += '</div>';
        html += '<button onclick="AppPengaturanTindakan.renderFormTambah()" class="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-2 self-start"><i data-lucide="plus" class="w-4 h-4"></i> Tambah Tindakan</button>';
        html += '</div>';
        html += '<div class="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">';
        var tabs = [{ id: 'semua', label: 'Semua' }, { id: 'klinik', label: 'Klinik' }, { id: 'apotek', label: 'Apotek' }];
        for (var t = 0; t < tabs.length; t++) {
            var active = (AppPengaturanTindakan.filterKategori === tabs[t].id) ? ' bg-white shadow-sm text-primary-700 font-semibold' : ' text-gray-500 hover:text-gray-700';
            html += '<button onclick="AppPengaturanTindakan.setFilter(\'' + tabs[t].id + '\')" class="flex-1 py-2 text-sm rounded-md transition' + active + '">' + tabs[t].label + '</button>';
        }
        html += '</div>';
        html += '<div id="tindakan-list"></div>';
        html += '</div>';
        return html;
    },

    init: function() { AppPengaturanTindakan.load(); },
    setFilter: function(kat) { AppPengaturanTindakan.filterKategori = kat; AppPengaturanTindakan.renderList(); },

    load: function() {
        Utils.showLoading('tindakan-list');
        db.collection('masterTindakan').get().then(function(snap) {
            AppPengaturanTindakan.data = [];
            snap.forEach(function(doc) { var d = doc.data(); d.id = doc.id; AppPengaturanTindakan.data.push(d); });
            AppPengaturanTindakan.renderList();
        }).catch(function(err) { Utils.toast('Gagal memuat: ' + err.message, 'error'); });
    },

    renderList: function() {
        var container = document.getElementById('tindakan-list');
        if (!container) return;
        var list = AppPengaturanTindakan.data;
        if (AppPengaturanTindakan.filterKategori !== 'semua') { list = list.filter(function(t) { return t.kategori === AppPengaturanTindakan.filterKategori; }); }
        if (list.length === 0) { container.innerHTML = '<div class="bg-white rounded-xl border border-gray-200 p-8 text-center"><p class="text-sm text-gray-400">Belum ada data tindakan</p></div>'; return; }
        var html = '<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">';
        html += '<div class="hidden lg:grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider"><div class="col-span-3">Nama</div><div class="col-span-2">Kategori</div><div class="col-span-2">Harga Jual</div><div class="col-span-2">Modal</div><div class="col-span-1">Tuslah</div><div class="col-span-2 text-right">Aksi</div></div>';
        for (var i = 0; i < list.length; i++) {
            var t = list[i]; var tuslah = (t.hargaJual || 0) - (t.modal || 0); var namaEsc = Utils.escapeHtml(t.nama || '-');
            var safeName = (t.nama || '-').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            var katBadge = (t.kategori === 'klinik') ? '<span class="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">Klinik</span>' : '<span class="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">Apotek</span>';
            var aktifBadge = (t.aktif !== false) ? '<span class="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full ml-1">Aktif</span>' : '<span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-1">Nonaktif</span>';
            html += '<div class="border-t border-gray-100 first:border-t-0">';
            html += '<div class="hidden lg:grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50 text-sm"><div class="col-span-3 font-medium text-gray-800 truncate" title="' + namaEsc + '">' + namaEsc + '</div><div class="col-span-2">' + katBadge + aktifBadge + '</div><div class="col-span-2 text-gray-600">' + Utils.formatRupiah(t.hargaJual) + '</div><div class="col-span-2 text-gray-600">' + Utils.formatRupiah(t.modal) + '</div><div class="col-span-1 text-green-600 font-medium">' + Utils.formatRupiah(tuslah) + '</div><div class="col-span-2 flex justify-end gap-1"><button onclick="AppPengaturanTindakan.renderFormEdit(\'' + t.id + '\')" class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="Edit"><i data-lucide="pencil" class="w-4 h-4"></i></button><button onclick="AppPengaturanTindakan.hapus(\'' + t.id + '\',\'' + safeName + '\')" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Hapus"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div></div>';
            html += '<div class="lg:hidden px-4 py-3"><div class="flex items-start justify-between gap-2"><div class="flex-1 min-w-0"><p class="font-medium text-gray-800 truncate">' + namaEsc + '</p><p class="text-xs text-gray-500 mt-0.5">Jual: ' + Utils.formatRupiah(t.hargaJual) + ' · Modal: ' + Utils.formatRupiah(t.modal) + ' · Tuslah: ' + Utils.formatRupiah(tuslah) + '</p></div><div class="flex items-center gap-2 flex-shrink-0">' + katBadge + aktifBadge + '<button onclick="AppPengaturanTindakan.renderFormEdit(\'' + t.id + '\')" class="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg"><i data-lucide="pencil" class="w-4 h-4"></i></button><button onclick="AppPengaturanTindakan.hapus(\'' + t.id + '\',\'' + safeName + '\')" class="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div></div></div>';
            html += '</div>';
        }
        html += '</div>';
        html += '<p class="text-xs text-gray-400 mt-2 text-right">Total: ' + list.length + ' tindakan</p>';
        container.innerHTML = html;
        lucide.createIcons({ nodes: [container] });
    },

    renderFormTambah: function() { AppPengaturanTindakan.formConsumables = []; AppPengaturanTindakan.renderForm(null); },
    renderFormEdit: function(id) {
        var tindakan = null;
        for (var i = 0; i < AppPengaturanTindakan.data.length; i++) { if (AppPengaturanTindakan.data[i].id === id) { tindakan = AppPengaturanTindakan.data[i]; break; } }
        if (!tindakan) { Utils.toast('Data tidak ditemukan', 'error'); return; }
        AppPengaturanTindakan.formConsumables = (tindakan.consumables && Array.isArray(tindakan.consumables)) ? tindakan.consumables.slice() : [];
        AppPengaturanTindakan.renderForm(tindakan);
    },

    renderForm: function(data) {
        var isEdit = !!data; var title = isEdit ? 'Edit Tindakan' : 'Tambah Tindakan'; var v = data || {};
        var html = '<div class="p-6">';
        html += '<div class="flex items-center justify-between mb-5"><h3 class="text-lg font-semibold text-gray-800">' + title + '</h3><button onclick="Utils.closeModal()" class="p-1.5 hover:bg-gray-100 rounded-lg"><i data-lucide="x" class="w-5 h-5 text-gray-400"></i></button></div>';
        html += '<form id="form-tindakan" class="space-y-4">';
        html += '<div><label class="block text-sm font-medium text-gray-700 mb-1">Nama Tindakan *</label><input type="text" id="ft-nama" value="' + Utils.escapeHtml(v.nama || '') + '" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Cek Gula Darah"></div>';
        html += '<div class="grid grid-cols-2 gap-4">';
        html += '<div><label class="block text-sm font-medium text-gray-700 mb-1">Kategori *</label><select id="ft-kategori" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="">-- Pilih --</option><option value="klinik"' + (v.kategori === 'klinik' ? ' selected' : '') + '>Klinik</option><option value="apotek"' + (v.kategori === 'apotek' ? ' selected' : '') + '>Apotek</option></select></div>';
        html += '<div><label class="block text-sm font-medium text-gray-700 mb-1">Status</label><select id="ft-aktif" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="true"' + (v.aktif !== false ? ' selected' : '') + '>Aktif</option><option value="false"' + (v.aktif === false ? ' selected' : '') + '>Nonaktif</option></select></div></div>';
        html += '<div class="grid grid-cols-2 gap-4">';
        html += '<div><label class="block text-sm font-medium text-gray-700 mb-1">Harga Jual (Rp) *</label><input type="number" id="ft-harga-jual" value="' + (v.hargaJual || 0) + '" required min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="15000" oninput="AppPengaturanTindakan.previewTuslah()"></div>';
        html += '<div><label class="block text-sm font-medium text-gray-700 mb-1">Modal / Biaya Bahan (Rp) *</label><input type="number" id="ft-modal" value="' + (v.modal || 0) + '" required min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="13000" oninput="AppPengaturanTindakan.previewTuslah()"><p id="ft-tuslah-info" class="text-xs text-green-600 mt-1 font-medium"></p></div></div>';
        html += '<div>';
        html += '<label class="block text-sm font-medium text-gray-700 mb-1">Consumable (opsional)</label>';
        html += '<p class="text-xs text-gray-400 mb-2">Obat/alkes yang stoknya dikurangi saat tindakan dilakukan</p>';
        html += '<div id="ft-consumables-container" class="space-y-2"></div>';
        html += '<button type="button" onclick="AppPengaturanTindakan.tambahConsumable()" class="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"><i data-lucide="plus-circle" class="w-4 h-4"></i> Tambah Consumable</button>';
        html += '</div>';
        html += '<div class="flex justify-end gap-2 pt-2">';
        html += '<button type="button" onclick="Utils.closeModal()" class="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>';
        html += '<button type="submit" id="btn-simpan-tindakan" class="px-6 py-2.5 text-sm bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition">Simpan</button>';
        html += '</div>';
        if (isEdit) { html += '<input type="hidden" id="ft-id" value="' + v.id + '">'; }
        html += '</form></div>';
        Utils.openModal(html);
        AppPengaturanTindakan.previewTuslah();
        for (var c = 0; c < AppPengaturanTindakan.formConsumables.length; c++) { AppPengaturanTindakan.renderConsumableRow(c); }
        document.getElementById('form-tindakan').addEventListener('submit', function(e) { e.preventDefault(); AppPengaturanTindakan.simpan(); });
    },

    previewTuslah: function() {
        var jual = parseFloat(document.getElementById('ft-harga-jual').value) || 0;
        var modal = parseFloat(document.getElementById('ft-modal').value) || 0;
        var tuslah = jual - modal;
        var el = document.getElementById('ft-tuslah-info');
        if (el) { el.textContent = 'Tuslah: ' + Utils.formatRupiah(tuslah); }
    },

    tambahConsumable: function() { var index = AppPengaturanTindakan.formConsumables.length; AppPengaturanTindakan.formConsumables.push({ obatId: '', namaObat: '', jumlah: 1 }); AppPengaturanTindakan.renderConsumableRow(index); },

    renderConsumableRow: function(index) {
        var container = document.getElementById('ft-consumables-container'); if (!container) return;
        var item = AppPengaturanTindakan.formConsumables[index];
        var html = '<div id="ftc-' + index + '" class="border border-gray-200 rounded-lg p-3 bg-white relative">';
        html += '<button type="button" onclick="AppPengaturanTindakan.hapusConsumable(' + index + ')" class="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-0.5"><i data-lucide="x-circle" class="w-4 h-4"></i></button>';
        html += '<div class="relative mb-2 pr-6"><i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"></i><input type="text" id="ftc-search-' + index + '" value="' + Utils.escapeHtml(item.namaObat) + '" placeholder="Ketik nama obat/alkes..." class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm" autocomplete="off" onfocus="AppPengaturanTindakan.filterConsumableDropdown(' + index + ')" oninput="AppPengaturanTindakan.filterConsumableDropdown(' + index + ')"><div id="ftc-dropdown-' + index + '" class="hidden absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto"></div></div>';
        html += '<div class="w-32"><label class="block text-xs text-gray-500 mb-0.5">Jumlah</label><input type="number" id="ftc-jumlah-' + index + '" value="' + (item.jumlah || 1) + '" min="1" class="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" oninput="AppPengaturanTindakan.updateConsumableJumlah(' + index + ')"></div>';
        html += '<input type="hidden" id="ftc-obat-id-' + index + '" value="' + (item.obatId || '') + '">';
        html += '</div>';
        container.insertAdjacentHTML('beforeend', html);
        lucide.createIcons({ nodes: [container] });
    },

    filterConsumableDropdown: function(index) {
        var dropdown = document.getElementById('ftc-dropdown-' + index); if (!dropdown) return;
        var searchEl = document.getElementById('ftc-search-' + index); if (!searchEl) return;
        var val = searchEl.value.trim().toLowerCase();
        if (!val) { dropdown.classList.add('hidden'); return; }
        var results = AppObat.data.filter(function(o) { return (o.namaObat && o.namaObat.toLowerCase().indexOf(val) !== -1) || (o.kodeObat && o.kodeObat.toLowerCase().indexOf(val) !== -1); }).slice(0, 6);
        if (results.length === 0) { dropdown.innerHTML = '<div class="px-3 py-2 text-sm text-gray-400">Tidak ditemukan</div>'; dropdown.classList.remove('hidden'); return; }
        var html = '';
        for (var i = 0; i < results.length; i++) {
            var o = results[i];
            html += '<button type="button" onclick="AppPengaturanTindakan.selectConsumable(' + index + ',\'' + o.id + '\')" class="w-full text-left px-3 py-2 hover:bg-primary-50 text-sm border-b border-gray-50 last:border-0 transition"><p class="font-medium text-gray-800">' + Utils.escapeHtml(o.namaObat) + '</p><p class="text-xs text-gray-500">Stok: ' + (o.stok || 0) + ' ' + Utils.escapeHtml(o.satuan || '') + '</p></button>';
        }
        dropdown.innerHTML = html;
        dropdown.classList.remove('hidden');
    },

    selectConsumable: function(index, obatId) {
        var obat = AppObat.getById(obatId); if (!obat) return;
        AppPengaturanTindakan.formConsumables[index].obatId = obatId;
        AppPengaturanTindakan.formConsumables[index].namaObat = obat.namaObat;
        var oldRow = document.getElementById('ftc-' + index); if (oldRow) oldRow.remove();
        AppPengaturanTindakan.renderConsumableRow(index);
    },

    updateConsumableJumlah: function(index) {
        var el = document.getElementById('ftc-jumlah-' + index);
        if (el) { AppPengaturanTindakan.formConsumables[index].jumlah = parseInt(el.value) || 1; }
    },

    hapusConsumable: function(index) { var row = document.getElementById('ftc-' + index); if (row) row.remove(); AppPengaturanTindakan.formConsumables[index] = null; },

    simpan: function() {
        var btn = document.getElementById('btn-simpan-tindakan'); btn.disabled = true; btn.textContent = 'Menyimpan...';
        var idField = document.getElementById('ft-id'); var isEdit = !!idField; var id = isEdit ? idField.value : null;
        var nama = document.getElementById('ft-nama').value.trim();
        if (!nama) { Utils.toast('Nama tindakan wajib diisi', 'error'); btn.disabled = false; btn.textContent = 'Simpan'; return; }
        var validConsumables = [];
        for (var i = 0; i < AppPengaturanTindakan.formConsumables.length; i++) {
            var c = AppPengaturanTindakan.formConsumables[i];
            if (c !== null && c.obatId) { validConsumables.push({ obatId: c.obatId, namaObat: c.namaObat, jumlah: c.jumlah || 1 }); }
        }
        var obj = {
            nama: nama,
            kategori: document.getElementById('ft-kategori').value,
            hargaJual: parseFloat(document.getElementById('ft-harga-jual').value) || 0,
            modal: parseFloat(document.getElementById('ft-modal').value) || 0,
            consumables: validConsumables,
            aktif: document.getElementById('ft-aktif').value === 'true',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        var promise;
        if (isEdit) { promise = db.collection('masterTindakan').doc(id).update(obj); }
        else { obj.createdAt = firebase.firestore.FieldValue.serverTimestamp(); promise = db.collection('masterTindakan').add(obj); }
        promise.then(function() {
            Utils.toast(isEdit ? 'Tindakan berhasil diperbarui' : 'Tindakan berhasil ditambahkan', 'success'); Utils.closeModal(); AppPengaturanTindakan.load();
        }).catch(function(err) {
            Utils.toast('Gagal menyimpan: ' + err.message, 'error'); btn.disabled = false; btn.textContent = 'Simpan';
        });
    },

    hapus: function(id, nama) {
        if (!confirm('Hapus tindakan "' + nama + '"?')) return;
        db.collection('masterTindakan').doc(id).delete().then(function() { Utils.toast('Tindakan berhasil dihapus', 'success'); AppPengaturanTindakan.load();
        }).catch(function(err) { Utils.toast('Gagal menghapus: ' + err.message, 'error'); });
    },

    getById: function(id) {
        for (var i = 0; i < AppPengaturanTindakan.data.length; i++) { if (AppPengaturanTindakan.data[i].id === id) return AppPengaturanTindakan.data[i]; }
        return null;
    },

    getByKategori: function(kat) {
        return AppPengaturanTindakan.data.filter(function(t) { return t.kategori === kat && t.aktif !== false; });
    }
};
