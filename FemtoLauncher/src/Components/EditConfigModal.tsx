import { useEffect, useState } from "react";
import "../Styles/EditConfigModal.css"

interface EditConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  setOutputLines: React.Dispatch<React.SetStateAction<string[]>>;
}

const EditConfigModal: React.FC<EditConfigModalProps> = ({ isOpen, onClose, setOutputLines}) => {
    const [configText, setConfigText] = useState("");

    useEffect(() => {
        // Do nothing if modal isn't open.
        if (!isOpen) return;

        window.ipcRenderer.invoke("read-config")
            .then((configContent:string) => {
                setConfigText(configContent)
                console.log("Confs:", configText)
            })
            .catch((err) => {
                setConfigText(`Error: ${err}`)
            })

    }, [isOpen]) // Runs when the modal's state is changed to open.

    const handleSave = async() => {
        const res = await window.ipcRenderer.invoke("save-config", configText);
        onClose();
        setOutputLines(prevLines => [...prevLines, res])
    }

    return (
        <>
            <textarea
                name=""
                id="edit-config-textarea"
                value={configText}
                onChange={e => setConfigText(e.target.value)}
            />

            <button onClick={onClose} id="btn-edit-config-close">
                Cancel
            </button>

            <button onClick={handleSave} id="btn-edit-config-save">
                Save
            </button>
        </>

    )
}

export default EditConfigModal
