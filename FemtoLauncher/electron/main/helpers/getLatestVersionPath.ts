// This file gets the latest version of installed FSS.
import os from 'os';
import path from 'node:path'
import fs from "fs";

// IMPORTANT NOTE:
// Once FemtoLauncher is put into FemtoDeploy - change these paths to be from the current directory look for client and server.
// Right now it just looks for the latest installed version, but in the future you'd point it to what version the launcher folder is in.

function parseVersion(versionStr:string) {
  // Parse version string into array of numbers, e.g. "1.0.0.333" => [1, 0, 0, 333]
  return versionStr.split('.').map(num => parseInt(num, 10));
}

function compareVersions(v1:Array<number>, v2:Array<number>) {
  // Compare two version arrays
  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const num1 = v1[i] || 0;
    const num2 = v2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

function getHighestVersionFolder(dirPath:string) {
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    // Filter only directories with version-like names (digits and dots)
    const versionFolders = items
      .filter(item => item.isDirectory() && /^\d+(\.\d+)*$/.test(item.name))
      .map(item => item.name);

    if (versionFolders.length === 0) {
      return null; // No version folders found
    }

    // Sort the version folders by comparing their parsed versions descending
    versionFolders.sort((a, b) => {
      const vA = parseVersion(a);
      const vB = parseVersion(b);
      return compareVersions(vB, vA); // descending order
    });

    return versionFolders[0]; // highest version folder
  } catch (err) {
    console.error("Error reading directory:", err);
    return null;
  }
}

function getLatestVersionPath(){
    const result = {
        versionNumber: "",
        versionPath: "",
        serverPath: "",
        clientPath: "",
        configPath: "",
    }
    const basePath = path.join(os.homedir(), 'AppData', 'Local', 'PulseMedica', 'FIH');
    const currentVersion = getHighestVersionFolder(basePath);

    if (currentVersion !== null) {
        const latestVersionPath = path.join(basePath, currentVersion);
        const serverPath = path.join(latestVersionPath, "server", "PMServer.exe")
        const clientPath = path.join(latestVersionPath, "client", "FSS UI.exe")
        const configPath = path.join(latestVersionPath, "server", "config.exe")
        result.versionNumber = currentVersion;
        result.versionPath = latestVersionPath;
        result.serverPath = serverPath;
        result.clientPath = clientPath;
        result.configPath = configPath;
        console.log(result);
        return result;
    }
    else {
        result.versionNumber = "[Error] Unable to determine current version #"
        result.versionPath = "[Error] Unable to find current version path."
        result.serverPath = "[Error] Unable to find server path."
        result.clientPath = "[Error] Unable to find client path."
        result.configPath = "[Error] Unable to find config path."
        return result;
    }
}

export default getLatestVersionPath
