const ipcRenderer = require('electron').ipcRenderer; 
const remote = require('electron').remote; 
const Menu = remote.Menu; 
const dialog = remote.dialog; 
const fs = require('fs'); 
const shell = require('electron').shell;


// Verileri kaydedip okuyor
var data = fs.readFileSync('./data.json');
var veri = JSON.parse(data);
var themes = veri.theme;
if(themes == 'koyu') {
    document.getElementById('tema_css').href = './koyuTema.css';
} else {
    document.getElementById('tema_css').href = './Tema.css';
}
if(veri.isFull) {
    ipcRenderer.send('reqaction', 'pen_buyuk');
}


// Temel parametreleri başlattım
let kaydetme = true;
let metinKutusu = document.getElementById('metinKutusu'); // metin kutusu nesnesini alıyor
let mevcutDosya = null;
let cikma = true;


// Sağ tıklanınca açılan menü şablonu
const sagTikMenu = [
    { label: 'Geri', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
    { label: 'İleri', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
    { type: 'separator' },  //Ayırmak için
    { label: 'Kes', accelerator: 'CmdOrCtrl+X', role: 'cut' },
    { label: 'Kopyala', accelerator: 'CmdOrCtrl+C', role: 'copy' },
    { label: 'Yapıştır', accelerator: 'CmdOrCtrl+V', role: 'paste' },
    { label: 'Sil', accelerator: 'CmdOrCtrl+D', role: 'delete' },
    { type: 'separator' }, 
    { label: 'Hepsini Seç', accelerator: 'CmdOrCtrl+A', role: 'selectall' },
    { type: 'separator' },
    { label: 'Geliştirici', accelerator: 'CmdOrCtrl+I', 
        click: function() {
            remote.getCurrentWindow().openDevTools();
      }
    },
    { label: 'Geri Yükle', accelerator: 'CmdOrCtrl+R', role: 'reload' }
];
// Sağ tıklama menüsünü oluşturuyor
const sagTik = Menu.buildFromTemplate(sagTikMenu);
metinKutusu.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    sagTik.popup(remote.getCurrentWindow());
});


// Formun sağ üstteki eylemleri için
function penCtrlTus(id) {
    switch(id) {
        case 'pen_kucuk': // Küçültmeyi yapıyor
            ipcRenderer.send('reqaction', 'pen-kucuk');
            break;
        case 'pen_buyuk': // Maksimum boyuta getiriyor
            ipcRenderer.send('reqaction', 'pen-buyuk');
            break;
        case 'pen_kapat': // Çıkış yapıyor
            kaydetSoru(); // Kaydettin mi diye sorması için
            veriKaydet(); // Form verilerini kaydediyor
            if(cikma) { // Normal çıkış
                ipcRenderer.sendSync('reqaction', 'cikis');
            }
            cikma = true;
            break;
    }
}
// Sağ üstteki büyültme, küçültme tuşlarına basıldığı zaman şekillerinin değişmesi için png değişikliği
window.onresize = function () {
    if(remote.getCurrentWindow().isMaximized()) {
        document.getElementById('pen_buyuk').style.background = "url(resimler/ctrl-btn.png) no-repeat 0 -60px";
    }else {
        document.getElementById('pen_buyuk').style.background = "url(resimler/ctrl-btn.png) no-repeat 0 -30px";
    }
}

// Kaydedilmesi gereken bir değişiklik olduğu zaman * çıkarması için ve kelime sayısını sayıyor
metinKutusu.oninput = (e) => {
    if (kaydetme) {
        document.title += ' *';
        document.getElementById("anaBaslik").innerHTML = document.title;
    }
    kaydetme = false;
    
}


// Menü işlemleri
ipcRenderer.on('action', (event, arg) => {
    switch(arg) {
        case 'new': 
        kaydetSoru();
            yeniBelge();
            break;
        case 'open': 
        kaydetSoru();
            dosyaAc();
            break;
        case 'save':
            dosyaKaydet();
            break;
        case 'save-as':
            mevcutDosya = null;
            dosyaKaydet();
            break;
        case 'cikis': // Kapatma durumu
        kaydetSoru(); // Kaydettin mi diye sorması için
        veriKaydet(); // Form verilerini kaydediyor
            if(cikma) { 
                ipcRenderer.sendSync('reqaction', 'cikis');
            }
            cikma = true;
            break;
    }
});


// Belgeyi başlatması için
function yeniBelge() {
    mevcutDosya = null;
    metinKutusu.value = '';
    document.title = 'Notdefteri - Isimsiz';
	document.getElementById("anaBaslik").innerHTML = document.title;
    kaydetme = true;
	document.getElementById("txtSayi").innerHTML = 0;
}


// Kaydedip kaydetmeyeceğimizi soran fonksiyon
function kaydetSoru() {

    if (kaydetme) {
        return;
    }
    // Pop-up mesajı için
    const ayarlar = {
        type: 'question',
        message: 'Bu belgeyi kaydetmek ister misiniz?',
        buttons: [ 'Yes', 'No', 'Cancel']
    }
    // Sorduğu zaman verilen yanıtın sonucunun işlenmesi
    const ayiklama = dialog.showMessageBoxSync(remote.getCurrentWindow(), ayarlar);
    // Butonlar sırayla Evet, Hayır, İptal [0, 1, 2]
    if (ayiklama == 0) {
        dosyaKaydet();
    } else if(ayiklama == 1) {
        console.log('İptal Et ve Çık');
    } else { // Pencere kapatıldığında veya iptal dendiğinde çıkış işlemini iptal ediyor
        console.log('İptal Et ve Bekle');
        cikma = false; // Çıkışı durduruyo
    }
}


// Belgeyi kaydetmek için fonksiyon, 
function dosyaKaydet() {

    if(!mevcutDosya) {
        const ayarlar = {
            title: 'Kaydet',
            filters: [
                { name: 'Metin Dosyası', extensions: ['txt', 'js', 'html', 'md'] },
                { name: 'Diğer Dosyalar', extensions: ['*'] }
            ]
        }
        const yol = dialog.showSaveDialogSync(remote.getCurrentWindow(), ayarlar);
        if(yol) {
            mevcutDosya = yol;
        }
    }
    // Eski belgeleri doğrudan kaydetmek için
    if(mevcutDosya) {
        const metinKaydet = metinKutusu.value;
        metinKayit(mevcutDosya, metinKaydet);
        kaydetme = true;
        document.title = "Notdefteri - " + mevcutDosya;
        document.getElementById("anaBaslik").innerHTML = document.title;
    }

}


// Belge yolunu seçmek için
function dosyaAc() {
    // Açılan pencerenin türü
    const ayarlar = {
        filters: [
            { name: 'Metin Dosyası', extensions: ['txt', 'js', 'html', 'md'] },
            { name: 'Diğer Dosyalar', extensions: ['*'] }
        ],
        properties: ['dosyaAc']
    }
    // Açılır pencere sonuçlarını işlemek için
    const dosya = dialog.showOpenDialogSync(remote.getCurrentWindow(), ayarlar);
    if(dosya) {
        mevcutDosya = dosya[0];
        const metinOku = metinIsle(mevcutDosya);
        metinKutusu.value = metinOku;
        document.title = 'Notdefteri - ' + mevcutDosya;
        document.getElementById("anaBaslik").innerHTML = document.title;
        kaydetme = true;
    }

}


// Kaydetmenin nasıl yapıldığı
function metinKayit( dosya, text ) {
    fs.writeFileSync( dosya, text );
}


// Belge karakter türünü okumak için
function metinIsle(dosya) {
    return fs.readFileSync(dosya, 'utf8');
}





// Belgeleri okumak için sürükleyip bırakma
const surukleme = document.querySelector('#metinKutusu');
// Electron varsayılan olayları engelliyor
surukleme.ondragenter = surukleme.ondragover = surukleme.ondragleave = function() {
    return false;
}
// Sürükle olayını yürütüyor
surukleme.ondrop = function(e) {
    e.preventDefault(); // varsayılan olayları engeller
    kaydetSoru();
    mevcutDosya = e.dataTransfer.files[0].path; // Belge yolunu almak için
    const metinOku = metinIsle(mevcutDosya);
    metinKutusu.value = metinOku;
    document.title = 'Notdefteri - ' + mevcutDosya;
	document.getElementById("anaBaslik").innerHTML = document.title;
    kaydetme = true;
}



// Ana menü olayları
function sekmeGoster(o) {
    sekmeGizle("acilirPen-icerik" + o.id);
    document.getElementById("acilirPen-" + o.id).classList.toggle("show");
    document.getElementById("a").setAttribute("onmousemove","sekmeGoster(this)");
    document.getElementById("b").setAttribute("onmousemove","sekmeGoster(this)");
    document.getElementById("c").setAttribute("onmousemove","sekmeGoster(this)");
    // Tıklanınca tema değiştirmek için
    var renkDegis;
    if(themes == 'koyu') {
        renkDegis = '#505050';
    } else {
        renkDegis = '#d5e9ff';
    }
    // Arka plan rengi tıklandığında sabitlenir
    if(o.id == 'a') {
        document.getElementById('a').style.background = renkDegis;
        document.getElementById('b').style.background = "";
        document.getElementById('c').style.background = "";
    }
    if(o.id == 'b') {
        document.getElementById('a').style.background = "";
        document.getElementById('b').style.background = clickColor;
        document.getElementById('c').style.background = "";
    }
    if(o.id == 'c') {
        document.getElementById('a').style.background = "";
        document.getElementById('b').style.background = "";
        document.getElementById('c').style.background = clickColor;
    }
}
 
// Ana menü itemlerini gizliyor
function sekmeGizle(option) {
    var sekmeler = document.getElementsByClassName("acilirPen-icerik");
    for (var i = 0; i < sekmeler.length; i++) {
        var sekmeAc = sekmeler[i];
        if (sekmeAc.id != option) {
            if (sekmeAc.classList.contains('show')) {
                sekmeAc.classList.remove('show');
            }
        }
    }
}

// Ana menü sıfırlama işlemi
window.onclick = function(e) {
    if (!e.target.matches('.acilirTus')) {
        sekmeGizle("");
        document.getElementById("a").setAttribute("onmousemove","");
        document.getElementById("b").setAttribute("onmousemove","");
        document.getElementById("c").setAttribute("onmousemove","");
        document.getElementById("a").style.background = "";
        document.getElementById("b").style.background = "";
        document.getElementById("c").style.background = "";
    }
}

// Ana menü kısayol tuş işlemleri için
function kisayolTus() {
    var tus = window.event.tusKodu;
    var tusCtrl;
    if((tus == 70)&&(event.altTus)) {
        tusCtrl = document.getElementById("a");
        sekmeGoster(tusCtrl);
    }
    if((tus == 69)&&(event.altTus)) {
        tusCtrl = document.getElementById("b");
        sekmeGoster(tusCtrl);
    }
    if((tus == 72)&&(event.altTus)) {
        tusCtrl = document.getElementById("c");
        sekmeGoster(tusCtrl);
    }
}
document.onkeydown = kisayolTus;


// Ana menü dosya işlemleri
function menuTus(arg) {
    switch(arg) {
        case 'yeni':
        kaydetSoru();
            yeniBelge();
            break;
        case 'ac':
        kaydetSoru();
        dosyaAc();
            break;
        case 'kaydet':
        dosyaKaydet();
            break;
        case 'farkliKaydet':
        mevcutDosya = null;
        dosyaKaydet();
            break;
    }
}

// Ana menü düzenleme işlemleri için(kes, kopyala vs.)
function belgeKomutu(arg) {
    switch(arg) {
        case 'geri': 
            document.execCommand('undo');
            break;
        case 'ileri':
            document.execCommand('Redo');
            break;
        case 'kes':
            document.execCommand('Cut', false, null);
            break;
        case 'kopyala': 
            document.execCommand('Copy', false, null);
            break;
        case 'yapistir': 
            document.execCommand('Paste', false, null);
            break;
        case 'sil':
            document.execCommand('Delete', false, null);
            break;
        case 'hepsiniSec':
            document.execCommand('selectAll');
            break;
    }
}

// Hakkımda URL si
function hakkinda() {
    shell.openExternal('http://www.balikesir.edu.tr/site/birim/bilgisayar-muhendisligi-bolumu-293094');
}

//Tema
function tema() {
    if(themes == 'normal') {
        document.getElementById('tema_css').href = './koyuTema.css';
        themes = 'koyu';
    } else {
        document.getElementById('tema_css').href = './Tema.css';
        themes = 'normal';
    }
}

// Form ile ilgili verileri kaydeder
function veriKaydet() {
    // Verileri alır
    var dF = remote.getCurrentWindow().isMaximized();
    var dX = dF == true ? veri.positionX : remote.getCurrentWindow().getPosition()[0];
    var dY = dF == true ? veri.positionY : remote.getCurrentWindow().getPosition()[1];
    var dWidth = dF == true ? veri.width : remote.getCurrentWindow().getSize()[0];
    var dHeight = dF == true ? veri.height : remote.getCurrentWindow().getSize()[1];
    // Veri toplama
    var obj = {
        "isFull": dF,
        "positionX": dX,
        "positionY": dY,
        "width": dWidth,
        "height": dHeight,
        "theme": themes
    }
    // json verilerini biçimlendirir
    var d = JSON.stringify(obj, null, '\t');
    
    fs.writeFileSync('./data.json', d);
}
