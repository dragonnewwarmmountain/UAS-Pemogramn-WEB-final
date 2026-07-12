// apps/frontend/src/features/tasks/components/CreateTaskModal.tsx
import React, { useState } from 'react';
import ReactDOM from 'react-dom';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: any) => void;
}

export function CreateTaskModal({ isOpen, onClose, onAddTask }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subTaskInput, setSubTaskInput] = useState('');
  const [initialSubTasks, setInitialSubTasks] = useState<string[]>([]);
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState(''); // Menerima Format Jam Absolut (datetime-local)

  if (!isOpen) return null;

  const handleAddSubTask = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (subTaskInput.trim()) {
      setInitialSubTasks([...initialSubTasks, subTaskInput.trim()]);
      setSubTaskInput('');
    }
  };

  const handleRemoveSubTask = (index: number) => {
    setInitialSubTasks(initialSubTasks.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      description: description.trim(),
      initialSubTasks,
      priority,
      dueDate, // Data waktu absolut dikirim ke database
      status: 'todo'
    });

    setTitle('');
    setDescription('');
    setSubTaskInput('');
    setInitialSubTasks([]);
    setPriority('medium');
    setDueDate('');
    setShowAdvanced(false);
  };

  const textGlow = '0px 2px 6px rgba(192, 132, 252, 0.4)'; 

  const sleekInputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#ffffff',
    fontSize: '0.95rem',
    fontWeight: '700',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1)'
  };

  const glassCardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), 0 8px 24px rgba(0,0,0,0.1)'
  };

  return ReactDOM.createPortal(
    <div style={{ 
      position: 'fixed', inset: 0, 
      backgroundColor: 'rgba(20, 5, 20, 0.4)', backdropFilter: 'blur(8px)', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      zIndex: 99999, padding: '20px', boxSizing: 'border-box',
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    }}>
      
      <style>{`
        .modal-no-scroll::-webkit-scrollbar { display: none !important; }
        .modal-no-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .focus-glow:focus { border-color: #ffffff !important; background: rgba(255,255,255,0.25) !important; }
        .title-focus-glow:focus { opacity: 1 !important; }
        ::placeholder { color: rgba(255,255,255,0.7); }
        /* Memastikan icon kalender di input datetime-local warnanya putih */
        input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }
      `}</style>

      <div 
        className="modal-no-scroll"
        style={{ 
          width: '100%', maxWidth: '980px', maxHeight: '90vh', overflowY: 'auto',
          background: 'linear-gradient(135deg, rgba(255, 117, 179, 0.25) 0%, rgba(188, 105, 255, 0.25) 100%)',
          backdropFilter: 'blur(28px) saturate(150%)', WebkitBackdropFilter: 'blur(28px) saturate(150%)',
          borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.3), inset 0 2px 10px rgba(255,255,255,0.3)',
          display: 'flex', flexDirection: 'column'
        }}
      >
        
        <div style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffffff', boxShadow: '0 0 12px #ffffff' }} />
            <h2 style={{ margin: 0, color: '#ffffff', fontSize: '1.2rem', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', textShadow: textGlow }}>Initialize New Node</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '2rem', cursor: 'pointer', opacity: 0.7, transition: 'transform 0.2s', padding: 0, lineHeight: 1 }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.2)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} id="modern-deploy-form" style={{ padding: '40px', display: 'flex', flexWrap: 'wrap', gap: '48px' }}>
          
          <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="title-focus-glow"
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Project Title..." 
                autoFocus 
                required 
                style={{
                  width: '100%', background: 'transparent', border: 'none', color: '#ffffff',
                  fontSize: '2.8rem', fontWeight: '900', outline: 'none', fontFamily: 'inherit',
                  letterSpacing: '-1px', textShadow: textGlow, padding: '0 0 8px 0', opacity: 0.9, transition: 'opacity 0.2s'
                }} 
              />
              <div style={{ width: '100%', height: '3px', background: 'linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0.0) 100%)', borderRadius: '2px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px', textShadow: textGlow }}>Technical Specification</label>
              <textarea 
                className="focus-glow modal-no-scroll"
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Write the context and requirements here..." 
                style={{
                  flexGrow: 1, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '16px', padding: '20px', color: '#ffffff', fontSize: '1rem', fontWeight: '600',
                  lineHeight: '1.6', minHeight: '160px', outline: 'none', resize: 'vertical',
                  fontFamily: 'inherit', transition: 'all 0.3s ease', boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.1)'
                }} 
              />
            </div>
          </div>

          <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={glassCardStyle}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '900', color: '#ffffff', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px', textShadow: textGlow }}>
                Staging Checkpoints
              </label>
              
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'stretch' }}>
                <input 
                  type="text" 
                  className="focus-glow"
                  value={subTaskInput} 
                  onChange={e => setSubTaskInput(e.target.value)} 
                  placeholder="Add a new stage..." 
                  onKeyDown={e => { if (e.key === 'Enter') handleAddSubTask(e); }} 
                  style={{ ...sleekInputStyle, margin: 0 }} 
                />
                <button type="button" onClick={handleAddSubTask} style={{ background: '#ffffff', color: '#bc69ff', border: 'none', borderRadius: '12px', padding: '0 24px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                  Add
                </button>
              </div>

              {initialSubTasks.length > 0 && (
                <div className="modal-no-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                  {initialSubTasks.map((st, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.15)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                      <span style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: '700' }}>{st}</span>
                      <button type="button" onClick={() => handleRemoveSubTask(i)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', fontWeight: '900', fontSize: '1.2rem', padding: '0 4px', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.2)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={glassCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px', textShadow: textGlow }}>Advanced Parameters</label>
                <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '99px', color: '#ffffff', fontSize: '0.75rem', fontWeight: '900', padding: '6px 14px', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
                  {showAdvanced ? 'HIDE' : 'SHOW'}
                </button>
              </div>

              {showAdvanced && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s ease' }}>
                  <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '12px' }}>
                    <span style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: '800' }}>Priority Level</span>
                    <select value={priority} onChange={e => setPriority(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.95rem', fontWeight: '900', outline: 'none', cursor: 'pointer', textAlign: 'right', textShadow: textGlow }}>
                      <option value="low" style={{ color: '#bc69ff' }}>LOW</option>
                      <option value="medium" style={{ color: '#bc69ff' }}>MEDIUM</option>
                      <option value="high" style={{ color: '#bc69ff' }}>HIGH</option>
                      <option value="critical" style={{ color: '#bc69ff' }}>CRITICAL</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '4px' }}>
                    <span style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: '800' }}>Absolute Time</span>
                    {/* Menggunakan tipe datetime-local untuk presisi Jam dan Menit */}
                    <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.95rem', fontWeight: '900', outline: 'none', cursor: 'pointer', textShadow: textGlow }} />
                  </div>
                </div>
              )}
            </div>

          </div>
        </form>

        <div style={{ padding: '24px 40px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '99px', padding: '14px 32px', fontWeight: '900', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}>
            Cancel
          </button>
          <button type="submit" form="modern-deploy-form" style={{ background: '#ffffff', color: '#bc69ff', border: 'none', borderRadius: '99px', padding: '14px 40px', fontWeight: '900', fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,0,0,0.15)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
            Commit & Deploy Node
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}