import { text } from "node:stream/consumers"
import fs from 'fs/promises';

async function saveConfig(textContent: string) {
  const configPath = "C:/ProgramData/Pulsemedica/FSS/config/hw_profile.json";

  return fs.writeFile(configPath, textContent, 'utf8')
    .then(() => {
      console.log("Config successfully saved to:", configPath);
      return `[Success] Config updated and saved to: ${configPath}`;
    })
    .catch((err) => {
      console.error("Error saving config:", err);
      return `[Error] Couldn't save config: ${err.message}`;
    });
}

export default saveConfig
