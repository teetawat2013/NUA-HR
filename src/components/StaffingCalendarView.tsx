import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flag,
  Sparkles,
  Filter,
  Building2,
  Briefcase,
  Phone,
  Trash2,
  Printer,
  Info,
  X,
  Tag,
  Coffee,
  Wrench,
  GraduationCap,
  Layers,
  Search,
  Check,
  Download
} from 'lucide-react';
import { 
  Employee, 
  AttendanceRecord, 
  AttendanceEventType, 
  Department, 
  DEPARTMENTS, 
  PublicHoliday, 
  CompanyEvent, 
  CompanyEventCategory 
} from '../types';
import { 
  getPublicHolidaysForYear, 
  getPublicHolidaysForMonth 
} from '../data/holidaysAndEvents';
import { 
  loadCompanyEvents, 
  saveCompanyEvents 
} from '../utils/storage';
import { THAI_MONTHS } from '../utils/payrollCalculator';

interface StaffingCalendarViewProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  onAddAttendanceRecord?: (record: Omit<AttendanceRecord, 'id' | 'recordedAt'>) => void;
  onDeleteAttendanceRecord?: (id: string) => void;
}

// Category Badge styles & icons for Company Events
const EVENT_CATEGORY_CONFIG: Record<CompanyEventCategory, { label: string; icon: any; bg: string; text: string; border: string }> = {
  MEETING: { label: 'การประชุม', icon: Users, bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  TRAINING: { label: 'อบรม/สัมมนา', icon: GraduationCap, bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  AUDIT: { label: 'ตรวจนับสต็อก/ตรวจเช็ก', icon: CheckCircle2, bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  MAINTENANCE: { label: 'Big Cleaning/ซ่อมบำรุง', icon: Wrench, bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200' },
  CELEBRATION: { label: 'สวัสดิการ/สังสรรค์', icon: Sparkles, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  OTHER: { label: 'กิจกรรมทั่วไป', icon: Tag, bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

// Leave Type visual config
const LEAVE_TYPE_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  SICK: { label: 'ลาป่วย', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  BUSINESS: { label: 'ลากิจ', bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  ANNUAL: { label: 'พักร้อน', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  OTHER_LEAVE: { label: 'ลาอื่นๆ', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  ABSENT: { label: 'ขาดงาน', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
};

export const StaffingCalendarView: React.FC<StaffingCalendarViewProps> = ({
  employees,
  attendanceRecords,
  onAddAttendanceRecord,
  onDeleteAttendanceRecord,
}) => {
  // Current active employees
  const activeEmployees = useMemo(() => employees.filter(e => !e.resignation.isResigned), [employees]);

  // Calendar Date State (Default: Today's Month/Year)
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1); // 1-12
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());

  // Filter State
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [showHolidays, setShowHolidays] = useState<boolean>(true);
  const [showCompanyEvents, setShowCompanyEvents] = useState<boolean>(true);
  const [showLeaves, setShowLeaves] = useState<boolean>(true);

  // Company Events state (loaded from storage)
  const [companyEvents, setCompanyEvents] = useState<CompanyEvent[]>(() => loadCompanyEvents());

  // Modals state
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState<boolean>(false);
  const [isQuickLeaveModalOpen, setIsQuickLeaveModalOpen] = useState<boolean>(false);
  const [quickLeaveDate, setQuickLeaveDate] = useState<string>('');

  // Add Company Event Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<CompanyEventCategory>('MEETING');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventEndDate, setNewEventEndDate] = useState('');
  const [newEventDept, setNewEventDept] = useState<string>('ALL');
  const [newEventLocation, setNewEventLocation] = useState('สำนักงานใหญ่ (เชียงใหม่)');
  const [newEventNotes, setNewEventNotes] = useState('');
  const [eventSaveSuccess, setEventSaveSuccess] = useState<string | null>(null);

  // Quick Leave Form State
  const [leaveEmpId, setLeaveEmpId] = useState(activeEmployees[0]?.id || '');
  const [leaveType, setLeaveType] = useState<AttendanceEventType>('ANNUAL');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveAmount, setLeaveAmount] = useState<number>(1);
  const [leaveReason, setLeaveReason] = useState('ลาพักผ่อนประจำปี (Annual Leave)');

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentMonth(now.getMonth() + 1);
    setCurrentYear(now.getFullYear());
  };

  // Helper: check if a date falls in a start/end range
  const isDateInRange = (dateStr: string, startStr: string, endStr?: string) => {
    if (!startStr) return false;
    if (!endStr || endStr === startStr) return dateStr === startStr;
    return dateStr >= startStr && dateStr <= endStr;
  };

  // 1. Gather Public Holidays for this year
  const publicHolidays = useMemo(() => {
    return getPublicHolidaysForYear(currentYear);
  }, [currentYear]);

  // 2. Filtered Employees by Department
  const deptEmployees = useMemo(() => {
    if (selectedDepartment === 'ALL') return activeEmployees;
    return activeEmployees.filter(e => e.department === selectedDepartment);
  }, [activeEmployees, selectedDepartment]);

  // 3. Filtered Company Events
  const filteredCompanyEvents = useMemo(() => {
    if (!showCompanyEvents) return [];
    return companyEvents.filter(evt => {
      if (selectedDepartment === 'ALL') return true;
      return evt.targetDepartment === 'ALL' || evt.targetDepartment === selectedDepartment;
    });
  }, [companyEvents, showCompanyEvents, selectedDepartment]);

  // 4. Filtered Leave Records
  const filteredLeaveRecords = useMemo(() => {
    if (!showLeaves) return [];
    return attendanceRecords.filter(rec => {
      const isLeave = ['SICK', 'BUSINESS', 'ANNUAL', 'OTHER_LEAVE', 'ABSENT'].includes(rec.type);
      if (!isLeave) return false;
      if (selectedDepartment === 'ALL') return true;
      return rec.department === selectedDepartment;
    });
  }, [attendanceRecords, showLeaves, selectedDepartment]);

  // 5. Generate Monthly Calendar Grid Days
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0);
    const totalDaysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday ...

    // Days from previous month
    const prevMonthLastDay = new Date(currentYear, currentMonth - 1, 0).getDate();
    const prevMonthDays: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevM = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevY = currentMonth === 1 ? currentYear - 1 : currentYear;
      const dStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      prevMonthDays.push({ dateStr: dStr, dayNumber: dayNum, isCurrentMonth: false });
    }

    // Days in current month
    const currentDays: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      currentDays.push({ dateStr: dStr, dayNumber: d, isCurrentMonth: true });
    }

    // Days from next month to complete the row
    const totalCellsSoFar = prevMonthDays.length + currentDays.length;
    const remainingCells = (7 - (totalCellsSoFar % 7)) % 7;
    const nextMonthDays: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];
    for (let n = 1; n <= remainingCells; n++) {
      const nextM = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextY = currentMonth === 12 ? currentYear + 1 : currentYear;
      const dStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
      nextMonthDays.push({ dateStr: dStr, dayNumber: n, isCurrentMonth: false });
    }

    const allDays = [...prevMonthDays, ...currentDays, ...nextMonthDays];

    // Today string
    const todayStr = new Date().toISOString().split('T')[0];

    return allDays.map((cell) => {
      const holidaysOnDay = showHolidays 
        ? publicHolidays.filter(h => h.date === cell.dateStr) 
        : [];
      const eventsOnDay = filteredCompanyEvents.filter(e => isDateInRange(cell.dateStr, e.date, e.endDate));
      const leavesOnDay = filteredLeaveRecords.filter(l => isDateInRange(cell.dateStr, l.date, l.endDate));

      // Calculate staffing on duty for this day
      // Count unique employees on leave
      const empIdsOnLeave = new Set(leavesOnDay.map(l => l.employeeId));
      const totalStaff = deptEmployees.length;
      const onLeaveCount = empIdsOnLeave.size;
      const onDutyCount = Math.max(0, totalStaff - onLeaveCount);

      // Staffing warning: if in any department >= 2 people are on leave, or if onLeaveCount >= 3
      const leavesByDept: Record<string, number> = {};
      leavesOnDay.forEach(l => {
        leavesByDept[l.department] = (leavesByDept[l.department] || 0) + 1;
      });
      const highLeaveDepts = Object.entries(leavesByDept).filter(([_, count]) => count >= 2);
      const isHighLeaveRisk = highLeaveDepts.length > 0 || onLeaveCount >= 3;

      // Check if Thursday (weekly day off)
      const dayOfWeek = new Date(cell.dateStr + 'T00:00:00').getDay();
      const isThursdayWeeklyDayOff = dayOfWeek === 4;

      return {
        ...cell,
        isToday: cell.dateStr === todayStr,
        isThursdayWeeklyDayOff,
        holidays: holidaysOnDay,
        events: eventsOnDay,
        leaves: leavesOnDay,
        onDutyCount,
        onLeaveCount,
        totalStaff,
        isHighLeaveRisk,
        highLeaveDepts,
      };
    });
  }, [
    currentYear, 
    currentMonth, 
    showHolidays, 
    publicHolidays, 
    filteredCompanyEvents, 
    filteredLeaveRecords, 
    deptEmployees
  ]);

  // Overall Month Statistics
  const monthStats = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    // Month Holidays
    const holidaysInMonth = publicHolidays.filter(h => h.date.startsWith(monthPrefix));
    
    // Month Events
    const eventsInMonth = companyEvents.filter(e => 
      (e.date.startsWith(monthPrefix) || (e.endDate && e.endDate.startsWith(monthPrefix))) &&
      (selectedDepartment === 'ALL' || e.targetDepartment === 'ALL' || e.targetDepartment === selectedDepartment)
    );

    // Month Leaves
    const leavesInMonth = filteredLeaveRecords.filter(l => 
      l.date.startsWith(monthPrefix) || (l.endDate && l.endDate.startsWith(monthPrefix))
    );

    let sickCount = 0;
    let businessCount = 0;
    let annualCount = 0;
    let absentCount = 0;
    let otherCount = 0;

    leavesInMonth.forEach(l => {
      if (l.type === 'SICK') sickCount += l.amount;
      else if (l.type === 'BUSINESS') businessCount += l.amount;
      else if (l.type === 'ANNUAL') annualCount += l.amount;
      else if (l.type === 'ABSENT') absentCount += l.amount;
      else if (l.type === 'OTHER_LEAVE') otherCount += l.amount;
    });

    // Weekly Day Off (Every Thursday)
    const thursdayCount = calendarGrid.filter(d => d.isCurrentMonth && d.isThursdayWeeklyDayOff).length;

    // Peak Leave Days (days with highest leaves)
    const peakDays = calendarGrid
      .filter(d => d.isCurrentMonth && d.onLeaveCount > 0)
      .sort((a, b) => b.onLeaveCount - a.onLeaveCount)
      .slice(0, 3);

    return {
      holidayCount: holidaysInMonth.length,
      thursdayCount,
      eventCount: eventsInMonth.length,
      totalLeaveRecords: leavesInMonth.length,
      sickCount,
      businessCount,
      annualCount,
      absentCount,
      otherCount,
      totalLeaveDays: sickCount + businessCount + annualCount + absentCount + otherCount,
      peakDays,
    };
  }, [calendarGrid, currentYear, currentMonth, publicHolidays, companyEvents, filteredLeaveRecords, selectedDepartment]);

  // Add Company Event Handler
  const handleSaveCompanyEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate) return;

    const newEvent: CompanyEvent = {
      id: `EVT-${Date.now()}`,
      title: newEventTitle.trim(),
      category: newEventCategory,
      date: newEventDate,
      endDate: newEventEndDate || undefined,
      targetDepartment: newEventDept as any,
      location: newEventLocation.trim() || 'สำนักงานใหญ่ (เชียงใหม่)',
      notes: newEventNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updated = [newEvent, ...companyEvents];
    setCompanyEvents(updated);
    saveCompanyEvents(updated);

    // Reset Form
    setNewEventTitle('');
    setNewEventNotes('');
    setIsAddEventModalOpen(false);
    setEventSaveSuccess(`บันทึกกิจกรรม "${newEvent.title}" สำเร็จ`);
    setTimeout(() => setEventSaveSuccess(null), 4000);
  };

  // Delete Company Event Handler
  const handleDeleteCompanyEvent = (eventId: string) => {
    const updated = companyEvents.filter(e => e.id !== eventId);
    setCompanyEvents(updated);
    saveCompanyEvents(updated);
  };

  // Quick Add Leave Handler
  const handleQuickAddLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveEmpId || !quickLeaveDate || !onAddAttendanceRecord) return;

    const targetEmp = employees.find(emp => emp.id === leaveEmpId);
    if (!targetEmp) return;

    onAddAttendanceRecord({
      employeeId: targetEmp.id,
      employeeName: targetEmp.fullName,
      department: targetEmp.department,
      type: leaveType,
      date: quickLeaveDate,
      endDate: leaveEndDate || quickLeaveDate,
      amount: Number(leaveAmount) || 1,
      reason: leaveReason.trim() || 'บันทึกการลาผ่านปฏิทินกำลังคน',
    });

    setIsQuickLeaveModalOpen(false);
    setEventSaveSuccess(`บันทึกการลาของ ${targetEmp.fullName} สำเร็จ`);
    setTimeout(() => setEventSaveSuccess(null), 4000);
  };

  // Selected Day Details Data
  const selectedDayDetails = useMemo(() => {
    if (!selectedDayDate) return null;
    return calendarGrid.find(d => d.dateStr === selectedDayDate) || null;
  }, [calendarGrid, selectedDayDate]);

  return (
    <div className="space-y-5">
      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900">
                  ปฏิทินวันหยุด & บันทึกการลา (Staffing Calendar)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  สาขาหลัก: สำนักงานใหญ่ (เชียงใหม่)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                ตรวจเช็กวันหยุดราชการ วาระสำคัญขององค์กร และสถิติการลาของพนักงาน เพื่อบริหารจัดการกำลังคนและกะการทำงานอย่างมีประสิทธิภาพ
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsAddEventModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-2xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มกิจกรรมบริษัท</span>
            </button>

            {onAddAttendanceRecord && (
              <button
                type="button"
                onClick={() => {
                  setQuickLeaveDate(new Date().toISOString().split('T')[0]);
                  setIsQuickLeaveModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-2xs transition"
              >
                <Clock className="w-4 h-4 text-amber-300" />
                <span>บันทึกการลา</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              title="พิมพ์ปฏิทิน / บันทึกเป็น PDF"
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Month Navigation & Filters Row */}
        <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          
          {/* Month/Year Selector & Previous/Next buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="px-3 font-bold text-slate-800 text-sm whitespace-nowrap min-w-[140px] text-center">
                {THAI_MONTHS[currentMonth - 1]} {currentYear + 543}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                title="เดือนถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleJumpToToday}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-xl shadow-2xs transition"
            >
              วันนี้ (Today)
            </button>

            {/* Direct Month & Year Dropdowns */}
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 shadow-2xs"
            >
              {THAI_MONTHS.map((m, idx) => (
                <option key={m} value={idx + 1}>{m}</option>
              ))}
            </select>

            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 shadow-2xs"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>พ.ศ. {y + 543} ({y})</option>
              ))}
            </select>
          </div>

          {/* Department and Layer Overlays */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">แผนก:</span>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-800 shadow-2xs"
              >
                <option value="ALL">ทุกแผนก ({activeEmployees.length} คน)</option>
                {DEPARTMENTS.map((dept) => {
                  const count = activeEmployees.filter(e => e.department === dept).length;
                  return (
                    <option key={dept} value={dept}>{dept} ({count} คน)</option>
                  );
                })}
              </select>
            </div>

            {/* Layer Toggles */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs text-[11px] font-medium">
              <label className="flex items-center gap-1 px-2 py-0.5 cursor-pointer rounded-lg hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={showHolidays}
                  onChange={(e) => setShowHolidays(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="text-rose-700 font-semibold">วันหยุด</span>
              </label>

              <label className="flex items-center gap-1 px-2 py-0.5 cursor-pointer rounded-lg hover:bg-slate-50 border-l border-slate-200">
                <input
                  type="checkbox"
                  checked={showCompanyEvents}
                  onChange={(e) => setShowCompanyEvents(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-indigo-700 font-semibold">กิจกรรมบริษัท</span>
              </label>

              <label className="flex items-center gap-1 px-2 py-0.5 cursor-pointer rounded-lg hover:bg-slate-50 border-l border-slate-200">
                <input
                  type="checkbox"
                  checked={showLeaves}
                  onChange={(e) => setShowLeaves(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-emerald-700 font-semibold">การลาพนักงาน</span>
              </label>
            </div>
          </div>
        </div>

        {/* Success Alert Banner */}
        {eventSaveSuccess && (
          <div className="mx-5 my-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{eventSaveSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setEventSaveSuccess(null)}
              className="text-emerald-600 hover:text-emerald-800 p-0.5 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Staffing Insights Summary Cards */}
        <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-6 gap-3 bg-white">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[11px] text-slate-500 block font-medium">กำลังคนทั้งหมดในสาย</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-bold text-slate-800">{deptEmployees.length}</span>
              <span className="text-xs text-slate-400">คน</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {selectedDepartment === 'ALL' ? 'รวม 5 แผนก' : selectedDepartment}
            </span>
          </div>

          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
            <span className="text-[11px] text-amber-800 block font-medium">วันหยุดประจำสัปดาห์</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-bold text-amber-700">{monthStats.thursdayCount}</span>
              <span className="text-xs text-amber-600">วัน</span>
            </div>
            <span className="text-[10px] text-amber-600 mt-1 block">ทุกวันพฤหัสบดี (Weekly Off)</span>
          </div>

          <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl">
            <span className="text-[11px] text-rose-700 block font-medium">วันหยุดนักขัตฤกษ์</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-bold text-rose-700">{monthStats.holidayCount}</span>
              <span className="text-xs text-rose-500">วัน</span>
            </div>
            <span className="text-[10px] text-rose-500 mt-1 block">วันหยุดราชการประจำเดือนนี้</span>
          </div>

          <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl">
            <span className="text-[11px] text-indigo-700 block font-medium">วาระ/กิจกรรมบริษัท</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-bold text-indigo-700">{monthStats.eventCount}</span>
              <span className="text-xs text-indigo-500">กิจกรรม</span>
            </div>
            <span className="text-[10px] text-indigo-500 mt-1 block">กิจกรรม & วาระองค์กร</span>
          </div>

          <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl">
            <span className="text-[11px] text-blue-700 block font-medium">รวมวันลาพนักงาน</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-bold text-blue-700">{monthStats.totalLeaveDays}</span>
              <span className="text-xs text-blue-500">วัน</span>
            </div>
            <span className="text-[10px] text-blue-500 mt-1 block">
              ป่วย {monthStats.sickCount} • กิจ {monthStats.businessCount} • พักร้อน {monthStats.annualCount}
            </span>
          </div>

          <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl col-span-2 sm:col-span-1">
            <span className="text-[11px] text-amber-800 block font-medium">วันที่มีการลาสูงสุด</span>
            <div className="mt-1">
              {monthStats.peakDays.length > 0 ? (
                <div className="space-y-0.5">
                  {monthStats.peakDays.map(p => (
                    <div key={p.dateStr} className="text-[11px] font-bold text-amber-900 flex items-center justify-between">
                      <span>{p.dayNumber} {THAI_MONTHS[currentMonth - 1]}:</span>
                      <span className="text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-mono">ลา {p.onLeaveCount} คน</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-500 font-medium">ไม่มีการลาในเดือนนี้</span>
              )}
            </div>
          </div>
        </div>

        {/* Staffing Alert Warning Banner if high leave risk detected */}
        {calendarGrid.some(d => d.isCurrentMonth && d.isHighLeaveRisk) && (
          <div className="mx-5 mb-4 p-3 bg-amber-50/90 border border-amber-300 text-amber-900 rounded-xl text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">แจ้งเตือนการบริหารกำลังคน (Staffing Risk Notice):</span>
              <span className="text-slate-700 mt-0.5 block">
                ตรวจพบวันที่มีพนักงานลาซ้อนกันในแผนกเดียวกันตั้งแต่ 2 คนขึ้นไป หรือมีวันที่มีพนักงานลาพร้อมกันจำนวนมาก 
                กรุณาคลิกดูรายละเอียดของแต่ละวันเพื่อจัดเตรียมพนักงานสำรองหรือสลับกะปฏิบัติงานล่วงหน้า
              </span>
            </div>
          </div>
        )}

        {/* Visual Calendar 7-Day Grid */}
        <div className="border-t border-slate-200">
          
          {/* Weekday Column Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100/70 text-center text-xs font-bold py-2">
            <div className="text-rose-600 py-1">อาทิตย์ (Sun)</div>
            <div className="text-slate-700 py-1">จันทร์ (Mon)</div>
            <div className="text-slate-700 py-1">อังคาร (Tue)</div>
            <div className="text-slate-700 py-1">พุธ (Wed)</div>
            <div className="text-amber-800 bg-amber-100/60 py-1 rounded-md font-extrabold flex flex-col items-center justify-center">
              <span>พฤหัสบดี (Thu)</span>
              <span className="text-[9px] text-amber-700 font-semibold">หยุดประจำสัปดาห์</span>
            </div>
            <div className="text-slate-700 py-1">ศุกร์ (Fri)</div>
            <div className="text-indigo-600 py-1">เสาร์ (Sat)</div>
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200">
            {calendarGrid.map((day) => {
              const hasEvents = day.events.length > 0;
              const hasHolidays = day.holidays.length > 0;
              const hasLeaves = day.leaves.length > 0;

              return (
                <div
                  key={day.dateStr}
                  onClick={() => setSelectedDayDate(day.dateStr)}
                  className={`min-h-[120px] sm:min-h-[135px] p-2 transition flex flex-col justify-between cursor-pointer hover:bg-slate-50/80 ${
                    !day.isCurrentMonth ? 'bg-slate-50/40 opacity-60' : day.isThursdayWeeklyDayOff ? 'bg-amber-50/20' : 'bg-white'
                  } ${day.isToday ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50/15' : ''} ${
                    day.isHighLeaveRisk ? 'border-l-2 border-l-amber-500' : ''
                  }`}
                >
                  {/* Day Header: Number + Today indicator + On-duty count */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                          day.isToday
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : hasHolidays
                            ? 'bg-rose-100 text-rose-700'
                            : day.isThursdayWeeklyDayOff
                            ? 'bg-amber-200 text-amber-900'
                            : 'text-slate-700'
                        }`}
                      >
                        {day.dayNumber}
                      </span>
                      {day.isToday && (
                        <span className="text-[10px] font-bold text-indigo-600 hidden sm:inline">วันนี้</span>
                      )}
                    </div>

                    {/* Staffing Mini Badge */}
                    {day.isCurrentMonth && day.totalStaff > 0 && (
                      <span
                        title={`กำลังคนพร้อมปฏิบัติงาน ${day.onDutyCount} จาก ${day.totalStaff} คน (ลา ${day.onLeaveCount} คน)`}
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                          day.onLeaveCount === 0
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                            : day.isHighLeaveRisk
                            ? 'text-amber-800 bg-amber-100 border border-amber-300 font-bold animate-pulse'
                            : 'text-blue-700 bg-blue-50 border border-blue-200'
                        }`}
                      >
                        {day.onLeaveCount === 0 ? `พร้อม ${day.onDutyCount}` : `ลา ${day.onLeaveCount}`}
                      </span>
                    )}
                  </div>

                  {/* Day Items Container (Holidays, Company Events, Leaves) */}
                  <div className="space-y-1 my-1.5 flex-1 overflow-hidden">
                    
                    {/* 0. Weekly Thursday Day Off Banner */}
                    {day.isThursdayWeeklyDayOff && (
                      <div
                        title="วันหยุดประจำสัปดาห์ (ทุกวันพฤหัสบดี)"
                        className="px-1.5 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 rounded text-[10px] font-bold truncate flex items-center gap-1 shadow-2xs"
                      >
                        <Coffee className="w-2.5 h-2.5 shrink-0 text-amber-800" />
                        <span className="truncate">หยุดประจำสัปดาห์</span>
                      </div>
                    )}
                    
                    {/* 1. Public Holiday Banners */}
                    {day.holidays.map((h) => (
                      <div
                        key={h.id}
                        title={`วันหยุดนักขัตฤกษ์: ${h.nameThai} (${h.nameEnglish})`}
                        className="px-1.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-[10px] font-bold truncate flex items-center gap-1"
                      >
                        <Flag className="w-2.5 h-2.5 shrink-0 text-rose-600" />
                        <span className="truncate">{h.nameThai}</span>
                      </div>
                    ))}

                    {/* 2. Company Events */}
                    {day.events.slice(0, 2).map((evt) => {
                      const cfg = EVENT_CATEGORY_CONFIG[evt.category] || EVENT_CATEGORY_CONFIG.OTHER;
                      const CatIcon = cfg.icon;
                      return (
                        <div
                          key={evt.id}
                          title={`กิจกรรมบริษัท: ${evt.title} (${cfg.label}) • ${evt.targetDepartment === 'ALL' ? 'ทุกแผนก' : evt.targetDepartment}`}
                          className={`px-1.5 py-0.5 ${cfg.bg} border ${cfg.border} ${cfg.text} rounded text-[10px] font-bold truncate flex items-center gap-1`}
                        >
                          <CatIcon className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{evt.title}</span>
                        </div>
                      );
                    })}

                    {/* 3. Employee Leaves */}
                    {day.leaves.slice(0, 2).map((l) => {
                      const cfg = LEAVE_TYPE_CONFIG[l.type] || LEAVE_TYPE_CONFIG.SICK;
                      return (
                        <div
                          key={l.id}
                          title={`${l.employeeName} (${l.department}) - ${cfg.label} (${l.amount} วัน) เหตุผล: ${l.reason || '-'}`}
                          className={`px-1.5 py-0.5 ${cfg.bg} border border-slate-200 ${cfg.text} rounded text-[10px] font-medium truncate flex items-center justify-between gap-1`}
                        >
                          <div className="flex items-center gap-1 truncate">
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
                            <span className="font-bold truncate">{l.employeeName.split(' ')[0]}</span>
                          </div>
                          <span className="text-[9px] opacity-80 shrink-0">({cfg.label})</span>
                        </div>
                      );
                    })}

                    {/* Overflow indicator if many items */}
                    {day.holidays.length + day.events.length + day.leaves.length > 4 && (
                      <div className="text-[9px] text-slate-500 font-semibold px-1 text-center bg-slate-100/80 rounded py-0.2">
                        +{day.holidays.length + day.events.length + day.leaves.length - 4} รายการเพิ่มเติม...
                      </div>
                    )}
                  </div>

                  {/* Cell Footer: Quick Dept Warning if any */}
                  {day.isHighLeaveRisk && (
                    <div className="text-[9px] text-amber-800 font-bold bg-amber-50 px-1 py-0.5 rounded border border-amber-200 truncate flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                      <span className="truncate">
                        {day.highLeaveDepts.map(([dept, count]) => `${dept.replace('แผนก', '')}ลา ${count}`).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day Staffing Detail Modal (Day Inspector) */}
      {selectedDayDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    รายละเอียดกำลังคน & วาระประจำวัน
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(() => {
                      const d = new Date(selectedDayDetails.dateStr);
                      const dayOfWeek = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'][d.getDay()];
                      return `${dayOfWeek}ที่ ${d.getDate()} ${THAI_MONTHS[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543} (${selectedDayDetails.dateStr})`;
                    })()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDayDate(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1">
              
              {/* 0. Weekly Day Off (Thursday) */}
              {selectedDayDetails.isThursdayWeeklyDayOff && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-3 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
                    <Coffee className="w-5 h-5 text-amber-800" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-amber-900 flex items-center gap-2">
                      <span>วันหยุดประจำสัปดาห์ (ทุกวันพฤหัสบดี)</span>
                      <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                        Weekly Day Off
                      </span>
                    </div>
                    <div className="text-xs text-amber-700 mt-0.5">
                      วันหยุดปิดทำการประจำสัปดาห์ของร้าน/กิจการตามระเบียบองค์กร
                    </div>
                  </div>
                </div>
              )}

              {/* 1. Public Holiday Details if any */}
              {selectedDayDetails.holidays.length > 0 && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                    <Flag className="w-4 h-4 text-rose-600" />
                    <span>วันหยุดนักขัตฤกษ์ / วันหยุดราชการ</span>
                  </div>
                  {selectedDayDetails.holidays.map(h => (
                    <div key={h.id} className="bg-white/80 p-2.5 rounded-lg border border-rose-100 text-xs">
                      <div className="font-bold text-rose-900">{h.nameThai}</div>
                      <div className="text-rose-600 text-[11px]">{h.nameEnglish}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* 2. Company Events on this day */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>กิจกรรมและวาระขององค์กร ({selectedDayDetails.events.length})</span>
                  </h4>

                  <button
                    type="button"
                    onClick={() => {
                      setNewEventDate(selectedDayDetails.dateStr);
                      setIsAddEventModalOpen(true);
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>เพิ่มกิจกรรมในวันนี้</span>
                  </button>
                </div>

                {selectedDayDetails.events.length === 0 ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 text-center">
                    ไม่มีกิจกรรมหรือวาระบริษัทที่บันทึกไว้ในวันนี้
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDayDetails.events.map(evt => {
                      const cfg = EVENT_CATEGORY_CONFIG[evt.category] || EVENT_CATEGORY_CONFIG.OTHER;
                      const CatIcon = cfg.icon;
                      return (
                        <div key={evt.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <div className={`p-2 rounded-lg ${cfg.bg} ${cfg.text} border ${cfg.border} mt-0.5`}>
                              <CatIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900">{evt.title}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                                  {cfg.label}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                                <div><span className="font-medium text-slate-700">แผนกเป้าหมาย:</span> {evt.targetDepartment === 'ALL' ? 'ทุกแผนกในบริษัท' : evt.targetDepartment}</div>
                                {evt.location && <div><span className="font-medium text-slate-700">สถานที่:</span> {evt.location}</div>}
                                {evt.notes && <div className="text-slate-600 mt-1 italic">"{evt.notes}"</div>}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteCompanyEvent(evt.id)}
                            title="ลบกิจกรรมนี้"
                            className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Department Staffing Availability Breakdown */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>ความพร้อมของกำลังคนแยกตาม 5 แผนกหลัก</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DEPARTMENTS.map(dept => {
                    const totalInDept = activeEmployees.filter(e => e.department === dept).length;
                    const leavesInDept = selectedDayDetails.leaves.filter(l => l.department === dept);
                    const onDutyInDept = Math.max(0, totalInDept - leavesInDept.length);
                    const isDeptStrained = leavesInDept.length >= 2;
                    const isDeptPartial = leavesInDept.length === 1;

                    return (
                      <div
                        key={dept}
                        className={`p-3 rounded-xl border transition ${
                          isDeptStrained
                            ? 'bg-amber-50/70 border-amber-300'
                            : isDeptPartial
                            ? 'bg-blue-50/40 border-blue-200'
                            : 'bg-slate-50/70 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">{dept}</span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                              isDeptStrained
                                ? 'bg-amber-50 text-amber-900 border border-amber-300'
                                : isDeptPartial
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {isDeptStrained ? (
                              <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                            ) : !isDeptPartial ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            ) : null}
                            <span>{isDeptStrained ? 'ตึงตัว (ลา 2+ คน)' : isDeptPartial ? 'มีผู้ลา 1 คน' : 'กำลังคนพร้อม'}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-2 text-xs text-slate-600">
                          <span>พร้อมปฏิบัติงาน: <strong className="text-slate-900">{onDutyInDept}</strong> / {totalInDept} คน</span>
                          {leavesInDept.length > 0 && (
                            <span className="text-rose-600 font-semibold">
                              (ลา: {leavesInDept.map(l => l.employeeName.split(' ')[0]).join(', ')})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Employee Leave Records Detail */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>รายชื่อพนักงานที่บันทึกการลาในวันนี้ ({selectedDayDetails.leaves.length} คน)</span>
                  </h4>

                  {onAddAttendanceRecord && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuickLeaveDate(selectedDayDetails.dateStr);
                        setIsQuickLeaveModalOpen(true);
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>บันทึกการลาในวันนี้</span>
                    </button>
                  )}
                </div>

                {selectedDayDetails.leaves.length === 0 ? (
                  <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs text-emerald-800 text-center font-medium flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>ไม่มีพนักงานบันทึกการลาในวันนี้ — กำลังคนพร้อมปฏิบัติงานเต็มอัตรา</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDayDetails.leaves.map(l => {
                      const cfg = LEAVE_TYPE_CONFIG[l.type] || LEAVE_TYPE_CONFIG.SICK;
                      const empObj = employees.find(e => e.id === l.employeeId);
                      return (
                        <div key={l.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl ${cfg.bg} border border-slate-200 flex items-center justify-center ${cfg.text} font-bold text-xs`}>
                              {l.employeeName.slice(0, 2)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900">{l.employeeName}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border border-slate-200`}>
                                  {cfg.label} ({l.amount} วัน)
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                                <span>แผนก: <strong className="text-slate-700">{l.department}</strong></span>
                                {empObj?.phoneNumber && (
                                  <span className="flex items-center gap-1 text-slate-600">
                                    <Phone className="w-3 h-3" />
                                    {empObj.phoneNumber}
                                  </span>
                                )}
                              </div>
                              {l.reason && (
                                <p className="text-xs text-slate-600 mt-1 italic">
                                  เหตุผล: "{l.reason}"
                                </p>
                              )}
                            </div>
                          </div>

                          {onDeleteAttendanceRecord && (
                            <button
                              type="button"
                              onClick={() => onDeleteAttendanceRecord(l.id)}
                              title="ลบรายการลานี้"
                              className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                รวมกำลังคนพร้อมปฏิบัติงานวันนี้: <strong className="text-slate-800">{selectedDayDetails.onDutyCount}</strong> / {selectedDayDetails.totalStaff} คน
              </span>
              <button
                type="button"
                onClick={() => setSelectedDayDate(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Company Event Modal */}
      {isAddEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-indigo-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">เพิ่มกิจกรรมและวาระสำคัญของบริษัท</h3>
                  <p className="text-[11px] text-slate-500">กำหนดการประชุม อบรม ตรวจนับสต็อก หรือ Big Cleaning</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEventModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompanyEvent} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ชื่อกิจกรรม / วาระสำคัญ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="เช่น ประชุมพนักงานประจำเดือน, Big Cleaning Day, ตรวจนับสต็อก..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    หมวดหมู่กิจกรรม
                  </label>
                  <select
                    value={newEventCategory}
                    onChange={(e) => setNewEventCategory(e.target.value as CompanyEventCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 font-medium"
                  >
                    <option value="MEETING">การประชุม (Meeting)</option>
                    <option value="TRAINING">อบรม/สัมมนา (Training)</option>
                    <option value="AUDIT">ตรวจนับสต็อก/ตรวจเช็ก (Audit)</option>
                    <option value="MAINTENANCE">Big Cleaning / ซ่อมบำรุง</option>
                    <option value="CELEBRATION">สวัสดิการ / สังสรรค์ (Party)</option>
                    <option value="OTHER">กิจกรรมทั่วไป (Other)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    แผนกเป้าหมาย
                  </label>
                  <select
                    value={newEventDept}
                    onChange={(e) => setNewEventDept(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 font-medium"
                  >
                    <option value="ALL">ทุกแผนกในบริษัท</option>
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    วันที่เริ่มต้น <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    วันที่สิ้นสุด (กรณีหลายวัน)
                  </label>
                  <input
                    type="date"
                    value={newEventEndDate}
                    onChange={(e) => setNewEventEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  สถานที่จัดกิจกรรม
                </label>
                <input
                  type="text"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  placeholder="เช่น สำนักงานใหญ่ (เชียงใหม่), พื้นที่ครัวหลัก, ห้องประชุมชั้น 2..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  รายละเอียด / วาระการประชุม / คำชี้แจง
                </label>
                <textarea
                  rows={2}
                  value={newEventNotes}
                  onChange={(e) => setNewEventNotes(e.target.value)}
                  placeholder="ระบุวาระการประชุมหรือสิ่งที่พนักงานต้องเตรียมตัว..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-2xs transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกกิจกรรม</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Leave Modal from Calendar */}
      {isQuickLeaveModalOpen && onAddAttendanceRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">บันทึกการลาพนักงาน (Staff Leave Entry)</h3>
                  <p className="text-[11px] text-slate-300">ระบุการลาลงในปฏิทินกำลังคน</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickLeaveModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddLeave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  เลือกพนักงาน <span className="text-rose-500">*</span>
                </label>
                <select
                  value={leaveEmpId}
                  onChange={(e) => setLeaveEmpId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 font-semibold text-slate-800"
                >
                  {activeEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.id} - {emp.fullName} ({emp.department} • {emp.position})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ประเภทการลา <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as AttendanceEventType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 font-medium"
                  >
                    <option value="SICK">ลาป่วย (Sick Leave)</option>
                    <option value="BUSINESS">ลากิจ (Business Leave)</option>
                    <option value="ANNUAL">ลาพักผ่อนประจำปี (Annual Leave)</option>
                    <option value="OTHER_LEAVE">ลาอื่นๆ (Other Leave)</option>
                    <option value="ABSENT">ขาดงาน (Absent)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    จำนวน (วัน) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={leaveAmount}
                    onChange={(e) => setLeaveAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    วันที่เริ่มต้น <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={quickLeaveDate}
                    onChange={(e) => {
                      setQuickLeaveDate(e.target.value);
                      if (!leaveEndDate) setLeaveEndDate(e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    วันที่สิ้นสุด
                  </label>
                  <input
                    type="date"
                    value={leaveEndDate || quickLeaveDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  เหตุผล / รายละเอียดการลา
                </label>
                <input
                  type="text"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="เช่น มีใบรับรองแพทย์, ลากิจส่วนตัว, พักผ่อน..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickLeaveModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-2xs transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกการลา</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
