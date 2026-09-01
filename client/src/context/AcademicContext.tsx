import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { AcademicYear, AcademicMonth } from '../types';

interface AcademicContextType {
  academicYears: AcademicYear[];
  academicMonths: AcademicMonth[];
  selectedYearId: string;
  selectedMonthId: string;
  selectedDate: string;
  setSelectedYearId: (id: string) => void;
  setSelectedMonthId: (id: string) => void;
  setSelectedDate: (date: string) => void;
  refreshAcademicData: () => Promise<void>;
}

const monthNamesArray = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const AcademicContext = createContext<AcademicContextType | undefined>(undefined);

export const AcademicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [academicMonths, setAcademicMonths] = useState<AcademicMonth[]>([]);

  // Persistent Selected Year, Month, Date
  const [selectedYearId, setSelectedYearIdState] = useState<string>(() => {
    return localStorage.getItem('shc_selected_year_id') || '';
  });

  const [selectedMonthId, setSelectedMonthIdState] = useState<string>(() => {
    return localStorage.getItem('shc_selected_month_id') || '';
  });

  const [selectedDate, setSelectedDateState] = useState<string>(() => {
    return localStorage.getItem('shc_selected_date') || new Date().toISOString().split('T')[0];
  });

  // Helper to sync month ID from date string YYYY-MM-DD
  const syncMonthFromDate = (dateStr: string, monthsList: AcademicMonth[]) => {
    if (!dateStr || monthsList.length === 0) return;
    const parts = dateStr.split('-');
    if (parts.length < 2) return;

    const y = Number(parts[0]);
    const mIdx = Number(parts[1]) - 1;
    const targetMonthName = monthNamesArray[mIdx];

    const match = monthsList.find(
      (m) => m.year === y && m.monthName.toLowerCase() === targetMonthName
    );

    if (match) {
      setSelectedMonthIdState(match.id);
      localStorage.setItem('shc_selected_month_id', match.id);
    } else if (monthsList.length > 0) {
      setSelectedMonthIdState(monthsList[0].id);
      localStorage.setItem('shc_selected_month_id', monthsList[0].id);
    }
  };

  const setSelectedYearId = (id: string) => {
    setSelectedYearIdState(id);
    localStorage.setItem('shc_selected_year_id', id);

    const monthsForYear = academicMonths.filter((m) => m.academicYearId === id);
    if (monthsForYear.length > 0) {
      const now = new Date();
      const currentMonthName = now.toLocaleString('default', { month: 'long' }).toLowerCase();
      const match = monthsForYear.find(
        (m) => m.year === now.getFullYear() && m.monthName.toLowerCase() === currentMonthName
      );
      const chosen = match || monthsForYear[0];
      setSelectedMonthIdState(chosen.id);
      localStorage.setItem('shc_selected_month_id', chosen.id);
    }
  };

  const setSelectedMonthId = (id: string) => {
    setSelectedMonthIdState(id);
    localStorage.setItem('shc_selected_month_id', id);

    const targetMonth = academicMonths.find((m) => m.id === id);
    if (targetMonth && selectedDate) {
      const parts = selectedDate.split('-');
      const dateYear = Number(parts[0]);
      const dateMonthIdx = Number(parts[1]) - 1;
      const dateMonthName = monthNamesArray[dateMonthIdx];

      if (dateYear !== targetMonth.year || dateMonthName !== targetMonth.monthName.toLowerCase()) {
        const targetMonthIdx = monthNamesArray.indexOf(targetMonth.monthName.toLowerCase());
        const mStr = String(targetMonthIdx + 1).padStart(2, '0');
        const newDate = `${targetMonth.year}-${mStr}-01`;
        setSelectedDateState(newDate);
        localStorage.setItem('shc_selected_date', newDate);
      }
    }
  };

  const setSelectedDate = (date: string) => {
    setSelectedDateState(date);
    localStorage.setItem('shc_selected_date', date);
    syncMonthFromDate(date, academicMonths);
  };

  const refreshAcademicData = async () => {
    try {
      const [yrRes, mRes] = await Promise.all([
        api.get('/academic-years'),
        api.get('/academic-months'),
      ]);

      const yrs = Array.isArray(yrRes.data) ? yrRes.data : [];
      const mths = Array.isArray(mRes.data) ? mRes.data : [];

      setAcademicYears(yrs);
      setAcademicMonths(mths);

      // Validate & reset selectedYearId if invalid or missing
      let validYear = yrs.find((y: AcademicYear) => y.id === selectedYearId);
      if (!validYear && yrs.length > 0) {
        validYear = yrs.find((y: AcademicYear) => y.isCurrent) || yrs[0];
        setSelectedYearIdState(validYear.id);
        localStorage.setItem('shc_selected_year_id', validYear.id);
      }

      // Validate & sync month
      if (mths.length > 0) {
        const currentDate = localStorage.getItem('shc_selected_date') || new Date().toISOString().split('T')[0];
        syncMonthFromDate(currentDate, mths);
      }
    } catch (err) {
      console.error('Failed to load academic context data:', err);
    }
  };

  useEffect(() => {
    refreshAcademicData();
  }, []);

  return (
    <AcademicContext.Provider
      value={{
        academicYears,
        academicMonths,
        selectedYearId,
        selectedMonthId,
        selectedDate,
        setSelectedYearId,
        setSelectedMonthId,
        setSelectedDate,
        refreshAcademicData,
      }}
    >
      {children}
    </AcademicContext.Provider>
  );
};

export const useAcademic = () => {
  const context = useContext(AcademicContext);
  if (!context) {
    throw new Error('useAcademic must be used within an AcademicProvider');
  }
  return context;
};
