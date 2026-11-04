import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  Building2,
  Award,
  FileDown,
  Eye,
  Check,
  Globe2,
  CalendarClock,
  UserCheck,
  History,
  BookmarkCheck,
  ArrowRight,
  FolderArchive
} from 'lucide-react';
import { Employee, ReportHistoryItem } from '../types';
import { THAI_MONTHS } from '../utils/payrollCalculator';
import { ReportHistorySection } from './ReportHistorySection';
import { ReportPreviewModal } from './ReportPreviewModal';

interface MonthlyReportViewProps {
  employees: Employee[];
  reportHistory?: ReportHistoryItem[];
  onSaveReportHistory?: (item: ReportHistoryItem) => void;
  onDeleteReportHistory?: (reportId: string) => void;
  currentUserEmail?: string;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({ 
  employees,
  reportHistory = [],
  onSaveReportHistory,
  onDeleteReportHistory,
  currentUserEmail
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [activeViewTab, setActiveViewTab] = useState<'CURRENT' | 'HISTORY'>('CURRENT');
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // History Preview Modal State
  const [previewReport, setPreviewReport] = useState<ReportHistoryItem | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const activeEmployees = employees.filter(e => !e.resignation.isResigned);
  const resignedEmployees = employees.filter(e => e.resignation.isResigned);
  const thaiCount = activeEmployees.filter(e => !e.isForeignWorker).length;
  const foreignCount = activeEmployees.filter(e => e.isForeignWorker).length;

  // สถิติการเข้างานและเวลาปฏิบัติงาน
  let totalAbsent = 0;
  let totalSick = 0;
  let totalBusiness = 0;
  let totalAnnual = 0;
  let totalLateCount = 0;
  let totalLateMinutes = 0;
  let totalOtHours = 0;

  activeEmployees.forEach(emp => {
    const stat = emp.attendanceHistory?.find(h => h.month === selectedMonth && h.year === selectedYear);
    if (stat) {
      totalAbsent += stat.absentDays || 0;
      totalSick += stat.sickLeaveDays || 0;
      totalBusiness += stat.businessLeaveDays || 0;
      totalAnnual += stat.annualLeaveDays || 0;
      totalLateCount += stat.lateCount || 0;
      totalLateMinutes += stat.lateMinutes || 0;
      totalOtHours += stat.otHours || 0;
    }
  });

  const totalLeaveDays = totalSick + totalBusiness + totalAnnual;

  // Department Attendance Summary
  const deptSummary: Record<string, { 
    count: number; 
    absent: number; 
    sick: number; 
    business: number; 
    annual: number; 
    late: number; 
    ot: number 
  }> = {};

  activeEmployees.forEach(emp => {
    if (!deptSummary[emp.department]) {
      deptSummary[emp.department] = { count: 0, absent: 0, sick: 0, business: 0, annual: 0, late: 0, ot: 0 };
    }
    deptSummary[emp.department].count += 1;

    const s = emp.attendanceHistory?.find(h => h.month === selectedMonth && h.year === selectedYear);
    if (s) {
      deptSummary[emp.department].absent += s.absentDays || 0;
      deptSummary[emp.department].sick += s.sickLeaveDays || 0;
      deptSummary[emp.department].business += s.businessLeaveDays || 0;
      deptSummary[emp.department].annual += s.annualLeaveDays || 0;
      deptSummary[emp.department].late += s.lateCount || 0;
      deptSummary[emp.department].ot += s.otHours || 0;
    }
  });

  // Helper to generate full standalone HTML snapshot
  const buildReportHtmlSnapshot = (month: number, year: number): string => {
    const monthName = THAI_MONTHS[month - 1];
    const yearTh = year + 543;
    
    return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>รายงานสรุปผลการปฏิบัติงานและสถิติเวลา HR - ${monthName} ${yearTh}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    *, *::before, *::after { font-family: 'Prompt', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { font-family: 'Prompt', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; padding: 20px; line-height: 1.5; font-size: 13px; }
    h1 { font-size: 20px; margin: 0 0 5px 0; color: #0f172a; font-weight: 800; }
    h2 { font-size: 15px; margin: 15px 0 8px 0; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; font-weight: 700; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
    .card-label { font-size: 11px; color: #64748b; margin-bottom: 4px; }
    .card-val { font-size: 18px; font-weight: bold; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
    th { background: #f1f5f9; font-weight: bold; color: #334155; }
    .text-center { text-align: center; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
    .signatures { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; font-size: 12px; }
    .sig-line { width: 180px; border-bottom: 1px solid #94a3b8; margin: 40px auto 8px auto; }
  </style>
</head>
<body>
  <div class="header">
    <div style="font-size: 11px; color: #4338ca; font-weight: bold;">แผนกบริหารร้าน / บริหารงานบุคคล (MANAGEMENT DEPARTMENT)</div>
    <h1>รายงานสรุปผลการปฏิบัติงานและสถิติเวลาประจำงวดเดือน</h1>
    <div>ประจำเดือน ${monthName} พ.ศ. ${yearTh} | วันที่จัดทำ: ${new Date().toLocaleDateString('th-TH')} | ระบบบันทึกอัตโนมัติ</div>
  </div>

  <h2>1. สรุปภาพรวมกำลังพล (Workforce Overview)</h2>
  <div class="grid">
    <div class="card">
      <div class="card-label">พนักงานปัจจุบันทั้งหมด</div>
      <div class="card-val">${activeEmployees.length} คน</div>
    </div>
    <div class="card">
      <div class="card-label">พนักงานสัญชาติไทย</div>
      <div class="card-val">${thaiCount} คน</div>
    </div>
    <div class="card">
      <div class="card-label">แรงงานต่างด้าว (MOU/ม.64)</div>
      <div class="card-val">${foreignCount} คน</div>
    </div>
    <div class="card">
      <div class="card-label">พ้นสภาพในงวดเดือน</div>
      <div class="card-val">${resignedEmployees.length} คน</div>
    </div>
  </div>

  <h2>2. สรุปสถิติเวลาปฏิบัติงานและวินัย (Attendance Statistics)</h2>
  <div class="grid">
    <div class="card">
      <div class="card-label">ขาดงานรวม (Absent)</div>
      <div class="card-val" style="color: #e11d48;">${totalAbsent} วัน</div>
    </div>
    <div class="card">
      <div class="card-label">วันลารวม (ป่วย/กิจ/พักร้อน)</div>
      <div class="card-val" style="color: #d97706;">${totalLeaveDays} วัน</div>
    </div>
    <div class="card">
      <div class="card-label">มาสายรวม (Late Arrivals)</div>
      <div class="card-val" style="color: #ea580c;">${totalLateCount} ครั้ง (${totalLateMinutes} นาที)</div>
    </div>
    <div class="card">
      <div class="card-label">ชั่วโมงล่วงเวลารวม (OT)</div>
      <div class="card-val" style="color: #4f46e5;">${totalOtHours} ชั่วโมง</div>
    </div>
  </div>

  <h2>3. สรุปสถิติการเข้างานรายบุคคล (Individual Attendance Records)</h2>
  <table>
    <thead>
      <tr>
        <th>รหัส</th>
        <th>ชื่อ-นามสกุล</th>
        <th>แผนก</th>
        <th class="text-center">ขาดงาน (วัน)</th>
        <th class="text-center">ลาป่วย (วัน)</th>
        <th class="text-center">ลากิจ (วัน)</th>
        <th class="text-center">พักร้อน (วัน)</th>
        <th class="text-center">มาสาย (ครั้ง/นาที)</th>
        <th class="text-center">OT (ชม.)</th>
      </tr>
    </thead>
    <tbody>
      ${activeEmployees.map(emp => {
        const s = emp.attendanceHistory?.find(h => h.month === month && h.year === year) || {
          absentDays: 0, sickLeaveDays: 0, businessLeaveDays: 0, annualLeaveDays: 0, lateCount: 0, lateMinutes: 0, otHours: 0
        };
        return `
          <tr>
            <td>${emp.id}</td>
            <td>${emp.fullName}</td>
            <td>${emp.department}</td>
            <td class="text-center">${s.absentDays || 0}</td>
            <td class="text-center">${s.sickLeaveDays || 0}</td>
            <td class="text-center">${s.businessLeaveDays || 0}</td>
            <td class="text-center">${s.annualLeaveDays || 0}</td>
            <td class="text-center">${s.lateCount || 0} / ${s.lateMinutes || 0} น.</td>
            <td class="text-center">${s.otHours || 0}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <h2>4. สรุปสถิติการเข้างานแยกตามฝ่าย/แผนก (Department Attendance Breakdown)</h2>
  <table>
    <thead>
      <tr>
        <th>ฝ่าย / แผนกงาน</th>
        <th class="text-center">จำนวนพนักงาน</th>
        <th class="text-center">ขาดงานรวม</th>
        <th class="text-center">ลาป่วยรวม</th>
        <th class="text-center">ลากิจรวม</th>
        <th class="text-center">พักร้อนรวม</th>
        <th class="text-center">มาสายรวม</th>
        <th class="text-center">OT รวม (ชม.)</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(deptSummary).map(([deptName, d]) => `
        <tr>
          <td>${deptName}</td>
          <td class="text-center">${d.count} คน</td>
          <td class="text-center">${d.absent} วัน</td>
          <td class="text-center">${d.sick} วัน</td>
          <td class="text-center">${d.business} วัน</td>
          <td class="text-center">${d.annual} วัน</td>
          <td class="text-center">${d.late} ครั้ง</td>
          <td class="text-center">${d.ot} ชม.</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="signatures">
    <div>
      <p>ผู้จัดทำรายงาน / เจ้าหน้าที่ HR</p>
      <div class="sig-line"></div>
      <p>( .............................................................. )</p>
      <p>วันที่: ..... / ..... / .........</p>
    </div>
    <div>
      <p>ผู้ตรวจสอบและรับทราบ / ผู้จัดการฝ่ายบุคคล</p>
      <div class="sig-line"></div>
      <p>( .............................................................. )</p>
      <p>วันที่: ..... / ..... / .........</p>
    </div>
  </div>
</body>
</html>`;
  };

  // Export as PDF using browser's native print engine with A4 formatting
  const handleExportPDF = () => {
    const originalTitle = document.title;
    const docTitle = `รายงานสรุปผลการปฏิบัติงาน_HR_${THAI_MONTHS[selectedMonth - 1]}_${selectedYear + 543}`;
    document.title = docTitle;
    
    // Auto-record to history log
    const snapshotHtml = buildReportHtmlSnapshot(selectedMonth, selectedYear);
    const historyItem: ReportHistoryItem = {
      id: `RPT-${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${Date.now().toString().slice(-4)}`,
      reportTitle: `รายงานสรุปผลการปฏิบัติงานและสถิติเวลา HR - ${THAI_MONTHS[selectedMonth - 1]} ${selectedYear + 543}`,
      month: selectedMonth,
      year: selectedYear,
      generatedAt: new Date().toISOString(),
      generatedBy: currentUserEmail || 'แผนกบริหารร้าน (Admin)',
      employeeCount: activeEmployees.length,
      thaiCount,
      foreignCount,
      totalAbsentDays: totalAbsent,
      totalLeaveDays,
      totalLateCount,
      totalLateMinutes,
      totalOtHours,
      fileFormat: 'PDF',
      snapshotHtml,
      notes: `ส่งออก PDF ประจำงวดเดือน ${THAI_MONTHS[selectedMonth - 1]} ${selectedYear + 543}`,
    };

    if (onSaveReportHistory) {
      onSaveReportHistory(historyItem);
    }

    window.print();
    setTimeout(() => {
      document.title = originalTitle;
      setSuccessMessage('เปิดหน้าต่างสั่งพิมพ์ PDF และบันทึกประวัติการออกรายงานเรียบร้อยแล้ว');
      setShowExportSuccess(true);
      setTimeout(() => setShowExportSuccess(false), 4500);
    }, 1000);
  };

  // Download Standalone HTML Report File
  const handleDownloadReportFile = () => {
    const reportHtml = buildReportHtmlSnapshot(selectedMonth, selectedYear);
    const fileName = `รายงานสรุปผลการปฏิบัติงาน_HR_${THAI_MONTHS[selectedMonth - 1]}_${selectedYear + 543}.html`;
    
    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Auto-record to history log
    const historyItem: ReportHistoryItem = {
      id: `RPT-${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${Date.now().toString().slice(-4)}`,
      reportTitle: `รายงานสรุปผลการปฏิบัติงานและสถิติเวลา HR - ${THAI_MONTHS[selectedMonth - 1]} ${selectedYear + 543}`,
      month: selectedMonth,
      year: selectedYear,
      generatedAt: new Date().toISOString(),
      generatedBy: currentUserEmail || 'แผนกบริหารร้าน (Admin)',
      employeeCount: activeEmployees.length,
      thaiCount,
      foreignCount,
      totalAbsentDays: totalAbsent,
      totalLeaveDays,
      totalLateCount,
      totalLateMinutes,
      totalOtHours,
      fileFormat: 'HTML',
      snapshotHtml: reportHtml,
      notes: `ดาวน์โหลดไฟล์ HTML ประจำงวดเดือน ${THAI_MONTHS[selectedMonth - 1]} ${selectedYear + 543}`,
    };

    if (onSaveReportHistory) {
      onSaveReportHistory(historyItem);
    }

    setSuccessMessage('ดาวน์โหลดไฟล์รายงานและบันทึกประวัติสำเร็จ');
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 4500);
  };

  // Manual Bookmark / Save to History without printing
  const handleManualSaveHistory = () => {
    const snapshotHtml = buildReportHtmlSnapshot(selectedMonth, selectedYear);
    const historyItem: ReportHistoryItem = {
      id: `RPT-${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${Date.now().toString().slice(-4)}`,
      reportTitle: `รายงานสรุปผลการปฏิบัติงานและสถิติเวลา HR - ${THAI_MONTHS[selectedMonth - 1]} ${selectedYear + 543}`,
      month: selectedMonth,
      year: selectedYear,
      generatedAt: new Date().toISOString(),
      generatedBy: currentUserEmail || 'แผนกบริหารร้าน (Admin)',
      employeeCount: activeEmployees.length,
      thaiCount,
      foreignCount,
      totalAbsentDays: totalAbsent,
      totalLeaveDays,
      totalLateCount,
      totalLateMinutes,
      totalOtHours,
      fileFormat: 'PDF',
      snapshotHtml,
      notes: `จัดเก็บประวัติรายงานประจำงวดเดือน ${THAI_MONTHS[selectedMonth - 1]} ${selectedYear + 543}`,
    };

    if (onSaveReportHistory) {
      onSaveReportHistory(historyItem);
    }

    setSuccessMessage('จัดเก็บรายงานประจำงวดเข้าสู่ประวัติเรียบร้อยแล้ว');
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 4000);
  };

  // Download Past Report from History Log
  const handleDownloadPastReport = (item: ReportHistoryItem) => {
    const htmlToDownload = item.snapshotHtml || buildReportHtmlSnapshot(item.month, item.year);
    const fileName = `รายงานย้อนหลัง_${THAI_MONTHS[item.month - 1]}_${item.year + 543}_${item.id}.html`;
    
    const blob = new Blob([htmlToDownload], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccessMessage(`ดาวน์โหลดรายงานย้อนหลังงวด ${THAI_MONTHS[item.month - 1]} ${item.year + 543} เรียบร้อยแล้ว`);
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 4000);
  };

  // Preview Past Report Modal
  const handlePreviewPastReport = (item: ReportHistoryItem) => {
    const reportWithSnapshot = {
      ...item,
      snapshotHtml: item.snapshotHtml || buildReportHtmlSnapshot(item.month, item.year),
    };
    setPreviewReport(reportWithSnapshot);
    setIsPreviewModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Sub Navigation Tabs: Current Report vs History Log */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveViewTab('CURRENT')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeViewTab === 'CURRENT'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>รายงานประจำงวดเดือน {THAI_MONTHS[selectedMonth - 1]} {selectedYear + 543}</span>
          </button>

          <button
            onClick={() => setActiveViewTab('HISTORY')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeViewTab === 'HISTORY'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>ประวัติการออกรายงานย้อนหลัง</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeViewTab === 'HISTORY' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
            }`}>
              {reportHistory.length}
            </span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 px-3">
          <FolderArchive className="w-4 h-4 text-indigo-500" />
          <span>บันทึกประวัติอัตโนมัติทุกครั้งที่กดส่งออก</span>
        </div>
      </div>

      {/* Export Success Toast */}
      {showExportSuccess && (
        <div className="no-print p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between gap-2 animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage || 'ดำเนินการเรียบร้อยแล้ว'}</span>
          </div>
          {activeViewTab === 'CURRENT' && (
            <button
              onClick={() => setActiveViewTab('HISTORY')}
              className="font-bold underline text-emerald-700 hover:text-emerald-900 shrink-0"
            >
              ดูในประวัติรายงาน →
            </button>
          )}
        </div>
      )}

      {/* VIEW 1: CURRENT MONTHLY REPORT */}
      {activeViewTab === 'CURRENT' ? (
        <>
          {/* Top Controls (Hidden in Print) */}
          <div className="no-print bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                ระบบรายงานสรุปผลปฏิบัติงานอัตโนมัติ (Performance Report)
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>รายงานสรุปผลการปฏิบัติงานและสถิติเวลาประจำงวดเดือน</span>
              </h2>
              <p className="text-xs text-slate-500">
                ประมวลผลข้อมูลอัตโนมัติจากฐานข้อมูลพนักงานและสถิติการเข้างานรายบุคคล
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
                >
                  {THAI_MONTHS.map((m, idx) => (
                    <option key={idx} value={idx + 1}>{m}</option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <option value={2026}>2569 (2026)</option>
                  <option value={2025}>2568 (2025)</option>
                </select>
              </div>

              {/* Export to PDF Button */}
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
                title="พิมพ์หรือบันทึกเป็นไฟล์ PDF (Save as PDF)"
              >
                <FileDown className="w-4 h-4" />
                <span>ส่งออกรายงานเป็น PDF</span>
              </button>

              {/* Download File Button */}
              <button
                onClick={handleDownloadReportFile}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                title="ดาวน์โหลดไฟล์เอกสารเก็บไว้ในเครื่อง"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>ดาวน์โหลดรายงาน</span>
              </button>

              {/* Bookmark / Save Snapshot to History */}
              <button
                onClick={handleManualSaveHistory}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition"
                title="บันทึกงวดนี้เข้าประวัติรายงานทันที"
              >
                <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                <span>บันทึกเข้าประวัติ</span>
              </button>
            </div>
          </div>

          {/* Printable Report Document */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8 text-slate-800 font-sans print:border-none print:shadow-none print:p-0">
            
            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest block">
                    ฝ่ายบริหารทรัพยากรบุคคล (HUMAN RESOURCES DEPARTMENT)
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    รายงานสรุปผลการปฏิบัติงานและบริหารกำลังพลรายเดือน
                  </h1>
                  <p className="text-sm text-slate-600 font-medium mt-0.5">
                    ประจำเดือน {THAI_MONTHS[selectedMonth - 1]} พ.ศ. {selectedYear + 543} (Monthly Workforce & Attendance Report)
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500 font-mono">
                  <p>เอกสารหมายเลข: HR-REP-{selectedYear}-{String(selectedMonth).padStart(2, '0')}</p>
                  <p>วันที่พิมพ์: {new Date().toLocaleDateString('th-TH')}</p>
                  <p className="text-emerald-700 font-semibold mt-1">สถานะ: ประมวลผลสมบูรณ์</p>
                </div>
              </div>
            </div>

            {/* SECTION 1: ภาพรวมกำลังพล */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>1. สรุปภาพรวมกำลังพล (Workforce Demographics)</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500">พนักงานปัจจุบันทั้งหมด</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{activeEmployees.length} <span className="text-xs font-normal">คน</span></p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-xs text-blue-700">สัญชาติไทย</span>
                  <p className="text-2xl font-black text-blue-900 mt-1">{thaiCount} <span className="text-xs font-normal">คน</span></p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-xs text-amber-800">แรงงานต่างด้าว (MOU/ม.64)</span>
                  <p className="text-2xl font-black text-amber-900 mt-1">{foreignCount} <span className="text-xs font-normal">คน</span></p>
                </div>
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                  <span className="text-xs text-rose-700">พ้นสภาพในงวดเดือน</span>
                  <p className="text-2xl font-black text-rose-900 mt-1">{resignedEmployees.length} <span className="text-xs font-normal">คน</span></p>
                </div>
              </div>
            </section>

            {/* SECTION 2: สถิติเวลาปฏิบัติงานและวินัย */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>2. สรุปสถิติเวลาปฏิบัติงานและสถิติการลารวม (Attendance & Leave Summary)</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-200">
                  <span className="text-xs text-rose-700 font-medium">ขาดงานรวม (Absent)</span>
                  <p className="text-2xl font-black text-rose-900 mt-1">{totalAbsent} <span className="text-xs font-normal">วัน</span></p>
                  <span className="text-[11px] text-rose-600">หักค่าจ้างตามระเบียบ</span>
                </div>

                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200">
                  <span className="text-xs text-amber-800 font-medium">วันลารวม (ป่วย/กิจ/พักร้อน)</span>
                  <p className="text-2xl font-black text-amber-900 mt-1">{totalLeaveDays} <span className="text-xs font-normal">วัน</span></p>
                  <span className="text-[11px] text-slate-500">
                    ป่วย {totalSick} | กิจ {totalBusiness} | พักร้อน {totalAnnual}
                  </span>
                </div>

                <div className="p-4 bg-orange-50/60 rounded-xl border border-orange-200">
                  <span className="text-xs text-orange-800 font-medium">มาสายรวม (Late Arrivals)</span>
                  <p className="text-2xl font-black text-orange-900 mt-1">{totalLateCount} <span className="text-xs font-normal">ครั้ง</span></p>
                  <span className="text-[11px] text-orange-700 font-semibold">
                    รวมสะสม {totalLateMinutes} นาที
                  </span>
                </div>

                <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200">
                  <span className="text-xs text-indigo-800 font-medium">ล่วงเวลารวม (Overtime)</span>
                  <p className="text-2xl font-black text-indigo-900 mt-1">{totalOtHours} <span className="text-xs font-normal">ชม.</span></p>
                  <span className="text-[11px] text-indigo-700 font-semibold">
                    เฉลี่ย {(totalOtHours / (activeEmployees.length || 1)).toFixed(1)} ชม./คน
                  </span>
                </div>
              </div>
            </section>

            {/* SECTION 3: สถิติการเข้างานรายบุคคล */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>3. สรุปสถิติการเข้างานรายบุคคล (Individual Attendance Records)</span>
              </h3>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">รหัส</th>
                      <th className="p-3">ชื่อ-นามสกุล</th>
                      <th className="p-3">แผนก</th>
                      <th className="p-3 text-center text-rose-700">ขาด (วัน)</th>
                      <th className="p-3 text-center text-amber-700">ป่วย (วัน)</th>
                      <th className="p-3 text-center text-blue-700">กิจ (วัน)</th>
                      <th className="p-3 text-center text-emerald-700">พักร้อน (วัน)</th>
                      <th className="p-3 text-center text-orange-700">สาย (ครั้ง/นาที)</th>
                      <th className="p-3 text-center text-indigo-700">OT (ชม.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeEmployees.map(emp => {
                      const stat = emp.attendanceHistory?.find(h => h.month === selectedMonth && h.year === selectedYear) || {
                        absentDays: 0, sickLeaveDays: 0, businessLeaveDays: 0, annualLeaveDays: 0, lateCount: 0, lateMinutes: 0, otHours: 0
                      };

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/60">
                          <td className="p-3 font-mono font-bold text-slate-700">{emp.id}</td>
                          <td className="p-3 font-semibold text-slate-900">
                            <span>{emp.fullName}</span>
                            {emp.isForeignWorker && (
                              <span className="ml-1 text-[10px] text-amber-700 font-medium">({emp.nationalityText?.split(' ')[0]})</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600">{emp.department}</td>
                          <td className={`p-3 text-center font-mono ${stat.absentDays ? 'font-bold text-rose-600 bg-rose-50/50' : 'text-slate-400'}`}>
                            {stat.absentDays || '-'}
                          </td>
                          <td className={`p-3 text-center font-mono ${stat.sickLeaveDays ? 'font-medium text-amber-700' : 'text-slate-400'}`}>
                            {stat.sickLeaveDays || '-'}
                          </td>
                          <td className={`p-3 text-center font-mono ${stat.businessLeaveDays ? 'font-medium text-blue-700' : 'text-slate-400'}`}>
                            {stat.businessLeaveDays || '-'}
                          </td>
                          <td className={`p-3 text-center font-mono ${stat.annualLeaveDays ? 'font-medium text-emerald-700' : 'text-slate-400'}`}>
                            {stat.annualLeaveDays || '-'}
                          </td>
                          <td className={`p-3 text-center font-mono ${stat.lateCount ? 'font-bold text-orange-600' : 'text-slate-400'}`}>
                            {stat.lateCount ? `${stat.lateCount} / ${stat.lateMinutes}น.` : '-'}
                          </td>
                          <td className={`p-3 text-center font-mono ${stat.otHours ? 'font-bold text-indigo-700 bg-indigo-50/40' : 'text-slate-400'}`}>
                            {stat.otHours || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION 4: สถิติการเข้างานแยกตามแผนก */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>4. สรุปสถิติการเข้างานและเวลาปฏิบัติงานแยกตามฝ่าย/แผนก (Department Attendance Breakdown)</span>
              </h3>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">ฝ่าย / แผนกงาน</th>
                      <th className="p-3 text-center">จำนวนพนักงาน</th>
                      <th className="p-3 text-center text-rose-700">ขาดงานรวม</th>
                      <th className="p-3 text-center text-amber-700">ลาป่วยรวม</th>
                      <th className="p-3 text-center text-blue-700">ลากิจรวม</th>
                      <th className="p-3 text-center text-emerald-700">พักร้อนรวม</th>
                      <th className="p-3 text-center text-orange-700">มาสายรวม</th>
                      <th className="p-3 text-center text-indigo-700">OT รวม (ชม.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(deptSummary).map(([deptName, d]) => (
                      <tr key={deptName} className="hover:bg-slate-50/60">
                        <td className="p-3 font-semibold text-slate-800">{deptName}</td>
                        <td className="p-3 text-center font-mono">{d.count} คน</td>
                        <td className="p-3 text-center font-mono text-rose-700">{d.absent} วัน</td>
                        <td className="p-3 text-center font-mono text-amber-800">{d.sick} วัน</td>
                        <td className="p-3 text-center font-mono text-blue-800">{d.business} วัน</td>
                        <td className="p-3 text-center font-mono text-emerald-800">{d.annual} วัน</td>
                        <td className="p-3 text-center font-mono text-orange-800">{d.late} ครั้ง</td>
                        <td className="p-3 text-center font-mono font-bold text-indigo-700">{d.ot} ชม.</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Signatures & Certification */}
            <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-8">
                <p className="text-slate-600">ผู้จัดทำรายงาน / เจ้าหน้าที่ HR</p>
                <div className="w-48 border-b border-slate-400 mx-auto" />
                <p className="font-semibold text-slate-800">( .............................................................. )</p>
                <p className="text-[11px] text-slate-400">วันที่: ..... / ..... / .........</p>
              </div>

              <div className="space-y-8">
                <p className="text-slate-600">ผู้ตรวจสอบและรับทราบ / ผู้จัดการฝ่ายบุคคล</p>
                <div className="w-48 border-b border-slate-400 mx-auto" />
                <p className="font-semibold text-slate-800">( .............................................................. )</p>
                <p className="text-[11px] text-slate-400">วันที่: ..... / ..... / .........</p>
              </div>
            </div>

          </div>

          {/* Bottom Card Linking to History Log */}
          <div className="no-print bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <FolderArchive className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base">ต้องการเรียกดูรายงานฉบับย้อนหลังที่จัดทำไว้แล้วหรือไม่?</h4>
                <p className="text-xs text-indigo-200 mt-0.5">
                  ระบบมีคลังประวัติรายงานย้อนหลัง {reportHistory.length} ฉบับ พร้อมให้ HR ดาวน์โหลดหรือพิมพ์ซ้ำได้ทันที
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveViewTab('HISTORY')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <span>เปิดดูคลังประวัติรายงาน</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      ) : (
        /* VIEW 2: HISTORY LOG */
        <ReportHistorySection
          reportHistory={reportHistory}
          onDownloadReport={handleDownloadPastReport}
          onPreviewReport={handlePreviewPastReport}
          onDeleteReport={onDeleteReportHistory || (() => {})}
          onSelectReportToView={(rep) => {
            setSelectedMonth(rep.month);
            setSelectedYear(rep.year);
            setActiveViewTab('CURRENT');
          }}
        />
      )}

      {/* Snapshot Preview Modal */}
      <ReportPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        report={previewReport}
        onDownload={handleDownloadPastReport}
      />

    </div>
  );
};
