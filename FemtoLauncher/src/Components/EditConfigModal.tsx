import { useEffect, useState } from "react";
import "../Styles/EditConfigModal.css"

interface EditConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditConfigModal: React.FC<EditConfigModalProps> = ({ isOpen, onClose }) => {
    const [configText, setConfigText] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Do nothing if modal isn't open.
        if (!isOpen) return;

        // Set loading states
        setLoading(true);

        window.ipcRenderer.invoke("read-config")
            .then((configContent:string) => {
                setConfigText(configContent)
                console.log("Confs:", configText)
            })
            .catch((err) => {
                setConfigText(`Error: ${err}`)
            })
            .finally(() => {
                setLoading(false);
            })

    }, [isOpen]) // Runs when the modal's state is changed to open.

    const handleSave = async() => {
        return;
    }

    return (
        <>
            <textarea name="" id="edit-config-textarea" defaultValue={configText}>
            </textarea>

            <button onClick={onClose} id="btn-edit-config-close">
                Cancel
            </button>

            <button id="btn-edit-config-save">
                Save
            </button>
        </>

    )
}

export default EditConfigModal
