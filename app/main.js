"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.relaunchElectron = exports.createWindow = void 0;
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
const fs = require("fs");
const path = require("path");
const url = require("url");
const log = require('electron-log');
const isDev = require('electron-is-dev');
electron_updater_1.autoUpdater.logger = log;
electron_updater_1.autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'GabFrank',
    repo: 'franco-system-frontend-general',
    private: false
});
const { ipcMain } = require('electron');
let instanceCount = 0;
// Initialize remote module
require("@electron/remote/main").initialize();
let win = null;
const args = process.argv.slice(1), serve = args.some(val => val === '--serve');
function createWindow() {
    return __awaiter(this, void 0, void 0, function* () {
        const electronScreen = electron_1.screen;
        const size = electron_1.screen.getPrimaryDisplay().workAreaSize;
        let factor = electron_1.screen.getPrimaryDisplay().scaleFactor;
        // Create the browser window.
        win = new electron_1.BrowserWindow({
            icon: `file://${__dirname}/dist/assets/logo.ico`,
            x: 0,
            y: 0,
            width: size.width,
            height: size.height,
            webPreferences: {
                nodeIntegration: true,
                allowRunningInsecureContent: (serve),
                contextIsolation: false, // false if you want to run e2e test with Spectron
            },
            fullscreen: true
        });
        win.setFullScreen(true);
        win.webContents.setZoomFactor(1);
        win.webContents
            .executeJavaScript('localStorage.getItem("zoomLevel");', true)
            .then(result => {
            if (result != null) {
                win.webContents.setZoomLevel(+result);
            }
        });
        win.maximize();
        win.show();
        electron_1.app.on("second-instance", (event, commandLine, workingDirectory) => {
            // Increment the instance count
            instanceCount++;
            // If more than 2 instances, quit the app
            if (instanceCount >= 2) {
                electron_1.app.quit();
                return;
            }
            // Someone tried to run a second instance, we should focus our window.
            if (win) {
                if (win.isMinimized())
                    win.restore();
                win.focus();
            }
        });
        if (serve) {
            win.webContents.openDevTools();
            const debug = require('electron-debug');
            debug();
            require('electron-reloader')(module);
            win.loadURL('http://localhost:4200');
        }
        else {
            // Path when running electron executable
            let pathIndex = './index.html';
            if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
                // Path when running electron in local folder
                pathIndex = '../dist/index.html';
            }
            const url = new URL(path.join('file:', __dirname, pathIndex));
            win.loadURL(url.href);
        }
        // Emitted when the window is closed.
        win.on('closed', () => {
            // Dereference the window object, usually you would store window
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            win = null;
            electron_1.app.quit();
        });
        win.webContents.on("did-fail-load", () => {
            console.log("did-fail-load");
            relaunchElectron();
            // REDIRECT TO FIRST WEBPAGE AGAIN
        });
        win.webContents.setWindowOpenHandler(({ url }) => {
            require("electron").shell.openExternal(url);
            return { action: "deny" };
        });
        win.webContents.on('did-finish-load', () => {
            win.webContents
                .executeJavaScript('localStorage.getItem("zoomLevel");', true)
                .then((zoomLevel) => {
                if (zoomLevel) {
                    win.webContents.setZoomLevel(parseFloat(zoomLevel));
                }
            });
        });
        return win;
    });
}
exports.createWindow = createWindow;
ipcMain.on('get-config-file', (event, arg) => {
    console.log(arg);
});
ipcMain.on('reiniciar', (event, arg) => {
    relaunchElectron();
});
ipcMain.on('get-app-version', (event) => {
    event.returnValue = electron_1.app.getVersion();
});
try {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
    electron_1.app.on('ready', () => {
        if (!isDev) {
            electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
            setInterval(() => {
                log.info('Buscando actualizacion');
                electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
            }, 100000);
        }
        electron_updater_1.autoUpdater.on('update-available', () => {
            log.info('Actualizacion disponible, descargando...');
        });
        electron_updater_1.autoUpdater.on('update-not-available', () => {
            log.info('No existen actualizaciones disponibles...');
        });
        electron_updater_1.autoUpdater.on('update-downloaded', (event) => {
            const dialogOpts = {
                type: 'info',
                buttons: ['Reiniciar'],
                title: 'Actualización disponible',
                message: event.releaseName + ' - ' + event.version,
                detail: 'Una actualización fue encontrada y descargada. Reinicie el programa para instalarla.'
            };
            electron_1.dialog.showMessageBox(dialogOpts).then((returnValue) => {
                if (returnValue.response === 0)
                    electron_updater_1.autoUpdater.quitAndInstall();
            });
        });
        electron_updater_1.autoUpdater.on('error', message => {
            console.error('There was a problem updating the application');
            console.error(message);
        });
        electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate([
            {
                role: "appMenu",
                label: "Aplicacion",
                submenu: [
                    {
                        label: "Reiniciar",
                        click() {
                            relaunchElectron();
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
                            win.webContents.setZoomLevel(win.webContents.zoomLevel + 1);
                            win.webContents
                                .executeJavaScript(`localStorage.setItem("zoomLevel", ${win.webContents.getZoomLevel()});`, true)
                                .then(result => {
                                console.log(result);
                            });
                        },
                    },
                    {
                        label: "Zoom out",
                        click() {
                            win.webContents.setZoomLevel(win.webContents.zoomLevel - 1);
                            win.webContents
                                .executeJavaScript(`localStorage.setItem("zoomLevel", ${win.webContents.getZoomLevel()});`, true)
                                .then(result => {
                                console.log(result);
                            });
                        },
                    },
                    {
                        label: "Salir",
                        click() {
                            electron_1.app.quit();
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
                        label: electron_1.app.getVersion(),
                    },
                ],
            }
        ]));
        setTimeout(createWindow, 400);
    });
    // Quit when all windows are closed.
    electron_1.app.on('window-all-closed', () => {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        instanceCount--;
        if (process.platform !== "darwin") {
            electron_1.app.quit();
        }
    });
    electron_1.app.on('activate', () => {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (instanceCount >= 2) {
            return;
        }
        instanceCount++;
        if (win === null) {
            createWindow();
        }
    });
}
catch (e) {
    // Catch Error
    // throw e;
}
function relaunchElectron() {
    if (serve) {
        win.webContents.openDevTools();
        require("electron-reload")(__dirname, {
            electron: require(path.join(__dirname, "/../node_modules/electron")),
        });
        win.loadURL("http://localhost:4200");
    }
    else {
        // Path when running electron executable
        let pathIndex = "./index.html";
        if (fs.existsSync(path.join(__dirname, "../dist/index.html"))) {
            // Path when running electron in local folder
            pathIndex = "../dist/index.html";
        }
        win.loadURL(url.format({
            pathname: path.join(__dirname, pathIndex),
            protocol: "file:",
            slashes: true,
        }));
    }
}
exports.relaunchElectron = relaunchElectron;
//# sourceMappingURL=main.js.map