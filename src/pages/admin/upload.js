import React, { useState } from 'react';
import axios from 'axios';

function Upload() {
  const [mode, setMode] = useState("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append("mode", mode);
    if (mode === "url") {
      formData.append("url", url);
    } else {
      formData.append("file", file);
    }

    try {
      const response = await axios.post("http://localhost:8080/process", formData);
      setOutput(response.data.output);
    } catch (err) {
      setOutput("Error: " + err.message);
    }
    setLoading(false);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setUrl("");
    setFile(null);
    setOutput("");
  };

  return (
    <div className="flex h-screen font-sans bg-gray-50">
      {/* Sidebar - Left */}
      <div className="w-64 bg-white border-r border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-8 text-gray-700">Menu</h2>
        <ul className="space-y-3">
          <li
            className={`px-4 py-3 rounded-lg cursor-pointer transition-colors ${
              mode === "url" 
                ? "bg-blue-50 text-blue-600 font-medium" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => handleModeChange("url")}
          >
            Enter URL
          </li>
          <li
            className={`px-4 py-3 rounded-lg cursor-pointer transition-colors ${
              mode === "file" 
                ? "bg-blue-50 text-blue-600 font-medium" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => handleModeChange("file")}
          >
            Upload File
          </li>
        </ul>
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold mb-6 text-center text-gray-800">Content Processor</h1>

          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
            {mode === "url" && (
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <input
                  type="text"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {mode === "file" && (
              <div>
                <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                  Select File
                </label>
                <input
                  type="file"
                  id="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === "url" && !url) || (mode === "file" && !file)}
              className={`w-full px-4 py-3 rounded-lg text-white font-medium ${
                loading 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700"
              } ${
                (mode === "url" && !url) || (mode === "file" && !file) 
                  ? "opacity-50 cursor-not-allowed" 
                  : ""
              }`}
            >
              {loading ? "Processing..." : "Submit"}
            </button>
          </form>

          {output && (
            <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium mb-3 text-gray-800">Output</h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                  {output}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Upload;