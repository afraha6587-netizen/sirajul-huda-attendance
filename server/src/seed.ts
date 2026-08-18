import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function ensureAdminSeeded() {
  const userCount = await prisma.user.count();
  if (userCount > 0) return;

  console.log('🧹 Initializing clean production database for Sirajul Huda College...');

  // Delete all existing data if any
  await prisma.auditLog.deleteMany();
  await prisma.dailyAttendance.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.subjectMonthlyConfig.deleteMany();
  await prisma.classSubject.deleteMany();
  await prisma.student.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.class.deleteMany();
  await prisma.institutionHoliday.deleteMany();
  await prisma.academicMonth.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSettings.deleteMany();

  // 1. Create Initial System Settings with official college branding
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

  // 2. Create Current Academic Year (2026-2027)
  const currentYear = await prisma.academicYear.create({
    data: {
      name: '2026-2027',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2027-04-30'),
      isCurrent: true,
      weeklyOffDay: 'SUNDAY',
    },
  });

  // 3. Create 12 Academic Months for 2026-2027
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

  // 4. Create Standard College Classes (D-3, D-1, HS-1, HS-2)
  const classNames = ['D-3', 'D-1', 'HS-1', 'HS-2'];
  for (const className of classNames) {
    await prisma.class.create({
      data: {
        name: className,
        academicYearId: currentYear.id,
        active: true,
      },
    });
  }

  // 5. Create Initial Super Admin Account
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);

  await prisma.user.create({
    data: {
      email: 'admin@college.edu',
      name: 'Super Administrator',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  console.log('✨ Clean database initialized with standard classes (D-3, D-1, HS-1, HS-2)!');
  console.log('🔑 Super Admin Email: admin@college.edu');
  console.log('🔑 Password: Admin@123456');
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
