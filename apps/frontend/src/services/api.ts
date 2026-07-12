// apps/frontend/src/services/api.ts
import type { TaskStatus } from '../features/tasks/types';

const API_URL = 'https://backend-uas-sable.vercel.app/api';

// ==========================================
// SECURITY UTILITY: JWT INJECTION
// ==========================================
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('hub_jwt_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // ==========================================
  // PUBLIC AUTHENTICATION METHODS
  // ==========================================
  login: async (credentials: any) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json(); 
  },

  register: async (userData: any) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json(); 
  },

  // ==========================================
  // COLLABORATION & INVITATION METHODS
  // ==========================================
  inviteCollaborator: async (data: { taskId: string; email: string; role: string }) => {
    const response = await fetch(`${API_URL}/collab/invite`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Gagal mengirim undangan kolaborasi.');
    }
    return response.json();
  },

  acceptInvitation: async (token: string) => {
    const response = await fetch(`${API_URL}/collab/accept`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ token }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Gagal memverifikasi token undangan.');
    }
    return response.json();
  },

  getProjectMembers: async (taskId: string) => {
    const response = await fetch(`${API_URL}/collab/members/${taskId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Gagal mengambil daftar kolaborator.');
    return response.json();
  },

  // ==========================================
  // PROTECTED TASK METHODS
  // ==========================================
  getTasks: async (): Promise<any[]> => {
    const response = await fetch(`${API_URL}/tasks`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch tasks. Authorisation denied.');
    return response.json();
  },

  createTask: async (taskData: any): Promise<any> => {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData),
    });
    if (!response.ok) throw new Error('Failed to create task. Authorisation denied.');
    return response.json();
  },

  createComment: async (taskId: string, text: string) => {
    const response = await fetch(`${API_URL}/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error('Gagal menyimpan komentar ke database.');
    return response.json();
  },
  
  addAttachment: async (taskId: string, fileName: string, fileUrl: string, fileType: string = 'link') => {
    const response = await fetch(`${API_URL}/tasks/${taskId}/attachments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ fileName, fileUrl, fileType }),
    });
    if (!response.ok) throw new Error('Gagal menyimpan lampiran ke database.');
    return response.json();
  },

  createSubTask: async (taskId: string, title: string) => {
    const response = await fetch(`${API_URL}/tasks/${taskId}/subtasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title }),
    });
    if (!response.ok) throw new Error('Gagal menyimpan sub-tugas ke database.');
    return response.json();
  },

  // =========================================================
  // NEW: UNIVERSAL TASK UPDATER (MENGATASI ERROR api.updateTask)
  // =========================================================
  updateTask: async (taskId: string, updateData: any): Promise<any> => {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to update task');
    }
    return response.json();
  },
  // =========================================================

  updateTaskStatus: async (taskId: string, status: TaskStatus): Promise<any> => {
    const response = await fetch(`${API_URL}/tasks/${taskId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update task status');
    return response.json();
  },

  updateSubTaskStatus: async (subTaskId: string, isCompleted: boolean) => {
    const response = await fetch(`${API_URL}/subtasks/${subTaskId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isCompleted }),
    });
    if (!response.ok) throw new Error('Failed to update sub-task');
    return response.json();
  },

  deleteTask: async (taskId: string): Promise<boolean> => {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete task');
    return true;
  }
};