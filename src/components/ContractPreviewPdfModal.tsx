import React, { useRef, useState } from 'react';
import { 
  Printer, 
  Download, 
  Copy, 
  Check, 
  X, 
  FileText, 
  Calendar, 
  Clock, 
  User, 
  ShieldCheck, 
  Info,
  CheckSquare,
  Square,
  ListOrdered
} from 'lucide-react';
import { EmploymentContract, ContractSettings } from '../types';
import { parseDateToThaiParts, THAI_MONTH_NAMES } from './EmploymentContractsView';

interface ContractPreviewPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: EmploymentContract | null;
  settings: ContractSettings;
}

// แปลงตัวเลขเป็นข้อความภาษาไทย
export const bahtToThaiText = (num: number): string => {
  if (isNaN(num) || num === 0) return 'ศูนย์บาทถ้วน';
  const thaiNums = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  
  const convertGroup = (nStr: string): string => {
    let res = '';
    const len = nStr.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(nStr.charAt(i), 10);
      const pos = len - i - 1;
      if (digit !== 0) {
        if (pos === 1 && digit === 1) {
          res += 'สิบ';
        } else if (pos === 1 && digit === 2) {
          res += 'ยี่สิบ';
        } else if (pos === 0 && digit === 1 && len > 1 && nStr.charAt(len - 2) !== '0') {
          res += 'เอ็ด';
        } else {
          res += thaiNums[digit] + units[pos];
        }
      }
    }
    return res;
  };

  const integerPart = Math.floor(Math.abs(num));
  const str = integerPart.toString();
  if (str.length > 6) {
    const millions = str.slice(0, str.length - 6);
    const rest = str.slice(str.length - 6);
    return convertGroup(millions) + 'ล้าน' + convertGroup(rest) + 'บาทถ้วน';
  }
  return convertGroup(str) + 'บาทถ้วน';
};

export const ContractPreviewPdfModal: React.FC<ContractPreviewPdfModalProps> = ({
  isOpen,
  onClose,
  contract,
  settings,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'MAIN' | 'APPENDIX' | 'PDPA'>('ALL');
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !contract) return null;

  // Format Thai dates
  const formatThaiDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length < 3) return dateStr;
      const year = parseInt(parts[0], 10);
      const thaiYear = year > 2400 ? year : year + 543;
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return `${day} ${THAI_MONTH_NAMES[monthIndex] || parts[1]} พ.ศ. ${thaiYear}`;
    } catch {
      return dateStr;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    if (!printAreaRef.current) return;
    const text = printAreaRef.current.innerText;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleDownloadDoc = () => {
    if (!printAreaRef.current) return;
    const contractHtml = printAreaRef.current.innerHTML;
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>สัญญาจ้างแรงงาน_${contract.contractNumber.replace(/\//g, '-')}_${contract.employeeName}</title>
  <style>
    body { font-family: 'TH Sarabun New', 'IBM Plex Sans Thai', sans-serif; font-size: 14pt; line-height: 1.5; padding: 40px; color: #111; }
    h1 { text-align: center; font-size: 18pt; margin-bottom: 4px; font-weight: bold; }
    h2 { text-align: center; font-size: 15pt; margin-bottom: 12px; font-weight: bold; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .clause-title { font-weight: bold; margin-top: 12px; margin-bottom: 4px; }
    .clause-body { text-indent: 32px; text-align: justify; margin-bottom: 6px; }
    .table-eval { width: 100%; border-collapse: collapse; margin: 12px 0; }
    .table-eval th, .table-eval td { border: 1px solid #333; padding: 6px 8px; font-size: 13pt; }
    .sig-table { width: 100%; margin-top: 35px; border-collapse: collapse; }
    .sig-table td { width: 50%; text-align: center; padding: 15px 10px; vertical-align: top; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
${contractHtml}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `สัญญาจ้างแรงงาน_${contract.contractNumber.replace(/\//g, '-')}_${contract.employeeName}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Parsing values
  const contractDateParts = parseDateToThaiParts(contract.contractDate);
  const birthDay = contract.birthDay || (contract.birthDate ? parseDateToThaiParts(contract.birthDate).day : '______');
  const birthMonth = contract.birthMonth || (contract.birthDate ? parseDateToThaiParts(contract.birthDate).month : '____________');
  const birthYear = contract.birthYear || (contract.birthDate ? parseDateToThaiParts(contract.birthDate).year : '________');

  const startDateParts = parseDateToThaiParts(contract.startDate);

  // Nationality check
  const isThai = contract.nationalityCategory === 'THAI';
  const isMyanmar = contract.nationalityCategory === 'MYANMAR';
  const isOther = contract.nationalityCategory === 'OTHER';

  // Shift check
  const isShift1 = contract.shiftOption === 'SHIFT_1' || (!contract.shiftOption && contract.startTime === '07:00');
  const isShift2 = contract.shiftOption === 'SHIFT_2' || (!contract.shiftOption && contract.startTime === '08:00');
  const isShift3 = contract.shiftOption === 'SHIFT_3' || (!contract.shiftOption && contract.startTime === '12:00');
  const isShiftCustom = contract.shiftOption === 'CUSTOM' || (!isShift1 && !isShift2 && !isShift3);

  // Salary & Payment check
  const isMonthly = contract.salaryType === 'MONTHLY';
  const isDaily = contract.salaryType === 'DAILY';
  const monthlySalary = contract.salary || 15000;
  const dailyWage = contract.dailyWage || 400;

  const isBankTransfer = contract.paymentMethod === 'BANK_TRANSFER';
  const isCash = contract.paymentMethod === 'CASH';

  // Company details
  const companyName = settings.companyName || 'บริษัทฯ นัว โฮม คูซีน จำกัด';
  const companyAddress = settings.companyAddress || '201/37 หมู่ที่ 2 ตำบลช้างเผือก อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 50300';
  const companyTaxId = settings.companyTaxId || '0505569012848';
  const employerSigners = contract.employerSignerName || settings.employerSignerName || 'นายเหมวิช พลนาคู และ นางสาวภัสร์ฐิตา นวลตา';
  const employerSignerTitle = contract.employerSignerTitle || settings.employerSignerTitle || 'กรรมการผู้มีอำนาจ';

  const defaultDuties = [
    'ดูแลรับผิดชอบงานในหน้าที่ตามที่ได้รับมอบหมาย',
    'รักษามาตรฐานคุณภาพและความสะอาดของสถานที่และอุปกรณ์',
    'ปฏิบัติตามมาตรฐานขั้นตอนการทำงาน (SOP) ของร้านอย่างเคร่งครัด',
    'ให้ความร่วมมือกับเพื่อนร่วมงานและผู้บังคับบัญชา',
    'ดูแลรักษาทรัพย์สินและความลับทางการค้าของบริษัท'
  ];
  const duties = (contract.mainDuties && contract.mainDuties.length > 0) ? contract.mainDuties : defaultDuties;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200 print:p-0 print:bg-white print:static print:z-auto">
      
      {/* Modal Dialog Card */}
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Top Control Bar (Hidden when printing) */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  สัญญาจ้างแรงงาน (FM-HR-02)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {contract.contractNumber}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {companyName} • พนักงาน: {contract.employeeName} ({contract.position})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
              title="คัดลอกข้อความในสัญญา"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadDoc}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
              title="ดาวน์โหลดเป็นไฟล์เอกสาร Word (.doc)"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>ดาวน์โหลด .doc</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              title="พิมพ์เอกสาร หรือ บันทึกเป็น PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Export PDF / พิมพ์สัญญา</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs & Print Tip */}
        <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs no-print">
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-semibold mr-1">ส่วนที่แสดง:</span>
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'ALL' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด (ฉบับสมบูรณ์ 3 ส่วน)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('MAIN')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'MAIN' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              1. สัญญาหลัก (16 ข้อ)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('APPENDIX')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'APPENDIX' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              2. ภาคผนวก 1 (เกณฑ์ 90 วัน)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PDPA')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'PDPA' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              3. หนังสือยินยอม PDPA
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-blue-700 font-medium">
            <Info className="w-3.5 h-3.5" />
            <span>ฟอร์มทางการตรงตามแบบ FM-HR-02 (บริษัทฯ นัว โฮม คูซีน จำกัด)</span>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-200/80 print:p-0 print:bg-white print:overflow-visible">
          
          {/* A4 Document Paper Container */}
          <div 
            ref={printAreaRef}
            className="bg-white max-w-[210mm] mx-auto p-8 sm:p-14 shadow-lg border border-slate-300 rounded-2xl print:border-none print:shadow-none print:rounded-none print:p-0 print:m-0 text-slate-900 leading-relaxed text-[13.5px] sm:text-[14px] space-y-8"
            style={{ fontFamily: "'Anuphan', 'IBM Plex Sans Thai', 'TH Sarabun New', sans-serif" }}
          >

            {/* ========================================================== */}
            {/* PART 1: สัญญาจ้างแรงงานหลัก (16 ข้อ)                        */}
            {/* ========================================================== */}
            {(activeTab === 'ALL' || activeTab === 'MAIN') && (
              <section className="space-y-5">
                
                {/* Form Code & Title */}
                <div className="relative pb-2">
                  <div className="absolute right-0 top-0 text-[11px] text-slate-500 font-semibold border border-slate-300 px-2 py-0.5 rounded">
                    FM-HR-02
                  </div>
                  <div className="text-center space-y-1">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                      สัญญาจ้างแรงงาน
                    </h1>
                    <p className="text-xs text-slate-500">
                      เลขที่สัญญา: <strong className="text-slate-900 font-bold">{contract.contractNumber}</strong>
                    </p>
                  </div>
                </div>

                {/* ทำที่ & วันที่ทำสัญญา */}
                <div className="text-right text-xs sm:text-sm space-y-1">
                  <p>
                    ทำที่ <strong>{companyName}</strong>
                  </p>
                  <p className="text-slate-700">
                    เลขที่ {companyAddress}
                  </p>
                  <p className="pt-1">
                    วันที่ <strong className="border-b border-dotted border-slate-900 px-2 font-bold">{contractDateParts.day || '___'}</strong> เดือน <strong className="border-b border-dotted border-slate-900 px-3 font-bold">{contractDateParts.month || '________'}</strong> พ.ศ. <strong className="border-b border-dotted border-slate-900 px-2 font-bold">{contractDateParts.year || '____'}</strong>
                  </p>
                </div>

                {/* คู่สัญญา (นายจ้าง และ ลูกจ้าง) */}
                <div className="space-y-3 text-justify text-xs sm:text-sm">
                  <p className="indent-8 leading-relaxed">
                    สัญญาจ้างแรงงานฉบับนี้ทำขึ้นระหว่าง <strong>{companyName}</strong> ทะเบียนนิติบุคคลเลขที่ <strong>{companyTaxId}</strong> ตั้งอยู่เลขที่ <strong>{companyAddress}</strong> โดย <strong>{employerSigners}</strong> {employerSignerTitle} ซึ่งต่อไปในสัญญานี้เรียกว่า <strong>“นายจ้าง”</strong> ฝ่ายหนึ่ง กับ
                  </p>

                  <p className="indent-8 leading-relaxed">
                    <strong>{contract.employeeName}</strong> เกิดเมื่อวันที่ <strong className="border-b border-dotted border-slate-900 px-2 font-bold">{birthDay}</strong> เดือน <strong className="border-b border-dotted border-slate-900 px-2 font-bold">{birthMonth}</strong> ปี <strong className="border-b border-dotted border-slate-900 px-2 font-bold">{birthYear}</strong>
                  </p>

                  {/* สัญชาติ ( ) ไทย / ( ) เมียนมา / ( ) อื่น ๆ ตามที่ผู้ใช้กำหนดอย่างเคร่งครัด */}
                  <div className="pl-6 space-y-1.5 py-1 text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">สัญชาติ</span>
                      <span>( {isThai ? '✓' : '\u00A0\u00A0'} ) ไทย</span>
                      <span>ให้ใส่ บัตรประจำตัวประชาชน เลขที่</span>
                      <strong className="border-b border-dotted border-slate-900 px-2 font-mono font-bold">
                        {isThai ? (contract.idCardNumber || '__________________________') : '__________________________'}
                      </strong>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>( {isMyanmar ? '✓' : '\u00A0\u00A0'} ) เมียนมา</span>
                      <span>ให้ใส่ ใบอนุญาตทำงาน เลขที่</span>
                      <strong className="border-b border-dotted border-slate-900 px-2 font-mono font-bold">
                        {isMyanmar ? (contract.workPermitNumber || '____________________') : '____________________'}
                      </strong>
                      <span>วันหมดอายุ</span>
                      <strong className="border-b border-dotted border-slate-900 px-2 font-bold">
                        {isMyanmar ? (formatThaiDate(contract.workPermitExpiryDate) || '____________________') : '____________________'}
                      </strong>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>( {isOther ? '✓' : '\u00A0\u00A0'} ) อื่น ๆ</span>
                      <span>ระบุ</span>
                      <strong className="border-b border-dotted border-slate-900 px-2 font-bold">
                        {isOther ? (contract.otherNationalityText || '______________') : '______________'}
                      </strong>
                      <span>เลขที่</span>
                      <strong className="border-b border-dotted border-slate-900 px-2 font-mono font-bold">
                        {isOther ? (contract.workPermitNumber || '____________________') : '____________________'}
                      </strong>
                      <span>วันหมดอายุ</span>
                      <strong className="border-b border-dotted border-slate-900 px-2 font-bold">
                        {isOther && contract.workPermitExpiryDate ? formatThaiDate(contract.workPermitExpiryDate) : '____________________'}
                      </strong>
                    </div>
                  </div>

                  <p className="indent-8 leading-relaxed">
                    อยู่บ้านเลขที่ <strong className="border-b border-dotted border-slate-900 px-2 font-bold">{contract.address || '-'}</strong> หมายเลขโทรศัพท์ <strong className="border-b border-dotted border-slate-900 px-2 font-bold">{contract.phone || '-'}</strong> ซึ่งต่อไปในสัญญานี้เรียกว่า <strong>“ลูกจ้าง”</strong> อีกฝ่ายหนึ่ง
                  </p>

                  <p className="indent-8 leading-relaxed">
                    ทั้งสองฝ่ายตกลงทำสัญญาจ้างแรงงาน โดยมีเงื่อนไขดังต่อไปนี้:
                  </p>
                </div>

                {/* ข้อกำหนด 16 ข้อ */}
                <div className="space-y-3.5 text-xs sm:text-sm text-justify leading-relaxed">
                  
                  {/* ข้อ 1 */}
                  <div>
                    <p className="font-bold text-slate-900">
                      ข้อ 1. หน้าที่และความรับผิดชอบ
                    </p>
                    <p className="indent-8 text-slate-800">
                      นายจ้างตกลงจ้าง และลูกจ้างตกลงรับจ้างทำงานในตำแหน่ง <strong className="text-slate-900 font-bold border-b border-dotted border-slate-900 px-1">“{contract.position}”</strong> สังกัด <strong className="text-slate-900 font-bold border-b border-dotted border-slate-900 px-1">“{contract.department}”</strong> โดยมีหน้าที่ความรับผิดชอบตามที่ระบุไว้ใน “คำบรรยายลักษณะงาน (Job Description)” แนบท้ายสัญญานี้ (ภาคผนวก 1) และให้ถือเป็นส่วนหนึ่งของสัญญาฉบับนี้ ทั้งนี้ นายจ้างมีสิทธิมอบหมายงานอื่นที่เหมาะสมและจำเป็นต่อการดำเนินกิจการให้แก่ลูกจ้างได้ตามที่เห็นสมควร
                    </p>
                  </div>

                  {/* ข้อ 2 */}
                  <div>
                    <p className="font-bold text-slate-900">
                      ข้อ 2. สถานที่ทำงาน
                    </p>
                    <p className="indent-8 text-slate-800">
                      ลูกจ้างตกลงปฏิบัติงาน ณ สถานประกอบการของนายจ้าง เลขที่ <strong>{contract.branch || companyAddress}</strong> หรือสถานที่อื่นใดที่นายจ้างกำหนดหรือมอบหมายตามความจำเป็นของธุรกิจ
                    </p>
                  </div>

                  {/* ข้อ 3 */}
                  <div>
                    <p className="font-bold text-slate-900">
                      ข้อ 3. ระยะเวลาการจ้างและการทดลองงาน
                    </p>
                    <div className="space-y-1 text-slate-800">
                      <p className="indent-8">
                        3.1 สัญญาฉบับนี้เริ่มมีผลบังคับใช้ตั้งแต่วันที่ <strong className="border-b border-dotted border-slate-900 px-2 font-bold">{startDateParts.day || '___'}</strong> เดือน <strong className="border-b border-dotted border-slate-900 px-2 font-bold">{startDateParts.month || '________'}</strong> พ.ศ. <strong className="border-b border-dotted border-slate-900 px-2 font-bold">{startDateParts.year || '____'}</strong> เป็นต้นไป
                      </p>
                      <p className="indent-8">
                        3.2 กำหนดระยะเวลาทดลองงาน <strong className="border-b border-dotted border-slate-900 px-2 font-bold">{contract.probationDays || settings.probationDays || 90}</strong> วัน นับแต่วันเริ่มปฏิบัติงาน ทั้งนี้ ลูกจ้างต้องผ่านการประเมินผลการทดลองงานตามเกณฑ์การประเมินของนายจ้าง (ภาคผนวก 1)
                      </p>
                      <p className="indent-8">
                        3.3 ในระหว่างหรือเมื่อสิ้นสุดระยะเวลาทดลองงาน หากนายจ้างพิจารณาเห็นว่าลูกจ้างมีความรู้ ความสามารถ ทัศนคติ หรือความประพฤติไม่ผ่านเกณฑ์การประเมิน หรือมีผลการปฏิบัติงานที่ไม่เป็นที่พึงพอใจของนายจ้าง นายจ้างมีสิทธิบอกเลิกสัญญาจ้างได้ทันที โดยแจ้งให้ลูกจ้างทราบล่วงหน้าตามที่กฎหมายกำหนด หรือจ่ายค่าจ้างแทนการบอกกล่าวล่วงหน้า (ถ้ามี) ตามพระราชบัญญัติคุ้มครองแรงงาน พ.ศ. 2541
                      </p>
                    </div>
                  </div>

                  {/* ข้อ 4 */}
                  <div>
                    <p className="font-bold text-slate-900">
                      ข้อ 4. วัน เวลาทำงานปกติ และเวลาพัก
                    </p>
                    <div className="space-y-1.5 text-slate-800">
                      <p className="indent-8">
                        4.1 วันทำงานปกติ: สัปดาห์ละ 6 วัน ตั้งแต่วันศุกร์ถึงวันพุธ ทั้งนี้ ร้านหยุดทุกวันพฤหัสบดี ซึ่งเป็นวันหยุดประจำสัปดาห์ของลูกจ้าง
                      </p>
                      <p className="indent-8">
                        4.2 เวลาทำงานปกติ: วันละ 8 ชั่วโมง และมีเวลาพักติดต่อกันไม่น้อยกว่าวันละ 1 ชั่วโมง โดยแบ่งเป็นกะ ดังนี้:
                      </p>
                      
                      {/* Checkboxes สำหรับกะการทำงาน ( ) กะเช้า 1 / กะเช้า 2 / กะบ่าย / เวลาอื่น */}
                      <div className="pl-10 space-y-1 text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>( {isShift1 ? '✓' : '\u00A0\u00A0'} )</span>
                          <span className={isShift1 ? 'font-bold' : ''}>กะเช้า 1: เวลา 07.00 น. ถึง 16.00 น. (พัก 1 ชั่วโมง)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>( {isShift2 ? '✓' : '\u00A0\u00A0'} )</span>
                          <span className={isShift2 ? 'font-bold' : ''}>กะเช้า 2: เวลา 08.00 น. ถึง 17.00 น. (พัก 1 ชั่วโมง)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>( {isShift3 ? '✓' : '\u00A0\u00A0'} )</span>
                          <span className={isShift3 ? 'font-bold' : ''}>กะบ่าย: เวลา 12.00 น. ถึง 21.00 น. (พัก 1 ชั่วโมง)</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span>( {isShiftCustom ? '✓' : '\u00A0\u00A0'} )</span>
                          <span>เวลาอื่นตามที่ตกลง: เวลา</span>
                          <strong className="border-b border-dotted border-slate-900 px-2 font-bold">
                            {isShiftCustom ? contract.startTime : '______'}
                          </strong>
                          <span>น. ถึง</span>
                          <strong className="border-b border-dotted border-slate-900 px-2 font-bold">
                            {isShiftCustom ? contract.endTime : '______'}
                          </strong>
                          <span>น. (พัก</span>
                          <strong className="border-b border-dotted border-slate-900 px-2 font-bold">
                            {isShiftCustom ? `${contract.breakMinutes} นาที` : '1 ชั่วโมง'}
                          </strong>
                          <span>)</span>
                        </div>
                      </div>

                      <p className="indent-8 text-[12px] sm:text-xs text-slate-600">
                        ทั้งนี้ นายจ้างขอสงวนสิทธิ์ในการปรับเปลี่ยนกะการทำงาน หรือมอบหมายให้เข้ากะใดกะหนึ่งตามความเหมาะสมและความจำเป็นของสถานประกอบการ โดยจะแจ้งให้ลูกจ้างทราบล่วงหน้า
                      </p>
                    </div>
                  </div>

                  {/* ข้อ 5 */}
                  <div>
                    <p className="font-bold text-slate-900">
                      ข้อ 5. ค่าจ้าง
                    </p>
                    <div className="space-y-1 text-slate-800">
                      <p className="indent-8">
                        นายจ้างตกลงจ่ายค่าจ้างให้แก่ลูกจ้าง ดังนี้:
                      </p>
                      <div className="pl-10 space-y-1 text-slate-900">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>( {isMonthly ? '✓' : '\u00A0\u00A0'} )</span>
                          <span>รายเดือน: ในอัตราเดือนละ</span>
                          <strong className="border-b border-dotted border-slate-900 px-2 font-bold text-slate-900">
                            {isMonthly ? monthlySalary.toLocaleString('th-TH') : '________________'}
                          </strong>
                          <span>บาท (</span>
                          <strong className="border-b border-dotted border-slate-900 px-2 font-bold">
                            {isMonthly ? bahtToThaiText(monthlySalary) : '____________________________________'}
                          </strong>
                          <span>)</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span>( {isDaily ? '✓' : '\u00A0\u00A0'} )</span>
                          <span>รายวัน: ในอัตราวันละ</span>
                          <strong className="border-b border-dotted border-slate-900 px-2 font-bold text-slate-900">
                            {isDaily ? dailyWage.toLocaleString('th-TH') : '________________'}
                          </strong>
                          <span>บาท (</span>
                          <strong className="border-b border-dotted border-slate-900 px-2 font-bold">
                            {isDaily ? bahtToThaiText(dailyWage) : '____________________________________'}
                          </strong>
                          <span>)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ข้อ 6 */}
                  <div>
                    <p className="font-bold text-slate-900">
                      ข้อ 6. กำหนดการและวิธีการจ่ายค่าจ้าง
                    </p>
                    <div className="space-y-1 text-slate-800">
                      <p className="indent-8">
                        6.1 นายจ้างจะจ่ายค่าจ้างให้แก่ลูกจ้าง <strong>ทุกวันที่ 5 ของเดือน</strong> สำหรับงวดการทำงานตั้งแต่วันที่ 1 ถึงวันสิ้นเดือนของเดือนก่อนหน้า (หากตรงกับวันหยุดธนาคาร จะเลื่อนจ่ายเป็นวันทำการถัดไป)
                      </p>
                      <p className="indent-8">
                        6.2 วิธีการจ่ายค่าจ้าง:
                      </p>
                      <div className="pl-10 space-y-1 text-slate-900">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span>( {isBankTransfer ? '✓' : '\u00A0\u00A0'} )</span>
                          <span>โอนเข้าบัญชีเงินฝากธนาคารของลูกจ้าง ธนาคาร</span>
                          <strong className="border-b border-dotted border-slate-900 px-2 font-bold">
                            {isBankTransfer ? (contract.bankName || 'กสิกรไทย') : '____________________'}
                          </strong>
                          <span>เลขที่บัญชี</span>
                          <strong className="border-b border-dotted border-slate-900 px-2 font-mono font-bold">
                            {isBankTransfer ? (contract.bankAccountNumber || '____________________') : '____________________'}
                          </strong>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>( {isCash ? '✓' : '\u00A0\u00A0'} )</span>
                          <span className={isCash ? 'font-bold' : ''}>จ่ายเป็นเงินสด ณ สถานประกอบการของนายจ้าง</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ข้อ 7 */}
                  <div>
                    <p className="font-bold text-slate-900">
                      ข้อ 7. สวัสดิการอาหาร
                    </p>
                    <p className="indent-8 text-slate-800">
                      นายจ้างจัดอาหารให้แก่ลูกจ้างฟรี วันละ 1 มื้อ ในวันที่มีการปฏิบัติงานตามกะที่กำหนด สวัสดิการนี้ถือเป็นความเกื้อกูลของนายจ้าง มิใช่ส่วนหนึ่งของค่าจ้าง และไม่สามารถแลกเปลี่ยนหรือเรียกร้องเป็นเงินสดได้ ไม่ว่าในกรณีใด
                    </p>
                  </div>

                  {/* ข้อ 8 */}
                  <div>
                    <p className="font-bold text-slate-900">
                      ข้อ 8. วันหยุดและวันลา
                    </p>
                    <p className="indent-8 text-slate-800">
                      ลูกจ้างมีสิทธิได้รับวันหยุดตามประเพณี วันหยุดพักผ่อนประจำปี (เมื่อทำงานครบ 1 ปีขึ้นไป) และวันลาประเภทต่าง ๆ (เช่น ลาป่วย ลากิจ ลาคลอด) ตามที่กำหนดไว้ในพระราชบัญญัติคุ้มครองแรงงาน พ.ศ. 2541 และข้อบังคับเกี่ยวกับการทำงานของนายจ้าง
                    </p>
                  </div>

                  {/* ข้อ 9 */}
                  <div>
                    <p className="font-bold text-slate-900">
                      ข้อ 9. ค่าใช้จ่ายเกี่ยวกับแรงงานต่างด้าว (กรณีลูกจ้างเป็นแรงงานต่างด้าว)
                    </p>
                    <p className="indent-8 text-slate-800">
                      กรณีที่ลูกจ้างเป็นแรงงานต่างด้าว ค่าใช้จ่ายทั้งหมดที่เกี่ยวข้องกับการดำเนินการเอกสารทางกฎหมาย เช่น ค่าธรรมเนียมใบอนุญาตทำงาน ค่าตรวจสุขภาพ ค่าตรวจลงตรา (Visa) ค่ารายงานตัว 90 วัน ค่าทำหนังสือเดินทาง (Passport) หรือเอกสารประจำตัวอื่น ๆ ให้เป็นความรับผิดชอบของลูกจ้างทั้งสิ้น โดยนายจ้างเป็นเพียงผู้อำนวยความสะดวกในการดำเนินการเท่านั้น
                    </p>
                  </div>

                  {/* ข้อ 10 */}
                  <div>
                    <p className="font-bold text-slate-900">
                      ข้อ 10. หน้าที่ในการรักษาเอกสารประจำตัว (กรณีลูกจ้างเป็นแรงงานต่างด้าว)
                    </p>
                    <p className="indent-8 text-slate-800">
                      ลูกจ้างมีหน้าที่รับผิดชอบในการดูแลรักษาหนังสือเดินทาง (Passport) ใบอนุญาตทำงาน (Work Permit) และเอกสารสำคัญทางกฎหมายของตนให้อยู่ในสภาพสมบูรณ์และถูกต้องตามกฎหมายอยู่เสมอ หากลูกจ้างทำเอกสารสูญหาย หมดอายุ หรือชำรุด อันเป็นเหตุให้ไม่สามารถปฏิบัติงานได้ตามกฎหมาย ให้ถือเป็นความบกพร่องของลูกจ้างแต่เพียงผู้เดียว และนายจ้างมีสิทธิบอกเลิกสัญญาจ้างได้ทันทีโดยไม่ต้องบอกกล่าวล่วงหน้าและไม่ต้องจ่ายค่าชดเชยใด ๆ
                    </p>
                  </div>

                  {/* ข้อ 11 */}
                  <div>
                    <p className="font-bold text-slate-900">
                      ข้อ 11. การรักษาความลับและทรัพย์สินของนายจ้าง
                    </p>
                    <p className="indent-8 text-slate-800">
                      ลูกจ้างตกลงที่จะรักษาความลับทางการค้า สูตรอาหาร เทคนิค ขั้นตอนการปรุง ข้อมูลลูกค้า และข้อมูลทางธุรกิจใด ๆ ของนายจ้างไว้เป็นความลับอย่างเคร่งครัด ทั้งในระหว่างสัญญาและภายหลังสิ้นสุดสัญญา โดยจะไม่เปิดเผย คัดลอก หรือนำไปใช้เพื่อประโยชน์ของตนเองหรือผู้อื่นโดยเด็ดขาด หากฝ่าฝืน ลูกจ้างยินยอมชดใช้ค่าเสียหายที่เกิดขึ้นจริงทั้งหมดแก่นายจ้างทันที
                    </p>
                  </div>

                  {/* ข้อ 12 */}
                  <div>
                    <p className="font-bold text-slate-900">
                      ข้อ 12. ระเบียบและข้อบังคับในการทำงาน
                    </p>
                    <p className="indent-8 text-slate-800">
                      ลูกจ้างตกลงที่จะปฏิบัติตามกฎหมาย ระเบียบ ข้อบังคับเกี่ยวกับการทำงาน ประกาศ และคำสั่งโดยชอบด้วยกฎหมายของนายจ้างหรือผู้บังคับบัญชาอย่างเคร่งครัด รวมถึงการรักษาความสะอาด สุขอนามัย และความปลอดภัยในสถานประกอบการ
                    </p>
                  </div>

                  {/* ข้อ 13 */}
                  <div>
                    <p className="font-bold text-slate-900">
                      ข้อ 13. ความยินยอมให้เก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคล (PDPA)
                    </p>
                    <p className="indent-8 text-slate-800">
                      ลูกจ้างรับทราบและให้ความยินยอมแก่นายจ้างในการเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของลูกจ้าง รวมถึงแต่ไม่จำกัดเพียง ชื่อ-นามสกุล ที่อยู่ หมายเลขโทรศัพท์ หมายเลขบัตรประจำตัวประชาชน ข้อมูลใบอนุญาตทำงาน หมายเลขบัญชีธนาคาร ประวัติการศึกษา ประวัติการทำงาน ข้อมูลการจ่ายค่าจ้าง และข้อมูลทางภาษี เพื่อวัตถุประสงค์ในการบริหารงานบุคคล การปฏิบัติตามสัญญาจ้างแรงงาน การจ่ายค่าจ้างและสวัสดิการ การรายงานต่อหน่วยงานราชการที่เกี่ยวข้อง (เช่น สำนักงานประกันสังคม กรมการจัดหางาน กรมสรรพากร) และการปฏิบัติตามกฎหมายอื่นที่เกี่ยวข้อง ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
                    </p>
                  </div>

                  {/* ข้อ 14 */}
                  <div>
                    <p className="font-bold text-slate-900">
                      ข้อ 14. ความยินยอมเกี่ยวกับข้อมูลชีวมิติและข้อมูลอ่อนไหว
                    </p>
                    <p className="indent-8 text-slate-800">
                      ลูกจ้างยินยอมให้นายจ้างเก็บรวบรวมและใช้ข้อมูลชีวมิติ (Biometric Data) เช่น ลายนิ้วมือ ภาพใบหน้า ผ่านระบบบันทึกเวลาทำงาน (เครื่องสแกนนิ้วมือ / สแกนใบหน้า) รวมถึงข้อมูลประวัติสุขภาพ/การตรวจสุขภาพประจำปี เพื่อวัตถุประสงค์ในการบันทึกเวลาทำงาน การประเมินผลการทำงาน การควบคุมความปลอดภัย และการดูแลสุขอนามัยในสถานประกอบการร้านอาหาร
                    </p>
                  </div>

                  {/* ข้อ 15 */}
                  <div>
                    <p className="font-bold text-slate-900">
                      ข้อ 15. ระยะเวลาการเก็บรักษาข้อมูลส่วนบุคคล
                    </p>
                    <p className="indent-8 text-slate-800">
                      นายจ้างจะเก็บรักษาข้อมูลส่วนบุคคลของลูกจ้างไว้ตลอดระยะเวลาการจ้างงาน และต่อเนื่องไปอีกเป็นเวลาไม่เกิน 10 ปี นับแต่วันที่สัญญาจ้างแรงงานฉบับนี้สิ้นสุดลง เพื่อประโยชน์ในการปฏิบัติตามกฎหมายแรงงาน กฎหมายภาษีอากร และการใช้สิทธิเรียกร้องทางกฎหมายของคู่สัญญา
                    </p>
                  </div>

                  {/* ข้อ 16 */}
                  <div>
                    <p className="font-bold text-slate-900">
                      ข้อ 16. การสิ้นสุดสัญญาจ้าง
                    </p>
                    <div className="space-y-1 text-slate-800">
                      <p className="indent-8">
                        สัญญาฉบับนี้สิ้นสุดลงเมื่อ:
                      </p>
                      <p className="indent-12">
                        16.1 คู่สัญญาฝ่ายใดฝ่ายหนึ่งบอกเลิกสัญญาเป็นหนังสือให้อีกฝ่ายหนึ่งทราบล่วงหน้าตามที่กฎหมายกำหนด
                      </p>
                      <p className="indent-12">
                        16.2 ลูกจ้างไม่ผ่านการประเมินผลการทดลองงานตามข้อ 3
                      </p>
                      <p className="indent-12">
                        16.3 ลูกจ้างกระทำความผิดร้ายแรงตามมาตรา 119 แห่งพระราชบัญญัติคุ้มครองแรงงาน พ.ศ. 2541 นายจ้างมีสิทธิเลิกจ้างได้ทันทีโดยไม่ต้องบอกกล่าวล่วงหน้าและไม่ต้องจ่ายค่าชดเชย
                      </p>
                      <p className="indent-12">
                        16.4 ใบอนุญาตทำงานหรือเอกสารประจำตัวของลูกจ้างหมดอายุ หรือถูกเพิกถอนตามกฎหมาย (กรณีแรงงานต่างด้าว)
                      </p>
                      <p className="indent-12">
                        16.5 ลูกจ้างเสียชีวิต หรือเป็นคนไร้ความสามารถ หรือเสมือนไร้ความสามารถ
                      </p>
                    </div>
                  </div>

                  {/* ข้อกำหนดพิเศษเพิ่มเติม (ถ้ามี) */}
                  {contract.specialTerms && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <p className="font-bold text-slate-900 mb-0.5">
                        ข้อตกลงและเงื่อนไขพิเศษเพิ่มเติม:
                      </p>
                      <p className="indent-8 text-slate-800">
                        {contract.specialTerms}
                      </p>
                    </div>
                  )}

                  {/* สรุปท้ายสัญญา */}
                  <p className="indent-8 pt-3 text-slate-900">
                    สัญญานี้ทำขึ้นเป็นสองฉบับมีข้อความถูกต้องตรงกัน คู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจข้อความโดยตลอดแล้ว จึงได้ลงลายมือชื่อไว้เป็นสำคัญต่อหน้าพยาน และต่างยึดถือไว้ฝ่ายละหนึ่งฉบับ
                  </p>
                </div>

                {/* Signatures Section */}
                <div className="pt-8 grid grid-cols-2 gap-y-10 gap-x-6 text-xs sm:text-sm">
                  
                  {/* Employer Signature */}
                  <div className="text-center space-y-1">
                    <p className="text-slate-600">ลงชื่อ ............................................................ นายจ้าง</p>
                    <p className="font-bold text-slate-900">({employerSigners})</p>
                    <p className="text-xs text-slate-600">{employerSignerTitle}</p>
                    <p className="text-[11px] text-slate-500">{companyName}</p>
                  </div>

                  {/* Employee Signature */}
                  <div className="text-center space-y-1">
                    <p className="text-slate-600">ลงชื่อ ............................................................ ลูกจ้าง</p>
                    <p className="font-bold text-slate-900">({contract.employeeName})</p>
                    <p className="text-xs text-slate-600">ตำแหน่ง {contract.position}</p>
                  </div>

                  {/* Witness 1 */}
                  <div className="text-center space-y-1">
                    <p className="text-slate-600">ลงชื่อ ............................................................ พยาน</p>
                    <p className="font-bold text-slate-900">({contract.witness1Name || settings.witness1Name || '............................................................'})</p>
                    <p className="text-xs text-slate-500">พยานคนที่ 1</p>
                  </div>

                  {/* Witness 2 */}
                  <div className="text-center space-y-1">
                    <p className="text-slate-600">ลงชื่อ ............................................................ พยาน</p>
                    <p className="font-bold text-slate-900">({contract.witness2Name || settings.witness2Name || '............................................................'})</p>
                    <p className="text-xs text-slate-500">พยานคนที่ 2</p>
                  </div>

                </div>

              </section>
            )}

            {/* ========================================================== */}
            {/* PART 2: ภาคผนวก 1 คำบรรยายลักษณะงานและเกณฑ์ประเมิน 90 วัน       */}
            {/* ========================================================== */}
            {(activeTab === 'ALL' || activeTab === 'APPENDIX') && (
              <section className={`space-y-5 ${activeTab === 'ALL' ? 'pt-10 border-t-2 border-slate-300 print:break-before-page' : ''}`}>
                
                <div className="text-center space-y-1 pb-2">
                  <div className="text-xs font-bold text-slate-500 uppercase">ภาคผนวก 1 แนบท้ายสัญญาจ้างแรงงาน</div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    คำบรรยายลักษณะงาน (Job Description) และเกณฑ์การประเมินผลการทดลองงาน
                  </h2>
                  <p className="text-xs text-slate-600">
                    {companyName} • อ้างอิงสัญญาเลขที่: <strong className="text-slate-900">{contract.contractNumber}</strong>
                  </p>
                </div>

                {/* ข้อมูลตำแหน่งและผู้บังคับบัญชา */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-500">ตำแหน่งงาน:</span>{' '}
                    <strong className="text-slate-900">{contract.position}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">สังกัดแผนก:</span>{' '}
                    <strong className="text-slate-900">{contract.department}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">ผู้บังคับบัญชาโดยตรง:</span>{' '}
                    <strong className="text-slate-900">{contract.supervisor || 'ผู้จัดการสาขา / หัวหน้าแผนก'}</strong>
                  </div>
                </div>

                {/* หน้าที่และความรับผิดชอบหลัก 5 ข้อ */}
                <div className="space-y-2 text-xs sm:text-sm">
                  <p className="font-bold text-slate-900">
                    1. หน้าที่และความรับผิดชอบหลัก (Main Duties & Responsibilities):
                  </p>
                  <ol className="list-decimal pl-6 space-y-1.5 text-slate-800">
                    {duties.map((duty, idx) => (
                      <li key={idx}>
                        <span>{duty || `ปฏิบัติงานตามที่ได้รับมอบหมายข้อที่ ${idx + 1}`}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* เกณฑ์การประเมินผลการทดลองงาน 90 วัน (ตารางตามหน้า 4-5 ของ PDF) */}
                <div className="space-y-2 text-xs sm:text-sm">
                  <p className="font-bold text-slate-900">
                    2. เกณฑ์การประเมินผลการทดลองงาน (90 วัน):
                  </p>
                  <div className="overflow-x-auto border border-slate-300 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 border-b border-slate-300">
                          <th className="p-2.5 font-bold w-12 text-center">ลำดับ</th>
                          <th className="p-2.5 font-bold">หัวข้อการประเมิน</th>
                          <th className="p-2.5 font-bold">เกณฑ์มาตรฐานที่ต้องผ่าน</th>
                          <th className="p-2.5 font-bold text-center w-28">ผลการประเมิน</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-800">
                        <tr>
                          <td className="p-2.5 text-center font-bold">1</td>
                          <td className="p-2.5 font-medium">คุณภาพและความถูกต้องของงาน</td>
                          <td className="p-2.5 text-slate-600">มีความรู้ความเข้าใจในหน้าที่ ทำงานถูกต้องตามมาตรฐาน ไม่เกิดข้อผิดพลาดร้ายแรง (70% ขึ้นไป)</td>
                          <td className="p-2.5 text-center text-slate-400">[ ผ่าน / ไม่ผ่าน ]</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-center font-bold">2</td>
                          <td className="p-2.5 font-medium">ความตรงต่อเวลาและระเบียบวินัย</td>
                          <td className="p-2.5 text-slate-600">มาปฏิบัติงานตรงเวลาตามกะ ไม่ขาดงานโดยไม่มีเหตุผลอันควร ไม่มาสายเกินกำหนด</td>
                          <td className="p-2.5 text-center text-slate-400">[ ผ่าน / ไม่ผ่าน ]</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-center font-bold">3</td>
                          <td className="p-2.5 font-medium">ทัศนคติและการทำงานเป็นทีม</td>
                          <td className="p-2.5 text-slate-600">ให้ความร่วมมือกับเพื่อนร่วมงานและผู้บังคับบัญชา มีความสุภาพ รับฟังคำแนะนำและพัฒนาตนเอง</td>
                          <td className="p-2.5 text-center text-slate-400">[ ผ่าน / ไม่ผ่าน ]</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-center font-bold">4</td>
                          <td className="p-2.5 font-medium">การรักษาความสะอาดและสุขอนามัย</td>
                          <td className="p-2.5 text-slate-600">ปฏิบัติตามมาตรฐานสุขอนามัยร้านอาหาร (Food Safety) และหลัก 5ส อย่างเคร่งครัด</td>
                          <td className="p-2.5 text-center text-slate-400">[ ผ่าน / ไม่ผ่าน ]</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-center font-bold">5</td>
                          <td className="p-2.5 font-medium">การปฏิบัติตามกฎระเบียบและความปลอดภัย</td>
                          <td className="p-2.5 text-slate-600">ปฏิบัติตามกฎระเบียบข้อบังคับของบริษัทอย่างเคร่งครัด ไม่ฝ่าฝืนคำสั่งโดยชอบด้วยกฎหมาย</td>
                          <td className="p-2.5 text-center text-slate-400">[ ผ่าน / ไม่ผ่าน ]</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ลายมือชื่อลูกจ้างรับทราบ และ ผู้บังคับบัญชา */}
                <div className="pt-6 grid grid-cols-2 gap-y-8 gap-x-6 text-xs sm:text-sm">
                  <div className="text-center space-y-1">
                    <p className="text-slate-600">ลงชื่อ ............................................................ ลูกจ้าง (ผู้รับทราบหน้าที่)</p>
                    <p className="font-bold text-slate-900">({contract.employeeName})</p>
                    <p className="text-xs text-slate-500">วันที่ .......... / .......... / ..............</p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-slate-600">ลงชื่อ ............................................................ ผู้บังคับบัญชา / ผู้ประเมิน</p>
                    <p className="font-bold text-slate-900">({contract.supervisor || 'ผู้จัดการสาขา / หัวหน้าแผนก'})</p>
                    <p className="text-xs text-slate-500">วันที่ .......... / .......... / ..............</p>
                  </div>
                </div>

              </section>
            )}

            {/* ========================================================== */}
            {/* PART 3: หนังสือยินยอม PDPA (Consent Form - PDPA)          */}
            {/* ========================================================== */}
            {(activeTab === 'ALL' || activeTab === 'PDPA') && (
              <section className={`space-y-4.5 ${activeTab === 'ALL' ? 'pt-10 border-t-2 border-slate-300 print:break-before-page' : ''}`}>
                
                <div className="text-center space-y-1 pb-1">
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    หนังสือให้ความยินยอมในการเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคล
                  </h2>
                  <p className="text-xs font-bold text-slate-700">
                    (PDPA Consent Form สำหรับผู้สมัครงาน / ลูกจ้าง)
                  </p>
                  <p className="text-xs text-slate-500">
                    {companyName}
                  </p>
                </div>

                <div className="space-y-3 text-justify text-xs sm:text-sm leading-relaxed text-slate-800">
                  <p className="indent-8">
                    ข้าพเจ้า <strong>{contract.employeeName}</strong> {isThai ? `เลขประจำตัวประชาชน ${contract.idCardNumber || '-'}` : (isMyanmar ? `สัญชาติเมียนมา ใบอนุญาตทำงานเลขที่ ${contract.workPermitNumber || '-'}` : `สัญชาติ ${contract.otherNationalityText || 'ต่างด้าว'} เอกสารเลขที่ ${contract.workPermitNumber || '-'}`)} ได้รับทราบและเข้าใจนโยบายคุ้มครองข้อมูลส่วนบุคคลของ <strong>{companyName}</strong> แล้ว
                  </p>

                  <p className="indent-8">
                    ข้าพเจ้าตกลงยินยอมให้ <strong>{companyName}</strong> เก็บรวบรวม ใช้ ประมวลผล และเปิดเผยข้อมูลส่วนบุคคลของข้าพเจ้า รวมถึงข้อมูลส่วนบุคคลอ่อนไหว (เช่น ข้อมูลชีวมิติ ลายนิ้วมือ ภาพถ่ายใบหน้าสำหรับการบันทึกเวลาทำงาน และประวัติการตรวจสุขภาพ) เพื่อวัตถุประสงค์ดังต่อไปนี้:
                  </p>

                  <ul className="list-disc pl-8 space-y-1 text-slate-800">
                    <li>การบริหารงานบุคคล การปฏิบัติตามสัญญาจ้างแรงงาน และการประเมินผลการทำงาน</li>
                    <li>การจ่ายค่าจ้าง ค่าตอบแทน สวัสดิการ และการจัดทำเอกสารภาษีอากร</li>
                    <li>การนำส่งข้อมูลต่อหน่วยงานราชการตามกฎหมาย (สำนักงานประกันสังคม กรมการจัดหางาน กรมสรรพากร)</li>
                    <li>การดูแลความปลอดภัย สุขอนามัยในสถานประกอบการ และการควบคุมการเข้า-ออกสถานที่</li>
                  </ul>

                  <p className="indent-8">
                    ข้าพเจ้ารับทราบว่า ข้าพเจ้ามีสิทธิตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ในการเข้าถึง ขอรับสำเนา ขอแก้ไข หรือขอให้ลบข้อมูลส่วนบุคคลตามเงื่อนไขที่กฎหมายกำหนด และการให้ความยินยอมนี้เป็นไปด้วยความสมัครใจของข้าพเจ้าเอง
                  </p>
                </div>

                {/* Signatures for Consent */}
                <div className="pt-8 grid grid-cols-2 gap-y-8 gap-x-6 text-xs sm:text-sm">
                  <div className="text-center space-y-1">
                    <p className="text-slate-600">ลงชื่อ ............................................................ ผู้ให้ความยินยอม</p>
                    <p className="font-bold text-slate-900">({contract.employeeName})</p>
                    <p className="text-xs text-slate-500">วันที่ <span className="border-b border-dotted border-slate-900 px-2">{contractDateParts.day || '___'}</span> / <span className="border-b border-dotted border-slate-900 px-2">{contractDateParts.month || '________'}</span> / <span className="border-b border-dotted border-slate-900 px-2">{contractDateParts.year || '____'}</span></p>
                  </div>

                  <div className="text-center space-y-1">
                    <p className="text-slate-600">ลงชื่อ ............................................................ พยาน</p>
                    <p className="font-bold text-slate-900">({contract.witness1Name || settings.witness1Name || '............................................................'})</p>
                    <p className="text-xs text-slate-500">วันที่ <span className="border-b border-dotted border-slate-900 px-2">{contractDateParts.day || '___'}</span> / <span className="border-b border-dotted border-slate-900 px-2">{contractDateParts.month || '________'}</span> / <span className="border-b border-dotted border-slate-900 px-2">{contractDateParts.year || '____'}</span></p>
                  </div>
                </div>

              </section>
            )}

          </div>

        </div>

        {/* Modal Bottom Footer Controls */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>สร้างสัญญาเมื่อ: {formatThaiDate(contract.createdAt.slice(0, 10))}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              ปิดหน้าต่าง
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>สั่งพิมพ์ / Export เป็น PDF</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
