import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './FileUpload.css';
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
            await new Promise(r => setTimeout(r, 600));
            setTaskProgress(prev => prev.map(t => t.id === 1 ? { ...t, status: 'done' } : t.id === 2 ? { ...t, status: 'loading' } : t));

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
        <div className="tracker-container">
            {tasks.map((task) => (
                <div key={task.id} className="tracker-item">
                    <div className="tracker-icon" style={{
                        backgroundColor: task.status === 'done' ? '#10b981' : task.status === 'loading' ? '#6366f1' : '#e2e8f0',
                        color: task.status === 'pending' ? '#94a3b8' : 'white'
                    }}>
                        {task.status === 'done' ? <Check size={14} /> : task.status === 'loading' ? <Loader2 size={14} className="spinner" /> : <Circle size={10} fill="#94a3b8" />}
                    </div>
                    <span className="tracker-label" style={{ 
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
                        <h3 className="card-header">Upload Document</h3>
                        
                        <div className="input-grid">
                            <div className="input-group">
                                <label className="input-label">Article Title</label>
                                <input 
                                    type="text" 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)} 
                                    placeholder="e.g. User Guide"
                                    className="form-input"
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Target Category</label>
                                <div className="select-wrapper">
                                    <select 
                                        value={selectedCategory} 
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="">Select Category (Optional)</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name || cat.title || "Unknown Category"}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="select-icon" size={18} />
                                </div>
                            </div>
                        </div>

                        <div 
                            className="drop-zone"
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
                                <div className="file-info-container">
                                    <FileText size={48} color="#6366f1" />
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: 600 }}>{file.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{(file.size / 1024).toFixed(1)} KB</div>
                                    </div>
                                    <button onClick={(e) => {e.stopPropagation(); setFile(null)}} className="remove-file-btn"><X size={16} /></button>
                                </div>
                            ) : (
                                <div className="upload-prompt">
                                    <div className="upload-icon-circle">
                                        <Upload size={32} color="#6366f1" />
                                    </div>
                                    <p style={{ fontWeight: 600, color: '#1e293b' }}>Click to upload or drag and drop</p>
                                    <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Microsoft Word (.docx) files only</p>
                                </div>
                            )}
                        </div>

                        {error && <div className="error-message"><AlertCircle size={18} /> {error}</div>}

                        <button 
                            onClick={startProcessing} 
                            disabled={loading || !file || !title}
                            className={loading || !file || !title ? "primary-button disabled" : "primary-button"}
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
                        <div className="preview-header">
                            <div>
                                <h3 style={{ margin: 0, color: '#1e293b' }}>Editor & Preview</h3>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Tweak the formatting before migration</p>
                            </div>
                            <div className="action-buttons">
                                <button onClick={downloadHtml} className="icon-btn" title="Download HTML">
                                    <Download size={20} />
                                </button>
                                <button onClick={reset} className="icon-btn" title="Cancel">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="editor-preview-container">
                            {loading ? (
                                <div className="overlay-container">
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

                        <div className="footer-actions">
                            <div className="info-status-row">
                                <Settings size={16} color="#64748b" />
                                <span>Target: {categories.find(c => c.id === selectedCategory)?.name || 'Root Category'}</span>
                            </div>
                            <button onClick={handleMigrate} disabled={loading} className="primary-button">
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
                        className="success-container"
                    >
                        <div className="success-icon-wrapper">
                            <CheckCircle size={60} color="#10b981" />
                        </div>
                        <h2 style={{ marginBottom: '0.5rem' }}>Migration Successful!</h2>
                        <p style={{ color: '#64748b', textAlign: 'center', maxWidth: '80%' }}>
                            Your article "<strong>{title}</strong>" has been created and is now available in Document360.
                        </p>
                        <button onClick={reset} className="outline-btn">Migrate Another Document</button>
                    </motion.div>
                )}
            </AnimatePresence>
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

export default FileUpload;
