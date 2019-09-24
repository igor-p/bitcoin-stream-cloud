import React from 'react';
import './App.css';
import StreamViewer from "./StreamViewer";

function App() {
    return (
        <div className="App">
            <header className="App-header">
                Bitcoin Stream Cloud
            </header>
            <StreamViewer
                currency={'USD'}
                maxResults={200}
            />
        </div>
    );
}

export default App;
