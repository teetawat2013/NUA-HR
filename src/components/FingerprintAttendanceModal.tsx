import React, { useState, useRef } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Clock, 
  User, 
  ArrowRight,
  TrendingDown,
  FileText,
  Search,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronRight,
  Check,
  Building2,
  CalendarCheck,
  Info
} from 'lucide-react';
import { Employee, MonthlyAttendance, AttendanceRecord } from '../types';
import { 
  FingerprintEmployeeSummary, 
  getSampleFingerprintData, 
  parseFingerprintExcelFile, 
  recalculateEmployeeAttendance, 
  exportAttendanceExcel, 
  exportAttendanceCsv,
  downloadFingerprintExcelTemplate
} from '../utils/fingerprintAttendanceParser';
import { showSuccessAlert, showToast } from '../utils/swal';

interface FingerprintAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onApplyAttendanceToSystem?: (
    employeeId: string, 
    month: number, 
    year: number, 
    stats: Partial<MonthlyAttendance>
  ) => void;
  onAddAttendanceRecord?: (record: Omit<AttendanceRecord, 'id' | 'recordedAt'>) => void;
}

export const FingerprintAttendanceModal: React.FC<FingerprintAttendanceModalProps> = ({
  isOpen,
  onClose,
  employees,
  onApplyAttendanceToSystem,
  onAddAttendanceRecord,
}) => {
  const [data, setData] = useState<FingerprintEmployeeSummary[]>(() => getSampleFingerprintData(employees));
  const [selectedEmpIndex, setSelectedEmpIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'leaveCalculate'>('summary');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentEmployee = data[selectedEmpIndex] || data[0];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadError(null);
    setSyncSuccessMsg(null);

    try {
      const parsed = await parseFingerprintExcelFile(file, employees);
      if (parsed && parsed.length > 0) {
        setData(parsed);
        setSelectedEmpIndex(0);
      } else {
        setUploadError('ไม่พบข้อมูลพนักงานในไฟล์ กรุณาตรวจสอบรูปแบบไฟล์ Excel หรือใช้ข้อมูลตัวอย่าง');
      }
    } catch (err: any) {
      console.error('Failed to parse fingerprint file:', err);
      setUploadError(err.message || 'ไม่สามารถอ่านไฟล์ได้ โปรดใช้ไฟล์ .xlsx, .xls หรือ .csv ที่ถูกต้อง');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadSample = () => {
    const sample = getSampleFingerprintData(employees);
    setData(sample);
    setSelectedEmpIndex(0);
    setUploadError(null);
    setSyncSuccessMsg('โหลดข้อมูลตัวอย่างจากแบบฟอร์มสแกนนิ้วเรียบร้อย (FRONT1 pon, KITCHEN1 VAVA, KITCHEN1 PAT)');
    setTimeout(() => setSyncSuccessMsg(null), 4000);
  };

  // เปลี่ยนสถานะวันขาด ให้กลายเป็นวันลา (คำนวณวันลาอัตโนมัติ)
  const handleToggleDayLeave = (dayNumber: number, leaveType: 'SICK' | 'BUSINESS' | 'ANNUAL' | 'OTHER' = 'SICK') => {
    if (!currentEmployee) return;

    const currentLog = currentEmployee.dailyLogs.find(l => l.dayNumber === dayNumber);
    if (!currentLog) return;

    const newLogs = currentEmployee.dailyLogs.map(log => {
      if (log.dayNumber === dayNumber) {
        if (log.status === 'LEAVE') {
          // สลับกลับเป็น ขาดงาน
          return {
            ...log,
            status: 'ABSENT' as const,
            leaveType: undefined,
            clockIn: 'ขาด',
            clockOut: 'ขาด',
            notes: 'ขาดงาน',
          };
        } else {
          // เปลี่ยนเป็น ลางาน
          return {
            ...log,
            status: 'LEAVE' as const,
            leaveType,
            clockIn: 'ลา',
            clockOut: 'ลา',
            notes: `ขอลางาน (${leaveType === 'SICK' ? 'ลาป่วย' : leaveType === 'BUSINESS' ? 'ลากิจ' : 'ลาพักร้อน'})`,
          };
        }
      }
      return log;
    });

    const daysWorked = newLogs.filter(l => l.status === 'WORKED').length;
    const leaveDays = newLogs.filter(l => l.status === 'LEAVE').length;
    const absentDays = newLogs.filter(l => l.status === 'ABSENT' && !l.isThursdayDayOff).length;

    const updatedEmp: FingerprintEmployeeSummary = {
      ...currentEmployee,
      daysWorked,
      leaveDays,
      absentDays,
      dailyLogs: newLogs,
    };

    setData(prev => prev.map((item, idx) => idx === selectedEmpIndex ? updatedEmp : item));
  };

  // นำผลการคำนวณสถิติเข้าสู่ระบบ Nua HRM Pro
  const handleSyncAllToSystem = () => {
    if (!onApplyAttendanceToSystem) {
      showSuccessAlert('บันทึกสำเร็จ', 'บันทึกสำเร็จ (โหมดดูข้อมูล)');
      return;
    }

    let syncedCount = 0;
    data.forEach(item => {
      // ค้นหาพนักงานที่ตรงกัน
      const targetEmp = item.matchedEmployee || employees.find(e => 
        e.id === item.id || 
        e.id.includes(item.id) ||
        e.fullName.toLowerCase().includes(item.name.toLowerCase())
      );

      if (targetEmp) {
        // งวดเดือนกันยายน 2026 (ตามภาพสแกนนิ้ว)
        onApplyAttendanceToSystem(targetEmp.id, 9, 2026, {
          absentDays: item.absentDays,
          sickLeaveDays: item.dailyLogs.filter(l => l.status === 'LEAVE' && l.leaveType === 'SICK').length,
          businessLeaveDays: item.dailyLogs.filter(l => l.status === 'LEAVE' && l.leaveType === 'BUSINESS').length,
          annualLeaveDays: item.dailyLogs.filter(l => l.status === 'LEAVE' && l.leaveType === 'ANNUAL').length,
          otherLeaveDays: item.dailyLogs.filter(l => l.status === 'LEAVE' && l.leaveType === 'OTHER').length,
          lateCount: item.lateCount,
          lateMinutes: item.lateMinutes,
          otHours: item.otHours,
        });

        if (onAddAttendanceRecord) {
          // เพิ่มบันทึกเหตุการณ์สรุป
          onAddAttendanceRecord({
            employeeId: targetEmp.id,
            employeeName: targetEmp.fullName,
            department: targetEmp.department,
            type: 'ABSENT',
            date: '2026-09-30',
            amount: item.absentDays,
            reason: `นำเข้าจากระบบสแกนนิ้ว: เข้างาน ${item.daysWorked} วัน, ลา ${item.leaveDays} วัน, ขาด ${item.absentDays} วัน`,
          });
        }
        syncedCount++;
      }
    });

    setSyncSuccessMsg(`อัปเดตสถิติเข้าสู่ระบบสำเร็จ ${syncedCount} พนักงาน (เชื่อมต่อไปยังตารางสรุปเงินเดือน Payroll เรียบร้อย)`);
    setTimeout(() => setSyncSuccessMsg(null), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  นำเข้าไฟล์สแกนนิ้ว & คำนวณวันลา (Fingerprint Attendance Import)
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Excel & CSV
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                รองรับฟอร์มสแกนนิ้ว (ตารางการเข้าร่วม), คำนวณวันเข้างาน วันลา วันขาด และส่งออกเป็น Excel/CSV ได้ทันที
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* Left Actions: Upload & Load Sample */}
          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer transition">
              <Upload className="w-3.5 h-3.5" />
              <span>เลือกไฟล์ Excel / CSV</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={handleLoadSample}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-2xs"
              title="โหลดข้อมูลตัวอย่างจากฟอร์มจริงในภาพ (FRONT1 pon, KITCHEN1 VAVA, PAT)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>โหลดตัวอย่างตามภาพ (3 พนักงาน)</span>
            </button>

            <button
              onClick={() => downloadFingerprintExcelTemplate()}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>ดาวน์โหลดเทมเพลต Excel</span>
            </button>
          </div>

          {/* Right Actions: Export & Sync */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => exportAttendanceExcel(data)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>ส่งออกเป็น EXCEL (.xlsx)</span>
            </button>

            <button
              onClick={() => exportAttendanceCsv(data)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>ส่งออกเป็น CSV</span>
            </button>

            <button
              onClick={handleSyncAllToSystem}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#8B1C2D] hover:bg-[#701523] text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#F0E7C2]" />
              <span>อัปเดตเข้าสู่ระบบ Nua HRM Pro</span>
            </button>
          </div>

        </div>

        {/* Notifications */}
        {uploadError && (
          <div className="mx-5 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {syncSuccessMsg && (
          <div className="mx-5 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{syncSuccessMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Summary Strip (Employees Overview) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>รายชื่อพนักงานที่พบในไฟล์สแกนนิ้ว ({data.length} คน)</span>
                  <span className="text-[11px] font-normal text-slate-500 font-mono">
                    งวด: {data[0]?.period || '2026-09-01 ~ 2026-09-30'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  คลิกที่พนักงานเพื่อดูรายละเอียดตารางเข้างาน 30 วัน และคลิกเปลี่ยนวันขาดเป็นวันลาเพื่อคำนวณวันลา
                </p>
              </div>

              {/* Sub-tabs */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`px-3 py-1 rounded-md font-bold transition ${activeTab === 'summary' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  ตารางสรุป
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-3 py-1 rounded-md font-bold transition ${activeTab === 'details' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  ตาราง 30 วัน (รายบุคคล)
                </button>
                <button
                  onClick={() => setActiveTab('leaveCalculate')}
                  className={`px-3 py-1 rounded-md font-bold transition ${activeTab === 'leaveCalculate' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  เครื่องมือคำนวณวันลา
                </button>
              </div>
            </div>

            {/* Employee Quick Select Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {data.map((emp, idx) => {
                const isSelected = selectedEmpIndex === idx;
                return (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedEmpIndex(idx)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-blue-50/80 border-blue-600 shadow-xs' 
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-sm">{emp.name}</span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            ID: {emp.id}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          แผนก: {emp.department}
                        </span>
                      </div>

                      {emp.matchedEmployee ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>ตรงในระบบ</span>
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                          พนักงานใหม่
                        </span>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 grid grid-cols-3 gap-1 text-[11px] text-center">
                      <div className="bg-blue-50/60 p-1 rounded">
                        <span className="text-slate-400 block text-[9px]">เข้างาน</span>
                        <strong className="text-blue-900">{emp.daysWorked} วัน</strong>
                      </div>
                      <div className="bg-amber-50/60 p-1 rounded">
                        <span className="text-slate-400 block text-[9px]">ขอลางาน</span>
                        <strong className="text-amber-800">{emp.leaveDays} วัน</strong>
                      </div>
                      <div className="bg-rose-50/60 p-1 rounded">
                        <span className="text-slate-400 block text-[9px]">ขาดงาน</span>
                        <strong className="text-rose-700">{emp.absentDays} วัน</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TAB 1: Summary Table */}
          {activeTab === 'summary' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  ตารางสรุปสถิติเวลาทำงาน ขาด ลา มาสาย และ OT รวมทั้งสิ้น
                </span>
                <span className="text-[11px] text-slate-500">
                  คำนวณตามสูตร: ขาดงาน = วันทำการที่ไม่ได้มาสแกนนิ้ว (ยกเว้นวันพฤหัสบดี)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 uppercase">
                    <tr>
                      <th className="p-3">ไอดี</th>
                      <th className="p-3">ชื่อพนักงาน</th>
                      <th className="p-3">แผนก</th>
                      <th className="p-3 text-center bg-blue-50/40">การเข้างาน (วัน)</th>
                      <th className="p-3 text-center bg-amber-50/40">การขอลางาน (วัน)</th>
                      <th className="p-3 text-center bg-rose-50/40">การขาดงาน (วัน)</th>
                      <th className="p-3 text-center">มาสาย (ครั้ง/นาที)</th>
                      <th className="p-3 text-center">ออกก่อน (ครั้ง/นาที)</th>
                      <th className="p-3 text-center">OT ล่วงเวลา</th>
                      <th className="p-3 text-center">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.map((emp, idx) => (
                      <tr 
                        key={emp.id} 
                        className={`hover:bg-slate-50/80 transition ${selectedEmpIndex === idx ? 'bg-blue-50/30' : ''}`}
                      >
                        <td className="p-3 font-mono font-bold text-blue-700">{emp.id}</td>
                        <td className="p-3 font-semibold text-slate-900">{emp.name}</td>
                        <td className="p-3 text-slate-600">{emp.department}</td>
                        <td className="p-3 text-center font-bold text-blue-800 bg-blue-50/20">{emp.daysWorked} วัน</td>
                        <td className="p-3 text-center font-bold text-amber-700 bg-amber-50/20">
                          {emp.leaveDays > 0 ? `${emp.leaveDays} วัน` : '0 วัน'}
                        </td>
                        <td className="p-3 text-center font-bold text-rose-600 bg-rose-50/20">{emp.absentDays} วัน</td>
                        <td className="p-3 text-center">
                          {emp.lateCount > 0 ? (
                            <span className="font-semibold text-amber-700">
                              {emp.lateCount} ครั้ง ({emp.lateMinutes} นาที)
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {emp.earlyLeaveCount > 0 ? (
                            <span className="text-orange-700 font-semibold">
                              {emp.earlyLeaveCount} ครั้ง ({emp.earlyLeaveMinutes} นาที)
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center text-slate-700">{emp.otHours > 0 ? `${emp.otHours} ชม.` : '-'}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedEmpIndex(idx);
                              setActiveTab('details');
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-blue-700 rounded-lg font-bold transition inline-flex items-center gap-1"
                          >
                            <span>ดูตาราง 30 วัน</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Daily 30-Day Punch Matrix (as in the screenshot) */}
          {activeTab === 'details' && currentEmployee && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                    {currentEmployee.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>แบบฟอร์มตรวจสอบการเข้างาน: {currentEmployee.name}</span>
                      <span className="text-xs font-normal text-slate-500 font-mono">(ID: {currentEmployee.id})</span>
                    </h4>
                    <span className="text-xs text-slate-500">
                      แผนก: {currentEmployee.department} • ช่วงวันที่ {currentEmployee.period}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>
                    คลิกปุ่ม <strong>"เปลี่ยนเป็นวันลา"</strong> ในแถววันขาด เพื่อคำนวณหักลบวันลาอัตโนมัติ
                  </span>
                </div>
              </div>

              {/* 30-day rows matrix */}
              <div className="overflow-x-auto max-h-[460px] border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">วันที่/วัน</th>
                      <th className="p-2.5">เวลาเริ่มงาน (เข้า)</th>
                      <th className="p-2.5">เวลาเลิกงาน (ออก)</th>
                      <th className="p-2.5">สถานะ</th>
                      <th className="p-2.5">มาสาย (นาที)</th>
                      <th className="p-2.5">ออกก่อน (นาที)</th>
                      <th className="p-2.5">หมายเหตุ</th>
                      <th className="p-2.5 text-center">ปรับสถานะวันลา</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentEmployee.dailyLogs.map(log => {
                      const isWorked = log.status === 'WORKED';
                      const isLeave = log.status === 'LEAVE';
                      const isAbsent = log.status === 'ABSENT';
                      const isDayOff = log.isThursdayDayOff;

                      return (
                        <tr 
                          key={log.dayNumber} 
                          className={`hover:bg-slate-50 transition ${
                            isDayOff 
                              ? 'bg-purple-50/30' 
                              : isWorked 
                              ? 'bg-emerald-50/20' 
                              : isLeave 
                              ? 'bg-amber-50/30' 
                              : 'bg-white'
                          }`}
                        >
                          <td className="p-2.5 font-bold text-slate-800">
                            {log.dayLabel}
                            {isDayOff && (
                              <span className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-normal">
                                วันหยุดสัปดาห์
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-mono">
                            <span className={isWorked ? 'text-slate-900 font-semibold' : isLeave ? 'text-amber-700 font-semibold' : 'text-rose-500'}>
                              {log.clockIn}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono">
                            <span className={isWorked ? 'text-slate-900 font-semibold' : isLeave ? 'text-amber-700 font-semibold' : 'text-rose-500'}>
                              {log.clockOut}
                            </span>
                          </td>
                          <td className="p-2.5">
                            {isWorked && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                เข้างานปกติ
                              </span>
                            )}
                            {isLeave && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                ขอลางาน ({log.leaveType === 'SICK' ? 'ลาป่วย' : log.leaveType === 'BUSINESS' ? 'ลากิจ' : 'ลาพักร้อน'})
                              </span>
                            )}
                            {isAbsent && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                ขาดงาน
                              </span>
                            )}
                            {log.status === 'DAY_OFF' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                                วันหยุด
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-600 font-mono">
                            {log.lateMinutes > 0 ? (
                              <span className="text-amber-700 font-bold">+{log.lateMinutes} น.</span>
                            ) : '-'}
                          </td>
                          <td className="p-2.5 text-slate-600 font-mono">
                            {log.earlyMinutes > 0 ? (
                              <span className="text-orange-700 font-bold">-{log.earlyMinutes} น.</span>
                            ) : '-'}
                          </td>
                          <td className="p-2.5 text-slate-500 text-[11px]">{log.notes || '-'}</td>
                          <td className="p-2.5 text-center">
                            {!isWorked && !isDayOff && (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleDayLeave(log.dayNumber, 'SICK')}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition border ${
                                    isLeave && log.leaveType === 'SICK'
                                      ? 'bg-amber-600 text-white border-amber-600'
                                      : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                                  }`}
                                >
                                  {isLeave ? 'ยกเลิกวันลา' : 'ลาป่วย'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleDayLeave(log.dayNumber, 'BUSINESS')}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition border ${
                                    isLeave && log.leaveType === 'BUSINESS'
                                      ? 'bg-sky-600 text-white border-sky-600'
                                      : 'bg-white text-sky-800 border-sky-200 hover:bg-sky-50'
                                  }`}
                                >
                                  ลากิจ
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Leave Calculation Tool */}
          {activeTab === 'leaveCalculate' && (
            <div className="bg-indigo-50/60 p-5 rounded-2xl border border-indigo-200 space-y-4">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-indigo-700" />
                <h4 className="text-sm font-bold text-indigo-950">
                  เครื่องมือคำนวณวันขอลางานอัตโนมัติ (Automated Leave Calculation)
                </h4>
              </div>
              <p className="text-xs text-indigo-800 leading-relaxed">
                ระบบคำนวณวันลาจากรายการสแกนนิ้ว โดยเทียบวันขาดงานในงวดเดือน และหักวันหยุดประจำสัปดาห์ (ทุกวันพฤหัสบดี) 
                ออกจากการขาดงาน พร้อมคำนวณค่าล่วงเวลา OT และส่งต่อไปยังระบบเงินเดือน Payroll อัตโนมัติ
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
                  <span className="text-[11px] text-slate-500 block mb-1">วันทำงานจริงเฉลี่ย</span>
                  <span className="text-xl font-black text-indigo-900">
                    {(data.reduce((s, i) => s + i.daysWorked, 0) / (data.length || 1)).toFixed(1)} วัน
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
                  <span className="text-[11px] text-slate-500 block mb-1">วันลาที่บันทึกแล้ว</span>
                  <span className="text-xl font-black text-amber-700">
                    {data.reduce((s, i) => s + i.leaveDays, 0)} วัน
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
                  <span className="text-[11px] text-slate-500 block mb-1">วันขาดงานสุทธิ</span>
                  <span className="text-xl font-black text-rose-700">
                    {data.reduce((s, i) => s + i.absentDays, 0)} วัน
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => exportAttendanceExcel(data, `สรุปสถิติสแกนนิ้ว_${data[0]?.name || 'พนักงาน'}.xlsx`)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>ส่งออกผลการคำนวณเป็น Excel</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Nua HRM Pro • ระบบประมวลผลข้อมูลเครื่องสแกนลายนิ้วมือและบัตรทาบเข้างาน
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
