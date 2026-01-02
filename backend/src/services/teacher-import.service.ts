import * as XLSX from 'xlsx';
import { PrismaClient, Gender } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTeacherDto {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth?: Date;
  gender: Gender;
  phone: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  qualification?: string;
  specialization?: string;
  experience?: number;
  departmentId?: string;
  branchId?: string;
  salary?: number;
  bankAccount?: string;
  bankName?: string;
  ifscCode?: string;
}

export interface ParsedTeacherRow {
  row: number;
  data: Partial<CreateTeacherDto> & { email?: string };
  errors: string[];
  isValid: boolean;
}

export interface ImportPreviewResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  data: ParsedTeacherRow[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Template column headers
const TEMPLATE_HEADERS = [
  // Basic Info (Required)
  'employeeId',
  'firstName',
  'lastName',
  'email',
  'dateOfBirth',
  'gender',
  'password',
  'phone',
  // Basic Info (Optional)
  'alternatePhone',
  'address',
  'city',
  'state',
  'pincode',
  // Professional Info
  'qualification',
  'specialization',
  'experience',
  'departmentCode',
  'branchCode',
  // Salary Info
  'salary',
  'bankAccount',
  'bankName',
  'ifscCode',
];

class TeacherImportService {
  /**
   * Parse uploaded file (CSV or Excel) to JSON
   */
  parseTeacherFile(buffer: Buffer, mimetype: string): Record<string, any>[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Parse to JSON with header row
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    return data as Record<string, any>[];
  }

  /**
   * Generate auto password from employee ID
   */
  generatePassword(employeeId: string): string {
    const year = new Date().getFullYear();
    return `${employeeId}@${year}`;
  }

  /**
   * Validate a single teacher row
   */
  validateTeacherRow(row: Record<string, any>, rowIndex: number): ValidationResult {
    const errors: string[] = [];

    // Required fields
    if (!row.employeeId || String(row.employeeId).trim() === '') {
      errors.push('Employee ID is required');
    }

    if (!row.firstName || String(row.firstName).trim() === '') {
      errors.push('First name is required');
    }

    if (!row.lastName || String(row.lastName).trim() === '') {
      errors.push('Last name is required');
    }

    if (!row.email || String(row.email).trim() === '') {
      errors.push('Email is required');
    } else {
      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(row.email).trim())) {
        errors.push('Invalid email format');
      }
    }

    if (!row.gender || String(row.gender).trim() === '') {
      errors.push('Gender is required');
    } else {
      const gender = String(row.gender).toUpperCase().trim();
      if (!['MALE', 'FEMALE', 'OTHER', 'M', 'F', 'O'].includes(gender)) {
        errors.push('Gender must be MALE, FEMALE, or OTHER');
      }
    }

    if (!row.phone || String(row.phone).trim() === '') {
      errors.push('Phone is required');
    } else {
      const phone = String(row.phone).replace(/\D/g, '');
      if (phone.length < 10 || phone.length > 15) {
        errors.push('Phone number must be 10-15 digits');
      }
    }

    // Optional field validations
    if (row.pincode && String(row.pincode).trim() !== '') {
      const pincode = String(row.pincode).replace(/\D/g, '');
      if (pincode.length !== 6) {
        errors.push('Pincode must be 6 digits');
      }
    }

    if (row.experience && String(row.experience).trim() !== '') {
      const exp = parseInt(String(row.experience));
      if (isNaN(exp) || exp < 0 || exp > 50) {
        errors.push('Experience must be a number between 0 and 50');
      }
    }

    if (row.salary && String(row.salary).trim() !== '') {
      const sal = parseFloat(String(row.salary));
      if (isNaN(sal) || sal < 0) {
        errors.push('Salary must be a positive number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Parse date from various formats
   */
  parseDate(value: any): Date | undefined {
    if (!value || String(value).trim() === '') {
      return undefined;
    }

    // Handle Excel serial date numbers
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      return new Date(date.y, date.m - 1, date.d);
    }

    const strValue = String(value).trim();

    // Try ISO format first (YYYY-MM-DD)
    const isoDate = new Date(strValue);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    // Try DD/MM/YYYY format
    const parts = strValue.split(/[\/\-]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }

    return undefined;
  }

  /**
   * Parse gender from various formats
   */
  parseGender(value: any): Gender | undefined {
    if (!value || String(value).trim() === '') {
      return undefined;
    }

    const gender = String(value).toUpperCase().trim();
    switch (gender) {
      case 'MALE':
      case 'M':
        return 'MALE';
      case 'FEMALE':
      case 'F':
        return 'FEMALE';
      case 'OTHER':
      case 'O':
        return 'OTHER';
      default:
        return undefined;
    }
  }

  /**
   * Parse and validate file for preview
   */
  async parseAndValidate(
    buffer: Buffer,
    mimetype: string,
    schoolId: string
  ): Promise<ImportPreviewResult> {
    const rawData = this.parseTeacherFile(buffer, mimetype);
    const result: ParsedTeacherRow[] = [];
    const employeeIds = new Set<string>();
    const emails = new Set<string>();

    // Get existing employee IDs and emails from database
    const existingTeachers = await prisma.teacher.findMany({
      select: { employeeId: true },
    });
    const existingEmails = await prisma.user.findMany({
      where: { schoolId },
      select: { email: true },
    });

    const dbEmployeeIds = new Set(existingTeachers.map((t) => t.employeeId.toLowerCase()));
    const dbEmails = new Set(existingEmails.map((u) => u.email.toLowerCase()));

    // Get departments and branches for lookup
    const departments = await prisma.department.findMany({
      where: { schoolId },
      select: { id: true, code: true },
    });
    const branches = await prisma.branch.findMany({
      where: { schoolId },
      select: { id: true, code: true },
    });

    const departmentMap = new Map(departments.map((d) => [d.code.toLowerCase(), d.id]));
    const branchMap = new Map(branches.map((b) => [b.code.toLowerCase(), b.id]));

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const rowIndex = i + 2; // +2 for header row and 1-based indexing

      // Validate row
      const validation = this.validateTeacherRow(row, rowIndex);
      const errors = [...validation.errors];

      // Parse data
      const employeeId = String(row.employeeId || '').trim();
      const email = String(row.email || '').trim().toLowerCase();

      // Check for duplicates in file
      if (employeeId && employeeIds.has(employeeId.toLowerCase())) {
        errors.push('Duplicate employee ID in file');
      } else if (employeeId) {
        employeeIds.add(employeeId.toLowerCase());
      }

      if (email && emails.has(email)) {
        errors.push('Duplicate email in file');
      } else if (email) {
        emails.add(email);
      }

      // Check for duplicates in database
      if (employeeId && dbEmployeeIds.has(employeeId.toLowerCase())) {
        errors.push('Employee ID already exists in database');
      }

      if (email && dbEmails.has(email)) {
        errors.push('Email already exists in database');
      }

      // Look up department ID
      let departmentId: string | undefined;
      if (row.departmentCode) {
        departmentId = departmentMap.get(String(row.departmentCode).toLowerCase());
        if (!departmentId) {
          errors.push(`Department code '${row.departmentCode}' not found`);
        }
      }

      // Look up branch ID
      let branchId: string | undefined;
      if (row.branchCode) {
        branchId = branchMap.get(String(row.branchCode).toLowerCase());
        if (!branchId) {
          errors.push(`Branch code '${row.branchCode}' not found`);
        }
      }

      const parsedData: Partial<CreateTeacherDto> & { email?: string } = {
        employeeId,
        firstName: String(row.firstName || '').trim(),
        lastName: String(row.lastName || '').trim(),
        email,
        password: row.password ? String(row.password).trim() : this.generatePassword(employeeId),
        dateOfBirth: this.parseDate(row.dateOfBirth),
        gender: this.parseGender(row.gender),
        phone: String(row.phone || '').replace(/\D/g, ''),
        alternatePhone: row.alternatePhone ? String(row.alternatePhone).replace(/\D/g, '') : undefined,
        address: row.address ? String(row.address).trim() : undefined,
        city: row.city ? String(row.city).trim() : undefined,
        state: row.state ? String(row.state).trim() : undefined,
        pincode: row.pincode ? String(row.pincode).replace(/\D/g, '') : undefined,
        qualification: row.qualification ? String(row.qualification).trim() : undefined,
        specialization: row.specialization ? String(row.specialization).trim() : undefined,
        experience: row.experience ? parseInt(String(row.experience)) : undefined,
        departmentId,
        branchId,
        salary: row.salary ? parseFloat(String(row.salary)) : undefined,
        bankAccount: row.bankAccount ? String(row.bankAccount).trim() : undefined,
        bankName: row.bankName ? String(row.bankName).trim() : undefined,
        ifscCode: row.ifscCode ? String(row.ifscCode).toUpperCase().trim() : undefined,
      };

      result.push({
        row: rowIndex,
        data: parsedData,
        errors,
        isValid: errors.length === 0,
      });
    }

    const validRows = result.filter((r) => r.isValid).length;

    return {
      totalRows: result.length,
      validRows,
      invalidRows: result.length - validRows,
      data: result,
    };
  }

  /**
   * Generate template file
   */
  generateTemplate(format: 'csv' | 'xlsx'): Buffer {
    const workbook = XLSX.utils.book_new();

    // Create worksheet with headers
    const worksheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);

    // Add sample data row
    const sampleRow = [
      'EMP001', // employeeId
      'John', // firstName
      'Doe', // lastName
      'john.doe@school.com', // email
      '1985-05-15', // dateOfBirth
      'MALE', // gender
      '', // password (leave empty for auto-generate)
      '9876543210', // phone
      '', // alternatePhone
      '123 Main Street', // address
      'Mumbai', // city
      'Maharashtra', // state
      '400001', // pincode
      'M.Sc.', // qualification
      'Mathematics', // specialization
      '10', // experience
      'MATH', // departmentCode
      'MAIN', // branchCode
      '50000', // salary
      '1234567890', // bankAccount
      'State Bank', // bankName
      'SBIN0001234', // ifscCode
    ];

    XLSX.utils.sheet_add_aoa(worksheet, [sampleRow], { origin: 'A2' });

    // Set column widths
    worksheet['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 18 }));

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Teachers');

    // Generate buffer
    if (format === 'csv') {
      return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'csv' }));
    }
    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  }
}

export const teacherImportService = new TeacherImportService();
