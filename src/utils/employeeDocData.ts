import { ContractSettings, Employee, EmploymentType } from '../types';
import { calculateSocialSecurity } from './socialSecurity';

/**
 * สร้างข้อมูลสำหรับเติมลงในเทมเพลตเอกสาร (.docx)
 * ในเทมเพลตให้พิมพ์ตัวแปรเป็น {{ชื่อตัวแปร}} เช่น {{full_name}} {{salary}}
 */

const THAI_MONTHS_LONG = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const EMPLOYMENT_TYPE_TH: Record<EmploymentType, string> = {
  FULL_TIME: 'พนักงานประจำ',
  PROBATION: 'ทดลองงาน',
  CONTRACT: 'พนักงานสัญญาจ้าง',
  DAILY: 'พนักงานรายวัน',
  PART_TIME: 'พนักงานพาร์ทไทม์',
};

/** YYYY-MM-DD -> "5 พฤศจิกายน 2569" (ไม่ใช้ Date เพื่อเลี่ยงปัญหาเขตเวลา) */
export function formatThaiDate(iso?: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return '';
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12) return '';
  return `${day} ${THAI_MONTHS_LONG[month - 1]} ${year + 543}`;
}

export function addDaysIso(iso: string | undefined, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return '';
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function calculateAge(birthIso?: string, asOfIso?: string): number | null {
  const b = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthIso || '');
  if (!b) return null;
  const now = asOfIso ? /^(\d{4})-(\d{2})-(\d{2})/.exec(asOfIso) : null;
  const today = now
    ? { y: Number(now[1]), m: Number(now[2]), d: Number(now[3]) }
    : { y: new Date().getFullYear(), m: new Date().getMonth() + 1, d: new Date().getDate() };
  let age = today.y - Number(b[1]);
  if (today.m < Number(b[2]) || (today.m === Number(b[2]) && today.d < Number(b[3]))) age -= 1;
  return age >= 0 ? age : null;
}

const formatMoney = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 1234567890123 -> 1-2345-67890-12-3 (ถ้าไม่ครบ 13 หลักให้คืนค่าเดิม) */
export function formatThaiIdCard(id?: string): string {
  const digits = (id || '').replace(/\D/g, '');
  if (digits.length !== 13) return id || '';
  return `${digits[0]}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits[12]}`;
}

const DIGITS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const POSITIONS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];

/** อ่านเลขจำนวนเต็มไม่เกินหลักแสน (ไม่เกิน 6 หลัก) */
function readChunk(chunk: number): string {
  const s = String(chunk);
  const len = s.length;
  let out = '';
  for (let i = 0; i < len; i++) {
    const digit = Number(s[i]);
    const pos = len - i - 1;
    if (digit === 0) continue;
    if (pos === 0 && digit === 1 && len > 1) {
      out += 'เอ็ด';
    } else if (pos === 1 && digit === 2) {
      out += 'ยี่สิบ';
    } else if (pos === 1 && digit === 1) {
      out += 'สิบ';
    } else {
      out += DIGITS[digit] + POSITIONS[pos];
    }
  }
  return out;
}

function readInteger(n: number): string {
  if (n === 0) return DIGITS[0];
  const chunks: number[] = [];
  let rest = n;
  while (rest > 0) {
    chunks.unshift(rest % 1000000);
    rest = Math.floor(rest / 1000000);
  }
  let out = '';
  chunks.forEach((chunk, idx) => {
    if (chunk > 0) {
      let text = readChunk(chunk);
      // หลักล้านขึ้นไป: เลขหน่วยของก้อนที่ตามหลังล้าน เช่น 1,000,001 = หนึ่งล้านเอ็ด
      if (idx > 0 && chunk === 1) text = 'เอ็ด';
      out += text;
    }
    if (idx < chunks.length - 1) out += 'ล้าน';
  });
  return out;
}

/** จำนวนเงิน -> ตัวอักษรไทย เช่น 17500 -> "หนึ่งหมื่นเจ็ดพันห้าร้อยบาทถ้วน" */
export function bahtText(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) return '';
  const satangTotal = Math.round(amount * 100);
  const baht = Math.floor(satangTotal / 100);
  const satang = satangTotal % 100;
  const bahtPart = `${readInteger(baht)}บาท`;
  if (satang === 0) return `${bahtPart}ถ้วน`;
  return `${bahtPart}${readInteger(satang)}สตางค์`;
}

export interface PlaceholderInfo {
  key: string;
  label: string;
  group: string;
  example: string;
}

/** รายการตัวแปรที่ใช้ได้ในเทมเพลต (แสดงในหน้าคลังเอกสาร) */
export const PLACEHOLDER_CATALOG: PlaceholderInfo[] = [
  // พนักงาน
  { key: 'employee_id', label: 'รหัสพนักงาน', group: 'พนักงาน', example: 'EMP-001' },
  { key: 'full_name', label: 'ชื่อ-นามสกุล', group: 'พนักงาน', example: 'สมชาย ใจดี' },
  { key: 'nickname', label: 'ชื่อเล่น', group: 'พนักงาน', example: 'ชาย' },
  { key: 'id_card_number', label: 'เลขบัตรประชาชน (มีขีด)', group: 'พนักงาน', example: '1-2345-67890-12-3' },
  { key: 'birth_date', label: 'วันเกิด', group: 'พนักงาน', example: '15 มกราคม 2540' },
  { key: 'age', label: 'อายุ (ปี)', group: 'พนักงาน', example: '29' },
  { key: 'phone', label: 'เบอร์โทร', group: 'พนักงาน', example: '081-234-5678' },
  { key: 'address', label: 'ที่อยู่', group: 'พนักงาน', example: '123 ถ.ช้างเผือก ...' },
  { key: 'nationality', label: 'สัญชาติ', group: 'พนักงาน', example: 'ไทย' },
  // การจ้างงาน
  { key: 'position', label: 'ตำแหน่ง', group: 'การจ้างงาน', example: 'พนักงานบริการ' },
  { key: 'department', label: 'แผนก', group: 'การจ้างงาน', example: 'แผนกบริการหน้าร้าน' },
  { key: 'branch', label: 'สาขา', group: 'การจ้างงาน', example: 'สำนักงานใหญ่ (เชียงใหม่)' },
  { key: 'employment_type', label: 'ประเภทการจ้าง', group: 'การจ้างงาน', example: 'พนักงานประจำ' },
  { key: 'start_date', label: 'วันเริ่มงาน', group: 'การจ้างงาน', example: '1 พฤศจิกายน 2569' },
  { key: 'probation_end_date', label: 'วันครบทดลองงาน', group: 'การจ้างงาน', example: '30 มกราคม 2570' },
  { key: 'resignation_date', label: 'วันที่ลาออก', group: 'การจ้างงาน', example: '30 มิถุนายน 2570' },
  { key: 'resignation_reason', label: 'เหตุผลการลาออก', group: 'การจ้างงาน', example: 'ลาออกตามความประสงค์' },
  // เงินเดือน
  { key: 'salary', label: 'เงินเดือน', group: 'ค่าจ้าง', example: '18,000.00' },
  { key: 'salary_text', label: 'เงินเดือน (ตัวอักษร)', group: 'ค่าจ้าง', example: 'หนึ่งหมื่นแปดพันบาทถ้วน' },
  { key: 'allowance', label: 'ค่าตำแหน่ง/เบี้ยเลี้ยง', group: 'ค่าจ้าง', example: '1,000.00' },
  { key: 'total_monthly', label: 'รายได้ประจำรวมต่อเดือน', group: 'ค่าจ้าง', example: '19,000.00' },
  { key: 'bank_name', label: 'ธนาคาร', group: 'ค่าจ้าง', example: 'ธนาคารกสิกรไทย' },
  { key: 'bank_account_number', label: 'เลขที่บัญชี', group: 'ค่าจ้าง', example: '123-4-56789-0' },
  // ประกันสังคม
  { key: 'sso_base', label: 'ฐานค่าจ้างประกันสังคม', group: 'ประกันสังคม', example: '17,500.00' },
  { key: 'sso_employee', label: 'ประกันสังคมส่วนลูกจ้าง/เดือน', group: 'ประกันสังคม', example: '875.00' },
  { key: 'sso_employer', label: 'ประกันสังคมส่วนนายจ้าง/เดือน', group: 'ประกันสังคม', example: '875.00' },
  { key: 'sso_total', label: 'ประกันสังคมรวม/เดือน', group: 'ประกันสังคม', example: '1,750.00' },
  // ต่างด้าว
  { key: 'passport_number', label: 'เลขที่หนังสือเดินทาง', group: 'แรงงานต่างด้าว', example: 'MA1234567' },
  { key: 'work_permit_number', label: 'เลขที่ใบอนุญาตทำงาน', group: 'แรงงานต่างด้าว', example: 'WP-123456' },
  { key: 'work_permit_expiry', label: 'วันหมดอายุใบอนุญาตทำงาน', group: 'แรงงานต่างด้าว', example: '31 ธันวาคม 2570' },
  // ฉุกเฉิน
  { key: 'emergency_name', label: 'ผู้ติดต่อฉุกเฉิน', group: 'ติดต่อฉุกเฉิน', example: 'สมหญิง ใจดี' },
  { key: 'emergency_relationship', label: 'ความสัมพันธ์', group: 'ติดต่อฉุกเฉิน', example: 'มารดา' },
  { key: 'emergency_phone', label: 'เบอร์ติดต่อฉุกเฉิน', group: 'ติดต่อฉุกเฉิน', example: '089-999-8888' },
  // บริษัท
  { key: 'company_name', label: 'ชื่อบริษัท', group: 'บริษัท', example: 'บริษัท ... จำกัด' },
  { key: 'company_tax_id', label: 'เลขประจำตัวผู้เสียภาษี', group: 'บริษัท', example: '0505569012848' },
  { key: 'company_address', label: 'ที่อยู่บริษัท', group: 'บริษัท', example: '201/37 หมู่ที่ 2 ...' },
  { key: 'employer_signer_name', label: 'ผู้มีอำนาจลงนาม', group: 'บริษัท', example: 'นายเหมวิช พลนาคู' },
  { key: 'employer_signer_title', label: 'ตำแหน่งผู้ลงนาม', group: 'บริษัท', example: 'กรรมการผู้มีอำนาจ' },
  { key: 'witness1_name', label: 'พยานคนที่ 1', group: 'บริษัท', example: 'นางสาวพิมพา ใจดี' },
  { key: 'witness2_name', label: 'พยานคนที่ 2', group: 'บริษัท', example: 'นายธนาชัย สุขเกษม' },
  // วันที่
  { key: 'today', label: 'วันที่ออกเอกสาร', group: 'วันที่', example: '4 พฤศจิกายน 2569' },
  { key: 'today_year_th', label: 'ปี พ.ศ. ปัจจุบัน', group: 'วันที่', example: '2569' },
];

export const KNOWN_PLACEHOLDER_KEYS = new Set(PLACEHOLDER_CATALOG.map((p) => p.key));

export type EmployeeDocData = Record<string, string>;

/**
 * @param todayIso วันที่ออกเอกสาร (YYYY-MM-DD) ค่าเริ่มต้นคือวันนี้ (ส่งเข้ามาเพื่อให้ทดสอบได้)
 */
export function buildEmployeeDocData(
  employee: Employee,
  contractSettings: ContractSettings,
  todayIso: string = new Date().toISOString().slice(0, 10)
): EmployeeDocData {
  const salary = employee.salary || 0;
  const allowance = employee.allowance || 0;
  const todayYear = Number(todayIso.slice(0, 4));
  const sso = calculateSocialSecurity(salary, todayYear);
  const foreign = employee.foreignDetails;
  const age = calculateAge(employee.birthDate, todayIso);

  const workPermitNumber = employee.workPermitNumber || foreign?.workPermitNumber || '';
  const workPermitExpiry = employee.workPermitExpiryDate || foreign?.workPermitExpiryDate || '';

  return {
    employee_id: employee.id || '',
    full_name: employee.fullName || '',
    nickname: employee.nickname || '',
    id_card_number: formatThaiIdCard(employee.idCardNumber),
    birth_date: formatThaiDate(employee.birthDate),
    age: age === null ? '' : String(age),
    phone: employee.phoneNumber || '',
    address: employee.address || '',
    nationality: employee.nationalityText || (employee.isForeignWorker ? '' : 'ไทย'),

    position: employee.position || '',
    department: employee.department || '',
    branch: employee.branch || '',
    employment_type: EMPLOYMENT_TYPE_TH[employee.employmentType] || '',
    start_date: formatThaiDate(employee.startDate),
    probation_end_date: employee.startDate
      ? formatThaiDate(addDaysIso(employee.startDate, Math.max(0, (contractSettings.probationDays || 0) - 1)))
      : '',
    resignation_date: formatThaiDate(employee.resignation?.resignationDate),
    resignation_reason: employee.resignation?.reason || '',

    salary: salary ? formatMoney(salary) : '',
    salary_text: salary ? bahtText(salary) : '',
    allowance: allowance ? formatMoney(allowance) : '',
    total_monthly: salary || allowance ? formatMoney(salary + allowance) : '',
    bank_name: employee.bankAccount?.bankName || '',
    bank_account_number: employee.bankAccount?.accountNumber || '',

    sso_base: salary ? formatMoney(sso.base) : '',
    sso_employee: salary ? formatMoney(sso.employee) : '',
    sso_employer: salary ? formatMoney(sso.employer) : '',
    sso_total: salary ? formatMoney(sso.total) : '',

    passport_number: foreign?.passportNumber || foreign?.passportDetails?.passportNumber || '',
    work_permit_number: workPermitNumber,
    work_permit_expiry: formatThaiDate(workPermitExpiry),

    emergency_name: employee.emergencyContact?.name || '',
    emergency_relationship: employee.emergencyContact?.relationship || '',
    emergency_phone: employee.emergencyContact?.phone || '',

    company_name: contractSettings.companyName || '',
    company_tax_id: contractSettings.companyTaxId || '',
    company_address: contractSettings.companyAddress || '',
    employer_signer_name: contractSettings.employerSignerName || '',
    employer_signer_title: contractSettings.employerSignerTitle || '',
    witness1_name: contractSettings.witness1Name || '',
    witness2_name: contractSettings.witness2Name || '',

    today: formatThaiDate(todayIso),
    today_year_th: String(todayYear + 543),
  };
}
