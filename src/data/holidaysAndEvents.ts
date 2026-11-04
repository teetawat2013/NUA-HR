import { PublicHoliday, CompanyEvent } from '../types';

/**
 * ฐานข้อมูลวันหยุดนักขัตฤกษ์และวันหยุดราชการประจำปีของประเทศไทย
 * รองรับปี 2024 - 2027 และปีถัดไปสำหรับวันหยุดที่มีวันคงที่
 */
export const THAI_PUBLIC_HOLIDAYS: PublicHoliday[] = [
  // ปี 2024
  { id: 'TH-2024-01-01', date: '2024-01-01', nameThai: 'วันขึ้นปีใหม่', nameEnglish: "New Year's Day" },
  { id: 'TH-2024-02-26', date: '2024-02-26', nameThai: 'วันหยุดชดเชยวันมาฆบูชา', nameEnglish: 'Substitution for Makha Bucha Day', isTraditionalOrReligious: true },
  { id: 'TH-2024-04-08', date: '2024-04-08', nameThai: 'วันหยุดชดเชยวันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราชและวันที่ระลึกมหาจักรีบรมราชวงศ์', nameEnglish: 'Substitution for Chakri Memorial Day' },
  { id: 'TH-2024-04-13', date: '2024-04-13', nameThai: 'วันสงกรานต์', nameEnglish: 'Songkran Festival Day 1' },
  { id: 'TH-2024-04-14', date: '2024-04-14', nameThai: 'วันสงกรานต์', nameEnglish: 'Songkran Festival Day 2' },
  { id: 'TH-2024-04-15', date: '2024-04-15', nameThai: 'วันสงกรานต์', nameEnglish: 'Songkran Festival Day 3' },
  { id: 'TH-2024-04-16', date: '2024-04-16', nameThai: 'วันหยุดชดเชยวันสงกรานต์', nameEnglish: 'Substitution for Songkran Festival' },
  { id: 'TH-2024-05-01', date: '2024-05-01', nameThai: 'วันแรงงานแห่งชาติ', nameEnglish: 'National Labour Day' },
  { id: 'TH-2024-05-06', date: '2024-05-06', nameThai: 'วันหยุดชดเชยวันฉัตรมงคล', nameEnglish: 'Substitution for Coronation Day' },
  { id: 'TH-2024-05-22', date: '2024-05-22', nameThai: 'วันวิสาขบูชา', nameEnglish: 'Visakha Bucha Day', isTraditionalOrReligious: true },
  { id: 'TH-2024-06-03', date: '2024-06-03', nameThai: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี', nameEnglish: "Queen Suthida's Birthday" },
  { id: 'TH-2024-07-20', date: '2024-07-20', nameThai: 'วันอาสาฬหบูชา', nameEnglish: 'Asanha Bucha Day', isTraditionalOrReligious: true },
  { id: 'TH-2024-07-22', date: '2024-07-22', nameThai: 'วันหยุดชดเชยวันอาสาฬหบูชา/วันเข้าพรรษา', nameEnglish: 'Substitution for Asanha Bucha Day', isTraditionalOrReligious: true },
  { id: 'TH-2024-07-28', date: '2024-07-28', nameThai: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว', nameEnglish: "King Maha Vajiralongkorn's Birthday" },
  { id: 'TH-2024-07-29', date: '2024-07-29', nameThai: 'วันหยุดชดเชยวันเฉลิมพระชนมพรรษา ร.10', nameEnglish: "Substitution for King's Birthday" },
  { id: 'TH-2024-08-12', date: '2024-08-12', nameThai: 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง / วันแม่แห่งชาติ', nameEnglish: "The Queen Mother's Birthday / Mother's Day" },
  { id: 'TH-2024-10-14', date: '2024-10-14', nameThai: 'วันหยุดชดเชยวันนวมินทรมหาราช', nameEnglish: 'Substitution for Navamindra Maharaj Day' },
  { id: 'TH-2024-10-23', date: '2024-10-23', nameThai: 'วันปิยมหาราช', nameEnglish: 'Chulalongkorn Memorial Day' },
  { id: 'TH-2024-12-05', date: '2024-12-05', nameThai: 'วันคล้ายวันพระบรมราชสมภพ ร.9 / วันพ่อแห่งชาติ / วันชาติ', nameEnglish: "King Bhumibol's Birthday / Father's Day / National Day" },
  { id: 'TH-2024-12-10', date: '2024-12-10', nameThai: 'วันรัฐธรรมนูญ', nameEnglish: 'Constitution Day' },
  { id: 'TH-2024-12-31', date: '2024-12-31', nameThai: 'วันสิ้นปี', nameEnglish: "New Year's Eve" },

  // ปี 2025
  { id: 'TH-2025-01-01', date: '2025-01-01', nameThai: 'วันขึ้นปีใหม่', nameEnglish: "New Year's Day" },
  { id: 'TH-2025-02-12', date: '2025-02-12', nameThai: 'วันมาฆบูชา', nameEnglish: 'Makha Bucha Day', isTraditionalOrReligious: true },
  { id: 'TH-2025-04-07', date: '2025-04-07', nameThai: 'วันหยุดชดเชยวันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราชและวันที่ระลึกมหาจักรีบรมราชวงศ์', nameEnglish: 'Substitution for Chakri Day' },
  { id: 'TH-2025-04-13', date: '2025-04-13', nameThai: 'วันสงกรานต์', nameEnglish: 'Songkran Festival' },
  { id: 'TH-2025-04-14', date: '2025-04-14', nameThai: 'วันสงกรานต์', nameEnglish: 'Songkran Festival' },
  { id: 'TH-2025-04-15', date: '2025-04-15', nameThai: 'วันสงกรานต์', nameEnglish: 'Songkran Festival' },
  { id: 'TH-2025-04-16', date: '2025-04-16', nameThai: 'วันหยุดชดเชยวันสงกรานต์', nameEnglish: 'Substitution for Songkran' },
  { id: 'TH-2025-05-01', date: '2025-05-01', nameThai: 'วันแรงงานแห่งชาติ', nameEnglish: 'National Labour Day' },
  { id: 'TH-2025-05-05', date: '2025-05-05', nameThai: 'วันหยุดชดเชยวันฉัตรมงคล', nameEnglish: 'Substitution for Coronation Day' },
  { id: 'TH-2025-05-11', date: '2025-05-11', nameThai: 'วันวิสาขบูชา', nameEnglish: 'Visakha Bucha Day', isTraditionalOrReligious: true },
  { id: 'TH-2025-05-12', date: '2025-05-12', nameThai: 'วันหยุดชดเชยวันวิสาขบูชา', nameEnglish: 'Substitution for Visakha Bucha Day', isTraditionalOrReligious: true },
  { id: 'TH-2025-06-03', date: '2025-06-03', nameThai: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี', nameEnglish: "Queen Suthida's Birthday" },
  { id: 'TH-2025-07-10', date: '2025-07-10', nameThai: 'วันอาสาฬหบูชา', nameEnglish: 'Asanha Bucha Day', isTraditionalOrReligious: true },
  { id: 'TH-2025-07-11', date: '2025-07-11', nameThai: 'วันเข้าพรรษา', nameEnglish: 'Buddhist Lent Day', isTraditionalOrReligious: true },
  { id: 'TH-2025-07-28', date: '2025-07-28', nameThai: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว', nameEnglish: "King's Birthday" },
  { id: 'TH-2025-08-12', date: '2025-08-12', nameThai: 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง / วันแม่แห่งชาติ', nameEnglish: "The Queen Mother's Birthday / Mother's Day" },
  { id: 'TH-2025-10-13', date: '2025-10-13', nameThai: 'วันนวมินทรมหาราช', nameEnglish: 'Navamindra Maharaj Day' },
  { id: 'TH-2025-10-23', date: '2025-10-23', nameThai: 'วันปิยมหาราช', nameEnglish: 'Chulalongkorn Memorial Day' },
  { id: 'TH-2025-12-05', date: '2025-12-05', nameThai: 'วันคล้ายวันพระบรมราชสมภพ ร.9 / วันพ่อแห่งชาติ / วันชาติ', nameEnglish: "King Bhumibol's Birthday / Father's Day / National Day" },
  { id: 'TH-2025-12-10', date: '2025-12-10', nameThai: 'วันรัฐธรรมนูญ', nameEnglish: 'Constitution Day' },
  { id: 'TH-2025-12-31', date: '2025-12-31', nameThai: 'วันสิ้นปี', nameEnglish: "New Year's Eve" },

  // ปี 2026 (ปีปัจจุบันของระบบ)
  { id: 'TH-2026-01-01', date: '2026-01-01', nameThai: 'วันขึ้นปีใหม่', nameEnglish: "New Year's Day" },
  { id: 'TH-2026-01-02', date: '2026-01-02', nameThai: 'วันหยุดพิเศษเทศกาลปีใหม่', nameEnglish: 'New Year Special Holiday' },
  { id: 'TH-2026-03-03', date: '2026-03-03', nameThai: 'วันมาฆบูชา', nameEnglish: 'Makha Bucha Day', isTraditionalOrReligious: true },
  { id: 'TH-2026-04-06', date: '2026-04-06', nameThai: 'วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราชและวันที่ระลึกมหาจักรีบรมราชวงศ์', nameEnglish: 'Chakri Memorial Day' },
  { id: 'TH-2026-04-13', date: '2026-04-13', nameThai: 'วันสงกรานต์', nameEnglish: 'Songkran Festival Day 1' },
  { id: 'TH-2026-04-14', date: '2026-04-14', nameThai: 'วันสงกรานต์', nameEnglish: 'Songkran Festival Day 2' },
  { id: 'TH-2026-04-15', date: '2026-04-15', nameThai: 'วันสงกรานต์', nameEnglish: 'Songkran Festival Day 3' },
  { id: 'TH-2026-05-01', date: '2026-05-01', nameThai: 'วันแรงงานแห่งชาติ', nameEnglish: 'National Labour Day' },
  { id: 'TH-2026-05-04', date: '2026-05-04', nameThai: 'วันฉัตรมงคล', nameEnglish: 'Coronation Day' },
  { id: 'TH-2026-05-31', date: '2026-05-31', nameThai: 'วันวิสาขบูชา', nameEnglish: 'Visakha Bucha Day', isTraditionalOrReligious: true },
  { id: 'TH-2026-06-01', date: '2026-06-01', nameThai: 'วันหยุดชดเชยวันวิสาขบูชา', nameEnglish: 'Substitution for Visakha Bucha Day', isTraditionalOrReligious: true },
  { id: 'TH-2026-06-03', date: '2026-06-03', nameThai: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี', nameEnglish: "Queen Suthida's Birthday" },
  { id: 'TH-2026-07-28', date: '2026-07-28', nameThai: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว', nameEnglish: "King Maha Vajiralongkorn's Birthday" },
  { id: 'TH-2026-07-29', date: '2026-07-29', nameThai: 'วันอาสาฬหบูชา', nameEnglish: 'Asanha Bucha Day', isTraditionalOrReligious: true },
  { id: 'TH-2026-07-30', date: '2026-07-30', nameThai: 'วันเข้าพรรษา', nameEnglish: 'Buddhist Lent Day', isTraditionalOrReligious: true },
  { id: 'TH-2026-08-12', date: '2026-08-12', nameThai: 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง / วันแม่แห่งชาติ', nameEnglish: "The Queen Mother's Birthday / Mother's Day" },
  { id: 'TH-2026-10-13', date: '2026-10-13', nameThai: 'วันนวมินทรมหาราช', nameEnglish: 'Navamindra Maharaj Day' },
  { id: 'TH-2026-10-23', date: '2026-10-23', nameThai: 'วันปิยมหาราช', nameEnglish: 'Chulalongkorn Memorial Day' },
  { id: 'TH-2026-12-05', date: '2026-12-05', nameThai: 'วันคล้ายวันพระบรมราชสมภพ ร.9 / วันพ่อแห่งชาติ / วันชาติ', nameEnglish: "King Bhumibol's Birthday / Father's Day / National Day" },
  { id: 'TH-2026-12-07', date: '2026-12-07', nameThai: 'วันหยุดชดเชยวันคล้ายวันพระบรมราชสมภพ ร.9', nameEnglish: "Substitution for King's Birthday" },
  { id: 'TH-2026-12-10', date: '2026-12-10', nameThai: 'วันรัฐธรรมนูญ', nameEnglish: 'Constitution Day' },
  { id: 'TH-2026-12-31', date: '2026-12-31', nameThai: 'วันสิ้นปี', nameEnglish: "New Year's Eve" },

  // ปี 2027
  { id: 'TH-2027-01-01', date: '2027-01-01', nameThai: 'วันขึ้นปีใหม่', nameEnglish: "New Year's Day" },
  { id: 'TH-2027-02-21', date: '2027-02-21', nameThai: 'วันมาฆบูชา', nameEnglish: 'Makha Bucha Day', isTraditionalOrReligious: true },
  { id: 'TH-2027-02-22', date: '2027-02-22', nameThai: 'วันหยุดชดเชยวันมาฆบูชา', nameEnglish: 'Substitution for Makha Bucha Day', isTraditionalOrReligious: true },
  { id: 'TH-2027-04-06', date: '2027-04-06', nameThai: 'วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราชและวันที่ระลึกมหาจักรีบรมราชวงศ์', nameEnglish: 'Chakri Memorial Day' },
  { id: 'TH-2027-04-13', date: '2027-04-13', nameThai: 'วันสงกรานต์', nameEnglish: 'Songkran Festival Day 1' },
  { id: 'TH-2027-04-14', date: '2027-04-14', nameThai: 'วันสงกรานต์', nameEnglish: 'Songkran Festival Day 2' },
  { id: 'TH-2027-04-15', date: '2027-04-15', nameThai: 'วันสงกรานต์', nameEnglish: 'Songkran Festival Day 3' },
  { id: 'TH-2027-05-01', date: '2027-05-01', nameThai: 'วันแรงงานแห่งชาติ', nameEnglish: 'National Labour Day' },
  { id: 'TH-2027-05-03', date: '2027-05-03', nameThai: 'วันหยุดชดเชยวันแรงงานแห่งชาติ', nameEnglish: 'Substitution for National Labour Day' },
  { id: 'TH-2027-05-04', date: '2027-05-04', nameThai: 'วันฉัตรมงคล', nameEnglish: 'Coronation Day' },
  { id: 'TH-2027-05-20', date: '2027-05-20', nameThai: 'วันวิสาขบูชา', nameEnglish: 'Visakha Bucha Day', isTraditionalOrReligious: true },
  { id: 'TH-2027-06-03', date: '2027-06-03', nameThai: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี', nameEnglish: "Queen Suthida's Birthday" },
  { id: 'TH-2027-07-18', date: '2027-07-18', nameThai: 'วันอาสาฬหบูชา', nameEnglish: 'Asanha Bucha Day', isTraditionalOrReligious: true },
  { id: 'TH-2027-07-19', date: '2027-07-19', nameThai: 'วันเข้าพรรษา', nameEnglish: 'Buddhist Lent Day', isTraditionalOrReligious: true },
  { id: 'TH-2027-07-28', date: '2027-07-28', nameThai: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว', nameEnglish: "King's Birthday" },
  { id: 'TH-2027-08-12', date: '2027-08-12', nameThai: 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง / วันแม่แห่งชาติ', nameEnglish: "The Queen Mother's Birthday / Mother's Day" },
  { id: 'TH-2027-10-13', date: '2027-10-13', nameThai: 'วันนวมินทรมหาราช', nameEnglish: 'Navamindra Maharaj Day' },
  { id: 'TH-2027-10-23', date: '2027-10-23', nameThai: 'วันปิยมหาราช', nameEnglish: 'Chulalongkorn Memorial Day' },
  { id: 'TH-2027-12-05', date: '2027-12-05', nameThai: 'วันคล้ายวันพระบรมราชสมภพ ร.9 / วันพ่อแห่งชาติ / วันชาติ', nameEnglish: "King Bhumibol's Birthday / Father's Day / National Day" },
  { id: 'TH-2027-12-06', date: '2027-12-06', nameThai: 'วันหยุดชดเชยวันคล้ายวันพระบรมราชสมภพ ร.9', nameEnglish: "Substitution for King's Birthday" },
  { id: 'TH-2027-12-10', date: '2027-12-10', nameThai: 'วันรัฐธรรมนูญ', nameEnglish: 'Constitution Day' },
  { id: 'TH-2027-12-31', date: '2027-12-31', nameThai: 'วันสิ้นปี', nameEnglish: "New Year's Eve" },
];

/**
 * รายการกิจกรรมและวันสำคัญเริ่มต้นขององค์กร (เริ่มต้นเป็นค่าว่าง พร้อมใช้งานจริง)
 */
export const DEFAULT_COMPANY_EVENTS: CompanyEvent[] = [];

/**
 * ดึงวันหยุดนักขัตฤกษ์สำหรับปีที่ระบุ
 */
export function getPublicHolidaysForYear(year: number): PublicHoliday[] {
  const matches = THAI_PUBLIC_HOLIDAYS.filter(h => h.date.startsWith(`${year}-`));
  if (matches.length > 0) return matches;

  // สำหรับปีที่ไม่มีข้อมูลโดยละเอียด ให้ดึงวันหยุดคงที่ของปี 2026 มาปรับปี
  return THAI_PUBLIC_HOLIDAYS.filter(h => h.date.startsWith('2026-')).map(h => ({
    ...h,
    id: `TH-${year}-${h.date.slice(5)}`,
    date: `${year}-${h.date.slice(5)}`,
  }));
}

/**
 * ดึงวันหยุดนักขัตฤกษ์สำหรับเดือนและปีที่ระบุ (เดือน 1-12)
 */
export function getPublicHolidaysForMonth(year: number, month: number): PublicHoliday[] {
  const monthStr = month.toString().padStart(2, '0');
  const prefix = `${year}-${monthStr}`;
  
  const inYear = getPublicHolidaysForYear(year);
  return inYear.filter(h => h.date.startsWith(prefix));
}
