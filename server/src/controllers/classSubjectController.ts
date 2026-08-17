import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getClassSubjects = async (req: AuthRequest, res: Response) => {
  try {
    const { classId, teacherId, subjectId } = req.query;

    const whereCondition: any = { active: true };
    if (classId) whereCondition.classId = String(classId);
    if (teacherId) whereCondition.teacherId = String(teacherId);
    if (subjectId) whereCondition.subjectId = String(subjectId);

    const assignments = await prisma.classSubject.findMany({
      where: whereCondition,
      include: {
        class: true,
        subject: true,
        teacher: true,
      },
      orderBy: [{ class: { name: 'asc' } }, { subject: { name: 'asc' } }],
    });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch class-subject assignments' });
  }
};

export const assignSubjectToClass = async (req: AuthRequest, res: Response) => {
  try {
    const { classId, subjectId, teacherId } = req.body;

    if (!classId || !subjectId || !teacherId) {
      return res.status(400).json({ error: 'Class, Subject, and Teacher are required' });
    }

    const assignment = await prisma.classSubject.upsert({
      where: {
        classId_subjectId: { classId, subjectId },
      },
      update: {
        teacherId,
        active: true,
      },
      create: {
        classId,
        subjectId,
        teacherId,
        active: true,
      },
      include: {
        class: true,
        subject: true,
        teacher: true,
      },
    });

    res.status(201).json(assignment);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to assign subject to class' });
  }
};

export const removeSubjectFromClass = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.classSubject.delete({ where: { id } });
    res.json({ message: 'Subject assignment removed from class' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to remove assignment' });
  }
};
