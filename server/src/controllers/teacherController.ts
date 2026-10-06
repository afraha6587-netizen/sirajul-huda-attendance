import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getTeachers = async (_req: AuthRequest, res: Response) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: { select: { email: true, role: true, isApproved: true } },
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

    // Enforce Maximum 6 Teachers Limit
    const currentTeacherCount = await prisma.teacher.count();
    if (currentTeacherCount >= 6) {
      return res.status(400).json({ error: 'Maximum limit of 6 teachers reached. You cannot add more teachers.' });
    }

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

export const approveTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const teacher = await prisma.teacher.findUnique({ where: { id }, include: { user: true } });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Check active teacher limit of 6
    const activeTeacherCount = await prisma.teacher.count({ where: { active: true } });
    if (!teacher.active && activeTeacherCount >= 6) {
      return res.status(400).json({ error: 'Maximum limit of 6 active teachers reached. Delete or deactivate a teacher first.' });
    }

    if (teacher.userId) {
      await prisma.user.update({
        where: { id: teacher.userId },
        data: { isApproved: true },
      });
    }

    const updated = await prisma.teacher.update({
      where: { id },
      data: { active: true },
      include: { user: { select: { email: true, role: true, isApproved: true } } },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to approve teacher' });
  }
};

export const getTeacherAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { teacherId, date } = req.query;
    const where: any = {};

    if (teacherId) where.teacherId = String(teacherId);
    if (date) where.date = String(date);

    const records = await prisma.teacherAttendance.findMany({
      where,
      include: {
        teacher: true,
        class: true,
      },
      orderBy: { date: 'desc' },
    });

    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch teacher attendance' });
  }
};

export const saveTeacherAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { teacherId, date, classId, period, status, reason } = req.body;

    if (!teacherId || !date) {
      return res.status(400).json({ error: 'Teacher ID and date are required' });
    }

    const createdById = req.user?.id || 'system';

    const record = await prisma.teacherAttendance.create({
      data: {
        teacherId,
        date: String(date).trim(),
        classId: classId || null,
        period: period ? Number(period) : null,
        status: status || 'ABSENT',
        reason: reason ? String(reason).trim() : null,
        createdById,
      },
      include: {
        teacher: true,
        class: true,
      },
    });

    res.status(201).json(record);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to save teacher attendance' });
  }
};

export const deleteTeacherAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.teacherAttendance.delete({ where: { id } });
    res.json({ message: 'Teacher attendance record deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete teacher attendance' });
  }
};

