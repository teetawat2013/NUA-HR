import React, { useState, useMemo } from 'react';
import { 
  Cake, 
  Gift, 
  PartyPopper, 
  Calendar, 
  MessageSquareHeart, 
  ClipboardCheck, 
  Share2, 
  Clock, 
  User, 
  ChevronRight, 
  Sparkles, 
  Copy, 
  Check, 
  Smile, 
  DollarSign, 
  MapPin, 
  X, 
  Plus, 
  Filter, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  FileSpreadsheet,
  Briefcase,
  Zap,
  Store,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { Employee, BirthdayEventNote, BirthdayActivityStatus } from '../types';
import { THAI_MONTHS } from '../utils/payrollCalculator';

interface BirthdaySectionProps {
  employees: Employee[];
  onSelectEmployee: (employee: Employee) => void;
  onUpdateBirthdayNote: (employeeId: string, note: BirthdayEventNote) => void;
  onAddEmployee?: () => void;
}

export interface BirthdayItem {
  employee: Employee;
  birthDay: number;
  birthMonth: number;
  birthYear: number;
  age: number;
  daysDiff: number; // 0 = today, >0 = upcoming, <0 = passed this month
  isToday: boolean;
  isUpcoming: boolean;
  isPast: boolean;
  dateStrFormatted: string;
}

export const BirthdaySection: React.FC<BirthdaySectionProps> = ({
  employees,
  onSelectEmployee,
  onUpdateBirthdayNote,
  onAddEmployee
}) => {
  const today = useMemo(() => new Date(), []);
  const realCurrentMonth = today.getMonth() + 1; // 1-12
  const realCurrentDay = today.getDate();
  const currentYear = today.getFullYear();

  // Selected viewing month (defaults to current month, can view next months for planning)
  const [selectedMonth, setSelectedMonth] = useState<number>(realCurrentMonth);
  const [filterType, setFilterType] = useState<'ALL' | 'UPCOMING' | 'NEEDS_ACTIVITY' | 'NEEDS_WISH'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  // Modals state
  const [activeWishEmployee, setActiveWishEmployee] = useState<Employee | null>(null);
  const [activeActivityEmployee, setActiveActivityEmployee] = useState<Employee | null>(null);

  // Wish modal state
  const [wishTemplateType, setWishTemplateType] = useState<'FORMAL' | 'WARM' | 'PARTY' | 'SHORT'>('WARM');
  const [customWishText, setCustomWishText] = useState('');
  const [copiedWish, setCopiedWish] = useState(false);

  // Activity modal state
  const [activityForm, setActivityForm] = useState<BirthdayEventNote>({
    preparationStatus: 'PENDING',
    wishedSent: false,
    note: '',
    cakeFlavor: 'ช็อกโกแลตฟัดจ์',
    cakeShop: 'Bake A Wish / ร้านเบเกอรี่ใกล้เคียง',
    activityTime: '15:30 น.',
    budget: 500,
    organizer: 'ฝ่ายบุคคล (HR)',
  });

  // Calculate birthdays in the selected month
  const birthdayList: BirthdayItem[] = useMemo(() => {
    return employees
      .filter(emp => !emp.resignation?.isResigned && emp.birthDate)
      .map(emp => {
        const parts = emp.birthDate.split('-');
        if (parts.length < 3) return null;
        const bYear = parseInt(parts[0], 10);
        const bMonth = parseInt(parts[1], 10);
        const bDay = parseInt(parts[2], 10);

        if (bMonth !== selectedMonth) return null;

        const age = currentYear - bYear;
        const isCurrentMonthSelected = selectedMonth === realCurrentMonth;

        let daysDiff = 0;
        let isToday = false;
        let isUpcoming = false;
        let isPast = false;

        if (isCurrentMonthSelected) {
          daysDiff = bDay - realCurrentDay;
          isToday = daysDiff === 0;
          isUpcoming = daysDiff > 0;
          isPast = daysDiff < 0;
        } else if (selectedMonth > realCurrentMonth) {
          isUpcoming = true;
          daysDiff = bDay;
        } else {
          isPast = true;
          daysDiff = bDay;
        }

        const dateStrFormatted = `${bDay} ${THAI_MONTHS[bMonth - 1]}`;

        return {
          employee: emp,
          birthDay: bDay,
          birthMonth: bMonth,
          birthYear: bYear,
          age,
          daysDiff,
          isToday,
          isUpcoming,
          isPast,
          dateStrFormatted
        };
      })
      .filter((item): item is BirthdayItem => item !== null)
      .sort((a, b) => {
        // Today first, then upcoming (closest first), then past
        if (a.isToday && !b.isToday) return -1;
        if (!a.isToday && b.isToday) return 1;
        if (a.isUpcoming && b.isPast) return -1;
        if (a.isPast && b.isUpcoming) return 1;
        return a.birthDay - b.birthDay;
      });
  }, [employees, selectedMonth, realCurrentMonth, realCurrentDay, currentYear]);

  // Count metrics
  const todayCount = birthdayList.filter(b => b.isToday).length;
  const upcoming7DaysCount = birthdayList.filter(b => b.isUpcoming && b.daysDiff <= 7).length;
  const activityPreparedCount = birthdayList.filter(b => 
    b.employee.birthdayNote?.preparationStatus === 'READY' || 
    b.employee.birthdayNote?.preparationStatus === 'COMPLETED'
  ).length;
  const wishedCount = birthdayList.filter(b => b.employee.birthdayNote?.wishedSent).length;

  // Filtered list
  const filteredList = useMemo(() => {
    return birthdayList.filter(item => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.employee.fullName.toLowerCase().includes(q);
        const matchNick = (item.employee.nickname || '').toLowerCase().includes(q);
        const matchDept = item.employee.department.toLowerCase().includes(q);
        const matchPos = item.employee.position.toLowerCase().includes(q);
        if (!matchName && !matchNick && !matchDept && !matchPos) return false;
      }

      // Filter tabs
      if (filterType === 'UPCOMING') {
        return item.isToday || item.isUpcoming;
      }
      if (filterType === 'NEEDS_ACTIVITY') {
        const status = item.employee.birthdayNote?.preparationStatus || 'PENDING';
        return status === 'PENDING' || status === 'PREPARING';
      }
      if (filterType === 'NEEDS_WISH') {
        return !item.employee.birthdayNote?.wishedSent;
      }
      return true;
    });
  }, [birthdayList, searchQuery, filterType]);

  // Open Wish Modal
  const handleOpenWishModal = (emp: Employee) => {
    setActiveWishEmployee(emp);
    setCopiedWish(false);
    const nick = emp.nickname ? `คุณ${emp.nickname}` : emp.fullName.split(' ')[0];
    const full = emp.fullName;
    
    // Default wish text based on selected template
    let text = '';
    if (wishTemplateType === 'FORMAL') {
      text = `ในนามของบริษัทและทีมงาน ขออวยพรวันเกิดให้คุณ ${full} มีความสุข สุขภาพร่างกายแข็งแรง ประสบความสำเร็จในหน้าที่การงานและชีวิตส่วนตัว ขอขอบคุณที่ร่วมเป็นกำลังสำคัญขององค์กรเสมอมาครับ/ค่ะ`;
    } else if (wishTemplateType === 'WARM') {
      text = `สุขสันต์วันเกิดนะ ${nick}! ขอให้ปีนี้เป็นปีที่ดี มีความสุขเยอะๆ สุขภาพแข็งแรง การงานราบรื่นและเติบโตก้าวหน้า ขอบคุณที่คอยซัพพอร์ตและสร้างพลังบวกให้ทีมเราเสมอ`;
    } else if (wishTemplateType === 'PARTY') {
      text = `Happy Birthday คุณ ${nick}! ขอเชิญชวนเพื่อนๆ ร่วมอวยพรและฉลองวันเกิดด้วยกัน ขอให้มีความสุขมากๆ คิดหวังสิ่งใดขอให้สมความปรารถนาทุกประการ`;
    } else {
      text = `สุขสันต์วันเกิดคุณ ${nick} ขอให้มีความสุข สุขภาพแข็งแรง ประสบความสำเร็จในทุกเป้าหมายครับ/ค่ะ`;
    }
    setCustomWishText(text);
  };

  // Change wish template
  const handleChangeWishTemplate = (type: 'FORMAL' | 'WARM' | 'PARTY' | 'SHORT') => {
    setWishTemplateType(type);
    if (!activeWishEmployee) return;
    const nick = activeWishEmployee.nickname ? `คุณ${activeWishEmployee.nickname}` : activeWishEmployee.fullName.split(' ')[0];
    const full = activeWishEmployee.fullName;

    if (type === 'FORMAL') {
      setCustomWishText(`ในนามของบริษัทและทีมงาน ขออวยพรวันเกิดให้คุณ ${full} มีความสุข สุขภาพร่างกายแข็งแรง ประสบความสำเร็จในหน้าที่การงานและชีวิตส่วนตัว ขอขอบคุณที่ร่วมเป็นกำลังสำคัญขององค์กรเสมอมาครับ/ค่ะ`);
    } else if (type === 'WARM') {
      setCustomWishText(`สุขสันต์วันเกิดนะ ${nick}! ขอให้ปีนี้เป็นปีที่ดี มีความสุขเยอะๆ สุขภาพแข็งแรง การงานราบรื่นและเติบโตก้าวหน้า ขอบคุณที่คอยซัพพอร์ตและสร้างพลังบวกให้ทีมเราเสมอ`);
    } else if (type === 'PARTY') {
      setCustomWishText(`Happy Birthday คุณ ${nick}! ขอเชิญชวนเพื่อนๆ ร่วมอวยพรและฉลองวันเกิดด้วยกัน ขอให้มีความสุขมากๆ คิดหวังสิ่งใดขอให้สมความปรารถนาทุกประการ`);
    } else {
      setCustomWishText(`สุขสันต์วันเกิดคุณ ${nick} ขอให้มีความสุข สุขภาพแข็งแรง ประสบความสำเร็จในทุกเป้าหมายครับ/ค่ะ`);
    }
  };

  // Copy wish text to clipboard
  const handleCopyWish = async () => {
    try {
      await navigator.clipboard.writeText(customWishText);
      setCopiedWish(true);
      setTimeout(() => setCopiedWish(false), 3000);
    } catch (e) {
      console.error('Failed to copy wish text', e);
    }
  };

  // Mark wish as sent
  const handleMarkWishSent = () => {
    if (!activeWishEmployee) return;
    const currentNote: BirthdayEventNote = activeWishEmployee.birthdayNote || {
      preparationStatus: 'PENDING',
      wishedSent: false
    };

    const updatedNote: BirthdayEventNote = {
      ...currentNote,
      wishedSent: true,
      wishedSentAt: new Date().toISOString(),
      wishedMessage: customWishText,
      lastUpdated: new Date().toISOString(),
    };

    onUpdateBirthdayNote(activeWishEmployee.id, updatedNote);
    setActiveWishEmployee(null);
  };

  // Open Activity Modal
  const handleOpenActivityModal = (emp: Employee) => {
    setActiveActivityEmployee(emp);
    const existing = emp.birthdayNote;
    if (existing) {
      setActivityForm({ ...existing });
    } else {
      setActivityForm({
        preparationStatus: 'PENDING',
        wishedSent: false,
        note: '',
        cakeFlavor: 'เค้กช็อกโกแลตฟัดจ์',
        cakeShop: 'Bake A Wish / ร้านเค้กใกล้เคียง',
        activityTime: '15:30 น. (ห้อง Pantry)',
        budget: 500,
        organizer: 'ฝ่ายบุคคล (HR)',
      });
    }
  };

  // Save Activity Form
  const handleSaveActivityForm = () => {
    if (!activeActivityEmployee) return;
    const updatedNote: BirthdayEventNote = {
      ...activityForm,
      lastUpdated: new Date().toISOString(),
    };

    onUpdateBirthdayNote(activeActivityEmployee.id, updatedNote);
    setActiveActivityEmployee(null);
  };

  // Quick Action: Set sample birthday for testing if no employee has a birthday this month
  const handleQuickSeedBirthday = (emp: Employee) => {
    const todayStr = `${today.getFullYear()}-10-${String(realCurrentDay).padStart(2, '0')}`;
    const updatedNote: BirthdayEventNote = {
      preparationStatus: 'PREPARING',
      wishedSent: false,
      cakeFlavor: 'เค้กชาไทยครีมสด',
      cakeShop: 'ร้านเบเกอรี่',
      activityTime: '15:30 น.',
      budget: 600,
      organizer: 'ฝ่ายบุคคล (HR)',
      note: 'เตรียมจัดเป่าเค้กเซอร์ไพรส์ช่วงบ่ายกับเพื่อนร่วมแผนก'
    };
    onUpdateBirthdayNote(emp.id, updatedNote);
  };

  return (
    <div className="bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 rounded-2xl border-2 border-indigo-200/90 shadow-sm overflow-hidden transition-all">
      
      {/* Banner Top Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-inner">
            <Cake className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-black text-base sm:text-lg tracking-tight flex items-center gap-2">
                <span>แจ้งเตือนวันเกิดพนักงาน (Birthday Notification)</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-900 shadow-xs">
                  {THAI_MONTHS[selectedMonth - 1]}
                </span>
              </h3>
              {todayCount > 0 && selectedMonth === realCurrentMonth && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse shadow-sm flex items-center gap-1">
                  <PartyPopper className="w-3.5 h-3.5" />
                  วันนี้มีวันเกิด {todayCount} คน!
                </span>
              )}
            </div>
            <p className="text-xs text-indigo-100 mt-0.5">
              ติดตามวันเกิดพนักงานประจำเดือน ส่งคำอวยพร และวางแผนจัดกิจกรรมเป่าเค้กสร้างความผูกพันในองค์กร
            </p>
          </div>
        </div>

        {/* Header Controls: Month Selector & Expand Toggle */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-indigo-200" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              aria-label="เลือกเดือนเกิดที่ต้องการตรวจสอบ"
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
            >
              {THAI_MONTHS.map((mName, idx) => (
                <option key={idx} value={idx + 1} className="text-slate-900">
                  {mName} {idx + 1 === realCurrentMonth ? '(เดือนนี้)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            title={isExpanded ? 'ย่อหน้าต่าง' : 'ขยายหน้าต่าง'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">เกิดในเดือนนี้</span>
                <span className="text-xl font-black text-indigo-700">{birthdayList.length}</span>
                <span className="text-xs text-slate-500 ml-1">คน</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Cake className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-rose-100 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">เกิดวันนี้</span>
                <span className={`text-xl font-black ${todayCount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-700'}`}>
                  {todayCount}
                </span>
                <span className="text-xs text-slate-500 ml-1">คน</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <PartyPopper className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">เตรียมกิจกรรมแล้ว</span>
                <span className="text-xl font-black text-purple-700">{activityPreparedCount}</span>
                <span className="text-xs text-slate-500 ml-1">/{birthdayList.length}</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Gift className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">ส่งคำอวยพรแล้ว</span>
                <span className="text-xl font-black text-emerald-700">{wishedCount}</span>
                <span className="text-xs text-slate-500 ml-1">/{birthdayList.length}</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageSquareHeart className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  filterType === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ทั้งหมด ({birthdayList.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('UPCOMING')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  filterType === 'UPCOMING'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                วันนี้ & กำลังจะถึง ({birthdayList.filter(b => b.isToday || b.isUpcoming).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('NEEDS_ACTIVITY')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  filterType === 'NEEDS_ACTIVITY'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ยังไม่เตรียมกิจกรรม ({birthdayList.filter(b => (b.employee.birthdayNote?.preparationStatus || 'PENDING') === 'PENDING').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('NEEDS_WISH')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  filterType === 'NEEDS_WISH'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ยังไม่ได้อวยพร ({birthdayList.filter(b => !b.employee.birthdayNote?.wishedSent).length})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-56 shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, แผนก..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Birthday List Display */}
          {filteredList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredList.map((item) => {
                const emp = item.employee;
                const bNote = emp.birthdayNote;
                const prepStatus = bNote?.preparationStatus || 'PENDING';
                const isWished = bNote?.wishedSent;

                return (
                  <div
                    key={emp.id}
                    className={`bg-white rounded-2xl border transition-all shadow-2xs hover:shadow-md flex flex-col justify-between overflow-hidden group ${
                      item.isToday
                        ? 'border-2 border-rose-400 ring-2 ring-rose-300/40 bg-gradient-to-b from-rose-50/40 to-white'
                        : item.isUpcoming && item.daysDiff <= 7
                        ? 'border-indigo-300 bg-gradient-to-b from-indigo-50/20 to-white'
                        : 'border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="p-4 space-y-3">
                      
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-11 h-11 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 shadow-xs ${
                            item.isToday
                              ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white animate-pulse'
                              : 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white'
                          }`}>
                            {emp.fullName[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 
                                onClick={() => onSelectEmployee(emp)}
                                className="font-bold text-slate-900 text-sm hover:text-indigo-600 cursor-pointer transition line-clamp-1"
                              >
                                {emp.fullName}
                              </h4>
                              {emp.nickname && (
                                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                  ({emp.nickname})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                              <span>{emp.position}</span>
                              <span>•</span>
                              <span>{emp.department}</span>
                            </div>
                          </div>
                        </div>

                        {/* Birthday Status Badge */}
                        <div>
                          {item.isToday ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs animate-bounce">
                              <PartyPopper className="w-3 h-3" />
                              เกิดวันนี้!
                            </span>
                          ) : item.daysDiff === 1 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white shadow-2xs">
                              <Sparkles className="w-3 h-3" />
                              พรุ่งนี้!
                            </span>
                          ) : item.isUpcoming ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Clock className="w-3 h-3 text-indigo-500" />
                              อีก {item.daysDiff} วัน
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                              ผ่านไปแล้ว
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Date & Age Badge */}
                      <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Cake className="w-4 h-4 text-purple-600" />
                          <span className="font-bold text-slate-800">
                            {item.dateStrFormatted}
                          </span>
                        </div>
                        <span className="font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-100">
                          อายุครบ {item.age} ปี
                        </span>
                      </div>

                      {/* Activity & Note Summary */}
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-500">กิจกรรมออฟฟิศ:</span>
                          {prepStatus === 'COMPLETED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              จัดกิจกรรมแล้ว
                            </span>
                          ) : prepStatus === 'READY' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                              <Cake className="w-2.5 h-2.5 text-purple-600" />
                              เค้กพร้อม/เตรียมพร้อม
                            </span>
                          ) : prepStatus === 'PREPARING' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                              <Clock className="w-2.5 h-2.5 text-blue-600" />
                              กำลังเตรียมการ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              ยังไม่ได้เตรียม
                            </span>
                          )}
                        </div>

                        {bNote?.cakeFlavor && (
                          <div className="p-2 rounded-xl bg-purple-50/60 border border-purple-100 text-[11px] text-purple-900 flex items-start gap-1.5">
                            <Gift className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                            <div className="truncate">
                              <span className="font-semibold">{bNote.cakeFlavor}</span>
                              {bNote.activityTime && <span> • นัด {bNote.activityTime}</span>}
                            </div>
                          </div>
                        )}

                        {bNote?.note && (
                          <p className="text-[11px] text-slate-600 line-clamp-1 italic bg-slate-50 px-2 py-1 rounded border border-slate-100">
                            "{bNote.note}"
                          </p>
                        )}
                      </div>

                    </div>

                    {/* Card Footer: Action Buttons */}
                    <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                      {/* Send Wish Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenWishModal(emp)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-bold transition shadow-2xs ${
                          isWished
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        <MessageSquareHeart className={`w-3.5 h-3.5 ${isWished ? 'text-emerald-600' : 'text-indigo-600'}`} />
                        <span>{isWished ? 'อวยพรแล้ว' : 'ส่งคำอวยพร'}</span>
                      </button>

                      {/* Plan Activity / Note Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenActivityModal(emp)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-bold bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 transition shadow-2xs"
                      >
                        <Gift className="w-3.5 h-3.5 text-purple-600" />
                        <span>เตรียมกิจกรรม</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State for Selected Month */
            <div className="bg-white rounded-2xl border-2 border-dashed border-indigo-200 p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <Cake className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  ไม่มีพนักงานที่มีวันเกิดในเดือน {THAI_MONTHS[selectedMonth - 1]}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  ไม่พบพนักงานที่มีวันเกิดตรงกับเดือนนี้ คุณสามารถเลือกเดือนอื่นเพื่อวางแผนกิจกรรมล่วงหน้า หรือเพิ่มวันเกิดให้พนักงานในระบบ
                </p>
              </div>

              {employees.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs text-slate-500 mr-2">ทดสอบฟีเจอร์ด้วยพนักงานในระบบ:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickSeedBirthday(employees[0])}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ตั้งวันเกิดตัวอย่างให้ "{employees[0].fullName}" (วันนี้)</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SEND BIRTHDAY WISH (ส่งคำอวยพรวันเกิด) */}
      {/* ========================================================================= */}
      {activeWishEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <MessageSquareHeart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    ส่งคำอวยพรวันเกิด
                  </h3>
                  <p className="text-xs text-slate-500">
                    อวยพรแก่ <span className="font-bold text-slate-800">{activeWishEmployee.fullName}</span> ({activeWishEmployee.nickname || activeWishEmployee.position})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveWishEmployee(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template Selection Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                เลือกรูปแบบคำอวยพรสำเร็จรูป:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleChangeWishTemplate('WARM')}
                  className={`p-2 rounded-xl text-xs font-bold border transition text-center flex items-center justify-center gap-1.5 ${
                    wishTemplateType === 'WARM'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Smile className="w-3.5 h-3.5" />
                  <span>อบอุ่นเป็นกันเอง</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeWishTemplate('PARTY')}
                  className={`p-2 rounded-xl text-xs font-bold border transition text-center flex items-center justify-center gap-1.5 ${
                    wishTemplateType === 'PARTY'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Cake className="w-3.5 h-3.5" />
                  <span>ชวนเป่าเค้ก</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeWishTemplate('FORMAL')}
                  className={`p-2 rounded-xl text-xs font-bold border transition text-center flex items-center justify-center gap-1.5 ${
                    wishTemplateType === 'FORMAL'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>ทางการ/องค์กร</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeWishTemplate('SHORT')}
                  className={`p-2 rounded-xl text-xs font-bold border transition text-center flex items-center justify-center gap-1.5 ${
                    wishTemplateType === 'SHORT'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>กระชับเรียบง่าย</span>
                </button>
              </div>
            </div>

            {/* Editable Wish Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700">ข้อความคำอวยพร (สามารถแก้ไขปรับแต่งได้):</label>
                <span className="text-slate-400">{customWishText.length} ตัวอักษร</span>
              </div>
              <textarea
                rows={4}
                value={customWishText}
                onChange={(e) => setCustomWishText(e.target.value)}
                className="w-full p-3.5 rounded-2xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed text-slate-800"
              />
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyWish}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition shadow-2xs"
              >
                {copiedWish ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">คัดลอกลงคลิปบอร์ดแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>คัดลอกข้อความ</span>
                  </>
                )}
              </button>

              <a
                href={`https://line.me/R/msg/text/?${encodeURIComponent(customWishText)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-2xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>แชร์เข้า LINE</span>
              </a>
            </div>

            {/* Modal Bottom Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveWishEmployee(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleMarkWishSent}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>บันทึกสถานะว่า "ส่งคำอวยพรแล้ว"</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PLAN OFFICE BIRTHDAY ACTIVITY & NOTES (บันทึกจัดกิจกรรมในออฟฟิศ) */}
      {/* ========================================================================= */}
      {activeActivityEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    บันทึกจัดกิจกรรมวันเกิดในออฟฟิศ
                  </h3>
                  <p className="text-xs text-slate-500">
                    สำหรับ <span className="font-bold text-slate-800">{activeActivityEmployee.fullName}</span> ({activeActivityEmployee.nickname || activeActivityEmployee.department})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveActivityEmployee(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preparation Status Radio */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                สถานะการเตรียมการจัดกิจกรรม:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'PENDING', label: 'รอดำเนินการ', dot: 'bg-amber-400' },
                  { id: 'PREPARING', label: 'กำลังเตรียม', dot: 'bg-sky-500' },
                  { id: 'READY', label: 'เตรียมพร้อมแล้ว', dot: 'bg-purple-500' },
                  { id: 'COMPLETED', label: 'จัดสำเร็จแล้ว', dot: 'bg-emerald-500' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setActivityForm(prev => ({ ...prev, preparationStatus: st.id as BirthdayActivityStatus }))}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition text-center flex items-center justify-center gap-2 ${
                      activityForm.preparationStatus === st.id
                        ? 'bg-[#8B1C2D]/10 border-[#8B1C2D] text-[#8B1C2D] ring-2 ring-[#8B1C2D]/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
                    <span>{st.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cake Flavor & Shop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Cake className="w-3.5 h-3.5 text-purple-600" />
                  <span>รสชาติเค้ก / ขนมที่ชอบ:</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น เค้กช็อกโกแลตฟัดจ์, ชีสเค้ก"
                  value={activityForm.cakeFlavor || ''}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, cakeFlavor: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1C2D]/20 focus:border-[#8B1C2D]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-blue-600" />
                  <span>ร้านเค้ก / พิกัดสั่งซื้อ:</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น Bake A Wish, GrabFood"
                  value={activityForm.cakeShop || ''}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, cakeShop: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1C2D]/20 focus:border-[#8B1C2D]"
                />
              </div>
            </div>

            {/* Time, Budget, Organizer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>เวลานัดเป่าเค้ก:</span>
                </label>
                <input
                  type="text"
                  placeholder="15:30 น. (ห้อง Pantry)"
                  value={activityForm.activityTime || ''}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, activityTime: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1C2D]/20 focus:border-[#8B1C2D]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>งบประมาณ (บาท):</span>
                </label>
                <input
                  type="number"
                  placeholder="500"
                  value={activityForm.budget || ''}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1C2D]/20 focus:border-[#8B1C2D]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ผู้รับผิดชอบ (Organizer):</span>
                </label>
                <input
                  type="text"
                  placeholder="HR / เมเนเจอร์"
                  value={activityForm.organizer || ''}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, organizer: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1C2D]/20 focus:border-[#8B1C2D]"
                />
              </div>
            </div>

            {/* Notes & Special Surprises */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>หมายเหตุเพิ่มเติม (ของขวัญ / แผนเซอร์ไพรส์):</span>
              </label>
              <textarea
                rows={3}
                placeholder="เช่น เตรียมการ์ดอวยพรให้ทุกคนเซ็น, พนักงานแพ้ถั่ว, เตรียมเซอร์ไพรส์ช่วงประชุมบ่าย"
                value={activityForm.note || ''}
                onChange={(e) => setActivityForm(prev => ({ ...prev, note: e.target.value }))}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1C2D]/20 focus:border-[#8B1C2D]"
              />
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveActivityEmployee(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveActivityForm}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20 transition flex items-center gap-1.5"
              >
                <Gift className="w-4 h-4" />
                <span>บันทึกข้อมูลจัดกิจกรรม</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
