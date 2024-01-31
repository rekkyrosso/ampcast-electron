const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('ampcastElectron', {
    setFontSize: (fontSize) => ipcRenderer.invoke('setFontSize', fontSize),
    setFrameColor: (color) => ipcRenderer.invoke('setFrameColor', color),
    setFrameTextColor: (color) => ipcRenderer.invoke('setFrameTextColor', color),
    setTheme: (theme) => ipcRenderer.invoke('setTheme', theme),
});
