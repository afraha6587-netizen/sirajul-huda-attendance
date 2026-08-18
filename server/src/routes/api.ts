import { Router } from 'express';
import multer from 'multer';
import { login, me } from '../controllers/authController';
import {
  getAcademicYears, createAcademicYear, updateAcademicYear,
  getAcademicMonths, createAcademicMonth, updateAcademicMonth,
  getSubjectMonthlyConfigs, updateSubjectMonthlyConfig,
  getSettings, updateSettings,
} from '../controllers/academicController';
import { getClasses, getClassById, createClass, updateClass, deleteClass } from '../controllers/classController';
import {
  getStudents, getStudentById, createStudent, updateStudent, deleteStudent,
  getStudentCertificate,
} from '../controllers/studentController';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../controllers/subjectController';
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from '../controllers/teacherController';
import { getClassSubjects, assignSubjectToClass, removeSubjectFromClass } from '../controllers/classSubjectController';
import {
  saveAttendanceSession, saveDailyAttendance,
  getAttendanceSessions, getSessionById, deleteSession,
  getSyllabusLog,
} from '../controllers/attendanceController';
import { getMonthlyAttendanceReport, getDashboardStats, getStudentsAtRisk } from '../controllers/reportController';
import { exportMonthlyReportToExcel, importExcelData } from '../controllers/importExportController';
import { getPublicStudentAttendance, seedSystem } from '../controllers/publicController';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController';
import { getHolidays, createHoliday, deleteHoliday, getCalendarMonthGrid } from '../controllers/holidayController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// 1. PUBLIC ROUTES (No Token Required)
router.post('/auth/login', login);
router.get('/public/student-attendance', getPublicStudentAttendance);
router.get('/public/academic-months', getAcademicMonths);
router.get('/public/seed', seedSystem);

// 2. AUTHENTICATED ROUTES
router.use(authenticateToken);
router.get('/auth/me', me);

// Interactive Month Calendar Grid API Route
router.get('/calendar/month-grid', getCalendarMonthGrid);

// Holiday & Leave Management Routes
router.get('/holidays', getHolidays);
router.post('/holidays', requireAdmin, createHoliday);
router.delete('/holidays/:id', requireAdmin, deleteHoliday);

// User Management (Admin Only)
router.get('/users', requireAdmin, getUsers);
router.post('/users', requireAdmin, createUser);
router.put('/users/:id', requireAdmin, updateUser);
router.delete('/users/:id', requireAdmin, deleteUser);

// Academic & Settings Routes
router.get('/academic-years', getAcademicYears);
router.post('/academic-years', requireAdmin, createAcademicYear);
router.put('/academic-years/:id', requireAdmin, updateAcademicYear);
router.get('/academic-months', getAcademicMonths);
router.post('/academic-months', requireAdmin, createAcademicMonth);
router.put('/academic-months/:id', requireAdmin, updateAcademicMonth);

router.get('/subject-configs', getSubjectMonthlyConfigs);
router.post('/subject-configs', requireAdmin, updateSubjectMonthlyConfig);

router.get('/settings', getSettings);
router.put('/settings', requireAdmin, updateSettings);

// Class Routes
router.get('/classes', getClasses);
router.get('/classes/:id', getClassById);
router.post('/classes', requireAdmin, createClass);
router.put('/classes/:id', requireAdmin, updateClass);
router.delete('/classes/:id', requireAdmin, deleteClass);

// Student Routes & Certificates
router.get('/students', getStudents);
router.get('/students/:id', getStudentById);
router.get('/students/:id/certificate', getStudentCertificate);
router.post('/students', requireAdmin, createStudent);
router.put('/students/:id', requireAdmin, updateStudent);
router.delete('/students/:id', requireAdmin, deleteStudent);

// Subject Routes
router.get('/subjects', getSubjects);
router.post('/subjects', requireAdmin, createSubject);
router.put('/subjects/:id', requireAdmin, updateSubject);
router.delete('/subjects/:id', requireAdmin, deleteSubject);

// Teacher Routes
router.get('/teachers', getTeachers);
router.post('/teachers', requireAdmin, createTeacher);
router.put('/teachers/:id', requireAdmin, updateTeacher);
router.delete('/teachers/:id', requireAdmin, deleteTeacher);

// Class-Subject Assignment Routes
router.get('/class-subjects', getClassSubjects);
router.post('/class-subjects', requireAdmin, assignSubjectToClass);
router.delete('/class-subjects/:id', requireAdmin, removeSubjectFromClass);

// Attendance & Syllabus Routes
router.post('/attendance/session', saveAttendanceSession);
router.post('/attendance/daily', saveDailyAttendance);
router.get('/attendance/sessions', getAttendanceSessions);
router.get('/attendance/sessions/:id', getSessionById);
router.get('/attendance/syllabus-log', getSyllabusLog);
router.delete('/attendance/sessions/:id', requireAdmin, deleteSession);

// Reports & Dashboard Routes
router.get('/reports/monthly', getMonthlyAttendanceReport);
router.get('/reports/dashboard', getDashboardStats);
router.get('/reports/at-risk', getStudentsAtRisk);

// Import & Export Routes
router.get('/export/excel', exportMonthlyReportToExcel);
router.post('/import/excel', requireAdmin, upload.single('file'), importExcelData);

export default router;
