import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function removePreseededTeachersAndSubjects() {
  console.log('🧹 Removing pre-seeded teachers and subjects...');

  // Delete all class-subject assignments, subjects, and teachers so admin adds them cleanly
  await prisma.classSubject.deleteMany();
  await prisma.subjectMonthlyConfig.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.teacher.deleteMany();

  console.log('✨ All sample teachers and subjects removed! Admin can add teachers and subjects cleanly.');
}

export async function cleanResetDatabase() {
  console.log('🧹 Performing complete data wipe for Sirajul Huda College...');

  // Delete all attendance data, logs, student roster, subjects, and teachers
  await prisma.auditLog.deleteMany();
  await prisma.dailyAttendance.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.student.deleteMany();
  await prisma.classSubject.deleteMany();
  await prisma.subjectMonthlyConfig.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.teacher.deleteMany();

  // Ensure base structure exists (Classes & Super Admin only)
  await ensureAdminSeeded();

  console.log('✨ Database cleanly reset with 0 attendance logs, 0 students, 0 subjects, and 0 teachers!');
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
  for (const className of classNames) {
    let cls = await prisma.class.findFirst({ where: { name: className } });
    if (!cls) {
      await prisma.class.create({
        data: {
          name: className,
          academicYearId: currentYear.id,
          active: true,
        },
      });
    }
  }

  // 5. Create Initial Super Admin Account if missing
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

  console.log('✨ System database verified cleanly with 0 pre-seeded sample teachers or subjects!');
}

if (require.main === module) {
  ensureAdminSeeded()
    .then(async () => {
      await removePreseededTeachersAndSubjects();
    })
    .catch((e) => {
      console.error('❌ Seeding error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
