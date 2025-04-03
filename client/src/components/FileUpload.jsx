import React, { useState } from 'react';

const FileUploadOption = ({ fileType, loading, file, setFile, onFileUpload }) => {
  function handleFileChange(e) {
    if (e.target.files.length > 0) {
      setFile(fileType, e.target.files[0]);
    }
  }

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Upload .{fileType} File</h4>
      <p className="text-xs text-gray-500 mb-3">Select your {fileType.toUpperCase()} file to import data</p>

      <div className="flex flex-col gap-3">
        {!file ? (
          <label className="flex flex-col items-center px-4 py-6 bg-white text-blue-500 rounded-lg shadow-sm border border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm font-medium">Select {fileType.toUpperCase()}</span>
            <input
              type="file"
              className="hidden"
              accept={`.${fileType}`}
              onChange={handleFileChange}
              disabled={loading}
            />
          </label>
        ) : (
          <div className="px-4 py-4 bg-white rounded-lg shadow-sm border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-full text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{file.name}</div>
                <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
              </div>
              <button
                onClick={() => setFile(fileType, null)}
                className="p-1 text-gray-400 hover:text-red-500 rounded-full"
                disabled={loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => onFileUpload(fileType)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium 
                   hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                   disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex justify-center items-center"
          disabled={loading || !file}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </>
          ) : `Import ${fileType.toUpperCase()}`}
        </button>
      </div>
    </div>
  );
};

const ImprovedSidebarUpload = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState({
    xlsx: false,
    csv: false
  });
  const [files, setFiles] = useState({
    xlsx: null,
    csv: null
  });

  function toggleSidebar() {
    setIsSidebarOpen(!isSidebarOpen);
  }

  function handleSetFile(fileType, file) {
    setFiles(prev => ({
      ...prev,
      [fileType]: file
    }));
  }

  async function handleFileUpload(fileType) {
    if (!files[fileType]) return;

    setLoading(prev => ({
      ...prev,
      [fileType]: true
    }));

    let endpoint = "";
    if (fileType === "xlsx")
      endpoint = "/api/courses";
    else
      endpoint = "/api/teachers";

    try {
      const formData = new FormData();
      formData.append("file", files[fileType]);
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
      setLoading(prev => ({
        ...prev,
        [fileType]: false
      }));
    }
  }



  return (
    <>
      {/* Hamburger Trigger Button */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="fixed left-4 top-4 z-40 p-2 bg-white text-gray-700 rounded-md shadow-md 
                 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2
                 transition-all duration-200"
        aria-label="Open sidebar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar - Now on the left side */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } overflow-y-auto`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Import Data</h3>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
              aria-label="Close sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 bg-blue-50 border-b border-blue-100">
            <p className="text-sm text-blue-800">
              Upload courses.xlsx and teachers.csv to import data
            </p>
          </div>
        </div>

        <div className="p-4">
          <FileUploadOption
            fileType="xlsx"
            loading={loading.xlsx}
            file={files.xlsx}
            setFile={handleSetFile}
            onFileUpload={handleFileUpload}
          />

          <div className="relative py-3">
            <div className="relative flex justify-center">
              <div className="px-4 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">and</div>
            </div>
          </div>

          <FileUploadOption
            fileType="csv"
            loading={loading.csv}
            file={files.csv}
            setFile={handleSetFile}
            onFileUpload={handleFileUpload}
          />

          {/* Upload Status */}
          {(files.xlsx || files.csv) && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h5 className="text-sm font-medium text-blue-700 mb-2">Upload Status</h5>
              <ul className="text-xs space-y-2">
                {files.xlsx && (
                  <li className="flex items-center justify-between">
                    <span>courses.xlsx</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${loading.xlsx ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {loading.xlsx ? 'Uploading...' : 'Ready'}
                    </span>
                  </li>
                )}
                {files.csv && (
                  <li className="flex items-center justify-between">
                    <span>teachers.csv</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${loading.csv ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {loading.csv ? 'Uploading...' : 'Ready'}
                    </span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Help Text */}
          <div className="mt-6 p-3 bg-gray-50 rounded border border-gray-100">
            <h5 className="text-xs font-medium text-gray-700 mb-1">Need help?</h5>
            <p className="text-xs text-gray-500">
              Make sure your files follow our template format for successful import.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ImprovedSidebarUpload;