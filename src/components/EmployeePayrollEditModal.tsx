import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  User, 
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Employee, PayrollCalculation } from '../types';
import { formatCurrency } from '../utils/payrollCalculator';

export interface EmployeePayrollRuleConfig {
  daysWorked: number;
  leaveDays: number;
  absentDays: number;
  otHours: number;
  otMultiplier: number;
  lateMinutes: number;
  lateGraceMinutes: number;
  lateRatePerMinute: number;
  deductLate: boolean;
  deductAbsentAndLeave: boolean;
  attendanceBonus: number;
  allowance: number;
  notes?: string;
}

interface EmployeePayrollEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  currentPayroll: PayrollCalculation | null;
  initialConfig?: Partial<EmployeePayrollRuleConfig>;
  onSave: (employeeId: string, config: EmployeePayrollRuleConfig) => void;
}

export const EmployeePayrollEditModal: React.FC<EmployeePayrollEditModalProps> = ({
  isOpen,
  onClose,
  employee,
  currentPayroll,
  initialConfig,
  onSave,
}) => {
  if (!isOpen || !employee || !currentPayroll) return null;

  const [daysWorked, setDaysWorked] = useState<number>(initialConfig?.daysWorked ?? currentPayroll.daysWorked);
  const [leaveDays, setLeaveDays] = useState<number>(initialConfig?.leaveDays ?? currentPayroll.leaveDays);
  const [absentDays, setAbsentDays] = useState<number>(initialConfig?.absentDays ?? currentPayroll.absentDays ?? 0);
  const [otHours, setOtHours] = useState<number>(initialConfig?.otHours ?? currentPayroll.otHours);
  const [otMultiplier, setOtMultiplier] = useState<number>(initialConfig?.otMultiplier ?? 1.5);
  const [lateMinutes, setLateMinutes] = useState<number>(initialConfig?.lateMinutes ?? currentPayroll.lateMinutes ?? 0);
  const [lateGraceMinutes, setLateGraceMinutes] = useState<number>(initialConfig?.lateGraceMinutes ?? 30);
  const [lateRatePerMinute, setLateRatePerMinute] = useState<number>(initialConfig?.lateRatePerMinute ?? 10);
  
  // Toggles for Deduct / Do Not Deduct
  const [deductLate, setDeductLate] = useState<boolean>(initialConfig?.deductLate ?? true);
  const [deductAbsentAndLeave, setDeductAbsentAndLeave] = useState<boolean>(initialConfig?.deductAbsentAndLeave ?? true);

  const [attendanceBonus, setAttendanceBonus] = useState<number>(initialConfig?.attendanceBonus ?? currentPayroll.attendanceBonus);
  const [allowance, setAllowance] = useState<number>(initialConfig?.allowance ?? currentPayroll.positionAllowance);
  const [notes, setNotes] = useState<string>(initialConfig?.notes ?? '');

  // Live Calculations
  const baseSalary = employee.salary || 0;
  const dailyRate = Math.round(baseSalary / 30);
  const hourlyRate = Math.round((dailyRate / 8) * 100) / 100;

  // OT Pay
  const otPay = Math.round(otHours * (hourlyRate * otMultiplier));

  // Absent & Leave deduction
  const calculatedAbsentDeduction = absentDays * dailyRate;
  const calculatedLeaveDeduction = leaveDays * dailyRate;
  const effectiveAbsentLeaveDeduction = deductAbsentAndLeave ? (calculatedAbsentDeduction + calculatedLeaveDeduction) : 0;

  // Late deduction
  const billableMinutes = Math.max(0, lateMinutes - lateGraceMinutes);
  const calculatedLateDeduction = billableMinutes * lateRatePerMinute;
  const effectiveLateDeduction = deductLate ? calculatedLateDeduction : 0;

  // SSO & Tax
  let ssoBase = baseSalary;
  if (ssoBase > 15000) ssoBase = 15000;
  if (ssoBase < 1650) ssoBase = 1650;
  const socialSecurity = Math.round(ssoBase * 0.05);
  const taxWithheld = currentPayroll.taxWithheld || 0;

  // Totals
  const totalIncome = baseSalary + allowance + attendanceBonus + otPay;
  const totalDeductions = effectiveAbsentLeaveDeduction + effectiveLateDeduction + socialSecurity + taxWithheld;
  const netSalary = Math.max(0, totalIncome - totalDeductions);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(employee.id, {
      daysWorked,
      leaveDays,
      absentDays,
      otHours,
      otMultiplier,
      lateMinutes,
      lateGraceMinutes,
      lateRatePerMinute,
      deductLate,
      deductAbsentAndLeave,
      attendanceBonus,
      allowance,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-blue-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                <span>แก้ไขเงื่อนไขเวลา & เงินเดือนรายบุคคล</span>
              </h3>
              <p className="text-xs text-blue-200">
                พนักงาน: {employee.fullName} ({employee.id}) • ฐานเงินเดือน {formatCurrency(baseSalary)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Deduct / No-Deduct Core Toggles Banner */}
          <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>สวิตช์ควบคุม: หักเงิน หรือ ไม่หักเงิน (Deduction Controls)</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                เลือก "ไม่หัก" หากได้รับยกเว้นหรืออนุญาตพิเศษ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Toggle Late */}
              <div className={`p-3 rounded-xl border transition flex items-center justify-between ${
                deductLate 
                  ? 'bg-amber-50/70 border-amber-300' 
                  : 'bg-emerald-50/70 border-emerald-300'
              }`}>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">การหักเงินมาสาย</span>
                  <span className="text-[11px] text-slate-500">
                    {deductLate ? `หักตามเงื่อนไข (-${formatCurrency(calculatedLateDeduction)})` : 'ไม่หักเงิน (0 บาท)'}
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setDeductLate(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      deductLate 
                        ? 'bg-amber-600 text-white shadow-2xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    หัก
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeductLate(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      !deductLate 
                        ? 'bg-emerald-600 text-white shadow-2xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    ไม่หัก
                  </button>
                </div>
              </div>

              {/* Toggle Absent / Leave */}
              <div className={`p-3 rounded-xl border transition flex items-center justify-between ${
                deductAbsentAndLeave 
                  ? 'bg-rose-50/70 border-rose-300' 
                  : 'bg-emerald-50/70 border-emerald-300'
              }`}>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">การหักเงินขาด/ลา</span>
                  <span className="text-[11px] text-slate-500">
                    {deductAbsentAndLeave ? `หักตามเงื่อนไข (-${formatCurrency(calculatedAbsentDeduction + calculatedLeaveDeduction)})` : 'ไม่หักเงิน (0 บาท)'}
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setDeductAbsentAndLeave(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      deductAbsentAndLeave 
                        ? 'bg-rose-600 text-white shadow-2xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    หัก
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeductAbsentAndLeave(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      !deductAbsentAndLeave 
                        ? 'bg-emerald-600 text-white shadow-2xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    ไม่หัก
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: วันทำงาน และการลา/ขาด */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>เวลาและสถิติการมาทำงาน (Attendance & Days Worked)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  วันทำงานจริง (วัน)
                </label>
                <input
                  type="number"
                  min="0"
                  max="31"
                  step="0.5"
                  value={daysWorked}
                  onChange={(e) => setDaysWorked(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-blue-900"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">ปกติ 26 หรือ 30 วัน</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  วันลา (วัน)
                </label>
                <input
                  type="number"
                  min="0"
                  max="31"
                  step="0.5"
                  value={leaveDays}
                  onChange={(e) => setLeaveDays(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-amber-900"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">หักเงิน: {deductAbsentAndLeave ? `${formatCurrency(calculatedLeaveDeduction)}` : 'ยกเว้น (0 บ.)'}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  วันขาดงาน (วัน)
                </label>
                <input
                  type="number"
                  min="0"
                  max="31"
                  step="1"
                  value={absentDays}
                  onChange={(e) => setAbsentDays(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-rose-900"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">หักเงิน: {deductAbsentAndLeave ? `${formatCurrency(calculatedAbsentDeduction)}` : 'ยกเว้น (0 บ.)'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: ค่าล่วงเวลา OT & การมาสาย */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>ชั่วโมงล่วงเวลา OT & เงื่อนไขการมาสาย</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* OT Group */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-blue-900 block">ชั่วโมง OT (Overtime)</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      ชม. ล่วงเวลา
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={otHours}
                      onChange={(e) => setOtHours(Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-blue-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      ตัวคูณอัตรา OT
                    </label>
                    <select
                      value={otMultiplier}
                      onChange={(e) => setOtMultiplier(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                    >
                      <option value={1.5}>1.5 เท่า (วันทำงานปกติ)</option>
                      <option value={1.0}>1.0 เท่า</option>
                      <option value={2.0}>2.0 เท่า (วันหยุด)</option>
                      <option value={3.0}>3.0 เท่า (OT วันหยุด)</option>
                    </select>
                  </div>
                </div>

                <div className="text-[11px] text-blue-800 font-semibold pt-1 border-t border-slate-100 flex justify-between">
                  <span>ค่าล่วงเวลาที่จะได้รับ:</span>
                  <span className="font-bold">{formatCurrency(otPay)}</span>
                </div>
              </div>

              {/* Late Group */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900">เงื่อนไขเวลามาสาย</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${deductLate ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {deductLate ? 'หักเงิน' : 'ไม่หัก'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      สาย (นาที)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={lateMinutes}
                      onChange={(e) => setLateMinutes(Number(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-amber-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      ฟรี (นาที)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={lateGraceMinutes}
                      onChange={(e) => setLateGraceMinutes(Number(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      title="ไม่เกินกี่นาทีไม่หัก"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      บาท/นาที
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={lateRatePerMinute}
                      onChange={(e) => setLateRatePerMinute(Number(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-amber-900 font-semibold pt-1 border-t border-slate-100 flex justify-between">
                  <span>ยอดหักมาสาย:</span>
                  <span className="font-bold">{deductLate ? `-${formatCurrency(effectiveLateDeduction)}` : 'ไม่หัก (0 บ.)'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: เงินเพิ่มพิเศษ / เบี้ยขยัน */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>เงินเพิ่มพิเศษ & เบี้ยขยัน</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เบี้ยขยัน (บาท)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={attendanceBonus}
                  onChange={(e) => setAttendanceBonus(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ค่าตำแหน่ง / สวัสดิการพิเศษ (บาท)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={allowance}
                  onChange={(e) => setAllowance(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  หมายเหตุ / เหตุผลการปรับปรุงเงื่อนไขพิเศษ
                </label>
                <input
                  type="text"
                  placeholder="เช่น ยกเว้นหักสายเนื่องจากปฏิบัติงานนอกสถานที่ หรือ อนุมัติเบี้ยขยันพิเศษ"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* Live Calculation Preview Card */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl space-y-3">
            <span className="text-xs font-bold text-blue-300 block">
              สรุปคำนวณเงินเดือนสุทธิแบบเรียลไทม์ (Live Calculated Result):
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white/10 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-300 block">ฐานเงินเดือน</span>
                <span className="font-bold">{formatCurrency(baseSalary)}</span>
              </div>
              <div className="bg-white/10 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-300 block">รวมรายได้ทั้งหมด</span>
                <span className="font-bold text-emerald-300">+{formatCurrency(totalIncome)}</span>
              </div>
              <div className="bg-white/10 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-300 block">รวมรายการหัก</span>
                <span className="font-bold text-rose-300">-{formatCurrency(totalDeductions)}</span>
              </div>
              <div className="bg-emerald-500/20 border border-emerald-400/30 p-2.5 rounded-xl">
                <span className="text-[10px] text-emerald-200 block">เงินได้สุทธิ (Net)</span>
                <span className="font-black text-sm text-emerald-300">{formatCurrency(netSalary)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกเงื่อนไขเงินเดือน</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
