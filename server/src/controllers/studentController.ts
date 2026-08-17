import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getStudents = async (req: Request, res: Response) => {
  try {
    const { classId, search } = req.query;
    const where: any = { active: true };

    if (classId) where.classId = String(classId);
    if (search) {
      where.OR = [
        { name: { contains: String(search) } },
        { registerNumber: { contains: String(search) } },
        { admissionNo: { contains: String(search) } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      include: { class: true },
      orderBy: [{ classId: 'asc' }, { rollNumber: 'asc' }],
    });

    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

export const getStudentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: { class: true },
    });

    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student' });
  }
};

export const createStudent = async (req: Request, res: Response) => {
  try {
    const { registerNumber, rollNumber, name, classId, admissionNo, phone, parentPhone } = req.body;

    if (!registerNumber || !rollNumber || !name || !classId) {
      return res.status(400).json({ error: 'Register Number, Roll Number, Name, and Class are required' });
    }

    const student = await prisma.student.create({
      data: {
        registerNumber: String(registerNumber).trim(),
        rollNumber: Number(rollNumber),
        name: String(name).trim(),
        classId,
        admissionNo: admissionNo ? String(admissionNo).trim() : null,
        phone: phone ? String(phone).trim() : null,
        parentPhone: parentPhone ? String(parentPhone).trim() : null,
      },
      include: { class: true },
    });

    res.status(201).json(student);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A student with this Register Number already exists' });
    }
    res.status(400).json({ error: error.message || 'Failed to create student' });
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { registerNumber, rollNumber, name, classId, admissionNo, phone, parentPhone, active } = req.body;

    const student = await prisma.student.update({
      where: { id },
      data: {
        registerNumber: registerNumber ? String(registerNumber).trim() : undefined,
        rollNumber: rollNumber !== undefined ? Number(rollNumber) : undefined,
        name: name ? String(name).trim() : undefined,
        classId: classId || undefined,
        admissionNo: admissionNo !== undefined ? (admissionNo ? String(admissionNo).trim() : null) : undefined,
        phone: phone !== undefined ? (phone ? String(phone).trim() : null) : undefined,
        parentPhone: parentPhone !== undefined ? (parentPhone ? String(parentPhone).trim() : null) : undefined,
        active: active !== undefined ? Boolean(active) : undefined,
      },
      include: { class: true },
    });

    res.json(student);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update student' });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.student.delete({ where: { id } });
    res.json({ message: 'Student removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete student' });
  }
};

// Feature 2: Printable Attendance NOC / Certificate Payload
export const getStudentCertificate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { monthId } = req.query;

    const student = await prisma.student.findUnique({
      where: { id },
      include: { class: { include: { academicYear: true } } },
    });

    if (!student) return res.status(404).json({ error: 'Student not found' });

    let month = monthId
      ? await prisma.academicMonth.findUnique({ where: { id: String(monthId) } })
      : await prisma.academicMonth.findFirst({ orderBy: [{ year: 'desc' }, { id: 'desc' }] });

    if (!month) return res.status(404).json({ error: 'Academic month not found' });

    const monthMap: Record<string, number> = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
    };
    const monthIdx = monthMap[month.monthName.toLowerCase()] ?? 6;
    const startDate = new Date(Date.UTC(month.year, monthIdx, 1));
    const endDate = new Date(Date.UTC(month.year, monthIdx + 1, 0, 23, 59, 59));
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const classSubjects = await prisma.classSubject.findMany({
      where: { classId: student.classId, active: true },
      include: { subject: true, teacher: true },
    });

    let totalAttended = 0;
    let totalTaken = 0;

    const subjectBreakdown = await Promise.all(
      classSubjects.map(async (cs) => {
        const taken = await prisma.attendanceSession.count({
          where: { classSubjectId: cs.id, date: { gte: startStr, lte: endStr } },
        });

        const attended = await prisma.attendanceRecord.count({
          where: {
            studentId: student.id,
            status: 'PRESENT',
            session: { classSubjectId: cs.id, date: { gte: startStr, lte: endStr } },
          },
        });

        totalAttended += attended;
        totalTaken += taken;

        return {
          subjectName: cs.subject.name,
          arabicName: cs.subject.arabicName,
          teacherName: cs.teacher.name,
          attended,
          taken,
          percentage: taken > 0 ? Number(((attended / taken) * 100).toFixed(2)) : 0,
        };
      })
    );

    const overallPercentage = totalTaken > 0 ? Number(((totalAttended / totalTaken) * 100).toFixed(2)) : 0;
    const settings = await prisma.systemSettings.findFirst();

    res.json({
      certificateNo: `SHC-NOC-${student.registerNumber}-${month.year}`,
      issueDate: new Date().toISOString().split('T')[0],
      collegeName: 'Sirajul Huda College of Science and Integrated Studies, Nadapuram',
      university: 'Jamiathul Hind Al Islamiya',
      student: {
        id: student.id,
        name: student.name,
        registerNumber: student.registerNumber,
        rollNumber: student.rollNumber,
        className: student.class.name,
        academicYearName: student.class.academicYear.name,
      },
      monthName: month.monthName,
      year: month.year,
      workingDays: month.workingDays,
      totalAttended,
      totalTaken,
      overallPercentage,
      isEligible: overallPercentage >= (settings?.attendanceThreshold || 75.0),
      subjectBreakdown,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate certificate' });
  }
};
