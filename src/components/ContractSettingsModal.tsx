import React, { useState } from 'react';
import { 
  Building2, 
  X, 
  Save, 
  Clock, 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  FileText, 
  ShieldCheck, 
  Calendar, 
  CheckCircle2, 
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { 
  ContractSettings, 
  Department, 
  DEPARTMENTS, 
  WorkShift, 
  DepartmentShiftConfig 
} from '../types';
import { showConfirmDialog, showToast } from '../utils/swal';

interface ContractSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ContractSettings;
  onSave: (settings: ContractSettings) => void;
}

export const ContractSettingsModal: React.FC<ContractSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'shifts'>('general');
  const [formData, setFormData] = useState<ContractSettings>(settings);
  const [selectedDept, setSelectedDept] = useState<Department>(DEPARTMENTS[0]);
  
  // Shift edit modal inside settings
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftForm, setShiftForm] = useState<WorkShift>({
    id: '',
    name: '',
    startTime: '08:00',
    endTime: '17:00',
    breakMinutes: 60,
    workDaysPerWeek: 6,
    description: '',
  });

  if (!isOpen) return null;

  // Get shifts for selected department
  const currentDeptConfig = formData.departmentShifts.find(d => d.department === selectedDept) || {
    department: selectedDept,
    shifts: [],
  };

  const handleOpenAddShift = () => {
    setShiftForm({
      id: `SHIFT-${Date.now()}`,
      name: '',
      startTime: '08:00',
      endTime: '17:00',
      breakMinutes: 60,
      workDaysPerWeek: 6,
      description: '',
    });
    setEditingShift(null);
    setIsShiftModalOpen(true);
  };

  const handleOpenEditShift = (shift: WorkShift) => {
    setShiftForm(shift);
    setEditingShift(shift);
    setIsShiftModalOpen(true);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftForm.name.trim()) return;

    setFormData(prev => {
      const existingConfigs = [...prev.departmentShifts];
      const deptIndex = existingConfigs.findIndex(d => d.department === selectedDept);

      let updatedShifts: WorkShift[] = [];
      if (deptIndex >= 0) {
        const currentShifts = existingConfigs[deptIndex].shifts;
        if (editingShift) {
          updatedShifts = currentShifts.map(s => s.id === editingShift.id ? shiftForm : s);
        } else {
          updatedShifts = [...currentShifts, shiftForm];
        }
        existingConfigs[deptIndex] = {
          ...existingConfigs[deptIndex],
          shifts: updatedShifts,
          defaultShiftId: existingConfigs[deptIndex].defaultShiftId || shiftForm.id,
        };
      } else {
        existingConfigs.push({
          department: selectedDept,
          shifts: [shiftForm],
          defaultShiftId: shiftForm.id,
        });
      }

      return { ...prev, departmentShifts: existingConfigs };
    });

    setIsShiftModalOpen(false);
  };

  const handleDeleteShift = async (shiftId: string) => {
    const confirmed = await showConfirmDialog('ลบกะการทำงาน?', 'คุณต้องการลบกะการทำงานนี้ใช่หรือไม่?', 'ลบกะ', 'ยกเลิก');
    if (!confirmed) return;

    setFormData(prev => {
      const updatedConfigs = prev.departmentShifts.map(d => {
        if (d.department === selectedDept) {
          return {
            ...d,
            shifts: d.shifts.filter(s => s.id !== shiftId),
            defaultShiftId: d.defaultShiftId === shiftId ? undefined : d.defaultShiftId,
          };
        }
        return d;
      });
      return { ...prev, departmentShifts: updatedConfigs };
    });
    showToast('ลบกะการทำงานเรียบร้อย');
  };

  const handleSaveAll = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-blue-300 border border-white/10 shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                ตั้งค่าสัญญาจ้าง & กะการทำงานแต่ละแผนก
              </h2>
              <p className="text-xs text-blue-200">
                กำหนดข้อมูลนายจ้าง ผู้มีอำนาจลงนาม และเวลาเข้า-ออกงานของแต่ละแผนก
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

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>ข้อมูลสัญญา & ผู้มีอำนาจลงนาม</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shifts')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 ${
              activeTab === 'shifts'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>กำหนดแผนก & กะการทำงาน (เวลาเข้า-ออก)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>ข้อมูลบริษัทนายจ้าง (Employer Information)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อบริษัท / ร้านค้า (Company Name)
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ที่ตั้งสำนักงานใหญ่ / สถานที่ทำสัญญา
                    </label>
                    <input
                      type="text"
                      value={formData.companyAddress}
                      onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อผู้มีอำนาจลงนามแทนนายจ้าง
                    </label>
                    <input
                      type="text"
                      value={formData.employerSignerName}
                      onChange={(e) => setFormData({ ...formData, employerSignerName: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ตำแหน่งของผู้มีอำนาจลงนาม
                    </label>
                    <input
                      type="text"
                      value={formData.employerSignerTitle}
                      onChange={(e) => setFormData({ ...formData, employerSignerTitle: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อพยานคนที่ 1 (Witness 1)
                    </label>
                    <input
                      type="text"
                      value={formData.witness1Name}
                      onChange={(e) => setFormData({ ...formData, witness1Name: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อพยานคนที่ 2 (Witness 2)
                    </label>
                    <input
                      type="text"
                      value={formData.witness2Name}
                      onChange={(e) => setFormData({ ...formData, witness2Name: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Standard Terms */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>เงื่อนไขและข้อกำหนดมาตรฐานในสัญญา (Standard Terms)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ระยะเวลาทดลองงานมาตรฐาน (วัน)
                    </label>
                    <input
                      type="number"
                      value={formData.probationDays}
                      onChange={(e) => setFormData({ ...formData, probationDays: Number(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-blue-700"
                    />
                    <span className="text-[11px] text-slate-500 mt-0.5 block">ปกติ 90 หรือ 119 วัน</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ระยะเวลาบอกกล่าวล่วงหน้าก่อนลาออก (วัน)
                    </label>
                    <input
                      type="number"
                      value={formData.noticePeriodDays}
                      onChange={(e) => setFormData({ ...formData, noticePeriodDays: Number(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold"
                    />
                    <span className="text-[11px] text-slate-500 mt-0.5 block">ปกติ 30 วัน</span>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      กำหนดวันจ่ายเงินเดือน
                    </label>
                    <input
                      type="text"
                      value={formData.standardPaymentDay}
                      onChange={(e) => setFormData({ ...formData, standardPaymentDay: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      วันหยุดประจำสัปดาห์มาตรฐาน
                    </label>
                    <input
                      type="text"
                      value={formData.weeklyHolidays}
                      onChange={(e) => setFormData({ ...formData, weeklyHolidays: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ข้อตกลงการรักษาความลับทางการค้า (Confidentiality Clause)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.confidentialityClause}
                      onChange={(e) => setFormData({ ...formData, confidentialityClause: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl leading-relaxed"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ระเบียบวินัยและข้อบังคับการทำงาน (Work Regulations)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.rulesAndRegulations}
                      onChange={(e) => setFormData({ ...formData, rulesAndRegulations: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shifts' && (
            <div className="space-y-5">
              {/* Department selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  เลือกแผนกที่ต้องการตั้งค่ากะการทำงาน (Select Department):
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {DEPARTMENTS.map(dept => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setSelectedDept(dept)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        selectedDept === dept
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>{dept}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Shifts for Selected Department */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>กะการทำงานของ {selectedDept}</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                        {currentDeptConfig.shifts.length} กะ
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      กำหนดเวลาเข้างาน เวลาออกงาน และเวลาพัก เพื่อนำไปใส่ในสัญญาจ้างงานอัตโนมัติ
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddShift}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มกะการทำงาน</span>
                  </button>
                </div>

                {currentDeptConfig.shifts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentDeptConfig.shifts.map(shift => (
                      <div
                        key={shift.id}
                        className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs hover:shadow-sm transition flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-bold text-slate-900 text-sm">
                              {shift.name}
                            </h5>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditShift(shift)}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="แก้ไขกะนี้"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteShift(shift.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="ลบกะนี้"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-2 p-2 bg-blue-50/70 rounded-lg border border-blue-100/80 flex items-center justify-between text-xs font-bold text-blue-900">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                              <span>{shift.startTime} น. - {shift.endTime} น.</span>
                            </div>
                            <span className="text-[11px] text-blue-700 font-semibold">
                              พัก {shift.breakMinutes} นาที
                            </span>
                          </div>

                          {shift.description && (
                            <p className="text-xs text-slate-500 mt-2">
                              {shift.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span>ทำงาน {shift.workDaysPerWeek} วัน/สัปดาห์</span>
                          <span className="font-mono text-slate-400">ID: {shift.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-white rounded-xl border border-dashed border-slate-200 space-y-2">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">ยังไม่มีกะการทำงานในแผนกนี้</p>
                    <p className="text-xs text-slate-400">กดปุ่ม "เพิ่มกะการทำงาน" เพื่อกำหนดเวลาเข้า-ออกงาน</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            การเปลี่ยนแปลงจะมีผลกับการสร้างสัญญาจ้างงานใหม่ทันที
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการตั้งค่า</span>
            </button>
          </div>
        </div>

      </div>

      {/* SUB-MODAL: ADD / EDIT SHIFT */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>{editingShift ? 'แก้ไขกะการทำงาน' : 'เพิ่มกะการทำงานใหม่'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อกะการทำงาน (Shift Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น กะเช้า (Morning Shift) หรือ กะปิดร้าน"
                  value={shiftForm.name}
                  onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เวลาเข้างาน (Start Time) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เวลาออกงาน (End Time) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เวลาพัก (นาที)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="15"
                    value={shiftForm.breakMinutes}
                    onChange={(e) => setShiftForm({ ...shiftForm, breakMinutes: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    วันทำงานต่อสัปดาห์
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={shiftForm.workDaysPerWeek}
                    onChange={(e) => setShiftForm({ ...shiftForm, workDaysPerWeek: Number(e.target.value) || 6 })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  คำอธิบายหรือหน้าที่ประจำกะ (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  placeholder="เช่น ต้อนรับลูกค้าช่วงเร่งด่วน หรือ ปิดสต็อกยอดขาย"
                  value={shiftForm.description || ''}
                  onChange={(e) => setShiftForm({ ...shiftForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  บันทึกกะการทำงาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
