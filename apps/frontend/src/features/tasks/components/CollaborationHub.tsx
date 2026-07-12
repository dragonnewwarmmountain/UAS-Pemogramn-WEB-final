// apps/frontend/src/features/tasks/components/CollaborationHub.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { api } from '../../../services/api';
import { FilePreviewModal } from './FilePreviewModal';

interface CollaborationHubProps {
  currentUser: { id: string; email: string; displayName: string };
}

const textGlow = '0px 1px 3px rgba(0,0,0,0.6), 0px 2px 6px rgba(0,0,0,0.4)';

const glassyPanelStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
  backdropFilter: 'blur(32px) saturate(200%)',
  WebkitBackdropFilter: 'blur(32px) saturate(200%)',
  borderRadius: '20px',
  border: '1px solid rgba(255, 255, 255, 0.25)',
  boxShadow: 'inset 1px 1px 2px rgba(255, 255, 255, 0.4), 0 8px 32px 0 rgba(0, 0, 0, 0.25)',
};

const glossyButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, #bc69ff 0%, #8F73AE 100%)',
  border: '1px solid rgba(255, 255, 255, 0.6)',
  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.6), 0 6px 16px rgba(188, 105, 255, 0.5)',
  borderRadius: '99px',
  color: '#ffffff',
  fontWeight: '900',
  padding: '12px 28px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
  textShadow: textGlow,
  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
};

const inputWellStyle: React.CSSProperties = {
  background: 'rgba(15, 7, 32, 0.4)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.3), 0 2px 4px rgba(255,255,255,0.05)',
  borderRadius: '14px',
  padding: '14px 18px',
  color: '#ffffff',
  fontSize: '0.9rem',
  fontWeight: '700',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'all 0.3s ease'
};

const cardStyle: React.CSSProperties = {
  ...glassyPanelStyle,
  padding: '24px',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

export function CollaborationHub({ currentUser }: CollaborationHubProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [membersData, setMembersData] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState<'chat' | 'stages' | 'files'>('chat');
  const [, setIsSyncing] = useState<boolean>(false);

  const [previewFile, setPreviewFile] = useState<any>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);

  const [chatMessage, setChatMessage] = useState<string>('');
  const [newStageTitle, setNewStageTitle] = useState<string>('');
  const [newStageAssignee, setNewStageAssignee] = useState<string>(currentUser.id); 
  
  const [activeAttachStageId, setActiveAttachStageId] = useState<string | null>(null);
  const [stageFile, setStageFile] = useState<File | null>(null);

  const [mainFile, setMainFile] = useState<File | null>(null);

  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<string>('editor');

  const [showNewTaskModal, setShowNewTaskModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [newDueDate, setNewDueDate] = useState<string>('');
  const [newSharedUrl, setNewSharedUrl] = useState<string>('');
  
  const [taskLoading, setTaskLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchWorkspaceData = useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const token = localStorage.getItem('hub_jwt_token');
      // [ PATCHED ]: VERCEL API
      const res = await fetch(`https://backend-uas-sable.vercel.app/api/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Network anomaly detected.');
      const allTasks = await res.json();
      
      const collabTasks = allTasks.filter((t: any) => 
        (t.isCollab === true || (t.members && t.members.length > 0)) && 
        !t.isArchived && 
        t.status !== 'done'
      );
      setTasks(collabTasks);
    } catch (err) {
      console.error('Data synchronisation error:', err);
    } finally {
      if (!silent) setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaceData();
    const interval = setInterval(() => fetchWorkspaceData(true), 5000);
    return () => clearInterval(interval);
  }, [fetchWorkspaceData]);

  useEffect(() => {
    if (selectedProjectId) {
      setIsAdminPanelOpen(false); 
      api.getProjectMembers(selectedProjectId)
        .then(data => setMembersData(data))
        .catch(err => console.error(err));
    } else {
      setMembersData(null);
      setActiveTab('chat');
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (activeTab === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [tasks, activeTab, selectedProjectId]);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const getStatusWeight = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'active' || s === 'in-progress' || s === 'review') return 3;
        if (s === 'todo' || s === 'pending') return 2;
        return 1;
      };
      
      const weightA = getStatusWeight(a.status);
      const weightB = getStatusWeight(b.status);
      
      if (weightA !== weightB) return weightB - weightA;

      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tasks]);

  const activeProject = useMemo(() => sortedTasks.find(t => t.id === selectedProjectId), [sortedTasks, selectedProjectId]);

  const isOwner = activeProject?.ownerId === currentUser.id;
  const myMemberRecord = membersData?.members?.find((m: any) => m.userId === currentUser.id);
  const myRole = isOwner ? 'admin' : (myMemberRecord?.role || 'viewer'); 

  const canAddStages = isOwner || myRole === 'admin';
  const canAssignStages = isOwner || myRole === 'admin'; 
  const canDeleteWorkspace = isOwner || myRole === 'admin';
  const canSubmitMainFile = isOwner || myRole === 'admin';
  const canLeaveWorkspace = !isOwner && myMemberRecord; 

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !activeProject) return;
    const msg = chatMessage.trim();
    setChatMessage(''); 
    try {
      await (api as any).createComment(activeProject.id, msg);
      await fetchWorkspaceData(true);
    } catch {
      showToast("Failed to transmit message.", "error");
    }
  };

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageTitle.trim() || !activeProject || !canAddStages) return;
    const title = newStageTitle.trim();
    const assigneeId = newStageAssignee || currentUser.id; 
    setNewStageTitle('');
    
    try {
      const token = localStorage.getItem('hub_jwt_token');
      // [ PATCHED ]: VERCEL API
      const res = await fetch(`https://backend-uas-sable.vercel.app/api/tasks/${activeProject.id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, assigneeId })
      });
      if (!res.ok) throw new Error('API Error');
      await fetchWorkspaceData(true);
      showToast("Operational stage configured.", "success");
    } catch {
      showToast("Failed to compile stage.", "error");
    }
  };

  const handleToggleStage = async (subTaskId: string, currentStatus: boolean, isLocked: boolean) => {
    if (isLocked) {
      showToast("Clearance denied. You can only update stages assigned to you.", "warning");
      return;
    }
    try {
      await api.updateSubTaskStatus(subTaskId, !currentStatus);
      await fetchWorkspaceData(true);
    } catch {
      showToast("Failed to update execution marker.", "error");
    }
  };

  const handleStageAssigneeChange = async (stageId: string, updatedAssigneeId: string) => {
    if (!canAssignStages) {
      showToast("Insufficient clearance to assign operators.", "warning");
      return;
    }
    try {
      const token = localStorage.getItem('hub_jwt_token');
      // [ PATCHED ]: VERCEL API
      const res = await fetch(`https://backend-uas-sable.vercel.app/api/subtasks/${stageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ assigneeId: updatedAssigneeId })
      });
      if (!res.ok) throw new Error('API Error');
      await fetchWorkspaceData(true);
      showToast("Operator protocol updated.", "success");
    } catch {
      showToast("Failed to reassign parameter.", "error");
    }
  };

  const handlePhysicalFileUpload = async (taskId: string, file: File, fileType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('fileType', fileType);
    formData.append('fileUrl', 'physical-upload'); 

    const token = localStorage.getItem('hub_jwt_token');
    // [ PATCHED ]: VERCEL API
    const res = await fetch(`https://backend-uas-sable.vercel.app/api/tasks/${taskId}/attachments`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData 
    });

    if (!res.ok) throw new Error('API Error');
    return res.json();
  };

  const handleStageAttach = async (stageId: string, e: React.FormEvent, isLocked: boolean) => {
    e.preventDefault();
    if (isLocked) {
      showToast("Clearance denied. You can only attach files to your own stages.", "warning");
      return;
    }
    if (!stageFile || !activeProject) return;
    try {
      await handlePhysicalFileUpload(activeProject.id, stageFile, stageId);
      setStageFile(null);
      setActiveAttachStageId(null);
      await fetchWorkspaceData(true);
      showToast("Document successfully indexed to node.", "success");
    } catch {
      showToast("Failed to upload physical document.", "error");
    }
  };

  const handleMainFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainFile || !activeProject || !canSubmitMainFile) return;
    try {
      await handlePhysicalFileUpload(activeProject.id, mainFile, 'main_submission');
      setMainFile(null);
      await fetchWorkspaceData(true);
      showToast("Final deliverable has been integrated into the network.", "success");
    } catch {
      showToast("Failed to integrate final deliverable.", "error");
    }
  };

  const handleDeleteAttachment = async (taskId: string, attachmentId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (myRole === 'viewer') {
      showToast("Clearance denied. Viewers cannot purge assets.", "warning");
      return;
    }
    if (!window.confirm("WARNING: Purge this asset from the matrix permanently?")) return;

    const task = tasks.find(t => t.id === taskId);
    const updatedAttachments = (task?.attachments || []).filter((a: any) => a.id !== attachmentId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, attachments: updatedAttachments } : t));

    try {
      const token = localStorage.getItem('hub_jwt_token');
      // [ PATCHED ]: VERCEL API
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

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || myRole !== 'admin') {
      showToast("Only Administrators can distribute clearance.", "error");
      return;
    }
    try {
      await api.inviteCollaborator({ taskId: activeProject.id, email: inviteEmail, role: inviteRole });
      showToast(`Security clearance granted to ${inviteEmail}`, "success");
      setInviteEmail('');
      setShowInviteModal(false);
      const updatedMembers = await api.getProjectMembers(activeProject.id);
      setMembersData(updatedMembers);
    } catch (err: any) {
      showToast(err.message || 'Authorisation failure.', "error");
    }
  };

  const handleCreateCollabTask = async () => {
    if (!newTitle.trim()) {
      showToast("Project Nomenclature is required.", "warning");
      return;
    }
    setTaskLoading(true);
    try {
      const payload = {
        title: newTitle,
        description: newDesc ? `[Priority: ${newPriority}] ${newDesc}` : `[Priority: ${newPriority}]`,
        dueDate: newDueDate || null,
        sharedWorkspaceUrl: newSharedUrl || null,
        isCollab: true, 
        status: 'todo'
      };

      const token = localStorage.getItem('hub_jwt_token');
      // [ PATCHED ]: VERCEL API
      const res = await fetch(`https://backend-uas-sable.vercel.app/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Backend rejection.');

      resetModalState();
      showToast("Workspace architecture established.", "success");
      await fetchWorkspaceData(true);
    } catch {
      showToast("Failed to compile workspace structure.", "error");
    } finally {
      setTaskLoading(false);
    }
  };

  const resetModalState = () => {
    setShowNewTaskModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewDueDate('');
    setNewSharedUrl('');
  };

  const handleMarkAsDone = async () => {
    if (!activeProject || !canDeleteWorkspace) return;
    if (!window.confirm("CONFIRMATION: Seal this collaborative matrix as COMPLETED? It will be archived into the Triumphs ledger.")) return;
    
    try {
      const token = localStorage.getItem('hub_jwt_token');
      // [ PATCHED ]: VERCEL API
      const res = await fetch(`https://backend-uas-sable.vercel.app/api/tasks/${activeProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'done', isArchived: true })
      });
      if (!res.ok) throw new Error('Completion rejected.');
      
      showToast("Matrix successfully archived to Triumphs.", "success");
      setSelectedProjectId(null);
      await fetchWorkspaceData(true);
    } catch {
      showToast("Failed to archive matrix.", "error");
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!activeProject || !canDeleteWorkspace) return;
    if (!window.confirm("CRITICAL WARNING: Are you sure you wish to annihilate this entire workspace? This action is irreversible.")) return;
    
    try {
      const token = localStorage.getItem('hub_jwt_token');
      // [ PATCHED ]: VERCEL API
      const res = await fetch(`https://backend-uas-sable.vercel.app/api/tasks/${activeProject.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Deletion rejected.');
      
      showToast("Workspace annihilated successfully.", "success");
      setSelectedProjectId(null);
      await fetchWorkspaceData(true);
    } catch {
      showToast("Failed to dismantle workspace.", "error");
    }
  };

  const handleLeaveWorkspace = async () => {
    if (!activeProject || !canLeaveWorkspace) return;
    if (!window.confirm("WARNING: Are you certain you wish to revoke your access? This will PERMANENTLY remove this project from your records.")) return;
    
    try {
      const token = localStorage.getItem('hub_jwt_token');
      // [ PATCHED ]: VERCEL API
      const res = await fetch(`https://backend-uas-sable.vercel.app/api/collab/leave/${activeProject.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Leave protocol rejected.');
      
      showToast("You have successfully deserted the workspace.", "success");
      setSelectedProjectId(null);
      await fetchWorkspaceData(true);
    } catch {
      showToast("Failed to execute departure protocol.", "error");
    }
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif", color: '#1e1b4b', position: 'relative', height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
      
      {toast && (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, ...glassyPanelStyle, padding: '14px 24px', fontWeight: '800', fontSize: '0.85rem', color: '#ffffff', textShadow: textGlow }}>
          {toast.message}
        </div>
      )}

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />

      <style>{`
        .futuristic-input:focus {
          background: rgba(255, 255, 255, 0.1) !important;
          border-color: #bc69ff !important;
          box-shadow: 0 0 16px rgba(188, 105, 255, 0.4), inset 0 2px 4px rgba(0,0,0,0.5) !important;
        }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
        input[type="file"]::file-selector-button {
          background: rgba(255,255,255,0.1);
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
        input[type="file"]::file-selector-button:hover { background: rgba(255,255,255,0.2); }
        .card-hover:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 32px rgba(188, 105, 255, 0.25), inset 1px 1px 2px rgba(255,255,255,0.6);
          border-color: rgba(255, 255, 255, 0.6);
        }
        .nav-scroll::-webkit-scrollbar { width: 6px; }
        .nav-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 99px; }
        .modal-no-scroll::-webkit-scrollbar { display: none !important; }
        .modal-no-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .light-placeholder::placeholder { color: rgba(255, 255, 255, 0.7) !important; font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
      `}</style>

      {sortedTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', ...glassyPanelStyle, color: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', height: '100%' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '900', textShadow: textGlow, margin: 0 }}>Welcome to Collaboration Hub</h2>
          <p style={{ fontWeight: '800', fontSize: '1.1rem', maxWidth: '600px', margin: 0, color: '#e9d5ff', textShadow: textGlow }}>
            You currently have no active shared workspaces. Initialize a new project node to establish a collaborative matrix with your team.
          </p>
          <button onClick={() => setShowNewTaskModal(true)} style={{ ...glossyButtonStyle, padding: '16px 36px', fontSize: '1.1rem', marginTop: '20px' }}>
            + Initialize Workspace
          </button>
        </div>
      ) : !selectedProjectId ? (
        <div style={{ ...glassyPanelStyle, padding: '40px', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="nav-scroll">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '900', color: '#ffffff', textShadow: textGlow }}>Active Matrices</h2>
              <p style={{ margin: '8px 0 0 0', color: '#e9d5ff', fontWeight: '700', fontSize: '1rem' }}>Select a workspace below to enter its operational interface.</p>
            </div>
            <button onClick={() => setShowNewTaskModal(true)} style={glossyButtonStyle}>
              + Deploy New Project
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {sortedTasks.map(t => {
              const completedStages = t.subTasks?.filter((s:any)=>s.isCompleted).length || 0;
              const totalStages = t.subTasks?.length || 0;
              const progress = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;
              const dueDateFormatted = t.dueDate ? new Date(t.dueDate).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : 'No Time Set';

              return (
                <div key={t.id} className="card-hover" onClick={() => setSelectedProjectId(t.id)} style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '900', padding: '6px 12px', borderRadius: '99px', backgroundColor: 'rgba(255,255,255,0.9)', color: '#1e1b4b', textTransform: 'uppercase' }}>
                      {t.status}
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: '900', color: '#fbcfe8', textShadow: textGlow }}>
                      {dueDateFormatted}
                    </span>
                  </div>
                  
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: '#ffffff', textShadow: textGlow, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.title}
                  </h3>

                  <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '99px', overflow: 'hidden', marginTop: 'auto' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #bc69ff 0%, #8F73AE 100%)', borderRadius: '99px' }} />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#e9d5ff', fontWeight: '800' }}>{completedStages}/{totalStages} Stages</span>
                    <span style={{ fontSize: '0.8rem', color: '#e9d5ff', fontWeight: '800' }}>{t.members?.length + 1 || 1} Agents</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr) 300px', gap: '20px', height: '100%' }}>
          
          <div style={{ ...glassyPanelStyle, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
              <button 
                onClick={() => setSelectedProjectId(null)} 
                style={{ width: '100%', padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: '#ffffff', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '16px' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                ← Return to Lobby
              </button>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px', textShadow: textGlow }}>
                Other Matrices
              </h3>
            </div>
            <div style={{ overflowY: 'auto', flexGrow: 1, padding: '12px' }}>
              <div className="nav-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sortedTasks.map(t => (
                  <div 
                    key={t.id}
                    onClick={() => setSelectedProjectId(t.id)}
                    style={{ 
                      padding: '14px 16px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                      background: selectedProjectId === t.id ? 'linear-gradient(135deg, #bc69ff 0%, #8F73AE 100%)' : 'rgba(255,255,255,0.05)',
                      border: selectedProjectId === t.id ? '1px solid rgba(255,255,255,0.6)' : '1px solid transparent',
                      boxShadow: selectedProjectId === t.id ? '0 4px 12px rgba(188, 105, 255, 0.4)' : 'none'
                    }}
                    onMouseOver={e => { if(selectedProjectId !== t.id) e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
                    onMouseOut={e => { if(selectedProjectId !== t.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  >
                    <div style={{ fontSize: '0.95rem', fontWeight: '900', color: '#ffffff', textShadow: textGlow, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {activeProject && (
            <div style={{ ...glassyPanelStyle, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: '900', padding: '4px 10px', borderRadius: '99px', backgroundColor: 'rgba(255,255,255,0.9)', color: '#1e1b4b' }}>
                    {activeProject.status.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.65rem', fontWeight: '900', padding: '4px 10px', borderRadius: '99px', backgroundColor: 'rgba(188, 105, 255, 0.2)', color: '#fbcfe8', border: '1px solid rgba(188, 105, 255, 0.5)' }}>
                    {myRole.toUpperCase()} CLEARANCE
                  </span>
                </div>
                <h2 style={{ margin: '0 0 20px 0', fontSize: '1.8rem', fontWeight: '900', color: '#ffffff', textShadow: textGlow }}>
                  {activeProject.title}
                </h2>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setActiveTab('chat')} style={{ padding: '8px 20px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.6)', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer', background: activeTab === 'chat' ? '#ffffff' : 'transparent', color: activeTab === 'chat' ? '#bc69ff' : '#ffffff', transition: 'all 0.2s' }}>
                    Live Discussions
                  </button>
                  <button onClick={() => setActiveTab('stages')} style={{ padding: '8px 20px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.6)', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer', background: activeTab === 'stages' ? '#ffffff' : 'transparent', color: activeTab === 'stages' ? '#bc69ff' : '#ffffff', transition: 'all 0.2s' }}>
                    Assignments & Stages
                  </button>
                  <button onClick={() => setActiveTab('files')} style={{ padding: '8px 20px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.6)', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer', background: activeTab === 'files' ? '#ffffff' : 'transparent', color: activeTab === 'files' ? '#bc69ff' : '#ffffff', transition: 'all 0.2s' }}>
                    File Repository
                  </button>
                </div>
              </div>

              {activeTab === 'chat' && (
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
                  <div className="nav-scroll" style={{ flexGrow: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {(!activeProject.comments || activeProject.comments.length === 0) ? (
                      <div style={{ textAlign: 'center', color: '#e9d5ff', fontWeight: '800', marginTop: '40px' }}>No discussions documented. Break the ice!</div>
                    ) : (
                      activeProject.comments.map((msg: any) => {
                        const isMe = msg.user?.id === currentUser.id || msg.userId === currentUser.id;
                        const isSystem = msg.text.startsWith('[SYSTEM_AUDIT]');
                        
                        if (isSystem) {
                          return (
                            <div key={msg.id} style={{ textAlign: 'center', margin: '16px 0', fontSize: '0.75rem', fontWeight: '800', color: '#fbcfe8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                              — {msg.text.replace('[SYSTEM_AUDIT] ', '')} —
                            </div>
                          )
                        }

                        return (
                          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#e9d5ff', textShadow: textGlow }}>
                                {isMe ? 'You' : (msg.user?.displayName || 'Unknown')}
                              </span>
                              <span style={{ fontSize: '0.65rem', color: '#ffffff', opacity: 0.6 }}>
                                {new Date(msg.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div style={{ 
                              background: isMe ? 'linear-gradient(135deg, #bc69ff 0%, #8F73AE 100%)' : 'rgba(255,255,255,0.9)', 
                              color: isMe ? '#ffffff' : '#1e1b4b',
                              padding: '12px 18px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              fontSize: '0.9rem', fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              maxWidth: '80%'
                            }}>
                              {msg.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  
                  <div style={{ padding: '20px 32px', background: 'rgba(0,0,0,0.15)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px' }}>
                      <input type="text" className="futuristic-input" placeholder="Transmit a message to the network..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} style={{ ...inputWellStyle, flexGrow: 1, padding: '14px 20px', borderRadius: '99px', fontSize: '0.95rem' }} />
                      <button type="submit" style={{ ...glossyButtonStyle, padding: '0 28px', borderRadius: '99px' }}>Send</button>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'stages' && (
                <div className="nav-scroll" style={{ flexGrow: 1, overflowY: 'auto', padding: '32px' }}>
                  {canAddStages && (
                    <form onSubmit={handleAddStage} style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                      <input type="text" className="futuristic-input" placeholder="Declare a new operational parameter..." value={newStageTitle} onChange={e => setNewStageTitle(e.target.value)} style={{ ...inputWellStyle, flexGrow: 1, minWidth: '250px' }} />
                      <select className="futuristic-input" value={newStageAssignee} onChange={e => setNewStageAssignee(e.target.value)} style={{ ...inputWellStyle, cursor: 'pointer', minWidth: '160px' }}>
                        <option value={currentUser.id}>Assign to Self</option>
                        {membersData?.members?.map((m: any) => (
                          <option key={m.user.id} value={m.user.id}>{m.user.displayName}</option>
                        ))}
                      </select>
                      <button type="submit" style={glossyButtonStyle}>Map Stage</button>
                    </form>
                  )}

                  {!canAddStages && activeProject.subTasks?.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#e9d5ff', fontWeight: '800', marginTop: '20px' }}>No stages mapped. Awaiting Administrator deployment.</div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {activeProject.subTasks?.map((st: any) => {
                      const isStageLocked = myRole === 'viewer' || (myRole === 'editor' && st.assigneeId !== currentUser.id);

                      return (
                        <div key={st.id} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '16px', padding: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flexGrow: 1 }}>
                              <input type="checkbox" id={`st-${st.id}`} checked={st.isCompleted} onChange={() => handleToggleStage(st.id, st.isCompleted, isStageLocked)} disabled={isStageLocked} style={{ width: '20px', height: '20px', accentColor: '#bc69ff', marginTop: '2px', cursor: isStageLocked ? 'not-allowed' : 'pointer', flexShrink: 0 }} />
                              
                              <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                <label htmlFor={`st-${st.id}`} style={{ fontSize: '1.05rem', fontWeight: '800', color: '#ffffff', textDecoration: st.isCompleted ? 'line-through' : 'none', opacity: st.isCompleted ? 0.6 : 1, textShadow: textGlow, cursor: isStageLocked ? 'default' : 'pointer' }}>
                                  {st.title}
                                </label>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                  <span style={{ fontSize: '0.7rem', color: '#e9d5ff', fontWeight: '800', textTransform: 'uppercase' }}>Assigned Operator:</span>
                                  
                                  {canAssignStages ? (
                                    <select 
                                      value={st.assigneeId || membersData?.owner?.id || ''} 
                                      onChange={(e) => handleStageAssigneeChange(st.id, e.target.value)}
                                      style={{ backgroundColor: 'rgba(15,7,32,0.3)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', color: '#ffffff', fontSize: '0.75rem', fontWeight: '800', padding: '4px 8px', cursor: 'pointer', outline: 'none' }}
                                    >
                                      <option value={membersData?.owner?.id} style={{ color: '#1e1b4b' }}>{membersData?.owner?.id === currentUser.id ? `Me (${currentUser.displayName})` : membersData?.owner?.displayName}</option>
                                      {membersData?.members?.map((m: any) => (
                                        <option key={m.user.id} value={m.user.id} style={{ color: '#1e1b4b' }}>{m.user.id === currentUser.id ? `Me (${currentUser.displayName})` : m.user.displayName}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#ffffff', fontSize: '0.75rem', fontWeight: '800', padding: '4px 8px' }}>
                                      {st.assigneeId === currentUser.id ? 'Me' : (st.assignee?.displayName || 'System Administrator')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {!isStageLocked && (
                              <button onClick={() => setActiveAttachStageId(activeAttachStageId === st.id ? null : st.id)} style={{ padding: '6px 16px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.5)', background: 'transparent', color: '#ffffff', fontWeight: '900', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                + Upload File
                              </button>
                            )}
                          </div>

                          {activeAttachStageId === st.id && (
                            <form onSubmit={(e) => handleStageAttach(st.id, e, isStageLocked)} style={{ display: 'flex', gap: '8px', marginTop: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                              <input type="file" required onChange={e => setStageFile(e.target.files?.[0] || null)} style={{ ...inputWellStyle, flex: 1, padding: '10px' }} />
                              <button type="submit" style={{ ...glossyButtonStyle, padding: '0 20px' }}>Upload</button>
                            </form>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'files' && (
                <div className="nav-scroll" style={{ flexGrow: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  
                  {canSubmitMainFile && (
                    <div style={{ padding: '24px', background: 'rgba(22, 163, 74, 0.1)', border: '1px dashed rgba(22, 163, 74, 0.4)', borderRadius: '16px' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: '900', color: '#86efac', textShadow: textGlow }}>[ FINAL ] SUBMIT FINAL DELIVERABLE</h4>
                      <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#ffffff', opacity: 0.8 }}>Upload the culminating physical asset for this matrix.</p>
                      <form onSubmit={handleMainFileSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                         <input type="file" required onChange={e => setMainFile(e.target.files?.[0] || null)} style={{ ...inputWellStyle, flex: 1, padding: '10px', background: 'rgba(0,0,0,0.3)' }} />
                         <button type="submit" style={{ padding: '12px 24px', borderRadius: '12px', background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)', border: '1px solid rgba(255,255,255,0.6)', color: '#ffffff', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s', textShadow: textGlow }}>
                           Upload & Finalize
                         </button>
                      </form>
                    </div>
                  )}

                  <div>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: '900', color: '#ffffff', textShadow: textGlow }}>Repository Assets</h3>
                    {(!activeProject.attachments || activeProject.attachments.length === 0) ? (
                      <div style={{ textAlign: 'center', color: '#e9d5ff', fontWeight: '800', marginTop: '20px' }}>No structural data retained in the matrix.</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                        {activeProject.attachments.map((file: any) => {
                          const isMain = file.fileType === 'main_submission';
                          const isShared = file.fileType === 'shared_workspace';
                          const stageObj = !isMain && !isShared ? activeProject.subTasks?.find((s:any) => s.id === file.fileType) : null;
                          
                          let badgeText = 'General Directive';
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
                            badgeText = `STAGE: ${stageObj.title}`;
                            badgeBg = 'rgba(217, 70, 239, 0.2)'; badgeBorder = 'rgba(217, 70, 239, 0.6)'; badgeColor = '#fbcfe8';
                          }
                          
                          return (
                            <div key={file.id} onClick={() => setPreviewFile(file)} className="card-hover" style={{ ...glassyPanelStyle, padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>
                              {myRole !== 'viewer' && (
                                <button 
                                  onClick={(e) => handleDeleteAttachment(activeProject!.id, file.id, e)}
                                  style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(220, 38, 38, 0.2)', border: '1px solid rgba(220, 38, 38, 0.5)', color: '#fca5a5', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: '900', zIndex: 10, transition: 'all 0.2s' }}
                                  onMouseOver={e=>e.currentTarget.style.background='rgba(220, 38, 38, 0.4)'}
                                  onMouseOut={e=>e.currentTarget.style.background='rgba(220, 38, 38, 0.2)'}
                                >
                                  ×
                                </button>
                              )}
                              <div style={{ alignSelf: 'flex-start', fontSize: '0.65rem', fontWeight: '900', padding: '4px 10px', borderRadius: '99px', background: badgeBg, border: `1px solid ${badgeBorder}`, color: badgeColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {badgeText}
                              </div>
                              <div style={{ textAlign: 'center', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                                <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ffffff' }}>{iconText}</span>
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
              )}
            </div>
          )}

          {activeProject && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }} className="nav-scroll">
              <div style={{ ...glassyPanelStyle, padding: '24px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: '900', color: '#ffffff', textShadow: textGlow }}>Matrix Parameters</h3>
                
                <div style={{ ...inputWellStyle, padding: '20px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '900', color: '#ffffff', marginBottom: '8px' }}>
                    <span>Operational Trajectory</span>
                    <span style={{ color: '#bc69ff' }}>
                      {activeProject.subTasks?.filter((s:any)=>s.isCompleted).length || 0} / {activeProject.subTasks?.length || 0}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${activeProject.subTasks?.length > 0 ? ((activeProject.subTasks.filter((s:any)=>s.isCompleted).length / activeProject.subTasks.length) * 100) : 0}%`, 
                      height: '100%', background: 'linear-gradient(90deg, #bc69ff 0%, #8F73AE 100%)', borderRadius: '99px', transition: 'width 0.4s ease' 
                    }} />
                  </div>
                </div>

                {activeProject.attachments?.find((a:any) => a.fileType === 'shared_workspace') && (
                  <a href={activeProject.attachments.find((a:any) => a.fileType === 'shared_workspace').fileUrl} target="_blank" rel="noreferrer" style={{ display: 'block', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.9)', color: '#1e1b4b', fontWeight: '900', textAlign: 'center', textDecoration: 'none', fontSize: '0.8rem', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                    [ LINK ] ACCESS SHARED WORKSPACE
                  </a>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase', textShadow: textGlow }}>Authorised Agents</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {membersData?.owner && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', ...inputWellStyle }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#ffffff', color: '#1e1b4b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '0.75rem', flexShrink: 0 }}>OW</div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{membersData.owner.displayName}</div>
                        <div style={{ fontSize: '0.7rem', color: '#bc69ff', fontWeight: '800' }}>System Administrator</div>
                      </div>
                    </div>
                  )}
                  {membersData?.members?.map((m: any) => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', ...inputWellStyle }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(180deg, #bc69ff 0%, #8F73AE 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '0.75rem', flexShrink: 0 }}>
                        {m.user.displayName.substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.user.displayName}</div>
                        <div style={{ fontSize: '0.7rem', color: '#bc69ff', fontWeight: '800', textTransform: 'capitalize' }}>{m.role} Clearance</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {canLeaveWorkspace && (
                <button onClick={handleLeaveWorkspace} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'rgba(249, 115, 22, 0.15)', border: '1px solid rgba(249, 115, 22, 0.4)', color: '#fdba74', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s', textShadow: textGlow, backdropFilter: 'blur(16px)' }} onMouseOver={e=>e.currentTarget.style.background='rgba(249, 115, 22, 0.3)'} onMouseOut={e=>e.currentTarget.style.background='rgba(249, 115, 22, 0.15)'}>
                  Revoke My Access (Leave)
                </button>
              )}

              {isOwner || myRole === 'admin' ? (
                <div style={{ ...glassyPanelStyle, overflow: 'hidden', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column' }}>
                  <button 
                    onClick={() => setIsAdminPanelOpen(!isAdminPanelOpen)} 
                    style={{ width: '100%', padding: '16px 24px', background: isAdminPanelOpen ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: '#ffffff', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', transition: 'background 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={e => { if(!isAdminPanelOpen) e.currentTarget.style.background = 'transparent' }}
                  >
                    <span>[ ADMIN ] ADMINISTRATOR CONTROLS</span>
                    <span style={{ transform: isAdminPanelOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }}>▼</span>
                  </button>

                  <div style={{ maxHeight: isAdminPanelOpen ? '500px' : '0', opacity: isAdminPanelOpen ? 1 : 0, transition: 'all 0.3s ease', overflow: 'hidden' }}>
                    <div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      
                      <button onClick={() => setShowInviteModal(true)} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.9)', color: '#1e1b4b', fontWeight: '900', cursor: 'pointer', border: 'none', transition: 'all 0.2s' }}>
                        + Invite Personnel
                      </button>

                      <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', margin: '8px 0' }} />

                      <button onClick={handleMarkAsDone} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(22, 163, 74, 0.15)', border: '1px solid rgba(22, 163, 74, 0.4)', color: '#86efac', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s', textShadow: textGlow }} onMouseOver={e=>e.currentTarget.style.background='rgba(22, 163, 74, 0.3)'} onMouseOut={e=>e.currentTarget.style.background='rgba(22, 163, 74, 0.15)'}>
                        Verify as Completed
                      </button>

                      <button onClick={handleDeleteWorkspace} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(220, 38, 38, 0.15)', border: '1px solid rgba(220, 38, 38, 0.4)', color: '#fca5a5', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s', textShadow: textGlow }} onMouseOver={e=>e.currentTarget.style.background='rgba(220, 38, 38, 0.3)'} onMouseOut={e=>e.currentTarget.style.background='rgba(220, 38, 38, 0.15)'}>
                        Annihilate Workspace
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {showNewTaskModal && ReactDOM.createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(20, 5, 20, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px', boxSizing: 'border-box', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
          
          <div className="modal-no-scroll" style={{ width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', background: 'linear-gradient(135deg, rgba(255, 117, 179, 0.25) 0%, rgba(188, 105, 255, 0.25) 100%)', backdropFilter: 'blur(28px) saturate(150%)', WebkitBackdropFilter: 'blur(28px) saturate(150%)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)', boxShadow: '0 24px 60px rgba(0, 0, 0, 0.3), inset 0 2px 10px rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffffff', boxShadow: '0 0 12px #ffffff' }} />
                <h2 style={{ margin: 0, color: '#ffffff', fontSize: '1rem', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase', textShadow: '0 2px 6px rgba(192, 132, 252, 0.4)' }}>Initialize New Node</h2>
              </div>
              <button onClick={resetModalState} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '2rem', cursor: 'pointer', opacity: 0.7, transition: 'transform 0.2s', padding: 0, lineHeight: 1 }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.2)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>×</button>
            </div>

            <div style={{ padding: '40px', display: 'flex', flexWrap: 'wrap', gap: '48px' }}>
              <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                  <input type="text" className="light-placeholder focus-glow" placeholder="Project Title..." value={newTitle} onChange={e => setNewTitle(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '2px solid rgba(255,255,255,0.3)', color: '#ffffff', fontSize: '2.8rem', fontWeight: '900', outline: 'none', paddingBottom: '8px', textShadow: textGlow }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '0 2px 6px rgba(192, 132, 252, 0.4)' }}>Technical Specification</label>
                  <textarea className="light-placeholder focus-glow modal-no-scroll" placeholder="Write the context and requirements here..." value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ flexGrow: 1, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '16px', padding: '20px', color: '#ffffff', fontSize: '0.95rem', fontWeight: '700', lineHeight: '1.6', minHeight: '160px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
              </div>

              <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '32px', border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), 0 8px 24px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: '900', color: '#ffffff', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '0 2px 6px rgba(192, 132, 252, 0.4)' }}>Matrix Parameters</label>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '900', color: '#E8C1E2', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Shared Workspace URL</label>
                    <input type="url" className="light-placeholder focus-glow" value={newSharedUrl} onChange={e => setNewSharedUrl(e.target.value)} placeholder="Google Docs / SharePoint link..." style={{ ...inputWellStyle, width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#ffffff', padding: '16px' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '900', color: '#E8C1E2', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Threat Level</label>
                      <select className="focus-glow" value={newPriority} onChange={e => setNewPriority(e.target.value as any)} style={{ ...inputWellStyle, width: '100%', boxSizing: 'border-box', cursor: 'pointer', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#ffffff', padding: '16px' }}>
                        <option value="Low" style={{ color: '#1e1b4b' }}>Low Priority</option>
                        <option value="Medium" style={{ color: '#1e1b4b' }}>Medium Priority</option>
                        <option value="High" style={{ color: '#1e1b4b' }}>High Priority</option>
                        <option value="Critical" style={{ color: '#1e1b4b' }}>Critical Threat</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '900', color: '#E8C1E2', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Deadline</label>
                      <input type="datetime-local" className="focus-glow" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} style={{ ...inputWellStyle, width: '100%', boxSizing: 'border-box', colorScheme: 'dark', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#ffffff', padding: '16px' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px 40px', borderTop: '1px solid rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <button onClick={resetModalState} style={{ padding: '12px 32px', borderRadius: '99px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', fontWeight: '900', fontSize: '0.9rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreateCollabTask} disabled={taskLoading} style={{ padding: '12px 32px', borderRadius: '99px', background: '#ffffff', border: 'none', color: '#bc69ff', fontWeight: '900', fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>Commit & Deploy Node</button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {showInviteModal && ReactDOM.createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(20, 5, 20, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px', boxSizing: 'border-box', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
          <div style={{ width: '100%', maxWidth: '480px', background: 'linear-gradient(135deg, rgba(255, 117, 179, 0.25) 0%, rgba(188, 105, 255, 0.25) 100%)', backdropFilter: 'blur(28px) saturate(150%)', WebkitBackdropFilter: 'blur(28px) saturate(150%)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)', boxShadow: '0 24px 60px rgba(0, 0, 0, 0.3), inset 0 2px 10px rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffffff', boxShadow: '0 0 12px #ffffff' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#ffffff', letterSpacing: '1px', textTransform: 'uppercase', textShadow: '0 2px 6px rgba(192, 132, 252, 0.4)' }}>Access Validation Control</span>
              </div>
              <button onClick={() => setShowInviteModal(false)} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.7, padding: 0 }}>×</button>
            </div>
            <div style={{ padding: '32px' }}>
              <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '900', color: '#ffffff', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Security Email Routing</label>
                  <input type="email" className="light-placeholder focus-glow" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="personnel@domain.com" style={{ ...inputWellStyle, width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#ffffff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '900', color: '#ffffff', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Security Clearance Role</label>
                  <select className="focus-glow" value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ ...inputWellStyle, width: '100%', boxSizing: 'border-box', cursor: 'pointer', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#ffffff' }}>
                    <option value="editor" style={{ color: '#1e1b4b' }}>Editor Clearance (Task Specific)</option>
                    <option value="viewer" style={{ color: '#1e1b4b' }}>Viewer Clearance (Read Only)</option>
                    <option value="admin" style={{ color: '#1e1b4b' }}>Administrator (Full Access)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button type="button" onClick={() => setShowInviteModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '99px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', color: '#ffffff', fontWeight: '900', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit' }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '99px', background: '#ffffff', border: 'none', color: '#bc69ff', fontWeight: '900', fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>Dispatch Credentials</button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}