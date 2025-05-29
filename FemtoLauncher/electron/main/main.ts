import { app, BrowserWindow, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { join } from 'path';
import { exec, spawn } from "node:child_process";
import { config } from 'node:process';
import fs from "fs"

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
function sleep(ms:number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

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

// 1) Run software in sim.
ipcMain.handle('run-sw-sim', async (event) => {
    const server_ready_path = join(__dirname, "..", "server_ready.txt");
    const serverPath = "c:/Users/nathan_pulsemedica/AppData/Local/PulseMedica/FIH/1.0.0.779/server/PMServer.exe"
    const uiPath = "C:/Users/nathan_pulsemedica/AppData/Local/PulseMedica/FIH/1.0.0.779/client/FSS UI.exe"

    // 1) Remove any old server_ready.txt
    if (fs.existsSync(server_ready_path)){
        console.log("A server ready file already exists, removing it now.")
        fs.unlinkSync(server_ready_path);
    }

    // 2) Run the server
    const child = exec(serverPath + ' sim');

    // 3) Send stdout / stderr data back to the renderer process through dedicated channels.
    // These listeners will continue to send data as long as the child process runs.
    child.stdout?.on('data', data => {
        console.log(`stdout: ${data}`);
        event.sender.send('server-sim-stdout', data.toString());
    });

    child.stderr?.on('data', data => {
        console.error(`stderr: ${data}`);
        event.sender.send('server-sim-stderr', data.toString());
    });

    child.on('close', code => {
        console.log(`Server process exited with code ${code}`);
        event.sender.send('server-sim-close', code);
    });

    // 4) Monitor for server_ready.txt. Must be done this way to ensure main process isn't interrupted.
    const timeout = 30; // seconds
    let timer = 0;
    const interval = setInterval(() => {
        if (fs.existsSync(server_ready_path)) {
            clearInterval(interval);

             // 5) Open the UI
            event.sender.send('server-sim-ready', true);
            console.log("Server is ready, opening UI...")
            exec(`"${uiPath}"`); // Must be quoted to handle spaces.
        }

        timer++;
        if (timer > timeout) {
            clearInterval(interval);
            console.error("Timeout: server_ready.txt not found.");
            // Send a specific event for timeout
            event.sender.send('server-sim-ready', false);
            // Optionally, kill the child process if it timed out
            child.kill();
        }
    }, 1000); // Check every second

    // Return from handle. This is the object hat result = ipcRenderer.invoke() gets.
    return { success: true, message: 'Server process initiated successfully & UI opened.' };
});
