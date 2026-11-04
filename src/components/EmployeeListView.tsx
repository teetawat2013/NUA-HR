import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  Globe2, 
  Eye, 
  Edit, 
  UserMinus, 
  DollarSign, 
  FileText, 
  AlertCircle, 
  Building2, 
  MapPin, 
  X, 
  Briefcase, 
  FileSpreadsheet, 
  Download, 
  ChevronDown,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { Employee, Department, EmploymentType, DEPARTMENTS, BRANCHES } from '../types';
import { formatCurrency, getExpiryStatus } from '../utils/payrollCalculator';
import { EmployeeCsvImportModal } from './EmployeeCsvImportModal';
import { 
  IMPORT_TEMPLATES, 
  generateCsvContent, 
  downloadCsvFile 
} from '../utils/employeeImportTemplates';

interface EmployeeListViewProps {
  employees: Employee[];
  onOpenAddModal: () => void;
  onEditEmployee: (employee: Employee) => void;
  onViewEmployee: (employee: Employee) => void;
  onQuickResign: (employee: Employee) => void;
  onBulkImportEmployees?: (newEmployees: Employee[]) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const EmployeeListView: React.FC<EmployeeListViewProps> = ({
  employees,
  onOpenAddModal,
  onEditEmployee,
  onViewEmployee,
  onQuickResign,
  onBulkImportEmployees,
  searchQuery,
  setSearchQuery,
}) => {
  // กรองเฉพาะพนักงานที่ยังไม่ลาออก
  const activeEmployees = employees.filter(e => !e.resignation.isResigned);

  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const templateMenuRef = useRef<HTMLDivElement>(null);
  const [nationalityFilter, setNationalityFilter] = useState<'ALL' | 'THAI' | 'FOREIGN'>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Close template menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (templateMenuRef.current && !templateMenuRef.current.contains(event.target as Node)) {
        setIsTemplateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickDownloadTemplate = (templateKey: keyof typeof IMPORT_TEMPLATES, withSamples: boolean = true) => {
    const tmpl = IMPORT_TEMPLATES[templateKey];
    const rows = withSamples ? tmpl.sampleRows : [];
    const csvContent = generateCsvContent(tmpl.headers, rows);
    const suffix = withSamples ? '' : '_blank';
    const filename = tmpl.filename.replace('.csv', `${suffix}.csv`);
    downloadCsvFile(csvContent, filename);
    setIsTemplateMenuOpen(false);
  };

  const filtered = activeEmployees.filter(emp => {
    // กรองตามสัญชาติ
    if (nationalityFilter === 'THAI' && emp.isForeignWorker) return false;
    if (nationalityFilter === 'FOREIGN' && !emp.isForeignWorker) return false;

    // กรองตามแผนก
    if (selectedDept !== 'ALL' && emp.department !== selectedDept) return false;

    // กรองตามสาขา
    if (selectedBranch !== 'ALL' && emp.branch !== selectedBranch) return false;

    // กรองตามสถานะการจ้างงาน
    if (selectedStatus !== 'ALL' && emp.employmentType !== selectedStatus) return false;

    // กรองตามข้อความค้นหา
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = emp.fullName.toLowerCase().includes(q);
      const matchNick = emp.nickname?.toLowerCase().includes(q);
      const matchId = emp.id.toLowerCase().includes(q);
      const matchPos = emp.position.toLowerCase().includes(q);
      const matchBranch = emp.branch?.toLowerCase().includes(q);
      const matchDept = emp.department.toLowerCase().includes(q);
      const matchIdCard = emp.idCardNumber?.toLowerCase().includes(q);
      const matchPassport = emp.foreignDetails?.passportNumber?.toLowerCase().includes(q);
      const matchPink = emp.foreignDetails?.pinkCardDetails?.idNumber13?.toLowerCase().includes(q);
      const matchWp = emp.foreignDetails?.workPermitNumber?.toLowerCase().includes(q);
      
      if (!matchName && !matchNick && !matchId && !matchPos && !matchBranch && !matchDept && !matchIdCard && !matchPassport && !matchPink && !matchWp) {
        return false;
      }
    }

    return true;
  });

  const allDepts = Array.from(new Set([...DEPARTMENTS, ...activeEmployees.map(e => e.department)]));
  const allBranches = Array.from(new Set([...BRANCHES, ...activeEmployees.map(e => e.branch || BRANCHES[0])]));

  const hasActiveFilters = nationalityFilter !== 'ALL' || selectedDept !== 'ALL' || selectedBranch !== 'ALL' || selectedStatus !== 'ALL' || searchQuery.trim() !== '';

  const clearAllFilters = () => {
    setNationalityFilter('ALL');
    setSelectedDept('ALL');
    setSelectedBranch('ALL');
    setSelectedStatus('ALL');
    setSearchQuery('');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>ฐานข้อมูลพนักงาน (Employee Directory)</span>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-semibold">
              {filtered.length} / {activeEmployees.length} คน
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ระบบสืบค้น กรองข้อมูลพนักงานตามแผนก สาขา สถานะการจ้างงาน และจัดการเอกสารแรงงานต่างด้าว
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Template Download Menu */}
          <div className="relative" ref={templateMenuRef}>
            <button
              onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs transition cursor-pointer"
              title="ดาวน์โหลดเทมเพลต CSV สำหรับเตรียมข้อมูลพนักงาน"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>เทมเพลต CSV</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isTemplateMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <p className="text-[11px] font-bold text-slate-800">เลือกดาวน์โหลดเทมเพลต (.CSV)</p>
                  <p className="text-[10px] text-slate-400">รองรับภาษาไทย UTF-8 เปิดใน Excel ได้ทันที</p>
                </div>

                <button
                  onClick={() => handleQuickDownloadTemplate('standard', true)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50/70 text-slate-700 hover:text-blue-700 transition flex items-start gap-2.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">เทมเพลตมาตรฐาน (Standard)</div>
                    <div className="text-[10px] text-slate-500">ครบทุก 17 คอลัมน์ แนะนำสำหรับการนำเข้าทั่วไป</div>
                  </div>
                </button>

                <button
                  onClick={() => handleQuickDownloadTemplate('thai', true)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50/70 text-slate-700 hover:text-blue-700 transition flex items-start gap-2.5 cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">เทมเพลตพนักงานไทย (Thai Staff)</div>
                    <div className="text-[10px] text-slate-500">14 คอลัมน์ เลขบัตร 13 หลัก ข้อมูลตามกฎหมายแรงงาน</div>
                  </div>
                </button>

                <button
                  onClick={() => handleQuickDownloadTemplate('foreign', true)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50/70 text-slate-700 hover:text-blue-700 transition flex items-start gap-2.5 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">เทมเพลตแรงงานต่างด้าว (Foreign)</div>
                    <div className="text-[10px] text-slate-500">พร้อมพาสปอร์ต & ใบอนุญาตทำงาน (Work Permit)</div>
                  </div>
                </button>

                <button
                  onClick={() => handleQuickDownloadTemplate('quick', true)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50/70 text-slate-700 hover:text-blue-700 transition flex items-start gap-2.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">เทมเพลตด่วนขั้นต่ำ (Quick Minimal)</div>
                    <div className="text-[10px] text-slate-500">6 คอลัมน์จำเป็น รหัส ชื่อ ตำแหน่ง แผนก สาขา เงินเดือน</div>
                  </div>
                </button>

                <div className="border-t border-slate-100 mt-1 pt-1 px-2">
                  <button
                    onClick={() => {
                      setIsTemplateMenuOpen(false);
                      setIsCsvImportOpen(true);
                    }}
                    className="w-full text-center py-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                  >
                    เปิดศูนย์เทมเพลตและนำเข้า...
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCsvImportOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>นำเข้าไฟล์ CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มพนักงานใหม่</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        
        {/* Row 1: Search & Nationality Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Nationality Tabs: ทั้งหมด / ไทย / ต่างด้าว */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold self-start">
            <button
              onClick={() => setNationalityFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                nationalityFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({activeEmployees.length})
            </button>
            <button
              onClick={() => setNationalityFilter('THAI')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
                nationalityFilter === 'THAI' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>สัญชาติไทย ({activeEmployees.filter(e => !e.isForeignWorker).length})</span>
            </button>
            <button
              onClick={() => setNationalityFilter('FOREIGN')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
                nationalityFilter === 'FOREIGN' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>แรงงานต่างด้าว ({activeEmployees.filter(e => e.isForeignWorker).length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ, รหัส, ตำแหน่ง, เลขบัตร/Passport..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
            />
          </div>
        </div>

        {/* Row 2: Advanced Dropdown Filters (Department, Branch, Status) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>กรองตาม:</span>
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">ทุกแผนก (Departments)</option>
            {allDepts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Branch Filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">ทุกสาขา (Branches)</option>
            {allBranches.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Status Filter (Active vs Probation etc) */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">สถานะการจ้างทั้งหมด</option>
            <option value="FULL_TIME">พนักงานประจำ (Full-Time)</option>
            <option value="PROBATION">ทดลองงาน (Probation)</option>
            <option value="CONTRACT">สัญญาจ้าง (Contract)</option>
            <option value="DAILY">พนักงานรายวัน (Daily)</option>
            <option value="PART_TIME">พาร์ทไทม์ (Part-Time)</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>ล้างตัวกรองทั้งหมด</span>
            </button>
          )}

          <div className="ml-auto text-[11px] text-slate-400">
            แสดงผล <strong>{filtered.length}</strong> รายการ
          </div>
        </div>

      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
            <tr>
              <th className="p-4">พนักงาน / รหัส</th>
              <th className="p-4">สัญชาติ / เอกสารประจำตัว</th>
              <th className="p-4">ตำแหน่ง / แผนก / สาขา</th>
              <th className="p-4">สถานะการจ้าง</th>
              <th className="p-4">วันที่เริ่มงาน / ติดต่อ</th>
              <th className="p-4">สถานะเอกสาร</th>
              <th className="p-4 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length > 0 ? (
              filtered.map((emp) => {
                const wpStat = emp.foreignDetails?.workPermitExpiryDate ? getExpiryStatus(emp.foreignDetails.workPermitExpiryDate) : null;
                const passStat = emp.foreignDetails?.passportExpiryDate ? getExpiryStatus(emp.foreignDetails.passportExpiryDate) : null;
                const pinkStat = emp.foreignDetails?.pinkCardDetails?.expiryDate ? getExpiryStatus(emp.foreignDetails.pinkCardDetails.expiryDate) : null;

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                    
                    {/* Name and ID */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                          {emp.nickname ? emp.nickname.slice(0, 2) : emp.fullName.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">
                            {emp.fullName}
                            {emp.nickname && <span className="text-slate-400 font-normal ml-1">({emp.nickname})</span>}
                          </p>
                          <p className="text-[11px] font-mono text-blue-600 font-semibold">{emp.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Nationality & ID Card */}
                    <td className="p-4">
                      {emp.isForeignWorker ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            {emp.nationalityText}
                          </span>
                          <p className="text-[11px] text-slate-600 font-mono">
                            {emp.foreignDetails?.identificationType === 'PINK_CARD'
                              ? `บัตรชมพู: ${emp.foreignDetails.pinkCardDetails?.idNumber13 || emp.idCardNumber}`
                              : emp.foreignDetails?.identificationType === 'PASSPORT'
                              ? `Pass: ${emp.foreignDetails.passportNumber}`
                              : emp.foreignDetails?.identificationType === 'OTHER'
                              ? `เอกสาร: ${emp.foreignDetails.otherDocDetails?.documentNumber || '-'}`
                              : 'รอดำเนินการ'}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            สัญชาติไทย
                          </span>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {emp.idCardNumber || '-'}
                          </p>
                        </div>
                      )}
                    </td>

                    {/* Position & Dept & Branch */}
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">{emp.position}</p>
                      <p className="text-[11px] text-slate-500">{emp.department}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{emp.branch || 'สำนักงานใหญ่ (เชียงใหม่)'}</span>
                      </p>
                    </td>

                    {/* Employment Status Badge */}
                    <td className="p-4">
                      {emp.employmentType === 'PROBATION' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          ทดลองงาน (Probation)
                        </span>
                      ) : emp.employmentType === 'FULL_TIME' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          พนักงานประจำ
                        </span>
                      ) : emp.employmentType === 'CONTRACT' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          สัญญาจ้าง
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                          รายวัน
                        </span>
                      )}
                    </td>

                    {/* Start Date & Contact */}
                    <td className="p-4 text-slate-800">
                      <span className="font-mono">{emp.startDate || '-'}</span>
                      <span className="block text-[10px] text-slate-400">
                        {emp.phoneNumber || '-'}
                      </span>
                    </td>

                    {/* Foreign Docs Status */}
                    <td className="p-4">
                      {emp.isForeignWorker && emp.foreignDetails ? (
                        <div className="space-y-1">
                          {pinkStat ? (
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${pinkStat.badgeClass}`}>
                              <span>บัตรชมพู: {pinkStat.label}</span>
                            </span>
                          ) : passStat ? (
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${passStat.badgeClass}`}>
                              <span>Pass: {passStat.label}</span>
                            </span>
                          ) : null}

                          {wpStat && (
                            <div className="block">
                              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${wpStat.badgeClass}`}>
                                <span>WP: {wpStat.label}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">ครบถ้วน</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onViewEmployee(emp)}
                          title="ดูรายละเอียดและเอกสารแนบ"
                          className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onEditEmployee(emp)}
                          title="แก้ไขข้อมูล"
                          className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onQuickResign(emp)}
                          title="บันทึกพ้นสภาพ (ลาออก)"
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-slate-700 text-sm">
                    {employees.length === 0 ? 'ยังไม่มีข้อมูลพนักงานในระบบ' : 'ไม่พบข้อมูลพนักงานที่ตรงกับเงื่อนไขการค้นหา'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {employees.length === 0 
                      ? 'เริ่มต้นด้วยการคลิกปุ่ม "เพิ่มพนักงานใหม่" เพื่อบันทึกประวัติพนักงานคนแรก' 
                      : 'ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง'}
                  </p>
                  {employees.length === 0 && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setIsCsvImportOpen(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold rounded-xl shadow-2xs transition"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span>นำเข้าไฟล์ CSV</span>
                      </button>
                      <button
                        onClick={onOpenAddModal}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>เพิ่มพนักงานใหม่</span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-3">
        {filtered.length > 0 ? (
          filtered.map((emp) => {
            const wpStat = emp.foreignDetails?.workPermitExpiryDate ? getExpiryStatus(emp.foreignDetails.workPermitExpiryDate) : null;

            return (
              <div
                key={emp.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                      {emp.nickname ? emp.nickname.slice(0, 2) : emp.fullName.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {emp.fullName}
                        {emp.nickname && <span className="text-slate-400 font-normal ml-1">({emp.nickname})</span>}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span className="font-mono text-blue-600 font-semibold">{emp.id}</span>
                        <span>•</span>
                        <span>{emp.position}</span>
                      </div>
                    </div>
                  </div>

                  {emp.isForeignWorker ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      {emp.nationalityText}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      สัญชาติไทย
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">แผนก & สาขา:</span>
                    <span className="font-medium text-slate-800 truncate block">{emp.department}</span>
                    <span className="text-[10px] text-slate-500">{emp.branch || 'สำนักงานใหญ่ (เชียงใหม่)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">สถานะ / วันเริ่มงาน:</span>
                    <span className="font-semibold text-slate-800 block">
                      {emp.employmentType === 'PROBATION' ? 'ทดลองงาน' : 'ประจำ'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {emp.startDate || '-'}
                    </span>
                  </div>
                </div>

                {wpStat && (
                  <div className="flex items-center justify-between text-[11px] px-2 py-1 bg-amber-50/70 rounded-lg border border-amber-100">
                    <span className="text-amber-900 font-medium">ใบอนุญาตทำงาน (WP):</span>
                    <span className={`px-2 py-0.2 rounded-full border text-[10px] ${wpStat.badgeClass}`}>
                      {wpStat.label}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => onViewEmployee(emp)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                    <span>ดูประวัติ/เอกสาร</span>
                  </button>

                  <button
                    onClick={() => onEditEmployee(emp)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">ไม่พบพนักงานตามเงื่อนไข</p>
          </div>
        )}
      </div>

      {/* Bulk CSV Import Modal */}
      <EmployeeCsvImportModal
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
        existingEmployees={employees}
        onImport={(imported) => {
          if (onBulkImportEmployees) {
            onBulkImportEmployees(imported);
          }
        }}
      />

    </div>
  );
};
