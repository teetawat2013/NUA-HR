import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  FileText,
  Clock,
  User,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Employee } from '../types';

export interface ImportedPayrollRow {
  employeeId: string;
  employeeName: string;
  matchedEmployee?: Employee;
  daysWorked: number;
  leaveDays: number;
  absentDays: number;
  lateMinutes: number;
  otHours: number;
  attendanceBonus?: number;
  allowance?: number;
}

interface PayrollExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  month: number;
  year: number;
  workingDaysStandard: number;
  onApplyImport: (importedRows: ImportedPayrollRow[], options: { deductLate: boolean; deductAbsentAndLeave: boolean }) => void;
}

export const PayrollExcelImportModal: React.FC<PayrollExcelImportModalProps> = ({
  isOpen,
  onClose,
  employees,
  month,
  year,
  workingDaysStandard,
  onApplyImport,
}) => {
  const [parsedRows, setParsedRows] = useState<ImportedPayrollRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deductLateOption, setDeductLateOption] = useState<boolean>(true);
  const [deductAbsentLeaveOption, setDeductAbsentLeaveOption] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Generate Sample Excel Template with Active Employees
  const handleDownloadTemplate = () => {
    const templateData = employees
      .filter(e => !e.resignation.isResigned)
      .map(e => ({
        'รหัสพนักงาน (ID)': e.id,
        'ชื่อ-นามสกุล': e.fullName,
        'แผนก': e.department,
        'ตำแหน่ง': e.position,
        'วันทำงานจริง (วัน)': workingDaysStandard,
        'วันลา (วัน)': 0,
        'วันขาด (วัน)': 0,
        'มาสาย (นาที)': 0,
        'ชั่วโมง OT (ชม.)': 0,
        'เบี้ยขยัน (บาท)': e.salary >= 10000 ? 1000 : 0,
        'ค่าตำแหน่ง (บาท)': e.allowance || 0,
      }));

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'เวลาทำงาน');

    // Auto set column widths
    ws['!cols'] = [
      { wch: 15 },
      { wch: 25 },
      { wch: 18 },
      { wch: 20 },
      { wch: 16 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
    ];

    const filename = `เทมเพลตนำเข้าเวลาทำงาน_${year + 543}_งวด${String(month).padStart(2, '0')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // Parse Excel / CSV File
  const handleProcessFile = async (file: File) => {
    try {
      setErrorMessage(null);
      setFileName(file.name);

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!rawRows || rawRows.length === 0) {
        setErrorMessage('ไฟล์ว่างเปล่าหรือไม่พบแถวข้อมูล');
        return;
      }

      const extracted: ImportedPayrollRow[] = [];

      for (const row of rawRows) {
        // Find fields across different Thai/English column names
        const findVal = (keys: string[]): any => {
          for (const k of keys) {
            for (const rowKey of Object.keys(row)) {
              if (rowKey.trim().toLowerCase() === k.toLowerCase()) {
                return row[rowKey];
              }
              if (rowKey.toLowerCase().includes(k.toLowerCase())) {
                return row[rowKey];
              }
            }
          }
          return '';
        };

        const rawId = String(findVal(['รหัสพนักงาน', 'รหัส', 'id', 'employee id', 'empid'])).trim();
        const rawName = String(findVal(['ชื่อ-นามสกุล', 'ชื่อ', 'name', 'employee name', 'fullname'])).trim();
        
        if (!rawId && !rawName) continue;

        // Match with employees
        const matched = employees.find(e => {
          if (rawId && e.id.toLowerCase() === rawId.toLowerCase()) return true;
          if (rawId && rawId.replace(/[^0-9]/g, '') && e.id.includes(rawId.replace(/[^0-9]/g, ''))) return true;
          if (rawName && e.fullName.toLowerCase().includes(rawName.toLowerCase())) return true;
          if (rawName && rawName.toLowerCase().includes(e.fullName.toLowerCase())) return true;
          if (rawName && e.nickname && e.nickname.toLowerCase() === rawName.toLowerCase()) return true;
          return false;
        });

        const parseNum = (val: any, fallback: number = 0): number => {
          if (typeof val === 'number') return isNaN(val) ? fallback : val;
          const clean = String(val).replace(/[^0-9.-]/g, '');
          const n = parseFloat(clean);
          return isNaN(n) ? fallback : n;
        };

        const daysWorked = parseNum(findVal(['วันทำงานจริง', 'วันทำงาน', 'เข้างาน', 'days worked', 'worked days', 'วัน']), workingDaysStandard);
        const leaveDays = parseNum(findVal(['วันลา', 'ลา', 'leave', 'leave days', 'ขอลางาน']), 0);
        const absentDays = parseNum(findVal(['วันขาด', 'ขาดงาน', 'ขาด', 'absent', 'absent days']), 0);
        const lateMinutes = parseNum(findVal(['มาสาย', 'สาย (นาที)', 'นาทีมาสาย', 'late minutes', 'late', 'สาย']), 0);
        const otHours = parseNum(findVal(['ชั่วโมง ot', 'ot (ชม.)', 'ล่วงเวลา', 'ot hours', 'ot', 'ค่าล่วงเวลา']), 0);
        const attendanceBonus = parseNum(findVal(['เบี้ยขยัน', 'attendance bonus', 'bonus']), 0);
        const allowance = parseNum(findVal(['ค่าตำแหน่ง', 'allowance']), 0);

        extracted.push({
          employeeId: matched ? matched.id : rawId,
          employeeName: matched ? matched.fullName : rawName,
          matchedEmployee: matched,
          daysWorked,
          leaveDays,
          absentDays,
          lateMinutes,
          otHours,
          attendanceBonus: attendanceBonus > 0 ? attendanceBonus : undefined,
          allowance: allowance > 0 ? allowance : undefined,
        });
      }

      if (extracted.length === 0) {
        setErrorMessage('ไม่สามารถตรวจจับข้อมูลพนักงานหรือชั่วโมงทำงานจากไฟล์นี้ได้ โปรดตรวจสอบคอลัมน์ในไฟล์ หรือใช้ไฟล์เทมเพลตตัวอย่าง');
        return;
      }

      setParsedRows(extracted);
    } catch (err: any) {
      console.error('Error parsing excel:', err);
      setErrorMessage(`เกิดข้อผิดพลาดในการอ่านไฟล์: ${err?.message || 'รูปแบบไฟล์ไม่ถูกต้อง'}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleApply = () => {
    if (parsedRows.length === 0) return;
    onApplyImport(parsedRows, {
      deductLate: deductLateOption,
      deductAbsentAndLeave: deductAbsentLeaveOption,
    });
    onClose();
  };

  const matchedCount = parsedRows.filter(r => r.matchedEmployee).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300 border border-white/10 shadow-inner">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>นำเข้าเวลาทำงานจากไฟล์ EXCEL / CSV</span>
              </h2>
              <p className="text-xs text-emerald-200">
                ดึงเวลาทำงานจริง วันลา วันขาดงาน นาทีมาสาย และชั่วโมง OT เข้าสู่ตารางเงินเดือน
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Top Actions: Template Download & Drag-drop */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-950">ยังไม่มีไฟล์ หรือไม่แน่ใจรูปแบบคอลัมน์?</p>
                <p className="text-[11px] text-emerald-700">ดาวน์โหลดเทมเพลต Excel พร้อมรายชื่อและรหัสพนักงานในระบบ นำไปกรอกและอัปโหลดกลับได้ทันที</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลดเทมเพลต Excel</span>
            </button>
          </div>

          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
              isDragging 
                ? 'border-emerald-500 bg-emerald-50/60' 
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70 hover:border-emerald-400'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls, .csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <Upload className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-800 text-sm">
              {fileName ? `ไฟล์ที่เลือก: ${fileName}` : 'คลิกเพื่อเลือกไฟล์ หรือ ลากไฟล์ EXCEL / CSV มาวางที่นี่'}
            </p>
            <p className="text-xs text-slate-500">
              รองรับไฟล์ .xlsx, .xls, .csv จากเครื่องสแกนนิ้ว หรือตารางเวลาทำงานที่บันทึกไว้
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Options: Deductions behavior */}
          {parsedRows.length > 0 && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                เงื่อนไขการหักเงินเริ่มต้นสำหรับข้อมูลที่นำเข้าชุดนี้:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300">
                  <input
                    type="checkbox"
                    checked={deductLateOption}
                    onChange={(e) => setDeductLateOption(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800">หักเงินมาสายตามเงื่อนไข (สายเกิน 30 นาที)</span>
                    <span className="text-[10px] text-slate-500 block">หากไม่ติ๊ก จะตั้งค่าเป็น "ไม่หัก" เริ่มต้น</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300">
                  <input
                    type="checkbox"
                    checked={deductAbsentLeaveOption}
                    onChange={(e) => setDeductAbsentLeaveOption(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800">หักเงินวันขาดและวันลาตามเงื่อนไข</span>
                    <span className="text-[10px] text-slate-500 block">หากไม่ติ๊ก จะตั้งค่าเป็น "ไม่หัก" เริ่มต้น</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>ตัวอย่างข้อมูลที่ตรวจพบ ({parsedRows.length} รายการ)</span>
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    จับคู่สำเร็จ {matchedCount} จาก {parsedRows.length} คน
                  </span>
                </h4>
                <span className="text-[11px] text-slate-500">
                  สามารถกดปุ่ม "หัก / ไม่หัก" หรือแก้ไขเวลาเพิ่มเติมในตารางได้ตลอดเวลา
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">พนักงานในไฟล์</th>
                      <th className="py-2 px-3">สถานะจับคู่</th>
                      <th className="py-2 px-3 text-center">วันทำงาน</th>
                      <th className="py-2 px-3 text-center">วันลา</th>
                      <th className="py-2 px-3 text-center">วันขาด</th>
                      <th className="py-2 px-3 text-right">มาสาย (นาที)</th>
                      <th className="py-2 px-3 text-right">OT (ชม.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          <div>{r.employeeName}</div>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {r.employeeId}</span>
                        </td>
                        <td className="py-2 px-3">
                          {r.matchedEmployee ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{r.matchedEmployee.id} ({r.matchedEmployee.department})</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                              ไม่พบรหัสตรงกัน
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-blue-700">
                          {r.daysWorked} วัน
                        </td>
                        <td className="py-2 px-3 text-center font-medium text-amber-700">
                          {r.leaveDays > 0 ? `${r.leaveDays} วัน` : '-'}
                        </td>
                        <td className="py-2 px-3 text-center font-medium text-rose-700">
                          {r.absentDays > 0 ? `${r.absentDays} วัน` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-amber-800">
                          {r.lateMinutes > 0 ? `${r.lateMinutes} น.` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-blue-800">
                          {r.otHours > 0 ? `${r.otHours} ชม.` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            disabled={parsedRows.length === 0}
            onClick={handleApply}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs ${
              parsedRows.length > 0 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>ยืนยันและนำเข้าสู่ตารางเงินเดือน ({parsedRows.length} คน)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
