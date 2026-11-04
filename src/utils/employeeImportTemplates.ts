import { DEPARTMENTS, BRANCHES } from '../types';

export interface ColumnGuide {
  name: string;
  key: string;
  required: boolean;
  type: string;
  description: string;
  example: string;
  acceptedValues?: string[];
}

export interface ImportTemplateDefinition {
  id: 'standard' | 'thai' | 'foreign' | 'quick';
  title: string;
  shortTitle: string;
  description: string;
  badge: string;
  filename: string;
  headers: string[];
  sampleRows: string[][];
  columnsGuide: ColumnGuide[];
}

export const IMPORT_TEMPLATES: Record<string, ImportTemplateDefinition> = {
  standard: {
    id: 'standard',
    title: 'เทมเพลตมาตรฐานครบถ้วน (Standard Full Template)',
    shortTitle: 'มาตรฐานครบถ้วน',
    description: 'เหมาะสำหรับบันทึกข้อมูลพนักงานทุกประเภท รองรับทั้งพนักงานไทยและแรงงานต่างด้าว มีข้อมูลครบทุกฟิลด์',
    badge: 'แนะนำสำหรับการเริ่มต้น',
    filename: 'hrm_pro_employee_template_standard.csv',
    headers: [
      'รหัสพนักงาน',
      'ชื่อ-นามสกุล',
      'ชื่อเล่น',
      'เลขบัตรประชาชน/เอกสาร',
      'วันเกิด (YYYY-MM-DD)',
      'เบอร์โทรศัพท์',
      'ตำแหน่ง',
      'แผนก',
      'สาขา',
      'วันที่เริ่มงาน (YYYY-MM-DD)',
      'ประเภทการจ้าง (FULL_TIME/PROBATION/CONTRACT/DAILY)',
      'เงินเดือน (บาท)',
      'เบี้ยเลี้ยง (บาท)',
      'สัญชาติ (ไทย/เมียนมา/ลาว/กัมพูชา)',
      'เลขพาสปอร์ต (ถ้ามี)',
      'เลขใบอนุญาตทำงาน (ถ้ามี)',
      'ที่อยู่'
    ],
    sampleRows: [
      [
        'EMP-010',
        'สมศักดิ์ รักชาติไทย',
        'ศักดิ์',
        '1100501234567',
        '1992-05-15',
        '089-123-4567',
        'หัวหน้าเชฟ (Head Chef)',
        'แผนกครัว',
        'สำนักงานใหญ่ (เชียงใหม่)',
        '2024-01-10',
        'FULL_TIME',
        '32000',
        '3000',
        'ไทย',
        '',
        '',
        'ต.สุเทพ อ.เมือง จ.เชียงใหม่'
      ],
      [
        'EMP-011',
        'Aung Kyaw (อ่อง จอ)',
        'อ่อง',
        '0005544332211',
        '1996-08-20',
        '092-345-6789',
        'พนักงานบริการหน้าร้าน',
        'แผนกบริการหน้าร้าน',
        'สำนักงานใหญ่ (เชียงใหม่)',
        '2024-03-01',
        'CONTRACT',
        '15000',
        '1500',
        'เมียนมา',
        'MB123456',
        'WP-2024-9988',
        'หอพักพนักงาน อ.เมือง จ.เชียงใหม่'
      ],
      [
        'EMP-012',
        'สุดาภรณ์ จันทร์ดี',
        'น้ำ',
        '3101234567890',
        '1998-11-04',
        '081-987-6543',
        'เจ้าหน้าที่การตลาดและสื่อสาร',
        'แผนกการตลาดและสื่อสาร',
        'สาขานิมมาน',
        '2024-05-15',
        'PROBATION',
        '22000',
        '0',
        'ไทย',
        '',
        '',
        'ต.ช้างเผือก อ.เมือง จ.เชียงใหม่'
      ]
    ],
    columnsGuide: [
      {
        name: 'รหัสพนักงาน',
        key: 'id',
        required: false,
        type: 'ข้อความ',
        description: 'รหัสประจำตัวพนักงาน เช่น EMP-001 (หากเว้นว่าง ระบบจะสร้างรหัสให้อัตโนมัติ)',
        example: 'EMP-010'
      },
      {
        name: 'ชื่อ-นามสกุล',
        key: 'fullName',
        required: true,
        type: 'ข้อความ',
        description: 'คำนำหน้าและชื่อ-สกุลจริงของพนักงาน',
        example: 'สมศักดิ์ รักชาติไทย'
      },
      {
        name: 'ชื่อเล่น',
        key: 'nickname',
        required: false,
        type: 'ข้อความ',
        description: 'ชื่อเล่นของพนักงาน',
        example: 'ศักดิ์'
      },
      {
        name: 'เลขบัตรประชาชน/เอกสาร',
        key: 'idCardNumber',
        required: false,
        type: 'ตัวเลข/ตัวอักษร',
        description: 'เลขบัตรประชาชน 13 หลัก หรือเลขบัตรชมพู',
        example: '1100501234567'
      },
      {
        name: 'วันเกิด',
        key: 'birthDate',
        required: false,
        type: 'วันที่ (YYYY-MM-DD)',
        description: 'วันเดือนปีเกิดรูปแบบสากล ค.ศ.',
        example: '1995-05-15'
      },
      {
        name: 'เบอร์โทรศัพท์',
        key: 'phoneNumber',
        required: false,
        type: 'เบอร์โทร',
        description: 'เบอร์ติดต่อพนักงาน',
        example: '089-123-4567'
      },
      {
        name: 'ตำแหน่ง',
        key: 'position',
        required: true,
        type: 'ข้อความ',
        description: 'ตำแหน่งงานของพนักงาน',
        example: 'หัวหน้าเชฟ (Head Chef)'
      },
      {
        name: 'แผนก',
        key: 'department',
        required: true,
        type: 'ตัวเลือก',
        description: 'แผนกงานที่สังกัด',
        example: 'แผนกครัว',
        acceptedValues: DEPARTMENTS
      },
      {
        name: 'สาขา',
        key: 'branch',
        required: false,
        type: 'ตัวเลือก',
        description: 'สาขาที่ปฏิบัติงาน',
        example: 'สำนักงานใหญ่ (เชียงใหม่)',
        acceptedValues: BRANCHES
      },
      {
        name: 'วันที่เริ่มงาน',
        key: 'startDate',
        required: false,
        type: 'วันที่ (YYYY-MM-DD)',
        description: 'วันแรกที่เริ่มเข้าทำงาน',
        example: '2024-01-10'
      },
      {
        name: 'ประเภทการจ้าง',
        key: 'employmentType',
        required: false,
        type: 'ตัวเลือก',
        description: 'รูปแบบสัญญาจ้างงาน',
        example: 'FULL_TIME',
        acceptedValues: ['FULL_TIME (ประจำ)', 'PROBATION (ทดลองงาน)', 'CONTRACT (สัญญาจ้าง)', 'DAILY (รายวัน)', 'PART_TIME (พาร์ทไทม์)']
      },
      {
        name: 'เงินเดือน',
        key: 'salary',
        required: true,
        type: 'ตัวเลข',
        description: 'เงินเดือนหรือค่าจ้างฐาน (บาท/เดือน)',
        example: '25000'
      },
      {
        name: 'เบี้ยเลี้ยง',
        key: 'allowance',
        required: false,
        type: 'ตัวเลข',
        description: 'เงินช่วยเหลือ/ค่าตำแหน่งเพิ่มเติม (บาท)',
        example: '2000'
      },
      {
        name: 'สัญชาติ',
        key: 'nationalityText',
        required: false,
        type: 'ข้อความ',
        description: 'ระบุ "ไทย", "เมียนมา", "ลาว", หรือ "กัมพูชา"',
        example: 'ไทย'
      },
      {
        name: 'เลขพาสปอร์ต',
        key: 'passport',
        required: false,
        type: 'ข้อความ',
        description: 'เลขหนังสือเดินทาง (สำหรับแรงงานต่างด้าว)',
        example: 'MB123456'
      },
      {
        name: 'เลขใบอนุญาตทำงาน',
        key: 'workPermit',
        required: false,
        type: 'ข้อความ',
        description: 'เลข Work Permit (สำหรับแรงงานต่างด้าว)',
        example: 'WP-2024-9988'
      },
      {
        name: 'ที่อยู่',
        key: 'address',
        required: false,
        type: 'ข้อความ',
        description: 'ที่พักอาศัยหรือที่อยู่ปัจจุบัน',
        example: 'ต.สุเทพ อ.เมือง จ.เชียงใหม่'
      }
    ]
  },

  thai: {
    id: 'thai',
    title: 'เทมเพลตพนักงานคนไทย (Thai Staff Template)',
    shortTitle: 'พนักงานคนไทย',
    description: 'จัดทำโครงสร้างคอลัมน์เฉพาะพนักงานสัญชาติไทย เลขบัตรประชาชน 13 หลัก ข้อมูลติดต่อ และเงินเดือน',
    badge: 'สำหรับพนักงานสัญชาติไทย',
    filename: 'hrm_pro_employee_template_thai.csv',
    headers: [
      'รหัสพนักงาน',
      'ชื่อ-นามสกุล',
      'ชื่อเล่น',
      'เลขบัตรประชาชน (13 หลัก)',
      'วันเกิด (YYYY-MM-DD)',
      'เบอร์โทรศัพท์',
      'ตำแหน่ง',
      'แผนก',
      'สาขา',
      'วันที่เริ่มงาน (YYYY-MM-DD)',
      'ประเภทการจ้าง (FULL_TIME/PROBATION/CONTRACT/DAILY)',
      'เงินเดือน (บาท)',
      'เบี้ยเลี้ยง (บาท)',
      'ที่อยู่ตามทะเบียนบ้าน/ปัจจุบัน'
    ],
    sampleRows: [
      [
        'TH-001',
        'วิชัย ชัยมงคล',
        'ชัย',
        '1509900123456',
        '1990-03-22',
        '081-234-5678',
        'ผู้จัดการฝ่ายการตลาด',
        'แผนกการตลาดและสื่อสาร',
        'สำนักงานใหญ่ (เชียงใหม่)',
        '2023-06-01',
        'FULL_TIME',
        '35000',
        '3500',
        '123/45 ถ.ห้วยแก้ว ต.สุเทพ อ.เมือง จ.เชียงใหม่'
      ],
      [
        'TH-002',
        'กานดา แสงอรุณ',
        'กาน',
        '3501500234567',
        '1994-07-18',
        '086-789-0123',
        'เจ้าหน้าที่บัญชีและการเงิน',
        'แผนกบัญชีและการเงิน',
        'สำนักงานใหญ่ (เชียงใหม่)',
        '2023-11-15',
        'FULL_TIME',
        '24000',
        '1000',
        '88 หมู่ 2 ต.ช้างเผือก อ.เมือง จ.เชียงใหม่'
      ],
      [
        'TH-003',
        'ภานุวัฒน์ ใจดี',
        'นุ',
        '1509900987654',
        '1999-12-05',
        '095-432-1098',
        'พนักงานต้อนรับหน้าร้าน',
        'แผนกบริการหน้าร้าน',
        'สาขารวมโชค',
        '2024-02-01',
        'PROBATION',
        '16000',
        '500',
        '45/1 ต.ฟ้าฮ่าม อ.เมือง จ.เชียงใหม่'
      ]
    ],
    columnsGuide: [
      { name: 'รหัสพนักงาน', key: 'id', required: false, type: 'ข้อความ', description: 'รหัสพนักงาน (ถ้าว่าง ระบบจะรันอัตโนมัติ)', example: 'TH-001' },
      { name: 'ชื่อ-นามสกุล', key: 'fullName', required: true, type: 'ข้อความ', description: 'ชื่อจริงและนามสกุลภาษาไทย', example: 'วิชัย ชัยมงคล' },
      { name: 'ชื่อเล่น', key: 'nickname', required: false, type: 'ข้อความ', description: 'ชื่อเรียกในการทำงาน', example: 'ชัย' },
      { name: 'เลขบัตรประชาชน', key: 'idCardNumber', required: false, type: 'ตัวเลข 13 หลัก', description: 'เลขประจำตัวประชาชนไทย', example: '1509900123456' },
      { name: 'ตำแหน่ง', key: 'position', required: true, type: 'ข้อความ', description: 'ตำแหน่งงาน', example: 'ผู้จัดการฝ่ายการตลาด' },
      { name: 'แผนก', key: 'department', required: true, type: 'ตัวเลือก', description: 'แผนกที่สังกัด', example: 'แผนกการตลาดและสื่อสาร', acceptedValues: DEPARTMENTS },
      { name: 'สาขา', key: 'branch', required: false, type: 'ตัวเลือก', description: 'สาขาประจำ', example: 'สำนักงานใหญ่ (เชียงใหม่)', acceptedValues: BRANCHES },
      { name: 'เงินเดือน (บาท)', key: 'salary', required: true, type: 'ตัวเลข', description: 'เงินเดือนฐาน', example: '35000' }
    ]
  },

  foreign: {
    id: 'foreign',
    title: 'เทมเพลตแรงงานต่างด้าว (Foreign Workers MOU / Pink Card)',
    shortTitle: 'แรงงานต่างด้าว (MOU)',
    description: 'ออกแบบเพื่อการนำเข้าแรงงานต่างด้าวสัญชาติเมียนมา ลาว กัมพูชา ครบทั้ง Passport, Work Permit, และข้อมูลติดตามเอกสาร',
    badge: 'มีคอลัมน์พาสปอร์ต & ใบอนุญาตทำงาน',
    filename: 'hrm_pro_foreign_workers_template.csv',
    headers: [
      'รหัสพนักงาน',
      'ชื่อ-นามสกุล (อังกฤษหรือไทย)',
      'ชื่อเล่น',
      'สัญชาติ (เมียนมา/ลาว/กัมพูชา)',
      'เลขพาสปอร์ต (Passport Number)',
      'เลขใบอนุญาตทำงาน (Work Permit)',
      'เลขบัตรประจำตัวคนต่างด้าว/บัตรชมพู',
      'วันเกิด (YYYY-MM-DD)',
      'เบอร์โทรศัพท์',
      'ตำแหน่ง',
      'แผนก',
      'สาขา',
      'วันที่เริ่มงาน (YYYY-MM-DD)',
      'ประเภทการจ้าง (CONTRACT/FULL_TIME/DAILY)',
      'เงินเดือน (บาท)',
      'เบี้ยเลี้ยง (บาท)',
      'ที่พักอาศัยในประเทศไทย'
    ],
    sampleRows: [
      [
        'FW-001',
        'Kyaw Zaw (จอ ซอ)',
        'จอ',
        'เมียนมา',
        'MB987654',
        'WP-CM-2024-001',
        '0005511223344',
        '1995-04-12',
        '091-234-5678',
        'ผู้ช่วยกุ๊ก',
        'แผนกครัว',
        'สำนักงานใหญ่ (เชียงใหม่)',
        '2023-08-01',
        'CONTRACT',
        '16500',
        '1500',
        'หอพักพนักงานสาขา 1 อ.เมือง จ.เชียงใหม่'
      ],
      [
        'FW-002',
        'Thida Myint (ธิดา มินท์)',
        'ดา',
        'เมียนมา',
        'MB776655',
        'WP-CM-2024-002',
        '0005522334455',
        '1997-10-25',
        '093-456-7890',
        'พนักงานเสิร์ฟและบริการ',
        'แผนกบริการหน้าร้าน',
        'สาขานิมมาน',
        '2023-09-15',
        'CONTRACT',
        '15000',
        '1200',
        'หอพักพนักงานสาขา 2 อ.เมือง จ.เชียงใหม่'
      ],
      [
        'FW-003',
        'Bounmy Sisavath (บุนมี สีสะหวัด)',
        'มี',
        'ลาว',
        'LA332211',
        'WP-CM-2024-003',
        '0005533445566',
        '1996-01-15',
        '094-567-8901',
        'พนักงานจัดเตรียมวัตถุดิบ',
        'แผนกครัว',
        'สาขารวมโชค',
        '2024-01-05',
        'CONTRACT',
        '15500',
        '1000',
        'หอพักพนักงานสาขา 3 อ.เมือง จ.เชียงใหม่'
      ]
    ],
    columnsGuide: [
      { name: 'สัญชาติ', key: 'nationality', required: true, type: 'ตัวเลือก', description: 'ระบุ "เมียนมา", "ลาว", หรือ "กัมพูชา"', example: 'เมียนมา', acceptedValues: ['เมียนมา (Myanmar)', 'ลาว (Laos)', 'กัมพูชา (Cambodia)'] },
      { name: 'เลขพาสปอร์ต', key: 'passport', required: false, type: 'ข้อความ', description: 'เลขหนังสือเดินทางสากล', example: 'MB987654' },
      { name: 'เลขใบอนุญาตทำงาน', key: 'workPermit', required: false, type: 'ข้อความ', description: 'เลขที่ Work Permit กรมการจัดหางาน', example: 'WP-CM-2024-001' },
      { name: 'เลขบัตรชมพู', key: 'pinkCard', required: false, type: 'ตัวเลข 13 หลัก', description: 'เลขประจำตัวคนซึ่งไม่มีสัญชาติไทยขึ้นต้นด้วย 00', example: '0005511223344' },
      { name: 'ตำแหน่ง', key: 'position', required: true, type: 'ข้อความ', description: 'ตำแหน่งงานตรงตามใบอนุญาต', example: 'ผู้ช่วยกุ๊ก' },
      { name: 'แผนก', key: 'department', required: true, type: 'ตัวเลือก', description: 'แผนกที่ปฏิบัติหน้าที่', example: 'แผนกครัว', acceptedValues: DEPARTMENTS },
      { name: 'เงินเดือน (บาท)', key: 'salary', required: true, type: 'ตัวเลข', description: 'ค่าจ้างรายเดือน', example: '16500' }
    ]
  },

  quick: {
    id: 'quick',
    title: 'เทมเพลตด่วนขั้นต่ำ (Quick Minimal Template)',
    shortTitle: 'ด่วนขั้นต่ำ (6 ฟิลด์)',
    description: 'มีเฉพาะ 6 ข้อมูลจำเป็น เหมาะสำหรับการนำเข้าโครงสร้างพนักงานแบบรวดเร็วที่สุด หรือพนักงานรายวัน/ชั่วคราว',
    badge: 'นำเข้าเร็วสุด ใช้เวลาไม่ถึง 1 นาที',
    filename: 'hrm_pro_employee_template_quick.csv',
    headers: [
      'รหัสพนักงาน',
      'ชื่อ-นามสกุล',
      'ตำแหน่ง',
      'แผนก',
      'สาขา',
      'เงินเดือน'
    ],
    sampleRows: [
      [
        'Q-001',
        'สมชาย ชื่นบาน',
        'ผู้ช่วยเชฟ',
        'แผนกครัว',
        'สำนักงานใหญ่ (เชียงใหม่)',
        '18000'
      ],
      [
        'Q-002',
        'วันทนา ดวงมณี',
        'พนักงานแคชเชียร์',
        'แผนกบริการหน้าร้าน',
        'สาขานิมมาน',
        '15500'
      ],
      [
        'Q-003',
        'Aung Min (อ่อง มิน)',
        'พนักงานล้างจานและจัดเตรียม',
        'แผนกครัว',
        'สาขารวมโชค',
        '14500'
      ]
    ],
    columnsGuide: [
      { name: 'รหัสพนักงาน', key: 'id', required: false, type: 'ข้อความ', description: 'รหัสพนักงาน เช่น Q-001 (หากเว้นไว้ ระบบจะตั้งให้อัตโนมัติ)', example: 'Q-001' },
      { name: 'ชื่อ-นามสกุล', key: 'fullName', required: true, type: 'ข้อความ', description: 'ชื่อและนามสกุลของพนักงาน', example: 'สมชาย ชื่นบาน' },
      { name: 'ตำแหน่ง', key: 'position', required: true, type: 'ข้อความ', description: 'ตำแหน่งงาน', example: 'ผู้ช่วยเชฟ' },
      { name: 'แผนก', key: 'department', required: true, type: 'ตัวเลือก', description: 'แผนกที่สังกัด', example: 'แผนกครัว', acceptedValues: DEPARTMENTS },
      { name: 'สาขา', key: 'branch', required: false, type: 'ตัวเลือก', description: 'สาขาประจำ', example: 'สำนักงานใหญ่ (เชียงใหม่)', acceptedValues: BRANCHES },
      { name: 'เงินเดือน', key: 'salary', required: true, type: 'ตัวเลข', description: 'อัตราเงินเดือน (บาท)', example: '18000' }
    ]
  }
};

/**
 * Generate UTF-8 BOM CSV String (for perfect Excel Thai font compatibility)
 */
export const generateCsvContent = (headers: string[], rows: string[][]): string => {
  const lines: string[] = [];
  // Add headers
  lines.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
  // Add rows
  rows.forEach(row => {
    lines.push(row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','));
  });
  // Prefix with UTF-8 BOM \uFEFF
  return '\uFEFF' + lines.join('\r\n');
};

/**
 * Generate TSV (Tab Separated Values) String for direct clipboard paste into Excel / Google Sheets
 */
export const generateTsvContent = (headers: string[], rows: string[][]): string => {
  const lines: string[] = [];
  lines.push(headers.join('\t'));
  rows.forEach(row => {
    lines.push(row.join('\t'));
  });
  return lines.join('\n');
};

/**
 * Trigger file download in browser
 */
export const downloadCsvFile = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
