import React, { useState } from 'react';
import { 
  UserMinus, 
  Search, 
  Eye, 
  RotateCcw, 
  Calendar, 
  FileText, 
  Globe2,
  CheckCircle2
} from 'lucide-react';
import { Employee } from '../types';
import { formatCurrency } from '../utils/payrollCalculator';
import { showConfirmDialog } from '../utils/swal';

interface ResignedDatabaseViewProps {
  employees: Employee[];
  onViewEmployee: (employee: Employee) => void;
  onRestoreEmployee: (employeeId: string) => void;
}

export const ResignedDatabaseView: React.FC<ResignedDatabaseViewProps> = ({
  employees,
  onViewEmployee,
  onRestoreEmployee,
}) => {
  const resignedEmployees = employees.filter(e => e.resignation.isResigned);

  const [search, setSearch] = useState('');

  const filtered = resignedEmployees.filter(emp => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matchName = emp.fullName.toLowerCase().includes(q);
    const matchId = emp.id.toLowerCase().includes(q);
    const matchReason = emp.resignation.reason?.toLowerCase().includes(q);
    const matchDate = emp.resignation.resignationDate?.toLowerCase().includes(q);
    return matchName || matchId || matchReason || matchDate;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              ฐานข้อมูลผู้พนักงานที่ลาออกแล้ว (Resigned Archives)
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserMinus className="w-5 h-5 text-rose-600" />
            <span>ฐานข้อมูลประวัติพนักงานที่พ้นสภาพ / ลาออกแล้ว</span>
          </h2>
          <p className="text-xs text-slate-500">
            เก็บบันทึกประวัติ วันที่ลาออก เหตุผลการลาออก และสถิติย้อนหลังอย่างปลอดภัย
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ, รหัส, วันที่ลาออก..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            พนักงานที่ลาออกทั้งหมด: {resignedEmployees.length} คน
          </span>
          <span className="text-xs text-slate-400">
            แสดงผล {filtered.length} รายการ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-4">พนักงาน / รหัส</th>
                <th className="p-4">สัญชาติ</th>
                <th className="p-4">ตำแหน่ง & แผนก</th>
                <th className="p-4">วันที่ลาออก</th>
                <th className="p-4">สาเหตุการลาออก</th>
                <th className="p-4">เงินเดือนสุดท้าย</th>
                <th className="p-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition">
                    
                    {/* Name */}
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{emp.fullName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{emp.id}</p>
                    </td>

                    {/* Nationality */}
                    <td className="p-4">
                      {emp.isForeignWorker ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          {emp.nationalityText}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          ไทย
                        </span>
                      )}
                    </td>

                    {/* Position */}
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">{emp.position}</p>
                      <p className="text-[11px] text-slate-400">{emp.department}</p>
                    </td>

                    {/* Resignation Date */}
                    <td className="p-4">
                      <span className="px-2 py-1 bg-rose-50 text-rose-700 rounded-md font-semibold border border-rose-200 inline-block text-[11px]">
                        {emp.resignation.resignationDate || '-'}
                      </span>
                    </td>

                    {/* Reason */}
                    <td className="p-4 text-slate-600 max-w-xs truncate">
                      {emp.resignation.reason || 'ลาออกตามความประสงค์'}
                    </td>

                    {/* Salary */}
                    <td className="p-4 font-medium text-slate-800">
                      {formatCurrency(emp.salary)}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewEmployee(emp)}
                          title="ดูประวัติพนักงานฉบับเต็ม"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            const confirmed = await showConfirmDialog(
                              'ยืนยันการรับกลับเข้าทำงาน',
                              `ต้องการดึงคุณ "${emp.fullName}" กลับเข้าสู่สถานะพนักงานปัจจุบัน (Re-hire) หรือไม่?`,
                              'ยืนยันรับกลับ'
                            );
                            if (confirmed) {
                              onRestoreEmployee(emp.id);
                            }
                          }}
                          title="ดึงกลับสู่สถานะพนักงานปัจจุบัน (Re-hire)"
                          className="px-2 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>รับกลับ</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    ไม่มีข้อมูลพนักงานที่ลาออก
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
