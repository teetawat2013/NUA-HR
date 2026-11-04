import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

/**
 * เติมข้อมูลลงเทมเพลต Word (.docx) โดยใช้ตัวแปรรูปแบบ {{ชื่อตัวแปร}}
 * ทำงานในเบราว์เซอร์ทั้งหมด ไฟล์ไม่ถูกส่งออกนอกเครื่องยกเว้นที่ระบบบันทึกเทมเพลตไว้เอง
 */

export const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** ขนาดเทมเพลตสูงสุดหลังเข้ารหัส base64 ต้องต่ำกว่าเพดานเอกสาร Firestore (1 MiB) */
export const MAX_TEMPLATE_BYTES = 700 * 1024;

const PLACEHOLDER_RE = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

export function base64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function decodeXmlText(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** ข้อความของแต่ละย่อหน้า (Word มักแตกตัวแปรเป็นหลาย run จึงต้องรวมข้อความก่อนค้นหา) */
function paragraphTexts(xml: string): string[] {
  const paragraphs = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || [];
  return paragraphs.map((p) => {
    const parts = p.match(/<w:t(?:\s[^>]*)?>[\s\S]*?<\/w:t>/g) || [];
    return decodeXmlText(parts.map((t) => t.replace(/<[^>]+>/g, '')).join(''));
  });
}

/** รายชื่อตัวแปรที่พบในไฟล์ (เนื้อหา หัวกระดาษ ท้ายกระดาษ) เรียงตามที่พบครั้งแรก */
export function extractPlaceholders(bytes: Uint8Array | ArrayBuffer): string[] {
  const zip = new PizZip(bytes as ArrayBuffer);
  const found: string[] = [];
  const seen = new Set<string>();

  Object.keys(zip.files)
    .filter((name) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(name))
    .forEach((name) => {
      const xml = zip.file(name)?.asText() || '';
      paragraphTexts(xml).forEach((text) => {
        for (const m of text.matchAll(PLACEHOLDER_RE)) {
          if (!seen.has(m[1])) {
            seen.add(m[1]);
            found.push(m[1]);
          }
        }
      });
    });

  return found;
}

export class DocxTemplateError extends Error {}

/** ตรวจว่าเป็นไฟล์ .docx ที่เปิดได้จริง และคืนตัวแปรที่พบ */
export function inspectDocx(buffer: ArrayBuffer): { placeholders: string[] } {
  let zip: PizZip;
  try {
    zip = new PizZip(buffer);
  } catch {
    throw new DocxTemplateError('ไฟล์นี้ไม่ใช่ไฟล์ Word (.docx) ที่ถูกต้อง');
  }
  if (!zip.file('word/document.xml')) {
    throw new DocxTemplateError('ไม่พบเนื้อหาเอกสาร Word ในไฟล์นี้ (รองรับเฉพาะ .docx ไม่รองรับ .doc เก่า)');
  }
  return { placeholders: extractPlaceholders(buffer) };
}

/** ตัวแปรในเทมเพลตที่ไม่มีข้อมูล (ค่าว่าง) หรือไม่รู้จัก */
export function diagnosePlaceholders(
  placeholders: string[],
  data: Record<string, string>,
  knownKeys: Set<string>
): { empty: string[]; unknown: string[] } {
  return {
    empty: placeholders.filter((k) => knownKeys.has(k) && !data[k]),
    unknown: placeholders.filter((k) => !knownKeys.has(k)),
  };
}

/** เติมข้อมูลแล้วคืนไฟล์ .docx (ตัวแปรที่ไม่มีข้อมูลจะเป็นช่องว่าง) */
export function renderDocx(base64: string, data: Record<string, string>): Blob {
  const zip = new PizZip(base64ToUint8Array(base64) as unknown as ArrayBuffer);
  let doc: Docxtemplater;
  try {
    doc = new Docxtemplater(zip, {
      delimiters: { start: '{{', end: '}}' },
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => '',
    });
    doc.render(data);
  } catch (err: any) {
    const first = err?.properties?.errors?.[0]?.properties?.explanation;
    throw new DocxTemplateError(
      first
        ? `เทมเพลตมีรูปแบบตัวแปรไม่ถูกต้อง: ${first}`
        : `สร้างเอกสารไม่สำเร็จ: ${err?.message || 'ไม่ทราบสาเหตุ'}`
    );
  }
  return doc.getZip().generate({ type: 'blob', mimeType: DOCX_MIME, compression: 'DEFLATE' });
}

export function safeFileName(s: string): string {
  return s.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim();
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
