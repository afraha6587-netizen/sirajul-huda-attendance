import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getSubjects = async (_req: AuthRequest, res: Response) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        _count: {
          select: { classSubjects: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
};

export const createSubject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, arabicName, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Subject name and code are required' });
    }

    const existingCode = await prisma.subject.findUnique({ where: { code } });
    if (existingCode) {
      return res.status(400).json({ error: `Subject code ${code} already exists` });
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        arabicName: arabicName || name,
        code,
        active: true,
      },
    });

    res.status(201).json(subject);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create subject' });
  }
};

export const updateSubject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, arabicName, code, active } = req.body;

    if (code) {
      const existing = await prisma.subject.findFirst({
        where: { code, NOT: { id } },
      });
      if (existing) {
        return res.status(400).json({ error: `Subject code ${code} already exists` });
      }
    }

    const updated = await prisma.subject.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(arabicName !== undefined && { arabicName }),
        ...(code && { code }),
        ...(active !== undefined && { active }),
      },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update subject' });
  }
};

export const deleteSubject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.subject.delete({ where: { id } });
    res.json({ message: 'Subject deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete subject' });
  }
};
