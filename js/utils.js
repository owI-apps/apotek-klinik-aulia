/**
 * utils.js
 * Fungsi-fungsi bantu yang dipake di seluruh app
 */
window.Utils = {

    formatRupiah: function(angka) {
        if (angka === null || angka === undefined || isNaN(angka)) return 'Rp 0';
        return 'Rp ' + Number(angka).toLocaleString('id-ID');
    },

    formatAngka: function(angka) {
        if (angka === null || angka === undefined || isNaN(angka)) return '0';
        return Number(angka).toLocaleString('id-ID');
    },

    parseRupiah: function(str) {
        if (!str) return 0;
        return parseInt(String(str).replace(/[^0-9-]/g, '')) || 0;
    },

    formatTanggal: function(tanggal) {
        if (!tanggal) return '-';
        var bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
        var d = new Date(tanggal);
        return d.getDate() + ' ' + bulan[d.getMonth()] + ' ' + d.getFullYear();
    },

    formatTanggalShort: function(tanggal) {
        if (!tanggal) return '-';
        var d = new Date(tanggal);
        var dd = String(d.getDate()).padStart(2, '0');
        var mm = String(d.getMonth() + 1).padStart(2, '0');
        return dd + '/' + mm + '/' + d.getFullYear();
    },

    ceilingRibuan: function(angka) {
        if (angka <= 0) return 0;
        return Math.ceil(angka / 1000) * 1000;
    },

    hitungPembulatan: function(angka) {
        var dibulatkan = this.ceilingRibuan(angka);
        return dibulatkan - angka;
    },

    generateId: function(prefix) {
        return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    },

    generateNomorTransaksi: function(prefix, counter) {
        var now = new Date();
        var y = now.getFullYear();
        var m = String(now.getMonth() + 1).padStart(2, '0');
        var d = String(now.getDate()).padStart(2, '0');
        var c = String(counter || 1).padStart(4, '0');
        return prefix + '-' + y + m + d + '-' + c;
    },

    toast: function(pesan, tipe) {
        tipe = tipe || 'info';
        var container = document.getElementById('toast-container');
        var colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        var icons = {
            success: 'check-circle',
            error: 'x-circle',
            warning: 'alert-triangle',
            info: 'info'
        };
        var div = document.createElement('div');
        div.className = 'toast-enter flex items-center gap-2 px-4 py-3 rounded-lg text-white text-sm shadow-lg ' + colors[tipe];
        div.innerHTML = '<i data-lucide="' + icons[tipe] + '" class="w-4 h-4 flex-shrink-0"></i><span>' + pesan + '</span>';
        container.appendChild(div);
        lucide.createIcons({ nodes: [div] });
        setTimeout(function() {
            div.style.transition = 'opacity 0.3s';
            div.style.opacity = '0';
            setTimeout(function() { div.remove(); }, 300);
        }, 3000);
    },

    showLoading: function(containerId) {
        var el = document.getElementById(containerId);
        if (el) el.innerHTML = '<div class="flex items-center justify-center py-20"><div class="spinner"></div></div>';
    },

    openModal: function(html) {
        var backdrop = document.getElementById('modal-backdrop');
        var content = document.getElementById('modal-content');
        content.innerHTML = html;
        content.classList.add('modal-enter');
        backdrop.classList.remove('hidden');
        lucide.createIcons({ nodes: [content] });
    },

    closeModal: function() {
        var backdrop = document.getElementById('modal-backdrop');
        backdrop.classList.add('hidden');
        document.getElementById('modal-content').innerHTML = '';
    },

    today: function() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    },

    thisMonth: function() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    },

    namaBulan: function(bulan) {
        var nama = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
        return nama[parseInt(bulan) - 1] || '-';
    },

    escapeHtml: function(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    getHashParams: function() {
        var hash = window.location.hash;
        var params = {};
        if (hash.indexOf('?') !== -1) {
            var query = hash.split('?')[1];
            if (query) {
                query.split('&').forEach(function(pair) {
                    var parts = pair.split('=');
                    params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
                });
            }
        }
        return params;
    }

};
