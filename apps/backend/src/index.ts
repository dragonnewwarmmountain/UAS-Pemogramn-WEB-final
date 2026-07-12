// apps/backend/src/index.ts
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const app = express();

// ==========================================
// Database & Adapter Initialisation
// ==========================================
const dbUrl = (process.env.DATABASE_URL as string).replace('mysql://', 'mariadb://');
const adapter = new PrismaMariaDb(dbUrl);
const prisma = new PrismaClient({ adapter });

const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'enterprise-secure-key-2026';

// ==========================================
// Middleware & Static File Configuration
// ==========================================
app.use(cors({
  origin: 'http://localhost:5173', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Mengekspos direktori 'uploads' agar file fisik bisa diakses melalui URL
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ==========================================
// MULTER (PHYSICAL FILE UPLOAD ENGINE)
// ==========================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Menghasilkan nama file yang unik untuk mencegah konflik
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// ==========================================
// SECURITY GATEWAY (JWT MIDDLEWARE)
// ==========================================
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access denied. No cryptographic token provided.' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired authentication token.' });
      return;
    }
    req.user = user; 
    next();
  });
};

// ==========================================
// PUBLIC AUTHENTICATION ENDPOINTS
// ==========================================
app.post('/api/auth/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, displayName } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) { res.status(400).json({ error: 'An account with this email already exists.' }); return; }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({ data: { email, passwordHash, displayName } });
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ token, user: { id: newUser.id, email: newUser.email, displayName: newUser.displayName } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) { res.status(401).json({ error: 'Invalid authentication credentials.' }); return; }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) { res.status(401).json({ error: 'Invalid authentication credentials.' }); return; }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// ==========================================
// COLLABORATION & INVITATION PIPELINE
// ==========================================
app.post('/api/collab/invite', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId, email, role } = req.body;
    const inviterId = req.user!.id;

    const task = await (prisma as any).task.findUnique({ where: { id: taskId }, include: { members: true } });
    if (!task) { res.status(404).json({ error: 'Project not found.' }); return; }

    const isOwner = task.ownerId === inviterId;
    const isAdminMember = task.members?.some((m: any) => m.userId === inviterId && m.role === 'admin');
    
    if (!isOwner && !isAdminMember) {
      res.status(403).json({ error: 'Authorization denied. Insufficient clearance to distribute invites.' });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { email } });

    if (targetUser) {
      if (targetUser.id === inviterId) { res.status(400).json({ error: 'Cannot invite self to the matrix.' }); return; }
      if (task.members?.some((m: any) => m.userId === targetUser.id)) { res.status(400).json({ error: 'Personnel already exists within this matrix.' }); return; }

      const newMember = await (prisma as any).taskMember.create({ 
        data: { taskId, userId: targetUser.id, role: role || 'editor' }, 
        include: { user: { select: { displayName: true, email: true } } } 
      });

      res.status(201).json({ status: 'added_directly', member: newMember });
      return;
    } else {
      const inviteToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); 
      
      const invitation = await (prisma as any).invitation.create({ 
        data: { email, token: inviteToken, role: role || 'editor', expiresAt, taskId, inviterId } 
      });

      res.status(201).json({ status: 'invite_created', invitation });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal pipeline fault.' });
  }
});

app.post('/api/collab/accept', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    const userId = req.user!.id;
    const userEmail = req.user!.email;

    const invitation = await (prisma as any).invitation.findUnique({ where: { token } });

    if (!invitation || invitation.status !== 'pending' || new Date() > invitation.expiresAt || invitation.email !== userEmail) {
      res.status(400).json({ error: 'Invalid, mismatched, or expired security credential.' });
      return;
    }

    await prisma.$transaction([
      (prisma as any).invitation.update({ where: { id: invitation.id }, data: { status: 'accepted' } }),
      (prisma as any).taskMember.create({ data: { taskId: invitation.taskId, userId, role: invitation.role } })
    ]);

    res.status(200).json({ message: 'Access successfully integrated.' });
  } catch (error) {
    res.status(500).json({ error: 'Transaction compile failure.' });
  }
});

app.get('/api/collab/members/:taskId', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const task = await (prisma as any).task.findUnique({
      where: { id: taskId },
      include: {
        owner: { select: { id: true, displayName: true, email: true } },
        members: { include: { user: { select: { id: true, displayName: true, email: true } } } },
        invitations: { where: { status: 'pending' } }
      }
    });

    if (!task) { res.status(404).json({ error: 'Target matrix not found.' }); return; }
    res.json({ owner: task.owner, members: task.members, pendingInvitations: task.invitations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to access matrix structure.' });
  }
});

// ==========================================
// DESTRUCTIVE PROTOCOL: HARD LEAVE TEAM
// ==========================================
app.delete('/api/collab/leave/:taskId', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const taskId = req.params.taskId;
    const userId = req.user!.id;

    const task = await (prisma as any).task.findUnique({ where: { id: taskId } });
    if (!task) { res.status(404).json({ error: 'Project matrix not found.' }); return; }
    
    if (task.ownerId === userId) {
      res.status(400).json({ error: 'Primary Administrator cannot desert the workspace. Trigger Annihilate instead.' });
      return;
    }

    await (prisma as any).taskMember.deleteMany({ where: { taskId, userId } });
    res.status(200).json({ message: 'Personnel record purged successfully.' });
  } catch (error) {
    console.error('[LEAVE TEAM ERROR]:', error);
    res.status(500).json({ error: 'Internal deployment failure.' });
  }
});

// ==========================================
// TASK & MATRIX MANAGEMENT PIPELINE
// ==========================================
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'Operational', database: 'Connected', timestamp: new Date() });
});

app.get('/api/tasks', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id; 
    const tasks = await (prisma as any).task.findMany({
      where: { 
        OR: [
          { ownerId: userId }, 
          { assigneeId: userId }, 
          { members: { some: { userId: userId } } },
          { subTasks: { some: { assigneeId: userId } } }
        ] 
      },
      include: { 
        subTasks: { orderBy: { title: 'asc' }, include: { assignee: { select: { id: true, displayName: true } } } }, 
        comments: { include: { user: { select: { id: true, displayName: true } } }, orderBy: { createdAt: 'asc' } }, 
        attachments: true,
        owner: { select: { id: true, displayName: true, email: true } },
        assignee: { select: { id: true, displayName: true, email: true } },
        members: { include: { user: { select: { id: true, displayName: true, email: true } } } }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Data pull failure.' });
  }
});

app.post('/api/tasks', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, dueDate, status, isSequential, isCollab, initialSubTasks, assigneeId, sharedWorkspaceUrl } = req.body;
    const userId = req.user!.id; 
    
    // Konfigurasi Matriks Lanjutan
    const taskData: any = {
      title, description, difficultySp: 1, 
      dueDate: dueDate ? new Date(dueDate) : null, status: status || 'todo',
      isSequential: Boolean(isSequential), isCollab: Boolean(isCollab), 
      ownerId: userId, assigneeId: assigneeId || null, 
      subTasks: { create: initialSubTasks?.map((subTitle: string) => ({ title: subTitle, isCompleted: false, assigneeId: userId })) || [] }
    };

    // Injeksi Otomatis Shared Workspace URL
    if (sharedWorkspaceUrl) {
      taskData.attachments = {
        create: [{ fileName: 'Shared Workspace Node', fileUrl: sharedWorkspaceUrl, fileType: 'shared_workspace' }]
      };
    }

    const newTask = await (prisma as any).task.create({
      data: taskData,
      include: { subTasks: true, comments: true, attachments: true, owner: { select: { id: true, displayName: true } }, assignee: { select: { id: true, displayName: true } } }
    });
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Matrix deployment failure.' });
  }
});

app.post('/api/tasks/:id/comments', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const taskId = req.params.id;
    const { text } = req.body;
    const userId = req.user!.id;

    const newComment = await (prisma as any).comment.create({
      data: { text, taskId, userId },
      include: { user: { select: { id: true, displayName: true } } }
    });
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: 'Transmission block fault.' });
  }
});

// ==========================================
// STRICT SERVER-SIDE RBAC ENDPOINTS
// ==========================================
app.post('/api/tasks/:id/subtasks', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const taskId = req.params.id;
    const { title, assigneeId } = req.body; 
    const userId = req.user!.id;

    const task = await (prisma as any).task.findUnique({ where: { id: taskId }, include: { members: true } });
    if (!task) { res.status(404).json({ error: 'Matrix node absent.' }); return; }

    const isOwner = task.ownerId === userId;
    const isAdmin = task.members.some((m: any) => m.userId === userId && m.role === 'admin');

    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Server RBAC Denial: Only Administrators can establish operational stages.' });
      return;
    }

    const newSubTask = await (prisma as any).subTask.create({
      data: { title, taskId, isCompleted: false, assigneeId: assigneeId || userId },
      include: { assignee: { select: { id: true, displayName: true } } }
    });
    res.status(201).json(newSubTask);
  } catch (error) {
    res.status(500).json({ error: 'Stage mapping failure.' });
  }
});

app.put('/api/subtasks/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try { 
    const subTaskId = req.params.id as string;
    const userId = req.user!.id;

    const subTask = await (prisma as any).subTask.findUnique({
      where: { id: subTaskId },
      include: { task: { include: { members: true } } }
    });
    if (!subTask) { res.status(404).json({ error: 'Stage parameters absent.' }); return; }

    const task = subTask.task;
    const isOwner = task.ownerId === userId;
    const myMemberRecord = task.members.find((m: any) => m.userId === userId);
    const myRole = isOwner ? 'admin' : (myMemberRecord?.role || 'viewer');

    if (myRole === 'viewer') {
      res.status(403).json({ error: 'Server RBAC Denial: Viewers cannot manipulate system parameters.' });
      return;
    }

    const updateData: any = {};
    if (req.body.isCompleted !== undefined) updateData.isCompleted = req.body.isCompleted;
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.assigneeId !== undefined) updateData.assigneeId = req.body.assigneeId;

    const updatedSubTask = await (prisma as any).subTask.update({ 
      where: { id: subTaskId }, 
      data: updateData,
      include: { assignee: { select: { id: true, displayName: true } } }
    }); 
    
    res.json(updatedSubTask); 
  } catch (error) {
    res.status(500).json({ error: 'Parameter update exception.' });
  }
});

// ==========================================
// PHYSICAL FILE INJECTION (MULTER MIDDLEWARE)
// ==========================================
app.post('/api/tasks/:id/attachments', authenticateToken, upload.single('file'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const taskId = req.params.id;
    const userId = req.user!.id;
    
    // Mengekstrak parameter dari multipart/form-data
    const { fileType } = req.body;
    let fileName = req.body.fileName;
    let fileUrl = req.body.fileUrl; // Jika menggunakan fallback URL alih-alih berkas fisik

    // Jika berkas fisik ditangkap oleh Multer
    if (req.file) {
      fileName = fileName || req.file.originalname;
      fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    }

    if (!fileName || !fileUrl) {
      res.status(400).json({ error: 'File entity or URL protocol missing.' });
      return;
    }

    const task = await (prisma as any).task.findUnique({ where: { id: taskId }, include: { owner: true, members: { include: { user: true } } } });
    if (!task) { res.status(404).json({ error: 'Node absent.' }); return; }

    const isOwner = task.ownerId === userId;
    const myMemberRecord = task.members.find((m: any) => m.userId === userId);
    const myRole = isOwner ? 'admin' : (myMemberRecord?.role || 'viewer');
    const myDisplayName = isOwner ? task.owner.displayName : (myMemberRecord?.user.displayName || 'System');

    if (myRole === 'viewer') {
      res.status(403).json({ error: 'Server RBAC Denial: Viewers cannot inject document assets.' });
      return;
    }

    // MAIN FILE SUBMISSION RESTRICTION & AUTO-AUDIT TRAIL
    if (fileType === 'main_submission') {
      if (myRole !== 'admin') {
        res.status(403).json({ error: 'Server RBAC Denial: Only Administrators can submit the final deliverable.' });
        return;
      }
      
      // Auto-Audit Trail: Inject system message directly into Live Discussions
      await (prisma as any).comment.create({
        data: { text: `[SYSTEM_AUDIT] Administrator ${myDisplayName} has uploaded the final deliverable: ${fileName}`, taskId, userId }
      });
    }

    const newAttachment = await (prisma as any).attachment.create({
      data: { taskId, fileName, fileUrl, fileType: fileType || 'link' }
    });
    res.status(201).json(newAttachment);
  } catch (error) {
    console.error('[ATTACHMENT ERROR]', error);
    res.status(500).json({ error: 'Asset injection failure.' });
  }
});

// ==========================================
// DESTRUCTIVE PROTOCOLS (DELETE & SAFE ARCHIVE PUT)
// ==========================================
app.delete('/api/tasks/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const taskId = req.params.id as string;
    const userId = req.user!.id;

    const task = await (prisma as any).task.findUnique({ where: { id: taskId }, include: { members: true } });
    if (!task) { res.status(404).json({ error: 'Target matrix node absent.' }); return; }

    const isOwner = task.ownerId === userId;
    const isAdmin = task.members.some((m: any) => m.userId === userId && m.role === 'admin');

    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Server RBAC Denial: Global eradication requires Admin credentials.' });
      return;
    }

    await prisma.task.delete({ where: { id: taskId } });
    res.status(204).send(); 
  } catch (error) {
    res.status(500).json({ error: 'Eradication failure.' });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const taskId = req.params.id as string;
    const userId = req.user!.id;
    const { status, isArchived, description, attachments, subTasks } = req.body;

    const task = await (prisma as any).task.findUnique({ where: { id: taskId }, include: { members: true } });
    if (!task) { res.status(404).json({ error: 'Matrix absent.' }); return; }

    const isOwner = task.ownerId === userId;
    const myMemberRecord = task.members.find((m: any) => m.userId === userId);
    const myRole = isOwner ? 'admin' : (myMemberRecord?.role || 'viewer');

    if (myRole === 'viewer') {
      res.status(403).json({ error: 'Viewer clearance blocks architecture mutation.' });
      return;
    }
    if (task.isCollab && myRole === 'editor' && (status !== undefined || isArchived !== undefined)) {
      res.status(403).json({ error: 'Server RBAC Denial: Archiving a shared workspace requires Administrative clearance.' });
      return;
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (isArchived !== undefined) updateData.isArchived = isArchived;
    if (description !== undefined) updateData.description = description;

    await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) { await tx.task.update({ where: { id: taskId }, data: updateData }); }
      
      if (attachments && Array.isArray(attachments)) {
        await tx.attachment.deleteMany({ where: { taskId } });
        if (attachments.length > 0) { await tx.attachment.createMany({ data: attachments.map((a: any) => ({ taskId, fileName: a.fileName || "Uploaded Asset", fileUrl: a.url || a.fileUrl || "mock", fileType: a.fileType || "link" })) }); }
      }

      if (subTasks && Array.isArray(subTasks)) {
        await tx.subTask.deleteMany({ where: { taskId } });
        if (subTasks.length > 0) { await tx.subTask.createMany({ data: subTasks.map((s: any) => ({ taskId, title: s.title || "Stage", isCompleted: Boolean(s.isCompleted), assigneeId: s.assigneeId || null })) }); }
      }
    });

    const updatedTask = await (prisma as any).task.findUnique({
      where: { id: taskId },
      include: { attachments: true, subTasks: { include: { assignee: { select: { id: true, displayName: true } } } }, comments: { include: { user: { select: { id: true, displayName: true } } } } }
    });
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Transaction structural compile exception.' });
  }
});

app.put('/api/tasks/:id/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updatedTask = await prisma.task.update({ where: { id: req.params.id as string }, data: { status: req.body.status } });
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'State update error.' });
  }
});

app.put('/api/subtasks/:id/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updatedSubTask = await (prisma as any).subTask.update({ where: { id: req.params.id as string }, data: { isCompleted: req.body.isCompleted } });
    res.json(updatedSubTask);
  } catch (error) {
    res.status(500).json({ error: 'Subtask compilation exception.' });
  }
});

// ==========================================
// INIT PELADEN
// ==========================================
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`[Server] Ecosystem active and listening`);
  console.log(`[Port]   http://localhost:${PORT}`);
  console.log(`========================================\n`);
});