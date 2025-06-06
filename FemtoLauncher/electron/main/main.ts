import { app, BrowserWindow, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { join } from 'path';
import { exec, spawn } from "node:child_process";
import { config } from 'node:process';
import fs from "fs";
import processList from './helpers/processList.ts';

// MODULES
import getLatestVersionPath from './helpers/getLatestVersionPath.ts'
import loadConfigContent from './helpers/loadConfigContent.ts';
import saveConfig from './helpers/saveConfig.ts';

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
    title:"FemtoLauncher",
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
    //win.loadFile(path.join(RENDERER_DIST, 'index.html'))
    //win.loadFile(path.join(app.getAppPath(), 'index.html'))
    win.loadFile(path.join(__dirname, '../dist/index.html'))
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

// 0) On startup, we run this function from the renderer that gets all the paths.
ipcMain.handle('get-paths', async(event, ...args) => {
  const result = getLatestVersionPath();
  return result;
})

// 0) On startup, run this function to get general system info (good for debugging purposes in production mode where we don't have node terminal)
ipcMain.handle('startup-ui-logs', async(event) => {
  const result = {
    cwd: __dirname,
    server_ready_path: join(__dirname, "..", "server_ready.txt"),
  }
  return result;
})

// 0) For run-config.
ipcMain.handle('run-config', async (event, configPath, mode) => {
  console.log("------- run-config has been called -------");
  return new Promise((resolve, reject) => {
    let combinedOutputLines: string[] = [];
    let stdoutData = '';
    let stderrData = '';

    let child;

    if (mode === "sim"){
      child = exec(configPath + " -d");
    }
    else{
      console.log(configPath);
      child = exec(configPath);
    }

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

// 1) Run software. Renderer sends the mode (target v. sim).
ipcMain.handle('run-sw', async (event, serverPath, clientPath, mode) => {
    console.log("--------- Running server in target ---------\n");
    const server_ready_path = join(__dirname, "..", "server_ready.txt");

    // 1) Remove any old server_ready.txt
    if (fs.existsSync(server_ready_path)) {
        console.log("A server ready file already exists, removing it now.");
        try {
            fs.unlinkSync(server_ready_path);
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
        }
    }

    // 2) Determine command based on mode
    const serverCommand = mode === "sim" ? `${serverPath} sim` : serverPath;
    const child = exec(serverCommand);

    // 3) Start a unified Promise watcher
    return await new Promise<{ success: boolean; message: string }>((resolve) => {
        const timeout = 45 * 1000;
        let interval: NodeJS.Timeout;
        let timedOut = false;

        const checkReadyFile = () => {
            if (fs.existsSync(server_ready_path)) {
                clearInterval(interval);
                clearTimeout(timeoutHandle);
                event.sender.send('server-stdout', "[Success] Server ready, starting UI now.");
                console.log("Server is ready, opening UI...");
                exec(`"${clientPath}"`);
                resolve({ success: true, message: '[Success] Server process initiated successfully & UI opened.' });
            }
        };

        // Poll for server_ready.txt
        interval = setInterval(checkReadyFile, 1000);

        // Timeout fallback
        const timeoutHandle = setTimeout(() => {
            timedOut = true;
            clearInterval(interval);
            child.kill();
            event.sender.send('server-stderr', '[Error] Server Timeout. Failed to start.');
            console.error("Timeout: server_ready.txt not found.");
            resolve({ success: false, message: "[Error] Server process was not able to start." });
        }, timeout);

        // Stream stdout
        child.stdout?.on('data', (data) => {
            console.log(`stdout: ${data}`);
            event.sender.send('server-stdout', data.toString());
        });

        // Fail fast on stderr
        child.stderr?.on('data', (data) => {
            const msg = data.toString();
            console.error(`stderr: ${msg}`);
            event.sender.send('server-stderr', '[Error] ' + msg);

            clearInterval(interval);
            clearTimeout(timeoutHandle);
            child.kill();
            resolve({ success: false, message: '[Error] ' + msg });
        });

        // Optional: handle process close
        child.on('close', (code) => {
            if (!timedOut) console.log(`Server process exited with code ${code}`);
        });
    });
});

// 3) Kill Software
ipcMain.handle('close-software', async (event, processName) => {
  const serverProcessName = "PMServer.exe";
  const uiProcessName = "FSS UI.exe";

  const result = {
    serverResponse: "[Error] Some error occurred while trying to close PMServer.exe",
    uiResponse: "[Error] Some error occurred while trying to close FSS UI.exe",
  };

  const killProcessByName = async (targetName: string, label: string, timeoutMs = 10000): Promise<string> => {
    const processes = await processList();
    const matching = processes.filter(p => p.name === targetName);

    if (matching.length === 0) {
      return `[Error] No running process found with name ${label}.`;
    }

    const killPromises = matching.map(proc =>
      new Promise((resolve, reject) => {
        try {
          process.kill(proc.pid, 'SIGKILL');
          resolve(true);
        } catch (err) {
          reject(`[Error] Failed to kill ${label} (PID ${proc.pid}): ${err}`);
        }
      })
    );

    return Promise.race([
      Promise.allSettled(killPromises).then(results => {
        const allSucceeded = results.every(res => res.status === 'fulfilled');
        return allSucceeded
          ? `[Success] ${label} successfully killed.`
          : `[Partial] Some instances of ${label} could not be killed.`;
      }),
      new Promise(resolve =>
        setTimeout(() => resolve(`[Error] Timeout while trying to kill ${label}.`), timeoutMs)
      )
    ]) as Promise<string>;
  };

  // Attempt to kill both processes
  result.serverResponse = await killProcessByName(serverProcessName, 'PMServer');
  result.uiResponse = await killProcessByName(uiProcessName, 'FSS UI');

  return result;
});

// 4) Polls to see if pmserver is running.
ipcMain.handle('poll-service', async (_event, matchPattern: string) => {
  try {
    const processes = await processList();

    // If matchPattern is empty or null, return false
    if (!matchPattern) return false;

    // Case-insensitive partial match
    return processes.some(proc =>
      proc.name.toLowerCase().includes(matchPattern.toLowerCase())
    );
  } catch (err) {
    console.error('Error polling processes:', err);
    return false;
  }
});

// 5) Reads config file and returns its contents.
ipcMain.handle('read-config', async() => {
  const configContent = loadConfigContent();
  return configContent;
})

// 6) Saves what you have in the edit config editor to hw_config.exe
ipcMain.handle('save-config', async(event, textContent) => {
  const res = await saveConfig(textContent);
  return res;
})
