import React, { useState, useMemo } from 'react';
import { 
  FileSignature, 
  Plus, 
  Settings, 
  Search, 
  Printer, 
  Edit3, 
  Trash2, 
  Clock, 
  Building2, 
  User, 
  Users, 
  Briefcase, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ShieldCheck, 
  Filter, 
  Sparkles, 
  FileText,
  UserCheck,
  Eye,
  ExternalLink,
  X,
  CreditCard,
  Globe,
  ListOrdered
} from 'lucide-react';
import { 
  EmploymentContract, 
  ContractSettings, 
  Employee, 
  JobApplication, 
  Department, 
  DEPARTMENTS, 
  ContractType, 
  ContractStatus, 
  WorkShift,
  ContractNationalityCategory,
  ContractPaymentMethod
} from '../types';
import { showErrorAlert, showConfirmDialog, showSuccessAlert, showToast } from '../utils/swal';
import { ContractSettingsModal } from './ContractSettingsModal';
import { ContractPreviewPdfModal } from './ContractPreviewPdfModal';

interface EmploymentContractsViewProps {
  contracts: EmploymentContract[];
  settings: ContractSettings;
  employees: Employee[];
  jobApplications: JobApplication[];
  onSaveContract: (contract: EmploymentContract) => void;
  onDeleteContract: (contractId: string) => void;
  onUpdateSettings: (settings: ContractSettings) => void;
}

export const THAI_MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const parseDateToThaiParts = (dateStr?: string) => {
  if (!dateStr) return { day: '', month: '', year: '' };
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = String(parseInt(parts[2], 10));
      const mIdx = parseInt(parts[1], 10) - 1;
      const month = THAI_MONTH_NAMES[mIdx] || '';
      const ceYear = parseInt(parts[0], 10);
      const beYear = ceYear > 2400 ? String(ceYear) : String(ceYear + 543);
      return { day, month, year: beYear };
    }
  } catch {
    // ignore
  }
  return { day: '', month: '', year: '' };
};

export const EmploymentContractsView: React.FC<EmploymentContractsViewProps> = ({
  contracts,
  settings,
  employees,
  jobApplications,
  onSaveContract,
  onDeleteContract,
  onUpdateSettings,
}) => {
  // Modal states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedPreviewContract, setSelectedPreviewContract] = useState<EmploymentContract | null>(null);
  
  // Create / Edit modal state
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Form state for Create / Edit Contract
  const initialContractFormState: EmploymentContract = {
    id: '',
    contractNumber: '',
    createdAt: new Date().toISOString(),
    contractDate: new Date().toISOString().split('T')[0],
    employeeId: '',
    applicationId: '',
    employeeName: '',
    birthDate: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    nationalityCategory: 'THAI',
    otherNationalityText: '',
    idCardNumber: '',
    workPermitNumber: '',
    workPermitExpiryDate: '',
    address: '',
    phone: '',
    position: '',
    department: DEPARTMENTS[0],
    branch: settings.companyName,
    contractType: 'PROBATION',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    probationDays: settings.probationDays || 90,
    salary: 15000,
    dailyWage: 400,
    salaryType: 'MONTHLY',
    paymentMethod: 'BANK_TRANSFER',
    bankName: 'ธนาคารกสิกรไทย',
    bankAccountNumber: '',
    paymentDay: settings.standardPaymentDay || 'ทุกวันที่ 5 ของเดือน สำหรับงวดวันที่ 1 ถึงสิ้นเดือนของเดือนก่อนหน้า',
    shiftOption: 'SHIFT_1',
    shiftId: '',
    shiftName: 'กะเช้า 1 (07.00 - 16.00 น.)',
    startTime: '07:00',
    endTime: '16:00',
    breakMinutes: 60,
    workDaysPerWeek: 6,
    weeklyHoliday: settings.weeklyHolidays || 'วันศุกร์ถึงวันพุธ ร้านหยุดทุกวันพฤหัสบดี ซึ่งเป็นวันหยุดประจำสัปดาห์',
    mainDuties: [
      'ดูแลรับผิดชอบงานในหน้าที่ตามที่ได้รับมอบหมาย',
      'รักษามาตรฐานคุณภาพและความสะอาดของสถานที่และอุปกรณ์',
      'ปฏิบัติตามมาตรฐานขั้นตอนการทำงาน (SOP) ของร้านอย่างเคร่งครัด',
      'ให้ความร่วมมือกับเพื่อนร่วมงานและผู้บังคับบัญชา',
      'ดูแลรักษาทรัพย์สินและความลับทางการค้าของบริษัท'
    ],
    supervisor: 'ผู้จัดการสาขา / หัวหน้าแผนก',
    employerSignerName: settings.employerSignerName,
    employerSignerTitle: settings.employerSignerTitle,
    witness1Name: settings.witness1Name,
    witness2Name: settings.witness2Name,
    specialTerms: '',
    status: 'ACTIVE',
  };

  const [contractForm, setContractForm] = useState<EmploymentContract>(initialContractFormState);

  // Quick Employee/Applicant Picker Selection source
  const [selectedSourceType, setSelectedSourceType] = useState<'EMPLOYEE' | 'APPLICANT' | 'MANUAL'>('MANUAL');

  // Generate new Contract Number (e.g. CTR-2569/001)
  const generateContractNumber = () => {
    const currentYearThai = new Date().getFullYear() + 543;
    const count = contracts.length + 1;
    const padded = String(count).padStart(3, '0');
    return `CTR-${currentYearThai}/${padded}`;
  };

  // Get shifts available for current department
  const currentDeptShifts = useMemo(() => {
    const config = settings.departmentShifts?.find(d => d.department === contractForm.department);
    return config?.shifts || [];
  }, [settings.departmentShifts, contractForm.department]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const newId = `CTR-${Date.now()}`;
    const newNum = generateContractNumber();
    const today = new Date().toISOString().split('T')[0];
    
    // Find default shift for the first department
    const defaultDeptConfig = settings.departmentShifts?.find(d => d.department === DEPARTMENTS[0]);
    const firstShift = defaultDeptConfig?.shifts?.[0];

    setContractForm({
      ...initialContractFormState,
      id: newId,
      contractNumber: newNum,
      createdAt: new Date().toISOString(),
      contractDate: today,
      department: DEPARTMENTS[0],
      shiftId: firstShift?.id || '',
      shiftName: firstShift?.name || 'กะเช้า 1: เวลา 07.00 น. ถึง 16.00 น.',
      startTime: firstShift?.startTime || '07:00',
      endTime: firstShift?.endTime || '16:00',
      breakMinutes: firstShift?.breakMinutes ?? 60,
      workDaysPerWeek: firstShift?.workDaysPerWeek ?? 6,
      employerSignerName: settings.employerSignerName,
      employerSignerTitle: settings.employerSignerTitle,
      witness1Name: settings.witness1Name,
      witness2Name: settings.witness2Name,
      probationDays: settings.probationDays || 90,
      weeklyHoliday: settings.weeklyHolidays || 'วันศุกร์ถึงวันพุธ ร้านหยุดทุกวันพฤหัสบดี ซึ่งเป็นวันหยุดประจำสัปดาห์',
      paymentDay: settings.standardPaymentDay || 'ทุกวันที่ 5 ของเดือน สำหรับงวดวันที่ 1 ถึงสิ้นเดือนของเดือนก่อนหน้า',
    });
    setEditingContractId(null);
    setSelectedSourceType('MANUAL');
    setIsContractModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (c: EmploymentContract) => {
    setContractForm({
      ...initialContractFormState,
      ...c,
      nationalityCategory: c.nationalityCategory || (c.workPermitNumber ? 'MYANMAR' : 'THAI'),
      paymentMethod: c.paymentMethod || 'BANK_TRANSFER',
      salaryType: c.salaryType || 'MONTHLY',
      shiftOption: c.shiftOption || 'SHIFT_1',
      mainDuties: c.mainDuties && c.mainDuties.length > 0 ? c.mainDuties : [
        'ดูแลรับผิดชอบงานในหน้าที่ตามที่ได้รับมอบหมาย',
        'รักษามาตรฐานคุณภาพและความสะอาดของสถานที่และอุปกรณ์',
        'ปฏิบัติตามมาตรฐานขั้นตอนการทำงาน (SOP) ของร้านอย่างเคร่งครัด',
        'ให้ความร่วมมือกับเพื่อนร่วมงานและผู้บังคับบัญชา',
        'ดูแลรักษาทรัพย์สินและความลับทางการค้าของบริษัท'
      ],
      supervisor: c.supervisor || 'ผู้จัดการสาขา / หัวหน้าแผนก',
    });
    setEditingContractId(c.id);
    setSelectedSourceType('MANUAL');
    setIsContractModalOpen(true);
  };

  // Handle source picker change (fill data from selected employee or applicant)
  const handleSelectEmployeeSource = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    let natCat: ContractNationalityCategory = 'THAI';
    let otherNat = '';
    const permitNum = emp.workPermitNumber || '';
    const permitExp = emp.workPermitExpiryDate || '';

    if (emp.isForeignWorker) {
      const natLower = (emp.nationalityText || '').toLowerCase();
      if (natLower.includes('เมียนมา') || natLower.includes('myanmar') || natLower.includes('พม่า')) {
        natCat = 'MYANMAR';
      } else {
        natCat = 'OTHER';
        otherNat = emp.nationalityText || '';
      }
    }

    const { day: bDay, month: bMonth, year: bYear } = parseDateToThaiParts(emp.birthDate);

    // Look up shifts for this employee's department
    const deptConfig = settings.departmentShifts?.find(d => d.department === emp.department);
    const shift = deptConfig?.shifts?.[0];
    const isDaily = emp.employmentType === 'DAILY';

    setContractForm(prev => ({
      ...prev,
      employeeId: emp.id,
      employeeName: emp.fullName,
      birthDate: emp.birthDate || prev.birthDate,
      birthDay: bDay || prev.birthDay,
      birthMonth: bMonth || prev.birthMonth,
      birthYear: bYear || prev.birthYear,
      nationalityCategory: natCat,
      otherNationalityText: otherNat,
      idCardNumber: emp.idCardNumber || '',
      workPermitNumber: permitNum,
      workPermitExpiryDate: permitExp,
      address: emp.address || '',
      phone: emp.phoneNumber || '',
      position: emp.position || '',
      department: emp.department as Department,
      salary: isDaily ? (emp.salary || 12000) : (emp.salary || 15000),
      dailyWage: isDaily ? (emp.salary || 400) : 400,
      salaryType: isDaily ? 'DAILY' : 'MONTHLY',
      startDate: emp.startDate || prev.startDate,
      shiftId: shift?.id || prev.shiftId,
      shiftName: shift?.name || prev.shiftName,
      startTime: shift?.startTime || prev.startTime,
      endTime: shift?.endTime || prev.endTime,
      breakMinutes: shift?.breakMinutes ?? prev.breakMinutes,
      workDaysPerWeek: shift?.workDaysPerWeek ?? prev.workDaysPerWeek,
    }));
  };

  const handleSelectApplicantSource = (appId: string) => {
    const app = jobApplications.find(a => a.id === appId);
    if (!app) return;

    let natCat: ContractNationalityCategory = 'THAI';
    if (app.isForeignWorker) {
      natCat = 'MYANMAR';
    }

    const { day: bDay, month: bMonth, year: bYear } = parseDateToThaiParts(app.birthDate);
    const dept = (app.department as Department) || DEPARTMENTS[0];
    const deptConfig = settings.departmentShifts?.find(d => d.department === dept);
    const shift = deptConfig?.shifts?.[0];

    setContractForm(prev => ({
      ...prev,
      applicationId: app.id,
      employeeName: app.fullName,
      birthDate: app.birthDate || prev.birthDate,
      birthDay: bDay || prev.birthDay,
      birthMonth: bMonth || prev.birthMonth,
      birthYear: bYear || prev.birthYear,
      nationalityCategory: natCat,
      idCardNumber: app.idCardNumber || '',
      address: app.currentAddress || '',
      phone: app.phoneNumber || '',
      position: app.position || '',
      department: dept,
      salary: app.expectedSalary || 15000,
      shiftId: shift?.id || prev.shiftId,
      shiftName: shift?.name || prev.shiftName,
      startTime: shift?.startTime || prev.startTime,
      endTime: shift?.endTime || prev.endTime,
      breakMinutes: shift?.breakMinutes ?? prev.breakMinutes,
      workDaysPerWeek: shift?.workDaysPerWeek ?? prev.workDaysPerWeek,
    }));
  };

  // Handle department change -> auto suggest shift
  const handleDepartmentChange = (dept: Department) => {
    const config = settings.departmentShifts?.find(d => d.department === dept);
    const firstShift = config?.shifts?.[0];

    setContractForm(prev => ({
      ...prev,
      department: dept,
      shiftId: firstShift?.id || '',
      shiftName: firstShift?.name || prev.shiftName,
      startTime: firstShift?.startTime || prev.startTime,
      endTime: firstShift?.endTime || prev.endTime,
      breakMinutes: firstShift?.breakMinutes ?? prev.breakMinutes,
      workDaysPerWeek: firstShift?.workDaysPerWeek ?? prev.workDaysPerWeek,
    }));
  };

  // Handle shift selection from department shifts
  const handleSelectShift = (shift: WorkShift) => {
    setContractForm(prev => ({
      ...prev,
      shiftId: shift.id,
      shiftName: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakMinutes: shift.breakMinutes,
      workDaysPerWeek: shift.workDaysPerWeek,
    }));
  };

  // Save Contract
  const handleSaveContractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractForm.employeeName.trim()) {
      showErrorAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุชื่อ-นามสกุลพนักงาน');
      return;
    }
    if (!contractForm.contractNumber.trim()) {
      showErrorAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุเลขที่สัญญา');
      return;
    }

    onSaveContract(contractForm);
    showToast('บันทึกสัญญาจ้างสำเร็จ');
    setIsContractModalOpen(false);
  };

  // Filtered contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.employeeName?.toLowerCase().includes(q);
        const matchNum = c.contractNumber?.toLowerCase().includes(q);
        const matchPos = c.position?.toLowerCase().includes(q);
        const matchDept = c.department?.toLowerCase().includes(q);
        const matchCard = c.idCardNumber?.toLowerCase().includes(q);
        if (!matchName && !matchNum && !matchPos && !matchDept && !matchCard) return false;
      }
      // Department
      if (selectedDeptFilter !== 'ALL' && c.department !== selectedDeptFilter) return false;
      // Type
      if (selectedTypeFilter !== 'ALL' && c.contractType !== selectedTypeFilter) return false;
      // Status
      if (selectedStatusFilter !== 'ALL' && c.status !== selectedStatusFilter) return false;

      return true;
    });
  }, [contracts, searchQuery, selectedDeptFilter, selectedTypeFilter, selectedStatusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = contracts.length;
    const active = contracts.filter(c => c.status === 'ACTIVE').length;
    const probation = contracts.filter(c => c.contractType === 'PROBATION').length;
    const permanent = contracts.filter(c => c.contractType === 'PERMANENT').length;
    const temporary = contracts.filter(c => c.contractType === 'TEMPORARY').length;
    return { total, active, probation, permanent, temporary };
  }, [contracts]);

  const contractTypeBadge = (type: ContractType) => {
    switch (type) {
      case 'PROBATION':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">ทดลองงาน (Probation)</span>;
      case 'PERMANENT':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">พนักงานประจำ (Permanent)</span>;
      case 'TEMPORARY':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">สัญญาชั่วคราว (Temporary)</span>;
      default:
        return null;
    }
  };

  const contractStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> มีผลบังคับใช้</span>;
      case 'DRAFT':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200"><Clock className="w-3.5 h-3.5" /> ฉบับร่าง</span>;
      case 'TERMINATED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200"><AlertCircle className="w-3.5 h-3.5" /> สิ้นสุดสัญญา</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <FileSignature className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>ระบบสัญญาจ้างงาน (Employment Contracts)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              จัดทำสัญญาจ้างงานตามกฎหมายแรงงาน กำหนดกะการทำงานแต่ละแผนก และ Export เป็น PDF
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shadow-2xs"
            title="ตั้งค่าข้อมูลนายจ้างและกะการทำงานแต่ละแผนก"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>ตั้งค่าสัญญา & กะทำงาน</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างสัญญาจ้างใหม่</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">สัญญาทั้งหมด</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
          <span className="text-[10px] text-slate-400">ฉบับในระบบ</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-semibold text-emerald-600">มีผลบังคับใช้</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{stats.active}</p>
          <span className="text-[10px] text-emerald-500">พร้อมปฏิบัติงาน</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-semibold text-amber-600">สัญญาทดลองงาน</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{stats.probation}</p>
          <span className="text-[10px] text-amber-500">ระยะทดลอง {settings.probationDays} วัน</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-semibold text-blue-600">สัญญาประจำ</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{stats.permanent}</p>
          <span className="text-[10px] text-blue-500">พนักงานประจำ</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <p className="text-xs font-semibold text-indigo-600">สัญญาชั่วคราว</p>
          <p className="text-2xl font-black text-indigo-700 mt-1">{stats.temporary}</p>
          <span className="text-[10px] text-indigo-500">พาร์ทไทม์/โครงการ</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          
          {/* Search box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อพนักงาน, เลขที่สัญญา, ตำแหน่ง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Department */}
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">ทุกแผนก (All Departments)</option>
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Type */}
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">ทุกประเภทสัญญา</option>
              <option value="PROBATION">ทดลองงาน (Probation)</option>
              <option value="PERMANENT">ประจำ (Permanent)</option>
              <option value="TEMPORARY">ชั่วคราว (Temporary)</option>
            </select>

            {/* Status */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="ACTIVE">มีผลบังคับใช้</option>
              <option value="DRAFT">ฉบับร่าง</option>
              <option value="TERMINATED">สิ้นสุดสัญญา</option>
            </select>
          </div>

        </div>
      </div>

      {/* Contracts Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredContracts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">เลขที่สัญญา & วันที่</th>
                  <th className="py-3.5 px-4">ชื่อพนักงาน / ลูกจ้าง</th>
                  <th className="py-3.5 px-4">แผนก & ตำแหน่ง</th>
                  <th className="py-3.5 px-4">กะการทำงาน (เวลาเข้า-ออก)</th>
                  <th className="py-3.5 px-4">อัตราค่าจ้าง</th>
                  <th className="py-3.5 px-4">ประเภทสัญญา</th>
                  <th className="py-3.5 px-4">สถานะ</th>
                  <th className="py-3.5 px-4 text-center">จัดการสัญญา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredContracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition group">
                    {/* Contract Number & Date */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{c.contractNumber}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        วันที่: {c.contractDate}
                      </span>
                    </td>

                    {/* Employee Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{c.employeeName}</div>
                      <div className="text-[11px] text-slate-500">
                        เลข ปชช: {c.idCardNumber || '-'}
                      </div>
                    </td>

                    {/* Department & Position */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{c.position}</span>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Briefcase className="w-3 h-3 text-slate-400" />
                        <span>{c.department}</span>
                      </div>
                    </td>

                    {/* Shift Time */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-blue-700">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span>{c.startTime} - {c.endTime} น.</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {c.shiftName} (พัก {c.breakMinutes} นาที)
                      </span>
                    </td>

                    {/* Salary */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">
                        {c.salary.toLocaleString('th-TH')} บาท
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {c.salaryType === 'MONTHLY' ? 'รายเดือน' : 'รายวัน'}
                      </span>
                    </td>

                    {/* Contract Type */}
                    <td className="py-3.5 px-4">
                      {contractTypeBadge(c.contractType)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {contractStatusBadge(c.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreviewContract(c);
                            setIsPreviewOpen(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-xs transition cursor-pointer"
                          title="ดูสัญญา & พิมพ์ / Export PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Export PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="แก้ไขข้อมูลสัญญา"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            const confirmed = await showConfirmDialog(
                              'ลบสัญญาจ้าง?',
                              `คุณแน่ใจหรือไม่ว่าต้องการลบสัญญาจ้างของ ${c.employeeName}?`,
                              'ยืนยันลบ',
                              'ยกเลิก'
                            );
                            if (confirmed) {
                              onDeleteContract(c.id);
                              showToast('ลบสัญญาจ้างเรียบร้อย');
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="ลบสัญญาจ้าง"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-500 mx-auto flex items-center justify-center">
              <FileSignature className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-base text-slate-800">
              {searchQuery ? 'ไม่พบสัญญาจ้างที่ตรงกับเงื่อนไขการค้นหา' : 'ยังไม่มีสัญญาจ้างงานในระบบ'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              สร้างสัญญาจ้างงานเพื่อออกเอกสารทางการตามกฎหมายแรงงาน พร้อมระบุเวลาเข้า-ออกงาน และ Export เป็น PDF ได้ทันที
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>สร้างสัญญาจ้างฉบับแรก</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT CONTRACT MODAL */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-6 py-4.5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-blue-300">
                  <FileSignature className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black">
                    {editingContractId ? 'แก้ไขสัญญาจ้างแรงงาน' : 'สร้างหนังสือสัญญาจ้างงานใหม่'}
                  </h3>
                  <p className="text-xs text-blue-200">
                    กำหนดข้อมูลพนักงาน ตำแหน่ง แผนก และกะการทำงาน (เวลาเข้า-ออกงาน)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsContractModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveContractSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              
              {/* Quick source selector */}
              {!editingContractId && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>ดึงข้อมูลอัตโนมัติจากในระบบ (Auto Pre-fill):</span>
                    </span>
                    <div className="flex items-center gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedSourceType('EMPLOYEE')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition ${selectedSourceType === 'EMPLOYEE' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white text-slate-600'}`}
                      >
                        จากพนักงานปัจจุบัน ({employees.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSourceType('APPLICANT')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition ${selectedSourceType === 'APPLICANT' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white text-slate-600'}`}
                      >
                        จากใบสมัครงาน ({jobApplications.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSourceType('MANUAL')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition ${selectedSourceType === 'MANUAL' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white text-slate-600'}`}
                      >
                        กรอกเอง
                      </button>
                    </div>
                  </div>

                  {selectedSourceType === 'EMPLOYEE' && (
                    <select
                      onChange={(e) => handleSelectEmployeeSource(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      <option value="">-- เลือกพนักงานในระบบเพื่อดึงข้อมูล --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName} ({emp.position} - {emp.department})
                        </option>
                      ))}
                    </select>
                  )}

                  {selectedSourceType === 'APPLICANT' && (
                    <select
                      onChange={(e) => handleSelectApplicantSource(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      <option value="">-- เลือกผู้สมัครงานเพื่อดึงข้อมูล --</option>
                      {jobApplications.map(app => (
                        <option key={app.id} value={app.id}>
                          {app.fullName} (ตำแหน่ง {app.position} - {app.phoneNumber})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Section 1: ข้อมูลสัญญาและวันที่ */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>ข้อมูลสัญญา (Contract Details)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      เลขที่สัญญา <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={contractForm.contractNumber}
                      onChange={(e) => setContractForm({ ...contractForm, contractNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      วันที่ทำสัญญา <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={contractForm.contractDate}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        setContractForm({ ...contractForm, contractDate: newDate });
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    />
                    <div className="mt-1 text-[11px] text-slate-500">
                      แสดงในสัญญา: วันที่ {parseDateToThaiParts(contractForm.contractDate).day || '___'} เดือน {parseDateToThaiParts(contractForm.contractDate).month || '______'} พ.ศ. {parseDateToThaiParts(contractForm.contractDate).year || '______'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ประเภทสัญญาจ้าง <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={contractForm.contractType}
                      onChange={(e) => setContractForm({ ...contractForm, contractType: e.target.value as ContractType })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      <option value="PROBATION">สัญญาจ้างทดลองงาน (Probation)</option>
                      <option value="PERMANENT">สัญญาจ้างประจำ (Permanent)</option>
                      <option value="TEMPORARY">สัญญาจ้างชั่วคราว (Temporary)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: ข้อมูลลูกจ้าง และ สัญชาติ (ตรงตามแบบฟอร์ม PDF) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>ข้อมูลลูกจ้างและเอกสารประจำตัว (Employee Information & Identity)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อ - นามสกุลลูกจ้าง <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น นายสมศักดิ์ มั่งมี หรือ MR. AUNG MYINT"
                      value={contractForm.employeeName}
                      onChange={(e) => setContractForm({ ...contractForm, employeeName: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    />
                  </div>

                  {/* วัน เดือน ปีเกิด */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      วันเกิดของลูกจ้าง (ระบบแยก วัน/เดือน/ปี อัตโนมัติ)
                    </label>
                    <input
                      type="date"
                      value={contractForm.birthDate || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const { day, month, year } = parseDateToThaiParts(val);
                        setContractForm({
                          ...contractForm,
                          birthDate: val,
                          birthDay: day,
                          birthMonth: month,
                          birthYear: year
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                {/* แสดงผลแยก วัน เดือน ปีเกิด (สามารถปรับแก้ได้) */}
                <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">เกิดเมื่อวันที่</label>
                    <input
                      type="text"
                      placeholder="เช่น 15"
                      value={contractForm.birthDay || ''}
                      onChange={(e) => setContractForm({ ...contractForm, birthDay: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">เดือน</label>
                    <input
                      type="text"
                      placeholder="เช่น มกราคม"
                      value={contractForm.birthMonth || ''}
                      onChange={(e) => setContractForm({ ...contractForm, birthMonth: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">ปี (พ.ศ.)</label>
                    <input
                      type="text"
                      placeholder="เช่น 2540"
                      value={contractForm.birthYear || ''}
                      onChange={(e) => setContractForm({ ...contractForm, birthYear: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* ส่วนเลือกสัญชาติ และเอกสารประจำตัวตามที่ผู้ใช้กำหนด */}
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-amber-700" />
                      <span>สัญชาติและเอกสารประจำตัว (Nationality & Identity) <span className="text-rose-500">*</span></span>
                    </label>
                    <span className="text-[11px] text-amber-800 font-medium">เลือกรูปแบบเอกสารอัตโนมัติตามสัญญา</span>
                  </div>

                  {/* Radio buttons เลือกสัญชาติ */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label 
                      onClick={() => setContractForm({ ...contractForm, nationalityCategory: 'THAI' })}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                        contractForm.nationalityCategory === 'THAI'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-2xs font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="nationalityCategory" 
                        checked={contractForm.nationalityCategory === 'THAI'} 
                        onChange={() => setContractForm({ ...contractForm, nationalityCategory: 'THAI' })}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${contractForm.nationalityCategory === 'THAI' ? 'border-white' : 'border-slate-400'}`}>
                        {contractForm.nationalityCategory === 'THAI' && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs">( ) ไทย</span>
                    </label>

                    <label 
                      onClick={() => setContractForm({ ...contractForm, nationalityCategory: 'MYANMAR' })}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                        contractForm.nationalityCategory === 'MYANMAR'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-2xs font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="nationalityCategory" 
                        checked={contractForm.nationalityCategory === 'MYANMAR'} 
                        onChange={() => setContractForm({ ...contractForm, nationalityCategory: 'MYANMAR' })}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${contractForm.nationalityCategory === 'MYANMAR' ? 'border-white' : 'border-slate-400'}`}>
                        {contractForm.nationalityCategory === 'MYANMAR' && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs">( ) เมียนมา</span>
                    </label>

                    <label 
                      onClick={() => setContractForm({ ...contractForm, nationalityCategory: 'OTHER' })}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                        contractForm.nationalityCategory === 'OTHER'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-2xs font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="nationalityCategory" 
                        checked={contractForm.nationalityCategory === 'OTHER'} 
                        onChange={() => setContractForm({ ...contractForm, nationalityCategory: 'OTHER' })}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${contractForm.nationalityCategory === 'OTHER' ? 'border-white' : 'border-slate-400'}`}>
                        {contractForm.nationalityCategory === 'OTHER' && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs">( ) อื่น ๆ</span>
                    </label>
                  </div>

                  {/* ช่องกรอกข้อมูลตามสัญชาติที่เลือก */}
                  {contractForm.nationalityCategory === 'THAI' && (
                    <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        สัญชาติ ไทย ให้ใส่ บัตรประจำตัวประชาชน เลขที่ [__________]
                      </label>
                      <input
                        type="text"
                        placeholder="เลขประจำตัวประชาชน 13 หลัก เช่น 1-5099-01234-56-7"
                        value={contractForm.idCardNumber || ''}
                        onChange={(e) => setContractForm({ ...contractForm, idCardNumber: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                      />
                    </div>
                  )}

                  {contractForm.nationalityCategory === 'MYANMAR' && (
                    <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
                      <div className="text-xs font-bold text-slate-700">
                        สัญชาติ เมียนมา ให้ใส่ ใบอนุญาตทำงาน เลขที่ [__________] วันหมดอายุ [__________]
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                            ใบอนุญาตทำงาน เลขที่
                          </label>
                          <input
                            type="text"
                            placeholder="เลขที่ใบอนุญาตทำงาน (Work Permit No.)"
                            value={contractForm.workPermitNumber || ''}
                            onChange={(e) => setContractForm({ ...contractForm, workPermitNumber: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                            วันหมดอายุ
                          </label>
                          <input
                            type="date"
                            value={contractForm.workPermitExpiryDate || ''}
                            onChange={(e) => setContractForm({ ...contractForm, workPermitExpiryDate: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {contractForm.nationalityCategory === 'OTHER' && (
                    <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
                      <div className="text-xs font-bold text-slate-700">
                        สัญชาติ อื่น ๆ ระบุ [__________] เลขที่ [__________]
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                            ระบุสัญชาติ
                          </label>
                          <input
                            type="text"
                            placeholder="เช่น ลาว, กัมพูชา, อื่นๆ"
                            value={contractForm.otherNationalityText || ''}
                            onChange={(e) => setContractForm({ ...contractForm, otherNationalityText: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                            ใบอนุญาตทำงาน / เลขเอกสาร
                          </label>
                          <input
                            type="text"
                            placeholder="เลขที่เอกสาร"
                            value={contractForm.workPermitNumber || ''}
                            onChange={(e) => setContractForm({ ...contractForm, workPermitNumber: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                            วันหมดอายุ (ถ้ามี)
                          </label>
                          <input
                            type="date"
                            value={contractForm.workPermitExpiryDate || ''}
                            onChange={(e) => setContractForm({ ...contractForm, workPermitExpiryDate: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ที่อยู่ปัจจุบัน / ที่พักอาศัย
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น 123 หมู่ 4 ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200"
                      value={contractForm.address}
                      onChange={(e) => setContractForm({ ...contractForm, address: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      เบอร์โทรศัพท์ติดต่อ
                    </label>
                    <input
                      type="tel"
                      placeholder="08x-xxx-xxxx"
                      value={contractForm.phone}
                      onChange={(e) => setContractForm({ ...contractForm, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      สถานที่ปฏิบัติงาน / สาขา
                    </label>
                    <input
                      type="text"
                      value={contractForm.branch}
                      onChange={(e) => setContractForm({ ...contractForm, branch: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: แผนก กะการทำงาน และเวลาเข้า-ออกงาน (ตรงตามข้อ 4.2 ในสัญญา) */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>แผนก & กะการทำงาน (เวลาเข้างาน - ออกงาน ตามข้อ 4.2)</span>
                  </h4>
                  <span className="text-[11px] text-blue-700 font-medium">
                    ร้านหยุดทุกวันพฤหัสบดี (ทำงาน 6 วัน/สัปดาห์)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      แผนกงาน (Department) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={contractForm.department}
                      onChange={(e) => handleDepartmentChange(e.target.value as Department)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    >
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ตำแหน่งงาน (Position) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น พนักงานบริการหน้าร้าน หรือ ผู้ช่วยกุ๊ก"
                      value={contractForm.position}
                      onChange={(e) => setContractForm({ ...contractForm, position: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                {/* ตัวเลือกกะการทำงานตามแบบฟอร์มทางการข้อ 4.2 */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    เลือกกะการทำงานตามแบบสัญญาจ้าง (ข้อ 4.2):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setContractForm({
                        ...contractForm,
                        shiftOption: 'SHIFT_1',
                        shiftName: 'กะเช้า 1: เวลา 07.00 น. ถึง 16.00 น. (พัก 1 ชั่วโมง)',
                        startTime: '07:00',
                        endTime: '16:00',
                        breakMinutes: 60
                      })}
                      className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        contractForm.shiftOption === 'SHIFT_1'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">( ) กะเช้า 1</div>
                        <div className={`text-[11px] ${contractForm.shiftOption === 'SHIFT_1' ? 'text-blue-100' : 'text-slate-500'}`}>
                          เวลา 07.00 น. ถึง 16.00 น. (พัก 1 ชั่วโมง)
                        </div>
                      </div>
                      {contractForm.shiftOption === 'SHIFT_1' && <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setContractForm({
                        ...contractForm,
                        shiftOption: 'SHIFT_2',
                        shiftName: 'กะเช้า 2: เวลา 08.00 น. ถึง 17.00 น. (พัก 1 ชั่วโมง)',
                        startTime: '08:00',
                        endTime: '17:00',
                        breakMinutes: 60
                      })}
                      className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        contractForm.shiftOption === 'SHIFT_2'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">( ) กะเช้า 2</div>
                        <div className={`text-[11px] ${contractForm.shiftOption === 'SHIFT_2' ? 'text-blue-100' : 'text-slate-500'}`}>
                          เวลา 08.00 น. ถึง 17.00 น. (พัก 1 ชั่วโมง)
                        </div>
                      </div>
                      {contractForm.shiftOption === 'SHIFT_2' && <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setContractForm({
                        ...contractForm,
                        shiftOption: 'SHIFT_3',
                        shiftName: 'กะบ่าย: เวลา 12.00 น. ถึง 21.00 น. (พัก 1 ชั่วโมง)',
                        startTime: '12:00',
                        endTime: '21:00',
                        breakMinutes: 60
                      })}
                      className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        contractForm.shiftOption === 'SHIFT_3'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">( ) กะบ่าย</div>
                        <div className={`text-[11px] ${contractForm.shiftOption === 'SHIFT_3' ? 'text-blue-100' : 'text-slate-500'}`}>
                          เวลา 12.00 น. ถึง 21.00 น. (พัก 1 ชั่วโมง)
                        </div>
                      </div>
                      {contractForm.shiftOption === 'SHIFT_3' && <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setContractForm({
                        ...contractForm,
                        shiftOption: 'CUSTOM',
                        shiftName: 'เวลาอื่นตามที่ตกลง'
                      })}
                      className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        contractForm.shiftOption === 'CUSTOM'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">( ) เวลาอื่นตามที่ตกลง</div>
                        <div className={`text-[11px] ${contractForm.shiftOption === 'CUSTOM' ? 'text-blue-100' : 'text-slate-500'}`}>
                          กำหนดเวลาเข้างาน-ออกงานด้วยตนเอง
                        </div>
                      </div>
                      {contractForm.shiftOption === 'CUSTOM' && <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />}
                    </button>
                  </div>
                </div>

                {/* Custom Time Adjustments */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      เวลาเข้างาน
                    </label>
                    <input
                      type="time"
                      value={contractForm.startTime}
                      onChange={(e) => setContractForm({ ...contractForm, startTime: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-blue-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      เวลาออกงาน
                    </label>
                    <input
                      type="time"
                      value={contractForm.endTime}
                      onChange={(e) => setContractForm({ ...contractForm, endTime: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-blue-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      เวลาพัก (นาที)
                    </label>
                    <input
                      type="number"
                      value={contractForm.breakMinutes}
                      onChange={(e) => setContractForm({ ...contractForm, breakMinutes: Number(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      วันทำงาน/สัปดาห์
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="7"
                      value={contractForm.workDaysPerWeek}
                      onChange={(e) => setContractForm({ ...contractForm, workDaysPerWeek: Number(e.target.value) || 6 })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="text-xs text-blue-800 bg-blue-100/60 p-2.5 rounded-xl border border-blue-200">
                  <strong>วันหยุดประจำสัปดาห์:</strong> {contractForm.weeklyHoliday || 'วันศุกร์ถึงวันพุธ ร้านหยุดทุกวันพฤหัสบดี ซึ่งเป็นวันหยุดประจำสัปดาห์'}
                </div>
              </div>

              {/* Section 4: ค่าจ้างและการจ่ายเงิน (ข้อ 5 และ 6 ในสัญญา) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ค่าจ้างและวิธีการจ่ายเงิน (Remuneration & Payment - ข้อ 5 & 6)</span>
                </h4>

                {/* ตัวเลือกประเภทค่าจ้าง ( ) รายเดือน / ( ) รายวัน */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    รูปแบบค่าจ้าง (Wage Type) <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label 
                      onClick={() => setContractForm({ ...contractForm, salaryType: 'MONTHLY' })}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        contractForm.salaryType === 'MONTHLY'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input 
                          type="radio" 
                          name="salaryType" 
                          checked={contractForm.salaryType === 'MONTHLY'} 
                          onChange={() => setContractForm({ ...contractForm, salaryType: 'MONTHLY' })}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${contractForm.salaryType === 'MONTHLY' ? 'border-emerald-600' : 'border-slate-400'}`}>
                          {contractForm.salaryType === 'MONTHLY' && <div className="w-2 h-2 rounded-full bg-emerald-600" />}
                        </div>
                        <span className="text-xs">( ) รายเดือน: ในอัตราเดือนละ</span>
                      </div>
                      <input 
                        type="number"
                        placeholder="15,000"
                        value={contractForm.salary}
                        onChange={(e) => setContractForm({ ...contractForm, salary: Number(e.target.value) || 0, salaryType: 'MONTHLY' })}
                        className="w-28 px-2 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800 text-right"
                      />
                    </label>

                    <label 
                      onClick={() => setContractForm({ ...contractForm, salaryType: 'DAILY' })}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        contractForm.salaryType === 'DAILY'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input 
                          type="radio" 
                          name="salaryType" 
                          checked={contractForm.salaryType === 'DAILY'} 
                          onChange={() => setContractForm({ ...contractForm, salaryType: 'DAILY' })}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${contractForm.salaryType === 'DAILY' ? 'border-emerald-600' : 'border-slate-400'}`}>
                          {contractForm.salaryType === 'DAILY' && <div className="w-2 h-2 rounded-full bg-emerald-600" />}
                        </div>
                        <span className="text-xs">( ) รายวัน: ในอัตราวันละ</span>
                      </div>
                      <input 
                        type="number"
                        placeholder="400"
                        value={contractForm.dailyWage || 400}
                        onChange={(e) => setContractForm({ ...contractForm, dailyWage: Number(e.target.value) || 0, salaryType: 'DAILY' })}
                        className="w-28 px-2 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800 text-right"
                      />
                    </label>
                  </div>
                </div>

                {/* วิธีการจ่ายค่าจ้าง (ข้อ 6.2 ในสัญญา) */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>วิธีการจ่ายค่าจ้าง (ข้อ 6.2):</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label 
                      onClick={() => setContractForm({ ...contractForm, paymentMethod: 'BANK_TRANSFER' })}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                        contractForm.paymentMethod === 'BANK_TRANSFER'
                          ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        checked={contractForm.paymentMethod === 'BANK_TRANSFER'} 
                        onChange={() => setContractForm({ ...contractForm, paymentMethod: 'BANK_TRANSFER' })}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${contractForm.paymentMethod === 'BANK_TRANSFER' ? 'border-blue-600' : 'border-slate-400'}`}>
                        {contractForm.paymentMethod === 'BANK_TRANSFER' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                      </div>
                      <span className="text-xs">( ) โอนเข้าบัญชีเงินฝากธนาคารของลูกจ้าง</span>
                    </label>

                    <label 
                      onClick={() => setContractForm({ ...contractForm, paymentMethod: 'CASH' })}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                        contractForm.paymentMethod === 'CASH'
                          ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        checked={contractForm.paymentMethod === 'CASH'} 
                        onChange={() => setContractForm({ ...contractForm, paymentMethod: 'CASH' })}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${contractForm.paymentMethod === 'CASH' ? 'border-blue-600' : 'border-slate-400'}`}>
                        {contractForm.paymentMethod === 'CASH' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                      </div>
                      <span className="text-xs">( ) จ่ายเป็นเงินสด ณ สถานประกอบการของนายจ้าง</span>
                    </label>
                  </div>

                  {contractForm.paymentMethod === 'BANK_TRANSFER' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          ชื่อธนาคาร
                        </label>
                        <input
                          type="text"
                          placeholder="เช่น ธนาคารกสิกรไทย, ไทยพาณิชย์, กรุงเทพ"
                          value={contractForm.bankName || ''}
                          onChange={(e) => setContractForm({ ...contractForm, bankName: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          เลขที่บัญชี
                        </label>
                        <input
                          type="text"
                          placeholder="xxx-x-xxxxx-x"
                          value={contractForm.bankAccountNumber || ''}
                          onChange={(e) => setContractForm({ ...contractForm, bankAccountNumber: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      กำหนดวันจ่ายค่าจ้าง
                    </label>
                    <input
                      type="text"
                      value={contractForm.paymentDay}
                      onChange={(e) => setContractForm({ ...contractForm, paymentDay: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      วันเริ่มงาน (Start Date) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={contractForm.startDate}
                      onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ระยะเวลาทดลองงาน (วัน)
                    </label>
                    <input
                      type="number"
                      value={contractForm.probationDays}
                      onChange={(e) => setContractForm({ ...contractForm, probationDays: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-blue-700"
                    />
                  </div>
                </div>

                <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span><strong>สวัสดิการอาหาร (ข้อ 7):</strong> นายจ้างจัดอาหารให้แก่ลูกจ้างฟรี วันละ 1 มื้อ ในวันที่มีการปฏิบัติงาน</span>
                </div>
              </div>

              {/* Section 5: ภาคผนวก 1 คำบรรยายลักษณะงานและเกณฑ์ประเมิน */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ListOrdered className="w-3.5 h-3.5 text-blue-600" />
                    <span>ภาคผนวก 1: หน้าที่หลักและผู้บังคับบัญชา (Job Description)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">ขึ้นในภาคผนวก 1 ของสัญญาอัตโนมัติ</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ผู้บังคับบัญชาโดยตรง (Supervisor)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ผู้จัดการสาขา / หัวหน้าแผนกบริการ"
                    value={contractForm.supervisor || ''}
                    onChange={(e) => setContractForm({ ...contractForm, supervisor: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    หน้าที่และความรับผิดชอบหลัก (Main Duties & Responsibilities):
                  </label>
                  {[0, 1, 2, 3, 4].map(idx => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-6 text-xs font-bold text-slate-500 text-right">{idx + 1}.</span>
                      <input
                        type="text"
                        placeholder={`หน้าที่ข้อที่ ${idx + 1}`}
                        value={contractForm.mainDuties?.[idx] || ''}
                        onChange={(e) => {
                          const updated = [...(contractForm.mainDuties || ['', '', '', '', ''])];
                          updated[idx] = e.target.value;
                          setContractForm({ ...contractForm, mainDuties: updated });
                        }}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 6: สถานะและข้อกำหนดพิเศษ */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>สถานะและเงื่อนไขเพิ่มเติม</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      สถานะสัญญา
                    </label>
                    <select
                      value={contractForm.status}
                      onChange={(e) => setContractForm({ ...contractForm, status: e.target.value as ContractStatus })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      <option value="ACTIVE">มีผลบังคับใช้ (Active)</option>
                      <option value="DRAFT">ฉบับร่าง (Draft)</option>
                      <option value="TERMINATED">สิ้นสุดสัญญา (Terminated)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ข้อกำหนดหรือเงื่อนไขพิเศษเพิ่มเติม (ถ้ามี)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น สิทธิประโยชน์เบี้ยขยัน, ค่าที่พัก"
                      value={contractForm.specialTerms || ''}
                      onChange={(e) => setContractForm({ ...contractForm, specialTerms: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingContractId ? 'บันทึกการแก้ไข' : 'สร้างสัญญาจ้างงาน'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CONTRACT SETTINGS MODAL */}
      <ContractSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={onUpdateSettings}
      />

      {/* CONTRACT PREVIEW & PDF EXPORT MODAL */}
      <ContractPreviewPdfModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        contract={selectedPreviewContract}
        settings={settings}
      />

    </div>
  );
};
