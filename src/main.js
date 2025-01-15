const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn } = require('child_process');
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
    win.loadFile(path.join(__dirname, 'index.html')).then(() => console.log("loaded: index.html"));
}

app.whenReady().then(() => {
    createWindow();
});

// 외부 프로그램 실행 이벤트 처리
ipcMain.handle('run-external-program', async (event, args) => {
    console.log('start');
    const [referenceImage, targetFolder, outputFolder, model] = args;

    // return new Promise((resolve, reject) => {
    //     const { execFile } = require('child_process');
    //     execFile(path.join(__dirname, 'faceRecognition'), [referenceImage, targetFolder, outputFolder, model], (error, stdout, stderr) => {
    //         if (error) {
    //             console.error('Error:', error);
    //             reject(false);
    //         } else {
    //             console.log('Output:', stdout);
    //             resolve(true);
    //         }
    //     });
    // });

    return new Promise((resolve, reject) => {
        const program = spawn(path.join(__dirname, 'faceRecognition'), [referenceImage, targetFolder, outputFolder, model]);

        // stdout 스트림 처리
        program.stdout.on('data', (data) => {
            console.log(`STDOUT: ${data.toString()}`); // 실시간으로 콘솔에 출력
        });

        // stderr 스트림 처리
        program.stderr.on('data', (data) => {
            console.error(`STDERR: ${data.toString()}`); // 에러 메시지를 콘솔에 출력
        });

        // 프로세스 종료 시 결과 반환
        program.on('close', (code) => {
            if (code === 0) {
                resolve('Program completed successfully');
            } else {
                reject(`Program exited with code: ${code}`);
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

ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'], // 파일 선택 허용
        filters: [
            { name: 'Images', extensions: ['jpg', 'png', 'jpeg'] }, // 특정 파일 형식 필터링
        ],
    });
    return result.filePaths[0]; // 선택한 파일 경로 반환
});