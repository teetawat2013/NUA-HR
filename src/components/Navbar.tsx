import React from 'react';
import { 
  Users, 
  PlusCircle, 
  Trash2,
  ShieldAlert,
  Search,
  Cloud,
  LogOut,
  LogIn,
  CheckCircle2,
  RefreshCw,
  BellRing
} from 'lucide-react';
import { Employee } from '../types';
import { getExpiryStatus } from '../utils/payrollCalculator';
import { User } from 'firebase/auth';

interface NavbarProps {
  employees: Employee[];
  onOpenAddModal: () => void;
  onResetData?: () => void;
  onNavigateToForeignExpiries: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeTab: string;
  currentUser: User | null;
  isSyncing: boolean;
  onLogin: () => void;
  onLogout: () => void;
  urgent7DayCount?: number;
  onOpenUrgentAlertModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  employees,
  onOpenAddModal,
  onResetData,
  onNavigateToForeignExpiries,
  searchQuery,
  setSearchQuery,
  currentUser,
  isSyncing,
  onLogin,
  onLogout,
  urgent7DayCount = 0,
  onOpenUrgentAlertModal,
}) => {
  // คำนวณเอกสารต่างด้าวที่ใกล้หมดอายุ (<= 60 วัน หรือหมดอายุแล้ว)
  const expiringForeignDocsCount = employees.reduce((count, emp) => {
    if (!emp.isForeignWorker || emp.resignation.isResigned || !emp.foreignDetails) return count;
    const pStat = getExpiryStatus(emp.foreignDetails.passportExpiryDate);
    const vStat = getExpiryStatus(emp.foreignDetails.visaExpiryDate);
    const wStat = getExpiryStatus(emp.foreignDetails.workPermitExpiryDate);

    let hasExpiring = false;
    if (pStat.status === 'EXPIRED' || pStat.status === 'CRITICAL' || pStat.status === 'WARNING') hasExpiring = true;
    if (vStat.status === 'EXPIRED' || vStat.status === 'CRITICAL' || vStat.status === 'WARNING') hasExpiring = true;
    if (wStat.status === 'EXPIRED' || wStat.status === 'CRITICAL' || wStat.status === 'WARNING') hasExpiring = true;

    return hasExpiring ? count + 1 : count;
  }, 0);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Brand & App Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#8B1C2D] to-[#66121F] flex items-center justify-center text-[#F0E7C2] shadow-xs ring-1 ring-[#8B1C2D]/30">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#F0E7C2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 leading-tight">
                  Nua <span className="text-[#8B1C2D]">HRM Pro</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 text-[11px] font-bold bg-[#FAF6EC] text-[#8B1C2D] rounded-md border border-[#E8DCB5]">
                  ระบบบริหารงานบุคคล & ขาดลามาสาย
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden xl:block leading-tight mt-0.5">
                ฐานข้อมูลพนักงาน • สัญญาจ้าง • สถิติขาด ลา มาสาย • บันทึกวันหยุดชดเชย
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden lg:flex items-center flex-1 max-w-sm mx-2">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อ, รหัสพนักงาน, ตำแหน่ง..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Quick Actions, Auth & System Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Urgent 7-Day Document Expiry Alert Pill */}
            {urgent7DayCount > 0 && onOpenUrgentAlertModal && (
              <button
                onClick={onOpenUrgentAlertModal}
                title="มีเอกสารพนักงานครบกำหนดหมดอายุภายใน 7 วัน หรือเกินกำหนด คลิกเพื่อดูรายชื่อทั้งหมดทันที"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300 rounded-xl hover:bg-rose-100/90 transition shadow-2xs cursor-pointer"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                </span>
                <BellRing className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden md:inline">ด่วน 7 วัน:</span>
                <span className="bg-rose-600 text-white rounded-full px-1.5 py-0.2 text-[10px] font-black">
                  {urgent7DayCount}
                </span>
              </button>
            )}

            {/* Foreign worker expiry warning pill */}
            {expiringForeignDocsCount > 0 && (
              <button
                onClick={onNavigateToForeignExpiries}
                title="คลิกเพื่อดูรายการเอกสารแรงงานต่างด้าวที่ใกล้หมดอายุ"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300/80 rounded-xl hover:bg-amber-100/80 transition shadow-2xs"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden md:inline">เตือนต่างด้าว:</span>
                <span className="bg-amber-600 text-white rounded-full px-1.5 py-0.2 text-[10px] font-bold">
                  {expiringForeignDocsCount}
                </span>
              </button>
            )}

            {/* Cloud Sync Status Indicator */}
            {currentUser ? (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-medium"
                title="เชื่อมต่อฐานข้อมูลคลาวด์ Firestore แบบเรียลไทม์"
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span className="hidden sm:inline text-[11px] font-semibold">
                  {isSyncing ? 'กำลังบันทึก...' : 'คลาวด์เชื่อมต่อแล้ว'}
                </span>
              </div>
            ) : (
              <div 
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-slate-600 text-[11px] font-medium"
                title="ข้อมูลจัดเก็บบนเครื่องชั่วคราว ลงชื่อเข้าใช้เพื่อซิงค์ข้อมูลบนคลาวด์"
              >
                <Cloud className="w-3.5 h-3.5 text-slate-400" />
                <span>โหมดออฟไลน์</span>
              </div>
            )}

            {/* Firebase Auth Google Sign-in / User Profile */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'ผู้ใช้งาน'}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border border-slate-200 object-cover shadow-2xs"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[110px]">
                    {currentUser.displayName || 'ผู้ดูแลระบบ'}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[110px]">
                    {currentUser.email}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="ออกจากระบบ"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs transition active:scale-98"
                title="เข้าสู่ระบบด้วยบัญชี Google เพื่อซิงค์ข้อมูลลงคลาวด์"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-600" />
                <span>เข้าสู่ระบบ</span>
              </button>
            )}

            {/* Add Employee Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 bg-[#8B1C2D] hover:bg-[#721523] active:bg-[#59101b] text-white text-xs sm:text-sm font-bold px-3 py-1.5 sm:py-2 rounded-xl shadow-xs hover:shadow transition transform active:scale-98 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#F0E7C2]" />
              <span className="hidden sm:inline">เพิ่มพนักงาน</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
