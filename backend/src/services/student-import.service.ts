import * as XLSX from 'xlsx';
import { PrismaClient, Gender, Category, PwDType } from '@prisma/client';
import { CreateStudentDto } from './student.service';

const prisma = new PrismaClient();

export interface ParsedStudentRow {
  row: number;
  data: Partial<CreateStudentDto> & { email?: string };
  errors: string[];
  isValid: boolean;
}

export interface ImportPreviewResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  data: ParsedStudentRow[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Template column headers
const TEMPLATE_HEADERS = [
  // Basic Info (Required)
  'admissionNo',
  'firstName',
  'lastName',
  'email',
  'dateOfBirth',
  'gender',
  'password',
  // Basic Info (Optional)
  'rollNo',
  'phone',
  'classCode',
  'sectionName',
  'address',
  'city',
  'state',
  'pincode',
  'bloodGroup',
  'previousSchool',
  'medicalConditions',
  'allergies',
  // NEET/JEE Eligibility Fields (Optional - for college prediction)
  'category',           // GENERAL, OBC_NCL, OBC_CL, SC, ST, EWS
  'subCategory',        // Sub-caste if applicable
  'isCreamyLayer',      // true/false - for OBC
  'domicileState',      // State of permanent residence
  'isDomicile',         // true/false - has domicile certificate
  'domicileCertNo',     // Domicile certificate number
  'nationality',        // Indian, NRI, OCI, PIO, Foreign
  'pwdType',            // NONE, LOCOMOTOR, VISUAL, HEARING, etc.
  'pwdPercentage',      // 40-100
  'pwdCertNo',          // PwD certificate number
  'annualFamilyIncome', // In INR
  'isEWS',              // true/false
  'ewsCertNo',          // EWS certificate number
  'isDefenseQuota',     // true/false
  'isKashmiriMigrant',  // true/false
  'isSingleGirl',       // true/false
  'aadharNo',           // 12-digit Aadhar
  'fatherOccupation',
  'motherOccupation',
];

class StudentImportService {
  /**
   * Parse uploaded file (CSV or Excel) to JSON
   */
  parseStudentFile(buffer: Buffer, mimetype: string): Record<string, any>[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Parse to JSON with header row
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    return data as Record<string, any>[];
  }

  /**
   * Generate auto password from admission number
   */
  generatePassword(admissionNo: string): string {
    const year = new Date().getFullYear();
    return `${admissionNo}@${year}`;
  }

  /**
   * Validate a single student row
   */
  validateStudentRow(row: Record<string, any>, rowIndex: number): ValidationResult {
    const errors: string[] = [];

    // Required fields
    if (!row.admissionNo || String(row.admissionNo).trim() === '') {
      errors.push('admissionNo is required');
    } else if (String(row.admissionNo).length > 20) {
      errors.push('admissionNo must be 20 characters or less');
    }

    if (!row.firstName || String(row.firstName).trim() === '') {
      errors.push('firstName is required');
    } else if (String(row.firstName).length > 50) {
      errors.push('firstName must be 50 characters or less');
    }

    if (!row.lastName || String(row.lastName).trim() === '') {
      errors.push('lastName is required');
    } else if (String(row.lastName).length > 50) {
      errors.push('lastName must be 50 characters or less');
    }

    if (!row.email || String(row.email).trim() === '') {
      errors.push('email is required');
    } else if (!this.isValidEmail(String(row.email))) {
      errors.push('email format is invalid');
    }

    if (!row.dateOfBirth || String(row.dateOfBirth).trim() === '') {
      errors.push('dateOfBirth is required');
    } else {
      const dob = this.parseDate(row.dateOfBirth);
      if (!dob) {
        errors.push('dateOfBirth format is invalid (use YYYY-MM-DD)');
      } else if (dob > new Date()) {
        errors.push('dateOfBirth cannot be in the future');
      }
    }

    if (!row.gender || String(row.gender).trim() === '') {
      errors.push('gender is required');
    } else {
      const gender = String(row.gender).toUpperCase().trim();
      if (!['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
        errors.push('gender must be MALE, FEMALE, or OTHER');
      }
    }

    // Optional field validation
    if (row.phone && String(row.phone).trim()) {
      const phone = String(row.phone).replace(/\D/g, '');
      if (phone.length < 10 || phone.length > 15) {
        errors.push('phone must be 10-15 digits');
      }
    }

    if (row.pincode && String(row.pincode).trim()) {
      const pincode = String(row.pincode).replace(/\D/g, '');
      if (pincode.length !== 6) {
        errors.push('pincode must be 6 digits');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Parse and validate entire file for preview
   */
  async parseAndValidate(
    buffer: Buffer,
    mimetype: string,
    schoolId: string
  ): Promise<ImportPreviewResult> {
    const rawData = this.parseStudentFile(buffer, mimetype);
    const result: ImportPreviewResult = {
      totalRows: rawData.length,
      validRows: 0,
      invalidRows: 0,
      data: [],
    };

    // Get existing admission numbers and emails for duplicate check
    const existingStudents = await prisma.student.findMany({
      where: { user: { schoolId } },
      select: { admissionNo: true },
    });
    const existingEmails = await prisma.user.findMany({
      where: { schoolId },
      select: { email: true },
    });

    const existingAdmissionNos = new Set(existingStudents.map((s) => s.admissionNo));
    const existingEmailSet = new Set(existingEmails.map((e) => e.email.toLowerCase()));

    // Track duplicates within the file
    const fileAdmissionNos = new Set<string>();
    const fileEmails = new Set<string>();

    // Get classes and sections for lookup
    const classes = await prisma.class.findMany({
      where: { schoolId },
      include: { sections: true },
    });
    const classLookup = new Map(classes.map((c) => [c.code.toLowerCase(), c]));

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const rowIndex = i + 2; // +2 for header row and 1-based index

      const validation = this.validateStudentRow(row, rowIndex);
      const errors = [...validation.errors];

      const admissionNo = String(row.admissionNo || '').trim();
      const email = String(row.email || '').trim().toLowerCase();

      // Check for duplicates in database
      if (admissionNo && existingAdmissionNos.has(admissionNo)) {
        errors.push(`admissionNo '${admissionNo}' already exists in database`);
      }
      if (email && existingEmailSet.has(email)) {
        errors.push(`email '${email}' already exists in database`);
      }

      // Check for duplicates within file
      if (admissionNo && fileAdmissionNos.has(admissionNo)) {
        errors.push(`admissionNo '${admissionNo}' is duplicated in file`);
      }
      if (email && fileEmails.has(email)) {
        errors.push(`email '${email}' is duplicated in file`);
      }

      // Lookup class and section
      let currentClassId: string | undefined;
      let currentSectionId: string | undefined;

      if (row.classCode) {
        const classCode = String(row.classCode).trim().toLowerCase();
        const foundClass = classLookup.get(classCode);
        if (foundClass) {
          currentClassId = foundClass.id;

          if (row.sectionName) {
            const sectionName = String(row.sectionName).trim().toUpperCase();
            const foundSection = foundClass.sections.find(
              (s) => s.name.toUpperCase() === sectionName
            );
            if (foundSection) {
              currentSectionId = foundSection.id;
            } else {
              errors.push(`section '${row.sectionName}' not found for class '${row.classCode}'`);
            }
          }
        } else {
          errors.push(`class with code '${row.classCode}' not found`);
        }
      }

      // Track in file sets
      if (admissionNo) fileAdmissionNos.add(admissionNo);
      if (email) fileEmails.add(email);

      const isValid = errors.length === 0;
      if (isValid) {
        result.validRows++;
      } else {
        result.invalidRows++;
      }

      result.data.push({
        row: rowIndex,
        data: {
          admissionNo,
          firstName: String(row.firstName || '').trim(),
          lastName: String(row.lastName || '').trim(),
          email,
          dateOfBirth: this.parseDate(row.dateOfBirth) || undefined,
          gender: this.parseGender(row.gender),
          password: row.password ? String(row.password).trim() : this.generatePassword(admissionNo),
          rollNo: row.rollNo ? String(row.rollNo).trim() : undefined,
          phone: row.phone ? String(row.phone).trim() : undefined,
          currentClassId,
          currentSectionId,
          address: row.address ? String(row.address).trim() : undefined,
          city: row.city ? String(row.city).trim() : undefined,
          state: row.state ? String(row.state).trim() : undefined,
          pincode: row.pincode ? String(row.pincode).trim() : undefined,
          bloodGroup: row.bloodGroup ? String(row.bloodGroup).trim() : undefined,
          previousSchool: row.previousSchool ? String(row.previousSchool).trim() : undefined,
          medicalConditions: row.medicalConditions ? String(row.medicalConditions).trim() : undefined,
          allergies: row.allergies ? String(row.allergies).trim() : undefined,
          // NEET/JEE Eligibility Fields
          category: this.parseCategory(row.category),
          subCategory: row.subCategory ? String(row.subCategory).trim() : undefined,
          isCreamyLayer: this.parseBoolean(row.isCreamyLayer),
          domicileState: row.domicileState ? String(row.domicileState).trim() : undefined,
          isDomicile: this.parseBoolean(row.isDomicile),
          domicileCertNo: row.domicileCertNo ? String(row.domicileCertNo).trim() : undefined,
          nationality: row.nationality ? String(row.nationality).trim() : undefined,
          pwdType: this.parsePwDType(row.pwdType),
          pwdPercentage: row.pwdPercentage ? parseInt(String(row.pwdPercentage), 10) : undefined,
          pwdCertNo: row.pwdCertNo ? String(row.pwdCertNo).trim() : undefined,
          annualFamilyIncome: row.annualFamilyIncome ? parseFloat(String(row.annualFamilyIncome)) : undefined,
          isEWS: this.parseBoolean(row.isEWS),
          ewsCertNo: row.ewsCertNo ? String(row.ewsCertNo).trim() : undefined,
          isDefenseQuota: this.parseBoolean(row.isDefenseQuota),
          isKashmiriMigrant: this.parseBoolean(row.isKashmiriMigrant),
          isSingleGirl: this.parseBoolean(row.isSingleGirl),
          aadharNo: row.aadharNo ? String(row.aadharNo).trim() : undefined,
          fatherOccupation: row.fatherOccupation ? String(row.fatherOccupation).trim() : undefined,
          motherOccupation: row.motherOccupation ? String(row.motherOccupation).trim() : undefined,
        },
        errors,
        isValid,
      });
    }

    return result;
  }

  /**
   * Generate template file (CSV or Excel)
   */
  generateTemplate(format: 'csv' | 'xlsx'): Buffer {
    const workbook = XLSX.utils.book_new();

    // Create worksheet with headers only
    const worksheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);

    // Set column widths
    worksheet['!cols'] = TEMPLATE_HEADERS.map((header) => ({
      wch: Math.max(header.length + 2, 15),
    }));

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      return Buffer.from(csv, 'utf-8');
    } else {
      return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
    }
  }

  /**
   * Helper: Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Helper: Parse date from various formats
   */
  private parseDate(value: any): Date | null {
    if (!value) return null;

    // Handle Excel serial date
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        return new Date(date.y, date.m - 1, date.d);
      }
    }

    // Handle string date
    const strValue = String(value).trim();

    // Try YYYY-MM-DD format
    const isoMatch = strValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Try DD/MM/YYYY format
    const slashMatch = strValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (slashMatch) {
      const [, day, month, year] = slashMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Try DD-MM-YYYY format
    const dashMatch = strValue.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dashMatch) {
      const [, day, month, year] = dashMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Fallback to Date.parse
    const parsed = Date.parse(strValue);
    if (!isNaN(parsed)) {
      return new Date(parsed);
    }

    return null;
  }

  /**
   * Helper: Parse gender string to enum
   */
  private parseGender(value: any): Gender | undefined {
    if (!value) return undefined;
    const gender = String(value).toUpperCase().trim();
    if (gender === 'MALE' || gender === 'M') return 'MALE';
    if (gender === 'FEMALE' || gender === 'F') return 'FEMALE';
    if (gender === 'OTHER' || gender === 'O') return 'OTHER';
    return undefined;
  }

  /**
   * Helper: Parse category string to enum
   */
  private parseCategory(value: any): Category | undefined {
    if (!value) return undefined;
    const cat = String(value).toUpperCase().trim().replace(/-/g, '_');
    const validCategories: Category[] = ['GENERAL', 'OBC_NCL', 'OBC_CL', 'SC', 'ST', 'EWS'];
    if (validCategories.includes(cat as Category)) {
      return cat as Category;
    }
    // Handle common variations
    if (cat === 'OBC' || cat === 'OBC_NON_CREAMY') return 'OBC_NCL';
    if (cat === 'GEN' || cat === 'UR' || cat === 'UNRESERVED') return 'GENERAL';
    return undefined;
  }

  /**
   * Helper: Parse PwD type string to enum
   */
  private parsePwDType(value: any): PwDType | undefined {
    if (!value) return undefined;
    const pwd = String(value).toUpperCase().trim().replace(/-/g, '_').replace(/ /g, '_');
    const validTypes: PwDType[] = [
      'NONE', 'LOCOMOTOR', 'VISUAL', 'HEARING', 'SPEECH', 'INTELLECTUAL',
      'MENTAL_ILLNESS', 'MULTIPLE', 'AUTISM', 'SPECIFIC_LEARNING',
      'CEREBRAL_PALSY', 'MUSCULAR_DYSTROPHY', 'CHRONIC_NEUROLOGICAL',
      'BLOOD_DISORDER', 'ACID_ATTACK_VICTIM'
    ];
    if (validTypes.includes(pwd as PwDType)) {
      return pwd as PwDType;
    }
    // Handle common variations
    if (pwd === 'NO' || pwd === 'NA' || pwd === 'NIL' || pwd === '') return 'NONE';
    if (pwd === 'BLIND' || pwd === 'LOW_VISION') return 'VISUAL';
    if (pwd === 'DEAF' || pwd === 'HARD_OF_HEARING') return 'HEARING';
    if (pwd === 'DYSLEXIA') return 'SPECIFIC_LEARNING';
    return undefined;
  }

  /**
   * Helper: Parse boolean value
   */
  private parseBoolean(value: any): boolean | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const str = String(value).toLowerCase().trim();
    if (['true', 'yes', '1', 'y'].includes(str)) return true;
    if (['false', 'no', '0', 'n'].includes(str)) return false;
    return undefined;
  }
}

export const studentImportService = new StudentImportService();
