import React, { useState } from 'react';
import { 
  Users, 
  Globe2, 
  CalendarClock, 
  UserMinus, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  FileText,
  ShieldAlert,
  UserCheck,
  Plus,
  BarChart3,
  Activity,
  Timer,
  Calendar,
  BellRing,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  FileSpreadsheet,
  Cake,
  PartyPopper,
  Zap,
  AlertOctagon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';
import { Employee, AttendanceRecord, AttendanceEventType, MonthlyAttendance, BirthdayEventNote } from '../types';
import { getExpiryStatus, THAI_MONTHS } from '../utils/payrollCalculator';
import { FingerprintAttendanceModal } from './FingerprintAttendanceModal';
import { BirthdaySection } from './BirthdaySection';

interface DashboardViewProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  onNavigateTab: (tab: any) => void;
  onOpenAddModal: () => void;
  onSelectEmployee: (employee: Employee) => void;
  onOpenUrgentAlertModal?: () => void;
  urgent7DayCount?: number;
  onApplyAttendanceToSystem?: (
    employeeId: string, 
    month: number, 
    year: number, 
    stats: Partial<MonthlyAttendance>
  ) => void;
  onAddAttendanceRecord?: (record: Omit<AttendanceRecord, 'id' | 'recordedAt'>) => void;
  onUpdateBirthdayNote?: (employeeId: string, note: BirthdayEventNote) => void;
}

export interface ExpiringDocDetail {
  docType: string;
  docNameTh: string;
  expiryDate: string;
  daysLeft: number;
  isExpired: boolean;
  isCrit15: boolean;
  isCrit30: boolean;
  label: string;
  badgeClass: string;
}

export interface ExpiringEmployeeAlert {
  employee: Employee;
  documents: ExpiringDocDetail[];
  minDaysLeft: number;
  hasExpired: boolean;
  hasCrit15: boolean;
  hasCrit30: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  employees,
  attendanceRecords,
  onNavigateTab,
  onOpenAddModal,
  onSelectEmployee,
  onOpenUrgentAlertModal,
  urgent7DayCount = 0,
  onApplyAttendanceToSystem,
  onAddAttendanceRecord,
  onUpdateBirthdayNote,
}) => {
  const [chartMode, setChartMode] = useState<'TREND' | 'ATTENDANCE' | 'OVERTIME'>('TREND');
  const [trendMetric, setTrendMetric] = useState<'BOTH' | 'ABSENT' | 'LATE'>('BOTH');
  const [expiryBadgeFilter, setExpiryBadgeFilter] = useState<'ALL' | 'EXPIRED' | 'CRIT_15' | 'CRIT_30'>('ALL');
  const [isAlertBannerExpanded, setIsAlertBannerExpanded] = useState<boolean>(true);
  const [foreignAlertMode, setForeignAlertMode] = useState<'EXPIRING_30' | 'ALL_60'>('EXPIRING_30');
  const [deptChartType, setDeptChartType] = useState<'GROUPED' | 'STACKED'>('GROUPED');
  const [isFingerprintModalOpen, setIsFingerprintModalOpen] = useState<boolean>(false);

  const activeEmployees = employees.filter(e => !e.resignation.isResigned);
  const thaiEmployees = activeEmployees.filter(e => !e.isForeignWorker);
  const foreignEmployees = activeEmployees.filter(e => e.isForeignWorker);

  // Birthday Calculations for Dashboard
  const currentDate = new Date();
  const currentMonthNum = currentDate.getMonth() + 1;
  const currentDayNum = currentDate.getDate();

  const birthdaysThisMonth = activeEmployees.filter(e => {
    if (!e.birthDate) return false;
    const parts = e.birthDate.split('-');
    return parts.length >= 2 && parseInt(parts[1], 10) === currentMonthNum;
  });

  const birthdaysToday = birthdaysThisMonth.filter(e => {
    const parts = e.birthDate.split('-');
    return parts.length >= 3 && parseInt(parts[2], 10) === currentDayNum;
  });

  // Department Workforce Data for Recharts Bar Chart (Thai vs Foreign by Department)
  const departmentWorkforceData = React.useMemo(() => {
    const deptSet = new Set<string>();
    activeEmployees.forEach(e => {
      if (e.department) deptSet.add(e.department);
    });
    if (deptSet.size === 0) {
      deptSet.add('FRONT1');
      deptSet.add('KITCHEN1');
      deptSet.add('SERVICE');
    }

    const deptList = Array.from(deptSet);

    return deptList.map(dept => {
      const empsInDept = activeEmployees.filter(e => e.department === dept);
      const thaiCount = empsInDept.filter(e => !e.isForeignWorker).length;
      const foreignCount = empsInDept.filter(e => e.isForeignWorker).length;
      const total = empsInDept.length;

      return {
        department: dept,
        name: dept,
        thai: thaiCount,
        foreign: foreignCount,
        total: total,
        thaiPct: total > 0 ? Math.round((thaiCount / total) * 100) : 0,
        foreignPct: total > 0 ? Math.round((foreignCount / total) * 100) : 0,
      };
    }).sort((a, b) => b.total - a.total);
  }, [activeEmployees]);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // คำนวณสถิติขาด ลา มาสาย เดือนปัจจุบัน
  let totalAbsentDays = 0;
  let totalSickDays = 0;
  let totalBusinessDays = 0;
  let totalAnnualDays = 0;
  let totalLateCount = 0;
  let totalLateMins = 0;
  let totalOtHours = 0;

  activeEmployees.forEach(emp => {
    const cur = emp.attendanceHistory?.find(h => h.month === currentMonth && h.year === currentYear);
    if (cur) {
      totalAbsentDays += cur.absentDays || 0;
      totalSickDays += cur.sickLeaveDays || 0;
      totalBusinessDays += cur.businessLeaveDays || 0;
      totalAnnualDays += cur.annualLeaveDays || 0;
      totalLateCount += cur.lateCount || 0;
      totalLateMins += cur.lateMinutes || 0;
      totalOtHours += cur.otHours || 0;
    }
  });

  const totalLeaveDays = totalSickDays + totalBusinessDays + totalAnnualDays;

  // ========================================================
  // Quick Stats Calculations: พนักงานปฏิบัติงาน, OT รวมเดือนนี้, พนักงานที่กำลังลา
  // ========================================================
  const today = new Date();
  const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // รายการบันทึกการลาที่ครอบคลุมถึงวันนี้ (SICK, BUSINESS, ANNUAL, OTHER_LEAVE, ABSENT)
  const activeLeaveRecordsToday = (attendanceRecords || []).filter(rec => {
    const isLeave = ['SICK', 'BUSINESS', 'ANNUAL', 'OTHER_LEAVE', 'ABSENT'].includes(rec.type);
    if (!isLeave || !rec.date) return false;
    const start = rec.date;
    const end = rec.endDate || rec.date;
    return start <= todayFormatted && end >= todayFormatted;
  });

  const employeeIdsOnLeaveToday = Array.from(new Set(activeLeaveRecordsToday.map(r => r.employeeId)));
  const employeesCurrentlyOnLeave = activeEmployees.filter(emp => employeeIdsOnLeaveToday.includes(emp.id));
  const countCurrentlyOnLeave = employeesCurrentlyOnLeave.length;

  // คำนวณชั่วโมง OT รวมเดือนปัจจุบัน (รวมทั้งจากตารางสรุปรายเดือนและประวัติรายวัน)
  const currentMonthOtLogs = (attendanceRecords || []).filter(r => {
    if (r.type !== 'OT' || !r.date) return false;
    const [y, m] = r.date.split('-').map(Number);
    return m === currentMonth && y === currentYear;
  });
  const otHoursFromLogs = currentMonthOtLogs.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalOtHoursMonth = Math.max(totalOtHours, otHoursFromLogs);

  // 6-Month Trend Data for Absenteeism and Late Arrivals (Line Chart)
  const trend6MonthsData = Array.from({ length: 6 }, (_, i) => {
    const targetDate = new Date(currentYear, currentMonth - 1 - (5 - i), 1);
    const m = targetDate.getMonth() + 1;
    const y = targetDate.getFullYear();

    let absent = 0;
    let late = 0;
    let lateMins = 0;
    let totalLeave = 0;

    activeEmployees.forEach(emp => {
      const rec = emp.attendanceHistory?.find(h => h.month === m && h.year === y);
      if (rec) {
        absent += rec.absentDays || 0;
        late += rec.lateCount || 0;
        lateMins += rec.lateMinutes || 0;
        totalLeave += (rec.sickLeaveDays || 0) + (rec.businessLeaveDays || 0) + (rec.annualLeaveDays || 0);
      }
    });

    return {
      monthLabel: `${THAI_MONTHS[m - 1]}`,
      shortLabel: `${THAI_MONTHS[m - 1].slice(0, 3)} ${String(y + 543).slice(-2)}`,
      fullName: `${THAI_MONTHS[m - 1]} ${y + 543}`,
      month: m,
      year: y,
      absentDays: absent,
      lateCount: late,
      lateMinutes: lateMins,
      totalLeaveDays: totalLeave,
    };
  });

  const total6mAbsent = trend6MonthsData.reduce((acc, c) => acc + c.absentDays, 0);
  const total6mLate = trend6MonthsData.reduce((acc, c) => acc + c.lateCount, 0);
  const total6mLateMins = trend6MonthsData.reduce((acc, c) => acc + c.lateMinutes, 0);
  const avg6mAbsent = (total6mAbsent / 6).toFixed(1);
  const avg6mLate = (total6mLate / 6).toFixed(1);

  // Data for Recharts across months 1 to 9 (or up to current month)
  const monthlyStatsData = Array.from({ length: 9 }, (_, idx) => {
    const m = idx + 1;
    let absent = 0;
    let sick = 0;
    let business = 0;
    let annual = 0;
    let late = 0;
    let ot = 0;

    activeEmployees.forEach(emp => {
      const rec = emp.attendanceHistory?.find(h => h.month === m && h.year === currentYear);
      if (rec) {
        absent += rec.absentDays || 0;
        sick += rec.sickLeaveDays || 0;
        business += rec.businessLeaveDays || 0;
        annual += rec.annualLeaveDays || 0;
        late += rec.lateCount || 0;
        ot += rec.otHours || 0;
      }
    });

    return {
      name: THAI_MONTHS[idx],
      absent,
      sick,
      business,
      annual,
      late,
      ot,
    };
  });

  // ========================================================
  // Notification Badge System: เอกสารหมดอายุ / ใกล้หมดอายุภายใน 30 วัน
  // ========================================================
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const calculateDaysLeft = (dateStr?: string) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return null;
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const expiring30DaysEmployeeAlerts: ExpiringEmployeeAlert[] = [];

  activeEmployees.forEach(emp => {
    const docs: ExpiringDocDetail[] = [];
    const addedKeys = new Set<string>();

    const checkAndAddDoc = (type: string, nameTh: string, dateStr?: string) => {
      if (!dateStr) return;
      const days = calculateDaysLeft(dateStr);
      if (days === null) return;

      // เราสนใจเฉพาะเอกสารที่หมดอายุแล้ว (days < 0) หรือจะหมดอายุใน 30 วันข้างหน้า (days <= 30)
      if (days <= 30) {
        const key = `${type}-${dateStr}`;
        if (addedKeys.has(key)) return;
        addedKeys.add(key);

        const isExpired = days < 0;
        const isCrit15 = days >= 0 && days <= 15;
        const isCrit30 = days > 15 && days <= 30;

        let label = '';
        let badgeClass = '';

        if (isExpired) {
          label = `หมดอายุแล้ว (${Math.abs(days)} วัน)`;
          badgeClass = 'bg-rose-600 text-white font-bold shadow-xs';
        } else if (days === 0) {
          label = 'หมดอายุวันนี้!';
          badgeClass = 'bg-rose-500 text-white font-black animate-bounce';
        } else if (isCrit15) {
          label = `วิกฤต: เหลือ ${days} วัน`;
          badgeClass = 'bg-red-100 text-red-700 border border-red-300 font-bold animate-pulse';
        } else {
          label = `เตือนด่วน: เหลือ ${days} วัน`;
          badgeClass = 'bg-amber-100 text-amber-800 border border-amber-300 font-bold';
        }

        docs.push({
          docType: type,
          docNameTh: nameTh,
          expiryDate: dateStr,
          daysLeft: days,
          isExpired,
          isCrit15,
          isCrit30,
          label,
          badgeClass,
        });
      }
    };

    // ตรวจสอบเอกสารแรงงานต่างด้าว
    const fd = emp.foreignDetails;
    if (fd) {
      checkAndAddDoc('Passport', 'หนังสือเดินทาง (Passport)', fd.passportExpiryDate);
      checkAndAddDoc('PinkCard', 'บัตรชมพู / คนไม่มีสัญชาติ', fd.pinkCardDetails?.expiryDate);
      checkAndAddDoc('Visa', 'การตรวจลงตรา (Visa)', fd.visaExpiryDate);
      checkAndAddDoc('WorkPermit', 'ใบอนุญาตทำงาน (Work Permit)', fd.workPermitExpiryDate);
      checkAndAddDoc('Report90', 'รายงานตัว 90 วัน', fd.report90DaysDate);
      checkAndAddDoc('Medical', 'ใบรับรองแพทย์ตรวจสุขภาพ', fd.medicalCheckupExpiryDate);
    }

    // ตรวจสอบเอกสารทั่วไป / บัตรประชาชน / ใบอนุญาตทำงาน
    checkAndAddDoc(
      emp.identificationType === 'PASSPORT' ? 'Passport' : 'IDCard',
      emp.identificationType === 'PASSPORT' ? 'หนังสือเดินทาง' : 'บัตรประจำตัวประชาชน',
      emp.identificationExpiryDate
    );
    checkAndAddDoc('WorkPermit', 'ใบอนุญาตทำงาน (Work Permit)', emp.workPermitExpiryDate);

    // ตรวจสอบเอกสารแนบใน emp.documents
    if (emp.documents && emp.documents.length > 0) {
      emp.documents.forEach(doc => {
        if (doc.expiryDate) {
          checkAndAddDoc(doc.type, doc.title || 'เอกสารแนบ', doc.expiryDate);
        }
      });
    }

    if (docs.length > 0) {
      // จัดลำดับเอกสารที่วิกฤตที่สุดขึ้นก่อน
      docs.sort((a, b) => a.daysLeft - b.daysLeft);
      const minDays = Math.min(...docs.map(d => d.daysLeft));
      const hasExpired = docs.some(d => d.isExpired);
      const hasCrit15 = docs.some(d => d.isCrit15);
      const hasCrit30 = docs.some(d => d.isCrit30);

      expiring30DaysEmployeeAlerts.push({
        employee: emp,
        documents: docs,
        minDaysLeft: minDays,
        hasExpired,
        hasCrit15,
        hasCrit30,
      });
    }
  });

  // เรียงลำดับพนักงานตามความวิกฤตที่สุดขึ้นก่อน
  expiring30DaysEmployeeAlerts.sort((a, b) => a.minDaysLeft - b.minDaysLeft);

  // คำนวณยอดรวม Badge
  const totalExpiringEmployees = expiring30DaysEmployeeAlerts.length;
  const totalExpiredDocs = expiring30DaysEmployeeAlerts.reduce((acc, cur) => acc + cur.documents.filter(d => d.isExpired).length, 0);
  const totalCrit15Docs = expiring30DaysEmployeeAlerts.reduce((acc, cur) => acc + cur.documents.filter(d => d.isCrit15).length, 0);
  const totalCrit30Docs = expiring30DaysEmployeeAlerts.reduce((acc, cur) => acc + cur.documents.filter(d => d.isCrit30).length, 0);

  // กรองตาม Badge Filter ที่ผู้ใช้เลือก
  const filteredEmployeeAlerts = expiring30DaysEmployeeAlerts.filter(alert => {
    if (expiryBadgeFilter === 'ALL') return true;
    if (expiryBadgeFilter === 'EXPIRED') return alert.hasExpired;
    if (expiryBadgeFilter === 'CRIT_15') return alert.hasCrit15;
    if (expiryBadgeFilter === 'CRIT_30') return alert.hasCrit30;
    return true;
  });

  // รายการเอกสารแรงงานต่างด้าวทั่วไป (60 วัน) สำหรับ Widget ด้านล่าง
  interface ExpiringDocItem {
    employee: Employee;
    docType: string;
    date?: string;
    daysLeft: number;
    status: ReturnType<typeof getExpiryStatus>;
  }

  const expiringForeignItems: ExpiringDocItem[] = [];
  foreignEmployees.forEach(emp => {
    const fd = emp.foreignDetails;
    if (!fd) return;

    const checkForeign = (type: string, dateStr?: string) => {
      if (!dateStr) return;
      const stat = getExpiryStatus(dateStr);
      if (stat.status !== 'NORMAL') {
        const d = calculateDaysLeft(dateStr) || 0;
        expiringForeignItems.push({ employee: emp, docType: type, date: dateStr, daysLeft: d, status: stat });
      }
    };

    checkForeign('Passport', fd.passportExpiryDate);
    checkForeign('บัตรชมพู', fd.pinkCardDetails?.expiryDate);
    checkForeign('Visa', fd.visaExpiryDate);
    checkForeign('Work Permit', fd.workPermitExpiryDate);
  });

  expiringForeignItems.sort((a, b) => a.daysLeft - b.daysLeft);

  const displayedForeignItems = foreignAlertMode === 'EXPIRING_30'
    ? expiringForeignItems.filter(item => item.daysLeft <= 30)
    : expiringForeignItems;

  const getTypeBadge = (type: AttendanceEventType) => {
    switch (type) {
      case 'PRESENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            มาทำงาน (Present)
          </span>
        );
      case 'ABSENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            ขาดงาน (Absent)
          </span>
        );
      case 'LATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-900 border border-yellow-300">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
            มาสาย (Late)
          </span>
        );
      case 'OT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            โอที (OT)
          </span>
        );
      case 'SICK':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-800 border border-orange-300">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            ลาป่วย
          </span>
        );
      case 'BUSINESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-300">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            ลากิจ
          </span>
        );
      case 'ANNUAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-300">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
            ลาพักร้อน
          </span>
        );
      case 'OTHER_LEAVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-300">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            ลาอื่นๆ
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {type}
          </span>
        );
    }
  };

  const getAmountLabel = (rec: AttendanceRecord) => {
    if (rec.type === 'LATE') return `${rec.amount} นาที`;
    if (rec.type === 'OT') return `${rec.amount} ชม.`;
    return `${rec.amount} วัน`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Banner / Executive Welcome */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-xs border border-slate-800">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/2 -top-12 w-64 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-white/10 rounded-full text-blue-200 border border-white/10">
                ภาพรวมองค์กร
              </span>
              <span className="text-xs text-slate-300">
                ประจำงวดเดือน {THAI_MONTHS[currentMonth - 1]} พ.ศ. {currentYear + 543}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              ระบบบริหารจัดการข้อมูลพนักงาน & สถิติเวลาปฏิบัติงาน
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              จัดการประวัติพนักงานไทยและต่างด้าว พร้อมจัดเก็บสถิติ ขาด ลา มาสาย และ OT รายบุคคลโดยตรงเพื่อการประเมินผล
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-xs transition transform active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มพนักงานใหม่</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* QUICK STATS SUMMARY CARD */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/40 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>สรุปข้อมูลด่วน (Quick Stats)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  ข้อมูลสรุปสถานะปัจจุบัน
                </span>
              </h2>
            </div>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline-flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{today.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </span>
        </div>

        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Quick Stat 1: Total Active Employees */}
          <div 
            onClick={() => onNavigateTab('employees')}
            className="group cursor-pointer p-4 rounded-xl bg-slate-50/80 hover:bg-blue-50/60 border border-slate-200/90 hover:border-blue-300 transition shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  พนักงานที่ปฏิบัติงานอยู่ (Active)
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {activeEmployees.length}
                </span>
                <span className="text-xs font-semibold text-slate-500">คน</span>
                <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  สถานะพร้อมทำงาน
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
              <span className="truncate">ไทย {thaiEmployees.length} • ต่างด้าว {foreignEmployees.length} คน</span>
              <span className="text-blue-600 font-semibold group-hover:underline inline-flex items-center gap-0.5 shrink-0 ml-1">
                รายชื่อ <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Quick Stat 2: Total OT Hours for the Current Month */}
          <div 
            onClick={() => onNavigateTab('attendance')}
            className="group cursor-pointer p-4 rounded-xl bg-slate-50/80 hover:bg-blue-50/60 border border-slate-200/90 hover:border-blue-300 transition shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  ชั่วโมง OT รวมเดือนนี้ (Total OT)
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-blue-700 tracking-tight">
                  {totalOtHoursMonth.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-slate-500">ชั่วโมง</span>
                <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  เดือน {THAI_MONTHS[currentMonth - 1]}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
              <span>เฉลี่ย {activeEmployees.length > 0 ? (totalOtHoursMonth / activeEmployees.length).toFixed(1) : 0} ชม./คน</span>
              <span className="text-blue-600 font-semibold group-hover:underline inline-flex items-center gap-0.5 shrink-0 ml-1">
                บันทึก OT <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Quick Stat 3: Employees Currently on Leave */}
          <div 
            onClick={() => onNavigateTab('attendance')}
            className="group cursor-pointer p-4 rounded-xl bg-slate-50/80 hover:bg-amber-50/60 border border-slate-200/90 hover:border-amber-300 transition shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  พนักงานที่กำลังลา (Currently on Leave)
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition">
                  <CalendarClock className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-black tracking-tight ${countCurrentlyOnLeave > 0 ? 'text-amber-800' : 'text-slate-800'}`}>
                  {countCurrentlyOnLeave}
                </span>
                <span className="text-xs font-semibold text-slate-500">คน</span>
                {countCurrentlyOnLeave > 0 ? (
                  <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    กำลังลาวันนี้
                  </span>
                ) : (
                  <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    พร้อมทำงาน 100%
                  </span>
                )}
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
              <span className="truncate">
                {countCurrentlyOnLeave > 0
                  ? employeesCurrentlyOnLeave.map(e => e.fullName.split(' ')[0]).slice(0, 2).join(', ') + (countCurrentlyOnLeave > 2 ? ` +${countCurrentlyOnLeave - 2}` : '')
                  : 'ไม่มีผู้ลางานในวันนี้'}
              </span>
              <span className="text-amber-700 font-semibold group-hover:underline inline-flex items-center gap-0.5 shrink-0 ml-1">
                ปฏิทินกำลังคน <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Quick Stat 4: Birthdays This Month */}
          <div 
            onClick={() => {
              const el = document.getElementById('birthday-notification-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group cursor-pointer p-4 rounded-xl bg-slate-50/80 hover:bg-purple-50/60 border border-slate-200/90 hover:border-purple-300 transition shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  วันเกิดเดือนนี้ (Birthdays)
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
                  <Cake className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-purple-700 tracking-tight">
                  {birthdaysThisMonth.length}
                </span>
                <span className="text-xs font-semibold text-slate-500">คน</span>
                {birthdaysToday.length > 0 ? (
                  <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                    <PartyPopper className="w-3 h-3 text-rose-600" />
                    วันนี้ {birthdaysToday.length} คน!
                  </span>
                ) : (
                  <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    เดือน {THAI_MONTHS[currentMonthNum - 1]}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
              <span className="truncate">
                {birthdaysToday.length > 0 
                  ? `สุขสันต์วันเกิด: ${birthdaysToday.map(e => e.fullName.split(' ')[0]).join(', ')}`
                  : birthdaysThisMonth.length > 0 
                  ? `มีวันเกิดในเดือน ${birthdaysThisMonth.length} คน`
                  : 'ไม่มีวันเกิดในเดือนนี้'}
              </span>
              <span className="text-purple-700 font-semibold group-hover:underline inline-flex items-center gap-0.5 shrink-0 ml-1">
                ส่งคำอวยพร & จัดกิจกรรม <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Empty State Banner when 0 employees */}
      {employees.length === 0 && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">ระบบเริ่มต้นพร้อมใช้งานจริง (ยังไม่มีข้อมูลพนักงาน)</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            ระบบไม่มีข้อมูลตัวอย่างแล้ว คุณสามารถเริ่มต้นบันทึกข้อมูลพนักงานไทยและแรงงานต่างด้าวเพื่อบริหารจัดการองค์กรของคุณได้ทันที
          </p>
          <button
            onClick={onOpenAddModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มพนักงานคนแรก</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* NOTIFICATION BADGE SYSTEM: พนักงานที่มีเอกสารใกล้หมดอายุใน 30 วัน */}
      {/* ========================================================= */}
      {totalExpiringEmployees > 0 ? (
        <div className="bg-white rounded-2xl border-2 border-rose-200 shadow-md overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Banner Header with Flashing Alert Badges */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border-b border-rose-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                  <BellRing className="w-5 h-5 animate-wiggle" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600 text-[8px] font-black text-white items-center justify-center">
                    !
                  </span>
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black text-slate-900 text-sm sm:text-base tracking-tight">
                    ระบบแจ้งเตือนด่วน: พนักงานที่มีเอกสารหมดอายุ / ใกล้หมดอายุภายใน 30 วัน
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs">
                    {totalExpiringEmployees} คน
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
                  <span>ตรวจพบเอกสารที่ต้องดำเนินการต่ออายุหรือติดตามอย่างเร่งด่วน:</span>
                  {totalExpiredDocs > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      <AlertOctagon className="w-3 h-3 text-rose-700 shrink-0" />
                      <span>หมดอายุแล้ว {totalExpiredDocs} รายการ</span>
                    </span>
                  )}
                  {totalCrit15Docs > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                      <span>วิกฤต ≤ 15 วัน ({totalCrit15Docs} รายการ)</span>
                    </span>
                  )}
                  {totalCrit30Docs > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>เตือน 16 - 30 วัน ({totalCrit30Docs} รายการ)</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
              {onOpenUrgentAlertModal && urgent7DayCount > 0 && (
                <button
                  type="button"
                  onClick={onOpenUrgentAlertModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 shadow-2xs transition cursor-pointer"
                  title="เปิดหน้าต่างป๊อปอัปแจ้งเตือนเอกสารครบกำหนดใน 7 วัน"
                >
                  <BellRing className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                  <span>เปิดเตือนด่วน 7 วัน ({urgent7DayCount})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsAlertBannerExpanded(!isAlertBannerExpanded)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
              >
                <span>{isAlertBannerExpanded ? 'ย่อแถบแจ้งเตือน' : 'ขยายดูรายชื่อพนักงาน'}</span>
                {isAlertBannerExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Expanded Content with Filter Tabs and Employee Notification Cards */}
          {isAlertBannerExpanded && (
            <div className="p-4 sm:p-5 space-y-4">
              
              {/* Quick Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100 text-xs">
                <span className="text-slate-500 font-semibold mr-1">ตัวกรองระดับความเร่งด่วน:</span>
                
                <button
                  type="button"
                  onClick={() => setExpiryBadgeFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    expiryBadgeFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>ทั้งหมด</span>
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${
                    expiryBadgeFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {totalExpiringEmployees}
                  </span>
                </button>

                {totalExpiredDocs > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpiryBadgeFilter('EXPIRED')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      expiryBadgeFilter === 'EXPIRED'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    }`}
                  >
                    <span>หมดอายุแล้ว</span>
                    <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-rose-700 text-white">
                      {totalExpiredDocs}
                    </span>
                  </button>
                )}

                {totalCrit15Docs > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpiryBadgeFilter('CRIT_15')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      expiryBadgeFilter === 'CRIT_15'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                    }`}
                  >
                    <span>วิกฤต ≤ 15 วัน</span>
                    <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-red-700 text-white">
                      {totalCrit15Docs}
                    </span>
                  </button>
                )}

                {totalCrit30Docs > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpiryBadgeFilter('CRIT_30')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      expiryBadgeFilter === 'CRIT_30'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    <span>เตือน 16 - 30 วัน</span>
                    <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-700 text-white">
                      {totalCrit30Docs}
                    </span>
                  </button>
                )}
              </div>

              {/* Grid of Highlighted Employee Alert Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredEmployeeAlerts.map(({ employee, documents, minDaysLeft, hasExpired }) => (
                  <div
                    key={employee.id}
                    onClick={() => onSelectEmployee(employee)}
                    className={`p-4 rounded-xl border transition cursor-pointer group flex flex-col justify-between ${
                      hasExpired
                        ? 'bg-rose-50/40 border-rose-300 hover:border-rose-500 hover:shadow-md'
                        : minDaysLeft <= 15
                        ? 'bg-red-50/30 border-red-200 hover:border-red-400 hover:shadow-md'
                        : 'bg-amber-50/30 border-amber-200 hover:border-amber-400 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Card Top: Avatar & Info */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
                            {employee.fullName[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-600 transition leading-tight">
                                {employee.fullName}
                              </h4>
                              {employee.nickname && (
                                <span className="text-[11px] text-slate-500 font-medium">
                                  ({employee.nickname})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                {employee.id}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {employee.isForeignWorker ? (
                                  <span className="text-amber-700 font-medium">{employee.nationalityText || 'แรงงานต่างด้าว'}</span>
                                ) : (
                                  <span className="text-blue-700 font-medium">สัญชาติไทย</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Urgency Badge Indicator */}
                        {hasExpired ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider shrink-0 shadow-xs">
                            หมดอายุ
                          </span>
                        ) : minDaysLeft <= 15 ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-red-600 text-white shrink-0 animate-pulse">
                            วิกฤต
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-600 text-white shrink-0">
                            30 วัน
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-600 mb-2.5">
                        <span className="font-medium">{employee.position}</span>
                        <span className="mx-1">•</span>
                        <span>{employee.department}</span>
                      </div>

                      {/* Document Badges Stack */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          เอกสารที่ต้องติดตาม ({documents.length} รายการ):
                        </span>
                        {documents.map((doc, dIdx) => (
                          <div
                            key={dIdx}
                            className="flex items-center justify-between p-1.5 bg-white/80 rounded-lg border border-slate-200/70 text-xs"
                          >
                            <span className="text-[11px] font-semibold text-slate-800 truncate mr-2">
                              {doc.docNameTh}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${doc.badgeClass}`}>
                              {doc.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card Footer Action */}
                    <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500">
                        กำหนด: {documents[0]?.expiryDate || '-'}
                      </span>
                      <span className="text-blue-600 font-bold group-hover:underline flex items-center gap-1">
                        <span>เปิดจัดการเอกสาร</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

        </div>
      ) : (
        /* Status Normal Compact Badge Banner */
        <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold">สถานะเอกสารสมบูรณ์: </span>
              <span>ไม่พบพนักงานที่มีเอกสารหมดอายุหรือใกล้หมดอายุในระยะ 30 วันข้างหน้า</span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('foreign')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline shrink-0"
          >
            ดูการตรวจสอบล่วงหน้า 60-90 วัน
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. BIRTHDAY NOTIFICATION & CELEBRATION SYSTEM */}
      {/* ========================================================= */}
      <div id="birthday-notification-section">
        <BirthdaySection
          employees={employees}
          onSelectEmployee={onSelectEmployee}
          onUpdateBirthdayNote={onUpdateBirthdayNote || (() => {})}
          onAddEmployee={onOpenAddModal}
        />
      </div>

      {/* 2. Core Metrics 4-Column Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* พนักงานทั้งหมด */}
        <div 
          onClick={() => onNavigateTab('employees')}
          className="cursor-pointer bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-400 hover:shadow-sm transition group relative"
        >
          {totalExpiringEmployees > 0 && (
            <span className="absolute top-3 right-3 flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              {totalExpiringEmployees} เอกสารด่วน
            </span>
          )}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">พนักงานปัจจุบันทั้งหมด</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{activeEmployees.length}</span>
            <span className="text-xs text-slate-500 font-medium">คน</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>ไทย {thaiEmployees.length}</span>
            <span>•</span>
            <span>ต่างด้าว {foreignEmployees.length}</span>
          </div>
        </div>

        {/* แรงงานต่างด้าว */}
        <div 
          onClick={() => onNavigateTab('foreign')}
          className="cursor-pointer bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-400 hover:shadow-sm transition group relative"
        >
          {expiring30DaysEmployeeAlerts.filter(a => a.employee.isForeignWorker).length > 0 && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              <Zap className="w-2.5 h-2.5 text-amber-700" />
              <span>{expiring30DaysEmployeeAlerts.filter(a => a.employee.isForeignWorker).length} คน ≤ 30 วัน</span>
            </span>
          )}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">แรงงานต่างด้าว (MOU/ม.64)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition">
              <Globe2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600">{foreignEmployees.length}</span>
            <span className="text-xs text-slate-500 font-medium">คน</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Passport & บัตรชมพู</span>
            {expiringForeignItems.length > 0 && (
              <span className="text-amber-700 font-bold bg-amber-100 px-1.5 py-0.2 rounded text-[10px]">
                {expiringForeignItems.length} เอกสารเตือน
              </span>
            )}
          </div>
        </div>

        {/* สถิติขาดและลารวมเดือนนี้ */}
        <div 
          onClick={() => onNavigateTab('attendance')}
          className="cursor-pointer bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-rose-400 hover:shadow-sm transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">สถิติขาด & ลารวมเดือนนี้</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalAbsentDays + totalLeaveDays}
            </span>
            <span className="text-xs text-slate-500 font-medium">วัน</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span className="text-rose-600 font-semibold">ขาดงาน {totalAbsentDays} วัน</span>
            <span>ลารวม {totalLeaveDays} วัน</span>
          </div>
        </div>

        {/* สถิติมาสาย & OT เดือนนี้ */}
        <div 
          onClick={() => onNavigateTab('attendance')}
          className="cursor-pointer bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-400 hover:shadow-sm transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">มาสาย & OT รวมเดือนนี้</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600">
              {totalOtHours}
            </span>
            <span className="text-xs text-slate-500 font-medium">ชม. OT</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span className="text-orange-600 font-medium">มาสาย {totalLateCount} ครั้ง</span>
            <span>({totalLateMins} นาที)</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. RECHARTS BAR CHART: THAI VS FOREIGN WORKERS BY DEPARTMENT */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span>โครงสร้างบุคลากรเปรียบเทียบ: พนักงานไทย และ แรงงานต่างด้าว รายแผนก</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Recharts Bar Chart
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              วิเคราะห์สัดส่วนการกระจายตัวของกำลังคนตามสัญชาติในแต่ละแผนก (พนักงานปัจจุบัน {activeEmployees.length} คน • ไทย {thaiEmployees.length} คน • ต่างด้าว {foreignEmployees.length} คน)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Grouped vs Stacked Bar Chart toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setDeptChartType('GROUPED')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  deptChartType === 'GROUPED'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                แท่งคู่เคียงกัน (Grouped)
              </button>
              <button
                type="button"
                onClick={() => setDeptChartType('STACKED')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  deptChartType === 'STACKED'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                แท่งซ้อนรวม (Stacked)
              </button>
            </div>

            {/* Quick Fingerprint Modal Button */}
            <button
              type="button"
              onClick={() => setIsFingerprintModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
              title="นำเข้าฟอร์มสแกนนิ้วเพื่อคำนวณวันลาและส่งออก Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>นำเข้าสแกนนิ้ว (Excel)</span>
            </button>
          </div>
        </div>

        {/* KPI Strip by Department Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[11px]">จำนวนแผนกทั้งหมด</span>
            <strong className="text-base font-black text-slate-800">{departmentWorkforceData.length} แผนก</strong>
          </div>
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
            <span className="text-blue-600 block text-[11px]">สัดส่วนพนักงานไทย</span>
            <strong className="text-base font-black text-blue-900">
              {thaiEmployees.length} คน ({activeEmployees.length > 0 ? Math.round((thaiEmployees.length / activeEmployees.length) * 100) : 0}%)
            </strong>
          </div>
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
            <span className="text-amber-700 block text-[11px]">สัดส่วนแรงงานต่างด้าว</span>
            <strong className="text-base font-black text-amber-900">
              {foreignEmployees.length} คน ({activeEmployees.length > 0 ? Math.round((foreignEmployees.length / activeEmployees.length) * 100) : 0}%)
            </strong>
          </div>
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <span className="text-indigo-600 block text-[11px]">แผนกกำลังคนสูงสุด</span>
            <strong className="text-base font-black text-indigo-950 truncate block">
              {departmentWorkforceData[0]?.name || '-'} ({departmentWorkforceData[0]?.total || 0} คน)
            </strong>
          </div>
        </div>

        {/* Recharts Bar Chart Container */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={departmentWorkforceData}
              margin={{ top: 15, right: 20, left: -10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1' }}
                interval={0}
              />
              <YAxis 
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload;
                    return (
                      <div className="bg-white p-3.5 rounded-xl shadow-lg border border-slate-200 text-xs space-y-2 min-w-[200px]">
                        <div className="border-b border-slate-100 pb-1.5 font-bold text-slate-900 flex items-center justify-between">
                          <span>แผนก: {label}</span>
                          <span className="text-[11px] text-slate-500 font-normal">รวม {dataPoint.total} คน</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-blue-700 font-semibold">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />
                              <span>พนักงานไทย:</span>
                            </span>
                            <span>{dataPoint.thai} คน ({dataPoint.thaiPct}%)</span>
                          </div>
                          <div className="flex items-center justify-between text-amber-800 font-semibold">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-sm bg-amber-600 inline-block" />
                              <span>แรงงานต่างด้าว:</span>
                            </span>
                            <span>{dataPoint.foreign} คน ({dataPoint.foreignPct}%)</span>
                          </div>
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                          <span>อัตราส่วน (ไทย : ต่างด้าว)</span>
                          <span className="font-bold text-slate-600">{dataPoint.thaiPct}% : {dataPoint.foreignPct}%</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} 
              />
              <Bar 
                dataKey="thai" 
                name="พนักงานไทย" 
                fill="#2563eb" 
                stackId={deptChartType === 'STACKED' ? 'workforce' : undefined}
                radius={deptChartType === 'STACKED' ? [0, 0, 0, 0] : [6, 6, 0, 0]}
                barSize={deptChartType === 'STACKED' ? 36 : 22}
              />
              <Bar 
                dataKey="foreign" 
                name="แรงงานต่างด้าว" 
                fill="#d97706" 
                stackId={deptChartType === 'STACKED' ? 'workforce' : undefined}
                radius={[6, 6, 0, 0]}
                barSize={deptChartType === 'STACKED' ? 36 : 22}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Department Breakdown Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-2.5">แผนก (Department)</th>
                <th className="p-2.5 text-center text-blue-700 bg-blue-50/30">พนักงานไทย</th>
                <th className="p-2.5 text-center text-amber-700 bg-amber-50/30">แรงงานต่างด้าว</th>
                <th className="p-2.5 text-center font-bold text-slate-900">รวมทั้งหมด (คน)</th>
                <th className="p-2.5 text-right">สัดส่วนกำลังคน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departmentWorkforceData.map((d) => (
                <tr key={d.name} className="hover:bg-slate-50/60 transition">
                  <td className="p-2.5 font-bold text-slate-900">{d.name}</td>
                  <td className="p-2.5 text-center text-blue-800 bg-blue-50/10 font-semibold">{d.thai} คน ({d.thaiPct}%)</td>
                  <td className="p-2.5 text-center text-amber-800 bg-amber-50/10 font-semibold">{d.foreign} คน ({d.foreignPct}%)</td>
                  <td className="p-2.5 text-center font-black text-slate-900">{d.total} คน</td>
                  <td className="p-2.5 text-right">
                    <div className="inline-flex items-center gap-1.5 w-32">
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div style={{ width: `${d.thaiPct}%` }} className="bg-blue-600 h-full" />
                        <div style={{ width: `${d.foreignPct}%` }} className="bg-amber-500 h-full" />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Interactive Charts Section: Attendance, Overtime & 6-Month Trend */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                สถิติแนวโน้มการเข้างานและเวลาปฏิบัติงาน (Attendance Trends)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {chartMode === 'TREND' 
                ? 'กราฟเส้นวิเคราะห์แนวโน้มการขาดงานและมาสายย้อนหลัง 6 เดือนต่อเนื่อง'
                : 'แสดงแนวโน้มสถิติรายบุคคลและภาพรวมทั้งองค์กรตลอดปี 2026'}
            </p>
          </div>

          {/* Toggle View */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl flex-wrap gap-1">
            <button
              onClick={() => setChartMode('TREND')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                chartMode === 'TREND'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <span>แนวโน้ม 6 เดือน (Line Chart)</span>
            </button>
            <button
              onClick={() => setChartMode('ATTENDANCE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                chartMode === 'ATTENDANCE'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              สถิติขาด / ลา / มาสาย
            </button>
            <button
              onClick={() => setChartMode('OVERTIME')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                chartMode === 'OVERTIME'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ชั่วโมงล่วงเวลา (OT)
            </button>
          </div>
        </div>

        {/* Sub-header for Line Chart Trend Mode */}
        {chartMode === 'TREND' && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-700">ตัวชี้วัดแนวโน้ม:</span>
              <button
                type="button"
                onClick={() => setTrendMetric('BOTH')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  trendMetric === 'BOTH'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                ดูคู่กันทั้งขาดงาน & มาสาย
              </button>
              <button
                type="button"
                onClick={() => setTrendMetric('ABSENT')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  trendMetric === 'ABSENT'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                เฉพาะขาดงาน (วัน)
              </button>
              <button
                type="button"
                onClick={() => setTrendMetric('LATE')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  trendMetric === 'LATE'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                เฉพาะมาสาย (ครั้ง)
              </button>
            </div>

            <div className="flex items-center gap-3 text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>รวมขาดงาน 6ด: <strong>{total6mAbsent}</strong> วัน (เฉลี่ย {avg6mAbsent}/ด.)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>รวมมาสาย 6ด: <strong>{total6mLate}</strong> ครั้ง ({total6mLateMins} นาที)</span>
              </div>
            </div>
          </div>
        )}

        {/* Recharts Chart Area */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'TREND' ? (
              <LineChart data={trend6MonthsData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="monthLabel" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={{ stroke: '#e2e8f0' }} 
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={{ stroke: '#e2e8f0' }}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0', 
                    fontSize: '12px', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }} 
                  formatter={(value: any, name: any) => [
                    `${value} ${name.includes('ขาด') ? 'วัน' : 'ครั้ง'}`,
                    name
                  ]}
                  labelFormatter={(label: any, items: any) => {
                    const item = items?.[0]?.payload;
                    return item ? item.fullName : label;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {(trendMetric === 'BOTH' || trendMetric === 'ABSENT') && (
                  <Line 
                    type="monotone" 
                    dataKey="absentDays" 
                    name="ขาดงาน (Absenteeism - วัน)" 
                    stroke="#e11d48" 
                    strokeWidth={3} 
                    dot={{ r: 5, fill: '#e11d48', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 7, fill: '#e11d48' }}
                  />
                )}
                {(trendMetric === 'BOTH' || trendMetric === 'LATE') && (
                  <Line 
                    type="monotone" 
                    dataKey="lateCount" 
                    name="มาสาย (Late Arrivals - ครั้ง)" 
                    stroke="#d97706" 
                    strokeWidth={3} 
                    dot={{ r: 5, fill: '#d97706', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 7, fill: '#d97706' }}
                  />
                )}
              </LineChart>
            ) : chartMode === 'ATTENDANCE' ? (
              <BarChart data={monthlyStatsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="absent" name="ขาดงาน (วัน)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sick" name="ลาป่วย (วัน)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="business" name="ลากิจ (วัน)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="annual" name="ลาพักร้อน (วัน)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" name="มาสาย (ครั้ง)" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={monthlyStatsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="otGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="ot" name="ชั่วโมงล่วงเวลา (OT รวม ชม.)" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#otGrad)" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Bottom Two Columns: Recent Attendance Logs & Expiring Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Column 1: บันทึกสถิติรายบุคคลล่าสุด (Recent Individual Logs) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    สถิติเวลาปฏิบัติงานรายบุคคลล่าสุด
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    บันทึกข้อมูลโดยตรงเพื่อเก็บสถิติ (ไม่ต้องผ่านการอนุมัติ)
                  </span>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('attendance')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
              >
                <span>ดูทั้งหมด</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {attendanceRecords.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {attendanceRecords.slice(0, 5).map((rec) => (
                  <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{rec.employeeName}</span>
                        {getTypeBadge(rec.type)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span className="font-mono">{rec.date}</span>
                        <span>•</span>
                        <span>{rec.department}</span>
                        {rec.reason && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[150px]">{rec.reason}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold font-mono text-slate-800 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                        {getAmountLabel(rec)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                ยังไม่มีการบันทึกสถิติเวลาปฏิบัติงาน
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onNavigateTab('attendance')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>ตาราง Part-time & วันหยุด (Auto)</span>
            </button>
            <button
              onClick={() => onNavigateTab('attendance')}
              className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ บันทึกสถิติใหม่</span>
            </button>
          </div>
        </div>

        {/* Column 2: แจ้งเตือนเอกสารแรงงานต่างด้าวใกล้หมดอายุ */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    แจ้งเตือนเอกสารแรงงานต่างด้าว
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Passport, Visa, Work Permit ใกล้หมดอายุ
                  </span>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('foreign')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 transition"
              >
                <span>จัดการแรงงาน</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sub-tabs for foreign document urgency */}
            <div className="flex items-center gap-1.5 mb-3">
              <button
                type="button"
                onClick={() => setForeignAlertMode('EXPIRING_30')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  foreignAlertMode === 'EXPIRING_30'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>ด่วน ≤ 30 วัน</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  foreignAlertMode === 'EXPIRING_30' ? 'bg-rose-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {expiringForeignItems.filter(i => i.daysLeft <= 30).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setForeignAlertMode('ALL_60')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  foreignAlertMode === 'ALL_60'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>ทั้งหมด (60 วัน)</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  foreignAlertMode === 'ALL_60' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {expiringForeignItems.length}
                </span>
              </button>
            </div>

            {displayedForeignItems.length > 0 ? (
              <div className="space-y-2.5">
                {displayedForeignItems.slice(0, 5).map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => onSelectEmployee(item.employee)}
                    className="p-3 bg-amber-50/50 hover:bg-amber-50 rounded-xl border border-amber-200/70 flex items-center justify-between cursor-pointer transition"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>{item.employee.fullName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({item.employee.id})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        <span className="font-medium text-amber-900">{item.docType}</span>: {item.date || '-'}
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.status.badgeClass}`}>
                      {item.status.label}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-1" />
                <span>
                  {foreignAlertMode === 'EXPIRING_30' 
                    ? 'ไม่มีเอกสารแรงงานต่างด้าวหมดอายุในระยะ 30 วัน'
                    : 'เอกสารแรงงานต่างด้าวทั้งหมดอยู่ในเกณฑ์ปกติ สมบูรณ์'}
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
            <span>แสดง {displayedForeignItems.length} จากทั้งหมด {expiringForeignItems.length} รายการ</span>
            <button
              onClick={() => onNavigateTab('foreign')}
              className="font-semibold text-blue-600 hover:underline"
            >
              ดูตารางแรงงานต่างด้าว
            </button>
          </div>
        </div>

      </div>

      {/* Modal for Fingerprint Attendance Import & Leave Calculation */}
      <FingerprintAttendanceModal
        isOpen={isFingerprintModalOpen}
        onClose={() => setIsFingerprintModalOpen(false)}
        employees={employees}
        onApplyAttendanceToSystem={onApplyAttendanceToSystem}
        onAddAttendanceRecord={onAddAttendanceRecord}
      />

    </div>
  );
};
