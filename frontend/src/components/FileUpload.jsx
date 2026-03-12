import React, { useState } from 'react';
import axios from 'axios';

const FileUpload = () => {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !title) {
            setStatus('Please provide both title and file.');
            return;
        }

        setLoading(true);
        setStatus('Uploading and migrating...');
        setResponse(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);

        try {
            const res = await axios.post('http://localhost:8080/api/migrate', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setResponse(res.data);
            setStatus('Migration Successful!');
        } catch (err) {
            console.error(err);
            setStatus('Migration Failed: ' + (err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Document Migration</h2>
            <form onSubmit={handleUpload} style={styles.form}>
                <div style={styles.inputGroup}>
                    <label>Article Title:</label>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        placeholder="Enter article title"
                        style={styles.input}
                    />
                </div>
                <div style={styles.inputGroup}>
                    <label>Select .docx File:</label>
                    <input 
                        type="file" 
                        accept=".docx" 
                        onChange={handleFileChange} 
                        style={styles.input}
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={loading} 
                    style={loading ? styles.buttonDisabled : styles.button}
                >
                    {loading ? 'Processing...' : 'Migrate to Document360'}
                </button>
            </form>
            
            {status && <p style={styles.status}>{status}</p>}
            
            {response && (
                <div style={styles.responseContainer}>
                    <h3>Backend Response:</h3>
                    <pre style={styles.response}>{JSON.stringify(response, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '600px',
        margin: '50px auto',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
        backgroundColor: '#ffffff',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    title: {
        textAlign: 'center',
        color: '#333',
        marginBottom: '30px'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    input: {
        padding: '12px',
        borderRadius: '6px',
        border: '1px solid #ddd',
        fontSize: '16px'
    },
    button: {
        padding: '14px',
        borderRadius: '6px',
        border: 'none',
        backgroundColor: '#007bff',
        color: 'white',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'background-color 0.3s'
    },
    buttonDisabled: {
        padding: '14px',
        borderRadius: '6px',
        border: 'none',
        backgroundColor: '#ccc',
        color: '#666',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'not-allowed'
    },
    status: {
        marginTop: '20px',
        textAlign: 'center',
        fontWeight: '500',
        color: '#555'
    },
    responseContainer: {
        marginTop: '30px',
        borderTop: '1px solid #eee',
        paddingTop: '20px'
    },
    response: {
        backgroundColor: '#f8f9fa',
        padding: '15px',
        borderRadius: '6px',
        overflowX: 'auto',
        fontSize: '14px',
        color: '#333'
    }
};

export default FileUpload;
