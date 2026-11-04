import React, { useState } from 'react';
import { 
  ShieldAlert, 
  X, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  ArrowRight, 
  FileText, 
  UserCheck, 
  Printer, 
  CheckCircle2, 
  ExternalLink,
  Phone,
  Building2,
  BellRing
} from 'lucide-react';
import { Employee } from '../types';
import { UrgentEmployeeAlert, UrgentDocumentItem } from '../utils/documentExpiry';

interface UrgentExpiryModalProps {
  isOpen: boolean;
  onClose: (dontShowAgainThisSession?: boolean) => void;
  urgentAlerts: UrgentEmployeeAlert[];
  onSelectEmployee: (employee: Employee) => void;
  onNavigateToForeign?: () => void;
}

export const UrgentExpiryModal: React.FC<UrgentExpiryModalProps> = ({
  isOpen,
  onClose,
  urgentAlerts,
  onSelectEmployee,
  onNavigateToForeign,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen || urgentAlerts.length === 0) return null;

  // Calculate high-level breakdown
  let totalExpiredDocs = 0;
  let total1To3DaysDocs = 0;
  let total4To7DaysDocs = 0;

  urgentAlerts.forEach(item => {
    item.documents.forEach(doc => {
      if (doc.isExpired) totalExpiredDocs += 1;
      else if (doc.daysLeft <= 3) total1To3DaysDocs += 1;
      else if (doc.daysLeft <= 7) total4To7DaysDocs += 1;
    });
  });

  const totalUrgentDocs = totalExpiredDocs + total1To3DaysDocs + total4To7DaysDocs;

  const handleConfirmClose = () => {
    onClose(dontShowAgain);
  };

  const handlePrintUrgentList = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="urgent-modal-title"
    >
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-rose-200 overflow-hidden my-6 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
      >
        {/* Top Accent Strip */}
        <div className="h-2 bg-gradient-to-r from-rose-500 via-amber-500 to-red-600 w-full" />

        {/* Modal Header */}
        <div className="p-4 sm:p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4 bg-gradient-to-b from-rose-50/50 to-white">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
              <BellRing className="w-6 h-6 animate-pulse text-rose-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                  แจ้งเตือนด่วนระบบ (Urgent Alert)
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ครบกำหนดหมดอายุภายใน 7 วัน & เกินกำหนด
                </span>
              </div>
              <h2 id="urgent-modal-title" className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                มีเอกสารพนักงานครบกำหนดหมดอายุภายใน 7 วัน
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                ตรวจพบพนักงาน <strong className="text-rose-600 font-bold">{urgentAlerts.length} คน</strong> รวม <strong className="text-rose-600 font-bold">{totalUrgentDocs} เอกสาร</strong> ที่ต้องดำเนินการต่ออายุหรือติดตามทันที
              </p>
            </div>
          </div>

          <button
            onClick={handleConfirmClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer shrink-0"
            title="ปิดหน้าต่างแจ้งเตือน"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Key Metrics Pill Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50/80 border-b border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-slate-500 text-[11px] block">พนักงานเร่งด่วน</span>
            <span className="text-base font-black text-slate-900">{urgentAlerts.length} คน</span>
          </div>

          <div className="bg-rose-50/80 p-2.5 rounded-xl border border-rose-200 text-rose-900 shadow-2xs">
            <span className="text-rose-700 text-[11px] block font-medium">หมดอายุแล้ว (Overdue)</span>
            <span className="text-base font-black text-rose-700">{totalExpiredDocs} รายการ</span>
          </div>

          <div className="bg-red-50/80 p-2.5 rounded-xl border border-red-200 text-red-900 shadow-2xs">
            <span className="text-red-700 text-[11px] block font-medium">หมดอายุใน 1 - 3 วัน</span>
            <span className="text-base font-black text-red-700">{total1To3DaysDocs} รายการ</span>
          </div>

          <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 text-amber-900 shadow-2xs">
            <span className="text-amber-800 text-[11px] block font-medium">หมดอายุใน 4 - 7 วัน</span>
            <span className="text-base font-black text-amber-800">{total4To7DaysDocs} รายการ</span>
          </div>
        </div>

        {/* Scrollable Employee List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 divide-y divide-slate-100">
          {urgentAlerts.map(({ employee: emp, documents: docs, hasExpired, minDaysLeft }) => {
            const isThai = !emp.isForeignWorker;
            const nationalityLabel = isThai 
              ? 'สัญชาติไทย' 
              : `${emp.nationalityText || 'แรงงานต่างด้าว'}`;

            return (
              <div 
                key={emp.id} 
                className={`pt-4 first:pt-0 rounded-2xl p-4 transition ${
                  hasExpired 
                    ? 'bg-rose-50/40 border border-rose-200' 
                    : minDaysLeft <= 3 
                    ? 'bg-red-50/30 border border-red-200' 
                    : 'bg-amber-50/20 border border-amber-200'
                }`}
              >
                {/* Employee Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shadow-2xs shrink-0 ${
                      hasExpired 
                        ? 'bg-rose-600 text-white' 
                        : minDaysLeft <= 3 
                        ? 'bg-red-500 text-white' 
                        : 'bg-amber-500 text-white'
                    }`}>
                      {emp.fullName.slice(0, 2)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                          {emp.fullName}
                        </h3>
                        {emp.nickname && (
                          <span className="text-xs text-slate-500">({emp.nickname})</span>
                        )}
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-bold">
                          {emp.id}
                        </span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/80 border border-slate-200 text-slate-600">
                          {nationalityLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{emp.department}</span>
                        </span>
                        <span>•</span>
                        <span>{emp.position}</span>
                        {emp.phoneNumber && (
                          <>
                            <span>•</span>
                            <a 
                              href={`tel:${emp.phoneNumber}`}
                              className="text-blue-600 hover:underline flex items-center gap-1 font-mono"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{emp.phoneNumber}</span>
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Direct Action Button */}
                  <button
                    onClick={() => {
                      onClose(dontShowAgain);
                      onSelectEmployee(emp);
                    }}
                    className="self-start sm:self-center px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold transition shadow-2xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <span>เปิดประวัติและจัดการ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Urgent Documents for this Employee */}
                <div className="mt-3 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    รายการเอกสารที่ต้องดำเนินการ:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {docs.map((doc, dIdx) => (
                      <div 
                        key={dIdx}
                        className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 truncate">
                            <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate" title={doc.docNameTh}>{doc.docNameTh}</span>
                          </div>

                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>ครบกำหนด: <strong className="text-slate-700 font-mono">{doc.expiryDate}</strong></span>
                            {doc.docNumber && (
                              <span className="truncate text-slate-400">({doc.docNumber})</span>
                            )}
                          </div>
                        </div>

                        {/* Expiry Status Badge */}
                        <span className={`text-[11px] px-2 py-0.8 rounded-lg shrink-0 text-center ${doc.badgeClass}`}>
                          {doc.statusText}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-6 pt-4 border-t border-slate-200 bg-slate-50/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Don't show again this session checkbox */}
          <label className="flex items-center gap-2 text-xs text-slate-600 select-none cursor-pointer self-start sm:self-auto">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
            />
            <span>ไม่ต้องแจ้งเตือนหน้านี้ซ้ำอีกในรอบการใช้งานนี้</span>
          </label>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            {onNavigateToForeign && (
              <button
                onClick={() => {
                  onClose(dontShowAgain);
                  onNavigateToForeign();
                }}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
              >
                <span>ตารางเอกสารแรงงาน</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}

            <button
              onClick={handlePrintUrgentList}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition cursor-pointer"
              title="พิมพ์เอกสารสรุปรายการด่วน"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>พิมพ์สรุป</span>
            </button>

            <button
              onClick={handleConfirmClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>รับทราบ (ปิดหน้าต่าง)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
