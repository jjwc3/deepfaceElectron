const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow;

function createWindow () {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        }
    });
    mainWindow.loadFile(path.join(__dirname, 'index.html')).then(() => console.log("loaded: index.html"));
}

app.whenReady().then(() => {
    createWindow();
});

// 외부 프로그램 실행 이벤트 처리
ipcMain.handle('run-external-program', async (event, args) => {
    console.log('start');
    const [referenceImage, targetFolder, outputFolder, model, widthTimes, heightTimes] = args;

    return new Promise((resolve, reject) => {
        const program = spawn(path.join(__dirname, 'faceRecognitionUNIX'), [referenceImage, targetFolder, outputFolder, model, widthTimes, heightTimes]);

        // stdout 스트림 처리
        program.stdout.on('data', (data) => {
            let output = data.toString();
            console.log(`STDOUT: ${output}`);
            // mainWindow.webContents.send('program-output', output);

            if (output.includes('[START]')) {
                mainWindow.webContents.send('program-output', ['start', 'Program Started.']);
            }

            if (output.includes('[TARGET] ')) {
                let targetDir = output.split('[TARGET] ')[1].trim();
                mainWindow.webContents.send('program-output', ['target_dir', targetDir]);
            }

            if (output.includes('[MATCH] ')) {
                let matchName = output.split('[MATCH] ')[1].trim();
                mainWindow.webContents.send('program-output', ['match_name', matchName]);
            }

            if (output.includes('[SAVED] ')) {
                let outputDir = output.split('[SAVED] ')[1].trim();
                mainWindow.webContents.send('program-output', ['output_dir', outputDir]);
            }

            if (output.includes('[FAIL] ')) {
                let fail = output.split('[FAIL] ')[1].trim();
                mainWindow.webContents.send('program-output', ['error', fail]);
            }

            if (output.includes('[NOMATCH] ')) {
                let noMatch = output.split('[NOMATCH] ')[1].trim();
                mainWindow.webContents.send('program-output', ['no_match', noMatch]);
            }
        });

        // stderr 스트림 처리
        program.stderr.on('data', (data) => {
            let output = data.toString();
            console.error(`STDERR: ${output}`); // 에러 메시지를 콘솔에 출력

            if (output.includes('[ARGERROR]')) {
                let err = output.split('[ARGERROR] ')[1].trim();
                mainWindow.webContents.send('program-output', ['arg_error', err]);
            }
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