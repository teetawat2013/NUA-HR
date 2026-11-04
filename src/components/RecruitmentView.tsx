import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Briefcase, 
  Users, 
  UserPlus, 
  FileText, 
  Search, 
  Filter, 
  ExternalLink, 
  Copy, 
  Check, 
  QrCode, 
  Printer, 
  Download, 
  Calendar, 
  Clock, 
  DollarSign, 
  MapPin, 
  Phone, 
  Mail, 
  UserCheck, 
  XCircle, 
  AlertCircle, 
  Eye, 
  Edit3, 
  Trash2, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  Building2, 
  Share2,
  ChevronRight,
  ShieldCheck,
  Send,
  MessageSquare,
  FileSpreadsheet,
  Link2,
  Archive,
  X
} from 'lucide-react';
import { 
  JobOpening, 
  JobApplicationSettings, 
  JobApplication, 
  JobApplicationStatus, 
  Employee, 
  Department, 
  EmploymentType, 
  DEPARTMENTS, 
  BRANCHES,
  DEFAULT_JOB_SETTINGS 
} from '../types';
import { CompanySettingsModal } from './CompanySettingsModal';
import { GenerateApplicationLinkModal, copyToClipboardSafe } from './GenerateApplicationLinkModal';
import { isGoogleDriveUrl, resolveDisplayImageUrl } from '../utils/googleDrive';
import { showSuccessAlert, showErrorAlert, showConfirmDialog, showToast } from '../utils/swal';

interface RecruitmentViewProps {
  applications: JobApplication[];
  settings: JobApplicationSettings;
  onUpdateSettings: (settings: JobApplicationSettings) => void;
  onUpdateApplicationStatus: (appId: string, status: JobApplicationStatus, hrNotes?: string, interviewDate?: string, interviewLocation?: string) => void;
  onDeleteApplication: (appId: string) => void;
  onConvertToEmployee: (application: JobApplication) => void;
  onOpenApplyPage: (jobId?: string) => void;
  onAddApplication?: (application: JobApplication) => void;
}

export const RecruitmentView: React.FC<RecruitmentViewProps> = ({
  applications = [],
  settings = DEFAULT_JOB_SETTINGS,
  onUpdateSettings,
  onUpdateApplicationStatus,
  onDeleteApplication,
  onConvertToEmployee,
  onOpenApplyPage,
  onAddApplication,
}) => {
  // Navigation inside recruitment view
  const [activeTab, setActiveTab] = useState<'applications' | 'openings' | 'poster'>('applications');
  
  // Search and filter for applications
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | JobApplicationStatus>('ALL');
  const [deptFilter, setDeptFilter] = useState<'ALL' | Department>('ALL');

  // Selected application for detail modal
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);

  // Interview scheduling modal state
  const [interviewModalApp, setInterviewModalApp] = useState<JobApplication | null>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewLocation, setInterviewLocation] = useState('สำนักงานใหญ่ (ห้องประชุม 1) หรือ Google Meet');
  const [interviewNotes, setInterviewNotes] = useState('');

  // Job Opening editing modal state
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
  const [editingOpening, setEditingOpening] = useState<JobOpening | null>(null);
  const [openingForm, setOpeningForm] = useState<Partial<JobOpening>>({
    title: '',
    department: 'แผนกบริการหน้าร้าน',
    branch: 'สำนักงานใหญ่ (เชียงใหม่)',
    employmentType: 'FULL_TIME',
    positionsAvailable: 1,
    salaryRange: '15,000 - 18,000 บาท',
    description: '',
    qualifications: ['อายุ 18 ปีขึ้นไป', 'มีใจรักงานบริการ'],
    isActive: true,
    urgent: false,
  });

  // Settings editing state
  const [settingsForm, setSettingsForm] = useState<JobApplicationSettings>(settings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isCompanySettingsModalOpen, setIsCompanySettingsModalOpen] = useState(false);
  const [isLinkGeneratorOpen, setIsLinkGeneratorOpen] = useState(false);
  const [generatorTargetJobId, setGeneratorTargetJobId] = useState<string | undefined>(undefined);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Share URL & QR Code state
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  // Target public application URL
  const publicApplyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?page=apply`
    : 'https://hrm-pro.local?page=apply';

  // Generate QR Code on mount or url change
  useEffect(() => {
    QRCode.toDataURL(publicApplyUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code:', err));
  }, [publicApplyUrl]);

  // Sync settingsForm when prop changes
  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  // Metrics
  const totalCount = applications.length;
  const pendingCount = applications.filter(a => a.status === 'PENDING').length;
  const interviewCount = applications.filter(a => a.status === 'INTERVIEW_SCHEDULED').length;
  const retainedCount = applications.filter(a => a.status === 'RETAINED').length;
  const hiredCount = applications.filter(a => a.status === 'HIRED').length;
  const activeOpeningsCount = (settings.openings || []).filter(o => o.isActive).length;

  // Filtered Applications
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = app.fullName.toLowerCase().includes(q);
        const matchNick = (app.nickname || '').toLowerCase().includes(q);
        const matchPos = app.position.toLowerCase().includes(q);
        const matchPhone = (app.phoneNumber || '').includes(q);
        const matchEmail = (app.email || '').toLowerCase().includes(q);
        if (!matchName && !matchNick && !matchPos && !matchPhone && !matchEmail) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;

      // Department filter
      if (deptFilter !== 'ALL' && app.department !== deptFilter) return false;

      return true;
    });
  }, [applications, searchQuery, statusFilter, deptFilter]);

  // Copy link
  const handleCopyLink = async () => {
    const ok = await copyToClipboardSafe(publicApplyUrl);
    if (ok) {
      setCopiedUrl(true);
      setToastNotification('คัดลอกลิงก์ใบสมัครเรียบร้อยแล้ว!');
      setTimeout(() => {
        setCopiedUrl(false);
        setToastNotification(null);
      }, 3500);
    }
  };

  // Generate Demo Candidate for Testing
  const handleGenerateDemoCandidate = () => {
    if (!onAddApplication) {
      setToastNotification('ฟังก์ชันนี้พร้อมใช้งานเมื่อเชื่อมต่อระบบข้อมูล');
      setTimeout(() => setToastNotification(null), 3000);
      return;
    }
    const activeJobs = (settings.openings || []).filter(o => o.isActive);
    const chosenJob = activeJobs[Math.floor(Math.random() * activeJobs.length)] || settings.openings[0];
    const sampleCandidates = [
      { name: 'กิตติศักดิ์ มั่นคง', nickname: 'กิต', gender: 'MALE' as const, phone: '081-456-7890', edu: 'ปริญญาตรี', field: 'การโรงแรม', exp: 2 },
      { name: 'พิมพิศา วงศ์สว่าง', nickname: 'แพรว', gender: 'FEMALE' as const, phone: '089-765-4321', edu: 'ปวส.', field: 'การบัญชีและการเงิน', exp: 1 },
      { name: 'อ่อง มิน ตัน (Aung Min Tun)', nickname: 'อ่อง', gender: 'MALE' as const, phone: '095-234-5678', edu: 'มัธยมศึกษา', field: 'ทั่วไป', exp: 3, isForeign: true },
      { name: 'ณัฐพงษ์ ศรีสะอาด', nickname: 'นัท', gender: 'MALE' as const, phone: '082-345-6789', edu: 'ปริญญาตรี', field: 'การตลาด', exp: 2 },
    ];
    const c = sampleCandidates[Math.floor(Math.random() * sampleCandidates.length)];
    const now = new Date();
    const newApp: JobApplication = {
      id: `APP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      appliedAt: now.toISOString(),
      status: 'PENDING',
      jobOpeningId: chosenJob?.id,
      position: chosenJob?.title || 'พนักงานบริการหน้าร้าน',
      department: chosenJob?.department || 'แผนกบริการหน้าร้าน',
      branch: chosenJob?.branch || settings.workLocation || 'สำนักงานใหญ่ (เชียงใหม่)',
      expectedSalary: 16000,
      availableStartDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      desiredEmploymentType: 'FULL_TIME',
      fullName: c.name,
      nickname: c.nickname,
      gender: c.gender,
      birthDate: '1999-04-12',
      idCardNumber: '1509900456789',
      phoneNumber: c.phone,
      email: `${c.nickname.toLowerCase()}${Math.floor(Math.random() * 100)}@hrm-demo.com`,
      currentAddress: 'เชียงใหม่',
      isForeignWorker: !!c.isForeign,
      nationalityText: c.isForeign ? 'เมียนมา' : 'ไทย',
      identificationType: c.isForeign ? 'PASSPORT' : 'THAI_ID',
      educationLevel: c.edu,
      fieldOfStudy: c.field,
      experienceYears: c.exp,
      previousCompany: 'ร้านอาหารเชียงใหม่',
      previousPosition: 'พนักงานประจำ',
      skills: 'สื่อสารภาษาไทยคล่องแคล่ว มีใจรักงานบริการ ตรงต่อเวลา ทำงานเป็นกะได้',
      emergencyContactName: 'ผู้ปกครอง',
      emergencyContactRelation: 'ครอบครัว',
      emergencyContactPhone: c.phone,
      canWorkInShifts: true,
      hasDriversLicense: true,
      introduction: 'ต้องการร่วมงานกับบริษัทที่มีความมั่นคง และพร้อมเรียนรู้สิ่งใหม่ๆ ครับ',
    };
    onAddApplication(newApp);
    showSuccessAlert(
      'สร้างใบสมัครตัวอย่างสำเร็จ!',
      `ผู้สมัคร: ${newApp.fullName}\nตำแหน่ง: ${newApp.position}\n(สามารถคลิกเพื่อตรวจสอบข้อมูลและทดสอบการนัดสัมภาษณ์หรือรับเข้าทำงานได้ทันที)`
    );
  };

  // Download QR Code PNG
  const handleDownloadQrCode = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `HRM-Pro-Job-Application-QR-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Share via LINE
  const handleShareLine = () => {
    const text = `[ประกาศรับสมัครงาน] ${settings.companyName}\nเปิดรับสมัครพนักงานหลายตำแหน่ง สนใจกรอกใบสมัครออนไลน์ได้ที่:\n${publicApplyUrl}`;
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, '_blank');
  };

  // Copy Social Post
  const handleCopySocialPost = async () => {
    const openingsText = (settings.openings || []).filter(o => o.isActive).map(o => `• ${o.title} (${o.salaryRange})`).join('\n');
    const text = `[ประกาศรับสมัครงานด่วน]\n${settings.companyName}\n${settings.companyTagline || ''}\n\nตำแหน่งที่เปิดรับ:\n${openingsText}\n\nสถานที่: ${settings.companyAddress || settings.workLocation || ''}\nโทร: ${settings.contactPhone}\n\nกรอกใบสมัครออนไลน์ได้ทันทีที่นี่:\n${publicApplyUrl}`;
    await copyToClipboardSafe(text);
    setToastNotification('คัดลอกข้อความประกาศรับสมัครงานพร้อมลิงก์เรียบร้อยแล้ว!');
    setTimeout(() => setToastNotification(null), 3500);
  };

  // Open Edit Opening Modal
  const handleOpenAddOpening = () => {
    setEditingOpening(null);
    setOpeningForm({
      id: `JOB-${Date.now().toString().slice(-4)}`,
      title: '',
      department: 'แผนกบริการหน้าร้าน',
      branch: settings.workLocation || 'สำนักงานใหญ่ (เชียงใหม่)',
      employmentType: 'FULL_TIME',
      positionsAvailable: 1,
      salaryRange: '15,000 - 18,000 บาท/เดือน',
      description: '',
      qualifications: ['อายุ 18 ปีขึ้นไป มีใจรักงานบริการ'],
      isActive: true,
      urgent: false,
    });
    setIsOpeningModalOpen(true);
  };

  const handleOpenEditOpening = (job: JobOpening) => {
    setEditingOpening(job);
    setOpeningForm({ ...job });
    setIsOpeningModalOpen(true);
  };

  // Save Opening Form
  const handleSaveOpening = () => {
    if (!openingForm.title?.trim()) {
      setToastNotification('กรุณากรอกชื่อตำแหน่งงาน');
      setTimeout(() => setToastNotification(null), 3000);
      return;
    }

    const currentOpenings = [...(settings.openings || [])];
    if (editingOpening) {
      // Update existing
      const updated = currentOpenings.map(o => o.id === editingOpening.id ? { ...o, ...openingForm } as JobOpening : o);
      onUpdateSettings({ ...settings, openings: updated });
    } else {
      // Add new
      const newJob: JobOpening = {
        id: `JOB-${Date.now().toString().slice(-4)}`,
        title: openingForm.title || '',
        department: openingForm.department || 'แผนกบริการหน้าร้าน',
        branch: openingForm.branch || settings.workLocation || 'สำนักงานใหญ่ (เชียงใหม่)',
        employmentType: openingForm.employmentType || 'FULL_TIME',
        positionsAvailable: openingForm.positionsAvailable || 1,
        salaryRange: openingForm.salaryRange || '15,000 - 18,000 บาท',
        description: openingForm.description || '',
        qualifications: openingForm.qualifications || [],
        isActive: openingForm.isActive !== undefined ? openingForm.isActive : true,
        urgent: !!openingForm.urgent,
        createdAt: new Date().toISOString(),
      };
      onUpdateSettings({ ...settings, openings: [newJob, ...currentOpenings] });
    }

    setIsOpeningModalOpen(false);
  };

  // Delete Opening
  const handleDeleteOpening = async (jobId: string) => {
    const confirmed = await showConfirmDialog('ลบตำแหน่งงาน?', 'ยืนยันการลบตำแหน่งงานนี้?', 'ลบตำแหน่งงาน', 'ยกเลิก');
    if (confirmed) {
      const updated = (settings.openings || []).filter(o => o.id !== jobId);
      onUpdateSettings({ ...settings, openings: updated });
      showToast('ลบตำแหน่งงานเรียบร้อย');
    }
  };

  // Toggle Opening Active
  const handleToggleOpeningActive = (jobId: string) => {
    const updated = (settings.openings || []).map(o => o.id === jobId ? { ...o, isActive: !o.isActive } : o);
    onUpdateSettings({ ...settings, openings: updated });
  };

  // Save Settings Changes (Company contact, open/closed, requirements)
  const handleSaveSettings = () => {
    setIsSavingSettings(true);
    onUpdateSettings(settingsForm);
    setTimeout(() => {
      setIsSavingSettings(false);
      showSuccessAlert('บันทึกสำเร็จ', 'บันทึกการตั้งค่าระบบรับสมัครงานเรียบร้อยแล้ว');
    }, 400);
  };

  // Open Interview Schedule Modal
  const handleOpenInterviewModal = (app: JobApplication) => {
    setInterviewModalApp(app);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const tomorrowStr = tomorrow.toISOString().slice(0, 16);
    setInterviewDate(app.interviewDate || tomorrowStr);
    setInterviewLocation(app.interviewLocation || 'สำนักงานใหญ่ (ห้องประชุม 1) หรือ Google Meet');
    setInterviewNotes(app.hrNotes || '');
  };

  // Save Interview Schedule
  const handleSaveInterviewSchedule = () => {
    if (!interviewModalApp) return;
    onUpdateApplicationStatus(
      interviewModalApp.id, 
      'INTERVIEW_SCHEDULED', 
      interviewNotes, 
      interviewDate, 
      interviewLocation
    );
    setInterviewModalApp(null);
  };

  // Export applications to CSV
  const handleExportApplicationsCSV = () => {
    if (applications.length === 0) {
      showErrorAlert('ไม่พบข้อมูล', 'ไม่มีข้อมูลใบสมัครสำหรับส่งออก');
      return;
    }

    const headers = [
      'รหัสใบสมัคร',
      'วันที่สมัคร',
      'สถานะ',
      'ตำแหน่งที่สมัคร',
      'แผนก',
      'เงินเดือนที่คาดหวัง',
      'วันที่พร้อมเริ่มงาน',
      'ชื่อ-นามสกุล',
      'ชื่อเล่น',
      'เพศ',
      'วันเกิด',
      'เลขบัตรประชาชน/Passport',
      'เบอร์โทร',
      'อีเมล',
      'LINE ID',
      'ที่อยู่',
      'สัญชาติ',
      'ระดับการศึกษา',
      'ประสบการณ์(ปี)',
      'ที่ทำงานล่าสุด',
      'ทักษะ',
      'บุคคลติดต่อฉุกเฉิน',
      'เบอร์ฉุกเฉิน',
      'บันทึกHR',
      'วันนัดสัมภาษณ์'
    ];

    const rows = applications.map(app => [
      app.id,
      `"${app.appliedAt}"`,
      app.status,
      `"${app.position}"`,
      `"${app.department}"`,
      app.expectedSalary,
      app.availableStartDate,
      `"${app.fullName}"`,
      `"${app.nickname || ''}"`,
      app.gender,
      app.birthDate,
      `"${app.idCardNumber || ''}"`,
      `"${app.phoneNumber}"`,
      `"${app.email || ''}"`,
      `"${app.lineId || ''}"`,
      `"${app.currentAddress || ''}"`,
      `"${app.nationalityText || 'ไทย'}"`,
      `"${app.educationLevel || ''}"`,
      app.experienceYears,
      `"${app.previousCompany || ''}"`,
      `"${app.skills || ''}"`,
      `"${app.emergencyContactName || ''}"`,
      `"${app.emergencyContactPhone || ''}"`,
      `"${app.hrNotes || ''}"`,
      `"${app.interviewDate || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `job_applications_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#6e1422] via-[#8B1C2D] to-[#550c18] rounded-3xl p-5 sm:p-7 text-white shadow-lg relative overflow-hidden border border-[#8B1C2D]/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-0.5 text-xs font-bold bg-[#F0E7C2]/20 text-[#F0E7C2] rounded-full border border-[#F0E7C2]/30 backdrop-blur-xs">
                ระบบจัดการรับสมัครงาน & ใบสมัครออนไลน์
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 text-xs font-bold rounded-full border ${
                settings.isOpen 
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' 
                  : 'bg-rose-500/20 text-rose-200 border-rose-400/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${settings.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                <span>{settings.isOpen ? 'เปิดรับสมัครออนไลน์' : 'ปิดรับสมัครชั่วคราว'}</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              กำหนดใบสมัคร & คัดเลือกผู้สมัครงาน
            </h2>
            <p className="text-xs sm:text-sm text-[#F0E7C2]/80 mt-1 max-w-xl">
              กำหนดตำแหน่งงานที่ต้องการเปิดรับ ส่งลิงก์หรือ QR Code ให้ผู้สมัครกรอกผ่านมือถือ แล้วนำเข้าเป็นพนักงานได้ในคลิกเดียว
            </p>
          </div>

          {/* Quick Share URL & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setGeneratorTargetJobId(undefined);
                setIsLinkGeneratorOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-700/25 cursor-pointer ring-1 ring-white/20"
            >
              <Link2 className="w-4 h-4" />
              <span>สร้างลิงก์ใบสมัคร (Create Link)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCompanySettingsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>ตั้งค่าข้อมูลบริษัท (Company Settings)</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopyLink()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer backdrop-blur-xs"
              title="คัดลอกลิงก์หน้ากรอกใบสมัครส่งให้ผู้สมัคร"
            >
              {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedUrl ? 'คัดลอกลิงก์แล้ว!' : 'คัดลอก URL'}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenApplyPage()}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>เปิดดูหน้าผู้สมัคร</span>
            </button>
          </div>
        </div>

        {/* In-app Toast Banner */}
        {toastNotification && (
          <div className="mt-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastNotification}</span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'applications'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>รายการใบสมัครทั้งหมด</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            activeTab === 'applications' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
          }`}>
            {totalCount}
          </span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
              {pendingCount} ใหม่
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('openings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'openings'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>กำหนดตำแหน่งงาน & แบบฟอร์ม</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            activeTab === 'openings' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {activeOpeningsCount} ตำแหน่ง
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('poster')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'poster'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>ลิงก์รับสมัคร & โปสเตอร์ QR Code</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: APPLICATIONS LIST (รายการใบสมัครงาน) */}
      {/* ========================================================= */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          
          {/* Metrics 5 Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 block">ใบสมัครทั้งหมด</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">{totalCount}</span>
                <span className="text-xs text-slate-500">คน</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs bg-amber-50/20">
              <span className="text-xs font-semibold text-amber-700 block">รอพิจารณา (Pending)</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-amber-600">{pendingCount}</span>
                <span className="text-xs text-slate-500">คน</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-2xs bg-purple-50/20">
              <span className="text-xs font-semibold text-purple-700 block">นัดสัมภาษณ์ (Interview)</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-purple-600">{interviewCount}</span>
                <span className="text-xs text-slate-500">คน</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs bg-blue-50/20">
              <span className="text-xs font-semibold text-blue-700 block">เก็บประวัติ (Retained)</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-blue-600">{retainedCount}</span>
                <span className="text-xs text-slate-500">คน</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs bg-emerald-50/20 col-span-2 sm:col-span-1">
              <span className="text-xs font-semibold text-emerald-700 block">รับเข้าทำงานแล้ว (Hired)</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600">{hiredCount}</span>
                <span className="text-xs text-slate-500">คน</span>
              </div>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, ตำแหน่ง, เบอร์โทร..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Status Select */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
              >
                <option value="ALL">สถานะทั้งหมด</option>
                <option value="PENDING">รอพิจารณา</option>
                <option value="REVIEWING">กำลังตรวจสอบ</option>
                <option value="INTERVIEW_SCHEDULED">นัดสัมภาษณ์แล้ว</option>
                <option value="APPROVED">ผ่านการคัดเลือก</option>
                <option value="RETAINED">เก็บประวัติไว้ (สำรอง)</option>
                <option value="HIRED">รับเข้าทำงานแล้ว</option>
                <option value="REJECTED">ไม่ผ่านการพิจารณา</option>
              </select>

              {/* Department Select */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
              >
                <option value="ALL">ทุกแผนก</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
              {onAddApplication && (
                <button
                  type="button"
                  onClick={handleGenerateDemoCandidate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                  title="สร้างใบสมัครตัวอย่างสำหรับทดสอบระบบ"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>สร้างใบสมัครตัวอย่าง (Demo)</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExportApplicationsCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                title="ส่งออกรายชื่อผู้สมัครเป็นไฟล์ CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>ส่งออก CSV</span>
              </button>
            </div>
          </div>

          {/* Applications Table / Cards */}
          {filteredApplications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-3">
                    
                    {/* Top Row: Avatar & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {app.photoUrl ? (
                          <div className="relative shrink-0">
                            <img
                              src={resolveDisplayImageUrl(app.photoUrl)}
                              alt={app.fullName}
                              className="w-12 h-12 object-cover rounded-xl border border-slate-200 shadow-xs"
                            />
                            {isGoogleDriveUrl(app.photoUrl) && (
                              <span className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-emerald-600 text-white text-[9px] font-bold rounded-md shadow-2xs" title="รูปภาพเชื่อมกับ Google Drive">
                                Drive
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 font-black text-base flex items-center justify-center shrink-0">
                            {app.fullName[0]}
                          </div>
                        )}

                        <div>
                          <h4 className="font-bold text-slate-900 text-sm hover:text-blue-600 transition">
                            {app.fullName}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            {app.nickname && <span className="font-semibold text-blue-700">({app.nickname})</span>}
                            <span>•</span>
                            <span>{app.isForeignWorker ? app.nationalityText : 'ไทย'}</span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400 block">{app.id}</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {app.status === 'PENDING' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            รอพิจารณา
                          </span>
                        )}
                        {app.status === 'REVIEWING' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            กำลังตรวจเอกสาร
                          </span>
                        )}
                        {app.status === 'INTERVIEW_SCHEDULED' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                            นัดสัมภาษณ์แล้ว
                          </span>
                        )}
                        {app.status === 'APPROVED' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ผ่านคัดเลือก
                          </span>
                        )}
                        {app.status === 'HIRED' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-100" />
                            <span>เป็นพนักงานแล้ว</span>
                          </span>
                        )}
                        {app.status === 'RETAINED' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                            <Archive className="w-3 h-3 text-blue-600" />
                            <span>เก็บประวัติไว้</span>
                          </span>
                        )}
                        {app.status === 'REJECTED' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
                            ไม่ผ่าน
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Position Applied Info */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">ตำแหน่งที่สมัคร:</span>
                        <span className="font-bold text-slate-900">{app.position}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">แผนก:</span>
                        <span className="font-medium text-slate-700">{app.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">เงินเดือนที่คาดหวัง:</span>
                        <span className="font-bold text-blue-700">{app.expectedSalary.toLocaleString()} บาท/เดือน</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">เริ่มงานได้:</span>
                        <span className="font-medium text-slate-700">{app.availableStartDate || '-'}</span>
                      </div>
                    </div>

                    {/* Contact snippet */}
                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold">{app.phoneNumber}</span>
                        {app.lineId && <span className="text-slate-400">(LINE: {app.lineId})</span>}
                      </div>
                      {app.interviewDate && (
                        <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 text-[11px] flex items-start gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">นัดสัมภาษณ์: </span>
                            <span>{app.interviewDate.replace('T', ' ')} น.</span>
                            {app.interviewLocation && <div className="text-[10px] text-purple-700">{app.interviewLocation}</div>}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedApplication(app)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>ดูใบสมัคร</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenInterviewModal(app)}
                        className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>นัดสัมภาษณ์</span>
                      </button>

                      {/* Retain / Archive Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextStatus: JobApplicationStatus = app.status === 'RETAINED' ? 'PENDING' : 'RETAINED';
                          onUpdateApplicationStatus(app.id, nextStatus);
                          setToastNotification(nextStatus === 'RETAINED' 
                            ? `เก็บประวัติของ "${app.fullName}" ไว้ในคลังสำรองเรียบร้อยแล้ว` 
                            : `เปลี่ยนสถานะ "${app.fullName}" เป็นรอพิจารณา`);
                          setTimeout(() => setToastNotification(null), 3000);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer text-xs ${
                          app.status === 'RETAINED'
                            ? 'bg-blue-100 text-blue-900 border border-blue-300 hover:bg-blue-200'
                            : 'bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200'
                        }`}
                        title={app.status === 'RETAINED' ? 'ยกเลิกการเก็บประวัติ (เปลี่ยนเป็นรอพิจารณา)' : 'เก็บประวัติผู้สมัครไว้ในคลังสำรองเพื่อพิจารณาภายหลัง'}
                      >
                        <Archive className="w-3.5 h-3.5 text-blue-600" />
                        <span>{app.status === 'RETAINED' ? 'เก็บประวัติแล้ว' : 'เก็บประวัติ'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                      {/* Convert to Employee Button */}
                      {app.status !== 'HIRED' && (
                        <button
                          type="button"
                          onClick={() => onConvertToEmployee(app)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                          title="รับผู้สมัครเข้าทำงานเป็นพนักงานในระบบทันที"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>รับเข้าทำงาน</span>
                        </button>
                      )}

                      {/* Delete Candidate Button */}
                      <button
                        type="button"
                        onClick={async () => {
                          const confirmed = await showConfirmDialog(
                            'ลบใบสมัคร?',
                            `คุณแน่ใจหรือไม่ว่าต้องการลบใบสมัครของ "${app.fullName}" ออกจากระบบอย่างถาวร?`,
                            'ยืนยันลบ',
                            'ยกเลิก'
                          );
                          if (confirmed) {
                            onDeleteApplication(app.id);
                            showToast(`ลบใบสมัครของ "${app.fullName}" เรียบร้อยแล้ว`);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer border border-transparent hover:border-rose-200"
                        title="ลบใบสมัครนี้ออกจากระบบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">ยังไม่มีรายการใบสมัครงานในเงื่อนไขที่เลือก</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                คุณสามารถส่งลิงก์รับสมัครงานหรือ QR Code ให้ผู้สมัครกรอกผ่านมือถือได้ทันที เมื่อผู้สมัครส่งข้อมูลเข้ามา ใบสมัครจะปรากฏในหน้านี้แบบเรียลไทม์
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 transition cursor-pointer"
                >
                  คัดลอกลิงก์รับสมัครส่งให้ผู้สมัคร
                </button>
                <button
                  type="button"
                  onClick={() => onOpenApplyPage()}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  ทดสอบกรอกใบสมัคร
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: JOB OPENINGS & FORM SETTINGS (กำหนดตำแหน่งงาน & ตั้งค่า) */}
      {/* ========================================================= */}
      {activeTab === 'openings' && (
        <div className="space-y-6">

          {/* Master Toggle & General Form Settings */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <span>การเปิดรับสมัครงาน & ข้อมูลบริษัท</span>
                </h3>
                <p className="text-xs text-slate-500">กำหนดสถานะการเปิดรับสมัคร ข้อมูลติดต่อ และเอกสารที่ผู้สมัครต้องแนบ</p>
              </div>

              {/* Master Open/Close Toggle & Company Settings Button */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsCompanySettingsModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-blue-200 shadow-2xs"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>หน้าต่างตั้งค่าบริษัท</span>
                </button>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">สถานะ:</span>
                  <input
                    type="checkbox"
                    checked={settingsForm.isOpen}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, isOpen: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className={`text-xs font-black ${settingsForm.isOpen ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {settingsForm.isOpen ? 'เปิดรับสมัคร' : 'ปิดรับชั่วคราว'}
                  </span>
                </label>
              </div>
            </div>

            {/* Company Info Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">ชื่อบริษัท / องค์กร</label>
                <input
                  type="text"
                  value={settingsForm.companyName}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">สโลแกน / คำโปรย</label>
                <input
                  type="text"
                  value={settingsForm.companyTagline || ''}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, companyTagline: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">สถานที่ปฏิบัติงานหลัก</label>
                <input
                  type="text"
                  value={settingsForm.workLocation}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, workLocation: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">เบอร์โทรศัพท์ติดต่อ HR</label>
                <input
                  type="text"
                  value={settingsForm.contactPhone}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">อีเมลติดต่อ HR</label>
                <input
                  type="email"
                  value={settingsForm.contactEmail}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">LINE ID ฝ่ายบุคคล</label>
                <input
                  type="text"
                  value={settingsForm.contactLineId || ''}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, contactLineId: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            {/* Requirement Checkboxes */}
            <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="font-bold text-slate-800">เงื่อนไขแบบฟอร์ม (Form Field Configuration):</span>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.requirePhoto}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, requirePhoto: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-medium text-slate-700">บังคับแนบรูปถ่ายหน้าตรง</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.requireResume}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, requireResume: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-medium text-slate-700">บังคับแนบเรซูเม่ (Resume)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.requireIdCardCopy}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, requireIdCardCopy: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-medium text-slate-700">บังคับแนบสำเนาบัตรประชาชน / บัตรต่างด้าว</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.requireWorkExperience}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, requireWorkExperience: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-medium text-slate-700">บังคับระบุประวัติการทำงาน</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.allowForeignWorkers}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, allowForeignWorkers: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-medium text-slate-700">เปิดรับแรงงานต่างด้าว (MOU/บัตรชมพู/Passport)</span>
                </label>
              </div>

              {/* Thank you message customizer */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  ข้อความขอบคุณเมื่อผู้สมัครส่งใบสมัครสำเร็จ (Thank-You Message)
                </label>
                <textarea
                  rows={2}
                  value={settingsForm.thankYouMessage || ''}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, thankYouMessage: e.target.value }))}
                  placeholder="เช่น ขอบคุณที่สนใจร่วมงานกับเรา ฝ่ายบุคคลจะทำการตรวจสอบคุณสมบัติเพื่อติดต่อกลับภายใน 2-3 วันทำการ"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isSavingSettings ? 'กำลังบันทึก...' : 'บันทึกการกำหนดแบบฟอร์มและข้อมูลบริษัท'}
              </button>
            </div>
          </div>

          {/* Job Openings Management Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                ตำแหน่งงานที่เปิดรับสมัคร (Job Openings)
              </h3>
              <p className="text-xs text-slate-500">เพิ่ม ลบ หรือแก้ไขตำแหน่งงานที่ต้องการรับสมัครในแบบฟอร์ม</p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddOpening}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มตำแหน่งงานใหม่</span>
            </button>
          </div>

          {/* Openings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(settings.openings || []).map((job) => (
              <div
                key={job.id}
                className={`bg-white rounded-2xl border p-4 shadow-2xs space-y-3 transition flex flex-col justify-between ${
                  job.isActive ? 'border-slate-200 hover:border-blue-400' : 'border-slate-200 opacity-60 bg-slate-50'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{job.title}</h4>
                      <div className="text-xs text-slate-500 mt-0.5">{job.department}</div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {job.urgent && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white">
                          รับด่วน
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        job.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {job.isActive ? 'เปิดรับ' : 'ปิดรับ'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">เงินเดือน/ค่าตอบแทน:</span>
                      <span className="font-bold text-blue-700">{job.salaryRange}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">จำนวนอัตรา:</span>
                      <span className="font-semibold text-slate-800">{job.positionsAvailable} อัตรา</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ประเภทจ้าง:</span>
                      <span className="text-slate-700">{job.employmentType}</span>
                    </div>
                  </div>

                  {job.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>
                  )}

                  {job.qualifications && job.qualifications.length > 0 && (
                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <span className="font-bold block">คุณสมบัติเบื้องต้น:</span>
                      <ul className="list-disc list-inside line-clamp-2">
                        {job.qualifications.slice(0, 2).map((q, idx) => (
                          <li key={idx} className="truncate">{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                      <input
                        type="checkbox"
                        checked={job.isActive}
                        onChange={() => handleToggleOpeningActive(job.id)}
                        className="w-3.5 h-3.5 text-blue-600 rounded"
                      />
                      <span>{job.isActive ? 'เปิดรับสมัคร' : 'ปิดรับ'}</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setGeneratorTargetJobId(job.id);
                        setIsLinkGeneratorOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-[11px] transition cursor-pointer"
                      title="สร้างลิงก์และ QR Code สำหรับตำแหน่งนี้โดยเฉพาะ"
                    >
                      <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>สร้างลิงก์ & QR ตำแหน่งนี้</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditOpening(job)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="แก้ไขตำแหน่งงาน"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteOpening(job.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="ลบตำแหน่งงาน"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SHAREABLE LINK & QR CODE POSTER (ลิงก์ & โปสเตอร์) */}
      {/* ========================================================= */}
      {activeTab === 'poster' && (
        <div className="space-y-6">

          {/* Quick Share URL Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Share2 className="w-5 h-5 text-blue-600" />
              <span>ลิงก์กรอกใบสมัครงานสำหรับส่งต่อ (Shareable URL)</span>
            </h3>
            <p className="text-xs text-slate-500">
              คัดลอก URL นี้ส่งให้ผู้สมัครผ่านทาง LINE, Facebook, อีเมล หรือประกาศรับสมัครงานออนไลน์ ผู้สมัครสามารถกดกรอกผ่านมือถือหรือคอมพิวเตอร์ได้ทันที
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicApplyUrl}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedUrl ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}</span>
              </button>
              <button
                type="button"
                onClick={handleShareLine}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                title="แชร์ข้อความและลิงก์ไปยัง LINE"
              >
                <Send className="w-4 h-4" />
                <span>แชร์ผ่าน LINE</span>
              </button>
              <button
                type="button"
                onClick={handleCopySocialPost}
                className="w-full sm:w-auto px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold shrink-0 transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="คัดลอกข้อความสรุปพร้อมโพสต์ลง Facebook หรือช่องทางอื่นๆ"
              >
                <Share2 className="w-4 h-4" />
                <span>คัดลอกข้อความโพสต์</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setGeneratorTargetJobId(undefined);
                  setIsLinkGeneratorOpen(true);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shrink-0 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Link2 className="w-4 h-4" />
                <span>ตัวช่วยสร้างลิงก์ & QR Code</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenApplyPage()}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold shrink-0 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>เปิดดูตัวอย่างหน้ากรอก</span>
              </button>
            </div>
          </div>

          {/* Printable Recruitment Poster Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Printer className="w-5 h-5 text-blue-600" />
                  <span>โปสเตอร์รับสมัครงานพร้อม QR Code (Recruitment Poster)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  โปสเตอร์ขนาดมาตรฐาน พร้อม QR Code สำหรับสแกนกรอกผ่านมือถือ สามารถพิมพ์หรือดาวน์โหลดเพื่อนำไปติดประกาศหน้าร้านหรือออฟฟิศได้ทันที
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadQrCode}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลด QR Code (PNG)</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>สั่งพิมพ์โปสเตอร์ (Print)</span>
                </button>
              </div>
            </div>

            {/* Poster Preview Frame */}
            <div className="max-w-md mx-auto bg-gradient-to-b from-blue-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-indigo-400/40 text-center space-y-5">
              
              <div className="space-y-1">
                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#F0E7C2] text-[#8B1C2D] inline-block shadow-xs tracking-wide">
                  ประกาศรับสมัครงานด่วน
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white pt-2">
                  {settings.companyName}
                </h2>
                <p className="text-xs text-blue-200">
                  {settings.companyTagline || 'เปิดรับสมัครเพื่อนร่วมงานไฟแรง มาร่วมเติบโตไปด้วยกัน'}
                </p>
              </div>

              {/* Positions List in Poster */}
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-left space-y-2">
                <span className="text-xs font-bold text-amber-300 block">ตำแหน่งที่เปิดรับสมัคร:</span>
                <div className="space-y-1 text-xs">
                  {(settings.openings || []).filter(o => o.isActive).map(job => (
                    <div key={job.id} className="flex justify-between items-center py-1 border-b border-white/10">
                      <span className="font-semibold text-white">{job.title}</span>
                      <span className="text-amber-300 font-bold">{job.salaryRange.split('/')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-4 rounded-2xl inline-block shadow-xl mx-auto">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Scan to Apply"
                    className="w-44 h-44 object-contain mx-auto"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-slate-400">
                    กำลังสร้าง QR Code...
                  </div>
                )}
                <span className="text-[11px] font-bold text-slate-800 block mt-1">
                  สแกนเพื่อกรอกใบสมัครออนไลน์
                </span>
              </div>

              <div className="text-xs text-blue-200 space-y-1.5 pt-1 text-center flex flex-col items-center">
                <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-amber-300" /><span>สถานที่: {settings.workLocation}</span></div>
                <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-amber-300" /><span>ติดต่อสอบถาม: {settings.contactPhone}</span></div>
                {settings.contactLineId && <div className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-amber-300" /><span>LINE: {settings.contactLineId}</span></div>}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: APPLICATION FULL DETAIL VIEW (ดูใบสมัครฉบับเต็ม) */}
      {/* ========================================================= */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {selectedApplication.photoUrl ? (
                  <div className="relative shrink-0">
                    <img
                      src={resolveDisplayImageUrl(selectedApplication.photoUrl)}
                      alt={selectedApplication.fullName}
                      className="w-16 h-16 object-cover rounded-2xl border border-slate-200 shadow-xs"
                    />
                    {isGoogleDriveUrl(selectedApplication.photoUrl) && (
                      <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] font-bold rounded-md shadow-2xs">
                        Drive
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 font-black text-xl flex items-center justify-center">
                    {selectedApplication.fullName[0]}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                      {selectedApplication.fullName}
                    </h3>
                    {selectedApplication.nickname && (
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        ({selectedApplication.nickname})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    สมัครตำแหน่ง: <span className="font-bold text-slate-800">{selectedApplication.position}</span> • {selectedApplication.department}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[10px] text-slate-400">รหัสใบสมัคร: {selectedApplication.id}</span>
                    {isGoogleDriveUrl(selectedApplication.photoUrl) && (
                      <a
                        href={selectedApplication.photoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 transition"
                      >
                        <Share2 className="w-2.5 h-2.5" />
                        <span>เปิดรูปใน Google Drive</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedApplication(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Application Detail Sections */}
            <div className="space-y-4 text-xs">
              
              {/* Section: ข้อมูลตำแหน่ง & ค่าตอบแทน */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <span className="text-slate-500 block">เงินเดือนที่คาดหวัง:</span>
                  <span className="font-bold text-blue-700 text-sm">{selectedApplication.expectedSalary.toLocaleString()} บาท</span>
                </div>
                <div>
                  <span className="text-slate-500 block">วันที่พร้อมเริ่มงาน:</span>
                  <span className="font-semibold text-slate-800">{selectedApplication.availableStartDate || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">ประเภทการจ้าง:</span>
                  <span className="font-semibold text-slate-800">{selectedApplication.desiredEmploymentType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">สถานะปัจจุบัน:</span>
                  <span className="font-bold text-amber-600">{selectedApplication.status}</span>
                </div>
              </div>

              {/* Section: ข้อมูลส่วนตัว & ติดต่อ */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">ข้อมูลส่วนตัว & การติดต่อ:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-white border border-slate-200 rounded-xl">
                  <div>เบอร์โทรศัพท์: <span className="font-bold text-slate-900">{selectedApplication.phoneNumber}</span></div>
                  <div>อีเมล: <span className="font-medium text-slate-900">{selectedApplication.email || '-'}</span></div>
                  <div>LINE ID: <span className="font-medium text-slate-900">{selectedApplication.lineId || '-'}</span></div>
                  <div>วันเกิด: <span className="font-medium text-slate-900">{selectedApplication.birthDate}</span></div>
                  <div>เลขบัตร ปชช / Passport: <span className="font-mono font-medium text-slate-900">{selectedApplication.idCardNumber || '-'}</span></div>
                  <div>สัญชาติ: <span className="font-medium text-slate-900">{selectedApplication.nationalityText || 'ไทย'}</span></div>
                  <div className="sm:col-span-2">ที่อยู่: <span className="text-slate-700">{selectedApplication.currentAddress || '-'}</span></div>
                </div>
              </div>

              {/* Section: ประวัติการศึกษาและการทำงาน */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">การศึกษา & ประสบการณ์:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-white border border-slate-200 rounded-xl">
                  <div>ระดับการศึกษา: <span className="font-semibold text-slate-900">{selectedApplication.educationLevel}</span></div>
                  <div>สาขาวิชา: <span className="font-medium text-slate-900">{selectedApplication.fieldOfStudy || '-'}</span></div>
                  <div>ประสบการณ์ทำงาน: <span className="font-semibold text-blue-700">{selectedApplication.experienceYears} ปี</span></div>
                  <div>ที่ทำงานล่าสุด: <span className="font-medium text-slate-900">{selectedApplication.previousCompany || '-'} ({selectedApplication.previousPosition || '-'})</span></div>
                  <div className="sm:col-span-2">ทักษะความสามารถ: <span className="text-slate-800 font-medium">{selectedApplication.skills || '-'}</span></div>
                </div>
              </div>

              {/* Section: บุคคลติดต่อฉุกเฉิน */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">บุคคลติดต่อฉุกเฉิน:</span>
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-wrap gap-4">
                  <div>ชื่อ: <span className="font-semibold text-slate-900">{selectedApplication.emergencyContactName || '-'}</span></div>
                  <div>ความสัมพันธ์: <span className="font-medium text-slate-700">{selectedApplication.emergencyContactRelation || '-'}</span></div>
                  <div>เบอร์โทร: <span className="font-bold text-slate-900">{selectedApplication.emergencyContactPhone || '-'}</span></div>
                </div>
              </div>

              {/* Introduction */}
              {selectedApplication.introduction && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 block">คำแนะนำตัว / เหตุผลที่สนใจร่วมงาน:</span>
                  <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 leading-relaxed italic">
                    "{selectedApplication.introduction}"
                  </p>
                </div>
              )}

              {/* Documents & Files Preview */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">ไฟล์แนบ / เรซูเม่ / สำเนาบัตร:</span>
                <div className="flex flex-wrap gap-2">
                  {selectedApplication.resumeUrl ? (
                    <a
                      href={selectedApplication.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs ${
                        isGoogleDriveUrl(selectedApplication.resumeUrl)
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                          : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      {isGoogleDriveUrl(selectedApplication.resumeUrl) ? (
                        <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isGoogleDriveUrl(selectedApplication.resumeUrl)
                          ? 'เปิดดูเรซูเม่ใน Google Drive ↗'
                          : `เปิดดูเรซูเม่ (${selectedApplication.resumeFileName || 'ไฟล์แนบ'})`}
                      </span>
                    </a>
                  ) : (
                    <span className="text-slate-400">ไม่มีไฟล์เรซูเม่แนบมา</span>
                  )}

                  {selectedApplication.idCardCopyUrl && (
                    <a
                      href={selectedApplication.idCardCopyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-100 transition flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>ดูสำเนาบัตรประชาชน/Passport</span>
                    </a>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedApplication.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as JobApplicationStatus;
                    onUpdateApplicationStatus(selectedApplication.id, newStatus);
                    setSelectedApplication(prev => prev ? ({ ...prev, status: newStatus }) : null);
                  }}
                  className="px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl font-bold focus:outline-none"
                >
                  <option value="PENDING">รอพิจารณา</option>
                  <option value="REVIEWING">กำลังตรวจเอกสาร</option>
                  <option value="INTERVIEW_SCHEDULED">นัดสัมภาษณ์แล้ว</option>
                  <option value="APPROVED">ผ่านการคัดเลือก</option>
                  <option value="RETAINED">เก็บประวัติไว้ (สำรอง/Talent Pool)</option>
                  <option value="HIRED">รับเข้าทำงานแล้ว</option>
                  <option value="REJECTED">ไม่ผ่านการพิจารณา</option>
                </select>

                {/* Quick Retain Button inside Modal */}
                <button
                  type="button"
                  onClick={() => {
                    const nextStatus: JobApplicationStatus = selectedApplication.status === 'RETAINED' ? 'PENDING' : 'RETAINED';
                    onUpdateApplicationStatus(selectedApplication.id, nextStatus);
                    setSelectedApplication(prev => prev ? ({ ...prev, status: nextStatus }) : null);
                    setToastNotification(nextStatus === 'RETAINED' ? 'เก็บประวัติผู้สมัครไว้ในคลังสำรองแล้ว' : 'เปลี่ยนสถานะเป็นรอพิจารณาแล้ว');
                    setTimeout(() => setToastNotification(null), 3000);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    selectedApplication.status === 'RETAINED'
                      ? 'bg-blue-100 text-blue-900 border border-blue-300'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5 text-blue-600" />
                  <span>{selectedApplication.status === 'RETAINED' ? 'เก็บประวัติไว้แล้ว' : 'เก็บประวัติไว้'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleOpenInterviewModal(selectedApplication);
                    setSelectedApplication(null);
                  }}
                  className="px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold hover:bg-purple-100 transition flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>นัดสัมภาษณ์</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Delete button inside modal */}
                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = await showConfirmDialog(
                      'ลบใบสมัคร?',
                      `ต้องการลบใบสมัครของ "${selectedApplication.fullName}" ออกจากระบบอย่างถาวรหรือไม่?`,
                      'ยืนยันลบ',
                      'ยกเลิก'
                    );
                    if (confirmed) {
                      onDeleteApplication(selectedApplication.id);
                      setSelectedApplication(null);
                      showToast('ลบใบสมัครเรียบร้อยแล้ว');
                    }
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="ลบใบสมัครนี้ออกจากระบบ"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>ลบใบสมัคร</span>
                </button>

                {selectedApplication.status !== 'HIRED' && (
                  <button
                    type="button"
                    onClick={() => {
                      onConvertToEmployee(selectedApplication);
                      setSelectedApplication(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>รับเข้าทำงานเป็นพนักงาน</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: SCHEDULE INTERVIEW (นัดสัมภาษณ์งาน) */}
      {/* ========================================================= */}
      {interviewModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span>นัดสัมภาษณ์งาน</span>
              </h3>
              <button
                type="button"
                onClick={() => setInterviewModalApp(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div>ผู้สมัคร: <span className="font-bold text-slate-900">{interviewModalApp.fullName}</span></div>
              <div>ตำแหน่ง: <span className="font-semibold text-blue-700">{interviewModalApp.position}</span></div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">วันและเวลานัดสัมภาษณ์</label>
                <input
                  type="datetime-local"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">สถานที่สัมภาษณ์ / ลิงก์ออนไลน์</label>
                <input
                  type="text"
                  placeholder="เช่น สำนักงานใหญ่ (ห้องประชุม 1) หรือ Google Meet: https://meet.google.com/..."
                  value={interviewLocation}
                  onChange={(e) => setInterviewLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">บันทึกเพิ่มเติมสำหรับ HR</label>
                <textarea
                  rows={3}
                  placeholder="เช่น เตรียมข้อสอบทักษะ, ตรวจสอบเอกสารตัวจริง, ผู้ร่วมสัมภาษณ์คือคุณ..."
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setInterviewModalApp(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveInterviewSchedule}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                บันทึกการนัดสัมภาษณ์
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: ADD/EDIT JOB OPENING (เพิ่ม/แก้ไขตำแหน่งงาน) */}
      {/* ========================================================= */}
      {isOpeningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <span>{editingOpening ? 'แก้ไขตำแหน่งงาน' : 'เพิ่มตำแหน่งงานใหม่'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsOpeningModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">ชื่อตำแหน่งงาน <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="เช่น พนักงานบริการหน้าร้าน, ผู้ช่วยกุ๊ก, บาริสต้า"
                  value={openingForm.title || ''}
                  onChange={(e) => setOpeningForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">แผนก</label>
                  <select
                    value={openingForm.department || 'แผนกบริการหน้าร้าน'}
                    onChange={(e) => setOpeningForm(prev => ({ ...prev, department: e.target.value as Department }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">ประเภทการจ้าง</label>
                  <select
                    value={openingForm.employmentType || 'FULL_TIME'}
                    onChange={(e) => setOpeningForm(prev => ({ ...prev, employmentType: e.target.value as EmploymentType }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="FULL_TIME">พนักงานประจำ (Full Time)</option>
                    <option value="PART_TIME">พาร์ตไทม์ (Part Time)</option>
                    <option value="CONTRACT">สัญญาจ้าง (Contract)</option>
                    <option value="DAILY">รายวัน (Daily)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">เงินเดือน / ค่าตอบแทน</label>
                  <input
                    type="text"
                    placeholder="เช่น 15,000 - 18,000 บาท/เดือน"
                    value={openingForm.salaryRange || ''}
                    onChange={(e) => setOpeningForm(prev => ({ ...prev, salaryRange: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">จำนวนอัตราที่เปิดรับ</label>
                  <input
                    type="number"
                    min="1"
                    value={openingForm.positionsAvailable || 1}
                    onChange={(e) => setOpeningForm(prev => ({ ...prev, positionsAvailable: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">รายละเอียดหน้าที่ความรับผิดชอบ</label>
                <textarea
                  rows={3}
                  placeholder="ระบุรายละเอียดงาน..."
                  value={openingForm.description || ''}
                  onChange={(e) => setOpeningForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">คุณสมบัติผู้สมัคร (คั่นด้วยเครื่องหมายจุลภาค , หรือบรรทัดใหม่)</label>
                <textarea
                  rows={2}
                  placeholder="เช่น อายุ 18 ปีขึ้นไป, มีใจรักงานบริการ, ขยัน ซื่อสัตย์"
                  value={Array.isArray(openingForm.qualifications) ? openingForm.qualifications.join('\n') : ''}
                  onChange={(e) => setOpeningForm(prev => ({
                    ...prev,
                    qualifications: e.target.value.split('\n').map(q => q.trim()).filter(Boolean)
                  }))}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={openingForm.isActive}
                    onChange={(e) => setOpeningForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>เปิดรับสมัครตำแหน่งนี้</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-rose-700">
                  <input
                    type="checkbox"
                    checked={openingForm.urgent}
                    onChange={(e) => setOpeningForm(prev => ({ ...prev, urgent: e.target.checked }))}
                    className="w-4 h-4 text-rose-600 rounded"
                  />
                  <span>ป้ายกำกับ "รับด่วน"</span>
                </label>
              </div>

            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsOpeningModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveOpening}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                บันทึกตำแหน่งงาน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COMPANY SETTINGS MODAL (หน้าต่างตั้งค่าบริษัท) */}
      <CompanySettingsModal
        isOpen={isCompanySettingsModalOpen}
        onClose={() => setIsCompanySettingsModalOpen(false)}
        settings={settings}
        onSave={(updated) => {
          onUpdateSettings(updated);
        }}
      />

      {/* MODAL: GENERATE APPLICATION LINK MODAL (สร้างลิงก์ & QR Code ใบสมัครงาน) */}
      <GenerateApplicationLinkModal
        isOpen={isLinkGeneratorOpen}
        onClose={() => setIsLinkGeneratorOpen(false)}
        settings={settings}
        openings={settings.openings || []}
        initialJobId={generatorTargetJobId}
        onTestOpenLink={(jobId) => onOpenApplyPage(jobId)}
      />

    </div>
  );
};
