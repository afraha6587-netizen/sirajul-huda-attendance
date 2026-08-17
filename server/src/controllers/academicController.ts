import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

// Academic Years
export const getAcademicYears = async (_req: AuthRequest, res: Response) => {
  try {
    const years = await prisma.academicYear.findMany({
      orderBy: { startDate: 'desc' },
      include: { academicMonths: true },
    });
    res.json(years);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch academic years' });
  }
};

export const createAcademicYear = async (req: AuthRequest, res: Response) => {
  try {
    const { name, startDate, endDate, isCurrent } = req.body;
    if (isCurrent) {
      await prisma.academicYear.updateMany({ data: { isCurrent: false } });
    }
    const year = await prisma.academicYear.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent: Boolean(isCurrent),
      },
    });
    res.status(201).json(year);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create academic year' });
  }
};

// Academic Months
export const getAcademicMonths = async (req: AuthRequest, res: Response) => {
  try {
    const { yearId } = req.query;
    const months = await prisma.academicMonth.findMany({
      where: yearId ? { academicYearId: String(yearId) } : undefined,
      include: { academicYear: true },
      orderBy: [{ year: 'asc' }, { id: 'asc' }],
    });
    res.json(months);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch academic months' });
  }
};

export const createAcademicMonth = async (req: AuthRequest, res: Response) => {
  try {
    const { academicYearId, monthName, year, workingDays } = req.body;
    const month = await prisma.academicMonth.create({
      data: {
        academicYearId,
        monthName,
        year: Number(year),
        workingDays: Number(workingDays || 23),
      },
    });
    res.status(201).json(month);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create academic month' });
  }
};

export const updateAcademicMonth = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { workingDays, monthName } = req.body;
    const updated = await prisma.academicMonth.update({
      where: { id },
      data: {
        ...(workingDays !== undefined && { workingDays: Number(workingDays) }),
        ...(monthName && { monthName }),
      },
    });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update academic month' });
  }
};

// Subject Monthly Configuration (Available Classes)
export const getSubjectMonthlyConfigs = async (req: AuthRequest, res: Response) => {
  try {
    const { classId, monthId } = req.query;
    const configs = await prisma.subjectMonthlyConfig.findMany({
      where: {
        monthId: String(monthId),
        classSubject: {
          classId: String(classId),
        },
      },
      include: {
        classSubject: {
          include: {
            subject: true,
            teacher: true,
            class: true,
          },
        },
      },
    });
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subject monthly configurations' });
  }
};

export const updateSubjectMonthlyConfig = async (req: AuthRequest, res: Response) => {
  try {
    const { classSubjectId, monthId, availableClasses } = req.body;

    const config = await prisma.subjectMonthlyConfig.upsert({
      where: {
        classSubjectId_monthId: {
          classSubjectId,
          monthId,
        },
      },
      update: {
        availableClasses: Math.max(0, Number(availableClasses)),
      },
      create: {
        classSubjectId,
        monthId,
        availableClasses: Math.max(0, Number(availableClasses)),
      },
    });

    res.json(config);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update available classes' });
  }
};

// System Settings
export const getSettings = async (_req: AuthRequest, res: Response) => {
  try {
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { id: '1' },
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { collegeName, logoUrl, attendanceThreshold, timezone, dateFormat } = req.body;
    const updated = await prisma.systemSettings.upsert({
      where: { id: '1' },
      update: {
        ...(collegeName && { collegeName }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(attendanceThreshold !== undefined && { attendanceThreshold: Number(attendanceThreshold) }),
        ...(timezone && { timezone }),
        ...(dateFormat && { dateFormat }),
      },
      create: {
        id: '1',
        collegeName: collegeName || 'Islamic Academic College',
        logoUrl: logoUrl || '',
        attendanceThreshold: Number(attendanceThreshold) || 75.0,
        timezone: timezone || 'Asia/Kolkata',
        dateFormat: dateFormat || 'YYYY-MM-DD',
      },
    });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update settings' });
  }
};
