import React, { useState, useEffect } from 'react';
import { 
  CalendarClock, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Filter, 
  User, 
  Save, 
  Edit3,
  Calendar,
  Search,
  Check,
  Trash2,
  FileText,
  UserCheck,
  TrendingDown,
  Timer,
  Info,
  Building2,
  X,
  Sparkles,
  Calculator,
  CalendarDays,
  FileCheck,
  CheckSquare,
  Square,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  HelpCircle,
  Paperclip,
  CheckCircle2,
  FileSpreadsheet,
  CalendarCheck,
  CalendarPlus,
  Gift,
  Award,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { 
  Employee, 
  AttendanceRecord, 
  AttendanceEventType, 
  MonthlyAttendance, 
  DEPARTMENTS, 
  LeaveRequest, 
  LatePermissionRequest, 
  LeaveType, 
  LeaveStatus,
  CompensatoryHolidayRecord
} from '../types';
import { THAI_MONTHS } from '../utils/payrollCalculator';
import { getPublicHolidaysForMonth } from '../data/holidaysAndEvents';
import { loadCompensatoryRecords, saveCompensatoryRecords } from '../utils/storage';
import { nuaSwal, showSuccessAlert, showConfirmDialog, showToast } from '../utils/swal';
import { StaffingCalendarView } from './StaffingCalendarView';
import { FingerprintAttendanceModal } from './FingerprintAttendanceModal';
import { PartTimeAttendanceSection } from './PartTimeAttendanceSection';

export type AttendanceSubTab = 
  | 'individualStats' 
  | 'partTimeSchedule'
  | 'monthlyHolidays' 
  | 'compensatoryHolidays' 
  | 'leaveRequests' 
  | 'lateRequests' 
  | 'activityLogs' 
  | 'calendar';

interface AttendanceLeaveViewProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests?: LeaveRequest[];
  lateRequests?: LatePermissionRequest[];
  onAddAttendanceRecord: (record: Omit<AttendanceRecord, 'id' | 'recordedAt'>) => void;
  onDeleteAttendanceRecord: (id: string) => void;
  onUpdateMonthlyAttendance: (employeeId: string, month: number, year: number, data: Partial<MonthlyAttendance>) => void;
  onAddLeaveRequest?: (req: Omit<LeaveRequest, 'id' | 'requestedAt'>) => void;
  onUpdateLeaveRequest?: (id: string, updates: Partial<LeaveRequest>) => void;
  onDeleteLeaveRequest?: (id: string) => void;
  onAddLateRequest?: (req: Omit<LatePermissionRequest, 'id' | 'recordedAt'>) => void;
  onUpdateLateRequest?: (id: string, updates: Partial<LatePermissionRequest>) => void;
  onDeleteLateRequest?: (id: string) => void;
  initialSubTab?: AttendanceSubTab;
}

export const AttendanceLeaveView: React.FC<AttendanceLeaveViewProps> = ({
  employees,
  attendanceRecords,
  leaveRequests = [],
  lateRequests = [],
  onAddAttendanceRecord,
  onDeleteAttendanceRecord,
  onUpdateMonthlyAttendance,
  onAddLeaveRequest,
  onUpdateLeaveRequest,
  onDeleteLeaveRequest,
  onAddLateRequest,
  onUpdateLateRequest,
  onDeleteLateRequest,
  initialSubTab = 'individualStats',
}) => {
  const activeEmployees = employees.filter(e => !e.resignation.isResigned);

  const [activeSubTab, setActiveSubTab] = useState<AttendanceSubTab>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Quick edit state for monthly attendance row
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [editAbsent, setEditAbsent] = useState<number>(0);
  const [editSick, setEditSick] = useState<number>(0);
  const [editBusiness, setEditBusiness] = useState<number>(0);
  const [editAnnual, setEditAnnual] = useState<number>(0);
  const [editOther, setEditOther] = useState<number>(0);
  const [editLateCount, setEditLateCount] = useState<number>(0);
  const [editLateMins, setEditLateMins] = useState<number>(0);
  const [editOtHours, setEditOtHours] = useState<number>(0);

  // Compensatory Day Off State (ตารางหยุดชดเชย กรณีที่พนักงานมาทำงาน)
  const [compensatoryRecords, setCompensatoryRecords] = useState<CompensatoryHolidayRecord[]>(() => loadCompensatoryRecords());
  const [isCompensatoryModalOpen, setIsCompensatoryModalOpen] = useState(false);
  const [compEmpId, setCompEmpId] = useState<string>(activeEmployees[0]?.id || '');
  const [compWorkedDate, setCompWorkedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [compHolidayName, setCompHolidayName] = useState<string>('');
  const [compEarnedDays, setCompEarnedDays] = useState<number>(1);
  const [compCompensateDate, setCompCompensateDate] = useState<string>('');
  const [compNotes, setCompNotes] = useState<string>('');
  const [compStatusFilter, setCompStatusFilter] = useState<'ALL' | 'PENDING_USE' | 'COMPENSATED'>('ALL');

  // Inspect Annual Quota Modal
  const [selectedEmpQuota, setSelectedEmpQuota] = useState<Employee | null>(null);

  // Public holidays of the selected month
  const monthlyPublicHolidays = getPublicHolidaysForMonth(selectedYear, selectedMonth);

  // New Record Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isAutoCalculate, setIsAutoCalculate] = useState<boolean>(true);
  const [newEmpId, setNewEmpId] = useState<string>(activeEmployees[0]?.id || '');
  const [newType, setNewType] = useState<AttendanceEventType>('SICK');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newEndDate, setNewEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newAmount, setNewAmount] = useState<number>(1);
  const [newReason, setNewReason] = useState<string>('ลาป่วยตามสิทธิ (มีใบรับรองแพทย์/แจ้งล่วงหน้า)');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Leave Request Modal State (with Document Checklist)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveEmpId, setLeaveEmpId] = useState<string>(activeEmployees[0]?.id || '');
  const [leaveType, setLeaveType] = useState<LeaveType>('SICK');
  const [leaveStartDate, setLeaveStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [leaveEndDate, setLeaveEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState<string>('');
  
  // Document Checklist state for Leave Request
  const [checkIdCard, setCheckIdCard] = useState<boolean>(true);
  const [checkHouseReg, setCheckHouseReg] = useState<boolean>(true);
  const [checkPhoto, setCheckPhoto] = useState<boolean>(true);
  const [checkResume, setCheckResume] = useState<boolean>(true);
  const [checkEducation, setCheckEducation] = useState<boolean>(false);
  const [checkMedicalCert, setCheckMedicalCert] = useState<boolean>(true);
  const [checkOtherDoc, setCheckOtherDoc] = useState<boolean>(false);
  const [otherDocNote, setOtherDocNote] = useState<string>('');

  // Late Request Modal State
  const [isLateModalOpen, setIsLateModalOpen] = useState(false);
  const [lateEmpId, setLateEmpId] = useState<string>(activeEmployees[0]?.id || '');
  const [lateDate, setLateDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [lateReason, setLateReason] = useState<string>('');
  const [lateActualMinutes, setLateActualMinutes] = useState<number>(0);
  const [lateWaiveDeduction, setLateWaiveDeduction] = useState<boolean>(true);
  const [isFingerprintModalOpen, setIsFingerprintModalOpen] = useState<boolean>(false);

  // Helper to calculate days between two dates inclusive
  const calculateDaysDiff = (start: string, end: string) => {
    if (!start) return 1;
    const d1 = new Date(start);
    const d2 = new Date(end || start);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 1;
    const diff = Math.max(0, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
    return diff + 1;
  };

  const getStandardDefaultReason = (type: AttendanceEventType) => {
    switch (type) {
      case 'PRESENT': return 'มาปฏิบัติงานตามเวลาปกติ (Present)';
      case 'SICK': return 'ลาป่วยตามสิทธิ (มีใบรับรองแพทย์/แจ้งล่วงหน้า)';
      case 'BUSINESS': return 'ลากิจส่วนตัวจำเป็น';
      case 'ANNUAL': return 'ลาพักผ่อนประจำปี (Annual Leave)';
      case 'OTHER_LEAVE': return 'ลากิจพิเศษ / ลาอื่นๆ';
      case 'ABSENT': return 'ขาดงานโดยมิได้แจ้งล่วงหน้า';
      case 'LATE': return 'มาสายตามบันทึกเวลาสแกนนิ้ว/บัตร';
      case 'OT': return 'ปฏิบัติงานล่วงเวลาพิเศษตามมอบหมาย';
      default: return '';
    }
  };

  const applyAutoCalculate = (type: AttendanceEventType, start: string, end: string) => {
    if (type === 'SICK' || type === 'BUSINESS' || type === 'ANNUAL' || type === 'OTHER_LEAVE') {
      const days = calculateDaysDiff(start, end);
      setNewAmount(days);
    } else if (type === 'PRESENT' || type === 'ABSENT') {
      setNewAmount(1);
    } else if (type === 'LATE') {
      setNewAmount(15);
    } else if (type === 'OT') {
      setNewAmount(2);
    }

    setNewReason(prev => {
      const allDefaults = [
        'มาปฏิบัติงานตามเวลาปกติ (Present)',
        'ลาป่วยตามสิทธิ (มีใบรับรองแพทย์/แจ้งล่วงหน้า)',
        'ลากิจส่วนตัวจำเป็น',
        'ลาพักผ่อนประจำปี (Annual Leave)',
        'ลากิจพิเศษ / ลาอื่นๆ',
        'ขาดงานโดยมิได้แจ้งล่วงหน้า',
        'มาสายตามบันทึกเวลาสแกนนิ้ว/บัตร',
        'ปฏิบัติงานล่วงเวลาพิเศษตามมอบหมาย'
      ];
      if (!prev || allDefaults.includes(prev)) {
        return getStandardDefaultReason(type);
      }
      return prev;
    });
  };

  const startEditRow = (emp: Employee) => {
    const stat = emp.attendanceHistory?.find(h => h.month === selectedMonth && h.year === selectedYear) || {
      month: selectedMonth,
      year: selectedYear,
      absentDays: 0,
      sickLeaveDays: 0,
      businessLeaveDays: 0,
      annualLeaveDays: 0,
      otherLeaveDays: 0,
      lateCount: 0,
      lateMinutes: 0,
      otHours: 0,
      warningCount: 0,
    };
    setEditingEmpId(emp.id);
    setEditAbsent(stat.absentDays || 0);
    setEditSick(stat.sickLeaveDays || 0);
    setEditBusiness(stat.businessLeaveDays || 0);
    setEditAnnual(stat.annualLeaveDays || 0);
    setEditOther(stat.otherLeaveDays || 0);
    setEditLateCount(stat.lateCount || 0);
    setEditLateMins(stat.lateMinutes || 0);
    setEditOtHours(stat.otHours || 0);
  };

  const saveEditRow = (empId: string) => {
    onUpdateMonthlyAttendance(empId, selectedMonth, selectedYear, {
      absentDays: Number(editAbsent),
      sickLeaveDays: Number(editSick),
      businessLeaveDays: Number(editBusiness),
      annualLeaveDays: Number(editAnnual),
      otherLeaveDays: Number(editOther),
      lateCount: Number(editLateCount),
      lateMinutes: Number(editLateMins),
      otHours: Number(editOtHours),
    });
    setEditingEmpId(null);
    showToast('บันทึกสถิติประจำเดือนสำเร็จ', 'success');
  };

  const handleOpenRecordModalForEmp = (empId: string) => {
    setNewEmpId(empId);
    if (isAutoCalculate) {
      applyAutoCalculate(newType, newDate, newEndDate);
    }
    setIsRecordModalOpen(true);
  };

  const handleSubmitNewRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = employees.find(e => e.id === newEmpId);
    if (!targetEmp) return;

    onAddAttendanceRecord({
      employeeId: targetEmp.id,
      employeeName: targetEmp.fullName,
      department: targetEmp.department,
      type: newType,
      date: newDate,
      endDate: newType === 'SICK' || newType === 'BUSINESS' || newType === 'ANNUAL' || newType === 'OTHER_LEAVE' ? newEndDate : undefined,
      amount: Number(newAmount),
      reason: newReason,
    });

    setIsRecordModalOpen(false);
    setNewReason('');
    setNewAmount(1);
    setSaveSuccessMsg(`บันทึกสถิติของ ${targetEmp.fullName} เรียบร้อยแล้ว`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Submit Leave Request (with Document Checklist)
  const handleSubmitLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = employees.find(e => e.id === leaveEmpId);
    if (!targetEmp || !onAddLeaveRequest) return;

    const days = calculateDaysDiff(leaveStartDate, leaveEndDate);

    onAddLeaveRequest({
      employeeId: targetEmp.id,
      employeeName: targetEmp.fullName,
      department: targetEmp.department,
      leaveType,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      days,
      reason: leaveReason || `ขอลา${leaveType === 'SICK' ? 'ป่วย' : leaveType === 'BUSINESS' ? 'กิจ' : leaveType === 'ANNUAL' ? 'พักร้อน' : 'อื่นๆ'}`,
      status: 'APPROVED',
      documentChecklist: {
        idCardCopy: checkIdCard,
        houseRegistrationCopy: checkHouseReg,
        photo: checkPhoto,
        resume: checkResume,
        educationHistory: checkEducation,
        medicalCertificate: leaveType === 'SICK' ? checkMedicalCert : false,
        otherDoc: checkOtherDoc,
        otherDocNote: otherDocNote || undefined,
      }
    });

    // Also record attendance log
    onAddAttendanceRecord({
      employeeId: targetEmp.id,
      employeeName: targetEmp.fullName,
      department: targetEmp.department,
      type: leaveType === 'SICK' ? 'SICK' : leaveType === 'BUSINESS' ? 'BUSINESS' : leaveType === 'ANNUAL' ? 'ANNUAL' : 'OTHER_LEAVE',
      date: leaveStartDate,
      endDate: leaveEndDate,
      amount: days,
      reason: `อนุมัติคำขอลา (${days} วัน) - ${leaveReason || 'เอกสารครบถ้วน'}`,
    });

    setIsLeaveModalOpen(false);
    setLeaveReason('');
    setSaveSuccessMsg(`บันทึกคำขอลาและเช็คลิสต์เอกสารของ ${targetEmp.fullName} เรียบร้อยแล้ว`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Submit Late Permission Request
  const handleSubmitLateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = employees.find(e => e.id === lateEmpId);
    if (!targetEmp || !onAddLateRequest) return;

    onAddLateRequest({
      employeeId: targetEmp.id,
      employeeName: targetEmp.fullName,
      department: targetEmp.department,
      date: lateDate,
      reason: lateReason || 'ขออนุญาตเข้าสายล่วงหน้า',
      actualLateMinutes: Number(lateActualMinutes) || 0,
      isApprovedWaiveDeduction: lateWaiveDeduction,
      status: lateWaiveDeduction ? 'APPROVED_WAIVE' : 'APPROVED_DEDUCT',
    });

    setIsLateModalOpen(false);
    setLateReason('');
    setLateActualMinutes(0);
    setSaveSuccessMsg(`บันทึกคำขอเข้าสายของ ${targetEmp.fullName} เรียบร้อยแล้ว`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Update actual minutes or approval in Late Request
  const handleUpdateLateMinutes = (req: LatePermissionRequest, mins: number) => {
    if (!onUpdateLateRequest) return;
    onUpdateLateRequest(req.id, {
      actualLateMinutes: mins,
    });
  };

  const handleToggleLateWaive = (req: LatePermissionRequest) => {
    if (!onUpdateLateRequest) return;
    const nextWaive = !req.isApprovedWaiveDeduction;
    onUpdateLateRequest(req.id, {
      isApprovedWaiveDeduction: nextWaive,
      status: nextWaive ? 'APPROVED_WAIVE' : 'APPROVED_DEDUCT',
    });
  };

  // Submit Compensatory Day Off (พนักงานมาทำงานในวันหยุด)
  const handleSubmitCompensatory = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = employees.find(emp => emp.id === compEmpId);
    if (!targetEmp) return;

    const newRec: CompensatoryHolidayRecord = {
      id: `CMP-${Date.now()}`,
      employeeId: targetEmp.id,
      employeeName: targetEmp.fullName,
      department: targetEmp.department,
      workedDate: compWorkedDate,
      holidayName: compHolidayName || 'วันหยุดประจำเดือน',
      earnedDays: Number(compEarnedDays) || 1,
      compensateDate: compCompensateDate || undefined,
      status: compCompensateDate ? 'COMPENSATED' : 'PENDING_USE',
      recordedAt: new Date().toISOString(),
      notes: compNotes || 'มาปฏิบัติงานในวันหยุด ได้รับสิทธิ์หยุดชดเชย',
    };

    const updated = [newRec, ...compensatoryRecords];
    setCompensatoryRecords(updated);
    saveCompensatoryRecords(updated);
    setIsCompensatoryModalOpen(false);
    setCompNotes('');
    showSuccessAlert(
      'บันทึกสิทธิ์หยุดชดเชยสำเร็จ',
      `บันทึกสิทธิ์หยุดชดเชยให้คุณ ${targetEmp.fullName} (${targetEmp.department}) จำนวน ${newRec.earnedDays} วัน เรียบร้อยแล้ว`
    );
  };

  const handleRedeemCompensatory = async (record: CompensatoryHolidayRecord) => {
    const { value: compDate } = await nuaSwal.fire({
      title: 'บันทึกการใช้วันหยุดชดเชย',
      text: `พนักงาน: ${record.employeeName} (สิทธิ์จาก: ${record.holidayName})`,
      input: 'date',
      inputValue: new Date().toISOString().split('T')[0],
      showCancelButton: true,
      confirmButtonText: 'ยืนยันใช้วันหยุดชดเชย',
      cancelButtonText: 'ยกเลิก',
      inputValidator: (value) => {
        if (!value) {
          return 'กรุณาเลือกวันที่ต้องการใช้วันหยุดชดเชย';
        }
      }
    });

    if (compDate) {
      const updated = compensatoryRecords.map(r => 
        r.id === record.id 
          ? { ...r, status: 'COMPENSATED' as const, compensateDate: compDate }
          : r
      );
      setCompensatoryRecords(updated);
      saveCompensatoryRecords(updated);
      showSuccessAlert('บันทึกการใช้วันหยุดชดเชยสำเร็จ', `กำหนดวันหยุดชดเชยวันที่ ${compDate} เรียบร้อยแล้ว`);
    }
  };

  const handleDeleteCompensatory = async (recordId: string, employeeName: string) => {
    const confirmed = await showConfirmDialog(
      'ยืนยันการลบสิทธิ์หยุดชดเชย',
      `คุณต้องการลบข้อมูลสิทธิ์วันหยุดชดเชยของ "${employeeName}" ใช่หรือไม่?`,
      'ยืนยันลบ'
    );
    if (confirmed) {
      const updated = compensatoryRecords.filter(r => r.id !== recordId);
      setCompensatoryRecords(updated);
      saveCompensatoryRecords(updated);
      showToast('ลบข้อมูลสิทธิ์วันหยุดชดเชยเรียบร้อย', 'info');
    }
  };

  // Aggregated totals for selected month
  let totalAbsentMonth = 0;
  let totalSickMonth = 0;
  let totalBusinessMonth = 0;
  let totalAnnualMonth = 0;
  let totalLateCountMonth = 0;
  let totalLateMinsMonth = 0;
  let totalOtHoursMonth = 0;

  activeEmployees.forEach(emp => {
    const s = emp.attendanceHistory?.find(h => h.month === selectedMonth && h.year === selectedYear);
    if (s) {
      totalAbsentMonth += s.absentDays || 0;
      totalSickMonth += s.sickLeaveDays || 0;
      totalBusinessMonth += s.businessLeaveDays || 0;
      totalAnnualMonth += s.annualLeaveDays || 0;
      totalLateCountMonth += s.lateCount || 0;
      totalLateMinsMonth += s.lateMinutes || 0;
      totalOtHoursMonth += s.otHours || 0;
    }
  });

  const totalLeaveDaysMonth = totalSickMonth + totalBusinessMonth + totalAnnualMonth;

  // Filtered employees for summary table
  const filteredEmployees = activeEmployees.filter(emp => {
    if (deptFilter !== 'ALL' && emp.department !== deptFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = emp.fullName.toLowerCase().includes(q);
      const matchId = emp.id.toLowerCase().includes(q);
      const matchNick = (emp.nickname || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchNick) return false;
    }
    return true;
  });

  // Filtered attendance log records
  const filteredRecords = attendanceRecords.filter(rec => {
    if (typeFilter !== 'ALL' && rec.type !== typeFilter) return false;
    if (deptFilter !== 'ALL' && rec.department !== deptFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = rec.employeeName.toLowerCase().includes(q);
      const matchId = rec.employeeId.toLowerCase().includes(q);
      const matchReason = (rec.reason || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchReason) return false;
    }
    return true;
  });

  // Filtered leave requests
  const filteredLeaveRequests = leaveRequests.filter(req => {
    if (deptFilter !== 'ALL' && req.department !== deptFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = req.employeeName.toLowerCase().includes(q);
      const matchId = req.employeeId.toLowerCase().includes(q);
      const matchReason = (req.reason || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchReason) return false;
    }
    return true;
  });

  // Filtered late requests
  const filteredLateRequests = lateRequests.filter(req => {
    if (deptFilter !== 'ALL' && req.department !== deptFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = req.employeeName.toLowerCase().includes(q);
      const matchId = req.employeeId.toLowerCase().includes(q);
      const matchReason = (req.reason || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchReason) return false;
    }
    return true;
  });

  const getTypeBadge = (type: AttendanceEventType) => {
    switch (type) {
      case 'PRESENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            มาทำงาน (Present)
          </span>
        );
      case 'ABSENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            ขาดงาน (Absent)
          </span>
        );
      case 'LATE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-900 border border-yellow-300 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
            มาสาย (Late)
          </span>
        );
      case 'OT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-300 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            ทำงานล่วงเวลา (OT)
          </span>
        );
      case 'SICK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-300 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            ลาป่วย (Sick Leave)
          </span>
        );
      case 'BUSINESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-300 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            ลากิจ (Business Leave)
          </span>
        );
      case 'ANNUAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-300 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
            ลาพักร้อน (Annual Leave)
          </span>
        );
      case 'OTHER_LEAVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-300 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            ลาอื่นๆ (Other Leave)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {type}
          </span>
        );
    }
  };

  const getAmountLabel = (rec: AttendanceRecord) => {
    if (rec.type === 'LATE') return `${rec.amount} นาที`;
    if (rec.type === 'OT') return `${rec.amount} ชั่วโมง`;
    return `${rec.amount} วัน`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              สถิติเวลาปฏิบัติงาน & การลา (Attendance & Leave System)
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-indigo-600" />
            <span>ระบบบันทึก ขาด ลา มาสาย ขอเข้าสาย และเช็คลิสต์เอกสาร</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            บันทึกการขอลาพร้อมเช็คลิสต์เอกสาร • ขอเข้าสายพร้อมใส่นาทีสิ้นเดือนและปุ่มอนุมัติไม่หักเงิน • กฎสายเกิน 30 นาทีหักนาทีละ 10 บาท
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 px-2 py-1 outline-none cursor-pointer"
            >
              {THAI_MONTHS.map((m, idx) => (
                <option key={idx} value={idx + 1}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 px-2 py-1 outline-none cursor-pointer"
            >
              <option value={2026}>2569 (2026)</option>
              <option value={2025}>2568 (2025)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveSubTab('partTimeSchedule')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer ${
                activeSubTab === 'partTimeSchedule'
                  ? 'bg-emerald-700 text-white ring-2 ring-emerald-500/30'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
              }`}
              title="ตารางวันหยุดและชั่วโมงทำงาน Part-time คำนวณอัตโนมัติ พร้อมส่งออก"
            >
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>ตาราง Part-time (Export)</span>
            </button>
            <button
              onClick={() => setIsCompensatoryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#8B1C2D] hover:bg-[#6e1422] text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              title="บันทึกพนักงานมาทำงานในวันหยุดเพื่อรับสิทธิ์วันหยุดชดเชย"
            >
              <CalendarPlus className="w-4 h-4 text-[#F0E7C2]" />
              <span>+ บันทึกหยุดชดเชย</span>
            </button>
            <button
              onClick={() => setIsFingerprintModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              title="นำเข้าฟอร์มสแกนนิ้ว Excel/CSV เพื่อคำนวณวันลาและส่งออก"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>นำเข้าสแกนนิ้ว (Excel)</span>
            </button>
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              title="บันทึกคำขอลาพร้อมเช็คลิสต์เอกสาร"
            >
              <FileCheck className="w-4 h-4" />
              <span>+ ขอลา & เอกสาร</span>
            </button>
            <button
              onClick={() => setIsLateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              title="บันทึกพนักงานขอเข้าสาย"
            >
              <Clock className="w-4 h-4" />
              <span>+ ขอเข้าสาย</span>
            </button>
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#F0E7C2]" />
              <span>+ บันทึกด่วน</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{saveSuccessMsg}</span>
        </div>
      )}

      {/* Leave Quota & Late Arrival Policy Banner */}
      <div className="bg-[#FAF6EC] border border-[#E8DCB5] p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-[#52131D]">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#8B1C2D] flex items-center justify-center shrink-0 text-[#F0E7C2] font-bold shadow-xs mt-0.5">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <strong className="text-[#641522] font-black text-sm">กฎเกณฑ์การลาและวันหยุด Nua HRM Pro:</strong>
              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                Part-time (Passtime): ทุกการลาไม่ได้รับเงิน (Unpaid 100%)
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              • <strong>ลากิจ:</strong> 3 วันต่อปี • <strong>ลาป่วย:</strong> 30 วันต่อปี • <strong>ลาพักร้อน:</strong> 7 วันต่อปี (กรณีอายุงานครบ 1 ปีขึ้นไป) • <strong>งานไม่รับเงิน:</strong> นับวันลาที่ไม่ได้รับเงินทั้งหมด • <strong>มาสาย:</strong> สะสมรวมไม่เกิน 30 นาทีไม่หักเงิน หากเกินหักนาทีละ 10 บาท
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <span className="px-3 py-1.5 bg-white border border-[#E8DCB5] rounded-xl text-[#8B1C2D] font-bold text-[11px] shadow-2xs">
            สิทธิ์วันหยุดชดเชย: บันทึกเมื่อมาทำงานในวันหยุด
          </span>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500">ขาดงานรวม (Absent)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
              วัน
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-600">{totalAbsentMonth}</span>
            <span className="text-xs text-slate-500 font-medium">วัน</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">ประจำเดือน {THAI_MONTHS[selectedMonth - 1]}</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500">วันลารวมทุกประเภท</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
              ลา
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600">{totalLeaveDaysMonth}</span>
            <span className="text-xs text-slate-500 font-medium">วัน</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">ป่วย {totalSickMonth} • กิจ {totalBusinessMonth} • พักร้อน {totalAnnualMonth}</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500">มาสาย (Late Arrivals)</span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs">
              สาย
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-orange-600">{totalLateCountMonth}</span>
            <span className="text-xs text-slate-500 font-medium">ครั้ง</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">รวมเวลา {totalLateMinsMonth} นาที (คำขอสาย {lateRequests.length} รายการ)</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500">ล่วงเวลา (Overtime)</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              OT
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600">{totalOtHoursMonth}</span>
            <span className="text-xs text-slate-500 font-medium">ชม.</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">อัตรา 1.5 เท่า คิดตามชั่วโมงจริง</p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="border-b border-slate-200 px-4 sm:px-6 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              onClick={() => setActiveSubTab('individualStats')}
              className={`pb-3 px-2 sm:px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'individualStats'
                  ? 'border-[#8B1C2D] text-[#8B1C2D]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>ตารางขาด ลา มาสาย & นับวันลา ({filteredEmployees.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('partTimeSchedule')}
              className={`pb-3 px-2 sm:px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'partTimeSchedule'
                  ? 'border-[#8B1C2D] text-[#8B1C2D]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>ตาราง Part-time (วันหยุด/ชั่วโมง)</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Auto
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('monthlyHolidays')}
              className={`pb-3 px-2 sm:px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'monthlyHolidays'
                  ? 'border-[#8B1C2D] text-[#8B1C2D]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              <span>ตารางวันหยุดประจำเดือน ({monthlyPublicHolidays.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('compensatoryHolidays')}
              className={`pb-3 px-2 sm:px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'compensatoryHolidays'
                  ? 'border-[#8B1C2D] text-[#8B1C2D]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award className="w-4 h-4 text-amber-600" />
              <span>ตารางหยุดชดเชย ({compensatoryRecords.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('leaveRequests')}
              className={`pb-3 px-2 sm:px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'leaveRequests'
                  ? 'border-[#8B1C2D] text-[#8B1C2D]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileCheck className="w-4 h-4 text-amber-600" />
              <span>ขอลา & เอกสาร ({filteredLeaveRequests.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('lateRequests')}
              className={`pb-3 px-2 sm:px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'lateRequests'
                  ? 'border-[#8B1C2D] text-[#8B1C2D]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4 text-orange-600" />
              <span>ขอเข้าสาย & อนุมัติ ({filteredLateRequests.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('calendar')}
              className={`pb-3 px-2 sm:px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'calendar'
                  ? 'border-[#8B1C2D] text-[#8B1C2D]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-indigo-600" />
              <span>ปฏิทินงาน & วันหยุด</span>
            </button>

            <button
              onClick={() => setActiveSubTab('activityLogs')}
              className={`pb-3 px-2 sm:px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'activityLogs'
                  ? 'border-[#8B1C2D] text-[#8B1C2D]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>ประวัติบันทึก ({filteredRecords.length})</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2 pb-3 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อ / รหัสพนักงาน..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-none w-44 sm:w-52"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-medium"
            >
              <option value="ALL">ทุกแผนก</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

        </div>

        {/* SUBTAB 1: INDIVIDUAL MONTHLY STATS TABLE */}
        {activeSubTab === 'individualStats' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#FAF6EC] text-[#55141E] font-bold border-b border-[#E8DCB5]">
                <tr>
                  <th className="p-3.5 pl-5">พนักงาน / ประเภท</th>
                  <th className="p-3.5">แผนก / ตำแหน่ง</th>
                  <th className="p-3.5 text-center text-rose-700">ขาดงาน (วัน)</th>
                  <th className="p-3.5 text-center text-amber-700">
                    ลาป่วย (วัน)
                    <span className="block text-[10px] text-slate-500 font-normal">สิทธิ์ 30 วัน/ปี</span>
                  </th>
                  <th className="p-3.5 text-center text-blue-700">
                    ลากิจ (วัน)
                    <span className="block text-[10px] text-slate-500 font-normal">สิทธิ์ 3 วัน/ปี</span>
                  </th>
                  <th className="p-3.5 text-center text-emerald-700">
                    พักร้อน (วัน)
                    <span className="block text-[10px] text-slate-500 font-normal">สิทธิ์ 7 วัน (ครบ 1 ปี)</span>
                  </th>
                  <th className="p-3.5 text-center text-purple-700 bg-purple-50/50">
                    งานไม่รับเงิน (วัน)
                    <span className="block text-[10px] text-purple-600 font-bold">Unpaid Leave</span>
                  </th>
                  <th className="p-3.5 text-center text-orange-700">มาสาย (ครั้ง/นาที)</th>
                  <th className="p-3.5 text-center text-indigo-700">OT (ชม.)</th>
                  <th className="p-3.5 text-center pr-5">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => {
                    const isEditing = editingEmpId === emp.id;
                    const stat = emp.attendanceHistory?.find(h => h.month === selectedMonth && h.year === selectedYear) || {
                      month: selectedMonth,
                      year: selectedYear,
                      absentDays: 0,
                      sickLeaveDays: 0,
                      businessLeaveDays: 0,
                      annualLeaveDays: 0,
                      otherLeaveDays: 0,
                      lateCount: 0,
                      lateMinutes: 0,
                      otHours: 0,
                      warningCount: 0,
                    };

                    const isPartTime = emp.employmentType === 'PART_TIME';
                    
                    // คำนวณอายุงานจากวันเริ่มงาน
                    let tenureYears = 0;
                    if (emp.startDate) {
                      const start = new Date(emp.startDate);
                      const diffTime = Math.max(0, new Date().getTime() - start.getTime());
                      tenureYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
                    }
                    const hasVacationEntitlement = tenureYears >= 1.0;

                    // สถิติสะสมทั้งปีของพนักงานในปีที่เลือก
                    const annualRecords = emp.attendanceHistory?.filter(h => h.year === selectedYear) || [];
                    const annualSickSum = annualRecords.reduce((sum, h) => sum + (h.sickLeaveDays || 0), 0);
                    const annualBusinessSum = annualRecords.reduce((sum, h) => sum + (h.businessLeaveDays || 0), 0);
                    const annualVacationSum = annualRecords.reduce((sum, h) => sum + (h.annualLeaveDays || 0), 0);

                    // คำนวณ "งานไม่รับเงิน" (Unpaid Leave):
                    // - ถ้า Part-time (Passtime): ทุกการลาจะไม่ได้รับเงิน (ป่วย + กิจ + พักร้อน + อื่นๆ)
                    // - ถ้าพนักงานประจำ: ลากิจเกิน 3 วัน + ลาป่วยเกิน 30 วัน + พักร้อนถ้ายังไม่ครบ 1 ปี หรือเกิน 7 วัน + ลาอื่นๆ
                    let unpaidDaysMonth = 0;
                    if (isPartTime) {
                      unpaidDaysMonth = (stat.sickLeaveDays || 0) + (stat.businessLeaveDays || 0) + (stat.annualLeaveDays || 0) + (stat.otherLeaveDays || 0);
                    } else {
                      const unpaidBiz = Math.max(0, (stat.businessLeaveDays || 0) - 3);
                      const unpaidSick = Math.max(0, (stat.sickLeaveDays || 0) - 30);
                      const unpaidVac = !hasVacationEntitlement ? (stat.annualLeaveDays || 0) : Math.max(0, (stat.annualLeaveDays || 0) - 7);
                      unpaidDaysMonth = unpaidBiz + unpaidSick + unpaidVac + (stat.otherLeaveDays || 0);
                    }

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/70 transition">
                        
                        {/* Employee info without Flag Icons */}
                        <td className="p-3.5 pl-5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#8B1C2D]/10 text-[#8B1C2D] font-bold flex items-center justify-center text-xs shrink-0 border border-[#F0E7C2]">
                              {emp.fullName.slice(0, 1)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                <span>{emp.fullName}</span>
                                {emp.nickname && <span className="text-slate-400 font-normal">({emp.nickname})</span>}
                                {isPartTime && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded font-black bg-purple-100 text-purple-800 border border-purple-200">
                                    Part-time
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-mono text-slate-500 block">
                                {emp.id} • {emp.isForeignWorker ? emp.nationalityText : 'สัญชาติไทย'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Dept & Position */}
                        <td className="p-3.5">
                          <span className="font-medium text-slate-700 block truncate max-w-[150px]">{emp.department}</span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">{emp.position}</span>
                          <span className="text-[10px] text-slate-500">
                            อายุงาน {tenureYears >= 1 ? `${tenureYears.toFixed(1)} ปี` : `${Math.max(1, Math.round(tenureYears * 12))} เดือน`}
                          </span>
                        </td>

                        {/* ขาดงาน */}
                        <td className="p-3.5 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={editAbsent}
                              onChange={(e) => setEditAbsent(Number(e.target.value))}
                              className="w-14 p-1 text-center font-bold text-rose-700 bg-rose-50 border border-rose-300 rounded-lg text-xs"
                            />
                          ) : (
                            <span className={`font-bold font-mono px-2 py-0.5 rounded-lg ${stat.absentDays > 0 ? 'bg-rose-50 text-rose-700' : 'text-slate-400'}`}>
                              {stat.absentDays || 0}
                            </span>
                          )}
                        </td>

                        {/* ลาป่วย (สิทธิ์ 30 วัน/ปี) */}
                        <td className="p-3.5 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={editSick}
                              onChange={(e) => setEditSick(Number(e.target.value))}
                              className="w-14 p-1 text-center font-bold text-amber-700 bg-amber-50 border border-amber-300 rounded-lg text-xs"
                            />
                          ) : (
                            <div>
                              <span className={`font-bold font-mono px-2 py-0.5 rounded-lg ${stat.sickLeaveDays > 0 ? 'bg-amber-50 text-amber-800' : 'text-slate-400'}`}>
                                {stat.sickLeaveDays || 0}
                              </span>
                              {!isPartTime && (
                                <span className="text-[10px] text-slate-400 block font-mono mt-0.5" title="สะสมทั้งปี / สิทธิ์ 30 วัน">
                                  {annualSickSum}/30
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* ลากิจ (สิทธิ์ 3 วัน/ปี) */}
                        <td className="p-3.5 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={editBusiness}
                              onChange={(e) => setEditBusiness(Number(e.target.value))}
                              className="w-14 p-1 text-center font-bold text-blue-700 bg-blue-50 border border-blue-300 rounded-lg text-xs"
                            />
                          ) : (
                            <div>
                              <span className={`font-bold font-mono px-2 py-0.5 rounded-lg ${stat.businessLeaveDays > 0 ? 'bg-blue-50 text-blue-800' : 'text-slate-400'}`}>
                                {stat.businessLeaveDays || 0}
                              </span>
                              {!isPartTime && (
                                <span className="text-[10px] text-slate-400 block font-mono mt-0.5" title="สะสมทั้งปี / สิทธิ์ 3 วัน">
                                  {annualBusinessSum}/3
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* ลาพักร้อน (สิทธิ์ 7 วัน เมื่อครบ 1 ปี) */}
                        <td className="p-3.5 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={editAnnual}
                              onChange={(e) => setEditAnnual(Number(e.target.value))}
                              className="w-14 p-1 text-center font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg text-xs"
                            />
                          ) : (
                            <div>
                              <span className={`font-bold font-mono px-2 py-0.5 rounded-lg ${stat.annualLeaveDays > 0 ? 'bg-emerald-50 text-emerald-800' : 'text-slate-400'}`}>
                                {stat.annualLeaveDays || 0}
                              </span>
                              {!isPartTime && (
                                <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                                  {hasVacationEntitlement ? `${annualVacationSum}/7` : 'ยังไม่ครบ 1 ปี (0/7)'}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* งานไม่รับเงิน (Unpaid Leave) */}
                        <td className="p-3.5 text-center bg-purple-50/30">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={editOther}
                              onChange={(e) => setEditOther(Number(e.target.value))}
                              className="w-14 p-1 text-center font-bold text-purple-700 bg-purple-50 border border-purple-300 rounded-lg text-xs"
                              title="วันลาไม่รับเงินอื่นๆ เพิ่มเติม"
                            />
                          ) : (
                            <div>
                              <span className={`font-black font-mono px-2 py-0.5 rounded-lg ${unpaidDaysMonth > 0 ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'text-slate-400'}`}>
                                {unpaidDaysMonth}
                              </span>
                              {isPartTime && unpaidDaysMonth > 0 && (
                                <span className="text-[9px] text-purple-700 block font-bold mt-0.5">
                                  Part-time (ไม่รับเงิน)
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* มาสาย */}
                        <td className="p-3.5 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min="0"
                                placeholder="ครั้ง"
                                value={editLateCount}
                                onChange={(e) => setEditLateCount(Number(e.target.value))}
                                className="w-12 p-1 text-center font-bold text-orange-700 bg-orange-50 border border-orange-300 rounded-lg text-xs"
                                title="จำนวนครั้ง"
                              />
                              <span className="text-slate-400">/</span>
                              <input
                                type="number"
                                min="0"
                                placeholder="นาที"
                                value={editLateMins}
                                onChange={(e) => setEditLateMins(Number(e.target.value))}
                                className="w-14 p-1 text-center font-bold text-orange-700 bg-orange-50 border border-orange-300 rounded-lg text-xs"
                                title="รวมนาที"
                              />
                            </div>
                          ) : (
                            <div className="font-mono">
                              <span className={`font-bold ${stat.lateCount > 0 ? 'text-orange-700' : 'text-slate-400'}`}>
                                {stat.lateCount || 0} ครั้ง
                              </span>
                              {stat.lateMinutes > 0 && (
                                <span className="text-[10px] text-slate-400 block font-normal">
                                  ({stat.lateMinutes} นาที)
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* OT */}
                        <td className="p-3.5 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={editOtHours}
                              onChange={(e) => setEditOtHours(Number(e.target.value))}
                              className="w-14 p-1 text-center font-bold text-indigo-700 bg-indigo-50 border border-indigo-300 rounded-lg text-xs"
                            />
                          ) : (
                            <span className={`font-bold font-mono px-2 py-0.5 rounded-lg ${stat.otHours > 0 ? 'bg-indigo-50 text-indigo-800' : 'text-slate-400'}`}>
                              {stat.otHours || 0} ชม.
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-center pr-5">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => saveEditRow(emp.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                              >
                                <Save className="w-3 h-3" />
                                <span>บันทึก</span>
                              </button>
                              <button
                                onClick={() => setEditingEmpId(null)}
                                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenRecordModalForEmp(emp.id)}
                                title="บันทึกสถิติรายบุคคล"
                                className="px-2 py-1 bg-[#8B1C2D]/10 hover:bg-[#8B1C2D]/20 text-[#8B1C2D] rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>บันทึก</span>
                              </button>
                              <button
                                onClick={() => setSelectedEmpQuota(emp)}
                                title="ตรวจสอบโควตาวันลาสะสมทั้งปี"
                                className="p-1 hover:bg-[#FAF6EC] text-[#8B1C2D] rounded-lg transition cursor-pointer"
                              >
                                <Award className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => startEditRow(emp)}
                                title="แก้ไขสถิติตัวเลขเดือนนี้"
                                className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      ไม่พบข้อมูลพนักงานที่ตรงกับเงื่อนไข
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SUBTAB: PART-TIME ATTENDANCE & HOLIDAY SCHEDULE (ตารางวันหยุด & เวลาทำงาน Part-time) */}
        {activeSubTab === 'partTimeSchedule' && (
          <div className="p-4 sm:p-6 space-y-4">
            <PartTimeAttendanceSection
              employees={employees}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
              onUpdateMonthlyAttendance={onUpdateMonthlyAttendance}
            />
          </div>
        )}

        {/* SUBTAB: MONTHLY HOLIDAYS (ตารางวันหยุดประจำเดือน) */}
        {activeSubTab === 'monthlyHolidays' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF6EC] p-4 rounded-2xl border border-[#E8DCB5]">
              <div>
                <h3 className="font-bold text-sm text-[#5B121F] flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-[#8B1C2D]" />
                  <span>ตารางวันหยุดประจำเดือน {THAI_MONTHS[selectedMonth - 1]} พ.ศ. {selectedYear + 543}</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  แสดงวันหยุดนักขัตฤกษ์ วันหยุดประเพณี และวันหยุดประจำสัปดาห์ • หากพนักงานมาปฏิบัติงาน สามารถกดบันทึกเพื่อรับสิทธิ์วันหยุดชดเชยได้ทันที
                </p>
              </div>
              <button
                onClick={() => {
                  setCompHolidayName(monthlyPublicHolidays[0]?.nameThai || 'วันหยุดประจำเดือน');
                  setIsCompensatoryModalOpen(true);
                }}
                className="px-4 py-2 bg-[#8B1C2D] hover:bg-[#6e1422] text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <CalendarPlus className="w-4 h-4 text-[#F0E7C2]" />
                <span>+ บันทึกพนักงานมาทำงานในวันหยุด</span>
              </button>
            </div>

            {/* Holidays Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 pl-5">วันที่ (Date)</th>
                    <th className="p-3.5">วันในสัปดาห์</th>
                    <th className="p-3.5">ชื่อวันหยุด (Holiday Name)</th>
                    <th className="p-3.5 text-center">ประเภทวันหยุด</th>
                    <th className="p-3.5 text-center pr-5">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyPublicHolidays.length > 0 ? (
                    monthlyPublicHolidays.map((holiday) => {
                      const holDate = new Date(holiday.date);
                      const dayName = holDate.toLocaleDateString('th-TH', { weekday: 'long' });
                      const dNumber = parseInt(holiday.date.split('-')[2], 10);
                      
                      return (
                        <tr key={holiday.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3.5 pl-5 font-mono font-bold text-slate-900">
                            <span className="text-sm text-[#8B1C2D]">{dNumber}</span> {THAI_MONTHS[selectedMonth - 1]} {selectedYear + 543}
                          </td>
                          <td className="p-3.5 font-medium text-slate-700">
                            {dayName}
                          </td>
                          <td className="p-3.5">
                            <p className="font-bold text-slate-900">{holiday.nameThai}</p>
                            <p className="text-[11px] text-slate-500">{holiday.nameEnglish}</p>
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {holiday.isTraditionalOrReligious ? 'วันสำคัญทางศาสนา/ประเพณี' : 'วันหยุดนักขัตฤกษ์/ราชการ'}
                            </span>
                          </td>
                          <td className="p-3.5 text-center pr-5">
                            <button
                              onClick={() => {
                                setCompWorkedDate(holiday.date);
                                setCompHolidayName(holiday.nameThai);
                                setIsCompensatoryModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-[#8B1C2D]/10 hover:bg-[#8B1C2D]/20 text-[#8B1C2D] font-bold rounded-lg text-xs transition flex items-center gap-1 mx-auto cursor-pointer"
                              title="บันทึกพนักงานที่มาทำงานในวันนี้เพื่อรับสิทธิ์วันหยุดชดเชย"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                              <span>บันทึกพนักงานมาทำงาน (รับสิทธิ์ชดเชย)</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        ไม่มีวันหยุดนักขัตฤกษ์ในเดือน {THAI_MONTHS[selectedMonth - 1]} {selectedYear + 543} (มีวันหยุดประจำสัปดาห์ตามกะการทำงาน)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB: COMPENSATORY HOLIDAYS (ตารางหยุดชดเชย กรณีที่พนักงานมาทำงาน) */}
        {activeSubTab === 'compensatoryHolidays' && (
          <div className="p-4 sm:p-6 space-y-4">
            
            {/* Header and Filter Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF6EC] p-4 rounded-2xl border border-[#E8DCB5]">
              <div>
                <h3 className="font-bold text-sm text-[#5B121F] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#8B1C2D]" />
                  <span>ตารางวันหยุดชดเชย (Compensatory Days Off)</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  บันทึกและติดตามสิทธิ์วันหยุดชดเชย สำหรับพนักงานที่มาปฏิบัติงานในวันหยุดประจำเดือน • บันทึกการใช้วันหยุดชดเชยได้ทันที
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={compStatusFilter}
                  onChange={(e) => setCompStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-white border border-[#E8DCB5] rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="ALL">ทุกสถานะ ({compensatoryRecords.length})</option>
                  <option value="PENDING_USE">รอใช้วันหยุดชดเชย ({compensatoryRecords.filter(r => r.status === 'PENDING_USE').length})</option>
                  <option value="COMPENSATED">ใช้สิทธิ์ชดเชยแล้ว ({compensatoryRecords.filter(r => r.status === 'COMPENSATED').length})</option>
                </select>
                <button
                  onClick={() => setIsCompensatoryModalOpen(true)}
                  className="px-3.5 py-2 bg-[#8B1C2D] hover:bg-[#6e1422] text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 text-[#F0E7C2]" />
                  <span>+ บันทึกสิทธิ์ใหม่</span>
                </button>
              </div>
            </div>

            {/* Compensatory Records Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 pl-5">วันที่มาทำงาน (วันหยุด)</th>
                    <th className="p-3.5">วันหยุดที่มาทำ</th>
                    <th className="p-3.5">พนักงาน</th>
                    <th className="p-3.5">แผนก</th>
                    <th className="p-3.5 text-center">สิทธิ์ที่ได้รับ</th>
                    <th className="p-3.5 text-center">สถานะการใช้สิทธิ์</th>
                    <th className="p-3.5 text-center">วันที่ขอหยุดชดเชย</th>
                    <th className="p-3.5">หมายเหตุ</th>
                    <th className="p-3.5 text-center pr-5">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {compensatoryRecords
                    .filter(r => compStatusFilter === 'ALL' || r.status === compStatusFilter)
                    .map((record) => {
                      const isPending = record.status === 'PENDING_USE';
                      
                      return (
                        <tr key={record.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3.5 pl-5 font-mono font-bold text-slate-900">
                            {record.workedDate}
                          </td>
                          <td className="p-3.5 font-bold text-[#8B1C2D]">
                            {record.holidayName}
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 block">{record.employeeName}</span>
                            <span className="font-mono text-[10px] text-slate-400">{record.employeeId}</span>
                          </td>
                          <td className="p-3.5 font-medium text-slate-700">
                            {record.department}
                          </td>
                          <td className="p-3.5 text-center font-bold text-emerald-700 font-mono">
                            {record.earnedDays} วัน
                          </td>
                          <td className="p-3.5 text-center">
                            {isPending ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                รอใช้วันหยุดชดเชย
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                ใช้วันหยุดชดเชยแล้ว
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-center font-mono font-bold text-slate-800">
                            {record.compensateDate || '-'}
                          </td>
                          <td className="p-3.5 text-slate-500 max-w-[200px] truncate" title={record.notes}>
                            {record.notes || '-'}
                          </td>
                          <td className="p-3.5 text-center pr-5">
                            <div className="flex items-center justify-center gap-1.5">
                              {isPending && (
                                <button
                                  onClick={() => handleRedeemCompensatory(record)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                  title="บันทึกวันที่ใช้วันหยุดชดเชย"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>ใช้วันหยุด</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteCompensatory(record.id, record.employeeName)}
                                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                                title="ลบรายการ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {compensatoryRecords.filter(r => compStatusFilter === 'ALL' || r.status === compStatusFilter).length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        ยังไม่มีบันทึกข้อมูลสิทธิ์วันหยุดชดเชยในเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 2: LEAVE REQUESTS WITH DOCUMENT CHECKLIST */}
        {activeSubTab === 'leaveRequests' && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/60 p-4 rounded-xl border border-amber-200">
              <div>
                <h3 className="font-bold text-sm text-amber-950 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-amber-600" />
                  <span>บันทึกวันที่พนักงานขอลา พร้อมเช็คลิสต์เอกสารประกอบ</span>
                </h3>
                <p className="text-xs text-amber-800/80 mt-0.5">
                  ระบุวันที่ขอลา (นับวันอัตโนมัติ) ตรวจสอบสำเนาบัตรประชาชน ทะเบียนบ้าน รูปถ่าย เรซูเม่ ประวัติการศึกษา และใบรับรองแพทย์
                </p>
              </div>
              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ บันทึกคำขอลาใหม่</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="p-3 pl-4">วันที่ขอลา</th>
                    <th className="p-3">พนักงาน</th>
                    <th className="p-3">ประเภทการลา</th>
                    <th className="p-3 text-center">จำนวนวัน</th>
                    <th className="p-3">เช็คลิสต์เอกสารที่แนบ</th>
                    <th className="p-3">เหตุผล</th>
                    <th className="p-3 text-center">สถานะ</th>
                    <th className="p-3 text-right pr-4">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeaveRequests.length > 0 ? (
                    filteredLeaveRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition">
                        
                        {/* Dates */}
                        <td className="p-3 pl-4 font-mono">
                          <span className="font-bold text-slate-900">{req.startDate}</span>
                          {req.endDate && req.endDate !== req.startDate && (
                            <span className="text-[10px] text-slate-500 block">ถึง {req.endDate}</span>
                          )}
                        </td>

                        {/* Employee */}
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{req.employeeName}</div>
                          <span className="text-[10px] text-slate-400 font-mono">{req.employeeId} • {req.department}</span>
                        </td>

                        {/* Leave Type */}
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            req.leaveType === 'SICK' ? 'bg-orange-100 text-orange-800' :
                            req.leaveType === 'BUSINESS' ? 'bg-sky-100 text-sky-800' :
                            req.leaveType === 'ANNUAL' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {req.leaveType === 'SICK' ? 'ลาป่วย' :
                             req.leaveType === 'BUSINESS' ? 'ลากิจ' :
                             req.leaveType === 'ANNUAL' ? 'พักร้อน' : 'ลาอื่นๆ'}
                          </span>
                        </td>

                        {/* Days */}
                        <td className="p-3 text-center font-bold font-mono text-slate-900">
                          {req.days} วัน
                        </td>

                        {/* Document Checklist Icons */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                            {req.documentChecklist?.idCardCopy && (
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-[10px] font-medium" title="สำเนาบัตรประชาชน">
                                บัตร ปชช.
                              </span>
                            )}
                            {req.documentChecklist?.houseRegistrationCopy && (
                              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded text-[10px] font-medium" title="สำเนาทะเบียนบ้าน">
                                ทะเบียนบ้าน
                              </span>
                            )}
                            {req.documentChecklist?.photo && (
                              <span className="px-1.5 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded text-[10px] font-medium" title="รูปถ่ายหน้าตรง">
                                รูปถ่าย
                              </span>
                            )}
                            {req.documentChecklist?.resume && (
                              <span className="px-1.5 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded text-[10px] font-medium" title="เรซูเม่">
                                เรซูเม่
                              </span>
                            )}
                            {req.documentChecklist?.educationHistory && (
                              <span className="px-1.5 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded text-[10px] font-medium" title="ประวัติการศึกษา (บางตำแหน่ง)">
                                วุฒิการศึกษา
                              </span>
                            )}
                            {req.documentChecklist?.medicalCertificate && (
                              <span className="px-1.5 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 rounded text-[10px] font-bold" title="ใบรับรองแพทย์">
                                ใบรับรองแพทย์
                              </span>
                            )}
                            {!req.documentChecklist && (
                              <span className="text-slate-400 text-[10px]">บันทึกการลาปกติ</span>
                            )}
                          </div>
                        </td>

                        {/* Reason */}
                        <td className="p-3 text-slate-700 max-w-xs">
                          {req.reason}
                        </td>

                        {/* Status */}
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>อนุมัติแล้ว</span>
                          </span>
                        </td>

                        {/* Delete */}
                        <td className="p-3 text-right pr-4">
                          {onDeleteLeaveRequest && (
                            <button
                              onClick={() => onDeleteLeaveRequest(req.id)}
                              title="ลบคำขอนี้"
                              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        ยังไม่มีรายการขอลาในระบบ (คลิก "+ บันทึกคำขอลาใหม่" เพื่อเพิ่ม)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 3: LATE PERMISSION REQUESTS */}
        {activeSubTab === 'lateRequests' && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-orange-50/60 p-4 rounded-xl border border-orange-200">
              <div>
                <h3 className="font-bold text-sm text-orange-950 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span>ข้อมูลพนักงานขอเข้าสาย (ติ๊กวันที่ขอเข้าสาย แล้วใส่เวลาสิ้นเดือน & อนุมัติไม่หักเงิน)</span>
                </h3>
                <p className="text-xs text-orange-800/80 mt-0.5">
                  กฎหักเงิน: สายสะสมรวมกันไม่เกิน <strong>30 นาที ไม่หักเงิน</strong> • เกิน 30 นาที <strong>หักนาทีละ 10 บาท</strong> • มีปุ่มอนุมัติว่ายกเว้นไม่หักเงินไหม
                </p>
              </div>
              <button
                onClick={() => setIsLateModalOpen(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ ขอเข้าสายใหม่</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="p-3 pl-4">วันที่ขอเข้าสาย</th>
                    <th className="p-3">พนักงาน (สัญชาติ)</th>
                    <th className="p-3">เหตุผลขอเข้าสาย</th>
                    <th className="p-3 text-center bg-orange-50/50">เวลาสายจริงสิ้นเดือน (นาที)</th>
                    <th className="p-3 text-center">อนุมัติให้สายโดยไม่หักเงิน?</th>
                    <th className="p-3 text-center">การคิดหักเงิน</th>
                    <th className="p-3 text-right pr-4">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLateRequests.length > 0 ? (
                    filteredLateRequests.map((req) => {
                      const emp = employees.find(e => e.id === req.employeeId);
                      const isWaived = req.isApprovedWaiveDeduction;

                      return (
                        <tr key={req.id} className="hover:bg-slate-50/80 transition">
                          
                          {/* Date */}
                          <td className="p-3 pl-4 font-mono font-bold text-slate-900">
                            {req.date}
                          </td>

                          {/* Employee */}
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <div>
                                <div className="font-bold text-slate-900">{req.employeeName}</div>
                                <span className="text-[10px] text-slate-400 font-mono">{req.employeeId} • {req.department}</span>
                              </div>
                            </div>
                          </td>

                          {/* Reason */}
                          <td className="p-3 text-slate-700 max-w-xs">
                            {req.reason || '-'}
                          </td>

                          {/* Actual Late Minutes Input */}
                          <td className="p-3 text-center bg-orange-50/20">
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={req.actualLateMinutes || ''}
                                placeholder="ใส่นาที"
                                onChange={(e) => handleUpdateLateMinutes(req, Number(e.target.value))}
                                className="w-16 p-1 text-center font-mono font-bold bg-white border border-orange-300 rounded-lg text-xs text-orange-950 focus:ring-2 focus:ring-orange-400/20"
                              />
                              <span className="text-slate-500 font-medium">นาที</span>
                            </div>
                          </td>

                          {/* Waive Toggle Button */}
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleLateWaive(req)}
                              className={`px-3 py-1 rounded-full text-xs font-bold transition inline-flex items-center gap-1.5 border shadow-2xs ${
                                isWaived 
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200' 
                                  : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                              }`}
                              title="คลิกเพื่อสลับสถานะอนุมัติไม่หักเงิน"
                            >
                              {isWaived ? (
                                <>
                                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>อนุมัติไม่หักเงิน</span>
                                </>
                              ) : (
                                <>
                                  <ThumbsDown className="w-3.5 h-3.5 text-rose-500" />
                                  <span>คิดหักเงินตามเกณฑ์</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Deduction Calculation Explanation */}
                          <td className="p-3 text-center">
                            {isWaived ? (
                              <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                                ไม่หักเงิน (อนุมัติยกเว้น)
                              </span>
                            ) : req.actualLateMinutes > 0 ? (
                              <span className="text-[11px] text-amber-800 font-medium">
                                สะสม {req.actualLateMinutes}น. (เกิน 30น. หักนาทีละ 10 บ.)
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">รอระบุเวลาสิ้นเดือน</span>
                            )}
                          </td>

                          {/* Delete */}
                          <td className="p-3 text-right pr-4">
                            {onDeleteLateRequest && (
                              <button
                                onClick={() => onDeleteLateRequest(req.id)}
                                title="ลบคำขอนี้"
                                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>

                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        ยังไม่มีรายการขอเข้าสายในระบบ (คลิก "+ ขอเข้าสายใหม่" เพื่อเพิ่ม)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 4: ACTIVITY LOGS */}
        {activeSubTab === 'activityLogs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-5">วันที่เกิดเหตุการณ์</th>
                  <th className="p-3.5">พนักงาน</th>
                  <th className="p-3.5">ประเภทสถิติ</th>
                  <th className="p-3.5 text-center">จำนวนเวลา</th>
                  <th className="p-3.5">เหตุผล / บันทึกเพิ่มเติม</th>
                  <th className="p-3.5 text-right pr-5">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                      
                      <td className="p-3.5 pl-5 font-mono text-slate-700">
                        <div className="font-semibold text-slate-900">{rec.date}</div>
                        {rec.endDate && rec.endDate !== rec.date && (
                          <div className="text-[10px] text-slate-400">ถึง {rec.endDate}</div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{rec.employeeName}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                          <span>{rec.employeeId}</span>
                          <span>•</span>
                          <span>{rec.department}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        {getTypeBadge(rec.type)}
                      </td>

                      <td className="p-3.5 text-center font-mono font-bold text-slate-800">
                        {getAmountLabel(rec)}
                      </td>

                      <td className="p-3.5 text-slate-600 max-w-xs">
                        {rec.reason || '-'}
                      </td>

                      <td className="p-3.5 text-right pr-5">
                        <button
                          onClick={() => onDeleteAttendanceRecord(rec.id)}
                          title="ลบรายการสถิตินี้"
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      ไม่พบประวัติการบันทึกสถิติตามเงื่อนไข
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SUBTAB 5: CALENDAR VIEW */}
        {activeSubTab === 'calendar' && (
          <div className="p-4 sm:p-5">
            <StaffingCalendarView
              employees={employees}
              attendanceRecords={attendanceRecords}
              onAddAttendanceRecord={onAddAttendanceRecord}
              onDeleteAttendanceRecord={onDeleteAttendanceRecord}
            />
          </div>
        )}

      </div>

      {/* MODAL 1: Record Individual Attendance Event (Direct Log) */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  ระบบบันทึกด่วน (Quick Log)
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5 flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-indigo-600" />
                  <span>บันทึกสถิติ ขาด ลา มาสาย OT รายบุคคล</span>
                </h3>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewRecord} className="space-y-4 text-xs">
              
              {/* Employee Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  เลือกพนักงาน <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newEmpId}
                  onChange={(e) => setNewEmpId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  required
                >
                  {activeEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.id} - {emp.fullName} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Type */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ประเภทเหตุการณ์ / สถิติ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newType}
                  onChange={(e) => {
                    const t = e.target.value as AttendanceEventType;
                    setNewType(t);
                    if (isAutoCalculate) {
                      applyAutoCalculate(t, newDate, newEndDate);
                    } else {
                      if (t === 'LATE') setNewAmount(15);
                      else if (t === 'OT') setNewAmount(2);
                      else setNewAmount(1);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  required
                >
                  <option value="PRESENT">มาทำงาน (Present - เข้างานปกติ)</option>
                  <option value="ABSENT">ขาดงาน (Absent)</option>
                  <option value="LATE">มาสาย (Late Arrival)</option>
                  <option value="OT">ทำงานล่วงเวลา (Overtime - OT)</option>
                  <option value="SICK">ลาป่วย (Sick Leave)</option>
                  <option value="BUSINESS">ลากิจ (Business Leave)</option>
                  <option value="ANNUAL">ลาพักร้อน (Annual Vacation Leave)</option>
                  <option value="OTHER_LEAVE">ลาอื่นๆ (Other Leave)</option>
                </select>
              </div>

              {/* Date Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    วันที่ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewDate(val);
                      const effectiveEnd = newEndDate < val ? val : newEndDate;
                      if (newEndDate < val) setNewEndDate(val);
                      if (isAutoCalculate) {
                        applyAutoCalculate(newType, val, effectiveEnd);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {newType !== 'LATE' && newType !== 'OT' && newType !== 'ABSENT' ? (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      ถึงวันที่
                    </label>
                    <input
                      type="date"
                      value={newEndDate}
                      min={newDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewEndDate(val);
                        if (isAutoCalculate) {
                          applyAutoCalculate(newType, newDate, val);
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {newType === 'LATE' ? 'จำนวนนาทีที่สาย' : newType === 'OT' ? 'จำนวนชั่วโมง OT' : 'จำนวนวัน'}
                    </label>
                    <input
                      type="number"
                      step={newType === 'OT' ? '0.5' : '1'}
                      min="0.5"
                      value={newAmount}
                      onChange={(e) => setNewAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Amount calculation display for leaves */}
              {(newType === 'SICK' || newType === 'BUSINESS' || newType === 'ANNUAL' || newType === 'OTHER_LEAVE') && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    จำนวนวันลา ({calculateDaysDiff(newDate, newEndDate)} วัน)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  เหตุผล / บันทึกเพิ่มเติม
                </label>
                <textarea
                  rows={2}
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="เช่น ปวดหัวมีใบรับรองแพทย์, รถติดฝนตกหนัก..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition"
                >
                  บันทึกสถิติ
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: Record Leave Request with Document Checklist */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  ระบบคำขอลา & แฟ้มเอกสาร
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-amber-600" />
                  <span>บันทึกวันที่ขอลา พร้อมเช็คลิสต์เอกสาร</span>
                </h3>
              </div>
              <button
                onClick={() => setIsLeaveModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLeaveRequest} className="space-y-4 text-xs">
              
              {/* Employee */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  พนักงานผู้ขอลา <span className="text-rose-500">*</span>
                </label>
                <select
                  value={leaveEmpId}
                  onChange={(e) => setLeaveEmpId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:bg-white focus:border-amber-500 focus:outline-none"
                  required
                >
                  {activeEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.id} - {emp.fullName} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Leave Type */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ประเภทการลา <span className="text-rose-500">*</span>
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => {
                    const t = e.target.value as LeaveType;
                    setLeaveType(t);
                    if (t === 'SICK') setCheckMedicalCert(true);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:bg-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="SICK">ลาป่วย (Sick Leave)</option>
                  <option value="BUSINESS">ลากิจ (Business Leave)</option>
                  <option value="ANNUAL">ลาพักร้อน (Annual Vacation Leave)</option>
                  <option value="OTHER">ลาอื่นๆ / ลากิจพิเศษ (Other Leave)</option>
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    วันที่เริ่มขอลา <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => {
                      setLeaveStartDate(e.target.value);
                      if (leaveEndDate < e.target.value) setLeaveEndDate(e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:bg-white focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ถึงวันที่ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={leaveEndDate}
                    min={leaveStartDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:bg-white focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 font-bold flex items-center justify-between">
                <span>จำนวนวันที่ขอลา:</span>
                <span className="text-sm font-black font-mono">{calculateDaysDiff(leaveStartDate, leaveEndDate)} วัน</span>
              </div>

              {/* Document Checklist */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-slate-600" />
                    <span>เช็คลิสต์เอกสารสำคัญ & เอกสารประกอบ</span>
                  </span>
                  <span className="text-[10px] text-slate-400">ติ๊กเลือกเอกสารที่มี</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer p-1.5 bg-white rounded-lg border border-slate-200 hover:border-amber-400 transition">
                    <input
                      type="checkbox"
                      checked={checkIdCard}
                      onChange={(e) => setCheckIdCard(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>สำเนาบัตรประชาชน</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-1.5 bg-white rounded-lg border border-slate-200 hover:border-amber-400 transition">
                    <input
                      type="checkbox"
                      checked={checkHouseReg}
                      onChange={(e) => setCheckHouseReg(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>สำเนาทะเบียนบ้าน</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-1.5 bg-white rounded-lg border border-slate-200 hover:border-amber-400 transition">
                    <input
                      type="checkbox"
                      checked={checkPhoto}
                      onChange={(e) => setCheckPhoto(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>รูปถ่ายหน้าตรง</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-1.5 bg-white rounded-lg border border-slate-200 hover:border-amber-400 transition">
                    <input
                      type="checkbox"
                      checked={checkResume}
                      onChange={(e) => setCheckResume(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>เรซูเม่ (Resume)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-1.5 bg-white rounded-lg border border-slate-200 hover:border-amber-400 transition">
                    <input
                      type="checkbox"
                      checked={checkEducation}
                      onChange={(e) => setCheckEducation(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>ประวัติการศึกษา (บางตำแหน่ง)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-1.5 bg-white rounded-lg border border-slate-200 hover:border-amber-400 transition">
                    <input
                      type="checkbox"
                      checked={checkMedicalCert}
                      onChange={(e) => setCheckMedicalCert(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-semibold text-rose-700">ใบรับรองแพทย์ (กรณีลาป่วย)</span>
                  </label>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  เหตุผลการขอลา
                </label>
                <textarea
                  rows={2}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="ระบุเหตุผล เช่น ไปพบแพทย์ตามนัด, ติดธุระครอบครัว..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition"
                >
                  บันทึกคำขอลา
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 3: Record Late Permission Request */}
      {isLateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200">
                  ข้อมูลพนักงานขอเข้าสาย
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <span>บันทึกการขอเข้าสายล่วงหน้า</span>
                </h3>
              </div>
              <button
                onClick={() => setIsLateModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLateRequest} className="space-y-4 text-xs">
              
              {/* Employee */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  เลือกพนักงาน <span className="text-rose-500">*</span>
                </label>
                <select
                  value={lateEmpId}
                  onChange={(e) => setLateEmpId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:bg-white focus:border-orange-500 focus:outline-none"
                  required
                >
                  {activeEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.id} - {emp.fullName} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date of late request */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ติ๊กวันที่ขอเข้าสาย <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={lateDate}
                  onChange={(e) => setLateDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:bg-white focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>

              {/* Actual Late Minutes (Optionally fill now or at end of month) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    เวลาสายจริง (นาที) — ค่อยใส่ในสิ้นเดือนได้
                  </label>
                  <span className="text-[10px] text-slate-400">
                    0 = ยังไม่ระบุ (กรอกสิ้นเดือน)
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={lateActualMinutes || ''}
                  placeholder="เช่น 15, 30, 45 (หรือใส่สิ้นเดือน)"
                  onChange={(e) => setLateActualMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono text-slate-800 focus:bg-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Approval Button toggle: Waive deduction? */}
              <div className="p-3.5 bg-orange-50/70 border border-orange-200 rounded-xl space-y-2">
                <span className="font-bold text-orange-950 block">
                  ปุ่มอนุมัติว่าอนุมัติให้สายโดยไม่หักเงินไหม:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLateWaiveDeduction(true)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      lateWaiveDeduction
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>อนุมัติไม่หักเงิน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLateWaiveDeduction(false)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      !lateWaiveDeduction
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span>หักเงินตามเกณฑ์</span>
                  </button>
                </div>
                <p className="text-[11px] text-orange-800">
                  {lateWaiveDeduction 
                    ? 'หากอนุมัติไม่หักเงิน เวลาที่สายจะไม่ถูกนำมาคำนวณหักเงินเดือน' 
                    : 'หากคิดหักเงิน: สายสะสมรวมไม่เกิน 30 นาที ไม่หัก, เกิน 30 นาที หักนาทีละ 10 บาท'}
                </p>
              </div>

              {/* Reason */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  เหตุผลขอเข้าสาย
                </label>
                <textarea
                  rows={2}
                  value={lateReason}
                  onChange={(e) => setLateReason(e.target.value)}
                  placeholder="เช่น ยานพาหนะเสีย, ธุระติดต่อราชการ, สภาพอากาศ..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsLateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs transition"
                >
                  บันทึกขอเข้าสาย
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal for Fingerprint Attendance Import & Leave Calculation */}
      <FingerprintAttendanceModal
        isOpen={isFingerprintModalOpen}
        onClose={() => setIsFingerprintModalOpen(false)}
        employees={employees}
        onApplyAttendanceToSystem={onUpdateMonthlyAttendance}
        onAddAttendanceRecord={onAddAttendanceRecord}
      />

      {/* MODAL: Record Compensatory Day Off (บันทึกพนักงานมาทำงานในวันหยุด) */}
      {isCompensatoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F0E7C2] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8B1C2D]/10 text-[#8B1C2D] border border-[#F0E7C2]">
                  วันหยุดชดเชย (Compensatory Day Off)
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1 flex items-center gap-2">
                  <CalendarPlus className="w-5 h-5 text-[#8B1C2D]" />
                  <span>บันทึกพนักงานมาทำงานในวันหยุด</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCompensatoryModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCompensatory} className="space-y-4 text-xs">
              {/* Employee Selection */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  เลือกพนักงาน <span className="text-rose-500">*</span>
                </label>
                <select
                  value={compEmpId}
                  onChange={(e) => setCompEmpId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:bg-white focus:border-[#8B1C2D] focus:outline-none cursor-pointer"
                  required
                >
                  {activeEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.id} - {emp.fullName} ({emp.department} {emp.employmentType === 'PART_TIME' ? '• Part-time' : ''})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Worked on Holiday */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    วันที่มาปฏิบัติงาน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={compWorkedDate}
                    onChange={(e) => setCompWorkedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:bg-white focus:border-[#8B1C2D] focus:outline-none cursor-pointer"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    สิทธิ์หยุดชดเชยที่ได้รับ (วัน)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={compEarnedDays}
                    onChange={(e) => setCompEarnedDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800 focus:bg-white focus:border-[#8B1C2D] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Holiday Name */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ชื่อวันหยุดที่มาปฏิบัติงาน <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={compHolidayName}
                    onChange={(e) => setCompHolidayName(e.target.value)}
                    placeholder="เช่น วันขึ้นปีใหม่, วันสงกรานต์, วันหยุดประจำสัปดาห์..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-[#8B1C2D] focus:outline-none"
                    required
                  />
                  {monthlyPublicHolidays.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400">เลือกเร็วจากเดือนนี้:</span>
                      {monthlyPublicHolidays.map((h) => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => {
                            setCompHolidayName(h.nameThai);
                            setCompWorkedDate(h.date);
                          }}
                          className="px-2 py-0.5 text-[10px] bg-[#FAF6EC] hover:bg-[#F0E7C2] text-[#8B1C2D] border border-[#E8DCB5] rounded-md transition cursor-pointer"
                        >
                          {h.nameThai}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Compensated Date */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  วันที่ใช้วันหยุดชดเชย (หากกำหนดแล้ว / เว้นว่างไว้หากยังไม่ใช้)
                </label>
                <input
                  type="date"
                  value={compCompensateDate}
                  onChange={(e) => setCompCompensateDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:bg-white focus:border-[#8B1C2D] focus:outline-none cursor-pointer"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  หมายเหตุ / ภารกิจที่มาปฏิบัติงาน
                </label>
                <textarea
                  rows={2}
                  value={compNotes}
                  onChange={(e) => setCompNotes(e.target.value)}
                  placeholder="เช่น มาปฏิบัติงานควบคุมรอบครัวช่วงวันหยุดเทศกาล..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:border-[#8B1C2D] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCompensatoryModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8B1C2D] hover:bg-[#6e1422] text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  บันทึกสิทธิ์หยุดชดเชย
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Inspect Annual Leave Quota for Employee */}
      {selectedEmpQuota && (() => {
        const emp = selectedEmpQuota;
        const isPartTime = emp.employmentType === 'PART_TIME';
        
        let tenureYears = 0;
        if (emp.startDate) {
          const start = new Date(emp.startDate);
          const diffTime = Math.max(0, new Date().getTime() - start.getTime());
          tenureYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
        }
        const hasVacationEntitlement = tenureYears >= 1.0;

        const annualRecords = emp.attendanceHistory?.filter(h => h.year === selectedYear) || [];
        const annualSick = annualRecords.reduce((sum, h) => sum + (h.sickLeaveDays || 0), 0);
        const annualBusiness = annualRecords.reduce((sum, h) => sum + (h.businessLeaveDays || 0), 0);
        const annualVacation = annualRecords.reduce((sum, h) => sum + (h.annualLeaveDays || 0), 0);
        const annualOther = annualRecords.reduce((sum, h) => sum + (h.otherLeaveDays || 0), 0);
        const annualAbsent = annualRecords.reduce((sum, h) => sum + (h.absentDays || 0), 0);

        const sickQuota = 30;
        const businessQuota = 3;
        const vacationQuota = hasVacationEntitlement ? 7 : 0;

        const remainingSick = Math.max(0, sickQuota - annualSick);
        const remainingBusiness = Math.max(0, businessQuota - annualBusiness);
        const remainingVacation = Math.max(0, vacationQuota - annualVacation);

        // งานไม่รับเงินทั้งปี
        let annualUnpaidTotal = 0;
        if (isPartTime) {
          annualUnpaidTotal = annualSick + annualBusiness + annualVacation + annualOther;
        } else {
          annualUnpaidTotal = Math.max(0, annualBusiness - 3) + Math.max(0, annualSick - 30) + (!hasVacationEntitlement ? annualVacation : Math.max(0, annualVacation - 7)) + annualOther;
        }

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F0E7C2] animate-in fade-in zoom-in-95 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#8B1C2D]/10 text-[#8B1C2D] font-black flex items-center justify-center text-sm border border-[#F0E7C2]">
                    {emp.fullName.slice(0, 1)}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {emp.fullName} {emp.nickname ? `(${emp.nickname})` : ''}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      {emp.id} • {emp.department} • {emp.position}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmpQuota(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status and Tenure Bar */}
              <div className="bg-[#FAF6EC] border border-[#E8DCB5] p-3 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">สถานะการจ้างงาน:</span>
                  <strong className="text-[#8B1C2D] font-bold">
                    {emp.employmentType === 'PART_TIME' ? 'พนักงาน Part-time (Passtime)' : emp.employmentType === 'PROBATION' ? 'ทดลองงาน' : 'พนักงานประจำ (Full-time)'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">อายุงาน:</span>
                  <strong className="text-slate-800 font-bold">
                    {tenureYears >= 1 ? `${tenureYears.toFixed(1)} ปี (มีสิทธิ์พักร้อน)` : `${Math.max(1, Math.round(tenureYears * 12))} เดือน (ยังไม่ถึง 1 ปี)`}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ปีสถิติ:</span>
                  <strong className="text-slate-800 font-bold font-mono">
                    พ.ศ. {selectedYear + 543}
                  </strong>
                </div>
              </div>

              {/* Notice for Part-time */}
              {isPartTime && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">เงื่อนไข Part-time (Passtime):</strong>
                    <span>ทุกการลา (ป่วย, กิจ, พักร้อน) จะไม่ได้รับค่าจ้าง (Unpaid Leave 100%)</span>
                  </div>
                </div>
              )}

              {/* Quotas Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                
                {/* ลากิจ (3 วัน) */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl">
                  <div className="flex items-center justify-between font-bold text-blue-900 mb-1">
                    <span>ลากิจ (Business)</span>
                    <span className="font-mono text-xs">{annualBusiness}/3 วัน</span>
                  </div>
                  <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden mb-1">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (annualBusiness / 3) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-blue-700">
                    คงเหลือสิทธิ์: <strong>{remainingBusiness}</strong> วัน {annualBusiness > 3 ? `(เกินสิทธิ์ ${annualBusiness - 3} วัน)` : ''}
                  </p>
                </div>

                {/* ลาป่วย (30 วัน) */}
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl">
                  <div className="flex items-center justify-between font-bold text-amber-900 mb-1">
                    <span>ลาป่วย (Sick)</span>
                    <span className="font-mono text-xs">{annualSick}/30 วัน</span>
                  </div>
                  <div className="w-full bg-amber-200 h-2 rounded-full overflow-hidden mb-1">
                    <div 
                      className="bg-amber-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (annualSick / 30) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-amber-800">
                    คงเหลือสิทธิ์: <strong>{remainingSick}</strong> วัน {annualSick > 30 ? `(เกินสิทธิ์ ${annualSick - 30} วัน)` : ''}
                  </p>
                </div>

                {/* ลาพักร้อน (7 วัน เมื่อครบ 1 ปี) */}
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                  <div className="flex items-center justify-between font-bold text-emerald-900 mb-1">
                    <span>พักร้อน (Annual)</span>
                    <span className="font-mono text-xs">
                      {hasVacationEntitlement ? `${annualVacation}/7 วัน` : '0 วัน'}
                    </span>
                  </div>
                  <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden mb-1">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all"
                      style={{ width: hasVacationEntitlement ? `${Math.min(100, (annualVacation / 7) * 100)}%` : '0%' }}
                    />
                  </div>
                  <p className="text-[10px] text-emerald-800">
                    {hasVacationEntitlement ? (
                      <>คงเหลือสิทธิ์: <strong>{remainingVacation}</strong> วัน</>
                    ) : (
                      <span className="text-rose-600 font-bold">อายุงานไม่ถึง 1 ปี ยังไม่มีสิทธิ์</span>
                    )}
                  </p>
                </div>

                {/* งานไม่รับเงินสะสม */}
                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl">
                  <div className="flex items-center justify-between font-bold text-purple-900 mb-1">
                    <span>งานไม่รับเงิน (Unpaid)</span>
                    <span className="font-mono text-xs text-purple-800">{annualUnpaidTotal} วัน</span>
                  </div>
                  <p className="text-[10px] text-purple-700 leading-relaxed mt-1">
                    {isPartTime 
                      ? 'นับจากวันลาทุกประเภทของพนักงาน Part-time' 
                      : 'นับจากวันลาเกินโควตาและวันลาไม่รับเงิน'}
                  </p>
                </div>

              </div>

              {/* Monthly attendance overview */}
              <div className="border-t border-slate-100 pt-3 text-xs">
                <span className="font-bold text-slate-800 block mb-2">
                  สรุปการลาสะสมรายเดือนปี {selectedYear + 543}
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {annualRecords.length > 0 ? (
                    annualRecords.map(h => (
                      <div key={h.month} className="p-2 bg-slate-50 rounded-xl flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800">เดือน {THAI_MONTHS[h.month - 1]}</span>
                        <div className="flex items-center gap-2 text-slate-600">
                          <span>ป่วย {h.sickLeaveDays || 0}</span>
                          <span>กิจ {h.businessLeaveDays || 0}</span>
                          <span>พักร้อน {h.annualLeaveDays || 0}</span>
                          <span className="font-bold text-rose-600">ขาด {h.absentDays || 0}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-2">ยังไม่มีประวัติการบันทึกเวลาในปีนี้</p>
                  )}
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setSelectedEmpQuota(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
