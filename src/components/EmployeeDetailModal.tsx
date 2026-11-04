import React, { useState } from 'react';
import { 
  X, 
  User, 
  Globe2, 
  CalendarClock, 
  DollarSign, 
  ShieldAlert, 
  FileText, 
  Phone, 
  MapPin, 
  Briefcase, 
  Building2, 
  CheckCircle2, 
  AlertTriangle,
  Printer,
  Edit,
  Clock,
  UserMinus,
  Camera,
  Upload,
  Eye,
  Trash2,
  Download,
  CreditCard,
  ShieldCheck,
  ZoomIn,
  QrCode,
  History,
  FileCheck,
  Cake,
  ArrowRight
} from 'lucide-react';
import { Employee, WorkerDocument, AttendanceRecord } from '../types';
import { calculateEmployeePayroll, formatCurrency, getExpiryStatus, THAI_MONTHS } from '../utils/payrollCalculator';
import { showConfirmDialog, showToast } from '../utils/swal';
import { EmployeeQRCodeSection } from './EmployeeQRCodeSection';
import { EmployeeActivityTimeline } from './EmployeeActivityTimeline';
import { EmployeePrintProfileModal } from './EmployeePrintProfileModal';

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  attendanceRecords?: AttendanceRecord[];
  onEdit: (employee: Employee) => void;
  onResignToggle: (employee: Employee) => void;
  onUpdateEmployee?: (updated: Employee) => void;
  onOpenQuickAttendanceForm?: (employee: Employee) => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  isOpen,
  onClose,
  employee,
  attendanceRecords = [],
  onEdit,
  onResignToggle,
  onUpdateEmployee,
  onOpenQuickAttendanceForm,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'foreign' | 'documents' | 'attendance' | 'timeline' | 'warnings' | 'qrcode'>('info');
  const [previewImageModal, setPreviewImageModal] = useState<{ url: string; title: string } | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  if (!isOpen || !employee) return null;

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Combine documents from root and foreignDetails
  const allDocuments: WorkerDocument[] = [];
  const seenDocIds = new Set<string>();

  if (employee.documents) {
    employee.documents.forEach(d => {
      if (!seenDocIds.has(d.id)) {
        seenDocIds.add(d.id);
        allDocuments.push(d);
      }
    });
  }

  if (employee.foreignDetails?.documents) {
    employee.foreignDetails.documents.forEach(d => {
      if (!seenDocIds.has(d.id)) {
        seenDocIds.add(d.id);
        allDocuments.push(d);
      }
    });
  }

  // Handle mobile camera capture or file upload
  const handleAddNewDocument = (e: React.ChangeEvent<HTMLInputElement>, isCamera: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target?.result as string;
      const newDoc: WorkerDocument = {
        id: `doc-up-${Date.now()}`,
        type: employee.isForeignWorker ? 'OTHER' : 'ID_CARD',
        title: isCamera ? `รูปถ่ายเอกสารกล้อง (${new Date().toLocaleTimeString('th-TH')})` : file.name,
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadDate: new Date().toISOString().split('T')[0],
        isUploaded: true,
        fileUrl: dataUrl,
      };

      const updatedDocs = [newDoc, ...(employee.documents || [])];
      const updatedEmployee: Employee = {
        ...employee,
        documents: updatedDocs,
      };

      if (onUpdateEmployee) {
        onUpdateEmployee(updatedEmployee);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDocument = async (docId: string) => {
    const confirmed = await showConfirmDialog('ลบเอกสาร?', 'คุณต้องการลบเอกสารนี้ใช่หรือไม่?', 'ลบเอกสาร', 'ยกเลิก');
    if (!confirmed) return;
    const updatedDocs = (employee.documents || []).filter(d => d.id !== docId);
    const updatedEmployee: Employee = {
      ...employee,
      documents: updatedDocs,
    };
    if (onUpdateEmployee) {
      onUpdateEmployee(updatedEmployee);
      showToast('ลบเอกสารเรียบร้อยแล้ว');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header with Avatar & Basic status */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {employee.nickname ? employee.nickname.slice(0, 2) : employee.fullName.slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold tracking-tight">{employee.fullName}</h2>
                  {employee.nickname && (
                    <span className="text-sm px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md">
                      ({employee.nickname})
                    </span>
                  )}
                  {employee.isForeignWorker ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      {employee.nationalityText}
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                      สัญชาติไทย
                    </span>
                  )}
                  {employee.resignation.isResigned && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/40">
                      ลาออกแล้ว ({employee.resignation.resignationDate})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                  <span className="font-mono text-blue-400 font-semibold">{employee.id}</span>
                  <span>•</span>
                  <span>{employee.position}</span>
                  <span>•</span>
                  <span>{employee.department}</span>
                  {employee.branch && (
                    <>
                      <span>•</span>
                      <span className="text-slate-300">{employee.branch}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick action buttons in header */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border bg-white/10 hover:bg-white/20 text-white border-white/20 cursor-pointer shadow-2xs"
                title="พิมพ์แฟ้มประวัติพนักงานฉบับสรุป"
              >
                <Printer className="w-3.5 h-3.5 text-blue-300" />
                <span>พิมพ์ประวัติ</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                  activeTab === 'timeline'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>ไทม์ไลน์</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('qrcode')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                  activeTab === 'qrcode'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR บันทึกเวลา</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(employee);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>แก้ไข</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 sm:px-6 bg-slate-100 border-b border-slate-200 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            ข้อมูลทั่วไป
          </button>

          {employee.isForeignWorker && (
            <button
              onClick={() => setActiveTab('foreign')}
              className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
                activeTab === 'foreign'
                  ? 'border-amber-600 text-amber-900 bg-white shadow-2xs rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5 text-amber-600" />
              <span>ข้อมูลแรงงานต่างด้าว</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'documents'
                ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>เอกสารแนบ & รูปถ่าย</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
              {allDocuments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'attendance'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs rounded-t-lg font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            สถิติเข้างาน / ลา
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs rounded-t-lg font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-blue-600" />
            <span>ไทม์ไลน์กิจกรรม</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
              Timeline
            </span>
          </button>

          <button
            onClick={() => setActiveTab('qrcode')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'qrcode'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs rounded-t-lg font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-blue-600" />
            <span>QR Code บันทึกเวลา</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-700 font-bold">
              สแกน
            </span>
          </button>

          <button
            onClick={() => setActiveTab('warnings')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition flex items-center gap-1 ${
              activeTab === 'warnings'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>ประวัติตักเตือน</span>
            {employee.warnings && employee.warnings.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                {employee.warnings.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          
          {/* TAB 1: ข้อมูลทั่วไป */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>ข้อมูลส่วนตัว</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">เลขประจำตัว:</span>
                      <span className="font-mono font-bold text-slate-900">{employee.idCardNumber || employee.identificationNumber || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">ประเภทเอกสารประจำตัว:</span>
                      <span className="font-semibold text-slate-900">
                        {employee.identificationType === 'PINK_CARD' ? 'บัตรสีชมพู (คนไม่มีสัญชาติไทย)' :
                         employee.identificationType === 'PASSPORT' ? 'หนังสือเดินทาง (Passport)' :
                         employee.identificationType === 'OTHER' ? 'เอกสารประจำตัวอื่น ๆ' : 'บัตรประจำตัวประชาชนไทย'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">วันเกิด:</span>
                      <div className="text-right">
                        <span className="font-semibold text-slate-900">{employee.birthDate || '-'}</span>
                        {employee.birthdayNote && (
                          <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                            <Cake className="w-3 h-3 text-purple-600" />
                            <span>
                              {employee.birthdayNote.preparationStatus === 'COMPLETED' ? 'จัดกิจกรรมแล้ว' :
                               employee.birthdayNote.preparationStatus === 'READY' ? 'เตรียมพร้อม' :
                               employee.birthdayNote.preparationStatus === 'PREPARING' ? 'กำลังเตรียม' : 'รอดำเนินการ'}
                              {employee.birthdayNote.cakeFlavor ? ` • ${employee.birthdayNote.cakeFlavor}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">เบอร์โทรศัพท์:</span>
                      <span className="font-semibold text-slate-900">{employee.phoneNumber || '-'}</span>
                    </div>
                    <div className="py-1">
                      <span className="text-slate-500 block mb-0.5">ที่อยู่ในไทย:</span>
                      <span className="font-medium text-slate-900">{employee.address || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <span>ข้อมูลการทำงาน & ค่าตอบแทน</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">แผนก:</span>
                      <span className="font-semibold text-slate-900">{employee.department}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">สาขา / สถานที่ทำงาน:</span>
                      <span className="font-semibold text-slate-900">{employee.branch || 'สำนักงานใหญ่ (เชียงใหม่)'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">วันที่เริ่มงาน:</span>
                      <span className="font-semibold text-slate-900">{employee.startDate}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">ประเภทการจ้าง:</span>
                      <span className="font-semibold text-slate-900">
                        {employee.employmentType === 'FULL_TIME' ? 'พนักงานประจำ' :
                         employee.employmentType === 'PROBATION' ? 'ทดลองงาน (Probation)' :
                         employee.employmentType === 'CONTRACT' ? 'สัญญาจ้างตามระยะเวลา' : 'พนักงานรายวัน'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">เงินเดือนพื้นฐาน:</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(employee.salary)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">ค่าตำแหน่ง / เบี้ยเลี้ยง:</span>
                      <span className="font-mono font-bold text-emerald-600">+{formatCurrency(employee.allowance || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ข้อมูลบุคคลติดต่อฉุกเฉิน */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span>ผู้ติดต่อฉุกเฉิน (Emergency Contact)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">ชื่อผู้ติดต่อ:</span>
                    <strong className="text-slate-900">{employee.emergencyContact.name || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ความสัมพันธ์:</span>
                    <strong className="text-slate-900">{employee.emergencyContact.relationship || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">เบอร์ติดต่อ:</span>
                    <strong className="text-slate-900">{employee.emergencyContact.phone || '-'}</strong>
                  </div>
                </div>
              </div>

              {/* เช็คลิสต์เอกสารสำคัญของพนักงาน (Employee Documents Checklist) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-blue-600" />
                    <span>เช็คลิสต์เอกสารสำคัญประจำแฟ้มพนักงาน (Documents Checklist)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    ตรวจเช็คและบันทึกประวัติการส่งเอกสาร
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${employee.documentChecklist?.idCardCopy !== false ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span className={employee.documentChecklist?.idCardCopy !== false ? 'font-semibold text-slate-900' : 'text-slate-400'}>
                      สำเนาบัตรประชาชน / บัตรประจำตัว
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${employee.documentChecklist?.houseRegistrationCopy ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span className={employee.documentChecklist?.houseRegistrationCopy ? 'font-semibold text-slate-900' : 'text-slate-400'}>
                      สำเนาทะเบียนบ้าน
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${employee.documentChecklist?.photo !== false ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span className={employee.documentChecklist?.photo !== false ? 'font-semibold text-slate-900' : 'text-slate-400'}>
                      รูปถ่ายหน้าตรง
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${employee.documentChecklist?.resume ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span className={employee.documentChecklist?.resume ? 'font-semibold text-slate-900' : 'text-slate-400'}>
                      เรซูเม่ (Resume / CV)
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${employee.documentChecklist?.educationHistory ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span className={employee.documentChecklist?.educationHistory ? 'font-semibold text-slate-900' : 'text-slate-400'}>
                      ประวัติการศึกษา (บางตำแหน่ง)
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${employee.documentChecklist?.medicalCertificate ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span className={employee.documentChecklist?.medicalCertificate ? 'font-semibold text-slate-900' : 'text-slate-400'}>
                      ใบรับรองแพทย์
                    </span>
                  </div>

                  {employee.isForeignWorker && (
                    <>
                      <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200 flex items-center gap-2 sm:col-span-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="font-semibold text-amber-950">
                          สำเนาบัตร (บัตรสีชมพู หรือ บัตรสีขาว) / Passport / Visa
                        </span>
                      </div>

                      <div className="p-2.5 bg-sky-50 rounded-lg border border-sky-200 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                        <span className="font-bold text-sky-900">
                          {employee.isRenewingWorkPermit || employee.foreignDetails?.isRenewingWorkPermit 
                            ? 'กำลังต่อใบอนุญาตทำงาน (In Renewal)' 
                            : 'ใบอนุญาตทำงานปกติ'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* สถานะการลาออก */}
              {employee.resignation.isResigned && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                    <UserMinus className="w-4 h-4 text-rose-600" />
                    <span>ข้อมูลการพ้นสภาพพนักงาน (ลาออกแล้ว)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-rose-800">
                    <div>
                      <span className="text-rose-500 block">วันที่ลาออก:</span>
                      <strong>{employee.resignation.resignationDate}</strong>
                    </div>
                    <div>
                      <span className="text-rose-500 block">สาเหตุ:</span>
                      <strong>{employee.resignation.reason || 'ไม่ได้ระบุ'}</strong>
                    </div>
                    <div>
                      <span className="text-rose-500 block">ผู้รับส่งต่องาน:</span>
                      <strong>{employee.resignation.handedOverTo || '-'}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ข้อมูลแรงงานต่างด้าว (แสดงตามประเภทเอกสารที่เลือก) */}
          {activeTab === 'foreign' && employee.isForeignWorker && employee.foreignDetails && (
            <div className="space-y-6">
              
              {/* Type Badge Header */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-950">
                    ประเภทเอกสารประจำตัวหลัก:
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold">
                    {employee.foreignDetails.identificationType === 'PINK_CARD' ? 'บัตรประจำตัวคนซึ่งไม่มีสัญชาติไทย (บัตรสีชมพู)' :
                     employee.foreignDetails.identificationType === 'WHITE_CARD' ? 'บัตรประจำตัวคนไม่มีสถานะทางทะเบียน / 10 ปี (บัตรสีขาว)' :
                     employee.foreignDetails.identificationType === 'PASSPORT' ? 'หนังสือเดินทาง (Passport)' :
                     employee.foreignDetails.identificationType === 'OTHER' ? 'เอกสารประจำตัวประเภทอื่น' : 'ไม่มีเอกสารข้างต้น (รอดำเนินการ)'}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  สัญชาติ: <strong>{employee.foreignDetails.countryOfOrigin}</strong>
                </span>
              </div>

              {/* Detailed view for PINK_CARD or WHITE_CARD */}
              {(employee.foreignDetails.identificationType === 'PINK_CARD' || employee.foreignDetails.identificationType === 'WHITE_CARD' || employee.foreignDetails.pinkCardDetails) && employee.foreignDetails.pinkCardDetails && (
                <div className="p-4 bg-pink-50/40 rounded-xl border border-pink-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-pink-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-pink-600" />
                      <span>
                        รายละเอียด{employee.foreignDetails.identificationType === 'WHITE_CARD' || employee.foreignDetails.cardColor === 'WHITE' ? 'บัตรสีขาว (10 ปี / บุคคลไม่มีสถานะ)' : 'บัตรสีชมพู (คนซึ่งไม่มีสัญชาติไทย)'}
                      </span>
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 bg-pink-100 text-pink-900 rounded font-bold">
                      {employee.foreignDetails.identificationType === 'WHITE_CARD' || employee.foreignDetails.cardColor === 'WHITE' ? 'บัตรสีขาว' : 'บัตรสีชมพู'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">เลขประจำตัว 13 หลัก:</span>
                      <strong className="font-mono text-slate-900">{employee.foreignDetails.pinkCardDetails.idNumber13}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">ชื่อ–สกุลภาษาไทย:</span>
                      <strong className="text-slate-900">{employee.foreignDetails.pinkCardDetails.thaiFullName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">ชื่อ–สกุลภาษาอังกฤษ:</span>
                      <strong className="text-slate-900">{employee.foreignDetails.pinkCardDetails.englishFullName || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">วันเกิด:</span>
                      <strong className="text-slate-900">{employee.foreignDetails.pinkCardDetails.birthDate || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">วันออกบัตร:</span>
                      <strong className="text-slate-900">{employee.foreignDetails.pinkCardDetails.issueDate || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">วันหมดอายุบัตร:</span>
                      {(() => {
                        const stat = getExpiryStatus(employee.foreignDetails.pinkCardDetails.expiryDate);
                        return (
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-900">{employee.foreignDetails.pinkCardDetails.expiryDate}</strong>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${stat.badgeClass}`}>{stat.label}</span>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="sm:col-span-3">
                      <span className="text-slate-500 block">จังหวัด / หน่วยงานที่ออกบัตร:</span>
                      <strong className="text-slate-900">{employee.foreignDetails.pinkCardDetails.issuingProvinceOrOffice || '-'}</strong>
                    </div>
                  </div>

                  {/* Card Photos Preview */}
                  {(employee.foreignDetails.pinkCardDetails.frontCardImage || employee.foreignDetails.pinkCardDetails.backCardImage) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-pink-200">
                      {employee.foreignDetails.pinkCardDetails.frontCardImage && (
                        <div>
                          <span className="text-[11px] font-semibold text-slate-600 block mb-1">รูปบัตรด้านหน้า</span>
                          <div 
                            onClick={() => setPreviewImageModal({ url: employee.foreignDetails?.pinkCardDetails?.frontCardImage || '', title: 'บัตรสีชมพู (ด้านหน้า)' })}
                            className="cursor-pointer group relative rounded-lg overflow-hidden border border-slate-200 h-28 bg-slate-100 flex items-center justify-center hover:opacity-95"
                          >
                            <img src={employee.foreignDetails.pinkCardDetails.frontCardImage} alt="บัตรด้านหน้า" className="object-cover w-full h-full" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs gap-1 transition">
                              <ZoomIn className="w-4 h-4" /> ดูภาพขยาย
                            </div>
                          </div>
                        </div>
                      )}
                      {employee.foreignDetails.pinkCardDetails.backCardImage && (
                        <div>
                          <span className="text-[11px] font-semibold text-slate-600 block mb-1">รูปบัตรด้านหลัง</span>
                          <div 
                            onClick={() => setPreviewImageModal({ url: employee.foreignDetails?.pinkCardDetails?.backCardImage || '', title: 'บัตรสีชมพู (ด้านหลัง)' })}
                            className="cursor-pointer group relative rounded-lg overflow-hidden border border-slate-200 h-28 bg-slate-100 flex items-center justify-center hover:opacity-95"
                          >
                            <img src={employee.foreignDetails.pinkCardDetails.backCardImage} alt="บัตรด้านหลัง" className="object-cover w-full h-full" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs gap-1 transition">
                              <ZoomIn className="w-4 h-4" /> ดูภาพขยาย
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Detailed view for PASSPORT */}
              {employee.foreignDetails.identificationType === 'PASSPORT' && (
                <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-200 space-y-4">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>รายละเอียดหนังสือเดินทาง (Passport) & สิทธิการพำนัก</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">เลขที่ Passport:</span>
                      <strong className="font-mono text-slate-900">{employee.foreignDetails.passportNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">ชื่อตาม Passport:</span>
                      <strong className="text-slate-900">{employee.foreignDetails.passportFullName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">ประเทศผู้ออก / สัญชาติ:</span>
                      <strong className="text-slate-900">{employee.foreignDetails.countryOfOrigin}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">วันออก Passport:</span>
                      <strong className="text-slate-900">{employee.foreignDetails.passportIssueDate || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">วันหมดอายุ Passport:</span>
                      {(() => {
                        const stat = getExpiryStatus(employee.foreignDetails.passportExpiryDate);
                        return (
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-900">{employee.foreignDetails.passportExpiryDate}</strong>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${stat.badgeClass}`}>{stat.label}</span>
                          </div>
                        );
                      })()}
                    </div>
                    <div>
                      <span className="text-slate-500 block">Visa / สถานะการพำนัก:</span>
                      <strong className="text-slate-900">{employee.foreignDetails.visaType || 'MOU'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">วันหมดอายุสิทธิการพำนัก (Visa):</span>
                      {(() => {
                        const stat = getExpiryStatus(employee.foreignDetails.visaExpiryDate);
                        return (
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-900">{employee.foreignDetails.visaExpiryDate}</strong>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${stat.badgeClass}`}>{stat.label}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed view for OTHER */}
              {employee.foreignDetails.identificationType === 'OTHER' && employee.foreignDetails.otherDocDetails && (
                <div className="p-4 bg-purple-50/40 rounded-xl border border-purple-200 space-y-4">
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>เอกสารประจำตัวประเภทอื่น</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">ชื่อเอกสาร / ประเภทบัตร:</span>
                      <strong className="text-slate-900">{employee.foreignDetails.otherDocDetails.documentName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">เลขที่เอกสาร:</span>
                      <strong className="font-mono text-slate-900">{employee.foreignDetails.otherDocDetails.documentNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">วันออกเอกสาร:</span>
                      <strong className="text-slate-900">{employee.foreignDetails.otherDocDetails.issueDate || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">วันหมดอายุ:</span>
                      {(() => {
                        const stat = getExpiryStatus(employee.foreignDetails.otherDocDetails.expiryDate);
                        return (
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-900">{employee.foreignDetails.otherDocDetails.expiryDate}</strong>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${stat.badgeClass}`}>{stat.label}</span>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block">หน่วยงานที่ออก:</span>
                      <strong className="text-slate-900">{employee.foreignDetails.otherDocDetails.issuingAuthority || '-'}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Work Permit Details */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-amber-600" />
                    <span>ใบอนุญาตทำงาน (Work Permit)</span>
                  </h4>
                  {(() => {
                    const isRenewing = !!(
                      employee.foreignDetails.isRenewingWorkPermit || 
                      employee.foreignDetails.workPermitDetails?.isRenewing || 
                      employee.isRenewingWorkPermit || 
                      employee.documentChecklist?.isRenewingWorkPermit
                    );
                    const stat = getExpiryStatus(employee.foreignDetails.workPermitExpiryDate, isRenewing);
                    return (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${stat.badgeClass}`}>
                        {stat.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">เลขที่ใบอนุญาต:</span>
                    <strong className="font-mono text-slate-900">{employee.foreignDetails.workPermitNumber || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ตำแหน่งตามใบอนุญาต:</span>
                    <strong className="text-slate-900">{employee.foreignDetails.workPermitPosition || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">วันหมดอายุ:</span>
                    <strong className="text-slate-900">{employee.foreignDetails.workPermitExpiryDate || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ลักษณะงาน:</span>
                    <strong className="text-slate-900">{employee.foreignDetails.workPermitJobDescription || '-'}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block">สถานที่ทำงานตามใบอนุญาต:</span>
                    <strong className="text-slate-900">{employee.foreignDetails.workPermitWorkplace || '-'}</strong>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: เอกสารแนบ & รูปถ่าย (ATTACHED DOCUMENTS) with Camera capture */}
          {activeTab === 'documents' && (
            <div className="space-y-5">
              
              {/* Top Document Actions Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>รายการเอกสารแนบและรูปถ่ายในระบบ ({allDocuments.length} รายการ)</span>
                  </h4>
                  <p className="text-[11px] text-indigo-800 mt-0.5">
                    รองรับการถ่ายรูปด้วยกล้องมือถือหรืออัปโหลดไฟล์สำเนาเพื่อเก็บไว้ในประวัติ
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Camera button for mobile capture */}
                  <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs cursor-pointer transition">
                    <Camera className="w-4 h-4" />
                    <span>ถ่ายรูปด้วยกล้อง</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleAddNewDocument(e, true)}
                    />
                  </label>

                  {/* File upload button */}
                  <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg shadow-2xs cursor-pointer transition">
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>อัปโหลดไฟล์</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => handleAddNewDocument(e, false)}
                    />
                  </label>
                </div>
              </div>

              {/* Documents Grid / List */}
              {allDocuments.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-semibold">ยังไม่มีเอกสารแนบในระบบ</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    คลิก "ถ่ายรูปด้วยกล้อง" หรือ "อัปโหลดไฟล์" เพื่อเพิ่มเอกสารแรก
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {allDocuments.map((doc) => {
                    const isImg = !!doc.fileUrl || doc.fileName?.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/);
                    const expiryStat = doc.expiryDate ? getExpiryStatus(doc.expiryDate) : null;

                    return (
                      <div 
                        key={doc.id}
                        className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col hover:border-blue-300 transition"
                      >
                        {/* Thumbnail preview area */}
                        <div 
                          className="h-32 bg-slate-100 relative group flex items-center justify-center overflow-hidden cursor-pointer"
                          onClick={() => {
                            if (doc.fileUrl) {
                              setPreviewImageModal({ url: doc.fileUrl, title: doc.title });
                            }
                          }}
                        >
                          {doc.fileUrl ? (
                            <img src={doc.fileUrl} alt={doc.title} className="object-cover w-full h-full" />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400">
                              <FileText className="w-8 h-8 mb-1" />
                              <span className="text-[10px] font-mono">PDF / Document</span>
                            </div>
                          )}

                          {doc.fileUrl && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs gap-1.5 transition">
                              <Eye className="w-4 h-4" /> ดูตัวอย่าง
                            </div>
                          )}

                          <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-md bg-slate-900/80 text-white font-semibold">
                            {doc.type}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <h5 className="text-xs font-bold text-slate-900 line-clamp-1">{doc.title}</h5>
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">{doc.fileName || '-'}</p>
                            
                            {expiryStat && (
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <span className={`text-[10px] px-2 py-0.2 rounded-full border ${expiryStat.badgeClass}`}>
                                  หมดอายุ: {doc.expiryDate} ({expiryStat.label})
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span>{doc.uploadDate || 'เพิ่งเพิ่ม'}</span>
                            <div className="flex items-center gap-1">
                              {doc.fileUrl && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImageModal({ url: doc.fileUrl!, title: doc.title })}
                                  className="p-1 hover:bg-slate-100 text-blue-600 rounded"
                                  title="ขยายดูภาพ"
                                >
                                  <ZoomIn className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="p-1 hover:bg-red-50 text-red-500 rounded"
                                title="ลบเอกสาร"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* TAB 4: สถิติเข้างาน / ลา */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 text-xs text-blue-900">
                  <History className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>ต้องการดูบันทึกรายวัน, ประวัติการลาทุกครั้ง, การปรับตำแหน่ง หรือบันทึก HR ย้อนหลัง?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('timeline')}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>เปิดไทม์ไลน์กิจกรรม</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                ประวัติการปฏิบัติงานรายเดือน (ปี {currentYear})
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">เดือน</th>
                      <th className="p-3 text-center">ขาดงาน (วัน)</th>
                      <th className="p-3 text-center">ลาป่วย (วัน)</th>
                      <th className="p-3 text-center">ลากิจ (วัน)</th>
                      <th className="p-3 text-center">พักร้อน (วัน)</th>
                      <th className="p-3 text-center">มาสาย (ครั้ง/นาที)</th>
                      <th className="p-3 text-center">ชั่วโมง OT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employee.attendanceHistory && employee.attendanceHistory.length > 0 ? (
                      employee.attendanceHistory.map((att, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="p-3 font-semibold text-slate-900">{THAI_MONTHS[att.month - 1]}</td>
                          <td className={`p-3 text-center ${att.absentDays > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                            {att.absentDays}
                          </td>
                          <td className="p-3 text-center text-slate-700">{att.sickLeaveDays}</td>
                          <td className="p-3 text-center text-slate-700">{att.businessLeaveDays}</td>
                          <td className="p-3 text-center text-slate-700">{att.annualLeaveDays}</td>
                          <td className={`p-3 text-center ${att.lateCount > 0 ? 'text-amber-600 font-bold' : 'text-slate-500'}`}>
                            {att.lateCount} ({att.lateMinutes} น.)
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-blue-600">{att.otHours} ชม.</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-slate-400">ยังไม่มีบันทึกข้อมูลการเข้างาน</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: ไทม์ไลน์กิจกรรม (Activity Timeline) */}
          {activeTab === 'timeline' && (
            <EmployeeActivityTimeline
              employee={employee}
              attendanceRecords={attendanceRecords}
              onUpdateEmployee={onUpdateEmployee}
              onOpenQuickAttendanceForm={onOpenQuickAttendanceForm}
            />
          )}

          {/* TAB 5: ประวัติตักเตือน */}
          {activeTab === 'warnings' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                บันทึกการตักเตือนทางวินัย (Disciplinary Warnings)
              </h4>
              {employee.warnings && employee.warnings.length > 0 ? (
                <div className="space-y-3">
                  {employee.warnings.map((w) => (
                    <div key={w.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900">{w.level === 'VERBAL' ? 'ตักเตือนด้วยวาจา' : 'หนังสือเตือนเป็นลายลักษณ์อักษร'}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{w.date}</span>
                      </div>
                      <p className="text-xs text-slate-800 font-medium">{w.reason}</p>
                      <p className="text-[11px] text-slate-500">ผู้ออกใบเตือน: {w.issuedBy}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                  <span>พนักงานไม่มีประวัติตักเตือนทางวินัย การปฏิบัติงานเรียบร้อยดี</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: บัตรประจำตัว & QR Code บันทึกเวลา */}
          {activeTab === 'qrcode' && (
            <EmployeeQRCodeSection
              employee={employee}
              onOpenQuickAttendanceForm={(emp) => {
                if (onOpenQuickAttendanceForm) {
                  onOpenQuickAttendanceForm(emp);
                }
              }}
            />
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            onClick={() => onResignToggle(employee)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
              employee.resignation.isResigned
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            }`}
          >
            {employee.resignation.isResigned ? 'ยกเลิกสถานะลาออก (รับกลับเข้าทำงาน)' : 'บันทึกการพ้นสภาพพนักงาน (ลาออก)'}
          </button>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์ประวัติ (Print)</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>

      </div>

      {/* Lightbox Modal for Document Image Zoom */}
      {previewImageModal && (
        <div 
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPreviewImageModal(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl p-2 border border-slate-700 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-3 py-2 text-white border-b border-slate-800">
              <span className="text-xs font-bold">{previewImageModal.title}</span>
              <button 
                onClick={() => setPreviewImageModal(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[78vh] overflow-auto">
              <img 
                src={previewImageModal.url} 
                alt={previewImageModal.title} 
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* Simplified Print-Friendly Profile View Modal */}
      <EmployeePrintProfileModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        employee={employee}
        attendanceRecords={attendanceRecords}
      />

    </div>
  );
};
