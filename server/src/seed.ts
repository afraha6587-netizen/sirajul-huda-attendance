import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function cleanResetDatabase() {
  console.log('🧹 Performing complete data wipe for Sirajul Huda College...');

  // Delete all attendance data, logs, and student roster for a clean website slate
  await prisma.auditLog.deleteMany();
  await prisma.dailyAttendance.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.student.deleteMany();

  // Ensure base structure exists
  await ensureAdminSeeded();

  console.log('✨ Database cleanly reset with 0 attendance logs and 0 students!');
}

export async function ensureAdminSeeded() {
  console.log('🧹 Checking production database seeding for Sirajul Huda College...');

  // 1. Create Initial System Settings with official college branding
  const existingSettings = await prisma.systemSettings.findFirst();
  if (!existingSettings) {
    await prisma.systemSettings.create({
      data: {
        id: '1',
        collegeName: 'Sirajul Huda College of Science and Integrated Studies, Nadapuram (Affiliated to Jamiathul Hind Al Islamiya)',
        logoUrl: '',
        attendanceThreshold: 75.0,
        timezone: 'Asia/Kolkata',
        dateFormat: 'YYYY-MM-DD',
        weeklyOffDay: 'SUNDAY',
      },
    });
  }

  // 2. Create Current Academic Year (2026-2027) if missing
  let currentYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
  if (!currentYear) {
    currentYear = await prisma.academicYear.create({
      data: {
        name: '2026-2027',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-04-30'),
        isCurrent: true,
        weeklyOffDay: 'SUNDAY',
      },
    });
  }

  // 3. Create 12 Academic Months for 2026-2027 if missing
  const monthCount = await prisma.academicMonth.count({ where: { academicYearId: currentYear.id } });
  if (monthCount === 0) {
    const monthsData = [
      { monthName: 'June', year: 2026, workingDays: 23 },
      { monthName: 'July', year: 2026, workingDays: 23 },
      { monthName: 'August', year: 2026, workingDays: 23 },
      { monthName: 'September', year: 2026, workingDays: 23 },
      { monthName: 'October', year: 2026, workingDays: 23 },
      { monthName: 'November', year: 2026, workingDays: 23 },
      { monthName: 'December', year: 2026, workingDays: 23 },
      { monthName: 'January', year: 2027, workingDays: 23 },
      { monthName: 'February', year: 2027, workingDays: 23 },
      { monthName: 'March', year: 2027, workingDays: 23 },
      { monthName: 'April', year: 2027, workingDays: 23 },
      { monthName: 'May', year: 2027, workingDays: 23 },
    ];

    for (const m of monthsData) {
      await prisma.academicMonth.create({
        data: {
          academicYearId: currentYear.id,
          monthName: m.monthName,
          year: m.year,
          workingDays: m.workingDays,
        },
      });
    }
  }

  // 4. Create Standard College Classes (D-3, D-1, HS-1, HS-2) if missing
  const classNames = ['D-3', 'D-1', 'HS-1', 'HS-2'];
  const createdClasses: any[] = [];
  for (const className of classNames) {
    let cls = await prisma.class.findFirst({ where: { name: className } });
    if (!cls) {
      cls = await prisma.class.create({
        data: {
          name: className,
          academicYearId: currentYear.id,
          active: true,
        },
      });
    }
    createdClasses.push(cls);
  }

  // 5. Create Standard College Subjects if missing
  const subjectsData = [
    { name: 'Tafsir Al Jalalayn', arabicName: 'تفسير الجلالين', code: 'SUB-TAFSIR' },
    { name: 'Fath Al Mubeen', arabicName: 'فتح المعين', code: 'SUB-FIQH' },
    { name: 'Arabic Grammar', arabicName: 'النحو والصرف', code: 'SUB-ARABIC' },
    { name: 'English Literature', arabicName: 'اللغة الإنجليزية', code: 'SUB-ENG' },
  ];

  const createdSubjects: any[] = [];
  for (const subData of subjectsData) {
    let sub = await prisma.subject.findFirst({ where: { code: subData.code } });
    if (!sub) {
      sub = await prisma.subject.create({ data: subData });
    }
    createdSubjects.push(sub);
  }

  // 6. Create Standard Teachers / Usthads if missing
  const teachersData = [
    { name: 'Usthad Ahmad Al-Huda', code: 'TCH-001' },
    { name: 'Usthad Muhammed Faizal', code: 'TCH-002' },
    { name: 'Usthad Ibrahim Khalil', code: 'TCH-003' },
  ];

  const createdTeachers: any[] = [];
  for (const tData of teachersData) {
    let teacher = await prisma.teacher.findFirst({ where: { code: tData.code } });
    if (!teacher) {
      teacher = await prisma.teacher.create({ data: tData });
    }
    createdTeachers.push(teacher);
  }

  // 7. Create Class-Subject-Teacher Assignments if missing
  const assignmentCount = await prisma.classSubject.count();
  if (assignmentCount === 0 && createdClasses.length > 0 && createdSubjects.length > 0 && createdTeachers.length > 0) {
    for (const cls of createdClasses) {
      await prisma.classSubject.create({
        data: {
          classId: cls.id,
          subjectId: createdSubjects[0].id,
          teacherId: createdTeachers[0].id,
          active: true,
        },
      });

      await prisma.classSubject.create({
        data: {
          classId: cls.id,
          subjectId: createdSubjects[1].id,
          teacherId: createdTeachers[1].id,
          active: true,
        },
      });

      await prisma.classSubject.create({
        data: {
          classId: cls.id,
          subjectId: createdSubjects[2].id,
          teacherId: createdTeachers[2].id,
          active: true,
        },
      });
    }
  }

  // 8. Create Initial Super Admin Account if missing
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@college.edu' } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: 'admin@college.edu',
        name: 'Super Administrator',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
      },
    });
  }

  console.log('✨ System database verified cleanly without removing existing student or attendance records!');
}

if (require.main === module) {
  ensureAdminSeeded()
    .catch((e) => {
      console.error('❌ Seeding error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
