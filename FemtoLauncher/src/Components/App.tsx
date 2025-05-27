import { useState } from 'react'
import '../Styles/App.css'
import logo from "../assets/logo.png"

function App() {
  const [btnLaunchUI, setBtnLaunchUi] = useState(false); // Should be a preload function that sets its state.
  const [serverLogs, setServerLogs] = useState([]); // Should be a preload function that sets its state.
  const [serverArtifact, setServerArtifact] = useState(false); // Should be a preload function that sets its

  const handleBtnClick = async() => {
    try{
      const res = await window.ipcRenderer.testCallScript(); // Why is this function not seen?
    }
    catch(e) {
      console.log(e);
    }
  }

  return (
    <div className="app-container">
      <div className="logo-container">
        <img src={logo} alt="" />
      </div>
      <div className="modal-container">
          <div className="title">Welcome to FIH Launcher</div>
          <div className="inputs-container">
            <button id="btn-sim-server">
              Start Simulation Server
            </button>

            <button id="btn-target-server">
              Start Target Server
            </button>

            <button id="btn-launch-ui"> {/* Perhaps can have it where it's only enabled if PMServer.exe is running. */}
              Launch Software
            </button>

            <div className="output-container">
              This is where you'd put server logs.
            </div>

          </div>
        </div>
    </div>


  )
}

export default App
