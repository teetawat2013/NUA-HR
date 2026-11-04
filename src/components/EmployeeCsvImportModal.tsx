import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  ArrowRight, 
  Info, 
  Trash2, 
  FileSpreadsheet, 
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  HelpCircle,
  Layers,
  FileDown
} from 'lucide-react';
import { 
  Employee, 
  Department, 
  EmploymentType, 
  IdentificationType,
  DEPARTMENTS,
  BRANCHES
} from '../types';
import { showErrorAlert } from '../utils/swal';
import {
  IMPORT_TEMPLATES,
  ImportTemplateDefinition,
  generateCsvContent,
  generateTsvContent,
  downloadCsvFile
} from '../utils/employeeImportTemplates';

interface EmployeeCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (employees: Employee[]) => void;
  existingEmployees: Employee[];
}

interface ParsedEmployeeRow {
  isValid: boolean;
  errors: string[];
  raw: Record<string, string>;
  employee: Employee;
}

const VALID_DEPARTMENTS: Department[] = DEPARTMENTS;

export const EmployeeCsvImportModal: React.FC<EmployeeCsvImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingEmployees,
}) => {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<'standard' | 'thai' | 'foreign' | 'quick'>('standard');
  const [isColumnGuideOpen, setIsColumnGuideOpen] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedEmployeeRow[]>([]);
  const [inputMode, setInputMode] = useState<'FILE' | 'PASTE'>('FILE');
  const [hasParsed, setHasParsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentTemplate: ImportTemplateDefinition = IMPORT_TEMPLATES[selectedTemplateKey];

  // Enhanced CSV/TSV parser supporting comma, tab (from Excel/Sheets paste), and semicolon
  const parseCsvLines = (text: string): string[][] => {
    const cleanText = text.replace(/^\uFEFF/, '').trim(); // Remove UTF-8 BOM if present
    if (!cleanText) return [];

    const lines = cleanText.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];

    // Detect delimiter from first line
    const firstLine = lines[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;

    let delimiter = ',';
    if (tabCount > commaCount && tabCount > semicolonCount) {
      delimiter = '\t';
    } else if (semicolonCount > commaCount) {
      delimiter = ';';
    }

    const result: string[][] = [];

    for (const line of lines) {
      const row: string[] = [];
      let inQuotes = false;
      let currentVal = '';

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          if (inQuotes && line[i + 1] === char) {
            currentVal += char;
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          row.push(currentVal.trim());
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      row.push(currentVal.trim());
      result.push(row);
    }
    return result;
  };

  // Normalize Department
  const matchDepartment = (input: string): Department => {
    const trimmed = input.trim();
    if (!trimmed) return 'แผนกครัว';
    
    // Exact or partial match
    for (const dept of VALID_DEPARTMENTS) {
      if (dept.toLowerCase().includes(trimmed.toLowerCase()) || trimmed.toLowerCase().includes(dept.toLowerCase())) {
        return dept;
      }
    }

    if (/ครัว|kitchen|cook|chef|เชฟ|ทำอาหาร|กุ๊ก|ผลิต|อาหาร/i.test(trimmed)) return 'แผนกครัว';
    if (/ตลาด|สื่อสาร|marketing|comm|pr|โฆษณา|ขาย|sales/i.test(trimmed)) return 'แผนกการตลาดและสื่อสาร';
    if (/บริการ|หน้าร้าน|service|waiter|เสิร์ฟ|แคชเชียร์|คลัง|จัดส่ง/i.test(trimmed)) return 'แผนกบริการหน้าร้าน';
    if (/บัญชี|การเงิน|account|finance/i.test(trimmed)) return 'แผนกบัญชีและการเงิน';
    if (/บริหารร้าน|บริหาร|จัดการ|store manager|manager|ผู้จัดการ|admin|ธุรการ|บุคคล|hr/i.test(trimmed)) return 'แผนกบริหารร้าน';

    return 'แผนกครัว';
  };

  // Normalize EmploymentType
  const matchEmploymentType = (input: string): EmploymentType => {
    const val = input.trim().toUpperCase();
    if (/PROBATION|ทดลอง|โปร/i.test(val)) return 'PROBATION';
    if (/CONTRACT|สัญญาจ้าง/i.test(val)) return 'CONTRACT';
    if (/DAILY|รายวัน/i.test(val)) return 'DAILY';
    if (/PART_TIME|พาร์ทไทม์|ชั่วคราว/i.test(val)) return 'PART_TIME';
    return 'FULL_TIME';
  };

  const processCsvData = (content: string) => {
    const matrix = parseCsvLines(content);
    if (matrix.length < 2) {
      setParsedRows([]);
      setHasParsed(true);
      return;
    }

    const headers = matrix[0].map(h => h.trim().toLowerCase());
    const dataRows = matrix.slice(1);

    // Map headers to field keys
    const findIndex = (keywords: string[]) => {
      return headers.findIndex(h => keywords.some(k => h.includes(k)));
    };

    const idIdx = findIndex(['รหัส', 'id', 'code', 'emp_id']);
    const nameIdx = findIndex(['ชื่อ-นามสกุล', 'ชื่อ', 'fullname', 'name']);
    const nickIdx = findIndex(['ชื่อเล่น', 'nickname', 'nick']);
    const idCardIdx = findIndex(['เลขบัตร', 'บัตรประชาชน', 'idcard', 'citizen', 'บัตรชมพู']);
    const birthIdx = findIndex(['วันเกิด', 'birth', 'dob']);
    const phoneIdx = findIndex(['เบอร์', 'โทร', 'phone', 'tel', 'mobile']);
    const addressIdx = findIndex(['ที่อยู่', 'address', 'ที่พัก']);
    const posIdx = findIndex(['ตำแหน่ง', 'position', 'role']);
    const deptIdx = findIndex(['แผนก', 'department', 'dept']);
    const branchIdx = findIndex(['สาขา', 'branch']);
    const startIdx = findIndex(['เริ่มงาน', 'startdate', 'start_date', 'joined']);
    const typeIdx = findIndex(['ประเภทการจ้าง', 'employmenttype', 'type']);
    const salaryIdx = findIndex(['เงินเดือน', 'ค่าจ้าง', 'salary', 'wage']);
    const allowanceIdx = findIndex(['เบี้ยเลี้ยง', 'ค่าตำแหน่ง', 'allowance']);
    const foreignIdx = findIndex(['ต่างด้าว', 'สัญชาติ', 'foreign', 'nationality']);
    const passportIdx = findIndex(['พาสปอร์ต', 'passport']);
    const wpIdx = findIndex(['work permit', 'ใบอนุญาตทำงาน', 'workpermit']);

    const existingIds = new Set(existingEmployees.map(e => e.id));
    let autoCounter = existingEmployees.length + 1;

    const parsed: ParsedEmployeeRow[] = dataRows.map((row, index) => {
      const raw: Record<string, string> = {};
      headers.forEach((h, i) => {
        raw[h] = row[i] || '';
      });

      const errors: string[] = [];

      // Extract Name
      const fullName = (nameIdx >= 0 ? row[nameIdx] : '') || row[1] || row[0] || '';
      if (!fullName.trim()) {
        errors.push('ไม่มีชื่อ-นามสกุล');
      }

      // Extract ID or auto-generate
      let id = (idIdx >= 0 ? row[idIdx] : '').trim();
      if (!id) {
        id = `EMP-${String(autoCounter).padStart(3, '0')}`;
        autoCounter++;
      } else if (existingIds.has(id)) {
        errors.push(`รหัสพนักงาน ${id} มีอยู่ในระบบแล้ว (จะถูกอัปเดต/ทับข้อมูลเดิม)`);
      }

      const nickname = (nickIdx >= 0 ? row[nickIdx] : '').trim();
      const idCardNumber = (idCardIdx >= 0 ? row[idCardIdx] : '').trim();
      const birthDate = (birthIdx >= 0 ? row[birthIdx] : '').trim() || '1995-01-01';
      const phoneNumber = (phoneIdx >= 0 ? row[phoneIdx] : '').trim() || '081-000-0000';
      const address = (addressIdx >= 0 ? row[addressIdx] : '').trim() || 'กรุงเทพมหานคร';
      const position = (posIdx >= 0 ? row[posIdx] : '').trim() || 'พนักงานบริการหน้าร้าน';
      const department = matchDepartment(deptIdx >= 0 ? row[deptIdx] : '');
      const branch = (branchIdx >= 0 ? row[branchIdx] : '').trim() || BRANCHES[0];
      const startDate = (startIdx >= 0 ? row[startIdx] : '').trim() || new Date().toISOString().split('T')[0];
      const employmentType = matchEmploymentType(typeIdx >= 0 ? row[typeIdx] : '');
      
      const salaryRaw = (salaryIdx >= 0 ? row[salaryIdx] : '').replace(/[^0-9.]/g, '');
      const salary = parseFloat(salaryRaw) || 15000;

      const allowanceRaw = (allowanceIdx >= 0 ? row[allowanceIdx] : '').replace(/[^0-9.]/g, '');
      const allowance = parseFloat(allowanceRaw) || 0;

      const foreignRaw = (foreignIdx >= 0 ? row[foreignIdx] : '').trim().toLowerCase();
      const isForeignWorker = /ต่างด้าว|foreign|true|yes|1|เมียนมา|พม่า|myanmar|ลาว|laos|กัมพูชา|cambodia/i.test(foreignRaw);
      
      let nationalityText = 'ไทย';
      if (isForeignWorker) {
        if (/เมียนมา|พม่า|myanmar/i.test(foreignRaw)) nationalityText = 'เมียนมา (Myanmar)';
        else if (/ลาว|laos/i.test(foreignRaw)) nationalityText = 'ลาว (Laos)';
        else if (/กัมพูชา|cambodia/i.test(foreignRaw)) nationalityText = 'กัมพูชา (Cambodia)';
        else nationalityText = 'เมียนมา (Myanmar)';
      }

      const passportNumber = (passportIdx >= 0 ? row[passportIdx] : '').trim();
      const workPermitNumber = (wpIdx >= 0 ? row[wpIdx] : '').trim();

      const employee: Employee = {
        id,
        fullName,
        nickname,
        idCardNumber,
        birthDate,
        phoneNumber,
        address,
        position,
        department,
        branch,
        startDate,
        employmentType,
        salary,
        allowance,
        emergencyContact: {
          name: 'บุคคลติดต่อฉุกเฉิน',
          relationship: 'ญาติ',
          phone: phoneNumber,
        },
        isForeignWorker,
        nationalityText,
        identificationType: isForeignWorker ? (passportNumber ? 'PASSPORT' : 'PINK_CARD') : 'THAI_ID',
        identificationNumber: isForeignWorker ? passportNumber || idCardNumber : idCardNumber,
        workPermitNumber: isForeignWorker ? workPermitNumber : undefined,
        foreignDetails: isForeignWorker ? {
          identificationType: passportNumber ? 'PASSPORT' : 'PINK_CARD',
          passportFullName: fullName,
          englishName: nickname || fullName,
          countryOfOrigin: nationalityText,
          passportNumber: passportNumber || 'MB000000',
          passportIssueDate: '2024-01-01',
          passportExpiryDate: '2028-01-01',
          visaType: 'Non-Immigrant L-A (แรงงาน)',
          visaNumber: 'VS-000000',
          visaExpiryDate: '2027-01-01',
          stayAddressInThailand: address,
          workPermitNumber: workPermitNumber || 'WP-000000',
          workPermitIssueDate: '2024-01-01',
          workPermitExpiryDate: '2027-01-01',
          workPermitPosition: position,
          workPermitJobDescription: 'งานฝ่ายปฏิบัติการ',
          workPermitWorkplace: branch,
          documents: [],
        } : undefined,
        resignation: {
          isResigned: false,
        },
        attendanceHistory: [],
      };

      return {
        isValid: errors.filter(e => !e.includes('มีอยู่ในระบบแล้ว')).length === 0,
        errors,
        raw,
        employee,
      };
    });

    setParsedRows(parsed);
    setHasParsed(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      setCsvText(content);
      processCsvData(content);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.type.includes('csv') || file.type.includes('text'))) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result as string;
        setCsvText(content);
        processCsvData(content);
      };
      reader.readAsText(file, 'utf-8');
    }
  };

  const handlePasteProcess = () => {
    if (!csvText.trim()) return;
    processCsvData(csvText);
  };

  // Download active template CSV (with samples or blank headers)
  const handleDownloadActiveTemplate = (withSamples: boolean) => {
    const rows = withSamples ? currentTemplate.sampleRows : [];
    const csvContent = generateCsvContent(currentTemplate.headers, rows);
    const suffix = withSamples ? '' : '_blank';
    const filename = currentTemplate.filename.replace('.csv', `${suffix}.csv`);
    downloadCsvFile(csvContent, filename);
  };

  // Copy template TSV to clipboard for direct Excel / Google Sheets paste
  const handleCopyTemplateToClipboard = (withSamples: boolean) => {
    const rows = withSamples ? currentTemplate.sampleRows : [];
    const tsvContent = generateTsvContent(currentTemplate.headers, rows);
    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopiedNotification(`คัดลอกตาราง "${currentTemplate.shortTitle}" แล้ว! สามารถนำไปกด Ctrl+V ใน Excel หรือ Google Sheets ได้ทันที`);
      setTimeout(() => setCopiedNotification(null), 4000);
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
    });
  };

  // Load sample data directly into textarea and process
  const handleLoadSampleIntoInput = () => {
    const sampleCsv = generateCsvContent(currentTemplate.headers, currentTemplate.sampleRows);
    setCsvText(sampleCsv);
    setInputMode('PASTE');
    processCsvData(sampleCsv);
  };

  const handleConfirmImport = () => {
    const validEmployees = parsedRows.filter(r => r.isValid).map(r => r.employee);
    if (validEmployees.length === 0) {
      showErrorAlert('ไม่พบข้อมูลที่ถูกต้อง', 'ไม่พบข้อมูลพนักงานที่ถูกต้องสำหรับนำเข้า กรุณาตรวจสอบไฟล์');
      return;
    }

    onImport(validEmployees);
    onClose();
  };

  const handleDeleteRow = (index: number) => {
    setParsedRows(prev => prev.filter((_, idx) => idx !== index));
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>นำเข้าข้อมูลพนักงานจำนวนมาก (Bulk Employee Import)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 font-semibold hidden sm:inline-block">
                  CSV & Excel Support
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                เลือกเทมเพลตที่ต้องการ กรอกข้อมูล และนำเข้าพนักงานได้สูงสุดหลายร้อยคนในครั้งเดียว
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          
          {/* ========================================================= */}
          {/* SECTION 1: TEMPLATE HUB & DOWNLOADS */}
          {/* ========================================================= */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">
                  ศูนย์เทมเพลตการนำเข้า (Choose Import Template)
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  4 รูปแบบเทมเพลต
                </span>
              </div>
              
              <button
                type="button"
                onClick={() => setIsColumnGuideOpen(!isColumnGuideOpen)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{isColumnGuideOpen ? 'ซ่อนคู่มือคอลัมน์' : 'ดูคำอธิบายคอลัมน์ & ค่าที่รองรับ'}</span>
                {isColumnGuideOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Template Selector Pills / Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['standard', 'thai', 'foreign', 'quick'] as const).map(key => {
                const tmpl = IMPORT_TEMPLATES[key];
                const isSelected = selectedTemplateKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedTemplateKey(key)}
                    className={`p-2.5 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {tmpl.shortTitle}
                        </span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-100" />}
                      </div>
                      <p className={`text-[10px] line-clamp-2 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                        {tmpl.headers.length} คอลัมน์
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Template Details & Action Buttons */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {currentTemplate.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {currentTemplate.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {currentTemplate.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                  {/* Download with samples */}
                  <button
                    type="button"
                    onClick={() => handleDownloadActiveTemplate(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 rounded-lg shadow-2xs transition cursor-pointer"
                    title="ดาวน์โหลดไฟล์ CSV พร้อมข้อมูลตัวอย่าง 3 รายการเพื่อเป็นแนวทาง"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>ดาวน์โหลด CSV (พร้อมตัวอย่าง)</span>
                  </button>

                  {/* Download blank */}
                  <button
                    type="button"
                    onClick={() => handleDownloadActiveTemplate(false)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-300 rounded-lg shadow-2xs transition cursor-pointer"
                    title="ดาวน์โหลดไฟล์ CSV เปล่าที่มีเฉพาะหัวคอลัมน์"
                  >
                    <FileDown className="w-3.5 h-3.5 text-slate-500" />
                    <span>ดาวน์โหลดเฉพาะหัวตาราง</span>
                  </button>

                  {/* Copy for Excel */}
                  <button
                    type="button"
                    onClick={() => handleCopyTemplateToClipboard(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-300 rounded-lg shadow-2xs transition cursor-pointer"
                    title="คัดลอกตารางไปวางในโปรแกรม Microsoft Excel หรือ Google Sheets ได้ทันที"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>คัดลอกไปวาง Excel</span>
                  </button>

                  {/* Load Sample into preview */}
                  <button
                    type="button"
                    onClick={handleLoadSampleIntoInput}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 rounded-lg shadow-2xs transition cursor-pointer"
                    title="โหลดตัวอย่างข้อมูลลงในระบบเพื่อดูผลลัพธ์ทันที"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ทดลองโหลดตัวอย่าง</span>
                  </button>
                </div>
              </div>

              {/* Headers Preview pills */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  หัวข้อคอลัมน์ ({currentTemplate.headers.length}):
                </span>
                {currentTemplate.headers.slice(0, 8).map((h, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                    {h}
                  </span>
                ))}
                {currentTemplate.headers.length > 8 && (
                  <span className="text-[10px] text-blue-600 font-semibold">
                    +{currentTemplate.headers.length - 8} คอลัมน์
                  </span>
                )}
              </div>

              {/* Copied notification banner */}
              {copiedNotification && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 font-semibold animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{copiedNotification}</span>
                </div>
              )}
            </div>

            {/* Collapsible Column Guide / Data Dictionary */}
            {isColumnGuideOpen && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>คู่มือรายละเอียดคอลัมน์และค่าที่ระบบรองรับ (Data Dictionary)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {currentTemplate.columnsGuide.length} คอลัมน์ที่แนะนำ
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-2">ชื่อคอลัมน์</th>
                        <th className="p-2">สถานะ</th>
                        <th className="p-2">ชนิดข้อมูล</th>
                        <th className="p-2">คำอธิบายและตัวเลือกที่รองรับ</th>
                        <th className="p-2">ตัวอย่าง</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentTemplate.columnsGuide.map((col, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-bold text-slate-900 whitespace-nowrap">
                            {col.name}
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            {col.required ? (
                              <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[10px]">
                                จำเป็น (Required)
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">
                                ไม่บังคับ
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-slate-500 whitespace-nowrap">
                            {col.type}
                          </td>
                          <td className="p-2 text-slate-700">
                            <div>{col.description}</div>
                            {col.acceptedValues && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {col.acceptedValues.map((val, vi) => (
                                  <span key={vi} className="px-1 py-0.2 rounded bg-blue-50 text-blue-700 text-[9px] font-semibold border border-blue-200">
                                    {val}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-2 font-mono text-slate-600 text-[10px] whitespace-nowrap">
                            {col.example}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* ========================================================= */}
          {/* SECTION 2: INPUT MODE & UPLOAD / PASTE */}
          {/* ========================================================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInputMode('FILE')}
                  className={`px-3 py-1.5 font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    inputMode === 'FILE' 
                      ? 'bg-blue-600 text-white shadow-2xs' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>อัปโหลดไฟล์ (.CSV)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('PASTE')}
                  className={`px-3 py-1.5 font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    inputMode === 'PASTE' 
                      ? 'bg-blue-600 text-white shadow-2xs' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>วางข้อความจาก Excel / CSV (Paste)</span>
                </button>
              </div>

              {hasParsed && (
                <button
                  type="button"
                  onClick={() => {
                    setCsvText('');
                    setFileName(null);
                    setParsedRows([]);
                    setHasParsed(false);
                  }}
                  className="text-slate-500 hover:text-rose-600 font-semibold text-[11px] transition cursor-pointer"
                >
                  ล้างข้อมูล
                </button>
              )}
            </div>

            {/* Upload Area */}
            {inputMode === 'FILE' ? (
              <div>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50/50' 
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv,application/vnd.ms-excel,text/tab-separated-values"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2.5">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">
                    {fileName ? `ไฟล์ที่เลือก: ${fileName}` : 'คลิกเพื่อเลือกไฟล์ CSV หรือลากไฟล์มาวางที่นี่'}
                  </h4>
                  <p className="text-slate-500 text-[11px] mt-1">
                    รองรับไฟล์ .csv ทุกรูปแบบ (UTF-8, Thai Windows-874 / TIS-620)
                  </p>
                  {fileName && (
                    <span className="mt-3 px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ประมวลผลไฟล์สำเร็จ ({parsedRows.length} รายการ)
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 block">
                    วางข้อความตารางที่คัดลอกมาจาก Excel หรือ Google Sheets หรือ CSV:
                  </label>
                  <button
                    type="button"
                    onClick={handleLoadSampleIntoInput}
                    className="text-blue-600 hover:underline font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>ใส่ข้อความตัวอย่าง ({currentTemplate.shortTitle})</span>
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`รหัสพนักงาน\tชื่อ-นามสกุล\tตำแหน่ง\tแผนก\tสาขา\tเงินเดือน\nQ-001\tสมชาย ชื่นบาน\tผู้ช่วยเชฟ\tแผนกครัว\tสำนักงานใหญ่ (เชียงใหม่)\t18000`}
                  className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={handlePasteProcess}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl transition cursor-pointer shadow-2xs"
                >
                  ประมวลผลข้อความเพื่อตรวจสอบข้อมูล
                </button>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* SECTION 3: PARSED ROWS PREVIEW TABLE */}
          {/* ========================================================= */}
          {hasParsed && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    ตัวอย่างข้อมูลที่ตรวจพบ (Preview)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                    ทั้งหมด {parsedRows.length} รายการ
                  </span>
                  {validCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                      ถูกต้อง {validCount} คน
                    </span>
                  )}
                  {invalidCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                      ต้องแก้ไข {invalidCount} รายการ
                    </span>
                  )}
                </div>
              </div>

              {parsedRows.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto shadow-2xs">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">สถานะ</th>
                        <th className="p-2.5">รหัส</th>
                        <th className="p-2.5">ชื่อ-นามสกุล</th>
                        <th className="p-2.5">ตำแหน่ง / แผนก</th>
                        <th className="p-2.5">สัญชาติ</th>
                        <th className="p-2.5 text-right">เงินเดือน</th>
                        <th className="p-2.5 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((row, idx) => (
                        <tr 
                          key={idx} 
                          className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50 hover:bg-rose-50'}
                        >
                          <td className="p-2.5">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>พร้อมนำเข้า</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-700 font-bold" title={row.errors.join(', ')}>
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                <span>{row.errors[0]}</span>
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-blue-700">
                            {row.employee.id}
                          </td>
                          <td className="p-2.5">
                            <span className="font-bold text-slate-900">{row.employee.fullName}</span>
                            {row.employee.nickname && (
                              <span className="text-slate-400 ml-1">({row.employee.nickname})</span>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-600">
                            <div>{row.employee.position}</div>
                            <div className="text-[10px] text-slate-400">{row.employee.department} • {row.employee.branch}</div>
                          </td>
                          <td className="p-2.5">
                            {row.employee.isForeignWorker ? (
                              <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                {row.employee.nationalityText}
                              </span>
                            ) : (
                              <span className="text-blue-800 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                สัญชาติไทย
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-800">
                            {row.employee.salary.toLocaleString()} บาท
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                              title="ลบแถวนี้ออกจากการนำเข้า"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <AlertCircle className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                  <p>ไม่พบข้อมูลในไฟล์ CSV หรือข้อความที่ระบุ กรุณาตรวจสอบรูปแบบหัวตาราง</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {parsedRows.length > 0 && (
              <span>
                พร้อมนำเข้า <strong>{validCount}</strong> จาก <strong>{parsedRows.length}</strong> คน
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition text-xs cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={validCount === 0}
              onClick={handleConfirmImport}
              className={`px-5 py-2 font-bold rounded-xl text-xs transition flex items-center gap-1.5 ${
                validCount > 0
                  ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>ยืนยันการนำเข้า ({validCount} คน)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

