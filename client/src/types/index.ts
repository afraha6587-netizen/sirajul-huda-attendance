export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TEACHER';
}

export interface Teacher {
  id: string;
  userId?: string;
  user?: User;
  name: string;
  code: string;
  active: boolean;
  classSubjects?: any[];
}

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  weeklyOffDay?: string;
}

export interface AcademicMonth {
  id: string;
  academicYearId: string;
  monthName: string;
  year: number;
  workingDays: number;
  academicYear?: AcademicYear;
}

export interface Class {
  id: string;
  name: string;
  academicYearId: string;
  active: boolean;
  academicYear?: AcademicYear;
  _count?: {
    students?: number;
    classSubjects?: number;
  };
}

export interface Student {
  id: string;
  registerNumber: string;
  rollNumber: number;
  name: string;
  classId: string;
  admissionNo?: string;
  phone?: string;
  parentPhone?: string;
  active: boolean;
  class?: Class;
}

export interface Subject {
  id: string;
  name: string;
  arabicName?: string;
  code: string;
  active: boolean;
  _count?: {
    classSubjects?: number;
  };
}

export interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  active: boolean;
  class: Class;
  subject: Subject;
  teacher: Teacher;
}

export interface SubjectMonthlyConfig {
  id: string;
  classSubjectId: string;
  monthId: string;
  availableClasses: number;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LEAVE';
  student?: Student;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  subjectId: string;
  classSubjectId: string;
  teacherId: string;
  date: string;
  period: number;
  topicTaught?: string;
  kitabPage?: string;
  status: string;
  createdById: string;
  records?: AttendanceRecord[];
  class?: Class;
  classSubject?: ClassSubject;
}

export interface MonthlySubjectStat {
  classSubjectId: string;
  subjectName: string;
  arabicName?: string;
  teacherName: string;
  availableClasses: number;
  takenClasses: number;
  notTakenClasses: number;
  attended: number;
  percentage: number;
}

export interface StudentMonthlyReport {
  studentId: string;
  slNo: number;
  registerNumber: string;
  studentName: string;
  subjectStats: MonthlySubjectStat[];
  grandTotalAttended: number;
  grandTotalTaken: number;
  overallPercentage: number;
  presentDays: number;
  monthlyLeave: number;
  dayWisePercentage: number;
  isAtRisk: boolean;
}

export interface MonthlyReportData {
  classId: string;
  className: string;
  monthId: string;
  monthName: string;
  year: number;
  academicYearName: string;
  workingDays: number;
  threshold: number;
  subjectSummaries: {
    slNo: number;
    classSubjectId: string;
    subjectName: string;
    arabicName?: string;
    teacherName: string;
    availableClasses: number;
    takenClasses: number;
    notTakenClasses: number;
  }[];
  students: StudentMonthlyReport[];
}

export interface DashboardStats {
  totalStudents: number;
  totalClasses: number;
  totalTeachers: number;
  totalSubjects: number;
  overallPercentage: number;
  todaySessionsCount: number;
  atRiskCount: number;
  recentSessions: any[];
}

export interface SystemSettings {
  id: string;
  collegeName: string;
  logoUrl: string;
  attendanceThreshold: number;
  timezone: string;
  dateFormat: string;
  weeklyOffDay?: string;
}
