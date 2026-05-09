async function masuk() {

    const user_input = document.getElementById('username').value;
    const pass_input = document.getElementById('pass').value;
    const info = document.getElementById('pesan');

    // VALIDASI KOSONG
    if (!user_input || !pass_input) {

        Swal.fire({
            icon: 'warning',
            title: 'Ups!',
            text: 'Username dan Password tidak boleh kosong.',
            confirmButtonColor: '#00703c'
        });

        return;
    }

    info.innerText = "Sedang mengecek...";

    // SUPABASE
    const BASE_URL = "https://ghzrgymmsrbycmwlbbnw.supabase.co/rest/v1/users";
    const API_KEY = "sb_publishable_cP-NCH-oxYoOxnqOxonl8A_J-F2cmPY";
    const URL_LENGKAP = `${BASE_URL}?username=eq.${user_input}&password=eq.${pass_input}`;

    try {

        const response = await fetch(URL_LENGKAP, {
            method: 'GET',
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        // LOGIN BERHASIL
        if (data.length > 0) {

            info.innerText = "";

            // AMBIL DATA NAMA DAN ROLE DARI SUPABASE
            const userData = data[0]; 
            const userName = userData.name || user_input; 
            const userRole = userData.role || 'superadmin'; 

            // SIMPAN KE SESSION STORAGE
            const loginData = {
                username: user_input,
                name: userName,
                role: userRole
            };
            sessionStorage.setItem('alAnwarUser', JSON.stringify(loginData));

            Swal.fire({
                icon: 'success',
                title: 'Login Berhasil!',
                text: 'Selamat datang, ' + userName,
                showConfirmButton: false,
                timer: 1500
            });

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1600);

            return; // PENTING: Hentikan eksekusi agar tidak masuk ke kode Login Gagal

        }

        // LOGIN GAGAL
        info.innerText = "";
        Swal.fire({
            icon: 'error',
            title: 'Login Gagal',
            text: 'Username atau Password salah!',
            confirmButtonColor: '#00703c'
        });

    } catch (err) {

        info.innerText = "";
        Swal.fire({
            icon: 'error',
            title: 'Koneksi Bermasalah',
            text: 'Gagal terhubung ke database cloud.',
        });

        console.error(err);
    }
}


// TOGGLE PASSWORD
function togglePass() {

    const passInput = document.getElementById("pass");
    const eyeIcon = document.getElementById("eyeIcon");

    if (passInput.type === "password") {

        passInput.type = "text";
        eyeIcon.classList.remove("fa-eye-slash");
        eyeIcon.classList.add("fa-eye");

    } else {

        passInput.type = "password";
        eyeIcon.classList.remove("fa-eye");
        eyeIcon.classList.add("fa-eye-slash");
        
    }
}