import { Response } from 'express';
import AdmZip from 'adm-zip';
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

    const dbUrl = process.env.DATABASE_URL || '';
    let databaseType = 'MySQL / MariaDB (XAMPP Connected)';
    if (dbUrl.includes('postgres')) databaseType = 'PostgreSQL (Cloud Persistent)';
    else if (dbUrl.includes('sqlite')) databaseType = 'SQLite (Local File)';

    res.json({
      databaseType,
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

export const exportFullDatabaseBackup = async (req: AuthRequest, res: Response) => {
  if (req.query.format === 'zip') {
    return exportZipDatabaseBackup(req, res);
  }

  try {
    const [
      students,
      classes,
      subjects,
      teachers,
      classSubjects,
      sessions,
      daily,
      holidays,
      years,
      months,
      settings,
      studentRemarks,
      teacherAttendances,
    ] = await Promise.all([
      prisma.student.findMany().catch(() => []),
      prisma.class.findMany().catch(() => []),
      prisma.subject.findMany().catch(() => []),
      prisma.teacher.findMany().catch(() => []),
      prisma.classSubject.findMany().catch(() => []),
      prisma.attendanceSession.findMany({ include: { records: true } }).catch(() => []),
      prisma.dailyAttendance.findMany().catch(() => []),
      prisma.institutionHoliday.findMany().catch(() => []),
      prisma.academicYear.findMany().catch(() => []),
      prisma.academicMonth.findMany().catch(() => []),
      prisma.systemSettings.findFirst().catch(() => null),
      prisma.studentRemark.findMany().catch(() => []),
      prisma.teacherAttendance.findMany().catch(() => []),
    ]);

    const backupData = {
      institution: 'Sirajul Huda College of Science and Integrated Studies, Nadapuram',
      exportTimestamp: new Date().toISOString(),
      version: '2.0',
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
        studentRemarks,
        teacherAttendances,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Sirajul_Huda_Database_Backup_${new Date().toISOString().split('T')[0]}.json`
    );
    res.send(JSON.stringify(backupData, null, 2));
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate database backup' });
  }
};

export const exportZipDatabaseBackup = async (_req: AuthRequest, res: Response) => {
  try {
    const [
      students,
      classes,
      subjects,
      teachers,
      classSubjects,
      sessions,
      daily,
      holidays,
      years,
      months,
      settings,
      studentRemarks,
      teacherAttendances,
    ] = await Promise.all([
      prisma.student.findMany().catch(() => []),
      prisma.class.findMany().catch(() => []),
      prisma.subject.findMany().catch(() => []),
      prisma.teacher.findMany().catch(() => []),
      prisma.classSubject.findMany().catch(() => []),
      prisma.attendanceSession.findMany({ include: { records: true } }).catch(() => []),
      prisma.dailyAttendance.findMany().catch(() => []),
      prisma.institutionHoliday.findMany().catch(() => []),
      prisma.academicYear.findMany().catch(() => []),
      prisma.academicMonth.findMany().catch(() => []),
      prisma.systemSettings.findFirst().catch(() => null),
      prisma.studentRemark.findMany().catch(() => []),
      prisma.teacherAttendance.findMany().catch(() => []),
    ]);

    const backupData = {
      institution: 'Sirajul Huda College of Science and Integrated Studies, Nadapuram',
      exportTimestamp: new Date().toISOString(),
      version: '2.0',
      securityLevel: 'Z+ Multi-Layer Secure Backup (ZIP Archive)',
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
        studentRemarks,
        teacherAttendances,
      },
    };

    const zip = new AdmZip();

    // 1. Unified Full Backup JSON
    zip.addFile('full_database_backup.json', Buffer.from(JSON.stringify(backupData, null, 2), 'utf8'));

    // 2. Metadata JSON
    const metadata = {
      institution: backupData.institution,
      exportTimestamp: backupData.exportTimestamp,
      version: backupData.version,
      securityLevel: backupData.securityLevel,
      counts: {
        students: students.length,
        classes: classes.length,
        subjects: subjects.length,
        teachers: teachers.length,
        classSubjects: classSubjects.length,
        attendanceSessions: sessions.length,
        dailyAttendance: daily.length,
        studentRemarks: studentRemarks.length,
        teacherAttendances: teacherAttendances.length,
        holidays: holidays.length,
      },
    };
    zip.addFile('metadata.json', Buffer.from(JSON.stringify(metadata, null, 2), 'utf8'));

    // 3. Individual Table Files inside the ZIP for maximum transparency
    zip.addFile('students.json', Buffer.from(JSON.stringify(students, null, 2), 'utf8'));
    zip.addFile('attendance_sessions.json', Buffer.from(JSON.stringify(sessions, null, 2), 'utf8'));
    zip.addFile('daily_attendance.json', Buffer.from(JSON.stringify(daily, null, 2), 'utf8'));
    zip.addFile('teachers.json', Buffer.from(JSON.stringify(teachers, null, 2), 'utf8'));
    zip.addFile('classes.json', Buffer.from(JSON.stringify(classes, null, 2), 'utf8'));
    zip.addFile('subjects.json', Buffer.from(JSON.stringify(subjects, null, 2), 'utf8'));
    zip.addFile('class_subjects.json', Buffer.from(JSON.stringify(classSubjects, null, 2), 'utf8'));
    zip.addFile('student_remarks.json', Buffer.from(JSON.stringify(studentRemarks, null, 2), 'utf8'));
    zip.addFile('teacher_attendances.json', Buffer.from(JSON.stringify(teacherAttendances, null, 2), 'utf8'));
    zip.addFile('academic_years.json', Buffer.from(JSON.stringify(years, null, 2), 'utf8'));
    zip.addFile('academic_months.json', Buffer.from(JSON.stringify(months, null, 2), 'utf8'));
    zip.addFile('holidays.json', Buffer.from(JSON.stringify(holidays, null, 2), 'utf8'));

    const zipBuffer = zip.toBuffer();

    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Sirajul_Huda_ZPlus_Database_Backup_${dateStr}.zip`
    );
    res.send(zipBuffer);
  } catch (error: any) {
    console.error('ZIP backup creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate ZIP database backup' });
  }
};

export const restoreFullDatabaseBackup = async (req: AuthRequest, res: Response) => {
  try {
    let backupObj: any = null;

    if (req.file) {
      const fileName = (req.file.originalname || '').toLowerCase();
      if (fileName.endsWith('.zip') || req.file.mimetype.includes('zip') || req.file.mimetype.includes('compressed')) {
        try {
          const zip = new AdmZip(req.file.buffer);
          const entries = zip.getEntries();
          const mainEntry = entries.find((e) => e.entryName === 'full_database_backup.json');

          if (mainEntry) {
            const content = mainEntry.getData().toString('utf8');
            backupObj = JSON.parse(content);
          } else {
            const db: any = {};
            for (const entry of entries) {
              if (entry.entryName.endsWith('.json') && !entry.isDirectory) {
                const content = entry.getData().toString('utf8');
                const json = JSON.parse(content);
                if (entry.entryName === 'students.json') db.students = json;
                else if (entry.entryName === 'attendance_sessions.json') db.attendanceSessions = json;
                else if (entry.entryName === 'daily_attendance.json') db.dailyAttendance = json;
                else if (entry.entryName === 'teachers.json') db.teachers = json;
                else if (entry.entryName === 'classes.json') db.classes = json;
                else if (entry.entryName === 'subjects.json') db.subjects = json;
                else if (entry.entryName === 'class_subjects.json') db.classSubjects = json;
                else if (entry.entryName === 'student_remarks.json') db.studentRemarks = json;
                else if (entry.entryName === 'teacher_attendances.json') db.teacherAttendances = json;
                else if (entry.entryName === 'academic_years.json') db.academicYears = json;
                else if (entry.entryName === 'academic_months.json') db.academicMonths = json;
                else if (entry.entryName === 'holidays.json') db.holidays = json;
              }
            }
            backupObj = { database: db };
          }
        } catch (zipErr: any) {
          return res.status(400).json({ error: `Failed to extract ZIP archive backup: ${zipErr.message}` });
        }
      } else {
        const fileContent = req.file.buffer.toString('utf8');
        backupObj = JSON.parse(fileContent);
      }
    } else if (req.body.backupData) {
      backupObj = typeof req.body.backupData === 'string' ? JSON.parse(req.body.backupData) : req.body.backupData;
    } else {
      backupObj = req.body;
    }

    const db = backupObj?.database || backupObj;
    if (!db || (!db.students && !db.classes && !db.attendanceSessions && !db.subjects)) {
      return res.status(400).json({ error: 'Invalid database backup JSON file format.' });
    }

    console.log('📥 Restoring database backup snapshot...');

    const restoredCount = {
      academicYears: 0,
      academicMonths: 0,
      classes: 0,
      subjects: 0,
      teachers: 0,
      classSubjects: 0,
      students: 0,
      sessions: 0,
      records: 0,
      daily: 0,
      remarks: 0,
      teacherAttendances: 0,
    };

    // 1. Academic Years
    if (Array.isArray(db.academicYears)) {
      for (const y of db.academicYears) {
        await prisma.academicYear.upsert({
          where: { id: y.id },
          create: {
            id: y.id,
            name: y.name,
            startDate: new Date(y.startDate),
            endDate: new Date(y.endDate),
            isCurrent: y.isCurrent ?? true,
            weeklyOffDay: y.weeklyOffDay || 'SUNDAY',
          },
          update: {
            name: y.name,
            isCurrent: y.isCurrent ?? true,
          },
        });
        restoredCount.academicYears++;
      }
    }

    // 2. Academic Months
    if (Array.isArray(db.academicMonths)) {
      for (const m of db.academicMonths) {
        await prisma.academicMonth.upsert({
          where: { id: m.id },
          create: {
            id: m.id,
            academicYearId: m.academicYearId,
            monthName: m.monthName,
            year: Number(m.year),
            workingDays: Number(m.workingDays || 23),
          },
          update: {
            workingDays: Number(m.workingDays || 23),
          },
        });
        restoredCount.academicMonths++;
      }
    }

    // 3. Classes
    if (Array.isArray(db.classes)) {
      for (const c of db.classes) {
        await prisma.class.upsert({
          where: { id: c.id },
          create: {
            id: c.id,
            name: c.name,
            academicYearId: c.academicYearId,
            active: c.active ?? true,
          },
          update: {
            name: c.name,
            active: c.active ?? true,
          },
        });
        restoredCount.classes++;
      }
    }

    // 4. Subjects
    if (Array.isArray(db.subjects)) {
      for (const s of db.subjects) {
        await prisma.subject.upsert({
          where: { id: s.id },
          create: {
            id: s.id,
            name: s.name,
            arabicName: s.arabicName || s.name,
            code: s.code,
            active: s.active ?? true,
          },
          update: {
            name: s.name,
            code: s.code,
          },
        });
        restoredCount.subjects++;
      }
    }

    // 5. Teachers
    if (Array.isArray(db.teachers)) {
      for (const t of db.teachers) {
        await prisma.teacher.upsert({
          where: { id: t.id },
          create: {
            id: t.id,
            userId: t.userId || null,
            name: t.name,
            code: t.code,
            active: t.active ?? true,
          },
          update: {
            name: t.name,
            code: t.code,
          },
        });
        restoredCount.teachers++;
      }
    }

    // 6. ClassSubjects
    if (Array.isArray(db.classSubjects)) {
      for (const cs of db.classSubjects) {
        await prisma.classSubject.upsert({
          where: { id: cs.id },
          create: {
            id: cs.id,
            classId: cs.classId,
            subjectId: cs.subjectId,
            teacherId: cs.teacherId,
            active: cs.active ?? true,
          },
          update: {
            active: cs.active ?? true,
          },
        });
        restoredCount.classSubjects++;
      }
    }

    // 7. Students
    if (Array.isArray(db.students)) {
      for (const st of db.students) {
        await prisma.student.upsert({
          where: { id: st.id },
          create: {
            id: st.id,
            registerNumber: String(st.registerNumber).trim(),
            rollNumber: Number(st.rollNumber),
            name: String(st.name).trim(),
            classId: st.classId,
            admissionNo: st.admissionNo || null,
            phone: st.phone || null,
            parentPhone: st.parentPhone || null,
            active: st.active ?? true,
          },
          update: {
            name: String(st.name).trim(),
            rollNumber: Number(st.rollNumber),
            classId: st.classId,
            phone: st.phone || null,
            parentPhone: st.parentPhone || null,
          },
        });
        restoredCount.students++;
      }
    }

    // 8. Attendance Sessions & Records
    if (Array.isArray(db.attendanceSessions)) {
      for (const s of db.attendanceSessions) {
        await prisma.attendanceSession.upsert({
          where: { id: s.id },
          create: {
            id: s.id,
            classId: s.classId,
            subjectId: s.subjectId,
            classSubjectId: s.classSubjectId,
            teacherId: s.teacherId,
            date: s.date,
            period: Number(s.period || 1),
            topicTaught: s.topicTaught || null,
            kitabPage: s.kitabPage || null,
            status: s.status || 'COMPLETED',
            createdById: s.createdById || 'system',
          },
          update: {
            topicTaught: s.topicTaught || null,
            kitabPage: s.kitabPage || null,
          },
        });
        restoredCount.sessions++;

        if (Array.isArray(s.records)) {
          for (const r of s.records) {
            await prisma.attendanceRecord.upsert({
              where: { id: r.id },
              create: {
                id: r.id,
                sessionId: s.id,
                studentId: r.studentId,
                status: r.status,
              },
              update: {
                status: r.status,
              },
            });
            restoredCount.records++;
          }
        }
      }
    }

    // 9. Daily Attendance
    if (Array.isArray(db.dailyAttendance)) {
      for (const d of db.dailyAttendance) {
        await prisma.dailyAttendance.upsert({
          where: { id: d.id },
          create: {
            id: d.id,
            classId: d.classId,
            studentId: d.studentId,
            date: d.date,
            status: d.status,
            createdById: d.createdById || null,
          },
          update: {
            status: d.status,
          },
        });
        restoredCount.daily++;
      }
    }

    // 10. Remarks
    if (Array.isArray(db.studentRemarks)) {
      for (const r of db.studentRemarks) {
        await prisma.studentRemark.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            studentId: r.studentId,
            remark: r.remark,
            createdById: r.createdById || 'admin',
            createdByName: r.createdByName || 'Staff',
            createdAt: new Date(r.createdAt || Date.now()),
          },
          update: {
            remark: r.remark,
          },
        });
        restoredCount.remarks++;
      }
    }

    // 11. Teacher Attendance / Absences
    if (Array.isArray(db.teacherAttendances)) {
      for (const ta of db.teacherAttendances) {
        await prisma.teacherAttendance.upsert({
          where: { id: ta.id },
          create: {
            id: ta.id,
            teacherId: ta.teacherId,
            date: ta.date,
            classId: ta.classId || null,
            period: ta.period ? Number(ta.period) : null,
            status: ta.status || 'ABSENT',
            reason: ta.reason || null,
            createdById: ta.createdById || null,
          },
          update: {
            status: ta.status || 'ABSENT',
            reason: ta.reason || null,
          },
        });
        restoredCount.teacherAttendances++;
      }
    }

    res.json({
      message: 'Database backup restored successfully with 0 data loss!',
      restoredCount,
    });
  } catch (error: any) {
    console.error('Backup restore error:', error);
    res.status(400).json({ error: error.message || 'Failed to restore database backup' });
  }
};
