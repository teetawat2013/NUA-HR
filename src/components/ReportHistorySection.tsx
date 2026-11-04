import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Trash2, 
  Eye, 
  Calendar, 
  Users, 
  Clock, 
  Search, 
  Filter, 
  FileDown, 
  AlertCircle,
  CheckCircle2,
  X,
  ExternalLink
} from 'lucide-react';
import { ReportHistoryItem } from '../types';
import { THAI_MONTHS } from '../utils/payrollCalculator';

interface ReportHistorySectionProps {
  reportHistory: ReportHistoryItem[];
  onDownloadReport: (report: ReportHistoryItem) => void;
  onPreviewReport: (report: ReportHistoryItem) => void;
  onDeleteReport: (reportId: string) => void;
  onSelectReportToView?: (report: ReportHistoryItem) => void;
}

export const ReportHistorySection: React.FC<ReportHistorySectionProps> = ({
  reportHistory,
  onDownloadReport,
  onPreviewReport,
  onDeleteReport,
  onSelectReportToView,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<'ALL' | 'PDF' | 'HTML'>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter history
  const filteredHistory = reportHistory.filter((item) => {
    const matchesFormat = formatFilter === 'ALL' || item.fileFormat === formatFilter;
    const monthName = THAI_MONTHS[item.month - 1] || '';
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !query ||
      item.reportTitle.toLowerCase().includes(query) ||
      monthName.toLowerCase().includes(query) ||
      item.year.toString().includes(query) ||
      (item.year + 543).toString().includes(query) ||
      (item.generatedBy && item.generatedBy.toLowerCase().includes(query)) ||
      (item.notes && item.notes.toLowerCase().includes(query));

    return matchesFormat && matchesSearch;
  });

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

  const confirmDelete = (id: string) => {
    onDeleteReport(id);
    setDeletingId(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              บันทึกประวัติการออกรายงาน (Audit & Archival Log)
            </span>
            <span className="text-xs text-slate-500 font-medium">
              รวม {reportHistory.length} ฉบับ
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>ประวัติการสร้างรายงานและดาวน์โหลดเอกสารย้อนหลัง</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            บันทึกประวัติการพิมพ์และดาวน์โหลดรายงานสรุปผลการปฏิบัติงาน พร้อมให้ฝ่ายบุคคล (HR) ดาวน์โหลดหรือตรวจสอบย้อนหลังได้ตลอดเวลา
          </p>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs flex items-center gap-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600 font-medium">พร้อมใช้งาน</span>
            <span className="font-mono font-bold text-slate-900">{reportHistory.length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาตามเดือน, ปี, ชื่อรายงาน หรือผู้จัดทำ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Format Filter Tabs */}
        <div className="flex items-center gap-1.5 self-start md:self-auto">
          <span className="text-xs text-slate-500 font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>รูปแบบ:</span>
          </span>
          <button
            onClick={() => setFormatFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              formatFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            ทั้งหมด ({reportHistory.length})
          </button>
          <button
            onClick={() => setFormatFilter('PDF')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              formatFilter === 'PDF'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            <span>PDF (A4)</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-black/10 rounded-full">
              {reportHistory.filter(r => r.fileFormat === 'PDF').length}
            </span>
          </button>
          <button
            onClick={() => setFormatFilter('HTML')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              formatFilter === 'HTML'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
            }`}
          >
            <span>HTML</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-black/10 rounded-full">
              {reportHistory.filter(r => r.fileFormat === 'HTML').length}
            </span>
          </button>
        </div>

      </div>

      {/* History Items List */}
      <div className="p-4 sm:p-5">
        {filteredHistory.length > 0 ? (
          <div className="space-y-3">
            {filteredHistory.map((report) => (
              <div
                key={report.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition bg-white group flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left Info */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wider flex items-center gap-1 ${
                      report.fileFormat === 'PDF'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    }`}>
                      {report.fileFormat === 'PDF' ? <Printer className="w-3 h-3" /> : <FileDown className="w-3 h-3" />}
                      <span>{report.fileFormat}</span>
                    </span>

                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {report.id}
                    </span>

                    <span className="text-xs font-semibold text-slate-700">
                      งวดประจำเดือน {THAI_MONTHS[report.month - 1]} {report.year + 543}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition">
                    {report.reportTitle}
                  </h4>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>สร้างเมื่อ: {formatDateTimeThai(report.generatedAt)}</span>
                    </span>
                    {report.generatedBy && (
                      <span className="text-slate-500">
                        โดย: <strong className="text-slate-700">{report.generatedBy}</strong>
                      </span>
                    )}
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>พนักงาน {report.employeeCount} คน (ไทย {report.thaiCount} / ต่างด้าว {report.foreignCount})</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100 font-medium">
                      ขาด {report.totalAbsentDays} วัน
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-100 font-medium">
                      ลา {report.totalLeaveDays} วัน
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 border border-orange-100 font-medium">
                      สาย {report.totalLateCount} ครั้ง ({report.totalLateMinutes} นาที)
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-100 font-bold">
                      OT {report.totalOtHours} ชม.
                    </span>
                  </div>

                  {report.notes && (
                    <p className="text-[11px] text-slate-500 italic">
                      หมายเหตุ: {report.notes}
                    </p>
                  )}
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  
                  {/* Preview Button */}
                  <button
                    onClick={() => onPreviewReport(report)}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                    title="เปิดดูตัวอย่างและสั่งพิมพ์"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>ดูตัวอย่าง / พิมพ์</span>
                  </button>

                  {/* Download Button */}
                  <button
                    onClick={() => onDownloadReport(report)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                    title="ดาวน์โหลดไฟล์รายงานย้อนหลัง"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ดาวน์โหลดไฟล์</span>
                  </button>

                  {/* Delete Button with Confirmation Toggle */}
                  {deletingId === report.id ? (
                    <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-xl border border-rose-200">
                      <span className="text-[10px] font-bold text-rose-700 px-1">ยืนยัน?</span>
                      <button
                        onClick={() => confirmDelete(report.id)}
                        className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold hover:bg-rose-700"
                      >
                        ลบ
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-1.5 py-1 text-slate-600 text-[10px] font-bold hover:bg-slate-200 rounded-lg"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(report.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="ลบรายการนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
            <FileText className="w-10 h-10 text-slate-300 mb-2" />
            <p className="font-bold text-slate-600 text-sm">ไม่พบประวัติการสร้างรายงานที่ตรงกับเงื่อนไข</p>
            <p className="text-slate-400 mt-1">
              เมื่อคุณกดปุ่ม "พิมพ์รายงาน / บันทึก PDF" หรือ "ดาวน์โหลดไฟล์สรุป HTML" ระบบจะทำการบันทึกประวัติการออกรายงานไว้ที่นี่โดยอัตโนมัติ
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
