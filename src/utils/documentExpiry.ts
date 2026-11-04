import { Employee } from '../types';

export interface UrgentDocumentItem {
  docType: string;
  docNameTh: string;
  docNumber?: string;
  expiryDate: string;
  daysLeft: number;
  isExpired: boolean;
  statusText: string;
  badgeClass: string;
}

export interface UrgentEmployeeAlert {
  employee: Employee;
  documents: UrgentDocumentItem[];
  minDaysLeft: number;
  hasExpired: boolean;
  hasCriticalIn7Days: boolean;
}

/**
 * Calculates documents expiring within `thresholdDays` (default 7 days) or already expired
 * for active (non-resigned) employees.
 */
export function getUrgentExpiryAlerts(
  employees: Employee[],
  thresholdDays: number = 7,
  referenceDate?: Date
): UrgentEmployeeAlert[] {
  const alerts: UrgentEmployeeAlert[] = [];
  const now = referenceDate || new Date();
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Filter only active employees (not resigned)
  const activeEmployees = employees.filter(e => !e.resignation.isResigned);

  activeEmployees.forEach(emp => {
    const docs: UrgentDocumentItem[] = [];
    const addedKeys = new Set<string>();

    const checkAndAddDoc = (
      type: string,
      nameTh: string,
      dateStr?: string,
      docNumber?: string
    ) => {
      if (!dateStr) return;

      const targetDate = new Date(dateStr);
      if (isNaN(targetDate.getTime())) return;

      const targetMidnight = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate()
      );
      const diffTime = targetMidnight.getTime() - nowMidnight.getTime();
      const days = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // Check if document is already expired (days < 0) or expiring within thresholdDays (e.g. <= 7 days)
      if (days <= thresholdDays) {
        const key = `${type}-${dateStr}`;
        if (addedKeys.has(key)) return;
        addedKeys.add(key);

        const isExpired = days < 0;
        let statusText = '';
        let badgeClass = '';

        if (isExpired) {
          const overdue = Math.abs(days);
          statusText = overdue === 0 ? 'หมดอายุวันนี้!' : `หมดอายุแล้ว (เกิน ${overdue} วัน)`;
          badgeClass = 'bg-rose-600 text-white font-bold shadow-2xs';
        } else if (days === 0) {
          statusText = 'ครบกำหนดหมดอายุวันนี้!';
          badgeClass = 'bg-rose-600 text-white font-black animate-pulse shadow-xs';
        } else if (days === 1) {
          statusText = 'วิกฤต: เหลืออีก 1 วัน (พรุ่งนี้)';
          badgeClass = 'bg-red-500 text-white font-bold shadow-2xs';
        } else if (days <= 3) {
          statusText = `ด่วนมาก: เหลืออีก ${days} วัน`;
          badgeClass = 'bg-red-100 text-red-700 border border-red-300 font-bold';
        } else {
          statusText = `เตือนด่วน: เหลืออีก ${days} วัน`;
          badgeClass = 'bg-amber-100 text-amber-800 border border-amber-300 font-bold';
        }

        docs.push({
          docType: type,
          docNameTh: nameTh,
          docNumber,
          expiryDate: dateStr,
          daysLeft: days,
          isExpired,
          statusText,
          badgeClass,
        });
      }
    };

    // 1. Foreign worker documents (if foreign worker)
    const fd = emp.foreignDetails;
    if (fd) {
      checkAndAddDoc('Passport', 'หนังสือเดินทาง (Passport)', fd.passportExpiryDate, fd.passportNumber);
      checkAndAddDoc('PinkCard', 'บัตรสีชมพู / บัตรไม่มีสัญชาติ', fd.pinkCardDetails?.expiryDate, fd.pinkCardDetails?.idNumber13);
      checkAndAddDoc('Visa', 'วีซ่า / การตรวจลงตรา (Visa)', fd.visaExpiryDate, fd.visaNumber);
      checkAndAddDoc('WorkPermit', 'ใบอนุญาตทำงาน (Work Permit)', fd.workPermitExpiryDate, fd.workPermitNumber);
      checkAndAddDoc('Report90', 'กำหนดรายงานตัว 90 วัน ตม.', fd.report90DaysDate);
      checkAndAddDoc('Medical', 'ใบรับรองแพทย์ตรวจสุขภาพ', fd.medicalCheckupExpiryDate);
      if (fd.otherDocDetails?.expiryDate) {
        checkAndAddDoc(
          'OtherForeignDoc',
          fd.otherDocDetails.documentName || 'เอกสารประจำตัว (Border Pass / อื่นๆ)',
          fd.otherDocDetails.expiryDate,
          fd.otherDocDetails.documentNumber
        );
      }

      // Any attached foreign worker documents
      if (fd.documents && fd.documents.length > 0) {
        fd.documents.forEach(d => {
          if (d.expiryDate) {
            checkAndAddDoc(d.type, d.title || 'เอกสารประกอบแรงงานต่างด้าว', d.expiryDate);
          }
        });
      }
    }

    // 2. Identification document
    checkAndAddDoc(
      emp.identificationType === 'PASSPORT' ? 'Passport' : 'IDCard',
      emp.identificationType === 'PASSPORT' ? 'หนังสือเดินทาง (Passport)' : 'บัตรประจำตัวประชาชน',
      emp.identificationExpiryDate,
      emp.identificationNumber
    );

    // 3. Direct work permit expiry field
    if (emp.workPermitExpiryDate) {
      checkAndAddDoc('WorkPermit', 'ใบอนุญาตทำงาน (Work Permit)', emp.workPermitExpiryDate, emp.workPermitNumber);
    }

    // 4. Attached general documents in emp.documents
    if (emp.documents && emp.documents.length > 0) {
      emp.documents.forEach(doc => {
        if (doc.expiryDate) {
          checkAndAddDoc(doc.type, doc.title || 'เอกสารแนบ', doc.expiryDate);
        }
      });
    }

    // If this employee has any qualifying urgent documents
    if (docs.length > 0) {
      // Sort docs: most overdue/smallest daysLeft first
      docs.sort((a, b) => a.daysLeft - b.daysLeft);
      const minDays = Math.min(...docs.map(d => d.daysLeft));
      const hasExpired = docs.some(d => d.isExpired);
      const hasCriticalIn7Days = docs.some(d => d.daysLeft >= 0 && d.daysLeft <= thresholdDays);

      alerts.push({
        employee: emp,
        documents: docs,
        minDaysLeft: minDays,
        hasExpired,
        hasCriticalIn7Days,
      });
    }
  });

  // Sort employees: most urgent (lowest minDaysLeft) first
  alerts.sort((a, b) => a.minDaysLeft - b.minDaysLeft);

  return alerts;
}
