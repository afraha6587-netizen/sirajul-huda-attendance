import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const saveAttendanceSession = async (req: Request, res: Response) => {
  try {
    const { classSubjectId, date, period, records, topicTaught, kitabPage } = req.body;
    const userId = (req as any).user.id;

    if (!classSubjectId || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'classSubjectId, date, and student records array are required' });
    }

    const cs = await prisma.classSubject.findUnique({
      where: { id: classSubjectId },
      include: { subject: true, class: true },
    });

    if (!cs) {
      return res.status(404).json({ error: 'Class Subject assignment not found' });
    }

    // Check if session already exists for date + period + classSubject
    const dateStr = String(date).trim();
    let session = await prisma.attendanceSession.findFirst({
      where: {
        classSubjectId,
        date: dateStr,
        period: Number(period || 1),
      },
    });

    if (session) {
      // Update existing session topic and records
      session = await prisma.attendanceSession.update({
        where: { id: session.id },
        data: {
          topicTaught: topicTaught || session.topicTaught,
          kitabPage: kitabPage || session.kitabPage,
        },
      });

      // Delete old records and re-create
      await prisma.attendanceRecord.deleteMany({
        where: { sessionId: session.id },
      });
    } else {
      session = await prisma.attendanceSession.create({
        data: {
          classId: cs.classId,
          subjectId: cs.subjectId,
          classSubjectId: cs.id,
          teacherId: cs.teacherId,
          date: dateStr,
          period: Number(period || 1),
          topicTaught: topicTaught || null,
          kitabPage: kitabPage || null,
          createdById: userId,
        },
      });
    }

    // Insert attendance records
    await prisma.attendanceRecord.createMany({
      data: records.map((r: any) => ({
        sessionId: session!.id,
        studentId: r.studentId,
        status: r.status, // "PRESENT", "ABSENT", "LEAVE"
      })),
    });

    // Also update Daily Attendance for each student on this date
    for (const r of records) {
      await prisma.dailyAttendance.upsert({
        where: {
          classId_studentId_date: {
            classId: cs.classId,
            studentId: r.studentId,
            date: dateStr,
          },
        },
        update: {
          status: r.status,
        },
        create: {
          classId: cs.classId,
          studentId: r.studentId,
          date: dateStr,
          status: r.status,
          createdById: userId,
        },
      });
    }

    // Generate WhatsApp Notification Links for Absent Students
    const absentRecords = records.filter((r: any) => r.status === 'ABSENT' || r.status === 'LEAVE');
    const absentStudents = await prisma.student.findMany({
      where: { id: { in: absentRecords.map((r: any) => r.studentId) } },
    });

    const whatsappAlerts = absentStudents.map((st) => {
      const phone = st.parentPhone || st.phone || '';
      const text = `Sirajul Huda College Alert: Your ward ${st.name} (Reg No: ${st.registerNumber}) was marked ${
        absentRecords.find((r: any) => r.studentId === st.id)?.status || 'ABSENT'
      } for period ${period || 1} (${cs.subject.name}) on ${dateStr}.`;

      return {
        studentId: st.id,
        studentName: st.name,
        registerNumber: st.registerNumber,
        phone,
        messageText: text,
        whatsappUrl: phone ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}` : null,
      };
    });

    res.json({
      message: 'Attendance session and syllabus log saved successfully',
      sessionId: session.id,
      whatsappAlerts,
    });
  } catch (error: any) {
    console.error('Error saving attendance session:', error);
    res.status(500).json({ error: error.message || 'Failed to save attendance session' });
  }
};

export const saveDailyAttendance = async (req: Request, res: Response) => {
  try {
    const { classId, date, records } = req.body;
    const userId = (req as any).user.id;

    if (!classId || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'classId, date, and student records array are required' });
    }

    const dateStr = String(date).trim();

    for (const r of records) {
      await prisma.dailyAttendance.upsert({
        where: {
          classId_studentId_date: {
            classId,
            studentId: r.studentId,
            date: dateStr,
          },
        },
        update: {
          status: r.status,
        },
        create: {
          classId,
          studentId: r.studentId,
          date: dateStr,
          status: r.status,
          createdById: userId,
        },
      });
    }

    res.json({ message: 'Daily attendance saved successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save daily attendance' });
  }
};

export const getDailyAttendance = async (req: Request, res: Response) => {
  try {
    const { classId, date } = req.query;
    if (!classId || !date) {
      return res.status(400).json({ error: 'classId and date are required' });
    }

    const records = await prisma.dailyAttendance.findMany({
      where: {
        classId: String(classId),
        date: String(date),
      },
      include: {
        student: true,
      },
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch daily attendance' });
  }
};

export const getAttendanceSessions = async (req: Request, res: Response) => {
  try {
    const { classId, subjectId, date } = req.query;
    const where: any = {};

    if (classId) where.classId = String(classId);
    if (subjectId) where.subjectId = String(subjectId);
    if (date) where.date = String(date);

    const sessions = await prisma.attendanceSession.findMany({
      where,
      include: {
        class: true,
        classSubject: {
          include: {
            subject: true,
            teacher: true,
          },
        },
        records: {
          include: {
            student: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 50,
    });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance sessions' });
  }
};

export const getSessionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = await prisma.attendanceSession.findUnique({
      where: { id },
      include: {
        class: true,
        classSubject: {
          include: {
            subject: true,
            teacher: true,
          },
        },
        records: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};

export const deleteSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.attendanceSession.delete({ where: { id } });
    res.json({ message: 'Attendance session deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete attendance session' });
  }
};

// Feature 3: Syllabus Log Endpoint
export const getSyllabusLog = async (req: Request, res: Response) => {
  try {
    const { classId, subjectId } = req.query;
    const where: any = {};
    if (classId) where.classId = String(classId);
    if (subjectId) where.subjectId = String(subjectId);

    const sessions = await prisma.attendanceSession.findMany({
      where,
      include: {
        class: true,
        classSubject: {
          include: { subject: true, teacher: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    const syllabusLogs = sessions.map((s) => ({
      sessionId: s.id,
      date: s.date,
      period: s.period,
      className: s.class.name,
      subjectName: s.classSubject.subject.name,
      arabicName: s.classSubject.subject.arabicName,
      teacherName: s.classSubject.teacher.name,
      topicTaught: s.topicTaught || 'Regular Period Class',
      kitabPage: s.kitabPage || 'N/A',
    }));

    res.json(syllabusLogs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch syllabus progress logs' });
  }
};
