const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    selectFile: async () => ipcRenderer.invoke('select-file'),
    selectFolder: async () => ipcRenderer.invoke('select-folder'),
    runExternalProgram: async (args) => {
        return await ipcRenderer.invoke('run-external-program', args);
    },
});
