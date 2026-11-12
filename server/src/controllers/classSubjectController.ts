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

export const updateClassSubject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { teacherId, active } = req.body;

    const updated = await prisma.classSubject.update({
      where: { id },
      data: {
        ...(teacherId && { teacherId }),
        ...(active !== undefined && { active }),
      },
      include: {
        class: true,
        subject: true,
        teacher: true,
      },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update assignment' });
  }
};

export const batchAssignSubjects = async (req: AuthRequest, res: Response) => {
  try {
    const { classId, subjectIds, teacherId } = req.body;
    if (!classId || !Array.isArray(subjectIds) || !teacherId) {
      return res.status(400).json({ error: 'classId, subjectIds array, and teacherId are required' });
    }

    let count = 0;
    for (const subjectId of subjectIds) {
      await prisma.classSubject.upsert({
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
      });
      count++;
    }

    res.json({ message: `Successfully assigned ${count} subjects`, count });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to batch assign subjects' });
  }
};

export const copyClassSubjectAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const { fromClassId, toClassId } = req.body;
    if (!fromClassId || !toClassId) {
      return res.status(400).json({ error: 'fromClassId and toClassId are required' });
    }

    if (fromClassId === toClassId) {
      return res.status(400).json({ error: 'Source and destination class cannot be the same' });
    }

    const sourceAssignments = await prisma.classSubject.findMany({
      where: { classId: fromClassId, active: true },
    });

    if (sourceAssignments.length === 0) {
      return res.status(400).json({ error: 'No active assignments found in source class to copy' });
    }

    let copiedCount = 0;
    for (const src of sourceAssignments) {
      await prisma.classSubject.upsert({
        where: {
          classId_subjectId: { classId: toClassId, subjectId: src.subjectId },
        },
        update: {
          teacherId: src.teacherId,
          active: true,
        },
        create: {
          classId: toClassId,
          subjectId: src.subjectId,
          teacherId: src.teacherId,
          active: true,
        },
      });
      copiedCount++;
    }

    res.json({ message: `Successfully copied ${copiedCount} subject assignments`, count: copiedCount });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to copy assignments' });
  }
};
