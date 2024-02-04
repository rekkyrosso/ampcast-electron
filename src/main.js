const {app} = require('electron');
const {components, shell, BrowserWindow, ipcMain, nativeImage, Menu} = require('electron');
const unhandled = require('electron-unhandled');
const windowStateKeeper = require('electron-window-state');
const path = require('path');
require('./server');

unhandled();

Menu.setApplicationMenu(null);

function createMainWindow() {
    const image = nativeImage.createFromPath(path.join(__dirname, 'icon.png'));
    image.setTemplateImage(true);

    const mainWindowState = windowStateKeeper({
        defaultWidth: 1024,
        defaultHeight: 768,
    });
    const {x, y, width, height} = mainWindowState;

    const mainWindow = new BrowserWindow({
        show: false,
        x,
        y,
        width,
        height,
        minWidth: 800,
        minHeight: 600,
        icon: image,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: 'rgba(0,0,0,0)',
            symbolColor: 'white',
            height: 24,
        },
        webPreferences: {
            devTools: !app.isPackaged,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    mainWindowState.manage(mainWindow);

    mainWindow.loadURL('http://localhost:8000/');

    return mainWindow;
}

const loginUrls = [
    'https://authorize.music.apple.com/',
    'https://accounts.spotify.com/authorize',
    'https://accounts.google.com/',
    'https://app.plex.tv/auth',
    'https://www.last.fm/api/auth',
];

app.whenReady().then(async () => {
    await components.whenReady();

    const mainWindow = createMainWindow();

    // Open external links in the default browser.
    // Ignore links from login buttons.
    mainWindow.webContents.setWindowOpenHandler(({url}) => {
        if (loginUrls.every((loginUrl) => !url.startsWith(loginUrl))) {
            shell.openExternal(url);
            return {action: 'deny'};
        }
        return {action: 'allow'};
    });

    // Synch the window chrome with the app theme.
    ipcMain.handle('setFontSize', (_, fontSize) => {
        // const dragRegionRemSize = 1.5; // defined in web client CSS
        // const height = Math.round(fontSize * dragRegionRemSize);
        // mainWindow.setTitleBarOverlay({height});
    });
    ipcMain.handle('setFrameColor', (_, color) => {
        mainWindow.setTitleBarOverlay({color});
    });
    ipcMain.handle('setFrameTextColor', (_, symbolColor) => {
        mainWindow.setTitleBarOverlay({symbolColor});
    });
    ipcMain.handle('setTheme', () => {
        // ignore for now
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });

    mainWindow.show();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Prevent multiple instances of the app

if (!app.requestSingleInstanceLock()) {
    app.quit();
}

app.on('second-instance', () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.show();
    }
});
