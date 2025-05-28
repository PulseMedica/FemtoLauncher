import { useState } from 'react'
import reactLogo from '../assets/react.svg'
import viteLogo from '/electron-vite.animate.svg'
import '../Styles/App.css'
import logo from "../assets/logo.png"

function App() {
  const [btnLaunchUI, setBtnLaunchUi] = useState(false); // Should be a preload function that sets its state.
  const [outputLines, setOutputLines] = useState([]);
  const [isLoading, setIsLoading] = useState(null); // Whether the script is done executing or not. True = exuting, False = done, Null = no script was called yet.

  // Runs config.
  const handleRunConfigClick = async() => {
    const resultObject = await window.ipcRenderer.invoke('run-config');
    const results = resultObject.outputLines;
    setOutputLines(results);
  }

  // Helper function to determine the class for each line
  const getLineClass = (line:string) => {
    if (line.startsWith('[Error]')){
      return 'error-line'
    }
    else if (line.startsWith('[Success]')){
      return 'success-line'
    }
    else{
      return 'output-line'
    }
  };

  const handleRunServerSim = async() => {
    const resultObject = await window.ipcRenderer.invoke('run-server-sim');
    const results = resultObject.outputLines;
    setOutputLines(results);
  }

  return (
    <div className="app-container">
      <div className="logo-container">
        <img src={logo} alt="" />
      </div>
      <div className="modal-container">
          <div className="title">Welcome to FIH Launcher</div>
          <div className="inputs-container">
            <button id="btn-run-config" onClick={handleRunConfigClick}>
              Run Config
            </button>
            <button id="btn-sim-server" onClick={handleRunServerSim}>
              Start Simulation Server
            </button>

            <button id="btn-target-server">
              Start Target Server
            </button>

            <button id="btn-launch-ui"> {/* Perhaps can have it where it's only enabled if PMServer.exe is running. */}
              Launch Software
            </button>

            <div className="output-container">
                {outputLines.map((line, index) => (
                  <div key={index} className={`${getLineClass(line)}`}>
                    {'\n' + line}
                  </div>
                ))}
            </div>

          </div>
        </div>
    </div>
  )
}

export default App
