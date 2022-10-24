const {app, BrowserWindow, ipcMain, Menu} = require('electron');
const path = require('path');
const fs = require('fs'); // NodeJs nin fs modülünü tanıttım


// Ana menünün şablonu
const menuSablonu = [
  {
    label: ' Belge ',
    submenu: [
      { 
        label: 'Yeni', 
        accelerator: 'CmdOrCtrl+N', 
        click: function() {
          anaPencere.webContents.send('action', 'new') 
        } 
      },
      { 
        label: 'Aç', 
        accelerator: 'CmdOrCtrl+O', 
        click: function() {
          anaPencere.webContents.send('action', 'open') 
        } 
      },
      { 
        label: 'Kaydet', 
        accelerator: 'CmdOrCtrl+S', 
        click: function() {
          anaPencere.webContents.send('action', 'save') 
        } 
      },
      { 
        label: 'Farklı Kaydet', 
        accelerator: 'CmdOrCtrl+Shift+S', 
        click: function() {
          anaPencere.webContents.send('action', 'save-as') 
        } 
      },
      { 
        type: 'separator' 
      },
      {
        label: 'Kapat',
        accelerator: 'CmdOrCtrl+E',
        click: function() {
          anaPencere.webContents.send('action', 'cikis') 
        }
      }
    ]
  },
  {
    label: ' Düzenle ',
    submenu: [
      { label: 'Geri', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
      { label: 'İleri', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
      { type: 'separator' },  //Bölmek için
      { label: 'Kes', accelerator: 'CmdOrCtrl+X', role: 'cut' },
      { label: 'Kopyala', accelerator: 'CmdOrCtrl+C', role: 'copy' },
      { label: 'Yapıştır', accelerator: 'CmdOrCtrl+V', role: 'paste' },
      { label: 'Sil', accelerator: 'CmdOrCtrl+D', role: 'delete' },
      { type: 'separator' },  
      { label: 'Hepsini Seç', accelerator: 'CmdOrCtrl+A', role: 'selectall' },
      { label: 'DevTools', accelerator: 'CmdOrCtrl+I', 
          click: function() {
            anaPencere.webContents.openDevTools();
        }
      },
      { accelerator: 'CmdOrCtrl+R', role: 'reload' }
    ]
  }
];

// Ana formun tanımı
let anaPencere;
// Güvenli çıkışı tanımı
let guvCikis = false;

// Ana menüyü oluşturdum
let menu = Menu.buildFromTemplate (menuSablonu);
Menu.setApplicationMenu (menu);

// Formu okuyup verileri kaydedicek
var data = fs.readFileSync('./data.json');
var veri = JSON.parse(data);

// Ana formu oluşturuyor
function pencereOlustur() {
  anaPencere = new BrowserWindow({
    x: veri.positionX,
    y: veri.positionY,
    width: veri.width,
    height: veri.height,
    minWidth: 400,
    minHeight: 300,
    frame: false,
    backgroundColor: '#000000',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'onyukleme.js'),
      nodeIntegration: true
    }
  });

  anaPencere.once('ready-to-show', () => {
    anaPencere.show();
  });

  // index.html i yüklüyor
  anaPencere.loadFile('index.html');

  // Geliştirici araçlarını açmak içindi
  //anaPencere.webContents.openDevTools();

  // Form yaşam döngüsünü kapatmak için
  anaPencere.on('close', (e) => {
    if(!guvCikis) {
      e.preventDefault();
    }
    anaPencere.webContents.send('action', 'cikis');
  });
  // Form kapalı olduğundaki eylem
  anaPencere.on('closed', function() {
    anaPencere = null;
  });
}

// program hazır ise
app.on('ready', pencereOlustur);
// program kapandığında
app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') app.quit();
});
// program aktif olduğunda
app.on('activate', function() {
  if (anaPencere === null) pencereOlustur();
});



// Form işlemleri (kapama, büyütme, küçültme vs.)
ipcMain.on('reqaction', (event, arg) => {
  switch(arg) {
    case 'cikis': // Çıkış komutunu alırsa
    guvCikis = true;
      app.quit();
      break;
    case 'pen-kucuk': // Küçültme komutunu alırsa
      anaPencere.minimize();
      break;
    case 'pen-buyuk': // Büyültme komutunu alırsa
      if(anaPencere.isMaximized()) {
        anaPencere.restore();  
      } else {
        anaPencere.maximize();
      }
      break;
  }
});