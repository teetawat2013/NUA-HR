import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  X, 
  Save, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  FileText, 
  Clock, 
  UserCheck, 
  Image as ImageIcon, 
  Check, 
  Share2, 
  Upload, 
  Link as LinkIcon, 
  ExternalLink,
  Sparkles,
  Info
} from 'lucide-react';
import { JobApplicationSettings, CompanySettings } from '../types';
import { isGoogleDriveUrl, resolveDisplayImageUrl } from '../utils/googleDrive';
import { showErrorAlert } from '../utils/swal';

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: JobApplicationSettings;
  onSave: (updatedSettings: JobApplicationSettings) => void;
}

export const CompanySettingsModal: React.FC<CompanySettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [formData, setFormData] = useState<CompanySettings>({
    companyName: settings.companyName || '',
    companyTagline: settings.companyTagline || '',
    companyLogoUrl: settings.companyLogoUrl || '',
    companyAddress: settings.companyAddress || settings.workLocation || '',
    taxId: settings.taxId || '',
    branchName: settings.branchName || 'สำนักงานใหญ่ (เชียงใหม่)',
    website: settings.website || '',
    contactPhone: settings.contactPhone || '',
    contactEmail: settings.contactEmail || '',
    contactLineId: settings.contactLineId || '',
    contactFacebook: settings.contactFacebook || '',
    hrManagerName: settings.hrManagerName || '',
    businessHours: settings.businessHours || 'จันทร์ - ศุกร์ 08:30 - 17:30 น.',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [logoInputType, setLogoInputType] = useState<'url' | 'drive' | 'upload'>('url');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        companyName: settings.companyName || '',
        companyTagline: settings.companyTagline || '',
        companyLogoUrl: settings.companyLogoUrl || '',
        companyAddress: settings.companyAddress || settings.workLocation || '',
        taxId: settings.taxId || '',
        branchName: settings.branchName || 'สำนักงานใหญ่ (เชียงใหม่)',
        website: settings.website || '',
        contactPhone: settings.contactPhone || '',
        contactEmail: settings.contactEmail || '',
        contactLineId: settings.contactLineId || '',
        contactFacebook: settings.contactFacebook || '',
        hrManagerName: settings.hrManagerName || '',
        businessHours: settings.businessHours || 'จันทร์ - ศุกร์ 08:30 - 17:30 น.',
      });
      setSavedSuccess(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleChange = (field: keyof CompanySettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showErrorAlert('ไฟล์มีขนาดใหญ่เกินไป', 'ขนาดไฟล์โลโก้ต้องไม่เกิน 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target?.result as string;
      setFormData(prev => ({ ...prev, companyLogoUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: JobApplicationSettings = {
      ...settings,
      ...formData,
      workLocation: formData.companyAddress || settings.workLocation,
      lastUpdated: new Date().toISOString(),
    };
    onSave(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const displayLogoUrl = resolveDisplayImageUrl(formData.companyLogoUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-blue-300 border border-white/10 shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                ตั้งค่าข้อมูลบริษัท (Company Settings)
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  HR Portal
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                ข้อมูลบริษัทจะแสดงบนแบบฟอร์มรับสมัครงาน ลิงก์ออนไลน์ ใบสมัครงาน และเอกสารของพนักงาน
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

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Section 1: ข้อมูลนิติบุคคล & แบรนด์ */}
          <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 pb-2 border-b border-slate-200">
              <Building2 className="w-4 h-4 text-blue-600" />
              ข้อมูลทั่วไปและแบรนด์องค์กร (Brand & Company Profile)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  ชื่อบริษัท / องค์กร (ภาษาไทยหรืออังกฤษ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น บริษัท เอชอาร์เอ็ม โปร จำกัด"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-900 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  คำขวัญ / สโลแกน / แบรนด์ (Tagline)
                </label>
                <input
                  type="text"
                  placeholder="เช่น ผู้นำด้านธุรกิจร้านอาหารและการบริการครบวงจร"
                  value={formData.companyTagline || ''}
                  onChange={(e) => handleChange('companyTagline', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  สาขา / สำนักงาน (Branch Name)
                </label>
                <input
                  type="text"
                  placeholder="เช่น สำนักงานใหญ่ (เชียงใหม่)"
                  value={formData.branchName || ''}
                  onChange={(e) => handleChange('branchName', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เลขประจำตัวผู้เสียภาษีอากร 13 หลัก (Tax ID)
                </label>
                <input
                  type="text"
                  placeholder="เช่น 0505562001234"
                  value={formData.taxId || ''}
                  onChange={(e) => handleChange('taxId', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อผู้จัดการฝ่ายบุคคล / ผู้รับผิดชอบ (HR Manager)
                </label>
                <input
                  type="text"
                  placeholder="เช่น คุณสมศรี ผู้จัดการฝ่ายทรัพยากรบุคคล"
                  value={formData.hrManagerName || ''}
                  onChange={(e) => handleChange('hrManagerName', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Logo Section */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                โลโก้บริษัท (Company Logo)
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 bg-white rounded-xl border border-slate-200">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                  {displayLogoUrl ? (
                    <img src={displayLogoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Building2 className="w-7 h-7 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLogoInputType('url')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                        logoInputType === 'url' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      เว็บ URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoInputType('drive')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition flex items-center gap-1 ${
                        logoInputType === 'drive' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Share2 className="w-3 h-3" />
                      Google Drive
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoInputType('upload')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition flex items-center gap-1 ${
                        logoInputType === 'upload' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      อัปโหลดไฟล์
                    </button>
                  </div>

                  {logoInputType === 'upload' ? (
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer border border-slate-200">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>เลือกไฟล์รูปภาพโลโก้ (PNG/JPG)</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  ) : (
                    <div className="relative">
                      <input
                        type="url"
                        placeholder={
                          logoInputType === 'drive'
                            ? 'วางลิงก์แชร์ Google Drive ของรูปโลโก้...'
                            : 'https://example.com/logo.png'
                        }
                        value={formData.companyLogoUrl || ''}
                        onChange={(e) => handleChange('companyLogoUrl', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                      />
                      {isGoogleDriveUrl(formData.companyLogoUrl) && (
                        <span className="absolute right-2 top-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                          Drive Link
                        </span>
                      )}
                    </div>
                  )}

                  {logoInputType === 'drive' && (
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                      <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>เคล็ดลับ: ตั้งค่าแชร์ใน Google Drive ให้เป็น "ทุกคนที่มีลิงก์สามารถดูได้" (Anyone with the link) เพื่อให้แสดงผลได้ถูกต้อง</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: ที่อยู่และการติดต่อ */}
          <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 pb-2 border-b border-slate-200">
              <MapPin className="w-4 h-4 text-blue-600" />
              สถานที่ตั้ง & ช่องทางการติดต่อ (Location & Contact Info)
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  ที่อยู่สำนักงาน / สถานที่ปฏิบัติงานหลัก (Full Address) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="เช่น 123 ถนนนิมมานเหมินท์ ตำบลสุเทพ อำเภอเมือง จังหวัดเชียงใหม่ 50200"
                  value={formData.companyAddress || ''}
                  onChange={(e) => handleChange('companyAddress', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    เบอร์โทรศัพท์ติดต่อ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="053-123456 / 089-9998888"
                    value={formData.contactPhone}
                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    อีเมลฝ่ายบุคคล (Email) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="hr@hrm-pro.com"
                    value={formData.contactEmail}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-slate-400" />
                    เว็บไซต์ (Website URL)
                  </label>
                  <input
                    type="text"
                    placeholder="https://www.hrm-pro.com"
                    value={formData.website || ''}
                    onChange={(e) => handleChange('website', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    LINE Official Account / ID
                  </label>
                  <input
                    type="text"
                    placeholder="@hrmpro_jobs"
                    value={formData.contactLineId || ''}
                    onChange={(e) => handleChange('contactLineId', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-emerald-700 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Facebook Page / Social Link
                  </label>
                  <input
                    type="text"
                    placeholder="facebook.com/hrmprothailand"
                    value={formData.contactFacebook || ''}
                    onChange={(e) => handleChange('contactFacebook', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-blue-700 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    เวลาทำการ / วันทำงาน (Business Hours)
                  </label>
                  <input
                    type="text"
                    placeholder="จันทร์ - ศุกร์ 08:30 - 17:30 น."
                    value={formData.businessHours || ''}
                    onChange={(e) => handleChange('businessHours', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Box */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>ตัวอย่างการแสดงผลบนหัวเอกสารใบสมัคร (Live Header Preview)</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-blue-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                {displayLogoUrl ? (
                  <img src={displayLogoUrl} alt="Preview" className="w-full h-full object-contain p-0.5" />
                ) : (
                  <Building2 className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div className="text-xs">
                <div className="font-black text-slate-900">
                  {formData.companyName || 'ชื่อบริษัท'}
                </div>
                <div className="text-[11px] text-slate-500 line-clamp-1">
                  {formData.companyTagline || 'คำขวัญ / สโลแกน'} • {formData.contactPhone || 'เบอร์โทร'}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">
              บันทึกแล้วจะซิงค์ไปยัง Cloud Firestore และอัปเดตแบบฟอร์มทันที
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs flex items-center gap-2"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>บันทึกสำเร็จ!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>บันทึกข้อมูลบริษัท</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
