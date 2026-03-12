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
    Check,
    Plus,
    Files,
    ArrowRight
} from 'lucide-react';

const FileUpload = () => {
    // State management
    const [documents, setDocuments] = useState([]);
    const [step, setStep] = useState(1); // 1: Queue, 2: Preview/Edit, 3: Success
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [globalProgress, setGlobalProgress] = useState({ current: 0, total: 0 });
    const [currentEditIndex, setCurrentEditIndex] = useState(0);

    const fileInputRef = useRef(null);

    // Fetch categories on mount
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/migrate/categories');
            const cats = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setCategories(cats);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        addFilesToList(files);
    };

    const addFilesToList = (files) => {
        const newDocs = files.map(file => {
            if (!file.name.toLowerCase().endsWith('.docx')) {
                setError(`File "${file.name}" ignored. Only .docx files supported.`);
                return null;
            }
            if (file.size > 10 * 1024 * 1024) {
                setError(`File "${file.name}" ignored. Max size 10MB.`);
                return null;
            }
            return {
                id: Math.random().toString(36).substr(2, 9),
                file: file,
                title: file.name.replace('.docx', ''),
                htmlContent: '',
                status: 'pending', // pending, parsing, parsed, migrating, migrated, error
                error: ''
            };
        }).filter(Boolean);

        setDocuments(prev => [...prev, ...newDocs]);
        setError('');
    };

    const removeDoc = (index) => {
        setDocuments(prev => prev.filter((_, i) => i !== index));
    };

    const updateDocTitle = (index, newTitle) => {
        setDocuments(prev => {
            const copy = [...prev];
            copy[index].title = newTitle;
            return copy;
        });
    };

    const processAll = async () => {
        if (documents.length === 0) return;
        setLoading(true);
        setGlobalProgress({ current: 0, total: documents.length });

        for (let i = 0; i < documents.length; i++) {
            if (documents[i].status === 'parsed') continue;

            setDocuments(prev => prev.map((doc, idx) => i === idx ? { ...doc, status: 'parsing' } : doc));
            setGlobalProgress(prev => ({ ...prev, current: i + 1 }));

            const formData = new FormData();
            formData.append('file', documents[i].file);

            try {
                const res = await axios.post('http://localhost:8080/api/migrate/parse', formData);
                setDocuments(prev => prev.map((doc, idx) => i === idx ? { ...doc, status: 'parsed', htmlContent: res.data } : doc));
            } catch (err) {
                setDocuments(prev => prev.map((doc, idx) => i === idx ? { ...doc, status: 'error', error: err.response?.data || err.message } : doc));
            }
        }
        setLoading(false);
        setStep(2);
        setCurrentEditIndex(0);
    };

    const migrateAll = async () => {
        setLoading(true);
        setGlobalProgress({ current: 0, total: documents.length });

        for (let i = 0; i < documents.length; i++) {
            if (documents[i].status === 'migrated') continue;

            setDocuments(prev => prev.map((doc, idx) => i === idx ? { ...doc, status: 'migrating' } : doc));
            setGlobalProgress(prev => ({ ...prev, current: i + 1 }));

            const payload = {
                title: documents[i].title,
                content: documents[i].htmlContent,
                categoryId: selectedCategory || null
            };

            try {
                await axios.post('http://localhost:8080/api/migrate', payload);
                setDocuments(prev => prev.map((doc, idx) => i === idx ? { ...doc, status: 'migrated' } : doc));
            } catch (err) {
                setDocuments(prev => prev.map((doc, idx) => i === idx ? { ...doc, status: 'error', error: err.response?.data || err.message } : doc));
                setLoading(false);
                return; // Stop if one fails
            }
        }
        setLoading(false);
        setStep(3);
    };

    const reset = () => {
        setDocuments([]);
        setStep(1);
        setError('');
        setSelectedCategory('');
        setLoading(false);
    };

    const currentDoc = documents[currentEditIndex];

    return (
        <div className="migration-card" style={{ maxWidth: step === 2 ? '1000px' : '800px' }}>
            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div style={styles.headerRow}>
                            <h3 style={styles.cardHeader}>Document Queue</h3>
                            <div style={styles.categoryBadge}>
                                <Settings size={14} />
                                <select 
                                    value={selectedCategory} 
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    style={styles.inlineSelect}
                                >
                                    <option value="">Move all to: Root Category</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div 
                            style={styles.dropZoneBatch}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.preventDefault(); addFilesToList(Array.from(e.dataTransfer.files)); }}
                        >
                            {documents.length === 0 ? (
                                <div onClick={() => fileInputRef.current.click()} style={{ cursor: 'pointer' }}>
                                    <Files size={48} color="#6366f1" style={{ marginBottom: '1rem' }} />
                                    <p style={{ fontWeight: 600 }}>Drag & drop multiple files or click to browse</p>
                                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Supports multiple .docx uploads at once</p>
                                </div>
                            ) : (
                                <div style={styles.queueGrid}>
                                    {documents.map((doc, idx) => (
                                        <div key={doc.id} style={styles.queueItem}>
                                            <div style={styles.queueIcon}><FileText size={20} color="#6366f1" /></div>
                                            <div style={styles.queueDetails}>
                                                <input 
                                                    value={doc.title} 
                                                    onChange={(e) => updateDocTitle(idx, e.target.value)}
                                                    style={styles.queueInput}
                                                    placeholder="Enter article title..."
                                                />
                                                <span style={styles.queueMeta}>{(doc.file.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                            <button onClick={() => removeDoc(idx)} style={styles.removeBtnSmall}><X size={14} /></button>
                                        </div>
                                    ))}
                                    <button onClick={() => fileInputRef.current.click()} style={styles.addMoreBtn}>
                                        <Plus size={20} /> Add More
                                    </button>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} hidden multiple onChange={handleFileChange} accept=".docx" />
                        </div>

                        {error && <div style={styles.error}><AlertCircle size={18} /> {error}</div>}

                        <button 
                            onClick={processAll} 
                            disabled={loading || documents.length === 0}
                            style={loading || documents.length === 0 ? styles.buttonDisabled : styles.button}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="spinner" /> 
                                    Processing {globalProgress.current} of {globalProgress.total}...
                                </>
                            ) : (
                                <>Start Parsing Queue <ArrowRight size={18} /></>
                            )}
                        </button>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.previewContainer}>
                        <div style={styles.editorSidebar}>
                            <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Files size={18} /> Documents ({documents.length})
                            </h4>
                            {documents.map((doc, idx) => (
                                <div 
                                    key={doc.id} 
                                    onClick={() => setCurrentEditIndex(idx)}
                                    style={{
                                        ...styles.sidebarItem,
                                        backgroundColor: currentEditIndex === idx ? '#eff6ff' : 'transparent',
                                        borderLeft: currentEditIndex === idx ? '4px solid #6366f1' : '4px solid transparent'
                                    }}
                                >
                                    <div style={{...styles.sidebarStatus, backgroundColor: doc.status === 'migrated' ? '#10b981' : doc.status === 'error' ? '#ef4444' : '#6366f1' }}>
                                        {doc.status === 'migrated' ? <Check size={10} /> : doc.status === 'error' ? <X size={10} /> : idx + 1}
                                    </div>
                                    <div style={styles.sidebarLabel}>{doc.title}</div>
                                </div>
                            ))}
                        </div>

                        <div style={styles.editorMain}>
                            <div style={styles.previewHeaderRow}>
                                <div>
                                    <h3 style={{ margin: 0 }}>Editing: {currentDoc?.title}</h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Customize the HTML structure for this article</p>
                                </div>
                                <div style={styles.batchStats}>
                                    <span style={styles.statItem}>Ready: {documents.filter(d => d.status === 'parsed').length}</span>
                                    <button onClick={migrateAll} disabled={loading} style={styles.migrateMiniBtn}>
                                        {loading ? <Loader2 className="spinner" size={16} /> : <Send size={16} />} Migrate Queue
                                    </button>
                                </div>
                            </div>

                            <div style={styles.editorWrapperBatch}>
                                {loading && activeTask === 'migrating' && (
                                    <div style={styles.migratingOverlay}>
                                        <div style={styles.loadingBox}>
                                            <Loader2 size={32} className="spinner" color="#6366f1" />
                                            <p>Migrating document {globalProgress.current} of {globalProgress.total}...</p>
                                            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{documents[globalProgress.current-1]?.title}</p>
                                        </div>
                                    </div>
                                )}
                                <ReactQuill 
                                    theme="snow" 
                                    value={currentDoc?.htmlContent || ''} 
                                    onChange={(val) => {
                                        setDocuments(prev => {
                                            const copy = [...prev];
                                            copy[currentEditIndex].htmlContent = val;
                                            return copy;
                                        });
                                    }}
                                    style={{ height: '450px' }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={styles.successGrid}>
                        <div style={styles.successIconCircleBatch}>
                            <Check size={48} color="white" />
                        </div>
                        <h2>Batch Migration Complete!</h2>
                        <div style={styles.summaryBox}>
                            <div style={styles.summaryItem}><span>Total Documents</span> <strong>{documents.length}</strong></div>
                            <div style={styles.summaryItem}><span>Successfully Migrated</span> <strong style={{color: '#10b981'}}>{documents.filter(d => d.status === 'migrated').length}</strong></div>
                            <div style={styles.summaryItem}><span>Target Category</span> <strong>{categories.find(c => c.id === selectedCategory)?.name || 'Root'}</strong></div>
                        </div>
                        <div style={styles.buttonRow}>
                            <button onClick={reset} style={styles.button}>Start New Batch</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .spinner { animation: rotate 2s linear infinite; }
                @keyframes rotate { 100% { transform: rotate(360deg); } }
                .quill { border-radius: 12px; border: 1px solid #e2e8f0 !important; }
                .ql-toolbar { border-radius: 12px 12px 0 0; background: #f8fafc !important; }
                .ql-container { min-height: 400px; }
            `}</style>
        </div>
    );
};

const styles = {
    cardHeader: { fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#1e293b' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
    categoryBadge: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '6px 12px', borderRadius: '10px' },
    inlineSelect: { border: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: 600, outline: 'none', cursor: 'pointer' },
    dropZoneBatch: {
        border: '2px dashed #cbd5e1',
        borderRadius: '24px',
        padding: '2rem',
        backgroundColor: 'rgba(248, 250, 252, 0.4)',
        minHeight: '300px',
        marginBottom: '2rem'
    },
    queueGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
    queueItem: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem', 
        background: 'white', 
        padding: '12px', 
        borderRadius: '16px', 
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
    },
    queueDetails: { flex: 1, display: 'flex', flexDirection: 'column' },
    queueInput: { border: 'none', fontWeight: 600, fontSize: '0.9rem', outline: 'none', width: '100%', color: '#334155' },
    queueMeta: { fontSize: '0.75rem', color: '#94a3b8' },
    addMoreBtn: { 
        border: '2px dashed #e2e8f0', 
        borderRadius: '16px', 
        background: 'transparent', 
        color: '#6366f1', 
        fontWeight: 600, 
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '12px'
    },
    button: { width: '100%', padding: '16px', borderRadius: '16px', background: '#6366f1', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '0.75rem' },
    previewContainer: { display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem', minHeight: '600px' },
    editorSidebar: { borderRight: '1px solid #e2e8f0', paddingRight: '1.5rem', textAlign: 'left' },
    sidebarItem: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '12px', borderRadius: '12px', cursor: 'pointer', marginBottom: '0.5rem', transition: 'all 0.2s' },
    sidebarStatus: { width: '20px', height: '20px', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 },
    sidebarLabel: { fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    editorMain: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    previewHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' },
    batchStats: { display: 'flex', alignItems: 'center', gap: '1rem' },
    statItem: { fontSize: '0.85rem', fontWeight: 600, color: '#64748b' },
    migrateMiniBtn: { background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', gap: '0.5rem' },
    editorWrapperBatch: { position: 'relative', borderRadius: '12px', background: 'white' },
    migratingOverlay: { position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    loadingBox: { background: 'white', padding: '2rem', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center' },
    successGrid: { textAlign: 'center', padding: '2rem' },
    successIconCircleBatch: { background: '#10b981', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)' },
    summaryBox: { background: '#f8fafc', borderRadius: '20px', padding: '1.5rem', width: '100%', maxWidth: '400px', margin: '2rem auto', border: '1px solid #e2e8f0' },
    summaryItem: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }
};

export default FileUpload;
