// apps/frontend/src/features/tasks/components/auth/AuthScreen.tsx
import { useState, type FormEvent } from 'react';
import { api } from '../../../../services/api';

interface AuthScreenProps {
  onAuthenticate: (user: any, token: string) => void;
}

export function AuthScreen({ onAuthenticate }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let response;
      if (isLogin) {
        response = await api.login({ email, password });
      } else {
        response = await api.register({ email, password, displayName });
      }
      onAuthenticate(response.user, response.token);
    } catch (err: any) {
      console.error('Authentication Error:', err);
      setError(err.message || 'Authorisation failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      // ==========================================
      // VIEWPORT LOCK MECHANISM
      // ==========================================
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      overscrollBehavior: 'none',
      touchAction: 'pinch-zoom',
      // ==========================================
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: `url('/bg-image.jpg'), radial-gradient(circle at center, #2e0836 0%, #0a020d 100%)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundBlendMode: 'overlay',
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    }}>
      
      {/* THE MOON CELL: PURE CIRCULAR GEOMETRY */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: 'min(95vw, 680px)',
        height: 'min(95vw, 680px)',
        borderRadius: '50%',
        backgroundColor: 'rgba(20, 4, 24, 0.65)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(217, 70, 239, 0.3)',
        boxShadow: '0 0 80px rgba(192, 38, 211, 0.15), inset 0 0 40px rgba(217, 70, 239, 0.1)',
        position: 'relative',
        padding: '40px',
        boxSizing: 'border-box'
      }}>
        
        {/* Subtle Cyber-Grid Background */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          borderRadius: '50%',
          backgroundImage: 'linear-gradient(rgba(217, 70, 239, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(217, 70, 239, 0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        {/* Centralised Logo Asset */}
        <img 
          src="/ccc-logo.png" 
          alt="System Logo" 
          style={{
            position: 'relative',
            zIndex: 2,
            width: '200px',
            height: 'auto',
            objectFit: 'contain',
            marginBottom: '24px',
            filter: 'drop-shadow(0 10px 20px rgba(217, 70, 239, 0.4))'
          }}
        />

        {/* Professional, System-Oriented Copywriting */}
        <div style={{ zIndex: 2, textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ 
            margin: '0 0 8px 0', 
            color: '#ffffff', 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            letterSpacing: '1px', 
            fontStyle: 'normal',
            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
          }}>
            {isLogin ? 'Authentication' : 'System Initialisation'}
          </h1>
        </div>

        {error && (
          <div style={{ zIndex: 2, width: '100%', maxWidth: '320px', padding: '12px', backgroundColor: 'rgba(134, 25, 143, 0.2)', border: '1px solid #d946ef', color: '#fdf4ff', borderRadius: '12px', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center', backdropFilter: 'blur(4px)', fontStyle: 'normal' }}>
            {error}
          </div>
        )}

        {/* Minimalist Form Constrained within the Circular Equator */}
        <form onSubmit={handleSubmit} style={{ zIndex: 2, width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {!isLogin && (
            <input 
              type="text" 
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)} 
              required 
              style={{ width: '100%', boxSizing: 'border-box', padding: '16px 24px', borderRadius: '999px', border: '1px solid rgba(217, 70, 239, 0.3)', backgroundColor: 'rgba(0, 0, 0, 0.4)', color: '#ffffff', fontSize: '0.95rem', fontWeight: 'bold', textAlign: 'center', fontStyle: 'normal', fontFamily: "'Segoe UI', Roboto, sans-serif", outline: 'none', transition: 'all 0.3s' }}
              onFocus={(e) => { e.currentTarget.style.backgroundColor = 'rgba(217, 70, 239, 0.1)'; e.currentTarget.style.border = '1px solid #e879f9'; e.currentTarget.style.boxShadow = '0 0 15px rgba(217, 70, 239, 0.2)'; }}
              onBlur={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)'; e.currentTarget.style.border = '1px solid rgba(217, 70, 239, 0.3)'; e.currentTarget.style.boxShadow = 'none'; }}
              placeholder="Display Name"
            />
          )}

          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', boxSizing: 'border-box', padding: '16px 24px', borderRadius: '999px', border: '1px solid rgba(217, 70, 239, 0.3)', backgroundColor: 'rgba(0, 0, 0, 0.4)', color: '#ffffff', fontSize: '0.95rem', fontWeight: 'bold', textAlign: 'center', fontStyle: 'normal', fontFamily: "'Segoe UI', Roboto, sans-serif", outline: 'none', transition: 'all 0.3s' }}
            onFocus={(e) => { e.currentTarget.style.backgroundColor = 'rgba(217, 70, 239, 0.1)'; e.currentTarget.style.border = '1px solid #e879f9'; e.currentTarget.style.boxShadow = '0 0 15px rgba(217, 70, 239, 0.2)'; }}
            onBlur={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)'; e.currentTarget.style.border = '1px solid rgba(217, 70, 239, 0.3)'; e.currentTarget.style.boxShadow = 'none'; }}
            placeholder="Email Address"
          />

          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ width: '100%', boxSizing: 'border-box', padding: '16px 24px', borderRadius: '999px', border: '1px solid rgba(217, 70, 239, 0.3)', backgroundColor: 'rgba(0, 0, 0, 0.4)', color: '#ffffff', fontSize: '0.95rem', fontWeight: 'bold', textAlign: 'center', fontStyle: 'normal', fontFamily: "'Segoe UI', Roboto, sans-serif", outline: 'none', transition: 'all 0.3s' }}
            onFocus={(e) => { e.currentTarget.style.backgroundColor = 'rgba(217, 70, 239, 0.1)'; e.currentTarget.style.border = '1px solid #e879f9'; e.currentTarget.style.boxShadow = '0 0 15px rgba(217, 70, 239, 0.2)'; }}
            onBlur={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)'; e.currentTarget.style.border = '1px solid rgba(217, 70, 239, 0.3)'; e.currentTarget.style.boxShadow = 'none'; }}
            placeholder="Cryptographic Key"
          />

          {/* Action Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              marginTop: '10px', 
              padding: '16px', 
              background: isLoading ? '#4c1d95' : 'linear-gradient(90deg, #d946ef 0%, #a21caf 100%)', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '999px', 
              fontSize: '1rem', 
              fontWeight: 'bold', 
              letterSpacing: '0.5px',
              fontStyle: 'normal',
              fontFamily: "'Segoe UI', Roboto, sans-serif",
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: isLoading ? 'none' : '0 10px 25px rgba(217, 70, 239, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
              transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)'
            }}
            onMouseOver={(e) => !isLoading && (e.currentTarget.style.filter = 'brightness(1.15)')}
            onMouseOut={(e) => !isLoading && (e.currentTarget.style.filter = 'brightness(1)')}
            onMouseDown={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isLoading ? 'Processing...' : 'Login'}
          </button>
        </form>

        {/* System Toggle */}
        <div style={{ zIndex: 2, marginTop: '28px', color: '#a1a1aa', fontSize: '0.85rem', fontWeight: 'normal', textAlign: 'center', fontStyle: 'normal', fontFamily: "'Segoe UI', Roboto, sans-serif" }}>
          {isLogin ? "Need an account? " : "Already registered? "}
          <button 
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ background: 'none', border: 'none', color: '#e879f9', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'none', fontSize: '0.85rem', padding: 0, fontStyle: 'normal', fontFamily: "'Segoe UI', Roboto, sans-serif" }}
            onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            {isLogin ? "Initialise Account" : "Access Gateway"}
          </button>
        </div>
        
      </div>
    </div>
  );
}