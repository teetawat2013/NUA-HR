import React from 'react';
import { X, Printer, Building2, CheckCircle2, Download } from 'lucide-react';
import { Employee, PayrollCalculation } from '../types';
import { calculateEmployeePayroll, formatCurrency, THAI_MONTHS } from '../utils/payrollCalculator';

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  month?: number;
  year?: number;
  customPayroll?: PayrollCalculation;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  isOpen,
  onClose,
  employee,
  month = new Date().getMonth() + 1,
  year = new Date().getFullYear(),
  customPayroll,
}) => {
  if (!isOpen || !employee) return null;

  const payroll = customPayroll || calculateEmployeePayroll(employee, month, year);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Action Header (Hidden in Print) */}
        <div className="no-print px-6 py-3 bg-slate-800 text-white flex items-center justify-between shrink-0">
          <span className="text-sm font-bold flex items-center gap-2">
            <span>ใบแจ้งเงินเดือน / สลิปเงินเดือน (Payslip)</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์สลิปเงินเดือน</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-700 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Payslip Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 text-slate-800 text-sm bg-white font-sans print:p-0">
          
          {/* Company Banner */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  บริษัท เอเชีย เมนูแฟคเจอร์ริ่ง แอนด์ เซอร์วิส จำกัด
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  188/9 หมู่ 2 นิคมอุตสาหกรรมบางปู ต.ท้ายบ้านใหม่ อ.เมืองสมุทรปราการ จ.สมุทรปราการ 10280
                </p>
                <p className="text-xs text-slate-500">
                  เลขประจำตัวผู้เสียภาษีอากร: 0105562089123
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded">
                  ใบจ่ายเงินเดือน (PAYSLIP)
                </span>
                <p className="text-xs font-semibold text-slate-700 mt-1">
                  ประจำงวด: {THAI_MONTHS[month - 1]} {year + 543}
                </p>
                <p className="text-[11px] text-slate-400">
                  วันที่จ่าย: 28 {THAI_MONTHS[month - 1]} {year + 543}
                </p>
              </div>
            </div>
          </div>

          {/* Employee Information Strip */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">รหัสพนักงาน:</span>
              <strong className="font-mono text-slate-900 text-sm">{employee.id}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">ชื่อ-นามสกุล:</span>
              <strong className="text-slate-900">{employee.fullName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">ตำแหน่ง:</span>
              <strong className="text-slate-900">{employee.position}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">แผนก:</span>
              <strong className="text-slate-900">{employee.department}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">สัญชาติ:</span>
              <strong className="text-slate-900">
                {employee.isForeignWorker ? employee.nationalityText : 'ไทย'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">
                {employee.isForeignWorker ? 'เลข Passport / Work Permit:' : 'เลขบัตรประชาชน:'}
              </span>
              <strong className="font-mono text-slate-900">
                {employee.isForeignWorker 
                  ? (employee.foreignDetails?.workPermitNumber || employee.foreignDetails?.passportNumber || '-')
                  : (employee.idCardNumber || '-')}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">วันทำงานจริง / วันมาตรฐาน:</span>
              <strong className="text-slate-900 font-mono">
                {payroll.daysWorked} / {payroll.workingDaysStandard} วัน
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">สถิติวันลา & ขาดงาน:</span>
              <strong className="text-slate-900">
                ลา {payroll.leaveDays} วัน {payroll.absentDays ? `(ขาด ${payroll.absentDays} วัน)` : ''}
              </strong>
            </div>
          </div>

          {/* Table of Earnings & Deductions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            
            {/* รายได้ (Earnings) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                <span className="font-bold text-xs text-slate-800 uppercase">รายได้ (EARNINGS)</span>
                <span className="text-xs text-slate-500">จำนวนเงิน (บาท)</span>
              </div>
              <div className="p-4 space-y-2 flex-1 text-xs divide-y divide-slate-100">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">เงินเดือนพื้นฐาน (Salary)</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(payroll.baseSalary)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">ค่าตำแหน่ง / เบี้ยเลี้ยง (Allowance)</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(payroll.positionAllowance)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">เบี้ยขยัน (Attendance Bonus)</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(payroll.attendanceBonus)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">ค่าล่วงเวลา ({payroll.otHours} ชม.) (OT)</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(payroll.otPay)}</span>
                </div>
              </div>
              <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex justify-between font-bold text-xs text-emerald-800">
                <span>รวมรายได้ทั้งสิ้น</span>
                <span>{formatCurrency(payroll.totalIncome)}</span>
              </div>
            </div>

            {/* รายการหัก (Deductions) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                <span className="font-bold text-xs text-slate-800 uppercase">รายการหัก (DEDUCTIONS)</span>
                <span className="text-xs text-slate-500">จำนวนเงิน (บาท)</span>
              </div>
              <div className="p-4 space-y-2 flex-1 text-xs divide-y divide-slate-100">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">หักขาดงาน (Absent Deduction)</span>
                  <span className="font-semibold text-rose-600">{formatCurrency(payroll.absentDeduction)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">หักมาสาย (Late Deduction)</span>
                  <span className="font-semibold text-rose-600">{formatCurrency(payroll.lateDeduction)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">เงินสมทบประกันสังคม (Social Security 5%)</span>
                  <span className="font-semibold text-rose-600">{formatCurrency(payroll.socialSecurity)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">ภาษีเงินได้หัก ณ ที่จ่าย (Withholding Tax)</span>
                  <span className="font-semibold text-rose-600">{formatCurrency(payroll.taxWithheld)}</span>
                </div>
              </div>
              <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex justify-between font-bold text-xs text-rose-800">
                <span>รวมรายการหักทั้งสิ้น</span>
                <span>{formatCurrency(payroll.totalDeductions)}</span>
              </div>
            </div>

          </div>

          {/* Net Payment Box */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-4 sm:p-5 rounded-xl flex items-center justify-between shadow-xs mb-8">
            <div>
              <span className="text-xs uppercase tracking-wider text-blue-100 block font-semibold">
                เงินได้สุทธิที่ได้รับ (NET SALARY PAYABLE)
              </span>
              <span className="text-xs text-blue-200">
                โอนผ่านระบบบัญชีเงินเดือนอัตโนมัติ (Payroll System)
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {formatCurrency(payroll.netSalary)}
            </div>
          </div>

          {/* Signature Block */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-600">
            <div>
              <div className="h-12 border-b border-dashed border-slate-400 mx-auto w-48 mb-2"></div>
              <p className="font-semibold text-slate-800">ลงชื่อ .....................................................</p>
              <p className="text-slate-400 text-[11px] mt-0.5">พนักงานผู้รับเงิน</p>
            </div>
            <div>
              <div className="h-12 border-b border-dashed border-slate-400 mx-auto w-48 mb-2"></div>
              <p className="font-semibold text-slate-800">ลงชื่อ .....................................................</p>
              <p className="text-slate-400 text-[11px] mt-0.5">ผู้จัดการฝ่ายทรัพยากรบุคคล / ผู้มีอำนาจจ่าย</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
