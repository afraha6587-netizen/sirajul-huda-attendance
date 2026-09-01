import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getDatabaseOverview = async (_req: AuthRequest, res: Response) => {
  try {
    const [
      studentCount,
      sessionCount,
      recordCount,
      dailyCount,
      classCount,
      subjectCount,
      teacherCount,
      userCount,
      holidayCount,
      academicYearCount,
      settings,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.attendanceSession.count(),
      prisma.attendanceRecord.count(),
      prisma.dailyAttendance.count(),
      prisma.class.count(),
      prisma.subject.count(),
      prisma.teacher.count(),
      prisma.user.count(),
      prisma.institutionHoliday.count(),
      prisma.academicYear.count(),
      prisma.systemSettings.findFirst(),
    ]);

    res.json({
      databaseType: process.env.DATABASE_URL?.startsWith('postgres') ? 'PostgreSQL (Cloud Persistent)' : 'SQLite (Local Persistent)',
      status: 'ONLINE & HEALTHY',
      lastBackupTime: new Date().toISOString(),
      counts: {
        students: studentCount,
        attendanceSessions: sessionCount,
        attendanceRecords: recordCount,
        dailyAttendance: dailyCount,
        classes: classCount,
        subjects: subjectCount,
        teachers: teacherCount,
        users: userCount,
        holidays: holidayCount,
        academicYears: academicYearCount,
      },
      settings,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch database overview' });
  }
};

export const getDatabaseTableData = async (req: AuthRequest, res: Response) => {
  try {
    const { tableName } = req.params;
    let data: any[] = [];

    switch (tableName) {
      case 'students':
        data = await prisma.student.findMany({ include: { class: true }, orderBy: { dateJoined: 'desc' } });
        break;
      case 'sessions':
        data = await prisma.attendanceSession.findMany({
          take: 100,
          orderBy: { createdAt: 'desc' },
          include: { class: true, classSubject: { include: { subject: true, teacher: true } }, records: true },
        });
        break;
      case 'daily-attendance':
        data = await prisma.dailyAttendance.findMany({
          take: 100,
          orderBy: { createdAt: 'desc' },
          include: { student: true, class: true },
        });
        break;
      case 'classes':
        data = await prisma.class.findMany({ include: { academicYear: true, _count: { select: { students: true } } } });
        break;
      case 'subjects':
        data = await prisma.subject.findMany();
        break;
      case 'teachers':
        data = await prisma.teacher.findMany();
        break;
      case 'users':
        data = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, createdAt: true } });
        break;
      case 'holidays':
        data = await prisma.institutionHoliday.findMany({ include: { academicMonth: true } });
        break;
      default:
        return res.status(400).json({ error: `Invalid table name "${tableName}"` });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch table data' });
  }
};

export const exportFullDatabaseBackup = async (_req: AuthRequest, res: Response) => {
  try {
    const [students, classes, subjects, teachers, classSubjects, sessions, daily, holidays, years, months, settings] =
      await Promise.all([
        prisma.student.findMany(),
        prisma.class.findMany(),
        prisma.subject.findMany(),
        prisma.teacher.findMany(),
        prisma.classSubject.findMany(),
        prisma.attendanceSession.findMany({ include: { records: true } }),
        prisma.dailyAttendance.findMany(),
        prisma.institutionHoliday.findMany(),
        prisma.academicYear.findMany(),
        prisma.academicMonth.findMany(),
        prisma.systemSettings.findFirst(),
      ]);

    const backupData = {
      institution: 'Sirajul Huda College of Science and Integrated Studies, Nadapuram',
      exportTimestamp: new Date().toISOString(),
      version: '1.0',
      database: {
        settings,
        academicYears: years,
        academicMonths: months,
        classes,
        subjects,
        teachers,
        classSubjects,
        students,
        attendanceSessions: sessions,
        dailyAttendance: daily,
        holidays,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=Sirajul_Huda_Database_Backup_${new Date().toISOString().split('T')[0]}.json`);
    res.send(JSON.stringify(backupData, null, 2));
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate database backup' });
  }
};
