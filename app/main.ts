import { app, BrowserWindow, screen, Menu } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';

// Initialize remote module
require('@electron/remote/main').initialize();

let win: BrowserWindow = null;
const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

export function createWindow(): BrowserWindow {

  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    fullscreen: true,
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (serve) ? true : false,
      contextIsolation: false,  // false if you want to run e2e test with Spectron
      enableRemoteModule : true // true if you want to run e2e test with Spectron or use remote module in renderer context (ie. Angular)
    },
  });


  if (serve) {
    win.webContents.openDevTools();
    require('electron-reload')(__dirname, {
      electron: require(path.join(__dirname, '/../node_modules/electron')),
      
    });
    win.loadURL('http://localhost:4200');
  } else {
    // Path when running electron executable
    let pathIndex = './index.html';

    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
       // Path when running electron in local folder
      pathIndex = '../dist/index.html';
    }

    win.loadURL(url.format({
      pathname: path.join(__dirname, pathIndex),
      protocol: 'file:',
      slashes: true
    }));
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => {
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        {role: 'appMenu', submenu: [
  
          {label: 'Reiniciar', click() {
            app.relaunch();
            app.exit();
          }},
          {label: 'Open Dev Tools', click() {
            win.webContents.openDevTools()
          }},
          {label: 'Close Dev Tools', click() {
            win.webContents.closeDevTools()
          }},
          {label: 'Salir', click() {
            app.quit();
          }}
        ]}
      ])
    );
    setTimeout(createWindow, 400)

    win.loadURL(`/Users/gabfranck/workspace/franco-systems/frontend-angular/franco-dev-system-electron/src/prueba.txt`);
    win.webContents.on('did-finish-load', () => {
      const options = { silent: true, margins: { marginType: 'none' }, deviceName: 'TICKET58', pageSize: { height: 50000, width: 96000 } };
      win.webContents.print({silent: true, margins: {marginType: 'none'}, deviceName: 'TICKET58', pageSize: { height: 100, width: 100 }});
      // close window after print order.
      win = null;
    });
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

  win.webContents.on('did-fail-load', () => {
    console.log('did-fail-load');
    win.loadURL(url.format({
       pathname: path.join(__dirname, 'dist/index.html'),
       protocol: 'file:',
       slashes: true
    }));
    // REDIRECT TO FIRST WEBPAGE AGAIN
  });

  win.webContents.print({silent: true});


} catch (e) {
  // Catch Error
  // throw e;
}

export function relaunchElectron() {
    this.app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) })
    this.app.exit(0)
}
