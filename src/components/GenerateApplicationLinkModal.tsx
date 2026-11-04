import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Link2, 
  X, 
  Copy, 
  Check, 
  QrCode, 
  ExternalLink, 
  Send, 
  Briefcase, 
  Building2, 
  Download, 
  Share2, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { JobOpening, JobApplicationSettings } from '../types';

interface GenerateApplicationLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: JobApplicationSettings;
  openings: JobOpening[];
  initialJobId?: string;
  onTestOpenLink: (jobId?: string) => void;
}

// Safe Copy Helper compatible with iframes & sandbox
export const copyToClipboardSafe = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    console.warn('Clipboard API failed, trying fallback textarea', e);
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback copy failed', err);
    return false;
  }
};

export const GenerateApplicationLinkModal: React.FC<GenerateApplicationLinkModalProps> = ({
  isOpen,
  onClose,
  settings,
  openings,
  initialJobId,
  onTestOpenLink,
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId || 'ALL');
  const [urlFormat, setUrlFormat] = useState<'standard' | 'hash'>('standard');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPost, setCopiedPost] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Sync initialJobId when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedJobId(initialJobId || 'ALL');
      setCopiedLink(false);
      setCopiedPost(false);
      setCopyFeedback(null);
    }
  }, [isOpen, initialJobId]);

  // Compute the live public apply URL
  const selectedJob = openings.find(o => o.id === selectedJobId);

  const generatedUrl = (() => {
    if (typeof window === 'undefined') return 'https://hrm-pro.local?page=apply';
    const origin = window.location.origin;
    const pathname = window.location.pathname;

    if (urlFormat === 'hash') {
      const hashPart = selectedJobId !== 'ALL' ? `#apply?jobId=${selectedJobId}` : '#apply';
      return `${origin}${pathname}${hashPart}`;
    }

    const base = `${origin}${pathname}`;
    const url = new URL(base);
    url.searchParams.set('page', 'apply');
    if (selectedJobId !== 'ALL') {
      url.searchParams.set('jobId', selectedJobId);
    }
    return url.toString();
  })();

  // Generate QR code for this URL
  useEffect(() => {
    if (!isOpen || !generatedUrl) return;

    QRCode.toDataURL(generatedUrl, {
      width: 450,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('Failed to generate QR Code:', err));
  }, [isOpen, generatedUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    const ok = await copyToClipboardSafe(generatedUrl);
    if (ok) {
      setCopiedLink(true);
      setCopyFeedback('คัดลอกลิงก์สำเร็จแล้ว! สามารถนำไปส่งต่อได้ทันที');
      setTimeout(() => {
        setCopiedLink(false);
        setCopyFeedback(null);
      }, 3500);
    } else {
      setCopyFeedback('ไม่สามารถคัดลอกอัตโนมัติได้ โปรดลากแถบดำคลุมข้อความในช่องแล้วกด Ctrl+C / Cmd+C');
    }
  };

  const handleCopyPost = async () => {
    const postMessage = `[ประกาศรับสมัครงาน] ${settings.companyName}
${selectedJob ? `ตำแหน่ง: ${selectedJob.title} (${selectedJob.department})
อัตราค่าจ้าง: ${selectedJob.salaryRange}
สถานที่ทำงาน: ${selectedJob.branch || settings.companyAddress || settings.workLocation}` : `เปิดรับสมัครงานหลายตำแหน่ง`}

สมัครงานออนไลน์ผ่านมือถือได้ที่ลิงก์นี้:
${generatedUrl}

ติดต่อสอบถาม: ${settings.contactPhone}
${settings.contactLineId ? `LINE: ${settings.contactLineId}` : ''}`;

    const ok = await copyToClipboardSafe(postMessage);
    if (ok) {
      setCopiedPost(true);
      setCopyFeedback('คัดลอกข้อความประกาศพร้อมลิงก์สำเร็จแล้ว!');
      setTimeout(() => {
        setCopiedPost(false);
        setCopyFeedback(null);
      }, 3500);
    }
  };

  const handleShareLine = () => {
    const message = `สมัครงานออนไลน์กับ ${settings.companyName} ${selectedJob ? `ตำแหน่ง ${selectedJob.title}` : ''}: ${generatedUrl}`;
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(message)}`;
    window.open(lineUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadQr = () => {
    if (!qrCodeUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `Job_QR_${selectedJob ? selectedJob.id : 'All'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-blue-300 border border-white/10 shadow-inner">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                สร้างลิงก์ใบสมัครงาน (Generate Application Link)
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  พร้อมใช้งาน
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                สร้าง URL เฉพาะตำแหน่ง หรือแบบฟอร์มกลาง เพื่อส่งต่อให้ผู้สมัครกรอกผ่านมือถือ
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Step 1: เลือกตำแหน่งงาน */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-800">
              1. เลือกตำแหน่งงานที่ต้องการสร้างลิงก์ (Select Position)
            </label>

            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1C2D]/20 focus:border-[#8B1C2D] font-bold text-slate-900 shadow-2xs"
            >
              <option value="ALL">แบบฟอร์มกลาง (ผู้สมัครเลือกตำแหน่งเองได้ทุกตำแหน่ง)</option>
              {openings.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} ({job.department}) {job.urgent ? '[รับด่วน]' : ''}
                </option>
              ))}
            </select>

            {selectedJob && (
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-950 flex items-center justify-between">
                <div>
                  <span className="font-bold block">ตำแหน่ง: {selectedJob.title}</span>
                  <span className="text-[11px] text-slate-600">
                    {selectedJob.department} • ค่าตอบแทน {selectedJob.salaryRange}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  ลิงก์จะเลือกตำแหน่งนี้ให้อัตโนมัติ
                </span>
              </div>
            )}
          </div>

          {/* Step 2: รูปแบบ URL */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-slate-700">รูปแบบลิงก์:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUrlFormat('standard')}
                className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                  urlFormat === 'standard' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                URL พารามิเตอร์ (?page=apply)
              </button>
              <button
                type="button"
                onClick={() => setUrlFormat('hash')}
                className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                  urlFormat === 'hash' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Hash Link (#apply)
              </button>
            </div>
          </div>

          {/* Step 3: กล่องแสดง URL ที่สร้างเสร็จแล้ว */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              2. ลิงก์ใบสมัครที่สร้างสำเร็จ (Generated Public Link)
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono text-blue-700 select-all font-semibold focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 shrink-0"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}</span>
              </button>
            </div>

            {/* In-app Toast / Status Feedback */}
            {copyFeedback && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{copyFeedback}</span>
              </div>
            )}
          </div>

          {/* Step 4: QR Code & Sharing Options */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-32 h-32 bg-white rounded-2xl p-2 border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <QrCode className="w-12 h-12 text-slate-400" />
              )}
            </div>

            <div className="flex-1 space-y-2.5 text-center sm:text-left w-full">
              <div>
                <h4 className="text-xs font-bold text-slate-900">QR Code สแกนกรอกผ่านมือถือ</h4>
                <p className="text-[11px] text-slate-500">
                  เหมาะสำหรับนำไปพิมพ์ติดป้ายประกาศหน้าร้าน โต๊ะแคชเชียร์ หรือใส่ในภาพโปสเตอร์
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>บันทึกรูป QR Code</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareLine}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>แชร์ไปที่ LINE</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyPost}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedPost ? 'คัดลอกข้อความแล้ว!' : 'คัดลอกแคปชั่นประกาศ'}</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            ผู้สมัครสามารถเปิดลิงก์นี้จากเบราว์เซอร์หรือสแกนผ่านกล้องมือถือได้ทันที
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              ปิดหน้าต่าง
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onTestOpenLink(selectedJobId !== 'ALL' ? selectedJobId : undefined);
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิดทดสอบหน้าผู้สมัคร</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
