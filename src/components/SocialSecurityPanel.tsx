import React, { useMemo, useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import {
  calculateSocialSecurity,
  SSO_WAGE_PERIODS,
  SSO_RATE,
  SSO_MIN_WAGE,
} from '../utils/socialSecurity';

interface SocialSecurityPanelProps {
  /** ค่าจ้างเริ่มต้น (เงินเดือนของพนักงานที่เก็บในระบบ) */
  defaultWage: number;
}

const fmt = (n: number) => n.toLocaleString('th-TH', { maximumFractionDigits: 2 });

export const SocialSecurityPanel: React.FC<SocialSecurityPanelProps> = ({ defaultWage }) => {
  const thisYear = new Date().getFullYear();
  const [wageInput, setWageInput] = useState<string>(String(defaultWage || ''));
  const [year, setYear] = useState<number>(thisYear);

  const wage = Number(wageInput.replace(/,/g, '')) || 0;
  const result = useMemo(() => calculateSocialSecurity(wage, year), [wage, year]);

  const yearOptions = [thisYear - 1, thisYear, thisYear + 1, 2029, 2032]
    .filter((y, i, arr) => arr.indexOf(y) === i)
    .sort((a, b) => a - b);

  return (
    <div className="border border-slate-200 rounded-xl bg-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Calculator className="w-4 h-4 text-emerald-600" />
        <h4 className="text-sm font-bold text-slate-800">คำนวณเงินสมทบประกันสังคม (มาตรา 33)</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs font-semibold text-slate-600">
          ค่าจ้างต่อเดือน (บาท)
          <input
            type="text"
            inputMode="decimal"
            value={wageInput}
            onChange={(e) => setWageInput(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-normal"
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          ปีที่คำนวณ (ค.ศ.)
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-normal bg-white"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y} (พ.ศ. {y + 543})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-emerald-50 p-2.5">
          <div className="text-[11px] text-emerald-700 font-semibold">ลูกจ้างจ่าย</div>
          <div className="text-lg font-bold text-emerald-800">{fmt(result.employee)}</div>
        </div>
        <div className="rounded-lg bg-blue-50 p-2.5">
          <div className="text-[11px] text-blue-700 font-semibold">นายจ้างจ่าย</div>
          <div className="text-lg font-bold text-blue-800">{fmt(result.employer)}</div>
        </div>
        <div className="rounded-lg bg-slate-100 p-2.5">
          <div className="text-[11px] text-slate-600 font-semibold">รวมนำส่ง</div>
          <div className="text-lg font-bold text-slate-800">{fmt(result.total)}</div>
        </div>
      </div>

      <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 font-mono break-words">
        {result.formula}
      </div>

      <details className="text-xs text-slate-600">
        <summary className="cursor-pointer font-semibold flex items-center gap-1">
          <Info className="w-3.5 h-3.5" /> เงื่อนไขและเพดานค่าจ้างตามช่วงปี
        </summary>
        <ul className="mt-2 space-y-1 pl-4 list-disc">
          <li>
            อัตราสมทบ {SSO_RATE * 100}% ของค่าจ้าง ฝ่ายละเท่ากัน ค่าจ้างขั้นต่ำที่ใช้คำนวณ {fmt(SSO_MIN_WAGE)} บาท
          </li>
          {SSO_WAGE_PERIODS.map((p) => (
            <li key={p.fromYear}>
              {p.label}: เพดานค่าจ้าง {fmt(p.maxWage)} บาท (สมทบสูงสุด {fmt(Math.round(p.maxWage * SSO_RATE))} บาท/ฝ่าย)
            </li>
          ))}
          <li>ปัดเศษเป็นบาท (ครึ่งขึ้น) ควรเทียบกับตารางของสำนักงานประกันสังคมก่อนนำส่งจริง</li>
        </ul>
      </details>
    </div>
  );
};
