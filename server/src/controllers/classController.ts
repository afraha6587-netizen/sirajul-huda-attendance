import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getClasses = async (req: AuthRequest, res: Response) => {
  try {
    const { activeOnly, teacherId } = req.query;

    let whereCondition: any = {};
    if (activeOnly === 'true') {
      whereCondition.active = true;
    }

    if (teacherId) {
      whereCondition.classSubjects = {
        some: { teacherId: String(teacherId) },
      };
    }

    const classes = await prisma.class.findMany({
      where: whereCondition,
      include: {
        academicYear: true,
        _count: {
          select: {
            students: true,
            classSubjects: true,
          },
        },
        classSubjects: {
          include: {
            subject: true,
            teacher: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
};

export const getClassById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const singleClass = await prisma.class.findUnique({
      where: { id },
      include: {
        academicYear: true,
        students: {
          where: { active: true },
          orderBy: { rollNumber: 'asc' },
        },
        classSubjects: {
          where: { active: true },
          include: {
            subject: true,
            teacher: true,
          },
        },
      },
    });

    if (!singleClass) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json(singleClass);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch class details' });
  }
};

export const createClass = async (req: AuthRequest, res: Response) => {
  try {
    const { name, academicYearId } = req.body;
    if (!name || !academicYearId) {
      return res.status(400).json({ error: 'Class name and academic year are required' });
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        academicYearId,
        active: true,
      },
    });

    res.status(201).json(newClass);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create class' });
  }
};

export const updateClass = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, active, academicYearId } = req.body;

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(active !== undefined && { active }),
        ...(academicYearId && { academicYearId }),
      },
    });

    res.json(updatedClass);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update class' });
  }
};

export const deleteClass = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.class.delete({ where: { id } });
    res.json({ message: 'Class deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete class' });
  }
};
