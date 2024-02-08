const {app, components, ipcMain, shell, BrowserWindow, Menu, nativeImage} = require('electron');
const unhandled = require('electron-unhandled');
const windowStateKeeper = require('electron-window-state');
const path = require('path');
const server = require('./server');
const store = require('./store');

unhandled();

if (!app.requestSingleInstanceLock()) {
    // Prevent multiple instances of the app
    app.quit();
}

if (app.isPackaged) {
    // Only create a menu in development.
    // The menu is not visible but provides keyboard access to the developer tools.
    Menu.setApplicationMenu(null);
}

let mainWindow;

function createSplashScreen() {
    const splash = new BrowserWindow({
        width: 512,
        height: 512,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
    });
    splash.loadFile(path.join(__dirname, 'splash.html'));
    splash.center();
    splash.show();
    return splash;
}

function createMainWindow(url) {
    const image = nativeImage.createFromPath(path.join(__dirname, 'icon.png'));
    image.setTemplateImage(true);

    const mainWindowState = windowStateKeeper({
        defaultWidth: 1024,
        defaultHeight: 768,
    });
    const {x, y, width, height} = mainWindowState;

    mainWindow = new BrowserWindow({
        show: false,
        x,
        y,
        width,
        height,
        minWidth: 800,
        minHeight: 600,
        icon: image,
        backgroundColor: '#32312f',
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

    // Open external links in the default browser.
    // Ignore links from login buttons.
    mainWindow.webContents.setWindowOpenHandler(({url}) => {
        if (loginUrls.every((loginUrl) => !url.startsWith(loginUrl))) {
            shell.openExternal(url);
            return {action: 'deny'};
        }
        return {action: 'allow'};
    });

    mainWindowState.manage(mainWindow);

    mainWindow.loadURL(url);
}

const loginUrls = [
    'https://authorize.music.apple.com/',
    'https://accounts.spotify.com/authorize',
    'https://accounts.google.com/',
    'https://app.plex.tv/auth',
    'https://www.last.fm/api/auth',
];

app.whenReady().then(async () => {
    const splash = createSplashScreen();
    try {
        let [port] = await Promise.all([server.start(), components.whenReady()]);
        let url = `http://localhost:${port}/`;

        createMainWindow(url);

        ipcMain.handle('quit', () => app.quit());

        // Synch the window chrome with the app theme.
        ipcMain.handle('setFrameColor', (_, color) => {
            mainWindow.setTitleBarOverlay({color});
        });
        ipcMain.handle('setFrameTextColor', (_, symbolColor) => {
            mainWindow.setTitleBarOverlay({symbolColor});
        });
        ipcMain.handle('setFontSize', () => {
            // ignore for now
        });
        ipcMain.handle('setTheme', () => {
            // ignore for now
        });

        // Switch port
        ipcMain.handle('setPort', async (_, newPort) => {
            parsedPort = parseInt(newPort, 10);
            if (parsedPort) {
                store.port = parsedPort; // possibly confirmation of change of port from the ui
                if (port !== parsedPort) {
                    await server.stop();
                    port = await server.start();
                    url = `http://localhost:${port}/`;
                    mainWindow.loadURL(url);
                }
            } else {
                console.error(TypeError(`Invalid port: '${newPort}'`));
            }
        });

        // For mac apparently.
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                if (!mainWindow) {
                    createMainWindow(url);
                    mainWindow.show();
                }
            }
        });

        mainWindow.show();
        splash.close();
    } catch (err) {
        splash.destroy();
        throw err;
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('second-instance', () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.show();
    }
});
