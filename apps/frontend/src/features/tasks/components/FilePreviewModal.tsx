// apps/frontend/src/features/tasks/components/FilePreviewModal.tsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

export interface Attachment {
  id: string;
  fileName: string;
  url?: string;
  fileUrl?: string;
  fileType?: string;
}

interface FilePreviewModalProps {
  file: Attachment | null;
  onClose: () => void;
}

// ==========================================
// AESTHETIC STYLES
// ==========================================
const glassyPanelStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(15, 7, 32, 0.95) 0%, rgba(10, 5, 20, 0.98) 100%)',
  backdropFilter: 'blur(32px) saturate(200%)',
  WebkitBackdropFilter: 'blur(32px) saturate(200%)',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.1)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
};

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (file) setIsLoading(true);
  }, [file]);

  if (!file) return null;

  const url = file.fileUrl || file.url || '';
  // Ekstraksi ekstensi fail secara aman
  const extension = (file.fileName.split('.').pop() || '').toLowerCase();

  // ==========================================
  // EXTENSION ROUTING LOGIC
  // ==========================================
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension);
  const isVideo = ['mp4', 'webm', 'ogg'].includes(extension);
  const isPdf = extension === 'pdf';
  const isOffice = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(extension);

  const renderContent = () => {
    // 1. NATIVE IMAGE RENDERER
    if (isImage) {
      return (
        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', background: 'rgba(0,0,0,0.6)' }}>
          <img 
            src={url} 
            alt={file.fileName} 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }} 
          />
        </div>
      );
    }
    
    // 2. NATIVE VIDEO RENDERER
    if (isVideo) {
      return (
        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', background: 'rgba(0,0,0,0.8)' }}>
          <video 
            src={url} 
            controls 
            autoPlay 
            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.8)' }} 
          />
        </div>
      );
    }
    
    // 3. NATIVE PDF RENDERER
    if (isPdf) {
      return (
        <div style={{ flexGrow: 1, display: 'flex', background: '#e5e5e5' }}>
          <iframe 
            src={url} 
            title={file.fileName} 
            style={{ width: '100%', height: '100%', border: 'none' }} 
          />
        </div>
      );
    }
    
    // 4. MICROSOFT OFFICE API WRAPPER
    if (isOffice) {
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
      return (
        <div style={{ flexGrow: 1, display: 'flex', background: '#e5e5e5', position: 'relative' }}>
          {isLoading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', zIndex: 10 }}>
              <div style={{ width: '40px', height: '40px', border: '4px solid #bc69ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span style={{ color: '#1e1b4b', fontWeight: '900', fontSize: '0.9rem' }}>Connecting to Microsoft Office API...</span>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          )}
          <iframe 
            src={officeViewerUrl} 
            title={file.fileName} 
            style={{ width: '100%', height: '100%', border: 'none', position: 'relative', zIndex: 20 }} 
            onLoad={() => setIsLoading(false)}
          />
        </div>
      );
    }
    
    // 5. THE ULTIMATE FALLBACK UI (For .zip, .rar, etc.)
    return (
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(10, 5, 20, 0.9)', gap: '24px' }}>
        <div style={{ fontSize: '5rem', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}>📁</div>
        <p style={{ color: '#e9d5ff', fontSize: '1rem', fontWeight: '700', textShadow: '0 2px 4px rgba(0,0,0,0.5)', margin: 0 }}>
          Pratinjau tidak tersedia untuk format berkas ini.
        </p>
        <a 
          href={url} 
          target="_blank" 
          rel="noreferrer" 
          style={{ background: '#34d399', color: '#ffffff', padding: '12px 28px', borderRadius: '8px', textDecoration: 'none', fontWeight: '900', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(52, 211, 153, 0.3)', transition: 'transform 0.2s', display: 'inline-block' }}
          onMouseOver={e=>e.currentTarget.style.transform='scale(1.05)'}
          onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}
        >
          Unduh Berkas Secara Langsung
        </a>
      </div>
    );
  };

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '40px', boxSizing: 'border-box', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      
      <div style={{ width: '100%', maxWidth: '1200px', height: '85vh', ...glassyPanelStyle }}>
        
        {/* HEADER */}
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#ffffff', fontSize: '1.2rem' }}>📄</span>
            <span style={{ color: '#ffffff', fontWeight: '900', fontSize: '0.95rem', letterSpacing: '0.5px' }}>{file.fileName}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <a 
              href={url} 
              target="_blank" 
              rel="noreferrer" 
              style={{ color: '#34d399', textDecoration: 'none', fontWeight: '900', fontSize: '0.85rem', transition: 'color 0.2s' }}
              onMouseOver={e=>e.currentTarget.style.color='#6ee7b7'}
              onMouseOut={e=>e.currentTarget.style.color='#34d399'}
            >
              Unduh (Download)
            </a>
            <button 
              onClick={onClose} 
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ffffff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: '900', fontSize: '1.2rem', transition: 'background 0.2s' }}
              onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.2)'}
              onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}
            >
              ×
            </button>
          </div>
        </div>

        {/* VIEWER CONTENT */}
        {renderContent()}

      </div>

    </div>,
    document.body
  );
}