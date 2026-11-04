import { 
  Employee, 
  LeaveRequest, 
  AttendanceRecord, 
  ReportHistoryItem, 
  CompanyEvent, 
  LatePermissionRequest,
  JobApplication,
  JobApplicationSettings,
  DEFAULT_JOB_SETTINGS,
  EmploymentContract,
  ContractSettings,
  DEFAULT_CONTRACT_SETTINGS,
  CompensatoryHolidayRecord,
  PartTimeDayLog,
  PartTimeWeeklyOffConfig
} from '../types';
import { INITIAL_EMPLOYEES, INITIAL_LEAVE_REQUESTS } from '../data/initialData';
import { DEFAULT_COMPANY_EVENTS } from '../data/holidaysAndEvents';

const EMPLOYEES_STORAGE_KEY = 'hrm_pro_employees_v1';
const LEAVE_REQUESTS_STORAGE_KEY = 'hrm_pro_leaves_v1';
const ATTENDANCE_RECORDS_STORAGE_KEY = 'hrm_pro_attendance_records_v1';
const REPORT_HISTORY_STORAGE_KEY = 'hrm_pro_report_history_v1';
const COMPANY_EVENTS_STORAGE_KEY = 'hrm_pro_company_events_v1';
const LATE_REQUESTS_STORAGE_KEY = 'hrm_pro_late_requests_v1';
const JOB_APPLICATIONS_STORAGE_KEY = 'hrm_pro_job_applications_v1';
const JOB_SETTINGS_STORAGE_KEY = 'hrm_pro_job_settings_v1';
const CONTRACTS_STORAGE_KEY = 'hrm_pro_contracts_v1';
const CONTRACT_SETTINGS_STORAGE_KEY = 'hrm_pro_contract_settings_v1';
const COMPENSATORY_RECORDS_STORAGE_KEY = 'hrm_pro_compensatory_records_v1';

export const DEMO_EMPLOYEE_IDS = ['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005', 'EMP-006'];
export const DEMO_ATTENDANCE_IDS = ['ATT-001', 'ATT-002', 'ATT-003', 'ATT-004', 'ATT-005', 'ATT-006', 'ATT-007', 'ATT-008'];
export const DEMO_REPORT_IDS = ['RPT-2026-08'];
export const DEMO_COMPANY_EVENT_IDS = ['EVT-001', 'EVT-002', 'EVT-003', 'EVT-004', 'EVT-005', 'EVT-006', 'EVT-007'];

export const INITIAL_REPORT_HISTORY: ReportHistoryItem[] = [];
export const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [];

export function loadEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Purge any old demo employees from local storage
      const cleaned = parsed.filter((e: Employee) => !DEMO_EMPLOYEE_IDS.includes(e.id));
      if (cleaned.length !== parsed.length) {
        saveEmployees(cleaned);
      }
      return cleaned;
    }
    return [];
  } catch (e) {
    console.error('Failed to load employees from localStorage', e);
    return [];
  }
}

export function saveEmployees(employees: Employee[]): void {
  try {
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
  } catch (e) {
    console.error('Failed to save employees to localStorage', e);
  }
}

export function loadAttendanceRecords(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(ATTENDANCE_RECORDS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Purge any old demo attendance records from local storage
      const cleaned = parsed.filter((a: AttendanceRecord) => !DEMO_ATTENDANCE_IDS.includes(a.id));
      if (cleaned.length !== parsed.length) {
        saveAttendanceRecords(cleaned);
      }
      return cleaned;
    }
    return [];
  } catch (e) {
    console.error('Failed to load attendance records', e);
    return [];
  }
}

export function saveAttendanceRecords(records: AttendanceRecord[]): void {
  try {
    localStorage.setItem(ATTENDANCE_RECORDS_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save attendance records', e);
  }
}

export function loadLeaveRequests(): LeaveRequest[] {
  try {
    const raw = localStorage.getItem(LEAVE_REQUESTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (e) {
    console.error('Failed to load leave requests', e);
    return [];
  }
}

export function saveLeaveRequests(leaves: LeaveRequest[]): void {
  try {
    localStorage.setItem(LEAVE_REQUESTS_STORAGE_KEY, JSON.stringify(leaves));
  } catch (e) {
    console.error('Failed to save leave requests', e);
  }
}

export function loadReportHistory(): ReportHistoryItem[] {
  try {
    const raw = localStorage.getItem(REPORT_HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Purge any old demo report history from local storage
      const cleaned = parsed.filter((r: ReportHistoryItem) => !DEMO_REPORT_IDS.includes(r.id));
      if (cleaned.length !== parsed.length) {
        saveReportHistory(cleaned);
      }
      return cleaned;
    }
    return [];
  } catch (e) {
    console.error('Failed to load report history', e);
    return [];
  }
}

export function saveReportHistory(history: ReportHistoryItem[]): void {
  try {
    localStorage.setItem(REPORT_HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save report history', e);
  }
}

export function clearAllData(): { 
  employees: Employee[]; 
  leaves: LeaveRequest[]; 
  attendanceRecords: AttendanceRecord[];
  reportHistory: ReportHistoryItem[];
  lateRequests: LatePermissionRequest[];
} {
  saveEmployees([]);
  saveLeaveRequests([]);
  saveAttendanceRecords([]);
  saveReportHistory([]);
  saveLateRequests([]);
  return { 
    employees: [], 
    leaves: [], 
    attendanceRecords: [],
    reportHistory: [],
    lateRequests: []
  };
}

// Backward compatibility alias
export const resetToDemoData = clearAllData;

export function loadCompanyEvents(): CompanyEvent[] {
  try {
    const raw = localStorage.getItem(COMPANY_EVENTS_STORAGE_KEY);
    if (!raw) {
      saveCompanyEvents([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Purge any old demo company events
      const cleaned = parsed.filter((evt: CompanyEvent) => !DEMO_COMPANY_EVENT_IDS.includes(evt.id));
      if (cleaned.length !== parsed.length) {
        saveCompanyEvents(cleaned);
      }
      return cleaned;
    }
    return [];
  } catch (e) {
    console.error('Failed to load company events', e);
    return [];
  }
}

export function saveCompanyEvents(events: CompanyEvent[]): void {
  try {
    localStorage.setItem(COMPANY_EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.error('Failed to save company events', e);
  }
}

export function loadLateRequests(): LatePermissionRequest[] {
  try {
    const raw = localStorage.getItem(LATE_REQUESTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (e) {
    console.error('Failed to load late requests from localStorage', e);
    return [];
  }
}

export function saveLateRequests(requests: LatePermissionRequest[]): void {
  try {
    localStorage.setItem(LATE_REQUESTS_STORAGE_KEY, JSON.stringify(requests));
  } catch (e) {
    console.error('Failed to save late requests to localStorage', e);
  }
}

// ==========================================
// Job Applications & Settings Storage
// ==========================================

export function loadJobApplications(): JobApplication[] {
  try {
    const raw = localStorage.getItem(JOB_APPLICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load job applications from localStorage', e);
    return [];
  }
}

export function saveJobApplications(apps: JobApplication[]): void {
  try {
    localStorage.setItem(JOB_APPLICATIONS_STORAGE_KEY, JSON.stringify(apps));
  } catch (e) {
    console.error('Failed to save job applications to localStorage', e);
  }
}

export function addJobApplication(app: JobApplication): void {
  const current = loadJobApplications();
  const updated = [app, ...current.filter(a => a.id !== app.id)];
  saveJobApplications(updated);
}

export function loadJobSettings(): JobApplicationSettings {
  try {
    const raw = localStorage.getItem(JOB_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_JOB_SETTINGS;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? { ...DEFAULT_JOB_SETTINGS, ...parsed } : DEFAULT_JOB_SETTINGS;
  } catch (e) {
    console.error('Failed to load job settings from localStorage', e);
    return DEFAULT_JOB_SETTINGS;
  }
}

export function saveJobSettings(settings: JobApplicationSettings): void {
  try {
    localStorage.setItem(JOB_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save job settings to localStorage', e);
  }
}

export function loadEmploymentContracts(): EmploymentContract[] {
  try {
    const raw = localStorage.getItem(CONTRACTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load contracts from localStorage', e);
    return [];
  }
}

export function saveEmploymentContracts(contracts: EmploymentContract[]): void {
  try {
    localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(contracts));
  } catch (e) {
    console.error('Failed to save contracts to localStorage', e);
  }
}

export function loadContractSettings(): ContractSettings {
  try {
    const raw = localStorage.getItem(CONTRACT_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_CONTRACT_SETTINGS;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? { ...DEFAULT_CONTRACT_SETTINGS, ...parsed } : DEFAULT_CONTRACT_SETTINGS;
  } catch (e) {
    console.error('Failed to load contract settings from localStorage', e);
    return DEFAULT_CONTRACT_SETTINGS;
  }
}

export function saveContractSettings(settings: ContractSettings): void {
  try {
    localStorage.setItem(CONTRACT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save contract settings to localStorage', e);
  }
}

export function loadCompensatoryRecords(): CompensatoryHolidayRecord[] {
  try {
    const raw = localStorage.getItem(COMPENSATORY_RECORDS_STORAGE_KEY);
    if (!raw) {
      // Default demo compensatory record for immediate visual verification
      return [
        {
          id: 'CMP-2569-001',
          employeeId: 'EMP-001',
          employeeName: 'สมชาย มีสุข',
          department: 'ฝ่ายครัวและจัดเตรียม',
          workedDate: '2026-01-01',
          holidayName: 'วันขึ้นปีใหม่',
          earnedDays: 1,
          compensateDate: '2026-01-16',
          status: 'COMPENSATED',
          recordedAt: '2026-01-02T09:00:00Z',
          approvedBy: 'ผู้จัดการทั่วไป',
          notes: 'มาปฏิบัติงานควบคุมการผลิตช่วงเทศกาลปีใหม่ ได้รับสิทธิ์หยุดชดเชยเรียบร้อย'
        },
        {
          id: 'CMP-2569-002',
          employeeId: 'EMP-002',
          employeeName: 'วิภาดา รัตนกุล',
          department: 'ฝ่ายบริการและหน้าร้าน',
          workedDate: '2026-04-13',
          holidayName: 'วันสงกรานต์',
          earnedDays: 1,
          status: 'PENDING_USE',
          recordedAt: '2026-04-14T08:30:00Z',
          approvedBy: 'ผู้จัดการสาขา',
          notes: 'ปฏิบัติงานรอบเวรสลับช่วงวันสงกรานต์ รอใช้วันหยุดชดเชยภายใน 60 วัน'
        }
      ];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load compensatory records from localStorage', e);
    return [];
  }
}

export function saveCompensatoryRecords(records: CompensatoryHolidayRecord[]): void {
  try {
    localStorage.setItem(COMPENSATORY_RECORDS_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save compensatory records to localStorage', e);
  }
}

// Aliases
export const getStoredEmployees = loadEmployees;
export const saveStoredEmployees = saveEmployees;
export const getStoredAttendanceRecords = loadAttendanceRecords;
export const saveStoredAttendanceRecords = saveAttendanceRecords;
export const getStoredLeaveRequests = loadLeaveRequests;
export const saveStoredLeaveRequests = saveLeaveRequests;
export const getStoredReportHistory = loadReportHistory;
export const saveStoredReportHistory = saveReportHistory;
export const getStoredCompanyEvents = loadCompanyEvents;
export const saveStoredCompanyEvents = saveCompanyEvents;
export const getStoredLateRequests = loadLateRequests;
export const saveStoredLateRequests = saveLateRequests;
export const getStoredJobApplications = loadJobApplications;
export const saveStoredJobApplications = saveJobApplications;
export const getStoredJobSettings = loadJobSettings;
export const saveStoredJobSettings = saveJobSettings;
export const getStoredContracts = loadEmploymentContracts;
export const saveStoredContracts = saveEmploymentContracts;
export const getStoredContractSettings = loadContractSettings;
export const saveStoredContractSettings = saveContractSettings;
export const getStoredCompensatoryRecords = loadCompensatoryRecords;
export const saveStoredCompensatoryRecords = saveCompensatoryRecords;

const PART_TIME_LOGS_STORAGE_KEY = 'hrm_pro_part_time_logs_v1';
const PART_TIME_CONFIGS_STORAGE_KEY = 'hrm_pro_part_time_configs_v1';

export function loadPartTimeLogs(): PartTimeDayLog[] {
  try {
    const raw = localStorage.getItem(PART_TIME_LOGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load part-time logs from localStorage', e);
    return [];
  }
}

export function savePartTimeLogs(logs: PartTimeDayLog[]): void {
  try {
    localStorage.setItem(PART_TIME_LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save part-time logs to localStorage', e);
  }
}

export function loadPartTimeConfigs(): Record<string, PartTimeWeeklyOffConfig> {
  try {
    const raw = localStorage.getItem(PART_TIME_CONFIGS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (e) {
    console.error('Failed to load part-time configs from localStorage', e);
    return {};
  }
}

export function savePartTimeConfigs(configs: Record<string, PartTimeWeeklyOffConfig>): void {
  try {
    localStorage.setItem(PART_TIME_CONFIGS_STORAGE_KEY, JSON.stringify(configs));
  } catch (e) {
    console.error('Failed to save part-time configs to localStorage', e);
  }
}

export const getStoredPartTimeLogs = loadPartTimeLogs;
export const saveStoredPartTimeLogs = savePartTimeLogs;
export const getStoredPartTimeConfigs = loadPartTimeConfigs;
export const saveStoredPartTimeConfigs = savePartTimeConfigs;



