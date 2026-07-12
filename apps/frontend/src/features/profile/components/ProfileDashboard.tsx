// apps/frontend/src/features/profile/components/ProfileDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';

const textGlow = '0px 1px 3px rgba(0,0,0,0.6), 0px 2px 6px rgba(0,0,0,0.4)'; 

const glassyPanelStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
  backdropFilter: 'blur(16px) saturate(150%)', 
  WebkitBackdropFilter: 'blur(16px) saturate(150%)', 
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  boxShadow: 'inset 1px 1px 2px rgba(255, 255, 255, 0.3), 0 8px 32px 0 rgba(0, 0, 0, 0.2)', 
};

const glossyButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, #978FEE 0%, #8F73AE 100%)',
  border: '1px solid rgba(255, 255, 255, 0.4)',
  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
  borderRadius: '99px',
  color: '#ffffff',
  fontWeight: '900',
  padding: '10px 20px',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontFamily: 'inherit',
  textShadow: textGlow,
  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
};

export function ProfileDashboard({ 
  currentUser, 
  profilePicUrl, 
  onLogout, 
  onExport 
}: { 
  currentUser: any, 
  profilePicUrl: string,
  onLogout: () => void,
  onExport: () => void
}) {
  const [personalAchievements, setPersonalAchievements] = useState<any[]>([]);
  const [collabAchievements, setCollabAchievements] = useState<any[]>([]);
  const [failedTasks, setFailedTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // BYPASS API.TS: Fetch langsung ke Backend
  const fetchArchivedData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('hub_jwt_token');
      const res = await fetch(`https://backend-uas-sable.vercel.app/api/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Data synchronisation failed.');
      const data = await res.json();
      
      // Filter mutlak: Hanya tugas yang selesai ATAU diarsipkan
      const historicalData = (data || []).filter((t: any) => Boolean(t.isArchived) || t.status === 'done');
      
      // Segregasi data berdasarkan parameter isCollab
      const personal = historicalData.filter((t: any) => !t.isCollab);
      const collab = historicalData.filter((t: any) => Boolean(t.isCollab));

      setPersonalAchievements(personal.filter((t: any) => t.status === 'done'));
      setCollabAchievements(collab.filter((t: any) => t.status === 'done'));
      
      // Gabungkan yang gagal/overdue
      setFailedTasks(historicalData.filter((t: any) => t.status !== 'done'));
    } catch (error) {
      console.error("Historical sync failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchivedData();
  }, [fetchArchivedData]);

  // =========================================================================
  // TABULA RASA RESTORE PROTOCOL
  // =========================================================================
  const handleRestoreTask = async (taskId: string) => {
    try {
      const token = localStorage.getItem('hub_jwt_token');
      
      // 1. Locate the specific node within the local architectural state
      const allLocalTasks = [...personalAchievements, ...collabAchievements, ...failedTasks];
      const targetTask = allLocalTasks.find(t => t.id === taskId);
      
      // 2. Map existing stages and forcefully reset their completion parameters
      const resetSubTasks = targetTask?.subTasks?.map((st: any) => ({
        title: st.title,
        isCompleted: false,
        assigneeId: st.assigneeId
      })) || [];

      // 3. Dispatch the payload: passing an empty attachments array triggers backend purge
      await fetch(`https://backend-uas-sable.vercel.app/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          isArchived: false, 
          status: 'todo',
          attachments: [], // Absolute wipe of structural files
          subTasks: resetSubTasks // Reinitialises stages to zero
        })
      });
      
      fetchArchivedData();
    } catch (error) {
      console.error("Restore sequence encountered a fault:", error);
    }
  };

  const renderArchiveCard = (t: any, type: 'success' | 'failed', isCollab: boolean) => (
    <div key={t.id} style={{ ...glassyPanelStyle, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: '900', padding: '4px 10px', borderRadius: '99px', backgroundColor: type === 'success' ? 'rgba(22, 163, 74, 0.3)' : 'rgba(220, 38, 38, 0.3)', border: type === 'success' ? '1px solid rgba(22, 163, 74, 0.5)' : '1px solid rgba(220, 38, 38, 0.5)', color: '#ffffff', textTransform: 'uppercase' }}>
            {type === 'success' ? 'VERIFIED' : 'OVERDUE'}
          </span>
          <span style={{ fontSize: '0.65rem', fontWeight: '900', padding: '4px 10px', borderRadius: '99px', backgroundColor: isCollab ? 'rgba(217, 70, 239, 0.3)' : 'rgba(59, 130, 246, 0.3)', border: isCollab ? '1px solid rgba(217, 70, 239, 0.5)' : '1px solid rgba(59, 130, 246, 0.5)', color: '#ffffff', textTransform: 'uppercase' }}>
            {isCollab ? 'Collab Hub' : 'Task Matrix'}
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#E8C1E2', textShadow: textGlow }}>
          {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-GB') : 'No Limit'}
        </span>
      </div>
      <div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: '900', color: '#ffffff', textShadow: textGlow }}>{t.title}</h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#ffffff', opacity: 0.8, fontWeight: '700', textShadow: textGlow, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {t.description || 'No technical outline logged.'}
        </p>
      </div>
      <button onClick={() => handleRestoreTask(t.id)} style={{ ...glossyButtonStyle, width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', marginTop: 'auto', boxShadow: 'none' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}>
        Restore to Workspace
      </button>
    </div>
  );

  return (
    <div id="profile-dashboard-wrapper" style={{ fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif", color: '#1e1b4b', position: 'relative', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-start' }}>
        
        {/* KOLOM KIRI: IDENTITY */}
        <div style={{ flex: '1 1 300px', maxWidth: '380px', ...glassyPanelStyle, padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'sticky', top: '24px' }}>
          <div style={{ width: '160px', height: '160px', borderRadius: '50%', overflow: 'hidden', background: '#fff', border: '5px solid #BF94C0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 32px rgba(0,0,0,0.3)', marginBottom: '20px' }}>
            <img src={profilePicUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '2.2rem', fontWeight: '900', color: '#ffffff', textShadow: textGlow, lineHeight: '1.2' }}>{currentUser?.displayName || 'Operator'}</h1>
          <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#E8C1E2', textTransform: 'uppercase', letterSpacing: '2px', textShadow: textGlow, marginBottom: '32px' }}>Lead Systems Analyst</span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            <button onClick={onExport} style={{ ...glossyButtonStyle, background: 'rgba(255,255,255,0.8)', color: '#1e1b4b', border: '1px solid #ffffff', padding: '14px', textShadow: 'none' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '900' }}>Export Data Ledger</span>
            </button>
            <button onClick={onLogout} style={{ ...glossyButtonStyle, background: 'rgba(15, 7, 32, 0.8)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', padding: '14px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '900' }}>Terminate Session</span>
            </button>
          </div>
        </div>

        {/* KOLOM KANAN: CLASSIFIED ARCHIVES */}
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
            <div style={{ ...glassyPanelStyle, padding: '24px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '900', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '1px', textShadow: textGlow }}>Personal Triumphs</span>
              <div style={{ fontSize: '3.5rem', fontWeight: '900', color: '#ffffff', lineHeight: '1.2', textShadow: textGlow }}>{personalAchievements.length}</div>
            </div>
            <div style={{ ...glassyPanelStyle, padding: '24px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '900', color: '#d946ef', textTransform: 'uppercase', letterSpacing: '1px', textShadow: textGlow }}>Collab Triumphs</span>
              <div style={{ fontSize: '3.5rem', fontWeight: '900', color: '#ffffff', lineHeight: '1.2', textShadow: textGlow }}>{collabAchievements.length}</div>
            </div>
            <div style={{ ...glassyPanelStyle, padding: '24px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '900', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '1px', textShadow: textGlow }}>Nodes Abandoned</span>
              <div style={{ fontSize: '3.5rem', fontWeight: '900', color: '#ffffff', lineHeight: '1.2', textShadow: textGlow }}>{failedTasks.length}</div>
            </div>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', ...glassyPanelStyle, fontWeight: '900', color: '#ffffff', textShadow: textGlow }}>Accessing Classified Records...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              
              {/* COLLABORATIVE TRIUMPHS */}
              <div style={{ ...glassyPanelStyle, padding: '32px' }}>
                <h2 style={{ margin: '0 0 24px 0', color: '#ffffff', fontSize: '1.4rem', fontWeight: '900', textShadow: textGlow }}>
                  Collaborative Ledger: Triumphs
                </h2>
                {collabAchievements.length === 0 ? (
                  <p style={{ color: '#E8C1E2', fontSize: '0.95rem', margin: 0, fontWeight: '800', textShadow: textGlow }}>No completed teamwork nodes recorded yet.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {collabAchievements.map(t => renderArchiveCard(t, 'success', true))}
                  </div>
                )}
              </div>

              {/* PERSONAL TRIUMPHS */}
              <div style={{ ...glassyPanelStyle, padding: '32px' }}>
                <h2 style={{ margin: '0 0 24px 0', color: '#ffffff', fontSize: '1.4rem', fontWeight: '900', textShadow: textGlow }}>
                  Personal Ledger: Triumphs
                </h2>
                {personalAchievements.length === 0 ? (
                  <p style={{ color: '#E8C1E2', fontSize: '0.95rem', margin: 0, fontWeight: '800', textShadow: textGlow }}>No completed personal projects recorded yet.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {personalAchievements.map(t => renderArchiveCard(t, 'success', false))}
                  </div>
                )}
              </div>

              {/* OVERDUE GRAVEYARD */}
              <div style={{ ...glassyPanelStyle, padding: '32px' }}>
                <h2 style={{ margin: '0 0 24px 0', color: '#ffffff', fontSize: '1.4rem', fontWeight: '900', textShadow: textGlow }}>
                  Historical Ledger: Overdue
                </h2>
                {failedTasks.length === 0 ? (
                  <p style={{ color: '#E8C1E2', fontSize: '0.95rem', margin: 0, fontWeight: '800', textShadow: textGlow }}>No overdue projects recorded.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {failedTasks.map(t => renderArchiveCard(t, 'failed', Boolean(t.isCollab)))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}