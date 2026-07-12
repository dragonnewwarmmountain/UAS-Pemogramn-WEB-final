// apps/backend/prisma/seed.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// 1. Dynamically swap the protocol from mysql:// to mariadb://
const dbUrl = (process.env.DATABASE_URL as string).replace('mysql://', 'mariadb://');

// 2. Pass the URL string directly.
const adapter = new PrismaMariaDb(dbUrl);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data to avoid duplicates
  await prisma.attachment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.subTask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  // Create Project Manager
  const manager = await prisma.user.create({
    data: {
      email: 'manager@hub.com',
      passwordHash: 'dummy_hash',
      displayName: 'Alex (Project Manager)',
    },
  });

  // Create Developer
  const developer = await prisma.user.create({
    data: {
      email: 'dev@hub.com',
      passwordHash: 'dummy_hash',
      displayName: 'Sam (Developer)',
    },
  });

  // Create an initial Task
  await prisma.task.create({
    data: {
      ownerId: manager.id,
      title: 'Architect API Server',
      description: 'Build the Express.js endpoints for the frontend to consume.',
      difficultySp: 8,
      isSequential: true,
      subTasks: {
        create: [
          { title: 'Setup Express & CORS', isCompleted: true },
          { title: 'Create GET /tasks route', assignedUserId: developer.id },
          { title: 'Create PUT /tasks/:id route' },
        ],
      },
    },
  });

  console.log('Database seeded successfully! 🌱');
}

