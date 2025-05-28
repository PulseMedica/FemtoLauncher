import { app, BrowserWindow, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { join } from 'path';
import { exec, spawn } from "node:child_process";
import { config } from 'node:process';

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
    createWindow();
  }
)

// Helper functions
const isRunning = (query: any) => {
  return new Promise((resolve, reject) => {
    if (!query) {
      reject(new Error('No query provided'));
    }

    exec(`tasklist`, (err, stdout, stderr) => {
      resolve(stdout.toLowerCase().indexOf(query.toLowerCase()) > -1);
      console.log(err);
      console.log(stderr);
    });
  });
};

// 0) For run-config.
ipcMain.handle('run-config', async (event, ...args) => {
  console.log("------- run-config has been called -------");
  const config_exe_path = join(__dirname, "..", "electron/main/scripts/config.exe");

  return new Promise((resolve, reject) => {
    let combinedOutputLines: string[] = [];
    let stdoutData = '';
    let stderrData = '';

    const child = exec(config_exe_path);

    child.stdout?.on('data', data => {
      const chunk = data.toString();
      stdoutData += chunk;
      chunk.split('\n').forEach((line: string) => {
        if (line.trim()) {
          combinedOutputLines.push(line); // Push onto return object.
          console.log(`${line}`);
        }
      });
    });

    child.stderr?.on('data', data => {
      const chunk = data.toString();
      stderrData += chunk;
      chunk.split('\n').forEach((line: string) => {
        if (line.trim()) {
          combinedOutputLines.push(line);
          console.log(`${line}`); // Push onto return object.
        }
      });
    });

    child.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      const result = {
        // Note that stdout & stderr aren't actually used, but if you need them here they are.
        stdout: stdoutData,
        stderr: stderrData,
        outputLines: combinedOutputLines, // 1 array that has the output. This is to maintain sequential ordering.
        exitCode: code,
        success: code === 0
      };

      if (code === 0) {
        resolve(result);
      } else {
        const error = new Error(`Child process exited with code ${code}`);
        reject(error);
      }
    });

    child.on('error', (err) => {
      // This is for if there's an error with the file itself. That way the UI can still show it.
      console.error('Failed to start child process.', err);
      const errorLine = `Failed to start process: ${err.message}`;
      const finalOutputLines: string[] = [...combinedOutputLines, errorLine];

      const result = {
        stdout: stdoutData,
        stderr: stderrData,
        outputLines: finalOutputLines,
        success: false
      };
      reject(err);
    });
  });
});

// 1) For run-server-sim
ipcMain.handle('run-server-sim', async(event, ...args) => {
    const serverPath = "c:/Users/nathan_pulsemedica/AppData/Local/PulseMedica/FIH/1.0.0.779/server/PMServer.exe"
    const child = exec(serverPath + ' sim');

    // Send stdout / stderr data back to the renderer process through a channel - that the renderer then listens on.
    // I guess you could just send it all back as 1 object - this way just shows the messages "live".
    child.stdout?.on('data', data => {
      console.log(`stdout: ${data}`);
      event.sender.send('server-sim-stdout', data.toString());
    });

    child.stderr?.on('data', data => {
      console.error(`stderr: ${data}`);
      // Send stderr data back to the renderer process through a channel.
      event.sender.send('server-sim-stderr', data.toString());
    });

    child.on('close', code => {
      console.log(`Server process exited with code ${code}`);
      // Send close code back to the renderer process through a channel.
      event.sender.send('server-sim-close', code);
    });
})

// 2) Check if server is running. I took this from femtoUI.
ipcMain.handle('is-server-live', async () => {
  isRunning("PMServer.exe")
    .then(result => {
      const isRunning = result as boolean;
      if (isRunning){
        return true;
      }
      else {
        return false;
      }
    })
})
