import { Response } from 'express';
import XLSX from 'xlsx';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

// Export Monthly Attendance Report to Excel
export const exportMonthlyReportToExcel = async (req: AuthRequest, res: Response) => {
  try {
    const { classId, monthId } = req.query;
    if (!classId || !monthId) {
      return res.status(400).json({ error: 'Class and Month are required' });
    }

    const [cls, month, settings] = await Promise.all([
      prisma.class.findUnique({ where: { id: String(classId) }, include: { academicYear: true } }),
      prisma.academicMonth.findUnique({ where: { id: String(monthId) } }),
      prisma.systemSettings.findFirst(),
    ]);

    if (!cls || !month) {
      return res.status(404).json({ error: 'Class or Month not found' });
    }

    // Fetch dynamic report data using report logic
    const monthMap: Record<string, number> = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
    };
    const monthIdx = monthMap[month.monthName.toLowerCase()] ?? 6;
    const startDate = new Date(Date.UTC(month.year, monthIdx, 1));
    const endDate = new Date(Date.UTC(month.year, monthIdx + 1, 0, 23, 59, 59));
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const students = await prisma.student.findMany({
      where: { classId: cls.id, active: true },
      orderBy: { rollNumber: 'asc' },
    });

    const classSubjects = await prisma.classSubject.findMany({
      where: { classId: cls.id, active: true },
      include: {
        subject: true,
        teacher: true,
        subjectMonthlyConfigs: { where: { monthId: month.id } },
      },
      orderBy: { subject: { name: 'asc' } },
    });

    const subjectSummaries = await Promise.all(
      classSubjects.map(async (cs, index) => {
        const config = cs.subjectMonthlyConfigs[0];
        const available = config ? config.availableClasses : month.workingDays;
        const takenCount = await prisma.attendanceSession.count({
          where: { classSubjectId: cs.id, date: { gte: startStr, lte: endStr } },
        });
        const notTaken = Math.max(0, available - takenCount);
        return {
          slNo: index + 1,
          classSubjectId: cs.id,
          subjectName: cs.subject.name,
          arabicName: cs.subject.arabicName || cs.subject.name,
          teacherName: cs.teacher.name,
          availableClasses: available,
          takenClasses: takenCount,
          notTakenClasses: notTaken,
        };
      })
    );

    const grandTotalTaken = subjectSummaries.reduce((sum, s) => sum + s.takenClasses, 0);

    // Build Worksheet Rows
    const excelRows: any[][] = [];

    // Header Title
    excelRows.push([`${settings?.collegeName || 'Islamic Academic College'} - CLASS ${cls.name} ATTENDANCE REPORT (${month.monthName.toUpperCase()} ${month.year})`]);
    excelRows.push([]);

    // Student Table Headers
    const mainHeaders = ['SL NO', 'R.NO', 'NAME'];
    for (const sub of subjectSummaries) {
      mainHeaders.push(sub.subjectName, '%');
    }
    mainHeaders.push('GRAND TOTAL ATTENDED', 'OVERALL %', 'WORKING DAYS', 'PRESENT DAYS', 'MONTHLY LEAVE', 'DAY WISE %');
    excelRows.push(mainHeaders);

    // Student Data Rows
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      let grandTotalAttended = 0;
      const row: any[] = [i + 1, student.registerNumber, student.name];

      for (const sub of subjectSummaries) {
        const attendedCount = await prisma.attendanceRecord.count({
          where: {
            studentId: student.id,
            status: 'PRESENT',
            session: { classSubjectId: sub.classSubjectId, date: { gte: startStr, lte: endStr } },
          },
        });
        grandTotalAttended += attendedCount;
        const pct = sub.takenClasses > 0 ? `${((attendedCount / sub.takenClasses) * 100).toFixed(2)}%` : '0%';
        row.push(attendedCount, pct);
      }

      const overallPct = grandTotalTaken > 0 ? `${((grandTotalAttended / grandTotalTaken) * 100).toFixed(2)}%` : '0%';
      const presentDays = await prisma.dailyAttendance.count({
        where: { studentId: student.id, classId: cls.id, status: 'PRESENT', date: { gte: startStr, lte: endStr } },
      });
      const leave = Math.max(0, month.workingDays - presentDays);
      const dayWisePct = month.workingDays > 0 ? `${((presentDays / month.workingDays) * 100).toFixed(2)}%` : '0%';

      row.push(grandTotalAttended, overallPct, month.workingDays, presentDays, leave, dayWisePct);
      excelRows.push(row);
    }

    excelRows.push([]);
    excelRows.push(['SUBJECT SUMMARY TABLE']);
    excelRows.push(['SL NO', 'SUBJECT NAME', 'USTHAD / TEACHER', 'AVAILABLE CLASS', 'TAKEN CLASS', "N'T TAKEN"]);

    for (const sub of subjectSummaries) {
      excelRows.push([
        sub.slNo,
        sub.subjectName,
        sub.teacherName,
        sub.availableClasses,
        sub.takenClasses,
        sub.notTakenClasses,
      ]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${cls.name}_${month.monthName}`);

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Attendance_Report_${cls.name}_${month.monthName}_${month.year}.xlsx"`);
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to export Excel report' });
  }
};

// Import Data from Excel File
export const importExcelData = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an Excel file (.xlsx / .csv)' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<any>(sheet);

    if (!jsonData || jsonData.length === 0) {
      return res.status(400).json({ error: 'Uploaded file contains no valid data rows' });
    }

    const importedStudents: any[] = [];
    const errors: string[] = [];
    let successCount = 0;

    for (let index = 0; index < jsonData.length; index++) {
      const row = jsonData[index];
      const registerNumber = String(row['Register Number'] || row['R.NO'] || row['RegNo'] || row['RegisterNo'] || '').trim();
      const name = String(row['Name'] || row['Student Name'] || row['NAME'] || '').trim();
      const className = String(row['Class'] || row['CLASS'] || '').trim();
      const rollNumber = Number(row['Roll Number'] || row['RollNo'] || row['SL NO'] || index + 1);

      if (!registerNumber || !name || !className) {
        errors.push(`Row ${index + 2}: Missing required fields (Register Number, Name, or Class)`);
        continue;
      }

      // Check or create class
      let cls = await prisma.class.findFirst({ where: { name: className } });
      if (!cls) {
        let currentYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
        if (!currentYear) {
          currentYear = await prisma.academicYear.create({
            data: { name: '2026-2027', startDate: new Date('2026-06-01'), endDate: new Date('2027-04-30'), isCurrent: true },
          });
        }
        cls = await prisma.class.create({
          data: { name: className, academicYearId: currentYear.id, active: true },
        });
      }

      // Upsert student
      try {
        const student = await prisma.student.upsert({
          where: { registerNumber },
          update: { name, rollNumber, classId: cls.id },
          create: { registerNumber, rollNumber, name, classId: cls.id, active: true },
        });
        importedStudents.push(student);
        successCount++;
      } catch (err: any) {
        errors.push(`Row ${index + 2}: Error importing student ${registerNumber}: ${err.message}`);
      }
    }

    res.json({
      message: `Import completed. ${successCount} students processed successfully.`,
      successCount,
      errorsCount: errors.length,
      errors,
      importedStudents,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to process Excel import' });
  }
};
