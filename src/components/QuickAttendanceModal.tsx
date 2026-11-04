import React, { useState, useEffect } from 'react';
import { 
  X, 
  CalendarClock, 
  Clock, 
  CheckCircle2, 
  User, 
  Building2, 
  Briefcase, 
  Check, 
  AlertCircle,
  QrCode,
  Zap,
  Activity,
  Sun,
  UserX
} from 'lucide-react';
import { Employee, AttendanceRecord, AttendanceEventType } from '../types';

interface QuickAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSaveRecord: (record: Omit<AttendanceRecord, 'id' | 'recordedAt'>) => void;
}

export const QuickAttendanceModal: React.FC<QuickAttendanceModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSaveRecord,
}) => {
  const [type, setType] = useState<AttendanceEventType>('LATE');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number>(15);
  const [reason, setReason] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setDate(new Date().toISOString().split('T')[0]);
      setType('LATE');
      setAmount(15);
      setReason('');
    }
  }, [isOpen]);

  if (!isOpen || !employee) return null;

  const handleTypeChange = (newType: AttendanceEventType) => {
    setType(newType);
    if (newType === 'LATE') {
      setAmount(15);
    } else if (newType === 'OT') {
      setAmount(2);
    } else {
      setAmount(1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    onSaveRecord({
      employeeId: employee.id,
      employeeName: employee.fullName,
      department: employee.department,
      type,
      date,
      amount: Number(amount) || 1,
      reason: reason.trim() || getDefaultReason(type),
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  const getDefaultReason = (t: AttendanceEventType) => {
    switch (t) {
      case 'LATE': return 'สแกน QR บันทึกมาสาย';
      case 'OT': return 'สแกน QR บันทึกล่วงเวลา (OT)';
      case 'SICK': return 'บันทึกลาป่วย';
      case 'BUSINESS': return 'บันทึกลากิจ';
      case 'ANNUAL': return 'บันทึกลาพักร้อน';
      case 'ABSENT': return 'บันทึกขาดงาน';
      case 'OTHER_LEAVE': return 'บันทึกการลาอื่นๆ';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <QrCode className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                แบบฟอร์มบันทึกเวลาปฏิบัติงาน (QR Scan)
              </h3>
              <p className="text-[11px] text-blue-100">
                ระบบลงเวลาด่วนผ่านการสแกน QR Code พนักงาน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Employee Identity Box */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 font-bold flex items-center justify-center text-base shrink-0 overflow-hidden shadow-2xs">
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
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-sm truncate">{employee.fullName}</h4>
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {employee.id}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 truncate">
              <span>{employee.position}</span>
              <span>•</span>
              <span className="truncate">{employee.department}</span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <Check className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">บันทึกเวลาปฏิบัติงานเรียบร้อยแล้ว</h4>
            <p className="text-xs text-slate-500">
              ข้อมูลถูกจัดเก็บลงสถิติรายบุคคลและซิงค์กับฐานข้อมูลเรียบร้อย
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            
            {/* Event Type Grid */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ประเภทการบันทึก <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleTypeChange('LATE')}
                  className={`py-2 px-2 rounded-xl font-bold border transition text-center ${
                    type === 'LATE'
                      ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>มาสาย</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('OT')}
                  className={`py-2 px-2 rounded-xl font-bold border transition text-center ${
                    type === 'OT'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>OT ล่วงเวลา</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('SICK')}
                  className={`py-2 px-2 rounded-xl font-bold border transition text-center ${
                    type === 'SICK'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    <span>ลาป่วย</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('BUSINESS')}
                  className={`py-2 px-2 rounded-xl font-bold border transition text-center ${
                    type === 'BUSINESS'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>ลากิจ</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('ANNUAL')}
                  className={`py-2 px-2 rounded-xl font-bold border transition text-center ${
                    type === 'ANNUAL'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Sun className="w-3.5 h-3.5" />
                    <span>ลาพักร้อน</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('ABSENT')}
                  className={`py-2 px-2 rounded-xl font-bold border transition text-center ${
                    type === 'ABSENT'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <UserX className="w-3.5 h-3.5" />
                    <span>ขาดงาน</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Date & Amount Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  วันที่ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {type === 'LATE' ? 'จำนวน (นาที)' : type === 'OT' ? 'จำนวน (ชั่วโมง)' : 'จำนวน (วัน)'}
                </label>
                <input
                  type="number"
                  step={type === 'OT' ? '0.5' : '1'}
                  min={type === 'LATE' ? 1 : 0.5}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Reason / Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                หมายเหตุ / เหตุผล
              </label>
              <input
                type="text"
                placeholder={getDefaultReason(type)}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                บันทึกเวลาปฏิบัติงาน
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
