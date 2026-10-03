import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { AuthRequest, JWT_SECRET } from '../middleware/auth';
import { ensureAdminSeeded } from '../seed';

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    let user = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: 'insensitive',
        },
      },
      include: { teacher: true },
    });

    // Fail-safe auto-recovery for default Super Admin
    if (cleanEmail === 'admin@college.edu' && cleanPassword === 'Admin@123456') {
      const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);

      if (!user) {
        console.log('⚡ Creating Super Admin account on request...');
        user = await prisma.user.create({
          data: {
            email: 'admin@college.edu',
            name: 'Super Administrator',
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
            isApproved: true,
          },
          include: { teacher: true },
        });
      } else {
        // Force update admin password hash to match Admin@123456
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
            isApproved: true,
          },
          include: { teacher: true },
        });
      }
    } else {
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(cleanPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    if (!user.isApproved && user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Your registration is pending Admin approval. Please contact the administrator to activate your account.',
      });
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      teacherId: user.teacher?.id,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: payload,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Server error during login' });
  }
};

export const registerTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, code } = req.body;

    // Check teacher limit of 6
    const teacherCount = await prisma.teacher.count();
    if (teacherCount >= 6) {
      return res.status(400).json({ error: 'Teacher registration limit reached (Maximum 6 teachers allowed).' });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'This email is already registered' });
    }

    // Generate unique code if not provided
    const teacherCode = code ? String(code).trim().toUpperCase() : `T-${Math.floor(1000 + Math.random() * 9000)}`;

    const existingCode = await prisma.teacher.findUnique({ where: { code: teacherCode } });
    if (existingCode) {
      return res.status(400).json({ error: `Teacher code ${teacherCode} is already taken` });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'TEACHER',
        isApproved: false, // Requires Admin Approval
      },
    });

    await prisma.teacher.create({
      data: {
        name,
        code: teacherCode,
        userId: user.id,
        active: false, // Inactive until Admin approval
      },
    });

    res.status(201).json({
      message: 'Registration submitted successfully! Your account is pending Admin approval.',
    });
  } catch (error: any) {
    console.error('Teacher registration error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit teacher registration' });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { teacher: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        teacherId: user.teacher?.id,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch current user' });
  }
};
