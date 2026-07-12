// apps/frontend/src/features/tasks/types.ts

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string; 
}

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
  attachments?: Attachment[];
}

export interface Comment {
  id: string;
  text: string;
  timestamp: number;
  author: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: number;
  isCompleted: boolean;
  status?: TaskStatus;
  difficulty: number;
  isSequential?: boolean; // NEW: Atribut untuk mengunci urutan pengerjaan
  subTasks?: SubTask[];
  comments?: Comment[];
  attachments?: Attachment[];
}