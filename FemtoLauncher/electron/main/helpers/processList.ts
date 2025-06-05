import process from 'node:process';
import {promisify} from 'node:util';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import childProcess from 'node:child_process';
import isDev from 'electron-is-dev';

/*
I basically copied over the source code from here: https://github.com/sindresorhus/ps-list/blob/main/index.js
To make my own custom version to circumvent packaging issues.
Note that I only copied over the "windows" functionality.
*/

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEN_MEGABYTES = 1000 * 1000 * 10;
const execFile = promisify(childProcess.execFile);

const processList = async () => {
	// Source: https://github.com/MarkTiedemann/fastlist
	let binary;
	switch (process.arch) {
		case 'x64':
			binary = 'fastlist-0.3.0-x64.exe';
			break;
		case 'ia32':
			binary = 'fastlist-0.3.0-x86.exe';
			break;
		default:
			throw new Error(`Unsupported architecture: ${process.arch}`);
	}

    // Set path to executable based on dev or prod.
    let binaryPath;
    if (isDev){
        binaryPath = path.join(__dirname, "..", "/extras", binary)
    }
    else{
        binaryPath = path.join(__dirname, "..", "..", binary)
    }
	const {stdout} = await execFile(binaryPath, {
		maxBuffer: TEN_MEGABYTES,
		windowsHide: true,
	});

	return stdout
		.trim()
		.split('\r\n')
		.map(line => line.split('\t'))
		.map(([pid, ppid, name]) => ({
			pid: Number.parseInt(pid, 10),
			ppid: Number.parseInt(ppid, 10),
			name,
		}));
};

export default processList
