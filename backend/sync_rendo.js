const { DatabaseSync } = require('node:sqlite');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const rendoDb = new DatabaseSync('D:/FOR RENDO (ONLY )/Personal Project/RendoOs/prisma/dev.db');

async function sync() {
  try {
    const projects = rendoDb.prepare('SELECT * FROM Project').all();
    console.log('Found', projects.length, 'projects in RendoOs');

    for (const p of projects) {
      const projPath = p.folderPath || ('D:/FOR RENDO (ONLY )/Personal Project/' + p.name);
      try {
        await prisma.project.upsert({
          where: { path: projPath },
          update: {
            slug: p.slug,
            folderPath: projPath,
            description: p.description,
            status: p.status || 'ACTIVE',
            isPrimary: Boolean(p.isPrimary),
            progress: p.progress || 0,
            image: p.image,
            mobileImage: p.mobileImage,
            currentMilestone: p.currentMilestone,
            overview: p.overview,
            techStack: p.techStack,
            architecture: p.architecture,
            databaseDesign: p.databaseDesign,
            flowExplainer: p.flowExplainer,
            repoUrl: p.repoUrl,
            liveUrl: p.liveUrl,
            runScript: p.runScript || 'npm run dev',
            port: p.port,
            health: p.health || 'HEALTHY',
          },
          create: {
            id: p.id,
            name: p.name,
            slug: p.slug,
            path: projPath,
            folderPath: projPath,
            description: p.description,
            status: p.status || 'ACTIVE',
            isPrimary: Boolean(p.isPrimary),
            progress: p.progress || 0,
            image: p.image,
            mobileImage: p.mobileImage,
            currentMilestone: p.currentMilestone,
            overview: p.overview,
            techStack: p.techStack,
            architecture: p.architecture,
            databaseDesign: p.databaseDesign,
            flowExplainer: p.flowExplainer,
            repoUrl: p.repoUrl,
            liveUrl: p.liveUrl,
            runScript: p.runScript || 'npm run dev',
            port: p.port,
            health: p.health || 'HEALTHY',
          }
        });
        console.log('Synced project:', p.name);
      } catch (e) {
        console.error('Error syncing project', p.name, e.message);
      }
    }

    const tasks = rendoDb.prepare('SELECT * FROM Task').all();
    console.log('Found', tasks.length, 'tasks');
    for (const t of tasks) {
      try {
        await prisma.task.upsert({
          where: { id: t.id },
          update: {
            title: t.title,
            description: t.description,
            status: t.status,
            bucket: t.bucket,
            priority: t.priority,
            order: t.order || 0
          },
          create: {
            id: t.id,
            projectId: t.projectId,
            title: t.title,
            description: t.description,
            status: t.status,
            bucket: t.bucket,
            priority: t.priority,
            order: t.order || 0
          }
        });
      } catch (e) {}
    }

    const ideas = rendoDb.prepare('SELECT * FROM Idea').all();
    console.log('Found', ideas.length, 'ideas');
    for (const i of ideas) {
      try {
        await prisma.idea.upsert({
          where: { id: i.id },
          update: { title: i.title, description: i.description, tags: i.tags },
          create: { id: i.id, title: i.title, description: i.description, tags: i.tags, projectId: i.projectId }
        });
      } catch (e) {}
    }

    const blockers = rendoDb.prepare('SELECT * FROM Blocker').all();
    console.log('Found', blockers.length, 'blockers');
    for (const b of blockers) {
      try {
        await prisma.blocker.upsert({
          where: { id: b.id },
          update: { title: b.title, description: b.description, resolved: Boolean(b.resolved) },
          create: { id: b.id, projectId: b.projectId, title: b.title, description: b.description, resolved: Boolean(b.resolved) }
        });
      } catch (e) {}
    }

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

sync();

