import { useState } from 'react'
import { Toaster } from 'sonner'
import './App.css'
import FileUpload from './components/FileUpload'

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" richColors expand={true} />
      <header className="App-header">
        <h1>Document Migration Tool</h1>
        <p>Convert and Upload Microsoft Word documents to Document360 articles easily.</p>
      </header>
      <main>
        <FileUpload />
      </main>
      <footer style={{ marginTop: '50px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
        &copy; 2026 Content Migration App. Powered by Spring Boot & Apache POI.
      </footer>
    </div>
  )
}

export default App
