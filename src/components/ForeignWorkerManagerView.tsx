import React, { useState } from 'react';
import { 
  Globe2, 
  ShieldAlert, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Edit, 
  Search, 
  Download, 
  Building2, 
  Clock, 
  RefreshCw, 
  CreditCard,
  CheckSquare,
  Square,
  AlertTriangle
} from 'lucide-react';
import { Employee, PinkCardDetails } from '../types';
import { getExpiryStatus, getNationalityFlag } from '../utils/payrollCalculator';

interface ForeignWorkerManagerViewProps {
  employees: Employee[];
  onViewEmployee: (employee: Employee) => void;
  onEditEmployee: (employee: Employee) => void;
  onUpdateEmployee?: (employee: Employee) => void;
}

export const ForeignWorkerManagerView: React.FC<ForeignWorkerManagerViewProps> = ({
  employees,
  onViewEmployee,
  onEditEmployee,
  onUpdateEmployee,
}) => {
  const foreignWorkers = employees.filter(e => !e.resignation.isResigned && e.isForeignWorker && e.foreignDetails);

  const [selectedDocFilter, setSelectedDocFilter] = useState<'ALL' | 'EXPIRING' | 'RENEWING' | 'PINK_WHITE_CARD'>('ALL');
  const [search, setSearch] = useState('');

  // สรุปสถิติเอกสารใกล้หมดอายุ
  let criticalCount = 0;
  let warningCount = 0;
  let expiredCount = 0;
  let renewingCount = 0;
  let cardCount = 0;

  foreignWorkers.forEach(emp => {
    if (!emp.foreignDetails) return;
    const fd = emp.foreignDetails;
    const isRenewing = !!(fd.isRenewingWorkPermit || fd.workPermitDetails?.isRenewing || emp.isRenewingWorkPermit || emp.documentChecklist?.isRenewingWorkPermit);
    if (isRenewing) renewingCount++;

    if (fd.identificationType === 'PINK_CARD' || fd.identificationType === 'WHITE_CARD' || fd.pinkCardDetails) {
      cardCount++;
    }

    const pStat = getExpiryStatus(fd.passportExpiryDate);
    const vStat = getExpiryStatus(fd.visaExpiryDate);
    const wStat = getExpiryStatus(fd.workPermitExpiryDate, isRenewing);

    if (pStat.status === 'EXPIRED' || vStat.status === 'EXPIRED' || (!isRenewing && wStat.status === 'EXPIRED')) {
      expiredCount++;
    } else if (pStat.status === 'CRITICAL' || vStat.status === 'CRITICAL' || wStat.status === 'CRITICAL') {
      criticalCount++;
    } else if (pStat.status === 'WARNING' || vStat.status === 'WARNING' || wStat.status === 'WARNING') {
      warningCount++;
    }
  });

  // Toggle "กำลังต่อใบอนุญาต" (Work Permit Renewal in Progress)
  const handleToggleRenewingWorkPermit = (emp: Employee) => {
    if (!onUpdateEmployee || !emp.foreignDetails) return;

    const currentRenewing = !!(
      emp.foreignDetails.isRenewingWorkPermit || 
      emp.foreignDetails.workPermitDetails?.isRenewing || 
      emp.isRenewingWorkPermit || 
      emp.documentChecklist?.isRenewingWorkPermit
    );
    const nextRenewing = !currentRenewing;

    const updatedEmp: Employee = {
      ...emp,
      isRenewingWorkPermit: nextRenewing,
      documentChecklist: {
        ...(emp.documentChecklist || {
          idCardCopy: true,
          houseRegistrationCopy: false,
          photo: true,
          resume: false,
          educationHistory: false,
        }),
        isRenewingWorkPermit: nextRenewing,
        workPermitCopy: true,
      },
      foreignDetails: {
        ...emp.foreignDetails,
        isRenewingWorkPermit: nextRenewing,
        workPermitDetails: emp.foreignDetails.workPermitDetails ? {
          ...emp.foreignDetails.workPermitDetails,
          isRenewing: nextRenewing,
        } : undefined,
      }
    };

    onUpdateEmployee(updatedEmp);
  };

  const filtered = foreignWorkers.filter(emp => {
    if (!emp.foreignDetails) return false;
    const fd = emp.foreignDetails;
    const isRenewing = !!(fd.isRenewingWorkPermit || fd.workPermitDetails?.isRenewing || emp.isRenewingWorkPermit || emp.documentChecklist?.isRenewingWorkPermit);

    // Filter by Expiry Status
    if (selectedDocFilter === 'EXPIRING') {
      const pStat = getExpiryStatus(fd.passportExpiryDate);
      const vStat = getExpiryStatus(fd.visaExpiryDate);
      const wStat = getExpiryStatus(fd.workPermitExpiryDate, isRenewing);
      const isExpiring = pStat.status !== 'NORMAL' || vStat.status !== 'NORMAL' || wStat.status !== 'NORMAL';
      if (!isExpiring) return false;
    } else if (selectedDocFilter === 'RENEWING') {
      if (!isRenewing) return false;
    } else if (selectedDocFilter === 'PINK_WHITE_CARD') {
      if (fd.identificationType !== 'PINK_CARD' && fd.identificationType !== 'WHITE_CARD' && !fd.pinkCardDetails) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = emp.fullName.toLowerCase().includes(q) || (fd.englishName || '').toLowerCase().includes(q);
      const matchPass = (fd.passportNumber || '').toLowerCase().includes(q);
      const matchWp = (fd.workPermitNumber || '').toLowerCase().includes(q);
      const matchCountry = (fd.countryOfOrigin || '').toLowerCase().includes(q);
      const matchCard = (fd.pinkCardDetails?.idNumber13 || emp.idCardNumber || '').includes(q);
      if (!matchName && !matchPass && !matchWp && !matchCountry && !matchCard) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-amber-950/70 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xs border border-slate-800">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full flex items-center gap-1">
                <span>แรงงานต่างด้าว (Foreign Workers MOU)</span>
              </span>
              <span className="text-xs text-slate-300">
                ระบบแจ้งเตือนวันหมดอายุ พร้อมนับถอยหลังวันที่เหลือ
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5 text-white">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/30">
                <Globe2 className="w-4 h-4" />
              </div>
              <span>ระบบตรวจสอบและต่ออายุเอกสารแรงงานต่างด้าว</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              ติดตามวันหมดอายุของใบอนุญาตทำงาน (Work Permit มีช่องติ๊กกำลังต่อใบอนุญาต), หนังสือเดินทาง (Passport), วีซ่า (Visa) และสำเนาบัตรสีชมพูหรือขาว
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl text-center border border-white/10 shadow-xs">
              <span className="text-[11px] text-amber-200 block font-medium">แรงงานต่างด้าวรวม</span>
              <span className="text-2xl font-black text-white">{foreignWorkers.length} คน</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expiry Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div 
          onClick={() => setSelectedDocFilter('ALL')}
          className={`cursor-pointer p-4 rounded-2xl border transition shadow-2xs ${
            selectedDocFilter === 'ALL' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-xs font-semibold text-slate-500 block">แรงงานต่างด้าวทั้งหมด</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{foreignWorkers.length} <span className="text-xs font-normal">คน</span></div>
          <p className="text-xs text-slate-400 mt-1">สัญชาติเมียนมา และอื่นๆ</p>
        </div>

        <div 
          onClick={() => setSelectedDocFilter('EXPIRING')}
          className={`cursor-pointer p-4 rounded-2xl border transition shadow-2xs ${
            selectedDocFilter === 'EXPIRING' ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">เอกสารใกล้หมดอายุ (&le;90 วัน)</span>
            <ShieldAlert className="w-4 h-4 text-amber-600 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {criticalCount + warningCount + expiredCount} <span className="text-xs font-normal">คน</span>
          </div>
          <p className="text-xs text-amber-700/80 mt-1">
            วิกฤต (&le;30 วัน): {criticalCount} • เตรียมต่อ (&le;90 วัน): {warningCount}
          </p>
        </div>

        <div 
          onClick={() => setSelectedDocFilter('RENEWING')}
          className={`cursor-pointer p-4 rounded-2xl border transition shadow-2xs ${
            selectedDocFilter === 'RENEWING' ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-800">กำลังต่อใบอนุญาต (Work Permit)</span>
            <RefreshCw className="w-4 h-4 text-sky-600 animate-spin" />
          </div>
          <div className="text-2xl font-black text-sky-700 mt-1">
            {renewingCount} <span className="text-xs font-normal">คน</span>
          </div>
          <p className="text-xs text-sky-600 mt-1">ยื่นเรื่องต่อใบอนุญาตแล้ว</p>
        </div>

        <div 
          onClick={() => setSelectedDocFilter('PINK_WHITE_CARD')}
          className={`cursor-pointer p-4 rounded-2xl border transition shadow-2xs ${
            selectedDocFilter === 'PINK_WHITE_CARD' ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-800">บัตรสีชมพู / บัตรสีขาว</span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1">
            {cardCount} <span className="text-xs font-normal">คน</span>
          </div>
          <p className="text-xs text-purple-600 mt-1">บัตรประจำตัวคนไม่มีสัญชาติ</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500">กรองข้อมูล:</span>
          <button
            onClick={() => setSelectedDocFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              selectedDocFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            แสดงทุกคน ({foreignWorkers.length})
          </button>
          <button
            onClick={() => setSelectedDocFilter('EXPIRING')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              selectedDocFilter === 'EXPIRING' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            เอกสารใกล้หมดอายุ ({criticalCount + warningCount + expiredCount})
          </button>
          <button
            onClick={() => setSelectedDocFilter('RENEWING')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              selectedDocFilter === 'RENEWING' ? 'bg-sky-600 text-white' : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
            }`}
          >
            กำลังต่อใบอนุญาต ({renewingCount})
          </button>
          <button
            onClick={() => setSelectedDocFilter('PINK_WHITE_CARD')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              selectedDocFilter === 'PINK_WHITE_CARD' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
            }`}
          >
            บัตรชมพู / ขาว ({cardCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ, เลข Passport, Work Permit, บัตร..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {/* Main Foreign Worker Compliance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">ข้อมูลแรงงาน / สัญชาติ</th>
                <th className="p-3.5">สำเนาบัตร (ชมพูหรือขาว)</th>
                <th className="p-3.5">Passport & นับวันหมดอายุ</th>
                <th className="p-3.5">Visa & นับวันหมดอายุ</th>
                <th className="p-3.5">ใบอนุญาตทำงาน (Work Permit)</th>
                <th className="p-3.5 text-center bg-sky-50/50">กำลังต่อใบอนุญาต</th>
                <th className="p-3.5 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((emp) => {
                  const fd = emp.foreignDetails!;
                  const isRenewing = !!(
                    fd.isRenewingWorkPermit || 
                    fd.workPermitDetails?.isRenewing || 
                    emp.isRenewingWorkPermit || 
                    emp.documentChecklist?.isRenewingWorkPermit
                  );

                  const pStat = getExpiryStatus(fd.passportExpiryDate);
                  const vStat = getExpiryStatus(fd.visaExpiryDate);
                  const wStat = getExpiryStatus(fd.workPermitExpiryDate, isRenewing);

                  const cardColor = fd.cardColor || fd.pinkCardDetails?.cardColor || (fd.identificationType === 'WHITE_CARD' ? 'WHITE' : 'PINK');
                  const hasCardDetails = !!(fd.pinkCardDetails || fd.identificationType === 'PINK_CARD' || fd.identificationType === 'WHITE_CARD');
                  const cardStat = getExpiryStatus(fd.pinkCardDetails?.expiryDate);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                      
                      {/* Name & Origin */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                            {emp.fullName.slice(0, 1)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                              <span>{emp.fullName}</span>
                              {emp.nickname && <span className="text-slate-400 font-normal">({emp.nickname})</span>}
                            </p>
                            <p className="text-[11px] text-slate-500">{fd.englishName || '-'} ({emp.id})</p>
                            <span className="inline-block mt-0.5 text-[10px] px-2 py-0.2 rounded-full font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                              {fd.countryOfOrigin || 'เมียนมา (Myanmar)'} • {emp.department}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Pink Card or White Card Copy */}
                      <td className="p-3.5">
                        {hasCardDetails ? (
                          <div>
                            <div className="flex items-center gap-1">
                              <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                cardColor === 'WHITE' 
                                  ? 'bg-slate-200 text-slate-800 border border-slate-300' 
                                  : 'bg-pink-100 text-pink-800 border border-pink-200'
                              }`}>
                                {cardColor === 'WHITE' ? 'บัตรสีขาว (10ปี)' : 'บัตรสีชมพู'}
                              </span>
                            </div>
                            <p className="font-mono text-slate-900 font-semibold mt-1">
                              {fd.pinkCardDetails?.idNumber13 || emp.idCardNumber || '-'}
                            </p>
                            {fd.pinkCardDetails?.expiryDate ? (
                              <span className={`inline-block mt-0.5 text-[10px] px-2 py-0.2 rounded-md border ${cardStat.badgeClass}`}>
                                {cardStat.label}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 block">สำเนาแนบแล้ว</span>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-400 text-[11px]">
                            <span>ใช้ Passport เป็นหลัก</span>
                          </div>
                        )}
                      </td>

                      {/* Passport */}
                      <td className="p-3.5">
                        <p className="font-mono font-bold text-slate-900">{fd.passportNumber || '-'}</p>
                        <p className="text-[10px] text-slate-400">หมดอายุ: {fd.passportExpiryDate || '-'}</p>
                        <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md border ${pStat.badgeClass}`}>
                          {pStat.label}
                        </span>
                      </td>

                      {/* Visa */}
                      <td className="p-3.5">
                        <p className="font-mono font-semibold text-slate-900">{fd.visaNumber || fd.visaType}</p>
                        <p className="text-[10px] text-slate-400">หมดอายุ: {fd.visaExpiryDate || '-'}</p>
                        <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md border ${vStat.badgeClass}`}>
                          {vStat.label}
                        </span>
                      </td>

                      {/* Work Permit */}
                      <td className="p-3.5">
                        <p className="font-mono font-bold text-slate-900">{fd.workPermitNumber || '-'}</p>
                        <p className="text-[10px] text-slate-400">หมดอายุ: {fd.workPermitExpiryDate || '-'}</p>
                        <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md border ${wStat.badgeClass}`}>
                          {wStat.label}
                        </span>
                      </td>

                      {/* Checkbox: กำลังต่อใบอนุญาต */}
                      <td className="p-3.5 text-center bg-sky-50/30">
                        <button
                          type="button"
                          onClick={() => handleToggleRenewingWorkPermit(emp)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition ${
                            isRenewing 
                              ? 'bg-sky-600 text-white border-sky-600 shadow-xs' 
                              : 'bg-white text-slate-500 border-slate-300 hover:border-sky-400 hover:text-sky-600'
                          }`}
                          title="คลิกเพื่อติ๊กเปลี่ยนสถานะกำลังต่อใบอนุญาต"
                        >
                          {isRenewing ? (
                            <>
                              <CheckSquare className="w-4 h-4 text-white" />
                              <span>กำลังต่อใบอนุญาต</span>
                            </>
                          ) : (
                            <>
                              <Square className="w-4 h-4 text-slate-400" />
                              <span>ติ๊กเพื่อต่ออายุ</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onViewEmployee(emp)}
                            title="ดูรายละเอียดแรงงานต่างด้าว & สำเนาเอกสาร"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditEmployee(emp)}
                            title="แก้ไขข้อมูล / อัปเดตวันต่ออายุ"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    ไม่พบข้อมูลแรงงานต่างด้าวตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
