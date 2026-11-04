import React from 'react';
import { 
  X, 
  Printer, 
  Building2, 
  User, 
  Calendar, 
  Clock, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  FileText, 
  Globe2, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Award,
  CreditCard,
  Briefcase
} from 'lucide-react';
import { Employee, WorkerDocument, MonthlyAttendance, AttendanceRecord } from '../types';
import { formatCurrency, THAI_MONTHS } from '../utils/payrollCalculator';

interface EmployeePrintProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  attendanceRecords?: AttendanceRecord[];
}

export const EmployeePrintProfileModal: React.FC<EmployeePrintProfileModalProps> = ({
  isOpen,
  onClose,
  employee,
  attendanceRecords = [],
}) => {
  if (!isOpen || !employee) return null;

  const handlePrint = () => {
    window.print();
  };

  // Format Thai Date string
  const formatThaiDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate();
      const month = THAI_MONTHS[d.getMonth()];
      const year = d.getFullYear() + 543;
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  // Calculate Age
  const calculateAge = (birthDateStr?: string) => {
    if (!birthDateStr) return '-';
    try {
      const birth = new Date(birthDateStr);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return age > 0 ? `${age} ปี` : '-';
    } catch {
      return '-';
    }
  };

  // Calculate Length of Service (อายุงาน)
  const calculateServiceLength = (startDateStr?: string) => {
    if (!startDateStr) return '-';
    try {
      const start = new Date(startDateStr);
      const end = employee.resignation.isResigned && employee.resignation.resignationDate 
        ? new Date(employee.resignation.resignationDate) 
        : new Date();
      
      let years = end.getFullYear() - start.getFullYear();
      let months = end.getMonth() - start.getMonth();
      if (months < 0) {
        years--;
        months += 12;
      }
      if (years > 0 && months > 0) return `${years} ปี ${months} เดือน`;
      if (years > 0) return `${years} ปี`;
      return `${Math.max(months, 0)} เดือน`;
    } catch {
      return '-';
    }
  };

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

  // Calculate Cumulative Attendance Stats
  const history = employee.attendanceHistory || [];
  const totalAbsentDays = history.reduce((acc, h) => acc + (h.absentDays || 0), 0);
  const totalSickDays = history.reduce((acc, h) => acc + (h.sickLeaveDays || 0), 0);
  const totalBusinessDays = history.reduce((acc, h) => acc + (h.businessLeaveDays || 0), 0);
  const totalAnnualDays = history.reduce((acc, h) => acc + (h.annualLeaveDays || 0), 0);
  const totalOtherLeaveDays = history.reduce((acc, h) => acc + (h.otherLeaveDays || 0), 0);
  const totalLateCount = history.reduce((acc, h) => acc + (h.lateCount || 0), 0);
  const totalLateMinutes = history.reduce((acc, h) => acc + (h.lateMinutes || 0), 0);
  const totalOtHours = history.reduce((acc, h) => acc + (h.otHours || 0), 0);
  const totalWarnings = history.reduce((acc, h) => acc + (h.warningCount || 0), 0);

  const printTimestamp = new Date().toLocaleString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      
      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Action Toolbar Header (Hidden during Print) */}
        <div className="no-print px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">
                ตัวอย่างก่อนพิมพ์แฟ้มประวัติพนักงาน (Print-Friendly Profile View)
              </h3>
              <p className="text-[11px] text-slate-400">
                เอกสารสรุปประวัติพนักงาน ข้อมูลการจ้างงาน เอกสารสำคัญ และสรุปเวลาทำงาน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>สั่งพิมพ์เอกสาร (Print)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-800 font-sans print:p-0 print:m-0 print:overflow-visible">
          
          {/* Printable Sheet */}
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Document Header & Company Branding */}
            <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                    HR
                  </div>
                  <div>
                    <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                      บริษัท เอชอาร์เอ็ม โปร จำกัด (HRM PRO CO., LTD.)
                    </h1>
                    <p className="text-[11px] text-slate-500">
                      ระบบบริหารทรัพยากรบุคคลและแฟ้มประวัติพนักงานแบบรวมศูนย์
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                  <p>สาขาปฏิบัติงาน: {employee.branch || 'สำนักงานใหญ่ (เชียงใหม่)'}</p>
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded">
                  แฟ้มประวัติพนักงาน
                </span>
                <p className="text-[11px] font-semibold text-slate-700 mt-1">
                  รหัสเอกสาร: <span className="font-mono">{employee.id}</span>
                </p>
                <p className="text-[10px] text-slate-400">
                  พิมพ์เมื่อ: {printTimestamp}
                </p>
              </div>
            </div>

            {/* Section 1: ข้อมูลส่วนบุคคล & รูปถ่าย */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5 mb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>1. ข้อมูลทั่วไปและประวัติส่วนบุคคล (Personal Information)</span>
              </h2>

              <div className="flex flex-col sm:flex-row gap-5 items-start">
                {/* Photo / Avatar */}
                <div className="shrink-0 text-center mx-auto sm:mx-0">
                  {employee.avatarUrl ? (
                    <img 
                      src={employee.avatarUrl} 
                      alt={employee.fullName} 
                      className="w-24 h-28 object-cover rounded-lg border border-slate-300 shadow-2xs"
                    />
                  ) : (
                    <div className="w-24 h-28 rounded-lg bg-slate-200 text-slate-500 flex flex-col items-center justify-center border border-slate-300 text-xs">
                      <User className="w-8 h-8 mb-1 text-slate-400" />
                      <span>ไม่มีรูปถ่าย</span>
                    </div>
                  )}
                  <span className="font-mono text-[11px] font-bold text-blue-700 block mt-1">
                    {employee.id}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">ชื่อ-นามสกุล:</span>
                    <strong className="text-slate-900 text-sm">{employee.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ชื่อเล่น:</span>
                    <strong className="text-slate-900">{employee.nickname || '-'}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 block">สัญชาติ / กลุ่มพนักงาน:</span>
                    <span className="font-semibold text-slate-800">
                      {employee.isForeignWorker ? `แรงงานต่างด้าว (${employee.nationalityText})` : 'สัญชาติไทย'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">เลขประจำตัวประชาชน / พาสปอร์ต:</span>
                    <span className="font-mono font-bold text-slate-900">{employee.idCardNumber || '-'}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">วันเดือนปีเกิด (อายุ):</span>
                    <span className="text-slate-800">{formatThaiDate(employee.birthDate)} ({calculateAge(employee.birthDate)})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">เบอร์โทรศัพท์ติดต่อ:</span>
                    <span className="font-bold text-slate-900">{employee.phoneNumber || '-'}</span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block">ที่อยู่ตามทะเบียน / ที่พักอาศัย:</span>
                    <span className="text-slate-800">{employee.address || '-'}</span>
                  </div>

                  <div className="sm:col-span-2 pt-1 border-t border-slate-200 mt-1">
                    <span className="text-slate-500 block">บุคคลติดต่อฉุกเฉิน:</span>
                    <span className="font-semibold text-slate-900">
                      {employee.emergencyContact?.name || '-'} 
                      {employee.emergencyContact?.relationship ? ` (${employee.emergencyContact.relationship})` : ''} 
                      {employee.emergencyContact?.phone ? ` • โทร: ${employee.emergencyContact.phone}` : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: สถานะการจ้างงาน & ตำแหน่งหน้าที่ */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5 mb-3 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                <span>2. สถานะการจ้างงานและข้อมูลตำแหน่ง (Employment & Position)</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5 text-xs">
                <div>
                  <span className="text-slate-500 block">ตำแหน่งงาน (Position):</span>
                  <strong className="text-slate-900">{employee.position}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">แผนก (Department):</span>
                  <strong className="text-slate-900">{employee.department}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">สาขาที่ปฏิบัติงาน:</span>
                  <span className="text-slate-800">{employee.branch || 'สำนักงานใหญ่'}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">วันที่เริ่มงาน (Start Date):</span>
                  <span className="text-slate-800">{formatThaiDate(employee.startDate)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">อายุงาน (Service Duration):</span>
                  <span className="font-semibold text-blue-700">{calculateServiceLength(employee.startDate)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">ประเภทการจ้าง (Type):</span>
                  <span className="text-slate-800">
                    {employee.employmentType === 'FULL_TIME' && 'พนักงานประจำ (Full-Time)'}
                    {employee.employmentType === 'PROBATION' && 'ทดลองงาน (Probation)'}
                    {employee.employmentType === 'CONTRACT' && 'สัญญาจ้าง (Contract)'}
                    {employee.employmentType === 'DAILY' && 'รายวัน (Daily)'}
                    {employee.employmentType === 'PART_TIME' && 'พาร์ทไทม์ (Part-Time)'}
                    {!['FULL_TIME','PROBATION','CONTRACT','DAILY','PART_TIME'].includes(employee.employmentType) && employee.employmentType}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">ฐานเงินเดือน (Base Salary):</span>
                  <strong className="text-slate-900">{formatCurrency(employee.salary)} บาท</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">ค่าตำแหน่ง/สวัสดิการ (Allowance):</span>
                  <span className="text-slate-800">{formatCurrency(employee.allowance || 0)} บาท</span>
                </div>
                <div>
                  <span className="text-slate-500 block">สถานะการทำงานปัจจุบัน:</span>
                  {employee.resignation.isResigned ? (
                    <span className="px-2 py-0.5 rounded font-bold text-rose-700 bg-rose-100 text-[11px] inline-block">
                      พ้นสภาพ / ลาออก ({formatThaiDate(employee.resignation.resignationDate)})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded font-bold text-emerald-800 bg-emerald-100 text-[11px] inline-block">
                      ปฏิบัติงานตามปกติ (ACTIVE)
                    </span>
                  )}
                </div>
              </div>

              {/* Resignation notes if resigned */}
              {employee.resignation.isResigned && (
                <div className="mt-2.5 pt-2 border-t border-rose-200 text-xs text-rose-800 bg-rose-50/60 p-2.5 rounded-lg space-y-1">
                  <div className="font-bold">ข้อมูลการพ้นสภาพพนักงาน:</div>
                  <div>เหตุผล: {employee.resignation.reason || 'ไม่ระบุ'}</div>
                  {employee.resignation.notes && <div>หมายเหตุ: {employee.resignation.notes}</div>}
                  {employee.resignation.handedOverTo && <div>ส่งมอบงานให้: {employee.resignation.handedOverTo}</div>}
                </div>
              )}
            </div>

            {/* Section 3: เอกสารแรงงานต่างด้าว (แสดงเฉพาะกรณีเป็นแรงงานต่างด้าว) */}
            {employee.isForeignWorker && employee.foreignDetails && (
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5 mb-3 flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>3. ข้อมูลเอกสารแรงงานต่างด้าว & การอนุญาตทำงาน (Foreign Worker Compliance)</span>
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">ประเภทเอกสารประจำตัว:</span>
                    <span className="font-semibold text-slate-800">
                      {employee.foreignDetails.identificationType === 'PASSPORT' && 'หนังสือเดินทาง (Passport)'}
                      {employee.foreignDetails.identificationType === 'PINK_CARD' && 'บัตรสีชมพู (Pink Card)'}
                      {employee.foreignDetails.identificationType === 'WHITE_CARD' && 'บัตรสีขาว 10 ปี (White Card)'}
                      {employee.foreignDetails.identificationType === 'OTHER' && 'เอกสารประจำตัวอื่นๆ'}
                      {!employee.foreignDetails.identificationType && '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">เลขที่ Passport:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {employee.foreignDetails.passportNumber || employee.foreignDetails.passportDetails?.passportNumber || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">วันหมดอายุ Passport:</span>
                    <span className="font-medium text-slate-800">
                      {formatThaiDate(employee.foreignDetails.passportExpiryDate || employee.foreignDetails.passportDetails?.expiryDate)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">ประเภท Visa:</span>
                    <span className="text-slate-800">{employee.foreignDetails.visaType || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">วันหมดอายุ Visa:</span>
                    <span className="font-medium text-slate-800">{formatThaiDate(employee.foreignDetails.visaExpiryDate)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">กำหนดรายงานตัว 90 วัน:</span>
                    <span className="text-slate-800">{formatThaiDate(employee.foreignDetails.report90DaysDate)}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">เลขที่ใบอนุญาตทำงาน (Work Permit):</span>
                    <span className="font-mono font-bold text-slate-900">
                      {employee.workPermitNumber || employee.foreignDetails.workPermitNumber || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">วันหมดอายุ Work Permit:</span>
                    <span className="font-medium text-slate-800">
                      {formatThaiDate(employee.workPermitExpiryDate || employee.foreignDetails.workPermitExpiryDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">สถานะการต่ออายุ:</span>
                    <span className="text-slate-800">
                      {employee.isRenewingWorkPermit || employee.foreignDetails.isRenewingWorkPermit 
                        ? 'กำลังดำเนินการต่ออายุ' 
                        : 'ปกติ'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: เช็คลิสต์และรายการเอกสารที่จัดเก็บในแฟ้ม */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5 mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>4. รายการเอกสารในแฟ้มประวัติ (Document Records & Attachments)</span>
              </h2>

              {allDocuments.length > 0 ? (
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-1.5 px-3">ชื่อเอกสาร</th>
                      <th className="py-1.5 px-3">ประเภท</th>
                      <th className="py-1.5 px-3">วันที่แนบ</th>
                      <th className="py-1.5 px-3">วันหมดอายุ</th>
                      <th className="py-1.5 px-3 text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {allDocuments.map((doc, idx) => (
                      <tr key={doc.id || idx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 font-medium text-slate-900">{doc.title}</td>
                        <td className="py-1.5 px-3 text-slate-600">{doc.type}</td>
                        <td className="py-1.5 px-3 text-slate-600">{formatThaiDate(doc.uploadDate)}</td>
                        <td className="py-1.5 px-3 text-slate-600">{formatThaiDate(doc.expiryDate)}</td>
                        <td className="py-1.5 px-3 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            แนบแล้ว
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-xs text-slate-500 italic py-1">
                  ไม่มีไฟล์เอกสารแนบในระบบ
                </div>
              )}
            </div>

            {/* Section 5: สรุปสถิติการปฏิบัติงาน ขาด ลา มาสาย และล่วงเวลา */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5 mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>5. สรุปสถิติการปฏิบัติงาน ขาด ลา มาสาย และ OT (Attendance & Leave Summary)</span>
              </h2>

              {/* Cumulative Metrics Strip */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3 text-center">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">ขาดงาน</span>
                  <strong className="text-sm text-rose-600">{totalAbsentDays} วัน</strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">ลาป่วย</span>
                  <strong className="text-sm text-amber-600">{totalSickDays} วัน</strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">ลากิจ</span>
                  <strong className="text-sm text-blue-600">{totalBusinessDays} วัน</strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">ลาพักร้อน</span>
                  <strong className="text-sm text-emerald-600">{totalAnnualDays} วัน</strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">มาสาย</span>
                  <strong className="text-sm text-purple-600">{totalLateCount} ครั้ง ({totalLateMinutes}น.)</strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">ล่วงเวลา (OT)</span>
                  <strong className="text-sm text-indigo-600">{totalOtHours} ชม.</strong>
                </div>
              </div>

              {/* Monthly Breakdown Table (if available) */}
              {history.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-1 px-2.5">รอบเดือน</th>
                        <th className="py-1 px-2 text-center text-rose-600">ขาด</th>
                        <th className="py-1 px-2 text-center text-amber-600">ป่วย</th>
                        <th className="py-1 px-2 text-center text-blue-600">กิจ</th>
                        <th className="py-1 px-2 text-center text-emerald-600">พักร้อน</th>
                        <th className="py-1 px-2 text-center text-purple-600">สาย (ครั้ง/นาที)</th>
                        <th className="py-1 px-2 text-center text-indigo-600">OT (ชม.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {history.slice(-6).map((h, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-1 px-2.5 font-medium text-slate-900">
                            {THAI_MONTHS[(h.month || 1) - 1]} {(h.year || new Date().getFullYear()) + 543}
                          </td>
                          <td className="py-1 px-2 text-center text-slate-800">{h.absentDays || 0}</td>
                          <td className="py-1 px-2 text-center text-slate-800">{h.sickLeaveDays || 0}</td>
                          <td className="py-1 px-2 text-center text-slate-800">{h.businessLeaveDays || 0}</td>
                          <td className="py-1 px-2 text-center text-slate-800">{h.annualLeaveDays || 0}</td>
                          <td className="py-1 px-2 text-center text-slate-800">
                            {h.lateCount || 0} ครั้ง ({h.lateMinutes || 0}น.)
                          </td>
                          <td className="py-1 px-2 text-center text-slate-800">{h.otHours || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Warnings record */}
              <div className="mt-2.5 text-xs text-slate-600 pt-1.5 border-t border-slate-200 flex items-center justify-between">
                <span>ประวัติการตักเตือนทางวินัย:</span>
                <span className={`font-bold ${totalWarnings > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {totalWarnings > 0 ? `พบประวัติการตักเตือน ${totalWarnings} ครั้ง` : 'ไม่มีประวัติการกระทำผิดทางวินัย'}
                </span>
              </div>
            </div>

            {/* Section 6: การรับรองเอกสารและลายมือชื่อ */}
            <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-center text-xs">
              <div>
                <p className="font-semibold text-slate-800 mb-8">ลายมือชื่อพนักงาน</p>
                <div className="border-b border-dotted border-slate-400 w-36 mx-auto mb-1"></div>
                <p className="text-slate-600">({employee.fullName})</p>
                <p className="text-[10px] text-slate-400 mt-0.5">วันที่: ...../...../..........</p>
              </div>

              <div>
                <p className="font-semibold text-slate-800 mb-8">เจ้าหน้าที่ฝ่ายบุคคลผู้จัดทำ</p>
                <div className="border-b border-dotted border-slate-400 w-36 mx-auto mb-1"></div>
                <p className="text-slate-600">(..................................................)</p>
                <p className="text-[10px] text-slate-400 mt-0.5">วันที่: ...../...../..........</p>
              </div>

              <div>
                <p className="font-semibold text-slate-800 mb-8">ผู้มีอำนาจลงนาม / กรรมการ</p>
                <div className="border-b border-dotted border-slate-400 w-36 mx-auto mb-1"></div>
                <p className="text-slate-600">(..................................................)</p>
                <p className="text-[10px] text-slate-400 mt-0.5">วันที่: ...../...../..........</p>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-200">
              <p>เอกสารสรุปประวัติพนักงานนี้จัดทำขึ้นโดยระบบ Nua HRM Pro — ใช้สำหรับงานบริหารงานบุคคลและเป็นหลักฐานภายในองค์กรเท่านั้น</p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
