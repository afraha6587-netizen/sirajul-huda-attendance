import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getTeachers = async (_req: AuthRequest, res: Response) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: { select: { email: true, role: true } },
        classSubjects: {
          include: {
            class: true,
            subject: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
};

export const createTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, email, password } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Teacher name and code are required' });
    }

    const existingCode = await prisma.teacher.findUnique({ where: { code } });
    if (existingCode) {
      return res.status(400).json({ error: `Teacher code ${code} already exists` });
    }

    let userId: string | undefined = undefined;

    if (email && password) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: `Email ${email} is already registered` });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: 'TEACHER',
        },
      });
      userId = user.id;
    }

    const teacher = await prisma.teacher.create({
      data: {
        name,
        code,
        userId,
        active: true,
      },
      include: { user: { select: { email: true, role: true } } },
    });

    res.status(201).json(teacher);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create teacher' });
  }
};

export const updateTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, active, email, password } = req.body;

    if (code) {
      const existing = await prisma.teacher.findFirst({
        where: { code, NOT: { id } },
      });
      if (existing) {
        return res.status(400).json({ error: `Teacher code ${code} already exists` });
      }
    }

    const currentTeacher = await prisma.teacher.findUnique({ where: { id }, include: { user: true } });
    if (!currentTeacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    if (email) {
      if (currentTeacher.userId) {
        await prisma.user.update({
          where: { id: currentTeacher.userId },
          data: {
            email,
            name: name || currentTeacher.name,
            ...(password && { passwordHash: await bcrypt.hash(password, 10) }),
          },
        });
      } else {
        const passwordHash = await bcrypt.hash(password || 'teacher123', 10);
        const newUser = await prisma.user.create({
          data: {
            email,
            name: name || currentTeacher.name,
            passwordHash,
            role: 'TEACHER',
          },
        });
        await prisma.teacher.update({
          where: { id },
          data: { userId: newUser.id },
        });
      }
    }

    const updated = await prisma.teacher.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(active !== undefined && { active }),
      },
      include: { user: { select: { email: true, role: true } } },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update teacher' });
  }
};

export const deleteTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const teacher = await prisma.teacher.findUnique({ where: { id } });
    if (teacher?.userId) {
      await prisma.user.delete({ where: { id: teacher.userId } });
    } else {
      await prisma.teacher.delete({ where: { id } });
    }
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete teacher' });
  }
};
