const FileUpload = ({fileType, loading, setFile, onFileUpload }) => {
    function handleFileChange(e) {
        if (e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    }

    return (
        <div>
            <form>
                <p>Please upload .{fileType} file </p>
                <input disabled={loading} type="file" accept={`.${fileType}`} onChange={handleFileChange} />
                <button type="button" onClick={() => onFileUpload(fileType)}>
                    Submit
                </button>
            </form>
        </div>
    );
};

export default FileUpload;
