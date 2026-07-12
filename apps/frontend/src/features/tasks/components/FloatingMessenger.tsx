// apps/frontend/src/features/tasks/components/FloatingMessenger.tsx
import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import type { Task, Comment } from '../types';

interface FloatingMessengerProps {
  task: Task | null;
  onClose: () => void;
  onUpdateTask: (updatedTask: Task) => void;
}

export function FloatingMessenger({ task, onClose, onUpdateTask }: FloatingMessengerProps) {
  const [commentText, setCommentText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [task?.comments]);

  if (!task) return null;

  const formatTime = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp));
  };

  const handleCommentSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const newComment: Comment = { 
      id: Date.now().toString(), 
      text: commentText.trim(), 
      timestamp: Date.now(), 
      author: 'You' 
    };
    onUpdateTask({ ...task, comments: [...(task.comments || []), newComment] });
    setCommentText('');
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', width: '380px', height: '550px', backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(24px)', borderRadius: '16px', boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.15)', border: '1px solid rgba(255, 255, 255, 0.8)', zIndex: 9999, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
      
      {/* Widget Header */}
      <div style={{ padding: '16px 20px', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingRight: '10px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Discussion Thread</span>
          <span style={{ fontSize: '0.95rem', color: '#f8fafc', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</span>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#f8fafc', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>✕</button>
      </div>

      {/* Chat History Canvas */}
      <div ref={scrollRef} style={{ flexGrow: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'rgba(248, 250, 252, 0.5)' }}>
        {!task.comments || task.comments.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: '#94a3b8' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>💬</span>
            <p style={{ margin: 0, fontSize: '0.95rem', fontStyle: 'italic' }}>No discussion yet. Break the ice.</p>
          </div>
        ) : (
          task.comments.map(comment => (
            <div key={comment.id} style={{ display: 'flex', flexDirection: 'column', alignItems: comment.author === 'You' ? 'flex-end' : 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px', padding: '0 4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>{comment.author}</span>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{formatTime(comment.timestamp)}</span>
              </div>
              <div style={{ backgroundColor: comment.author === 'You' ? '#56c596' : '#ffffff', color: comment.author === 'You' ? '#ffffff' : '#334155', padding: '12px 16px', borderRadius: comment.author === 'You' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: comment.author === 'You' ? 'none' : '1px solid #e2e8f0', maxWidth: '85%', fontSize: '0.95rem', lineHeight: '1.4' }}>
                {comment.text}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Module */}
      <form onSubmit={handleCommentSubmit} style={{ padding: '16px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
        <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Type a message..." style={{ flexGrow: 1, padding: '12px 16px', backgroundColor: '#f1f5f9', border: '1px solid transparent', borderRadius: '24px', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s, background-color 0.2s' }} onFocus={e => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }} onBlur={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.borderColor = 'transparent'; }} />
        <button type="submit" style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.1s', flexShrink: 0 }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
          <span style={{ transform: 'rotate(-45deg)', marginTop: '-2px', marginLeft: '4px' }}>➤</span>
        </button>
      </form>
    </div>
  );
}