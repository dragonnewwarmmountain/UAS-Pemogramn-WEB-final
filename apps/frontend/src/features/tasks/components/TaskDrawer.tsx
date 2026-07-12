// apps/frontend/src/features/tasks/components/TaskDrawer.tsx
import { useCallback, useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import type { Task, SubTask, Attachment } from '../types';

// ============================================================================
// 1. KOMPONEN SUB-TUGAS 
// ============================================================================
interface SubTaskItemProps {
  task: Task;
  subTask: SubTask;
  isLocked: boolean;
  toggleSubTask: (taskId: string, subTaskId: string) => void;
  deleteSubTask: (taskId: string, subTaskId: string) => void;
  onUpdateTask: (updatedTask: Task) => void;
  onPreviewFile?: (file: Attachment) => void; // Passed down for specific file viewing
}

function SubTaskItem({ task, subTask, isLocked, toggleSubTask, deleteSubTask, onUpdateTask, onPreviewFile }: SubTaskItemProps) {
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (isLocked) return;
    const newAttachments: Attachment[] = acceptedFiles.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type, 
      url: URL.createObjectURL(file) 
    }));
    
    const updatedSubTasks = (task.subTasks || []).map(st => 
      st.id === subTask.id 
        ? { ...st, attachments: [...(st.attachments || []), ...newAttachments] } 
        : st
    );
    onUpdateTask({ ...task, subTasks: updatedSubTasks });
  }, [task, subTask, isLocked, onUpdateTask]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ onDrop, noClick: true, disabled: isLocked });

  const handleAddLink = (e: FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    
    let safeUrl = linkUrl.trim();
    if (!safeUrl.startsWith('http://') && !safeUrl.startsWith('https://')) {
      safeUrl = 'https://' + safeUrl;
    }
    
    const newLink: Attachment = { 
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9), 
      fileName: safeUrl.replace(/^https?:\/\//, ''), 
      fileSize: 0, 
      fileType: 'link', 
      url: safeUrl 
    };
    
    const updatedSubTasks = (task.subTasks || []).map(st => 
      st.id === subTask.id 
        ? { ...st, attachments: [...(st.attachments || []), newLink] } 
        : st
    );
    
    onUpdateTask({ ...task, subTasks: updatedSubTasks });
    setLinkUrl(''); 
    setIsAddingLink(false);
  };

  return (
    <li 
      {...getRootProps()}
      style={{ 
        display: 'flex', flexDirection: 'column', padding: '10px 14px', marginBottom: '8px', 
        backgroundColor: isDragActive ? '#f0fdf4' : (isLocked ? '#f8fafc' : '#ffffff'), 
        border: isDragActive ? '1px dashed #56c596' : '1px solid #e2e8f0', borderRadius: '8px', 
        transition: 'all 0.2s ease',
        opacity: isLocked ? 0.6 : 1,
        pointerEvents: isLocked ? 'none' : 'auto'
      }}
    >
      <input {...getInputProps()} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isLocked ? (
            <span style={{ fontSize: '1rem', width: '18px', display: 'flex', justifyContent: 'center' }}>🔒</span>
          ) : (
            <input type="checkbox" checked={subTask.isCompleted} onChange={() => toggleSubTask(task.id, subTask.id)} style={{ accentColor: '#56c596', cursor: 'pointer', width: '18px', height: '18px' }} />
          )}
          <span style={{ fontSize: '1rem', color: subTask.isCompleted ? '#94a3b8' : '#0f172a', textDecoration: subTask.isCompleted ? 'line-through' : 'none', fontWeight: '500' }}>
            {subTask.title}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={open} title="Attach File" style={{ background: 'none', border: 'none', fontSize: '1.1rem', color: '#64748b', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#0f172a'} onMouseOut={e => e.currentTarget.style.color = '#64748b'}>📎</button>
          <button onClick={() => setIsAddingLink(!isAddingLink)} title="Attach URL" style={{ background: 'none', border: 'none', fontSize: '1.1rem', color: '#64748b', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#0f172a'} onMouseOut={e => e.currentTarget.style.color = '#64748b'}>🔗</button>
          <div style={{ width: '1px', height: '14px', backgroundColor: '#cbd5e1', margin: '0 4px' }} />
          <button onClick={() => deleteSubTask(task.id, subTask.id)} style={{ background: 'none', border: 'none', color: '#cbd5e1', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#ef4444'} onMouseOut={e => e.currentTarget.style.color = '#cbd5e1'}>✕</button>
        </div>
      </div>

      {isAddingLink && (
        <form onSubmit={handleAddLink} style={{ display: 'flex', gap: '8px', marginTop: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', pointerEvents: 'auto' }}>
          <input autoFocus type="text" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="Enter URL (e.g., github.com)..." required style={{ flexGrow: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }} />
          <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>Save</button>
        </form>
      )}

      {subTask.attachments && subTask.attachments.length > 0 && (
        <div style={{ paddingLeft: '30px', marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {subTask.attachments.map(file => (
            file.fileType === 'link' ? (
              <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', padding: '4px 10px', backgroundColor: '#f0f9ff', color: '#0284c7', borderRadius: '6px', border: '1px solid #bae6fd', textDecoration: 'none', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#e0f2fe'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#f0f9ff'}>
                🔗 <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.fileName}</span>
              </a>
            ) : (
              <button key={file.id} onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onPreviewFile) onPreviewFile(file); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', padding: '4px 10px', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#e2e8f0'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}>
                📄 <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.fileName}</span>
              </button>
            )
          ))}
        </div>
      )}
    </li>
  );
}

// ============================================================================
// 2. MASTER TASK DRAWER
// ============================================================================
interface TaskDrawerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (updatedTask: Task) => void;
  onPreviewFile?: (file: Attachment) => void; 
}

export function TaskDrawer({ task, isOpen, onClose, onUpdateTask, onPreviewFile }: TaskDrawerProps) {
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [parentLinkUrl, setParentLinkUrl] = useState('');
  
  // State for the Description Edit Mode
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState('');
  const DESC_LIMIT = 200; 

  useEffect(() => {
    setIsDescExpanded(false);
    setIsEditingDesc(false);
    setEditedDesc(task?.description || '');
  }, [task?.id, task?.description]);

  const onDropParent = useCallback((acceptedFiles: File[]) => {
    if (!task) return;
    const newAttachments: Attachment[] = acceptedFiles.map(file => ({ 
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9), 
      fileName: file.name, fileSize: file.size, fileType: file.type, url: URL.createObjectURL(file) 
    }));
    onUpdateTask({ ...task, attachments: [...(task.attachments || []), ...newAttachments] });
  }, [task, onUpdateTask]);

  const { getRootProps: getParentRootProps, getInputProps: getParentInputProps, isDragActive: isParentDragActive } = useDropzone({ onDrop: onDropParent });

  const handleAddParentLink = (e: FormEvent) => {
    e.preventDefault();
    if (!task || !parentLinkUrl.trim()) return;
    let safeUrl = parentLinkUrl.trim();
    if (!safeUrl.startsWith('http://') && !safeUrl.startsWith('https://')) safeUrl = 'https://' + safeUrl;
    
    const newLink: Attachment = { 
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9), 
      fileName: safeUrl.replace(/^https?:\/\//, ''), 
      fileSize: 0, fileType: 'link', url: safeUrl 
    };
    onUpdateTask({ ...task, attachments: [...(task.attachments || []), newLink] });
    setParentLinkUrl('');
  };

  const handleAddSubTask = (e: FormEvent) => {
    e.preventDefault();
    if (!task || newSubTaskTitle.trim() === '') return;
    const newSubTask: SubTask = { id: Date.now().toString(), title: newSubTaskTitle, isCompleted: false, attachments: [] };
    onUpdateTask({ ...task, subTasks: [...(task.subTasks || []), newSubTask] });
    setNewSubTaskTitle('');
  };

  const toggleSubTask = (taskId: string, subTaskId: string) => {
    if (!task) return;
    const updatedSubs = (task.subTasks || []).map(sub => sub.id === subTaskId ? { ...sub, isCompleted: !sub.isCompleted } : sub);
    onUpdateTask({ ...task, subTasks: updatedSubs });
  };

  const deleteSubTask = (taskId: string, subTaskId: string) => {
    if (!task) return;
    const filteredSubs = (task.subTasks || []).filter(sub => sub.id !== subTaskId);
    onUpdateTask({ ...task, subTasks: filteredSubs });
  };

  const handleSaveDescription = () => {
    if (task) onUpdateTask({ ...task, description: editedDesc.trim() });
    setIsEditingDesc(false);
  };

  return (
    <>
      <div onClick={onClose} style={{ display: isOpen ? 'block' : 'none', position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.25)', backdropFilter: 'blur(3px)', zIndex: 40, transition: 'opacity 0.3s ease' }} />
      {/* 600px width for a wider reading area */}
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '600px', maxWidth: '100vw', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(24px)', boxShadow: '-12px 0 40px rgba(15, 23, 42, 0.1)', borderLeft: '1px solid rgba(226, 232, 240, 0.8)', transform: isOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)', zIndex: 50, padding: '35px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {task && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px', gap: '20px' }}>
              <h2 style={{ margin: 0, color: '#0f172a', fontSize: '2rem', lineHeight: '1.2', wordBreak: 'break-word', flexGrow: 1, letterSpacing: '-0.5px' }}>{task.title}</h2>
              <div style={{ display: 'flex', gap: '12px', flexShrink: 0, marginTop: '4px' }}>
                <button onClick={() => window.dispatchEvent(new CustomEvent('enter-focus-mode', { detail: task.id }))} style={{ background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(15, 23, 42, 0.2)', transition: 'transform 0.1s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  🎯 Focus
                </button>
                <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}>✕</button>
              </div>
            </div>
            
            {task.isSequential && (
               <div style={{ padding: '10px 16px', backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '500' }}>
                 <span style={{ fontSize: '1.2rem' }}>⚠️</span> Linear Dependency Active: Sub-tasks must be executed in strict sequence.
               </div>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0 0 25px 0' }} />

            {/* Editable Context & Description Module */}
            <div style={{ marginBottom: '35px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#1e293b', margin: 0, fontWeight: '700' }}>Context & Objective</h3>
                {!isEditingDesc && (
                  <button onClick={() => setIsEditingDesc(true)} style={{ background: 'none', border: 'none', color: '#56c596', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ✏️ Edit
                  </button>
                )}
              </div>

              {isEditingDesc ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.2s ease-in-out' }}>
                  <textarea 
                    value={editedDesc} 
                    onChange={(e) => setEditedDesc(e.target.value)} 
                    placeholder="Provide a detailed description with line breaks..."
                    style={{ width: '100%', minHeight: '140px', padding: '14px', borderRadius: '10px', border: '2px solid #56c596', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={() => { setIsEditingDesc(false); setEditedDesc(task.description || ''); }} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', color: '#475569', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                    <button onClick={handleSaveDescription} style={{ padding: '8px 20px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Save Changes</button>
                  </div>
                </div>
              ) : (
                task.description ? (
                  <div style={{ padding: '16px', backgroundColor: 'rgba(248, 250, 252, 0.7)', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    {/* The whiteSpace: 'pre-wrap' property ensures your paragraph styling is perfectly preserved */}
                    <p style={{ margin: 0, fontSize: '1rem', color: '#334155', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                      {isDescExpanded || task.description.length <= DESC_LIMIT 
                        ? task.description 
                        : `${task.description.substring(0, DESC_LIMIT)}...`}
                    </p>
                    {task.description.length > DESC_LIMIT && (
                      <button onClick={() => setIsDescExpanded(!isDescExpanded)} style={{ background: 'none', border: 'none', color: '#56c596', padding: '8px 0 0 0', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer' }}>
                        {isDescExpanded ? 'View Less' : 'View Full Context'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div onClick={() => setIsEditingDesc(true)} style={{ padding: '16px', border: '2px dashed #cbd5e1', borderRadius: '10px', textAlign: 'center', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseOver={e => { e.currentTarget.style.borderColor = '#56c596'; e.currentTarget.style.color = '#56c596'; }} onMouseOut={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#94a3b8'; }}>
                    + Click here to add detailed context or instructions...
                  </div>
                )
              )}
            </div>

            <h3 style={{ fontSize: '1.1rem', color: '#1e293b', margin: '0 0 15px 0', fontWeight: '700' }}>Requirements & Execution</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 15px 0' }}>
              {(task.subTasks || []).map((sub, index) => {
                const isLocked = Boolean(task.isSequential && index > 0 && task.subTasks && task.subTasks[index - 1] && !task.subTasks[index - 1].isCompleted);
                return (
                  <SubTaskItem key={sub.id} task={task} subTask={sub} isLocked={isLocked} toggleSubTask={toggleSubTask} deleteSubTask={deleteSubTask} onUpdateTask={onUpdateTask} onPreviewFile={onPreviewFile} />
                );
              })}
            </ul>
            <form onSubmit={handleAddSubTask} style={{ display: 'flex', gap: '12px', marginBottom: '45px' }}>
              <input type="text" value={newSubTaskTitle} onChange={(e) => setNewSubTaskTitle(e.target.value)} placeholder="Add a specific requirement..." style={{ padding: '10px 14px', flexGrow: 1, borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }} onFocus={e => e.currentTarget.style.borderColor = '#94a3b8'} onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'} />
              <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Add</button>
            </form>

            <h3 style={{ fontSize: '1.1rem', color: '#1e293b', margin: '0 0 15px 0', fontWeight: '700' }}>Overarching Assets</h3>
            {task.attachments && task.attachments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                {task.attachments.map(file => (
                  file.fileType === 'link' ? (
                    <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', justifyContent: 'space-between', padding: '14px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', fontSize: '0.95rem', textDecoration: 'none', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#e0f2fe'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#f0f9ff'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><span style={{ fontSize: '1.3rem' }}>🔗</span><span style={{ fontWeight: '600', color: '#0284c7' }}>{file.fileName}</span></div>
                    </a>
                  ) : (
                    <button key={file.id} onClick={(e) => { e.preventDefault(); if (onPreviewFile) onPreviewFile(file); }} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', cursor: 'pointer', transition: 'background-color 0.2s', width: '100%', textAlign: 'left' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#f8fafc'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><span style={{ fontSize: '1.3rem' }}>📄</span><span style={{ fontWeight: '600', color: '#0f172a' }}>{file.fileName}</span></div>
                    </button>
                  )
                ))}
              </div>
            )}
            <div {...getParentRootProps()} style={{ padding: '24px', border: `2px dashed ${isParentDragActive ? '#56c596' : '#cbd5e1'}`, backgroundColor: isParentDragActive ? '#f0fdf4' : 'rgba(248,250,252,0.5)', borderRadius: '12px', textAlign: 'center', color: isParentDragActive ? '#16a34a' : '#64748b', cursor: 'pointer', marginBottom: '15px', transition: 'all 0.2s ease' }}>
              <input {...getParentInputProps()} />
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>{isParentDragActive ? "Drop project files here..." : "Drag & drop master assets here."}</p>
            </div>
            <form onSubmit={handleAddParentLink} style={{ display: 'flex', gap: '12px', marginBottom: '45px' }}>
              <input type="text" value={parentLinkUrl} onChange={(e) => setParentLinkUrl(e.target.value)} placeholder="Or attach a web URL..." style={{ padding: '10px 14px', flexGrow: 1, borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }} onFocus={e => e.currentTarget.style.borderColor = '#94a3b8'} onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'} />
              <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Add Link</button>
            </form>
          </>
        )}
      </div>
    </>
  );
}