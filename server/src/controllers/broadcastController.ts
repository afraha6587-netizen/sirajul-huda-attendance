import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

/**
 * Get target recipient parents for selected class IDs
 */
export const getBroadcastRecipients = async (req: Request, res: Response) => {
  try {
    const { classIds } = req.body;
    let whereClause: any = { active: true };

    if (Array.isArray(classIds) && classIds.length > 0 && !classIds.includes('ALL')) {
      whereClause.classId = { in: classIds };
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        class: true,
      },
      orderBy: [
        { class: { name: 'asc' } },
        { rollNumber: 'asc' },
      ],
    });

    const recipients = students.map((st: any) => {
      const targetPhone = st.parentPhone || st.phone || '';
      const cleanPhone = targetPhone.replace(/[^0-9]/g, '');

      return {
        studentId: st.id,
        studentName: st.name,
        registerNumber: st.registerNumber,
        rollNumber: st.rollNumber,
        classId: st.classId,
        className: st.class.name,
        parentPhone: targetPhone,
        hasPhone: cleanPhone.length >= 8,
      };
    });

    res.json({
      totalCount: recipients.length,
      validPhoneCount: recipients.filter((r: any) => r.hasPhone).length,
      recipients,
    });
  } catch (error: any) {
    console.error('Failed to fetch broadcast recipients:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch broadcast recipients' });
  }
};

/**
 * Generate broadcast messages & WhatsApp links for parents
 */
export const generateBroadcastMessages = async (req: Request, res: Response) => {
  try {
    const { classIds, templateType, title, messageTemplate, customParams } = req.body;

    if (!messageTemplate) {
      return res.status(400).json({ error: 'Message template text is required' });
    }

    let whereClause: any = { active: true };
    if (Array.isArray(classIds) && classIds.length > 0 && !classIds.includes('ALL')) {
      whereClause.classId = { in: classIds };
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        class: true,
      },
      orderBy: [
        { class: { name: 'asc' } },
        { rollNumber: 'asc' },
      ],
    });

    const messages = students.map((st: any) => {
      const rawPhone = st.parentPhone || st.phone || '';
      let cleanPhone = rawPhone.replace(/[^0-9]/g, '');

      // Auto-prefix India country code 91 if 10-digit number
      if (cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
      }

      // Replace placeholders in message template
      let personalizedText = messageTemplate
        .replace(/\{student_name\}/g, st.name)
        .replace(/\{class_name\}/g, st.class.name)
        .replace(/\{register_number\}/g, st.registerNumber)
        .replace(/\{roll_number\}/g, String(st.rollNumber));

      // Replace custom parameters if provided (e.g. date, time)
      if (customParams && typeof customParams === 'object') {
        Object.keys(customParams).forEach((key) => {
          const val = customParams[key] || '';
          personalizedText = personalizedText.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
        });
      }

      const whatsappUrl = cleanPhone.length >= 8
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(personalizedText)}`
        : null;

      return {
        studentId: st.id,
        studentName: st.name,
        registerNumber: st.registerNumber,
        rollNumber: st.rollNumber,
        className: st.class.name,
        parentPhone: rawPhone,
        cleanPhone,
        hasPhone: cleanPhone.length >= 8,
        messageText: personalizedText,
        whatsappUrl,
      };
    });

    res.json({
      title: title || 'Parent Broadcast Notice',
      templateType: templateType || 'CUSTOM',
      totalRecipients: messages.length,
      validPhoneCount: messages.filter((m: any) => m.hasPhone).length,
      messages,
    });
  } catch (error: any) {
    console.error('Failed to generate broadcast messages:', error);
    res.status(500).json({ error: error.message || 'Failed to generate broadcast messages' });
  }
};
