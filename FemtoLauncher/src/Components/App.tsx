import { useState } from 'react'
import reactLogo from '../assets/react.svg'
import viteLogo from '/electron-vite.animate.svg'
import '../Styles/App.css'
import logo from "../assets/logo.png"

function App() {
  const [btnLaunchUI, setBtnLaunchUi] = useState(true); // Determines if start ui button disabled == true or false.
  const [outputLines, setOutputLines] = useState<string[]>([]);;

  // Runs config.
  const handleRunConfigClick = async() => {
    setOutputLines([])
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
    setOutputLines([])
    const result = await window.ipcRenderer.invoke('run-server-sim');

    // Listen on channels coming from main process to update state
    window.ipcRenderer.on('server-sim-stdout', (event, data) => {
      console.log('Renderer received stdout:', data);
      setOutputLines(prevLines => [...prevLines, data]);
    });

    window.ipcRenderer.on('server-sim-stderr', (event, data) => {
      console.error('Renderer received stderr:', data);
      setOutputLines(prevLines => [...prevLines, data]);
    });

    window.ipcRenderer.on('server-sim-close', (event, code) => {
      console.log('Renderer received close code:', code);
      setOutputLines(prevLines => [...prevLines, code]);
    });

    // Check if server is ran correctly, then enable UI button.
    const isRunning = await window.ipcRenderer.invoke('is-server-live');
    setBtnLaunchUi(isRunning)
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

            <button id="btn-launch-ui" disabled={btnLaunchUI}> {/* enable / disable based on state. */}
              Launch Software
            </button>

            <div className="output-container">
                {!outputLines ? ( /* If the script is still loading */
                    <div>Loading...</div>
                ) : (
                    outputLines.map((line, index) => (
                        <div key={index} className={`${getLineClass(line)}`}>
                            {'\n' + line}
                        </div>
                    ))
                )}
            </div>

          </div>
        </div>
    </div>
  )
}

export default App
