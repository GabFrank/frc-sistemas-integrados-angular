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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.relaunchElectron = exports.createWindow = void 0;
var electron_1 = require("electron");
var electron_updater_1 = require("electron-updater");
var fs = require("fs");
var path = require("path");
var url = require("url");
var log = require('electron-log');
var readFileSync = require('fs').readFileSync;
var isDev = require('electron-is-dev');
var home = electron_1.app.getPath('home');
electron_updater_1.autoUpdater.logger = log;
electron_updater_1.autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'GabFrank',
    repo: 'franco-system-frontend-general',
    private: false
});
var ipcMain = require('electron').ipcMain;
// Initialize remote module
require("@electron/remote/main").initialize();
var win = null;
var args = process.argv.slice(1), serve = args.some(function (val) { return val === "--serve"; });
function createWindow() {
    return __awaiter(this, void 0, void 0, function () {
        var electronScreen, size, factor, gotTheLock, pathIndex;
        return __generator(this, function (_a) {
            electronScreen = electron_1.screen;
            size = electronScreen.getPrimaryDisplay().workAreaSize;
            factor = electron_1.screen.getPrimaryDisplay().scaleFactor;
            // Create the browser window.
            win = new electron_1.BrowserWindow({
                icon: "file://" + __dirname + "/dist/assets/logo.ico",
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
            gotTheLock = electron_1.app.requestSingleInstanceLock();
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
            }
            else {
                pathIndex = "./index.html";
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
            // Emitted when the window is closed.
            win.on("closed", function () {
                // Dereference the window object, usually you would store window
                // in an array if your app supports multi windows, this is the time
                // when you should delete the corresponding element.
                win = null;
            });
            return [2 /*return*/, win];
        });
    });
}
exports.createWindow = createWindow;
ipcMain.on('get-config-file', function (event, arg) {
    console.log(arg);
});
ipcMain.on('reiniciar', function (event, arg) {
    relaunchElectron();
});
try {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
    electron_1.app.on("ready", function () { return __awaiter(void 0, void 0, void 0, function () {
        var options, result, isServidor, config, configJson, config2, configJson2;
        return __generator(this, function (_a) {
            if (!fs.existsSync(process.cwd() + "/configuracion-local.json")) {
                options = {
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
                result = electron_1.dialog.showMessageBoxSync(options);
                if (result === 0) {
                    isServidor = options.checkboxChecked;
                    config = {
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
                    configJson = JSON.stringify(config, null, 2);
                    fs.writeFileSync(__dirname + "/configuracion-local.json", configJson);
                    config2 = void 0;
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
                    }
                    else {
                        config2 = [
                            {
                                id: 0,
                                nombre: "Servidor",
                                ip: options.centralIp,
                                port: options.centralPort,
                            },
                        ];
                    }
                    configJson2 = JSON.stringify(config2, null, 2);
                    fs.writeFileSync(__dirname + "/configuracion.json", configJson2);
                }
                else {
                    electron_1.app.quit();
                }
            }
            // Create the browser window and start the Angular app
            if (!isDev) {
                electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
                setInterval(function () {
                    log.info('Buscando actualizacion');
                    electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
                }, 100000);
            }
            electron_updater_1.autoUpdater.on('update-available', function () {
                log.info('Actualizacion disponible, descargando...');
            });
            electron_updater_1.autoUpdater.on('update-not-available', function () {
                log.info('No existen actualizaciones disponibles...');
            });
            electron_updater_1.autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName) {
                var dialogOpts = {
                    type: 'info',
                    buttons: ['Reiniciar'],
                    title: 'Actualización disponible',
                    message: process.platform === 'win32' ? releaseNotes : releaseName,
                    detail: 'Una actualización fue encontrada y descargada. Reinicie el programa para instalarla.'
                };
                electron_1.dialog.showMessageBox(dialogOpts).then(function (returnValue) {
                    if (returnValue.response === 0)
                        electron_updater_1.autoUpdater.quitAndInstall();
                });
            });
            electron_updater_1.autoUpdater.on('error', function (message) {
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
                            click: function () {
                                relaunchElectron();
                            }
                        },
                        {
                            label: "Open Dev Tools",
                            click: function () {
                                win.webContents.openDevTools();
                            },
                        },
                        {
                            label: "Close Dev Tools",
                            click: function () {
                                win.webContents.closeDevTools();
                            },
                        },
                        {
                            label: "Minimizar",
                            click: function () {
                                win.minimize();
                            },
                        },
                        {
                            label: "Zoom in",
                            click: function () {
                                win.webContents.setZoomLevel(win.webContents.zoomLevel + 1);
                            },
                        },
                        {
                            label: "Zoom out",
                            click: function () {
                                win.webContents.setZoomLevel(win.webContents.zoomLevel - 1);
                            },
                        },
                        {
                            label: "Salir",
                            click: function () {
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
            return [2 /*return*/];
        });
    }); });
    // Quit when all windows are closed.
    electron_1.app.on("window-all-closed", function () {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== "darwin") {
            electron_1.app.quit();
        }
    });
    electron_1.app.on("activate", function () {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (win === null) {
            createWindow();
        }
    });
    win.webContents.on("did-fail-load", function () {
        console.log("did-fail-load");
        relaunchElectron();
        // REDIRECT TO FIRST WEBPAGE AGAIN
    });
    win.webContents.setZoomFactor(1);
    win.webContents.setZoomLevel(0);
    win.webContents.print({ silent: true });
    win.webContents.setWindowOpenHandler(function (_a) {
        var url = _a.url;
        require("electron").shell.openExternal(url);
        return { action: "deny" };
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
        var pathIndex = "./index.html";
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