/**
 * app.js
 * File utama: inisialisasi Firebase, routing, sidebar, auth state
 */
var firebaseConfig = {
    apiKey: "AIzaSyBQ_G9SGuNBhqL1vaOUF57lkKDPFCuLpqk",
    authDomain: "apotek-klinik-aulia.firebaseapp.com",
    projectId: "apotek-klinik-aulia",
    storageBucket: "apotek-klinik-aulia.firebasestorage.app",
    messagingSenderId: "602059108516",
    appId: "1:602059108516:web:3d3530fdcfb7e31813b631",
    measurementId: "G-27VVNPTRE0"
};
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
var auth = firebase.auth();

window.App = {
    currentUser: null,
    currentPage: '',
    openMenus: {},
    pengaturan: null,

    menuItems: [
        { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', roles: ['admin','psa','klinik','apotek'] },
        { id: 'operasional', label: 'Operasional', icon: 'activity', roles: ['admin','psa','klinik'], children: [
            { id: 'antrian', label: 'Antrian', icon: 'list-ordered', roles: ['admin','psa','klinik'] },
            { id: 'rekam-medis', label: 'Rekam Medis', icon: 'file-text', roles: ['admin','psa','klinik'] },
            { id: 'resep', label: 'Resep', icon: 'clipboard-list', roles: ['admin','psa','klinik'] }
        ]},
        { id: 'pasien', label: 'Pasien', icon: 'users', roles: ['admin','psa','klinik','apotek'] },
        { id: 'obat', label: 'Obat & Stock', icon: 'pill', roles: ['admin','psa','apotek'] },
        { id: 'transaksi', label: 'Transaksi', icon: 'receipt', roles: ['admin','psa','apotek'] },
        { id: 'pembelian', label: 'Pembelian', icon: 'package', roles: ['admin','psa','apotek'] },
        { id: 'stock-opname', label: 'Stock Opname', icon: 'clipboard-check', roles: ['admin','psa','apotek'] },
        { id: 'keuangan', label: 'Keuangan', icon: 'trending-up', roles: ['admin','psa'] },
        { id: 'hutang', label: 'Hutang Usaha', icon: 'credit-card', roles: ['admin','psa'] },
        { id: 'pengeluaran', label: 'Pengeluaran', icon: 'wallet', roles: ['admin','psa'] },
        { id: 'piutang', label: 'Piutang Karyawan', icon: 'hand-coins', roles: ['admin','psa'] },
        { id: 'manajemen', label: 'Manajemen', icon: 'briefcase', roles: ['admin','psa'], children: [
            { id: 'karyawan', label: 'Karyawan', icon: 'user-cog', roles: ['admin','psa'] },
            { id: 'payroll', label: 'Payroll', icon: 'banknote', roles: ['admin','psa'] }
        ]},
        { id: 'laporan', label: 'Laporan', icon: 'bar-chart-3', roles: ['admin','psa','klinik','apotek'] },
        { id: 'pengaturan', label: 'Pengaturan', icon: 'settings', roles: ['admin','psa'], children: [
            { id: 'pengaturan-profil', label: 'Profil Apotek & Klinik', icon: 'building-2', roles: ['admin','psa'] },
            { id: 'pengaturan-pembagian', label: 'Pembagian Hasil', icon: 'pie-chart', roles: ['admin','psa'] },
            { id: 'pengaturan-tindakan', label: 'Master Tindakan', icon: 'stethoscope', roles: ['admin','psa'] },
            { id: 'pengaturan-users', label: 'Kelola Users', icon: 'user-plus', roles: ['admin','psa'] }
        ]}
    ],

    init: function() {
        auth.onAuthStateChanged(function(user) {
            if (user) {
                App.loadUser(user.uid);
            } else {
                App.showLoginPage();
            }
        });
        window.addEventListener('hashchange', function() {
            App.route();
        });
        document.getElementById('modal-backdrop').addEventListener('click', function(e) {
            if (e.target === this) Utils.closeModal();
        });
    },

    loadUser: function(uid) {
        db.collection('users').doc(uid).get().then(function(doc) {
            if (doc.exists) {
                App.currentUser = doc.data();
                App.currentUser.uid = uid;
                App.enterApp();
            } else {
                Utils.toast('Data user tidak ditemukan. Hubungi admin.', 'error');
                auth.signOut();
            }
        }).catch(function(err) {
            Utils.toast('Gagal memuat data user: ' + err.message, 'error');
        });
    },

    enterApp: function() {
        document.getElementById('page-login').classList.add('hidden');
        document.getElementById('app-shell').classList.remove('hidden');
        document.getElementById('user-name').textContent = App.currentUser.nama;
        var roleLabels = { admin: 'Administrator', psa: 'PSA', klinik: 'Klinik', apotek: 'Apotek' };
        document.getElementById('user-role').textContent = roleLabels[App.currentUser.role] || App.currentUser.role;
        App.loadPengaturan();
        App.buildSidebar();
        if (!window.location.hash || window.location.hash === '#') {
            window.location.hash = '#dashboard';
        } else {
            App.route();
        }
    },

    loadPengaturan: function() {
        db.collection('pengaturan').doc('global').get().then(function(doc) {
            if (doc.exists) {
                App.pengaturan = doc.data();
                document.getElementById('sidebar-title').textContent = App.pengaturan.namaApotek || 'Apotek & Klinik';
                document.getElementById('sidebar-subtitle').textContent = App.pengaturan.namaKlinik || 'Sistem Manajemen';
            }
        }).catch(function() {});
    },

    buildSidebar: function() {
        var role = App.currentUser.role;
        var container = document.getElementById('sidebar-menu');
        var html = '';
        App.menuItems.forEach(function(item) {
            if (item.roles && item.roles.indexOf(role) === -1) return;
            var hasChildren = item.children && item.children.length > 0;
            var isOpen = App.openMenus[item.id] || false;
            if (hasChildren) {
                html += '<div>';
                html += '<button onclick="App.toggleMenu(\'' + item.id + '\')" class="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">';
                html += '<i data-lucide="' + item.icon + '" class="w-4 h-4 flex-shrink-0"></i>';
                html += '<span class="flex-1 text-left">' + item.label + '</span>';
                html += '<i data-lucide="chevron-' + (isOpen ? 'up' : 'down') + '" class="w-4 h-4 text-gray-400"></i>';
                html += '</button>';
                html += '<div class="submenu ' + (isOpen ? 'submenu-open' : '') + ' pl-8 space-y-0.5 mt-0.5">';
                item.children.forEach(function(child) {
                    if (child.roles && child.roles.indexOf(role) === -1) return;
                    var isActive = (window.location.hash === '#' + child.id);
                    html += '<a href="#' + child.id + '" class="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition ' + (isActive ? 'menu-active' : 'text-gray-600 hover:bg-gray-100') + '">';
                    html += '<i data-lucide="' + child.icon + '" class="w-3.5 h-3.5"></i>';
                    html += '<span>' + child.label + '</span>';
                    html += '</a>';
                });
                html += '</div></div>';
            } else {
                var isActive = (window.location.hash === '#' + item.id);
                html += '<a href="#' + item.id + '" class="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition ' + (isActive ? 'menu-active' : 'text-gray-700 hover:bg-gray-100') + '">';
                html += '<i data-lucide="' + item.icon + '" class="w-4 h-4 flex-shrink-0"></i>';
                html += '<span>' + item.label + '</span>';
                html += '</a>';
            }
        });
        container.innerHTML = html;
        lucide.createIcons({ nodes: [container] });
    },

    toggleMenu: function(menuId) {
        App.openMenus[menuId] = !App.openMenus[menuId];
        App.buildSidebar();
    },

    toggleSidebar: function() {
        var sidebar = document.getElementById('sidebar');
        var overlay = document.getElementById('sidebar-overlay');
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
    },

    route: function() {
        var hash = window.location.hash.replace('#', '') || 'dashboard';
        App.currentPage = hash;
        var title = App.getMenuLabel(hash);
        document.getElementById('topbar-title').textContent = title;
        App.buildSidebar();
        if (window.innerWidth < 1024) {
            var sidebar = document.getElementById('sidebar');
            if (!sidebar.classList.contains('-translate-x-full')) {
                App.toggleSidebar();
            }
        }
        var content = document.getElementById('main-content');
        Utils.showLoading('main-content');
        var moduleMap = {
            'dashboard': AppDashboard,
            'pasien': AppPasien,
            'obat': AppObat,
            'antrian': AppAntrian,
            'rekam-medis': AppRekamMedis,
            'resep': AppResep,
            'transaksi': AppTransaksi,
            'pembelian': AppPembelian,
            'keuangan': AppKeuangan,
            'hutang': AppHutang,
            'pengeluaran': AppPengeluaran,
            'piutang': AppPiutang,
            'karyawan': AppKaryawan,
            'payroll': AppPayroll,
            'laporan': AppLaporan,
            'pengaturan-profil': AppPengaturanProfil,
            'pengaturan-pembagian': AppPengaturanPembagian,
            'pengaturan-tindakan': AppPengaturanTindakan,
            'pengaturan-users': AppPengaturanUsers
        };
        var modul = moduleMap[hash];
        if (modul && modul.render) {
            content.innerHTML = modul.render();
            if (modul.init) modul.init();
        } else {
            content.innerHTML = '<div class="page-enter flex flex-col items-center justify-center py-20"><div class="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4"><i data-lucide="construction" class="w-10 h-10 text-gray-400"></i></div><h3 class="text-lg font-semibold text-gray-600">' + title + '</h3><p class="text-sm text-gray-400 mt-1">Module ini sedang dalam pengembangan</p></div>';
            lucide.createIcons();
        }
    },

    getMenuLabel: function(id) {
        var label = id;
        App.menuItems.forEach(function(item) {
            if (item.id === id) label = item.label;
            if (item.children) {
                item.children.forEach(function(child) {
                    if (child.id === id) label = child.label;
                });
            }
        });
        return label;
    },

    showLoginPage: function() {
        document.getElementById('app-shell').classList.add('hidden');
        document.getElementById('page-login').classList.remove('hidden');
        AppAuth.checkFirstTime().then(function(isFirstTime) {
            if (isFirstTime) {
                AppAuth.renderSetup();
            } else {
                AppAuth.renderLogin();
            }
        });
    },

    logout: function() {
        if (confirm('Yakin ingin keluar?')) {
            auth.signOut();
            App.currentUser = null;
            App.openMenus = {};
        }
    }
};

(function() {
    document.addEventListener('DOMContentLoaded', function() {
        App.init();
    });
})();
