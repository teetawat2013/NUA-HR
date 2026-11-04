import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  UserCheck,
  UserMinus,
  AlertTriangle,
  Award,
  FileText,
  DollarSign,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Briefcase,
  Building2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  Printer,
  History,
  Info,
  Download,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { 
  Employee, 
  AttendanceRecord, 
  StatusChangeRecord, 
  StatusChangeType,
  AttendanceEventType 
} from '../types';
import { THAI_MONTHS } from '../utils/payrollCalculator';

interface EmployeeActivityTimelineProps {
  employee: Employee;
  attendanceRecords?: AttendanceRecord[];
  onUpdateEmployee?: (updated: Employee) => void;
  onOpenQuickAttendanceForm?: (employee: Employee) => void;
}

export interface TimelineItem {
  id: string;
  date: string; // YYYY-MM-DD
  rawTimestamp: number;
  category: 'ATTENDANCE' | 'STATUS' | 'WARNING' | 'DOCUMENT';
  type: string;
  title: string;
  subtitle?: string;
  description?: string;
  amountText?: string;
  badgeLabel: string;
  badgeClass: string;
  iconBgClass: string;
  iconColorClass: string;
  iconType: 'calendar' | 'clock' | 'user-check' | 'user-minus' | 'alert' | 'award' | 'file-text' | 'dollar' | 'transfer';
  meta?: {
    recordedBy?: string;
    recordedAt?: string;
    fromValue?: string;
    toValue?: string;
  };
}

// Thai Date Formatter
const formatThaiDate = (dateStr: string): string => {
  if (!dateStr || dateStr === 'ไม่ระบุ') return 'ไม่ระบุวันที่';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d) && m >= 1 && m <= 12) {
        return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
    }
  } catch (e) {
    // fallback
  }
  return dateStr;
};

// Relative time helper
const getRelativeTime = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const target = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diffMs = now - target;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'วันนี้';
    if (diffDays === 1) return 'เมื่อวาน';
    if (diffDays > 1 && diffDays < 7) return `${diffDays} วันที่แล้ว`;
    if (diffDays >= 7 && diffDays < 30) return `${Math.floor(diffDays / 7)} สัปดาห์ที่แล้ว`;
    if (diffDays >= 30 && diffDays < 365) return `${Math.floor(diffDays / 30)} เดือนที่แล้ว`;
    if (diffDays >= 365) return `${Math.floor(diffDays / 365)} ปีที่แล้ว`;
    if (diffDays < 0) return `ในอีก ${Math.abs(diffDays)} วัน`;
  } catch (e) {
    // ignore
  }
  return '';
};

export const EmployeeActivityTimeline: React.FC<EmployeeActivityTimelineProps> = ({
  employee,
  attendanceRecords = [],
  onUpdateEmployee,
  onOpenQuickAttendanceForm,
}) => {
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'ATTENDANCE' | 'STATUS' | 'WARNING' | 'DOCUMENT'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');
  const [isAddStatusModalOpen, setIsAddStatusModalOpen] = useState<boolean>(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // New Status Change Form State
  const [statusDate, setStatusDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statusType, setStatusType] = useState<StatusChangeType>('PROMOTION');
  const [statusTitle, setStatusTitle] = useState<string>('');
  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');
  const [statusDetails, setStatusDetails] = useState<string>('');
  const [recordedBy, setRecordedBy] = useState<string>('ฝ่ายทรัพยากรบุคคล (HR)');

  // 1. Build and Aggregate all timeline events
  const timelineItems: TimelineItem[] = useMemo(() => {
    const list: TimelineItem[] = [];

    // 1.1 Employment Start Date (Milestone)
    if (employee.startDate) {
      list.push({
        id: `milestone-start-${employee.startDate}`,
        date: employee.startDate,
        rawTimestamp: new Date(employee.startDate).getTime() || 0,
        category: 'STATUS',
        type: 'EMPLOYMENT_START',
        title: 'เริ่มเข้าปฏิบัติงานกับองค์กร (Joined Company)',
        subtitle: `ตำแหน่ง: ${employee.position} • แผนก: ${employee.department} ${employee.branch ? `(${employee.branch})` : ''}`,
        description: `ประเภทการจ้างงาน: ${
          employee.employmentType === 'FULL_TIME' ? 'พนักงานประจำ (Full-Time)' :
          employee.employmentType === 'PROBATION' ? 'ทดลองงาน (Probation)' :
          employee.employmentType === 'DAILY' ? 'พนักงานรายวัน (Daily)' :
          employee.employmentType === 'CONTRACT' ? 'สัญญาจ้าง (Contract)' : 'พาร์ทไทม์ (Part-Time)'
        } • เงินเดือนเริ่มต้น ${employee.salary.toLocaleString()} บาท`,
        badgeLabel: 'เริ่มงาน',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        iconBgClass: 'bg-emerald-100 border-emerald-300',
        iconColorClass: 'text-emerald-700',
        iconType: 'user-check',
        meta: {
          recordedAt: employee.startDate,
        }
      });
    }

    // 1.2 Resignation / Termination (if applicable)
    if (employee.resignation?.isResigned) {
      const resDate = employee.resignation.resignationDate || '2026-01-01';
      list.push({
        id: `milestone-resigned-${resDate}`,
        date: resDate,
        rawTimestamp: new Date(resDate).getTime() || 0,
        category: 'STATUS',
        type: 'RESIGNATION',
        title: 'พ้นสภาพการเป็นพนักงาน (Resigned / Terminated)',
        subtitle: `สาเหตุการลาออก: ${employee.resignation.reason || 'ลาออกตามความประสงค์'}`,
        description: `ส่งมอบงานให้แก่: ${employee.resignation.handedOverTo || 'ฝ่ายบุคคล/หัวหน้างาน'} • บันทึกเพิ่มเติม: ${employee.resignation.notes || 'ดำเนินการพ้นสภาพตามระเบียบบริษัท'}`,
        badgeLabel: 'พ้นสภาพ',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
        iconBgClass: 'bg-rose-100 border-rose-300',
        iconColorClass: 'text-rose-700',
        iconType: 'user-minus',
        meta: {
          recordedAt: resDate,
        }
      });
    }

    // 1.3 Custom Status Changes History
    if (employee.statusHistory && employee.statusHistory.length > 0) {
      employee.statusHistory.forEach((item) => {
        let badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
        let iconBgClass = 'bg-blue-100 border-blue-300';
        let iconColorClass = 'text-blue-700';
        let iconType: TimelineItem['iconType'] = 'award';
        let defaultBadge = 'เปลี่ยนสถานะ';

        switch (item.type) {
          case 'PROMOTION':
            badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
            iconBgClass = 'bg-indigo-100 border-indigo-300';
            iconColorClass = 'text-indigo-700';
            iconType = 'award';
            defaultBadge = 'เลื่อนตำแหน่ง';
            break;
          case 'TRANSFER':
            badgeClass = 'bg-cyan-50 text-cyan-700 border-cyan-200';
            iconBgClass = 'bg-cyan-100 border-cyan-300';
            iconColorClass = 'text-cyan-700';
            iconType = 'transfer';
            defaultBadge = 'โอนย้ายงาน';
            break;
          case 'SALARY_ADJUST':
            badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            iconBgClass = 'bg-emerald-100 border-emerald-300';
            iconColorClass = 'text-emerald-700';
            iconType = 'dollar';
            defaultBadge = 'ปรับเงินเดือน';
            break;
          case 'PROBATION_PASS':
            badgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
            iconBgClass = 'bg-purple-100 border-purple-300';
            iconColorClass = 'text-purple-700';
            iconType = 'user-check';
            defaultBadge = 'ผ่านทดลองงาน';
            break;
          case 'CONTRACT_RENEWAL':
            badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
            iconBgClass = 'bg-amber-100 border-amber-300';
            iconColorClass = 'text-amber-700';
            iconType = 'file-text';
            defaultBadge = 'ต่อสัญญาจ้าง';
            break;
          case 'HR_NOTE':
            badgeClass = 'bg-slate-100 text-slate-700 border-slate-300';
            iconBgClass = 'bg-slate-100 border-slate-300';
            iconColorClass = 'text-slate-700';
            iconType = 'file-text';
            defaultBadge = 'บันทึก HR';
            break;
          default:
            break;
        }

        list.push({
          id: item.id || `status-${item.date}-${Math.random()}`,
          date: item.date,
          rawTimestamp: new Date(item.date).getTime() || 0,
          category: 'STATUS',
          type: item.type,
          title: item.title,
          subtitle: item.fromValue && item.toValue ? `${item.fromValue} → ${item.toValue}` : undefined,
          description: item.details,
          badgeLabel: defaultBadge,
          badgeClass,
          iconBgClass,
          iconColorClass,
          iconType,
          meta: {
            recordedBy: item.recordedBy,
            recordedAt: item.recordedAt,
            fromValue: item.fromValue,
            toValue: item.toValue,
          }
        });
      });
    }

    // 1.4 Attendance Records (Daily events for this employee)
    const empAttendance = attendanceRecords.filter(r => r.employeeId === employee.id);
    empAttendance.forEach((rec) => {
      let title = '';
      let badgeLabel = '';
      let badgeClass = '';
      let iconBgClass = '';
      let iconColorClass = '';
      let iconType: TimelineItem['iconType'] = 'calendar';
      let amountText = '';

      switch (rec.type) {
        case 'PRESENT':
          title = 'มาปฏิบัติงานตามปกติ (Present)';
          badgeLabel = 'มาทำงาน (Present)';
          badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
          iconBgClass = 'bg-emerald-100 border-emerald-300';
          iconColorClass = 'text-emerald-700';
          amountText = `${rec.amount} วัน`;
          iconType = 'user-check';
          break;
        case 'SICK':
          title = 'ลาป่วย (Sick Leave)';
          badgeLabel = 'ลาป่วย';
          badgeClass = 'bg-orange-50 text-orange-800 border-orange-300';
          iconBgClass = 'bg-orange-100 border-orange-300';
          iconColorClass = 'text-orange-700';
          amountText = `${rec.amount} วัน`;
          iconType = 'calendar';
          break;
        case 'BUSINESS':
          title = 'ลากิจจำเป็น (Business Leave)';
          badgeLabel = 'ลากิจ';
          badgeClass = 'bg-sky-50 text-sky-800 border-sky-300';
          iconBgClass = 'bg-sky-100 border-sky-300';
          iconColorClass = 'text-sky-700';
          amountText = `${rec.amount} วัน`;
          iconType = 'calendar';
          break;
        case 'ANNUAL':
          title = 'ลาพักผ่อนประจำปี (Annual Leave)';
          badgeLabel = 'พักร้อน';
          badgeClass = 'bg-teal-50 text-teal-800 border-teal-300';
          iconBgClass = 'bg-teal-100 border-teal-300';
          iconColorClass = 'text-teal-700';
          amountText = `${rec.amount} วัน`;
          iconType = 'calendar';
          break;
        case 'OTHER_LEAVE':
          title = 'ลาประเภทอื่นๆ (Other Leave)';
          badgeLabel = 'ลาอื่นๆ';
          badgeClass = 'bg-purple-50 text-purple-800 border-purple-300';
          iconBgClass = 'bg-purple-100 border-purple-300';
          iconColorClass = 'text-purple-700';
          amountText = `${rec.amount} วัน`;
          iconType = 'calendar';
          break;
        case 'ABSENT':
          title = 'ขาดงาน (Absenteeism)';
          badgeLabel = 'ขาดงาน (Absent)';
          badgeClass = 'bg-rose-50 text-rose-800 border-rose-300 font-bold';
          iconBgClass = 'bg-rose-100 border-rose-300';
          iconColorClass = 'text-rose-700';
          amountText = `${rec.amount} วัน`;
          iconType = 'alert';
          break;
        case 'LATE':
          title = 'บันทึกเวลามาสาย (Late Arrival)';
          badgeLabel = 'มาสาย (Late)';
          badgeClass = 'bg-yellow-50 text-yellow-900 border-yellow-300 font-bold';
          iconBgClass = 'bg-yellow-100 border-yellow-300';
          iconColorClass = 'text-yellow-700';
          amountText = `${rec.amount} นาที`;
          iconType = 'clock';
          break;
        case 'OT':
          title = 'ปฏิบัติงานล่วงเวลา (Overtime - OT)';
          badgeLabel = 'ทำงานล่วงเวลา (OT)';
          badgeClass = 'bg-blue-50 text-blue-800 border-blue-300 font-bold';
          iconBgClass = 'bg-blue-100 border-blue-300';
          iconColorClass = 'text-blue-700';
          amountText = `${rec.amount} ชั่วโมง`;
          iconType = 'clock';
          break;
        default:
          title = 'บันทึกเวลาปฏิบัติงาน';
          badgeLabel = 'บันทึกเวลา';
          badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
          iconBgClass = 'bg-slate-100 border-slate-300';
          iconColorClass = 'text-slate-700';
          iconType = 'calendar';
          break;
      }

      const dateSubtitle = rec.endDate && rec.endDate !== rec.date 
        ? `ช่วงวันที่ ${rec.date} ถึง ${rec.endDate}`
        : `วันที่ ${rec.date}`;

      list.push({
        id: rec.id || `att-${rec.date}-${Math.random()}`,
        date: rec.date,
        rawTimestamp: new Date(rec.date).getTime() || 0,
        category: 'ATTENDANCE',
        type: rec.type,
        title,
        subtitle: dateSubtitle,
        description: rec.reason || 'ไม่มีบันทึกสาเหตุเพิ่มเติม',
        amountText,
        badgeLabel,
        badgeClass,
        iconBgClass,
        iconColorClass,
        iconType,
        meta: {
          recordedAt: rec.recordedAt,
        }
      });
    });

    // 1.5 Disciplinary Warnings
    if (employee.warnings && employee.warnings.length > 0) {
      employee.warnings.forEach((w) => {
        const isWritten = w.level === 'WRITTEN';
        const isProbation = w.level === 'PROBATION';
        list.push({
          id: w.id || `warn-${w.date}-${Math.random()}`,
          date: w.date,
          rawTimestamp: new Date(w.date).getTime() || 0,
          category: 'WARNING',
          type: w.level,
          title: isProbation
            ? 'ทัณฑ์บน / ภาคทัณฑ์ความผิด (Disciplinary Probation)'
            : isWritten
            ? 'หนังสือเตือนเป็นลายลักษณ์อักษร (Written Warning)'
            : 'การตักเตือนด้วยวาจา (Verbal Warning)',
          subtitle: `ผู้ออกหนังสือเตือน: ${w.issuedBy || 'ฝ่ายบุคคล'}`,
          description: `เหตุผลการตักเตือน: ${w.reason}`,
          badgeLabel: isProbation ? 'ภาคทัณฑ์' : isWritten ? 'เตือนเป็นลายลักษณ์อักษร' : 'เตือนด้วยวาจา',
          badgeClass: isWritten || isProbation
            ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
            : 'bg-amber-50 text-amber-800 border-amber-200',
          iconBgClass: isWritten || isProbation ? 'bg-rose-100 border-rose-300' : 'bg-amber-100 border-amber-300',
          iconColorClass: isWritten || isProbation ? 'text-rose-700' : 'text-amber-700',
          iconType: 'alert',
          meta: {
            recordedBy: w.issuedBy,
          }
        });
      });
    }

    // 1.6 Uploaded Documents
    if (employee.documents && employee.documents.length > 0) {
      employee.documents.forEach((doc) => {
        const uploadDate = doc.uploadDate || employee.startDate || '2026-01-01';
        list.push({
          id: doc.id || `doc-${doc.title}-${uploadDate}`,
          date: uploadDate,
          rawTimestamp: new Date(uploadDate).getTime() || 0,
          category: 'DOCUMENT',
          type: doc.type,
          title: `บันทึกเอกสารแนบ: ${doc.title}`,
          subtitle: `ประเภท: ${doc.type} • ไฟล์: ${doc.fileName || 'เอกสารระบบ'}`,
          description: doc.expiryDate ? `กำหนดวันหมดอายุเอกสาร: ${doc.expiryDate}` : 'เอกสารไม่มีกำหนดวันหมดอายุ',
          badgeLabel: 'เอกสารแนบ',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
          iconBgClass: 'bg-slate-100 border-slate-300',
          iconColorClass: 'text-slate-700',
          iconType: 'file-text',
          meta: {
            recordedAt: uploadDate,
          }
        });
      });
    }

    // Sort chronologically
    return list.sort((a, b) => {
      if (sortOrder === 'DESC') {
        return b.rawTimestamp - a.rawTimestamp;
      }
      return a.rawTimestamp - b.rawTimestamp;
    });
  }, [employee, attendanceRecords, sortOrder]);

  // Filter and search
  const filteredItems = useMemo(() => {
    return timelineItems.filter((item) => {
      // Category filter
      if (filterCategory !== 'ALL' && item.category !== filterCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchSub = item.subtitle?.toLowerCase().includes(query) || false;
        const matchDesc = item.description?.toLowerCase().includes(query) || false;
        const matchDate = item.date.includes(query);
        const matchBadge = item.badgeLabel.toLowerCase().includes(query);
        if (!matchTitle && !matchSub && !matchDesc && !matchDate && !matchBadge) {
          return false;
        }
      }

      return true;
    });
  }, [timelineItems, filterCategory, searchQuery]);

  // Summary Metrics
  const summaryCounts = useMemo(() => {
    const totalAll = timelineItems.length;
    const attCount = timelineItems.filter(i => i.category === 'ATTENDANCE').length;
    const statusCount = timelineItems.filter(i => i.category === 'STATUS').length;
    const warnCount = timelineItems.filter(i => i.category === 'WARNING').length;
    const docCount = timelineItems.filter(i => i.category === 'DOCUMENT').length;

    // Detailed metrics for employee
    const empAtt = attendanceRecords.filter(r => r.employeeId === employee.id);
    const totalAbsentDays = empAtt.filter(r => r.type === 'ABSENT').reduce((acc, r) => acc + (r.amount || 0), 0);
    const totalLeaveDays = empAtt.filter(r => ['SICK', 'BUSINESS', 'ANNUAL', 'OTHER_LEAVE'].includes(r.type)).reduce((acc, r) => acc + (r.amount || 0), 0);
    const totalLateMinutes = empAtt.filter(r => r.type === 'LATE').reduce((acc, r) => acc + (r.amount || 0), 0);
    const totalOtHours = empAtt.filter(r => r.type === 'OT').reduce((acc, r) => acc + (r.amount || 0), 0);

    return {
      totalAll,
      attCount,
      statusCount,
      warnCount,
      docCount,
      totalAbsentDays,
      totalLeaveDays,
      totalLateMinutes,
      totalOtHours,
    };
  }, [timelineItems, attendanceRecords, employee.id]);

  // Handle adding new Status Change Record
  const handleSaveStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTitle.trim()) return;

    const newRecord: StatusChangeRecord = {
      id: `status-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: statusDate,
      type: statusType,
      title: statusTitle.trim(),
      fromValue: fromValue.trim() || undefined,
      toValue: toValue.trim() || undefined,
      details: statusDetails.trim() || undefined,
      recordedBy: recordedBy.trim() || 'HR Admin',
      recordedAt: new Date().toISOString(),
    };

    // Prepare updated employee
    const existingHistory = employee.statusHistory || [];
    const updatedHistory = [newRecord, ...existingHistory];

    const updatedEmployee: Employee = {
      ...employee,
      statusHistory: updatedHistory,
    };

    // If it was a promotion or department transfer, optionally update the active position/department
    if (statusType === 'PROMOTION' && toValue.trim()) {
      updatedEmployee.position = toValue.trim();
    } else if (statusType === 'TRANSFER' && toValue.trim()) {
      // If looks like department
      updatedEmployee.department = toValue.trim() as any;
    }

    if (onUpdateEmployee) {
      onUpdateEmployee(updatedEmployee);
    }

    // Reset Form
    setStatusTitle('');
    setFromValue('');
    setToValue('');
    setStatusDetails('');
    setIsAddStatusModalOpen(false);
  };

  // Export Individual Employee Attendance History to CSV directly
  const handleExportAttendanceCSV = () => {
    // 1. Gather all attendance records for this employee
    const recordsToExport = attendanceRecords.filter(r => r.employeeId === employee.id);

    // Helper to safely format CSV values
    const escapeCell = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows: string[] = [];

    // Header Metadata
    csvRows.push([escapeCell('รายงานประวัติเวลาปฏิบัติงานและการลา (Individual Employee Attendance & Leave History)')].join(','));
    csvRows.push([escapeCell('รหัสพนักงาน'), escapeCell(employee.id)].join(','));
    csvRows.push([escapeCell('ชื่อ-นามสกุล'), escapeCell(employee.fullName)].join(','));
    csvRows.push([escapeCell('ชื่อเล่น'), escapeCell(employee.nickname || '-')].join(','));
    csvRows.push([escapeCell('แผนก'), escapeCell(employee.department)].join(','));
    csvRows.push([escapeCell('ตำแหน่ง'), escapeCell(employee.position)].join(','));
    csvRows.push([escapeCell('สาขา/สถานที่ปฏิบัติงาน'), escapeCell(employee.branch || 'สำนักงานใหญ่ (เชียงใหม่)')].join(','));
    csvRows.push([escapeCell('ประเภทการจ้างงาน'), escapeCell(
      employee.employmentType === 'FULL_TIME' ? 'พนักงานประจำ' :
      employee.employmentType === 'PROBATION' ? 'ทดลองงาน' :
      employee.employmentType === 'DAILY' ? 'พนักงานรายวัน' :
      employee.employmentType === 'CONTRACT' ? 'สัญญาจ้าง' : 'พาร์ทไทม์'
    )].join(','));
    csvRows.push([escapeCell('วันที่เริ่มงาน'), escapeCell(employee.startDate || '-')].join(','));
    csvRows.push([escapeCell('วันที่ส่งออกข้อมูล'), escapeCell(new Date().toLocaleString('th-TH'))].join(','));
    csvRows.push(''); // Empty line

    // Section 1: Detailed Daily Attendance & Leave Logs
    csvRows.push([escapeCell('=== รายการบันทึกเวลาและการลารายวัน (Daily Attendance & Leave Logs) ===')].join(','));
    const logHeaders = [
      'ลำดับ',
      'วันที่เริ่มต้น',
      'วันที่สิ้นสุด',
      'ประเภทรายการ',
      'รหัสประเภท (Type Code)',
      'จำนวน',
      'หน่วย',
      'เหตุผล / รายละเอียด',
      'วันเวลาที่บันทึก'
    ];
    csvRows.push(logHeaders.map(escapeCell).join(','));

    if (recordsToExport.length === 0) {
      csvRows.push([
        escapeCell('-'),
        escapeCell('-'),
        escapeCell('-'),
        escapeCell('ไม่มีประวัติการขาด ลา มาสาย หรือโอที ที่บันทึกไว้'),
        escapeCell('-'),
        escapeCell(0),
        escapeCell('-'),
        escapeCell('-'),
        escapeCell('-')
      ].join(','));
    } else {
      // Sort descending by date
      const sortedRecords = [...recordsToExport].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      sortedRecords.forEach((rec, index) => {
        let typeLabel = '';
        let unit = 'วัน';
        switch (rec.type) {
          case 'SICK': typeLabel = 'ลาป่วย (Sick Leave)'; unit = 'วัน'; break;
          case 'BUSINESS': typeLabel = 'ลากิจ (Business Leave)'; unit = 'วัน'; break;
          case 'ANNUAL': typeLabel = 'ลาพักผ่อนประจำปี (Annual Leave)'; unit = 'วัน'; break;
          case 'OTHER_LEAVE': typeLabel = 'ลาอื่นๆ (Other Leave)'; unit = 'วัน'; break;
          case 'ABSENT': typeLabel = 'ขาดงาน (Absent)'; unit = 'วัน'; break;
          case 'LATE': typeLabel = 'มาสาย (Late)'; unit = 'นาที'; break;
          case 'OT': typeLabel = 'ทำงานล่วงเวลา (OT)'; unit = 'ชั่วโมง'; break;
          default: typeLabel = rec.type; unit = 'วัน'; break;
        }

        const row = [
          escapeCell(index + 1),
          escapeCell(rec.date),
          escapeCell(rec.endDate || rec.date),
          escapeCell(typeLabel),
          escapeCell(rec.type),
          escapeCell(rec.amount),
          escapeCell(unit),
          escapeCell(rec.reason || '-'),
          escapeCell(rec.recordedAt || '-')
        ];
        csvRows.push(row.join(','));
      });
    }

    csvRows.push(''); // Empty line

    // Section 2: Monthly Attendance Summary Table (if exists)
    if (employee.attendanceHistory && employee.attendanceHistory.length > 0) {
      csvRows.push([escapeCell('=== สรุปสถิติเวลาการทำงานรายเดือน (Monthly Attendance Summary) ===')].join(','));
      const summaryHeaders = [
        'ปี พ.ศ.',
        'เดือน',
        'ขาดงาน (วัน)',
        'ลาป่วย (วัน)',
        'ลากิจ (วัน)',
        'พักร้อน (วัน)',
        'ลาอื่นๆ (วัน)',
        'รวมวันลาทั้งหมด (วัน)',
        'มาสาย (ครั้ง)',
        'มาสาย (นาที)',
        'โอที OT (ชั่วโมง)',
        'ถูกตักเตือน (ครั้ง)'
      ];
      csvRows.push(summaryHeaders.map(escapeCell).join(','));

      employee.attendanceHistory.forEach((m) => {
        const monthName = THAI_MONTHS[m.month - 1] || `เดือน ${m.month}`;
        const yearBE = m.year > 2500 ? m.year : m.year + 543;
        const totalLeaves = (m.sickLeaveDays || 0) + (m.businessLeaveDays || 0) + (m.annualLeaveDays || 0) + (m.otherLeaveDays || 0);

        const row = [
          escapeCell(yearBE),
          escapeCell(monthName),
          escapeCell(m.absentDays || 0),
          escapeCell(m.sickLeaveDays || 0),
          escapeCell(m.businessLeaveDays || 0),
          escapeCell(m.annualLeaveDays || 0),
          escapeCell(m.otherLeaveDays || 0),
          escapeCell(totalLeaves),
          escapeCell(m.lateCount || 0),
          escapeCell(m.lateMinutes || 0),
          escapeCell(m.otHours || 0),
          escapeCell(m.warningCount || 0)
        ];
        csvRows.push(row.join(','));
      });
    }

    // Combine with UTF-8 BOM for Thai character compatibility in Excel/Sheets
    const csvString = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (employee.fullName || 'employee').replace(/[^a-zA-Z0-9ก-๙]/g, '_');
    const dateStamp = new Date().toISOString().split('T')[0];
    const fileName = `attendance_${employee.id}_${safeName}_${dateStamp}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show visual confirmation toast
    setExportSuccessMsg(`ส่งออกไฟล์ CSV สำเร็จ: ${fileName} (${recordsToExport.length} รายการบันทึก)`);
    setTimeout(() => setExportSuccessMsg(null), 4500);
  };

  // Render Icon according to type
  const renderTimelineIcon = (iconType: TimelineItem['iconType']) => {
    switch (iconType) {
      case 'user-check':
        return <UserCheck className="w-4 h-4" />;
      case 'user-minus':
        return <UserMinus className="w-4 h-4" />;
      case 'clock':
        return <Clock className="w-4 h-4" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4" />;
      case 'award':
        return <Award className="w-4 h-4" />;
      case 'dollar':
        return <DollarSign className="w-4 h-4" />;
      case 'file-text':
        return <FileText className="w-4 h-4" />;
      case 'transfer':
        return <Building2 className="w-4 h-4" />;
      case 'calendar':
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-5 text-slate-800">
      
      {/* Top Header & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 sm:p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">
                ไทม์ไลน์กิจกรรมและประวัติสถานะ (Activity Timeline)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 border border-blue-400/40">
                {timelineItems.length} รายการ
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              รวมประวัติเวลาปฏิบัติงาน, การลา, การเปลี่ยนตำแหน่ง/เงินเดือน, การตักเตือน, และสถานะการจ้างงานของ {employee.fullName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportAttendanceCSV}
            title="ส่งออกประวัติเวลาปฏิบัติงานและการลาทั้งหมดของพนักงานท่านนี้เป็นไฟล์ CSV"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ส่งออกประวัติเวลา (CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddStatusModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>บันทึกสถานะ / หมายเหตุ HR</span>
          </button>

          {onOpenQuickAttendanceForm && (
            <button
              type="button"
              onClick={() => onOpenQuickAttendanceForm(employee)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition"
            >
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>บันทึกเวลา/การลา</span>
            </button>
          )}
        </div>
      </div>

      {/* Export Success Alert */}
      {exportSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{exportSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportSuccessMsg(null)}
            className="text-emerald-500 hover:text-emerald-700 ml-2 p-0.5 rounded transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-[11px] text-slate-500 block font-medium">วันลาสะสมทั้งหมด</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base font-bold text-blue-700">{summaryCounts.totalLeaveDays}</span>
            <span className="text-xs text-slate-400">วัน</span>
          </div>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-[11px] text-slate-500 block font-medium">ขาดงานสะสม</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-base font-bold ${summaryCounts.totalAbsentDays > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {summaryCounts.totalAbsentDays}
            </span>
            <span className="text-xs text-slate-400">วัน</span>
          </div>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-[11px] text-slate-500 block font-medium">มาสายสะสม</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-base font-bold ${summaryCounts.totalLateMinutes > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
              {summaryCounts.totalLateMinutes}
            </span>
            <span className="text-xs text-slate-400">นาที</span>
          </div>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-[11px] text-slate-500 block font-medium">โอที (OT สะสม)</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base font-bold text-teal-600">{summaryCounts.totalOtHours}</span>
            <span className="text-xs text-slate-400">ชม.</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              filterCategory === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            ทั้งหมด ({summaryCounts.totalAll})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('ATTENDANCE')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
              filterCategory === 'ATTENDANCE'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>เข้างาน & วันลา ({summaryCounts.attCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('STATUS')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
              filterCategory === 'STATUS'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Award className="w-3 h-3" />
            <span>สถานะ & งาน ({summaryCounts.statusCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('WARNING')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
              filterCategory === 'WARNING'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>การตักเตือน ({summaryCounts.warnCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('DOCUMENT')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
              filterCategory === 'DOCUMENT'
                ? 'bg-slate-700 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>เอกสาร ({summaryCounts.docCount})</span>
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาในไทม์ไลน์..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-slate-100 font-semibold"
            title={sortOrder === 'DESC' ? 'เรียงจากล่าสุดไปเก่าสุด' : 'เรียงจากเก่าสุดไปล่าสุด'}
          >
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
            <span>{sortOrder === 'DESC' ? 'ล่าสุดก่อน' : 'เก่าสุดก่อน'}</span>
          </button>
        </div>
      </div>

      {/* Main Timeline Track */}
      <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 space-y-5">
        
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-6">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">ไม่พบรายการกิจกรรมตามเงื่อนไขที่เลือก</p>
            <p className="text-xs text-slate-400 mt-1">
              ลองเปลี่ยนตัวกรองหมวดหมู่ หรือกด "บันทึกสถานะ / หมายเหตุ HR" เพื่อเพิ่มประวัติใหม่
            </p>
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const relTime = getRelativeTime(item.date);
            return (
              <div 
                key={item.id || index}
                className="relative group transition-all"
              >
                {/* Timeline node icon */}
                <div 
                  className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 ${item.iconBgClass} ${item.iconColorClass}`}
                >
                  {renderTimelineIcon(item.iconType)}
                </div>

                {/* Timeline Card */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-300 hover:shadow-xs transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                    
                    {/* Header with Title and Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900">
                        {item.title}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeClass}`}>
                        {item.badgeLabel}
                      </span>
                      {item.amountText && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {item.amountText}
                        </span>
                      )}
                    </div>

                    {/* Date and Relative Tag */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
                      <span className="font-medium text-slate-700 font-mono">
                        {formatThaiDate(item.date)}
                      </span>
                      {relTime && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-normal">
                          {relTime}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Subtitle / Change context if present */}
                  {item.subtitle && (
                    <p className="text-xs text-slate-600 font-medium mb-1">
                      {item.subtitle}
                    </p>
                  )}

                  {/* Description / Reason Notes */}
                  {item.description && (
                    <div className="mt-1 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                      {item.description}
                    </div>
                  )}

                  {/* Footer metadata if present */}
                  {item.meta && (item.meta.recordedBy || item.meta.recordedAt) && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      {item.meta.recordedBy && (
                        <span>บันทึกโดย: <strong className="text-slate-600 font-medium">{item.meta.recordedBy}</strong></span>
                      )}
                      {item.meta.recordedAt && (
                        <span className="font-mono">
                          เวลาบันทึก: {new Date(item.meta.recordedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Add New Status Change / HR Note */}
      {isAddStatusModalOpen && (
        <div 
          className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsAddStatusModalOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 overflow-hidden space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    บันทึกการเปลี่ยนสถานะ / ประวัติ HR
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    บันทึกข้อมูลสำหรับ {employee.fullName} ({employee.id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStatusModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStatusChange} className="space-y-3.5 text-xs">
              
              {/* Type Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ประเภทเหตุการณ์ / สถานะ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={statusType}
                  onChange={(e) => {
                    const t = e.target.value as StatusChangeType;
                    setStatusType(t);
                    if (t === 'PROMOTION' && !statusTitle) setStatusTitle('เลื่อนตำแหน่ง / ปรับระดับงาน');
                    else if (t === 'TRANSFER' && !statusTitle) setStatusTitle('โอนย้ายแผนก / สถานที่ทำงาน');
                    else if (t === 'SALARY_ADJUST' && !statusTitle) setStatusTitle('ปรับอัตราเงินเดือน / ค่าตอบแทน');
                    else if (t === 'PROBATION_PASS' && !statusTitle) setStatusTitle('ผ่านการประเมินทดลองงาน');
                    else if (t === 'CONTRACT_RENEWAL' && !statusTitle) setStatusTitle('ต่ออายุสัญญาจ้างงาน');
                    else if (t === 'HR_NOTE' && !statusTitle) setStatusTitle('บันทึกหมายเหตุทางบุคคล');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="PROMOTION">เลื่อนตำแหน่ง (Promotion)</option>
                  <option value="TRANSFER">โอนย้ายแผนก/สาขา (Transfer)</option>
                  <option value="SALARY_ADJUST">ปรับเงินเดือน/ค่าตอบแทน (Salary Adjustment)</option>
                  <option value="PROBATION_PASS">ผ่านการทดลองงาน (Passed Probation)</option>
                  <option value="CONTRACT_RENEWAL">ต่อสัญญาจ้างงาน (Contract Renewal)</option>
                  <option value="HR_NOTE">บันทึกหมายเหตุทั่วไป (HR Note)</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  มีผลตั้งแต่วันที่ (Effective Date) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={statusDate}
                  onChange={(e) => setStatusDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              {/* Title */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  หัวข้อรายการ / คำอธิบายสั้น <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={statusTitle}
                  onChange={(e) => setStatusTitle(e.target.value)}
                  placeholder="เช่น เลื่อนตำแหน่งเป็นหัวหน้ากะ, ปรับเงินเดือนประจำปี"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none font-medium"
                  required
                />
              </div>

              {/* From / To Value (for Promotion / Salary / Transfer) */}
              {(statusType === 'PROMOTION' || statusType === 'TRANSFER' || statusType === 'SALARY_ADJUST') && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">
                      {statusType === 'SALARY_ADJUST' ? 'เงินเดือนเดิม (บาท)' : 'ค่าเดิม (จาก)'}
                    </label>
                    <input
                      type="text"
                      value={fromValue}
                      onChange={(e) => setFromValue(e.target.value)}
                      placeholder={
                        statusType === 'SALARY_ADJUST' ? String(employee.salary) :
                        statusType === 'PROMOTION' ? employee.position :
                        employee.department
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">
                      {statusType === 'SALARY_ADJUST' ? 'เงินเดือนใหม่ (บาท)' : 'ค่าใหม่ (เป็น)'}
                    </label>
                    <input
                      type="text"
                      value={toValue}
                      onChange={(e) => setToValue(e.target.value)}
                      placeholder={
                        statusType === 'SALARY_ADJUST' ? 'เช่น 22,000' :
                        statusType === 'PROMOTION' ? 'เช่น หัวหน้าเชฟ, ผู้จัดการร้าน' :
                        'เช่น แผนกครัว, แผนกบริการหน้าร้าน'
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Details / Notes */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  รายละเอียดเพิ่มเติม / เหตุผลในการอนุมัติ
                </label>
                <textarea
                  rows={3}
                  value={statusDetails}
                  onChange={(e) => setStatusDetails(e.target.value)}
                  placeholder="ระบุเหตุผลการปรับเปลี่ยน, ผลการประเมิน, หรือหมายเหตุสำหรับอ้างอิง..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Recorded By */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ผู้บันทึกข้อมูล (Recorded By)
                </label>
                <input
                  type="text"
                  value={recordedBy}
                  onChange={(e) => setRecordedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddStatusModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>บันทึกลงไทม์ไลน์</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
