import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  FileText,
  Wand2,
  Zap,
  Hand,
  CalendarClock,
} from 'lucide-react';
import {
  Employee,
  DocTemplate,
  GeneratedDocumentRecord,
  EmploymentContract,
  HrChecklistEntry,
} from '../types';
import {
  HR_CHECKLIST_GROUP_LABELS,
  HrChecklistGroup,
  getApplicableChecklistItems,
  resolveChecklistStatus,
  buildChecklistContext,
  summarizeChecklist,
} from '../data/hrChecklist';
import { formatThaiDate } from '../utils/employeeDocData';
import { SocialSecurityPanel } from './SocialSecurityPanel';

interface EmployeeHrChecklistProps {
  employee: Employee;
  templates: DocTemplate[];
  generatedDocs: GeneratedDocumentRecord[];
  contracts: EmploymentContract[];
  onUpdateEmployee?: (updated: Employee) => void;
  /** เปิดหน้าคลังเอกสารพร้อมเลือกเทมเพลต/พนักงานไว้ให้ */
  onGenerateFromTemplate?: (templateId: string, employeeId: string) => void;
}

const SOURCE_LABEL: Record<string, { text: string; cls: string; Icon: React.ElementType }> = {
  manual: { text: 'ติ๊กเอง', cls: 'bg-slate-100 text-slate-700', Icon: Hand },
  generated: { text: 'สร้างจากคลังเอกสาร', cls: 'bg-indigo-50 text-indigo-700', Icon: FileText },
  auto: { text: 'ตรวจจากข้อมูลในระบบ', cls: 'bg-emerald-50 text-emerald-700', Icon: Zap },
};

export const EmployeeHrChecklist: React.FC<EmployeeHrChecklistProps> = ({
  employee,
  templates,
  generatedDocs,
  contracts,
  onUpdateEmployee,
  onGenerateFromTemplate,
}) => {
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const todayIso = new Date().toISOString().slice(0, 10);

  const statuses = useMemo(() => {
    const ctx = buildChecklistContext(employee, generatedDocs, contracts);
    return getApplicableChecklistItems(employee).map((item) =>
      resolveChecklistStatus(item, employee, ctx, todayIso)
    );
  }, [employee, generatedDocs, contracts, todayIso]);

  const summary = summarizeChecklist(statuses);

  const grouped = useMemo(() => {
    const map = new Map<HrChecklistGroup, typeof statuses>();
    statuses.forEach((s) => {
      const list = map.get(s.item.group) || [];
      list.push(s);
      map.set(s.item.group, list);
    });
    return Array.from(map.entries());
  }, [statuses]);

  const setEntry = (key: string, entry: HrChecklistEntry) => {
    if (!onUpdateEmployee) return;
    onUpdateEmployee({
      ...employee,
      hrChecklist: { ...(employee.hrChecklist || {}), [key]: entry },
    });
  };

  const toggle = (key: string, currentlyDone: boolean) => {
    const prevNote = employee.hrChecklist?.[key]?.note;
    setEntry(key, {
      done: !currentlyDone,
      doneAt: !currentlyDone ? todayIso : undefined,
      note: prevNote,
    });
  };

  const saveNote = (key: string, done: boolean) => {
    const prev = employee.hrChecklist?.[key];
    const note = (noteDraft[key] ?? prev?.note ?? '').trim();
    setEntry(key, { done: prev?.done ?? done, doneAt: prev?.doneAt, note: note || undefined });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-bold text-slate-800">
            เช็คลิสต์เอกสาร HR ของ {employee.fullName}
          </div>
          <div className="text-sm font-semibold text-slate-700">
            {summary.done}/{summary.total} รายการ ({summary.percent}%)
          </div>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${summary.percent}%` }} />
        </div>
        {summary.overdue > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
            <AlertTriangle className="w-3.5 h-3.5" /> เกินกำหนด {summary.overdue} รายการ
          </div>
        )}
        <p className="mt-2 text-[11px] text-slate-500">
          ลำดับความสำคัญ: ที่ติ๊กเอง &gt; ที่สร้างจากคลังเอกสาร &gt; ที่ตรวจจากข้อมูลพนักงานในระบบ
          ยกเลิกการติ๊กได้ ซึ่งจะมีผลเหนือการตรวจอัตโนมัติ
        </p>
      </div>

      {grouped.map(([group, list]) => (
        <section key={group}>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
            {HR_CHECKLIST_GROUP_LABELS[group]}
          </h4>
          <ul className="space-y-2">
            {list.map((s) => {
              const tpl = templates.find((t) => t.checklistKey === s.item.key);
              const src = SOURCE_LABEL[s.source];
              return (
                <li
                  key={s.item.key}
                  className={`rounded-lg border p-3 ${
                    s.isOverdue ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggle(s.item.key, s.done)}
                      disabled={!onUpdateEmployee}
                      aria-label={s.done ? 'ยกเลิกการติ๊ก' : 'ติ๊กว่าทำแล้ว'}
                      className="mt-0.5 shrink-0"
                    >
                      {s.done ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400">{s.item.key}</span>
                        <span className={`text-sm font-semibold ${s.done ? 'text-slate-500' : 'text-slate-800'}`}>
                          {s.item.title}
                        </span>
                        {s.item.officialForm && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold">
                            {s.item.officialForm}
                            {s.item.formVerified === false ? ' (ตรวจสอบรหัสแบบฟอร์มอีกครั้ง)' : ''}
                          </span>
                        )}
                      </div>
                      {s.item.hint && <div className="text-xs text-slate-500 mt-0.5">{s.item.hint}</div>}

                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
                        {src && (
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${src.cls}`}>
                            <src.Icon className="w-3 h-3" /> {src.text}
                          </span>
                        )}
                        {s.done && s.doneAt && (
                          <span className="text-slate-500">เมื่อ {formatThaiDate(s.doneAt)}</span>
                        )}
                        {s.dueDate && (
                          <span
                            className={`inline-flex items-center gap-1 ${
                              s.isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500'
                            }`}
                          >
                            <CalendarClock className="w-3 h-3" /> กำหนด {formatThaiDate(s.dueDate)}
                            {s.isOverdue ? ' (เกินกำหนด)' : ''}
                          </span>
                        )}
                        {tpl && onGenerateFromTemplate && !s.done && (
                          <button
                            type="button"
                            onClick={() => onGenerateFromTemplate(tpl.id, employee.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                          >
                            <Wand2 className="w-3 h-3" /> สร้างเอกสาร ({tpl.name})
                          </button>
                        )}
                      </div>

                      {onUpdateEmployee && (
                        <input
                          type="text"
                          placeholder="หมายเหตุ (เช่น เลขที่หนังสือ / ผู้รับผิดชอบ)"
                          value={noteDraft[s.item.key] ?? s.note ?? ''}
                          onChange={(e) => setNoteDraft((p) => ({ ...p, [s.item.key]: e.target.value }))}
                          onBlur={() => {
                            const cur = noteDraft[s.item.key];
                            if (cur !== undefined && cur !== (s.note ?? '')) saveNote(s.item.key, s.done);
                          }}
                          className="mt-2 w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs"
                        />
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">ประกันสังคม</h4>
        <SocialSecurityPanel defaultWage={employee.salary || 0} />
      </section>
    </div>
  );
};
