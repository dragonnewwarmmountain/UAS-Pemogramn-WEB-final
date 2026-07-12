// apps/frontend/src/features/tasks/components/TaskInspector.tsx
import { useState, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import type { Task, Attachment } from '../types';

interface TaskInspectorProps {
  task: Task | null;
  onClose: () => void;
  onAddComment: (taskId: string, text: string) => void;
  onAddAttachment: (taskId: string, attachment: Attachment) => void; // NEW
}

export function TaskInspector({ task, onClose, onAddComment, onAddAttachment }: TaskInspectorProps) {
  const [commentText, setCommentText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!task) return null;

  const handleCommentSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(task.id, commentText);
    setCommentText('');
  };

  // --- NEW: File Handling Logic ---
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For our MVP local storage, we use a FileReader to create a Base64 string
    const reader = new FileReader();
    reader.onloadend = () => {
      const newAttachment: Attachment = {
        id: Date.now().toString(),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        url: reader.result as string 
      };
      onAddAttachment(task.id, newAttachment);
    };
    reader.readAsDataURL(file); // Triggers the onloadend function
  };

  const formatTime = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp));
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 40, transition: 'all 0.3s ease-in-out' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: '100%', maxWidth: '480px', backgroundColor: '#ffffff', boxShadow: '-10px 0 25px rgba(0, 0, 0, 0.1)', zIndex: 50, display: 'flex', flexDirection: 'column', animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}>
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
        
        <div style={{ padding: '20px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          <h3 style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Task Inspector</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        <div style={{ padding: '30px', overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ marginTop: 0, color: '#0f172a', fontSize: '1.8rem', marginBottom: '15px', lineHeight: '1.2' }}>{task.title}</h2>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            <span style={{ padding: '6px 12px', backgroundColor: task.isCompleted ? '#ecfdf5' : '#f1f5f9', color: task.isCompleted ? '#10b981' : '#475569', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
              Status: {task.status || (task.isCompleted ? 'Done' : 'To-Do')}
            </span>
            <span style={{ padding: '6px 12px', backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
              Agile Weight: {task.difficulty} SP
            </span>
          </div>
          
          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', marginBottom: '30px' }} />

          {/* --- UPGRADED: Asset Governance UI --- */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>Attachments</h4>
            
            {/* Display uploaded files */}
            {task.attachments && task.attachments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                {task.attachments.map(file => (
                  <div key={file.id} style={{ display: 'flex', alignItems: 'center', padding: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                    {file.fileType.startsWith('image/') ? (
                      <img src={file.url} alt={file.fileName} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', marginRight: '12px' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginRight: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.7rem', fontWeight: 'bold' }}>FILE</div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontSize: '0.9rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.fileName}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatBytes(file.fileSize)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Hidden Input & Visual Dropzone */}
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
            <div 
              onClick={() => fileInputRef.current?.click()} 
              style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#94a3b8', backgroundColor: '#f8fafc', cursor: 'pointer', transition: 'background-color 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
            >
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500' }}>Click to upload files</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem' }}>Images, PDFs, or Documents (Max 5MB for Local MVP)</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>Activity & Comments</h4>
            <div style={{ flexGrow: 1, marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {!task.comments || task.comments.length === 0 ? (
                <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', marginTop: '20px' }}>No comments yet. Start the discussion.</p>
              ) : (
                task.comments.map(comment => (
                  <div key={comment.id} style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#0f172a' }}>{comment.author}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatTime(comment.timestamp)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', lineHeight: '1.4' }}>{comment.text}</p>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
              <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." style={{ padding: '10px 15px', flexGrow: 1, borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
              <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#56c596', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Post</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}