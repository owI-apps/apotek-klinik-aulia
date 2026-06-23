/**
 * payroll.js
 * Perhitungan payroll bulanan — INTI SISTEM
 * Membaca transaksi, config pembagian, data karyawan
 * Menghitung semua pool dan mendistribusikan ke karyawan + PSA
 */

window.AppPayroll = {

    result: null,
    karyawanList: [],
    configPembagian: null,

    /* =========================================
       RENDER
       ========================================= */
    render: function() {
        var html = '<div class="page-enter max-w-5xl">';
        html += '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">';
        html += '<div>';
        html += '<h2 class="text-xl font-bold text-gray-800">Payroll</h2>';
        html += '<p class="text-sm text-gray-500">Perhitungan gaji bulanan</p>';
        html += '</div>';
        html += '</div>';

        // Kontrol bulan
        html += '<div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">';
        html += '<div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">';
        html += '<div>';
        html += '<label class="block text-xs text-gray-500 mb-1">Periode</label>';
        html += '<input type="month" id="pay-bulan" value="' + Utils.thisMonth() + '" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">';
        html += '</div>';
        html += '<div class="flex gap-2 sm:mt-5">';
        html += '<button onclick="AppPayroll.hitung()" id="btn-hitung-payroll" class="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition flex items-center gap-2"><i data-lucide="calculator" class="w-4 h-4"></i> Hitung Payroll</button>';
        html += '<button onclick="AppPayroll.simpan()" id="btn-simpan-payroll" class="hidden bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition flex items-center gap-2"><i data-lucide="save" class="w-4 h-4"></i> Simpan</button>';
        html += '</div></div></div>';

        // Hasil
        html += '<div id="pay-result"></div>';
        html += '</div>';
        return html;
    },

    /* =========================================
       INIT
       ========================================= */
    init: function() {
        // Cek apakah ada payroll tersimpan untuk bulan ini
        var bulan = Utils.thisMonth();
        db.collection('payroll').doc(bulan).get()
            .then(function(doc) {
                if (doc.exists) {
                    AppPayroll.result = doc.data();
                    AppPayroll.renderResult();
                    var btnSave = document.getElementById('btn-simpan-payroll');
                    if (btnSave) btnSave.classList.remove('hidden');
                }
            })
            .catch(function() {});
    },

    /* =========================================
       HELPER: Range tanggal dari string YYYY-MM
       ========================================= */
    getRange: function(bulan) {
        var parts = bulan.split('-');
        var y = parseInt(parts[0]);
        var m = parseInt(parts[1]);
        var nextM = m === 12 ? 1 : m + 1;
        var nextY = m === 12 ? y + 1 : y;
        return {
            start: bulan + '-01',
            end: nextY + '-' + String(nextM).padStart(2, '0') + '-01'
        };
    },

    /* =========================================
       HITUNG PAYROLL
       ========================================= */
    hitung: function() {
        var btn = document.getElementById('btn-hitung-payroll');
        btn.disabled = true;
        btn.textContent = 'Menghitung...';
        var resultEl = document.getElementById('pay-result');
        Utils.showLoading('pay-result');

        var bulan = document.getElementById('pay-bulan').value;
        if (!bulan) {
            Utils.toast('Pilih periode', 'error');
            btn.disabled = false;
            btn.textContent = ' Hitung Payroll';
            return;
        }

        var range = AppPayroll.getRange(bulan);

        // 1. Ambil semua data yang dibutuhkan secara paralel
        var pTransaksi = db.collection('transaksi').where('tanggal', '>=', range.start).where('tanggal', '<', range.end).get();
        var pKaryawan = db.collection('karyawan').where('status', '==', 'aktif').get();
        var pConfig = db.collection('pengaturanPembagian').doc('global').get();

        Promise.all([pTransaksi, pKaryawan, pConfig]).then(function(results) {
            // Parse transaksi
            var transaksi = [];
            results[0].forEach(function(doc) {
                var d = doc.data();
                d.id = doc.id;
                transaksi.push(d);
            });

            // Parse karyawan
            var karyawan = [];
            results[1].forEach(function(doc) {
                var d = doc.data();
                d.id = doc.id;
                karyawan.push(d);
            });

            // Parse config
            if (!results[2].exists) {
                Utils.toast('Pengaturan pembagian belum diatur. Buka Pengaturan > Pembagian Hasil.', 'error');
                btn.disabled = false;
                btn.textContent = ' Hitung Payroll';
                return;
            }
            var config = results[2].data();

            // Simpan ke state
            AppPayroll.karyawanList = karyawan;
            AppPayroll.configPembagian = config;

            // 2. Hitung
            AppPayroll.result = AppPayroll.calculate(bulan, transaksi, karyawan, config);

            // 3. Render
            AppPayroll.renderResult();

            var btnSave = document.getElementById('btn-simpan-payroll');
            if (btnSave) btnSave.classList.remove('hidden');

            btn.disabled = false;
            btn.textContent = ' Hitung Payroll';

        }).catch(function(err) {
            Utils.toast('Gagal menghitung: ' + err.message, 'error');
            btn.disabled = false;
            btn.textContent = ' Hitung Payroll';
        });
    },

    /* =========================================
       KALKULASI INTI (pure function)
       ========================================= */
    calculate: function(bulan, transaksi, karyawan, cfg) {
        var r = {
            bulan: bulan,
            pools: {
                resepKlinik: { count: 0, totalJasaResep: 0, jm: 0, jd: 0, karyKlinik: 0, karyApotek: 0, psa: 0, labaApotek: 0 },
                resepLuar: { count: 0, totalJasaResep: 0, dokter: 0, psa: 0, labaApotek: 0 },
                tindakanKlinik: { totalTuslah: 0, dokter: 0, karyKlinik: 0 },
                tindakanApotek: { totalTuslah: 0, karyApotek: 0, psa: 0 },
                labaBersihObat: { total: 0, poolOmzet: 0 },
                pembulatan: { total: 0, totalUangMakan: 0, sisa: 0 },
                transport: { total: 0, perOrangApotek: 0 }
            },
            karyawan: [],
            psa: { dariResepKlinik: 0, dariResepLuar: 0, dariTindakanApotek: 0, dariTunjanganOmzet: 0, sisaPembulatan: 0, dariMargin: 0, total: 0 },
            totalA: 0,
            totalB: 0,
            marginBulan: 0,
            sisaMargin: 0
        };

        var p = r.pools;

        // === STEP 1: Hitung semua pool dari transaksi ===
        for (var i = 0; i < transaksi.length; i++) {
            var trx = transaksi[i];

            // Resep Klinik
            if (trx.tipe === 'resep_klinik') {
                p.resepKlinik.count++;
                var jk = trx.jasaResep || 0;
                p.resepKlinik.totalJasaResep += jk;
                p.resepKlinik.jm += (cfg.resep.jm || 0);
                p.resepKlinik.jd += (cfg.resep.jd || 0);
                p.resepKlinik.karyKlinik += (cfg.resep.karyKlinik || 0);
                p.resepKlinik.karyApotek += (cfg.resep.karyApotek || 0);
                p.resepKlinik.psa += (cfg.resep.psa || 0);
                p.resepKlinik.labaApotek += jk - (cfg.resep.jm || 0) - (cfg.resep.jd || 0) - (cfg.resep.karyKlinik || 0) - (cfg.resep.karyApotek || 0) - (cfg.resep.psa || 0);
            }

            // Resep Luar
            if (trx.tipe === 'resep_luar') {
                p.resepLuar.count++;
                var jl = trx.jasaResep || 0;
                p.resepLuar.totalJasaResep += jl;
                p.resepLuar.dokter += (cfg.resepLuar.dokter || 0);
                p.resepLuar.psa += (cfg.resepLuar.psa || 0);
                p.resepLuar.labaApotek += jl - (cfg.resepLuar.dokter || 0) - (cfg.resepLuar.psa || 0);
            }

            // Tindakan Klinik
            if (trx.tipe === 'tindakan_klinik' && Array.isArray(trx.tindakanItems)) {
                for (var t = 0; t < trx.tindakanItems.length; t++) {
                    var ti = trx.tindakanItems[t];
                    p.tindakanKlinik.totalTuslah += Math.max(0, (ti.hargaJual || 0) - (ti.modal || 0));
                }
            }

            // Tindakan Apotek
            if (trx.tipe === 'tindakan_apotek' && Array.isArray(trx.tindakanItems)) {
                for (var u = 0; u < trx.tindakanItems.length; u++) {
                    var ta = trx.tindakanItems[u];
                    p.tindakanApotek.totalTuslah += Math.max(0, (ta.hargaJual || 0) - (ta.modal || 0));
                }
            }

            // Laba Bersih Obat (dari semua item obat di semua tipe transaksi)
            if (Array.isArray(trx.items)) {
                for (var v = 0; v < trx.items.length; v++) {
                    var item = trx.items[v];
                    p.labaBersihObat.total += ((item.hargaJual || 0) - (item.hargaBeli || 0)) * (item.jumlah || 0);
                }
            }

            // Pembulatan
            p.pembulatan.total += (trx.pembulatan || 0);
        }

        // === STEP 2: Distribusi pool berdasarkan persentase config ===

        // Tindakan Klinik
        var tkDokterP = cfg.tindakanKlinik.dokter || 0;
        var tkKaryP = cfg.tindakanKlinik.karyKlinik || 0;
        p.tindakanKlinik.dokter = p.tindakanKlinik.totalTuslah * tkDokterP / 100;
        p.tindakanKlinik.karyKlinik = p.tindakanKlinik.totalTuslah * tkKaryP / 100;

        // Tindakan Apotek
        var taKaryP = cfg.tindakanApotek.karyApotek || 0;
        var taPsaP = cfg.tindakanApotek.psa || 0;
        p.tindakanApotek.karyApotek = p.tindakanApotek.totalTuslah * taKaryP / 100;
        p.tindakanApotek.psa = p.tindakanApotek.totalTuslah * taPsaP / 100;

        // Tunjangan Omzet
        var omzetP = cfg.tunjanganOmzet.persen || 0;
        p.labaBersihObat.poolOmzet = p.labaBersihObat.total * omzetP / 100;

        // Transport
        p.transport.total = cfg.transport.nominal || 0;
        var karyApotekCount = 0;
        for (var w = 0; w < karyawan.length; w++) {
            if (karyawan[w].departemen === 'Apotek') karyApotekCount++;
        }
        p.transport.perOrangApotek = karyApotekCount > 0 ? Math.floor(p.transport.total / karyApotekCount) : 0;

        // Uang Makan
        var umPerOrang = cfg.uangMakan.nominal || 0;
        p.pembulatan.totalUangMakan = umPerOrang * karyawan.length;
        p.pembulatan.sisa = p.pembulatan.total - p.pembulatan.totalUangMakan;

        // === STEP 3: Hitung per karyawan ===
        var slotKlinik = cfg.slotKaryawanKlinik || [];
        var slotApotek = cfg.slotKaryawanApotek || [];

        // Buat map karyawan berdasarkan ID untuk pencarian cepat
        var karMap = {};
        for (var m = 0; m < karyawan.length; m++) {
            karMap[karyawan[m].id] = karyawan[m];
        }

        // Buat map slot -> karyawan
        var slotKlinikKar = AppPayroll.mapSlotToKaryawan(slotKlinik, karMap);
        var slotApotekKar = AppPayroll.mapSlotToKaryawan(slotApotek, karMap);

        // Hitung untuk setiap karyawan aktif
        for (var k = 0; k < karyawan.length; k++) {
            var emp = karyawan[k];
            var row = {
                karyawanId: emp.id,
                nama: emp.nama,
                departemen: emp.departemen,
                jabatan: emp.jabatan,
                gajiPokok: 0,
                transport: 0,
                tuslahApotek: 0,
                tunjanganOmzet: 0,
                uangMakan: umPerOrang,
                bagiHasilResep: 0,
                tuslahKlinik: 0,
                thrKlinik: 0,
                thrApotek: 0,
                totalGaji: 0
            };

            if (emp.departemen === 'Apotek') {
                row.gajiPokok = emp.gajiPokok || 0;
                row.transport = p.transport.perOrangApotek;

                // Distribusi dari slot Apotek (tuslah, omzet)
                for (var sa = 0; sa < slotApotekKar.length; sa++) {
                    var slotA = slotApotekKar[sa];
                    if (slotA.karyawanId === emp.id) {
                        var persenA = slotA.persen || 0;
                        if (slotA.isTHR) {
                            // THR dari tuslah apotek
                            row.thrApotek += p.tindakanApotek.karyApotek * persenA / 100;
                            // THR dari tunjangan omzet
                            row.thrApotek += p.labaBersihObat.poolOmzet * taKaryP / 100 * persenA / 100;
                        } else {
                            row.tuslahApotek += p.tindakanApotek.karyApotek * persenA / 100;
                            row.tunjanganOmzet += p.labaBersihObat.poolOmzet * taKaryP / 100 * persenA / 100;
                        }
                    }
                }
            }

            if (emp.departemen === 'Klinik') {
                // Distribusi dari slot Klinik (resep, tuslah klinik)
                for (var sk = 0; sk < slotKlinikKar.length; sk++) {
                    var slotK = slotKlinikKar[sk];
                    if (slotK.karyawanId === emp.id) {
                        var persenK = slotK.persen || 0;
                        if (slotK.isTHR) {
                            row.thrKlinik += p.resepKlinik.karyKlinik * persenK / 100;
                        } else {
                            row.bagiHasilResep += p.resepKlinik.karyKlinik * persenK / 100;
                            row.tuslahKlinik += p.tindakanKlinik.karyKlinik * persenK / 100;
                        }
                    }
                }
            }

            // Total gaji (take-home, TIDAK termasuk THR)
            row.totalGaji = row.gajiPokok + row.transport + row.tuslahApotek + row.tunjanganOmzet + row.uangMakan + row.bagiHasilResep + row.tuslahKlinik;

            r.karyawan.push(row);
        }

        // === STEP 4: Hitung Total A dan Total B ===
        for (var n = 0; n < r.karyawan.length; n++) {
            var e = r.karyawan[n];
            if (e.departemen === 'Apotek') r.totalA += e.totalGaji;
            if (e.departemen === 'Klinik') r.totalB += e.totalGaji;
        }

        // === STEP 5: Margin Bulan & PSA ===
        r.marginBulan = p.labaBersihObat.total + p.tindakanKlinik.totalTuslah + p.tindakanApotek.totalTuslah;
        r.sisaMargin = r.marginBulan - r.totalA - r.totalB;
        r.psa.dariResepKlinik = p.resepKlinik.psa;
        r.psa.dariResepLuar = p.resepLuar.psa;
        r.psa.dariTindakanApotek = p.tindakanApotek.psa;
        r.psa.dariTunjanganOmzet = p.labaBersihObat.poolOmzet * taPsaP / 100;
        r.psa.sisaPembulatan = p.pembulatan.sisa;
        r.psa.dariMargin = r.sisaMargin > 0 ? Math.floor(r.sisaMargin * 0.5) : 0;
        r.psa.total = r.psa.dariResepKlinik + r.psa.dariResepLuar + r.psa.dariTindakanApotek + r.psa.dariTunjanganOmzet + r.psa.sisaPembulatan + r.psa.dariMargin;

        return r;
    },

    /**
     * Map array slot ke karyawan berdasarkan karyawanId
     * Return array slot yang sudah memiliki referensi ke objek karyawan
     */
    mapSlotToKaryawan: function(slots, karMap) {
        var result = [];
        for (var i = 0; i < slots.length; i++) {
            var s = slots[i];
            result.push({
                label: s.label || '',
                karyawanId: s.karyawanId || '',
                persen: s.persen || 0,
                isTHR: !!s.isTHR,
                karyawan: karMap[s.karyawanId] || null
            });
        }
        return result;
    },

    /* =========================================
       RENDER HASIL
       ========================================= */
    renderResult: function() {
        var r = AppPayroll.result;
        if (!r) {
            document.getElementById('pay-result').innerHTML = '<div class="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">Pilih periode dan klik "Hitung Payroll"</div>';
            return;
        }

        var html = '';

        // ---- POOL SUMMARY ----
        html += AppPayroll.renderPoolSection(r);

        // ---- TABEL KARYAWAN ----
        html += AppPayroll.renderKaryawanSection(r);

        // ---- PSA ----
        html += AppPayroll.renderPSASection(r);

        document.getElementById('pay-result').innerHTML = html;
        lucide.createIcons();
    },

    /* =========================================
       RENDER POOL
       ========================================= */
    renderPoolSection: function(r) {
        var p = r.pools;
        var html = '';

        html += '<div class="bg-white rounded-xl border border-gray-200 p-5 mb-4">';
        html += '<h3 class="font-semibold text-gray-800 mb-3">Ringkasan Pool</h3>';
        html += '<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">';

        // Resep Klinik
        html += '<div class="bg-blue-50 rounded-lg p-3 space-y-1">';
        html += '<p class="font-semibold text-blue-800">Resep Klinik (' + p.resepKlinik.count + ' resep)</p>';
        html += '<p class="text-blue-700">JM: ' + Utils.formatRupiah(p.resepKlinik.jm) + '</p>';
        html += '<p class="text-blue-700">JD: ' + Utils.formatRupiah(p.resepKlinik.jd) + '</p>';
        html += '<p class="text-blue-700">Pool Kary Klinik: ' + Utils.formatRupiah(p.resepKlinik.karyKlinik) + '</p>';
        html += '<p class="text-blue-700">Pool Kary Apotek: ' + Utils.formatRupiah(p.resepKlinik.karyApotek) + '</p>';
        html += '<p class="text-blue-700">PSA: ' + Utils.formatRupiah(p.resepKlinik.psa) + '</p>';
        html += '<p class="text-blue-800 font-medium">Laba Apotek: ' + Utils.formatRupiah(p.resepKlinik.labaApotek) + '</p>';
        html += '</div>';

        // Resep Luar
        html += '<div class="bg-green-50 rounded-lg p-3 space-y-1">';
        html += '<p class="font-semibold text-green-800">Resep Luar (' + p.resepLuar.count + ' resep)</p>';
        html += '<p class="text-green-700">Dokter: ' + Utils.formatRupiah(p.resepLuar.dokter) + '</p>';
        html += '<p class="text-green-700">PSA: ' + Utils.formatRupiah(p.resepLuar.psa) + '</p>';
        html += '<p class="text-green-800 font-medium">Laba Apotek: ' + Utils.formatRupiah(p.resepLuar.labaApotek) + '</p>';
        html += '</div>';

        // Tindakan Klinik
        html += '<div class="bg-purple-50 rounded-lg p-3 space-y-1">';
        html += '<p class="font-semibold text-purple-800">Tindakan Klinik</p>';
        html += '<p class="text-purple-700">Total Tuslah: ' + Utils.formatRupiah(p.tindakanKlinik.totalTuslah) + '</p>';
        html += '<p class="text-purple-700">Dokter (' + (AppPayroll.configPembagian.tindakanKlinik.dokter || 0) + '%): ' + Utils.formatRupiah(p.tindakanKlinik.dokter) + '</p>';
        html += '<p class="text-purple-700">Pool Kary Klinik (' + (AppPayroll.configPembagian.tindakanKlinik.karyKlinik || 0) + '%): ' + Utils.formatRupiah(p.tindakanKlinik.karyKlinik) + '</p>';
        html += '</div>';

        // Tindakan Apotek
        html += '<div class="bg-teal-50 rounded-lg p-3 space-y-1">';
        html += '<p class="font-semibold text-teal-800">Tindakan Apotek</p>';
        html += '<p class="text-teal-700">Total Tuslah: ' + Utils.formatRupiah(p.tindakanApotek.totalTuslah) + '</p>';
        html += '<p class="text-teal-700">Pool Kary Apotek (' + (AppPayroll.configPembagian.tindakanApotek.karyApotek || 0) + '%): ' + Utils.formatRupiah(p.tindakanApotek.karyApotek) + '</p>';
        html += '<p class="text-teal-700">PSA (' + (AppPayroll.configPembagian.tindakanApotek.psa || 0) + '%): ' + Utils.formatRupiah(p.tindakanApotek.psa) + '</p>';
        html += '</div>';

        // Laba Bersih Obat
        html += '<div class="bg-amber-50 rounded-lg p-3 space-y-1">';
        html += '<p class="font-semibold text-amber-800">Laba Bersih Obat</p>';
        html += '<p class="text-amber-700">Total Margin Obat: ' + Utils.formatRupiah(p.labaBersihObat.total) + '</p>';
        html += '<p class="text-amber-700">Pool Tunjangan Omzet (' + (AppPayroll.configPembagian.tunjanganOmzet.persen || 0) + '%): ' + Utils.formatRupiah(p.labaBersihObat.poolOmzet) + '</p>';
        html += '</div>';

        // Pembulatan & Transport
        html += '<div class="bg-gray-50 rounded-lg p-3 space-y-1">';
        html += '<p class="font-semibold text-gray-800">Pembulatan & Transport</p>';
        html += '<p class="text-gray-700">Total Pembulatan: ' + Utils.formatRupiah(p.pembulatan.total) + '</p>';
        html += '<p class="text-gray-700">Uang Makan (' + r.karyawan.length + ' orang x ' + Utils.formatRupiah(AppPayroll.configPembagian.uangMakan.nominal || 0) + '): ' + Utils.formatRupiah(p.pembulatan.totalUangMakan) + '</p>';
        html += '<p class="text-gray-700">Sisa Pembulatan: ' + Utils.formatRupiah(p.pembulatan.sisa) + '</p>';
        html += '<p class="text-gray-700">Transport: ' + Utils.formatRupiah(p.transport.total) + ' (' + Utils.formatRupiah(p.transport.perOrangApotek) + '/orang apotek)</p>';
        html += '</div>';

        html += '</div></div>';
        return html;
    },

    /* =========================================
       RENDER TABEL KARYAWAN
       ========================================= */
    renderKaryawanSection: function(r) {
        var html = '';

        // Total A & B
        html += '<div class="grid grid-cols-2 gap-4 mb-4">';
        html += '<div class="bg-teal-50 border border-teal-200 rounded-xl p-4 text-center">';
        html += '<p class="text-xs text-teal-600 font-medium">Total Karyawan Apotek (A)</p>';
        html += '<p class="text-lg font-bold text-teal-800">' + Utils.formatRupiah(r.totalA) + '</p>';
        html += '</div>';
        html += '<div class="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">';
        html += '<p class="text-xs text-purple-600 font-medium">Total Karyawan Klinik (B)</p>';
        html += '<p class="text-lg font-bold text-purple-800">' + Utils.formatRupiah(r.totalB) + '</p>';
        html += '</div>';
        html += '</div>';

        // Tabel
        html += '<div class="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">';
        html += '<div class="overflow-x-auto">';
        html += '<table class="w-full text-sm">';
        html += '<thead><tr class="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">';
        html += '<th class="px-3 py-2 text-left">Nama</th>';
        html += '<th class="px-3 py-2 text-left">Dept</th>';
        html += '<th class="px-3 py-2 text-right">Gaji Pokok</th>';
        html += '<th class="px-3 py-2 text-right">Tuslah Apt</th>';
        html += '<th class="px-3 py-2 text-right">Tunj. Omzet</th>';
        html += '<th class="px-3 py-2 text-right">Uang Makan</th>';
        html += '<th class="px-3 py-2 text-right">Transport</th>';
        html += '<th class="px-3 py-2 text-right">Bagi Hasil</th>';
        html += '<th class="px-3 py-2 text-right">Tuslah Klinik</th>';
        html += '<th class="px-3 py-2 text-right">THR</th>';
        html += '<th class="px-3 py-2 text-right font-bold">Total Gaji</th>';
        html += '</tr></thead>';
        html += '<tbody>';

        for (var i = 0; i < r.karyawan.length; i++) {
            var e = r.karyawan[i];
            var thr = e.thrKlinik + e.thrApotek;
            var rowBg = (e.departemen === 'Klinik') ? 'bg-purple-50/30' : '';

            html += '<tr class="border-t border-gray-100 ' + rowBg + '">';
            html += '<td class="px-3 py-2 font-medium">' + Utils.escapeHtml(e.nama) + '</td>';
            html += '<td class="px-3 py-2 text-xs text-gray-500">' + Utils.escapeHtml(e.departemen) + '</td>';
            html += '<td class="px-3 py-2 text-right">' + ((e.gajiPokok > 0) ? Utils.formatRupiah(e.gajiPokok) : '-') + '</td>';
            html += '<td class="px-3 py-2 text-right">' + ((e.tuslahApotek > 0) ? Utils.formatRupiah(e.tuslahApotek) : '-') + '</td>';
            html += '<td class="px-3 py-2 text-right">' + ((e.tunjanganOmzet > 0) ? Utils.formatRupiah(e.tunjanganOmzet) : '-') + '</td>';
            html += '<td class="px-3 py-2 text-right">' + ((e.uangMakan > 0) ? Utils.formatRupiah(e.uangMakan) : '-') + '</td>';
            html += '<td class="px-3 py-2 text-right">' + ((e.transport > 0) ? Utils.formatRupiah(e.transport) : '-') + '</td>';
            html += '<td class="px-3 py-2 text-right">' + ((e.bagiHasilResep > 0) ? Utils.formatRupiah(e.bagiHasilResep) : '-') + '</td>';
            html += '<td class="px-3 py-2 text-right">' + ((e.tuslahKlinik > 0) ? Utils.formatRupiah(e.tuslahKlinik) : '-') + '</td>';
            html += '<td class="px-3 py-2 text-right text-amber-600">' + ((thr > 0) ? Utils.formatRupiah(thr) : '-') + '</td>';
            html += '<td class="px-3 py-2 text-right font-bold text-primary-700">' + Utils.formatRupiah(e.totalGaji) + '</td>';
            html += '</tr>';
        }

        html += '</tbody></table></div></div>';
        return html;
    },

    /* =========================================
       RENDER PSA
       ========================================= */
    renderPSASection: function(r) {
        var psa = r.psa;
        var html = '';

        html += '<div class="bg-white rounded-xl border border-gray-200 p-5 mb-4">';
        html += '<h3 class="font-semibold text-gray-800 mb-3">PSA (Pemilik Sarana Apotek)</h3>';

        html += '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm mb-4">';
        html += '<div class="bg-gray-50 rounded-lg p-3"><p class="text-xs text-gray-500">Resep Klinik</p><p class="font-medium">' + Utils.formatRupiah(psa.dariResepKlinik) + '</p></div>';
        html += '<div class="bg-gray-50 rounded-lg p-3"><p class="text-xs text-gray-500">Resep Luar</p><p class="font-medium">' + Utils.formatRupiah(psa.dariResepLuar) + '</p></div>';
        html += '<div class="bg-gray-50 rounded-lg p-3"><p class="text-xs text-gray-500">Tindakan Apotek</p><p class="font-medium">' + Utils.formatRupiah(psa.dariTindakanApotek) + '</p></div>';
        html += '<div class="bg-gray-50 rounded-lg p-3"><p class="text-xs text-gray-500">Tunjangan Omzet</p><p class="font-medium">' + Utils.formatRupiah(psa.dariTunjanganOmzet) + '</p></div>';
        html += '<div class="bg-gray-50 rounded-lg p-3"><p class="text-xs text-gray-500">Sisa Pembulatan</p><p class="font-medium">' + Utils.formatRupiah(psa.sisaPembulatan) + '</p></div>';
        html += '<div class="bg-gray-50 rounded-lg p-3"><p class="text-xs text-gray-500">50% Margin Sisa</p><p class="font-medium">' + Utils.formatRupiah(psa.dariMargin) + '</p></div>';
        html += '</div>';

        // Grand total
        html += '<div class="border-t border-gray-200 pt-3 space-y-1 text-sm">';
        html += '<div class="flex justify-between"><span class="text-gray-600">Margin Bulan (Obat + Tindakan)</span><span class="font-medium">' + Utils.formatRupiah(r.marginBulan) + '</span></div>';
        html += '<div class="flex justify-between"><span class="text-gray-600">Total A (Karyawan Apotek)</span><span class="text-red-500">- ' + Utils.formatRupiah(r.totalA) + '</span></div>';
        html += '<div class="flex justify-between"><span class="text-gray-600">Total B (Karyawan Klinik)</span><span class="text-red-500">- ' + Utils.formatRupiah(r.totalB) + '</span></div>';
        html += '<div class="flex justify-between"><span class="text-gray-600">Sisa Margin</span><span class="font-medium">' + Utils.formatRupiah(r.sisaMargin) + '</span></div>';
        html += '<hr class="border-gray-200">';
        html += '<div class="flex justify-between text-lg font-bold"><span>Total PSA</span><span class="text-primary-700">' + Utils.formatRupiah(psa.total) + '</span></div>';
        html += '</div></div>';

        return html;
    },

    /* =========================================
       SIMPAN PAYROLL
       ========================================= */
    simpan: function() {
        var r = AppPayroll.result;
        if (!r) {
            Utils.toast('Hitung payroll terlebih dahulu', 'error');
            return;
        }

        var btn = document.getElementById('btn-simpan-payroll');
        btn.disabled = true;
        btn.textContent = 'Menyimpan...';

        r.calculatedAt = firebase.firestore.FieldValue.serverTimestamp();

        db.collection('payroll').doc(r.bulan).set(r)
            .then(function() {
                Utils.toast('Payroll periode ' + Utils.escapeHtml(r.bulan) + ' berhasil disimpan', 'success');
            })
            .catch(function(err) {
                Utils.toast('Gagal menyimpan: ' + err.message, 'error');
            })
            .finally(function() {
                btn.disabled = false;
                btn.textContent = ' Simpan';
            });
    }
};
