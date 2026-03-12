import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { 
    Upload, 
    FileText, 
    Download, 
    Send, 
    CheckCircle, 
    AlertCircle, 
    Loader2, 
    X,
    ChevronDown,
    Settings
} from 'lucide-react';

const FileUpload = () => {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Upload, 2: Preview/Edit, 3: Success
    const [parsedHtml, setParsedHtml] = useState('');
    const [error, setError] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const fileInputRef = useRef(null);

    // Fetch categories on mount
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/migrate/categories');
            // Assuming res.data is the JSON from Document360
            // The API usually returns an object with a 'data' array or just an array
            // We'll handle it robustly
            const cats = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setCategories(cats);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

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
        
        const params = new URLSearchParams();
        params.append('title', title);
        params.append('content', parsedHtml);
        if (selectedCategory) {
            params.append('categoryId', selectedCategory);
        }

        try {
            await axios.post('http://localhost:8080/api/migrate', params);
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
        setSelectedCategory('');
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
                        
                        <div style={styles.grid}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Article Title</label>
                                <input 
                                    type="text" 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)} 
                                    placeholder="e.g. User Guide"
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Target Category</label>
                                <div style={styles.selectWrapper}>
                                    <select 
                                        value={selectedCategory} 
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        style={styles.select}
                                    >
                                        <option value="">Select Category (Optional)</option>
                                        {categories.map(cat => (
                                            <option key={cat.id || cat.id} value={cat.id || cat.id}>
                                                {cat.name || cat.title}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown style={styles.selectIcon} size={18} />
                                </div>
                            </div>
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
                                    <FileText size={48} color="#6366f1" />
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: 600 }}>{file.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{(file.size / 1024).toFixed(1)} KB</div>
                                    </div>
                                    <button onClick={(e) => {e.stopPropagation(); setFile(null)}} style={styles.removeBtn}><X size={16} /></button>
                                </div>
                            ) : (
                                <div style={styles.uploadPrompt}>
                                    <div style={styles.uploadIconCircle}>
                                        <Upload size={32} color="#6366f1" />
                                    </div>
                                    <p style={{ fontWeight: 600, color: '#1e293b' }}>Click to upload or drag and drop</p>
                                    <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Microsoft Word (.docx) files only</p>
                                </div>
                            )}
                        </div>

                        {error && <div style={styles.error}><AlertCircle size={18} /> {error}</div>}

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
                        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    >
                        <div style={styles.previewHeader}>
                            <div>
                                <h3 style={{ margin: 0, color: '#1e293b' }}>Editor & Preview</h3>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Tweak the formatting before migration</p>
                            </div>
                            <div style={styles.previewActions}>
                                <button onClick={downloadHtml} style={styles.iconButton} title="Download HTML">
                                    <Download size={20} />
                                </button>
                                <button onClick={reset} style={styles.iconButton} title="Cancel">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div style={styles.editorContainer}>
                            <ReactQuill 
                                theme="snow" 
                                value={parsedHtml} 
                                onChange={setParsedHtml}
                                modules={quillModules}
                                style={{ height: '350px' }}
                            />
                        </div>

                        <div style={styles.footerActions}>
                            <div style={styles.infoRow}>
                                <Settings size={16} color="#64748b" />
                                <span>Target: {categories.find(c => c.id === selectedCategory)?.name || 'Root Category'}</span>
                            </div>
                            <button onClick={handleMigrate} disabled={loading} style={styles.button}>
                                {loading ? <Loader2 className="spinner" /> : <><Send size={18} /> Migrate to Document360</>}
                            </button>
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
                        <div style={styles.successIconCircle}>
                            <CheckCircle size={60} color="#10b981" />
                        </div>
                        <h2 style={{ marginBottom: '0.5rem' }}>Migration Successful!</h2>
                        <p style={{ color: '#64748b', textAlign: 'center', maxWidth: '80%' }}>
                            Your article "<strong>{title}</strong>" has been created and is now available in Document360.
                        </p>
                        <button onClick={reset} style={styles.outlineButton}>Create Another Migration</button>
                    </motion.div>
                )}
            </AnimatePresence>
            <style>{`
                .spinner { animation: rotate 2s linear infinite; }
                @keyframes rotate { 100% { transform: rotate(360deg); } }
                .quill { border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0 !react-important; }
                .ql-toolbar { border-top: none !important; border-left: none !important; border-right: none !important; background: #f8fafc !important; }
                .ql-container { border: none !important; font-family: inherit !important; font-size: 1rem !important; }
                .ql-editor { min-height: 300px; max-height: 350px; overflow-y: auto; }
            `}</style>
        </div>
    );
};

const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image', 'clean']
    ],
};

const styles = {
    cardHeader: {
        fontSize: '1.75rem',
        fontWeight: 800,
        marginBottom: '1.5rem',
        color: '#1e293b',
        textAlign: 'left'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem',
        marginBottom: '1.5rem'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
    },
    label: {
        fontSize: '0.875rem',
        fontWeight: 600,
        marginBottom: '0.6rem',
        color: '#475569'
    },
    input: {
        padding: '12px 16px',
        borderRadius: '12px',
        border: '2px solid #e2e8f0',
        fontSize: '1rem',
        outline: 'none',
        transition: 'all 0.2s',
        backgroundColor: '#fff',
        '&:focus': { borderColor: '#6366f1', boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.1)' }
    },
    selectWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
    },
    select: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '2px solid #e2e8f0',
        appearance: 'none',
        fontSize: '1rem',
        backgroundColor: '#fff',
        outline: 'none',
        cursor: 'pointer'
    },
    selectIcon: {
        position: 'absolute',
        right: '12px',
        pointerEvents: 'none',
        color: '#64748b'
    },
    dropZone: {
        border: '2px dashed #cbd5e1',
        borderRadius: '20px',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: 'rgba(248, 250, 252, 0.5)',
        marginBottom: '2rem',
        position: 'relative',
        transition: 'all 0.3s'
    },
    uploadIconCircle: {
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1rem'
    },
    uploadPrompt: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
    },
    fileInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        justifyContent: 'center',
        color: '#1e293b',
    },
    removeBtn: {
        background: '#fee2e2',
        border: 'none',
        padding: '6px',
        borderRadius: '50%',
        cursor: 'pointer',
        color: '#ef4444',
        display: 'flex',
        marginLeft: '10px'
    },
    button: {
        width: '100%',
        padding: '16px',
        borderRadius: '14px',
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
        transition: 'all 0.2s',
        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
    },
    buttonDisabled: {
        width: '100%',
        padding: '16px',
        borderRadius: '14px',
        border: 'none',
        backgroundColor: '#e2e8f0',
        color: '#94a3b8',
        fontSize: '1rem',
        fontWeight: 700,
        cursor: 'not-allowed'
    },
    editorContainer: {
        marginBottom: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '12px'
    },
    previewHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1.5rem',
        textAlign: 'left'
    },
    previewActions: {
        display: 'flex',
        gap: '0.75rem'
    },
    iconButton: {
        background: '#fff',
        border: '1px solid #e2e8f0',
        padding: '10px',
        borderRadius: '10px',
        cursor: 'pointer',
        color: '#475569',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s'
    },
    footerActions: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
    },
    infoRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem',
        color: '#64748b',
        justifyContent: 'center'
    },
    successScreen: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1rem 0'
    },
    successIconCircle: {
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        backgroundColor: '#ecfdf5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem'
    },
    outlineButton: {
        padding: '12px 32px',
        borderRadius: '12px',
        border: '2px solid #6366f1',
        backgroundColor: 'transparent',
        color: '#6366f1',
        fontSize: '1rem',
        fontWeight: 700,
        cursor: 'pointer',
        marginTop: '2rem',
        transition: 'all 0.2s'
    },
    error: {
        color: '#ef4444',
        fontSize: '0.9rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        fontWeight: 600,
        padding: '12px',
        backgroundColor: '#fef2f2',
        borderRadius: '10px'
    }
};

export default FileUpload;
