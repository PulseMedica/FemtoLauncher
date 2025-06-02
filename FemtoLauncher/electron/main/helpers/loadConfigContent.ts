import fs from 'fs/promises';

async function loadConfigContent() {
  // Adjust this path if it ever needs to be dynamic
  const configPath = "C:/ProgramData/Pulsemedica/FSS/config/hw_profile.json";

  try {
    // Try to access the file; if it doesn't exist, an error with code 'ENOENT' will be thrown
    await fs.access(configPath);

    // If we reach here, the file exists—read and return its contents as a string
    const fileContents = await fs.readFile(configPath, 'utf-8');
    return fileContents;

  } catch (err: unknown) {
    if (err instanceof Error) {
      // File doesn’t exist: create a default JSON, write it, and return that
      const defaultConfig = {
        Message: "Config file not found, or could not be opened.",
        Config_Path: configPath
      };
      const defaultContent = JSON.stringify(defaultConfig, null, 2);
      return defaultContent;
    }

    throw err;
  }
}

export default loadConfigContent;
