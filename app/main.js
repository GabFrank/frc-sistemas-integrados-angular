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
const child_process_1 = require("child_process");
const electron_pos_printer_1 = require("electron-pos-printer");
const log = require('electron-log');
const isDev = require('electron-is-dev');
// Store printers configuration globally
let printers = [];
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
let win;
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
        });
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
            // win = null;
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
        // Generate test page content
        const content = generateTestPageContent(printer);
        // Print the test page
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
        // Generate receipt content
        const content = generateReceiptContent(order, orderItems);
        // Print the receipt
        const success = yield printThermalReceipt(printer, content);
        return { success };
    }
    catch (error) {
        console.error('Error printing receipt:', error);
        return { success: false, error: error.message };
    }
}));
// Register IPC handlers for the simplified printer API
function registerPrinterIpcHandlers() {
    // Get system printers using webContents.getPrintersAsync()
    ipcMain.handle('get-system-printers', () => __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Getting system printers');
            const mainWindow = electron_1.BrowserWindow.getFocusedWindow();
            if (!mainWindow) {
                console.error('No focused window found');
                return [];
            }
            // Use getPrintersAsync instead of getPrinters
            const printers = yield mainWindow.webContents.getPrintersAsync();
            console.log(`Found ${printers.length} system printers`);
            return printers;
        }
        catch (error) {
            console.error('Error getting system printers:', error);
            return [];
        }
    }));
    // Print using electron-pos-printer
    ipcMain.handle('print-with-pos-printer', (event, args) => __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('print-with-pos-printer called with args:', JSON.stringify(args, (key, value) => {
                // Don't log the full base64 image data to avoid console log overflow
                if (key === 'path' && typeof value === 'string' && value.startsWith('data:image')) {
                    return 'data:image... [truncated]';
                }
                return value;
            }));
            const { data, options } = args;
            // Validate arguments
            if (!data || !Array.isArray(data)) {
                console.error('Invalid data for printing - not an array');
                return { success: false, error: 'Invalid data for printing' };
            }
            if (!options || !options.printerName) {
                console.error('Invalid printer options - missing printerName');
                return { success: false, error: 'Invalid printer options' };
            }
            // Deep clone the data to avoid modifying the original
            let printData = JSON.parse(JSON.stringify(data));
            // Ensure each item has valid properties and styles to avoid the "TypeError: Cannot convert undefined or null to object" error
            for (let i = 0; i < printData.length; i++) {
                const item = printData[i];
                // Ensure style is an object if it exists or initialize it if it doesn't
                if (item.style === null || item.style === undefined) {
                    printData[i].style = {};
                }
                // Process item type specific properties
                switch (item.type) {
                    case 'text':
                        // Ensure value is a string
                        if (item.value === null || item.value === undefined) {
                            printData[i].value = '';
                        }
                        break;
                    case 'image':
                        // Fix null paths
                        if (!item.path) {
                            console.error('Image missing path, removing from print job');
                            // Replace with a placeholder text instead
                            printData[i] = {
                                type: 'text',
                                value: '[Image placeholder]',
                                style: { textAlign: 'center' }
                            };
                        }
                        break;
                    case 'barCode':
                        // Ensure barcode properties
                        if (!item.value) {
                            console.error('Barcode missing value, replacing with placeholder');
                            printData[i].value = '12345678';
                        }
                        // Ensure we have valid barcode properties
                        printData[i].height = item.height || 40;
                        printData[i].width = item.width || 2;
                        printData[i].position = item.position || 'center';
                        printData[i].displayValue = item.displayValue !== undefined ? item.displayValue : true;
                        break;
                    case 'qrCode':
                        // Ensure QR code properties
                        if (!item.value) {
                            console.error('QR code missing value, replacing with placeholder');
                            printData[i].value = 'https://example.com';
                        }
                        // Ensure we have valid QR code properties
                        printData[i].height = item.height || 150;
                        printData[i].width = item.width || 150;
                        printData[i].position = item.position || 'center';
                        break;
                }
            }
            // Check for image-based printing which can cause ENAMETOOLONG errors
            const imageItems = printData.filter(item => (item.type === 'image' && item.path && item.path.startsWith('data:image')) ||
                (item.style && item.style.backgroundImage && item.style.backgroundImage.startsWith('data:image')));
            if (imageItems.length > 0) {
                console.log(`Detected ${imageItems.length} image items in print job`);
                // Handle image items by saving to temp files
                const tmpDir = path.join(electron_1.app.getPath('temp'), 'pos-printer-images');
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }
                // Process each image item
                for (let i = 0; i < printData.length; i++) {
                    const item = printData[i];
                    // Handle direct image items
                    if (item.type === 'image' && item.path && item.path.startsWith('data:image')) {
                        try {
                            const timestamp = Date.now();
                            const imgPath = path.join(tmpDir, `img-${timestamp}-${i}.png`);
                            // Extract base64 data
                            const base64Data = item.path.split(';base64,').pop();
                            if (base64Data) {
                                // Save to temp file
                                fs.writeFileSync(imgPath, Buffer.from(base64Data, 'base64'));
                                // Update item to use file path instead of base64
                                printData[i].path = imgPath;
                                console.log(`Saved image ${i} to temp file: ${imgPath}`);
                            }
                        }
                        catch (err) {
                            console.error(`Error handling image ${i}:`, err);
                        }
                    }
                    // Handle background images in style
                    if (item.style && item.style.backgroundImage && item.style.backgroundImage.startsWith('data:image')) {
                        try {
                            const timestamp = Date.now();
                            const imgPath = path.join(tmpDir, `bg-${timestamp}-${i}.png`);
                            // Extract base64 data
                            const base64Data = item.style.backgroundImage.split(';base64,').pop();
                            if (base64Data) {
                                // Save to temp file
                                fs.writeFileSync(imgPath, Buffer.from(base64Data, 'base64'));
                                // Update style to use file path
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
            // ESC/POS RAW path on Linux (non-network printers) when not Xprinter
            try {
                const isLinux = process.platform === 'linux';
                const isNetwork = typeof options.printerName === 'string' && options.printerName.includes('://');
                const isXprinter = typeof options.printerName === 'string' && (options.printerName.toLowerCase().includes('xprinter') || options.printerName.toLowerCase().includes('xp-'));
                if (isLinux && !isNetwork && !isXprinter) {
                    const buildEscPos = () => {
                        const chunks = [];
                        const push = (b) => chunks.push(Buffer.isBuffer(b) ? b : Buffer.from(b));
                        const textEnc = (s) => Buffer.from((s || '').replace(/\n/g, '\r\n'), 'ascii');
                        push([0x1B, 0x40]); // init
                        for (const item of printData) {
                            if (item.type === 'text') {
                                const center = item.style && item.style.textAlign === 'center';
                                push([0x1B, 0x61, center ? 0x01 : 0x00]);
                                let mode = 0x00;
                                const size = parseInt((item.style && item.style.fontSize || '12px').toString().replace('px', ''), 10);
                                if (item.style && item.style.fontWeight === 'bold')
                                    mode |= 0x08;
                                if (size >= 18)
                                    mode |= 0x20; // double height approx
                                push([0x1B, 0x21, mode]);
                                push(textEnc((item.value || '') + '\n'));
                                push([0x1B, 0x21, 0x00]);
                                push([0x1B, 0x61, 0x00]);
                            }
                            else if (item.type === 'barCode' || item.type === 'barcode') {
                                const value = ((item.value || '').toString().replace(/[^0-9]/g, ''));
                                if (value.length >= 8) {
                                    push([0x1B, 0x61, 0x01]); // center
                                    push([0x1D, 0x48, 0x02]); // HRI below
                                    push([0x1D, 0x68, 60]); // height
                                    push([0x1D, 0x77, 2]); // width
                                    push([0x1D, 0x6B, 0x43, value.length]); // EAN13
                                    push(Buffer.from(value, 'ascii'));
                                    push(textEnc('\n\n'));
                                    push([0x1B, 0x61, 0x00]);
                                }
                            }
                            else if (item.type === 'qrCode' || item.type === 'qrcode') {
                                const val = (item.value || '').toString();
                                push([0x1B, 0x61, 0x01]);
                                push([0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]); // model 2
                                push([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x06]); // size
                                push([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x01]); // ECC M
                                const dataBuf = Buffer.from(val, 'ascii');
                                const pL = (dataBuf.length + 3) & 0xFF;
                                const pH = ((dataBuf.length + 3) >> 8) & 0xFF;
                                push([0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30]);
                                push(dataBuf);
                                push([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]); // print
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
            // Xprinter EPL path on Linux (label printers)
            try {
                const isLinux = process.platform === 'linux';
                const isXprinter = typeof options.printerName === 'string' && (options.printerName.toLowerCase().includes('xprinter') || options.printerName.toLowerCase().includes('xp-'));
                if (isLinux && isXprinter) {
                    const labelWidth = 320; // 40mm at 203dpi
                    const labelHeight = 320;
                    // Ajustes empíricos de ancho/alto de carácter para centrado en XPrinter
                    // Reducimos charWidth de fuente 4 para centrar mejor el precio
                    const charWidth = { 1: 7, 2: 9, 3: 11, 4: 14 };
                    const lineHeight = { 1: 12, 2: 14, 3: 18, 4: 26 };
                    const centerX = (text, fontNum) => {
                        const w = charWidth[fontNum] || 10;
                        const len = (text || '').length;
                        return Math.max(0, Math.floor((labelWidth - (w * len)) / 2));
                    };
                    // Improved wrap function that respects word boundaries and allows more lines
                    const wrap = (text, fontNum, maxDots) => {
                        const w = charWidth[fontNum] || 10;
                        // Allow more characters per line (at least 20 chars for font 3)
                        const maxChars = Math.max(20, Math.floor(maxDots / w));
                        const words = (text || '').trim().split(/\s+/);
                        const out = [];
                        let line = '';
                        for (const word of words) {
                            const testLine = line ? line + ' ' + word : word;
                            if (testLine.length <= maxChars) {
                                line = testLine;
                            }
                            else {
                                if (line)
                                    out.push(line);
                                // If a single word is too long, split it (shouldn't happen normally)
                                if (word.length > maxChars) {
                                    let i = 0;
                                    while (i < word.length) {
                                        out.push(word.substring(i, i + maxChars));
                                        i += maxChars;
                                    }
                                    line = '';
                                }
                                else {
                                    line = word;
                                }
                            }
                        }
                        if (line)
                            out.push(line);
                        // Allow up to 4 lines for product names
                        return out.slice(0, 4);
                    };
                    const texts = printData.filter(i => i.type === 'text').map(i => (i.value || '').toString());
                    const nameTexts = texts.filter(t => t && !t.includes('Gs.') && !/\b(fabricado|fab:)\b/i.test(t));
                    const nameLinesPrepared = nameTexts.length > 0 ? nameTexts : [];
                    const nameText = nameLinesPrepared.join(' ').trim();
                    // Obtener precio de forma robusta
                    let priceText = texts.find(t => /(^|\s)Gs\.?/i.test(t)) || '';
                    if (!priceText) {
                        const candidate = texts.find(t => /\d/.test(t));
                        if (candidate)
                            priceText = candidate;
                    }
                    // Buscar fecha de forma más robusta: "Fab:" o "Fabricado"
                    let dateText = texts.find(t => /fab[:]?\s*/i.test(t) || /fabricado/i.test(t)) || '';
                    console.log('[EPL] All texts:', texts);
                    console.log('[EPL] Found dateText:', dateText);
                    const barcodeItem = printData.find(i => i.type === 'barCode' || i.type === 'barcode');
                    const qrItem = printData.find(i => i.type === 'qrCode' || i.type === 'qrcode');
                    let epl = 'SIZE 40 mm,40 mm\nGAP 3 mm,0\nCLS\n';
                    let y = 10; // Start closer to top
                    // Nombre del producto: fuente 3, máx 2 líneas, tope 35mm (280 dots)
                    const maxDotsForName = 280; // 35mm @ 203dpi
                    let nameLines = [];
                    if (nameLinesPrepared.length > 0) {
                        for (const line of nameLinesPrepared) {
                            const wrapped = wrap(line, 3, Math.min(labelWidth - 12, maxDotsForName));
                            nameLines.push(...wrapped);
                        }
                    }
                    if (nameLines.length === 0 && nameText) {
                        nameLines = wrap(nameText, 3, Math.min(labelWidth - 12, maxDotsForName));
                    }
                    if (nameLines.length === 1 && nameLines[0].length > Math.floor(maxDotsForName / (charWidth[3] || 10))) {
                        const firstLineWords = nameLines[0].split(/\s+/);
                        if (firstLineWords.length > 1) {
                            const lastWord = firstLineWords.pop();
                            nameLines[0] = firstLineWords.join(' ');
                            if (lastWord) {
                                nameLines.splice(1, 0, lastWord);
                            }
                        }
                    }
                    nameLines = nameLines.filter(l => !!l).slice(0, 2);
                    for (const line of nameLines) {
                        const x = Math.max(0, centerX(line, 3) - 16);
                        epl += `TEXT ${x},${y},"3",0,1,1,"${line.replace(/"/g, '\\"')}"\n`;
                        y += (lineHeight[3] || 18) + 6;
                    }
                    // Add extra space after name
                    y += 10;
                    // Bajar precio 5mm (agregar 40 dots de espacio) y luego subir 1mm (restar 8 dots)
                    y += 40;
                    y -= 8; // subir precio 1mm
                    if (priceText) {
                        // Centrar y mover 4mm a la izquierda (~32 dots)
                        let x = centerX(priceText, 4) - 32;
                        if (x < 0)
                            x = 0;
                        epl += `TEXT ${x},${y},"4",0,1,1,"${priceText.replace(/"/g, '\\"')}"\n`;
                        y += (lineHeight[4] || 26) + 12; // más espacio antes de la fecha
                    }
                    // Bajar fecha 5mm (agregar 40 dots de espacio) y luego subir 2mm (restar 16 dots)
                    y += 40;
                    y -= 16; // subir 2mm
                    if (dateText) {
                        // Use font 3 (12pt) - más grande que fuente 2
                        const dateLen = dateText.length;
                        const dateWidth = (charWidth[3] || 11) * dateLen;
                        let x;
                        if (dateWidth <= labelWidth - 10) {
                            // Center if it fits
                            x = centerX(dateText, 3);
                        }
                        else {
                            // Left align if too long
                            x = 10;
                        }
                        // mover 1mm a la derecha respecto al ajuste previo (quedar en -16 dots desde el centro)
                        x = Math.max(0, x - 16);
                        const dateLine = `TEXT ${x},${y},"3",0,1,1,"${dateText.replace(/"/g, '\\"')}"\n`;
                        console.log('[EPL] Adding date text:', dateLine);
                        epl += dateLine;
                        y += (lineHeight[3] || 18) + 12;
                    }
                    else {
                        console.warn('[EPL] No dateText found! Available texts:', texts);
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
                                    console.warn('[EPL] Barcode data too short for EAN13, skipping');
                                    barcodeVal = '';
                                }
                            }
                            else {
                                commandType = barcodeType;
                            }
                            if (barcodeVal) {
                                const digitsOnlyForText = rawBarcodeValue.replace(/[^0-9]/g, '');
                                const barcodeHeight = 60; // Height of barcode
                                // Aproximated width for 40mm label at 203dpi
                                const barcodeWidth = 200;
                                const bx = Math.max(0, Math.floor((labelWidth - barcodeWidth) / 2) - 16);
                                const by = Math.max(180, y + 32);
                                const escapedBarcode = barcodeVal.replace(/"/g, '\\"');
                                epl += `BARCODE ${bx},${by},"${commandType}",${barcodeHeight},0,0,2,2,"${escapedBarcode}"\n`;
                                if (digitsOnlyForText) {
                                    const barcodeTextFont = 2;
                                    const textWidthDots = (charWidth[barcodeTextFont] || 9) * digitsOnlyForText.length;
                                    const textX = Math.max(0, Math.floor((labelWidth - textWidthDots) / 2));
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
                    console.log('[EPL] Generated EPL commands:\n' + epl);
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
            // Ensure options object is properly configured
            const printOptions = Object.assign(Object.assign({}, options), { silent: options.silent !== undefined ? options.silent : true, preview: options.preview !== undefined ? options.preview : false, width: options.width || '58mm', margin: options.margin || '0 0 0 0', copies: options.copies || 1, timeOutPerLine: options.timeOutPerLine || 400 });
            console.log('Using print options:', JSON.stringify(printOptions));
            try {
                // Print using electron-pos-printer
                yield electron_pos_printer_1.PosPrinter.print(printData, printOptions);
                console.log('Print completed successfully');
                // Clean up any temp files after printing
                setTimeout(() => {
                    try {
                        const tmpDir = path.join(electron_1.app.getPath('temp'), 'pos-printer-images');
                        if (fs.existsSync(tmpDir)) {
                            // Delete files but keep directory
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
        // Initialize window and register handlers here to ensure we only create one window
        createWindow().then(() => {
            registerPrinterIpcHandlers();
        });
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
    // Add macOS activate handler here instead
    electron_1.app.on("activate", function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
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
/**
 * Thermal Printer Functions
 */
/**
 * Main function to print content to a thermal receipt printer
 * @param printer The printer configuration object
 * @param content The content to print
 * @returns Promise<boolean> Success or failure
 */
function printThermalReceipt(printer, content) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // If no printer is found, log an error and return false
            if (!printer) {
                console.error('Printer not found');
                return false;
            }
            console.log(`Using printer: ${printer.name} (${printer.id}) of type ${printer.type}`);
            // Check if this is data for the new electron-pos-printer format
            const isPosPrinterData = content.includes('__POS_PRINTER_DATA__:');
            // Check if this is image data for special handling
            const isImageLabel = content.includes('data:image/') &&
                (content.includes('base64') || content.startsWith('__IMAGE_PRINT_DATA__:'));
            // If it's our new format, use electron-pos-printer
            if (isPosPrinterData) {
                console.log("Detected electron-pos-printer data format. Using advanced printing.");
                return yield printWithElectronPosPrinter(printer, content);
            }
            // If it's image data, handle it specially
            if (isImageLabel) {
                console.log("Detected image data for label. Using specialized image printing.");
                return yield printImageWithCUPS(printer, content);
            }
            // Determine if this is a product label
            const isLabel = content.includes('Gs.') && content.includes('\x1B\x61\x01');
            console.log(`Print job detected as ${isLabel ? 'LABEL' : 'RECEIPT/TEST'}`);
            // Special handling for CUPS printers on macOS/Linux
            if (printer.connectionType === 'usb' && printer.address.includes('ticket-')) {
                console.log("Detected CUPS printer. Using CUPS printing approach.");
                console.log(`Printer address: ${printer.address}`);
                console.log(`Content length: ${content.length} bytes`);
                // If this is a label, make sure we have some minimum content length for CUPS
                if (isLabel && content.length < 10) {
                    console.error('Label content too short, might not trigger printing');
                    content += '\n\n\n\n\n\n\n\n\n'; // Add some padding to ensure printing
                }
                // Log the first few characters for debugging (avoiding control chars)
                console.log(`Content preview: ${content.replace(/[\x00-\x1F\x7F-\xFF]/g, '?').substring(0, 30)}...`);
                return yield printWithCUPS(printer, content);
            }
            // Regular thermal printer printing for non-CUPS printers
            console.log(`Using node-thermal-printer with interface type: ${printer.connectionType}`);
            return yield printWithNodeThermalPrinter(printer, content);
        }
        catch (error) {
            console.error('Error during printing:', error);
            return false;
        }
    });
}
/**
 * Special function to print an image with CUPS - resolves the name too long issue
 * @param printer Printer configuration
 * @param content Image data content
 * @returns Promise<boolean> Success or failure
 */
function printImageWithCUPS(printer, content) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Processing image data for specialized CUPS printing...');
            // Extract the base64 image data
            let imageData = content;
            if (content.includes('__IMAGE_PRINT_DATA__:')) {
                imageData = content.split('__IMAGE_PRINT_DATA__:')[1].trim();
            }
            // Check if we have valid base64 data
            if (!imageData || (!imageData.startsWith('data:image') && !content.includes('base64'))) {
                console.error('Invalid image data for CUPS printing');
                return false;
            }
            console.log('Valid image data found, preparing for CUPS printing...');
            // For CUPS, we need to save as an image file first
            let base64Data = imageData;
            if (base64Data.startsWith('data:image')) {
                base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
            }
            const imageBuffer = Buffer.from(base64Data, 'base64');
            console.log(`Image buffer created, size: ${imageBuffer.length} bytes`);
            // Save to a temporary PNG file
            const imageTempFile = path.join(electron_1.app.getPath('temp'), `label-${Date.now()}.png`);
            fs.writeFileSync(imageTempFile, imageBuffer);
            console.log(`Image saved to temp file: ${imageTempFile}`);
            // Get printer name properly for CUPS
            let printerName = printer.name;
            if (printer.connectionType === 'usb' && printer.address.includes('ticket-')) {
                printerName = printer.address.replace('ticket-', '');
            }
            // Use lp with image file
            const printCommand = `lp -d "${printerName}" ${imageTempFile}`;
            console.log(`Executing image print command: ${printCommand}`);
            return new Promise((resolve, reject) => {
                (0, child_process_1.exec)(printCommand, (error, stdout, stderr) => {
                    // Clean up the temp file
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
/**
 * Print using CUPS (Common Unix Printing System) on macOS/Linux
 * @param printer Printer configuration
 * @param content Content to print
 * @returns Promise<boolean> Success or failure
 */
function printWithCUPS(printer, content) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check if this is an image print request
        const isImagePrint = content.includes('__IMAGE_PRINT_DATA__:');
        // Special handling for product labels
        const isLabel = content.includes('Gs.') && content.includes('\x1B\x61\x01');
        // Check if this is a rotated (landscape) label
        // Look for any of the rotation commands we might use
        const isRotatedLabel = (isLabel || isImagePrint) && (content.includes('\x1B\x54\x01') || // ESC T 1 - Print direction 90 degrees
            content.includes('\x1D\x7C\x01') || // GS | 1 - Turn 90 degrees
            content.includes('\x1B\x56\x01') // ESC V 1 - 90 degree rotation
        );
        // Create a temporary file for the content
        const tempFile = path.join(electron_1.app.getPath('temp'), `receipt-${Date.now()}.txt`);
        // Handle image printing differently
        if (isImagePrint) {
            try {
                console.log('Processing image data for CUPS printing...');
                // Extract the base64 image data
                const imageData = content.split('__IMAGE_PRINT_DATA__:')[1].trim();
                // Check if we have valid base64 data
                if (!imageData || !imageData.startsWith('data:image')) {
                    console.error('Invalid image data for CUPS printing');
                    return false;
                }
                console.log('Valid image data found, preparing for CUPS printing...');
                console.log(`Image data length: ${imageData.length} bytes`);
                // For CUPS, we need to save as an image file first
                const imageBuffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
                console.log(`Image buffer created, size: ${imageBuffer.length} bytes`);
                // Save to a temporary PNG file
                const imageTempFile = path.join(electron_1.app.getPath('temp'), `label-${Date.now()}.png`);
                fs.writeFileSync(imageTempFile, imageBuffer);
                console.log(`Image saved to temp file: ${imageTempFile}`);
                // Determine print options based on orientation
                const orientationOption = isRotatedLabel ? '-o orientation-requested=4' : '';
                // Use lp with image file
                const printCommand = `lp -d "${printer.address.replace('ticket-', '')}" ${orientationOption} ${imageTempFile}`;
                console.log(`Executing image print command: ${printCommand}`);
                return new Promise((resolve, reject) => {
                    (0, child_process_1.exec)(printCommand, (error, stdout, stderr) => {
                        // Clean up the temp file
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
            // For labels, we need to ensure raw printing mode and proper page formatting
            // Add a form feed character at the end if not present
            if (!content.includes('\f') && !content.includes('\x0C')) {
                content += '\x0C'; // Form feed character
            }
            // For rotated text in CUPS, we need special handling
            if (isRotatedLabel) {
                console.log('Detected rotated text for CUPS printing - using enhanced rotation mode');
                // Force raw mode to ensure control characters are passed through
                fs.writeFileSync(tempFile, content, { encoding: 'binary' });
                // Use lp with raw mode and landscape orientation for rotated labels
                const printCommand = `lp -d "${printer.address.replace('ticket-', '')}" -o raw -o orientation-requested=4 ${tempFile}`;
                console.log(`Executing rotated label print command: ${printCommand}`);
                return new Promise((resolve, reject) => {
                    (0, child_process_1.exec)(printCommand, (error, stdout, stderr) => {
                        // Clean up the temp file
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
                // For regular (non-rotated) labels
                // Force raw mode to ensure control characters are passed through
                fs.writeFileSync(tempFile, content, { encoding: 'binary' });
                // Use lp with raw mode for labels to ensure ESC/POS commands work
                const printCommand = `lp -d "${printer.address.replace('ticket-', '')}" -o raw ${tempFile}`;
                console.log(`Executing label print command: ${printCommand}`);
                return new Promise((resolve, reject) => {
                    (0, child_process_1.exec)(printCommand, (error, stdout, stderr) => {
                        // Clean up the temp file
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
            // For regular receipts and test pages, use the standard approach
            fs.writeFileSync(tempFile, content, 'utf8');
            // Standard CUPS printing command
            const printCommand = `lp -d "${printer.address.replace('ticket-', '')}" ${tempFile}`;
            console.log(`Executing standard print command: ${printCommand}`);
            return new Promise((resolve, reject) => {
                (0, child_process_1.exec)(printCommand, (error, stdout, stderr) => {
                    // Clean up the temp file
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
/**
 * Print using node-thermal-printer library
 * @param printer Printer configuration
 * @param content Content to print
 * @returns Promise<boolean> Success or failure
 */
function printWithNodeThermalPrinter(printer, content) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Dynamically import node-thermal-printer to avoid issues when it's not installed
            const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');
            // Create interface string based on connection type
            let interfaceConfig;
            if (printer.connectionType === 'network') {
                // For regular network printers
                interfaceConfig = `tcp://${printer.address}:${printer.port || 9100}`;
            }
            else if (printer.connectionType === 'usb') {
                // For USB connected printers
                interfaceConfig = printer.address;
            }
            else if (printer.connectionType === 'bluetooth') {
                // For Bluetooth printers
                interfaceConfig = `bt:${printer.address}`;
            }
            else {
                // Fallback
                interfaceConfig = printer.address;
            }
            console.log(`Using printer interface: ${interfaceConfig}`);
            // Get the character set from the CharacterSet enum
            const characterSet = printer.characterSet ? getCharacterSet(printer.characterSet, CharacterSet) : CharacterSet.PC437_USA;
            // Use node-thermal-printer with the right configuration
            const thermalPrinter = new ThermalPrinter({
                type: getPrinterType(printer.type, PrinterTypes),
                interface: interfaceConfig,
                options: {
                    timeout: 5000
                },
                width: printer.width || 48,
                characterSet: characterSet,
            });
            // Check connection
            const isConnected = yield thermalPrinter.isPrinterConnected();
            if (!isConnected) {
                console.error('Printer is not connected');
                return false;
            }
            // Check if this is an image print request
            if (content.includes('__IMAGE_PRINT_DATA__:')) {
                console.log('Detected image print request for node-thermal-printer');
                // Extract the base64 image data
                const imageData = content.split('__IMAGE_PRINT_DATA__:')[1].trim();
                // Check if we have valid base64 data
                if (!imageData || !imageData.startsWith('data:image')) {
                    console.error('Invalid image data for node-thermal-printer');
                    return false;
                }
                console.log('Valid image data found, preparing for printing...');
                console.log(`Image data length: ${imageData.length} bytes`);
                // Initialize the printer and center alignment
                thermalPrinter.clear(); // Clear previous commands
                thermalPrinter.initialize(); // Initialize printer
                thermalPrinter.alignCenter(); // Center the image
                // Convert base64 to image buffer
                const imgBuffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
                console.log(`Image buffer created, size: ${imgBuffer.length} bytes`);
                // Print the image
                console.log('Sending image to printer...');
                thermalPrinter.printImage(imgBuffer);
                // Add a margin at the end and cut
                thermalPrinter.newLine();
                thermalPrinter.cut();
                console.log('Executing print job...');
                yield thermalPrinter.execute();
                console.log("Image print done!");
                return true;
            }
            else {
                // Regular text print
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
/**
 * Map printer type string to node-thermal-printer's PrinterTypes
 * @param type Printer type string ('epson' or 'star')
 * @returns PrinterTypes enum value
 */
function getPrinterType(type, PrinterTypes) {
    switch (type.toLowerCase()) {
        case 'epson':
            return PrinterTypes.EPSON;
        case 'star':
            return PrinterTypes.STAR;
        default:
            return PrinterTypes.EPSON; // Default to EPSON
    }
}
/**
 * Map character set string to node-thermal-printer's CharacterSet
 * @param charset Character set string
 * @returns CharacterSet enum value
 */
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
            return CharacterSet.PC437_USA; // Default to USA
    }
}
/**
 * Generate a receipt content string for an order
 * @param order Order data
 * @param orderItems Items in the order
 * @returns Formatted receipt content
 */
function generateReceiptContent(order, orderItems) {
    // Special case for product labels
    if (order.type === 'product-label' && orderItems.length > 0) {
        return orderItems[0].notes || '';
    }
    // Special case for image-based product labels
    if (order.type === 'image-label' && orderItems.length > 0 && orderItems[0].isImage) {
        const imageData = orderItems[0].notes;
        // Special image handling - don't embed it into the content string
        // to avoid the "name too long" error
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
    // Add items
    let subtotal = 0;
    for (const item of orderItems) {
        const product = item.product || {};
        // Ensure price is a number
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
    // Add total
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
/**
 * Generate test page content for printer testing
 * @param printer Printer configuration
 * @returns Test page content
 */
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
/**
 * Print using electron-pos-printer library which supports images, barcodes, QR codes etc.
 * @param printer Printer configuration
 * @param content Content to print (special format for electron-pos-printer)
 * @returns Promise<boolean> Success or failure
 */
function printWithElectronPosPrinter(printer, content) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Parse the content as JSON if it's in the special electron-pos-printer format
            let data;
            try {
                // Check if this is JSON data for advanced printing
                if (content.startsWith('__POS_PRINTER_DATA__:')) {
                    const jsonContent = content.replace('__POS_PRINTER_DATA__:', '');
                    console.log(`Parsing JSON content, length: ${jsonContent.length}`);
                    data = JSON.parse(jsonContent);
                    // Check for image data and log some info
                    const hasImage = data.some(item => item.type === 'image');
                    if (hasImage) {
                        console.log('Image data detected in print job - WARNING: electron-pos-printer may fail with very long base64 strings');
                        // Convert image items to use temporary files instead of base64 data
                        data = data.map(item => {
                            if (item.type === 'image' && item.path && item.path.startsWith('data:image')) {
                                // For safety, replace with text - base64 will be handled separately
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
                    // Default to simple text content if not in our special format
                    data = [{ type: 'text', value: content }];
                }
            }
            catch (error) {
                console.error('Error parsing print data:', error);
                // Default to simple text content if parsing fails
                data = [{ type: 'text', value: content }];
            }
            // Determine printer connection
            let printerName = printer.name;
            if (printer.connectionType === 'usb' && printer.address.includes('ticket-')) {
                // For CUPS printers, use the actual printer name without the prefix
                printerName = printer.address.replace('ticket-', '');
            }
            else if (printer.connectionType === 'network') {
                // For network printers, use IP:PORT format
                printerName = `${printer.address}:${printer.port || 9100}`;
            }
            else {
                // Use address for USB and other printers
                printerName = printer.address;
            }
            // Determine appropriate width based on printer settings
            const printerWidth = printer.width || 48;
            const paperWidth = printerWidth <= 48 ? '58mm' : '80mm';
            // Set up printer options
            const options = {
                preview: false,
                width: paperWidth,
                margin: '0 0 0 0',
                copies: 1,
                printerName: printerName,
                timeOutPerLine: 400,
                silent: false,
                printer: printer.type // Use original case for printer type
            }; // Type assertion to avoid type errors
            console.log(`Printing with electron-pos-printer to "${printerName}" (${printer.type})`);
            console.log('Printer options:', JSON.stringify(options));
            // Print the content using electron-pos-printer
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