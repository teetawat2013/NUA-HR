import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Globe2, 
  CalendarClock, 
  DollarSign, 
  UserMinus, 
  FileSpreadsheet, 
  CheckCircle2, 
  BellRing, 
  CalendarDays,
  UserPlus,
  FileSignature,
  BookOpen
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'employees'
  | 'foreign'
  | 'attendance'
  | 'calendar'
  | 'payroll'
  | 'contracts'
  | 'documents'
  | 'recruitment'
  | 'resigned'
  | 'report';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeCount: number;
  foreignCount: number;
  resignedCount: number;
  expiringDocsCount: number;
  urgent7DayCount?: number;
  pendingApplicationsCount?: number;
  contractsCount?: number;
  onOpenUrgentAlertModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  activeCount,
  foreignCount,
  resignedCount,
  expiringDocsCount,
  urgent7DayCount = 0,
  pendingApplicationsCount = 0,
  contractsCount = 0,
  onOpenUrgentAlertModal,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'แดชบอร์ดข้อมูล',
      sub: 'ภาพรวมระบบและสถิติ',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'employees' as NavTab,
      label: 'ข้อมูลพนักงาน',
      sub: 'โครงสร้างไทย & ต่างด้าว',
      icon: Users,
      badge: activeCount,
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'foreign' as NavTab,
      label: 'แรงงานต่างด้าว',
      sub: 'Passport, Visa, Work Permit',
      icon: Globe2,
      badge: expiringDocsCount > 0 ? `${expiringDocsCount} เตือน` : foreignCount,
      badgeColor: expiringDocsCount > 0 ? 'bg-amber-100 text-amber-800 font-semibold' : 'bg-blue-50 text-blue-700',
    },
    {
      id: 'contracts' as NavTab,
      label: 'ระบบสัญญาจ้างงาน',
      sub: 'ออกสัญญา & Export PDF',
      icon: FileSignature,
      badge: contractsCount > 0 ? `${contractsCount}` : 'ใหม่',
      badgeColor: 'bg-blue-50 text-blue-700 font-bold',
    },
    {
      id: 'attendance' as NavTab,
      label: 'ขาด ลา มาสาย & Part-time',
      sub: 'สถิติรายบุคคล & วันหยุด/ชม. Part-time',
      icon: CalendarClock,
      badge: 'Export',
      badgeColor: 'bg-emerald-50 text-emerald-700 font-bold',
    },
    {
      id: 'calendar' as NavTab,
      label: 'ปฏิทินวันหยุด & กำลังคน',
      sub: 'Staffing & Holidays Calendar',
      icon: CalendarDays,
      badge: 'ใหม่',
      badgeColor: 'bg-indigo-50 text-indigo-700 font-semibold',
    },
    {
      id: 'payroll' as NavTab,
      label: 'สรุปเงินเดือน (Payroll)',
      sub: 'คำนวณวันทำงาน หักลา OT',
      icon: DollarSign,
      badge: 'Auto',
      badgeColor: 'bg-emerald-50 text-emerald-700 font-semibold',
    },
    {
      id: 'documents' as NavTab,
      label: 'คลังเอกสาร',
      sub: 'เทมเพลต Word เติมข้อมูลพนักงาน',
      icon: BookOpen,
    },
    {
      id: 'recruitment' as NavTab,
      label: 'รับสมัครงาน & ใบสมัคร',
      sub: 'กำหนดตำแหน่งงาน & ลิงก์กรอก',
      icon: UserPlus,
      badge: pendingApplicationsCount > 0 ? `${pendingApplicationsCount} ใหม่` : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800 font-bold animate-pulse',
    },
    {
      id: 'resigned' as NavTab,
      label: 'พนักงานที่ลาออกแล้ว',
      sub: 'ฐานข้อมูลประวัติการลาออก',
      icon: UserMinus,
      badge: resignedCount,
      badgeColor: 'bg-rose-50 text-rose-600',
    },
    {
      id: 'report' as NavTab,
      label: 'รายงานสรุปผลรายเดือน',
      sub: 'สรุปผลปฏิบัติงานอัตโนมัติ',
      icon: FileSpreadsheet,
      badge: 'Auto',
      badgeColor: 'bg-emerald-50 text-emerald-700',
    },
  ];

  return (
    <aside className="w-64 bg-white rounded-2xl border border-slate-200/80 shadow-xs shrink-0 hidden md:flex flex-col justify-between p-3.5 sticky top-20 h-[calc(100vh-5.5rem)] overflow-y-auto">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 tracking-wider uppercase flex items-center justify-between">
          <span>เมนูหลักของระบบ</span>
          <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-1.5 py-0.5 rounded">v2.5</span>
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 relative group cursor-pointer ${
                isActive
                  ? 'bg-[#FAF6EC] text-[#8B1C2D] font-bold border border-[#E8DCB5] shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#8B1C2D] text-[#F0E7C2] shadow-xs'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-[#FAF6EC] group-hover:text-[#8B1C2D]'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight">{item.label}</div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{item.sub}</div>
                </div>
              </div>

              {item.badge !== null && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="pt-3 border-t border-slate-100 space-y-2.5">
        {/* Urgent 7-Day Alert Widget */}
        {urgent7DayCount > 0 && onOpenUrgentAlertModal && (
          <div className="p-3 bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-xl border border-rose-200 shadow-2xs">
            <div className="flex items-center justify-between text-rose-800 text-xs font-bold mb-1">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                </span>
                <span>ด่วน! เอกสารใกล้หมด</span>
              </div>
              <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-full">
                {urgent7DayCount}
              </span>
            </div>
            <p className="text-[11px] text-rose-700 leading-relaxed mb-2">
              พบเอกสารครบกำหนดภายใน 7 วัน โปรดดำเนินการ
            </p>
            <button
              onClick={onOpenUrgentAlertModal}
              className="w-full py-1.5 px-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>เปิดดูรายชื่อด่วน</span>
            </button>
          </div>
        )}

        {/* Compliance / Status Footer Badge */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
          <div className="flex items-center gap-1.5 text-slate-800 text-[11px] font-bold mb-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>มาตรฐานแรงงาน & ม.33</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            รองรับระเบียบแรงงานไทย และระบบ MOU คนต่างด้าว
          </p>
        </div>
      </div>
    </aside>
  );
};
