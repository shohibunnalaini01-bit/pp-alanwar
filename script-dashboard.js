/* =========================
   KONFIGURASI DASAR & ROLE
========================= */
const BASE_URL = "https://ghzrgymmsrbycmwlbbnw.supabase.co/rest/v1/murid";
const URL_KELAS = "https://ghzrgymmsrbycmwlbbnw.supabase.co/rest/v1/kelas";
const URL_KAMAR = "https://ghzrgymmsrbycmwlbbnw.supabase.co/rest/v1/kamar";
const URL_IZIN = "https://ghzrgymmsrbycmwlbbnw.supabase.co/rest/v1/perizinan";
const URL_REKAP = "https://ghzrgymmsrbycmwlbbnw.supabase.co/rest/v1/rekap_mingguan";
const URL_PELANGGARAN = "https://ghzrgymmsrbycmwlbbnw.supabase.co/rest/v1/pelanggaran";
const API_KEY = "sb_publishable_cP-NCH-oxYoOxnqOxonl8A_J-F2cmPY";

const HEADERS = {
    'apikey': API_KEY,
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
};
const HEADERS_GET = {
    'apikey': API_KEY,
    'Authorization': `Bearer ${API_KEY}`
};

window.allDataMurid = [];
let menuAktifDisiplin = 'kelas';

const POIN_JAMAAH = 1;
const POIN_BATIN = 1;
const POIN_SEKOLAH = 1;
const POIN_SUNNAH = 1;

// KONFIGURASI AKSES ROLE
const ROLES = {
    'superadmin': { name: 'Super Admin', pages: ['ringkasan', 'murid', 'kelas', 'kamar', 'perizinan', 'pelanggaran'] },
    'perizinan': { name: 'Admin Perizinan', pages: ['ringkasan', 'perizinan'] }, // Bisa lihat dashboard & perizinan
    'pelanggaran': { name: 'Admin Pelanggaran', pages: ['ringkasan', 'pelanggaran'] } // Bisa lihat dashboard & pelanggaran
};

let currentUser = null;


/* =========================
   1. NAVIGASI HALAMAN & HP
========================= */
function showPage(pageId, element) {
    // CEK AKSES ROLE
    if (!currentUser || !ROLES[currentUser.role].pages.includes(pageId)) {
        Swal.fire('Akses Ditolak', 'Anda tidak memiliki izin untuk membuka halaman ini.', 'error');
        return;
    }

    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const halaman = document.getElementById('page-' + pageId);
    if (halaman) halaman.classList.add('active');

    document.querySelectorAll('.nav-menu a').forEach(menu => menu.classList.remove('active'));
    if (element) element.classList.add('active');

    if (pageId === 'ringkasan') loadDashboardCharts();
    else if (pageId === 'murid') loadDataMurid();
    else if (pageId === 'kelas') { refreshDropdownKelas(); loadPenghuniKelas(); }
    else if (pageId === 'kamar') { refreshDropdownKamar(); loadPenghuniKamar(); }
    else if (pageId === 'perizinan') { refreshDropdownSantriIzin(); bukaTabIzin('input'); }
    else if (pageId === 'pelanggaran') navDisiplin('kelas');

    if (window.innerWidth <= 768) toggleSidebar();
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if(sidebar && overlay) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    }
}

function toggleModal(show) {
    const modal = document.getElementById('modalMurid');
    if (show) modal.style.display = 'block';
    else { modal.style.display = 'none'; document.getElementById('formMurid').reset(); }
}


/* =========================
   2. DATA MURID (CRUD)
========================= */
async function loadDataMurid() {
    const tbody = document.getElementById('list-murid');
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Memuat data...</td></tr>`;
    try {
        const response = await fetch(`${BASE_URL}?select=*&order=nama_murid.asc`, { headers: HEADERS_GET });
        const data = await response.json();
        window.allDataMurid = data;
        renderTable(data);
        document.getElementById('count-murid').innerText = data.length + " Santri";
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:red;">Gagal memuat data</td></tr>`;
    }
}

function renderTable(data) {
    const tbody = document.getElementById('list-murid');
    tbody.innerHTML = '';
    if (data.length === 0) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Data tidak ditemukan</td></tr>`; return; }
    data.forEach(m => {
        tbody.innerHTML += `
            <tr>
                <td style="cursor:pointer;color:#00703c;font-weight:bold;" onclick="lihatDetail(${m.id})">${m.nama_murid || '-'}</td>
                <td>${m.nik_murid || '-'}</td>
                <td>${m.desa || '-'}</td>
                <td>
                    <button onclick="lihatDetail(${m.id})" style="color:blue;border:none;background:none;cursor:pointer;"><i class="fas fa-eye"></i></button>
                    <button onclick="hapusData(${m.id}, '${m.nama_murid}')" style="color:red;border:none;background:none;cursor:pointer;"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
    });
}

function searchData() {
    const keyword = document.getElementById('inputCari').value.toLowerCase();
    renderTable(window.allDataMurid.filter(m => m.nama_murid.toLowerCase().includes(keyword) || m.nik_murid.includes(keyword)));
}

document.getElementById('formMurid').addEventListener('submit', async function(e) {
    e.preventDefault();
    Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const payload = {
        nama_murid: document.getElementById('nama_murid').value, nik_murid: document.getElementById('nik_murid').value,
        no_kk: document.getElementById('no_kk').value, nama_ayah: document.getElementById('nama_ayah').value,
        nik_ayah: document.getElementById('nik_ayah').value, nama_ibu: document.getElementById('nama_ibu').value,
        nik_ibu: document.getElementById('nik_ibu').value, dusun: document.getElementById('dusun').value,
        desa: document.getElementById('desa').value, kecamatan: document.getElementById('kecamatan').value,
        kabupaten: document.getElementById('kabupaten').value, provinsi: document.getElementById('provinsi').value
    };
    try {
        const response = await fetch(BASE_URL, { method: 'POST', headers: {...HEADERS, 'Prefer': 'return=representation'}, body: JSON.stringify(payload) });
        if (response.ok) { Swal.fire('Berhasil!', 'Data murid berhasil ditambahkan.', 'success'); toggleModal(false); loadDataMurid(); }
        else { Swal.fire('Gagal!', 'Tidak bisa menyimpan data.', 'error'); }
    } catch (err) { Swal.fire('Error', 'Koneksi database gagal.', 'error'); }
});

async function hapusData(id, nama) {
    const confirm = await Swal.fire({ title: 'Hapus Data?', text: `Yakin ingin menghapus ${nama}?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' });
    if (!confirm.isConfirmed) return;
    try {
        const res = await fetch(`${BASE_URL}?id=eq.${id}`, { method: 'DELETE', headers: HEADERS_GET });
        if (res.ok) { Swal.fire('Berhasil!', 'Data berhasil dihapus.', 'success'); loadDataMurid(); }
    } catch (err) { Swal.fire('Error', 'Masalah koneksi.', 'error'); }
}

function lihatDetail(id) {
    const m = window.allDataMurid.find(item => item.id === id);
    if (!m) return;
    Swal.fire({
        title: 'Detail Murid',
        html: `<div style="text-align:left;"><p><b>Nama:</b> ${m.nama_murid || '-'}</p><p><b>NIK:</b> ${m.nik_murid || '-'}</p><hr><p><b>Ayah:</b> ${m.nama_ayah || '-'}</p><p><b>Ibu:</b> ${m.nama_ibu || '-'}</p><hr><p><b>Alamat:</b><br>Desa ${m.desa || '-'}<br>${m.kecamatan || '-'}</p></div>`,
        confirmButtonColor: '#00703c'
    });
}

function logout() { 
    sessionStorage.removeItem('alAnwarUser'); 
    window.location.href = "index.html"; // Ganti dengan nama file login Anda
}


/* =========================
   3. MANAJEMEN KELAS
========================= */
async function refreshDropdownKelas() {
    try {
        const res = await fetch(`${URL_KELAS}?select=*`, { headers: HEADERS_GET });
        const data = await res.json();
        const select = document.getElementById('pilih-kelas-filter');
        select.innerHTML = '<option value="">-- Pilih Kelas --</option>';
        data.forEach(k => { select.innerHTML += `<option value="${k.id}">${k.nama_kelas}</option>`; });
    } catch (err) { console.error(err); }
}

async function loadPenghuniKelas() {
    const idKelas = document.getElementById('pilih-kelas-filter').value;
    const tbody = document.getElementById('body-tabel-kelas');
    if (!idKelas) { tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Pilih kelas terlebih dahulu</td></tr>`; return; }
    try {
        const res = await fetch(`${BASE_URL}?id_kelas=eq.${idKelas}&select=*`, { headers: HEADERS_GET });
        const data = await res.json();
        tbody.innerHTML = '';
        if (data.length === 0) { tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Belum ada murid</td></tr>`; return; }
        data.forEach(m => {
            tbody.innerHTML += `<tr><td>${m.nama_murid}</td><td>${m.nik_murid}</td><td><button onclick="keluarkanMurid(${m.id})" class="btn-keluarkan"><i class="fas fa-user-minus"></i> Keluarkan</button></td></tr>`;
        });
    } catch (err) { console.error(err); }
}

async function tambahMuridKeKelas() {
    const idKelas = document.getElementById('pilih-kelas-filter').value;
    if (!idKelas) return Swal.fire('Pilih Kelas!', 'Silakan pilih kelas di filter terlebih dahulu.', 'warning');
    try {
        const res = await fetch(`${BASE_URL}?id_kelas=is.null&select=id,nama_murid,desa`, { headers: HEADERS_GET });
        const muridTersedia = await res.json();
        if (muridTersedia.length === 0) return Swal.fire('Data Kosong', 'Semua santri sudah punya kelas.', 'info');
        const options = {};
        muridTersedia.forEach(m => { options[m.id] = `${m.nama_murid} (${m.desa || '-'})`; });
        const { value: idMurid } = await Swal.fire({ title: 'Masukkan Murid ke Kelas', input: 'select', inputOptions: options, showCancelButton: true, confirmButtonColor: '#00703c' });
        if (idMurid) {
            await fetch(`${BASE_URL}?id=eq.${idMurid}`, { method: 'PATCH', headers: HEADERS, body: JSON.stringify({ id_kelas: parseInt(idKelas) }) });
            Swal.fire('Berhasil!', 'Santri dimasukkan ke kelas.', 'success'); loadPenghuniKelas();
        }
    } catch (error) { Swal.fire('Error', 'Gagal menghubungi database.', 'error'); }
}

async function keluarkanMurid(id) {
    const confirm = await Swal.fire({ title: 'Keluarkan murid?', icon: 'warning', showCancelButton: true });
    if (!confirm.isConfirmed) return;
    await fetch(`${BASE_URL}?id=eq.${id}`, { method: 'PATCH', headers: HEADERS, body: JSON.stringify({ id_kelas: null }) });
    Swal.fire('Berhasil!', 'Murid dikeluarkan.', 'success'); loadPenghuniKelas();
}

async function tambahNamaKelasMaster() {
    const { value: namaKelas } = await Swal.fire({ title: 'Tambah Kelas Baru', input: 'text', showCancelButton: true });
    if (!namaKelas) return;
    try {
        await fetch(URL_KELAS, { method: 'POST', headers: HEADERS, body: JSON.stringify({ nama_kelas: namaKelas }) });
        Swal.fire('Berhasil', 'Kelas terdaftar', 'success'); 
        refreshDropdownKelas();
        tampilkanMenuTombolKelas(); 
        refreshDataDisiplin(); 
    } catch(e) { Swal.fire('Gagal', '', 'error'); }
}

/* =========================
   4. MANAJEMEN KAMAR
========================= */
async function refreshDropdownKamar() {
    try {
        const res = await fetch(`${URL_KAMAR}?select=*`, { headers: HEADERS_GET });
        const data = await res.json();
        const select = document.getElementById('pilih-kamar-filter');
        select.innerHTML = '<option value="">-- Pilih Kamar --</option>';
        data.forEach(k => { select.innerHTML += `<option value="${k.id}">${k.nama_kamar}</option>`; });
    } catch (err) { console.error(err); }
}

async function loadPenghuniKamar() {
    const idKamar = document.getElementById('pilih-kamar-filter').value;
    const tbody = document.getElementById('body-tabel-kamar');
    if (!idKamar) { tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Pilih kamar terlebih dahulu</td></tr>`; return; }
    try {
        const res = await fetch(`${BASE_URL}?id_kamar=eq.${idKamar}&select=*`, { headers: HEADERS_GET });
        const data = await res.json();
        tbody.innerHTML = '';
        if (data.length === 0) { tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Belum ada penghuni</td></tr>`; return; }
        data.forEach(m => {
            tbody.innerHTML += `<tr><td>${m.nama_murid}</td><td>${m.nik_murid}</td><td><button onclick="keluarkanDariKamar(${m.id})" class="btn-keluarkan"><i class="fas fa-user-minus"></i> Keluarkan</button></td></tr>`;
        });
    } catch (err) { console.error(err); }
}

async function tambahMuridKeKamar() {
    const idKamar = document.getElementById('pilih-kamar-filter').value;
    if (!idKamar) return Swal.fire('Pilih Kamar!', 'Silakan pilih kamar dulu.', 'warning');
    const res = await fetch(`${BASE_URL}?id_kamar=is.null&select=id,nama_murid`, { headers: HEADERS_GET });
    const murid = await res.json();
    const options = {};
    murid.forEach(m => { options[m.id] = m.nama_murid; });
    const { value: idMurid } = await Swal.fire({ title: 'Masukkan ke Kamar', input: 'select', inputOptions: options, showCancelButton: true });
    if (idMurid) {
        await fetch(`${BASE_URL}?id=eq.${idMurid}`, { method: 'PATCH', headers: HEADERS, body: JSON.stringify({ id_kamar: parseInt(idKamar) }) });
        Swal.fire('Berhasil!', 'Santri masuk kamar.', 'success'); loadPenghuniKamar();
    }
}

async function keluarkanDariKamar(id) {
    const confirm = await Swal.fire({ title: 'Keluarkan dari kamar?', icon: 'warning', showCancelButton: true });
    if (!confirm.isConfirmed) return;
    await fetch(`${BASE_URL}?id=eq.${id}`, { method: 'PATCH', headers: HEADERS, body: JSON.stringify({ id_kamar: null }) });
    Swal.fire('Berhasil!', 'Santri dikeluarkan.', 'success'); loadPenghuniKamar();
}

async function tambahNamaKamarMaster() {
    const { value: namaKamar } = await Swal.fire({ title: 'Tambah Kamar Baru', input: 'text', showCancelButton: true });
    if (!namaKamar) return;
    try {
        await fetch(URL_KAMAR, { method: 'POST', headers: HEADERS, body: JSON.stringify({ nama_kamar: namaKamar }) });
        Swal.fire('Berhasil', 'Kamar terdaftar', 'success'); 
        refreshDropdownKamar();
        refreshDataDisiplin(); 
    } catch(e) { Swal.fire('Gagal', '', 'error'); }
}

/* =========================
   5. PERIZINAN
========================= */
function bukaTabIzin(tabId, element) {
    document.querySelectorAll('.content-izin').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('#page-perizinan .btn-tab').forEach(b => b.classList.remove('active'));
    if (tabId === 'input') document.getElementById('tab-input').classList.add('active');
    else { document.getElementById('tab-data').classList.add('active'); loadDataIzin(tabId); }
    if (element) element.classList.add('active');
}

function hitungTglKembali() {
    const hari = document.getElementById('estimasi-hari').value;
    const infoTgl = document.getElementById('tgl-kembali-view');
    const isSakit = document.getElementById('izin-sakit').checked;
    if (isSakit) { infoTgl.value = "Sampai Sembuh"; return; }
    if (!hari || hari < 0) { infoTgl.value = ""; return; }
    let targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + parseInt(hari));
    infoTgl.value = targetDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + " (20:00)";
}

function toggleSakit() {
    const isSakit = document.getElementById('izin-sakit').checked;
    const inputHari = document.getElementById('estimasi-hari');
    inputHari.value = isSakit ? "" : inputHari.value;
    inputHari.disabled = isSakit;
    hitungTglKembali();
}

async function refreshDropdownSantriIzin() {
    const res = await fetch(BASE_URL + "?select=id,nama_murid,desa", { headers: HEADERS_GET });
    const data = await res.json();
    window.listMuridIzin = data;
    const select = document.getElementById('pilih-santri-izin');
    select.innerHTML = '<option value="">-- Pilih Santri --</option>';
    data.forEach(m => { select.innerHTML += `<option value="${m.id}">${m.nama_murid}</option>`; });
}

function updateAlamatIzin() {
    const idMurid = document.getElementById('pilih-santri-izin').value;
    const viewAlamat = document.getElementById('alamat-izin-view');
    const murid = window.listMuridIzin.find(m => m.id == idMurid);
    viewAlamat.value = murid ? murid.desa : "";
}

async function simpanIzin() {
    const idMurid = document.getElementById('pilih-santri-izin').value;
    const alasan = document.getElementById('alasan-izin').value;
    const hari = document.getElementById('estimasi-hari').value;
    const isSakit = document.getElementById('izin-sakit').checked;
    if (!idMurid || !alasan) return Swal.fire('Gagal', 'Nama dan Alasan wajib diisi!', 'error');

    let tglRencana = null;
    if (!isSakit && hari) {
        let d = new Date(); d.setDate(d.getDate() + parseInt(hari)); d.setHours(20, 0, 0, 0);
        tglRencana = d.toISOString();
    }
    const payload = {
        id_murid: parseInt(idMurid), alasan: alasan, tgl_pulang: new Date().toISOString(),
        estimasi_hari: isSakit ? null : parseInt(hari), tgl_kembali_rencana: tglRencana, status: 'Pulang'
    };
    try {
        const res = await fetch(URL_IZIN, { method: 'POST', headers: HEADERS, body: JSON.stringify(payload) });
        if (res.ok) {
            Swal.fire('Berhasil!', 'Data perizinan disimpan.', 'success');
            document.getElementById('alasan-izin').value = ""; document.getElementById('estimasi-hari').value = "";
            document.getElementById('izin-sakit').checked = false; toggleSakit();
            bukaTabIzin('semua', document.querySelector('#page-perizinan .btn-tab:nth-child(2)'));
        }
    } catch (err) { console.error(err); }
}

async function loadDataIzin(filter) {
    const tbody = document.getElementById('list-izin');
    tbody.innerHTML = '<tr><td colspan="5">Memuat data...</td></tr>';
    try {
        const res = await fetch(`${URL_IZIN}?select=*,murid(nama_murid,desa)&order=tgl_pulang.desc`, { headers: HEADERS_GET });
        const data = await res.json();
        const skrg = new Date();
        tbody.innerHTML = '';
        data.forEach(item => {
            let statusSkrg = item.status;
            let tglRencana = item.tgl_kembali_rencana ? new Date(item.tgl_kembali_rencana) : null;
            if (statusSkrg === 'Pulang' && tglRencana && skrg > tglRencana) statusSkrg = 'Terlambat';

            if (filter === 'pulang' && statusSkrg !== 'Pulang') return;
            if (filter === 'terlambat' && statusSkrg !== 'Terlambat') return;

            tbody.innerHTML += `
                <tr>
                    <td><b>${item.murid.nama_murid}</b><br><small>${item.murid.desa}</small></td>
                    <td>${item.alasan}</td>
                    <td>${tglRencana ? tglRencana.toLocaleString('id-ID') : 'Sampai Sembuh'}</td>
                    <td><span class="badge-izin status-${statusSkrg.toLowerCase()}">${statusSkrg}</span></td>
                    <td>
                        ${statusSkrg !== 'Kembali' ? `<button onclick="prosesKembali(${item.id})" class="btn-keluarkan" style="border-color:green;color:green;margin-bottom:5px;"><i class="fas fa-check"></i> Kembali</button>` : ''}
                        ${statusSkrg === 'Terlambat' ? `<button onclick="perpanjangIzin(${item.id})" class="btn-keluarkan" style="border-color:orange;color:orange;"><i class="fas fa-clock"></i> Perpanjang</button>` : ''}
                    </td>
                </tr>`;
        });
    } catch (err) { console.error(err); }
}

async function prosesKembali(id) {
    const confirm = await Swal.fire({ title: 'Konfirmasi Kembali?', icon: 'question', showCancelButton: true });
    if (!confirm.isConfirmed) return;
    await fetch(`${URL_IZIN}?id=eq.${id}`, { method: 'PATCH', headers: HEADERS, body: JSON.stringify({ status: 'Kembali', tgl_kembali_asli: new Date().toISOString() }) });
    Swal.fire('Selesai', 'Santri sudah kembali.', 'success'); loadDataIzin('semua');
}

async function perpanjangIzin(id) {
    const { value: hariTambah } = await Swal.fire({ title: 'Perpanjang Izin', input: 'number', inputPlaceholder: 'Tambah berapa hari?', showCancelButton: true });
    if (hariTambah && hariTambah > 0) {
        let d = new Date(); d.setDate(d.getDate() + parseInt(hariTambah)); d.setHours(20, 0, 0, 0);
        await fetch(`${URL_IZIN}?id=eq.${id}`, { method: 'PATCH', headers: HEADERS, body: JSON.stringify({ tgl_kembali_rencana: d.toISOString(), status: 'Pulang' }) });
        Swal.fire('Diperpanjang!', `Batas waktu ditambah ${hariTambah} hari.`, 'success'); loadDataIzin('terlambat');
    }
}

/* =========================
   6. PELANGGARAN & REKAP
========================= */
function navDisiplin(menu, element) {
    if (element) {
        document.querySelectorAll('#page-pelanggaran .btn-tab').forEach(btn => btn.classList.remove('active'));
        element.classList.add('active');
    }
    document.getElementById('section-ranking').style.display = 'none';
    document.getElementById('section-pilih-kelas-rekap').style.display = 'none';
    document.getElementById('section-form-massal').style.display = 'none';
    document.getElementById('section-berat').style.display = 'none';

    if (menu === 'rekap') { document.getElementById('section-pilih-kelas-rekap').style.display = 'block'; tampilkanMenuTombolKelas(); }
    else if (menu === 'berat') { document.getElementById('section-berat').style.display = 'block'; isiDropdownMuridBerat(); }
    else { document.getElementById('section-ranking').style.display = 'block'; menuAktifDisiplin = menu; refreshDataDisiplin(); }
}

async function refreshDataDisiplin() {
    const bulan = document.getElementById('filter-bulan-disiplin').value;
    const thead = document.getElementById('head-disiplin');
    const tbody = document.getElementById('body-disiplin');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Menganalisis Data...</td></tr>';

    try {
        const [resBerat, resRingan, resKelas, resKamar] = await Promise.all([
            fetch(`${URL_PELANGGARAN}?select=*,murid(nama_murid,id_kelas,id_kamar,kelas(nama_kelas),kamar(nama_kamar))`, { headers: HEADERS_GET }),
            fetch(`${URL_REKAP}?select=*,murid(nama_murid,id_kelas,id_kamar,kelas(nama_kelas),kamar(nama_kamar))`, { headers: HEADERS_GET }),
            fetch(URL_KELAS, { headers: HEADERS_GET }),
            fetch(URL_KAMAR, { headers: HEADERS_GET })
        ]);

        const dataBerat = await resBerat.json();
        const dataRingan = await resRingan.json();
        const dataKelas = await resKelas.json();
        const dataKamar = await resKamar.json();

        const beratBulanIni = dataBerat.filter(item => item.tgl_kejadian && item.tgl_kejadian.includes(bulan));
        const ringanBulanIni = dataRingan.filter(item => item.bulan && item.bulan.includes(bulan));

        let rekapPoin = {};

        if (menuAktifDisiplin === 'kelas') {
            dataKelas.forEach(k => { rekapPoin[String(k.id)] = { nama: k.nama_kelas, poin: 0 }; });
            thead.innerHTML = '<tr><th>Rank</th><th>Nama Kelas</th><th>Total Poin</th></tr>';
        } else {
            dataKamar.forEach(k => { rekapPoin[String(k.id)] = { nama: k.nama_kamar, poin: 0 }; });
            thead.innerHTML = '<tr><th>Rank</th><th>Nama Kamar</th><th>Total Poin</th></tr>';
        }

        beratBulanIni.forEach(item => {
            let key = String(menuAktifDisiplin === 'kelas' ? item.murid.id_kelas : item.murid.id_kamar);
            if (key && rekapPoin[key]) rekapPoin[key].poin += parseInt(item.poin || 0);
        });

        ringanBulanIni.forEach(item => {
            let key = String(menuAktifDisiplin === 'kelas' ? item.murid.id_kelas : item.murid.id_kamar);
            if (key && rekapPoin[key]) {
                rekapPoin[key].poin += (parseInt(item.jamaah || 0) * POIN_JAMAAH);
                rekapPoin[key].poin += (parseInt(item.gerak_batin || 0) * POIN_BATIN);
                rekapPoin[key].poin += (parseInt(item.sekolah || 0) * POIN_SEKOLAH);
                rekapPoin[key].poin += (parseInt(item.sholat_sunnah || 0) * POIN_SUNNAH);
            }
        });

        let finalData = Object.values(rekapPoin);
        finalData.sort((a, b) => b.poin - a.poin);

        tbody.innerHTML = '';
        finalData.forEach((r, index) => {
            tbody.innerHTML += `
                <tr>
                    <td><b>${index + 1}</b></td>
                    <td>${r.nama}</td>
                    <td><b style="color:${r.poin > 0 ? 'red' : '#333'}">${r.poin} Poin</b></td>
                </tr>`;
        });

    } catch (e) { 
        console.error(e); 
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:red;">Gagal memuat data</td></tr>';
    }
}

async function isiDropdownMuridBerat() {
    try {
        const res = await fetch(`${BASE_URL}?select=id,nama_murid&order=nama_murid.asc`, { headers: HEADERS_GET });
        const data = await res.json();
        const select = document.getElementById('pilih-murid-berat');
        select.innerHTML = '<option value="">-- Pilih Murid --</option>';
        data.forEach(m => { select.innerHTML += `<option value="${m.id}">${m.nama_murid}</option>`; });
    } catch(e) { console.error(e); }
}

async function simpanPelanggaranBerat() {
    const id_murid = document.getElementById('pilih-murid-berat').value;
    const jenis_pelanggaran = document.getElementById('nama-pelanggaran-berat').value;
    const poin = document.getElementById('poin-berat').value;

    if (!id_murid || !jenis_pelanggaran || !poin) return Swal.fire('Lengkapi Data!', 'Wajib diisi semua!', 'warning');

    try {
        const res = await fetch(URL_PELANGGARAN, {
            method: 'POST', headers: HEADERS,
            body: JSON.stringify({
                id_murid: parseInt(id_murid), 
                jenis_pelanggaran: jenis_pelanggaran, 
                poin: parseInt(poin),
                tgl_kejadian: new Date().toISOString().split('T')[0], 
                kategori: "Berat" 
            })
        });

        if (res.ok) {
            Swal.fire('Tercatat!', 'Pelanggaran berat berhasil disimpan.', 'success');
            document.getElementById('nama-pelanggaran-berat').value = '';
            document.getElementById('poin-berat').value = '';
            if (document.getElementById('section-ranking').style.display === 'block') refreshDataDisiplin();
        } else {
            const errData = await res.json();
            console.error("Supabase Error:", errData);
            Swal.fire('Gagal', 'Cek kembali tipe data di Supabase Anda!', 'error');
        }
    } catch(e) { 
        Swal.fire('Error', 'Koneksi database gagal.', 'error'); 
    }
}

async function tampilkanMenuTombolKelas() {
    const container = document.getElementById('list-tombol-kelas-rekap');
    container.innerHTML = '<p>Memuat daftar kelas...</p>';
    try {
        const res = await fetch(URL_KELAS, { headers: HEADERS_GET });
        const data = await res.json();
        container.innerHTML = '';
        data.forEach(k => {
            container.innerHTML += `
                <div class="card-kelas" onclick="bukaFormMassal(${k.id}, '${k.nama_kelas}')">
                    <i class="fas fa-users"></i>
                    <h4>${k.nama_kelas}</h4>
                    <p>Klik untuk isi audit</p>
                </div>`;
        });
    } catch (e) { console.error(e); }
}

async function bukaFormMassal(idKelas, namaKelas) {
    document.getElementById('section-pilih-kelas-rekap').style.display = 'none';
    document.getElementById('section-form-massal').style.display = 'block';
    document.getElementById('judul-rekap-massal').innerText = "Input Rekap Ringan: " + namaKelas;
    const tbody = document.getElementById('body-rekap-massal');
    tbody.innerHTML = '<tr><td colspan="5">Memuat daftar santri...</td></tr>';

    try {
        const res = await fetch(`${BASE_URL}?id_kelas=eq.${idKelas}&select=id,nama_murid`, { headers: HEADERS_GET });
        const dataMurid = await res.json();
        tbody.innerHTML = '';
        if (dataMurid.length === 0) { tbody.innerHTML = '<tr><td colspan="5">Belum ada murid di kelas ini.</td></tr>'; return; }
        dataMurid.forEach(m => {
            tbody.innerHTML += `
                <tr class="row-rekap-santri" data-id="${m.id}">
                    <td><b>${m.nama_murid}</b></td>
                    <td><input type="number" class="in-jam" style="width:70px; padding:5px;" placeholder="0" min="0"></td>
                    <td><input type="number" class="in-bat" style="width:70px; padding:5px;" placeholder="0" min="0"></td>
                    <td><input type="number" class="in-sek" style="width:70px; padding:5px;" placeholder="0" min="0"></td>
                    <td><input type="number" class="in-sun" style="width:70px; padding:5px;" placeholder="0" min="0"></td>
                </tr>`;
        });
    } catch (e) { console.error(e); }
}

async function simpanRekapMassal() {
    const rows = document.querySelectorAll('.row-rekap-santri');
    const bulan = document.getElementById('audit-bulan').value;
    const minggu = document.getElementById('audit-minggu').value;

    if (rows.length === 0) return;
    Swal.fire({ title: 'Menyimpan Rekap...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
        let berhasil = 0;
        for (let row of rows) {
            const jamaah = row.querySelector('.in-jam').value || 0;
            const batin = row.querySelector('.in-bat').value || 0;
            const sekolah = row.querySelector('.in-sek').value || 0;
            const sunnah = row.querySelector('.in-sun').value || 0;

            if (jamaah > 0 || batin > 0 || sekolah > 0 || sunnah > 0) {
                const payload = {
                    id_murid: parseInt(row.dataset.id), 
                    bulan: bulan, 
                    minggu: parseInt(minggu), 
                    jamaah: parseInt(jamaah), 
                    gerak_batin: parseInt(batin), 
                    sekolah: parseInt(sekolah), 
                    sholat_sunnah: parseInt(sunnah)
                };
                
                const res = await fetch(URL_REKAP, { method: 'POST', headers: HEADERS, body: JSON.stringify(payload) });
                if (res.ok) berhasil++;
                else { const err = await res.json(); console.error("Error Rekap:", err); }
            }
        }
        
        if (berhasil > 0) {
            Swal.fire('Berhasil!', `${berhasil} rekap pelanggaran tersimpan.`, 'success');
            navDisiplin('kelas');
        } else {
            Swal.fire('Gagal', 'Tidak ada data tersimpan.', 'error');
        }
    } catch (e) { 
        Swal.fire('Gagal', 'Masalah koneksi.', 'error'); 
    }
}

/* =========================
   7. CHART.JS DASHBOARD
========================= */
async function loadDashboardCharts() { try { await Promise.all([inisialisasiGrafikKelas(), inisialisasiGrafikKamar()]); } catch(e){} }

async function inisialisasiGrafikKelas() {
    const canvasKelas = document.getElementById('chartKelas');
    if (!canvasKelas) return;
    try {
        const [resKelas, resMurid] = await Promise.all([ fetch(URL_KELAS, { headers: HEADERS_GET }), fetch(BASE_URL + "?select=id_kelas", { headers: HEADERS_GET }) ]);
        const daftarKelas = await resKelas.json(); const daftarMurid = await resMurid.json();
        const labelKelas = [], dataJumlah = [];
        daftarKelas.forEach(k => { labelKelas.push(k.nama_kelas); dataJumlah.push(daftarMurid.filter(m => m.id_kelas === k.id).length); });
        const ctx = canvasKelas.getContext('2d'); if (window.myChartKelas) window.myChartKelas.destroy();
        window.myChartKelas = new Chart(ctx, { type: 'bar', data: { labels: labelKelas, datasets: [{ label: 'Jumlah Santri', data: dataJumlah, backgroundColor: ['#00703c','#008f4c','#2ecc71','#ffcc00','#f39c12','#d35400'], borderRadius: 5 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } } });
    } catch (e) { console.error("Grafik Kelas Error:", e); }
}

async function inisialisasiGrafikKamar() {
    const canvasKamar = document.getElementById('chartKamar');
    if (!canvasKamar) return;
    try {
        const [resKamar, resMurid] = await Promise.all([ fetch(URL_KAMAR, { headers: HEADERS_GET }), fetch(BASE_URL + "?select=id_kamar", { headers: HEADERS_GET }) ]);
        const daftarKamar = await resKamar.json(); const daftarMurid = await resMurid.json();
        const labelKamar = [], dataJumlah = [];
        daftarKamar.forEach(k => { labelKamar.push(k.nama_kamar); dataJumlah.push(daftarMurid.filter(m => m.id_kamar === k.id).length); });
        const ctx = canvasKamar.getContext('2d'); if (window.myChartKamar) window.myChartKamar.destroy();
        window.myChartKamar = new Chart(ctx, { type: 'bar', data: { labels: labelKamar, datasets: [{ label: 'Jumlah Penghuni', data: dataJumlah, backgroundColor: ['#008f4c','#2ecc71','#ffcc00','#f1c40f','#e67e22','#16a085'], borderRadius: 5 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } } } } });
    } catch (e) { console.error("Grafik Kamar Error:", e); }
}

/* =========================
   8. SISTEM LOGIN & AUTO LOAD
========================= */
function initApp() {
    // Update teks halo di header
    const userProfile = document.querySelector('.user-profile');
    if(userProfile && currentUser) {
        userProfile.innerText = `Halo, ${currentUser.name}`;
    }

    // Sembunyikan menu sidebar yang tidak boleh diakses
    const allowedPages = ROLES[currentUser.role].pages;
    document.querySelectorAll('.nav-menu li').forEach(li => {
        const link = li.querySelector('a');
        if (link) {
            const page = link.getAttribute('data-page');
            if (page && !allowedPages.includes(page)) {
                li.style.display = 'none'; // Sembunyikan
            } else if (page) {
                li.style.display = ''; // Tampilkan
            }
        }
    });

    // Arahkan ke halaman default (Dashboard utama)
    let defaultLink = document.querySelector(`.nav-menu a[data-page="ringkasan"]`);
    showPage('ringkasan', defaultLink);

    // Load data awal
    loadDataMurid();
    refreshDropdownKelas();
    refreshDropdownKamar();
    setTimeout(() => { loadDashboardCharts(); }, 300);
}

document.addEventListener('DOMContentLoaded', () => {
    const savedUser = sessionStorage.getItem('alAnwarUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        initApp();
    } else {
        // Kalau belum login, lempar ke halaman login
        window.location.href = "index.html"; // Sesuaikan nama file login Anda
    }
});