const { app, BrowserWindow, ipcMain } = require('electron');
const { execFile } = require('child_process');
const path = require('path');

let mainWindow;

function createWindow () {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        }
    });
    win.loadFile(path.join(__dirname, 'index.html')).then(r => console.log("loaded: index.html"));
}

app.whenReady().then(() => {
    createWindow();
});

ipcMain.handle('run-external-program', (event, args) => {
    const programPath = path.join(__dirname, 'faceRecognitionUNIX'); // 실행 파일 경로 설정
    return new Promise((resolve, reject) => {
        execFile(programPath, args, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout); // 프로그램 출력 결과를 반환
            }
        });
    });
});

ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    return result.filePaths[0];
})