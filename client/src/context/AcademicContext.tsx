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

  const setSelectedYearId = (id: string) => {
    setSelectedYearIdState(id);
    localStorage.setItem('shc_selected_year_id', id);

    // Auto-select first month of selected year
    const monthsForYear = academicMonths.filter((m) => m.academicYearId === id);
    if (monthsForYear.length > 0) {
      setSelectedMonthIdState(monthsForYear[0].id);
      localStorage.setItem('shc_selected_month_id', monthsForYear[0].id);
    }
  };

  const setSelectedMonthId = (id: string) => {
    setSelectedMonthIdState(id);
    localStorage.setItem('shc_selected_month_id', id);
  };

  const setSelectedDate = (date: string) => {
    setSelectedDateState(date);
    localStorage.setItem('shc_selected_date', date);
  };

  const refreshAcademicData = async () => {
    try {
      const [yrRes, mRes] = await Promise.all([
        api.get('/academic-years'),
        api.get('/academic-months'),
      ]);

      setAcademicYears(yrRes.data);
      setAcademicMonths(mRes.data);

      // Find current active year if not set
      if (yrRes.data.length > 0 && !selectedYearId) {
        const currentYr = yrRes.data.find((y: AcademicYear) => y.isCurrent) || yrRes.data[0];
        setSelectedYearIdState(currentYr.id);
        localStorage.setItem('shc_selected_year_id', currentYr.id);
      }

      if (mRes.data.length > 0 && !selectedMonthId) {
        setSelectedMonthIdState(mRes.data[0].id);
        localStorage.setItem('shc_selected_month_id', mRes.data[0].id);
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
