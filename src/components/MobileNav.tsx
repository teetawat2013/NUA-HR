import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Globe2, 
  CalendarClock, 
  DollarSign, 
  FileSpreadsheet,
  UserMinus,
  CalendarDays,
  UserPlus,
  FileSignature
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface MobileNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  expiringDocsCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onSelectTab,
  expiringDocsCount,
}) => {
  const items = [
    { id: 'dashboard' as NavTab, label: 'แดชบอร์ด', icon: LayoutDashboard },
    { id: 'employees' as NavTab, label: 'พนักงาน', icon: Users },
    { 
      id: 'foreign' as NavTab, 
      label: 'ต่างด้าว', 
      icon: Globe2, 
      badge: expiringDocsCount > 0 ? expiringDocsCount : null 
    },
    { 
      id: 'attendance' as NavTab, 
      label: 'เวลา/Part-time', 
      icon: CalendarClock,
    },
    { 
      id: 'calendar' as NavTab, 
      label: 'ปฏิทิน', 
      icon: CalendarDays,
    },
    { 
      id: 'payroll' as NavTab, 
      label: 'เงินเดือน', 
      icon: DollarSign,
    },
    { 
      id: 'contracts' as NavTab, 
      label: 'สัญญาจ้าง', 
      icon: FileSignature,
    },
    { 
      id: 'recruitment' as NavTab, 
      label: 'รับสมัคร', 
      icon: UserPlus,
    },
    { id: 'report' as NavTab, label: 'รายงาน', icon: FileSpreadsheet },
    { id: 'resigned' as NavTab, label: 'ลาออกแล้ว', icon: UserMinus },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg md:hidden overflow-x-auto">
      <div className="flex items-center justify-around min-w-[360px]">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition min-w-[50px] ${
                isActive ? 'text-[#8B1C2D] font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight whitespace-nowrap">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-[#8B1C2D] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
