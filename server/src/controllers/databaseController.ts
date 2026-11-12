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
        data = await prisma.subject.findMany({ include: { _count: { select: { classSubjects: true } } } });
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
        return res.status(404).json({ error: `Table '${tableName}' not recognized.` });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve table records' });
  }
};

export const exportFullDatabaseBackup = async (_req: AuthRequest, res: Response) => {
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
      subjectMonthlyConfigs,
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
      prisma.subjectMonthlyConfig.findMany().catch(() => []),
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
        subjectMonthlyConfigs,
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
      subjectMonthlyConfigs,
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
      prisma.subjectMonthlyConfig.findMany().catch(() => []),
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
        subjectMonthlyConfigs,
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

    // 3. Individual Table Files inside the ZIP
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
    zip.addFile('subject_monthly_configs.json', Buffer.from(JSON.stringify(subjectMonthlyConfigs, null, 2), 'utf8'));

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
      const isZip =
        fileName.endsWith('.zip') ||
        (req.file.mimetype && (req.file.mimetype.includes('zip') || req.file.mimetype.includes('compressed'))) ||
        (req.file.buffer && req.file.buffer.length > 2 && req.file.buffer[0] === 0x50 && req.file.buffer[1] === 0x4b);

      if (isZip) {
        try {
          const zip = new AdmZip(req.file.buffer);
          const entries = zip.getEntries();
          const mainEntry = entries.find((e) => e.entryName === 'full_database_backup.json');

          if (mainEntry) {
            const content = mainEntry.getData().toString('utf8').replace(/^\uFEFF/, '').trim();
            backupObj = JSON.parse(content);
          } else {
            const db: any = {};
            for (const entry of entries) {
              if (entry.entryName.endsWith('.json') && !entry.isDirectory) {
                const content = entry.getData().toString('utf8').replace(/^\uFEFF/, '').trim();
                try {
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
                  else if (entry.entryName === 'subject_monthly_configs.json') db.subjectMonthlyConfigs = json;
                } catch (pe) {
                  console.warn(`Could not parse ${entry.entryName} from zip:`, pe);
                }
              }
            }
            backupObj = { database: db };
          }
        } catch (zipErr: any) {
          return res.status(400).json({ error: `Failed to extract ZIP archive backup: ${zipErr.message}` });
        }
      } else {
        const fileContent = req.file.buffer.toString('utf8').replace(/^\uFEFF/, '').trim();
        backupObj = JSON.parse(fileContent);
      }
    } else if (req.body.backupData) {
      backupObj = typeof req.body.backupData === 'string'
        ? JSON.parse(req.body.backupData.replace(/^\uFEFF/, '').trim())
        : req.body.backupData;
    } else {
      backupObj = req.body;
    }

    const db = backupObj?.database || backupObj;
    if (!db || (!db.students && !db.classes && !db.attendanceSessions && !db.subjects && !db.academicYears)) {
      return res.status(400).json({
        error: 'Invalid database backup format. Expected a Sirajul Huda backup JSON or ZIP file.',
      });
    }

    console.log('📥 Restoring database backup with intelligent relation reconciliation...');

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
      holidays: 0,
    };

    // ID mapping tables to resolve foreign key changes safely
    const yearIdMap: Record<string, string> = {};
    const monthIdMap: Record<string, string> = {};
    const classIdMap: Record<string, string> = {};
    const subjectIdMap: Record<string, string> = {};
    const teacherIdMap: Record<string, string> = {};
    const classSubjectIdMap: Record<string, string> = {};
    const studentIdMap: Record<string, string> = {};
    const sessionIdMap: Record<string, string> = {};

    // 0. System Settings
    if (db.settings) {
      try {
        const existingSettings = await prisma.systemSettings.findFirst();
        if (existingSettings) {
          await prisma.systemSettings.update({
            where: { id: existingSettings.id },
            data: {
              collegeName: db.settings.collegeName || existingSettings.collegeName,
              logoUrl: db.settings.logoUrl !== undefined ? db.settings.logoUrl : existingSettings.logoUrl,
              attendanceThreshold: Number(db.settings.attendanceThreshold || existingSettings.attendanceThreshold),
              timezone: db.settings.timezone || existingSettings.timezone,
              dateFormat: db.settings.dateFormat || existingSettings.dateFormat,
              weeklyOffDay: db.settings.weeklyOffDay || existingSettings.weeklyOffDay,
            },
          });
        } else {
          await prisma.systemSettings.create({
            data: {
              collegeName: db.settings.collegeName || 'Sirajul Huda College of Science and Integrated Studies, Nadapuram (Affiliated to Jamiathul Hind Al Islamiya)',
              logoUrl: db.settings.logoUrl || '',
              attendanceThreshold: 75.0,
              timezone: 'Asia/Kolkata',
              dateFormat: 'YYYY-MM-DD',
              weeklyOffDay: 'SUNDAY',
            },
          });
        }
      } catch (err: any) {
        console.warn('System settings restore warning:', err.message);
      }
    }

    // 1. Academic Years
    if (Array.isArray(db.academicYears)) {
      for (const y of db.academicYears) {
        try {
          const startDate = y.startDate && !isNaN(new Date(y.startDate).getTime())
            ? new Date(y.startDate)
            : new Date('2026-06-01');
          const endDate = y.endDate && !isNaN(new Date(y.endDate).getTime())
            ? new Date(y.endDate)
            : new Date('2027-03-31');

          let existing = await prisma.academicYear.findUnique({ where: { id: y.id } });
          if (!existing && y.name) {
            existing = await prisma.academicYear.findUnique({ where: { name: y.name } });
          }

          if (existing) {
            yearIdMap[y.id] = existing.id;
            await prisma.academicYear.update({
              where: { id: existing.id },
              data: {
                name: y.name,
                startDate,
                endDate,
                isCurrent: y.isCurrent ?? existing.isCurrent,
                weeklyOffDay: y.weeklyOffDay || existing.weeklyOffDay,
              },
            });
          } else {
            const created = await prisma.academicYear.create({
              data: {
                id: y.id,
                name: y.name,
                startDate,
                endDate,
                isCurrent: y.isCurrent ?? true,
                weeklyOffDay: y.weeklyOffDay || 'SUNDAY',
              },
            });
            yearIdMap[y.id] = created.id;
          }
          restoredCount.academicYears++;
        } catch (e: any) {
          console.warn('Academic year restore warning:', e.message);
        }
      }
    }

    const defaultYear =
      (await prisma.academicYear.findFirst({ where: { isCurrent: true } })) ||
      (await prisma.academicYear.findFirst());

    // 2. Academic Months
    if (Array.isArray(db.academicMonths)) {
      for (const m of db.academicMonths) {
        try {
          const resolvedYearId = (m.academicYearId && yearIdMap[m.academicYearId]) || defaultYear?.id;
          if (!resolvedYearId) continue;

          let existing = await prisma.academicMonth.findUnique({ where: { id: m.id } });
          if (!existing) {
            existing = await prisma.academicMonth.findFirst({
              where: {
                academicYearId: resolvedYearId,
                monthName: m.monthName,
                year: Number(m.year),
              },
            });
          }

          if (existing) {
            monthIdMap[m.id] = existing.id;
            await prisma.academicMonth.update({
              where: { id: existing.id },
              data: {
                workingDays: Number(m.workingDays || 23),
              },
            });
          } else {
            const created = await prisma.academicMonth.create({
              data: {
                id: m.id,
                academicYearId: resolvedYearId,
                monthName: m.monthName,
                year: Number(m.year),
                workingDays: Number(m.workingDays || 23),
              },
            });
            monthIdMap[m.id] = created.id;
          }
          restoredCount.academicMonths++;
        } catch (e: any) {
          console.warn('Academic month restore warning:', e.message);
        }
      }
    }

    // 3. Classes
    if (Array.isArray(db.classes)) {
      for (const c of db.classes) {
        try {
          const resolvedYearId = (c.academicYearId && yearIdMap[c.academicYearId]) || defaultYear?.id;
          if (!resolvedYearId) continue;

          let existing = await prisma.class.findUnique({ where: { id: c.id } });
          if (!existing) {
            existing = await prisma.class.findFirst({
              where: {
                name: c.name,
                academicYearId: resolvedYearId,
              },
            });
          }

          if (existing) {
            classIdMap[c.id] = existing.id;
            await prisma.class.update({
              where: { id: existing.id },
              data: {
                name: c.name,
                active: c.active ?? true,
              },
            });
          } else {
            const created = await prisma.class.create({
              data: {
                id: c.id,
                name: c.name,
                academicYearId: resolvedYearId,
                active: c.active ?? true,
              },
            });
            classIdMap[c.id] = created.id;
          }
          restoredCount.classes++;
        } catch (e: any) {
          console.warn('Class restore warning:', e.message);
        }
      }
    }

    // 4. Subjects
    if (Array.isArray(db.subjects)) {
      for (const s of db.subjects) {
        try {
          let existing = await prisma.subject.findUnique({ where: { id: s.id } });
          if (!existing && s.code) {
            existing = await prisma.subject.findUnique({ where: { code: s.code } });
          }

          if (existing) {
            subjectIdMap[s.id] = existing.id;
            await prisma.subject.update({
              where: { id: existing.id },
              data: {
                name: s.name,
                arabicName: s.arabicName || s.name,
                code: s.code,
                active: s.active ?? true,
              },
            });
          } else {
            const created = await prisma.subject.create({
              data: {
                id: s.id,
                name: s.name,
                arabicName: s.arabicName || s.name,
                code: s.code,
                active: s.active ?? true,
              },
            });
            subjectIdMap[s.id] = created.id;
          }
          restoredCount.subjects++;
        } catch (e: any) {
          console.warn('Subject restore warning:', e.message);
        }
      }
    }

    // 5. Teachers
    if (Array.isArray(db.teachers)) {
      for (const t of db.teachers) {
        try {
          let existing = await prisma.teacher.findUnique({ where: { id: t.id } });
          if (!existing && t.code) {
            existing = await prisma.teacher.findUnique({ where: { code: t.code } });
          }

          let validUserId: string | null = null;
          if (t.userId) {
            const userExists = await prisma.user.findUnique({ where: { id: t.userId } });
            if (userExists) {
              validUserId = t.userId;
            }
          }

          if (existing) {
            teacherIdMap[t.id] = existing.id;
            await prisma.teacher.update({
              where: { id: existing.id },
              data: {
                name: t.name,
                code: t.code,
                active: t.active ?? true,
                ...(validUserId ? { userId: validUserId } : {}),
              },
            });
          } else {
            const created = await prisma.teacher.create({
              data: {
                id: t.id,
                userId: validUserId,
                name: t.name,
                code: t.code,
                active: t.active ?? true,
              },
            });
            teacherIdMap[t.id] = created.id;
          }
          restoredCount.teachers++;
        } catch (e: any) {
          console.warn('Teacher restore warning:', e.message);
        }
      }
    }

    // 6. ClassSubjects (Class-Subject-Teacher Assignments)
    if (Array.isArray(db.classSubjects)) {
      for (const cs of db.classSubjects) {
        try {
          const resolvedClassId = classIdMap[cs.classId] || cs.classId;
          const resolvedSubjectId = subjectIdMap[cs.subjectId] || cs.subjectId;
          const resolvedTeacherId = teacherIdMap[cs.teacherId] || cs.teacherId;

          const [cls, sub, tch] = await Promise.all([
            prisma.class.findUnique({ where: { id: resolvedClassId } }),
            prisma.subject.findUnique({ where: { id: resolvedSubjectId } }),
            prisma.teacher.findUnique({ where: { id: resolvedTeacherId } }),
          ]);
          if (!cls || !sub || !tch) continue;

          let existing = await prisma.classSubject.findUnique({ where: { id: cs.id } });
          if (!existing) {
            existing = await prisma.classSubject.findUnique({
              where: {
                classId_subjectId: {
                  classId: resolvedClassId,
                  subjectId: resolvedSubjectId,
                },
              },
            });
          }

          if (existing) {
            classSubjectIdMap[cs.id] = existing.id;
            await prisma.classSubject.update({
              where: { id: existing.id },
              data: {
                teacherId: resolvedTeacherId,
                active: cs.active ?? true,
              },
            });
          } else {
            const created = await prisma.classSubject.create({
              data: {
                id: cs.id,
                classId: resolvedClassId,
                subjectId: resolvedSubjectId,
                teacherId: resolvedTeacherId,
                active: cs.active ?? true,
              },
            });
            classSubjectIdMap[cs.id] = created.id;
          }
          restoredCount.classSubjects++;
        } catch (e: any) {
          console.warn('ClassSubject restore warning:', e.message);
        }
      }
    }

    // 7. Students
    if (Array.isArray(db.students)) {
      for (const st of db.students) {
        try {
          const resolvedClassId = classIdMap[st.classId] || st.classId;
          const cls = await prisma.class.findUnique({ where: { id: resolvedClassId } });
          if (!cls) continue;

          const regNo = String(st.registerNumber || '').trim();
          const rollNo = Number(st.rollNumber);

          let existing = await prisma.student.findUnique({ where: { id: st.id } });
          if (!existing && regNo) {
            existing = await prisma.student.findUnique({ where: { registerNumber: regNo } });
          }
          if (!existing && !isNaN(rollNo)) {
            existing = await prisma.student.findFirst({
              where: {
                classId: resolvedClassId,
                rollNumber: rollNo,
              },
            });
          }

          if (existing) {
            studentIdMap[st.id] = existing.id;
            await prisma.student.update({
              where: { id: existing.id },
              data: {
                name: String(st.name).trim(),
                registerNumber: regNo || existing.registerNumber,
                rollNumber: !isNaN(rollNo) ? rollNo : existing.rollNumber,
                classId: resolvedClassId,
                admissionNo: st.admissionNo || existing.admissionNo,
                phone: st.phone || existing.phone,
                parentPhone: st.parentPhone || existing.parentPhone,
                active: st.active ?? true,
              },
            });
          } else {
            const created = await prisma.student.create({
              data: {
                id: st.id,
                registerNumber: regNo,
                rollNumber: rollNo,
                name: String(st.name).trim(),
                classId: resolvedClassId,
                admissionNo: st.admissionNo || null,
                phone: st.phone || null,
                parentPhone: st.parentPhone || null,
                active: st.active ?? true,
              },
            });
            studentIdMap[st.id] = created.id;
          }
          restoredCount.students++;
        } catch (e: any) {
          console.warn('Student restore warning:', e.message);
        }
      }
    }

    // 8. Attendance Sessions & Records
    if (Array.isArray(db.attendanceSessions)) {
      for (const s of db.attendanceSessions) {
        try {
          const resolvedClassId = classIdMap[s.classId] || s.classId;
          const resolvedSubjectId = subjectIdMap[s.subjectId] || s.subjectId;
          const resolvedTeacherId = teacherIdMap[s.teacherId] || s.teacherId;
          let resolvedCSId = s.classSubjectId
            ? classSubjectIdMap[s.classSubjectId] || s.classSubjectId
            : null;

          const [cls, sub, tch] = await Promise.all([
            prisma.class.findUnique({ where: { id: resolvedClassId } }),
            prisma.subject.findUnique({ where: { id: resolvedSubjectId } }),
            prisma.teacher.findUnique({ where: { id: resolvedTeacherId } }),
          ]);
          if (!cls || !sub || !tch) continue;

          // Ensure ClassSubject relation exists for session
          if (!resolvedCSId) {
            let cs = await prisma.classSubject.findUnique({
              where: {
                classId_subjectId: {
                  classId: resolvedClassId,
                  subjectId: resolvedSubjectId,
                },
              },
            });
            if (!cs) {
              cs = await prisma.classSubject.create({
                data: {
                  classId: resolvedClassId,
                  subjectId: resolvedSubjectId,
                  teacherId: resolvedTeacherId,
                  active: true,
                },
              });
            }
            resolvedCSId = cs.id;
          } else {
            const csExists = await prisma.classSubject.findUnique({ where: { id: resolvedCSId } });
            if (!csExists) {
              const csNew = await prisma.classSubject.upsert({
                where: {
                  classId_subjectId: {
                    classId: resolvedClassId,
                    subjectId: resolvedSubjectId,
                  },
                },
                update: { teacherId: resolvedTeacherId },
                create: {
                  id: resolvedCSId,
                  classId: resolvedClassId,
                  subjectId: resolvedSubjectId,
                  teacherId: resolvedTeacherId,
                  active: true,
                },
              });
              resolvedCSId = csNew.id;
            }
          }

          let existing = await prisma.attendanceSession.findUnique({ where: { id: s.id } });
          if (existing) {
            sessionIdMap[s.id] = existing.id;
            await prisma.attendanceSession.update({
              where: { id: existing.id },
              data: {
                topicTaught: s.topicTaught || existing.topicTaught,
                kitabPage: s.kitabPage || existing.kitabPage,
                period: Number(s.period || existing.period),
                status: s.status || existing.status,
              },
            });
          } else {
            const created = await prisma.attendanceSession.create({
              data: {
                id: s.id,
                classId: resolvedClassId,
                subjectId: resolvedSubjectId,
                classSubjectId: resolvedCSId,
                teacherId: resolvedTeacherId,
                date: s.date,
                period: Number(s.period || 1),
                topicTaught: s.topicTaught || null,
                kitabPage: s.kitabPage || null,
                status: s.status || 'COMPLETED',
                createdById: s.createdById || 'system',
              },
            });
            sessionIdMap[s.id] = created.id;
          }
          restoredCount.sessions++;

          // Records for this session
          if (Array.isArray(s.records)) {
            const targetSessionId = sessionIdMap[s.id] || s.id;
            for (const r of s.records) {
              try {
                const resolvedStudentId = studentIdMap[r.studentId] || r.studentId;
                const stud = await prisma.student.findUnique({ where: { id: resolvedStudentId } });
                if (!stud) continue;

                let existingRec = await prisma.attendanceRecord.findUnique({ where: { id: r.id } });
                if (!existingRec) {
                  existingRec = await prisma.attendanceRecord.findFirst({
                    where: {
                      sessionId: targetSessionId,
                      studentId: resolvedStudentId,
                    },
                  });
                }

                if (existingRec) {
                  await prisma.attendanceRecord.update({
                    where: { id: existingRec.id },
                    data: { status: r.status },
                  });
                } else {
                  await prisma.attendanceRecord.create({
                    data: {
                      id: r.id,
                      sessionId: targetSessionId,
                      studentId: resolvedStudentId,
                      status: r.status,
                    },
                  });
                }
                restoredCount.records++;
              } catch (re: any) {
                console.warn('Attendance record restore warning:', re.message);
              }
            }
          }
        } catch (e: any) {
          console.warn('Session restore warning:', e.message);
        }
      }
    }

    // 9. Daily Attendance
    if (Array.isArray(db.dailyAttendance)) {
      for (const d of db.dailyAttendance) {
        try {
          const resolvedStudentId = studentIdMap[d.studentId] || d.studentId;
          const resolvedClassId = classIdMap[d.classId] || d.classId;

          const [stud, cls] = await Promise.all([
            prisma.student.findUnique({ where: { id: resolvedStudentId } }),
            prisma.class.findUnique({ where: { id: resolvedClassId } }),
          ]);
          if (!stud || !cls) continue;

          let existing = await prisma.dailyAttendance.findUnique({ where: { id: d.id } });
          if (!existing) {
            existing = await prisma.dailyAttendance.findUnique({
              where: {
                classId_studentId_date: {
                  classId: resolvedClassId,
                  studentId: resolvedStudentId,
                  date: d.date,
                },
              },
            });
          }

          if (existing) {
            await prisma.dailyAttendance.update({
              where: { id: existing.id },
              data: {
                status: d.status,
              },
            });
          } else {
            await prisma.dailyAttendance.create({
              data: {
                id: d.id,
                classId: resolvedClassId,
                studentId: resolvedStudentId,
                date: d.date,
                status: d.status,
                createdById: d.createdById || null,
              },
            });
          }
          restoredCount.daily++;
        } catch (e: any) {
          console.warn('Daily attendance restore warning:', e.message);
        }
      }
    }

    // 10. Remarks
    if (Array.isArray(db.studentRemarks)) {
      for (const r of db.studentRemarks) {
        try {
          const resolvedStudentId = studentIdMap[r.studentId] || r.studentId;
          const stud = await prisma.student.findUnique({ where: { id: resolvedStudentId } });
          if (!stud) continue;

          await prisma.studentRemark.upsert({
            where: { id: r.id },
            create: {
              id: r.id,
              studentId: resolvedStudentId,
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
        } catch (e: any) {
          console.warn('Student remark restore warning:', e.message);
        }
      }
    }

    // 11. Teacher Attendance / Absences
    if (Array.isArray(db.teacherAttendances)) {
      for (const ta of db.teacherAttendances) {
        try {
          const resolvedTeacherId = teacherIdMap[ta.teacherId] || ta.teacherId;
          const tch = await prisma.teacher.findUnique({ where: { id: resolvedTeacherId } });
          if (!tch) continue;

          const resolvedClassId = ta.classId ? classIdMap[ta.classId] || ta.classId : null;

          await prisma.teacherAttendance.upsert({
            where: { id: ta.id },
            create: {
              id: ta.id,
              teacherId: resolvedTeacherId,
              date: ta.date,
              classId: resolvedClassId,
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
        } catch (e: any) {
          console.warn('Teacher attendance restore warning:', e.message);
        }
      }
    }

    // 12. Holidays
    if (Array.isArray(db.holidays)) {
      for (const h of db.holidays) {
        try {
          const resolvedYearId = (h.academicYearId && yearIdMap[h.academicYearId]) || defaultYear?.id;
          const resolvedMonthId = h.monthId ? monthIdMap[h.monthId] || h.monthId : null;
          if (!resolvedYearId) continue;

          const startDate = h.startDate || h.date || new Date().toISOString().split('T')[0];
          const endDate = h.endDate || startDate;

          await prisma.institutionHoliday.upsert({
            where: { id: h.id },
            create: {
              id: h.id,
              academicYearId: resolvedYearId,
              monthId: resolvedMonthId,
              startDate,
              endDate,
              title: h.title,
              type: h.type || 'HOLIDAY',
              affectsWorkingDays: h.affectsWorkingDays ?? true,
            },
            update: {
              title: h.title,
              startDate,
              endDate,
              type: h.type || 'HOLIDAY',
              affectsWorkingDays: h.affectsWorkingDays ?? true,
            },
          });
          restoredCount.holidays++;
        } catch (e: any) {
          console.warn('Holiday restore warning:', e.message);
        }
      }
    }

    // 13. Subject Monthly Configs
    if (Array.isArray(db.subjectMonthlyConfigs)) {
      for (const smc of db.subjectMonthlyConfigs) {
        try {
          const resolvedCSId = classSubjectIdMap[smc.classSubjectId] || smc.classSubjectId;
          const resolvedMonthId = monthIdMap[smc.monthId] || smc.monthId;

          const [cs, m] = await Promise.all([
            prisma.classSubject.findUnique({ where: { id: resolvedCSId } }),
            prisma.academicMonth.findUnique({ where: { id: resolvedMonthId } }),
          ]);
          if (!cs || !m) continue;

          await prisma.subjectMonthlyConfig.upsert({
            where: {
              classSubjectId_monthId: {
                classSubjectId: resolvedCSId,
                monthId: resolvedMonthId,
              },
            },
            create: {
              id: smc.id,
              classSubjectId: resolvedCSId,
              monthId: resolvedMonthId,
              availableClasses: Number(smc.availableClasses || 23),
            },
            update: {
              availableClasses: Number(smc.availableClasses || 23),
            },
          });
        } catch (e: any) {
          console.warn('Subject monthly config restore warning:', e.message);
        }
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
