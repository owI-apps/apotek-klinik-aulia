/**
 * utils.js
 * Fungsi-fungsi bantu yang dipake di seluruh app
 */

window.Utils = {

    /**
     * Format angka ke Rupiah
     * Contoh: 15000 → "Rp 15.000"
     */
    formatRupiah: function(angka) {
        if (angka === null || angka === undefined || isNaN(angka)) return 'Rp 0';
        return 'Rp ' + Number(angka).toLocaleString('id-ID');
    },

    /**
     * Format angka biasa dengan titik ribuan
     * Contoh: 15000 → "15.000"
     */
    formatAngka: function(angka) {
        if (angka === null || angka === undefined || isNaN(angka)) return '0';
        return Number(angka).toLocaleString('id-ID');
    },

    /**
     * Parse string Rupiah ke angka
     * Contoh: "Rp 15.000" → 15000
     */
    parseRupiah: function(str) {
        if (!str) return 0;
        return parseInt(String(str).replace(/[^0-9-]/g, '')) || 0;
    },

    /**
     * Format tanggal ke bahasa Indonesia
     * Contoh: "2025-01-15" → "15 Januari 2025"
     */
    formatTanggal: function(tanggal) {
        if (!tanggal) return '-';
        var bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
        var d = new Date(tanggal);
        return d.getDate() + ' ' + bulan[d.getMonth()] + ' ' + d.getFullYear();
    },

    /**
     * Format tanggal singkat
     * Contoh: "2025-01-15" → "15/01/2025"
     */
    formatTanggalShort: function(tanggal) {
        if (!tanggal) return '-';
        var d = new Date(tanggal);
        var dd = String(d.getDate()).padStart(2, '0');
        var mm = String(d.getMonth() + 1).padStart(2, '0');
        return dd + '/' + mm + '/' + d.getFullYear();
    },

    /**
     * Pembulatan CEILING ke ribuan terdekat (selalu naik)
     * Contoh: 32500 → 33000, 32001 → 33000, 33000 → 33000
     */
    ceilingRibuan: function(angka) {
        if (angka <= 0) return 0;
        return Math.ceil(angka / 1000) * 1000;
    },

    /**
     * Hitung selisih pembulatan (uang makan pool)
     * Contoh: 32500 → selisih = 33000 - 32500 = 500
     */
    hitungPembulatan: function(angka) {
        var dibulatkan = this.ceilingRibuan(angka);
        return dibulatkan - angka;
    },

    /**
     * Generate ID unik sederhana
     * Contoh: "trx_1705312345678_abc"
     */
    generateId: function(prefix) {
        return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    },

    /**
     * Generate nomor transaksi
     * Contoh: "TRX-20250115-0001"
     */
    generateNomorTransaksi: function(prefix, counter) {
        var now = new Date();
        var y = now.getFullYear();
        var m = String(now.getMonth() + 1).padStart(2, '0');
        var d = String(now.getDate()).padStart(2, '0');
        var c = String(counter || 1).padStart(4, '0');
        return prefix + '-' + y + m + d + '-' + c;
    },

    /**
     * Tampilkan toast notification
     * tipe: 'success', 'error', 'info', 'warning'
     */
    toast: function(pesan, tipe) {
        tipe = tipe || 'info';
        var container = document.getElementById('toast-container');
        var colors = {
            success: 'bg-green-500',
            error:   'bg-red-500',
            warning: 'bg-yellow-500',
            info:    'bg-blue-500'
        };
        var icons = {
            success: 'check-circle',
            error:   'x-circle',
            warning: 'alert-triangle',
            info:    'info'
        };
        var div = document.createElement('div');
        div.className = 'toast-enter flex items-center gap-2 px-4 py-3 rounded-lg text-white text-sm shadow-lg ' + colors[tipe];
        div.innerHTML = '<i data-lucide="' + icons[tipe] + '" class="w-4 h-4 flex-shrink-0"></i><span>' + pesan + '</span>';
        container.appendChild(div);
        lucide.createIcons({ nodes: [div] });
        // Hapus toast setelah 3 detik
        setTimeout(function() {
            div.style.transition = 'opacity 0.3s';
            div.style.opacity = '0';
            setTimeout(function() { div.remove(); }, 300);
        }, 3000);
    },

    /**
     * Tampilkan loading spinner di dalam element
     */
    showLoading: function(containerId) {
        var el = document.getElementById(containerId);
        if (el) el.innerHTML = '<div class="flex items-center justify-center py-20"><div class="spinner"></div></div>';
    },

    /**
     * Buka modal
     */
    openModal: function(html) {
        var backdrop = document.getElementById('modal-backdrop');
        var content = document.getElementById('modal-content');
        content.innerHTML = html;
        content.classList.add('modal-enter');
        backdrop.classList.remove('hidden');
        lucide.createIcons({ nodes: [content] });
    },

    /**
     * Tutup modal
     */
    closeModal: function() {
        var backdrop = document.getElementById('modal-backdrop');
        backdrop.classList.add('hidden');
        document.getElementById('modal-content').innerHTML = '';
    },

    /**
     * Tanggal hari ini format YYYY-MM-DD (untuk input date)
     */
    today: function() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    },

    /**
     * Bulan ini format YYYY-MM (untuk filter payroll)
     */
    thisMonth: function() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
    },

    /**
     * Nama bulan Indonesia
     */
    namaBulan: function(bulan) {
        var nama = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
        return nama[parseInt(bulan) - 1] || '-';
    }
};
