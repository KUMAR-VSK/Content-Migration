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
    Settings,
    Circle,
    Check
} from 'lucide-react';

const FileUpload = () => {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Upload, 2: Preview/Edit, 3: Success
    const [parsedHtml, setParsedHtml] = useState('');
    const [error, setError] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [taskProgress, setTaskProgress] = useState([]);
    
    const fileInputRef = useRef(null);

    // Fetch categories on mount
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/migrate/categories');
            // Support both direct array and {data: []} from Document360
            const cats = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setCategories(cats);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        if (!selectedFile.name.toLowerCase().endsWith('.docx')) {
            setError('Validation Error: Only Microsoft Word (.docx) files are supported.');
            setFile(null);
            return;
        }

        const MAX_SIZE = 10 * 1024 * 1024;
        if (selectedFile.size > MAX_SIZE) {
            setError('Validation Error: File size exceeds the 10MB limit.');
            setFile(null);
            return;
        }

        setFile(selectedFile);
        if (!title) setTitle(selectedFile.name.replace('.docx', ''));
        setError('');
    };

    const startProcessing = async () => {
        if (!file || !title) {
            setError('Form Error: Please provide both an article title and a .docx file.');
            return;
        }

        setLoading(true);
        setTaskProgress([
            { id: 1, label: 'Uploading File', status: 'loading' },
            { id: 2, label: 'Parsing Word Structure', status: 'pending' },
            { id: 3, label: 'Converting to Semantic HTML', status: 'pending' }
        ]);

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Step 1: Upload (simulated split for UX)
            await new Promise(r => setTimeout(r, 600));
            setTaskProgress(prev => prev.map(t => t.id === 1 ? { ...t, status: 'done' } : t.id === 2 ? { ...t, status: 'loading' } : t));

            // Step 2 & 3: Parse & Convert
            const res = await axios.post('http://localhost:8080/api/migrate/parse', formData);
            
            await new Promise(r => setTimeout(r, 800));
            setTaskProgress(prev => prev.map(t => t.id === 2 ? { ...t, status: 'done' } : t.id === 3 ? { ...t, status: 'loading' } : t));
            
            await new Promise(r => setTimeout(r, 600));
            setTaskProgress(prev => prev.map(t => t.id === 3 ? { ...t, status: 'done' } : t));
            
            await new Promise(r => setTimeout(r, 400));
            setParsedHtml(res.data);
            setStep(2);
            setError('');
        } catch (err) {
            setError('Processing Failed: ' + (err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleMigrate = async () => {
        setLoading(true);
        setTaskProgress([
            { id: 1, label: 'Preparing Metadata', status: 'loading' },
            { id: 2, label: 'Sending to Document360 API', status: 'pending' },
            { id: 3, label: 'Finalizing Article', status: 'pending' }
        ]);
        
        const payload = {
            title: title,
            content: parsedHtml,
            categoryId: selectedCategory || null
        };

        try {
            await new Promise(r => setTimeout(r, 500));
            setTaskProgress(prev => prev.map(t => t.id === 1 ? { ...t, status: 'done' } : t.id === 2 ? { ...t, status: 'loading' } : t));

            await axios.post('http://localhost:8080/api/migrate', payload);
            
            setTaskProgress(prev => prev.map(t => t.id === 2 ? { ...t, status: 'done' } : t.id === 3 ? { ...t, status: 'loading' } : t));
            await new Promise(r => setTimeout(r, 700));
            setTaskProgress(prev => prev.map(t => t.id === 3 ? { ...t, status: 'done' } : t));
            
            await new Promise(r => setTimeout(r, 300));
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
        const fileName = file ? file.name.replace(/\.[^/.]+$/, "") : (title || 'document');
        a.download = `${fileName}.html`;
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

    const StatusTracker = ({ tasks }) => (
        <div style={styles.trackerContainer}>
            {tasks.map((task) => (
                <div key={task.id} style={styles.trackerItem}>
                    <div style={{
                        ...styles.trackerIcon,
                        backgroundColor: task.status === 'done' ? '#10b981' : task.status === 'loading' ? '#6366f1' : '#e2e8f0',
                        color: task.status === 'pending' ? '#94a3b8' : 'white'
                    }}>
                        {task.status === 'done' ? <Check size={14} /> : task.status === 'loading' ? <Loader2 size={14} className="spinner" /> : <Circle size={10} fill="#94a3b8" />}
                    </div>
                    <span style={{ 
                        ...styles.trackerLabel, 
                        color: task.status === 'loading' ? '#1e293b' : task.status === 'done' ? '#64748b' : '#94a3b8',
                        fontWeight: task.status === 'loading' ? 600 : 400
                    }}>
                        {task.label}
                    </span>
                </div>
            ))}
        </div>
    );

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
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name || cat.title || "Unknown Category"}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown style={styles.selectIcon} size={18} />
                                </div>
                            </div>
                        </div>

                        <div 
                            style={styles.dropZone}
                            onClick={() => !loading && fileInputRef.current.click()}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                                accept=".docx"
                            />
                            {loading && step === 1 ? (
                                <StatusTracker tasks={taskProgress} />
                            ) : file ? (
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
                            {loading ? (
                                <div style={styles.migratingOverlay}>
                                    <StatusTracker tasks={taskProgress} />
                                </div>
                            ) : (
                                <ReactQuill 
                                    theme="snow" 
                                    value={parsedHtml} 
                                    onChange={setParsedHtml}
                                    modules={quillModules}
                                    style={{ height: '350px' }}
                                />
                            )}
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
                        <div style={styles.successIconCircleCircle}>
                            <CheckCircle size={60} color="#10b981" />
                        </div>
                        <h2 style={{ marginBottom: '0.5rem' }}>Migration Successful!</h2>
                        <p style={{ color: '#64748b', textAlign: 'center', maxWidth: '80%' }}>
                            Your article "<strong>{title}</strong>" has been created and is now available in Document360.
                        </p>
                        <button onClick={reset} style={styles.outlineButton}>Migrate Another Document</button>
                    </motion.div>
                )}
            </AnimatePresence>
            <style>{`
                .spinner { animation: rotate 2s linear infinite; }
                @keyframes rotate { 100% { transform: rotate(360deg); } }
                .quill { border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0 !important; background: white; }
                .ql-toolbar { border-top: none !important; border-left: none !important; border-right: none !important; background: #f8fafc !important; }
                .ql-container { 
                    border: none !important; 
                    font-family: inherit !important; 
                    font-size: 1rem !important;
                    background-image: linear-gradient(rgba(226, 232, 240, 0.5) 1px, transparent 1px);
                    background-size: 100% 2rem;
                }
                .ql-editor { 
                    min-height: 450px; 
                    max-height: 600px;
                    overflow-y: auto; 
                    padding: 2rem !important;
                    line-height: 2rem !important;
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e1 transparent;
                }
                .ql-editor::-webkit-scrollbar { width: 6px; }
                .ql-editor::-webkit-scrollbar-track { background: transparent; }
                .ql-editor::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
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
        fontSize: '2rem',
        fontWeight: 800,
        marginBottom: '1rem',
        color: '#0f172a',
        textAlign: 'left',
        letterSpacing: '-0.02em'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr',
        gap: '2rem',
        marginBottom: '2rem',
        textAlign: 'left'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
    },
    label: {
        fontSize: '0.875rem',
        fontWeight: 600,
        marginBottom: '0.75rem',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    },
    input: {
        padding: '14px 20px',
        borderRadius: '16px',
        border: '2px solid #f1f5f9',
        fontSize: '1rem',
        outline: 'none',
        transition: 'all 0.3s ease',
        backgroundColor: '#f8fafc',
        color: '#1e293b',
        fontWeight: 500
    },
    selectWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
    },
    select: {
        width: '100%',
        padding: '14px 20px',
        borderRadius: '16px',
        border: '2px solid #f1f5f9',
        appearance: 'none',
        fontSize: '1.0rem',
        backgroundColor: '#f8fafc',
        outline: 'none',
        cursor: 'pointer',
        color: '#1e293b',
        fontWeight: 500
    },
    selectIcon: {
        position: 'absolute',
        right: '16px',
        pointerEvents: 'none',
        color: '#94a3b8'
    },
    dropZone: {
        border: '2px dashed #e2e8f0',
        borderRadius: '24px',
        padding: '4rem 2rem',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: '#fbfcfd',
        marginBottom: '2.5rem',
        position: 'relative',
        transition: 'all 0.3s ease',
        minHeight: '220px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)'
    },
    uploadIconCircle: {
        width: '80px',
        height: '80px',
        borderRadius: '24px',
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    },
    uploadPrompt: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
    },
    fileInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        justifyContent: 'center',
        color: '#0f172a',
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    removeBtn: {
        background: '#fef2f2',
        border: 'none',
        padding: '8px',
        borderRadius: '12px',
        cursor: 'pointer',
        color: '#ef4444',
        display: 'flex',
        marginLeft: '10px',
        transition: 'all 0.2s'
    },
    button: {
        width: '100%',
        padding: '18px',
        borderRadius: '20px',
        border: 'none',
        backgroundColor: '#6366f1',
        color: 'white',
        fontSize: '1.125rem',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)'
    },
    buttonDisabled: {
        width: '100%',
        padding: '18px',
        borderRadius: '20px',
        border: 'none',
        backgroundColor: '#f1f5f9',
        color: '#94a3b8',
        fontSize: '1.125rem',
        fontWeight: 700,
        cursor: 'not-allowed'
    },
    editorContainer: {
        marginBottom: '2rem',
        backgroundColor: 'white',
        borderRadius: '24px',
        position: 'relative',
        minHeight: '450px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
    },
    previewHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        textAlign: 'left'
    },
    previewActions: {
        display: 'flex',
        gap: '1rem'
    },
    iconButton: {
        background: 'white',
        border: '1px solid #e2e8f0',
        padding: '12px',
        borderRadius: '14px',
        cursor: 'pointer',
        color: '#475569',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    },
    footerActions: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
    },
    infoRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.925rem',
        color: '#64748b',
        justifyContent: 'center',
        fontWeight: 500
    },
    successScreen: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem 0'
    },
    successIconCircleCircle: {
        width: '120px',
        height: '120px',
        borderRadius: '40px',
        backgroundColor: '#f0fdf4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '2.5rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    },
    outlineButton: {
        padding: '14px 40px',
        borderRadius: '16px',
        border: '2px solid #6366f1',
        backgroundColor: 'transparent',
        color: '#6366f1',
        fontSize: '1.0rem',
        fontWeight: 700,
        cursor: 'pointer',
        marginTop: '2.5rem',
        transition: 'all 0.3s'
    },
    error: {
        color: '#e11d48',
        fontSize: '0.925rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontWeight: 600,
        padding: '14px 20px',
        backgroundColor: '#fff1f2',
        borderRadius: '16px',
        border: '1px solid #ffe4e6'
    },
    trackerContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        padding: '1.5rem',
        textAlign: 'left',
        width: '100%',
        maxWidth: '340px'
    },
    trackerItem: {
        display: 'flex',
        alignItems: 'center', gap: '1.25rem'
    },
    trackerIcon: {
        width: '32px',
        height: '32px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.05)'
    },
    trackerLabel: {
        fontSize: '1rem',
        transition: 'all 0.3s ease'
    },
    migratingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.92)',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '24px',
        backdropFilter: 'blur(4px)'
    }
};

export default FileUpload;
