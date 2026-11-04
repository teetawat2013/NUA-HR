/**
 * สูตรคำนวณเงินสมทบประกันสังคม ม.33
 *
 * เงินสมทบ = อัตรา 5% x ฐานค่าจ้าง (ฐานค่าจ้างต้องไม่ต่ำกว่า 1,650 และไม่เกินเพดานตามช่วงปี)
 *
 * เพดานค่าจ้างตามกฎกระทรวง (ปรับแบบขั้นบันได เริ่ม 1 ม.ค. 2569):
 *   ก่อน 2569          : 15,000 บาท (สูงสุด 750 บาท/เดือน)
 *   2569 - 2571        : 17,500 บาท (สูงสุด 875 บาท/เดือน)
 *   2572 - 2574        : 20,000 บาท (สูงสุด 1,000 บาท/เดือน)
 *   2575 เป็นต้นไป      : 23,000 บาท (สูงสุด 1,150 บาท/เดือน)
 *
 * หมายเหตุ: ปีในตารางด้านล่างเป็น ค.ศ. (2569 พ.ศ. = 2026 ค.ศ.)
 * ถ้า สปส. ประกาศเปลี่ยนเพดานหรืออัตรา ให้แก้ที่ตาราง SSO_WAGE_PERIODS ที่เดียว
 */

export const SSO_RATE = 0.05;
export const SSO_MIN_WAGE = 1650;

export interface SsoWagePeriod {
  /** ปี ค.ศ. เริ่มต้น (รวม) */
  fromYear: number;
  /** ปี ค.ศ. สิ้นสุด (รวม) ใช้ null ถ้าไม่มีกำหนดสิ้นสุด */
  toYear: number | null;
  maxWage: number;
  label: string;
}

export const SSO_WAGE_PERIODS: SsoWagePeriod[] = [
  { fromYear: 1995, toYear: 2025, maxWage: 15000, label: 'ก่อนปี 2569' },
  { fromYear: 2026, toYear: 2028, maxWage: 17500, label: 'ปี 2569 - 2571' },
  { fromYear: 2029, toYear: 2031, maxWage: 20000, label: 'ปี 2572 - 2574' },
  { fromYear: 2032, toYear: null, maxWage: 23000, label: 'ปี 2575 เป็นต้นไป' },
];

export interface SsoResult {
  /** ค่าจ้างที่ป้อนเข้ามา */
  wage: number;
  /** ฐานที่ใช้คำนวณจริง หลังจำกัดขั้นต่ำ/เพดาน */
  base: number;
  rate: number;
  /** ส่วนที่ลูกจ้างจ่าย (หักจากเงินเดือน) */
  employee: number;
  /** ส่วนที่นายจ้างจ่าย (เท่ากับลูกจ้าง) */
  employer: number;
  total: number;
  minWage: number;
  maxWage: number;
  maxContribution: number;
  isCapped: boolean;
  isFloored: boolean;
  periodLabel: string;
  formula: string;
}

/** แปลงปีให้เป็น ค.ศ. (รองรับกรณีระบบเก็บเป็น พ.ศ.) */
export function toGregorianYear(year: number): number {
  return year > 2400 ? year - 543 : year;
}

export function getSsoPeriod(year: number): SsoWagePeriod {
  const y = toGregorianYear(year);
  const found = SSO_WAGE_PERIODS.find(
    (p) => y >= p.fromYear && (p.toYear === null || y <= p.toYear)
  );
  return found ?? SSO_WAGE_PERIODS[0];
}

export function getSsoWageCeiling(year: number): number {
  return getSsoPeriod(year).maxWage;
}

function formatBaht(n: number): string {
  return n.toLocaleString('th-TH', { maximumFractionDigits: 2 });
}

/**
 * คำนวณเงินสมทบประกันสังคมต่อเดือน
 * @param wage  ค่าจ้างที่ใช้เป็นฐาน (บาท/เดือน)
 * @param year  ปีที่คำนวณ (ค.ศ. หรือ พ.ศ. ก็ได้) ค่าเริ่มต้นคือปีปัจจุบัน
 */
export function calculateSocialSecurity(
  wage: number,
  year: number = new Date().getFullYear()
): SsoResult {
  const safeWage = Number.isFinite(wage) && wage > 0 ? wage : 0;
  const period = getSsoPeriod(year);

  const isFloored = safeWage < SSO_MIN_WAGE;
  const isCapped = safeWage > period.maxWage;
  const base = Math.min(Math.max(safeWage, SSO_MIN_WAGE), period.maxWage);

  // ปัดเป็นบาท (ครึ่งขึ้น) เช่น 1,650 x 5% = 82.5 -> 83
  const employee = Math.round(base * SSO_RATE);
  const employer = employee;
  const maxContribution = Math.round(period.maxWage * SSO_RATE);

  const reason = isCapped
    ? ` (ค่าจ้าง ${formatBaht(safeWage)} เกินเพดาน ใช้ ${formatBaht(base)})`
    : isFloored
      ? ` (ค่าจ้าง ${formatBaht(safeWage)} ต่ำกว่าขั้นต่ำ ใช้ ${formatBaht(base)})`
      : '';

  return {
    wage: safeWage,
    base,
    rate: SSO_RATE,
    employee,
    employer,
    total: employee + employer,
    minWage: SSO_MIN_WAGE,
    maxWage: period.maxWage,
    maxContribution,
    isCapped,
    isFloored,
    periodLabel: period.label,
    formula: `${SSO_RATE * 100}% x ${formatBaht(base)} = ${formatBaht(employee)} บาท${reason}`,
  };
}
