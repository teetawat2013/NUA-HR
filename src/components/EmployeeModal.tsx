import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Save, 
  User, 
  Globe2, 
  Calendar, 
  FileText, 
  AlertCircle, 
  Upload, 
  Check, 
  UserMinus,
  Camera,
  Image,
  CreditCard,
  Building,
  ShieldCheck,
  MapPin,
  Briefcase,
  FileCheck
} from 'lucide-react';
import { 
  Employee, 
  Department, 
  EmploymentType, 
  ForeignWorkerDetails,
  WorkerDocument,
  IdentificationType,
  PinkCardDetails,
  PassportDetails,
  OtherDocumentDetails,
  WorkPermitDetails,
  DEPARTMENTS,
  BRANCHES
} from '../types';
import { showErrorAlert } from '../utils/swal';
import { getExpiryStatus } from '../utils/payrollCalculator';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => void;
  employeeToEdit?: Employee | null;
  existingCount: number;
}

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: 'FULL_TIME', label: 'พนักงานประจำ (Full-Time)' },
  { value: 'PROBATION', label: 'ทดลองงาน (Probation)' },
  { value: 'CONTRACT', label: 'สัญญาจ้างตามระยะเวลา (Contract)' },
  { value: 'DAILY', label: 'พนักงานรายวัน (Daily Worker)' },
  { value: 'PART_TIME', label: 'พาร์ทไทม์ (Part-Time)' },
];

const FOREIGN_COUNTRIES = [
  'เมียนมา (Myanmar)',
  'กัมพูชา (Cambodia)',
  'ลาว (Laos)',
  'เวียดนาม (Vietnam)',
  'ฟิลิปปินส์ (Philippines)',
  'จีน (China)',
  'อื่นๆ (Other)',
];

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  employeeToEdit,
  existingCount,
}) => {
  // สัญชาติ: ไทย หรือ ต่างด้าว
  const [isForeignWorker, setIsForeignWorker] = useState<boolean>(false);
  const [nationalityText, setNationalityText] = useState<string>('ไทย');

  // ส่วนที่ 1: ข้อมูลทั่วไป
  const [empId, setEmpId] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [idCardNumber, setIdCardNumber] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [department, setDepartment] = useState<Department>(DEPARTMENTS[0]);
  const [branch, setBranch] = useState<string>(BRANCHES[0]);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [employmentType, setEmploymentType] = useState<EmploymentType>('FULL_TIME');
  const [salary, setSalary] = useState<number>(18000);
  const [allowance, setAllowance] = useState<number>(0);
  const [emergencyName, setEmergencyName] = useState<string>('');
  const [emergencyRel, setEmergencyRel] = useState<string>('');
  const [emergencyPhone, setEmergencyPhone] = useState<string>('');

  // ฟังก์ชันที่ 2: ประเภทเอกสารประจำตัวสำหรับแรงงานต่างด้าว
  const [foreignDocType, setForeignDocType] = useState<'PINK_CARD' | 'PASSPORT' | 'OTHER' | 'NONE'>('PINK_CARD');

  // กรณี "บัตรสีชมพู / บัตรสีขาว"
  const [cardColor, setCardColor] = useState<'PINK' | 'WHITE'>('PINK');
  const [pinkId13, setPinkId13] = useState<string>('');
  const [pinkThaiName, setPinkThaiName] = useState<string>('');
  const [pinkEngName, setPinkEngName] = useState<string>('');
  const [pinkBirthDate, setPinkBirthDate] = useState<string>('');
  const [pinkNationality, setPinkNationality] = useState<string>(FOREIGN_COUNTRIES[0]);
  const [pinkIssueDate, setPinkIssueDate] = useState<string>('');
  const [pinkExpiryDate, setPinkExpiryDate] = useState<string>('');
  const [pinkIssuingOffice, setPinkIssuingOffice] = useState<string>('');
  const [pinkFrontImage, setPinkFrontImage] = useState<string>('');
  const [pinkBackImage, setPinkBackImage] = useState<string>('');

  // กรณี "Passport"
  const [passNumber, setPassNumber] = useState<string>('');
  const [passFullName, setPassFullName] = useState<string>('');
  const [passNationality, setPassNationality] = useState<string>(FOREIGN_COUNTRIES[0]);
  const [passBirthDate, setPassBirthDate] = useState<string>('');
  const [passIssueDate, setPassIssueDate] = useState<string>('');
  const [passExpiryDate, setPassExpiryDate] = useState<string>('');
  const [passIssuingCountry, setPassIssuingCountry] = useState<string>(FOREIGN_COUNTRIES[0]);
  const [passImage, setPassImage] = useState<string>('');
  const [passVisaStatus, setPassVisaStatus] = useState<string>('Non-Immigrant L-A (MOU)');
  const [passStayExpiry, setPassStayExpiry] = useState<string>('');

  // กรณี "บัตร/เอกสารประจำตัวประเภทอื่น"
  const [otherDocName, setOtherDocName] = useState<string>('');
  const [otherDocNumber, setOtherDocNumber] = useState<string>('');
  const [otherDocIssueDate, setOtherDocIssueDate] = useState<string>('');
  const [otherDocExpiryDate, setOtherDocExpiryDate] = useState<string>('');
  const [otherDocImage, setOtherDocImage] = useState<string>('');
  const [otherDocAuthority, setOtherDocAuthority] = useState<string>('');

  // ข้อมูลใบอนุญาตทำงาน (Work Permit)
  const [hasWorkPermit, setHasWorkPermit] = useState<boolean>(true);
  const [workPermitNumber, setWorkPermitNumber] = useState<string>('');
  const [workPermitPosition, setWorkPermitPosition] = useState<string>('');
  const [workPermitJobDescription, setWorkPermitJobDescription] = useState<string>('');
  const [workPermitWorkplace, setWorkPermitWorkplace] = useState<string>('');
  const [workPermitEffectiveDate, setWorkPermitEffectiveDate] = useState<string>('');
  const [workPermitExpiryDate, setWorkPermitExpiryDate] = useState<string>('');
  const [workPermitImage, setWorkPermitImage] = useState<string>('');
  const [isRenewingWorkPermit, setIsRenewingWorkPermit] = useState<boolean>(false);

  // เช็คลิสต์เอกสารสำคัญของพนักงาน (สำเนาบัตร, ทะเบียนบ้าน, รูปถ่าย, เรซูเม่, การศึกษา, แพทย์)
  const [checkIdCard, setCheckIdCard] = useState<boolean>(true);
  const [checkHouseReg, setCheckHouseReg] = useState<boolean>(true);
  const [checkPhoto, setCheckPhoto] = useState<boolean>(true);
  const [checkResume, setCheckResume] = useState<boolean>(true);
  const [checkEducation, setCheckEducation] = useState<boolean>(false);
  const [checkMedicalCert, setCheckMedicalCert] = useState<boolean>(false);

  // ฟังก์ชั่นลาออก
  const [isResigned, setIsResigned] = useState<boolean>(false);
  const [resignationDate, setResignationDate] = useState<string>('');
  const [resignationReason, setResignationReason] = useState<string>('');
  const [resignationNote, setResignationNote] = useState<string>('');
  const [handedOverTo, setHandedOverTo] = useState<string>('');

  // Initial populate when opening for Edit or New
  useEffect(() => {
    if (employeeToEdit) {
      setEmpId(employeeToEdit.id);
      setFullName(employeeToEdit.fullName);
      setNickname(employeeToEdit.nickname || '');
      setIdCardNumber(employeeToEdit.idCardNumber);
      setBirthDate(employeeToEdit.birthDate);
      setPhoneNumber(employeeToEdit.phoneNumber);
      setAddress(employeeToEdit.address);
      setPosition(employeeToEdit.position);
      if (employeeToEdit.department && (DEPARTMENTS as string[]).includes(employeeToEdit.department)) {
        setDepartment(employeeToEdit.department);
      } else {
        setDepartment(DEPARTMENTS[0]);
      }
      setBranch(BRANCHES[0]);
      setStartDate(employeeToEdit.startDate);
      setEmploymentType(employeeToEdit.employmentType);
      setSalary(employeeToEdit.salary);
      setAllowance(employeeToEdit.allowance || 0);
      setEmergencyName(employeeToEdit.emergencyContact.name);
      setEmergencyRel(employeeToEdit.emergencyContact.relationship);
      setEmergencyPhone(employeeToEdit.emergencyContact.phone);
      setIsForeignWorker(employeeToEdit.isForeignWorker);
      setNationalityText(employeeToEdit.nationalityText || (employeeToEdit.isForeignWorker ? 'ต่างด้าว' : 'ไทย'));

      if (employeeToEdit.foreignDetails) {
        const fd = employeeToEdit.foreignDetails;
        const initialDocType = (fd.identificationType === 'WHITE_CARD' ? 'PINK_CARD' : fd.identificationType) || 'PINK_CARD';
        setForeignDocType(initialDocType);
        setCardColor(fd.cardColor || fd.pinkCardDetails?.cardColor || (fd.identificationType === 'WHITE_CARD' ? 'WHITE' : 'PINK'));
        setIsRenewingWorkPermit(!!(fd.isRenewingWorkPermit || fd.workPermitDetails?.isRenewing || employeeToEdit.isRenewingWorkPermit));

        // บัตรสีชมพู
        if (fd.pinkCardDetails) {
          setPinkId13(fd.pinkCardDetails.idNumber13 || employeeToEdit.idCardNumber || '');
          setPinkThaiName(fd.pinkCardDetails.thaiFullName || employeeToEdit.fullName || '');
          setPinkEngName(fd.pinkCardDetails.englishFullName || fd.englishName || '');
          setPinkBirthDate(fd.pinkCardDetails.birthDate || employeeToEdit.birthDate || '');
          setPinkNationality(fd.pinkCardDetails.nationality || fd.countryOfOrigin || FOREIGN_COUNTRIES[0]);
          setPinkIssueDate(fd.pinkCardDetails.issueDate || '');
          setPinkExpiryDate(fd.pinkCardDetails.expiryDate || '');
          setPinkIssuingOffice(fd.pinkCardDetails.issuingProvinceOrOffice || '');
          setPinkFrontImage(fd.pinkCardDetails.frontCardImage || '');
          setPinkBackImage(fd.pinkCardDetails.backCardImage || '');
        } else {
          setPinkId13(employeeToEdit.idCardNumber || '');
          setPinkThaiName(employeeToEdit.fullName || '');
          setPinkEngName(fd.englishName || '');
          setPinkBirthDate(employeeToEdit.birthDate || '');
          setPinkNationality(fd.countryOfOrigin || FOREIGN_COUNTRIES[0]);
          setPinkIssueDate('');
          setPinkExpiryDate(fd.visaExpiryDate || '');
          setPinkIssuingOffice('');
          setPinkFrontImage('');
          setPinkBackImage('');
        }

        // Passport
        if (fd.passportDetails) {
          setPassNumber(fd.passportDetails.passportNumber || fd.passportNumber || '');
          setPassFullName(fd.passportDetails.fullNameOnPassport || fd.passportFullName || '');
          setPassNationality(fd.passportDetails.nationality || fd.countryOfOrigin || FOREIGN_COUNTRIES[0]);
          setPassBirthDate(fd.passportDetails.birthDate || employeeToEdit.birthDate || '');
          setPassIssueDate(fd.passportDetails.issueDate || fd.passportIssueDate || '');
          setPassExpiryDate(fd.passportDetails.expiryDate || fd.passportExpiryDate || '');
          setPassIssuingCountry(fd.passportDetails.issuingCountry || fd.countryOfOrigin || FOREIGN_COUNTRIES[0]);
          setPassImage(fd.passportDetails.passportImage || '');
          setPassVisaStatus(fd.passportDetails.visaTypeOrStatus || fd.visaType || 'Non-Immigrant L-A');
          setPassStayExpiry(fd.passportDetails.stayPermitExpiryDate || fd.visaExpiryDate || '');
        } else {
          setPassNumber(fd.passportNumber || '');
          setPassFullName(fd.passportFullName || employeeToEdit.fullName || '');
          setPassNationality(fd.countryOfOrigin || FOREIGN_COUNTRIES[0]);
          setPassBirthDate(employeeToEdit.birthDate || '');
          setPassIssueDate(fd.passportIssueDate || '');
          setPassExpiryDate(fd.passportExpiryDate || '');
          setPassIssuingCountry(fd.countryOfOrigin || FOREIGN_COUNTRIES[0]);
          setPassImage('');
          setPassVisaStatus(fd.visaType || 'Non-Immigrant L-A');
          setPassStayExpiry(fd.visaExpiryDate || '');
        }

        // Other Doc
        if (fd.otherDocDetails) {
          setOtherDocName(fd.otherDocDetails.documentName || '');
          setOtherDocNumber(fd.otherDocDetails.documentNumber || '');
          setOtherDocIssueDate(fd.otherDocDetails.issueDate || '');
          setOtherDocExpiryDate(fd.otherDocDetails.expiryDate || '');
          setOtherDocImage(fd.otherDocDetails.documentImage || '');
          setOtherDocAuthority(fd.otherDocDetails.issuingAuthority || '');
        } else {
          setOtherDocName('');
          setOtherDocNumber('');
          setOtherDocIssueDate('');
          setOtherDocExpiryDate('');
          setOtherDocImage('');
          setOtherDocAuthority('');
        }

        // Work Permit
        if (fd.workPermitDetails) {
          setHasWorkPermit(fd.workPermitDetails.hasWorkPermit);
          setWorkPermitNumber(fd.workPermitDetails.workPermitNumber || fd.workPermitNumber || '');
          setWorkPermitPosition(fd.workPermitDetails.position || fd.workPermitPosition || '');
          setWorkPermitJobDescription(fd.workPermitDetails.jobDescription || fd.workPermitJobDescription || '');
          setWorkPermitWorkplace(fd.workPermitDetails.workplace || fd.workPermitWorkplace || '');
          setWorkPermitEffectiveDate(fd.workPermitDetails.effectiveDate || fd.workPermitIssueDate || '');
          setWorkPermitExpiryDate(fd.workPermitDetails.expiryDate || fd.workPermitExpiryDate || '');
          setWorkPermitImage(fd.workPermitDetails.workPermitImage || '');
        } else {
          setHasWorkPermit(!!fd.workPermitNumber);
          setWorkPermitNumber(fd.workPermitNumber || '');
          setWorkPermitPosition(fd.workPermitPosition || '');
          setWorkPermitJobDescription(fd.workPermitJobDescription || '');
          setWorkPermitWorkplace(fd.workPermitWorkplace || '');
          setWorkPermitEffectiveDate(fd.workPermitIssueDate || '');
          setWorkPermitExpiryDate(fd.workPermitExpiryDate || '');
          setWorkPermitImage('');
        }
      }

      setIsResigned(employeeToEdit.resignation?.isResigned || false);
      setResignationDate(employeeToEdit.resignation?.resignationDate || '');
      setResignationReason(employeeToEdit.resignation?.reason || '');
      setResignationNote(employeeToEdit.resignation?.note || '');
      setHandedOverTo(employeeToEdit.resignation?.handedOverTo || '');

      // Checklist
      const chk = employeeToEdit.documentChecklist;
      setCheckIdCard(chk?.idCardCopy ?? true);
      setCheckHouseReg(chk?.houseRegistrationCopy ?? true);
      setCheckPhoto(chk?.photo ?? true);
      setCheckResume(chk?.resume ?? true);
      setCheckEducation(chk?.educationHistory ?? false);
      setCheckMedicalCert(chk?.medicalCertificate ?? false);
    } else {
      // New employee default
      const nextId = `EMP-${String(existingCount + 1).padStart(3, '0')}`;
      setEmpId(nextId);
      setFullName('');
      setNickname('');
      setIdCardNumber('');
      setBirthDate('1998-01-01');
      setPhoneNumber('');
      setAddress('');
      setPosition('');
      setDepartment(DEPARTMENTS[0]);
      setBranch(BRANCHES[0]);
      setStartDate(new Date().toISOString().split('T')[0]);
      setEmploymentType('FULL_TIME');
      setSalary(18000);
      setAllowance(0);
      setEmergencyName('');
      setEmergencyRel('');
      setEmergencyPhone('');
      setIsForeignWorker(false);
      setNationalityText('ไทย');

      // Reset foreign fields
      setForeignDocType('PINK_CARD');
      setPinkId13('');
      setPinkThaiName('');
      setPinkEngName('');
      setPinkBirthDate('1998-01-01');
      setPinkNationality(FOREIGN_COUNTRIES[0]);
      setPinkIssueDate('');
      setPinkExpiryDate('');
      setPinkIssuingOffice('');
      setPinkFrontImage('');
      setPinkBackImage('');

      setPassNumber('');
      setPassFullName('');
      setPassNationality(FOREIGN_COUNTRIES[0]);
      setPassBirthDate('1998-01-01');
      setPassIssueDate('');
      setPassExpiryDate('');
      setPassIssuingCountry(FOREIGN_COUNTRIES[0]);
      setPassImage('');
      setPassVisaStatus('Non-Immigrant L-A (MOU)');
      setPassStayExpiry('');

      setOtherDocName('');
      setOtherDocNumber('');
      setOtherDocIssueDate('');
      setOtherDocExpiryDate('');
      setOtherDocImage('');
      setOtherDocAuthority('');

      setHasWorkPermit(true);
      setWorkPermitNumber('');
      setWorkPermitPosition('');
      setWorkPermitJobDescription('');
      setWorkPermitWorkplace('บริษัท เอเชีย เมนูแฟคเจอร์ริ่ง จำกัด');
      setWorkPermitEffectiveDate('');
      setWorkPermitExpiryDate('');
      setWorkPermitImage('');

      setIsResigned(false);
      setResignationDate('');
      setResignationReason('');
      setResignationNote('');
      setHandedOverTo('');
    }
  }, [employeeToEdit, existingCount, isOpen]);

  // Handle Photo Upload / Camera Capture to Data URL
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (dataUrl: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (loadEvt.target?.result) {
          setter(loadEvt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      showErrorAlert('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกชื่อ-นามสกุลพนักงาน');
      return;
    }

    // Determine Identification Details
    let identificationType: IdentificationType = 'THAI_ID';
    let identificationNumber = idCardNumber;
    let identificationIssueDate = '';
    let identificationExpiryDate = '';
    let resolvedNationality = nationalityText;

    let foreignDetails: ForeignWorkerDetails | undefined = undefined;

    if (isForeignWorker) {
      if (foreignDocType === 'PINK_CARD') {
        identificationType = cardColor === 'WHITE' ? 'WHITE_CARD' : 'PINK_CARD';
        identificationNumber = pinkId13 || idCardNumber;
        identificationIssueDate = pinkIssueDate;
        identificationExpiryDate = pinkExpiryDate;
        resolvedNationality = pinkNationality;
      } else if (foreignDocType === 'PASSPORT') {
        identificationType = 'PASSPORT';
        identificationNumber = passNumber;
        identificationIssueDate = passIssueDate;
        identificationExpiryDate = passExpiryDate;
        resolvedNationality = passNationality;
      } else if (foreignDocType === 'OTHER') {
        identificationType = 'OTHER';
        identificationNumber = otherDocNumber;
        identificationIssueDate = otherDocIssueDate;
        identificationExpiryDate = otherDocExpiryDate;
      } else {
        identificationType = 'NONE';
      }

      // Build attached documents list from photos
      const workerDocs: WorkerDocument[] = [];

      if (pinkFrontImage) {
        workerDocs.push({
          id: 'doc-pink-front',
          type: 'PINK_CARD',
          title: 'บัตรประจำตัวคนซึ่งไม่มีสัญชาติไทย (ด้านหน้า)',
          fileName: 'pink_card_front.jpg',
          fileSize: '1.5 MB',
          uploadDate: new Date().toISOString().split('T')[0],
          isUploaded: true,
          fileUrl: pinkFrontImage,
          expiryDate: pinkExpiryDate,
        });
      }

      if (pinkBackImage) {
        workerDocs.push({
          id: 'doc-pink-back',
          type: 'PINK_CARD',
          title: 'บัตรประจำตัวคนซึ่งไม่มีสัญชาติไทย (ด้านหลัง)',
          fileName: 'pink_card_back.jpg',
          fileSize: '1.5 MB',
          uploadDate: new Date().toISOString().split('T')[0],
          isUploaded: true,
          fileUrl: pinkBackImage,
        });
      }

      if (passImage) {
        workerDocs.push({
          id: 'doc-pass-main',
          type: 'PASSPORT',
          title: 'หนังสือเดินทาง (Passport หน้าแรก)',
          fileName: 'passport_main.jpg',
          fileSize: '2.1 MB',
          uploadDate: new Date().toISOString().split('T')[0],
          isUploaded: true,
          fileUrl: passImage,
          expiryDate: passExpiryDate,
        });
      }

      if (otherDocImage) {
        workerDocs.push({
          id: 'doc-other-main',
          type: 'OTHER',
          title: otherDocName || 'เอกสารประจำตัวประเภทอื่น',
          fileName: 'other_doc.jpg',
          fileSize: '1.8 MB',
          uploadDate: new Date().toISOString().split('T')[0],
          isUploaded: true,
          fileUrl: otherDocImage,
          expiryDate: otherDocExpiryDate,
        });
      }

      if (workPermitImage) {
        workerDocs.push({
          id: 'doc-wp-main',
          type: 'WORK_PERMIT',
          title: 'ใบอนุญาตทำงาน (Work Permit Card)',
          fileName: 'work_permit_card.jpg',
          fileSize: '2.0 MB',
          uploadDate: new Date().toISOString().split('T')[0],
          isUploaded: true,
          fileUrl: workPermitImage,
          expiryDate: workPermitExpiryDate,
        });
      }

      // Preserve existing documents if editing
      if (employeeToEdit?.foreignDetails?.documents) {
        employeeToEdit.foreignDetails.documents.forEach(d => {
          if (!workerDocs.some(wd => wd.id === d.id)) {
            workerDocs.push(d);
          }
        });
      }

      const pinkCardDetails: PinkCardDetails | undefined = foreignDocType === 'PINK_CARD' ? {
        idNumber13: pinkId13,
        cardColor,
        cardTypeName: cardColor === 'WHITE' ? 'บัตรสีขาว (บุคคลไม่มีสถานะทางทะเบียน / บัตร 10 ปี)' : 'บัตรสีชมพู (คนซึ่งไม่มีสัญชาติไทย)',
        thaiFullName: pinkThaiName || fullName,
        englishFullName: pinkEngName,
        birthDate: pinkBirthDate || birthDate,
        nationality: pinkNationality,
        issueDate: pinkIssueDate,
        expiryDate: pinkExpiryDate,
        issuingProvinceOrOffice: pinkIssuingOffice,
        frontCardImage: pinkFrontImage,
        backCardImage: pinkBackImage,
      } : undefined;

      const passportDetails: PassportDetails | undefined = foreignDocType === 'PASSPORT' ? {
        passportNumber: passNumber,
        fullNameOnPassport: passFullName || fullName,
        nationality: passNationality,
        birthDate: passBirthDate || birthDate,
        issueDate: passIssueDate,
        expiryDate: passExpiryDate,
        issuingCountry: passIssuingCountry,
        passportImage: passImage,
        visaTypeOrStatus: passVisaStatus,
        stayPermitExpiryDate: passStayExpiry,
      } : undefined;

      const otherDocDetails: OtherDocumentDetails | undefined = foreignDocType === 'OTHER' ? {
        documentName: otherDocName,
        documentNumber: otherDocNumber,
        issueDate: otherDocIssueDate,
        expiryDate: otherDocExpiryDate,
        documentImage: otherDocImage,
        issuingAuthority: otherDocAuthority,
      } : undefined;

      const workPermitDetails: WorkPermitDetails = {
        hasWorkPermit,
        workPermitNumber: hasWorkPermit ? workPermitNumber : '',
        position: hasWorkPermit ? workPermitPosition : '',
        jobDescription: hasWorkPermit ? workPermitJobDescription : '',
        workplace: hasWorkPermit ? workPermitWorkplace : '',
        effectiveDate: hasWorkPermit ? workPermitEffectiveDate : '',
        expiryDate: hasWorkPermit ? workPermitExpiryDate : '',
        workPermitImage: hasWorkPermit ? workPermitImage : undefined,
        isRenewing: isRenewingWorkPermit,
      };

      foreignDetails = {
        identificationType: foreignDocType,
        cardColor,
        isRenewingWorkPermit,
        pinkCardDetails,
        passportDetails,
        otherDocDetails,
        workPermitDetails,
        passportFullName: passFullName || pinkEngName || fullName,
        englishName: pinkEngName || passFullName || '',
        countryOfOrigin: resolvedNationality,
        passportNumber: passNumber || pinkId13 || otherDocNumber,
        passportIssueDate: passIssueDate || pinkIssueDate || otherDocIssueDate,
        passportExpiryDate: passExpiryDate || pinkExpiryDate || otherDocExpiryDate,
        visaType: passVisaStatus || (foreignDocType === 'PINK_CARD' ? (cardColor === 'WHITE' ? 'บัตรขาว (บุคคลไม่มีสถานะ)' : 'บัตรชมพู (มติ ครม.)') : 'เอกสารรับรอง'),
        visaNumber: passNumber || pinkId13 || otherDocNumber,
        visaExpiryDate: passStayExpiry || pinkExpiryDate || otherDocExpiryDate,
        stayAddressInThailand: address,
        workPermitNumber: hasWorkPermit ? workPermitNumber : '',
        workPermitIssueDate: hasWorkPermit ? workPermitEffectiveDate : '',
        workPermitExpiryDate: hasWorkPermit ? workPermitExpiryDate : '',
        workPermitPosition: hasWorkPermit ? workPermitPosition : position,
        workPermitJobDescription: hasWorkPermit ? workPermitJobDescription : '',
        workPermitWorkplace: hasWorkPermit ? workPermitWorkplace : branch,
        documents: workerDocs,
      };
    }

    const payload: Employee = {
      id: empId,
      fullName: fullName.trim(),
      nickname: nickname.trim(),
      idCardNumber: identificationNumber || idCardNumber,
      birthDate,
      phoneNumber,
      address,
      position,
      department,
      branch,
      startDate,
      employmentType,
      salary: Number(salary) || 0,
      allowance: Number(allowance) || 0,
      emergencyContact: {
        name: emergencyName,
        relationship: emergencyRel,
        phone: emergencyPhone,
      },
      isForeignWorker,
      nationalityText: resolvedNationality,
      identificationType,
      identificationNumber,
      identificationIssueDate,
      identificationExpiryDate,
      workPermitNumber: hasWorkPermit ? workPermitNumber : undefined,
      workPermitIssueDate: hasWorkPermit ? workPermitEffectiveDate : undefined,
      workPermitExpiryDate: hasWorkPermit ? workPermitExpiryDate : undefined,
      isRenewingWorkPermit: isForeignWorker ? isRenewingWorkPermit : false,
      foreignDetails,
      documentChecklist: {
        idCardCopy: checkIdCard,
        houseRegistrationCopy: checkHouseReg,
        photo: checkPhoto,
        resume: checkResume,
        educationHistory: checkEducation,
        medicalCertificate: checkMedicalCert,
        workPermitCopy: hasWorkPermit && isForeignWorker,
        passportCopy: isForeignWorker && foreignDocType === 'PASSPORT',
        visaCopy: isForeignWorker,
        pinkOrWhiteCardCopy: isForeignWorker && foreignDocType === 'PINK_CARD',
        cardColor: cardColor,
        isRenewingWorkPermit: isRenewingWorkPermit,
      },
      resignation: {
        isResigned,
        resignationDate: isResigned ? resignationDate : undefined,
        reason: isResigned ? resignationReason : undefined,
        note: isResigned ? resignationNote : undefined,
        handedOverTo: isResigned ? handedOverTo : undefined,
      },
      documents: employeeToEdit?.documents || [],
      attendanceHistory: employeeToEdit?.attendanceHistory || [
        { month: new Date().getMonth() + 1, year: new Date().getFullYear(), absentDays: 0, sickLeaveDays: 0, businessLeaveDays: 0, annualLeaveDays: 0, otherLeaveDays: 0, lateCount: 0, lateMinutes: 0, otHours: 0, warningCount: 0 }
      ],
      warnings: employeeToEdit?.warnings || [],
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {employeeToEdit ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}
              </h2>
              <p className="text-xs text-slate-400">
                {isForeignWorker ? 'พนักงานแรงงานต่างด้าว (ฟังก์ชันที่ 2 เปิดใช้งาน)' : 'พนักงานสัญชาติไทย (ข้อมูลทั่วไป)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Nationality Selection Banner */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-800 mb-2">
              พนักงานเป็นแรงงานต่างด้าวหรือไม่?
            </label>
            <div className="flex items-center gap-4">
              <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition ${
                !isForeignWorker 
                  ? 'bg-blue-50 border-blue-400 text-blue-800 font-semibold shadow-2xs' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}>
                <input
                  type="radio"
                  name="workerType"
                  checked={!isForeignWorker}
                  onChange={() => {
                    setIsForeignWorker(false);
                    setNationalityText('ไทย');
                  }}
                  className="w-4 h-4 text-blue-600"
                />
                <span>ไม่ใช่ (พนักงานสัญชาติไทย)</span>
              </label>

              <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition ${
                isForeignWorker 
                  ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold shadow-2xs' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}>
                <input
                  type="radio"
                  name="workerType"
                  checked={isForeignWorker}
                  onChange={() => {
                    setIsForeignWorker(true);
                    if (nationalityText === 'ไทย') {
                      setNationalityText(FOREIGN_COUNTRIES[0]);
                    }
                  }}
                  className="w-4 h-4 text-amber-600"
                />
                <Globe2 className="w-4 h-4 text-amber-600" />
                <span>ใช่ (แรงงานต่างด้าว → เปิดฟังก์ชันที่ 2)</span>
              </label>
            </div>
          </div>

          {/* ===================== ส่วนที่ 1 — ข้อมูลพนักงานทั่วไป ===================== */}
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">1</span>
                <span>ส่วนที่ 1 — ข้อมูลพนักงานทั่วไป (ใช้กับทุกคน)</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono font-bold">รหัส: {empId}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสพนักงาน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  placeholder="เช่น EMP-001"
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="เช่น นายสมชาย วัฒนพาณิชย์"
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อเล่น
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="เช่น ชาย, แอน"
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {!isForeignWorker && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เลขบัตรประชาชน 13 หลัก <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={13}
                    value={idCardNumber}
                    onChange={(e) => setIdCardNumber(e.target.value)}
                    placeholder="เลขประจำตัว 13 หลัก"
                    className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 font-mono"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    วันเกิด
                  </label>
                  {birthDate && (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                      อายุ {(() => {
                        const parts = birthDate.split('-');
                        if (parts.length < 3) return '-';
                        let y = parseInt(parts[0], 10);
                        if (y > 2400) y -= 543;
                        const now = new Date();
                        let a = now.getFullYear() - y;
                        if (now.getMonth() < (parseInt(parts[1], 10) - 1) || (now.getMonth() === (parseInt(parts[1], 10) - 1) && now.getDate() < parseInt(parts[2], 10))) a--;
                        return a >= 0 ? `${a} ปี` : '-';
                      })()}
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ติดต่อ
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="08x-xxx-xxxx"
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  แผนก <span className="text-red-500">*</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as Department)}
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สาขา / สถานที่ปฏิบัติงานหลัก
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 font-medium text-slate-800"
                >
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">ประจำสถานที่: สำนักงานใหญ่ (เชียงใหม่)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ตำแหน่งงาน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="เช่น กุ๊ก / เชฟ, พนักงานบริการหน้าร้าน, บัญชีร้าน"
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันที่เริ่มงาน
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ประเภทการจ้าง
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30"
                >
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {employmentType === 'PART_TIME' ? 'ฐานค่าจ้าง / เงินเดือนฐาน (บาท)' : 'เงินเดือนพื้นฐาน (บาท)'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={salary}
                  onChange={(e) => setSalary(Number(e.target.value))}
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 font-mono"
                />
                {employmentType === 'PART_TIME' && (
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                    พนักงาน Part-time: ระบบคำนวณชั่วโมงและ OT อัตโนมัติใน "ตาราง Part-time" พร้อมส่งออก Excel ได้ทันที
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ค่าตำแหน่ง / เบี้ยเลี้ยง (บาท)
                </label>
                <input
                  type="number"
                  min={0}
                  value={allowance}
                  onChange={(e) => setAllowance(Number(e.target.value))}
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ที่อยู่ปัจจุบันในประเทศไทย
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="บ้านเลขที่ ซอย ถนน ตำบล อำเภอ จังหวัด"
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            {/* ข้อมูลติดต่อฉุกเฉิน */}
            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
              <h4 className="text-xs font-bold text-slate-700 mb-2">บุคคลติดต่อฉุกเฉิน</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="ชื่อ-นามสกุล ผู้ติดต่อ"
                  className="text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  value={emergencyRel}
                  onChange={(e) => setEmergencyRel(e.target.value)}
                  placeholder="ความสัมพันธ์ (เช่น ภรรยา, พี่สาว)"
                  className="text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="เบอร์โทรศัพท์ฉุกเฉิน"
                  className="text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* ===================== ฟังก์ชันที่ 2: ข้อมูลแรงงานต่างด้าว ===================== */}
          {isForeignWorker && (
            <div className="space-y-6 pt-4 border-t-2 border-amber-200 animate-in fade-in duration-200">
              
              <div className="border-b border-amber-200 pb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                    <span>ฟังก์ชันที่ 2 — ข้อมูลแรงงานต่างด้าว (Foreign Worker Details)</span>
                  </h3>
                  <p className="text-xs text-amber-800">
                    ให้เลือกก่อนว่าพนักงานใช้เอกสารอะไรเป็นหลัก แล้วระบบจะแสดงช่องข้อมูลเฉพาะตามประเภทที่เลือก
                  </p>
                </div>
              </div>

              {/* Step A: Selector of Identification Type */}
              <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-300">
                <label className="block text-xs font-bold text-amber-950 mb-2.5">
                  ประเภทเอกสารประจำตัวหลัก (Primary Identification Document) <span className="text-red-500">*</span>
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  
                  {/* Option 1: บัตรสีชมพู */}
                  <label className={`flex flex-col p-3 rounded-xl border-2 cursor-pointer transition ${
                    foreignDocType === 'PINK_CARD'
                      ? 'bg-white border-pink-500 shadow-xs ring-2 ring-pink-400/20'
                      : 'bg-amber-50/50 border-amber-200 hover:bg-white text-slate-700'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <CreditCard className="w-4 h-4 text-pink-600" />
                      <input
                        type="radio"
                        name="foreignDocType"
                        checked={foreignDocType === 'PINK_CARD'}
                        onChange={() => setForeignDocType('PINK_CARD')}
                        className="text-pink-600"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-900">บัตรสีชมพู</span>
                    <span className="text-[11px] text-slate-500">คนซึ่งไม่มีสัญชาติไทย</span>
                  </label>

                  {/* Option 2: Passport */}
                  <label className={`flex flex-col p-3 rounded-xl border-2 cursor-pointer transition ${
                    foreignDocType === 'PASSPORT'
                      ? 'bg-white border-blue-600 shadow-xs ring-2 ring-blue-400/20'
                      : 'bg-amber-50/50 border-amber-200 hover:bg-white text-slate-700'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <input
                        type="radio"
                        name="foreignDocType"
                        checked={foreignDocType === 'PASSPORT'}
                        onChange={() => setForeignDocType('PASSPORT')}
                        className="text-blue-600"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-900">Passport</span>
                    <span className="text-[11px] text-slate-500">หนังสือเดินทางสากล</span>
                  </label>

                  {/* Option 3: เอกสารประจำตัวประเภทอื่น */}
                  <label className={`flex flex-col p-3 rounded-xl border-2 cursor-pointer transition ${
                    foreignDocType === 'OTHER'
                      ? 'bg-white border-purple-600 shadow-xs ring-2 ring-purple-400/20'
                      : 'bg-amber-50/50 border-amber-200 hover:bg-white text-slate-700'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <input
                        type="radio"
                        name="foreignDocType"
                        checked={foreignDocType === 'OTHER'}
                        onChange={() => setForeignDocType('OTHER')}
                        className="text-purple-600"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-900">เอกสารประเภทอื่น</span>
                    <span className="text-[11px] text-slate-500">บัตรผ่านแดน / ใบรับรอง</span>
                  </label>

                  {/* Option 4: ไม่มีเอกสารข้างต้น */}
                  <label className={`flex flex-col p-3 rounded-xl border-2 cursor-pointer transition ${
                    foreignDocType === 'NONE'
                      ? 'bg-white border-slate-600 shadow-xs ring-2 ring-slate-400/20'
                      : 'bg-amber-50/50 border-amber-200 hover:bg-white text-slate-700'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <AlertCircle className="w-4 h-4 text-slate-500" />
                      <input
                        type="radio"
                        name="foreignDocType"
                        checked={foreignDocType === 'NONE'}
                        onChange={() => setForeignDocType('NONE')}
                        className="text-slate-600"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-900">ไม่มีเอกสารข้างต้น</span>
                    <span className="text-[11px] text-slate-500">รอดำเนินการจัดทำ</span>
                  </label>

                </div>
              </div>

              {/* Step B: Form Fields based on Selected Doc Type */}

              {/* ===== กรณี “บัตรสีชมพู / บัตรสีขาว” ===== */}
              {foreignDocType === 'PINK_CARD' && (
                <div className={`p-4 rounded-xl border space-y-4 transition ${cardColor === 'WHITE' ? 'bg-slate-50 border-slate-300' : 'bg-pink-50/50 border-pink-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-pink-200 pb-2 gap-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className={`w-4 h-4 ${cardColor === 'WHITE' ? 'text-slate-600' : 'text-pink-600'}`} />
                      <span>ข้อมูลบัตรประจำตัว ({cardColor === 'WHITE' ? 'บัตรสีขาว' : 'บัตรสีชมพู'})</span>
                    </h4>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCardColor('PINK')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                          cardColor === 'PINK'
                            ? 'bg-pink-600 text-white border-pink-600 shadow-2xs'
                            : 'bg-white text-pink-700 border-pink-200 hover:bg-pink-50'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-pink-300 shrink-0 border border-pink-400" />
                        <span>บัตรสีชมพู</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardColor('WHITE')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                          cardColor === 'WHITE'
                            ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-200 shrink-0 border border-slate-400" />
                        <span>บัตรสีขาว (10 ปี/ไร้สถานะ)</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        เลขประจำตัว 13 หลัก <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={13}
                        required
                        value={pinkId13}
                        onChange={(e) => setPinkId13(e.target.value)}
                        placeholder="เลข 13 หลักขึ้นต้นด้วย 00 หรือ 0"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-pink-500/30"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        ชื่อ–นามสกุลภาษาไทย <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={pinkThaiName}
                        onChange={(e) => setPinkThaiName(e.target.value)}
                        placeholder="ชื่อ-สกุลภาษาไทยตามหน้าบัตร"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-pink-500/30"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        ชื่อ–นามสกุลภาษาอังกฤษ (ถ้ามี)
                      </label>
                      <input
                        type="text"
                        value={pinkEngName}
                        onChange={(e) => setPinkEngName(e.target.value)}
                        placeholder="English Name (if any)"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-pink-500/30"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">วันเกิด</label>
                      <input
                        type="date"
                        value={pinkBirthDate}
                        onChange={(e) => setPinkBirthDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-pink-500/30"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">สัญชาติ</label>
                      <select
                        value={pinkNationality}
                        onChange={(e) => setPinkNationality(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-pink-500/30"
                      >
                        {FOREIGN_COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">วันออกบัตร</label>
                      <input
                        type="date"
                        value={pinkIssueDate}
                        onChange={(e) => setPinkIssueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-pink-500/30"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-slate-700">
                          วันหมดอายุบัตร <span className="text-red-500">*</span>
                        </label>
                        {pinkExpiryDate && (() => {
                          const stat = getExpiryStatus(pinkExpiryDate);
                          return (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${stat.badgeClass}`}>
                              {stat.label}
                            </span>
                          );
                        })()}
                      </div>
                      <input
                        type="date"
                        required
                        value={pinkExpiryDate}
                        onChange={(e) => setPinkExpiryDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-pink-500/30 font-semibold text-pink-700"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        จังหวัด / หน่วยงานที่ออกบัตร (ถ้ามี)
                      </label>
                      <input
                        type="text"
                        value={pinkIssuingOffice}
                        onChange={(e) => setPinkIssuingOffice(e.target.value)}
                        placeholder="เช่น สำนักทะเบียนอำเภอเมืองสมุทรปราการ"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-pink-500/30"
                      />
                    </div>
                  </div>

                  {/* Photo Upload: ด้านหน้า & ด้านหลัง with Camera button */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-pink-200">
                    
                    {/* รูปบัตรด้านหน้า */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        รูปบัตรด้านหน้า
                      </label>
                      
                      {pinkFrontImage ? (
                        <div className="relative mb-2 rounded-lg overflow-hidden border border-slate-200 h-28 bg-slate-100 flex items-center justify-center">
                          <img src={pinkFrontImage} alt="บัตรด้านหน้า" className="object-cover w-full h-full" />
                          <button
                            type="button"
                            onClick={() => setPinkFrontImage('')}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-3 text-center mb-2 bg-slate-50/50">
                          <CreditCard className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                          <p className="text-[11px] text-slate-500">ยังไม่มีรูปถ่ายบัตรด้านหน้า</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {/* Camera capture button for mobile */}
                        <label className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer transition">
                          <Camera className="w-3.5 h-3.5 text-blue-600" />
                          <span>ถ่ายรูป</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handleImageFileChange(e, setPinkFrontImage)}
                          />
                        </label>
                        
                        {/* Upload file button */}
                        <label className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 cursor-pointer transition">
                          <Upload className="w-3.5 h-3.5 text-slate-600" />
                          <span>เลือกไฟล์</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageFileChange(e, setPinkFrontImage)}
                          />
                        </label>
                      </div>
                    </div>

                    {/* รูปบัตรด้านหลัง */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        รูปบัตรด้านหลัง
                      </label>

                      {pinkBackImage ? (
                        <div className="relative mb-2 rounded-lg overflow-hidden border border-slate-200 h-28 bg-slate-100 flex items-center justify-center">
                          <img src={pinkBackImage} alt="บัตรด้านหลัง" className="object-cover w-full h-full" />
                          <button
                            type="button"
                            onClick={() => setPinkBackImage('')}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-3 text-center mb-2 bg-slate-50/50">
                          <CreditCard className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                          <p className="text-[11px] text-slate-500">ยังไม่มีรูปถ่ายบัตรด้านหลัง</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <label className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer transition">
                          <Camera className="w-3.5 h-3.5 text-blue-600" />
                          <span>ถ่ายรูป</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handleImageFileChange(e, setPinkBackImage)}
                          />
                        </label>
                        
                        <label className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 cursor-pointer transition">
                          <Upload className="w-3.5 h-3.5 text-slate-600" />
                          <span>เลือกไฟล์</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageFileChange(e, setPinkBackImage)}
                          />
                        </label>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* ===== กรณี “Passport” ===== */}
              {foreignDocType === 'PASSPORT' && (
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                    <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>ข้อมูลหนังสือเดินทาง (Passport) & วีซ่า</span>
                    </h4>
                    <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                      Passport
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        เลข Passport <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={passNumber}
                        onChange={(e) => setPassNumber(e.target.value)}
                        placeholder="เช่น MD891234, P0982314"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        ชื่อ–นามสกุลตาม Passport <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={passFullName}
                        onChange={(e) => setPassFullName(e.target.value)}
                        placeholder="Full name as in passport"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">สัญชาติ</label>
                      <select
                        value={passNationality}
                        onChange={(e) => setPassNationality(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30"
                      >
                        {FOREIGN_COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">วันเกิด</label>
                      <input
                        type="date"
                        value={passBirthDate}
                        onChange={(e) => setPassBirthDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">วันที่ออก Passport</label>
                      <input
                        type="date"
                        value={passIssueDate}
                        onChange={(e) => setPassIssueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-slate-700">
                          วันหมดอายุ Passport <span className="text-red-500">*</span>
                        </label>
                        {passExpiryDate && (() => {
                          const stat = getExpiryStatus(passExpiryDate);
                          return (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${stat.badgeClass}`}>
                              {stat.label}
                            </span>
                          );
                        })()}
                      </div>
                      <input
                        type="date"
                        required
                        value={passExpiryDate}
                        onChange={(e) => setPassExpiryDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 font-semibold text-blue-700"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ประเทศผู้ออก</label>
                      <select
                        value={passIssuingCountry}
                        onChange={(e) => setPassIssuingCountry(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30"
                      >
                        {FOREIGN_COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Visa / สถานะการพำนัก</label>
                      <input
                        type="text"
                        value={passVisaStatus}
                        onChange={(e) => setPassVisaStatus(e.target.value)}
                        placeholder="เช่น Non-Immigrant L-A (MOU)"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-slate-700">
                          วันหมดอายุสิทธิการพำนัก (Visa Expiry)
                        </label>
                        {passStayExpiry && (() => {
                          const stat = getExpiryStatus(passStayExpiry);
                          return (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${stat.badgeClass}`}>
                              {stat.label}
                            </span>
                          );
                        })()}
                      </div>
                      <input
                        type="date"
                        value={passStayExpiry}
                        onChange={(e) => setPassStayExpiry(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>
                  </div>

                  {/* Passport photo upload / camera capture */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      รูปถ่ายหน้าหนังสือเดินทาง (Passport Photo)
                    </label>

                    {passImage ? (
                      <div className="relative mb-2 rounded-lg overflow-hidden border border-slate-200 h-32 bg-slate-100 flex items-center justify-center">
                        <img src={passImage} alt="Passport" className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => setPassImage('')}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-3 text-center mb-2 bg-slate-50/50">
                        <FileText className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <p className="text-[11px] text-slate-500">ยังไม่มีรูปถ่ายหน้า Passport</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 max-w-xs">
                      <label className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer transition">
                        <Camera className="w-3.5 h-3.5 text-blue-600" />
                        <span>ถ่ายรูปด้วยกล้อง</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => handleImageFileChange(e, setPassImage)}
                        />
                      </label>
                      
                      <label className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 cursor-pointer transition">
                        <Upload className="w-3.5 h-3.5 text-slate-600" />
                        <span>เลือกไฟล์</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageFileChange(e, setPassImage)}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== กรณี “บัตร/เอกสารประจำตัวประเภทอื่น” ===== */}
              {foreignDocType === 'OTHER' && (
                <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                    <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>ข้อมูลเอกสารประจำตัวประเภทอื่น (ตามชื่อที่ระบุบนบัตร)</span>
                    </h4>
                    <span className="text-[11px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-semibold">
                      เอกสารอื่น ๆ
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        ชื่อเอกสาร / ประเภทบัตร <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={otherDocName}
                        onChange={(e) => setOtherDocName(e.target.value)}
                        placeholder="เช่น บัตรผ่านแดน (Border Pass), หนังสือรับรองสถานะบุคคล ทร.38/1"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/30"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        เลขที่เอกสาร <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={otherDocNumber}
                        onChange={(e) => setOtherDocNumber(e.target.value)}
                        placeholder="เลขที่เอกสารประจำตัว"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-purple-500/30"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">วันที่ออก</label>
                      <input
                        type="date"
                        value={otherDocIssueDate}
                        onChange={(e) => setOtherDocIssueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/30"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        วันหมดอายุ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={otherDocExpiryDate}
                        onChange={(e) => setOtherDocExpiryDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/30 font-semibold text-purple-700"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        หน่วยงานที่ออกเอกสาร
                      </label>
                      <input
                        type="text"
                        value={otherDocAuthority}
                        onChange={(e) => setOtherDocAuthority(e.target.value)}
                        placeholder="เช่น ด่านตรวจคนเข้าเมือง หรือ ที่ว่าการอำเภอ"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/30"
                      />
                    </div>
                  </div>

                  {/* Other Doc Photo upload */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      รูปถ่ายเอกสารประจำตัว
                    </label>

                    {otherDocImage ? (
                      <div className="relative mb-2 rounded-lg overflow-hidden border border-slate-200 h-32 bg-slate-100 flex items-center justify-center">
                        <img src={otherDocImage} alt="Document" className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => setOtherDocImage('')}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-3 text-center mb-2 bg-slate-50/50">
                        <ShieldCheck className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <p className="text-[11px] text-slate-500">ยังไม่มีรูปถ่ายเอกสาร</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 max-w-xs">
                      <label className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer transition">
                        <Camera className="w-3.5 h-3.5 text-blue-600" />
                        <span>ถ่ายรูปด้วยกล้อง</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => handleImageFileChange(e, setOtherDocImage)}
                        />
                      </label>
                      <label className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 cursor-pointer transition">
                        <Upload className="w-3.5 h-3.5 text-slate-600" />
                        <span>เลือกไฟล์</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageFileChange(e, setOtherDocImage)}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== กรณี “ไม่มีเอกสารประเภทข้างต้น” ===== */}
              {foreignDocType === 'NONE' && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-300 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-950">สถานะ: รอดำเนินการจัดทำเอกสารประจำตัว</h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      พนักงานไม่มีเอกสารบัตรสีชมพู, Passport หรือเอกสารทางการในขณะนี้ ระบบจะกำหนดสถานะเป็น "เอกสารอยู่ระหว่างยื่นดำเนินการ" และส่งการแจ้งเตือนไปยังฝ่ายบุคคลเพื่อติดตามความคืบหน้า
                    </p>
                  </div>
                </div>
              )}

              {/* Step C: ข้อมูลใบอนุญาตทำงาน (Work Permit) สำหรับแรงงานต่างด้าวทุกคน */}
              <div className="bg-white p-4 rounded-xl border border-amber-300 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-amber-700" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      ข้อมูลใบอนุญาตทำงาน (Work Permit)
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasWorkPermit}
                        onChange={(e) => setHasWorkPermit(e.target.checked)}
                        className="w-4 h-4 text-amber-600 rounded"
                      />
                      <span>มีใบอนุญาตทำงาน (Work Permit)</span>
                    </label>

                    {hasWorkPermit && (
                      <label className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer transition ${
                        isRenewingWorkPermit 
                          ? 'bg-amber-100 text-amber-900 border-amber-300' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50'
                      }`}>
                        <input
                          type="checkbox"
                          checked={isRenewingWorkPermit}
                          onChange={(e) => setIsRenewingWorkPermit(e.target.checked)}
                          className="w-3.5 h-3.5 text-amber-600 rounded"
                        />
                        <span>กำลังต่อใบอนุญาต</span>
                      </label>
                    )}
                  </div>
                </div>

                {hasWorkPermit ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          เลขที่ Work Permit <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={workPermitNumber}
                          onChange={(e) => setWorkPermitNumber(e.target.value)}
                          placeholder="เช่น WP-1102938475"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-amber-500/30"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">ตำแหน่งงานตามใบอนุญาต</label>
                        <input
                          type="text"
                          value={workPermitPosition}
                          onChange={(e) => setWorkPermitPosition(e.target.value)}
                          placeholder="เช่น กรรมกร, ช่างเทคนิค"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">สถานที่ทำงานตามใบอนุญาต</label>
                        <input
                          type="text"
                          value={workPermitWorkplace}
                          onChange={(e) => setWorkPermitWorkplace(e.target.value)}
                          placeholder="ชื่อบริษัท / สาขาที่ได้รับอนุญาต"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">วันที่เริ่มมีผล</label>
                        <input
                          type="date"
                          value={workPermitEffectiveDate}
                          onChange={(e) => setWorkPermitEffectiveDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block font-semibold text-slate-700">
                            วันหมดอายุ Work Permit <span className="text-red-500">*</span>
                          </label>
                          {workPermitExpiryDate && (() => {
                            const stat = getExpiryStatus(workPermitExpiryDate, isRenewingWorkPermit);
                            return (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${stat.badgeClass}`}>
                                {stat.label}
                              </span>
                            );
                          })()}
                        </div>
                        <input
                          type="date"
                          required
                          value={workPermitExpiryDate}
                          onChange={(e) => setWorkPermitExpiryDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 font-semibold text-amber-800"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">ลักษณะงาน</label>
                        <input
                          type="text"
                          value={workPermitJobDescription}
                          onChange={(e) => setWorkPermitJobDescription(e.target.value)}
                          placeholder="รายละเอียดงานที่ได้รับอนุญาต"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                        />
                      </div>
                    </div>

                    {/* Work Permit card photo with Camera */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-semibold text-slate-700 block">รูปถ่ายใบอนุญาตทำงาน (Work Permit Card)</span>
                        <span className="text-[11px] text-slate-500">ถ่ายหรืออัปโหลดเพื่อใช้เป็นหลักฐานและดูตัวอย่างในระบบ</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {workPermitImage && (
                          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> แนบรูปแล้ว
                          </span>
                        )}

                        <label className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer transition">
                          <Camera className="w-3.5 h-3.5 text-blue-600" />
                          <span>ถ่ายรูป</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handleImageFileChange(e, setWorkPermitImage)}
                          />
                        </label>

                        <label className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 cursor-pointer transition">
                          <Upload className="w-3.5 h-3.5 text-slate-600" />
                          <span>เลือกไฟล์</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageFileChange(e, setWorkPermitImage)}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    พนักงานไม่มี Work Permit ในขณะนี้ (เช่น อยู่ระหว่างการยื่นขอใบอนุญาตทำงานใหม่)
                  </p>
                )}
              </div>

            </div>
          )}

          {/* ===================== ฟังก์ชัน: เช็คลิสต์เอกสารสำคัญของพนักงาน ===================== */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  เช็คลิสต์เอกสารสำคัญของพนักงาน (Document Checklist)
                </h4>
              </div>
              <span className="text-[11px] text-slate-500">
                ทำเครื่องหมายเอกสารที่ส่งมอบครบถ้วนแล้ว
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={checkIdCard}
                  onChange={(e) => setCheckIdCard(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="font-semibold text-slate-800">สำเนาบัตรประชาชน</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={checkHouseReg}
                  onChange={(e) => setCheckHouseReg(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="font-semibold text-slate-800">สำเนาทะเบียนบ้าน</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={checkPhoto}
                  onChange={(e) => setCheckPhoto(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="font-semibold text-slate-800">รูปถ่าย</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={checkResume}
                  onChange={(e) => setCheckResume(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="font-semibold text-slate-800">เรซูเม่</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={checkEducation}
                  onChange={(e) => setCheckEducation(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="font-semibold text-slate-800">ประวัติการศึกษา (บางตำแหน่ง)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={checkMedicalCert}
                  onChange={(e) => setCheckMedicalCert(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="font-semibold text-slate-800">ใบรับรองแพทย์</span>
              </label>
            </div>

            {isForeignWorker && (
              <div className="mt-2 pt-2.5 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                    <span>เอกสารสำหรับแรงงานต่างด้าว (Foreign Worker Checklist):</span>
                  </span>
                  {isRenewingWorkPermit && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-200 text-amber-900 border border-amber-300">
                      กำลังต่อใบอนุญาต
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg flex items-center gap-2">
                    <Check className={`w-4 h-4 ${hasWorkPermit ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="font-medium text-slate-800">ใบอนุญาตทำงาน</span>
                  </div>
                  <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center gap-2">
                    <Check className={`w-4 h-4 ${passNumber ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="font-medium text-slate-800">พาสปอร์ต วีซ่า</span>
                  </div>
                  <div className="p-2.5 bg-pink-50/70 border border-pink-200 rounded-lg flex items-center gap-2">
                    <Check className={`w-4 h-4 ${pinkId13 ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="font-medium text-slate-800">
                      สำเนาบัตร ({cardColor === 'WHITE' ? 'บัตรขาว' : 'บัตรชมพู'})
                    </span>
                  </div>
                  <label className={`p-2.5 border rounded-lg flex items-center gap-2 cursor-pointer transition ${
                    isRenewingWorkPermit 
                      ? 'bg-amber-100 border-amber-300 font-bold text-amber-900 shadow-2xs' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50'
                  }`}>
                    <input
                      type="checkbox"
                      checked={isRenewingWorkPermit}
                      onChange={(e) => setIsRenewingWorkPermit(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span>กำลังต่อใบอนุญาต</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* ===================== ฟังก์ชั่นพนักงานลาออก ===================== */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isResigned}
                  onChange={(e) => {
                    setIsResigned(e.target.checked);
                    if (e.target.checked && !resignationDate) {
                      setResignationDate(new Date().toISOString().split('T')[0]);
                    }
                  }}
                  className="w-4 h-4 text-rose-600 rounded"
                />
                <span className="flex items-center gap-1.5 text-rose-800">
                  <UserMinus className="w-4 h-4" />
                  <span>บันทึกสถานะพนักงานลาออกแล้ว (ย้ายไปฐานข้อมูลพนักงานที่ลาออก)</span>
                </span>
              </label>
            </div>

            {isResigned && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    วันที่ลาออก <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required={isResigned}
                    value={resignationDate}
                    onChange={(e) => setResignationDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เหตุผลการลาออก</label>
                  <input
                    type="text"
                    value={resignationReason}
                    onChange={(e) => setResignationReason(e.target.value)}
                    placeholder="เช่น ลาออกตามความประสงค์, กลับภูมิลำเนา"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ผู้รับมอบหมายงานต่อ</label>
                  <input
                    type="text"
                    value={handedOverTo}
                    onChange={(e) => setHandedOverTo(e.target.value)}
                    placeholder="ชื่อผู้รับส่งต่องาน"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm hover:shadow transition"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกข้อมูลพนักงาน</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
