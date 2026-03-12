import React, { useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Upload, 
    FileText, 
    Download, 
    Send, 
    CheckCircle, 
    AlertCircle, 
    Loader2, 
    ArrowRight,
    X
} from 'lucide-react';

const FileUpload = () => {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Upload, 2: Preview/Confirm, 3: Success
    const [parsedHtml, setParsedHtml] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.name.endsWith('.docx')) {
            setFile(selectedFile);
            setError('');
        } else {
            setError('Please select a valid .docx file.');
        }
    };

    const startProcessing = async () => {
        if (!file || !title) {
            setError('Please provide both title and file.');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post('http://localhost:8080/api/migrate/parse', formData);
            setParsedHtml(res.data);
            setStep(2);
            setError('');
        } catch (err) {
            setError('Parsing Failed: ' + (err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleMigrate = async () => {
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);

        try {
            await axios.post('http://localhost:8080/api/migrate', formData);
            setStep(3);
            setError('');
        } catch (err) {
            setError('Migration Failed: ' + (err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    const downloadHtml = () => {
        const blob = new Blob([parsedHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/\s+/g, '_')}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const reset = () => {
        setFile(null);
        setTitle('');
        setStep(1);
        setParsedHtml('');
        setError('');
    };

    return (
        <div className="migration-card">
            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div 
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        <h3 style={styles.cardHeader}>Upload Document</h3>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Article Title</label>
                            <input 
                                type="text" 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                                placeholder="e.g. Introduction to Project"
                                style={styles.input}
                            />
                        </div>

                        <div 
                            style={styles.dropZone}
                            onClick={() => fileInputRef.current.click()}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                                accept=".docx"
                            />
                            {file ? (
                                <div style={styles.fileInfo}>
                                    <FileText size={40} color="#6366f1" />
                                    <span>{file.name}</span>
                                    <button onClick={(e) => {e.stopPropagation(); setFile(null)}} style={styles.removeBtn}><X size={16} /></button>
                                </div>
                            ) : (
                                <div style={styles.uploadPrompt}>
                                    <Upload size={40} color="#94a3b8" />
                                    <p>Click or drag .docx file here</p>
                                </div>
                            )}
                        </div>

                        {error && <div style={styles.error}><AlertCircle size={16} /> {error}</div>}

                        <button 
                            onClick={startProcessing} 
                            disabled={loading || !file || !title}
                            style={loading || !file || !title ? styles.buttonDisabled : styles.button}
                        >
                            {loading ? <Loader2 className="spinner" /> : 'Process Document'}
                        </button>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div 
                        key="step2"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                    >
                        <div style={styles.previewHeader}>
                            <h3 style={{ margin: 0 }}>Preview & Confirm</h3>
                            <div style={styles.previewActions}>
                                <button onClick={downloadHtml} style={styles.iconButton} title="Download HTML">
                                    <Download size={20} />
                                </button>
                                <button onClick={reset} style={styles.iconButton} title="Cancel">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div style={styles.previewContainer}>
                            <div className="scanning-line"></div>
                            <div 
                                style={styles.htmlPreview} 
                                dangerouslySetInnerHTML={{ __html: parsedHtml }} 
                            />
                        </div>

                        <div style={styles.confirmationBox}>
                            <p style={{ margin: '0 0 1rem 0', fontWeight: 600 }}>Ready to migrate to Document360?</p>
                            <div style={styles.btnRow}>
                                <button onClick={handleMigrate} disabled={loading} style={styles.button}>
                                    {loading ? <Loader2 className="spinner" /> : <><Send size={18} /> Confirm Migration</>}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div 
                        key="step3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={styles.successScreen}
                    >
                        <CheckCircle size={80} color="#10b981" />
                        <h2>Migration Successful!</h2>
                        <p>Your article "<strong>{title}</strong>" has been created in Document360.</p>
                        <button onClick={reset} style={styles.outlineButton}>Create Another</button>
                    </motion.div>
                )}
            </AnimatePresence>
            <style>{`
                .spinner { animation: rotate 2s linear infinite; }
                @keyframes rotate { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

const styles = {
    cardHeader: {
        fontSize: '1.5rem',
        fontWeight: 700,
        marginBottom: '1.5rem',
        color: '#1e293b'
    },
    inputGroup: {
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
    },
    label: {
        fontSize: '0.875rem',
        fontWeight: 600,
        marginBottom: '0.5rem',
        color: '#64748b'
    },
    input: {
        padding: '12px 16px',
        borderRadius: '12px',
        border: '2px solid #e2e8f0',
        fontSize: '1rem',
        outline: 'none',
        transition: 'border-color 0.2s',
        '&:focus': { borderColor: '#6366f1' }
    },
    dropZone: {
        border: '2px dashed #cbd5e1',
        borderRadius: '16px',
        padding: '3rem 1rem',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: '#f8fafc',
        marginBottom: '2rem',
        position: 'relative',
        transition: 'all 0.2s'
    },
    uploadPrompt: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#64748b'
    },
    fileInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        justifyContent: 'center',
        color: '#1e293b',
        fontWeight: 500
    },
    button: {
        width: '100%',
        padding: '14px',
        borderRadius: '12px',
        border: 'none',
        backgroundColor: '#6366f1',
        color: 'white',
        fontSize: '1rem',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        transition: 'background-color 0.2s'
    },
    buttonDisabled: {
        width: '100%',
        padding: '14px',
        borderRadius: '12px',
        border: 'none',
        backgroundColor: '#e2e8f0',
        color: '#94a3b8',
        fontSize: '1rem',
        fontWeight: 700,
        cursor: 'not-allowed'
    },
    outlineButton: {
        padding: '12px 24px',
        borderRadius: '12px',
        border: '2px solid #6366f1',
        backgroundColor: 'transparent',
        color: '#6366f1',
        fontSize: '1rem',
        fontWeight: 700,
        cursor: 'pointer',
        marginTop: '1.5rem'
    },
    error: {
        color: '#ef4444',
        fontSize: '0.875rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontWeight: 500
    },
    previewHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
    },
    previewActions: {
        display: 'flex',
        gap: '0.5rem'
    },
    iconButton: {
        background: '#f1f5f9',
        border: 'none',
        padding: '8px',
        borderRadius: '8px',
        cursor: 'pointer',
        color: '#475569',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    previewContainer: {
        position: 'relative',
        height: '300px',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '1.5rem',
        backgroundColor: 'white'
    },
    htmlPreview: {
        padding: '1.5rem',
        height: '100%',
        overflowY: 'auto',
        textAlign: 'left',
        fontSize: '0.9rem',
        color: '#334155'
    },
    confirmationBox: {
        textAlign: 'center',
        padding: '1.5rem',
        backgroundColor: '#f8fafc',
        borderRadius: '16px'
    },
    successScreen: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem 0'
    },
    removeBtn: {
        background: '#fee2e2',
        border: 'none',
        padding: '4px',
        borderRadius: '50%',
        cursor: 'pointer',
        color: '#ef4444'
    }
};

export default FileUpload;
