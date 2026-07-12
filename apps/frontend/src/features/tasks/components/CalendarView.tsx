// apps/frontend/src/features/tasks/components/CalendarView.tsx
import { useState, useEffect, useCallback } from 'react';
import type { Task } from '../types';
import { api } from '../../../services/api';

export function CalendarView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchLiveTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getTasks();
      const mappedData = (data || []).map((t: any) => ({
        ...t,
        difficulty: Number(t.difficultySp || t.difficulty || 1),
        isCompleted: t.status === 'done'
      }));
      setTasks(mappedData);
      localStorage.setItem('sandbox-tasks', JSON.stringify(mappedData));
    } catch (error) {
      console.warn("API synchronisation failed, loading local session memory...");
      const savedTasks = localStorage.getItem('sandbox-tasks');
      if (savedTasks) {
        try { setTasks(JSON.parse(savedTasks)); } catch { setTasks([]); }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveTasks();
  }, [fetchLiveTasks]);

  // Calendar Mathematical Computations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const today = new Date();

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const resetToToday = () => setCurrentDate(new Date());

  // Shared Y2K Glossy Styles
  const glassyPanelStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(16px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    boxShadow: '0 8px 32px rgba(107, 33, 168, 0.1)',
  };

  const glossyButtonStyle = {
    background: 'linear-gradient(180deg, #d946ef 0%, #a855f7 100%)',
    border: 'none',
    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.6), 0 4px 12px rgba(168, 85, 247, 0.4)',
    borderRadius: '99px',
    color: '#ffffff',
    fontWeight: '800',
    padding: '8px 24px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontFamily: 'inherit'
  };

  const subtleButtonStyle = {
    padding: '8px 20px',
    borderRadius: '99px',
    backgroundColor: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(255,255,255,0.9)',
    color: '#1e1b4b',
    fontWeight: '800',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontFamily: 'inherit'
  };

  const inputWellStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.9)',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
    borderRadius: '12px',
    padding: '12px',
    color: '#1e1b4b',
  };

  // Render blank padded cells for days before the 1st of the month
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => (
    <div 
      key={`blank-${i}`} 
      style={{ 
        minHeight: '130px', 
        backgroundColor: 'rgba(255, 255, 255, 0.3)', 
        borderRadius: '16px', 
        border: '1px solid rgba(255,255,255,0.4)' 
      }} 
    />
  ));

  // Render active day cells
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    
    const dayTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.getDate() === day && taskDate.getMonth() === month && taskDate.getFullYear() === year;
    });

    return (
      <div 
        key={`day-${day}`} 
        style={{ 
          ...inputWellStyle,
          minHeight: '140px', 
          backgroundColor: isToday ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)', 
          border: isToday ? '2px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.9)', 
          boxShadow: isToday ? '0 4px 16px rgba(168, 85, 247, 0.3)' : 'inset 0 2px 4px rgba(0,0,0,0.05)',
          display: 'flex', 
          flexDirection: 'column', 
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid rgba(107,33,168,0.1)', paddingBottom: '8px' }}>
          <span style={{ fontWeight: '900', color: '#1e1b4b', fontSize: '1.1rem' }}>
            {day}
          </span>
          {isToday && (
            <span style={{ fontSize: '0.65rem', fontWeight: '900', background: 'linear-gradient(180deg, #d946ef 0%, #6b21a8 100%)', color: '#ffffff', padding: '4px 10px', borderRadius: '99px', letterSpacing: '0.5px', boxShadow: '0 2px 6px rgba(168, 85, 247, 0.4)' }}>
              TODAY
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {dayTasks.map(task => (
            <div 
              key={task.id} 
              title={task.title}
              style={{ 
                fontSize: '0.8rem', 
                fontWeight: '800',
                padding: '6px 12px', 
                backgroundColor: '#1e1b4b', 
                background: 'linear-gradient(90deg, #1e1b4b 0%, #312e81 100%)',
                color: '#ffffff', 
                borderRadius: '99px', 
                border: 'none',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)',
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
              }}
            >
              {task.title}
            </div>
          ))}
        </div>
      </div>
    );
  });

  return (
    <div style={{ fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif", color: '#1e1b4b', position: 'relative' }}>
      
      {/* ========================================== */}
      {/* GLOSSY CALENDAR NAVIGATION TOOLBAR         */}
      {/* ========================================== */}
      <div style={{ ...glassyPanelStyle, marginBottom: '28px', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        <div>
          <h2 style={{ margin: 0, color: '#1e1b4b', fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-0.5px' }}>
            {monthNames[month]} <span style={{ color: '#a855f7' }}>{year}</span>
          </h2>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={prevMonth} style={subtleButtonStyle}>
            Previous
          </button>
          <button onClick={resetToToday} style={glossyButtonStyle}>
            Today
          </button>
          <button onClick={nextMonth} style={subtleButtonStyle}>
            Next
          </button>
        </div>

      </div>

      {/* ========================================== */}
      {/* DAY NAMES HEADER                           */}
      {/* ========================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '16px', marginBottom: '16px' }}>
        {dayNames.map(day => (
          <div key={day} style={{ textAlign: 'center', fontWeight: '900', color: '#6b21a8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', padding: '12px 0', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.9)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4)' }}>
            {day}
          </div>
        ))}
      </div>

      {/* ========================================== */}
      {/* CALENDAR GRID                              */}
      {/* ========================================== */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', ...glassyPanelStyle, color: '#1e1b4b', fontWeight: '800' }}>
          Synchronising Timeline...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '16px' }}>
          {blanks}
          {days}
        </div>
      )}

    </div>
  );
}