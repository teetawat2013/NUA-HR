import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  CalendarDays, 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Plus, 
  Check, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Filter, 
  DollarSign, 
  User, 
  Users, 
  ArrowRight, 
  ShieldAlert, 
  Info, 
  X, 
  Sparkles, 
  TrendingUp,
  Settings,
  CalendarCheck
} from 'lucide-react';
import { 
  Employee, 
  PartTimeAttendanceStatus, 
  PartTimeDayLog, 
  PartTimeEmployeeSummary, 
  PartTimeWeeklyOffConfig,
  DEPARTMENTS 
} from '../types';
import { THAI_MONTHS } from '../utils/payrollCalculator';
import { 
  calculateShiftHours, 
  calculateLateMinutes, 
  calculateDailyWage, 
  generateMonthlyPartTimeLogs, 
  aggregatePartTimeSummary, 
  exportPartTimeScheduleExcel, 
  exportPartTimeScheduleCsv,
  THAI_DAY_NAMES_SHORT,
  THAI_DAY_NAMES_FULL
} from '../utils/partTimeCalculator';
import { 
  loadPartTimeLogs, 
  savePartTimeLogs, 
  loadPartTimeConfigs, 
  savePartTimeConfigs 
} from '../utils/storage';
import { showSuccessAlert, showConfirmDialog, showToast } from '../utils/swal';

interface PartTimeAttendanceSectionProps {
  employees: Employee[];
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onAddEmployee?: () => void;
  onUpdateMonthlyAttendance?: (employeeId: string, month: number, year: number, stats: any) => void;
}

export const PartTimeAttendanceSection: React.FC<PartTimeAttendanceSectionProps> = ({
  employees,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  onAddEmployee,
  onUpdateMonthlyAttendance
}) => {
  // กรองพนักงานที่เป็น Part-time หรือรับเป็นรายชั่วโมง/รายวัน
  const partTimeEmployees = useMemo(() => {
    return employees.filter(e => 
      !e.resignation.isResigned && 
      (e.employmentType === 'PART_TIME' || e.employmentType === 'DAILY')
    );
  }, [employees]);

  // ตัวกรอง
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'matrix' | 'summary'>('matrix');

  // Logs & Configs จาก Storage
  const [allLogs, setAllLogs] = useState<PartTimeDayLog[]>(() => loadPartTimeLogs());
  const [configs, setConfigs] = useState<Record<string, PartTimeWeeklyOffConfig>>(() => loadPartTimeConfigs());

  // Modal State สำหรับบันทึก/แก้ไขเวลาและวันหยุด
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<PartTimeDayLog | null>(null);
  const [formEmployeeId, setFormEmployeeId] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<PartTimeAttendanceStatus>('WORKED');
  const [formClockIn, setFormClockIn] = useState<string>('10:00');
  const [formClockOut, setFormClockOut] = useState<string>('19:00');
  const [formBreakMinutes, setFormBreakMinutes] = useState<number>(60);
  const [formHourlyRate, setFormHourlyRate] = useState<number>(60);
  const [formNotes, setFormNotes] = useState<string>('');

  // Modal State สำหรับตั้งค่าวันหยุดประจำสัปดาห์ (Weekly Day Off)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configEmployee, setConfigEmployee] = useState<Employee | null>(null);
  const [configWeeklyOff, setConfigWeeklyOff] = useState<number[]>([4]); // Default: วันพฤหัสบดี
  const [configShiftIn, setConfigShiftIn] = useState<string>('10:00');
  const [configShiftOut, setConfigShiftOut] = useState<string>('19:00');
  const [configBreak, setConfigBreak] = useState<number>(60);
  const [configRate, setConfigRate] = useState<number>(60);

  // คำนวณจำนวนวันในเดือนที่เลือก
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // คำนวณ Logs และ Summary ของพนักงาน Part-time แต่ละคนในเดือนที่เลือก
  const summaries: PartTimeEmployeeSummary[] = useMemo(() => {
    // ถ้ายังไม่มีพนักงาน Part-time ให้ใช้พนักงานที่เลือกได้
    const targetEmployees = partTimeEmployees.length > 0 
      ? partTimeEmployees 
      : employees.filter(e => !e.resignation.isResigned);

    return targetEmployees.map(emp => {
      const empConfig = configs[emp.id];
      const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      const empMonthLogs = allLogs.filter(l => l.employeeId === emp.id && l.date.startsWith(monthPrefix));
      
      const generated = generateMonthlyPartTimeLogs(emp, selectedMonth, selectedYear, empConfig, empMonthLogs);
      return aggregatePartTimeSummary(emp, selectedMonth, selectedYear, generated, empConfig?.hourlyRate);
    });
  }, [partTimeEmployees, employees, selectedMonth, selectedYear, allLogs, configs]);

  // กรองตามแผนกและการค้นหา
  const filteredSummaries = useMemo(() => {
    return summaries.filter(s => {
      if (deptFilter !== 'ALL' && s.department !== deptFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.employeeName.toLowerCase().includes(q);
        const matchId = s.employeeId.toLowerCase().includes(q);
        if (!matchName && !matchId) return false;
      }
      return true;
    });
  }, [summaries, deptFilter, searchQuery]);

  // Real-time calculation ในหน้าต่างแก้ไขเวลารายวัน
  const liveCalculation = useMemo(() => {
    if (formStatus === 'WORKED' || formStatus === 'HOLIDAY_WORK') {
      const { totalHours, otHours, normalHours } = calculateShiftHours(
        formClockIn, 
        formClockOut, 
        formBreakMinutes, 
        8.0
      );
      const lateMinutes = calculateLateMinutes(formClockIn, '10:00');
      const { isPaid, totalWages, lateDeduction } = calculateDailyWage(
        formStatus, 
        totalHours, 
        otHours, 
        formHourlyRate, 
        lateMinutes
      );
      return { totalHours, normalHours, otHours, lateMinutes, totalWages, lateDeduction, isPaid };
    }
    return { 
      totalHours: 0, 
      normalHours: 0, 
      otHours: 0, 
      lateMinutes: 0, 
      totalWages: 0, 
      lateDeduction: 0, 
      isPaid: false 
    };
  }, [formStatus, formClockIn, formClockOut, formBreakMinutes, formHourlyRate]);

  // เปิด Modal แก้ไข Log ของวันใดวันหนึ่ง
  const handleOpenDayEdit = (emp: Employee, dateStr: string, currentLog?: PartTimeDayLog) => {
    const empConfig = configs[emp.id];
    const defaultRate = empConfig?.hourlyRate || (emp.salary ? Math.round(emp.salary / (30 * 8)) : 60);

    setEditingLog(currentLog || null);
    setFormEmployeeId(emp.id);
    setFormDate(dateStr);
    
    if (currentLog) {
      setFormStatus(currentLog.status);
      setFormClockIn(currentLog.clockIn || '10:00');
      setFormClockOut(currentLog.clockOut || '19:00');
      setFormBreakMinutes(currentLog.breakMinutes !== undefined ? currentLog.breakMinutes : 60);
      setFormHourlyRate(currentLog.hourlyRate || defaultRate);
      setFormNotes(currentLog.notes || '');
    } else {
      const dayOfWeek = new Date(dateStr).getDay();
      const isDayOff = (empConfig?.weeklyDayOffDays || [4]).includes(dayOfWeek);
      setFormStatus(isDayOff ? 'DAY_OFF' : 'WORKED');
      setFormClockIn(isDayOff ? '' : (empConfig?.defaultShiftIn || '10:00'));
      setFormClockOut(isDayOff ? '' : (empConfig?.defaultShiftOut || '19:00'));
      setFormBreakMinutes(isDayOff ? 0 : (empConfig?.defaultBreakMinutes !== undefined ? empConfig.defaultBreakMinutes : 60));
      setFormHourlyRate(defaultRate);
      setFormNotes('');
    }

    setIsEditModalOpen(true);
  };

  // บันทึก Log วัน
  const handleSaveDayLog = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = employees.find(emp => emp.id === formEmployeeId);
    if (!targetEmp) return;

    const dateObj = new Date(formDate);
    const dayOfWeek = dateObj.getDay();

    const isWorking = formStatus === 'WORKED' || formStatus === 'HOLIDAY_WORK';
    const clockIn = isWorking ? formClockIn : '';
    const clockOut = isWorking ? formClockOut : '';
    const breakMinutes = isWorking ? formBreakMinutes : 0;

    const { totalHours, otHours, normalHours } = isWorking
      ? calculateShiftHours(clockIn, clockOut, breakMinutes, 8.0)
      : { totalHours: 0, otHours: 0, normalHours: 0 };

    const lateMinutes = isWorking ? calculateLateMinutes(clockIn, '10:00') : 0;
    const { isPaid, totalWages, unpaidReasonNote } = calculateDailyWage(
      formStatus,
      totalHours,
      otHours,
      formHourlyRate,
      lateMinutes
    );

    const newLog: PartTimeDayLog = {
      id: `PTL-${targetEmp.id}-${formDate}`,
      employeeId: targetEmp.id,
      employeeName: targetEmp.fullName,
      department: targetEmp.department,
      date: formDate,
      dayOfWeek,
      status: formStatus,
      clockIn,
      clockOut,
      breakMinutes,
      totalHoursWorked: totalHours,
      standardHours: 8.0,
      otHours,
      lateMinutes,
      hourlyRate: formHourlyRate,
      isPaid,
      unpaidReasonNote,
      totalWages,
      notes: formNotes
    };

    // อัปเดตใน State & Storage
    const updated = allLogs.filter(l => !(l.employeeId === targetEmp.id && l.date === formDate));
    updated.push(newLog);
    setAllLogs(updated);
    savePartTimeLogs(updated);

    // Sync กลับเข้า Monthly Attendance ของพนักงาน (ถ้ามี callback)
    if (onUpdateMonthlyAttendance) {
      const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      const empLogs = updated.filter(l => l.employeeId === targetEmp.id && l.date.startsWith(monthPrefix));
      const summary = aggregatePartTimeSummary(targetEmp, selectedMonth, selectedYear, empLogs, formHourlyRate);
      
      onUpdateMonthlyAttendance(targetEmp.id, selectedMonth, selectedYear, {
        absentDays: summary.absentDays,
        sickLeaveDays: summary.sickLeaveDays,
        businessLeaveDays: summary.businessLeaveDays,
        otherLeaveDays: summary.otherLeaveDays,
        lateCount: summary.lateCount,
        lateMinutes: summary.lateMinutes,
        otHours: summary.otHours
      });
    }

    setIsEditModalOpen(false);
    showToast('บันทึกเวลาและสถานะเรียบร้อยแล้ว', 'success');
  };

  // เปิด Modal ตั้งค่าวันหยุดประจำสัปดาห์
  const handleOpenConfigModal = (emp: Employee) => {
    const existingConfig = configs[emp.id];
    setConfigEmployee(emp);
    setConfigWeeklyOff(existingConfig?.weeklyDayOffDays || [4]); // Default Thursday
    setConfigShiftIn(existingConfig?.defaultShiftIn || '10:00');
    setConfigShiftOut(existingConfig?.defaultShiftOut || '19:00');
    setConfigBreak(existingConfig?.defaultBreakMinutes !== undefined ? existingConfig.defaultBreakMinutes : 60);
    setConfigRate(existingConfig?.hourlyRate || (emp.salary ? Math.round(emp.salary / (30 * 8)) : 60));
    setIsConfigModalOpen(true);
  };

  // บันทึกการตั้งค่าวันหยุดประจำสัปดาห์
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configEmployee) return;

    const newConfig: PartTimeWeeklyOffConfig = {
      employeeId: configEmployee.id,
      weeklyDayOffDays: configWeeklyOff,
      defaultShiftIn: configShiftIn,
      defaultShiftOut: configShiftOut,
      defaultBreakMinutes: Number(configBreak) || 0,
      hourlyRate: Number(configRate) || 60
    };

    const updated = {
      ...configs,
      [configEmployee.id]: newConfig
    };
    setConfigs(updated);
    savePartTimeConfigs(updated);
    setIsConfigModalOpen(false);
    showSuccessAlert(
      'บันทึกตารางวันหยุดสำเร็จ',
      `กำหนดวันหยุดประจำสัปดาห์และกะทำงานของ ${configEmployee.fullName} เรียบร้อยแล้ว`
    );
  };

  // สลับการติ๊กวันหยุดประจำสัปดาห์
  const toggleWeeklyDayOff = (dayIdx: number) => {
    if (configWeeklyOff.includes(dayIdx)) {
      setConfigWeeklyOff(configWeeklyOff.filter(d => d !== dayIdx));
    } else {
      setConfigWeeklyOff([...configWeeklyOff, dayIdx]);
    }
  };

  // ส่งออก Excel ทันที
  const handleExportExcel = () => {
    if (filteredSummaries.length === 0) {
      showToast('ไม่พบข้อมูลสำหรับส่งออก', 'error');
      return;
    }
    exportPartTimeScheduleExcel(filteredSummaries, selectedMonth, selectedYear);
    showToast('ส่งออกตาราง Excel สำเร็จแล้ว', 'success');
  };

  // ส่งออก CSV ทันที
  const handleExportCsv = () => {
    if (filteredSummaries.length === 0) {
      showToast('ไม่พบข้อมูลสำหรับส่งออก', 'error');
      return;
    }
    exportPartTimeScheduleCsv(filteredSummaries, selectedMonth, selectedYear);
    showToast('ส่งออกไฟล์ CSV สำเร็จแล้ว', 'success');
  };

  // พิมพ์รายงานสรุป
  const handlePrint = () => {
    window.print();
  };

  // ฟังก์ชันช่วยเหลือสำหรับแสดง Badge สีของแต่ละสถานะในตาราง
  const renderStatusBadge = (log: PartTimeDayLog) => {
    switch (log.status) {
      case 'WORKED':
        return (
          <span className="inline-flex flex-col items-center justify-center p-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 w-full text-center leading-tight">
            <span>{log.totalHoursWorked} ชม.</span>
            <span className="text-[9px] text-emerald-600 font-normal">
              {log.clockIn?.slice(0, 5) || '10:00'}
            </span>
          </span>
        );
      case 'DAY_OFF':
        return (
          <span className="inline-flex items-center justify-center p-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 w-full text-center">
            หยุดประจำ
          </span>
        );
      case 'HOLIDAY_OFF':
        return (
          <span className="inline-flex items-center justify-center p-1 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 w-full text-center">
            หยุดนักขัต
          </span>
        );
      case 'HOLIDAY_WORK':
        return (
          <span className="inline-flex flex-col items-center justify-center p-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-300 w-full text-center leading-tight">
            <span>{log.totalHoursWorked} ชม.</span>
            <span className="text-[9px] text-blue-600 font-bold">1.5x</span>
          </span>
        );
      case 'ABSENT':
        return (
          <span className="inline-flex items-center justify-center p-1 rounded-md text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-300 w-full text-center">
            ขาดงาน
          </span>
        );
      case 'SICK':
        return (
          <span className="inline-flex flex-col items-center justify-center p-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 w-full text-center leading-tight">
            <span>ลาป่วย</span>
            <span className="text-[8px] text-amber-700">ไม่รับเงิน</span>
          </span>
        );
      case 'BUSINESS':
        return (
          <span className="inline-flex flex-col items-center justify-center p-1 rounded-md text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-300 w-full text-center leading-tight">
            <span>ลากิจ</span>
            <span className="text-[8px] text-sky-700">ไม่รับเงิน</span>
          </span>
        );
      case 'OTHER_LEAVE':
        return (
          <span className="inline-flex flex-col items-center justify-center p-1 rounded-md text-[10px] font-bold bg-violet-50 text-violet-800 border border-violet-200 w-full text-center leading-tight">
            <span>ลาอื่นๆ</span>
            <span className="text-[8px] text-violet-700">ไม่รับเงิน</span>
          </span>
        );
      default:
        return null;
    }
  };

  // รวมค่าสถิติทั่วทั้งเดือน
  const totalMonthMetrics = useMemo(() => {
    let hours = 0;
    let ot = 0;
    let wages = 0;
    let absent = 0;
    let sick = 0;
    let business = 0;
    let late = 0;

    filteredSummaries.forEach(s => {
      hours += s.totalHours;
      ot += s.otHours;
      wages += s.netWage;
      absent += s.absentDays;
      sick += s.sickLeaveDays;
      business += s.businessLeaveDays;
      late += s.lateCount;
    });

    return {
      hours: Math.round(hours * 10) / 10,
      ot: Math.round(ot * 10) / 10,
      wages: Math.round(wages),
      absent,
      sick,
      business,
      late
    };
  }, [filteredSummaries]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Banner & Quick Controls */}
      <div className="bg-gradient-to-r from-[#6e1422] via-[#8B1C2D] to-[#550c18] rounded-3xl p-5 sm:p-7 text-white shadow-lg relative overflow-hidden border border-[#8B1C2D]/40">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 text-xs font-bold bg-[#F0E7C2]/20 text-[#F0E7C2] rounded-full border border-[#F0E7C2]/30 backdrop-blur-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>ตารางวันหยุด & บันทึกเวลาทำงาน Part-time</span>
              </span>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>คำนวณชั่วโมงอัตโนมัติ 100%</span>
              </span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>ตารางวันหยุด ขาด ลา มาสาย และชั่วโมง Part-time</span>
            </h2>
            
            <p className="text-xs sm:text-sm text-[#F0E7C2]/90 max-w-2xl leading-relaxed">
              กำหนดวันหยุดประจำสัปดาห์ คำนวณชั่วโมงทำงานสุทธิและ OT อัตโนมัติจากเวลาเข้า-ออกงาน พร้อมหักวันขาด ลาป่วย ลากิจ (Passtime ไม่ได้รับเงิน) และส่งออกไฟล์ Excel/CSV ได้ทันที
            </p>
          </div>

          {/* Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer hover:shadow-lg transform active:scale-95"
              title="ส่งออกตารางสรุปและรายวันเป็นไฟล์ Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ส่งออก Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 backdrop-blur-xs transition cursor-pointer"
              title="ส่งออกเป็นไฟล์ CSV พร้อมภาษาไทยสมบูรณ์"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออก CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 backdrop-blur-xs transition cursor-pointer"
              title="พิมพ์ตารางรายงาน"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์</span>
            </button>
          </div>
        </div>
      </div>

      {/* Policy Notification Box */}
      <div className="bg-[#FAF6EC] border border-[#E8DCB5] p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-[#52131D]">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#8B1C2D] flex items-center justify-center shrink-0 text-[#F0E7C2] font-bold shadow-xs mt-0.5">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <strong className="text-[#641522] font-black text-sm">กฎเกณฑ์การคำนวณและสิทธิประโยชน์ Part-time (Passtime):</strong>
              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                ทุกการลาไม่ได้รับเงิน (Unpaid 100%)
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              • <strong>เวลาทำงานจริง:</strong> คิดจาก (เวลาออกงาน - เวลาเข้างาน) ลบเวลาพัก (นาที) อัตโนมัติ • <strong>ล่วงเวลา (OT):</strong> คำนวณอัตโนมัติหากเกินกะปกติ (คิดเรท 1.5 เท่า) • <strong>ขาด ลาป่วย ลากิจ:</strong> พนักงาน Part-time จะไม่ได้รับค่าจ้างในวันที่ลาหรือขาด • <strong>วันหยุดประจำสัปดาห์:</strong> กำหนดวันหยุดประจำของแต่ละคนได้อิสระ
            </p>
          </div>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500">พนักงาน Part-time</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{filteredSummaries.length}</span>
            <span className="text-xs text-slate-500 font-medium">คน</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">ประจำเดือน {THAI_MONTHS[selectedMonth - 1]}</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500">รวมชั่วโมงทำงานสุทธิ</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{totalMonthMetrics.hours}</span>
            <span className="text-xs text-slate-500 font-medium">ชม. (OT {totalMonthMetrics.ot})</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">คำนวณหักเวลาพักเรียบร้อย</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500">ขาด / ลาป่วย / ลากิจ</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600">
              {totalMonthMetrics.absent + totalMonthMetrics.sick + totalMonthMetrics.business}
            </span>
            <span className="text-xs text-slate-500 font-medium">วัน (ไม่รับเงิน)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            ขาด {totalMonthMetrics.absent} • ป่วย {totalMonthMetrics.sick} • กิจ {totalMonthMetrics.business}
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500">รวมเงินค่าจ้างสุทธิ</span>
            <div className="w-7 h-7 rounded-lg bg-[#8B1C2D]/10 text-[#8B1C2D] flex items-center justify-center font-bold text-xs">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#8B1C2D]">
              {totalMonthMetrics.wages.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-medium">บาท</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">พร้อมนำเข้าคำนวณ Payroll</p>
        </div>
      </div>

      {/* Main Table & Filter Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        
        {/* Controls Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Month & Year + View Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-800 px-2 py-1 outline-none cursor-pointer"
              >
                {THAI_MONTHS.map((m, idx) => (
                  <option key={idx} value={idx + 1}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => onYearChange(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-800 px-2 py-1 outline-none cursor-pointer"
              >
                <option value={2026}>2569 (2026)</option>
                <option value={2025}>2568 (2025)</option>
              </select>
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'matrix' 
                    ? 'bg-white text-slate-900 shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>ตารางรายวัน & วันหยุด (Matrix)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('summary')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'summary' 
                    ? 'bg-white text-slate-900 shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>สรุปชั่วโมงและเงินเดือน (Summary)</span>
              </button>
            </div>
          </div>

          {/* Search, Dept Filter & Add Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ / รหัสพนักงาน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1C2D]/20 w-44 sm:w-56"
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">ทุกแผนก</option>
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <button
              onClick={() => {
                const firstEmp = filteredSummaries[0];
                if (firstEmp) {
                  const emp = employees.find(e => e.id === firstEmp.employeeId);
                  if (emp) {
                    handleOpenDayEdit(emp, new Date().toISOString().split('T')[0]);
                  }
                }
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#8B1C2D] hover:bg-[#6e1422] text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#F0E7C2]" />
              <span>+ บันทึกด่วน</span>
            </button>
          </div>
        </div>

        {/* VIEW MODE 1: MATRIX VIEW (ตารางรายวัน & วันหยุด) */}
        {viewMode === 'matrix' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-3 w-48 sticky left-0 bg-slate-50 z-20 shadow-xs">
                    พนักงาน Part-time
                  </th>
                  <th className="py-3 px-2 w-24 text-center">วันหยุดประจำ</th>
                  <th className="py-3 px-2 w-20 text-center">เรท/ชม.</th>
                  
                  {/* Days 1..N */}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dateObj = new Date(selectedYear, selectedMonth - 1, dayNum);
                    const dayOfWeek = dateObj.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const isThursday = dayOfWeek === 4;

                    return (
                      <th 
                        key={dayNum} 
                        className={`py-2 px-1 text-center min-w-[44px] border-l border-slate-200 ${
                          isThursday 
                            ? 'bg-amber-50/70 text-amber-900 font-black' 
                            : isWeekend 
                            ? 'bg-slate-100/70 text-slate-700' 
                            : 'text-slate-600'
                        }`}
                      >
                        <div className="text-[10px] leading-tight text-slate-500 font-semibold">
                          {THAI_DAY_NAMES_SHORT[dayOfWeek]}
                        </div>
                        <div className="text-xs font-bold">
                          {dayNum}
                        </div>
                      </th>
                    );
                  })}

                  <th className="py-3 px-3 w-28 text-center bg-slate-100/70 font-black border-l border-slate-200 sticky right-0 z-10 shadow-xs">
                    รวมสุทธิ (บาท)
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={daysInMonth + 4} className="py-12 text-center text-slate-400">
                      <div className="max-w-md mx-auto space-y-3">
                        <Users className="w-10 h-10 text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-600 text-sm">ยังไม่พบข้อมูลพนักงาน Part-time ในเดือนนี้</p>
                        <p className="text-xs text-slate-400">
                          คุณสามารถเพิ่มพนักงาน Part-time ในระบบ หรือคลิกปุ่มด้านล่างเพื่อสลับสถานะการจ้าง
                        </p>
                        {onAddEmployee && (
                          <button
                            onClick={onAddEmployee}
                            className="px-4 py-2 bg-[#8B1C2D] text-white rounded-xl font-bold text-xs shadow-xs hover:bg-[#6e1422] transition inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5 text-[#F0E7C2]" />
                            <span>+ เพิ่มพนักงาน Part-time</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSummaries.map((summary) => {
                    const emp = employees.find(e => e.id === summary.employeeId);
                    if (!emp) return null;
                    const empConfig = configs[emp.id];
                    const weeklyOffList = empConfig?.weeklyDayOffDays || [4];

                    return (
                      <tr key={summary.employeeId} className="hover:bg-slate-50/60 transition group">
                        
                        {/* Employee Column (Sticky Left) */}
                        <td className="py-2.5 px-3 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-xs">
                          <div className="flex items-center justify-between gap-1">
                            <div>
                              <div className="font-bold text-slate-900 text-xs">
                                {summary.employeeName}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {summary.employeeId} • {summary.department}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenConfigModal(emp)}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                              title="ตั้งค่าวันหยุดประจำสัปดาห์ & กะทำงาน"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Weekly Day Off Label */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenConfigModal(emp)}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
                            title="คลิกเพื่อแก้ไขวันหยุดประจำสัปดาห์"
                          >
                            {weeklyOffList.map(d => THAI_DAY_NAMES_SHORT[d]).join(', ') || 'ไม่มี'}
                          </button>
                        </td>

                        {/* Hourly Rate */}
                        <td className="py-2.5 px-2 text-center font-bold text-slate-700 text-xs">
                          {summary.hourlyRate} บ.
                        </td>

                        {/* Day Cells 1..N */}
                        {summary.dailyLogs.map((log) => {
                          const isThursday = log.dayOfWeek === 4;

                          return (
                            <td 
                              key={log.date}
                              onClick={() => handleOpenDayEdit(emp, log.date, log)}
                              className={`p-1 text-center border-l border-slate-100 cursor-pointer hover:ring-2 hover:ring-[#8B1C2D]/40 transition ${
                                isThursday ? 'bg-amber-50/30' : ''
                              }`}
                              title={`${log.date} (${THAI_DAY_NAMES_FULL[log.dayOfWeek]}): คลิกเพื่อแก้ไขเวลา/สถานะ`}
                            >
                              {renderStatusBadge(log)}
                            </td>
                          );
                        })}

                        {/* Total Monthly Wage (Sticky Right) */}
                        <td className="py-2.5 px-3 text-right font-black text-[#8B1C2D] text-xs bg-white group-hover:bg-slate-50 sticky right-0 z-10 shadow-xs border-l border-slate-200">
                          <div>{summary.netWage.toLocaleString()} บ.</div>
                          <div className="text-[10px] font-normal text-slate-500">
                            ({summary.totalHours} ชม.)
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW MODE 2: SUMMARY VIEW (สรุปรายบุคคล) */}
        {viewMode === 'summary' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[950px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">รหัส / ชื่อพนักงาน</th>
                  <th className="py-3 px-3">แผนก</th>
                  <th className="py-3 px-3 text-center">อัตรา (บาท/ชม.)</th>
                  <th className="py-3 px-3 text-center">วันทำงาน</th>
                  <th className="py-3 px-3 text-center">วันหยุด</th>
                  <th className="py-3 px-3 text-center text-rose-700">ขาดงาน</th>
                  <th className="py-3 px-3 text-center text-amber-700">ลาป่วย (ไม่รับเงิน)</th>
                  <th className="py-3 px-3 text-center text-sky-700">ลากิจ (ไม่รับเงิน)</th>
                  <th className="py-3 px-3 text-center">มาสาย (นาที)</th>
                  <th className="py-3 px-3 text-center">ชั่วโมงปกติ</th>
                  <th className="py-3 px-3 text-center">OT (ชม.)</th>
                  <th className="py-3 px-3 text-center font-bold text-emerald-700">รวมชั่วโมง</th>
                  <th className="py-3 px-4 text-right font-black text-[#8B1C2D]">รวมเงินสุทธิ</th>
                  <th className="py-3 px-3 text-center">การจัดการ</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-8 text-center text-slate-400">
                      ไม่พบข้อมูลพนักงาน Part-time
                    </td>
                  </tr>
                ) : (
                  filteredSummaries.map((summary) => {
                    const emp = employees.find(e => e.id === summary.employeeId);
                    if (!emp) return null;

                    return (
                      <tr key={summary.employeeId} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{summary.employeeName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{summary.employeeId}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {summary.department}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-800">
                          {summary.hourlyRate}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-700 bg-emerald-50/30">
                          {summary.daysWorked} วัน
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600">
                          {summary.daysOff} วัน
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-rose-600">
                          {summary.absentDays}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-amber-600">
                          {summary.sickLeaveDays}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-sky-600">
                          {summary.businessLeaveDays}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-700">
                          {summary.lateCount > 0 ? (
                            <span className="text-amber-800 font-bold">{summary.lateCount} ครั้ง ({summary.lateMinutes} น.)</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-700 font-medium">
                          {summary.normalHours}
                        </td>
                        <td className="py-3 px-3 text-center text-blue-700 font-bold">
                          {summary.otHours > 0 ? `${summary.otHours}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-center font-black text-emerald-800 bg-emerald-50/50">
                          {summary.totalHours} ชม.
                        </td>
                        <td className="py-3 px-4 text-right font-black text-sm text-[#8B1C2D]">
                          {summary.netWage.toLocaleString()} บาท
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenConfigModal(emp)}
                            className="p-1.5 text-slate-500 hover:text-[#8B1C2D] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="แก้ไขตารางวันหยุด & กะทำงาน"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: EDIT / RECORD DAILY ATTENDANCE & LEAVE (แก้ไขเวลา & ขาดลา) */}
      {/* ==================================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#8B1C2D]/10 text-[#8B1C2D] flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    บันทึกเวลา & ขาด ลา มาสาย Part-time
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    คำนวณชั่วโมงสุทธิและค่าตอบแทนอัตโนมัติตามนโยบาย
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDayLog} className="space-y-4">
              
              {/* Employee & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    พนักงาน Part-time
                  </label>
                  <select
                    value={formEmployeeId}
                    onChange={(e) => setFormEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-[#8B1C2D]/20"
                    disabled={!!editingLog}
                  >
                    {employees.filter(e => !e.resignation.isResigned).map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    วันที่
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-[#8B1C2D]/20"
                    disabled={!!editingLog}
                  />
                </div>
              </div>

              {/* Status Radio / Select */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">
                  สถานะการทำงาน & การลา:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'WORKED', label: 'มาทำงาน', desc: 'คิดชั่วโมงจริง' },
                    { id: 'DAY_OFF', label: 'วันหยุดประจำ', desc: 'ไม่มีค่าจ้าง' },
                    { id: 'SICK', label: 'ลาป่วย', desc: 'ไม่รับเงิน (Passtime)' },
                    { id: 'BUSINESS', label: 'ลากิจ', desc: 'ไม่รับเงิน (Passtime)' },
                    { id: 'ABSENT', label: 'ขาดงาน', desc: 'ไม่รับเงิน' },
                    { id: 'HOLIDAY_WORK', label: 'ทำงานวันหยุด', desc: 'เรทพิเศษ 1.5x' },
                    { id: 'HOLIDAY_OFF', label: 'หยุดนักขัตฤกษ์', desc: 'ตามตาราง' },
                    { id: 'OTHER_LEAVE', label: 'ลาอื่นๆ', desc: 'ไม่รับเงิน' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setFormStatus(st.id as PartTimeAttendanceStatus)}
                      className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                        formStatus === st.id
                          ? 'bg-[#8B1C2D]/10 border-[#8B1C2D] text-[#8B1C2D] ring-2 ring-[#8B1C2D]/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold text-xs">{st.label}</div>
                      <div className="text-[9px] text-slate-500">{st.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Shift Hours Input (Only if WORKED or HOLIDAY_WORK) */}
              {(formStatus === 'WORKED' || formStatus === 'HOLIDAY_WORK') && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="font-bold text-xs text-slate-800 block">
                    กำหนดเวลาเข้า-ออกงาน (คำนวณชั่วโมงอัตโนมัติ):
                  </span>
                  
                  <div className="grid grid-cols-3 gap-2.5 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1 text-[11px]">เวลาเข้างาน</label>
                      <input
                        type="time"
                        value={formClockIn}
                        onChange={(e) => setFormClockIn(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1 text-[11px]">เวลาออกงาน</label>
                      <input
                        type="time"
                        value={formClockOut}
                        onChange={(e) => setFormClockOut(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1 text-[11px]">เวลาพัก (นาที)</label>
                      <input
                        type="number"
                        min={0}
                        step={15}
                        value={formBreakMinutes}
                        onChange={(e) => setFormBreakMinutes(Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold outline-none"
                      />
                    </div>
                  </div>

                  {/* Hourly Rate */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-semibold">อัตราค่าจ้างต่อชั่วโมง:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={30}
                        step={5}
                        value={formHourlyRate}
                        onChange={(e) => setFormHourlyRate(Number(e.target.value) || 60)}
                        className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right outline-none"
                      />
                      <span className="text-slate-500 font-bold">บาท/ชม.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Real-time Calculation Result Box */}
              <div className="p-3.5 rounded-2xl bg-[#FAF6EC] border border-[#E8DCB5] space-y-2 text-xs">
                <span className="font-bold text-[#8B1C2D] block flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ผลลัพธ์การคำนวณอัตโนมัติ (Live Preview):</span>
                </span>

                {(formStatus === 'WORKED' || formStatus === 'HOLIDAY_WORK') ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 block">ชม. ทำงานสุทธิ:</span>
                      <strong className="text-sm font-black text-emerald-700">{liveCalculation.totalHours} ชม.</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">ล่วงเวลา (OT):</span>
                      <strong className="text-sm font-black text-blue-700">{liveCalculation.otHours} ชม.</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">มาสาย:</span>
                      <strong className="text-xs font-bold text-slate-700">{liveCalculation.lateMinutes} นาที</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">ค่าจ้างรวมวันนี้:</span>
                      <strong className="text-sm font-black text-[#8B1C2D]">{liveCalculation.totalWages.toLocaleString()} บาท</strong>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-600 space-y-1">
                    <p className="font-bold text-slate-800">
                      สถานะ: {formStatus === 'DAY_OFF' ? 'วันหยุดประจำสัปดาห์' : formStatus === 'HOLIDAY_OFF' ? 'วันหยุดนักขัตฤกษ์' : formStatus === 'SICK' ? 'ลาป่วย (Unpaid)' : formStatus === 'BUSINESS' ? 'ลากิจ (Unpaid)' : 'ขาดงาน'}
                    </p>
                    <p className="text-[11px] text-rose-700 font-semibold">
                      เงื่อนไข: Passtime ทุกการลาไม่ได้รับเงิน (ค่าจ้าง 0 บาท)
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">หมายเหตุเพิ่มเติม:</label>
                <input
                  type="text"
                  placeholder="เช่น สลับเวร, มีใบรับรองแพทย์, ทำงานแทน..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#8B1C2D]/20"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#8B1C2D] hover:bg-[#6e1422] text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  บันทึกข้อมูล
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: CONFIGURE WEEKLY DAY-OFF & DEFAULTS (ตั้งค่าวันหยุดประจำสัปดาห์) */}
      {/* ==================================================================== */}
      {isConfigModalOpen && configEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    ตั้งค่าวันหยุดประจำสัปดาห์
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {configEmployee.fullName} ({configEmployee.id})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              
              {/* Day Off Selector (Checkboxes) */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  เลือกวันหยุดประจำสัปดาห์ (Weekly Day Off):
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  ระบบจะกำหนดให้วันเหล่านี้เป็น "วันหยุด" ในตารางโดยอัตโนมัติ (เช่น ร้านหยุดทุกวันพฤหัสบดี)
                </p>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {THAI_DAY_NAMES_FULL.map((name, idx) => {
                    const isSelected = configWeeklyOff.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleWeeklyDayOff(idx)}
                        className={`p-2 rounded-xl text-center border font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#8B1C2D] border-[#8B1C2D] text-white shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-[11px]">{THAI_DAY_NAMES_SHORT[idx]}</div>
                        <div className="text-[9px] font-normal">{isSelected ? 'หยุด' : 'ทำงาน'}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default Shift Times */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-700 block">เวลากะทำงานมาตรฐานของพนักงาน:</span>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">เวลาเข้า</label>
                    <input
                      type="time"
                      value={configShiftIn}
                      onChange={(e) => setConfigShiftIn(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">เวลาออก</label>
                    <input
                      type="time"
                      value={configShiftOut}
                      onChange={(e) => setConfigShiftOut(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">พัก (นาที)</label>
                    <input
                      type="number"
                      step={15}
                      value={configBreak}
                      onChange={(e) => setConfigBreak(Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">อัตราค่าจ้างต่อชั่วโมง:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={30}
                      step={5}
                      value={configRate}
                      onChange={(e) => setConfigRate(Number(e.target.value) || 60)}
                      className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-right font-bold outline-none"
                    />
                    <span className="text-slate-600 font-bold">บาท</span>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#8B1C2D] hover:bg-[#6e1422] text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  บันทึกตารางวันหยุด
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
