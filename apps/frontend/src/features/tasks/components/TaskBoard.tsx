// apps/frontend/src/features/tasks/components/TaskBoard.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import type { Task as BaseTask, SubTask, Attachment } from '../types';
import { CreateTaskModal } from './CreateTaskModal';
import { FilePreviewModal } from './FilePreviewModal';
import { FloatingMessenger } from './FloatingMessenger'; 
import { api } from '../../../services/api'; 

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export type ExtendedTask = Omit<BaseTask, 'priority' | 'difficulty' | 'status'> & {
  priority?: PriorityLevel;
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'on-delay' | string;
  isArchived?: boolean;
  dueDate?: string;
  isSequential?: boolean;
  createdAt?: string;
  assigneeId?: string;
  assignee?: any;
  isCompleted?: boolean;
  attachments?: any[];
  subTasks?: any[];
  description?: string;
  comments?: any[];
};

const PLACEHOLDER_STAT_1 = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80";
const PLACEHOLDER_STAT_2 = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=80";
const PLACEHOLDER_STAT_3 = "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80";

const PRIORITY_WEIGHT: Record<PriorityLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

// ==========================================
// ULTRA SPECULAR GLASSMORPHISM
// ==========================================
const textGlow = '0px 1px 3px rgba(0,0,0,0.6), 0px 2px 6px rgba(0,0,0,0.4)'; 

const glassyPanelStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.05) 100%)',
  backdropFilter: 'blur(28px) saturate(200%)', 
  WebkitBackdropFilter: 'blur(28px) saturate(200%)', 
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.4)',
  boxShadow: 'inset 1px 1px 2px rgba(255, 255, 255, 0.6), 0 12px 32px 0 rgba(0, 0, 0, 0.25)', 
};

const glossyButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, #978FEE 0%, #8F73AE 100%)',
  border: '1px solid rgba(255, 255, 255, 0.5)',
  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.6), 0 4px 12px rgba(0, 0, 0, 0.3)',
  borderRadius: '99px',
  color: '#ffffff',
  fontWeight: '800',
  padding: '10px 20px',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontFamily: 'inherit',
  textShadow: textGlow,
  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
};

const inputWellStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.5)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.6)',
  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.05)',
  borderRadius: '12px',
  padding: '10px 14px',
  color: '#1e1b4b', 
  fontSize: '0.85rem',
  fontWeight: '800',
  outline: 'none',
  fontFamily: 'inherit'
};

const TaskDistributionChart = ({ tasks }: { tasks: ExtendedTask[] }) => {
  const total = tasks.length || 1;
  const todoCount = tasks.filter(t => t.status === 'todo' || (!t.status && !t.isCompleted)).length;
  const activeCount = tasks.filter(t => t.status === 'in-progress' || (t.status !== 'done' && t.status !== 'todo' && !t.isCompleted)).length;
  const doneCount = tasks.filter(t => t.status === 'done' || t.isCompleted).length;

  const todoPct = Math.round((todoCount / total) * 100);
  const activePct = Math.round((activeCount / total) * 100);
  const donePct = Math.round((doneCount / total) * 100);

  const renderHeight = (pct: number) => Math.max(pct, 4);

  return (
    <div style={{ ...glassyPanelStyle, padding: '24px', display: 'flex', flexDirection: 'column', height: '280px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: '900', color: '#ffffff', textShadow: textGlow, marginBottom: '20px' }}>
        <span>Global Task Distribution</span>
        <span style={{ color: '#E8C1E2' }}>Total: {tasks.length}</span>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', alignItems: 'flex-end', gap: '20px', paddingBottom: '16px', borderBottom: '2px solid rgba(255,255,255,0.3)', marginBottom: '16px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#E8C1E2', textShadow: textGlow }}>{todoPct}%</span>
          <div style={{ width: '100%', height: `${renderHeight(todoPct)}%`, backgroundColor: '#E8C1E2', borderRadius: '6px 6px 0 0', transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), 0 -2px 10px rgba(232, 193, 226, 0.4)' }} title={`To Do: ${todoCount}`} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#BF94C0', textShadow: textGlow }}>{activePct}%</span>
          <div style={{ width: '100%', height: `${renderHeight(activePct)}%`, background: 'linear-gradient(180deg, #BF94C0 0%, #978FEE 100%)', borderRadius: '6px 6px 0 0', transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), 0 -2px 10px rgba(191, 148, 192, 0.4)' }} title={`Active: ${activeCount}`} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#978FEE', textShadow: textGlow }}>{donePct}%</span>
          <div style={{ width: '100%', height: `${renderHeight(donePct)}%`, background: 'linear-gradient(180deg, #978FEE 0%, #8F73AE 100%)', borderRadius: '6px 6px 0 0', transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), 0 -2px 10px rgba(151, 143, 238, 0.4)' }} title={`Completed: ${doneCount}`} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '0.85rem', fontWeight: '800', color: '#ffffff', textShadow: textGlow }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#E8C1E2', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
          <span>To Do</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#978FEE', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
          <span>Active</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#8F73AE', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
          <span>Done</span>
        </div>
      </div>
    </div>
  );
};

const CustomIllustrationPanel = ({ imageUrl }: { imageUrl?: string }) => {
  return (
    <div style={{ ...glassyPanelStyle, overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '280px', boxSizing: 'border-box', background: 'transparent' }}>
      <img 
        src={imageUrl || "/src/assets/your-custom-image.jpg"} 
        alt="Custom Local Illustration" 
        onError={(e) => { 
          if (e.currentTarget) {
            e.currentTarget.style.display = 'none'; 
          }
        }}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
      />
    </div>
  );
};

export function TaskBoard({ dashboardImageUrl = '/src/assets/your-custom-image.jpg' }: { dashboardImageUrl?: string }) {
  const [tasks, setTasks] = useState<ExtendedTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'smart'>('smart');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<Attachment | null>(null);
  const [messengerTaskId, setMessengerTaskId] = useState<string | null>(null);
  
  // Repo & Inspector States
  const [repoTaskId, setRepoTaskId] = useState<string | null>(null);
  const [inspectedTask, setInspectedTask] = useState<ExtendedTask | null>(null);
  const [editingSpecId, setEditingSpecId] = useState<string | null>(null);
  const [specEditText, setSpecEditText] = useState<string>('');

  const [subTaskInputs, setSubTaskInputs] = useState<Record<string, string>>({});

  // File Repo Modal Upload States
  const [repoFile, setRepoFile] = useState<File | null>(null);
  const [repoFileName, setRepoFileName] = useState<string>('');
  const [repoFileType, setRepoFileType] = useState<string>('link');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => { setToast(null); }, 4000);
  }, []);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getTasks();
      const isolatedData = (data || []).filter((t: any) => !t.isCollab);

      const mappedData: ExtendedTask[] = isolatedData.map((t: any) => ({
        ...t,
        priority: (t.priority || 'medium') as PriorityLevel,
        isArchived: Boolean(t.isArchived) || t.status === 'done',
        isCompleted: t.status === 'done',
        createdAt: t.createdAt || new Date().toISOString()
      }));
      
      setTasks(mappedData);
    } catch (error) {
      console.error("Sync failed:", error);
      showToast("Loading local session memory.", "warning");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // =========================================================================
  // AUTONOMOUS TEMPORAL SWEEPER 
  // =========================================================================
  useEffect(() => {
    const autoArchiveSweeper = setInterval(async () => {
      try {
        const data = await api.getTasks();
        const now = new Date().getTime();
        let boardChanged = false;
        
        for (const task of data) {
          if (!task.isArchived && task.dueDate && task.status !== 'done') {
            const deadlineTime = new Date(task.dueDate).getTime();
            if (deadlineTime < now) {
              await (api as any).updateTask(task.id, { isArchived: true, status: 'overdue' });
              boardChanged = true;
              showToast("System Sweep: Overdue node relocated to Graveyard.", "warning");
            }
          }
        }
        
        if (boardChanged) {
           const refreshedData = await api.getTasks();
           setTasks(refreshedData.map((t: any) => ({ ...t, isArchived: Boolean(t.isArchived) || t.status === 'done' })));
        }
      } catch (err) {}
    }, 5000); 

    return () => clearInterval(autoArchiveSweeper);
  }, [showToast]);

  const handleCloseInspector = () => {
    setInspectedTask(null);
    setEditingSpecId(null);
  };

  const handleInlineStatusChange = async (taskId: string, newStatus: string) => {
    try {
      if (newStatus === 'done') {
         setTasks(prev => prev.filter(t => t.id !== taskId));
         if (inspectedTask?.id === taskId) setInspectedTask(null);
         showToast("Triumph Unlocked! Node instantly archived.", "success");
         await (api as any).updateTask(taskId, { status: 'done', isArchived: true });
      } else {
         await (api as any).updateTask(taskId, { status: newStatus });
         setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
         if (inspectedTask?.id === taskId) setInspectedTask({ ...inspectedTask, status: newStatus });
      }
    } catch (error) {
      console.error('Failed to update status telemetry:', error);
    }
  };

  const getDeadlineStatus = (dueDate?: string, isCompleted?: boolean) => {
    if (!dueDate) return null;
    if (isCompleted) return { text: "Completed", color: "#ffffff", bg: "#16a34a" };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `Overdue (${Math.abs(diffDays)}d)`, color: "#ffffff", bg: "#dc2626" };
    if (diffDays === 0) return { text: "Due Today", color: "#1e1b4b", bg: "#fef3c7" };
    if (diffDays === 1) return { text: "Due Tomorrow", color: "#1e1b4b", bg: "#fef3c7" };
    return { text: `Due in ${diffDays}d`, color: "#1e1b4b", bg: "#E8C1E2" };
  };

  const toggleSubTask = async (taskId: string, subTaskId: string, e?: React.MouseEvent<HTMLDivElement>) => {
    if (e) e.stopPropagation();
    const task = tasks.find(t => t.id === taskId);
    const subTask = task?.subTasks?.find(s => s.id === subTaskId);
    if (!task || !subTask) return;

    const newState = !subTask.isCompleted;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subTasks: (t.subTasks || []).map(s => s.id === subTaskId ? { ...s, isCompleted: newState } : s) } : t));
    
    if (inspectedTask && inspectedTask.id === taskId) {
      setInspectedTask({ ...inspectedTask, subTasks: (inspectedTask.subTasks || []).map(s => s.id === subTaskId ? { ...s, isCompleted: newState } : s) });
    }

    try { await api.updateSubTaskStatus(subTaskId, newState); } catch (error) { console.warn("Sub-task sync pending."); }
  };

  const processSubTaskAddition = async (taskId: string) => {
    const title = subTaskInputs[taskId]; 
    if (!title || !title.trim()) return;
    
    const tempId = Date.now().toString();
    const newSubItem = { id: tempId, title: title.trim(), isCompleted: false, attachments: [] } as unknown as SubTask;

    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, subTasks: [...(task.subTasks || []), newSubItem] } : task));
    if (inspectedTask && inspectedTask.id === taskId) {
      setInspectedTask({ ...inspectedTask, subTasks: [...(inspectedTask.subTasks || []), newSubItem] });
    }
    
    setSubTaskInputs(prev => ({ ...prev, [taskId]: '' }));
    showToast("Checkpoint added.", "success");

    try { if ((api as any).createSubTask) await (api as any).createSubTask(taskId, title.trim()); } catch (error) { console.warn("Saved locally."); }
  };

  const handleAddSubTaskFormSubmit = (taskId: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); processSubTaskAddition(taskId);
  };

  const handleSubTaskKeyDown = (taskId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); processSubTaskAddition(taskId); }
  };

  const deleteSubTask = (taskId: string, subTaskId: string, e: React.MouseEvent<HTMLButtonElement>) => { 
    e.stopPropagation();
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, subTasks: (task.subTasks || []).filter(sub => sub.id !== subTaskId) } : task));
    if (inspectedTask && inspectedTask.id === taskId) {
      setInspectedTask({ ...inspectedTask, subTasks: (inspectedTask.subTasks || []).filter(sub => sub.id !== subTaskId) });
    }
  };

  // =========================================================================
  // FILE REPOSITORY UPLOAD HANDLER
  // =========================================================================
  const handleRepoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoTaskId || !repoFile) return;

    const finalName = repoFileName.trim() || repoFile.name;
    const formData = new FormData();
    formData.append('file', repoFile);
    formData.append('fileName', finalName);
    formData.append('fileType', repoFileType); 
    formData.append('fileUrl', 'physical-upload'); 

    const token = localStorage.getItem('hub_jwt_token');
    try {
      const res = await fetch(`https://backend-uas-sable.vercel.app/api/tasks/${repoTaskId}/attachments`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData 
      });

      if (!res.ok) throw new Error('API Error');
      const newAttachment = await res.json();

      setTasks(prev => prev.map(t => t.id === repoTaskId ? { ...t, attachments: [...(t.attachments || []), newAttachment] } : t));

      if (repoFileType === 'main_submission') {
        showToast("Triumph Unlocked! Final deliverable verified and node archived.", "success");
        setTasks(prev => prev.filter(task => task.id !== repoTaskId));
        setRepoTaskId(null);
        await (api as any).updateTask(repoTaskId, { status: 'done', isArchived: true });
      } else {
        showToast("Asset successfully indexed into repository.", "success");
        setRepoFile(null);
        setRepoFileName('');
        setRepoFileType('link');
      }
    } catch (err) {
      showToast("Failed to upload physical document.", "error");
    }
  };

  const handleDeleteAttachment = async (taskId: string, attachmentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("WARNING: Purge this asset permanently?")) return;

    const task = tasks.find(t => t.id === taskId);
    const updatedAttachments = (task?.attachments || []).filter((a: any) => a.id !== attachmentId);

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, attachments: updatedAttachments } : t));
    
    if (inspectedTask && inspectedTask.id === taskId) {
      setInspectedTask({ ...inspectedTask, attachments: updatedAttachments });
    }

    try {
      const token = localStorage.getItem('hub_jwt_token');
      await fetch(`https://backend-uas-sable.vercel.app/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ attachments: updatedAttachments })
      });
      showToast("Asset purged successfully.", "success");
    } catch (err) {
      showToast("Failed to purge asset.", "error");
    }
  };

  const deletePermanentTask = async (taskId: string) => { 
    if (!window.confirm("Permanently delete this project? This cannot be undone.")) return;
    setTasks(prev => prev.filter(t => t.id !== taskId)); 
    if (messengerTaskId === taskId) setMessengerTaskId(null);
    if (inspectedTask && inspectedTask.id === taskId) handleCloseInspector();
    showToast("Project deleted.", "warning");
    try { await api.deleteTask(taskId); } catch (error) { console.warn("Deletion synced locally."); }
  };

  const handleSaveSpecification = async (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, description: specEditText.trim() } : t));
    if (inspectedTask) setInspectedTask({ ...inspectedTask, description: specEditText.trim() });
    setEditingSpecId(null);
    showToast("Specification updated.", "success");
    try { if ((api as any).updateTask) await (api as any).updateTask(taskId, { description: specEditText.trim() }); } catch (error) { console.warn("Sync pending."); }
  };

  const handleAddTask = async (payload: any) => {
    const tempId = 'temp-' + Date.now();
    const generatedSubTasks = (payload.initialSubTasks?.map((t: string, i: number) => ({ id: tempId + '-' + i, title: t, isCompleted: false, attachments: [] })) || []) as unknown as SubTask[];
    
    const newTask = { 
      id: tempId, ...payload, priority: (payload.priority || 'medium') as PriorityLevel,
      isCompleted: payload.status === 'done', subTasks: generatedSubTasks, comments: [], attachments: [],
      createdAt: new Date().toISOString()
    } as unknown as ExtendedTask;
    
    setTasks(prev => [newTask, ...prev]); 
    setIsCreateModalOpen(false); 
    showToast("New project deployed.", "success");

    try {
      const savedTask: any = await api.createTask(payload);
      setTasks(currentTasks => currentTasks.map(t => t.id === tempId ? { ...savedTask } : t));
    } catch (error) { console.warn("Saved to local session."); }
  };

  const processedTasks = tasks
    .filter(t => !t.isArchived && t.status !== 'done') 
    .filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      return true; 
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      } else {
        const weightA = PRIORITY_WEIGHT[a.priority || 'medium'] || 2;
        const weightB = PRIORITY_WEIGHT[b.priority || 'medium'] || 2;
        if (weightA !== weightB) return weightB - weightA;
        const timeA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const timeB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return timeA - timeB;
      }
    });

  const stats = useMemo(() => {
    const activeTasks = tasks.filter(t => !t.isArchived && t.status !== 'done');
    const criticalHigh = activeTasks.filter(t => t.priority === 'critical' || t.priority === 'high').length;
    const overdueCount = activeTasks.filter(t => {
      if(!t.dueDate) return false;
      const now = new Date(); now.setHours(0,0,0,0);
      const due = new Date(t.dueDate); due.setHours(0,0,0,0);
      return due.getTime() < now.getTime();
    }).length;
    
    return {
      total: activeTasks.length,
      critical: criticalHigh,
      overdue: overdueCount
    };
  }, [tasks]);

  return (
    <div style={{ fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif", color: '#1e1b4b', position: 'relative' }}>
      
      <style>
        {`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .card-hover:hover {
            transform: translateY(-6px);
            box-shadow: 0 12px 32px rgba(188, 105, 255, 0.25), inset 1px 1px 2px rgba(255,255,255,0.6);
            border-color: rgba(255, 255, 255, 0.6);
          }
          .modal-no-scroll::-webkit-scrollbar { display: none !important; }
          .modal-no-scroll { -ms-overflow-style: none; scrollbar-width: none; }
          .focus-glow:focus { border-color: #ffffff !important; background: rgba(255,255,255,0.25) !important; }
          .light-placeholder::placeholder { color: rgba(255, 255, 255, 0.7) !important; font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
          
          input[type="file"]::file-selector-button {
            background: rgba(255,255,255,0.15);
            border: 1px solid rgba(255,255,255,0.4);
            color: white;
            padding: 8px 16px;
            border-radius: 99px;
            cursor: pointer;
            font-weight: 800;
            margin-right: 12px;
            transition: all 0.2s;
            font-family: inherit;
          }
          input[type="file"]::file-selector-button:hover { background: rgba(255,255,255,0.3); }
        `}
      </style>

      {toast && (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, ...glassyPanelStyle, padding: '14px 24px', fontWeight: '900', fontSize: '0.85rem', color: '#ffffff', textShadow: textGlow }}>
          {toast.message}
        </div>
      )}

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      <FloatingMessenger task={tasks.find(t => t.id === messengerTaskId) as any || null} onClose={() => setMessengerTaskId(null)} onUpdateTask={(updated: any) => setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))} />
      <CreateTaskModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onAddTask={handleAddTask as any} />

      {/* SYMMETRICAL 3-PILLAR STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div style={{ ...glassyPanelStyle, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', flexGrow: 1 }}>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#E8C1E2', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', textShadow: textGlow }}>Active Nodes</span>
              <div style={{ fontSize: '3.5rem', fontWeight: '900', color: '#ffffff', lineHeight: '1', textShadow: textGlow }}>{stats.total}</div>
            </div>
            <div style={{ width: '100px', minWidth: '100px', clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)' }}>
              <img src={PLACEHOLDER_STAT_1} alt="Stat" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.8 }} />
            </div>
          </div>
        </div>

        <div style={{ ...glassyPanelStyle, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', flexGrow: 1 }}>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#E8C1E2', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', textShadow: textGlow }}>Critical Threats</span>
              <div style={{ fontSize: '3.5rem', fontWeight: '900', color: '#ffffff', lineHeight: '1', textShadow: textGlow }}>{stats.critical}</div>
            </div>
            <div style={{ width: '100px', minWidth: '100px', clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)' }}>
              <img src={PLACEHOLDER_STAT_2} alt="Stat" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.8 }} />
            </div>
          </div>
        </div>

        <div style={{ ...glassyPanelStyle, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', flexGrow: 1 }}>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#E8C1E2', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', textShadow: textGlow }}>Overdue Trajectory</span>
              <div style={{ fontSize: '3.5rem', fontWeight: '900', color: '#ffffff', lineHeight: '1', textShadow: textGlow }}>{stats.overdue}</div>
            </div>
            <div style={{ width: '100px', minWidth: '100px', clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)' }}>
              <img src={PLACEHOLDER_STAT_3} alt="Stat" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.8 }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '56px', alignItems: 'stretch' }}>
        <TaskDistributionChart tasks={tasks} />
        {/* GAMBAR DASHBOARD DINAMIS */}
        <CustomIllustrationPanel imageUrl={dashboardImageUrl} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '24px', alignItems: 'flex-start' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ ...glassyPanelStyle, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ margin: 0, color: '#ffffff', fontSize: '1.4rem', fontWeight: '900', letterSpacing: '0.5px', textShadow: textGlow }}>
                Active Workspace
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputWellStyle, cursor: 'pointer' }}>
                <option value="all">Status: All</option>
                <option value="todo">To Do</option>
                <option value="in-progress">Active</option>
                <option value="on-delay">On Delay</option>
              </select>
              <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ ...inputWellStyle, cursor: 'pointer' }}>
                <option value="all">Priority: All</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ ...inputWellStyle, cursor: 'pointer' }}>
                <option value="smart">Sort: Smart Default</option>
                <option value="newest">Sort: Newest</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', ...glassyPanelStyle, fontWeight: '900', color: '#ffffff', textShadow: textGlow }}>Synchronising Database...</div>
          ) : processedTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', ...glassyPanelStyle }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', fontWeight: '900', color: '#ffffff', textShadow: textGlow }}>No Projects Found</h3>
              <p style={{ color: '#E8C1E2', fontSize: '0.95rem', margin: 0, fontWeight: '800', textShadow: textGlow }}>Adjust your filters or deploy a new project.</p>
            </div>
          ) : (
            <>
              <div 
                className="no-scrollbar"
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                  gap: '20px',
                  maxHeight: '680px',
                  overflowY: 'auto',
                  padding: '4px',
                  alignContent: 'start'
                }}
              >
                {processedTasks.map(t => {
                  const deadlineInfo = getDeadlineStatus(t.dueDate, t.isCompleted);
                  const prioMatch = (t.description || '').match(/\[Prioritas: (.*?)\]/);
                  const priorityStr = prioMatch ? prioMatch[1] : 'Medium';

                  return (
                    <div 
                      key={t.id} 
                      onClick={() => setInspectedTask(t)}
                      style={{
                        ...glassyPanelStyle,
                        padding: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        border: '1px solid rgba(255, 255, 255, 0.4)'
                      }}
                      className="card-hover"
                    >
                      <div style={{ width: '100%', height: '120px', borderRadius: '12px', overflow: 'hidden', background: 'linear-gradient(135deg, #E8C1E2 0%, #BF94C0 100%)', position: 'relative', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}>
                        <img src={PLACEHOLDER_STAT_1} alt="Illustration" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
                        
                        <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', gap: '4px', zIndex: 5 }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: '900', padding: '4px 10px', borderRadius: '99px', backgroundColor: 'rgba(255,255,255,0.95)', color: '#1e1b4b', boxShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
                            {priorityStr.toUpperCase()}
                          </span>
                          {deadlineInfo && (
                            <span style={{ fontSize: '0.65rem', fontWeight: '900', padding: '4px 10px', borderRadius: '99px', backgroundColor: deadlineInfo.bg, color: deadlineInfo.color, boxShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
                              {deadlineInfo.text.toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* TOMBOL FILE REPOSITORY DI KARTU TUGAS */}
                        <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setRepoTaskId(t.id); }}
                            style={{
                              ...glossyButtonStyle,
                              padding: '4px 12px',
                              fontSize: '0.65rem',
                              background: 'rgba(255,255,255,0.95)',
                              color: '#1e1b4b',
                              textShadow: 'none',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            [ FILES ]
                          </button>
                        </div>

                        {/* TOMBOL MARK COMPLETE QUICK ACTION */}
                        <div style={{ position: 'absolute', bottom: '8px', right: '8px', zIndex: 10, display: 'flex' }}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInlineStatusChange(t.id, 'done');
                            }}
                            style={{
                              ...glossyButtonStyle,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              width: 'max-content',
                              padding: '6px 16px',
                              background: 'rgba(255, 255, 255, 0.9)', 
                              color: '#1e1b4b',
                              border: '1px solid rgba(255, 255, 255, 1)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,1)',
                              fontSize: '0.75rem',
                              textShadow: 'none',
                              transition: 'transform 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            <span>[ MARK DONE ]</span>
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '900', color: '#ffffff', textShadow: textGlow, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.title}
                        </h3>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: ACTION BUTTONS PANEL (NO TITLE) */}
        <div style={{ ...glassyPanelStyle, padding: '24px', position: 'sticky', top: '24px', height: 'fit-content' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <div onClick={() => setIsCreateModalOpen(true)} style={{ ...inputWellStyle, padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'transform 0.2s ease', backgroundColor: 'rgba(255,255,255,0.9)' }} onMouseOver={e => e.currentTarget.style.transform = 'translateX(4px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateX(0)'}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #E8C1E2 0%, #BF94C0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)' }}>
                <span style={{ fontWeight: '900', color: '#ffffff', transform: 'translateY(-2px)', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>+</span>
              </div>
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#1e1b4b' }}>Deploy Project</div>
                <div style={{ fontSize: '0.75rem', color: '#8F73AE', fontWeight: '700' }}>Initialise assignment</div>
              </div>
            </div>

            <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ ...inputWellStyle, padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'transform 0.2s ease', backgroundColor: 'rgba(255,255,255,0.9)' }} onMouseOver={e => e.currentTarget.style.transform = 'translateX(4px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateX(0)'}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #E8C1E2 0%, #BF94C0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)' }}>
                <span style={{ fontWeight: '900', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>↑</span>
              </div>
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#1e1b4b' }}>Back to Top</div>
                <div style={{ fontSize: '0.75rem', color: '#8F73AE', fontWeight: '700' }}>View global telemetry</div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FILE REPOSITORY MODAL                                                     */}
      {/* ========================================================================= */}
      {repoTaskId && tasks.find(t => t.id === repoTaskId) && ReactDOM.createPortal(
        (() => {
          const rTask = tasks.find(t => t.id === repoTaskId)!;
          return (
            <div style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(20, 5, 20, 0.6)', backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 99999, padding: '20px', boxSizing: 'border-box',
              fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
            }}>
              <div className="modal-no-scroll" style={{
                width: '100%', maxWidth: '1000px', maxHeight: '85vh', overflowY: 'auto',
                background: 'linear-gradient(135deg, rgba(255, 117, 179, 0.25) 0%, rgba(188, 105, 255, 0.25) 100%)',
                backdropFilter: 'blur(28px) saturate(150%)', WebkitBackdropFilter: 'blur(28px) saturate(150%)',
                borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.3), inset 0 2px 10px rgba(255,255,255,0.3)',
                display: 'flex', flexDirection: 'column'
              }}>
                <div style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffffff', boxShadow: '0 0 12px #ffffff' }} />
                    <h2 style={{ margin: 0, color: '#ffffff', fontSize: '1.2rem', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase', textShadow: '0 2px 6px rgba(192, 132, 252, 0.4)' }}>File Repository: {rTask.title}</h2>
                  </div>
                  <button onClick={() => setRepoTaskId(null)} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '2rem', cursor: 'pointer', opacity: 0.7, transition: 'transform 0.2s', padding: 0, lineHeight: 1 }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.2)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>×</button>
                </div>

                <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  
                  {/* UPLOAD FORM PANEL */}
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.3)' }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: '900', color: '#ffffff', textShadow: textGlow }}>ADD NEW ASSET</h4>
                    <form onSubmit={handleRepoUpload} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <input type="file" required onChange={e => setRepoFile(e.target.files?.[0] || null)} style={{ ...inputWellStyle, flex: '1 1 200px', background: 'rgba(0,0,0,0.2)' }} />
                      <input type="text" className="light-placeholder focus-glow" placeholder="Custom Display Name..." value={repoFileName} onChange={e => setRepoFileName(e.target.value)} style={{ ...inputWellStyle, flex: '1 1 200px', background: 'rgba(255,255,255,0.15)', color: '#ffffff' }} />
                      <select className="focus-glow" value={repoFileType} onChange={e => setRepoFileType(e.target.value)} style={{ ...inputWellStyle, flex: '1 1 200px', cursor: 'pointer', background: 'rgba(255,255,255,0.15)', color: '#ffffff' }}>
                        <option value="link" style={{ color: '#1e1b4b' }}>General Asset</option>
                        <option value="main_submission" style={{ color: '#1e1b4b' }}>Final Deliverable (Completes Project)</option>
                        {rTask.subTasks?.map((st: any) => (
                          <option key={st.id} value={st.id} style={{ color: '#1e1b4b' }}>Stage: {st.title}</option>
                        ))}
                      </select>
                      <button type="submit" style={{ ...glossyButtonStyle, padding: '12px 32px' }}>Upload Asset</button>
                    </form>
                  </div>

                  {/* GRID REPOSITORY */}
                  <div>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: '900', color: '#ffffff', textShadow: textGlow }}>Repository Assets</h3>
                    {(!rTask.attachments || rTask.attachments.length === 0) ? (
                      <div style={{ textAlign: 'center', color: '#E8C1E2', fontWeight: '800', padding: '40px 0' }}>No structural data retained in the matrix.</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                        {rTask.attachments.map((file: any) => {
                          const isMain = file.fileType === 'main_submission';
                          const isShared = file.fileType === 'shared_workspace';
                          const stageObj = !isMain && !isShared ? rTask.subTasks?.find((s:any) => s.id === file.fileType) : null;

                          let badgeText = 'GENERAL DIRECTIVE';
                          let badgeBg = 'rgba(255,255,255,0.2)';
                          let badgeBorder = 'rgba(255,255,255,0.4)';
                          let badgeColor = '#ffffff';
                          let iconText = '[ DOC ]';

                          if (isMain) {
                            badgeText = 'FINAL DELIVERABLE';
                            badgeBg = 'rgba(22, 163, 74, 0.2)'; badgeBorder = 'rgba(22, 163, 74, 0.6)'; badgeColor = '#86efac';
                            iconText = '[ FINAL ]';
                          } else if (isShared) {
                            badgeText = 'SHARED WORKSPACE';
                            badgeBg = 'rgba(59, 130, 246, 0.2)'; badgeBorder = 'rgba(59, 130, 246, 0.6)'; badgeColor = '#93c5fd';
                            iconText = '[ LINK ]';
                          } else if (stageObj) {
                            badgeText = `STAGE: ${stageObj.title}`.toUpperCase();
                            badgeBg = 'rgba(188, 105, 255, 0.2)'; badgeBorder = 'rgba(188, 105, 255, 0.6)'; badgeColor = '#E8C1E2';
                          }

                          return (
                            <div key={file.id} onClick={() => setPreviewFile(file)} className="card-hover" style={{ ...glassyPanelStyle, padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>
                              {/* DELETE BUTTON */}
                            <button 
                              onClick={(e) => handleDeleteAttachment(rTask.id, file.id, e)}
                              style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(220, 38, 38, 0.2)', border: '1px solid rgba(220, 38, 38, 0.5)', color: '#fca5a5', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: '900', zIndex: 10, transition: 'all 0.2s' }}
                              onMouseOver={e=>e.currentTarget.style.background='rgba(220, 38, 38, 0.4)'}
                              onMouseOut={e=>e.currentTarget.style.background='rgba(220, 38, 38, 0.2)'}
                            >
                              ×
                            </button>
                              <div style={{ alignSelf: 'flex-start', fontSize: '0.65rem', fontWeight: '900', padding: '4px 10px', borderRadius: '99px', background: badgeBg, border: `1px solid ${badgeBorder}`, color: badgeColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {badgeText}
                              </div>
                              <div style={{ textAlign: 'center', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))', padding: '10px 0' }}>
                                <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ffffff' }}>
                                  {iconText}
                                </span>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#ffffff', fontWeight: '900', fontSize: '0.9rem', wordBreak: 'break-word', textShadow: textGlow }}>{file.fileName}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })(), document.body
      )}

      {/* ========================================================================= */}
      {/* ULTRA-MODERN SPLIT-PANE INSPECTOR (TRUE TRANSLUCENT SAKURA THEME)         */}
      {/* ========================================================================= */}
      {inspectedTask && ReactDOM.createPortal(
        <div style={{ 
          position: 'fixed', inset: 0, 
          backgroundColor: 'rgba(20, 5, 20, 0.4)', backdropFilter: 'blur(8px)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          zIndex: 99999, padding: '20px', boxSizing: 'border-box',
          fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        }}>
          
          <div 
            className="modal-no-scroll"
            style={{ 
              width: '100%', maxWidth: '1100px', maxHeight: '90vh', overflowY: 'auto',
              background: 'linear-gradient(135deg, rgba(255, 117, 179, 0.25) 0%, rgba(188, 105, 255, 0.25) 100%)',
              backdropFilter: 'blur(28px) saturate(150%)', WebkitBackdropFilter: 'blur(28px) saturate(150%)',
              borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.3), inset 0 2px 10px rgba(255,255,255,0.3)',
              display: 'flex', flexDirection: 'column' 
            }}
          >
            
            {/* HEADER */}
            <div style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffffff', boxShadow: '0 0 12px #ffffff' }} />
                <h2 style={{ margin: 0, color: '#ffffff', fontSize: '1.2rem', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase', textShadow: '0 2px 6px rgba(192, 132, 252, 0.4)' }}>Project Node Inspector</h2>
                <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.4)' }} />
                
                <select 
                  value={inspectedTask.status}
                  onChange={(e) => handleInlineStatusChange(inspectedTask.id, e.target.value)}
                  style={{ 
                    background: inspectedTask.status === 'done' ? 'rgba(255,255,255,0.8)' : 
                                inspectedTask.status === 'on-delay' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(255,255,255,0.2)', 
                    color: inspectedTask.status === 'done' ? '#bc69ff' : 
                           inspectedTask.status === 'on-delay' ? '#fdba74' : '#ffffff', 
                    border: '1px solid ' + (inspectedTask.status === 'on-delay' ? 'rgba(251, 146, 60, 0.5)' : 'rgba(255,255,255,0.4)'), 
                    borderRadius: '99px', 
                    padding: '6px 20px', fontSize: '0.85rem', fontWeight: '900', outline: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <option value="todo" style={{color:'#bc69ff'}}>To Do</option>
                  <option value="in-progress" style={{color:'#bc69ff'}}>Active</option>
                  <option value="on-delay" style={{color:'#ea580c'}}>On Delay</option>
                  <option value="done" style={{color:'#bc69ff'}}>Completed</option>
                </select>
              </div>
              <button onClick={handleCloseInspector} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '2rem', cursor: 'pointer', opacity: 0.7, transition: 'transform 0.2s', padding: 0, lineHeight: 1 }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.2)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>×</button>
            </div>

            {/* BODY */}
            <div style={{ padding: '40px', display: 'flex', flexWrap: 'wrap', gap: '48px' }}>
              
              {/* KOLOM KIRI: TITLE & SPECS */}
              <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                 <div style={{ position: 'relative' }}>
                  <h1 style={{ margin: 0, color: '#ffffff', fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-1px', textShadow: '0 2px 6px rgba(192, 132, 252, 0.4)', paddingBottom: '8px' }}>{inspectedTask.title}</h1>
                  <div style={{ width: '100%', height: '3px', background: 'linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0.0) 100%)', borderRadius: '2px' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '0 2px 6px rgba(192, 132, 252, 0.4)' }}>Technical Specification</label>
                    {editingSpecId !== inspectedTask.id && (
                      <button onClick={() => { setEditingSpecId(inspectedTask.id); setSpecEditText(inspectedTask.description || ''); }} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '99px', color: '#ffffff', fontSize: '0.75rem', fontWeight: '900', cursor: 'pointer', padding: '4px 16px', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.4)'} onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.2)'}>Edit</button>
                    )}
                  </div>

                  {editingSpecId === inspectedTask.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                      <textarea className="focus-glow modal-no-scroll" value={specEditText} onChange={(e) => setSpecEditText(e.target.value)} placeholder="Write comprehensive specifications here..." style={{ flexGrow: 1, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '16px', padding: '20px', color: '#ffffff', fontSize: '0.95rem', fontWeight: '700', lineHeight: '1.6', minHeight: '160px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.1)' }} />
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button onClick={() => setEditingSpecId(null)} style={{ padding: '10px 24px', borderRadius: '99px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
                        <button onClick={() => handleSaveSpecification(inspectedTask.id)} style={{ padding: '10px 32px', borderRadius: '99px', background: '#ffffff', border: 'none', color: '#bc69ff', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className="modal-no-scroll" style={{ flexGrow: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '16px', padding: '24px', minHeight: '160px', maxHeight: '300px', overflowY: 'auto', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1)' }}>
                      <p style={{ margin: 0, color: '#ffffff', fontSize: '0.95rem', lineHeight: '1.6', fontWeight: '700', whiteSpace: 'pre-wrap' }}>{inspectedTask.description || 'No context specification provided.'}</p>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginTop: 'auto' }}>
                  <button onClick={() => deletePermanentTask(inspectedTask.id)} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255, 117, 179, 0.15)', border: '1px solid rgba(255, 117, 179, 0.5)', color: '#ff75b3', fontWeight: '900', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(255, 117, 179, 0.1)' }} onMouseOver={e=>e.currentTarget.style.background='rgba(255, 117, 179, 0.3)'} onMouseOut={e=>e.currentTarget.style.background='rgba(255, 117, 179, 0.15)'}>Purge Node</button>
                </div>
              </div>

              {/* KOLOM KANAN: STAGES EXECUTION ONLY */}
              <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), 0 8px 24px rgba(0,0,0,0.05)', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '900', color: '#ffffff', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '0 2px 6px rgba(192, 132, 252, 0.4)' }}>Operational Stages</label>
                  
                  <div className="modal-no-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1, overflowY: 'auto', paddingRight: '4px', marginBottom: '24px' }}>
                    {inspectedTask.subTasks?.map((st: any) => (
                      <div key={st.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div onClick={(e) => toggleSubTask(inspectedTask.id, st.id, e)} style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', flexGrow: 1 }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: '2px solid #ffffff', background: st.isCompleted ? '#ffffff' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: st.isCompleted ? '0 2px 8px rgba(255,255,255,0.4)' : 'none' }}>
                              {st.isCompleted && <span style={{ color: '#bc69ff', fontSize: '0.9rem', fontWeight: '900' }}>✓</span>}
                            </div>
                            <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff', opacity: st.isCompleted ? 0.6 : 1, textDecoration: st.isCompleted ? 'line-through' : 'none' }}>{st.title}</span>
                          </div>
                          <button onClick={(e) => deleteSubTask(inspectedTask.id, st.id, e)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', fontWeight: '900', fontSize: '1.4rem', padding: '0 8px' }}>×</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={(e) => handleAddSubTaskFormSubmit(inspectedTask.id, e)} style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                    <input className="light-placeholder" type="text" value={subTaskInputs[inspectedTask.id] || ''} onChange={(e) => setSubTaskInputs({ ...subTaskInputs, [inspectedTask.id]: e.target.value })} onKeyDown={(e) => handleSubTaskKeyDown(inspectedTask.id, e)} placeholder="Add a new stage..." style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '12px', padding: '12px 16px', color: '#ffffff', fontSize: '0.95rem', fontWeight: '700', outline: 'none', fontFamily: 'inherit' }} />
                    <button type="submit" style={{ background: '#ffffff', color: '#bc69ff', border: 'none', borderRadius: '12px', padding: '0 24px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,255,255,0.3)', transition: 'transform 0.2s' }} onMouseOver={e=>e.currentTarget.style.transform='scale(1.05)'} onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}>Add</button>
                  </form>
                </div>
              </div>

            </div>
          </div>
        </div>, document.body
      )}

    </div>
  );
}