import { Employee, EmploymentContract, GeneratedDocumentRecord, HrChecklistEntry } from '../types';

/**
 * เช็คลิสต์เอกสาร HR ต่อพนักงาน
 * รหัสเอกสารภายใน (key) ใช้รูปแบบ HR-<กลุ่ม>-<ลำดับ> ตรงกับเช็คลิสต์เอกสาร HR ของบริษัท
 *   LG = กฎหมายกำหนด, PD = PDPA, ON = รับเข้าทำงาน, OF = ออกจากงาน
 *
 * formVerified = false หมายถึงรหัสแบบทางการยังไม่ได้ตรวจกับหน่วยงานเจ้าของแบบ ควรเช็กก่อนใช้จริง
 */

export type HrChecklistGroup = 'LG' | 'PD' | 'ON' | 'OF';

export const HR_CHECKLIST_GROUP_LABELS: Record<HrChecklistGroup, string> = {
  LG: 'เอกสารที่กฎหมายกำหนด',
  PD: 'ข้อมูลส่วนบุคคล (PDPA)',
  ON: 'รับเข้าทำงาน',
  OF: 'ออกจากงาน',
};

export interface HrChecklistContext {
  /** รหัส checklistKey ของเอกสารที่สร้างจากคลังเอกสารให้พนักงานคนนี้แล้ว */
  generatedKeys: Set<string>;
  /** id พนักงานที่มีสัญญาจ้างสถานะ ACTIVE ในระบบสัญญาจ้างงาน */
  employeeIdsWithContract: Set<string>;
}

export interface HrChecklistItem {
  key: string;
  group: HrChecklistGroup;
  title: string;
  officialForm?: string;
  formVerified?: boolean;
  hint?: string;
  /** กำหนดส่ง = วันเริ่มงาน + จำนวนวัน (ใช้แสดงเตือนเกินกำหนด) */
  dueDaysAfterStart?: number;
  appliesTo?: (e: Employee) => boolean;
  /** ตรวจจากข้อมูลที่มีอยู่ในระบบแล้ว ไม่ต้องติ๊กเอง */
  autoDone?: (e: Employee, ctx: HrChecklistContext) => boolean;
}

const isResigned = (e: Employee) => !!e.resignation?.isResigned;

export const HR_CHECKLIST_ITEMS: HrChecklistItem[] = [
  // ---- กฎหมายกำหนด ----
  {
    key: 'HR-LG-02',
    group: 'LG',
    title: 'แจ้งลูกจ้างเข้าเป็นผู้ประกันตน',
    officialForm: 'สปส.1-03',
    formVerified: true,
    hint: 'ภายใน 30 วันนับจากวันเข้าทำงาน',
    dueDaysAfterStart: 30,
  },
  {
    key: 'HR-LG-10',
    group: 'LG',
    title: 'ใบอนุญาตทำงาน (Work Permit) และวีซ่าที่ถูกต้อง',
    hint: 'เฉพาะแรงงานต่างด้าว',
    appliesTo: (e) => e.isForeignWorker,
    autoDone: (e) =>
      !!(e.workPermitNumber && e.workPermitExpiryDate) ||
      !!(e.foreignDetails?.workPermitNumber && e.foreignDetails?.workPermitExpiryDate),
  },

  // ---- PDPA ----
  {
    key: 'HR-PD-01',
    group: 'PD',
    title: 'รับทราบประกาศความเป็นส่วนตัว (Privacy Notice)',
    hint: 'ให้พนักงานลงชื่อรับทราบ',
  },

  // ---- รับเข้าทำงาน ----
  {
    key: 'HR-ON-01',
    group: 'ON',
    title: 'ใบสมัครงาน / เรซูเม่',
    autoDone: (e) => !!(e.documentChecklist?.resume || e.resumeUrl),
  },
  { key: 'HR-ON-02', group: 'ON', title: 'จดหมายเสนองาน (Offer Letter)' },
  {
    key: 'HR-ON-03',
    group: 'ON',
    title: 'สัญญาจ้างงาน',
    autoDone: (e, ctx) => ctx.employeeIdsWithContract.has(e.id),
  },
  {
    key: 'HR-ON-04',
    group: 'ON',
    title: 'สำเนาบัตรประชาชน ทะเบียนบ้าน และสมุดบัญชีธนาคาร',
    autoDone: (e) =>
      !!(
        e.documentChecklist?.idCardCopy &&
        e.documentChecklist?.houseRegistrationCopy &&
        e.bankAccount?.accountNumber
      ),
  },
  {
    key: 'HR-ON-05',
    group: 'ON',
    title: 'สำเนาวุฒิการศึกษา',
    hint: 'เฉพาะตำแหน่งที่ต้องการ',
    autoDone: (e) => !!e.documentChecklist?.educationHistory,
  },
  {
    key: 'HR-ON-06',
    group: 'ON',
    title: 'แบบฟอร์มลดหย่อนภาษี',
    officialForm: 'ล.ย.01',
    formVerified: false,
  },
  { key: 'HR-ON-07', group: 'ON', title: 'ข้อตกลงรักษาความลับ (NDA)', hint: 'ถ้าเกี่ยวข้อง เช่น สูตรอาหาร' },
  { key: 'HR-ON-08', group: 'ON', title: 'ใบรับทรัพย์สินที่ส่งมอบ (เครื่องแบบ บัตรพนักงาน ฯลฯ)' },
  { key: 'HR-ON-09', group: 'ON', title: 'ใบรับทราบข้อบังคับการทำงาน / คู่มือพนักงาน' },
  { key: 'HR-ON-10', group: 'ON', title: 'จัดทำแฟ้มประวัติพนักงาน (Personnel File)' },

  // ---- ออกจากงาน (แสดงเฉพาะคนที่ลาออกแล้ว) ----
  { key: 'HR-OF-01', group: 'OF', title: 'หนังสือลาออก / หนังสือเลิกจ้าง', appliesTo: isResigned },
  { key: 'HR-OF-02', group: 'OF', title: 'ใบคำนวณเงินงวดสุดท้ายและค่าชดเชย (ถ้ามี)', appliesTo: isResigned },
  {
    key: 'HR-OF-03',
    group: 'OF',
    title: 'แจ้งสิ้นสุดการเป็นผู้ประกันตน',
    officialForm: 'สปส.6-09',
    formVerified: false,
    hint: 'ตรวจกำหนดวันแจ้งกับสำนักงานประกันสังคม',
    appliesTo: isResigned,
  },
  {
    key: 'HR-OF-04',
    group: 'OF',
    title: 'หนังสือรับรองการหักภาษี ณ ที่จ่าย',
    officialForm: '50 ทวิ',
    formVerified: true,
    appliesTo: isResigned,
  },
  { key: 'HR-OF-05', group: 'OF', title: 'ใบส่งคืนทรัพย์สินและตัดสิทธิ์ระบบ', appliesTo: isResigned },
  { key: 'HR-OF-06', group: 'OF', title: 'บันทึกการสัมภาษณ์ก่อนออก (Exit Interview)', appliesTo: isResigned },
];

export function getApplicableChecklistItems(employee: Employee): HrChecklistItem[] {
  return HR_CHECKLIST_ITEMS.filter((item) => (item.appliesTo ? item.appliesTo(employee) : true));
}

export interface HrChecklistItemStatus {
  item: HrChecklistItem;
  done: boolean;
  /** manual = ติ๊กเอง, generated = สร้างจากคลังเอกสาร, auto = ตรวจจากข้อมูลในระบบ, none = ยังไม่ทำ */
  source: 'manual' | 'generated' | 'auto' | 'none';
  doneAt?: string;
  note?: string;
  dueDate?: string; // YYYY-MM-DD
  isOverdue: boolean;
}

function addDays(iso: string, days: number): string | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return undefined;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function resolveChecklistStatus(
  item: HrChecklistItem,
  employee: Employee,
  ctx: HrChecklistContext,
  todayIso: string = new Date().toISOString().slice(0, 10)
): HrChecklistItemStatus {
  const entry: HrChecklistEntry | undefined = employee.hrChecklist?.[item.key];

  let done = false;
  let source: HrChecklistItemStatus['source'] = 'none';

  if (entry) {
    // ผู้ใช้ติ๊กเองมีผลก่อนเสมอ (รวมถึงกรณียกเลิกการติ๊ก)
    done = entry.done;
    source = entry.done ? 'manual' : 'none';
  } else if (ctx.generatedKeys.has(item.key)) {
    done = true;
    source = 'generated';
  } else if (item.autoDone && item.autoDone(employee, ctx)) {
    done = true;
    source = 'auto';
  }

  const dueDate =
    item.dueDaysAfterStart !== undefined && employee.startDate
      ? addDays(employee.startDate, item.dueDaysAfterStart)
      : undefined;

  return {
    item,
    done,
    source,
    doneAt: entry?.doneAt,
    note: entry?.note,
    dueDate,
    isOverdue: !!dueDate && !done && dueDate < todayIso,
  };
}

export function buildChecklistContext(
  employee: Employee,
  generatedDocs: GeneratedDocumentRecord[],
  contracts: EmploymentContract[]
): HrChecklistContext {
  return {
    generatedKeys: new Set(
      generatedDocs
        .filter((d) => d.employeeId === employee.id && d.checklistKey)
        .map((d) => d.checklistKey as string)
    ),
    employeeIdsWithContract: new Set(
      contracts.filter((c) => c.employeeId && c.status === 'ACTIVE').map((c) => c.employeeId as string)
    ),
  };
}

export function summarizeChecklist(statuses: HrChecklistItemStatus[]) {
  const total = statuses.length;
  const done = statuses.filter((s) => s.done).length;
  return {
    total,
    done,
    overdue: statuses.filter((s) => s.isOverdue).length,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}
