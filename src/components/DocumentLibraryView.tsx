import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileUp, FileText, Trash2, Download, Wand2, AlertTriangle, BookOpen, History } from 'lucide-react';
import {
  DocTemplate,
  DocTemplateCategory,
  DOC_TEMPLATE_CATEGORY_LABELS,
  Employee,
  ContractSettings,
  GeneratedDocumentRecord,
} from '../types';
import {
  DOCX_MIME,
  MAX_TEMPLATE_BYTES,
  DocxTemplateError,
  arrayBufferToBase64,
  inspectDocx,
  diagnosePlaceholders,
  renderDocx,
  safeFileName,
  downloadBlob,
} from '../utils/docxTemplate';
import { PLACEHOLDER_CATALOG, KNOWN_PLACEHOLDER_KEYS, buildEmployeeDocData, formatThaiDate } from '../utils/employeeDocData';
import { HR_CHECKLIST_ITEMS } from '../data/hrChecklist';
import { showConfirmDialog, showErrorAlert, showToast } from '../utils/swal';

interface DocumentLibraryViewProps {
  templates: DocTemplate[];
  employees: Employee[];
  generatedDocs: GeneratedDocumentRecord[];
  contractSettings: ContractSettings;
  currentUserEmail?: string;
  /** เปิดมาจากเช็คลิสต์: เลือกเทมเพลตและพนักงานไว้ให้ */
  preselect?: { templateId: string; employeeId: string } | null;
  onSaveTemplate: (t: DocTemplate) => Promise<boolean> | boolean;
  onDeleteTemplate: (id: string) => void;
  onRecordGenerated: (r: GeneratedDocumentRecord) => void;
}

export const DocumentLibraryView: React.FC<DocumentLibraryViewProps> = ({
  templates,
  employees,
  generatedDocs,
  contractSettings,
  currentUserEmail,
  preselect,
  onSaveTemplate,
  onDeleteTemplate,
  onRecordGenerated,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<DocTemplateCategory>('OTHER');
  const [checklistKey, setChecklistKey] = useState('');
  const [pendingFile, setPendingFile] = useState<{ fileName: string; size: number; base64: string; placeholders: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [showCatalog, setShowCatalog] = useState(false);

  useEffect(() => {
    if (preselect) {
      setSelectedTemplateId(preselect.templateId);
      setSelectedEmployeeIds([preselect.employeeId]);
    }
  }, [preselect]);

  const activeEmployees = useMemo(() => employees.filter((e) => !e.resignation?.isResigned), [employees]);
  const selectableEmployees = useMemo(() => {
    // ถ้าเปิดมาจากเช็คลิสต์ (อาจเป็นพนักงานที่ลาออก) ให้ยังเลือกได้
    const pre = preselect ? employees.find((e) => e.id === preselect.employeeId) : undefined;
    return pre && !activeEmployees.some((e) => e.id === pre.id) ? [pre, ...activeEmployees] : activeEmployees;
  }, [employees, activeEmployees, preselect]);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const todayIso = new Date().toISOString().slice(0, 10);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.docx')) {
      await showErrorAlert('ไฟล์ไม่รองรับ', 'ใช้ได้เฉพาะไฟล์ Word นามสกุล .docx (ถ้าเป็น .doc เก่า ให้เปิดใน Word แล้ว Save As เป็น .docx ก่อน)');
      return;
    }
    if (file.size > MAX_TEMPLATE_BYTES) {
      await showErrorAlert(
        'ไฟล์ใหญ่เกินไป',
        `ไฟล์ต้องไม่เกิน ${Math.round(MAX_TEMPLATE_BYTES / 1024)} KB (ไฟล์นี้ ${Math.round(file.size / 1024)} KB) เพราะเก็บในฐานข้อมูลโดยตรง ลองบีบอัดรูปภาพในเอกสารให้เล็กลง`
      );
      return;
    }
    try {
      const buf = await file.arrayBuffer();
      const { placeholders } = inspectDocx(buf);
      setPendingFile({ fileName: file.name, size: file.size, base64: arrayBufferToBase64(buf), placeholders });
      if (!name) setName(file.name.replace(/\.docx$/i, ''));
    } catch (err) {
      await showErrorAlert('อ่านไฟล์ไม่สำเร็จ', err instanceof DocxTemplateError ? err.message : 'ไฟล์อาจเสียหายหรือไม่ใช่ .docx');
    }
  };

  const resetUpload = () => {
    setPendingFile(null);
    setName('');
    setCode('');
    setCategory('OTHER');
    setChecklistKey('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSave = async () => {
    if (!pendingFile || !name.trim()) return;
    setBusy(true);
    const now = new Date().toISOString();
    const tpl: DocTemplate = {
      id: `TPL-${Date.now()}`,
      name: name.trim(),
      code: code.trim() || undefined,
      category,
      checklistKey: checklistKey || undefined,
      fileName: pendingFile.fileName,
      fileSize: pendingFile.size,
      contentBase64: pendingFile.base64,
      placeholders: pendingFile.placeholders,
      createdAt: now,
      updatedAt: now,
    };
    try {
      const ok = await onSaveTemplate(tpl);
      if (ok === false) {
        await showErrorAlert('บันทึกไม่สำเร็จ', 'พื้นที่จัดเก็บเต็มหรือเชื่อมต่อฐานข้อมูลไม่ได้ ลองลดขนาดไฟล์หรือเข้าสู่ระบบก่อน');
      } else {
        showToast('เพิ่มเทมเพลตแล้ว');
        resetUpload();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (t: DocTemplate) => {
    if (await showConfirmDialog('ลบเทมเพลต?', `ลบ "${t.name}" (ประวัติการสร้างเอกสารเดิมจะยังอยู่)`, 'ลบ')) {
      onDeleteTemplate(t.id);
      if (selectedTemplateId === t.id) setSelectedTemplateId('');
    }
  };

  const toggleEmployee = (id: string) =>
    setSelectedEmployeeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const previews = useMemo(() => {
    if (!selectedTemplate) return [];
    return selectedEmployeeIds
      .map((id) => employees.find((e) => e.id === id))
      .filter((e): e is Employee => !!e)
      .map((emp) => {
        const data = buildEmployeeDocData(emp, contractSettings, todayIso);
        return { emp, data, diag: diagnosePlaceholders(selectedTemplate.placeholders, data, KNOWN_PLACEHOLDER_KEYS) };
      });
  }, [selectedTemplate, selectedEmployeeIds, employees, contractSettings, todayIso]);

  const handleGenerate = async () => {
    if (!selectedTemplate || previews.length === 0) return;
    const withEmpty = previews.filter((p) => p.diag.empty.length > 0);
    if (withEmpty.length > 0) {
      const ok = await showConfirmDialog(
        'ข้อมูลบางช่องยังว่าง',
        `${withEmpty.length} คนมีตัวแปรที่ไม่มีข้อมูล จะถูกเว้นว่างในเอกสาร ต้องการสร้างต่อหรือไม่?`,
        'สร้างต่อ'
      );
      if (!ok) return;
    }
    let okCount = 0;
    for (const p of previews) {
      try {
        const blob = renderDocx(selectedTemplate.contentBase64, p.data);
        const fileName = `${safeFileName(selectedTemplate.name)}_${safeFileName(p.emp.fullName)}.docx`;
        downloadBlob(blob, fileName);
        onRecordGenerated({
          id: `GEN-${Date.now()}-${p.emp.id}`,
          templateId: selectedTemplate.id,
          templateName: selectedTemplate.name,
          checklistKey: selectedTemplate.checklistKey,
          employeeId: p.emp.id,
          employeeName: p.emp.fullName,
          fileName,
          generatedAt: new Date().toISOString(),
          generatedBy: currentUserEmail,
        });
        okCount++;
      } catch (err) {
        await showErrorAlert(`สร้างเอกสารของ ${p.emp.fullName} ไม่สำเร็จ`, err instanceof Error ? err.message : undefined);
      }
    }
    if (okCount > 0) showToast(`สร้างเอกสารแล้ว ${okCount} ฉบับ`);
  };

  const pendingUnknown = pendingFile ? pendingFile.placeholders.filter((k) => !KNOWN_PLACEHOLDER_KEYS.has(k)) : [];
  const groupedCatalog = useMemo(() => {
    const m = new Map<string, typeof PLACEHOLDER_CATALOG>();
    PLACEHOLDER_CATALOG.forEach((p) => m.set(p.group, [...(m.get(p.group) || []), p]));
    return Array.from(m.entries());
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" /> คลังเอกสาร
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          แนบเทมเพลต Word (.docx) แล้วพิมพ์ตัวแปรในเอกสารเป็น <code className="px-1 bg-slate-100 rounded">{'{{full_name}}'}</code> ระบบจะดึงข้อมูลพนักงานมาเติมให้
        </p>
      </div>

      {/* อัปโหลด */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><FileUp className="w-4 h-4" /> เพิ่มเทมเพลตใหม่</h3>
        <input
          ref={fileRef}
          type="file"
          accept={`.docx,${DOCX_MIME}`}
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="text-sm"
        />
        {pendingFile && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-slate-600">ชื่อเทมเพลต *
                <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-normal" />
              </label>
              <label className="text-xs font-semibold text-slate-600">รหัสเอกสารภายใน (ถ้ามี)
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="เช่น HR-ON-03" className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-normal" />
              </label>
              <label className="text-xs font-semibold text-slate-600">หมวดหมู่
                <select value={category} onChange={(e) => setCategory(e.target.value as DocTemplateCategory)} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-normal bg-white">
                  {(Object.keys(DOC_TEMPLATE_CATEGORY_LABELS) as DocTemplateCategory[]).map((c) => (
                    <option key={c} value={c}>{DOC_TEMPLATE_CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-600">ผูกกับรายการเช็คลิสต์ (ติ๊กให้อัตโนมัติเมื่อสร้างเอกสาร)
                <select value={checklistKey} onChange={(e) => setChecklistKey(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-normal bg-white">
                  <option value="">ไม่ผูก</option>
                  {HR_CHECKLIST_ITEMS.map((i) => (
                    <option key={i.key} value={i.key}>{i.key} {i.title}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="text-xs text-slate-600">
              พบตัวแปรในไฟล์ {pendingFile.placeholders.length} ตัว:{' '}
              {pendingFile.placeholders.length === 0 ? (
                <span className="text-amber-700">ไม่พบ — ตรวจว่าพิมพ์เป็น {'{{ชื่อตัวแปร}}'} ภาษาอังกฤษตามรายการด้านล่าง</span>
              ) : (
                pendingFile.placeholders.map((k) => (
                  <code key={k} className={`mr-1 px-1 rounded ${KNOWN_PLACEHOLDER_KEYS.has(k) ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{k}</code>
                ))
              )}
            </div>
            {pendingUnknown.length > 0 && (
              <div className="text-xs text-rose-700 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                ตัวแปรที่ระบบไม่รู้จัก ({pendingUnknown.join(', ')}) จะถูกเว้นว่าง อาจพิมพ์ผิด
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={busy || !name.trim()} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50">
                บันทึกเทมเพลต
              </button>
              <button onClick={resetUpload} className="px-4 py-2 rounded-lg border border-slate-300 text-sm">ยกเลิก</button>
            </div>
          </div>
        )}
        <button onClick={() => setShowCatalog((v) => !v)} className="text-xs text-indigo-700 font-semibold underline">
          {showCatalog ? 'ซ่อน' : 'ดู'}รายการตัวแปรที่ใช้ได้ ({PLACEHOLDER_CATALOG.length})
        </button>
        {showCatalog && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {groupedCatalog.map(([g, list]) => (
              <div key={g} className="border border-slate-200 rounded-lg p-2.5">
                <div className="font-bold text-slate-700 mb-1">{g}</div>
                {list.map((p) => (
                  <div key={p.key} className="flex justify-between gap-2 py-0.5">
                    <code className="text-indigo-700">{`{{${p.key}}}`}</code>
                    <span className="text-slate-500 text-right">{p.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* รายการเทมเพลต */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-slate-800">เทมเพลตทั้งหมด ({templates.length})</h3>
        {templates.length === 0 && <p className="text-sm text-slate-500">ยังไม่มีเทมเพลต เพิ่มไฟล์ .docx ด้านบนได้เลย</p>}
        {templates.map((t) => (
          <div key={t.id} className={`flex items-center gap-3 border rounded-lg p-2.5 ${selectedTemplateId === t.id ? 'border-indigo-500 bg-indigo-50/40' : 'border-slate-200'}`}>
            <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
            <button className="flex-1 text-left min-w-0" onClick={() => setSelectedTemplateId(t.id)}>
              <div className="text-sm font-semibold text-slate-800 truncate">
                {t.code && <span className="font-mono text-xs text-slate-400 mr-1.5">{t.code}</span>}{t.name}
              </div>
              <div className="text-[11px] text-slate-500">
                {DOC_TEMPLATE_CATEGORY_LABELS[t.category]} · {t.placeholders.length} ตัวแปร · {Math.round(t.fileSize / 1024)} KB
                {t.checklistKey ? ` · ผูก ${t.checklistKey}` : ''}
              </div>
            </button>
            <button onClick={() => handleDelete(t)} aria-label="ลบเทมเพลต" className="p-1.5 text-rose-600 hover:bg-rose-50 rounded">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </section>

      {/* สร้างเอกสาร */}
      {selectedTemplate && (
        <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Wand2 className="w-4 h-4" /> สร้างเอกสารจาก "{selectedTemplate.name}"
          </h3>
          <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y">
            {selectableEmployees.map((e) => (
              <label key={e.id} className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-slate-50">
                <input type="checkbox" checked={selectedEmployeeIds.includes(e.id)} onChange={() => toggleEmployee(e.id)} />
                <span className="font-mono text-xs text-slate-400">{e.id}</span>
                <span>{e.fullName}</span>
              </label>
            ))}
            {selectableEmployees.length === 0 && <div className="p-3 text-sm text-slate-500">ยังไม่มีพนักงาน</div>}
          </div>
          {previews.map((p) => (
            <div key={p.emp.id} className="text-xs border border-slate-200 rounded-lg p-2.5">
              <div className="font-semibold text-slate-700">{p.emp.fullName}</div>
              {p.diag.empty.length > 0 ? (
                <div className="text-amber-700 mt-0.5">ข้อมูลที่ยังว่าง: {p.diag.empty.join(', ')}</div>
              ) : (
                <div className="text-emerald-700 mt-0.5">ข้อมูลครบทุกตัวแปร</div>
              )}
              {p.diag.unknown.length > 0 && <div className="text-rose-700">ตัวแปรที่ไม่รู้จัก: {p.diag.unknown.join(', ')}</div>}
            </div>
          ))}
          <button
            onClick={handleGenerate}
            disabled={previews.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> สร้างและดาวน์โหลด ({previews.length} ฉบับ)
          </button>
        </section>
      )}

      {/* ประวัติ */}
      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2"><History className="w-4 h-4" /> ประวัติการสร้างเอกสาร</h3>
        {generatedDocs.length === 0 ? (
          <p className="text-sm text-slate-500">ยังไม่มีประวัติ</p>
        ) : (
          <ul className="divide-y text-sm max-h-72 overflow-y-auto">
            {generatedDocs.slice(0, 100).map((g) => (
              <li key={g.id} className="py-1.5 flex justify-between gap-3">
                <span className="truncate">{g.templateName} → {g.employeeName}</span>
                <span className="text-xs text-slate-500 shrink-0">{formatThaiDate(g.generatedAt.slice(0, 10))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
