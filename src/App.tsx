import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  auth, 
  signInWithGoogle, 
  logoutUser, 
  subscribeEmployees, 
  subscribeAttendanceRecords, 
  subscribeReportHistory,
  subscribeDocTemplates,
  saveDocTemplateToFirestore,
  deleteDocTemplateFromFirestore,
  subscribeGeneratedDocs,
  saveGeneratedDocToFirestore,
  saveEmployeeToFirestore, 
  saveAttendanceRecordToFirestore, 
  saveReportHistoryToFirestore,
  deleteReportHistoryFromFirestore,
  purgeAllDemoDataFromFirestore,
  clearAllUserDataFromFirestore,
  submitJobApplicationToFirestore,
  subscribeJobApplications,
  updateJobApplicationInFirestore,
  deleteJobApplicationFromFirestore,
  saveJobSettingsToFirestore,
  subscribeJobSettings
} from './firebase';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { DashboardView } from './components/DashboardView';
import { EmployeeListView } from './components/EmployeeListView';
import { ForeignWorkerManagerView } from './components/ForeignWorkerManagerView';
import { AttendanceLeaveView } from './components/AttendanceLeaveView';
import { PayrollView } from './components/PayrollView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { ResignedDatabaseView } from './components/ResignedDatabaseView';
import { EmployeeModal } from './components/EmployeeModal';
import { EmployeeDetailModal } from './components/EmployeeDetailModal';
import { UrgentExpiryModal } from './components/UrgentExpiryModal';
import { RecruitmentView } from './components/RecruitmentView';
import { PublicJobApplicationView } from './components/PublicJobApplicationView';
import { EmploymentContractsView } from './components/EmploymentContractsView';
import { DocumentLibraryView } from './components/DocumentLibraryView';
import { 
  Employee, 
  AttendanceRecord, 
  MonthlyAttendance, 
  ReportHistoryItem, 
  BirthdayEventNote,
  JobApplication,
  JobApplicationSettings,
  JobApplicationStatus,
  DEFAULT_JOB_SETTINGS,
  EmploymentContract,
  ContractSettings,
  DEFAULT_CONTRACT_SETTINGS,
  DocTemplate,
  GeneratedDocumentRecord
} from './types';
import { 
  getStoredEmployees, 
  saveStoredEmployees, 
  getStoredAttendanceRecords, 
  saveStoredAttendanceRecords, 
  getStoredReportHistory,
  saveStoredReportHistory,
  getStoredJobApplications,
  saveStoredJobApplications,
  getStoredJobSettings,
  saveStoredJobSettings,
  loadEmploymentContracts,
  saveEmploymentContracts,
  loadContractSettings,
  saveContractSettings,
  loadDocTemplates,
  saveDocTemplates,
  loadGeneratedDocs,
  saveGeneratedDocs,
  clearAllData,
  DEMO_EMPLOYEE_IDS,
  DEMO_ATTENDANCE_IDS,
  DEMO_REPORT_IDS
} from './utils/storage';
import { getExpiryStatus } from './utils/payrollCalculator';
import { getUrgentExpiryAlerts } from './utils/documentExpiry';
import { showSuccessAlert, showErrorAlert, showConfirmDialog } from './utils/swal';
import { Cloud, LogIn, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Firebase Auth & Cloud Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAuthBanner, setShowAuthBanner] = useState(true);

  // Domain Data State with LocalStorage fallback (filtered without demo data)
  const [employees, setEmployees] = useState<Employee[]>(() => {
    return getStoredEmployees().filter(e => !DEMO_EMPLOYEE_IDS.includes(e.id));
  });
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    return getStoredAttendanceRecords().filter(r => !DEMO_ATTENDANCE_IDS.includes(r.id));
  });
  const [reportHistory, setReportHistory] = useState<ReportHistoryItem[]>(() => {
    return getStoredReportHistory().filter(h => !DEMO_REPORT_IDS.includes(h.id));
  });

  const [docTemplates, setDocTemplates] = useState<DocTemplate[]>(() => loadDocTemplates());
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocumentRecord[]>(() => loadGeneratedDocs());
  const [docPreselect, setDocPreselect] = useState<{ templateId: string; employeeId: string } | null>(null);

  // Public Apply Portal Mode State (checked from URL param ?page=apply, ?apply=true, #apply, or /apply)
  const [isPublicApplyMode, setIsPublicApplyMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return (
      params.get('page') === 'apply' || 
      params.get('apply') === 'true' || 
      window.location.pathname === '/apply' ||
      window.location.hash === '#apply' ||
      window.location.hash.startsWith('#apply?')
    );
  });

  // Listen to browser navigation changes (Back/Forward, URL hash change)
  useEffect(() => {
    const handleUrlChange = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const isApply = 
        params.get('page') === 'apply' || 
        params.get('apply') === 'true' || 
        window.location.pathname === '/apply' ||
        window.location.hash === '#apply' ||
        window.location.hash.startsWith('#apply?');
      setIsPublicApplyMode(isApply);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Recruitment Applications & Settings State with LocalStorage fallback
  const [jobApplications, setJobApplications] = useState<JobApplication[]>(() => {
    return getStoredJobApplications();
  });
  const [jobSettings, setJobSettings] = useState<JobApplicationSettings>(() => {
    return getStoredJobSettings();
  });

  // Employment Contracts State with LocalStorage fallback & default samples
  const [employmentContracts, setEmploymentContracts] = useState<EmploymentContract[]>(() => {
    const stored = loadEmploymentContracts();
    if (stored && stored.length > 0) return stored;
    const initialSamples: EmploymentContract[] = [
      {
        id: 'CTR-SAMPLE-001',
        contractNumber: 'CTR-2569/001',
        createdAt: new Date().toISOString(),
        contractDate: new Date().toISOString().split('T')[0],
        employeeName: 'นายสมศักดิ์ รุ่งเรืองพัฒนา',
        nationalityCategory: 'THAI',
        idCardNumber: '1-5099-00234-88-1',
        address: '154 หมู่ 2 ตำบลสุเทพ อำเภอเมือง จังหวัดเชียงใหม่ 50200',
        phone: '089-123-4567',
        position: 'พนักงานบริการหน้าร้านอาวุโส',
        department: 'แผนกบริการหน้าร้าน',
        branch: 'บริษัทฯ นัว โฮม คูซีน จำกัด',
        contractType: 'PROBATION',
        startDate: new Date().toISOString().split('T')[0],
        probationDays: 90,
        salary: 16500,
        salaryType: 'MONTHLY',
        paymentMethod: 'BANK_TRANSFER',
        bankName: 'ธนาคารกสิกรไทย',
        bankAccountNumber: '045-2-33451-9',
        paymentDay: 'ทุกวันที่ 5 ของเดือน สำหรับงวดวันที่ 1 ถึงสิ้นเดือนของเดือนก่อนหน้า',
        shiftId: 'SHIFT-SRV-01',
        shiftName: 'กะเช้า 1: เวลา 07.00 น. ถึง 16.00 น. (พัก 1 ชั่วโมง)',
        startTime: '07:00',
        endTime: '16:00',
        breakMinutes: 60,
        workDaysPerWeek: 6,
        weeklyHoliday: 'วันศุกร์ถึงวันพุธ ร้านหยุดทุกวันพฤหัสบดี ซึ่งเป็นวันหยุดประจำสัปดาห์',
        employerSignerName: 'นายเหมวิช พลนาคู และ นางสาวภัสร์ฐิตา นวลตา',
        employerSignerTitle: 'กรรมการผู้มีอำนาจ',
        witness1Name: 'นางสาวพิมพา ใจดี',
        witness2Name: 'นายธนาชัย สุขเกษม',
        specialTerms: 'ได้รับเบี้ยขยันเดือนละ 1,000 บาท เมื่อไม่ขาด ไม่ลา ไม่มาสายในรอบเดือน',
        status: 'ACTIVE',
      },
      {
        id: 'CTR-SAMPLE-002',
        contractNumber: 'CTR-2569/002',
        createdAt: new Date().toISOString(),
        contractDate: new Date().toISOString().split('T')[0],
        employeeName: 'นางสาวกานดา สุวรรณเมธี',
        nationalityCategory: 'THAI',
        idCardNumber: '3-5001-00891-22-4',
        address: '88/1 ถนนห้วยแก้ว ตำบลช้างเผือก อำเภอเมือง จังหวัดเชียงใหม่ 50300',
        phone: '081-987-6543',
        position: 'เชฟประจำห้องครัว (Kitchen Chef)',
        department: 'แผนกครัว',
        branch: 'บริษัทฯ นัว โฮม คูซีน จำกัด',
        contractType: 'PERMANENT',
        startDate: '2026-01-01',
        probationDays: 90,
        salary: 22000,
        salaryType: 'MONTHLY',
        paymentMethod: 'BANK_TRANSFER',
        bankName: 'ธนาคารไทยพาณิชย์',
        bankAccountNumber: '501-4-88910-2',
        paymentDay: 'ทุกวันที่ 5 ของเดือน สำหรับงวดวันที่ 1 ถึงสิ้นเดือนของเดือนก่อนหน้า',
        shiftId: 'SHIFT-KTN-01',
        shiftName: 'กะเช้า 2: เวลา 08.00 น. ถึง 17.00 น. (พัก 1 ชั่วโมง)',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 60,
        workDaysPerWeek: 6,
        weeklyHoliday: 'วันศุกร์ถึงวันพุธ ร้านหยุดทุกวันพฤหัสบดี ซึ่งเป็นวันหยุดประจำสัปดาห์',
        employerSignerName: 'นายเหมวิช พลนาคู และ นางสาวภัสร์ฐิตา นวลตา',
        employerSignerTitle: 'กรรมการผู้มีอำนาจ',
        witness1Name: 'นางสาวพิมพา ใจดี',
        witness2Name: 'นายธนาชัย สุขเกษม',
        specialTerms: 'ได้รับสวัสดิการอาหารฟรีวันละ 1 มื้อ และเครื่องแบบพนักงาน 2 ชุดต่อปี',
        status: 'ACTIVE',
      }
    ];
    saveEmploymentContracts(initialSamples);
    return initialSamples;
  });

  const [contractSettings, setContractSettings] = useState<ContractSettings>(() => {
    return loadContractSettings();
  });

  // Modals State
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailEmployee, setSelectedDetailEmployee] = useState<Employee | null>(null);

  // Urgent 7-Day Document Expiry Alert Modal State
  const [isUrgentAlertModalOpen, setIsUrgentAlertModalOpen] = useState(false);
  const [hasCheckedLoginAlert, setHasCheckedLoginAlert] = useState(false);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);

      if (user) {
        setIsSyncing(true);
        try {
          // Clean up any previously seeded demo documents from user's Firestore collections
          await purgeAllDemoDataFromFirestore(user.uid);
        } catch (err) {
          console.error('Error purging demo data from Firestore:', err);
        } finally {
          setIsSyncing(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to real-time Firestore updates when logged in
  useEffect(() => {
    if (!currentUser) return;

    setIsSyncing(true);
    const unsubEmp = subscribeEmployees(
      currentUser.uid,
      (cloudEmployees: Employee[]) => {
        // Strip out any remaining demo records
        const cleaned = (cloudEmployees || []).filter(e => !DEMO_EMPLOYEE_IDS.includes(e.id));
        setEmployees(cleaned);
        saveStoredEmployees(cleaned);
        setIsSyncing(false);
      },
      (err: Error) => {
        console.error('Firestore employee subscription error:', err);
        setIsSyncing(false);
      }
    );

    const unsubAtt = subscribeAttendanceRecords(
      currentUser.uid,
      (cloudRecords: AttendanceRecord[]) => {
        const cleaned = (cloudRecords || []).filter(r => !DEMO_ATTENDANCE_IDS.includes(r.id));
        setAttendanceRecords(cleaned);
        saveStoredAttendanceRecords(cleaned);
      },
      (err: Error) => {
        console.error('Firestore attendance subscription error:', err);
      }
    );

    const unsubHist = subscribeReportHistory(
      currentUser.uid,
      (cloudHistory: ReportHistoryItem[]) => {
        const cleaned = (cloudHistory || []).filter(h => !DEMO_REPORT_IDS.includes(h.id));
        setReportHistory(cleaned);
        saveStoredReportHistory(cleaned);
      },
      (err: Error) => {
        console.error('Firestore report history subscription error:', err);
      }
    );

    const unsubTpl = subscribeDocTemplates(
      currentUser.uid,
      (cloud: DocTemplate[]) => {
        setDocTemplates(cloud);
        saveDocTemplates(cloud);
      },
      (err: Error) => console.error('Firestore doc templates subscription error:', err)
    );

    const unsubGen = subscribeGeneratedDocs(
      currentUser.uid,
      (cloud: GeneratedDocumentRecord[]) => {
        setGeneratedDocs(cloud);
        saveGeneratedDocs(cloud);
      },
      (err: Error) => console.error('Firestore generated docs subscription error:', err)
    );

    return () => {
      unsubEmp();
      unsubAtt();
      unsubHist();
      unsubTpl();
      unsubGen();
    };
  }, [currentUser]);

  // Real-time listener for Job Applications and Settings (Public & HR sync)
  useEffect(() => {
    const unsubApps = subscribeJobApplications(
      (cloudApps) => {
        if (cloudApps && cloudApps.length > 0) {
          setJobApplications(cloudApps);
          saveStoredJobApplications(cloudApps);
        }
      },
      (err) => console.warn('Job applications sync notice:', err)
    );

    const unsubSettings = subscribeJobSettings(
      (cloudSettings) => {
        if (cloudSettings) {
          setJobSettings(cloudSettings);
          saveStoredJobSettings(cloudSettings);
        }
      },
      (err) => console.warn('Job settings sync notice:', err)
    );

    return () => {
      unsubApps();
      unsubSettings();
    };
  }, []);

  // Local storage backup when not logged in
  useEffect(() => {
    if (!currentUser) {
      saveStoredEmployees(employees);
    }
  }, [employees, currentUser]);

  useEffect(() => {
    if (!currentUser) {
      saveStoredAttendanceRecords(attendanceRecords);
    }
  }, [attendanceRecords, currentUser]);

  useEffect(() => {
    if (!currentUser) {
      saveStoredReportHistory(reportHistory);
    }
  }, [reportHistory, currentUser]);

  useEffect(() => {
    saveStoredJobApplications(jobApplications);
  }, [jobApplications]);

  useEffect(() => {
    saveStoredJobSettings(jobSettings);
  }, [jobSettings]);

  // Counts for Badges
  const activeCount = employees.filter(e => !e.resignation.isResigned).length;
  const foreignCount = employees.filter(e => !e.resignation.isResigned && e.isForeignWorker).length;
  const resignedCount = employees.filter(e => e.resignation.isResigned).length;

  // Urgent 7-Day Expiry Alerts (includes expired & documents due in <= 7 days)
  const urgent7DayAlerts = getUrgentExpiryAlerts(employees, 7);
  const urgent7DayCount = urgent7DayAlerts.length;

  // Automatic Login / System Entry 7-Day Expiry Modal Check
  useEffect(() => {
    if (employees.length > 0 && !hasCheckedLoginAlert) {
      const isDismissed = sessionStorage.getItem('hrm_pro_dismissed_7day_modal');
      if (!isDismissed && urgent7DayCount > 0) {
        // Open modal proactively upon entering / loading app
        const timer = setTimeout(() => {
          setIsUrgentAlertModalOpen(true);
        }, 500);
        setHasCheckedLoginAlert(true);
        return () => clearTimeout(timer);
      } else {
        setHasCheckedLoginAlert(true);
      }
    }
  }, [employees, urgent7DayCount, hasCheckedLoginAlert]);

  // When user signs in with Google, proactively check and display alert modal
  useEffect(() => {
    if (currentUser && urgent7DayCount > 0) {
      const userDismissed = sessionStorage.getItem(`hrm_pro_dismissed_7day_modal_${currentUser.uid}`);
      if (!userDismissed) {
        setIsUrgentAlertModalOpen(true);
      }
    }
  }, [currentUser]);

  const handleCloseUrgentModal = (dontShowAgainThisSession?: boolean) => {
    setIsUrgentAlertModalOpen(false);
    if (dontShowAgainThisSession) {
      sessionStorage.setItem('hrm_pro_dismissed_7day_modal', 'true');
      if (currentUser) {
        sessionStorage.setItem(`hrm_pro_dismissed_7day_modal_${currentUser.uid}`, 'true');
      }
    }
  };

  const handleSelectEmployeeFromUrgentAlert = (emp: Employee) => {
    setIsUrgentAlertModalOpen(false);
    setSelectedDetailEmployee(emp);
    setIsDetailModalOpen(true);
  };

  const expiringDocsCount = employees.reduce((count, emp) => {
    if (!emp.isForeignWorker || emp.resignation.isResigned || !emp.foreignDetails) return count;
    const pStat = getExpiryStatus(emp.foreignDetails.passportExpiryDate);
    const vStat = getExpiryStatus(emp.foreignDetails.visaExpiryDate);
    const wStat = getExpiryStatus(emp.foreignDetails.workPermitExpiryDate);

    let hasExpiring = false;
    if (pStat.status === 'EXPIRED' || pStat.status === 'CRITICAL' || pStat.status === 'WARNING') hasExpiring = true;
    if (vStat.status === 'EXPIRED' || vStat.status === 'CRITICAL' || vStat.status === 'WARNING') hasExpiring = true;
    if (wStat.status === 'EXPIRED' || wStat.status === 'CRITICAL' || wStat.status === 'WARNING') hasExpiring = true;

    return hasExpiring ? count + 1 : count;
  }, 0);

  // Authentication Handlers
  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
      await showErrorAlert('เข้าสู่ระบบไม่สำเร็จ', 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ โปรดตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Handlers for Employees
  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setIsEmployeeModalOpen(true);
  };

  const handleEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsEmployeeModalOpen(true);
  };

  const handleViewEmployee = (emp: Employee) => {
    setSelectedDetailEmployee(emp);
    setIsDetailModalOpen(true);
  };

  const handleClearAllData = async () => {
    const confirmed = await showConfirmDialog(
      'ล้างข้อมูลทั้งหมด?',
      'คุณต้องการล้างข้อมูลทั้งหมดในระบบใช่หรือไม่? ข้อมูลพนักงานและบันทึกเวลาทั้งหมดจะถูกลบ',
      'ยืนยันล้างข้อมูล',
      'ยกเลิก'
    );
    if (confirmed) {
      clearAllData();
      setEmployees([]);
      setAttendanceRecords([]);
      setReportHistory([]);
      if (currentUser) {
        setIsSyncing(true);
        try {
          await clearAllUserDataFromFirestore(currentUser.uid);
        } catch (err) {
          console.error('Error clearing data from Firestore:', err);
        } finally {
          setIsSyncing(false);
        }
      }
    }
  };

  const handleSaveEmployee = async (empData: Employee) => {
    setEmployees(prev => {
      const exists = prev.some(e => e.id === empData.id);
      if (exists) {
        return prev.map(e => e.id === empData.id ? empData : e);
      } else {
        return [empData, ...prev];
      }
    });
    setIsEmployeeModalOpen(false);
    setEditingEmployee(null);

    // Persist to Cloud Firestore if logged in
    if (currentUser) {
      setIsSyncing(true);
      try {
        await saveEmployeeToFirestore(currentUser.uid, empData);
      } catch (err) {
        console.error('Failed to sync employee to Firestore:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleBulkImportEmployees = async (newEmployees: Employee[]) => {
    if (!newEmployees || newEmployees.length === 0) return;

    setEmployees(prev => {
      const map = new Map<string, Employee>();
      prev.forEach(e => map.set(e.id, e));
      newEmployees.forEach(e => map.set(e.id, e));
      return Array.from(map.values());
    });

    if (currentUser) {
      setIsSyncing(true);
      try {
        for (const emp of newEmployees) {
          await saveEmployeeToFirestore(currentUser.uid, emp);
        }
      } catch (err) {
        console.error('Failed to sync bulk imported employees to Firestore:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Resignation Handlers
  const handleQuickResign = async (emp: Employee) => {
    const today = new Date().toISOString().split('T')[0];
    const resignationDate = prompt(`ระบุวันที่ลาออกสำหรับ "${emp.fullName}":`, today);
    if (!resignationDate) return;

    const reason = prompt(`เหตุผลการลาออก/พ้นสภาพ:`, 'ลาออกตามความประสงค์') || 'ลาออก';

    const updatedEmp: Employee = {
      ...emp,
      resignation: {
        isResigned: true,
        resignationDate,
        reason,
        blacklisted: false,
        settled: false,
        notes: 'บันทึกพ้นสภาพผ่านระบบ HR',
      }
    };

    setEmployees(prev => prev.map(e => e.id === emp.id ? updatedEmp : e));

    if (currentUser) {
      try {
        await saveEmployeeToFirestore(currentUser.uid, updatedEmp);
      } catch (err) {
        console.error('Failed to sync resignation to Firestore:', err);
      }
    }
  };

  const handleRestoreEmployee = async (employeeId: string) => {
    const target = employees.find(e => e.id === employeeId);
    const confirmed = await showConfirmDialog(
      'คืนสภาพพนักงาน?',
      `ยืนยันการคืนสภาพพนักงาน "${target?.fullName || employeeId}" กลับเข้าสู่สถานะปฏิบัติงาน?`,
      'คืนสภาพพนักงาน',
      'ยกเลิก'
    );
    if (confirmed) {
      const restoredEmp: Employee | undefined = target ? {
        ...target,
        resignation: {
          isResigned: false,
          resignationDate: undefined,
          reason: undefined,
          blacklisted: false,
          settled: false,
          notes: undefined,
        }
      } : undefined;

      setEmployees(prev => prev.map(e => {
        if (e.id === employeeId && restoredEmp) {
          return restoredEmp;
        }
        return e;
      }));

      if (currentUser && restoredEmp) {
        try {
          await saveEmployeeToFirestore(currentUser.uid, restoredEmp);
        } catch (err) {
          console.error('Failed to sync restore to Firestore:', err);
        }
      }
    }
  };

  // Direct Attendance Log Handlers (No Approval Needed)
  const handleAddAttendanceRecord = async (record: Omit<AttendanceRecord, 'id' | 'recordedAt'>) => {
    const newRecord: AttendanceRecord = {
      ...record,
      id: `ATT-${Date.now()}`,
      recordedAt: new Date().toISOString(),
      userId: currentUser?.uid,
    };

    setAttendanceRecords(prev => [newRecord, ...prev]);

    // Automatically update individual monthly attendance statistics
    const dateObj = new Date(record.date);
    const m = dateObj.getMonth() + 1;
    const y = dateObj.getFullYear();

    let targetEmployeeToSave: Employee | null = null;

    setEmployees(prev => prev.map(emp => {
      if (emp.id !== record.employeeId) return emp;
      const history = [...(emp.attendanceHistory || [])];
      const idx = history.findIndex(h => h.month === m && h.year === y);
      const existing: MonthlyAttendance = idx >= 0 ? history[idx] : {
        month: m,
        year: y,
        absentDays: 0,
        sickLeaveDays: 0,
        businessLeaveDays: 0,
        annualLeaveDays: 0,
        otherLeaveDays: 0,
        lateCount: 0,
        lateMinutes: 0,
        otHours: 0,
        warningCount: 0,
      };

      let deltaAbsent = 0;
      let deltaSick = 0;
      let deltaBusiness = 0;
      let deltaAnnual = 0;
      let deltaOther = 0;
      let deltaLateCount = 0;
      let deltaLateMinutes = 0;
      let deltaOt = 0;

      switch (record.type) {
        case 'ABSENT': deltaAbsent = record.amount; break;
        case 'SICK': deltaSick = record.amount; break;
        case 'BUSINESS': deltaBusiness = record.amount; break;
        case 'ANNUAL': deltaAnnual = record.amount; break;
        case 'OTHER_LEAVE': deltaOther = record.amount; break;
        case 'LATE': 
          deltaLateCount = 1; 
          deltaLateMinutes = record.amount; 
          break;
        case 'OT': deltaOt = record.amount; break;
      }

      const updatedStat: MonthlyAttendance = {
        ...existing,
        absentDays: (existing.absentDays || 0) + deltaAbsent,
        sickLeaveDays: (existing.sickLeaveDays || 0) + deltaSick,
        businessLeaveDays: (existing.businessLeaveDays || 0) + deltaBusiness,
        annualLeaveDays: (existing.annualLeaveDays || 0) + deltaAnnual,
        otherLeaveDays: (existing.otherLeaveDays || 0) + deltaOther,
        lateCount: (existing.lateCount || 0) + deltaLateCount,
        lateMinutes: (existing.lateMinutes || 0) + deltaLateMinutes,
        otHours: (existing.otHours || 0) + deltaOt,
      };

      if (idx >= 0) {
        history[idx] = updatedStat;
      } else {
        history.push(updatedStat);
      }

      const updatedEmployee = { ...emp, attendanceHistory: history };
      targetEmployeeToSave = updatedEmployee;
      return updatedEmployee;
    }));

    if (currentUser) {
      try {
        await saveAttendanceRecordToFirestore(currentUser.uid, newRecord);
        if (targetEmployeeToSave) {
          await saveEmployeeToFirestore(currentUser.uid, targetEmployeeToSave);
        }
      } catch (err) {
        console.error('Failed to save attendance record to Firestore:', err);
      }
    }
  };

  const handleDeleteAttendanceRecord = (id: string) => {
    setAttendanceRecords(prev => prev.filter(r => r.id !== id));
  };

  // Direct Monthly Attendance Stats Adjustment Handler
  const handleUpdateMonthlyAttendance = async (
    employeeId: string, 
    month: number, 
    year: number, 
    data: Partial<MonthlyAttendance>
  ) => {
    let empToSave: Employee | null = null;
    setEmployees(prev => prev.map(e => {
      if (e.id !== employeeId) return e;
      const history = [...(e.attendanceHistory || [])];
      const idx = history.findIndex(h => h.month === month && h.year === year);
      if (idx >= 0) {
        history[idx] = { ...history[idx], ...data };
      } else {
        history.push({
          month,
          year,
          absentDays: data.absentDays || 0,
          sickLeaveDays: data.sickLeaveDays || 0,
          businessLeaveDays: data.businessLeaveDays || 0,
          annualLeaveDays: data.annualLeaveDays || 0,
          otherLeaveDays: data.otherLeaveDays || 0,
          lateCount: data.lateCount || 0,
          lateMinutes: data.lateMinutes || 0,
          otHours: data.otHours || 0,
          warningCount: data.warningCount || 0,
        });
      }
      const updated = { ...e, attendanceHistory: history };
      empToSave = updated;
      return updated;
    }));

    if (currentUser && empToSave) {
      try {
        await saveEmployeeToFirestore(currentUser.uid, empToSave);
      } catch (err) {
        console.error('Failed to sync monthly attendance update to Firestore:', err);
      }
    }
  };

  // Birthday Activity and Wish Update Handler
  const handleUpdateBirthdayNote = async (employeeId: string, note: BirthdayEventNote) => {
    let empToSave: Employee | null = null;
    setEmployees(prev => prev.map(e => {
      if (e.id !== employeeId) return e;
      const updated = { ...e, birthdayNote: note };
      empToSave = updated;
      return updated;
    }));

    if (currentUser && empToSave) {
      try {
        await saveEmployeeToFirestore(currentUser.uid, empToSave);
      } catch (err) {
        console.error('Failed to sync birthday note to Firestore:', err);
      }
    }
  };

  // ==========================================
  // Recruitment & Job Application Handlers
  // ==========================================
  const handlePublicSubmitApplication = async (application: JobApplication) => {
    setJobApplications(prev => [application, ...prev.filter(a => a.id !== application.id)]);
    saveStoredJobApplications([application, ...jobApplications.filter(a => a.id !== application.id)]);

    try {
      await submitJobApplicationToFirestore(application);
    } catch (err) {
      console.warn('Saved job application locally:', err);
    }
  };

  const handleUpdateJobApplicationStatus = async (
    appId: string, 
    status: JobApplicationStatus, 
    hrNotes?: string, 
    interviewDate?: string, 
    interviewLocation?: string
  ) => {
    let targetApp: JobApplication | null = null;
    const updated = jobApplications.map(app => {
      if (app.id === appId) {
        targetApp = {
          ...app,
          status,
          ...(hrNotes !== undefined ? { hrNotes } : {}),
          ...(interviewDate !== undefined ? { interviewDate } : {}),
          ...(interviewLocation !== undefined ? { interviewLocation } : {}),
        };
        return targetApp;
      }
      return app;
    });

    setJobApplications(updated);
    saveStoredJobApplications(updated);

    if (targetApp) {
      try {
        await updateJobApplicationInFirestore(targetApp);
      } catch (err) {
        console.warn('Saved status update locally:', err);
      }
    }
  };

  const handleDeleteJobApplication = async (appId: string) => {
    const updated = jobApplications.filter(a => a.id !== appId);
    setJobApplications(updated);
    saveStoredJobApplications(updated);

    try {
      await deleteJobApplicationFromFirestore(appId);
    } catch (err) {
      console.warn('Deleted application locally:', err);
    }
  };

  const handleUpdateJobSettings = async (newSettings: JobApplicationSettings) => {
    setJobSettings(newSettings);
    saveStoredJobSettings(newSettings);

    try {
      await saveJobSettingsToFirestore(newSettings);
    } catch (err) {
      console.warn('Saved job settings locally:', err);
    }
  };

  const handleConvertApplicationToEmployee = async (app: JobApplication) => {
    // Generate new unique employee ID
    const existingIds = new Set(employees.map(e => e.id));
    let counter = employees.length + 1;
    let newId = `EMP-${String(counter).padStart(3, '0')}`;
    while (existingIds.has(newId)) {
      counter++;
      newId = `EMP-${String(counter).padStart(3, '0')}`;
    }

    const todayDate = new Date().toISOString().split('T')[0];

    const newEmp: Employee = {
      id: newId,
      userId: currentUser?.uid,
      fullName: app.fullName,
      nickname: app.nickname || '',
      idCardNumber: app.idCardNumber || `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
      birthDate: app.birthDate,
      phoneNumber: app.phoneNumber,
      address: app.currentAddress || '',
      position: app.position,
      department: app.department,
      branch: app.branch || 'สำนักงานใหญ่ (เชียงใหม่)',
      startDate: app.availableStartDate || todayDate,
      employmentType: app.desiredEmploymentType || 'FULL_TIME',
      salary: app.expectedSalary || 15000,
      emergencyContact: {
        name: app.emergencyContactName || 'ไม่ระบุ',
        relationship: app.emergencyContactRelation || 'ผู้ติดต่อ',
        phone: app.emergencyContactPhone || app.phoneNumber
      },
      isForeignWorker: app.isForeignWorker,
      nationalityText: app.nationalityText || (app.isForeignWorker ? 'เมียนมา' : 'ไทย'),
      identificationType: app.identificationType || (app.isForeignWorker ? 'PASSPORT' : 'THAI_ID'),
      attendanceHistory: [],
      resignation: {
        isResigned: false
      },
      documents: app.resumeUrl ? [
        {
          id: `DOC-${Date.now()}`,
          type: 'OTHER',
          title: 'เรซูเม่แนบจากใบสมัครงาน',
          fileName: app.resumeFileName || 'Resume.pdf',
          uploadDate: todayDate,
          isUploaded: true,
          fileUrl: app.resumeUrl
        }
      ] : [],
      avatarUrl: app.photoUrl
    };

    // Add to employees list
    setEmployees(prev => [newEmp, ...prev]);

    // Save to Firestore if user logged in
    if (currentUser) {
      try {
        await saveEmployeeToFirestore(currentUser.uid, newEmp);
      } catch (err) {
        console.error('Failed to sync new employee to Firestore:', err);
      }
    }

    // Update application status to HIRED
    let updatedApp: JobApplication | null = null;
    const updatedApps = jobApplications.map(a => {
      if (a.id === app.id) {
        updatedApp = {
          ...a,
          status: 'HIRED' as JobApplicationStatus,
          convertedToEmployeeId: newId,
          hrNotes: (a.hrNotes ? a.hrNotes + '\n' : '') + `[รับเข้าทำงานเป็นพนักงาน รหัส: ${newId} เมื่อ ${new Date().toLocaleDateString('th-TH')}]`
        };
        return updatedApp;
      }
      return a;
    });

    setJobApplications(updatedApps);
    saveStoredJobApplications(updatedApps);

    if (updatedApp) {
      try {
        await updateJobApplicationInFirestore(updatedApp);
      } catch (err) {
        console.warn('Updated app status locally:', err);
      }
    }

    await showSuccessAlert(
      'รับเข้าทำงานสำเร็จ!',
      `รับคุณ "${app.fullName}" เข้าทำงานเป็นพนักงานเรียบร้อยแล้ว! รหัสพนักงานใหม่: ${newId} (ข้อมูลได้รับการโอนเข้าสู่ฐานข้อมูลพนักงานในระบบแล้ว)`
    );
    setCurrentTab('employees');
  };

  // Report History Handlers
  const handleSaveReportHistory = async (newReport: ReportHistoryItem) => {
    setReportHistory(prev => {
      const filtered = prev.filter(r => r.id !== newReport.id);
      const updated = [newReport, ...filtered];
      saveStoredReportHistory(updated);
      return updated;
    });

    if (currentUser) {
      try {
        await saveReportHistoryToFirestore(currentUser.uid, newReport);
      } catch (err) {
        console.error('Failed to sync report history to Firestore:', err);
      }
    }
  };

  const handleDeleteReportHistory = async (reportId: string) => {
    setReportHistory(prev => {
      const updated = prev.filter(r => r.id !== reportId);
      saveStoredReportHistory(updated);
      return updated;
    });

    if (currentUser) {
      try {
        await deleteReportHistoryFromFirestore(currentUser.uid, reportId);
      } catch (err) {
        console.error('Failed to delete report history from Firestore:', err);
      }
    }
  };

  // Document Library Handlers
  const handleSaveDocTemplate = async (tpl: DocTemplate): Promise<boolean> => {
    if (currentUser) {
      try {
        await saveDocTemplateToFirestore(currentUser.uid, tpl);
      } catch (err) {
        console.error('Failed to sync template to Firestore:', err);
        return false;
      }
    }
    const updated = [tpl, ...docTemplates.filter(t => t.id !== tpl.id)];
    setDocTemplates(updated);
    // ถ้า localStorage เต็ม ก็ยังใช้งานได้เพราะข้อมูลหลักอยู่ที่ Firestore เมื่อล็อกอิน
    const savedLocal = saveDocTemplates(updated);
    return currentUser ? true : savedLocal;
  };

  const handleDeleteDocTemplate = async (id: string) => {
    const updated = docTemplates.filter(t => t.id !== id);
    setDocTemplates(updated);
    saveDocTemplates(updated);
    if (currentUser) {
      try {
        await deleteDocTemplateFromFirestore(currentUser.uid, id);
      } catch (err) {
        console.error('Failed to delete template from Firestore:', err);
      }
    }
  };

  const handleRecordGeneratedDoc = async (record: GeneratedDocumentRecord) => {
    setGeneratedDocs(prev => {
      const updated = [record, ...prev.filter(r => r.id !== record.id)];
      saveGeneratedDocs(updated);
      return updated;
    });
    if (currentUser) {
      try {
        await saveGeneratedDocToFirestore(currentUser.uid, record);
      } catch (err) {
        console.error('Failed to sync generated document log to Firestore:', err);
      }
    }
  };
  // Employment Contracts Handlers
  const handleSaveContract = (contract: EmploymentContract) => {
    setEmploymentContracts(prev => {
      const exists = prev.some(c => c.id === contract.id);
      const updated = exists
        ? prev.map(c => c.id === contract.id ? contract : c)
        : [contract, ...prev];
      saveEmploymentContracts(updated);
      return updated;
    });
  };

  const handleDeleteContract = (contractId: string) => {
    setEmploymentContracts(prev => {
      const updated = prev.filter(c => c.id !== contractId);
      saveEmploymentContracts(updated);
      return updated;
    });
  };

  const handleUpdateContractSettings = (newSettings: ContractSettings) => {
    setContractSettings(newSettings);
    saveContractSettings(newSettings);
  };

  // Render Sub-Views
  const renderMainContent = () => (
    <>
      {/* Cloud Auth Welcome / Status Banner */}
      {!currentUser && showAuthBanner && (
        <div className="mb-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-md border border-blue-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                <span>เปิดใช้งานคลาวด์ดาต้าเบส (Cloud Firestore Persistence)</span>
                <span className="px-1.5 py-0.2 text-[10px] bg-amber-400 text-slate-900 font-bold rounded">
                  แนะนำ
                </span>
              </h4>
              <p className="text-[11px] text-blue-200 mt-0.5">
                เข้าสู่ระบบด้วย Google เพื่อสำรองข้อมูลพนักงานและซิงค์ข้อมูลเรียลไทม์บน Firebase
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={handleLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-900 rounded-lg text-xs font-bold transition shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-600" />
              <span>เข้าสู่ระบบ Google</span>
            </button>
            <button
              onClick={() => setShowAuthBanner(false)}
              className="text-xs text-blue-300 hover:text-white px-2 py-1"
            >
              ภายหลัง
            </button>
          </div>
        </div>
      )}

      {currentTab === 'dashboard' && (
        <DashboardView
          employees={employees}
          attendanceRecords={attendanceRecords}
          onOpenAddModal={handleOpenAddModal}
          onNavigateTab={setCurrentTab}
          onSelectEmployee={handleViewEmployee}
          onOpenUrgentAlertModal={() => setIsUrgentAlertModalOpen(true)}
          urgent7DayCount={urgent7DayCount}
          onApplyAttendanceToSystem={handleUpdateMonthlyAttendance}
          onAddAttendanceRecord={handleAddAttendanceRecord}
          onUpdateBirthdayNote={handleUpdateBirthdayNote}
        />
      )}

      {currentTab === 'employees' && (
        <EmployeeListView
          employees={employees}
          onOpenAddModal={handleOpenAddModal}
          onEditEmployee={handleEditEmployee}
          onViewEmployee={handleViewEmployee}
          onQuickResign={handleQuickResign}
          onBulkImportEmployees={handleBulkImportEmployees}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}

      {currentTab === 'foreign' && (
        <ForeignWorkerManagerView
          employees={employees}
          onEditEmployee={handleEditEmployee}
          onViewEmployee={handleViewEmployee}
        />
      )}

      {currentTab === 'attendance' && (
        <AttendanceLeaveView
          employees={employees}
          attendanceRecords={attendanceRecords}
          onAddAttendanceRecord={handleAddAttendanceRecord}
          onDeleteAttendanceRecord={handleDeleteAttendanceRecord}
          onUpdateMonthlyAttendance={handleUpdateMonthlyAttendance}
        />
      )}

      {currentTab === 'calendar' && (
        <AttendanceLeaveView
          employees={employees}
          attendanceRecords={attendanceRecords}
          onAddAttendanceRecord={handleAddAttendanceRecord}
          onDeleteAttendanceRecord={handleDeleteAttendanceRecord}
          onUpdateMonthlyAttendance={handleUpdateMonthlyAttendance}
          initialSubTab="calendar"
        />
      )}

      {currentTab === 'payroll' && (
        <PayrollView
          employees={employees}
        />
      )}

      {currentTab === 'contracts' && (
        <EmploymentContractsView
          contracts={employmentContracts}
          settings={contractSettings}
          employees={employees}
          jobApplications={jobApplications}
          onSaveContract={handleSaveContract}
          onDeleteContract={handleDeleteContract}
          onUpdateSettings={handleUpdateContractSettings}
        />
      )}

      {currentTab === 'documents' && (
        <DocumentLibraryView
          templates={docTemplates}
          employees={employees}
          generatedDocs={generatedDocs}
          contractSettings={contractSettings}
          currentUserEmail={currentUser?.email || undefined}
          preselect={docPreselect}
          onSaveTemplate={handleSaveDocTemplate}
          onDeleteTemplate={handleDeleteDocTemplate}
          onRecordGenerated={handleRecordGeneratedDoc}
        />
      )}

      {currentTab === 'recruitment' && (
        <RecruitmentView
          applications={jobApplications}
          settings={jobSettings}
          onUpdateSettings={handleUpdateJobSettings}
          onUpdateApplicationStatus={handleUpdateJobApplicationStatus}
          onDeleteApplication={handleDeleteJobApplication}
          onConvertToEmployee={handleConvertApplicationToEmployee}
          onAddApplication={handlePublicSubmitApplication}
          onOpenApplyPage={(jobId?: string) => {
            const url = new URL(window.location.href);
            url.searchParams.set('page', 'apply');
            if (jobId) {
              url.searchParams.set('jobId', jobId);
            } else {
              url.searchParams.delete('jobId');
            }
            window.history.pushState({}, '', url.toString());
            setIsPublicApplyMode(true);
          }}
        />
      )}

      {currentTab === 'report' && (
        <MonthlyReportView
          employees={employees}
          reportHistory={reportHistory}
          onSaveReportHistory={handleSaveReportHistory}
          onDeleteReportHistory={handleDeleteReportHistory}
          currentUserEmail={currentUser?.email || undefined}
        />
      )}

      {currentTab === 'resigned' && (
        <ResignedDatabaseView
          employees={employees}
          onViewEmployee={handleViewEmployee}
          onRestoreEmployee={handleRestoreEmployee}
        />
      )}
    </>
  );

  // If applicant is visiting the public job application URL (?page=apply)
  if (isPublicApplyMode) {
    return (
      <PublicJobApplicationView
        settings={jobSettings}
        onSubmitApplication={handlePublicSubmitApplication}
        onSwitchToHR={() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('page');
          url.searchParams.delete('apply');
          url.searchParams.delete('jobId');
          url.searchParams.delete('job');
          window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
          setIsPublicApplyMode(false);
          setCurrentTab('recruitment');
        }}
      />
    );
  }

  const pendingApplicationsCount = jobApplications.filter(a => a.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col antialiased text-slate-800 selection:bg-blue-100 selection:text-blue-900">
      
      {/* Top Navbar with Google Sign-in and Cloud State */}
      <Navbar
        employees={employees}
        onOpenAddModal={handleOpenAddModal}
        onNavigateToForeignExpiries={() => setCurrentTab('foreign')}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={currentTab}
        currentUser={currentUser}
        isSyncing={isSyncing}
        onLogin={handleLogin}
        onLogout={handleLogout}
        urgent7DayCount={urgent7DayCount}
        onOpenUrgentAlertModal={() => setIsUrgentAlertModalOpen(true)}
      />

      {/* Main Responsive Web/Mobile Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-6 gap-6 items-start">
        
        {/* Desktop Sidebar Navigation */}
        <Sidebar
          activeTab={currentTab}
          onSelectTab={setCurrentTab}
          activeCount={activeCount}
          foreignCount={foreignCount}
          resignedCount={resignedCount}
          expiringDocsCount={expiringDocsCount}
          urgent7DayCount={urgent7DayCount}
          pendingApplicationsCount={pendingApplicationsCount}
          contractsCount={employmentContracts.filter(c => c.status === 'ACTIVE').length}
          onOpenUrgentAlertModal={() => setIsUrgentAlertModalOpen(true)}
        />

        {/* Dynamic View Area */}
        <main className="flex-1 min-w-0 pb-20 md:pb-6">
          {renderMainContent()}
        </main>

      </div>

      {/* Global Mobile Bottom Navigation for mobile screens */}
      <MobileNav
        activeTab={currentTab}
        onSelectTab={setCurrentTab}
        expiringDocsCount={expiringDocsCount}
      />

      {/* Modals */}
      <UrgentExpiryModal
        isOpen={isUrgentAlertModalOpen}
        onClose={handleCloseUrgentModal}
        urgentAlerts={urgent7DayAlerts}
        onSelectEmployee={handleSelectEmployeeFromUrgentAlert}
        onNavigateToForeign={() => {
          setIsUrgentAlertModalOpen(false);
          setCurrentTab('foreign');
        }}
      />

      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        onSave={handleSaveEmployee}
        employeeToEdit={editingEmployee}
        existingCount={employees.length}
      />

      <EmployeeDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        employee={selectedDetailEmployee}
        attendanceRecords={attendanceRecords}
        onEdit={(emp) => {
          setIsDetailModalOpen(false);
          handleEditEmployee(emp);
        }}
        onResignToggle={(emp) => {
          setIsDetailModalOpen(false);
          handleQuickResign(emp);
        }}
        onUpdateEmployee={(emp) => {
          handleSaveEmployee(emp);
          setSelectedDetailEmployee(emp);
        }}
        onOpenQuickAttendanceForm={() => {
          setIsDetailModalOpen(false);
          setCurrentTab('attendance');
        }}
        docTemplates={docTemplates}
        generatedDocs={generatedDocs}
        contracts={employmentContracts}
        onGenerateFromTemplate={(templateId, employeeId) => {
          setDocPreselect({ templateId, employeeId });
          setIsDetailModalOpen(false);
          setCurrentTab('documents');
        }}
      />

    </div>
  );
}
