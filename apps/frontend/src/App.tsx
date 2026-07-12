// apps/frontend/src/App.tsx
import React, { useState, useEffect } from 'react';
import { TaskBoard } from './features/tasks/components/TaskBoard';
import { CalendarView } from './features/tasks/components/CalendarView';
import { AuthScreen } from './features/tasks/components/auth/AuthScreen';
import { CollaborationHub } from './features/tasks/components/CollaborationHub'; 
import { ProfileDashboard } from './features/profile/components/ProfileDashboard';
import { api } from './services/api';

function App() {
  const [activeView, setActiveView] = useState<'list' | 'calendar' | 'collab' | 'profile'>('list');
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  const [profilePic, setProfilePic] = useState<string>('');
  const [dashboardPic, setDashboardPic] = useState<string>('/src/assets/your-custom-image.jpg');

  useEffect(() => {
    const savedUser = localStorage.getItem('hub_user');
    const savedToken = localStorage.getItem('hub_jwt_token');
    if (savedUser && savedToken) {
      const parsedUser = JSON.parse(savedUser);
      setCurrentUser(parsedUser);
      
      // LOGIC FIX: Load pictures specifically tied to the parsed user's ID
      const savedProfilePic = localStorage.getItem(`hub_profile_pic_${parsedUser.id}`);
      const savedDashboardPic = localStorage.getItem(`hub_dashboard_pic_${parsedUser.id}`);
      if (savedProfilePic) setProfilePic(savedProfilePic);
      if (savedDashboardPic) setDashboardPic(savedDashboardPic);
    }
  }, []);

  const handleAuthenticate = (userData: any, token: string) => {
    localStorage.setItem('hub_jwt_token', token);
    localStorage.setItem('hub_user', JSON.stringify(userData));
    setCurrentUser(userData);
    
    // LOGIC FIX: Load pictures instantly upon login for this specific user
    const savedProfilePic = localStorage.getItem(`hub_profile_pic_${userData.id}`);
    const savedDashboardPic = localStorage.getItem(`hub_dashboard_pic_${userData.id}`);
    setProfilePic(savedProfilePic || '');
    setDashboardPic(savedDashboardPic || '/src/assets/your-custom-image.jpg');
  };

  const handleLogout = () => {
    localStorage.removeItem('hub_jwt_token');
    localStorage.removeItem('hub_user');
    setCurrentUser(null);
    window.location.reload(); // Memaksa browser ke-reset ke layar login
  };

  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfilePic(result);
        // LOGIC FIX: Save picture tied to this specific user's ID
        localStorage.setItem(`hub_profile_pic_${currentUser.id}`, result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDashboardPicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setDashboardPic(result);
        // LOGIC FIX: Save background tied to this specific user's ID
        localStorage.setItem(`hub_dashboard_pic_${currentUser.id}`, result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportCSV = async () => {
    try {
      const tasks = await api.getTasks();
      if (!tasks || tasks.length === 0) {
        alert('No data to export. Your workspace is currently empty.');
        return;
      }

      const headers = ['Task ID', 'Title', 'Status', 'Difficulty (SP)', 'Sub-tasks Completed', 'Total Sub-tasks', 'Comments Logged', 'Attachments'];
      const rows = tasks.map((task: any) => {
        const completedSubs = task.subTasks ? task.subTasks.filter((st: any) => st.isCompleted).length : 0;
        const totalSubs = task.subTasks ? task.subTasks.length : 0;
        const commentsCount = task.comments ? task.comments.length : 0;
        const attachmentsCount = task.attachments ? task.attachments.length : 0;
        const safeTitle = `"${task.title.replace(/"/g, '""')}"`;
        
        return [
          task.id, safeTitle, task.status || (task.isCompleted ? 'done' : 'todo'), 
          task.difficultySp || task.difficulty || 1, completedSubs, totalSubs, commentsCount, attachmentsCount
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `workspace-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to compile data ledger export:', error);
      alert('An error occurred whilst generating the structural data export from the database.');
    }
  };

  if (!currentUser) {
    return <AuthScreen onAuthenticate={handleAuthenticate} />;
  }

  const defaultAvatar = `https://ui-avatars.com/api/?name=${currentUser.displayName}&background=978FEE&color=fff&bold=true`;

  // OPACITY DITURUNKAN AGAR BACKGROUND TEMBUS PANDANG (TRUE GLASS)
  const glassyHeaderStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
    backdropFilter: 'blur(16px) saturate(150%)',
    WebkitBackdropFilter: 'blur(16px) saturate(150%)',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    padding: '20px 32px',
    marginBottom: '32px',
    transition: 'all 0.3s ease'
  };

  const transparentWellStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.05)',
    borderRadius: '16px',
    padding: '6px',
    display: 'flex',
    gap: '6px'
  };

  const functionalButtonStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    borderRadius: '99px',
    fontWeight: '800',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease'
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundImage: 'linear-gradient(135deg, rgba(15, 7, 32, 0.5) 0%, rgba(88, 28, 135, 0.45) 100%), url("/your-custom-image.png")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      color: '#1e1b4b', 
      padding: '30px', 
      boxSizing: 'border-box',
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        <header style={glassyHeaderStyle}>
          
          {activeView !== 'profile' ? (
            // =========================================================
            // TASKBOARD HEADER (Symmetrical Flexbox Plan A)
            // =========================================================
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minHeight: '90px', flexWrap: 'wrap', gap: '24px' }}>

              {/* KIRI */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 250px', paddingLeft: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ background: 'linear-gradient(90deg, #c084fc 0%, #a855f7 100%)', color: '#ffffff', padding: '4px 12px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: '900', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                    Workspace Center
                  </span>
                  <h1 style={{ margin: 0, color: '#ffffff', fontSize: '1.9rem', fontWeight: '900', letterSpacing: '-0.3px', whiteSpace: 'nowrap', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    Project Manager Hub
                  </h1>
                </div>
                <p style={{ color: '#E8C1E2', margin: 0, fontSize: '0.85rem', fontWeight: '700', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                  Active Session: <strong style={{ color: '#ffffff' }}>{currentUser.displayName}</strong>
                </p>
              </div>

              {/* TENGAH (Menu Tab Terkunci) */}
              <div style={{ flex: '0 1 auto', display: 'flex', justifyContent: 'center', zIndex: 2 }}>
                <div style={transparentWellStyle}>
                  <button onClick={() => setActiveView('list')} style={{ padding: '10px 22px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '0.85rem', background: activeView === 'list' ? 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)' : 'transparent', color: '#ffffff', boxShadow: activeView === 'list' ? '0 4px 12px rgba(15, 23, 42, 0.3)' : 'none', fontFamily: 'inherit', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                    Tasks Matrix
                  </button>
                  <button onClick={() => setActiveView('calendar')} style={{ padding: '10px 22px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '0.85rem', background: activeView === 'calendar' ? 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)' : 'transparent', color: '#ffffff', boxShadow: activeView === 'calendar' ? '0 4px 12px rgba(15, 23, 42, 0.3)' : 'none', fontFamily: 'inherit', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                    Calendar Timeline
                  </button>
                  <button onClick={() => setActiveView('collab')} style={{ padding: '10px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '0.85rem', background: activeView === 'collab' ? 'linear-gradient(180deg, #d946ef 0%, #6b21a8 100%)' : 'transparent', color: '#ffffff', boxShadow: activeView === 'collab' ? '0 4px 12px rgba(168, 85, 247, 0.3)' : 'none', fontFamily: 'inherit', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                    Collaboration Hub
                  </button>
                </div>
              </div>

              {/* KANAN (Avatar) */}
              <div style={{ flex: '1 1 250px', display: 'flex', justifyContent: 'flex-end', paddingRight: '12px', zIndex: 2 }}>
                <button 
                  onClick={() => setActiveView('profile')} 
                  title="Open Profile Dashboard"
                  style={{ 
                    width: '130px', 
                    height: '130px', 
                    borderRadius: '50%', 
                    padding: 0, 
                    border: '5px solid #BF94C0', 
                    cursor: 'pointer', 
                    overflow: 'hidden', 
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)', 
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
                    backgroundColor: '#ffffff',
                    flexShrink: 0
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)';
                    e.currentTarget.style.borderColor = '#978FEE';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                    e.currentTarget.style.borderColor = '#BF94C0';
                  }}
                >
                  <img src={profilePic || defaultAvatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              </div>

            </div>
          ) : (
            // =========================================================
            // PROFILE MODE HEADER (Toolbar Minimalis)
            // =========================================================
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.3px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Configuration</h2>
                <span style={{ fontSize: '0.85rem', color: '#E8C1E2', fontWeight: '800', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Workspace aesthetics settings</span>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ ...functionalButtonStyle, cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.6)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.4)'}>
                  Update Avatar
                  <input type="file" hidden accept="image/*" onChange={handleProfilePicUpload} />
                </label>
                
                <label style={{ ...functionalButtonStyle, cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.6)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.4)'}>
                  Update Background
                  <input type="file" hidden accept="image/*" onChange={handleDashboardPicUpload} />
                </label>

                <div style={{ width: '1px', height: '32px', backgroundColor: 'rgba(255,255,255,0.3)', margin: '0 4px' }} /> 

                <button 
                  onClick={() => setActiveView('list')} 
                  style={{ ...functionalButtonStyle, background: 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)', color: '#ffffff', border: 'none', padding: '10px 24px', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.4)' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  Return to Workspace
                </button>
              </div>
            </div>
          )}
        </header>

        <main style={{ position: 'relative', zIndex: 1 }}>
          {activeView === 'list' && <TaskBoard dashboardImageUrl={dashboardPic} />}
          {activeView === 'calendar' && <CalendarView />}
          {activeView === 'collab' && <CollaborationHub currentUser={currentUser} />}
          {activeView === 'profile' && (
            <ProfileDashboard 
              currentUser={currentUser} 
              profilePicUrl={profilePic || defaultAvatar} 
              onLogout={handleLogout} 
              onExport={handleExportCSV} 
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;