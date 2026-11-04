import React from 'react';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Heart, 
  Users, 
  GraduationCap, 
  Briefcase, 
  Globe2, 
  Award, 
  CheckCircle2, 
  FileText, 
  ExternalLink,
  Plus,
  Trash2,
  Share2,
  Upload,
  AlertCircle
} from 'lucide-react';
import { 
  EducationRecord, 
  WorkExperienceRecord, 
  LanguageSkills, 
  SiblingInfo, 
  JobReferenceContact 
} from '../types';
import { isGoogleDriveUrl, resolveDisplayImageUrl } from '../utils/googleDrive';

// -------------------------------------------------------------
// Component: Photo and Resume Google Drive / Upload Input Box
// -------------------------------------------------------------
interface DriveOrUploadBoxProps {
  label: string;
  required?: boolean;
  type: 'photo' | 'resume';
  valueUrl: string;
  fileName?: string;
  driveUrl?: string;
  sourceType: 'UPLOAD' | 'GOOGLE_DRIVE';
  onSourceTypeChange: (type: 'UPLOAD' | 'GOOGLE_DRIVE') => void;
  onUrlChange: (url: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

export const DriveOrUploadBox: React.FC<DriveOrUploadBoxProps> = ({
  label,
  required,
  type,
  valueUrl,
  fileName,
  sourceType,
  onSourceTypeChange,
  onUrlChange,
  onFileUpload,
  onClear,
}) => {
  const displayImage = type === 'photo' ? resolveDisplayImageUrl(valueUrl) : null;
  const isDrive = isGoogleDriveUrl(valueUrl);

  return (
    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          {type === 'photo' ? <User className="w-4 h-4 text-blue-600" /> : <FileText className="w-4 h-4 text-indigo-600" />}
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-200/80 p-0.5 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onSourceTypeChange('UPLOAD')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              sourceType === 'UPLOAD'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>อัปโหลดไฟล์</span>
          </button>
          <button
            type="button"
            onClick={() => onSourceTypeChange('GOOGLE_DRIVE')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              sourceType === 'GOOGLE_DRIVE'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>ลิงก์ Google Drive</span>
          </button>
        </div>
      </div>

      {sourceType === 'UPLOAD' ? (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {type === 'photo' && (
            <div className="w-16 h-20 rounded-xl bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
              {displayImage ? (
                <img src={displayImage} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-slate-400" />
              )}
            </div>
          )}

          <div className="flex-1 w-full space-y-1">
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition shadow-2xs">
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>{valueUrl ? `เปลี่ยนไฟล์ (${type === 'photo' ? 'รูปถ่าย' : 'เรซูเม่'})` : `เลือกไฟล์จากเครื่อง (${type === 'photo' ? 'JPG, PNG' : 'PDF, Word'})`}</span>
                <input
                  type="file"
                  accept={type === 'photo' ? 'image/*' : '.pdf,.doc,.docx,image/*'}
                  onChange={onFileUpload}
                  className="hidden"
                />
              </label>

              {valueUrl && (
                <button
                  type="button"
                  onClick={onClear}
                  className="px-2.5 py-2 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl transition"
                >
                  ลบไฟล์
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              {fileName ? `ไฟล์ที่เลือก: ${fileName}` : type === 'photo' ? 'รูปถ่ายหน้าตรงสุภาพ ขนาดไม่เกิน 4MB' : 'ไฟล์เรซูเม่ / CV ขนาดไม่เกิน 8MB'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="relative flex-1 w-full">
              <input
                type="url"
                placeholder={
                  type === 'photo'
                    ? 'วางลิงก์ Google Drive ของรูปถ่าย (เช่น https://drive.google.com/file/d/...)'
                    : 'วางลิงก์ Google Drive ของเรซูเม่ / CV (เช่น https://drive.google.com/file/d/...)'
                }
                value={valueUrl}
                onChange={(e) => onUrlChange(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-slate-800"
              />
              {isDrive && (
                <span className="absolute right-2.5 top-2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Google Drive
                </span>
              )}
            </div>

            {valueUrl && (
              <a
                href={valueUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition flex items-center gap-1 shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>ทดสอบเปิดลิงก์</span>
              </a>
            )}
          </div>

          {/* Drive Photo Preview */}
          {type === 'photo' && displayImage && (
            <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200 w-fit">
              <img src={displayImage} alt="Drive Preview" className="w-12 h-16 object-cover rounded-lg border border-slate-200" />
              <div className="text-xs">
                <span className="text-emerald-700 font-bold block">ตรวจพบรูปภาพจาก Google Drive</span>
                <span className="text-[11px] text-slate-500">แสดงผลพรีวิวเรียบร้อย</span>
              </div>
            </div>
          )}

          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>คำแนะนำ:</strong> ใน Google Drive ให้คลิกขวาที่ไฟล์ &gt; เลือก <strong>แชร์ (Share)</strong> &gt; ปรับสิทธิ์เป็น <strong>"ทุกคนที่มีลิงก์สามารถดูได้" (Anyone with the link can view)</strong> เพื่อให้คณะกรรมการสามารถเปิดดูได้
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// Component: Siblings Table (ตารางรายชื่อพี่น้อง - หน้า 1-2 PDF)
// -------------------------------------------------------------
interface SiblingsTableProps {
  siblings: SiblingInfo[];
  onChange: (siblings: SiblingInfo[]) => void;
}

export const SiblingsTable: React.FC<SiblingsTableProps> = ({ siblings, onChange }) => {
  const handleAdd = () => {
    onChange([...siblings, { name: '', age: '', occupation: '' }]);
  };

  const handleUpdate = (index: number, field: keyof SiblingInfo, value: string) => {
    const updated = [...siblings];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    onChange(siblings.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700">
          รายชื่อพี่น้อง (Siblings list)
        </label>
        <button
          type="button"
          onClick={handleAdd}
          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          <span>เพิ่มพี่น้อง</span>
        </button>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="p-2.5">ชื่อ (Name)</th>
              <th className="p-2.5 w-24">อายุ (ปี) (Age)</th>
              <th className="p-2.5">อาชีพ (Occupation)</th>
              <th className="p-2.5 w-12 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {siblings.map((s, idx) => (
              <tr key={idx}>
                <td className="p-2">
                  <input
                    type="text"
                    placeholder="ชื่อ-สกุล พี่/น้อง"
                    value={s.name}
                    onChange={(e) => handleUpdate(idx, 'name', e.target.value)}
                    className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    placeholder="เช่น 28"
                    value={s.age || ''}
                    onChange={(e) => handleUpdate(idx, 'age', e.target.value)}
                    className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    placeholder="เช่น พนักงานบริษัท / ธุรกิจส่วนตัว"
                    value={s.occupation || ''}
                    onChange={(e) => handleUpdate(idx, 'occupation', e.target.value)}
                    className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Component: Education Table (ตารางการศึกษา - หน้า 2 PDF)
// -------------------------------------------------------------
interface EducationTableProps {
  records: EducationRecord[];
  onChange: (records: EducationRecord[]) => void;
}

export const EducationTable: React.FC<EducationTableProps> = ({ records, onChange }) => {
  const handleUpdate = (index: number, field: keyof EducationRecord, value: string) => {
    const updated = [...records];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <GraduationCap className="w-4 h-4 text-blue-600" />
          <span>Education (ประวัติการศึกษา)</span>
        </label>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs">
        <table className="w-full text-left text-xs min-w-[620px]">
          <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="p-2.5 w-40">ระดับการศึกษา (Educational Level)</th>
              <th className="p-2.5">สถาบันการศึกษา (Institution)</th>
              <th className="p-2.5">สาขาวิชา (Major)</th>
              <th className="p-2.5 w-24">ตั้งแต่ (From)</th>
              <th className="p-2.5 w-24">ถึง (To)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {records.map((rec, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                <td className="p-2.5 font-bold text-slate-800 bg-slate-50/40">
                  {rec.level}
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    placeholder="เช่น โรงเรียน / วิทยาลัย / มหาวิทยาลัย"
                    value={rec.institution}
                    onChange={(e) => handleUpdate(idx, 'institution', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50/60 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    placeholder="เช่น ศิลป์-คำนวณ / บริหารธุรกิจ"
                    value={rec.major}
                    onChange={(e) => handleUpdate(idx, 'major', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50/60 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    placeholder="เช่น 2560"
                    value={rec.fromYear}
                    onChange={(e) => handleUpdate(idx, 'fromYear', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs text-center bg-slate-50/60 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    placeholder="เช่น 2564"
                    value={rec.toYear}
                    onChange={(e) => handleUpdate(idx, 'toYear', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs text-center bg-slate-50/60 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Component: Experience Table (ตารางประวัติการทำงาน - หน้า 2 PDF)
// -------------------------------------------------------------
interface ExperienceTableProps {
  experiences: WorkExperienceRecord[];
  onChange: (experiences: WorkExperienceRecord[]) => void;
}

export const ExperienceTable: React.FC<ExperienceTableProps> = ({ experiences, onChange }) => {
  const handleAdd = () => {
    onChange([
      ...experiences,
      {
        company: '',
        fromPeriod: '',
        toPeriod: '',
        position: '',
        jobDescription: '',
        salary: '',
        reasonForLeaving: '',
      },
    ]);
  };

  const handleUpdate = (index: number, field: keyof WorkExperienceRecord, value: string) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    onChange(experiences.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Briefcase className="w-4 h-4 text-blue-600" />
          <span>Working Experience In Chronological (รายละเอียดของงานที่ผ่าน เรียงลำดับก่อน-หลัง)</span>
        </label>
        <button
          type="button"
          onClick={handleAdd}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2.5 py-1 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>เพิ่มประวัติงาน</span>
        </button>
      </div>

      <div className="space-y-3">
        {experiences.map((exp, idx) => (
          <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl relative space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-700">
                สถานที่ทำงาน #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-slate-400 hover:text-rose-600 text-xs flex items-center gap-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบรายการนี้</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  สถานที่ทำงาน (Company)
                </label>
                <input
                  type="text"
                  placeholder="ชื่อบริษัท / ร้านค้า / หน่วยงาน"
                  value={exp.company}
                  onChange={(e) => handleUpdate(idx, 'company', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  ตำแหน่งงาน (Position)
                </label>
                <input
                  type="text"
                  placeholder="เช่น หัวหน้ากะ / แคชเชียร์"
                  value={exp.position}
                  onChange={(e) => handleUpdate(idx, 'position', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  ระยะเวลา (เริ่ม From - ถึง To)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="เช่น ม.ค. 65"
                    value={exp.fromPeriod}
                    onChange={(e) => handleUpdate(idx, 'fromPeriod', e.target.value)}
                    className="w-1/2 px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-center"
                  />
                  <span className="text-slate-400 text-xs">-</span>
                  <input
                    type="text"
                    placeholder="เช่น ธ.ค. 66"
                    value={exp.toPeriod}
                    onChange={(e) => handleUpdate(idx, 'toPeriod', e.target.value)}
                    className="w-1/2 px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  ค่าจ้าง (Salary)
                </label>
                <input
                  type="text"
                  placeholder="เช่น 18,000 บาท/เดือน"
                  value={exp.salary}
                  onChange={(e) => handleUpdate(idx, 'salary', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  เหตุที่ออก (Reasons of resignation)
                </label>
                <input
                  type="text"
                  placeholder="เช่น ย้ายที่พัก / มองหาความก้าวหน้า"
                  value={exp.reasonForLeaving}
                  onChange={(e) => handleUpdate(idx, 'reasonForLeaving', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  ลักษณะงาน (Job description)
                </label>
                <textarea
                  rows={2}
                  placeholder="รายละเอียดหน้าที่ความรับผิดชอบและผลงาน"
                  value={exp.jobDescription}
                  onChange={(e) => handleUpdate(idx, 'jobDescription', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Component: Language Ability Table (ตารางความสามารถทางภาษา - หน้า 2 PDF)
// -------------------------------------------------------------
interface LanguageAbilityTableProps {
  languages: {
    thai?: LanguageSkills;
    english?: LanguageSkills;
    japanese?: LanguageSkills;
    otherLangName?: string;
    other?: LanguageSkills;
  };
  onChange: (languages: any) => void;
}

export const LanguageAbilityTable: React.FC<LanguageAbilityTableProps> = ({ languages, onChange }) => {
  const updateSkill = (lang: 'thai' | 'english' | 'japanese' | 'other', skill: 'speaking' | 'writing' | 'reading', level: 'GOOD' | 'FAIR' | 'POOR') => {
    onChange({
      ...languages,
      [lang]: {
        ...(languages[lang] || {}),
        [skill]: level,
      },
    });
  };

  const rows: Array<{ key: 'thai' | 'english' | 'japanese' | 'other'; label: string; isOther?: boolean }> = [
    { key: 'thai', label: 'ภาษาไทย (Thai)' },
    { key: 'english', label: 'ภาษาอังกฤษ (English)' },
    { key: 'japanese', label: 'ภาษาญี่ปุ่น (Japan)' },
    { key: 'other', label: 'อื่นๆ (Other)', isOther: true },
  ];

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
        <Globe2 className="w-4 h-4 text-blue-600" />
        <span>Language Ability (ความสามารถด้านภาษา)</span>
      </label>

      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
        <table className="w-full text-left text-xs min-w-[550px]">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-center">
            <tr>
              <th className="p-2.5 text-left w-44">ภาษา (Language)</th>
              <th className="p-2.5" colSpan={3}>พูด (Speaking)</th>
              <th className="p-2.5 border-l border-slate-200" colSpan={3}>เขียน (Writing)</th>
              <th className="p-2.5 border-l border-slate-200" colSpan={3}>อ่าน (Reading)</th>
            </tr>
            <tr className="text-[11px] bg-slate-50 text-slate-500 font-semibold border-t border-slate-200">
              <th className="p-1"></th>
              <th className="p-1 w-12 text-center">ดี</th>
              <th className="p-1 w-12 text-center">ปานกลาง</th>
              <th className="p-1 w-12 text-center">พอใช้</th>
              <th className="p-1 w-12 text-center border-l border-slate-200">ดี</th>
              <th className="p-1 w-12 text-center">ปานกลาง</th>
              <th className="p-1 w-12 text-center">พอใช้</th>
              <th className="p-1 w-12 text-center border-l border-slate-200">ดี</th>
              <th className="p-1 w-12 text-center">ปานกลาง</th>
              <th className="p-1 w-12 text-center">พอใช้</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map(({ key, label, isOther }) => {
              const current = languages[key] || {};
              return (
                <tr key={key} className="hover:bg-slate-50/50">
                  <td className="p-2.5 font-bold text-slate-800">
                    {isOther ? (
                      <div className="space-y-1">
                        <span>อื่นๆ (ระบุ):</span>
                        <input
                          type="text"
                          placeholder="เช่น พม่า, จีน"
                          value={languages.otherLangName || ''}
                          onChange={(e) => onChange({ ...languages, otherLangName: e.target.value })}
                          className="w-full px-2 py-0.5 text-xs border border-slate-200 rounded"
                        />
                      </div>
                    ) : (
                      label
                    )}
                  </td>

                  {/* Speaking */}
                  {(['GOOD', 'FAIR', 'POOR'] as const).map(lvl => (
                    <td key={`spk-${lvl}`} className="p-1 text-center">
                      <input
                        type="radio"
                        name={`lang-spk-${key}`}
                        checked={current.speaking === lvl}
                        onChange={() => updateSkill(key, 'speaking', lvl)}
                        className="w-3.5 h-3.5 text-blue-600 cursor-pointer"
                      />
                    </td>
                  ))}

                  {/* Writing */}
                  {(['GOOD', 'FAIR', 'POOR'] as const).map((lvl, i) => (
                    <td key={`wrt-${lvl}`} className={`p-1 text-center ${i === 0 ? 'border-l border-slate-200' : ''}`}>
                      <input
                        type="radio"
                        name={`lang-wrt-${key}`}
                        checked={current.writing === lvl}
                        onChange={() => updateSkill(key, 'writing', lvl)}
                        className="w-3.5 h-3.5 text-blue-600 cursor-pointer"
                      />
                    </td>
                  ))}

                  {/* Reading */}
                  {(['GOOD', 'FAIR', 'POOR'] as const).map((lvl, i) => (
                    <td key={`rd-${lvl}`} className={`p-1 text-center ${i === 0 ? 'border-l border-slate-200' : ''}`}>
                      <input
                        type="radio"
                        name={`lang-rd-${key}`}
                        checked={current.reading === lvl}
                        onChange={() => updateSkill(key, 'reading', lvl)}
                        className="w-3.5 h-3.5 text-blue-600 cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Component: References Table (ผู้ที่อ้างถึง 2 คน - หน้า 3 PDF)
// -------------------------------------------------------------
interface ReferencesTableProps {
  references: JobReferenceContact[];
  onChange: (refs: JobReferenceContact[]) => void;
}

export const ReferencesTable: React.FC<ReferencesTableProps> = ({ references, onChange }) => {
  const updateRef = (index: number, field: keyof JobReferenceContact, value: string) => {
    const updated = [...references];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="text-xs">
        <label className="font-bold text-slate-800 block">
          เขียนชื่อ ที่อยู่ โทรศัพท์ และอาชีพของผู้ที่อ้างถึง 2 คน (ซึ่งไม่ใช่ญาติ หรือนายจ้างเดิม) ที่รู้จักคุ้นเคยตัวท่านดี
        </label>
        <span className="text-[11px] text-slate-500">
          List name, address, telephone and occupation of 2 references who know you
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {references.slice(0, 2).map((ref, idx) => (
          <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <span className="text-xs font-bold text-blue-900 block">
              ผู้รับรองบุคคลคนที่ {idx + 1}
            </span>
            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  placeholder="เช่น นายสมเกียรติ มั่นคง"
                  value={ref.name}
                  onChange={(e) => updateRef(idx, 'name', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">อาชีพ / ตำแหน่ง</label>
                <input
                  type="text"
                  placeholder="เช่น ครู/อาจารย์, ข้าราชการ, ผู้จัดการ"
                  value={ref.occupation}
                  onChange={(e) => updateRef(idx, 'occupation', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">เบอร์โทรศัพท์ติดต่อ</label>
                <input
                  type="tel"
                  placeholder="08X-XXX-XXXX"
                  value={ref.phone}
                  onChange={(e) => updateRef(idx, 'phone', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">ที่อยู่ / สถานที่ทำงาน</label>
                <input
                  type="text"
                  placeholder="จังหวัด หรือ สถานที่ติดต่อ"
                  value={ref.address || ''}
                  onChange={(e) => updateRef(idx, 'address', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Component: Certification & Declaration (หน้า 4 PDF - รับรองความถูกต้อง)
// หมายเหตุ: ตัดส่วน "การพิจารณาว่าจ้าง" ออกตามคำสั่งผู้ใช้
// -------------------------------------------------------------
interface CertificationDeclarationBoxProps {
  signatureName: string;
  onSignatureChange: (name: string) => void;
  isAgreed: boolean;
  onAgreedChange: (agreed: boolean) => void;
}

export const CertificationDeclarationBox: React.FC<CertificationDeclarationBoxProps> = ({
  signatureName,
  onSignatureChange,
  isAgreed,
  onAgreedChange,
}) => {
  return (
    <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-7 space-y-5 border border-slate-800 shadow-xl">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        <h3 className="text-sm sm:text-base font-bold tracking-tight text-white">
          การรับรองความถูกต้องของข้อมูล (Declaration & Certification)
        </h3>
      </div>

      {/* Official Legal Text from PDF Page 4 */}
      <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 text-xs leading-relaxed text-slate-200">
        <p className="font-semibold text-slate-100">
          ข้าพเจ้าขอรับรองว่า ข้อความดังกล่าวทั้งหมดในใบสมัครนี้เป็นความจริงทุกประการ หลังจากบริษัทจ้างเข้ามาทำงานแล้วปรากฏว่าข้อความในใบสมัครงาน เอกสารที่นำมาแสดง หรือรายละเอียดที่ให้ไว้ไม่เป็นความจริง บริษัทฯ มีสิทธิ์ที่จะเลิกจ้างข้าพเจ้าได้โดยไม่ต้องจ่ายเงินชดเชยหรือค่าเสียหายใดๆ ทั้งสิ้น
        </p>
        <p className="text-[11px] text-slate-400 italic">
          I certify all statement given in this application form is true if any is found to be untrue after engagement. The Company has right to terminate my employment without any compensation or severance pay what soever.
        </p>
      </div>

      {/* Checkbox agreement */}
      <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700 cursor-pointer">
        <input
          type="checkbox"
          checked={isAgreed}
          onChange={(e) => onAgreedChange(e.target.checked)}
          className="w-4 h-4 mt-0.5 text-blue-500 rounded border-slate-600 focus:ring-blue-400"
        />
        <div className="text-xs">
          <span className="font-bold text-white block">
            ข้าพเจ้ารับทราบและยอมรับข้อความข้างต้นทั้งหมด <span className="text-rose-400">*</span>
          </span>
          <span className="text-[11px] text-slate-400">
            ยินยอมให้บริษัทตรวจสอบประวัติและเอกสารประกอบการพิจารณาตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA)
          </span>
        </div>
      </label>

      {/* Applicant Signature */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="w-full sm:max-w-xs space-y-1">
          <label className="text-xs font-bold text-slate-300 block">
            ลายมือชื่อผู้สมัคร (Applicants signature / พิมพ์ชื่อ-สกุล) <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="พิมพ์ชื่อ-นามสกุล เพื่อยืนยันลายมือชื่อ"
            value={signatureName}
            onChange={(e) => onSignatureChange(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 font-serif"
          />
        </div>

        <div className="text-right text-[11px] text-slate-400 self-end sm:self-center">
          วันที่บันทึก: <span className="font-mono text-slate-200">{new Date().toLocaleDateString('th-TH')}</span>
        </div>
      </div>
    </div>
  );
};

