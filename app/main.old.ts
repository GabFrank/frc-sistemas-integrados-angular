// import {
//   app,
//   BrowserWindow,
//   dialog,
//   Menu,
//   MenuItemConstructorOptions,
//   MessageBoxOptions,
//   screen,
// } from "electron";
// import { autoUpdater, UpdateDownloadedEvent } from "electron-updater";
// import * as fs from "fs";
// import * as path from "path";
// import * as url from "url";

// const log = require("electron-log");
// const isDev = require("electron-is-dev");

// autoUpdater.logger = log;
// autoUpdater.setFeedURL({
//   provider: "github",
//   owner: "GabFrank",
//   repo: "franco-system-frontend-general",
//   private: false,
// });

// const { ipcMain } = require("electron");
// let instanceCount = 0;

// // Initialize remote module
// require("@electron/remote/main").initialize();

// let win: BrowserWindow = null;
// const args = process.argv.slice(1),
//   serve = args.some((val) => val === "--serve");

// export async function createWindow(): Promise<BrowserWindow> {
//   const electronScreen = screen;
//   const size = screen.getPrimaryDisplay().workAreaSize;
//   let factor = screen.getPrimaryDisplay().scaleFactor;

//   // Create the browser window.
//   win = new BrowserWindow({
//     icon: `file://${__dirname}/dist/assets/logo.ico`,
//     x: 0,
//     y: 0,
//     width: size.width,
//     height: size.height,
//     webPreferences: {
//       nodeIntegration: true,
//       allowRunningInsecureContent: serve,
//       contextIsolation: false, // false if you want to run e2e test with Spectron
//     },
//     fullscreen: true,
//     frame: true,
//   });

//   win.setFullScreen(true);
//   win.webContents.setZoomFactor(1);
//   win.webContents
//     .executeJavaScript('localStorage.getItem("zoomLevel");', true)
//     .then((result) => {
//       if (result != null) {
//         win.webContents.setZoomLevel(+result);
//       }
//     });

//   win.maximize();
//   win.show();

//   app.on("second-instance", (event, commandLine, workingDirectory) => {
//     // Increment the instance count
//     instanceCount++;

//     // If more than 2 instances, quit the app
//     if (instanceCount >= 2) {
//       app.quit();
//       return;
//     }

//     // Someone tried to run a second instance, we should focus our window.
//     if (win) {
//       if (win.isMinimized()) win.restore();
//       win.focus();
//     }
//   });

//   if (serve) {
//     win.webContents.openDevTools();
//     const debug = require("electron-debug");
//     debug();

//     require("electron-reloader")(module);
//     win.loadURL("http://localhost:4200");
//   } else {
//     // Path when running electron executable
//     let pathIndex = "./index.html";

//     if (fs.existsSync(path.join(__dirname, "../dist/index.html"))) {
//       // Path when running electron in local folder
//       pathIndex = "../dist/index.html";
//     }

//     const url = new URL(path.join("file:", __dirname, pathIndex));
//     win.loadURL(url.href);
//   }

//   // Emitted when the window is closed.
//   win.on("closed", () => {
//     // Dereference the window object, usually you would store window
//     // in an array if your app supports multi windows, this is the time
//     // when you should delete the corresponding element.
//     win = null;
//     app.quit();
//   });

//   win.webContents.on("did-fail-load", () => {
//     console.log("did-fail-load");
//     relaunchElectron();
//     // REDIRECT TO FIRST WEBPAGE AGAIN
//   });

//   win.webContents.setWindowOpenHandler(({ url }) => {
//     require("electron").shell.openExternal(url);
//     return { action: "deny" };
//   });

//   win.webContents.on("did-finish-load", () => {
//     win.webContents
//       .executeJavaScript('localStorage.getItem("zoomLevel");', true)
//       .then((zoomLevel) => {
//         if (zoomLevel) {
//           win.webContents.setZoomLevel(parseFloat(zoomLevel));
//         }
//       });
//   });

//   return win;
// }

// ipcMain.on("get-config-file", (event, arg) => {
//   console.log(arg);
// });

// ipcMain.on("reiniciar", (event: any, arg: any) => {
//   relaunchElectron();
// });

// ipcMain.on("get-app-version", (event) => {
//   event.returnValue = app.getVersion();
// });

// try {
//   // This method will be called when Electron has finished
//   // initialization and is ready to create browser windows.
//   // Some APIs can only be used after this event occurs.
//   // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
//   app.on("ready", () => {
//     if (!isDev) {
//       autoUpdater.checkForUpdatesAndNotify();
//       setInterval(() => {
//         log.info("Buscando actualizacion");
//         autoUpdater.checkForUpdatesAndNotify();
//       }, 100000);
//     }

//     autoUpdater.on("update-available", () => {
//       log.info("Actualizacion disponible, descargando...");
//     });

//     autoUpdater.on("update-not-available", () => {
//       log.info("No existen actualizaciones disponibles...");
//     });

//     autoUpdater.on("update-downloaded", (event: UpdateDownloadedEvent) => {
//       const dialogOpts: MessageBoxOptions = {
//         type: "info",
//         buttons: ["Reiniciar"],
//         title: "Actualización disponible",
//         message: event.releaseName + " - " + event.version,
//         detail:
//           "Una actualización fue encontrada y descargada. Reinicie el programa para instalarla.",
//       };

//       dialog.showMessageBox(dialogOpts).then((returnValue) => {
//         if (returnValue.response === 0) autoUpdater.quitAndInstall();
//       });
//     });

//     autoUpdater.on("error", (message) => {
//       console.error("There was a problem updating the application");
//       console.error(message);
//     });

//     // const menu = Menu.buildFromTemplate([
//     //   {
//     //     role: "appMenu",
//     //     label: "Aplicacion",
//     //     submenu: [
//     //       {
//     //         label: "Reiniciar",
//     //         click() {
//     //           relaunchElectron();
//     //         },
//     //       },
//     //       {
//     //         label: "Open Dev Tools",
//     //         click() {
//     //           win.webContents.openDevTools();
//     //         },
//     //       },
//     //       {
//     //         label: "Close Dev Tools",
//     //         click() {
//     //           win.webContents.closeDevTools();
//     //         },
//     //       },
//     //       {
//     //         label: "Minimizar",
//     //         click() {
//     //           win.minimize();
//     //         },
//     //       },
//     //       {
//     //         label: "Zoom in",
//     //         click() {
//     //           win.webContents.setZoomLevel(win.webContents.zoomLevel + 1);
//     //           win.webContents
//     //             .executeJavaScript(
//     //               `localStorage.setItem("zoomLevel", ${win.webContents.getZoomLevel()});`,
//     //               true
//     //             )
//     //             .then((result) => {
//     //               console.log(result);
//     //             });
//     //         },
//     //       },
//     //       {
//     //         label: "Zoom out",
//     //         click() {
//     //           win.webContents.setZoomLevel(win.webContents.zoomLevel - 1);
//     //           win.webContents
//     //             .executeJavaScript(
//     //               `localStorage.setItem("zoomLevel", ${win.webContents.getZoomLevel()});`,
//     //               true
//     //             )
//     //             .then((result) => {
//     //               console.log(result);
//     //             });
//     //         },
//     //       },
//     //       {
//     //         label: "Salir",
//     //         click() {
//     //           app.quit();
//     //         },
//     //       },
//     //     ],
//     //   },
//     //   {
//     //     role: "editMenu",
//     //     label: "Editar",
//     //     submenu: [
//     //       {
//     //         label: "Cortar",
//     //         accelerator: "CmdOrCtrl+X",
//     //         role: "cut",
//     //       },
//     //       {
//     //         label: "Copiar",
//     //         accelerator: "CmdOrCtrl+C",
//     //         role: "copy",
//     //       },
//     //       {
//     //         label: "Pegar",
//     //         accelerator: "CmdOrCtrl+V",
//     //         role: "paste",
//     //       },
//     //       {
//     //         label: "Deshacer",
//     //         accelerator: "CmdOrCtrl+Z",
//     //         role: "undo",
//     //       },
//     //       {
//     //         label: "Rehacer",
//     //         accelerator: "Shift+CmdOrCtrl+Z",
//     //         role: "redo",
//     //       },
//     //       {
//     //         label: "Seleccionar Todo",
//     //         accelerator: "CmdOrCtrl+A",
//     //         role: "selectAll",
//     //       },
//     //     ],
//     //   },
//     //   {
//     //     role: "about",
//     //     label: "Sobre",
//     //     submenu: [
//     //       {
//     //         label: app.getVersion(),
//     //       },
//     //     ],
//     //   },
//     // ]);
//     // Menu.setApplicationMenu(menu);
//     setTimeout(() => {
//       createWindow().then(() => {
//         const template: MenuItemConstructorOptions[] = [
//           {
//             label: "File",
//             submenu: [
//               {
//                 label: "Reiniciar",
//                 click() {
//                   relaunchElectron();
//                 },
//               },
//               {
//                 label: "Salir",
//                 click() {
//                   app.quit();
//                 },
//               },
//             ],
//           },
//           {
//             label: "Edit",
//             submenu: [
//               { role: "undo" },
//               { role: "redo" },
//               { type: "separator" },
//               { role: "cut" },
//               { role: "copy" },
//               { role: "paste" },
//               { role: "selectAll" },
//             ],
//           },
//           {
//             label: "View",
//             submenu: [
//               { role: "reload" },
//               { role: "toggleDevTools" },
//               { type: "separator" },
//               { role: "resetZoom" },
//               { role: "zoomIn" },
//               { role: "zoomOut" },
//               { type: "separator" },
//               { role: "togglefullscreen" },
//             ],
//           },
//           {
//             label: "Window",
//             submenu: [{ role: "minimize" }, { role: "close" }],
//           },
//           {
//             label: "Help",
//             submenu: [
//               {
//                 label: "Learn More",
//                 click: async () => {
//                   const { shell } = require("electron");
//                   await shell.openExternal("https://electronjs.org");
//                 },
//               },
//             ],
//           },
//         ];

//         const menu = Menu.buildFromTemplate(template);
//         Menu.setApplicationMenu(menu);
//       });
//     }, 400);
//   });

//   // Quit when all windows are closed.
//   app.on("window-all-closed", () => {
//     // On OS X it is common for applications and their menu bar
//     // to stay active until the user quits explicitly with Cmd + Q
//     instanceCount--;
//     if (process.platform !== "darwin") {
//       app.quit();
//     }
//   });

//   app.on("activate", () => {
//     // On OS X it's common to re-create a window in the app when the
//     // dock icon is clicked and there are no other windows open.
//     if (instanceCount >= 2) {
//       return;
//     }
//     instanceCount++;
//     if (win === null) {
//       createWindow();
//     }
//   });
// } catch (e) {
//   // Catch Error
//   // throw e;
// }

// export function relaunchElectron() {
//   if (serve) {
//     win.webContents.openDevTools();
//     require("electron-reload")(__dirname, {
//       electron: require(path.join(__dirname, "/../node_modules/electron")),
//     });
//     win.loadURL("http://localhost:4200");
//   } else {
//     // Path when running electron executable
//     let pathIndex = "./index.html";

//     if (fs.existsSync(path.join(__dirname, "../dist/index.html"))) {
//       // Path when running electron in local folder
//       pathIndex = "../dist/index.html";
//     }

//     win.loadURL(
//       url.format({
//         pathname: path.join(__dirname, pathIndex),
//         protocol: "file:",
//         slashes: true,
//       })
//     );
//   }
// }
