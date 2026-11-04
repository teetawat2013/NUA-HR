import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  Briefcase, 
  User, 
  GraduationCap, 
  Phone, 
  MapPin, 
  Mail, 
  Calendar, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  ArrowRight, 
  Check, 
  Copy, 
  Printer, 
  Sparkles, 
  Clock, 
  DollarSign, 
  Heart, 
  Users, 
  Globe2, 
  Award, 
  Share2,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { 
  JobOpening, 
  JobApplicationSettings, 
  JobApplication, 
  Department, 
  EmploymentType, 
  IdentificationType, 
  EducationRecord,
  WorkExperienceRecord,
  LanguageSkills,
  SiblingInfo,
  JobReferenceContact,
  DEFAULT_JOB_SETTINGS
} from '../types';
import { 
  DriveOrUploadBox, 
  SiblingsTable, 
  EducationTable, 
  ExperienceTable, 
  LanguageAbilityTable, 
  ReferencesTable, 
  CertificationDeclarationBox 
} from './ApplicationFormSections';
import { isGoogleDriveUrl, resolveDisplayImageUrl } from '../utils/googleDrive';
import { copyToClipboardSafe } from './GenerateApplicationLinkModal';
import { showErrorAlert } from '../utils/swal';

interface PublicJobApplicationViewProps {
  settings: JobApplicationSettings;
  onSubmitApplication: (application: JobApplication) => Promise<boolean | void>;
  onSwitchToHR?: () => void;
}

const THAI_MONTHS = [
  { value: '01', name: 'ม.ค. (มกราคม)' },
  { value: '02', name: 'ก.พ. (กุมภาพันธ์)' },
  { value: '03', name: 'มี.ค. (มีนาคม)' },
  { value: '04', name: 'เม.ย. (เมษายน)' },
  { value: '05', name: 'พ.ค. (พฤษภาคม)' },
  { value: '06', name: 'มิ.ย. (มิถุนายน)' },
  { value: '07', name: 'ก.ค. (กรกฎาคม)' },
  { value: '08', name: 'ส.ค. (สิงหาคม)' },
  { value: '09', name: 'ก.ย. (กันยายน)' },
  { value: '10', name: 'ต.ค. (ตุลาคม)' },
  { value: '11', name: 'พ.ย. (พฤศจิกายน)' },
  { value: '12', name: 'ธ.ค. (ธันวาคม)' },
];

const currentCEYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 60 }, (_, i) => {
  const ce = currentCEYear - 15 - i;
  const be = ce + 543;
  return { ce: String(ce), be: String(be) };
});

export const PublicJobApplicationView: React.FC<PublicJobApplicationViewProps> = ({
  settings = DEFAULT_JOB_SETTINGS,
  onSubmitApplication,
  onSwitchToHR,
}) => {
  const activeOpenings = useMemo(() => {
    return (settings.openings || []).filter(o => o.isActive);
  }, [settings.openings]);

  // Positions Applied for (หน้า 1 PDF: ตำแหน่ง 1, ตำแหน่ง 2, เงินเดือน)
  const [selectedJobId, setSelectedJobId] = useState<string>(activeOpenings[0]?.id || '');
  const [position1, setPosition1] = useState<string>(activeOpenings[0]?.title || '');
  const [salary1, setSalary1] = useState<string>('16000');
  const [position2, setPosition2] = useState<string>('');
  const [salary2, setSalary2] = useState<string>('');
  const [department, setDepartment] = useState<Department>(activeOpenings[0]?.department || 'แผนกบริการหน้าร้าน');
  const [branch, setBranch] = useState<string>(activeOpenings[0]?.branch || settings.workLocation || 'สำนักงานใหญ่ (เชียงใหม่)');
  const [availableStartDate, setAvailableStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [desiredEmploymentType, setDesiredEmploymentType] = useState<EmploymentType>('FULL_TIME');

  // Personal Information (หน้า 1 PDF)
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [birthDate, setBirthDate] = useState('2000-01-15');
  const [age, setAge] = useState<string>('26');
  const [birthDay, setBirthDay] = useState<string>('15');
  const [birthMonth, setBirthMonth] = useState<string>('01');
  const [birthYear, setBirthYear] = useState<string>('2000');

  const handleDatePartsChange = (newDay: string, newMonth: string, newYear: string) => {
    setBirthDay(newDay);
    setBirthMonth(newMonth);
    setBirthYear(newYear);
    if (newDay && newMonth && newYear) {
      const formatted = `${newYear}-${newMonth.padStart(2, '0')}-${newDay.padStart(2, '0')}`;
      setBirthDate(formatted);
    }
  };

  const handleFullDateChange = (val: string) => {
    setBirthDate(val);
    if (val) {
      const parts = val.split('-');
      if (parts.length >= 3) {
        setBirthYear(parts[0]);
        setBirthMonth(parts[1]);
        setBirthDay(parts[2]);
      }
    }
  };

  const [race, setRace] = useState('ไทย');
  const [nationalityText, setNationalityText] = useState('ไทย');
  const [religion, setReligion] = useState('พุทธ');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [idCardExpirationDate, setIdCardExpirationDate] = useState('');
  const [heightCm, setHeightCm] = useState<string>('170');
  const [weightKg, setWeightKg] = useState<string>('65');
  const [militaryStatus, setMilitaryStatus] = useState<'EXEMPTED' | 'SERVED' | 'NOT_YET_SERVED'>('EXEMPTED');
  const [maritalStatus, setMaritalStatus] = useState<'SINGLE' | 'MARRIED' | 'WIDOWED' | 'SEPARATED'>('SINGLE');

  // Address (หน้า 1 PDF)
  const [addressNo, setAddressNo] = useState('');
  const [addressMoo, setAddressMoo] = useState('');
  const [addressRoad, setAddressRoad] = useState('');
  const [addressSubdistrict, setAddressSubdistrict] = useState('');
  const [addressDistrict, setAddressDistrict] = useState('');
  const [addressProvince, setAddressProvince] = useState('เชียงใหม่');
  const [addressPostcode, setAddressPostcode] = useState('');
  const [livingType, setLivingType] = useState<'LIVING_WITH_PARENTS' | 'OWN_HOME' | 'HIRED_HOUSE' | 'HOSTEL'>('OWN_HOME');

  const [telephoneHome, setTelephoneHome] = useState('');
  const [pager, setPager] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [lineId, setLineId] = useState('');

  // Family Information (หน้า 1-2 PDF)
  const [fatherName, setFatherName] = useState('');
  const [fatherAge, setFatherAge] = useState<string>('');
  const [fatherOccupation, setFatherOccupation] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherAge, setMotherAge] = useState<string>('');
  const [motherOccupation, setMotherOccupation] = useState('');
  const [spouseName, setSpouseName] = useState('');
  const [spouseWorkingPlace, setSpouseWorkingPlace] = useState('');
  const [spousePosition, setSpousePosition] = useState('');
  const [childrenCount, setChildrenCount] = useState<string>('0');
  const [siblingsTotal, setSiblingsTotal] = useState<string>('1');
  const [siblingsMale, setSiblingsMale] = useState<string>('1');
  const [siblingsFemale, setSiblingsFemale] = useState<string>('0');
  const [siblingOrder, setSiblingOrder] = useState<string>('1');
  const [siblingsList, setSiblingsList] = useState<SiblingInfo[]>([]);

  // Education Records (หน้า 2 PDF)
  const [educationRecords, setEducationRecords] = useState<EducationRecord[]>([
    { level: 'มัธยมศึกษาตอนปลาย', institution: '', major: 'วิทย์-คณิต', fromYear: '', toYear: '' },
    { level: 'ปวช.', institution: '', major: '', fromYear: '', toYear: '' },
    { level: 'ปวท. / ปวส.', institution: '', major: '', fromYear: '', toYear: '' },
    { level: 'ปริญญาตรี', institution: '', major: '', fromYear: '', toYear: '' },
    { level: 'สูงกว่าปริญญาตรี', institution: '', major: '', fromYear: '', toYear: '' },
    { level: 'อื่นๆ', institution: '', major: '', fromYear: '', toYear: '' },
  ]);

  // Working Experience (หน้า 2 PDF)
  const [workExperiences, setWorkExperiences] = useState<WorkExperienceRecord[]>([
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

  // Language Ability (หน้า 2 PDF)
  const [languages, setLanguages] = useState({
    thai: { speaking: 'GOOD', writing: 'GOOD', reading: 'GOOD' } as LanguageSkills,
    english: { speaking: 'FAIR', writing: 'FAIR', reading: 'FAIR' } as LanguageSkills,
    japanese: { speaking: 'POOR', writing: 'POOR', reading: 'POOR' } as LanguageSkills,
    otherLangName: '',
    other: { speaking: 'POOR', writing: 'POOR', reading: 'POOR' } as LanguageSkills,
  });

  // Special Ability (หน้า 3 PDF)
  const [typingThaiCan, setTypingThaiCan] = useState(true);
  const [typingThaiSpeed, setTypingThaiSpeed] = useState<string>('45');
  const [typingEngCan, setTypingEngCan] = useState(true);
  const [typingEngSpeed, setTypingEngSpeed] = useState<string>('35');
  const [computerSkillCan, setComputerSkillCan] = useState(true);
  const [computerSkillDetails, setComputerSkillDetails] = useState('');
  const [drivingCan, setDrivingCan] = useState(true);
  const [drivingLicenseNo, setDrivingLicenseNo] = useState('');
  const [officeMachine, setOfficeMachine] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [favouriteSport, setFavouriteSport] = useState('');
  const [specialKnowledge, setSpecialKnowledge] = useState('');
  const [otherSpecialAbility, setOtherSpecialAbility] = useState('');

  // Additional Questionnaire (หน้า 3 PDF)
  const [canWorkUpCountry, setCanWorkUpCountry] = useState<'YES' | 'NO' | 'OTHER'>('YES');
  const [canWorkUpCountryDetails, setCanWorkUpCountryDetails] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('บิดา/มารดา');
  const [emergencyContactAddress, setEmergencyContactAddress] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [sourceOfJobInfo, setSourceOfJobInfo] = useState('');
  const [hasSeriousIllness, setHasSeriousIllness] = useState(false);
  const [seriousIllnessDetails, setSeriousIllnessDetails] = useState('');
  const [hasAppliedBefore, setHasAppliedBefore] = useState(false);
  const [appliedBeforeWhen, setAppliedBeforeWhen] = useState('');
  const [relativesInCompany, setRelativesInCompany] = useState('');
  const [references, setReferences] = useState<JobReferenceContact[]>([
    { name: '', address: '', phone: '', occupation: '' },
    { name: '', address: '', phone: '', occupation: '' },
  ]);
  const [selfIntroduction, setSelfIntroduction] = useState('');

  // Attachments (Photos & Resumes with Google Drive links & Local Upload)
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoSourceType, setPhotoSourceType] = useState<'UPLOAD' | 'GOOGLE_DRIVE'>('UPLOAD');
  const [resumeFileName, setResumeFileName] = useState<string>('');
  const [resumeUrl, setResumeUrl] = useState<string>('');
  const [resumeSourceType, setResumeSourceType] = useState<'UPLOAD' | 'GOOGLE_DRIVE'>('UPLOAD');

  // Declaration & Signature (หน้า 4 PDF - ไม่เอา การพิจารณาว่าจ้าง)
  const [signatureName, setSignatureName] = useState('');
  const [isDeclarationAgreed, setIsDeclarationAgreed] = useState(true);

  // Submission Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<JobApplication | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Auto calculate age when birthDate changes
  useEffect(() => {
    if (!birthDate) {
      setAge('');
      return;
    }
    try {
      const parts = birthDate.split('-');
      if (parts.length >= 3) {
        let birthYear = parseInt(parts[0], 10);
        const birthMonth = parseInt(parts[1], 10) - 1;
        const birthDay = parseInt(parts[2], 10);
        
        // Handle Buddhist Era if > 2400
        if (birthYear > 2400) {
          birthYear -= 543;
        }

        const now = new Date();
        let calculatedAge = now.getFullYear() - birthYear;
        const currentMonth = now.getMonth();
        const currentDay = now.getDate();

        if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
          calculatedAge--;
        }

        if (!isNaN(calculatedAge) && calculatedAge >= 0 && calculatedAge < 120) {
          setAge(calculatedAge.toString());
        }
      }
    } catch (err) {
      console.warn('Error calculating age from birthDate:', err);
    }
  }, [birthDate]);

  // URL query parameter (?jobId=... or ?job=... or #apply?jobId=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    let targetJobId = params.get('jobId') || params.get('job');
    if (!targetJobId && window.location.hash.includes('jobId=')) {
      const match = window.location.hash.match(/jobId=([^&]+)/);
      if (match) targetJobId = decodeURIComponent(match[1]);
    }
    if (targetJobId) {
      const found = (settings.openings || []).find(o => o.id === targetJobId);
      if (found) {
        setSelectedJobId(found.id);
        setPosition1(found.title);
        setDepartment(found.department);
        setBranch(found.branch);
        setDesiredEmploymentType(found.employmentType);
      }
    }
  }, [settings.openings]);

  // Position select handler
  const handleSelectJobOpening = (jobOrId: JobOpening | string) => {
    const opening = typeof jobOrId === 'string' ? activeOpenings.find(o => o.id === jobOrId) : jobOrId;
    if (opening) {
      setSelectedJobId(opening.id);
      setPosition1(opening.title);
      setDepartment(opening.department);
      setBranch(opening.branch);
      setDesiredEmploymentType(opening.employmentType);
      if (!salary1 && opening.salaryRange) {
        const num = opening.salaryRange.replace(/,/g, '').match(/\d{4,6}/);
        if (num) setSalary1(num[0]);
      }
    }
  };

  // Quick Demo Auto-fill Helper
  const handleAutoFillSample = () => {
    setFullName('นายสมชาย กลิ่นเกสร');
    setNickname('ชาย');
    setGender('MALE');
    setBirthDate('1998-07-15');
    setAge('28');
    setRace('ไทย');
    setNationalityText('ไทย');
    setReligion('พุทธ');
    setIdCardNumber('1509900234567');
    setIdCardExpirationDate('2032-07-14');
    setHeightCm('175');
    setWeightKg('68');
    setMilitaryStatus('SERVED');
    setMaritalStatus('SINGLE');

    setAddressNo('123/45');
    setAddressMoo('2');
    setAddressRoad('นิมมานเหมินท์');
    setAddressSubdistrict('สุเทพ');
    setAddressDistrict('เมือง');
    setAddressProvince('เชียงใหม่');
    setAddressPostcode('50200');
    setLivingType('OWN_HOME');

    setPhoneNumber('089-123-4567');
    setEmail('somchai.klinkaysorn@gmail.com');
    setLineId('somchai_kk');

    setFatherName('นายสมศักดิ์ กลิ่นเกสร');
    setFatherAge('58');
    setFatherOccupation('ข้าราชการบำนาญ');
    setMotherName('นางสมศรี กลิ่นเกสร');
    setMotherAge('55');
    setMotherOccupation('ค้าขาย');
    setSiblingsTotal('2');
    setSiblingsMale('1');
    setSiblingsFemale('1');
    setSiblingOrder('1');
    setSiblingsList([
      { name: 'นางสาวสุดา กลิ่นเกสร', age: '24', occupation: 'พนักงานบริษัท' }
    ]);

    setEducationRecords([
      { level: 'มัธยมศึกษาตอนปลาย', institution: 'โรงเรียนเชียงใหม่วิทยา', major: 'วิทย์-คณิต', fromYear: '2557', toYear: '2560' },
      { level: 'ปวช.', institution: '', major: '', fromYear: '', toYear: '' },
      { level: 'ปวท. / ปวส.', institution: '', major: '', fromYear: '', toYear: '' },
      { level: 'ปริญญาตรี', institution: 'มหาวิทยาลัยเชียงใหม่', major: 'บริหารธุรกิจบัณฑิต', fromYear: '2560', toYear: '2564' },
      { level: 'สูงกว่าปริญญาตรี', institution: '', major: '', fromYear: '', toYear: '' },
      { level: 'อื่นๆ', institution: '', major: '', fromYear: '', toYear: '' },
    ]);

    setWorkExperiences([
      {
        company: 'บริษัท สยาม รีเทล จำกัด',
        fromPeriod: 'ม.ค. 65',
        toPeriod: 'ธ.ค. 66',
        position: 'หัวหน้างานบริการลูกค้า',
        jobDescription: 'ดูแลการบริการลูกค้า แก้ไขปัญหาเฉพาะหน้า บริหารทีมงาน 8 คน',
        salary: '18,500',
        reasonForLeaving: 'ต้องการความก้าวหน้าในสายงานธุรกิจอาหารและบริการ',
      }
    ]);

    setTypingThaiCan(true);
    setTypingThaiSpeed('45');
    setTypingEngCan(true);
    setTypingEngSpeed('35');
    setComputerSkillCan(true);
    setComputerSkillDetails('Microsoft Office, Google Workspace, POS System, Canva');
    setDrivingCan(true);
    setDrivingLicenseNo('64001234');
    setOfficeMachine('เครื่องสแกน, เครื่องพิมพ์, เครื่องถ่ายเอกสาร');
    setHobbies('อ่านหนังสือ, ทำอาหาร');
    setFavouriteSport('แบดมินตัน, วิ่งมินิมาราธอน');
    setSpecialKnowledge('การจัดการคลังสินค้าเบื้องต้น, ภาษาอังกฤษเพื่อการสื่อสาร');

    setEmergencyContactName('นางสมศรี กลิ่นเกสร');
    setEmergencyContactRelation('มารดา');
    setEmergencyContactPhone('081-987-6543');
    setEmergencyContactAddress('123/45 ต.สุเทพ อ.เมือง จ.เชียงใหม่');

    setSourceOfJobInfo('เว็บไซต์บริษัท / เพจ Facebook');
    setReferences([
      { name: 'นายวีระพล สุขใจ', address: 'เชียงใหม่', phone: '082-345-6789', occupation: 'ผู้จัดการสาขาเดิม' },
      { name: 'อาจารย์พิชิต มงคล', address: 'ม.เชียงใหม่', phone: '083-456-7890', occupation: 'อาจารย์ที่ปรึกษา' }
    ]);

    setSelfIntroduction('เป็นคนตรงต่อเวลา มีมนุษยสัมพันธ์ดี อัธยาศัยดี มีความอดทนสูง สามารถทำงานร่วมกับผู้อื่นได้ดี และพร้อมเรียนรู้สิ่งใหม่เสมอครับ');
    setSignatureName('สมชาย กลิ่นเกสร');
    setSalary1('18000');
    setPosition2('พนักงานแคชเชียร์');
    setSalary2('16000');
    // Pre-fill a Google Drive demonstration link for photo and resume
    setResumeSourceType('GOOGLE_DRIVE');
    setResumeUrl('https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view?usp=sharing');
    setResumeFileName('Resume_Somchai_2026.pdf');
  };

  // Share Form Handler
  const handleShareForm = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ใบสมัครงาน ${settings.companyName}`,
          text: `กรอกใบสมัครงานออนไลน์ ${position1 || ''}:`,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or unsupported, fallback to copy
      }
    }
    if (shareUrl) {
      const ok = await copyToClipboardSafe(shareUrl);
      if (ok) {
        setCopiedShareLink(true);
        setTimeout(() => setCopiedShareLink(false), 3000);
      }
    }
  };

  // File Upload Handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      showErrorAlert('ไฟล์มีขนาดใหญ่เกินไป', 'ขนาดไฟล์รูปภาพต้องไม่เกิน 4MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showErrorAlert('ไฟล์มีขนาดใหญ่เกินไป', 'ขนาดไฟล์เรซูเม่ต้องไม่เกิน 8MB');
      return;
    }
    setResumeFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setResumeUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (!fullName.trim()) errors.push('กรุณาระบุชื่อ-นามสกุล (Name)');
    if (!position1.trim()) errors.push('กรุณาระบุตำแหน่งที่ต้องการ 1 (Position Applied for 1)');
    if (!phoneNumber.trim()) errors.push('กรุณาระบุเบอร์โทรศัพท์มือถือสำหรับติดต่อ (Mobile)');
    if (!birthDate) errors.push('กรุณาระบุวันเดือนปีเกิด (Date of birth)');
    if (settings.requirePhoto && !photoUrl.trim()) {
      errors.push('กรุณาแนบรูปถ่ายหน้าตรง (อัปโหลดหรือระบุลิงก์ Google Drive)');
    }
    if (settings.requireResume && !resumeUrl.trim()) {
      errors.push('กรุณาแนบไฟล์เรซูเม่ (อัปโหลดหรือระบุลิงก์ Google Drive)');
    }
    if (!signatureName.trim()) {
      errors.push('กรุณาพิมพ์ชื่อ-นามสกุลในช่องลายมือชื่อผู้สมัคร เพื่อรับรองความถูกต้องของข้อมูล');
    }
    if (!isDeclarationAgreed) {
      errors.push('กรุณากดติ๊กยอมรับข้อความรับรองความถูกต้องของข้อมูลตามที่ระบุในแบบฟอร์ม');
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    setFormErrors([]);
    setIsSubmitting(true);

    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = `APP-${yearMonth}-${randomSuffix}`;

    // Full Address string
    const fullAddressParts = [
      addressNo ? `เลขที่ ${addressNo}` : '',
      addressMoo ? `หมู่ ${addressMoo}` : '',
      addressRoad ? `ถ.${addressRoad}` : '',
      addressSubdistrict ? `ต./แขวง ${addressSubdistrict}` : '',
      addressDistrict ? `อ./เขต ${addressDistrict}` : '',
      addressProvince ? `จ.${addressProvince}` : '',
      addressPostcode || '',
    ].filter(Boolean).join(' ');

    const newApplication: JobApplication = {
      id: newId,
      appliedAt: now.toISOString(),
      status: 'PENDING',
      jobOpeningId: selectedJobId || undefined,
      position: position1.trim(),
      expectedSalary: parseFloat(salary1) || 0,
      position2: position2.trim() || undefined,
      expectedSalary2: parseFloat(salary2) || undefined,
      department,
      branch,
      availableStartDate,
      desiredEmploymentType,

      fullName: fullName.trim(),
      nickname: nickname.trim(),
      gender,
      birthDate,
      age: parseInt(age) || undefined,
      race: race.trim(),
      nationalityText: nationalityText.trim() || 'ไทย',
      religion: religion.trim(),
      idCardNumber: idCardNumber.trim(),
      idCardExpirationDate,
      heightCm: parseFloat(heightCm) || undefined,
      weightKg: parseFloat(weightKg) || undefined,
      militaryStatus,
      maritalStatus,

      addressNo: addressNo.trim(),
      addressMoo: addressMoo.trim(),
      addressRoad: addressRoad.trim(),
      addressSubdistrict: addressSubdistrict.trim(),
      addressDistrict: addressDistrict.trim(),
      addressProvince: addressProvince.trim(),
      addressPostcode: addressPostcode.trim(),
      currentAddress: fullAddressParts || addressProvince,
      livingType,

      phoneNumber: phoneNumber.trim(),
      pager: pager.trim(),
      email: email.trim(),
      lineId: lineId.trim(),

      fatherName: fatherName.trim(),
      fatherAge: parseInt(fatherAge) || undefined,
      fatherOccupation: fatherOccupation.trim(),
      motherName: motherName.trim(),
      motherAge: parseInt(motherAge) || undefined,
      motherOccupation: motherOccupation.trim(),
      spouseName: spouseName.trim() || undefined,
      spouseWorkingPlace: spouseWorkingPlace.trim() || undefined,
      spousePosition: spousePosition.trim() || undefined,
      childrenCount: parseInt(childrenCount) || 0,
      siblingsTotal: parseInt(siblingsTotal) || 0,
      siblingsMale: parseInt(siblingsMale) || 0,
      siblingsFemale: parseInt(siblingsFemale) || 0,
      siblingOrder: parseInt(siblingOrder) || 1,
      siblingsList: siblingsList.filter(s => s.name.trim()),

      isForeignWorker: nationalityText !== 'ไทย',
      educationLevel: educationRecords.find(r => r.institution.trim())?.level || 'ปริญญาตรี',
      educationRecords: educationRecords.filter(r => r.institution.trim()),

      experienceYears: workExperiences.filter(w => w.company.trim()).length > 0 ? 1 : 0,
      previousCompany: workExperiences[0]?.company || '',
      previousPosition: workExperiences[0]?.position || '',
      workExperiences: workExperiences.filter(w => w.company.trim()),

      languages,

      typingThai: { canType: typingThaiCan, wordsPerMinute: parseInt(typingThaiSpeed) || 0 },
      typingEnglish: { canType: typingEngCan, wordsPerMinute: parseInt(typingEngSpeed) || 0 },
      computerSkill: { canUse: computerSkillCan, details: computerSkillDetails.trim() },
      driving: { canDrive: drivingCan, licenseNumber: drivingLicenseNo.trim() },
      officeMachine: officeMachine.trim(),
      hobbies: hobbies.trim(),
      favouriteSport: favouriteSport.trim(),
      specialKnowledge: specialKnowledge.trim(),
      otherSpecialAbility: otherSpecialAbility.trim(),
      skills: [specialKnowledge, computerSkillDetails].filter(Boolean).join(', '),

      canWorkUpCountry,
      canWorkUpCountryDetails: canWorkUpCountryDetails.trim(),
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactRelation: emergencyContactRelation.trim(),
      emergencyContactAddress: emergencyContactAddress.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
      sourceOfJobInfo: sourceOfJobInfo.trim(),
      hasSeriousIllness,
      seriousIllnessDetails: seriousIllnessDetails.trim(),
      hasAppliedBefore,
      appliedBeforeWhen: appliedBeforeWhen.trim(),
      relativesInCompany: relativesInCompany.trim(),
      references: references.filter(r => r.name.trim()),
      selfIntroduction: selfIntroduction.trim(),
      introduction: selfIntroduction.trim(),

      photoUrl: photoUrl.trim() || undefined,
      photoDriveUrl: isGoogleDriveUrl(photoUrl) ? photoUrl.trim() : undefined,
      photoSourceType,
      resumeFileName: resumeFileName || (isGoogleDriveUrl(resumeUrl) ? 'Google Drive Resume' : undefined),
      resumeUrl: resumeUrl.trim() || undefined,
      resumeDriveUrl: isGoogleDriveUrl(resumeUrl) ? resumeUrl.trim() : undefined,
      resumeSourceType,

      applicantSignature: signatureName.trim(),
      certifiedAt: now.toISOString(),
    };

    try {
      await onSubmitApplication(newApplication);
      setSubmittedApp(newApplication);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to submit application:', err);
      showErrorAlert('ส่งใบสมัครไม่สำเร็จ', 'เกิดข้อผิดพลาดในการส่งใบสมัคร โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!submittedApp) return;
    navigator.clipboard.writeText(submittedApp.id);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  // If recruitment is closed
  if (!settings.isOpen) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-800">ขณะนี้ปิดรับสมัครงานชั่วคราว</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {settings.companyName} ได้ปิดรับการส่งใบสมัครงานชั่วคราว ขอบคุณทุกท่านที่ให้ความสนใจ
          </p>
          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
            <p>สอบถามข้อมูลเพิ่มเติม:</p>
            <p className="font-semibold text-slate-700">{settings.contactPhone}</p>
            <p className="text-blue-600">{settings.contactEmail}</p>
          </div>
          {onSwitchToHR && (
            <div className="pt-4">
              <button
                type="button"
                onClick={onSwitchToHR}
                className="text-xs text-slate-400 hover:text-slate-600 underline"
              >
                เข้าสู่ระบบจัดการสำหรับเจ้าหน้าที่ HR
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // SUCCESS RECEIPT VIEW
  // ==========================================
  if (submittedApp) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-slate-50 to-white py-8 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold inline-block mb-2">
                ส่งใบสมัครสำเร็จเรียบร้อย
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                ขอบคุณที่สนใจร่วมงานกับ {settings.companyName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-lg mx-auto">
                {settings.thankYouMessage || 'ฝ่ายบุคคลได้รับใบสมัครของท่านเรียบร้อยแล้ว'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">รหัสอ้างอิงใบสมัคร:</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'คัดลอกแล้ว' : 'คัดลอกรหัส'}</span>
                </button>
              </div>
              <div className="font-mono text-xl sm:text-2xl font-black text-indigo-700 tracking-wider">
                {submittedApp.id}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-500 block">ตำแหน่งที่สมัคร:</span>
                  <span className="font-bold text-slate-800">{submittedApp.position}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">ผู้สมัคร:</span>
                  <span className="font-bold text-slate-800">{submittedApp.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">วันที่ส่งใบสมัคร:</span>
                  <span className="font-medium text-slate-700">
                    {new Date(submittedApp.appliedAt).toLocaleDateString('th-TH')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">สถานะปัจจุบัน:</span>
                  <span className="font-bold text-amber-600">รอฝ่ายบุคคลตรวจสอบคุณสมบัติ</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์ใบสมัคร (Print Application)</span>
              </button>
              <button
                type="button"
                onClick={() => setSubmittedApp(null)}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md"
              >
                <span>กรอกใบสมัครตำแหน่งอื่นเพิ่มเติม</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // APPLICATION FORM VIEW (MATCHING PDF)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100/70 py-6 sm:py-10 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Company Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
                  APPLICATION FOR EMPLOYMENT / ใบสมัครงาน
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-400 text-slate-900">
                  เปิดรับสมัคร {activeOpenings.length} ตำแหน่ง
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {settings.companyName}
              </h1>
              {settings.companyTagline && (
                <p className="text-xs sm:text-sm text-blue-200 mt-1">
                  {settings.companyTagline}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-xs text-blue-100 mt-3">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-300" />
                  {settings.companyAddress || settings.workLocation}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-blue-300" />
                  {settings.contactPhone}
                </span>
                {settings.contactLineId && (
                  <span className="flex items-center gap-1">
                    <span className="font-bold text-emerald-300">LINE:</span>
                    {settings.contactLineId}
                  </span>
                )}
              </div>

              {/* Header Quick Actions */}
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleShareForm}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedShareLink ? 'คัดลอกลิงก์แล้ว!' : 'แชร์ลิงก์ใบสมัครนี้'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAutoFillSample}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/30 text-xs font-bold transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>กรอกข้อมูลตัวอย่างทดสอบ (Demo Test Fill)</span>
                </button>

                {onSwitchToHR && (
                  <button
                    type="button"
                    onClick={onSwitchToHR}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-blue-200 text-xs font-semibold transition ml-auto"
                  >
                    <span>สำหรับเจ้าหน้าที่ HR</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Logo / Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-2xl flex items-center justify-center text-white shrink-0 border border-white/20 overflow-hidden">
              {settings.companyLogoUrl ? (
                <img src={resolveDisplayImageUrl(settings.companyLogoUrl)} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <Briefcase className="w-8 h-8 sm:w-10 sm:h-10 text-blue-200" />
              )}
            </div>
          </div>
        </div>

        {/* Validation Errors Box */}
        {formErrors.length > 0 && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1 shadow-sm">
            <div className="font-bold flex items-center gap-1.5 text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>โปรดตรวจสอบข้อมูลในแบบฟอร์มดังนี้:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 pl-2 text-rose-700">
              {formErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* The Official Application Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Form Top: Title & Photo Box */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                  APPLICATION FOR EMPLOYMENT
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  ใบสมัครงาน
                </h2>
                <p className="text-xs text-slate-500">
                  กรอกข้อมูลด้วยตัวท่านเอง (To be completed in own handwriting / online submission)
                </p>
              </div>

              {/* Photo Box with Google Drive & Upload Support */}
              <div className="w-full sm:w-80">
                <DriveOrUploadBox
                  label="รูปถ่ายหน้าตรง (Photo)"
                  required={settings.requirePhoto}
                  type="photo"
                  valueUrl={photoUrl}
                  sourceType={photoSourceType}
                  onSourceTypeChange={setPhotoSourceType}
                  onUrlChange={setPhotoUrl}
                  onFileUpload={handlePhotoUpload}
                  onClear={() => setPhotoUrl('')}
                />
              </div>
            </div>

            {/* Position Applied for (เลือกตำแหน่งที่ต้องการ) */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>ตำแหน่งงานที่เปิดรับสมัคร (คลิกเลือกตำแหน่งได้ทันที)</span>
                </h3>
                {activeOpenings.length > 0 && (
                  <span className="text-xs text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 self-start sm:self-auto">
                    เปิดรับ {activeOpenings.length} ตำแหน่ง
                  </span>
                )}
              </div>

              {/* Interactive Openings Cards Grid */}
              {activeOpenings.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeOpenings.map((opening) => {
                    const isSelected = selectedJobId === opening.id || position1 === opening.title;
                    return (
                      <button
                        key={opening.id}
                        type="button"
                        onClick={() => handleSelectJobOpening(opening)}
                        className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/30 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-sm font-bold text-slate-900">
                                {opening.title}
                              </h4>
                              {opening.urgent && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  รับด่วน
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {opening.department} • {opening.branch}
                            </p>
                          </div>

                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                            isSelected 
                              ? 'bg-blue-600 border-blue-600 text-white' 
                              : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                          <span className="font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-blue-600" />
                            <span>{opening.salaryRange}</span>
                          </span>
                          <span className="text-xs font-semibold text-slate-600">
                            {opening.employmentType === 'FULL_TIME' ? 'เต็มเวลา' : opening.employmentType === 'PART_TIME' ? 'พาร์ทไทม์' : 'รายวัน'}
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {/* Option: Other / Custom position */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJobId('CUSTOM');
                      if (activeOpenings.some(o => o.title === position1)) {
                        setPosition1('');
                        setSalary1('');
                      }
                    }}
                    className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedJobId === 'CUSTOM'
                        ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/30 shadow-sm'
                        : 'bg-white border-dashed border-slate-300 hover:border-slate-400 text-slate-600'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                        <span>ระบุตำแหน่งอื่นๆ ด้วยตนเอง</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        พิมพ์ระบุชื่อตำแหน่งที่ต้องการในช่องด้านล่าง
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                      selectedJobId === 'CUSTOM' 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'border-slate-300 bg-white'
                    }`}>
                      {selectedJobId === 'CUSTOM' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                </div>
              )}

              {/* Form Input fields for Position & Salary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    ตำแหน่งที่ต้องการ 1 (Position 1) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น พนักงานบริการหน้าร้าน หรือ แคชเชียร์"
                    value={position1}
                    onChange={(e) => setPosition1(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-900 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    เงินเดือนที่ต้องการ 1 (Salary บาท/เดือน) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="เช่น 16000"
                    value={salary1}
                    onChange={(e) => setSalary1(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-blue-700 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    ตำแหน่งที่ต้องการ 2 (Position 2 - ถ้ามี)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ผู้ช่วยกุ๊ก หรือ บาริสต้า"
                    value={position2}
                    onChange={(e) => setPosition2(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800 shadow-2xs"
                  />
                  {/* Quick chips for position 2 */}
                  {activeOpenings.length > 1 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-xs text-slate-500">เลือกเร็ว:</span>
                      {activeOpenings.filter(o => o.title !== position1).map(o => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => setPosition2(o.title)}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                        >
                          + {o.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    เงินเดือนที่ต้องการ 2 (Salary 2 บาท/เดือน)
                  </label>
                  <input
                    type="number"
                    placeholder="เช่น 15000"
                    value={salary2}
                    onChange={(e) => setSalary2(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Personal Information (หน้า 1 PDF) */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Personal Information (ประวัติส่วนตัว)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    ชื่อ-นามสกุล (Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น นายสมชาย กลิ่นเกสร"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-900 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    ชื่อเล่น (Nickname)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ชาย"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    เพศ (Sex)
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE')}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none shadow-2xs"
                  >
                    <option value="MALE">ชาย (Male)</option>
                    <option value="FEMALE">หญิง (Female)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-bold text-slate-800">
                      วัน เดือน ปีเกิด (Date of birth) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
                      เลือก วัน / เดือน / ปีเกิด (พ.ศ.)
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* วัน */}
                    <div>
                      <select
                        value={birthDay}
                        onChange={(e) => handleDatePartsChange(e.target.value, birthMonth, birthYear)}
                        className="w-full px-2.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                      >
                        <option value="">-- วัน --</option>
                        {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                          <option key={d} value={d}>วันที่ {parseInt(d, 10)}</option>
                        ))}
                      </select>
                    </div>

                    {/* เดือน */}
                    <div>
                      <select
                        value={birthMonth}
                        onChange={(e) => handleDatePartsChange(birthDay, e.target.value, birthYear)}
                        className="w-full px-2.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                      >
                        <option value="">-- เดือน --</option>
                        {THAI_MONTHS.map(m => (
                          <option key={m.value} value={m.value}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* ปี พ.ศ. */}
                    <div>
                      <select
                        value={birthYear}
                        onChange={(e) => handleDatePartsChange(birthDay, birthMonth, e.target.value)}
                        className="w-full px-2.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                      >
                        <option value="">-- ปีเกิด --</option>
                        {YEAR_OPTIONS.map(y => (
                          <option key={y.ce} value={y.ce}>พ.ศ. {y.be} ({y.ce})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 px-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>{birthDay && birthMonth && birthYear ? `เกิดวันที่ ${parseInt(birthDay, 10)} ${THAI_MONTHS.find(m => m.value === birthMonth)?.name || ''} พ.ศ. ${parseInt(birthYear, 10) + 543}` : 'กรุณาเลือกวันเดือนปีเกิด'}</span>
                    </span>
                    <label className="text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1 font-semibold">
                      <span>หรือเลือกจากปฏิทิน</span>
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => handleFullDateChange(e.target.value)}
                        className="opacity-0 w-3 h-3 -ml-3 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-bold text-slate-800">
                      อายุ (Age)
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      คำนวณอัตโนมัติ
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      readOnly
                      placeholder="คำนวณอัตโนมัติ"
                      value={age}
                      className="w-full pl-3.5 pr-8 py-2.5 text-sm bg-emerald-50/70 border border-emerald-300 rounded-xl text-center font-black text-emerald-800 shadow-2xs cursor-default"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-700 pointer-events-none">
                      ปี
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block text-center">
                    ใส่อัตโนมัติจากวันเกิด
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    เชื้อชาติ (Race)
                  </label>
                  <input
                    type="text"
                    value={race}
                    onChange={(e) => setRace(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    สัญชาติ (Nationality)
                  </label>
                  <input
                    type="text"
                    value={nationalityText}
                    onChange={(e) => setNationalityText(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    ศาสนา (Religion)
                  </label>
                  <input
                    type="text"
                    value={religion}
                    onChange={(e) => setReligion(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    บัตรประชาชนเลขที่ (ID Card No.)
                  </label>
                  <input
                    type="text"
                    placeholder="13 หลัก หรือ เลขพาสปอร์ต"
                    value={idCardNumber}
                    onChange={(e) => setIdCardNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono font-medium shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    บัตรหมดอายุ (Expiration date)
                  </label>
                  <input
                    type="date"
                    value={idCardExpirationDate}
                    onChange={(e) => setIdCardExpirationDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    ส่วนสูง (Height cm.) / น้ำหนัก (Weight kgs.)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="ซม."
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      className="w-1/2 px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-center font-medium shadow-2xs"
                    />
                    <input
                      type="number"
                      placeholder="กก."
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      className="w-1/2 px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-center font-medium shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    ภาวะทางทหาร (Military status)
                  </label>
                  <select
                    value={militaryStatus}
                    onChange={(e) => setMilitaryStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium shadow-2xs"
                  >
                    <option value="EXEMPTED">ได้รับการยกเว้น (Exempted)</option>
                    <option value="SERVED">ปลดเป็นทหารกองหนุน (Served)</option>
                    <option value="NOT_YET_SERVED">ยังไม่ได้รับการเกณฑ์ (Not yet served)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    สถานภาพ (Marital status)
                  </label>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium shadow-2xs"
                  >
                    <option value="SINGLE">โสด (Single)</option>
                    <option value="MARRIED">แต่งงาน (Married)</option>
                    <option value="WIDOWED">หม้าย (Widowed)</option>
                    <option value="SEPARATED">แยกกัน (Separated)</option>
                  </select>
                </div>
              </div>

              {/* Address (ที่อยู่ปัจจุบัน) */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 block">
                  ที่อยู่ปัจจุบัน (Present address):
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">เลขที่ (No.)</label>
                    <input
                      type="text"
                      placeholder="123/45"
                      value={addressNo}
                      onChange={(e) => setAddressNo(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">หมู่ที่ (Moo)</label>
                    <input
                      type="text"
                      placeholder="2"
                      value={addressMoo}
                      onChange={(e) => setAddressMoo(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">ถนน (Road)</label>
                    <input
                      type="text"
                      placeholder="นิมมานเหมินท์"
                      value={addressRoad}
                      onChange={(e) => setAddressRoad(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">ตำบล/แขวง (District)</label>
                    <input
                      type="text"
                      placeholder="สุเทพ"
                      value={addressSubdistrict}
                      onChange={(e) => setAddressSubdistrict(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">อำเภอ/เขต (Amphur)</label>
                    <input
                      type="text"
                      placeholder="เมือง"
                      value={addressDistrict}
                      onChange={(e) => setAddressDistrict(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">จังหวัด (Province)</label>
                    <input
                      type="text"
                      placeholder="เชียงใหม่"
                      value={addressProvince}
                      onChange={(e) => setAddressProvince(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">รหัสไปรษณีย์ (Post code)</label>
                    <input
                      type="text"
                      placeholder="50200"
                      value={addressPostcode}
                      onChange={(e) => setAddressPostcode(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">ลักษณะที่พักอาศัย</label>
                    <select
                      value={livingType}
                      onChange={(e) => setLivingType(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="LIVING_WITH_PARENTS">อาศัยกับครอบครัว</option>
                      <option value="OWN_HOME">บ้านตัวเอง</option>
                      <option value="HIRED_HOUSE">บ้านเช่า</option>
                      <option value="HOSTEL">หอพัก</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    มือถือ (Mobile) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="081-234-5678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    อีเมล (E-mail)
                  </label>
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    LINE ID
                  </label>
                  <input
                    type="text"
                    placeholder="somchai_kk"
                    value={lineId}
                    onChange={(e) => setLineId(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-emerald-700 font-bold shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Family Information (หน้า 1-2 PDF) */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Family Information (ประวัติครอบครัว)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    บิดา ชื่อ-สกุล (Father's name-surname)
                  </label>
                  <input
                    type="text"
                    placeholder="ชื่อ-สกุล บิดา"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    อายุ (ปี) / อาชีพ
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder="อายุ"
                      value={fatherAge}
                      onChange={(e) => setFatherAge(e.target.value)}
                      className="w-20 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-center"
                    />
                    <input
                      type="text"
                      placeholder="อาชีพ"
                      value={fatherOccupation}
                      onChange={(e) => setFatherOccupation(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    มารดา ชื่อ-สกุล (Mother's name-surname)
                  </label>
                  <input
                    type="text"
                    placeholder="ชื่อ-สกุล มารดา"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    อายุ (ปี) / อาชีพ
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder="อายุ"
                      value={motherAge}
                      onChange={(e) => setMotherAge(e.target.value)}
                      className="w-20 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-center"
                    />
                    <input
                      type="text"
                      placeholder="อาชีพ"
                      value={motherOccupation}
                      onChange={(e) => setMotherOccupation(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อภรรยา/สามี (Name of wife / Husband)
                  </label>
                  <input
                    type="text"
                    placeholder="ถ้ามี"
                    value={spouseName}
                    onChange={(e) => setSpouseName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    สถานที่ทำงาน (Working Place)
                  </label>
                  <input
                    type="text"
                    placeholder="สถานที่ทำงานคู่สมรส"
                    value={spouseWorkingPlace}
                    onChange={(e) => setSpouseWorkingPlace(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ตำแหน่ง (Position)
                  </label>
                  <input
                    type="text"
                    placeholder="ตำแหน่งงานคู่สมรส"
                    value={spousePosition}
                    onChange={(e) => setSpousePosition(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Children & Siblings count */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <label className="text-slate-600 block mb-0.5">มีบุตร (คน)</label>
                  <input
                    type="number"
                    value={childrenCount}
                    onChange={(e) => setChildrenCount(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-center"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-0.5">พี่น้องรวม (คน)</label>
                  <input
                    type="number"
                    value={siblingsTotal}
                    onChange={(e) => setSiblingsTotal(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-center"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-0.5">ชาย (คน)</label>
                  <input
                    type="number"
                    value={siblingsMale}
                    onChange={(e) => setSiblingsMale(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-center"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-0.5">หญิง (คน)</label>
                  <input
                    type="number"
                    value={siblingsFemale}
                    onChange={(e) => setSiblingsFemale(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-center"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-0.5">เป็นบุตรคนที่</label>
                  <input
                    type="number"
                    value={siblingOrder}
                    onChange={(e) => setSiblingOrder(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-center font-bold text-blue-700"
                  />
                </div>
              </div>

              {/* Siblings Table */}
              <SiblingsTable siblings={siblingsList} onChange={setSiblingsList} />
            </div>

            {/* Education Section (หน้า 2 PDF) */}
            <div className="pt-4 border-t border-slate-200">
              <EducationTable records={educationRecords} onChange={setEducationRecords} />
            </div>

            {/* Working Experience (หน้า 2 PDF) */}
            <div className="pt-4 border-t border-slate-200">
              <ExperienceTable experiences={workExperiences} onChange={setWorkExperiences} />
            </div>

            {/* Language Ability (หน้า 2 PDF) */}
            <div className="pt-4 border-t border-slate-200">
              <LanguageAbilityTable languages={languages} onChange={setLanguages} />
            </div>

            {/* Special Ability (หน้า 3 PDF) */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                Special Ability (ความสามารถพิเศษ)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Typing */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <span className="font-bold text-slate-800 block">พิมพ์ดีด (Typing):</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="typing"
                        checked={typingThaiCan}
                        onChange={() => { setTypingThaiCan(true); setTypingEngCan(true); }}
                      />
                      <span>ได้ (Yes)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="typing"
                        checked={!typingThaiCan}
                        onChange={() => { setTypingThaiCan(false); setTypingEngCan(false); }}
                      />
                      <span>ไม่ได้ (No)</span>
                    </label>
                  </div>

                  {typingThaiCan && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[11px] text-slate-500 block">ไทย (คำ/นาที):</span>
                        <input
                          type="number"
                          value={typingThaiSpeed}
                          onChange={(e) => setTypingThaiSpeed(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-center"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block">อังกฤษ (คำ/นาที):</span>
                        <input
                          type="number"
                          value={typingEngSpeed}
                          onChange={(e) => setTypingEngSpeed(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-center"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Driving */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <span className="font-bold text-slate-800 block">ขับรถยนต์ (Driving):</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="driving"
                        checked={drivingCan}
                        onChange={() => setDrivingCan(true)}
                      />
                      <span>ได้ (Yes)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="driving"
                        checked={!drivingCan}
                        onChange={() => setDrivingCan(false)}
                      />
                      <span>ไม่ได้ (No)</span>
                    </label>
                  </div>

                  {drivingCan && (
                    <div>
                      <span className="text-[11px] text-slate-500 block">ใบขับขี่เลขที่ (Driving License No.):</span>
                      <input
                        type="text"
                        placeholder="ระบุเลขที่ใบขับขี่"
                        value={drivingLicenseNo}
                        onChange={(e) => setDrivingLicenseNo(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Computer */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 sm:col-span-2">
                  <span className="font-bold text-slate-800 block">คอมพิวเตอร์ (Computer):</span>
                  <input
                    type="text"
                    placeholder="โปรแกรมหรือทักษะคอมพิวเตอร์ที่ใช้ได้ เช่น Excel, Word, Google Docs, Canva, POS"
                    value={computerSkillDetails}
                    onChange={(e) => setComputerSkillDetails(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ความสามารถในการใช้เครื่องใช้สำนักงาน (Office Machine)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น เครื่องถ่ายเอกสาร, เครื่องสแกน"
                    value={officeMachine}
                    onChange={(e) => setOfficeMachine(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    งานอดิเรก (Hobbies)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น อ่านหนังสือ, ทำอาหาร"
                    value={hobbies}
                    onChange={(e) => setHobbies(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    กีฬาที่ชอบ (Favourite Sport)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น วิ่ง, แบดมินตัน, ฟุตบอล"
                    value={favouriteSport}
                    onChange={(e) => setFavouriteSport(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ความรู้พิเศษ (Special knowledge)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ชงกาแฟ, ปรุงอาหาร, ทำเครื่องดื่ม"
                    value={specialKnowledge}
                    onChange={(e) => setSpecialKnowledge(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Additional Questions (หน้า 3 PDF) */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                คำถามเพิ่มเติมและข้อมูลประกอบการพิจารณา
              </h3>

              <div className="space-y-4 text-xs">
                {/* Can work upcountry */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 block">
                    สามารถไปปฏิบัติงานต่างจังหวัด (I can work up Country):
                  </span>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="upcountry"
                        checked={canWorkUpCountry === 'YES'}
                        onChange={() => setCanWorkUpCountry('YES')}
                      />
                      <span>ได้ (Yes)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="upcountry"
                        checked={canWorkUpCountry === 'NO'}
                        onChange={() => setCanWorkUpCountry('NO')}
                      />
                      <span>ไม่ได้ (No)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="upcountry"
                        checked={canWorkUpCountry === 'OTHER'}
                        onChange={() => setCanWorkUpCountry('OTHER')}
                      />
                      <span>อื่นๆ ระบุ</span>
                    </label>
                    {canWorkUpCountry === 'OTHER' && (
                      <input
                        type="text"
                        placeholder="ระบุเงื่อนไข"
                        value={canWorkUpCountryDetails}
                        onChange={(e) => setCanWorkUpCountryDetails(e.target.value)}
                        className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg"
                      />
                    )}
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <span className="font-bold text-slate-800 block">
                    กรณีฉุกเฉินบุคคลที่ติดต่อได้ (Person to be notified in case of emergency):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">แจ้งชื่อ-นามสกุล</label>
                      <input
                        type="text"
                        placeholder="ชื่อผู้ติดต่อฉุกเฉิน"
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">เกี่ยวข้องกับผู้สมัคร</label>
                      <input
                        type="text"
                        placeholder="เช่น บิดา, มารดา, พี่สาว"
                        value={emergencyContactRelation}
                        onChange={(e) => setEmergencyContactRelation(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">โทร. (Tel.)</label>
                      <input
                        type="tel"
                        placeholder="เบอร์โทรศัพท์ฉุกเฉิน"
                        value={emergencyContactPhone}
                        onChange={(e) => setEmergencyContactPhone(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">ที่อยู่ (Address)</label>
                      <input
                        type="text"
                        placeholder="ที่อยู่บุคคลฉุกเฉิน"
                        value={emergencyContactAddress}
                        onChange={(e) => setEmergencyContactAddress(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Sources & Illness & Applied before */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ทราบข่าวการรับสมัครจาก (Sources of job information)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น Facebook, ป้ายหน้าร้าน, เพื่อนแนะนำ"
                      value={sourceOfJobInfo}
                      onChange={(e) => setSourceOfJobInfo(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      เขียนชื่อญาติ / เพื่อน ที่ทำงานอยู่ในบริษัทฯ ซึ่งท่านรู้จักดี
                    </label>
                    <input
                      type="text"
                      placeholder="ถ้ามี ให้ระบุชื่อและแผนก"
                      value={relativesInCompany}
                      onChange={(e) => setRelativesInCompany(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                {/* Serious illness */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-800">
                      ท่านเคยป่วยหนักและเป็นโรคติดต่อร้ายแรงมาก่อนหรือไม่?
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="illness"
                          checked={!hasSeriousIllness}
                          onChange={() => setHasSeriousIllness(false)}
                        />
                        <span>ไม่เคย (No)</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="illness"
                          checked={hasSeriousIllness}
                          onChange={() => setHasSeriousIllness(true)}
                        />
                        <span>เคย (Yes)</span>
                      </label>
                    </div>
                  </div>
                  {hasSeriousIllness && (
                    <input
                      type="text"
                      placeholder="ถ้าเคยโปรดระบุชื่อโรค (If yes, explain fully)"
                      value={seriousIllnessDetails}
                      onChange={(e) => setSeriousIllnessDetails(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl"
                    />
                  )}
                </div>

                {/* Applied Before */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-800">
                      ท่านเคยสมัครงานกับบริษัทฯ นี้มาก่อนหรือไม่?
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="appliedBefore"
                          checked={!hasAppliedBefore}
                          onChange={() => setHasAppliedBefore(false)}
                        />
                        <span>ไม่เคย (No)</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="appliedBefore"
                          checked={hasAppliedBefore}
                          onChange={() => setHasAppliedBefore(true)}
                        />
                        <span>เคย (Yes)</span>
                      </label>
                    </div>
                  </div>
                  {hasAppliedBefore && (
                    <input
                      type="text"
                      placeholder="ถ้าเคย เมื่อไร? (If yes, when?)"
                      value={appliedBeforeWhen}
                      onChange={(e) => setAppliedBeforeWhen(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl"
                    />
                  )}
                </div>

                {/* References Table */}
                <ReferencesTable references={references} onChange={setReferences} />

                {/* Self Introduction */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    กรุณาแนะนำตัวท่านเอง เพื่อให้บริษัทรู้จักตัวท่านดีขึ้น (Please provide any further information about yourself)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="บอกเล่าความสนใจ เป้าหมาย และจุดเด่นของตัวท่าน"
                    value={selfIntroduction}
                    onChange={(e) => setSelfIntroduction(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Resume Upload / Google Drive Box */}
            <div className="pt-4 border-t border-slate-200">
              <DriveOrUploadBox
                label="แนบไฟล์เรซูเม่ / ประวัติส่วนตัว (Resume / CV)"
                required={settings.requireResume}
                type="resume"
                valueUrl={resumeUrl}
                fileName={resumeFileName}
                sourceType={resumeSourceType}
                onSourceTypeChange={setResumeSourceType}
                onUrlChange={setResumeUrl}
                onFileUpload={handleResumeUpload}
                onClear={() => { setResumeUrl(''); setResumeFileName(''); }}
              />
            </div>
          </div>

          {/* Section: Declaration & Certification (หน้า 4 PDF) */}
          {/* หมายเหตุสำคัญ: ไม่เอา "การพิจารณาว่าจ้าง" ตามคำขอของผู้ใช้ */}
          <CertificationDeclarationBox
            signatureName={signatureName}
            onSignatureChange={setSignatureName}
            isAgreed={isDeclarationAgreed}
            onAgreedChange={setIsDeclarationAgreed}
          />

          {/* Submit Action Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 text-center sm:text-left">
              กรุณาตรวจสอบความถูกต้องของข้อมูลทั้งหมดก่อนกดส่งใบสมัคร
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังส่งใบสมัคร...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>ส่งใบสมัครงาน (Submit Application)</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
