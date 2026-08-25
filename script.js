/* =====================================================
   KONFIGURASI API
===================================================== */

const API_URL =
    "https://script.google.com/macros/s/AKfycbzpcFTFb1fnikg4O-9RydyMxcj7G5DUZr_V6HcVNuSvzCubvp7Uuxu_PW72jF7UVDk4cQ/exec";


/* =====================================================
   DATA GLOBAL
===================================================== */

let masterBarang = [];

let stockData = [];

let transactionData = [];


/* =====================================================
   SAAT WEBSITE DIBUKA
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupNavigation();

        setupForms();

        setupSearch();

        loadAllData();

    }
);


/* =====================================================
   NAVIGATION
===================================================== */

function setupNavigation() {

    const buttons =
        document.querySelectorAll(
            ".nav-button"
        );


    buttons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const page =
                        button.dataset.page;


                    buttons.forEach(
                        function (btn) {

                            btn.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    showPage(page);

                }
            );

        }
    );

}


function showPage(page) {

    const pages =
        document.querySelectorAll(
            ".page"
        );


    pages.forEach(
        function (item) {

            item.classList.remove(
                "active"
            );

        }
    );


    const target =
        document.getElementById(
            "page-" + page
        );


    if (target) {

        target.classList.add(
            "active"
        );

    }


    if (page === "stok") {

        loadStock();

    }


    if (page === "transaksi") {

        loadTransactions();

    }

}


/* =====================================================
   LOAD SEMUA DATA
===================================================== */

async function loadAllData() {

    setConnectionStatus(
        "checking",
        "Menghubungkan..."
    );


    try {

        await loadMasterBarang();

        await loadStock();

        await loadDashboard();

        await loadTransactions();


        setConnectionStatus(
            "connected",
            "Terhubung"
        );

    }

    catch (error) {

        console.error(error);


        setConnectionStatus(
            "error",
            "Koneksi gagal"
        );


        showNotification(
            "Gagal terhubung ke server: " +
            error.message,
            "error"
        );

    }

}


/* =====================================================
   API GET
===================================================== */

async function apiGet(action) {

    const url =
        API_URL +
        "?action=" +
        encodeURIComponent(
            action
        );


    const response =
        await fetch(url, {
            method: "GET"
        });


    if (!response.ok) {

        throw new Error(
            "HTTP Error " +
            response.status
        );

    }


    const result =
        await response.json();


    if (!result.success) {

        throw new Error(
            result.message ||
            "API mengembalikan error."
        );

    }


    return result.data;

}


/* =====================================================
   API POST
===================================================== */

async function apiPost(data) {

    /*
     * Menggunakan text/plain agar request
     * tetap menjadi simple request dan tidak
     * memicu preflight OPTIONS.
     */

    const response =
        await fetch(
            API_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },

                body:
                    JSON.stringify(data)
            }
        );


    if (!response.ok) {

        throw new Error(
            "HTTP Error " +
            response.status
        );

    }


    const result =
        await response.json();


    if (!result.success) {

        throw new Error(
            result.message ||
            "Transaksi gagal."
        );

    }


    return result.data;

}


/* =====================================================
   MASTER BARANG
===================================================== */

async function loadMasterBarang() {

    const data =
        await apiGet(
            "getMasterBarang"
        );


    masterBarang =
        normalizeMasterBarang(
            data
        );


    populateBarangDropdowns();

}


/* =====================================================
   NORMALISASI MASTER BARANG
===================================================== */

function normalizeMasterBarang(data) {

    if (!Array.isArray(data)) {

        return [];

    }


    return data.map(
        function (item) {

            /*
             * Mendukung dua kemungkinan:
             *
             * 1. Apps Script mengembalikan object
             * 2. Apps Script mengembalikan array
             */

            if (
                item &&
                !Array.isArray(item) &&
                typeof item === "object"
            ) {

                return {

                    id:
                        item.id ||
                        item.ID_BARANG ||
                        item.idBarang ||
                        "",

                    kategori:
                        item.kategori ||
                        item.KATEGORI ||
                        "",

                    nama:
                        item.nama ||
                        item.NAMA_BARANG ||
                        item.namaBarang ||
                        "",

                    satuan:
                        item.satuan ||
                        item.SATUAN ||
                        "",

                    aktif:
                        item.aktif ||
                        item.AKTIF ||
                        "YA"

                };

            }


            if (Array.isArray(item)) {

                return {

                    id:
                        item[0] || "",

                    kategori:
                        item[1] || "",

                    nama:
                        item[2] || "",

                    satuan:
                        item[3] || "",

                    aktif:
                        item[6] ||
                        item[5] ||
                        "YA"

                };

            }


            return null;

        }
    ).filter(
        function (item) {

            return (
                item &&
                item.id
            );

        }
    );

}


/* =====================================================
   DROPDOWN BARANG
===================================================== */

function populateBarangDropdowns() {

    const masuk =
        document.getElementById(
            "barangMasuk"
        );

    const keluar =
        document.getElementById(
            "barangKeluar"
        );


    masuk.innerHTML =
        '<option value="">Pilih barang</option>';

    keluar.innerHTML =
        '<option value="">Pilih barang</option>';


    masterBarang
        .filter(
            function (barang) {

                return (
                    String(
                        barang.aktif
                    ).toUpperCase() !==
                    "TIDAK"
                );

            }
        )
        .forEach(
            function (barang) {

                const text =
                    barang.id +
                    " - " +
                    barang.nama;


                const optionMasuk =
                    document.createElement(
                        "option"
                    );

                optionMasuk.value =
                    barang.id;

                optionMasuk.textContent =
                    text;


                masuk.appendChild(
                    optionMasuk
                );


                const optionKeluar =
                    document.createElement(
                        "option"
                    );

                optionKeluar.value =
                    barang.id;

                optionKeluar.textContent =
                    text;


                keluar.appendChild(
                    optionKeluar
                );

            }
        );

}


/* =====================================================
   STOK
===================================================== */

async function loadStock() {

    const tbody =
        document.getElementById(
            "stockTableBody"
        );


    tbody.innerHTML =
        '<tr>' +
        '<td colspan="10" class="loading">' +
        'Memuat data...' +
        '</td>' +
        '</tr>';


    try {

        const data =
            await apiGet(
                "getStok"
            );


        stockData =
            Array.isArray(data)
                ? data
                : [];


        renderStockTable();

        renderWarnings();

    }

    catch (error) {

        tbody.innerHTML =
            '<tr>' +
            '<td colspan="10" class="empty">' +
            'Gagal memuat data stok.' +
            '</td>' +
            '</tr>';


        throw error;

    }

}


/* =====================================================
   RENDER TABEL STOK
===================================================== */

function renderStockTable(
    filteredData = null
) {

    const tbody =
        document.getElementById(
            "stockTableBody"
        );


    const data =
        filteredData || stockData;


    tbody.innerHTML = "";


    if (
        !data ||
        data.length === 0
    ) {

        tbody.innerHTML =
            '<tr>' +
            '<td colspan="10" class="empty">' +
            'Tidak ada data stok.' +
            '</td>' +
            '</tr>';

        return;

    }


    data.forEach(
        function (row) {

            const tr =
                document.createElement(
                    "tr"
                );


            /*
             * Struktur STOK:
             *
             * 0 ID_BARANG
             * 1 KATEGORI
             * 2 NAMA_BARANG
             * 3 SATUAN
             * 4 STOK_AWAL
             * 5 STOK_MASUK
             * 6 STOK_KELUAR
             * 7 STOK_AKHIR
             * 8 STOK_MINIMUM
             * 9 STATUS
             */


            tr.innerHTML = `

                <td>${safe(row[0])}</td>

                <td>${safe(row[1])}</td>

                <td>
                    <strong>
                        ${safe(row[2])}
                    </strong>
                </td>

                <td>${safe(row[3])}</td>

                <td>${formatNumber(row[4])}</td>

                <td>${formatNumber(row[5])}</td>

                <td>${formatNumber(row[6])}</td>

                <td>
                    <strong>
                        ${formatNumber(row[7])}
                    </strong>
                </td>

                <td>${formatNumber(row[8])}</td>

                <td>
                    ${statusBadge(row[9])}
                </td>

            `;


            tbody.appendChild(
                tr
            );

        }
    );

}


/* =====================================================
   WARNING STOK
===================================================== */

function renderWarnings() {

    const container =
        document.getElementById(
            "stockWarning"
        );


    const warningData =
        stockData.filter(
            function (row) {

                const status =
                    String(
                        row[9] || ""
                    ).toUpperCase();


                return (
                    status === "MENIPIS" ||
                    status === "KRITIS" ||
                    status === "HABIS"
                );

            }
        );


    container.innerHTML = "";


    if (
        warningData.length === 0
    ) {

        container.innerHTML =
            '<div class="empty">' +
            'Semua stok dalam kondisi aman.' +
            '</div>';

        return;

    }


    warningData.forEach(
        function (row) {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "warning-item";


            div.innerHTML = `

                <div>

                    <div class="warning-name">
                        ${safe(row[2])}
                    </div>

                    <div class="warning-stock">
                        ${safe(row[0])}
                        · Stok:
                        ${formatNumber(row[7])}
                        ${safe(row[3])}
                    </div>

                </div>

                ${statusBadge(row[9])}

            `;


            container.appendChild(
                div
            );

        }
    );

}


/* =====================================================
   DASHBOARD
===================================================== */

async function loadDashboard() {

    const data =
        await apiGet(
            "getDashboard"
        );


    /*
     * Dashboard biasanya berupa object.
     */

    if (
        !data ||
        typeof data !== "object"
    ) {

        return;

    }


    document.getElementById(
        "totalBarang"
    ).textContent =
        formatNumber(
            data.totalBarang
        );


    document.getElementById(
        "stokAman"
    ).textContent =
        formatNumber(
            data.stokAman
        );


    document.getElementById(
        "stokMenipis"
    ).textContent =
        formatNumber(
            data.stokMenipis
        );


    document.getElementById(
        "stokKritis"
    ).textContent =
        formatNumber(
            data.stokKritis
        );


    document.getElementById(
        "stokHabis"
    ).textContent =
        formatNumber(
            data.stokHabis
        );


    document.getElementById(
        "totalStok"
    ).textContent =
        formatNumber(
            data.totalStok
        );

}


/* =====================================================
   TRANSAKSI
===================================================== */

async function loadTransactions() {

    const tbody =
        document.getElementById(
            "transactionTableBody"
        );


    tbody.innerHTML =
        '<tr>' +
        '<td colspan="9" class="loading">' +
        'Memuat data...' +
        '</td>' +
        '</tr>';


    try {

        const data =
            await apiGet(
                "getTransaksi"
            );


        transactionData =
            Array.isArray(data)
                ? data
                : [];


        renderTransactions();

    }

    catch (error) {

        tbody.innerHTML =
            '<tr>' +
            '<td colspan="9" class="empty">' +
            'Gagal memuat transaksi.' +
            '</td>' +
            '</tr>';


        throw error;

    }

}


/* =====================================================
   RENDER TRANSAKSI
===================================================== */

function renderTransactions() {

    const tbody =
        document.getElementById(
            "transactionTableBody"
        );


    tbody.innerHTML = "";


    if (
        transactionData.length === 0
    ) {

        tbody.innerHTML =
            '<tr>' +
            '<td colspan="9" class="empty">' +
            'Belum ada transaksi.' +
            '</td>' +
            '</tr>';

        return;

    }


    transactionData.forEach(
        function (row) {

            const tr =
                document.createElement(
                    "tr"
                );


            const jenis =
                String(
                    row[5] || ""
                ).toUpperCase();


            const jenisClass =
                jenis === "MASUK"
                    ? "status-aman"
                    : "status-kritis";


            tr.innerHTML = `

                <td>${safe(row[0])}</td>

                <td>
                    ${formatDate(row[1])}
                </td>

                <td>${safe(row[2])}</td>

                <td>${safe(row[3])}</td>

                <td>
                    <strong>
                        ${safe(row[4])}
                    </strong>
                </td>

                <td>
                    <span class="status ${jenisClass}">
                        ${safe(row[5])}
                    </span>
                </td>

                <td>
                    ${formatNumber(row[6])}
                </td>

                <td>${safe(row[7])}</td>

                <td>${safe(row[8])}</td>

            `;


            tbody.appendChild(
                tr
            );

        }
    );

}


/* =====================================================
   FORM SETUP
===================================================== */

function setupForms() {

    const formMasuk =
        document.getElementById(
            "formMasuk"
        );


    const formKeluar =
        document.getElementById(
            "formKeluar"
        );


    formMasuk.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            submitTransaction(
                "MASUK"
            );

        }
    );


    formKeluar.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            submitTransaction(
                "KELUAR"
            );

        }
    );

}


/* =====================================================
   SUBMIT TRANSACTION
===================================================== */

async function submitTransaction(
    jenis
) {

    const isMasuk =
        jenis === "MASUK";


    const barangElement =
        document.getElementById(
            isMasuk
                ? "barangMasuk"
                : "barangKeluar"
        );


    const jumlahElement =
        document.getElementById(
            isMasuk
                ? "jumlahMasuk"
                : "jumlahKeluar"
        );


    const keteranganElement =
        document.getElementById(
            isMasuk
                ? "keteranganMasuk"
                : "keteranganKeluar"
        );


    const submitButton =
        document.querySelector(
            isMasuk
                ? "#formMasuk .submit-button"
                : "#formKeluar .submit-button"
        );


    const idBarang =
        barangElement.value;


    const jumlah =
        Number(
            jumlahElement.value
        );


    const keterangan =
        keteranganElement.value.trim();


    if (!idBarang) {

        showNotification(
            "Silakan pilih barang.",
            "error"
        );

        return;

    }


    if (
        !jumlah ||
        jumlah <= 0
    ) {

        showNotification(
            "Jumlah harus lebih dari 0.",
            "error"
        );

        return;

    }


    submitButton.disabled =
        true;


    submitButton.textContent =
        "Menyimpan...";


    try {

        const result =
            await apiPost({

                action:
                    "simpanTransaksi",

                idBarang:
                    idBarang,

                jenisTransaksi:
                    jenis,

                jumlah:
                    jumlah,

                keterangan:
                    keterangan

            });


        showNotification(
            result &&
            result.message
                ? result.message
                : "Transaksi berhasil disimpan.",
            "success"
        );


        barangElement.value =
            "";

        jumlahElement.value =
            "";

        keteranganElement.value =
            "";


        /*
         * Setelah transaksi berhasil,
         * ambil ulang semua data.
         */

        await loadAllData();


        /*
         * Tetap berada di halaman transaksi
         * yang sedang digunakan.
         */

    }

    catch (error) {

        console.error(error);


        showNotification(
            error.message ||
            "Transaksi gagal disimpan.",
            "error"
        );

    }

    finally {

        submitButton.disabled =
            false;


        submitButton.textContent =
            isMasuk
                ? "Simpan Barang Masuk"
                : "Simpan Barang Keluar";

    }

}


/* =====================================================
   SEARCH STOK
===================================================== */

function setupSearch() {

    const search =
        document.getElementById(
            "stockSearch"
        );


    search.addEventListener(
        "input",
        function () {

            const keyword =
                search.value
                    .toLowerCase()
                    .trim();


            if (!keyword) {

                renderStockTable();

                return;

            }


            const filtered =
                stockData.filter(
                    function (row) {

                        return (

                            String(
                                row[0] || ""
                            )
                            .toLowerCase()
                            .includes(
                                keyword
                            )

                            ||

                            String(
                                row[1] || ""
                            )
                            .toLowerCase()
                            .includes(
                                keyword
                            )

                            ||

                            String(
                                row[2] || ""
                            )
                            .toLowerCase()
                            .includes(
                                keyword
                            )

                        );

                    }
                );


            renderStockTable(
                filtered
            );

        }
    );

}


/* =====================================================
   STATUS BADGE
===================================================== */

function statusBadge(status) {

    const value =
        String(
            status || "-"
        ).toUpperCase();


    let className =
        "";


    if (
        value === "AMAN"
    ) {

        className =
            "status-aman";

    }

    else if (
        value === "MENIPIS"
    ) {

        className =
            "status-menipis";

    }

    else if (
        value === "KRITIS"
    ) {

        className =
            "status-kritis";

    }

    else if (
        value === "HABIS"
    ) {

        className =
            "status-habis";

    }


    return `
        <span class="status ${className}">
            ${safe(value)}
        </span>
    `;

}


/* =====================================================
   CONNECTION STATUS
===================================================== */

function setConnectionStatus(
    type,
    text
) {

    const element =
        document.getElementById(
            "connectionStatus"
        );


    element.className =
        "connection-status " +
        type;


    element.textContent =
        text;

}


/* =====================================================
   NOTIFICATION
===================================================== */

let notificationTimer;


function showNotification(
    message,
    type = "success"
) {

    const element =
        document.getElementById(
            "notification"
        );


    element.textContent =
        message;


    element.className =
        "notification show " +
        type;


    clearTimeout(
        notificationTimer
    );


    notificationTimer =
        setTimeout(
            function () {

                element.classList.remove(
                    "show"
                );

            },
            3500
        );

}


/* =====================================================
   FORMAT NUMBER
===================================================== */

function formatNumber(
    value
) {

    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return "0";

    }


    return number.toLocaleString(
        "id-ID"
    );

}


/* =====================================================
   FORMAT DATE
===================================================== */

function formatDate(
    value
) {

    if (!value) {

        return "-";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return safe(value);

    }


    return date.toLocaleString(
        "id-ID",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );

}


/* =====================================================
   SAFE HTML
===================================================== */

function safe(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}
