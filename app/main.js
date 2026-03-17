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
const fs = require("fs");
const path = require("path");
const url = require("url");
const child_process_1 = require("child_process");
const electron_pos_printer_1 = require("electron-pos-printer");
const log = require('electron-log');
const isDev = require('electron-is-dev');
const { setup: setupPushReceiver } = require('@superhuman/electron-push-receiver');
let printers = [];
const { ipcMain } = require('electron');
let instanceCount = 0;
require("@electron/remote/main").initialize();
let win;
const args = process.argv.slice(1), serve = args.some(val => val === '--serve');
function createWindow() {
    return __awaiter(this, void 0, void 0, function* () {
        const electronScreen = electron_1.screen;
        const size = electron_1.screen.getPrimaryDisplay().workAreaSize;
        let factor = electron_1.screen.getPrimaryDisplay().scaleFactor;
        win = new electron_1.BrowserWindow({
            icon: `file://${__dirname}/dist/assets/logo.ico`,
            x: 0,
            y: 0,
            width: size.width,
            height: size.height,
            webPreferences: {
                nodeIntegration: true,
                allowRunningInsecureContent: (serve),
                contextIsolation: false,
            },
        });
        try {
            const path = require('path');
            const fs = require('fs');
            const userDataPath = electron_1.app.getPath('userData');
        }
        catch (e) {
        }
        setupPushReceiver(win.webContents);
        const { Notification } = require('electron');
        ipcMain.on('SHOW_NATIVE_NOTIFICATION', (event, notification) => {
            var _a, _b, _c, _d, _e, _f;
            try {
                const title = ((_a = notification === null || notification === void 0 ? void 0 : notification.notification) === null || _a === void 0 ? void 0 : _a.title) ||
                    ((_b = notification === null || notification === void 0 ? void 0 : notification.data) === null || _b === void 0 ? void 0 : _b.title) ||
                    'FRC Sistemas Integrados';
                const body = ((_c = notification === null || notification === void 0 ? void 0 : notification.notification) === null || _c === void 0 ? void 0 : _c.body) ||
                    ((_d = notification === null || notification === void 0 ? void 0 : notification.notification) === null || _d === void 0 ? void 0 : _d.message) ||
                    ((_e = notification === null || notification === void 0 ? void 0 : notification.data) === null || _e === void 0 ? void 0 : _e.message) ||
                    ((_f = notification === null || notification === void 0 ? void 0 : notification.data) === null || _f === void 0 ? void 0 : _f.body) ||
                    '';
                const data = (notification === null || notification === void 0 ? void 0 : notification.data) || {};
                const nativeNotification = new Notification({
                    title: title,
                    body: body,
                    icon: path.join(__dirname, 'dist/assets/logo.png'),
                    silent: false,
                    urgency: 'normal'
                });
                nativeNotification.on('click', () => {
                    if (win) {
                        if (win.isMinimized())
                            win.restore();
                        win.focus();
                    }
                    if (data.path) {
                        win.webContents.send('notification-clicked', data.path);
                    }
                });
                nativeNotification.show();
            }
            catch (error) {
                // Silent notification error
            }
        });
        // win.webContents.setZoomFactor(1); // Removido para permitir que el zoom se maneje dinámicamente en did-finish-load
        win.maximize();
        win.show();
        electron_1.app.on("second-instance", (event, commandLine, workingDirectory) => {
            instanceCount++;
            if (instanceCount >= 2) {
                electron_1.app.quit();
                return;
            }
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
            let pathIndex = './index.html';
            if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
                pathIndex = '../dist/index.html';
            }
            const url = new URL(path.join('file:', __dirname, pathIndex));
            win.loadURL(url.href);
        }
        win.on('closed', () => {
            electron_1.app.quit();
        });
        win.webContents.on("did-fail-load", (event, errorCode, errorDescription, validatedURL) => {
            console.log("did-fail-load", { errorCode, errorDescription, validatedURL });
            // Solo relanzamos si es un error crítico de carga de la página principal (index.html o localhost:4200)
            // No relanzamos por errores de recursos secundarios o servicios externos (como FCM/push notifications)
            const isMainPage = validatedURL && (validatedURL.includes('index.html') ||
                validatedURL.includes('localhost:4200') ||
                validatedURL.includes('file://'));
            if (isMainPage && errorCode !== -3) { // -3 = ABORTED (puede ser cancelado intencionalmente)
                console.log("Error crítico en página principal, relanzando aplicación");
                relaunchElectron();
            }
            else {
                console.log("Error en recurso secundario o no crítico, continuando sin relanzar");
            }
        });
        win.webContents.setWindowOpenHandler(({ url }) => {
            require("electron").shell.openExternal(url);
            return { action: "deny" };
        });
        win.webContents.on('did-finish-load', () => {
            win.webContents
                .executeJavaScript('localStorage.getItem("zoomLevel");', true)
                .then((zoomLevel) => {
                if (zoomLevel !== null && zoomLevel !== undefined && zoomLevel !== '') {
                    const parsedZoom = parseFloat(zoomLevel);
                    win.webContents.setZoomLevel(parsedZoom);
                }
                else {
                    // Si no hay preferencia guardada, iniciamos con zoom -1.5 como base
                    // Esto soluciona el problema de que se vea muy grande tanto en alta como baja resolución
                    try {
                        const defaultZoom = -1.5;
                        win.webContents.setZoomLevel(defaultZoom);
                        // Guardamos el zoom inicial para evitar que se pierda o cause errores
                        win.webContents.executeJavaScript(`localStorage.setItem("zoomLevel", ${defaultZoom});`, true);
                    }
                    catch (e) {
                        win.webContents.setZoomLevel(-1.5);
                    }
                }
            })
                .catch((error) => {
                // En caso de error crítico al leer localStorage, forzamos zoom -1.5 para asegurar que inicie
                win.webContents.setZoomLevel(-1.5);
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
// Add Thermal Printer IPC handlers
ipcMain.handle('get-printers', (event) => {
    return printers;
});
ipcMain.handle('save-printer', (event, printer) => {
    const existingIndex = printers.findIndex(p => p.id === printer.id);
    if (existingIndex >= 0) {
        printers[existingIndex] = printer;
    }
    else {
        printer.id = printers.length > 0 ? Math.max(...printers.map(p => p.id)) + 1 : 1;
        printers.push(printer);
    }
    return printer;
});
ipcMain.handle('delete-printer', (event, printerId) => {
    const existingIndex = printers.findIndex(p => p.id === printerId);
    if (existingIndex >= 0) {
        printers.splice(existingIndex, 1);
        return true;
    }
    return false;
});
ipcMain.handle('test-printer', (event, printerId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const printer = printers.find(p => p.id === printerId);
        if (!printer) {
            return { success: false, error: 'Printer not found' };
        }
        const content = generateTestPageContent(printer);
        const success = yield printThermalReceipt(printer, content);
        return { success };
    }
    catch (error) {
        console.error('Error printing test page:', error);
        return { success: false, error: error.message };
    }
}));
ipcMain.handle('print-receipt', (event, { printerId, order, orderItems }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const printer = printers.find(p => p.id === printerId);
        if (!printer) {
            return { success: false, error: 'Printer not found' };
        }
        const content = generateReceiptContent(order, orderItems);
        const success = yield printThermalReceipt(printer, content);
        return { success };
    }
    catch (error) {
        console.error('Error printing receipt:', error);
        return { success: false, error: error.message };
    }
}));
function registerPrinterIpcHandlers() {
    ipcMain.handle('get-system-printers', () => __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Getting system printers');
            const mainWindow = electron_1.BrowserWindow.getFocusedWindow();
            if (!mainWindow) {
                console.error('No focused window found');
                return [];
            }
            const printers = yield mainWindow.webContents.getPrintersAsync();
            console.log(`Found ${printers.length} system printers`);
            return printers;
        }
        catch (error) {
            console.error('Error getting system printers:', error);
            return [];
        }
    }));
    ipcMain.handle('print-with-pos-printer', (event, args) => __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('print-with-pos-printer called with args:', JSON.stringify(args, (key, value) => {
                if (key === 'path' && typeof value === 'string' && value.startsWith('data:image')) {
                    return 'data:image... [truncated]';
                }
                return value;
            }));
            const { data, options } = args;
            if (!data || !Array.isArray(data)) {
                console.error('Invalid data for printing - not an array');
                return { success: false, error: 'Invalid data for printing' };
            }
            if (!options || !options.printerName) {
                console.error('Invalid printer options - missing printerName');
                return { success: false, error: 'Invalid printer options' };
            }
            let printData = JSON.parse(JSON.stringify(data));
            for (let i = 0; i < printData.length; i++) {
                const item = printData[i];
                if (item.style === null || item.style === undefined) {
                    printData[i].style = {};
                }
                switch (item.type) {
                    case 'text':
                        if (item.value === null || item.value === undefined) {
                            printData[i].value = '';
                        }
                        break;
                    case 'image':
                        if (!item.path) {
                            console.error('Image missing path, removing from print job');
                            printData[i] = {
                                type: 'text',
                                value: '[Image placeholder]',
                                style: { textAlign: 'center' }
                            };
                        }
                        break;
                    case 'barCode':
                        if (!item.value) {
                            console.error('Barcode missing value, replacing with placeholder');
                            printData[i].value = '12345678';
                        }
                        printData[i].height = item.height || 40;
                        printData[i].width = item.width || 2;
                        printData[i].position = item.position || 'center';
                        printData[i].displayValue = item.displayValue !== undefined ? item.displayValue : true;
                        break;
                    case 'qrCode':
                        if (!item.value) {
                            console.error('QR code missing value, replacing with placeholder');
                            printData[i].value = 'https://example.com';
                        }
                        printData[i].height = item.height || 150;
                        printData[i].width = item.width || 150;
                        printData[i].position = item.position || 'center';
                        break;
                }
            }
            const imageItems = printData.filter(item => (item.type === 'image' && item.path && item.path.startsWith('data:image')) ||
                (item.style && item.style.backgroundImage && item.style.backgroundImage.startsWith('data:image')));
            if (imageItems.length > 0) {
                console.log(`Detected ${imageItems.length} image items in print job`);
                const tmpDir = path.join(electron_1.app.getPath('temp'), 'pos-printer-images');
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }
                for (let i = 0; i < printData.length; i++) {
                    const item = printData[i];
                    if (item.type === 'image' && item.path && item.path.startsWith('data:image')) {
                        try {
                            const timestamp = Date.now();
                            const imgPath = path.join(tmpDir, `img-${timestamp}-${i}.png`);
                            const base64Data = item.path.split(';base64,').pop();
                            if (base64Data) {
                                fs.writeFileSync(imgPath, Buffer.from(base64Data, 'base64'));
                                printData[i].path = imgPath;
                                console.log(`Saved image ${i} to temp file: ${imgPath}`);
                            }
                        }
                        catch (err) {
                            console.error(`Error handling image ${i}:`, err);
                        }
                    }
                    if (item.style && item.style.backgroundImage && item.style.backgroundImage.startsWith('data:image')) {
                        try {
                            const timestamp = Date.now();
                            const imgPath = path.join(tmpDir, `bg-${timestamp}-${i}.png`);
                            const base64Data = item.style.backgroundImage.split(';base64,').pop();
                            if (base64Data) {
                                fs.writeFileSync(imgPath, Buffer.from(base64Data, 'base64'));
                                printData[i].style.backgroundImage = `url(${imgPath})`;
                                console.log(`Saved background image ${i} to temp file: ${imgPath}`);
                            }
                        }
                        catch (err) {
                            console.error(`Error handling background image ${i}:`, err);
                        }
                    }
                }
            }
            try {
                const isLinux = process.platform === 'linux';
                const isNetwork = typeof options.printerName === 'string' && options.printerName.includes('://');
                const isXprinter = typeof options.printerName === 'string' && (options.printerName.toLowerCase().includes('xprinter') || options.printerName.toLowerCase().includes('xp-'));
                if (isLinux && !isNetwork && !isXprinter) {
                    const buildEscPos = () => {
                        const chunks = [];
                        const push = (b) => chunks.push(Buffer.isBuffer(b) ? b : Buffer.from(b));
                        const textEnc = (s) => Buffer.from((s || '').replace(/\n/g, '\r\n'), 'ascii');
                        push([0x1B, 0x40]);
                        for (const item of printData) {
                            if (item.type === 'text') {
                                const center = item.style && item.style.textAlign === 'center';
                                push([0x1B, 0x61, center ? 0x01 : 0x00]);
                                let mode = 0x00;
                                const size = parseInt((item.style && item.style.fontSize || '12px').toString().replace('px', ''), 10);
                                if (item.style && item.style.fontWeight === 'bold')
                                    mode |= 0x08;
                                if (size >= 18)
                                    mode |= 0x20;
                                push([0x1B, 0x21, mode]);
                                push(textEnc((item.value || '') + '\n'));
                                push([0x1B, 0x21, 0x00]);
                                push([0x1B, 0x61, 0x00]);
                            }
                            else if (item.type === 'barCode' || item.type === 'barcode') {
                                const value = ((item.value || '').toString().replace(/[^0-9]/g, ''));
                                if (value.length >= 8) {
                                    push([0x1B, 0x61, 0x01]);
                                    push([0x1D, 0x48, 0x02]);
                                    push([0x1D, 0x68, 60]);
                                    push([0x1D, 0x77, 2]);
                                    push([0x1D, 0x6B, 0x43, value.length]);
                                    push(Buffer.from(value, 'ascii'));
                                    push(textEnc('\n\n'));
                                    push([0x1B, 0x61, 0x00]);
                                }
                            }
                            else if (item.type === 'qrCode' || item.type === 'qrcode') {
                                const val = (item.value || '').toString();
                                push([0x1B, 0x61, 0x01]);
                                push([0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]);
                                push([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x06]);
                                push([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x01]);
                                const dataBuf = Buffer.from(val, 'ascii');
                                const pL = (dataBuf.length + 3) & 0xFF;
                                const pH = ((dataBuf.length + 3) >> 8) & 0xFF;
                                push([0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30]);
                                push(dataBuf);
                                push([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]);
                                push(textEnc('\n\n'));
                                push([0x1B, 0x61, 0x00]);
                            }
                            else if (item.type === 'cut') {
                                push([0x1D, 0x56, 0x00]);
                            }
                        }
                        push(textEnc('\n'));
                        push([0x1D, 0x56, 0x00]);
                        return Buffer.concat(chunks);
                    };
                    const rawBuf = buildEscPos();
                    const tmp = path.join(electron_1.app.getPath('temp'), `escpos-${Date.now()}.bin`);
                    fs.writeFileSync(tmp, rawBuf);
                    const cmd = `lp -d "${options.printerName}" -o raw ${tmp}`;
                    console.log('Executing ESC/POS raw:', cmd);
                    return yield new Promise((resolve) => {
                        (0, child_process_1.exec)(cmd, (error, stdout, stderr) => {
                            try {
                                fs.unlinkSync(tmp);
                            }
                            catch (_a) { }
                            if (error) {
                                console.error('ESC/POS raw error:', error, stderr);
                                resolve(null);
                                return;
                            }
                            console.log('ESC/POS raw stdout:', stdout);
                            resolve({ success: true });
                        });
                    });
                }
            }
            catch (e) {
                console.warn('ESC/POS raw path skipped:', e);
            }
            try {
                const isLinux = process.platform === 'linux';
                const isXprinter = typeof options.printerName === 'string' && (options.printerName.toLowerCase().includes('xprinter') || options.printerName.toLowerCase().includes('xp-'));
                if (isLinux && isXprinter) {
                    const labelWidth = 320;
                    const labelHeight = 320;
                    const charWidth = { 1: 7, 2: 9, 3: 11, 4: 14 };
                    const lineHeight = { 1: 12, 2: 14, 3: 18, 4: 26 };
                    const centerX = (text, fontNum) => {
                        const w = charWidth[fontNum] || 10;
                        const len = (text || '').length;
                        return Math.max(0, Math.floor((labelWidth - (w * len)) / 2));
                    };
                    const wrap = (text, fontNum, maxDots) => {
                        const maxChars = 17;
                        const words = (text || '').trim().split(/\s+/);
                        const out = [];
                        let line = '';
                        for (const word of words) {
                            if (word.length > maxChars) {
                                if (line) {
                                    out.push(line);
                                    line = '';
                                }
                                let i = 0;
                                while (i < word.length && out.length < 3) {
                                    const chunk = word.substring(i, i + maxChars);
                                    out.push(chunk);
                                    i += maxChars;
                                }
                            }
                            else {
                                const testLine = line ? line + ' ' + word : word;
                                if (testLine.length <= maxChars) {
                                    line = testLine;
                                }
                                else {
                                    if (line) {
                                        out.push(line);
                                        line = '';
                                    }
                                    if (out.length >= 3) {
                                        const lastLine = out[out.length - 1];
                                        const testLastLine = lastLine + ' ' + word;
                                        if (testLastLine.length <= maxChars) {
                                            out[out.length - 1] = testLastLine;
                                        }
                                    }
                                    else {
                                        line = word;
                                    }
                                }
                            }
                        }
                        if (line && out.length < 3) {
                            out.push(line);
                        }
                        else if (line && out.length === 3) {
                            const lastLine = out[out.length - 1];
                            const testLastLine = lastLine + ' ' + line;
                            if (testLastLine.length <= maxChars) {
                                out[out.length - 1] = testLastLine;
                            }
                        }
                        return out.slice(0, 3);
                    };
                    const texts = printData.filter(i => i.type === 'text').map(i => (i.value || '').toString());
                    const nameTexts = texts.filter(t => {
                        const lower = (t || '').toLowerCase();
                        return t &&
                            !lower.includes('gs.') &&
                            !/^fab[:]?\s*/i.test(t) &&
                            !/fabricado/i.test(lower) &&
                            !/^\d+\/\d+\/\d+/.test(t.trim());
                    });
                    const nameLinesPrepared = nameTexts.length > 0 ? nameTexts : [];
                    const nameText = nameLinesPrepared.join(' ').trim();
                    let priceText = texts.find(t => /(^|\s)Gs\.?/i.test(t)) || '';
                    if (!priceText) {
                        const candidate = texts.find(t => /\d/.test(t));
                        if (candidate)
                            priceText = candidate;
                    }
                    let dateText = texts.find(t => {
                        const trimmed = (t || '').trim();
                        return /^fab[:]?\s*/i.test(trimmed) || /^fabricado/i.test(trimmed.toLowerCase());
                    }) || '';
                    const barcodeItem = printData.find(i => i.type === 'barCode' || i.type === 'barcode');
                    const qrItem = printData.find(i => i.type === 'qrCode' || i.type === 'qrcode');
                    let epl = 'SIZE 40 mm,40 mm\nGAP 3 mm,0\nCLS\n';
                    let y = 10;
                    const maxDotsForName = 280;
                    let nameLines = [];
                    if (nameText) {
                        nameLines = wrap(nameText, 3, Math.min(labelWidth - 12, maxDotsForName));
                    }
                    nameLines = nameLines.filter(l => !!l).slice(0, 3);
                    for (const line of nameLines) {
                        const x = Math.max(0, centerX(line, 3) - 16);
                        epl += `TEXT ${x},${y},"3",0,1,1,"${line.replace(/"/g, '\\"')}"\n`;
                        y += (lineHeight[3] || 18) + 6;
                    }
                    y += 6;
                    y += 24;
                    if (priceText) {
                        let x = centerX(priceText, 4) - 32;
                        if (x < 0)
                            x = 0;
                        epl += `TEXT ${x},${y},"4",0,1,1,"${priceText.replace(/"/g, '\\"')}"\n`;
                        y += (lineHeight[4] || 26) + 8;
                    }
                    y += 24;
                    if (dateText) {
                        const dateLen = dateText.length;
                        const dateWidth = (charWidth[3] || 11) * dateLen;
                        let x;
                        if (dateWidth <= labelWidth - 10) {
                            x = centerX(dateText, 3);
                        }
                        else {
                            x = 10;
                        }
                        x = Math.max(0, x - 16);
                        epl += `TEXT ${x},${y},"3",0,1,1,"${dateText.replace(/"/g, '\\"')}"\n`;
                        y += (lineHeight[3] || 18) + 12;
                    }
                    if (barcodeItem) {
                        const rawBarcodeValue = (barcodeItem.value || '').toString();
                        const barcodeType = ((barcodeItem.barcodeType || 'EAN13').toString() || 'EAN13').toUpperCase();
                        const hasValue = rawBarcodeValue.trim().length > 0;
                        if (hasValue) {
                            let commandType = 'EAN13';
                            let barcodeVal = rawBarcodeValue;
                            if (barcodeType === 'CODE128') {
                                commandType = '128';
                            }
                            else if (barcodeType === 'EAN13') {
                                const digitsOnly = rawBarcodeValue.replace(/[^0-9]/g, '');
                                if (digitsOnly.length >= 8) {
                                    barcodeVal = digitsOnly;
                                    if (barcodeVal.length === 13) {
                                        barcodeVal = barcodeVal.substring(0, 12);
                                    }
                                    else if (barcodeVal.length < 12) {
                                        barcodeVal = barcodeVal.padStart(12, '0');
                                    }
                                }
                                else {
                                    barcodeVal = '';
                                }
                            }
                            else {
                                commandType = barcodeType;
                            }
                            if (barcodeVal) {
                                const digitsOnlyForText = rawBarcodeValue.replace(/[^0-9]/g, '');
                                const barcodeHeight = 60;
                                const barcodeWidth = 200;
                                const bx = Math.max(0, Math.floor((labelWidth - barcodeWidth) / 2));
                                const by = Math.max(180, y + 16);
                                const escapedBarcode = barcodeVal.replace(/"/g, '\\"');
                                epl += `BARCODE ${bx},${by},"${commandType}",${barcodeHeight},0,0,2,2,"${escapedBarcode}"\n`;
                                if (digitsOnlyForText) {
                                    const barcodeTextFont = 2;
                                    const textWidthDots = (charWidth[barcodeTextFont] || 9) * digitsOnlyForText.length;
                                    const textX = Math.max(0, bx + Math.floor((barcodeWidth - textWidthDots) / 2));
                                    const textY = by + barcodeHeight + 8;
                                    epl += `TEXT ${textX},${textY},"2",0,1,1,"${digitsOnlyForText}"\n`;
                                }
                            }
                        }
                    }
                    if (qrItem && (qrItem.value || '').toString()) {
                        const qv = (qrItem.value || '').toString();
                        const qSize = 90;
                        const qx = Math.floor((labelWidth - qSize) / 2);
                        const qy = Math.min(labelHeight - (qSize + 20), Math.max(y + 6, 150));
                        epl += `QRCODE ${qx},${qy},M,3,A,0,"${qv.replace(/"/g, '\\"')}"\n`;
                    }
                    epl += 'PRINT 1\n';
                    const tempFile = path.join(electron_1.app.getPath('temp'), `epl-${Date.now()}.txt`);
                    fs.writeFileSync(tempFile, epl, 'utf8');
                    const cmd = `lp -d "${options.printerName}" -o raw ${tempFile}`;
                    console.log('Executing EPL command:', cmd);
                    return yield new Promise((resolve) => {
                        (0, child_process_1.exec)(cmd, (error, stdout, stderr) => {
                            try {
                                fs.unlinkSync(tempFile);
                            }
                            catch (_a) { }
                            if (error) {
                                console.error('EPL error:', error, stderr);
                                resolve({ success: false, error: error.message || 'EPL error' });
                                return;
                            }
                            console.log('EPL stdout:', stdout);
                            resolve({ success: true });
                        });
                    });
                }
            }
            catch (e) {
                console.warn('EPL path skipped:', e);
            }
            console.log(`Printing to "${options.printerName}" with ${printData.length} items`);
            const printOptions = Object.assign(Object.assign({}, options), { silent: options.silent !== undefined ? options.silent : true, preview: options.preview !== undefined ? options.preview : false, width: options.width || '58mm', margin: options.margin || '0 0 0 0', copies: options.copies || 1, timeOutPerLine: options.timeOutPerLine || 400 });
            console.log('Using print options:', JSON.stringify(printOptions));
            try {
                yield electron_pos_printer_1.PosPrinter.print(printData, printOptions);
                console.log('Print completed successfully');
                setTimeout(() => {
                    try {
                        const tmpDir = path.join(electron_1.app.getPath('temp'), 'pos-printer-images');
                        if (fs.existsSync(tmpDir)) {
                            const files = fs.readdirSync(tmpDir);
                            for (const file of files) {
                                if (file.startsWith('img-') || file.startsWith('bg-')) {
                                    fs.unlinkSync(path.join(tmpDir, file));
                                }
                            }
                            console.log(`Cleaned up ${files.length} temporary image files`);
                        }
                    }
                    catch (error) {
                        console.error('Error cleaning up temporary files:', error);
                    }
                }, 1000);
                return { success: true };
            }
            catch (printError) {
                console.error('PosPrinter.print() threw an error:', printError);
                return {
                    success: false,
                    error: printError.message || 'Unknown printing error'
                };
            }
        }
        catch (error) {
            console.error('Error in print-with-pos-printer handler:', error);
            return { success: false, error: error.message || 'Unknown printing error' };
        }
    }));
}
try {
    electron_1.app.on('ready', () => {
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
                            const currentZoom = win.webContents.getZoomLevel();
                            win.webContents.setZoomLevel(currentZoom + 0.5);
                            win.webContents
                                .executeJavaScript(`localStorage.setItem("zoomLevel", ${win.webContents.getZoomLevel()});`, true);
                        },
                    },
                    {
                        label: "Zoom out",
                        click() {
                            const currentZoom = win.webContents.getZoomLevel();
                            win.webContents.setZoomLevel(currentZoom - 0.5);
                            win.webContents
                                .executeJavaScript(`localStorage.setItem("zoomLevel", ${win.webContents.getZoomLevel()});`, true);
                        },
                    },
                    {
                        label: "Restablecer Zoom",
                        click() {
                            const defaultZoom = -1.5;
                            win.webContents.setZoomLevel(defaultZoom);
                            win.webContents
                                .executeJavaScript(`localStorage.setItem("zoomLevel", ${defaultZoom});`, true);
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
        createWindow().then(() => {
            registerPrinterIpcHandlers();
        });
    });
    electron_1.app.on('window-all-closed', () => {
        instanceCount--;
        if (process.platform !== "darwin") {
            electron_1.app.quit();
        }
    });
    electron_1.app.on("activate", function () {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
}
catch (e) {
    console.error('Error in app initialization:', e);
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
        let pathIndex = "./index.html";
        if (fs.existsSync(path.join(__dirname, "../dist/index.html"))) {
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
function printThermalReceipt(printer, content) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!printer) {
                console.error('Printer not found');
                return false;
            }
            console.log(`Using printer: ${printer.name} (${printer.id}) of type ${printer.type}`);
            const isPosPrinterData = content.includes('__POS_PRINTER_DATA__:');
            const isImageLabel = content.includes('data:image/') &&
                (content.includes('base64') || content.startsWith('__IMAGE_PRINT_DATA__:'));
            if (isPosPrinterData) {
                console.log("Detected electron-pos-printer data format. Using advanced printing.");
                return yield printWithElectronPosPrinter(printer, content);
            }
            if (isImageLabel) {
                console.log("Detected image data for label. Using specialized image printing.");
                return yield printImageWithCUPS(printer, content);
            }
            const isLabel = content.includes('Gs.') && content.includes('\x1B\x61\x01');
            console.log(`Print job detected as ${isLabel ? 'LABEL' : 'RECEIPT/TEST'}`);
            if (printer.connectionType === 'usb' && printer.address.includes('ticket-')) {
                console.log("Detected CUPS printer. Using CUPS printing approach.");
                console.log(`Printer address: ${printer.address}`);
                console.log(`Content length: ${content.length} bytes`);
                if (isLabel && content.length < 10) {
                    console.error('Label content too short, might not trigger printing');
                    content += '\n\n\n\n\n\n\n\n\n';
                }
                console.log(`Content preview: ${content.replace(/[\x00-\x1F\x7F-\xFF]/g, '?').substring(0, 30)}...`);
                return yield printWithCUPS(printer, content);
            }
            console.log(`Using node-thermal-printer with interface type: ${printer.connectionType}`);
            return yield printWithNodeThermalPrinter(printer, content);
        }
        catch (error) {
            console.error('Error during printing:', error);
            return false;
        }
    });
}
function printImageWithCUPS(printer, content) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Processing image data for specialized CUPS printing...');
            let imageData = content;
            if (content.includes('__IMAGE_PRINT_DATA__:')) {
                imageData = content.split('__IMAGE_PRINT_DATA__:')[1].trim();
            }
            if (!imageData || (!imageData.startsWith('data:image') && !content.includes('base64'))) {
                console.error('Invalid image data for CUPS printing');
                return false;
            }
            console.log('Valid image data found, preparing for CUPS printing...');
            let base64Data = imageData;
            if (base64Data.startsWith('data:image')) {
                base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
            }
            const imageBuffer = Buffer.from(base64Data, 'base64');
            console.log(`Image buffer created, size: ${imageBuffer.length} bytes`);
            const imageTempFile = path.join(electron_1.app.getPath('temp'), `label-${Date.now()}.png`);
            fs.writeFileSync(imageTempFile, imageBuffer);
            console.log(`Image saved to temp file: ${imageTempFile}`);
            let printerName = printer.name;
            if (printer.connectionType === 'usb' && printer.address.includes('ticket-')) {
                printerName = printer.address.replace('ticket-', '');
            }
            const printCommand = `lp -d "${printerName}" ${imageTempFile}`;
            console.log(`Executing image print command: ${printCommand}`);
            return new Promise((resolve, reject) => {
                (0, child_process_1.exec)(printCommand, (error, stdout, stderr) => {
                    try {
                        fs.unlinkSync(imageTempFile);
                    }
                    catch (e) {
                        console.error('Failed to delete temp image file:', e);
                    }
                    if (error) {
                        console.error(`CUPS image printing error: ${error.message}`);
                        console.error(`stderr: ${stderr}`);
                        reject(error);
                        return;
                    }
                    console.log(`CUPS image printing stdout: ${stdout}`);
                    console.log("CUPS image printing done!");
                    resolve(true);
                });
            });
        }
        catch (err) {
            console.error('Error handling image data for CUPS:', err);
            return false;
        }
    });
}
function printWithCUPS(printer, content) {
    return __awaiter(this, void 0, void 0, function* () {
        const isImagePrint = content.includes('__IMAGE_PRINT_DATA__:');
        const isLabel = content.includes('Gs.') && content.includes('\x1B\x61\x01');
        const isRotatedLabel = (isLabel || isImagePrint) && (content.includes('\x1B\x54\x01') ||
            content.includes('\x1D\x7C\x01') ||
            content.includes('\x1B\x56\x01'));
        const tempFile = path.join(electron_1.app.getPath('temp'), `receipt-${Date.now()}.txt`);
        if (isImagePrint) {
            try {
                console.log('Processing image data for CUPS printing...');
                const imageData = content.split('__IMAGE_PRINT_DATA__:')[1].trim();
                if (!imageData || !imageData.startsWith('data:image')) {
                    console.error('Invalid image data for CUPS printing');
                    return false;
                }
                console.log('Valid image data found, preparing for CUPS printing...');
                console.log(`Image data length: ${imageData.length} bytes`);
                const imageBuffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
                console.log(`Image buffer created, size: ${imageBuffer.length} bytes`);
                const imageTempFile = path.join(electron_1.app.getPath('temp'), `label-${Date.now()}.png`);
                fs.writeFileSync(imageTempFile, imageBuffer);
                console.log(`Image saved to temp file: ${imageTempFile}`);
                const orientationOption = isRotatedLabel ? '-o orientation-requested=4' : '';
                const printCommand = `lp -d "${printer.address.replace('ticket-', '')}" ${orientationOption} ${imageTempFile}`;
                console.log(`Executing image print command: ${printCommand}`);
                return new Promise((resolve, reject) => {
                    (0, child_process_1.exec)(printCommand, (error, stdout, stderr) => {
                        try {
                            fs.unlinkSync(imageTempFile);
                        }
                        catch (e) {
                            console.error('Failed to delete temp image file:', e);
                        }
                        if (error) {
                            console.error(`CUPS image printing error: ${error.message}`);
                            console.error(`stderr: ${stderr}`);
                            reject(error);
                            return;
                        }
                        console.log(`CUPS image printing stdout: ${stdout}`);
                        console.log("CUPS image printing done!");
                        resolve(true);
                    });
                });
            }
            catch (err) {
                console.error('Error handling image data for CUPS:', err);
                return false;
            }
        }
        else if (isLabel) {
            if (!content.includes('\f') && !content.includes('\x0C')) {
                content += '\x0C';
            }
            if (isRotatedLabel) {
                console.log('Detected rotated text for CUPS printing - using enhanced rotation mode');
                fs.writeFileSync(tempFile, content, { encoding: 'binary' });
                const printCommand = `lp -d "${printer.address.replace('ticket-', '')}" -o raw -o orientation-requested=4 ${tempFile}`;
                console.log(`Executing rotated label print command: ${printCommand}`);
                return new Promise((resolve, reject) => {
                    (0, child_process_1.exec)(printCommand, (error, stdout, stderr) => {
                        try {
                            fs.unlinkSync(tempFile);
                        }
                        catch (e) {
                            console.error('Failed to delete temp file:', e);
                        }
                        if (error) {
                            console.error(`CUPS rotated label printing error: ${error.message}`);
                            console.error(`stderr: ${stderr}`);
                            reject(error);
                            return;
                        }
                        console.log(`CUPS rotated label printing stdout: ${stdout}`);
                        console.log("CUPS rotated label printing done!");
                        resolve(true);
                    });
                });
            }
            else {
                fs.writeFileSync(tempFile, content, { encoding: 'binary' });
                const printCommand = `lp -d "${printer.address.replace('ticket-', '')}" -o raw ${tempFile}`;
                console.log(`Executing label print command: ${printCommand}`);
                return new Promise((resolve, reject) => {
                    (0, child_process_1.exec)(printCommand, (error, stdout, stderr) => {
                        try {
                            fs.unlinkSync(tempFile);
                        }
                        catch (e) {
                            console.error('Failed to delete temp file:', e);
                        }
                        if (error) {
                            console.error(`CUPS label printing error: ${error.message}`);
                            console.error(`stderr: ${stderr}`);
                            reject(error);
                            return;
                        }
                        console.log(`CUPS label printing stdout: ${stdout}`);
                        console.log("CUPS label printing done!");
                        resolve(true);
                    });
                });
            }
        }
        else {
            fs.writeFileSync(tempFile, content, 'utf8');
            const printCommand = `lp -d "${printer.address.replace('ticket-', '')}" ${tempFile}`;
            console.log(`Executing standard print command: ${printCommand}`);
            return new Promise((resolve, reject) => {
                (0, child_process_1.exec)(printCommand, (error, stdout, stderr) => {
                    try {
                        fs.unlinkSync(tempFile);
                    }
                    catch (e) {
                        console.error('Failed to delete temp file:', e);
                    }
                    if (error) {
                        console.error(`CUPS printing error: ${error.message}`);
                        console.error(`stderr: ${stderr}`);
                        reject(error);
                        return;
                    }
                    console.log(`CUPS printing stdout: ${stdout}`);
                    console.log("CUPS printing done!");
                    resolve(true);
                });
            });
        }
    });
}
function printWithNodeThermalPrinter(printer, content) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');
            let interfaceConfig;
            if (printer.connectionType === 'network') {
                interfaceConfig = `tcp://${printer.address}:${printer.port || 9100}`;
            }
            else if (printer.connectionType === 'usb') {
                interfaceConfig = printer.address;
            }
            else if (printer.connectionType === 'bluetooth') {
                interfaceConfig = `bt:${printer.address}`;
            }
            else {
                interfaceConfig = printer.address;
            }
            console.log(`Using printer interface: ${interfaceConfig}`);
            const characterSet = printer.characterSet ? getCharacterSet(printer.characterSet, CharacterSet) : CharacterSet.PC437_USA;
            const thermalPrinter = new ThermalPrinter({
                type: getPrinterType(printer.type, PrinterTypes),
                interface: interfaceConfig,
                options: {
                    timeout: 5000
                },
                width: printer.width || 48,
                characterSet: characterSet,
            });
            const isConnected = yield thermalPrinter.isPrinterConnected();
            if (!isConnected) {
                console.error('Printer is not connected');
                return false;
            }
            if (content.includes('__IMAGE_PRINT_DATA__:')) {
                console.log('Detected image print request for node-thermal-printer');
                const imageData = content.split('__IMAGE_PRINT_DATA__:')[1].trim();
                if (!imageData || !imageData.startsWith('data:image')) {
                    console.error('Invalid image data for node-thermal-printer');
                    return false;
                }
                console.log('Valid image data found, preparing for printing...');
                console.log(`Image data length: ${imageData.length} bytes`);
                thermalPrinter.clear();
                thermalPrinter.initialize();
                thermalPrinter.alignCenter();
                const imgBuffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
                console.log(`Image buffer created, size: ${imgBuffer.length} bytes`);
                console.log('Sending image to printer...');
                thermalPrinter.printImage(imgBuffer);
                thermalPrinter.newLine();
                thermalPrinter.cut();
                console.log('Executing print job...');
                yield thermalPrinter.execute();
                console.log("Image print done!");
                return true;
            }
            else {
                thermalPrinter.alignCenter();
                thermalPrinter.println(content);
                thermalPrinter.cut();
                yield thermalPrinter.execute();
                console.log("Print done!");
                return true;
            }
        }
        catch (error) {
            console.error('Error in printWithNodeThermalPrinter:', error);
            return false;
        }
    });
}
function getPrinterType(type, PrinterTypes) {
    switch (type.toLowerCase()) {
        case 'epson':
            return PrinterTypes.EPSON;
        case 'star':
            return PrinterTypes.STAR;
        default:
            return PrinterTypes.EPSON;
    }
}
function getCharacterSet(charset, CharacterSet) {
    switch (charset) {
        case 'PC437_USA':
            return CharacterSet.PC437_USA;
        case 'PC850_MULTILINGUAL':
            return CharacterSet.PC850_MULTILINGUAL;
        case 'PC860_PORTUGUESE':
            return CharacterSet.PC860_PORTUGUESE;
        case 'PC863_CANADIAN_FRENCH':
            return CharacterSet.PC863_CANADIAN_FRENCH;
        case 'PC865_NORDIC':
            return CharacterSet.PC865_NORDIC;
        case 'PC851_GREEK':
            return CharacterSet.PC851_GREEK;
        case 'PC857_TURKISH':
            return CharacterSet.PC857_TURKISH;
        case 'PC737_GREEK':
            return CharacterSet.PC737_GREEK;
        case 'ISO8859_7_GREEK':
            return CharacterSet.ISO8859_7_GREEK;
        case 'SLOVENIA':
            return CharacterSet.SLOVENIA;
        case 'PC852_LATIN2':
            return CharacterSet.PC852_LATIN2;
        case 'PC858_EURO':
            return CharacterSet.PC858_EURO;
        case 'WPC1252':
            return CharacterSet.WPC1252;
        case 'PC866_CYRILLIC2':
            return CharacterSet.PC866_CYRILLIC2;
        case 'PC852_LATIN2_2':
            return CharacterSet.PC852_LATIN2;
        default:
            return CharacterSet.PC437_USA;
    }
}
function generateReceiptContent(order, orderItems) {
    if (order.type === 'product-label' && orderItems.length > 0) {
        return orderItems[0].notes || '';
    }
    if (order.type === 'image-label' && orderItems.length > 0 && orderItems[0].isImage) {
        const imageData = orderItems[0].notes;
        console.log('Image label detected, using specialized image handling');
        return imageData;
    }
    const dateTime = new Date(order.orderTime || new Date()).toLocaleString();
    let content = `
==============================
         YOUR BUSINESS
==============================
Order #: ${order.id || 'N/A'}
Date: ${dateTime}
Customer: ${order.customerName || 'N/A'}
Table: ${order.tableNumber || 'N/A'}
------------------------------
ITEMS
------------------------------
`;
    let subtotal = 0;
    for (const item of orderItems) {
        const product = item.product || {};
        const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
        const quantity = typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 1;
        const lineTotal = price * quantity;
        subtotal += lineTotal;
        content += `${product.name || 'Unknown Item'}
${quantity} x ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = ${lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
${item.notes && !item.notes.includes('__POS_PRINTER_DATA__:') ? `Note: ${item.notes}` : ''}
------------------------------
`;
    }
    const totalAmount = typeof order.totalAmount === 'number' ? order.totalAmount : parseFloat(order.totalAmount) || subtotal;
    content += `
SUBTOTAL: ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
TAX: ${(subtotal * 0.08).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
TOTAL: ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
==============================
        THANK YOU!
   PLEASE COME AGAIN SOON
==============================
`;
    return content;
}
function generateTestPageContent(printer) {
    return `
==============================
         TEST PAGE
==============================
Printer: ${printer.name}
Type: ${printer.type}
Connection: ${printer.connectionType}
Address: ${printer.address}
${printer.port ? `Port: ${printer.port}` : ''}
------------------------------
This is a test page to verify
that your printer is working
correctly with your application.
==============================
If you can read this message,
your printer is correctly
configured and working!
==============================
        THANK YOU!
==============================
`;
}
function printWithElectronPosPrinter(printer, content) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let data;
            try {
                if (content.startsWith('__POS_PRINTER_DATA__:')) {
                    const jsonContent = content.replace('__POS_PRINTER_DATA__:', '');
                    console.log(`Parsing JSON content, length: ${jsonContent.length}`);
                    data = JSON.parse(jsonContent);
                    const hasImage = data.some(item => item.type === 'image');
                    if (hasImage) {
                        console.log('Image data detected in print job - WARNING: electron-pos-printer may fail with very long base64 strings');
                        data = data.map(item => {
                            if (item.type === 'image' && item.path && item.path.startsWith('data:image')) {
                                console.log('Converting image item to text to avoid ENAMETOOLONG error');
                                return {
                                    type: 'text',
                                    value: 'Image label - processed separately',
                                    style: {
                                        fontSize: '12px',
                                        textAlign: 'center',
                                        marginBottom: '10px'
                                    }
                                };
                            }
                            return item;
                        });
                    }
                }
                else {
                    data = [{ type: 'text', value: content }];
                }
            }
            catch (error) {
                console.error('Error parsing print data:', error);
                data = [{ type: 'text', value: content }];
            }
            let printerName = printer.name;
            if (printer.connectionType === 'usb' && printer.address.includes('ticket-')) {
                printerName = printer.address.replace('ticket-', '');
            }
            else if (printer.connectionType === 'network') {
                printerName = `${printer.address}:${printer.port || 9100}`;
            }
            else {
                printerName = printer.address;
            }
            const printerWidth = printer.width || 48;
            const paperWidth = printerWidth <= 48 ? '58mm' : '80mm';
            const options = {
                preview: false,
                width: paperWidth,
                margin: '0 0 0 0',
                copies: 1,
                printerName: printerName,
                timeOutPerLine: 400,
                silent: false,
                printer: printer.type
            };
            console.log(`Printing with electron-pos-printer to "${printerName}" (${printer.type})`);
            console.log('Printer options:', JSON.stringify(options));
            return new Promise((resolve, reject) => {
                electron_pos_printer_1.PosPrinter.print(data, options)
                    .then(() => {
                    console.log('Print completed successfully');
                    resolve(true);
                })
                    .catch((error) => {
                    console.error('Error printing with electron-pos-printer:', error);
                    reject(error);
                });
            });
        }
        catch (error) {
            console.error('Error in printWithElectronPosPrinter:', error);
            return false;
        }
    });
}
//# sourceMappingURL=main.js.map