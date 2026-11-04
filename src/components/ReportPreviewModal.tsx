import React, { useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Calendar, 
  FileText, 
  Users, 
  Clock, 
  ExternalLink 
} from 'lucide-react';
import { ReportHistoryItem } from '../types';
import { THAI_MONTHS } from '../utils/payrollCalculator';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReportHistoryItem | null;
  onDownload: (report: ReportHistoryItem) => void;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  report,
  onDownload,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  if (!isOpen || !report) return null;

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    } else {
      window.print();
    }
  };

  const formatDateTimeThai = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const day = d.getDate();
      const month = THAI_MONTHS[d.getMonth()];
      const year = d.getFullYear() + 543;
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      return `${day} ${month} ${year} เวลา ${hours}:${mins} น.`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {report.reportTitle}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  report.fileFormat === 'PDF' ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {report.fileFormat}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span>บันทึกเมื่อ: {formatDateTimeThai(report.generatedAt)}</span>
                {report.generatedBy && <span>• โดย {report.generatedBy}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">พิมพ์รายงาน / บันทึกเป็น PDF</span>
              <span className="sm:hidden">พิมพ์ PDF</span>
            </button>

            <button
              onClick={() => onDownload(report)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">ดาวน์โหลดไฟล์</span>
              <span className="sm:hidden">ดาวน์โหลด</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Embedded Preview */}
        <div className="flex-1 bg-slate-100 p-2 sm:p-4 overflow-hidden">
          {report.snapshotHtml ? (
            <iframe
              ref={iframeRef}
              title="Report Snapshot Preview"
              srcDoc={report.snapshotHtml}
              className="w-full h-full bg-white rounded-xl shadow-xs border border-slate-200"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 p-8 text-center">
              <FileText className="w-12 h-12 text-slate-300 mb-3" />
              <h4 className="font-bold text-slate-800 text-base">ภาพรวมข้อมูลรายงานฉบับย้อนหลัง</h4>
              <p className="text-xs text-slate-500 max-w-md mt-1 mb-4">
                รายงานประจำงวดเดือน {THAI_MONTHS[report.month - 1]} {report.year + 543}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg w-full text-left text-xs mb-6">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">พนักงาน</span>
                  <span className="font-bold text-slate-900">{report.employeeCount} คน</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">ขาดงาน</span>
                  <span className="font-bold text-rose-600">{report.totalAbsentDays} วัน</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">ลางานรวม</span>
                  <span className="font-bold text-amber-600">{report.totalLeaveDays} วัน</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">OT รวม</span>
                  <span className="font-bold text-indigo-600">{report.totalOtHours} ชม.</span>
                </div>
              </div>
              <button
                onClick={() => onDownload(report)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดรายงานฉบับนี้</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 px-5 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
          <span>รหัสรายงาน: <code className="font-mono font-bold text-slate-700">{report.id}</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
