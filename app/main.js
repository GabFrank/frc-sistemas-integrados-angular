"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.relaunchElectron = exports.createWindow = void 0;
var electron_1 = require("electron");
var path = require("path");
var fs = require("fs");
var url = require("url");
// Initialize remote module
require("@electron/remote/main").initialize();
var win = null;
var args = process.argv.slice(1), serve = args.some(function (val) { return val === "--serve"; });
function createWindow() {
    var electronScreen = electron_1.screen;
    var size = electronScreen.getPrimaryDisplay().workAreaSize;
    // Create the browser window.
    win = new electron_1.BrowserWindow({
        fullscreen: true,
        x: 0,
        y: 0,
        width: size.width,
        height: size.height,
        webPreferences: {
            nodeIntegration: true,
            allowRunningInsecureContent: serve ? true : false,
            contextIsolation: false,
            enableRemoteModule: true, // true if you want to run e2e test with Spectron or use remote module in renderer context (ie. Angular)
        },
    });
    var gotTheLock = electron_1.app.requestSingleInstanceLock();
    if (!gotTheLock) {
        electron_1.app.quit();
    }
    else {
        electron_1.app.on("second-instance", function (event, commandLine, workingDirectory) {
            // Someone tried to run a second instance, we should focus our window.
            if (win) {
                if (win.isMinimized())
                    win.restore();
                win.focus();
            }
        });
        // Create myWindow, load the rest of the app, etc...
        electron_1.app.on("ready", function () { });
    }
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
    // Emitted when the window is closed.
    win.on("closed", function () {
        // Dereference the window object, usually you would store window
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });
    return win;
}
exports.createWindow = createWindow;
try {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
    electron_1.app.on("ready", function () {
        electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate([
            {
                role: "appMenu",
                label: "Aplicacion",
                submenu: [
                    {
                        label: "Reiniciar",
                        click: function () {
                            win.loadURL(serve ? 'http://localhost:4200' : "file://" + path.join(__dirname, '../dist/index.html'));
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
                            win.webContents.setZoomFactor(win.webContents.zoomFactor + 0.2);
                        },
                    },
                    {
                        label: "Zoom out",
                        click: function () {
                            win.webContents.setZoomFactor(win.webContents.zoomFactor - 0.2);
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
        ]));
        setTimeout(createWindow, 400);
    });
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
        win.loadURL(serve ? 'http://localhost:4200' : "file://" + path.join(__dirname, '../dist/index.html'));
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
    this.app.relaunch({ args: process.argv.slice(1).concat(["--relaunch"]) });
    this.app.exit(0);
}
exports.relaunchElectron = relaunchElectron;
//# sourceMappingURL=main.js.map