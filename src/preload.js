const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    selectFolder: async () => ipcRenderer.invoke('select-folder'),
    runExternalProgram: async (args) => {
        return await ipcRenderer.invoke('run-external-program', args);
    },
});
