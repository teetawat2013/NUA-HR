import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  Printer, 
  Download, 
  FileText, 
  CheckCircle2, 
  Calculator, 
  ShieldCheck, 
  TrendingUp,
  Search,
  Eye,
  Calendar,
  Clock,
  AlertCircle,
  HelpCircle,
  FileSpreadsheet,
  Upload,
  Edit3,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { Employee, PayrollCalculation, DEPARTMENTS } from '../types';
import { calculateEmployeePayroll, formatCurrency, getNationalityFlag, THAI_MONTHS } from '../utils/payrollCalculator';
import { showConfirmDialog, showToast } from '../utils/swal';
import { PayslipModal } from './PayslipModal';
import { PayrollExcelImportModal, ImportedPayrollRow } from './PayrollExcelImportModal';
import { EmployeePayrollEditModal, EmployeePayrollRuleConfig } from './EmployeePayrollEditModal';
import * as XLSX from 'xlsx';

interface PayrollViewProps {
  employees: Employee[];
  onViewPayslip?: (employee: Employee) => void;
}

export const PayrollView: React.FC<PayrollViewProps> = ({
  employees,
  onViewPayslip,
}) => {
  const activeEmployees = employees.filter(e => !e.resignation.isResigned);

  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [workingDaysStandard, setWorkingDaysStandard] = useState<number>(26);
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  
  // Modals
  const [isPayslipOpen, setIsPayslipOpen] = useState(false);
  const [selectedPayslipEmp, setSelectedPayslipEmp] = useState<Employee | null>(null);
  const [selectedPayslipCalculation, setSelectedPayslipCalculation] = useState<PayrollCalculation | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditRuleModalOpen, setIsEditRuleModalOpen] = useState(false);
  const [selectedEditEmp, setSelectedEditEmp] = useState<Employee | null>(null);
  const [selectedEditPayroll, setSelectedEditPayroll] = useState<PayrollCalculation | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Overrides state per employee (custom time, hours, rates, and deduct/no-deduct flags)
  const [overrides, setOverrides] = useState<Record<string, EmployeePayrollRuleConfig>>(() => {
    try {
      const raw = localStorage.getItem(`hrm_payroll_overrides_${year}_${month}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Re-read overrides when month/year changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`hrm_payroll_overrides_${year}_${month}`);
      setOverrides(raw ? JSON.parse(raw) : {});
    } catch {
      setOverrides({});
    }
  }, [month, year]);

  const saveOverrides = (newOverrides: Record<string, EmployeePayrollRuleConfig>) => {
    setOverrides(newOverrides);
    try {
      localStorage.setItem(`hrm_payroll_overrides_${year}_${month}`, JSON.stringify(newOverrides));
    } catch (e) {
      console.error('Failed to save payroll overrides', e);
    }
  };

  // Calculate payroll with custom overrides for working days, OT, and deductions
  const calculateWithOverrides = (emp: Employee): PayrollCalculation => {
    const std = calculateEmployeePayroll(emp, month, year, workingDaysStandard);
    const ov = overrides[emp.id];
    if (!ov) return std;

    const baseSalary = emp.salary || 0;
    const dailyRate = Math.round(baseSalary / 30);
    const hourlyRate = Math.round((dailyRate / 8) * 100) / 100;

    const daysWorked = ov.daysWorked !== undefined ? ov.daysWorked : std.daysWorked;
    const leaveDays = ov.leaveDays !== undefined ? ov.leaveDays : std.leaveDays;
    const absentDays = ov.absentDays !== undefined ? ov.absentDays : (std.absentDays || 0);

    const otHours = ov.otHours !== undefined ? ov.otHours : std.otHours;
    const otMultiplier = ov.otMultiplier !== undefined ? ov.otMultiplier : 1.5;
    const otPay = Math.round(otHours * (hourlyRate * otMultiplier));

    const lateMinutes = ov.lateMinutes !== undefined ? ov.lateMinutes : (std.lateMinutes || 0);
    const lateGraceMinutes = ov.lateGraceMinutes !== undefined ? ov.lateGraceMinutes : 30;
    const lateRatePerMinute = ov.lateRatePerMinute !== undefined ? ov.lateRatePerMinute : 10;

    // Deduct Late?
    const deductLate = ov.deductLate !== undefined ? ov.deductLate : true;
    const billableLateMinutes = Math.max(0, lateMinutes - lateGraceMinutes);
    const lateDeduction = deductLate ? (billableLateMinutes * lateRatePerMinute) : 0;

    // Deduct Absent & Leave?
    const deductAbsentAndLeave = ov.deductAbsentAndLeave !== undefined ? ov.deductAbsentAndLeave : true;
    const absentDeduction = deductAbsentAndLeave ? (absentDays * dailyRate) : 0;
    const leaveDeduction = deductAbsentAndLeave ? (leaveDays * dailyRate) : 0;

    const allowance = ov.allowance !== undefined ? ov.allowance : std.positionAllowance;
    const attendanceBonus = ov.attendanceBonus !== undefined ? ov.attendanceBonus : std.attendanceBonus;

    const totalIncome = baseSalary + allowance + attendanceBonus + otPay;
    const socialSecurity = std.socialSecurity;
    const taxWithheld = std.taxWithheld;
    const totalDeductions = absentDeduction + leaveDeduction + lateDeduction + socialSecurity + taxWithheld;
    const netSalary = Math.max(0, totalIncome - totalDeductions);

    return {
      ...std,
      daysWorked,
      leaveDays,
      absentDays,
      dailyRate,
      hourlyRate,
      otHours,
      otPay,
      lateMinutes,
      billableLateMinutes,
      lateDeduction,
      absentDeduction,
      leaveDeduction,
      positionAllowance: allowance,
      allowance,
      attendanceBonus,
      totalIncome,
      totalDeductions,
      netSalary,
    };
  };

  // Full payroll list
  const payrollList: { employee: Employee; payroll: PayrollCalculation }[] = useMemo(() => {
    return activeEmployees.map(emp => ({
      employee: emp,
      payroll: calculateWithOverrides(emp),
    }));
  }, [activeEmployees, month, year, workingDaysStandard, overrides]);

  // Quick Row Toggle: Deduct Late
  const handleToggleDeductLate = (empId: string) => {
    const currentOv = overrides[empId] || {};
    const currentPayroll = calculateWithOverrides(activeEmployees.find(e => e.id === empId)!);
    const isCurrentlyDeducting = currentOv.deductLate !== undefined ? currentOv.deductLate : true;
    const newDeduct = !isCurrentlyDeducting;

    const updated = {
      ...overrides,
      [empId]: {
        daysWorked: currentOv.daysWorked ?? currentPayroll.daysWorked,
        leaveDays: currentOv.leaveDays ?? currentPayroll.leaveDays,
        absentDays: currentOv.absentDays ?? (currentPayroll.absentDays || 0),
        otHours: currentOv.otHours ?? currentPayroll.otHours,
        otMultiplier: currentOv.otMultiplier ?? 1.5,
        lateMinutes: currentOv.lateMinutes ?? (currentPayroll.lateMinutes || 0),
        lateGraceMinutes: currentOv.lateGraceMinutes ?? 30,
        lateRatePerMinute: currentOv.lateRatePerMinute ?? 10,
        deductLate: newDeduct,
        deductAbsentAndLeave: currentOv.deductAbsentAndLeave ?? true,
        attendanceBonus: currentOv.attendanceBonus ?? currentPayroll.attendanceBonus,
        allowance: currentOv.allowance ?? currentPayroll.positionAllowance,
      }
    };
    saveOverrides(updated);
    setToastMsg(`ปรับสถานะหักมาสายของ ${currentPayroll.employeeName}: ${newDeduct ? 'หักตามเงื่อนไข' : 'ยกเว้นไม่หักเงิน'}`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Quick Row Toggle: Deduct Absent & Leave
  const handleToggleDeductAbsentLeave = (empId: string) => {
    const currentOv = overrides[empId] || {};
    const currentPayroll = calculateWithOverrides(activeEmployees.find(e => e.id === empId)!);
    const isCurrentlyDeducting = currentOv.deductAbsentAndLeave !== undefined ? currentOv.deductAbsentAndLeave : true;
    const newDeduct = !isCurrentlyDeducting;

    const updated = {
      ...overrides,
      [empId]: {
        daysWorked: currentOv.daysWorked ?? currentPayroll.daysWorked,
        leaveDays: currentOv.leaveDays ?? currentPayroll.leaveDays,
        absentDays: currentOv.absentDays ?? (currentPayroll.absentDays || 0),
        otHours: currentOv.otHours ?? currentPayroll.otHours,
        otMultiplier: currentOv.otMultiplier ?? 1.5,
        lateMinutes: currentOv.lateMinutes ?? (currentPayroll.lateMinutes || 0),
        lateGraceMinutes: currentOv.lateGraceMinutes ?? 30,
        lateRatePerMinute: currentOv.lateRatePerMinute ?? 10,
        deductLate: currentOv.deductLate ?? true,
        deductAbsentAndLeave: newDeduct,
        attendanceBonus: currentOv.attendanceBonus ?? currentPayroll.attendanceBonus,
        allowance: currentOv.allowance ?? currentPayroll.positionAllowance,
      }
    };
    saveOverrides(updated);
    setToastMsg(`ปรับสถานะหักขาด/ลาของ ${currentPayroll.employeeName}: ${newDeduct ? 'หักตามเงื่อนไข' : 'ยกเว้นไม่หักเงิน'}`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Apply Excel Import
  const handleApplyExcelImport = (
    importedRows: ImportedPayrollRow[],
    options: { deductLate: boolean; deductAbsentAndLeave: boolean }
  ) => {
    const newOverrides = { ...overrides };
    let count = 0;

    importedRows.forEach(row => {
      const emp = row.matchedEmployee || activeEmployees.find(e => e.id === row.employeeId);
      if (!emp) return;

      newOverrides[emp.id] = {
        ...(newOverrides[emp.id] || {}),
        daysWorked: row.daysWorked,
        leaveDays: row.leaveDays,
        absentDays: row.absentDays,
        lateMinutes: row.lateMinutes,
        otHours: row.otHours,
        deductLate: options.deductLate,
        deductAbsentAndLeave: options.deductAbsentAndLeave,
        attendanceBonus: row.attendanceBonus ?? newOverrides[emp.id]?.attendanceBonus ?? (emp.salary >= 10000 ? 1000 : 0),
        allowance: row.allowance ?? newOverrides[emp.id]?.allowance ?? (emp.allowance || 0),
        otMultiplier: newOverrides[emp.id]?.otMultiplier ?? 1.5,
        lateGraceMinutes: newOverrides[emp.id]?.lateGraceMinutes ?? 30,
        lateRatePerMinute: newOverrides[emp.id]?.lateRatePerMinute ?? 10,
      };
      count++;
    });

    saveOverrides(newOverrides);
    setToastMsg(`ดึงเวลาทำงานจากไฟล์ Excel สำเร็จ ${count} คน พร้อมคำนวณเงินเดือนอัตโนมัติเรียบร้อย`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Open Edit Rule Modal
  const handleOpenEditRule = (emp: Employee, payroll: PayrollCalculation) => {
    setSelectedEditEmp(emp);
    setSelectedEditPayroll(payroll);
    setIsEditRuleModalOpen(true);
  };

  // Save Rule from Modal
  const handleSaveEmployeeRule = (employeeId: string, config: EmployeePayrollRuleConfig) => {
    const updated = {
      ...overrides,
      [employeeId]: config,
    };
    saveOverrides(updated);
    setToastMsg('บันทึกการปรับปรุงเงื่อนไขเวลาและเงินเดือนเรียบร้อยแล้ว');
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Reset Overrides
  const handleResetOverrides = async () => {
    const confirmed = await showConfirmDialog(
      'ยืนยันการรีเซ็ตเงื่อนไข',
      'คุณต้องการรีเซ็ตเงื่อนไขเวลาทำงานและค่าที่กำหนดเองทั้งหมดในงวดนี้ กลับเป็นค่ามาตรฐานใช่หรือไม่?',
      'ยืนยันรีเซ็ต'
    );
    if (confirmed) {
      saveOverrides({});
      showToast('รีเซ็ตเงื่อนไขทั้งหมดกลับเป็นค่ามาตรฐานเรียบร้อย', 'success');
    }
  };

  // Open Payslip
  const handleOpenPayslip = (emp: Employee, calc: PayrollCalculation) => {
    if (onViewPayslip) {
      onViewPayslip(emp);
    } else {
      setSelectedPayslipEmp(emp);
      setSelectedPayslipCalculation(calc);
      setIsPayslipOpen(true);
    }
  };

  // Summary Metrics
  const totalBaseSalary = payrollList.reduce((acc, curr) => acc + curr.payroll.baseSalary, 0);
  const totalAllowances = payrollList.reduce((acc, curr) => acc + curr.payroll.positionAllowance + curr.payroll.attendanceBonus, 0);
  const totalOtHours = payrollList.reduce((acc, curr) => acc + curr.payroll.otHours, 0);
  const totalOtPay = payrollList.reduce((acc, curr) => acc + curr.payroll.otPay, 0);
  const totalDaysWorked = payrollList.reduce((acc, curr) => acc + curr.payroll.daysWorked, 0);
  const totalLeaveDays = payrollList.reduce((acc, curr) => acc + curr.payroll.leaveDays, 0);
  const totalAbsentDays = payrollList.reduce((acc, curr) => acc + (curr.payroll.absentDays || 0), 0);
  const totalLateDeduction = payrollList.reduce((acc, curr) => acc + curr.payroll.lateDeduction, 0);
  const totalAbsentDeduction = payrollList.reduce((acc, curr) => acc + curr.payroll.absentDeduction, 0);
  const totalLeaveDeduction = payrollList.reduce((acc, curr) => acc + curr.payroll.leaveDeduction, 0);
  const totalSocialSecurity = payrollList.reduce((acc, curr) => acc + curr.payroll.socialSecurity, 0);
  const totalTaxWithheld = payrollList.reduce((acc, curr) => acc + curr.payroll.taxWithheld, 0);
  const totalDeductions = payrollList.reduce((acc, curr) => acc + curr.payroll.totalDeductions, 0);
  const totalNetPay = payrollList.reduce((acc, curr) => acc + curr.payroll.netSalary, 0);

  // Filter list
  const filtered = payrollList.filter(({ employee }) => {
    if (deptFilter !== 'ALL' && employee.department !== deptFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = employee.fullName.toLowerCase().includes(q);
      const matchId = employee.id.toLowerCase().includes(q);
      const matchNick = (employee.nickname || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchNick) return false;
    }
    return true;
  });

  const allDepts = Array.from(new Set([...DEPARTMENTS, ...activeEmployees.map(e => e.department)]));

  const handlePrintSummary = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = [
      'รหัสพนักงาน',
      'ชื่อ-นามสกุล',
      'สัญชาติ',
      'แผนก',
      'ตำแหน่ง',
      'วันทำงานจริง',
      'วันลา',
      'วันขาด',
      'ฐานเงินเดือน',
      'ค่าตำแหน่ง',
      'เบี้ยขยัน',
      'ชม.OT',
      'ค่าล่วงเวลาOT',
      'รวมรายได้',
      'หักขาดงาน',
      'หักวันลา',
      'หักมาสาย',
      'ประกันสังคม',
      'ภาษีหัก',
      'เงินได้สุทธิ'
    ];

    const rows = filtered.map(({ employee, payroll }) => [
      employee.id,
      `"${employee.fullName}"`,
      employee.isForeignWorker ? employee.nationalityText : 'ไทย',
      `"${employee.department}"`,
      `"${employee.position}"`,
      payroll.daysWorked,
      payroll.leaveDays,
      payroll.absentDays || 0,
      payroll.baseSalary,
      payroll.positionAllowance,
      payroll.attendanceBonus,
      payroll.otHours,
      payroll.otPay,
      payroll.totalIncome,
      payroll.absentDeduction,
      payroll.leaveDeduction,
      payroll.lateDeduction,
      payroll.socialSecurity,
      payroll.taxWithheld,
      payroll.netSalary
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `payroll_summary_${year}_${String(month).padStart(2, '0')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeOverridesCount = Object.keys(overrides).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border border-slate-700 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-white/20 rounded-full">
                ระบบสรุปเงินเดือนรายเดือน (Monthly Payroll Summary)
              </span>
              <span className="text-xs text-blue-200">
                มาตรฐานแรงงาน & ประกันสังคม ม.33
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <Calculator className="w-6 h-6 text-emerald-400" />
              <span>ตารางสรุปเงินเดือนรายเดือน (Payroll Summary)</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-2xl leading-relaxed">
              ดึงเวลาทำงานจากไฟล์ EXCEL อัตโนมัติ ปรับแก้เงื่อนไขเวลาแต่ละคน และคลิกปุ่ม "หัก / ไม่หัก" เงินได้อย่างอิสระ
            </p>
          </div>

          {/* Action Buttons in Banner */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer"
              title="นำเข้าไฟล์ Excel สรุปเวลาทำงาน"
            >
              <Upload className="w-4 h-4" />
              <span>เพิ่มไฟล์ EXCEL เวลาทำงาน</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs border border-white/20 transition cursor-pointer"
              title="ส่งออกไฟล์ Excel/CSV"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออก CSV</span>
            </button>

            <button
              onClick={handlePrintSummary}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white text-blue-900 hover:bg-blue-50 font-bold rounded-xl text-xs shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ใบสรุป</span>
            </button>
          </div>
        </div>
      </div>

      {/* Rules Indicator Note */}
      <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>เกณฑ์การคำนวณ & ปุ่มควบคุม:</strong> สามารถกดปุ่ม <strong>[หัก / ไม่หัก]</strong> ในคอลัมน์ขาดลาและมาสายเพื่อตัดสินใจหักเงินได้ทันที • มีปุ่ม <strong>"แก้ไขเวลา"</strong> เพื่อปรับเวลาทำงาน OT เบี้ยขยัน รายบุคคล
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {activeOverridesCount > 0 && (
            <button
              type="button"
              onClick={handleResetOverrides}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-rose-600 underline cursor-pointer"
              title="คืนค่าเป็นค่ามาตรฐาน"
            >
              <RotateCcw className="w-3 h-3" />
              <span>รีเซ็ตเงื่อนไขพิเศษ ({activeOverridesCount} คน)</span>
            </button>
          )}

          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <span>วันทำงานงวดนี้:</span>
            <select
              value={workingDaysStandard}
              onChange={(e) => setWorkingDaysStandard(Number(e.target.value))}
              className="px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-900"
            >
              <option value={26}>26 วัน (หยุดพฤหัส/อาทิตย์)</option>
              <option value={30}>30 วัน (ฐาน 30 วัน)</option>
              <option value={22}>22 วัน (จันทร์-ศุกร์)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Selector & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="text-xs font-bold text-slate-700">งวดเงินเดือน:</span>
          
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
          >
            {THAI_MONTHS.map((m, idx) => (
              <option key={idx} value={idx + 1}>{m}</option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
          >
            <option value={2026}>ปี 2569 (2026)</option>
            <option value={2025}>ปี 2568 (2025)</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="ALL">ทุกแผนก</option>
            {allDepts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ, รหัสพนักงาน..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Net Payroll */}
        <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl">
          <span className="text-xs font-bold text-emerald-800 block">ยอดจ่ายเงินเดือนสุทธิรวม (Net Pay)</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">
            {formatCurrency(totalNetPay)}
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">
            โอนจ่ายพนักงาน {activeEmployees.length} ท่าน
          </p>
        </div>

        {/* Total OT */}
        <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 block">ค่าล่วงเวลา (OT ทั้งหมด)</span>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-full">
              {totalOtHours} ชม.
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-900 mt-1">
            {formatCurrency(totalOtPay)}
          </div>
          <p className="text-[11px] text-blue-700 mt-1">
            คำนวณตามชั่วโมง OT จริงของแต่ละคน
          </p>
        </div>

        {/* Working & Leave Days */}
        <div className="bg-indigo-50/80 border border-indigo-200 p-4 rounded-2xl">
          <span className="text-xs font-bold text-indigo-800 block">สถิติวันทำงาน & วันลา</span>
          <div className="text-xl sm:text-2xl font-black text-indigo-900 mt-1">
            {totalDaysWorked} <span className="text-xs font-normal">แรงทำงาน</span>
          </div>
          <p className="text-[11px] text-indigo-700 mt-1">
            วันลา {totalLeaveDays} วัน • ขาด {totalAbsentDays} วัน (หัก -{formatCurrency(totalAbsentDeduction + totalLeaveDeduction)})
          </p>
        </div>

        {/* Deductions & SSO */}
        <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl">
          <span className="text-xs font-bold text-amber-800 block">ประกันสังคม & หักสาย</span>
          <div className="text-xl sm:text-2xl font-black text-amber-900 mt-1">
            {formatCurrency(totalSocialSecurity)}
          </div>
          <p className="text-[11px] text-amber-700 mt-1">
            หักสายตามจริง {formatCurrency(totalLateDeduction)} • ภาษี {formatCurrency(totalTaxWithheld)}
          </p>
        </div>

      </div>

      {/* Payroll Calculation Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span>ตารางสรุปเงินเดือนรายบุคคล ประจำงวด {THAI_MONTHS[month - 1]} {year + 543}</span>
              {activeOverridesCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  ปรับแต่ง {activeOverridesCount} คน
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              กดปุ่ม <strong className="text-slate-700">[หัก / ไม่หัก]</strong> เพื่อสลับการหักเงิน หรือคลิก <strong>"แก้ไขเวลา"</strong> เพื่อปรับเวลาทำงานแต่ละคน
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            แสดง {filtered.length} รายการ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3">พนักงาน / รหัส</th>
                <th className="p-3 text-right">เงินเดือนฐาน</th>
                <th className="p-3 text-center bg-blue-50/50">วันทำงาน</th>
                <th className="p-3 text-center bg-amber-50/50">วันลา/ขาด</th>
                <th className="p-3 text-right">ค่าตำแหน่ง</th>
                <th className="p-3 text-right">เบี้ยขยัน</th>
                <th className="p-3 text-right text-blue-700">OT (ชม./บ.)</th>
                <th className="p-3 text-center text-rose-700 bg-rose-50/30">หักขาด/ลา (ปุ่ม)</th>
                <th className="p-3 text-center text-amber-700 bg-amber-50/30">หักสาย (ปุ่ม)</th>
                <th className="p-3 text-right text-rose-700">ประกันสังคม</th>
                <th className="p-3 text-right font-black text-emerald-800">สุทธิ (บาท)</th>
                <th className="p-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map(({ employee, payroll }) => {
                  const empOverride = overrides[employee.id];
                  const isDeductLateActive = empOverride?.deductLate !== undefined ? empOverride.deductLate : true;
                  const isDeductAbsentLeaveActive = empOverride?.deductAbsentAndLeave !== undefined ? empOverride.deductAbsentAndLeave : true;
                  const hasCustomRules = Boolean(empOverride);

                  return (
                    <tr key={employee.id} className={`hover:bg-slate-50/80 transition ${hasCustomRules ? 'bg-blue-50/20' : ''}`}>
                      
                      {/* Name */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base" title={employee.isForeignWorker ? 'แรงงานต่างด้าว' : 'สัญชาติไทย'}>
                            {getNationalityFlag(employee.isForeignWorker, employee.nationalityText)}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-900">{employee.fullName}</p>
                              {hasCustomRules && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" title="มีเงื่อนไขที่กำหนดเอง" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {employee.id} • {employee.department}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Base Salary */}
                      <td className="p-3 text-right font-medium text-slate-800">
                        <div>{formatCurrency(payroll.baseSalary)}</div>
                        <div className="text-[10px] text-slate-400 font-mono">({formatCurrency(payroll.dailyRate)}/วัน)</div>
                      </td>

                      {/* Days Worked */}
                      <td className="p-3 text-center bg-blue-50/30">
                        <span className="font-bold text-slate-800 font-mono">
                          {payroll.daysWorked}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          / {payroll.workingDaysStandard} วัน
                        </span>
                      </td>

                      {/* Leave & Absent */}
                      <td className="p-3 text-center bg-amber-50/30">
                        <div className="font-mono">
                          <span className={payroll.leaveDays > 0 ? 'text-amber-800 font-bold' : 'text-slate-400'}>
                            ลา {payroll.leaveDays} วัน
                          </span>
                          {(payroll.absentDays || 0) > 0 && (
                            <span className="text-rose-600 font-bold block text-[10px]">
                              ขาด {payroll.absentDays} วัน
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Position allowance */}
                      <td className="p-3 text-right text-slate-600">
                        {payroll.positionAllowance > 0 ? formatCurrency(payroll.positionAllowance) : '-'}
                      </td>

                      {/* Attendance bonus */}
                      <td className="p-3 text-right text-emerald-700 font-medium">
                        {payroll.attendanceBonus > 0 ? `+${formatCurrency(payroll.attendanceBonus)}` : '-'}
                      </td>

                      {/* OT Pay */}
                      <td className="p-3 text-right text-blue-700 font-medium">
                        {payroll.otPay > 0 ? (
                          <div>
                            <span className="font-bold">{formatCurrency(payroll.otPay)}</span>
                            <span className="block text-[10px] text-blue-600/80">({payroll.otHours} ชม.)</span>
                          </div>
                        ) : '-'}
                      </td>

                      {/* Absent / Leave deduction WITH TOGGLE BUTTON */}
                      <td className="p-3 text-center bg-rose-50/20">
                        <div>
                          {payroll.absentDeduction + payroll.leaveDeduction > 0 ? (
                            <span className="font-bold text-rose-700">
                              -{formatCurrency(payroll.absentDeduction + payroll.leaveDeduction)}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-bold text-[11px]">
                              ไม่หัก (0 บ.)
                            </span>
                          )}
                        </div>

                        {/* Interactive Toggle Pill: หัก / ไม่หัก */}
                        <div className="inline-flex items-center gap-0.5 mt-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleToggleDeductAbsentLeave(employee.id)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                              isDeductAbsentLeaveActive 
                                ? 'bg-rose-600 text-white shadow-2xs' 
                                : 'text-slate-400 hover:text-slate-700'
                            }`}
                            title="คลิกเพื่อหักเงินขาด/ลาตามเงื่อนไข"
                          >
                            หัก
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleDeductAbsentLeave(employee.id)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                              !isDeductAbsentLeaveActive 
                                ? 'bg-emerald-600 text-white shadow-2xs' 
                                : 'text-slate-400 hover:text-slate-700'
                            }`}
                            title="คลิกเพื่อยกเว้นการหักเงิน (ไม่หัก)"
                          >
                            ไม่หัก
                          </button>
                        </div>
                      </td>

                      {/* Late deduction WITH TOGGLE BUTTON */}
                      <td className="p-3 text-center bg-amber-50/20">
                        <div>
                          {payroll.lateDeduction > 0 ? (
                            <div>
                              <span className="font-bold text-amber-800">
                                -{formatCurrency(payroll.lateDeduction)}
                              </span>
                              <span className="block text-[10px] text-slate-400 font-normal">
                                (สาย {payroll.lateMinutes || 0} น.)
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-emerald-700 font-bold text-[11px]">
                                {isDeductLateActive 
                                  ? ((payroll.lateMinutes || 0) > 0 ? `ฟรี ≤30น.` : '-') 
                                  : 'ไม่หัก (0 บ.)'}
                              </span>
                              {(payroll.lateMinutes || 0) > 0 && (
                                <span className="block text-[10px] text-slate-400 font-normal">
                                  (สาย {payroll.lateMinutes} น.)
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Interactive Toggle Pill: หัก / ไม่หัก */}
                        <div className="inline-flex items-center gap-0.5 mt-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleToggleDeductLate(employee.id)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                              isDeductLateActive 
                                ? 'bg-amber-600 text-white shadow-2xs' 
                                : 'text-slate-400 hover:text-slate-700'
                            }`}
                            title="คลิกเพื่อหักเงินมาสายตามเงื่อนไข"
                          >
                            หัก
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleDeductLate(employee.id)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                              !isDeductLateActive 
                                ? 'bg-emerald-600 text-white shadow-2xs' 
                                : 'text-slate-400 hover:text-slate-700'
                            }`}
                            title="คลิกเพื่อยกเว้นการหักเงินมาสาย (ไม่หัก)"
                          >
                            ไม่หัก
                          </button>
                        </div>
                      </td>

                      {/* SSO */}
                      <td className="p-3 text-right text-rose-600 font-medium">
                        -{formatCurrency(payroll.socialSecurity)}
                      </td>

                      {/* Net Pay */}
                      <td className="p-3 text-right font-black text-sm text-emerald-700">
                        {formatCurrency(payroll.netSalary)}
                      </td>

                      {/* Manage Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditRule(employee, payroll)}
                            className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg transition text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            title="แก้ไขเวลาทำงานและเงื่อนไขรายบุคคล"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">แก้ไขเวลา</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenPayslip(employee, payroll)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            title="ดูสลิปเงินเดือน"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>สลิป</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    ยังไม่มีข้อมูลเงินเดือน (ไม่มีพนักงานในงวดเดือนนี้)
                  </td>
                </tr>
              )}
            </tbody>

            {/* Table Footer Totals */}
            <tfoot className="bg-slate-100/90 font-bold border-t-2 border-slate-300">
              <tr>
                <td className="p-3 text-slate-900">รวมทั้งสิ้น ({filtered.length} คน)</td>
                <td className="p-3 text-right">{formatCurrency(totalBaseSalary)}</td>
                <td className="p-3 text-center text-blue-900">{totalDaysWorked} วัน</td>
                <td className="p-3 text-center text-amber-900">{totalLeaveDays} วัน</td>
                <td className="p-3 text-right">{formatCurrency(totalAllowances)}</td>
                <td className="p-3 text-right text-emerald-800">-</td>
                <td className="p-3 text-right text-blue-700">{formatCurrency(totalOtPay)}</td>
                <td className="p-3 text-center text-rose-700">-{formatCurrency(totalAbsentDeduction + totalLeaveDeduction)}</td>
                <td className="p-3 text-center text-amber-700">-{formatCurrency(totalLateDeduction)}</td>
                <td className="p-3 text-right text-rose-700">-{formatCurrency(totalSocialSecurity)}</td>
                <td className="p-3 text-right text-emerald-800 text-sm font-black">{formatCurrency(totalNetPay)}</td>
                <td className="p-3 text-center"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* EXCEL IMPORT MODAL */}
      <PayrollExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        employees={activeEmployees}
        month={month}
        year={year}
        workingDaysStandard={workingDaysStandard}
        onApplyImport={handleApplyExcelImport}
      />

      {/* EDIT INDIVIDUAL PAYROLL TIME & RULES MODAL */}
      <EmployeePayrollEditModal
        isOpen={isEditRuleModalOpen}
        onClose={() => {
          setIsEditRuleModalOpen(false);
          setSelectedEditEmp(null);
          setSelectedEditPayroll(null);
        }}
        employee={selectedEditEmp}
        currentPayroll={selectedEditPayroll}
        initialConfig={selectedEditEmp ? overrides[selectedEditEmp.id] : undefined}
        onSave={handleSaveEmployeeRule}
      />

      {/* PAYSLIP MODAL */}
      {selectedPayslipEmp && (
        <PayslipModal
          isOpen={isPayslipOpen}
          onClose={() => {
            setIsPayslipOpen(false);
            setSelectedPayslipEmp(null);
            setSelectedPayslipCalculation(null);
          }}
          employee={selectedPayslipEmp}
          month={month}
          year={year}
          customPayroll={selectedPayslipCalculation || undefined}
        />
      )}

    </div>
  );
};
