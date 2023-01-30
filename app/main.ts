import { app, BrowserWindow, dialog, Menu, MessageBoxReturnValue, OpenDialogOptions, OpenDialogReturnValue, screen } from "electron";
import { autoUpdater } from "electron-updater";
import * as fs from "fs";
import * as path from "path";
import * as url from "url";

const log = require('electron-log');
const { readFileSync } = require('fs');
const isDev = require('electron-is-dev');
var home = app.getPath('home')

autoUpdater.logger = log
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'GabFrank',
  repo: 'franco-system-frontend-general',
  private: false
});




const { ipcMain } = require('electron');


// Initialize remote module
require("@electron/remote/main").initialize();

let win: BrowserWindow = null;
const args = process.argv.slice(1),
  serve = args.some((val) => val === "--serve");

export async function createWindow(): Promise<BrowserWindow> {


  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;
  let factor = screen.getPrimaryDisplay().scaleFactor;


  // Create the browser window.
  win = new BrowserWindow({
    icon: `file://${__dirname}/dist/assets/logo.ico`,
    resizable: false,
    webPreferences: {
      webSecurity: false,
      zoomFactor: 1.0 / factor,
      nodeIntegration: true,
      allowRunningInsecureContent: serve ? true : false,
      contextIsolation: false, // false if you want to run e2e test with Spectron
      // enableRemoteModule: true, // true if you want to run e2e test with Spectron or use remote module in renderer context (ie. Angular)
    },
  });

  win.maximize();
  win.show();

  const gotTheLock = app.requestSingleInstanceLock();

  // if (!gotTheLock) {
  //   app.quit(); 
  // } else {
  //   app.on("second-instance", (event, commandLine, workingDirectory) => {
  //     // Someone tried to run a second instance, we should focus our window.
  //     if (win) {
  //       if (win.isMinimized()) win.restore();
  //       win.focus();
  //     }
  //   });

  //   // Create myWindow, load the rest of the app, etc...
  //   app.on("ready", () => { });
  // }



  if (serve) {
    win.webContents.openDevTools();
    require("electron-reload")(__dirname, {
      electron: require(path.join(__dirname, "/../node_modules/electron")),
    });
    win.loadURL("http://localhost:4200");
  } else {
    // Path when running electron executable
    let pathIndex = "./index.html";

    if (fs.existsSync(path.join(__dirname, "../dist/index.html"))) {
      // Path when running electron in local folder
      pathIndex = "../dist/index.html";
    }

    win.loadURL(
      url.format({
        pathname: path.join(__dirname, pathIndex),
        protocol: "file:",
        slashes: true,
      })
    );
  }

  // Emitted when the window is closed.
  win.on("closed", () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

ipcMain.on('get-config-file', (event, arg) => {
  console.log(arg)
})

ipcMain.on('reiniciar', (event: any, arg: any) => {
  relaunchElectron()
}

);

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on("ready", async () => {

    if (!fs.existsSync(`${process.cwd()}/configuracion-local.json`)) {
      const options = {
        type: "info",
        title: "Configuration Input",
        message: "Please enter the configuration settings",
        buttons: ["OK", "Cancel"],
        defaultId: 0,
        cancelId: 1,
        checkboxLabel: "Es servidor?",
        checkboxChecked: false,
        ipDefault: {
          label: "Ip local:",
          value: "localhost",
        },
        puertoDefault: {
          label: "Puerto local:",
          value: "8082",
        },
        idSucursal: {
          label: "Id de la sucursal:",
          value: "",
        },
        centralIp: {
          label: "Ip del servidor:",
          value: "150.136.137.98",
        },
        centralPort: {
          label: "Puerto del servidor:",
          value: "8081",
        },
        ticket: {
          label: "Impresora para ticket:",
          value: "ticket",
        },
        pdvId: {
          label: "Id del punto de venta:",
          value: "null",
        },
      };

      const result = dialog.showMessageBoxSync(options);

      if (result === 0) {
        const isServidor = options.checkboxChecked;
        const config = {
          ipDefault: isServidor ? options.centralIp : options.defaultId,
          puertoDefault: isServidor ? options.centralPort : options.puertoDefault,
          centralIp: options.centralIp,
          centralPort: options.centralPort,
          ipCentralDefault: options.centralIp,
          puertoCentralDefault: options.centralPort,
          printers: {
            ticket: options.ticket,
            factura: "factura",
          },
          local: "Caja 1",
          precios: "EXPO",
          modo: "NOT",
        };
        const configJson = JSON.stringify(config, null, 2);
        fs.writeFileSync(`${__dirname}/configuracion-local.json`, configJson);
        let config2;
        if (isServidor) {
          config2 = [
            {
              id: 0,
              nombre: "Servidor",
              ip: options.centralIp,
              port: options.centralPort,
            },
            {
              id: options.idSucursal,
              nombre: "Local",
              ip: options.ipDefault,
              port: options.puertoDefault,
            },
          ];
        } else {
          config2 = [
            {
              id: 0,
              nombre: "Servidor",
              ip: options.centralIp,
              port: options.centralPort,
            },
          ];
        }
        const configJson2 = JSON.stringify(config2, null, 2);
        fs.writeFileSync(`${__dirname}/configuracion.json`, configJson2);
      } else {
        app.quit();
      }
    }
    // Create the browser window and start the Angular app


    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();
      setInterval(() => {
        log.info('Buscando actualizacion');
        autoUpdater.checkForUpdatesAndNotify();
      }, 100000)
    }

    autoUpdater.on('update-available', () => {
      log.info('Actualizacion disponible, descargando...');
    })

    autoUpdater.on('update-not-available', () => {
      log.info('No existen actualizaciones disponibles...');
    })

    autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
      const dialogOpts = {
        type: 'info',
        buttons: ['Reiniciar'],
        title: 'Actualización disponible',
        message: process.platform === 'win32' ? releaseNotes : releaseName,
        detail: 'Una actualización fue encontrada y descargada. Reinicie el programa para instalarla.'
      }

      dialog.showMessageBox(dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) autoUpdater.quitAndInstall()
      })
    })

    autoUpdater.on('error', message => {
      console.error('There was a problem updating the application')
      console.error(message)
    })

    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        {
          role: "appMenu",
          label: "Aplicacion",
          submenu: [
            {
              label: "Reiniciar",
              click() {
                relaunchElectron()
              }
            },
            {
              label: "Open Dev Tools",
              click() {
                win.webContents.openDevTools();
              },
            },
            {
              label: "Close Dev Tools",
              click() {
                win.webContents.closeDevTools();
              },
            },
            {
              label: "Minimizar",
              click() {
                win.minimize();
              },
            },
            {
              label: "Zoom in",
              click() {
                win.webContents.setZoomLevel(win.webContents.zoomLevel + 1)
              },
            },
            {
              label: "Zoom out",
              click() {
                win.webContents.setZoomLevel(win.webContents.zoomLevel - 1)
              },
            },
            {
              label: "Salir",
              click() {
                app.quit();
              },
            },
          ],
        },
        {
          role: 'editMenu',
          label: "Editar",
          submenu: [
            {
              label: 'Cortar',
              accelerator: 'CmdOrCtrl+X',
              role: 'cut',
            },
            {
              label: 'Copiar',
              accelerator: 'CmdOrCtrl+C',
              role: 'copy',
            },
            {
              label: 'Pegar',
              accelerator: 'CmdOrCtrl+V',
              role: 'paste',
            },
            {
              label: 'Deshacer',
              accelerator: 'CmdOrCtrl+Z',
              role: 'undo',
            },
            {
              label: 'Rehacer',
              accelerator: 'Shift+CmdOrCtrl+Z',
              role: 'redo',
            },
            {
              label: 'Seleccionar Todo',
              accelerator: 'CmdOrCtrl+A',
              role: 'selectAll',
            },
          ],
        },
        {
          role: 'about',
          label: "Sobre",
          submenu: [
            {
              label: app.getVersion(),
            },
          ],
        }
      ])
    );
    setTimeout(createWindow, 400);
  });

  // Quit when all windows are closed.
  app.on("window-all-closed", () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

  win.webContents.on("did-fail-load", () => {
    console.log("did-fail-load");
    relaunchElectron()
    // REDIRECT TO FIRST WEBPAGE AGAIN
  });

  win.webContents.setZoomFactor(1)
  win.webContents.setZoomLevel(0)

  win.webContents.print({ silent: true });

  win.webContents.setWindowOpenHandler(({ url }) => {
    require("electron").shell.openExternal(url);
    return { action: "deny" };
  });
} catch (e) {
  // Catch Error
  // throw e;
}

export function relaunchElectron() {
  if (serve) {
    win.webContents.openDevTools();
    require("electron-reload")(__dirname, {
      electron: require(path.join(__dirname, "/../node_modules/electron")),
    });
    win.loadURL("http://localhost:4200");
  } else {
    // Path when running electron executable
    let pathIndex = "./index.html";

    if (fs.existsSync(path.join(__dirname, "../dist/index.html"))) {
      // Path when running electron in local folder
      pathIndex = "../dist/index.html";
    }

    win.loadURL(
      url.format({
        pathname: path.join(__dirname, pathIndex),
        protocol: "file:",
        slashes: true,
      })
    );
  }
}
