import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles,
  ShieldCheck,
  Building2,
  UserCheck
} from 'lucide-react';
import { Employee } from '../types';

interface EmployeeQRCodeSectionProps {
  employee: Employee;
  onOpenQuickAttendanceForm: (employee: Employee) => void;
}

export const EmployeeQRCodeSection: React.FC<EmployeeQRCodeSectionProps> = ({
  employee,
  onOpenQuickAttendanceForm,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);

  // Generate target scan URL
  const scanUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?action=log_attendance&empId=${encodeURIComponent(employee.id)}`
    : `https://hrm-pro.local?action=log_attendance&empId=${encodeURIComponent(employee.id)}`;

  useEffect(() => {
    let isMounted = true;
    setIsGenerating(true);

    // Generate high resolution QR code
    QRCode.toDataURL(scanUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [employee.id, scanUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(scanUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QRCode_Attendance_${employee.id}_${employee.fullName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrintBadge = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      window.print();
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>บัตรพนักงานพร้อม QR Code - ${employee.fullName} (${employee.id})</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f8fafc; }
          .badge-card { width: 340px; background: white; border: 2px solid #0f172a; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
          .badge-header { background: #1e3a8a; color: white; text-align: center; padding: 14px 12px; }
          .badge-header h2 { margin: 0; font-size: 16px; font-weight: 800; letter-spacing: 0.5px; }
          .badge-header p { margin: 2px 0 0 0; font-size: 10px; opacity: 0.9; }
          .badge-body { padding: 16px; text-align: center; }
          .emp-avatar { width: 70px; height: 70px; border-radius: 12px; margin: 0 auto 10px; object-fit: cover; border: 2px solid #e2e8f0; background: #e0e7ff; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #3730a3; }
          .emp-name { font-size: 15px; font-weight: bold; color: #0f172a; margin: 0; }
          .emp-id { font-family: monospace; font-size: 12px; font-weight: bold; color: #2563eb; background: #eff6ff; display: inline-block; padding: 2px 8px; border-radius: 6px; margin: 4px 0; }
          .emp-dept { font-size: 11px; color: #475569; margin: 2px 0; }
          .qr-container { margin: 12px auto; width: 170px; height: 170px; padding: 6px; border: 1px solid #cbd5e1; border-radius: 10px; background: white; }
          .qr-container img { width: 100%; height: 100%; display: block; }
          .badge-footer { background: #f1f5f9; padding: 10px; font-size: 9px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="badge-card">
          <div class="badge-header">
            <h2>HRM PRO ENTERPRISE</h2>
            <p>บัตรประจำตัวพนักงาน & QR ลงเวลาปฏิบัติงาน</p>
          </div>
          <div class="badge-body">
            <div class="emp-avatar">${employee.fullName[0]}</div>
            <div class="emp-name">${employee.fullName}</div>
            <div class="emp-id">${employee.id}</div>
            <div class="emp-dept">${employee.position} • ${employee.department}</div>
            <div class="qr-container">
              <img src="${qrDataUrl}" alt="QR Code" />
            </div>
            <div style="font-size: 10px; font-weight: bold; color: #1e293b;">
              สแกน QR เพื่อลงเวลาปฏิบัติงานด่วน
            </div>
          </div>
          <div class="badge-footer">
            ระบบบริหารจัดการข้อมูลพนักงานและสถิติเวลา Nua HRM Pro
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-6">
      
      {/* Intro info box */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>QR Code ประจำตัวสำหรับบันทึกเวลาปฏิบัติงาน</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] bg-blue-600 text-white font-semibold">
                พร้อมใช้งาน
              </span>
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              พนักงานหรือหัวหน้างานสามารถใช้กล้องโทรศัพท์มือถือสแกนเพื่อเข้าสู่ฟอร์มบันทึกเวลาปฏิบัติงานได้ทันที
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenQuickAttendanceForm(employee)}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>ทดลองเปิดฟอร์มลงเวลา</span>
        </button>
      </div>

      {/* Main Grid: ID Badge Preview & Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* Printable Employee Badge Card Preview */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[310px] bg-white rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden relative">
            
            {/* Lanyard punch hole illusion */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-2.5 rounded-full bg-slate-200 border border-slate-300" />

            {/* Badge Card Header */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 pt-7 pb-4 px-4 text-center text-white">
              <span className="text-[10px] uppercase tracking-wider text-blue-200 font-semibold">
                HRM PRO IDENTIFICATION BADGE
              </span>
              <h3 className="font-black text-sm tracking-tight text-white mt-0.5">
                บัตรประจำตัวพนักงาน
              </h3>
            </div>

            {/* Card Content */}
            <div className="p-5 text-center flex flex-col items-center">
              
              {/* Photo */}
              <div className="w-20 h-20 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-blue-700 font-black text-xl mb-3 shadow-inner overflow-hidden">
                {employee.documents?.find(d => d.type === 'PHOTO')?.fileUrl ? (
                  <img
                    src={employee.documents.find(d => d.type === 'PHOTO')?.fileUrl}
                    alt={employee.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{employee.fullName[0]}</span>
                )}
              </div>

              {/* Name & ID */}
              <h4 className="font-bold text-slate-900 text-sm leading-tight">
                {employee.fullName}
              </h4>
              {employee.nickname && (
                <span className="text-xs text-slate-500">({employee.nickname})</span>
              )}
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200 mt-1">
                {employee.id}
              </span>

              <div className="text-[11px] text-slate-600 mt-1">
                <span className="font-semibold">{employee.position}</span>
                <span className="mx-1">•</span>
                <span>{employee.department}</span>
              </div>

              {/* Generated QR Code Frame */}
              <div className="my-3.5 p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                {isGenerating ? (
                  <div className="w-40 h-40 flex items-center justify-center text-slate-400 text-xs">
                    กำลังสร้าง QR Code...
                  </div>
                ) : qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt={`QR Code ${employee.id}`} 
                    className="w-40 h-40 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-rose-500 text-xs">
                    สร้าง QR Code ไม่สำเร็จ
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-400 font-medium">
                สแกนด้วยโทรศัพท์เพื่อบันทึกเวลาปฏิบัติงาน
              </span>
            </div>

            {/* Bottom Stripe */}
            <div className="bg-slate-100 py-1.5 px-4 text-center border-t border-slate-200 text-[10px] text-slate-500 font-mono">
              EMPLOYEE CODE: {employee.id}
            </div>

          </div>
        </div>

        {/* QR Features & Instructions */}
        <div className="space-y-4">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>การใช้งานรหัส QR Code บันทึกเวลา</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              รหัส QR Code นี้มีความจำเพาะต่อพนักงานรหัส <strong>{employee.id}</strong> โดยตรง เมื่อสแกนผ่านแอปกล้องในโทรศัพท์มือถือระบบ iOS / Android หรือแอปพลิเคชันสแกน QR ระบบจะเปิดแบบฟอร์มลงเวลาปฏิบัติงานของพนักงานคนนี้ทันทีโดยไม่ต้องค้นหารหัสใหม่
            </p>

            {/* Scan URL Link box */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                ลิงก์ตรงสำหรับสแกน / ลงเวลา (Direct Scan URL)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={scanUrl}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-600 truncate select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-3 py-2 text-xs font-bold rounded-lg border transition flex items-center gap-1 shrink-0 ${
                    copied
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอกลิงก์</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">
              เครื่องมือดาวน์โหลด & พิมพ์บัตร
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleDownloadQR}
                className="flex items-center justify-center gap-2 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>ดาวน์โหลด QR (PNG)</span>
              </button>

              <button
                type="button"
                onClick={handlePrintBadge}
                className="flex items-center justify-center gap-2 p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold border border-blue-200 transition"
              >
                <Printer className="w-4 h-4 text-blue-600" />
                <span>พิมพ์บัตรพนักงาน</span>
              </button>
            </div>
          </div>

          {/* How-to guide */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>เคล็ดลับการนำไปใช้งานในองค์กร</span>
            </div>
            <p>1. ปริ้นท์บัตรพร้อม QR Code ติดบัตรประจำตัวพนักงาน หรือทำเป็นป้ายสแกนที่จุดลงเวลา</p>
            <p>2. สามารถบันทึกเวลาเข้างาน มาสาย ลาป่วย ลากิจ หรือ OT ได้สะดวกรวดเร็วโดยไม่ต้องใช้กระดาษ</p>
            <p>3. ข้อมูลที่บันทึกจะถูกคำนวณและอัปเดตสถิติรายบุคคลเข้าสู่ฐานข้อมูลโดยตรง</p>
          </div>

        </div>

      </div>

    </div>
  );
};
