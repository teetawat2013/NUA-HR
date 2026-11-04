import { Employee, PayrollCalculation } from '../types';
import { calculateSocialSecurity } from './socialSecurity';

/**
 * คำนวณเงินเดือนตามมาตรฐานแรงงานไทย
 * - อัตราคิดต่อวัน: เงินเดือน / 30
 * - อัตราคิดต่อชั่วโมง: (เงินเดือน / 30) / 8
 * - OT อัตรา 1.5 เท่า
 * - กองทุนประกันสังคม (ม.33): 5% ของเงินเดือนฐาน ฐานต่ำสุด 1,650 และเพดานตามปี (ดู utils/socialSecurity.ts)
 * - เบี้ยขยัน: 1,000 บาท หากไม่มีขาด ไม่สาย ไม่ลา
 */
export function calculateEmployeePayroll(
  employee: Employee,
  month: number,
  year: number,
  workingDaysStandard: number = 26
): PayrollCalculation {
  const baseSalary = employee.salary || 0;
  const positionAllowance = employee.allowance || 0;

  // หาข้อมูลสถิติประจำเดือน
  const monthlyStat = employee.attendanceHistory?.find(
    (h) => h.month === month && h.year === year
  ) || {
    month,
    year,
    absentDays: 0,
    sickLeaveDays: 0,
    businessLeaveDays: 0,
    annualLeaveDays: 0,
    otherLeaveDays: 0,
    lateCount: 0,
    lateMinutes: 0,
    waivedLateMinutes: 0,
    billableLateMinutes: 0,
    otHours: 0,
    warningCount: 0,
  };

  const dailyRate = Math.round(baseSalary / 30);
  const hourlyRate = Math.round((dailyRate / 8) * 100) / 100;

  // วันลาทั้งหมด (ป่วย + กิจ + พักร้อน + อื่นๆ)
  const totalLeaveDays = 
    (monthlyStat.sickLeaveDays || 0) + 
    (monthlyStat.businessLeaveDays || 0) + 
    (monthlyStat.annualLeaveDays || 0) + 
    (monthlyStat.otherLeaveDays || 0);

  // หักลบวันลา: ตามเงื่อนไข Nua HRM Pro
  // - ถ้าเป็น Part-time (Passtime) ทุกการลาจะไม่ได้รับเงิน (Unpaid Leave 100%)
  // - ถ้าเป็นพนักงานประจำ: ลากิจ 3 วัน/ปี, ลาป่วย 30 วัน/ปี, พักร้อน 7 วัน (เมื่อครบ 1 ปี)
  // ส่วนที่เกินสิทธิ์ หรือลาอื่นๆ จัดเป็นงานไม่รับเงิน
  const isPartTime = employee.employmentType === 'PART_TIME';
  let unpaidLeaveDays = 0;
  if (isPartTime) {
    unpaidLeaveDays = totalLeaveDays;
  } else {
    // ลากิจเกิน 3 วัน หรือลาอื่นๆ ที่ไม่รับเงิน
    const unpaidBusiness = Math.max(0, (monthlyStat.businessLeaveDays || 0) - 3);
    const unpaidSick = Math.max(0, (monthlyStat.sickLeaveDays || 0) - 30);
    unpaidLeaveDays = unpaidBusiness + unpaidSick + (monthlyStat.otherLeaveDays || 0);
  }
  const leaveDeduction = unpaidLeaveDays * dailyRate;

  // จำนวนวันที่มาทำงานจริง (Days Worked)
  // คำนวณจากวันทำงานมาตรฐานตามงวด หักวันขาดงาน และวันลาหักเงิน
  const daysWorked = Math.max(0, workingDaysStandard - (monthlyStat.absentDays || 0) - unpaidLeaveDays);

  // 1. ค่าล่วงเวลา (OT 1.5 เท่า ตามจริง)
  const otHours = monthlyStat.otHours || 0;
  const otPay = Math.round(otHours * (hourlyRate * 1.5));

  // 2. เบี้ยขยัน (ถ้าไม่ขาด ไม่สายเกินเกณฑ์ ไม่ลาป่วยเกิน 1 วัน)
  let attendanceBonus = 0;
  if (
    monthlyStat.absentDays === 0 &&
    (monthlyStat.lateCount || 0) === 0 &&
    (monthlyStat.sickLeaveDays || 0) <= 1
  ) {
    attendanceBonus = 1000;
  }

  const otherBonus = 0;
  const totalIncome = baseSalary + positionAllowance + attendanceBonus + otPay + otherBonus;

  // 3. รายการหัก
  // หักขาดงาน (วันละ 1 แรง)
  const absentDeduction = (monthlyStat.absentDays || 0) * dailyRate;

  // หักมาสาย: กฎการหักเงินคือ สายสะสมรวมกันไม่เกิน 30 นาที ถ้าเกิน 30 นาที ให้หักนาทีละ 10 บาท
  // (หักเฉพาะเวลาสายที่ไม่ได้อนุมัติยกเว้นหักเงิน)
  const waivedMinutes = monthlyStat.waivedLateMinutes || 0;
  const rawLateMinutes = monthlyStat.lateMinutes || 0;
  const billableLateMinutes = monthlyStat.billableLateMinutes !== undefined
    ? monthlyStat.billableLateMinutes
    : Math.max(0, rawLateMinutes - waivedMinutes);

  let lateDeduction = 0;
  if (billableLateMinutes > 30) {
    lateDeduction = (billableLateMinutes - 30) * 10;
  }

  // 4. หักประกันสังคม (Social Security ม.33) 5% ฐาน 1,650 - เพดานตามปี (ปี 2569-2571 = 17,500 สูงสุด 875 บาท)
  const socialSecurity = calculateSocialSecurity(baseSalary, year).employee;

  // 5. ภาษีหัก ณ ที่จ่าย (ประมาณการ)
  let taxWithheld = 0;
  const projectedYearlyIncome = totalIncome * 12;
  const netTaxableIncome = projectedYearlyIncome - 169000;
  if (netTaxableIncome > 150000) {
    const yearlyTax = (netTaxableIncome - 150000) * 0.05;
    taxWithheld = Math.max(0, Math.round(yearlyTax / 12));
  }

  const otherDeduction = 0;
  const totalDeductions = absentDeduction + leaveDeduction + lateDeduction + socialSecurity + taxWithheld + otherDeduction;
  const netSalary = Math.max(0, totalIncome - totalDeductions);

  return {
    employeeId: employee.id,
    employeeName: employee.fullName,
    position: employee.position,
    department: employee.department,
    isForeignWorker: employee.isForeignWorker,
    nationalityText: employee.nationalityText,
    month,
    year,
    workingDaysStandard,
    daysWorked,
    leaveDays: totalLeaveDays,
    dailyRate,
    hourlyRate,
    baseSalary,
    positionAllowance,
    allowance: positionAllowance,
    attendanceBonus,
    otHours,
    otPay,
    otherBonus,
    totalIncome,
    absentDays: monthlyStat.absentDays || 0,
    absentDeduction,
    leaveDeduction,
    lateCount: monthlyStat.lateCount || 0,
    lateMinutes: rawLateMinutes,
    waivedLateMinutes: waivedMinutes,
    billableLateMinutes,
    lateDeduction,
    socialSecurity,
    taxWithheld,
    otherDeduction,
    totalDeductions,
    netSalary,
    paidStatus: 'PAID',
    paidDate: `${year}-${String(month).padStart(2, '0')}-28`,
  };
}

/**
 * คำนวณวันหมดอายุและการแจ้งเตือน (เหลือน้อยกว่า 30 วัน, 60 วัน, 90 วัน หรือหมดอายุแล้ว)
 * พร้อมนับจำนวนวันที่เหลือก่อนหมดอายุ และรองรับสถานะกำลังต่ออายุ
 */
export function getExpiryStatus(dateStr?: string, isRenewing?: boolean): {
  status: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'NORMAL';
  daysLeft: number;
  label: string;
  badgeClass: string;
  isRenewing: boolean;
} {
  if (!dateStr) {
    return {
      status: 'NORMAL',
      daysLeft: 999,
      label: isRenewing ? 'กำลังต่อใบอนุญาต' : 'ไม่ได้ระบุ',
      badgeClass: isRenewing ? 'bg-sky-100 text-sky-800 border-sky-300 font-semibold' : 'bg-slate-100 text-slate-600',
      isRenewing: !!isRenewing,
    };
  }

  const targetDate = new Date(dateStr);
  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    const expiredDays = Math.abs(daysLeft);
    if (isRenewing) {
      return {
        status: 'WARNING',
        daysLeft,
        label: `หมดอายุแล้ว ${expiredDays} วัน (กำลังต่ออายุ)`,
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
        isRenewing: true,
      };
    }
    return {
      status: 'EXPIRED',
      daysLeft,
      label: `หมดอายุแล้ว ${expiredDays} วัน`,
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
      isRenewing: false,
    };
  }

  if (daysLeft <= 30) {
    if (isRenewing) {
      return {
        status: 'WARNING',
        daysLeft,
        label: `เหลือ ${daysLeft} วัน (กำลังต่ออายุ)`,
        badgeClass: 'bg-sky-100 text-sky-900 border-sky-300 font-bold',
        isRenewing: true,
      };
    }
    return {
      status: 'CRITICAL',
      daysLeft,
      label: `ใกล้หมดอายุ (เหลือ ${daysLeft} วัน)`,
      badgeClass: 'bg-red-100 text-red-800 border-red-300 font-bold animate-pulse',
      isRenewing: false,
    };
  }

  if (daysLeft <= 60) {
    return {
      status: 'WARNING',
      daysLeft,
      label: isRenewing ? `เหลือ ${daysLeft} วัน (กำลังต่ออายุ)` : `เหลือ ${daysLeft} วัน (เตรียมต่ออายุ)`,
      badgeClass: isRenewing ? 'bg-sky-50 text-sky-800 border-sky-200 font-medium' : 'bg-amber-100 text-amber-800 border-amber-200 font-medium',
      isRenewing: !!isRenewing,
    };
  }

  if (daysLeft <= 90) {
    return {
      status: 'WARNING',
      daysLeft,
      label: isRenewing ? `เหลือ ${daysLeft} วัน (กำลังต่ออายุ)` : `เหลือ ${daysLeft} วัน (ใน 90 วัน)`,
      badgeClass: isRenewing ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200',
      isRenewing: !!isRenewing,
    };
  }

  return {
    status: 'NORMAL',
    daysLeft,
    label: isRenewing ? `ปกติ เหลือ ${daysLeft} วัน (กำลังต่ออายุ)` : `ปกติ (เหลือ ${daysLeft} วัน)`,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    isRenewing: !!isRenewing,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount).replace('THB', '฿');
}

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

/**
 * ฟังก์ชันดึงสัญชาติ (ไม่มีการแสดงไอคอนธงชาติ)
 */
export function getNationalityFlag(isForeignWorker?: boolean, nationalityText?: string): string {
  return '';
}

