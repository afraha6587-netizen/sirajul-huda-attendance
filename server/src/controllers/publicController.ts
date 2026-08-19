import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { ensureAdminSeeded, cleanResetDatabase } from '../seed';

export const cleanResetSystem = async (_req: Request, res: Response) => {
  try {
    await cleanResetDatabase();
    res.json({
      message: 'System database successfully wiped clean! Ready for official college roster.',
      adminEmail: 'admin@college.edu',
      adminPassword: 'Admin@123456',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to perform clean reset' });
  }
};

export const seedSystem = async (req: Request, res: Response) => {
  try {
    await ensureAdminSeeded();
    res.json({
      message: 'System database successfully initialized!',
      adminEmail: 'admin@college.edu',
      adminPassword: 'Admin@123456',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to seed system' });
  }
};

export const getPublicStudentAttendance = async (req: Request, res: Response) => {
  try {
    const { registerNumber, search, monthId } = req.query;
    const queryTerm = String(registerNumber || search || '').trim();

    if (!queryTerm) {
      return res.status(400).json({ error: 'Please enter a Register Number, Roll Number, or Student Name' });
    }

    // 1. Search Student flexible matching
    let student = await prisma.student.findFirst({
      where: {
        OR: [
          { registerNumber: { equals: queryTerm } },
          { registerNumber: { contains: queryTerm } },
          { name: { contains: queryTerm } },
          ...(isNaN(Number(queryTerm)) ? [] : [{ rollNumber: Number(queryTerm) }]),
        ],
        active: true,
      },
      include: {
        class: {
          include: {
            academicYear: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: `No active student found matching "${queryTerm}"` });
    }

    // 2. Resolve Academic Month (selected monthId or latest month)
    let month = monthId
      ? await prisma.academicMonth.findUnique({ where: { id: String(monthId) } })
      : await prisma.academicMonth.findFirst({ orderBy: [{ year: 'desc' }, { id: 'desc' }] });

    if (!month) {
      return res.status(404).json({ error: 'No active academic month found' });
    }

    // Date range bounds for month
    const monthMap: Record<string, number> = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
    };
    const monthIdx = monthMap[month.monthName.toLowerCase()] ?? 6;
    const startDate = new Date(Date.UTC(month.year, monthIdx, 1));
    const endDate = new Date(Date.UTC(month.year, monthIdx + 1, 0, 23, 59, 59));
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    // 3. Fetch Class Subjects assigned to student's class
    const classSubjects = await prisma.classSubject.findMany({
      where: { classId: student.classId, active: true },
      include: {
        subject: true,
        teacher: true,
        subjectMonthlyConfigs: { where: { monthId: month.id } },
      },
      orderBy: { subject: { name: 'asc' } },
    });

    // 4. Calculate Subject Breakdown for Student
    let grandTotalAttended = 0;
    let grandTotalTaken = 0;

    const subjectBreakdown = await Promise.all(
      classSubjects.map(async (cs) => {
        const config = cs.subjectMonthlyConfigs[0];
        const available = config ? config.availableClasses : month!.workingDays;

        const takenCount = await prisma.attendanceSession.count({
          where: {
            classSubjectId: cs.id,
            date: { gte: startStr, lte: endStr },
          },
        });

        const attendedCount = await prisma.attendanceRecord.count({
          where: {
            studentId: student!.id,
            status: 'PRESENT',
            session: {
              classSubjectId: cs.id,
              date: { gte: startStr, lte: endStr },
            },
          },
        });

        grandTotalAttended += attendedCount;
        grandTotalTaken += takenCount;

        const percentage = takenCount > 0 ? Number(((attendedCount / takenCount) * 100).toFixed(2)) : 0;

        return {
          subjectName: cs.subject.name,
          arabicName: cs.subject.arabicName || cs.subject.name,
          teacherName: cs.teacher.name,
          availableClasses: available,
          takenClasses: takenCount,
          notTakenClasses: Math.max(0, available - takenCount),
          attendedCount,
          percentage,
        };
      })
    );

    // 5. Day-wise Attendance & Leave
    const totalWorkingDays = month.workingDays;
    const presentDaysCount = await prisma.dailyAttendance.count({
      where: {
        studentId: student.id,
        classId: student.classId,
        status: 'PRESENT',
        date: { gte: startStr, lte: endStr },
      },
    });

    const monthlyLeave = Math.max(0, totalWorkingDays - presentDaysCount);
    const dayWisePercentage = totalWorkingDays > 0 ? Number(((presentDaysCount / totalWorkingDays) * 100).toFixed(2)) : 0;
    const overallPercentage = grandTotalTaken > 0 ? Number(((grandTotalAttended / grandTotalTaken) * 100).toFixed(2)) : 0;

    // 6. Recent Session Records Logs
    const sessionLogs = await prisma.attendanceRecord.findMany({
      where: {
        studentId: student.id,
        session: { date: { gte: startStr, lte: endStr } },
      },
      include: {
        session: {
          include: {
            classSubject: {
              include: { subject: true, teacher: true },
            },
          },
        },
      },
      orderBy: { session: { date: 'desc' } },
      take: 20,
    });

    const settings = await prisma.systemSettings.findFirst();

    res.json({
      student: {
        id: student.id,
        name: student.name,
        registerNumber: student.registerNumber,
        rollNumber: student.rollNumber,
        className: student.class.name,
        admissionNo: student.admissionNo,
      },
      monthName: month.monthName,
      year: month.year,
      workingDays: totalWorkingDays,
      threshold: settings?.attendanceThreshold || 75.0,
      grandTotalAttended,
      grandTotalTaken,
      overallPercentage,
      presentDaysCount,
      monthlyLeave,
      dayWisePercentage,
      subjectBreakdown,
      sessionLogs,
    });
  } catch (error: any) {
    console.error('Public student search error:', error);
    res.status(500).json({ error: error.message || 'Failed to search student attendance' });
  }
};
