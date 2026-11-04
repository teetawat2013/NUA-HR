export type NationalityType = 'THAI' | 'FOREIGN';

export type EmploymentType = 'FULL_TIME' | 'PROBATION' | 'CONTRACT' | 'DAILY' | 'PART_TIME';

export type Department = 
  | 'แผนกครัว'
  | 'แผนกการตลาดและสื่อสาร'
  | 'แผนกบริการหน้าร้าน'
  | 'แผนกบัญชีและการเงิน'
  | 'แผนกบริหารร้าน';

export const DEPARTMENTS: Department[] = [
  'แผนกครัว',
  'แผนกการตลาดและสื่อสาร',
  'แผนกบริการหน้าร้าน',
  'แผนกบัญชีและการเงิน',
  'แผนกบริหารร้าน',
];

export const BRANCHES: string[] = [
  'สำนักงานใหญ่ (เชียงใหม่)',
];

export type IdentificationType = 
  | 'THAI_ID' // บัตรประจำตัวประชาชนไทย
  | 'PINK_CARD' // บัตรประจำตัวคนซึ่งไม่มีสัญชาติไทย (บัตรสีชมพู)
  | 'WHITE_CARD' // บัตรประจำตัวคนไม่มีสถานะทางทะเบียน / บัตร 10 ปี (บัตรสีขาว)
  | 'PASSPORT' // หนังสือเดินทาง (Passport)
  | 'OTHER' // บัตร/เอกสารประจำตัวประเภทอื่น
  | 'NONE'; // ไม่มีเอกสารประเภทข้างต้น

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface WorkerDocument {
  id: string;
  type: 'ID_CARD' | 'PINK_CARD' | 'PASSPORT' | 'VISA' | 'WORK_PERMIT' | 'E_WORK_PERMIT' | 'MEDICAL_CERT' | 'PHOTO' | 'RESUME' | 'OTHER';
  title: string;
  fileName?: string;
  fileSize?: string;
  uploadDate?: string;
  expiryDate?: string;
  isUploaded: boolean;
  notes?: string;
  fileUrl?: string; // Data URL หรือ URL สำหรับแสดงตัวอย่าง (Preview)
  driveUrl?: string; // ลิงก์ตรงไปยัง Google Drive (ถ้ามี)
}

// ข้อมูลบัตรสีชมพู / บัตรสีขาว
export interface PinkCardDetails {
  idNumber13: string; // เลขประจำตัว 13 หลัก
  cardColor?: 'PINK' | 'WHITE'; // บัตรสีชมพู หรือ บัตรสีขาว (บัตร 10 ปี / บัตรไม่มีสถานะทางทะเบียน)
  cardTypeName?: string; // เช่น บัตรสีชมพู หรือ บัตรสีขาว (เลข 0)
  thaiFullName: string; // ชื่อ–นามสกุลภาษาไทย
  englishFullName?: string; // ชื่อ–นามสกุลภาษาอังกฤษ (ถ้ามี)
  birthDate: string; // วันเกิด
  nationality: string; // สัญชาติ
  issueDate: string; // วันออกบัตร
  expiryDate: string; // วันหมดอายุบัตร
  issuingProvinceOrOffice?: string; // จังหวัด/หน่วยงานที่ออกบัตร (ถ้ามี)
  frontCardImage?: string; // รูปบัตรด้านหน้า
  backCardImage?: string; // รูปบัตรด้านหลัง
}

// ข้อมูล Passport
export interface PassportDetails {
  passportNumber: string; // เลข Passport
  fullNameOnPassport: string; // ชื่อ–นามสกุลตาม Passport
  nationality: string; // สัญชาติ
  birthDate: string; // วันเกิด
  issueDate: string; // วันที่ออก Passport
  expiryDate: string; // วันหมดอายุ Passport
  issuingCountry: string; // ประเทศผู้ออก
  passportImage?: string; // รูป Passport
  visaTypeOrStatus: string; // Visa / สถานะการพำนัก
  stayPermitExpiryDate: string; // วันหมดอายุสิทธิการพำนัก
}

// ข้อมูลเอกสารประจำตัวประเภทอื่น
export interface OtherDocumentDetails {
  documentName: string; // ชื่อเอกสาร/ประเภทบัตร
  documentNumber: string; // เลขที่เอกสาร
  issueDate: string; // วันที่ออก
  expiryDate: string; // วันหมดอายุ
  documentImage?: string; // รูปเอกสาร
  issuingAuthority?: string; // หน่วยงานผู้ออก
}

// ข้อมูลใบอนุญาตทำงาน (Work Permit)
export interface WorkPermitDetails {
  hasWorkPermit: boolean;
  workPermitNumber: string; // เลข Work Permit
  position: string; // ตำแหน่งงาน
  jobDescription: string; // ลักษณะงาน
  workplace: string; // สถานที่ทำงาน
  effectiveDate: string; // วันที่เริ่มมีผล
  expiryDate: string; // วันหมดอายุ
  workPermitImage?: string; // รูปใบอนุญาตทำงาน
  isRenewing?: boolean; // ช่องติ๊ก "กำลังต่อใบอนุญาต"
  renewalStatusNote?: string; // หมายเหตุสถานะการยื่นต่ออายุ
}

export interface ForeignWorkerDetails {
  // ฟังก์ชันที่ 2: ให้เลือกก่อนว่า พนักงานใช้เอกสารอะไรเป็นหลัก
  identificationType: 'PINK_CARD' | 'WHITE_CARD' | 'PASSPORT' | 'OTHER' | 'NONE';
  cardColor?: 'PINK' | 'WHITE'; // บัตรสีชมพู หรือ บัตรสีขาว
  isRenewingWorkPermit?: boolean; // ช่องติ๊ก "กำลังต่อใบอนุญาต" (Work Permit Renewal in Progress)

  // รายละเอียดตามประเภทที่เลือก
  pinkCardDetails?: PinkCardDetails;
  passportDetails?: PassportDetails;
  otherDocDetails?: OtherDocumentDetails;
  workPermitDetails?: WorkPermitDetails;

  // ฟิลด์ทั่วไปเพื่อความเข้ากันได้
  passportFullName: string;
  englishName: string;
  countryOfOrigin: string; // เช่น เมียนมา (Myanmar), กัมพูชา (Cambodia), ลาว (Laos)
  passportNumber: string;
  passportIssueDate: string;
  passportExpiryDate: string;

  visaType: string;
  visaNumber: string;
  visaExpiryDate: string;
  stayAddressInThailand: string;
  report90DaysDate?: string;
  medicalCheckupExpiryDate?: string;

  workPermitNumber: string;
  workPermitIssueDate: string;
  workPermitExpiryDate: string;
  workPermitPosition: string;
  workPermitJobDescription: string;
  workPermitWorkplace: string;

  documents: WorkerDocument[];
}

export interface ResignationDetails {
  isResigned: boolean;
  resignationDate?: string;
  reason?: string;
  note?: string;
  notes?: string;
  handedOverTo?: string;
  blacklisted?: boolean;
  settled?: boolean;
}

export interface MonthlyAttendance {
  month: number; // 1-12
  year: number; // e.g. 2026 or 2569
  absentDays: number; // ขาดงาน
  sickLeaveDays: number; // ลาป่วย
  businessLeaveDays: number; // ลากิจ
  annualLeaveDays: number; // พักร้อน
  otherLeaveDays: number; // ลาอื่นๆ (เช่น คลอด, ฌาปนกิจ)
  lateCount: number; // มาสาย (ครั้ง)
  lateMinutes: number; // มาสาย (นาที) ทั้งหมด
  waivedLateMinutes?: number; // มาสายที่อนุมัติยกเว้นไม่หักเงิน (นาที)
  billableLateMinutes?: number; // มาสายที่นำมาคำนวณหักเงิน (นาที)
  otHours: number; // ล่วงเวลา (ชั่วโมง)
  warningCount: number; // การถูกแจ้งเตือน
  warningNotes?: string[];
}

// ข้อมูลพนักงานขอเข้าสาย (Late Permission Request)
export interface LatePermissionRequest {
  id: string;
  userId?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string; // YYYY-MM-DD วันที่ขอเข้าสาย
  reason?: string;
  actualLateMinutes: number; // เวลาที่สายจริง (ใส่สิ้นเดือน) เป็นจำนวนนาที เช่น 15, 30, 45 (0 = ยังไม่ระบุ)
  isApprovedWaiveDeduction: boolean; // อนุมัติให้สายโดยไม่หักเงินไหม (true = อนุมัติไม่หักเงิน, false = คิดหักเงินตามเกณฑ์สะสมเกิน 30 นาที)
  status: 'PENDING' | 'APPROVED_WAIVE' | 'APPROVED_DEDUCT' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  recordedAt: string;
  notes?: string;
}

export type AttendanceEventType = 
  | 'PRESENT' // มาปฏิบัติงาน (Present)
  | 'ABSENT' // ขาดงาน (Absent)
  | 'SICK' // ลาป่วย
  | 'BUSINESS' // ลากิจ
  | 'ANNUAL' // ลาพักร้อน
  | 'OTHER_LEAVE' // ลาอื่นๆ
  | 'LATE' // มาสาย (Late)
  | 'OT'; // ทำงานล่วงเวลา (OT)

export interface AttendanceRecord {
  id: string;
  userId?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  type: AttendanceEventType;
  date: string; // YYYY-MM-DD
  endDate?: string;
  amount: number; // วัน สำหรับขาด/ลา, นาที สำหรับมาสาย, ชม. สำหรับ OT
  reason?: string;
  recordedAt: string;
}

export type LeaveType = 'SICK' | 'BUSINESS' | 'ANNUAL' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// เช็คลิสต์เอกสารสำคัญของพนักงาน (ตามข้อกำหนดสากลและบรีฟ)
export interface EmployeeDocumentChecklist {
  idCardCopy: boolean; // สำเนาบัตรประชาชน / สำเนาบัตรประจำตัว
  houseRegistrationCopy: boolean; // สำเนาทะเบียนบ้าน
  photo: boolean; // รูปถ่ายหน้าตรง
  resume: boolean; // เรซูเม่ / ประวัติส่วนตัว
  educationHistory: boolean; // ประวัติการศึกษา / สำเนาวุฒิการศึกษา (บางตำแหน่ง)
  medicalCertificate?: boolean; // ใบรับรองแพทย์
  workPermitCopy?: boolean; // สำเนาใบอนุญาตทำงาน (ต่างด้าว)
  passportCopy?: boolean; // สำเนาหนังสือเดินทาง (ต่างด้าว)
  visaCopy?: boolean; // สำเนาวีซ่า (ต่างด้าว)
  cardCopy?: boolean; // สำเนาบัตร (กรณีบัตรสีชมพูหรือขาว)
  pinkOrWhiteCardCopy?: boolean; // สำเนาบัตร (กรณีบัตรสีชมพูหรือขาว)
  cardColor?: 'PINK' | 'WHITE';
  isRenewingWorkPermit?: boolean; // กำลังต่อใบอนุญาต
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  userId?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: LeaveType;
  startDate: string; // วันที่เริ่มขอลา YYYY-MM-DD
  endDate: string; // วันที่สิ้นสุดการลา YYYY-MM-DD
  days: number;
  reason: string;
  status: LeaveStatus;
  requestedAt: string;
  approvedOrRejectedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  // เช็คลิสต์เอกสารประกอบการลา & แฟ้มประวัติ
  documentChecklist?: {
    idCardCopy?: boolean; // สำเนาบัตรประชาชน
    houseRegistrationCopy?: boolean; // ทะเบียนบ้าน
    photo?: boolean; // รูปถ่าย
    resume?: boolean; // เรซูเม่
    educationHistory?: boolean; // ประวัติการศึกษา (บางตำแหน่ง)
    medicalCertificate?: boolean; // ใบรับรองแพทย์ (กรณีลาป่วย)
    otherDoc?: boolean; // เอกสารอื่นๆ
    otherDocNote?: string;
  };
  attachedDocName?: string;
  attachedDocUrl?: string;
}

// ==========================================
// ระบบตารางวันหยุด & เวลาทำงาน Part-time (Passtime)
// ==========================================
export type PartTimeAttendanceStatus = 
  | 'WORKED'       // มาทำงานตามกะ (Worked)
  | 'DAY_OFF'      // วันหยุดประจำสัปดาห์ / วันหยุดตามตาราง (Scheduled Day Off)
  | 'HOLIDAY_OFF'  // วันหยุดนักขัตฤกษ์ (หยุดตามสิทธิ)
  | 'HOLIDAY_WORK' // วันหยุดนักขัตฤกษ์ (มาทำงาน คิดเรทพิเศษ)
  | 'ABSENT'       // ขาดงาน (Absent)
  | 'SICK'         // ลาป่วย (Sick Leave - Passtime ไม่ได้รับเงิน 100%)
  | 'BUSINESS'     // ลากิจ (Business Leave - Passtime ไม่ได้รับเงิน 100%)
  | 'OTHER_LEAVE'; // ลาอื่นๆ (Other Leave - Passtime ไม่ได้รับเงิน)

export interface PartTimeDayLog {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0=อาทิตย์, 1=จันทร์, ..., 6=เสาร์
  status: PartTimeAttendanceStatus;
  
  // เวลาเข้า-ออกงาน
  clockIn?: string; // e.g. "10:00"
  clockOut?: string; // e.g. "19:00"
  breakMinutes?: number; // e.g. 60
  
  // คำนวณอัตโนมัติ
  totalHoursWorked: number; // ชั่วโมงทำงานจริงสุทธิ ((ออก - เข้า) - พัก)
  standardHours: number; // ชั่วโมงกะปกติ เช่น 8.00
  otHours: number; // ชั่วโมงล่วงเวลา (OT)
  lateMinutes: number; // มาสาย (นาที)
  
  // ค่าตอบแทน & การจ่ายเงิน
  hourlyRate: number; // อัตราค่าจ้างต่อชั่วโมง (บาท) เช่น 60
  isPaid: boolean; // มีค่าจ้างหรือไม่
  unpaidReasonNote?: string; // เช่น "Passtime ทุกการลาไม่ได้รับเงิน"
  totalWages: number; // รวมค่าจ้างของวัน
  
  notes?: string;
  recordedAt?: string;
}

export interface PartTimeWeeklyOffConfig {
  employeeId: string;
  weeklyDayOffDays: number[]; // เช่น [4] = วันพฤหัสบดี, [0] = วันอาทิตย์
  defaultShiftIn: string; // e.g. "10:00"
  defaultShiftOut: string; // e.g. "19:00"
  defaultBreakMinutes: number; // e.g. 60
  hourlyRate: number; // e.g. 60
}

export interface PartTimeEmployeeSummary {
  employeeId: string;
  employeeName: string;
  department: string;
  month: number;
  year: number;
  hourlyRate: number;
  daysWorked: number;
  daysOff: number;
  absentDays: number;
  sickLeaveDays: number;
  businessLeaveDays: number;
  otherLeaveDays: number;
  lateCount: number;
  lateMinutes: number;
  normalHours: number;
  otHours: number;
  totalHours: number;
  normalPay: number;
  otPay: number;
  lateDeduction: number;
  netWage: number;
  dailyLogs: PartTimeDayLog[];
}

export interface WarningRecord {
  id: string;
  date: string;
  level: 'VERBAL' | 'WRITTEN' | 'PROBATION';
  reason: string;
  issuedBy: string;
}

export type StatusChangeType = 
  | 'EMPLOYMENT_START' // เริ่มงาน
  | 'PROBATION_PASS' // ผ่านทดลองงาน
  | 'PROMOTION' // ปรับตำแหน่ง
  | 'TRANSFER' // โอนย้ายแผนก/สาขา
  | 'SALARY_ADJUST' // ปรับเงินเดือน
  | 'RESIGNATION' // พ้นสภาพ/ลาออก
  | 'REHIRE' // รับกลับเข้าทำงาน
  | 'CONTRACT_RENEWAL' // ต่อสัญญาจ้าง
  | 'HR_NOTE'; // บันทึกสถานะ/หมายเหตุ HR

export interface StatusChangeRecord {
  id: string;
  date: string; // YYYY-MM-DD
  type: StatusChangeType;
  title: string;
  fromValue?: string;
  toValue?: string;
  details?: string;
  recordedBy?: string;
  recordedAt?: string;
}

// ข้อมูลการจัดกิจกรรมวันเกิดและคำอวยพรพนักงาน
export type BirthdayActivityStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED';

export interface BirthdayEventNote {
  note?: string; // รายละเอียดการเตรียมงาน / เซอร์ไพรส์
  cakeFlavor?: string; // รสชาติเค้ก/อาหารที่ชอบ
  cakeShop?: string; // ร้านสั่งเค้ก
  activityTime?: string; // เวลาจัดกิจกรรม เช่น 15:30 น.
  budget?: number; // งบประมาณ (บาท)
  organizer?: string; // ผู้รับผิดชอบจัดกิจกรรม
  preparationStatus: BirthdayActivityStatus; // สถานะการเตรียมการ
  wishedSent: boolean; // ส่งคำอวยพรแล้วหรือยัง
  wishedSentAt?: string; // วันที่ส่งคำอวยพร
  wishedMessage?: string; // ข้อความที่ส่ง
  lastUpdated?: string;
}

// สถานะรายการในเช็คลิสต์เอกสาร HR ของพนักงานแต่ละคน
export interface HrChecklistEntry {
  done: boolean;
  doneAt?: string; // YYYY-MM-DD
  note?: string;
}

// ==========================================
// คลังเอกสาร: เทมเพลต .docx และประวัติการสร้างเอกสาร
// ==========================================
export type DocTemplateCategory =
  | 'ONBOARDING' // เอกสารรับเข้าทำงาน
  | 'CONTRACT' // สัญญา / ข้อตกลง
  | 'CERTIFICATE' // หนังสือรับรอง
  | 'EMPLOYMENT' // ระหว่างการจ้างงาน (เตือน, ปรับตำแหน่ง ฯลฯ)
  | 'OFFBOARDING' // ออกจากงาน
  | 'OTHER';

export const DOC_TEMPLATE_CATEGORY_LABELS: Record<DocTemplateCategory, string> = {
  ONBOARDING: 'รับเข้าทำงาน',
  CONTRACT: 'สัญญา / ข้อตกลง',
  CERTIFICATE: 'หนังสือรับรอง',
  EMPLOYMENT: 'ระหว่างจ้างงาน',
  OFFBOARDING: 'ออกจากงาน',
  OTHER: 'อื่น ๆ',
};

export interface DocTemplate {
  id: string;
  userId?: string;
  name: string; // ชื่อเทมเพลต เช่น สัญญาจ้างงาน
  code?: string; // รหัสเอกสารภายใน เช่น HR-ON-03
  category: DocTemplateCategory;
  checklistKey?: string; // ผูกกับรายการในเช็คลิสต์ (รหัสเดียวกับ hrChecklist) เพื่อติ๊กอัตโนมัติเมื่อสร้างเอกสาร
  fileName: string;
  fileSize: number; // bytes
  contentBase64: string; // เนื้อไฟล์ .docx เข้ารหัส base64
  placeholders: string[]; // ตัวแปรที่พบในเทมเพลต เช่น ['full_name', 'salary']
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedDocumentRecord {
  id: string;
  userId?: string;
  templateId: string;
  templateName: string;
  checklistKey?: string;
  employeeId: string;
  employeeName: string;
  fileName: string;
  generatedAt: string; // ISO
  generatedBy?: string;
}

export interface Employee {
  // ส่วนที่ 1: ข้อมูลพนักงานทั่วไป
  id: string; // รหัสพนักงาน เช่น EMP-001
  userId?: string; // เจ้าของข้อมูล / รหัสผู้ดูแล (Firebase Auth UID)
  fullName: string; // ชื่อ-นามสกุล
  nickname: string; // ชื่อเล่น
  idCardNumber: string; // เลขบัตรประชาชน (หรือเลขประจำตัว 13 หลัก)
  birthDate: string; // วันเกิด YYYY-MM-DD
  phoneNumber: string; // เบอร์โทรศัพท์
  address: string; // ที่อยู่
  position: string; // ตำแหน่ง
  department: Department; // แผนก
  branch?: string; // สาขา / สถานที่ปฏิบัติงานหลัก (สำนักงานใหญ่ (เชียงใหม่))
  startDate: string; // วันที่เริ่มงาน YYYY-MM-DD
  employmentType: EmploymentType; // ประเภทการจ้าง (FULL_TIME, PROBATION, CONTRACT, ฯลฯ)
  salary: number; // เงินเดือน (บาท)
  allowance?: number; // ค่าตำแหน่ง/เบี้ยเลี้ยง (บาท)
  emergencyContact: EmergencyContact; // บุคคลติดต่อฉุกเฉิน

  // สัญชาติ
  isForeignWorker: boolean; // false = ไทย, true = ต่างด้าว
  nationalityText: string; // เช่น ไทย, เมียนมา, ลาว, กัมพูชา

  // โครงสร้างเอกสารประจำตัวหลัก (ตามข้อกำหนดสากล)
  identificationType?: IdentificationType;
  identificationNumber?: string;
  identificationIssueDate?: string;
  identificationExpiryDate?: string;

  // ใบอนุญาตทำงานหลัก
  workPermitNumber?: string;
  workPermitIssueDate?: string;
  workPermitExpiryDate?: string;
  isRenewingWorkPermit?: boolean; // กำลังต่อใบอนุญาต

  // เช็คลิสต์เอกสารสำคัญของพนักงาน (สำเนาบัตร, ทะเบียนบ้าน, รูปถ่าย, เรซูเม่, การศึกษา ฯลฯ)
  documentChecklist?: EmployeeDocumentChecklist;

  // เช็คลิสต์เอกสาร HR ที่ต้องมีต่อพนักงาน (คีย์ = รหัสเอกสาร เช่น HR-ON-03) ดู data/hrChecklist.ts
  hrChecklist?: Record<string, HrChecklistEntry>;

  // ส่วนที่ 2: ข้อมูลแรงงานต่างด้าว (เปิดเมื่อ isForeignWorker = true)
  foreignDetails?: ForeignWorkerDetails;

  // การลาออก
  resignation: ResignationDetails;

  // เอกสารแนบทั้งหมดของพนักงาน
  documents?: WorkerDocument[];

  // สถิติการทำงานย้อนหลัง (12 เดือนของรอบปีปัจจุบัน)
  attendanceHistory: MonthlyAttendance[];

  // บันทึกการเตือน
  warnings?: WarningRecord[];

  // ประวัติการเปลี่ยนแปลงสถานะและกิจกรรม
  statusHistory?: StatusChangeRecord[];

  // หมายเหตุจัดกิจกรรมวันเกิดและคำอวยพร HR
  birthdayNote?: BirthdayEventNote;

  avatarUrl?: string;
  resumeUrl?: string; // ลิงก์เรซูเม่ (Google Drive หรือไฟล์)
  resumeFileName?: string;
  driveFolderUrl?: string; // ลิงก์โฟลเดอร์ Google Drive รวมเอกสารพนักงาน
  bankAccount?: {
    bankName: string;
    accountNumber: string;
  };
}

export interface PayrollCalculation {
  employeeId: string;
  employeeName: string;
  position: string;
  department: string;
  isForeignWorker: boolean;
  nationalityText: string;
  month: number;
  year: number;
  
  // วันทำงานและวันลา
  workingDaysStandard: number; // จำนวนวันทำงานมาตรฐานในรอบเดือน (เช่น 26 วัน หรือ 30 วัน)
  daysWorked: number; // จำนวนวันที่มาทำงานจริง (คำนวณจาก วันมาตรฐาน - ขาดงาน - วันลาหักเงิน)
  leaveDays: number; // จำนวนวันลาทั้งหมดในเดือน (ป่วย + กิจ + พักร้อน + อื่นๆ)
  dailyRate: number; // อัตราค่าจ้างต่อวัน
  hourlyRate: number; // อัตราค่าจ้างต่อชั่วโมง

  // รายได้
  baseSalary: number;
  positionAllowance: number;
  allowance?: number;
  attendanceBonus: number; // เบี้ยขยัน
  otHours: number;
  otPay: number; // คำนวณตามชั่วโมง
  otherBonus: number;
  totalIncome: number;

  // รายการหัก
  absentDays?: number;
  absentDeduction: number; // หักขาดงาน
  leaveDeduction: number; // หักลบวันลา (กรณีเกินสิทธิ์หรือลากิจหักเงิน)
  lateCount?: number;
  lateMinutes?: number;
  waivedLateMinutes?: number; // นาทีสายที่อนุมัติยกเว้นไม่หักเงิน
  billableLateMinutes?: number; // นาทีสายที่นำมาคิดหักเงิน (เกิน 30 นาที)
  lateDeduction: number; // หักมาสาย (นาทีละ 10 บาท สำหรับส่วนเกิน 30 นาที)
  socialSecurity: number; // ประกันสังคมส่วนลูกจ้าง (5% ของฐาน 1,650 - เพดานตามปี ดู utils/socialSecurity.ts)
  taxWithheld: number; // ภาษีหัก ณ ที่จ่าย
  otherDeduction: number;
  totalDeductions: number;

  // สุทธิ
  netSalary: number;
  paidStatus?: 'PAID' | 'PENDING';
  paidDate?: string;
}

export interface ReportHistoryItem {
  id: string;
  userId?: string;
  reportTitle: string;
  month: number;
  year: number;
  generatedAt: string;
  generatedBy?: string;
  employeeCount: number;
  thaiCount: number;
  foreignCount: number;
  totalAbsentDays: number;
  totalLeaveDays: number;
  totalLateCount: number;
  totalLateMinutes: number;
  totalOtHours: number;
  fileFormat: 'PDF' | 'HTML';
  notes?: string;
  snapshotHtml?: string;
}

// ข้อมูลวันหยุดนักขัตฤกษ์ / วันหยุดราชการ
export interface PublicHoliday {
  id: string;
  date: string; // YYYY-MM-DD
  nameThai: string;
  nameEnglish: string;
  isTraditionalOrReligious?: boolean;
  description?: string;
}

// หมวดหมู่กิจกรรมและวันสำคัญของบริษัท
export type CompanyEventCategory = 
  | 'MEETING' // การประชุม
  | 'TRAINING' // อบรม/สัมมนา/เวิร์กช็อป
  | 'AUDIT' // ตรวจนับสต็อก / ตรวจสอบคุณภาพ
  | 'MAINTENANCE' // ซ่อมบำรุง / Big Cleaning
  | 'CELEBRATION' // กิจกรรมสังสรรค์ / สวัสดิการ
  | 'OTHER'; // อื่นๆ

// กิจกรรมและวันสำคัญขององค์กร
export interface CompanyEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (ถ้าเป็นกิจกรรมหลายวัน)
  category: CompanyEventCategory;
  targetDepartment?: Department | 'ALL';
  notes?: string;
  location?: string;
  color?: string;
  createdBy?: string;
  createdAt?: string;
}

// ข้อมูลการบันทึกวันหยุดชดเชย กรณีพนักงานมาทำงานในวันหยุด (Compensatory Day Off)
export interface CompensatoryHolidayRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  workedDate: string; // วันที่มาปฏิบัติงานในวันหยุด YYYY-MM-DD
  holidayName: string; // ชื่อวันหยุดที่มาปฏิบัติงาน
  earnedDays: number; // สิทธิ์วันหยุดชดเชยที่ได้รับ (เช่น 1 วัน)
  compensateDate?: string; // วันที่ขอหยุดชดเชย (YYYY-MM-DD)
  status: 'PENDING_USE' | 'COMPENSATED' | 'CANCELLED'; // รอใช้วันหยุด / ชดเชยแล้ว / ยกเลิก
  recordedAt: string;
  recordedBy?: string;
  approvedBy?: string;
  notes?: string;
}

// ==========================================
// ระบบรับสมัครงาน & ใบสมัครออนไลน์ (Recruitment)
// ==========================================

export interface JobOpening {
  id: string;
  title: string; // เช่น พนักงานบริการหน้าร้าน, ผู้ช่วยกุ๊ก, บาริสต้า
  department: Department;
  branch: string;
  employmentType: EmploymentType;
  positionsAvailable: number; // จำนวนอัตราที่เปิดรับ เช่น 2 อัตรา
  salaryRange: string; // เช่น 15,000 - 18,000 บาท
  description: string; // หน้าที่ความรับผิดชอบ
  qualifications: string[]; // คุณสมบัติผู้สมัคร
  isActive: boolean; // เปิดรับ / ปิดรับ
  urgent: boolean; // รับด่วน
  createdAt?: string;
}

export interface CompanySettings {
  companyName: string;
  companyTagline?: string;
  companyLogoUrl?: string;
  companyAddress?: string;
  workLocation?: string;
  taxId?: string;
  branchName?: string;
  website?: string;
  contactPhone: string;
  contactEmail: string;
  contactLineId?: string;
  contactFacebook?: string;
  hrManagerName?: string;
  businessHours?: string;
}

export interface JobApplicationSettings extends CompanySettings {
  isOpen: boolean; // สถานะเปิดรับสมัครงานของบริษัท
  openings: JobOpening[];
  requirePhoto: boolean;
  requireResume: boolean;
  requireIdCardCopy: boolean;
  requireWorkExperience: boolean;
  thankYouMessage?: string;
  allowForeignWorkers: boolean; // เปิดรับแรงงานต่างด้าวด้วยหรือไม่
  lastUpdated?: string;
}

export type JobApplicationStatus = 
  | 'PENDING' // รอพิจารณา
  | 'REVIEWING' // กำลังตรวจสอบเอกสาร
  | 'INTERVIEW_SCHEDULED' // นัดสัมภาษณ์แล้ว
  | 'APPROVED' // ผ่านการคัดเลือก
  | 'REJECTED' // ไม่ผ่านการพิจารณา
  | 'RETAINED' // เก็บประวัติไว้ (สำรอง/Talent Pool)
  | 'HIRED'; // รับเข้าทำงานเป็นพนักงานแล้ว

// โครงสร้างประวัติการศึกษา (ตามตารางหน้า 2 ของ PDF)
export interface EducationRecord {
  level: string; // มัธยมศึกษาตอนปลาย, ปวช., ปวท./ปวส., ปริญญาตรี, สูงกว่าปริญญาตรี, อื่นๆ
  institution: string;
  major: string;
  fromYear: string;
  toYear: string;
}

// โครงสร้างประวัติการทำงาน (ตามตารางหน้า 2 ของ PDF)
export interface WorkExperienceRecord {
  company: string;
  fromPeriod: string;
  toPeriod: string;
  position: string;
  jobDescription: string;
  salary: string;
  reasonForLeaving: string;
}

// โครงสร้างระดับภาษา (ตามตารางหน้า 2 ของ PDF)
export type LanguageSkillLevel = 'GOOD' | 'FAIR' | 'POOR';

export interface LanguageSkills {
  speaking?: LanguageSkillLevel;
  writing?: LanguageSkillLevel;
  reading?: LanguageSkillLevel;
}

// ผู้ที่อ้างถึง 2 คน (ตามหน้า 3 ของ PDF)
export interface JobReferenceContact {
  name: string;
  address?: string;
  phone: string;
  occupation: string;
}

// รายชื่อพี่น้อง (ตามหน้า 2 ของ PDF)
export interface SiblingInfo {
  name: string;
  age?: string | number;
  occupation?: string;
}

export interface JobApplication {
  id: string; // รหัสใบสมัคร เช่น APP-202610-001
  appliedAt: string; // วันที่ส่งใบสมัคร ISO String
  status: JobApplicationStatus;
  
  // ตำแหน่งที่สมัคร (ตามหน้า 1 ของ PDF: ตำแหน่ง 1, ตำแหน่ง 2, เงินเดือน)
  jobOpeningId?: string;
  position: string; // ตำแหน่งที่ต้องการ 1
  department: Department;
  branch: string;
  expectedSalary: number; // เงินเดือน (บาท/เดือน)
  position2?: string; // ตำแหน่งที่ต้องการ 2
  expectedSalary2?: number; // เงินเดือน ตำแหน่ง 2
  availableStartDate: string; // วันที่พร้อมเริ่มงาน
  desiredEmploymentType: EmploymentType;

  // Personal information (ประวัติส่วนตัว - ตามหน้า 1 ของ PDF)
  fullName: string;
  nickname: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  birthDate: string; // YYYY-MM-DD
  age?: number;
  race?: string; // เชื้อชาติ
  nationalityText: string; // สัญชาติ
  religion?: string; // ศาสนา
  idCardNumber: string; // บัตรประชาชนเลขที่
  idCardExpirationDate?: string; // บัตรหมดอายุ
  heightCm?: number; // ส่วนสูง ซม.
  weightKg?: number; // น้ำหนัก กก.
  militaryStatus?: 'EXEMPTED' | 'SERVED' | 'NOT_YET_SERVED'; // ได้รับการยกเว้น, ปลดเป็นทหารกองหนุน, ยังไม่ได้รับการเกณฑ์
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'WIDOWED' | 'SEPARATED'; // โสด, แต่งงาน, หม้าย, แยกกัน

  // ที่อยู่ปัจจุบัน (Present address - ตามหน้า 1 ของ PDF)
  addressNo?: string; // เลขที่
  addressMoo?: string; // หมู่ที่
  addressRoad?: string; // ถนน
  addressSubdistrict?: string; // ตำบล/แขวง
  addressDistrict?: string; // อำเภอ/เขต
  addressProvince?: string; // จังหวัด
  addressPostcode?: string; // รหัสไปรษณีย์
  currentAddress: string; // รวมข้อความที่อยู่เต็ม
  livingType?: 'LIVING_WITH_PARENTS' | 'OWN_HOME' | 'HIRED_HOUSE' | 'HOSTEL'; // อาศัยกับครอบครัว, บ้านตัวเอง, บ้านเช่า, หอพัก
  phoneNumber: string; // โทรศัพท์ / มือถือ
  pager?: string; // เพจเจอร์
  email: string;
  lineId?: string;

  // Family Information (ประวัติครอบครัว - ตามหน้า 1-2 ของ PDF)
  fatherName?: string;
  fatherAge?: number;
  fatherOccupation?: string;
  motherName?: string;
  motherAge?: number;
  motherOccupation?: string;
  spouseName?: string; // ชื่อภรรยา/สามี
  spouseWorkingPlace?: string; // สถานที่ทำงาน
  spousePosition?: string; // ตำแหน่ง
  childrenCount?: number; // มีบุตร กี่คน
  siblingsTotal?: number; // มีพี่น้อง (รวมผู้สมัคร)
  siblingsMale?: number; // ชาย
  siblingsFemale?: number; // หญิง
  siblingOrder?: number; // เป็นบุตรคนที่
  siblingsList?: SiblingInfo[]; // ตารางพี่น้อง

  // สัญชาติ & เอกสารประจำตัว
  isForeignWorker: boolean;
  identificationType?: IdentificationType;

  // Education (การศึกษา - ตามตารางหน้า 2 ของ PDF)
  educationLevel: string; // เช่น มัธยมศึกษา, ปวช., ปวส., ปริญญาตรี
  fieldOfStudy?: string; // สาขาวิชา
  educationRecords?: EducationRecord[];

  // Working Experience (รายละเอียดของงานที่ผ่าน - ตามตารางหน้า 2 ของ PDF)
  experienceYears: number; // ประสบการณ์ทำงานรวม (ปี)
  previousCompany?: string; // ที่ทำงานล่าสุด
  previousPosition?: string; // ตำแหน่งล่าสุด
  workExperiences?: WorkExperienceRecord[];

  // Language Ability (ความสามารถด้านภาษา - ตามตารางหน้า 2 ของ PDF)
  languages?: {
    thai?: LanguageSkills;
    english?: LanguageSkills;
    japanese?: LanguageSkills;
    otherLangName?: string;
    other?: LanguageSkills;
  };

  // Special Ability (ความสามารถพิเศษ - ตามหน้า 3 ของ PDF)
  typingThai?: { canType: boolean; wordsPerMinute?: number };
  typingEnglish?: { canType: boolean; wordsPerMinute?: number };
  computerSkill?: { canUse: boolean; details?: string };
  driving?: { canDrive: boolean; licenseNumber?: string };
  officeMachine?: string;
  hobbies?: string;
  favouriteSport?: string;
  specialKnowledge?: string;
  otherSpecialAbility?: string;
  skills?: string; // ทักษะสรุปรวม

  // ข้อมูลคำถามเพิ่มเติม (ตามหน้า 3 ของ PDF)
  canWorkUpCountry?: 'YES' | 'NO' | 'OTHER';
  canWorkUpCountryDetails?: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactAddress?: string;
  emergencyContactPhone: string;
  sourceOfJobInfo?: string; // ทราบข่าวการรับสมัครจาก
  hasSeriousIllness?: boolean; // เคยป่วยหนักหรือเป็นโรคติดต่อร้ายแรงมาก่อนหรือไม่
  seriousIllnessDetails?: string; // ถ้าเคยระบุชื่อโรค
  hasAppliedBefore?: boolean; // เคยสมัครงานกับบริษัทนี้มาก่อนหรือไม่
  appliedBeforeWhen?: string; // ถ้าเคย เมื่อไร
  relativesInCompany?: string; // ชื่อญาติ/เพื่อนที่ทำงานในบริษัท
  references?: JobReferenceContact[]; // ผู้ที่อ้างถึง 2 คน
  selfIntroduction?: string; // กรุณาแนะนำตัวท่านเอง เพื่อให้บริษัทรู้จักตัวท่านดีขึ้น
  introduction?: string;

  // ไฟล์แนบ / รูปภาพ (Base64 Data URL หรือ Google Drive Link)
  photoUrl?: string; // รูปถ่ายหน้าตรง (Data URL หรือ Google Drive URL)
  photoDriveUrl?: string; // ลิงก์ตรงไปยัง Google Drive สำหรับรูปถ่าย
  photoSourceType?: 'UPLOAD' | 'GOOGLE_DRIVE';
  resumeFileName?: string;
  resumeUrl?: string; // Data URL หรือ Google Drive URL ของเรซูเม่
  resumeDriveUrl?: string; // ลิงก์ตรงไปยัง Google Drive สำหรับเรซูเม่
  resumeSourceType?: 'UPLOAD' | 'GOOGLE_DRIVE';
  idCardCopyUrl?: string;
  idCardDriveUrl?: string;

  // Applicant Certification (ตามหน้า 4 ของ PDF - รับรองความถูกต้อง โดยตัดส่วนการพิจารณาว่าจ้างออก)
  applicantSignature?: string; // ลายมือชื่อผู้สมัคร
  certifiedAt?: string;

  canWorkInShifts?: boolean;
  hasDriversLicense?: boolean;

  // ส่วนบันทึกของ HR
  hrNotes?: string; // บันทึกผลการพิจารณา / จุดเด่นผู้สมัคร
  interviewDate?: string; // วันเวลานัดสัมภาษณ์ (YYYY-MM-DDTHH:mm)
  interviewLocation?: string; // สถานที่สัมภาษณ์ / ลิงก์ออนไลน์
  reviewedBy?: string;
  convertedToEmployeeId?: string; // รหัสพนักงานที่ถูกสร้างขึ้น (กรณีรับเข้าทำงาน)
}

export const DEFAULT_JOB_OPENINGS: JobOpening[] = [
  {
    id: 'JOB-001',
    title: 'พนักงานบริการหน้าร้าน (Service Crew)',
    department: 'แผนกบริการหน้าร้าน',
    branch: 'สำนักงานใหญ่ (เชียงใหม่)',
    employmentType: 'FULL_TIME',
    positionsAvailable: 2,
    salaryRange: '15,000 - 18,000 บาท/เดือน + ทิปรวม',
    description: 'ต้อนรับลูกค้า แนะนำเมนูอาหารและเครื่องดื่ม รับออเดอร์ เสิร์ฟ และดูแลความสะอาดเรียบร้อยในพื้นที่บริการ',
    qualifications: [
      'อายุ 18 ปีขึ้นไป มีบุคลิกภาพดี มีใจรักงานบริการ',
      'สื่อสารภาษาไทยได้คล่องแคล่ว (หากสื่อสารภาษาอังกฤษหรือภาษาพม่าได้จะพิจารณาเป็นพิเศษ)',
      'ขยัน ซื่อสัตย์ ตรงต่อเวลา และสามารถทำงานร่วมกับผู้อื่นได้ดี',
      'สามารถทำงานเป็นกะได้'
    ],
    isActive: true,
    urgent: true,
  },
  {
    id: 'JOB-002',
    title: 'ผู้ช่วยกุ๊ก / พนักงานเตรียมวัตถุดิบ (Kitchen Assistant)',
    department: 'แผนกครัว',
    branch: 'สำนักงานใหญ่ (เชียงใหม่)',
    employmentType: 'FULL_TIME',
    positionsAvailable: 2,
    salaryRange: '16,000 - 19,000 บาท/เดือน + เบี้ยขยัน',
    description: 'เตรียมวัตถุดิบ ปรุงอาหารตามมาตรฐานสูตรของร้าน ดูแลสุขอนามัยในครัว และจัดเก็บสต็อกวัตถุดิบ',
    qualifications: [
      'อายุ 20 ปีขึ้นไป มีสุขอนามัยที่ดี สะอาด เรียบร้อย',
      'มีประสบการณ์งานครัวร้านอาหารอย่างน้อย 6 เดือนขึ้นไป',
      'รับทั้งแรงงานไทยและแรงงานต่างด้าวที่มีเอกสารอนุญาตทำงานถูกต้อง',
      'มีความอดทน สามารถทำงานภายใต้ความกดดันช่วงชั่วโมงเร่งด่วนได้'
    ],
    isActive: true,
    urgent: false,
  },
  {
    id: 'JOB-003',
    title: 'เจ้าหน้าที่การตลาดและสื่อสาร (Marketing Officer)',
    department: 'แผนกการตลาดและสื่อสาร',
    branch: 'สำนักงานใหญ่ (เชียงใหม่)',
    employmentType: 'FULL_TIME',
    positionsAvailable: 1,
    salaryRange: '18,000 - 24,000 บาท/เดือน (ตามประสบการณ์)',
    description: 'วางแผนคอนเทนต์ ประชาสัมพันธ์โปรโมชั่น ดูแลช่องทาง Social Media (Facebook, TikTok, LINE OA) และติดต่อประสานงานกิจกรรม',
    qualifications: [
      'วุฒิปริญญาตรี สาขาการตลาด, นิเทศศาสตร์ หรือสาขาที่เกี่ยวข้อง',
      'มีความคิดสร้างสรรค์ ถ่ายภาพ/วิดีโอ และตัดต่อคลิปสั้นได้',
      'เข้าใจเทรนด์อาหารและเครื่องดื่มใน Social Media',
      'มีทักษะการสื่อสารและประสานงานที่ดี'
    ],
    isActive: true,
    urgent: false,
  }
];

export const DEFAULT_JOB_SETTINGS: JobApplicationSettings = {
  companyName: 'บริษัท เอชอาร์เอ็ม โปร จำกัด (สาขาเชียงใหม่)',
  companyTagline: 'ผู้นำด้านธุรกิจร้านอาหารและการบริการครบวงจร',
  companyLogoUrl: '',
  companyAddress: '123 ถนนนิมมานเหมินท์ ตำบลสุเทพ อำเภอเมือง จังหวัดเชียงใหม่ 50200',
  taxId: '0505562001234',
  branchName: 'สำนักงานใหญ่ (เชียงใหม่)',
  website: 'https://www.hrm-pro.com',
  workLocation: 'สำนักงานใหญ่ (เชียงใหม่) 123 ถ.นิมมานเหมินท์ ต.สุเทพ อ.เมือง จ.เชียงใหม่',
  contactPhone: '053-123456 / 089-9998888',
  contactEmail: 'hr@hrm-pro.com',
  contactLineId: '@hrmpro_jobs',
  contactFacebook: 'facebook.com/hrmprothailand',
  hrManagerName: 'คุณสมศรี ผู้จัดการฝ่ายทรัพยากรบุคคล',
  businessHours: 'จันทร์ - ศุกร์ 08:30 - 17:30 น.',
  isOpen: true,
  openings: DEFAULT_JOB_OPENINGS,
  requirePhoto: true,
  requireResume: false,
  requireIdCardCopy: true,
  requireWorkExperience: false,
  allowForeignWorkers: true,
  thankYouMessage: 'ขอบคุณที่สนใจร่วมงานกับเรา ฝ่ายบุคคล (HR) ได้รับข้อมูลใบสมัครของท่านเรียบร้อยแล้ว และจะทำการตรวจสอบคุณสมบัติเพื่อติดต่อกลับภายใน 2-3 วันทำการ',
};

// ==========================================
// EMPLOYMENT CONTRACT & WORK SHIFT TYPES
// ==========================================

export interface WorkShift {
  id: string;
  name: string; // เช่น กะเช้า, กะบ่าย, กะดึก, กะปกติ
  startTime: string; // เช่น '08:00'
  endTime: string; // เช่น '17:00'
  breakMinutes: number; // เวลาพัก (นาที)
  workDaysPerWeek: number; // วันทำงานต่อสัปดาห์ เช่น 6
  description?: string;
}

export interface DepartmentShiftConfig {
  department: Department;
  shifts: WorkShift[];
  defaultShiftId?: string;
}

export interface ContractSettings {
  companyName: string;
  companyAddress: string;
  companyTaxId?: string; // เลขทะเบียนนิติบุคคล เช่น 0505569012848
  employerSignerName: string; // ผู้มีอำนาจลงนามแทนนายจ้าง เช่น นายเหมวิช พลนาคู และ นางสาวภัสร์ฐิตา นวลตา
  employerSignerTitle: string; // ตำแหน่งผู้มีอำนาจลงนาม
  witness1Name: string; // พยานคนที่ 1
  witness2Name: string; // พยานคนที่ 2
  probationDays: number; // ระยะเวลาทดลองงาน (วัน) เช่น 90 หรือ 119
  noticePeriodDays: number; // ระยะเวลาบอกกล่าวล่วงหน้า (วัน) เช่น 30
  weeklyHolidays: string; // วันหยุดประจำสัปดาห์ เช่น ร้านหยุดทุกวันพฤหัสบดี
  standardPaymentDay: string; // กำหนดวันจ่ายค่าจ้าง เช่น ทุกวันที่ 5 ของเดือน
  confidentialityClause: string; // ข้อตกลงการรักษาความลับ
  rulesAndRegulations: string; // ระเบียบข้อบังคับการทำงาน
  departmentShifts: DepartmentShiftConfig[];
}

export type ContractType = 'PROBATION' | 'PERMANENT' | 'TEMPORARY';
export type ContractStatus = 'ACTIVE' | 'DRAFT' | 'TERMINATED';

export type ContractNationalityCategory = 'THAI' | 'MYANMAR' | 'OTHER';
export type ContractPaymentMethod = 'BANK_TRANSFER' | 'CASH';

export interface EmploymentContract {
  id: string; // รหัสสัญญา เช่น CTR-202610-001
  contractNumber: string; // เลขที่สัญญา เช่น 012/2569
  createdAt: string;
  contractDate: string; // วันที่ทำสัญญา (YYYY-MM-DD)
  
  // พนักงาน / ลูกจ้าง
  employeeId?: string;
  applicationId?: string;
  employeeName: string;
  
  // วันเกิดแยก วัน เดือน ปี (พ.ศ.)
  birthDate?: string; // YYYY-MM-DD
  birthDay?: string; // เช่น "15"
  birthMonth?: string; // เช่น "มกราคม"
  birthYear?: string; // เช่น "2540"
  
  // สัญชาติและการเลือก ( ) ไทย / ( ) เมียนมา / ( ) อื่นๆ
  nationalityCategory: ContractNationalityCategory;
  otherNationalityText?: string; // เช่น ลาว, กัมพูชา
  
  // เอกสารประจำตัว
  idCardNumber: string; // บัตรประจำตัวประชาชน เลขที่
  workPermitNumber?: string; // ใบอนุญาตทำงาน เลขที่
  workPermitExpiryDate?: string; // วันหมดอายุใบอนุญาตทำงาน (YYYY-MM-DD หรือข้อความไทย)
  
  address: string;
  phone: string;
  
  // ข้อมูลการจ้างงาน
  position: string;
  department: Department;
  branch: string;
  contractType: ContractType;
  startDate: string;
  endDate?: string;
  probationDays: number;
  
  // อัตราค่าจ้าง & การจ่ายเงิน
  salary: number; // จำนวนเงิน (รายเดือน)
  dailyWage?: number; // จำนวนเงิน (รายวัน)
  salaryType: 'MONTHLY' | 'DAILY';
  paymentMethod: ContractPaymentMethod; // ( ) โอนเข้าบัญชีธนาคาร / ( ) เงินสด ณ สถานประกอบการ
  bankName?: string; // เช่น ธนาคารกสิกรไทย, ไทยพาณิชย์
  bankAccountNumber?: string; // เลขที่บัญชีธนาคาร
  paymentDay: string; // เช่น ทุกวันที่ 5 ของเดือน
  
  // กะการทำงาน & เวลาเข้างาน-ออกงาน
  shiftOption?: 'SHIFT_1' | 'SHIFT_2' | 'SHIFT_3' | 'CUSTOM'; // กะเช้า 1 (07.00-16.00), กะเช้า 2 (08.00-17.00), กะบ่าย (12.00-21.00)
  shiftId?: string;
  shiftName: string;
  startTime: string; // เวลาเข้างาน เช่น '07:00'
  endTime: string; // เวลาออกงาน เช่น '16:00'
  breakMinutes: number; // เวลาพัก เช่น 60
  workDaysPerWeek: number; // เช่น 6 วัน (วันศุกร์ถึงวันพุธ ร้านหยุดทุกวันพฤหัสบดี)
  weeklyHoliday: string;
  
  // ภาคผนวก 1 คำบรรยายหน้าที่และเกณฑ์ประเมิน
  mainDuties?: string[]; // หน้าที่หลัก 1..5
  supervisor?: string; // ผู้บังคับบัญชา
  
  // ผู้ลงนาม
  employerSignerName: string;
  employerSignerTitle: string;
  witness1Name?: string;
  witness2Name?: string;
  specialTerms?: string;
  
  status: ContractStatus;
}

export const DEFAULT_DEPARTMENT_SHIFTS: DepartmentShiftConfig[] = [
  {
    department: 'แผนกบริการหน้าร้าน',
    defaultShiftId: 'SHIFT-SRV-01',
    shifts: [
      {
        id: 'SHIFT-SRV-01',
        name: 'กะเช้า (Morning Shift)',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 60,
        workDaysPerWeek: 6,
        description: 'กะเปิดร้าน ต้อนรับลูกค้า ดูแลความสะอาดและการบริการ',
      },
      {
        id: 'SHIFT-SRV-02',
        name: 'กะบ่าย (Afternoon Shift)',
        startTime: '12:00',
        endTime: '21:00',
        breakMinutes: 60,
        workDaysPerWeek: 6,
        description: 'กะรับลูกค้าช่วงบ่ายและรอบค่ำ แคชเชียร์และหน้าร้าน',
      },
      {
        id: 'SHIFT-SRV-03',
        name: 'กะปิดร้าน (Closing Shift)',
        startTime: '15:00',
        endTime: '24:00',
        breakMinutes: 60,
        workDaysPerWeek: 6,
        description: 'กะรอบค่ำ ดูแลความเรียบร้อย สรุปยอดขาย และปิดร้าน',
      },
    ],
  },
  {
    department: 'แผนกครัว',
    defaultShiftId: 'SHIFT-KIT-01',
    shifts: [
      {
        id: 'SHIFT-KIT-01',
        name: 'กะเปิดครัว / เตรียมวัตถุดิบ (Prep Shift)',
        startTime: '07:00',
        endTime: '16:00',
        breakMinutes: 60,
        workDaysPerWeek: 6,
        description: 'รับวัตถุดิบ ตรวจสอบความสด และเตรียมพร้อมก่อนเปิดร้าน',
      },
      {
        id: 'SHIFT-KIT-02',
        name: 'กะปรุงอาหารรอบเย็น (Main Cook Shift)',
        startTime: '14:00',
        endTime: '23:00',
        breakMinutes: 60,
        workDaysPerWeek: 6,
        description: 'ปรุงอาหารช่วงชั่วโมงเร่งด่วน จัดการสต็อก และทำความสะอาดครัว',
      },
    ],
  },
  {
    department: 'แผนกการตลาดและสื่อสาร',
    defaultShiftId: 'SHIFT-MKT-01',
    shifts: [
      {
        id: 'SHIFT-MKT-01',
        name: 'กะออฟฟิศปกติ (Office Hours)',
        startTime: '09:00',
        endTime: '18:00',
        breakMinutes: 60,
        workDaysPerWeek: 5,
        description: 'วางแผนการตลาด ผลิตคอนเทนต์ และดูแลช่องทางออนไลน์',
      },
    ],
  },
  {
    department: 'แผนกบัญชีและการเงิน',
    defaultShiftId: 'SHIFT-ACC-01',
    shifts: [
      {
        id: 'SHIFT-ACC-01',
        name: 'กะออฟฟิศปกติ (Office Hours)',
        startTime: '08:30',
        endTime: '17:30',
        breakMinutes: 60,
        workDaysPerWeek: 5,
        description: 'จัดการบัญชี รายรับ-รายจ่าย ใบเสร็จ และเงินเดือน',
      },
    ],
  },
  {
    department: 'แผนกบริหารร้าน',
    defaultShiftId: 'SHIFT-MGT-01',
    shifts: [
      {
        id: 'SHIFT-MGT-01',
        name: 'กะผู้จัดการสาขา (Manager Shift)',
        startTime: '10:00',
        endTime: '19:00',
        breakMinutes: 60,
        workDaysPerWeek: 6,
        description: 'ควบคุมดูแลภาพรวมของร้าน คุณภาพ และประสานงานทีมงาน',
      },
    ],
  },
];

export const DEFAULT_CONTRACT_SETTINGS: ContractSettings = {
  companyName: 'บริษัทฯ นัว โฮม คูซีน จำกัด',
  companyTaxId: '0505569012848',
  companyAddress: '201/37 หมู่ที่ 2 ตำบลช้างเผือก อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 50300',
  employerSignerName: 'นายเหมวิช พลนาคู และ นางสาวภัสร์ฐิตา นวลตา',
  employerSignerTitle: 'กรรมการผู้มีอำนาจ',
  witness1Name: 'พยาน',
  witness2Name: '',
  probationDays: 90,
  noticePeriodDays: 30,
  weeklyHolidays: 'วันศุกร์ถึงวันพุธ ร้านหยุดทุกวันพฤหัสบดี ซึ่งเป็นวันหยุดประจำสัปดาห์',
  standardPaymentDay: 'ทุกวันที่ 5 ของเดือน สำหรับงวดวันที่ 1 ถึงสิ้นเดือนของเดือนก่อนหน้า',
  confidentialityClause: 'สูตรอาหารและวิธีปรุงที่นายจ้างรักษาเป็นความลับ ลูกจ้างต้องไม่เปิดเผยหรือนำไปใช้เพื่อประโยชน์ของตนเองหรือผู้อื่น ตลอดระยะเวลาการจ้างและหลังพ้นสภาพ',
  rulesAndRegulations: 'ลูกจ้างต้องปฏิบัติตามข้อบังคับเกี่ยวกับการทำงานของนายจ้าง คำสั่งโดยชอบด้วยกฎหมายของผู้บังคับบัญชา และระเบียบวินัยอย่างเคร่งครัด',
  departmentShifts: DEFAULT_DEPARTMENT_SHIFTS,
};


