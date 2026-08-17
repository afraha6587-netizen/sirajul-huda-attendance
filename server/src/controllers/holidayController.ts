import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

// Helper to count Sundays & declared holidays in a month and update net working days
async function recalculateMonthWorkingDays(monthId: string) {
  const month = await prisma.academicMonth.findUnique({ where: { id: monthId } });
  if (!month) return;

  const monthMap: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  };
  const monthIdx = monthMap[month.monthName.toLowerCase()] ?? 6;
  const totalDaysInMonth = new Date(month.year, monthIdx + 1, 0).getDate();

  // Count Sundays in month
  let sundayCount = 0;
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const d = new Date(month.year, monthIdx, day);
    if (d.getDay() === 0) { // 0 = Sunday
      sundayCount++;
    }
  }

  // Count declared holiday days for this month
  const declaredHolidays = await prisma.institutionHoliday.findMany({
    where: {
      OR: [
        { monthId: month.id },
        {
          startDate: { lte: `${month.year}-${(monthIdx + 1).toString().padStart(2, '0')}-${totalDaysInMonth}` },
          endDate: { gte: `${month.year}-${(monthIdx + 1).toString().padStart(2, '0')}-01` },
        },
      ],
      affectsWorkingDays: true,
    },
  });

  let declaredHolidayDays = 0;
  declaredHolidays.forEach((h) => {
    const start = new Date(h.startDate);
    const end = new Date(h.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    declaredHolidayDays += diffDays;
  });

  const netWorkingDays = Math.max(0, totalDaysInMonth - sundayCount - declaredHolidayDays);

  await prisma.academicMonth.update({
    where: { id: month.id },
    data: { workingDays: netWorkingDays },
  });

  return netWorkingDays;
}

export const getHolidays = async (req: Request, res: Response) => {
  try {
    const { monthId, yearId } = req.query;
    const where: any = {};
    if (monthId) where.monthId = String(monthId);
    if (yearId) where.academicYearId = String(yearId);

    const holidays = await prisma.institutionHoliday.findMany({
      where,
      include: { academicMonth: true },
      orderBy: { startDate: 'asc' },
    });
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
};

export const createHoliday = async (req: Request, res: Response) => {
  try {
    const { title, startDate, endDate, type, academicYearId, monthId } = req.body;

    if (!title || !startDate || !endDate || !academicYearId) {
      return res.status(400).json({ error: 'Title, Start Date, End Date, and Academic Year are required' });
    }

    const holiday = await prisma.institutionHoliday.create({
      data: {
        title,
        startDate: String(startDate).trim(),
        endDate: String(endDate).trim(),
        type: type || 'HOLIDAY',
        academicYearId,
        monthId: monthId || undefined,
        affectsWorkingDays: true,
      },
    });

    if (monthId) {
      await recalculateMonthWorkingDays(monthId);
    }

    res.status(201).json(holiday);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create holiday' });
  }
};

export const deleteHoliday = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const holiday = await prisma.institutionHoliday.findUnique({ where: { id } });
    if (!holiday) return res.status(404).json({ error: 'Holiday not found' });

    await prisma.institutionHoliday.delete({ where: { id } });

    if (holiday.monthId) {
      await recalculateMonthWorkingDays(holiday.monthId);
    }

    res.json({ message: 'Holiday removed and working days updated successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete holiday' });
  }
};

// Full Month Calendar Grid API Endpoint
export const getCalendarMonthGrid = async (req: Request, res: Response) => {
  try {
    const { monthId, yearId } = req.query;

    let month = monthId
      ? await prisma.academicMonth.findUnique({ where: { id: String(monthId) }, include: { academicYear: true } })
      : await prisma.academicMonth.findFirst({ orderBy: [{ year: 'desc' }, { id: 'desc' }], include: { academicYear: true } });

    if (!month) {
      return res.status(404).json({ error: 'Academic Month not found' });
    }

    const monthMap: Record<string, number> = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
    };
    const monthIdx = monthMap[month.monthName.toLowerCase()] ?? 6;
    const totalDaysInMonth = new Date(month.year, monthIdx + 1, 0).getDate();
    const firstDayWeekday = new Date(month.year, monthIdx, 1).getDay(); // 0 = Sun, 1 = Mon ...

    const declaredHolidays = await prisma.institutionHoliday.findMany({
      where: {
        academicYearId: month.academicYearId,
      },
    });

    const calendarDays: any[] = [];
    let sundayCount = 0;
    let hostelLeaveCount = 0;
    let holidayCount = 0;

    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const dateObj = new Date(month.year, monthIdx, dayNum);
      const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
      const monthNumStr = (monthIdx + 1) < 10 ? `0${monthIdx + 1}` : `${monthIdx + 1}`;
      const fullDateStr = `${month.year}-${monthNumStr}-${dayStr}`;

      const isSunday = dateObj.getDay() === 0;
      if (isSunday) sundayCount++;

      const matchingHoliday = declaredHolidays.find(
        (h) => fullDateStr >= h.startDate && fullDateStr <= h.endDate
      );

      if (matchingHoliday) {
        if (matchingHoliday.type === 'HOSTEL_LEAVE') hostelLeaveCount++;
        else holidayCount++;
      }

      const sessionsCount = await prisma.attendanceSession.count({
        where: { date: fullDateStr },
      });

      calendarDays.push({
        dayNumber: dayNum,
        dateString: fullDateStr,
        weekdayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        weekdayIndex: dateObj.getDay(),
        isSunday,
        isHoliday: Boolean(matchingHoliday) || isSunday,
        holidayTitle: matchingHoliday ? matchingHoliday.title : isSunday ? 'Sunday Weekly Off' : null,
        holidayType: matchingHoliday ? matchingHoliday.type : isSunday ? 'WEEKLY_OFF' : 'WORKING_DAY',
        sessionsCount,
      });
    }

    res.json({
      monthId: month.id,
      monthName: month.monthName,
      year: month.year,
      academicYearName: month.academicYear.name,
      workingDays: month.workingDays,
      totalDaysInMonth,
      firstDayWeekday,
      sundayCount,
      hostelLeaveCount,
      holidayCount,
      calendarDays,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch calendar grid' });
  }
};
