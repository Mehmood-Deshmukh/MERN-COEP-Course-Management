import './App.css';
import FileUploader from './components/FileUpload';
import { useState } from 'react';

function App() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    async function onFileUpload(type) {
        let endpoint =""
        if(type == "xlsx")
            endpoint = "/api/courses"
        else
            endpoint = "/api/teachers"

        if (!file) {
            alert("Please select a file first.");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(`${endpoint}/import`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            console.log(data.message, data.data);
        } catch (e) {
            console.log(e.message);
            alert(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <h1>Hello! Welcome To COEP Course Management Portal</h1>
            <FileUploader fileType="xlsx" onFileUpload={onFileUpload} file={file} setFile={setFile} />
            <FileUploader fileType="csv" onFileUpload={onFileUpload} file={file} setFile={setFile}/>
            {loading && <p>Uploading...</p>}
        </>
    );
}

export default App;
