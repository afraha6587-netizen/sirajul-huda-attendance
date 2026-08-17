import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getUsers = async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        teacher: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user accounts' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, Email/ID, Password, and Role are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: `User with Email/ID "${email}" already exists` });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role === 'ADMIN' ? 'ADMIN' : 'TEACHER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create user account' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    if (email) {
      const existing = await prisma.user.findFirst({ where: { email, NOT: { id } } });
      if (existing) {
        return res.status(400).json({ error: `Email/ID "${email}" is already in use` });
      }
    }

    const updatedData: any = {};
    if (name) updatedData.name = name;
    if (email) updatedData.email = email;
    if (role) updatedData.role = role;
    if (password) updatedData.passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id },
      data: updatedData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update user account' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (req.user?.id === id) {
      return res.status(400).json({ error: 'You cannot delete your own logged-in admin account' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User account deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete user account' });
  }
};
