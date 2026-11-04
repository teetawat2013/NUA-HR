import * as XLSX from 'xlsx';
import { 
  Employee, 
  PartTimeAttendanceStatus, 
  PartTimeDayLog, 
  PartTimeEmployeeSummary, 
  PartTimeWeeklyOffConfig 
} from '../types';
import { getPublicHolidaysForMonth } from '../data/holidaysAndEvents';
import { THAI_MONTHS } from './payrollCalculator';

export const THAI_DAY_NAMES_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
export const THAI_DAY_NAMES_FULL = [
  'วันอาทิตย์',
  'วันจันทร์',
  'วันอังคาร',
  'วันพุธ',
  'วันพฤหัสบดี',
  'วันศุกร์',
  'วันเสาร์'
];

/**
 * แปลงเวลา "HH:mm" เป็นจำนวนนาทีตั้งแต่ 00:00
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return 0;
  return h * 60 + m;
}

/**
 * คำนวณชั่วโมงทำงานอัตโนมัติจากเวลาเข้า-ออก และเวลาพัก
 */
export function calculateShiftHours(
  clockIn: string,
  clockOut: string,
  breakMinutes: number = 60,
  standardShiftHours: number = 8.0
): {
  totalHours: number;
  normalHours: number;
  otHours: number;
} {
  if (!clockIn || !clockOut) {
    return { totalHours: 0, normalHours: 0, otHours: 0 };
  }

  const inMins = timeStringToMinutes(clockIn);
  let outMins = timeStringToMinutes(clockOut);

  // รองรับกรณีเข้างานข้ามคืน (Clock out วันถัดไป)
  if (outMins < inMins) {
    outMins += 24 * 60;
  }

  const rawDurationMinutes = Math.max(0, outMins - inMins);
  const netMinutes = Math.max(0, rawDurationMinutes - breakMinutes);
  const totalHours = Math.round((netMinutes / 60) * 100) / 100;

  let normalHours = totalHours;
  let otHours = 0;

  if (totalHours > standardShiftHours) {
    normalHours = standardShiftHours;
    otHours = Math.round((totalHours - standardShiftHours) * 100) / 100;
  }

  return {
    totalHours,
    normalHours,
    otHours
  };
}

/**
 * คำนวณนาทีที่มาสายอัตโนมัติ
 */
export function calculateLateMinutes(actualClockIn: string, expectedShiftIn: string = '10:00'): number {
  if (!actualClockIn || !expectedShiftIn) return 0;
  const actual = timeStringToMinutes(actualClockIn);
  const expected = timeStringToMinutes(expectedShiftIn);
  return Math.max(0, actual - expected);
}

/**
 * คำนวณค่าจ้างและหักเงินประจำวันของพนักงาน Part-time
 * นโยบาย Nua HRM Pro:
 * - Part-time ทุกการลา (ลาป่วย ลากิจ ลาอื่นๆ) ไม่ได้รับเงิน (Unpaid 100%)
 * - วันหยุดประจำสัปดาห์ ไม่ได้รับเงิน
 * - ขาดงาน ไม่ได้รับเงิน
 * - ทำงานคิดตามชั่วโมงจริง + OT 1.5 เท่า
 * - มาสายสะสมเกิน 30 นาที หักนาทีละ 10 บาท
 */
export function calculateDailyWage(
  status: PartTimeAttendanceStatus,
  totalHours: number,
  otHours: number,
  hourlyRate: number,
  lateMinutes: number = 0
): {
  isPaid: boolean;
  totalWages: number;
  unpaidReasonNote?: string;
  lateDeduction: number;
} {
  let lateDeduction = 0;
  if (lateMinutes > 30) {
    lateDeduction = (lateMinutes - 30) * 10;
  }

  switch (status) {
    case 'WORKED': {
      const normalHours = Math.max(0, totalHours - otHours);
      const normalPay = normalHours * hourlyRate;
      const otPay = otHours * (hourlyRate * 1.5);
      const gross = Math.max(0, normalPay + otPay - lateDeduction);
      return {
        isPaid: true,
        totalWages: Math.round(gross),
        lateDeduction
      };
    }
    case 'HOLIDAY_WORK': {
      // ทำงานในวันหยุดนักขัตฤกษ์: ให้เรทพิเศษ 1.5 เท่าของชั่วโมงปกติ
      const specialPay = totalHours * (hourlyRate * 1.5) + otHours * (hourlyRate * 2.0);
      const gross = Math.max(0, specialPay - lateDeduction);
      return {
        isPaid: true,
        totalWages: Math.round(gross),
        lateDeduction
      };
    }
    case 'SICK':
      return {
        isPaid: false,
        totalWages: 0,
        unpaidReasonNote: 'Part-time ลาป่วย: ไม่ได้รับค่าจ้าง (Unpaid)',
        lateDeduction: 0
      };
    case 'BUSINESS':
      return {
        isPaid: false,
        totalWages: 0,
        unpaidReasonNote: 'Part-time ลากิจ: ไม่ได้รับค่าจ้าง (Unpaid)',
        lateDeduction: 0
      };
    case 'OTHER_LEAVE':
      return {
        isPaid: false,
        totalWages: 0,
        unpaidReasonNote: 'Part-time ลาอื่นๆ: ไม่ได้รับค่าจ้าง (Unpaid)',
        lateDeduction: 0
      };
    case 'ABSENT':
      return {
        isPaid: false,
        totalWages: 0,
        unpaidReasonNote: 'ขาดงาน (ไม่ได้รับค่าจ้าง)',
        lateDeduction: 0
      };
    case 'DAY_OFF':
      return {
        isPaid: false,
        totalWages: 0,
        unpaidReasonNote: 'วันหยุดประจำสัปดาห์ (ไม่มีค่าจ้าง)',
        lateDeduction: 0
      };
    case 'HOLIDAY_OFF':
      return {
        isPaid: false,
        totalWages: 0,
        unpaidReasonNote: 'วันหยุดนักขัตฤกษ์ (หยุดตามตาราง)',
        lateDeduction: 0
      };
    default:
      return {
        isPaid: false,
        totalWages: 0,
        lateDeduction: 0
      };
  }
}

/**
 * สร้างตารางบันทึกเวลารายวันของ Part-time ประจำเดือน
 */
export function generateMonthlyPartTimeLogs(
  employee: Employee,
  month: number,
  year: number,
  config?: PartTimeWeeklyOffConfig,
  existingLogs: PartTimeDayLog[] = []
): PartTimeDayLog[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const holidays = getPublicHolidaysForMonth(year, month);
  const holidayDateSet = new Set(holidays.map(h => h.date));

  // ค่ามาตรฐานของพนักงาน Part-time
  const weeklyDayOff = config?.weeklyDayOffDays || [4]; // ค่าเริ่มต้น: วันพฤหัสบดี (4)
  const defaultIn = config?.defaultShiftIn || '10:00';
  const defaultOut = config?.defaultShiftOut || '19:00';
  const defaultBreak = config?.defaultBreakMinutes !== undefined ? config.defaultBreakMinutes : 60;
  
  // อัตราต่อชั่วโมง: ดึงจาก salary / 30 / 8 หรือค่าที่กำหนด เช่น 60 บาท/ชม.
  const hourlyRate = config?.hourlyRate || (employee.salary ? Math.round(employee.salary / (30 * 8)) : 60);

  const existingMap = new Map<string, PartTimeDayLog>();
  existingLogs.forEach(log => {
    existingMap.set(log.date, log);
  });

  const logs: PartTimeDayLog[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (existingMap.has(dateStr)) {
      logs.push(existingMap.get(dateStr)!);
      continue;
    }

    const isWeeklyOff = weeklyDayOff.includes(dayOfWeek);
    const isPublicHoliday = holidayDateSet.has(dateStr);

    let status: PartTimeAttendanceStatus = 'WORKED';
    let clockIn = defaultIn;
    let clockOut = defaultOut;
    let breakMinutes = defaultBreak;

    if (isWeeklyOff) {
      status = 'DAY_OFF';
      clockIn = '';
      clockOut = '';
      breakMinutes = 0;
    } else if (isPublicHoliday) {
      status = 'HOLIDAY_OFF';
      clockIn = '';
      clockOut = '';
      breakMinutes = 0;
    }

    const { totalHours, otHours } = status === 'WORKED' 
      ? calculateShiftHours(clockIn, clockOut, breakMinutes, 8.0)
      : { totalHours: 0, otHours: 0 };

    const lateMinutes = status === 'WORKED' ? calculateLateMinutes(clockIn, defaultIn) : 0;
    const { isPaid, totalWages, unpaidReasonNote } = calculateDailyWage(
      status, 
      totalHours, 
      otHours, 
      hourlyRate, 
      lateMinutes
    );

    logs.push({
      id: `PTL-${employee.id}-${dateStr}`,
      employeeId: employee.id,
      employeeName: employee.fullName,
      department: employee.department,
      date: dateStr,
      dayOfWeek,
      status,
      clockIn,
      clockOut,
      breakMinutes,
      totalHoursWorked: totalHours,
      standardHours: 8.0,
      otHours,
      lateMinutes,
      hourlyRate,
      isPaid,
      unpaidReasonNote,
      totalWages,
      notes: isPublicHoliday ? holidays.find(h => h.date === dateStr)?.nameThai : ''
    });
  }

  return logs;
}

/**
 * สรุปภาพรวมสถิติและค่าจ้าง Part-time ประจำเดือน
 */
export function aggregatePartTimeSummary(
  employee: Employee,
  month: number,
  year: number,
  logs: PartTimeDayLog[],
  hourlyRateOverride?: number
): PartTimeEmployeeSummary {
  const hourlyRate = hourlyRateOverride || logs[0]?.hourlyRate || (employee.salary ? Math.round(employee.salary / (30 * 8)) : 60);

  let daysWorked = 0;
  let daysOff = 0;
  let absentDays = 0;
  let sickLeaveDays = 0;
  let businessLeaveDays = 0;
  let otherLeaveDays = 0;
  let lateCount = 0;
  let lateMinutes = 0;
  let normalHours = 0;
  let otHours = 0;
  let totalHours = 0;
  let normalPay = 0;
  let otPay = 0;
  let lateDeduction = 0;
  let netWage = 0;

  logs.forEach(log => {
    if (log.status === 'WORKED' || log.status === 'HOLIDAY_WORK') {
      daysWorked += 1;
      const dayNormal = Math.max(0, log.totalHoursWorked - (log.otHours || 0));
      normalHours += dayNormal;
      otHours += log.otHours || 0;
      totalHours += log.totalHoursWorked;

      const rate = log.status === 'HOLIDAY_WORK' ? hourlyRate * 1.5 : hourlyRate;
      normalPay += dayNormal * rate;
      otPay += (log.otHours || 0) * (hourlyRate * 1.5);

      if (log.lateMinutes > 0) {
        lateCount += 1;
        lateMinutes += log.lateMinutes;
      }
      netWage += log.totalWages;
    } else if (log.status === 'DAY_OFF' || log.status === 'HOLIDAY_OFF') {
      daysOff += 1;
    } else if (log.status === 'ABSENT') {
      absentDays += 1;
    } else if (log.status === 'SICK') {
      sickLeaveDays += 1;
    } else if (log.status === 'BUSINESS') {
      businessLeaveDays += 1;
    } else if (log.status === 'OTHER_LEAVE') {
      otherLeaveDays += 1;
    }
  });

  // หักมาสายสะสมเกิน 30 นาที (หักนาทีละ 10 บาท)
  if (lateMinutes > 30) {
    lateDeduction = (lateMinutes - 30) * 10;
  }

  return {
    employeeId: employee.id,
    employeeName: employee.fullName,
    department: employee.department,
    month,
    year,
    hourlyRate,
    daysWorked,
    daysOff,
    absentDays,
    sickLeaveDays,
    businessLeaveDays,
    otherLeaveDays,
    lateCount,
    lateMinutes,
    normalHours: Math.round(normalHours * 100) / 100,
    otHours: Math.round(otHours * 100) / 100,
    totalHours: Math.round(totalHours * 100) / 100,
    normalPay: Math.round(normalPay),
    otPay: Math.round(otPay),
    lateDeduction,
    netWage: Math.round(netWage),
    dailyLogs: logs
  };
}

/**
 * ส่งออกตารางวันหยุด & เวลาทำงาน Part-time เป็นไฟล์ Excel (.xlsx) ทันที
 */
export function exportPartTimeScheduleExcel(
  summaries: PartTimeEmployeeSummary[],
  month: number,
  year: number,
  filename?: string
) {
  const monthName = THAI_MONTHS[month - 1] || `เดือน ${month}`;
  const thaiYear = year + 543;
  const finalFilename = filename || `ตารางวันหยุดและชั่วโมงทำงาน_PartTime_${monthName}_${thaiYear}.xlsx`;

  const wb = XLSX.utils.book_new();

  // Sheet 1: สรุปภาพรวม Part-time รายเดือน
  const summaryRows = summaries.map((s, idx) => ({
    'ลำดับ': idx + 1,
    'รหัสพนักงาน': s.employeeId,
    'ชื่อ-นามสกุล': s.employeeName,
    'แผนก': s.department,
    'งวดประจำเดือน': `${monthName} ${thaiYear}`,
    'อัตราค่าจ้าง (บาท/ชม.)': s.hourlyRate,
    'วันทำงานจริง (วัน)': s.daysWorked,
    'วันหยุดตามตาราง (วัน)': s.daysOff,
    'ขาดงาน (วัน)': s.absentDays,
    'ลาป่วย (วัน) [ไม่รับเงิน]': s.sickLeaveDays,
    'ลากิจ (วัน) [ไม่รับเงิน]': s.businessLeaveDays,
    'ลาอื่นๆ (วัน) [ไม่รับเงิน]': s.otherLeaveDays,
    'มาสาย (ครั้ง)': s.lateCount,
    'มาสายรวม (นาที)': s.lateMinutes,
    'ชั่วโมงปกติ (ชม.)': s.normalHours,
    'ชั่วโมง OT (ชม.)': s.otHours,
    'ชั่วโมงทำงานรวม (ชม.)': s.totalHours,
    'ค่าจ้างชั่วโมงปกติ (บาท)': s.normalPay,
    'ค่าล่วงเวลา OT (บาท)': s.otPay,
    'หักเงินมาสาย (บาท)': s.lateDeduction,
    'รวมเงินสุทธิ (บาท)': s.netWage,
  }));

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุปภาพรวมรายบุคคล');

  // Sheet 2: รายละเอียดตารางวันหยุดและเวลาทำงานรายวัน
  const detailRows: any[] = [];
  summaries.forEach(s => {
    s.dailyLogs.forEach(log => {
      let statusLabel = 'มาทำงานปกติ';
      if (log.status === 'DAY_OFF') statusLabel = 'วันหยุดประจำสัปดาห์';
      else if (log.status === 'HOLIDAY_OFF') statusLabel = 'วันหยุดนักขัตฤกษ์';
      else if (log.status === 'HOLIDAY_WORK') statusLabel = 'ทำงานวันหยุดพิเศษ';
      else if (log.status === 'ABSENT') statusLabel = 'ขาดงาน';
      else if (log.status === 'SICK') statusLabel = 'ลาป่วย (ไม่ได้รับเงิน)';
      else if (log.status === 'BUSINESS') statusLabel = 'ลากิจ (ไม่ได้รับเงิน)';
      else if (log.status === 'OTHER_LEAVE') statusLabel = 'ลาอื่นๆ (ไม่ได้รับเงิน)';

      detailRows.push({
        'รหัสพนักงาน': s.employeeId,
        'ชื่อพนักงาน': s.employeeName,
        'แผนก': s.department,
        'วันที่': log.date,
        'วันในสัปดาห์': THAI_DAY_NAMES_FULL[log.dayOfWeek],
        'สถานะ': statusLabel,
        'เวลาเข้างาน': log.clockIn || '-',
        'เวลาออกงาน': log.clockOut || '-',
        'พัก (นาที)': log.breakMinutes || 0,
        'ชั่วโมงทำงานจริง': log.totalHoursWorked,
        'ชั่วโมง OT': log.otHours,
        'มาสาย (นาที)': log.lateMinutes,
        'อัตรา/ชม.': log.hourlyRate,
        'ค่าจ้างวันนั้น (บาท)': log.totalWages,
        'เงื่อนไขการรับเงิน': log.isPaid ? 'ได้รับค่าจ้าง' : (log.unpaidReasonNote || 'ไม่ได้รับเงิน'),
        'หมายเหตุ': log.notes || ''
      });
    });
  });

  const wsDetail = XLSX.utils.json_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, wsDetail, 'ตารางบันทึกเวลารายวัน');

  XLSX.writeFile(wb, finalFilename);
}

/**
 * ส่งออกเป็นไฟล์ CSV พร้อม UTF-8 BOM
 */
export function exportPartTimeScheduleCsv(
  summaries: PartTimeEmployeeSummary[],
  month: number,
  year: number,
  filename?: string
) {
  const monthName = THAI_MONTHS[month - 1] || `เดือน ${month}`;
  const thaiYear = year + 543;
  const finalFilename = filename || `รายงานPartTime_${monthName}_${thaiYear}.csv`;

  const headers = [
    'ลำดับ',
    'รหัสพนักงาน',
    'ชื่อ-นามสกุล',
    'แผนก',
    'งวดเดือน',
    'อัตราต่อชม',
    'วันทำงาน',
    'วันหยุด',
    'ขาดงาน',
    'ลาป่วย_ไม่รับเงิน',
    'ลากิจ_ไม่รับเงิน',
    'มาสาย_ครั้ง',
    'มาสาย_นาที',
    'ชั่วโมงปกติ',
    'ชั่วโมงOT',
    'รวมชั่วโมงทำงาน',
    'ค่าจ้างปกติ',
    'ค่าOT',
    'หักสาย',
    'รวมสุทธิ'
  ];

  const rows = summaries.map((s, idx) => [
    idx + 1,
    `"${s.employeeId}"`,
    `"${s.employeeName}"`,
    `"${s.department}"`,
    `"${monthName} ${thaiYear}"`,
    s.hourlyRate,
    s.daysWorked,
    s.daysOff,
    s.absentDays,
    s.sickLeaveDays,
    s.businessLeaveDays,
    s.lateCount,
    s.lateMinutes,
    s.normalHours,
    s.otHours,
    s.totalHours,
    s.normalPay,
    s.otPay,
    s.lateDeduction,
    s.netWage
  ]);

  const csvContent = '\uFEFF' + [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', finalFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
