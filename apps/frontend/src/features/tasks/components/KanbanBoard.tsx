// apps/frontend/src/features/tasks/components/KanbanBoard.tsx
import { useState, useEffect } from 'react';
import type { Task } from '../types';
import { api } from '../../../services/api';

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetching Data dari MySQL saat komponen dimuat
  useEffect(() => {
    const fetchLiveTasks = async () => {
      try {
        const rawData = await api.getTasks();
        const mappedData = rawData.map((t: any) => ({
          ...t,
          difficulty: t.difficultySp || 1,
          isCompleted: t.status === 'done'
        }));
        setTasks(mappedData);
      } catch (error) {
        console.error("Failed to connect to MySQL backend:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLiveTasks();
  }, []);

  // 2. Logika Transisi Status (State Machine)
  const moveTask = async (taskId: string, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const previousTasks = [...tasks];
    
    // Optimistic UI Update
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus as any, isCompleted: newStatus === 'done' } : t
    ));

    try {
      await api.updateTaskStatus(taskId, newStatus as any);
    } catch (error) {
      console.error(error);
      alert("Database sync failed. Mengembalikan posisi kartu.");
      setTasks(previousTasks);
    }
  };

  // 3. Mekanisme Penghapusan Permanen (Sama dengan List View)
  const deleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isConfirmed = window.confirm("SECURITY OVERRIDE: Anda yakin ingin menghapus proyek ini secara permanen dari ekosistem MySQL? Tindakan ini strictly irreversible.");
    if (!isConfirmed) return;

    const previousTasks = [...tasks];
    setTasks(tasks.filter(t => t.id !== taskId));

    try {
      await api.deleteTask(taskId);
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus proyek dari database. Mengembalikan status UI.");
      setTasks(previousTasks);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '1.2rem', fontWeight: 'bold' }}>📡 Memuat Pipeline Ekosistem...</div>;
  }

  // Definisi Kolom Pipeline
  const columns = [
    { id: 'todo', title: 'To-Do', color: '#3b82f6', bg: '#eff6ff' },
    { id: 'in-progress', title: 'In Progress', color: '#f59e0b', bg: '#fffbeb' },
    { id: 'done', title: 'Review / Selesai', color: '#10b981', bg: '#ecfdf5' }
  ];

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: '20px' }}>
      {columns.map(column => {
        const columnTasks = tasks.filter(task => (task.status || 'todo') === column.id);
        
        return (
          <div key={column.id} style={{ flex: '1', minWidth: '320px', backgroundColor: '#f8fafc', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem', fontWeight: '800' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: column.color, marginRight: '8px' }} />
                {column.title}
              </h3>
              <span style={{ backgroundColor: column.bg, color: column.color, padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700' }}>
                {columnTasks.length} Proyek
              </span>
            </div>

            {columnTasks.map(task => (
              <div key={task.id} style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Header Kartu */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1.05rem', fontWeight: '700', lineHeight: '1.4' }}>{task.title}</h4>
                </div>
                
                {/* Meta Data */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: '#475569', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontWeight: '600' }}>
                    🏋️ {task.difficulty} SP
                  </span>
                  {task.subTasks && task.subTasks.length > 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#475569', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontWeight: '600' }}>
                      📋 {task.subTasks.filter(s => s.isCompleted).length}/{task.subTasks.length} Subs
                    </span>
                  )}
                </div>

                {/* Garis Pemisah */}
                <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }} />

                {/* Opsi Kontrol Interaktif (Sesuai Konfirmasi Anda) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  
                  {/* Opsi: Hapus (Tersedia di semua kolom) */}
                  <button onClick={(e) => deleteTask(task.id, e)} style={{ padding: '8px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', flex: 1 }}>
                    🗑️ Hapus
                  </button>

                  {/* Opsi: Balikin / Revert (Tersedia jika bukan di To-Do) */}
                  {column.id !== 'todo' && (
                    <button onClick={(e) => moveTask(task.id, column.id === 'done' ? 'in-progress' : 'todo', e)} style={{ padding: '8px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', flex: 1 }}>
                      ⏪ Balikin
                    </button>
                  )}

                  {/* Opsi: Maju (Tersedia jika belum Selesai) */}
                  {column.id !== 'done' && (
                    <button onClick={(e) => moveTask(task.id, column.id === 'todo' ? 'in-progress' : 'done', e)} style={{ padding: '8px', backgroundColor: '#ecfdf5', color: '#10b981', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', flex: 1 }}>
                      {column.id === 'todo' ? '🚀 Proses' : '✅ Selesai'}
                    </button>
                  )}

                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}