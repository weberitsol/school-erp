import * as mammoth from 'mammoth';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import AdmZip from 'adm-zip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { execSync } from 'child_process';

// ImageMagick path for WMF to PNG conversion
const IMAGEMAGICK_PATH = 'C:\\Program Files\\ImageMagick-7.1.2-Q16-HDRI\\magick.exe';

// ==================== TYPES ====================

export enum ParsedQuestionType {
  SINGLE_CORRECT = 'SINGLE_CORRECT',
  MULTIPLE_CORRECT = 'MULTIPLE_CORRECT',
  INTEGER_TYPE = 'INTEGER_TYPE',
  COMPREHENSION = 'COMPREHENSION',
  MATRIX_MATCH = 'MATRIX_MATCH',
  ASSERTION_REASONING = 'ASSERTION_REASONING',
}

export interface ParsedOption {
  id: string;       // a, b, c, d
  text: string;
  html?: string;
  image?: string;
}

export interface ParsedQuestion {
  id: string;
  questionNumber: number;
  questionType: ParsedQuestionType;
  questionText: string;
  questionHtml?: string;
  questionImage?: string;
  options: ParsedOption[];
  correctAnswer?: string;        // For single correct: "a", "b", etc.
  correctAnswers?: string[];     // For multiple correct: ["a", "c", "d"]
  solution?: string;
  solutionHtml?: string;
  // For comprehension questions
  passageId?: string;
  passageQuestionNumber?: number;
  // For matrix match
  matrixData?: {
    leftColumn: { id: string; text: string }[];
    rightColumn: { id: string; text: string }[];
    correctMatches?: Record<string, string[]>;
  };
  // Parsing metadata
  parseWarnings?: string[];
  rawText?: string;
}

export interface ParsedPassage {
  id: string;
  title: string;
  passageText: string;
  passageHtml?: string;
  questionIds: string[];
}

export interface ParsedSection {
  name: string;
  questionType: ParsedQuestionType;
  startQuestion: number;
  endQuestion: number;
  questions: ParsedQuestion[];
  passages?: ParsedPassage[];
}

export interface ParseResult {
  success: boolean;
  sections: ParsedSection[];
  totalQuestions: number;
  questions: ParsedQuestion[];
  passages: ParsedPassage[];
  warnings: string[];
  errors: string[];
  rawText?: string;
  rawHtml?: string;
}

// ==================== PARSER PATTERNS ====================

const SECTION_PATTERNS = {
  // Section headers are typically short lines with specific keywords
  // Must start with the keyword or be the whole line (not embedded in question text)
  SINGLE_CORRECT: /^[\s]*single\s+correct\s*(answer\s*)?(type)?[\s]*$/i,
  MULTIPLE_CORRECT: /^[\s]*(multiple\s+correct\s*(answers?\s*)?(type)?|one\s+or\s+more\s+correct)[\s]*$/i,
  INTEGER_TYPE: /^[\s]*(integer\s*(answer\s*)?(type)?|numerical\s*(answer\s*)?(type)?|integer\s+value\s*(type)?)[\s]*$/i,
  COMPREHENSION: /^[\s]*(linked\s+comprehension|passage\s+based|comprehension\s+type)[\s]*$/i,
  MATRIX_MATCH: /^[\s]*(matrix\s+match\s*(type)?|matching\s+type|match\s+the\s+following)[\s]*$/i,
  ASSERTION_REASONING: /^[\s]*(assertion.*reasoning|assertion.*reason)[\s]*$/i,
};

// Helper to check if a line is a section header
const isSectionHeader = (line: string): ParsedQuestionType | null => {
  // Skip if line is too long (likely question text, not header)
  if (line.length > 60) return null;

  for (const [type, pattern] of Object.entries(SECTION_PATTERNS)) {
    if (pattern.test(line)) {
      return type as ParsedQuestionType;
    }
  }
  return null;
};

const QUESTION_NUMBER_PATTERN = /^(\d+)\s*[.):]?\s*$/;  // Match standalone question numbers
const QUESTION_WITH_TEXT_PATTERN = /^(\d+)\s*[.)]\s+(.+)/;  // Match question number with text (period/paren)
const QUESTION_WITH_TAB_PATTERN = /^(\d+)\t+(.+)/;  // Match question number with text (tab from table)
// Match letter options: a), b), c), d) or (a), (b), (c), (d) or A., B., C., D.
// MUST have delimiter after letter to avoid matching "A particle..." as option
const OPTION_LETTER_PATTERN = /^[\(\[]?([a-d])[\)\]]\s*/i;  // Requires closing ) or ]
const OPTION_LETTER_PATTERN_ALT = /^([a-d])\s*[.)]\s+/i;     // a) or a. followed by space
const OPTION_LETTER_TAB_PATTERN = /^([a-d])\t+/i;            // a<tab> from table cell
// Match numeric options: 1), 2), 3), 4) or (1), (2), (3), (4) or 1., 2., 3., 4.
const OPTION_NUMERIC_PATTERN = /^[\(\[]?([1-4])[\)\]]\s*/;   // Requires closing ) or ]
const OPTION_NUMERIC_PATTERN_ALT = /^([1-4])\s*[.)]\s+/;     // 1) or 1. followed by space
const OPTION_NUMERIC_TAB_PATTERN = /^([1-4])\t+/;            // 1<tab> from table cell
const ANSWER_PATTERN = /^Ans\.?\s*[:.]*\s*$/i;  // Just "Ans." on its own line
const ANSWER_WITH_VALUE_PATTERN = /^Ans\.?\s*[:.]*\s*([A-D1-4,\s]+)/i;  // "Ans. A" or "Ans. 1,2,3" or "Ans. A,B,C"
const INTEGER_ANSWER_PATTERN = /^Ans\.?\s*[:.]*\s*([-]?\d+(?:\.\d+)?)/i;  // "Ans. 42" or "Ans. -5" or "Ans. 3.14"
const SOLUTION_PATTERN = /^Sol\.?\s*[:.]*\s*$/i;  // Just "Sol.:" on its own line
const SOLUTION_WITH_VALUE_PATTERN = /^Sol\.?\s*[:.]*\s*(.+)/i;  // "Sol. explanation here"
const PASSAGE_PATTERN = /^Passage[-\s]*([IVX\d]+)/i;
const SINGLE_LETTER_ANSWER_PATTERN = /^([A-D1-4])$/i;  // Just a single letter or digit on a line
const MULTI_LETTER_ANSWER_PATTERN = /^([A-D1-4])\s*,?\s*([A-D1-4])?\s*,?\s*([A-D1-4])?\s*,?\s*([A-D1-4])?$/i;
// Matrix match patterns
const MATRIX_COLUMN_A_PATTERN = /^[\(]?([A-Z])[\)]?\s*[.):\-→]\s*/i;  // A), B), C) or A →
const MATRIX_COLUMN_B_PATTERN = /^[\(]?([pqrs1-4])[\)]?\s*[.):\-]\s*/i;  // p), q), r), s) or 1), 2), 3), 4)

// Helper to match options - returns {id, text, pattern} or null
const matchOption = (line: string): { id: string; text: string; isNumeric: boolean } | null => {
  // Try letter pattern with tab (from table): a<tab>text
  let letterMatch = line.match(OPTION_LETTER_TAB_PATTERN);
  if (letterMatch) {
    const optionText = line.replace(OPTION_LETTER_TAB_PATTERN, '').trim();
    if (optionText.length > 0) {
      console.log(`[OPTION MATCH] Letter(tab): "${letterMatch[1]}" -> "${optionText.substring(0, 50)}..."`);
      return { id: letterMatch[1].toLowerCase(), text: optionText, isNumeric: false };
    }
  }

  // Try letter pattern with parenthesis: (a), (b), [a], [b]
  letterMatch = line.match(OPTION_LETTER_PATTERN);
  if (letterMatch) {
    const optionText = line.replace(OPTION_LETTER_PATTERN, '').trim();
    if (optionText.length > 0) {
      console.log(`[OPTION MATCH] Letter(paren): "${letterMatch[1]}" -> "${optionText.substring(0, 50)}..."`);
      return { id: letterMatch[1].toLowerCase(), text: optionText, isNumeric: false };
    }
  }

  // Try letter pattern with delimiter: a) or a. followed by space
  letterMatch = line.match(OPTION_LETTER_PATTERN_ALT);
  if (letterMatch) {
    const optionText = line.replace(OPTION_LETTER_PATTERN_ALT, '').trim();
    if (optionText.length > 0) {
      console.log(`[OPTION MATCH] Letter(delim): "${letterMatch[1]}" -> "${optionText.substring(0, 50)}..."`);
      return { id: letterMatch[1].toLowerCase(), text: optionText, isNumeric: false };
    }
  }

  // Try numeric pattern with tab (from table): 1<tab>text
  let numericMatch = line.match(OPTION_NUMERIC_TAB_PATTERN);
  if (numericMatch) {
    const optionText = line.replace(OPTION_NUMERIC_TAB_PATTERN, '').trim();
    if (optionText.length > 0) {
      const numToLetter = { '1': 'a', '2': 'b', '3': 'c', '4': 'd' };
      const id = numToLetter[numericMatch[1] as keyof typeof numToLetter] || numericMatch[1];
      console.log(`[OPTION MATCH] Numeric(tab): "${numericMatch[1]}" -> id="${id}" text="${optionText.substring(0, 50)}..."`);
      return { id, text: optionText, isNumeric: true };
    }
  }

  // Try numeric pattern with parenthesis: (1), (2), [1], [2]
  numericMatch = line.match(OPTION_NUMERIC_PATTERN);
  if (numericMatch) {
    const optionText = line.replace(OPTION_NUMERIC_PATTERN, '').trim();
    if (optionText.length > 0) {
      const numToLetter = { '1': 'a', '2': 'b', '3': 'c', '4': 'd' };
      const id = numToLetter[numericMatch[1] as keyof typeof numToLetter] || numericMatch[1];
      console.log(`[OPTION MATCH] Numeric(paren): "${numericMatch[1]}" -> id="${id}" text="${optionText.substring(0, 50)}..."`);
      return { id, text: optionText, isNumeric: true };
    }
  }

  // Try numeric pattern with delimiter: 1) or 1. followed by space
  numericMatch = line.match(OPTION_NUMERIC_PATTERN_ALT);
  if (numericMatch) {
    const optionText = line.replace(OPTION_NUMERIC_PATTERN_ALT, '').trim();
    if (optionText.length > 0) {
      const numToLetter = { '1': 'a', '2': 'b', '3': 'c', '4': 'd' };
      const id = numToLetter[numericMatch[1] as keyof typeof numToLetter] || numericMatch[1];
      console.log(`[OPTION MATCH] Numeric(delim): "${numericMatch[1]}" -> id="${id}" text="${optionText.substring(0, 50)}..."`);
      return { id, text: optionText, isNumeric: true };
    }
  }

  return null;
};

// Helper to normalize answer to letter format
const normalizeAnswer = (answer: string): string => {
  const cleaned = answer.toLowerCase().trim();
  // Map numeric to letter
  const numToLetter: Record<string, string> = { '1': 'a', '2': 'b', '3': 'c', '4': 'd' };
  if (numToLetter[cleaned]) return numToLetter[cleaned];
  return cleaned;
};

// Helper to parse matrix match table content
const parseMatrixContent = (lines: string[], startIdx: number): {
  columnA: { id: string; text: string }[];
  columnB: { id: string; text: string }[];
  endIdx: number;
} => {
  const columnA: { id: string; text: string }[] = [];
  const columnB: { id: string; text: string }[] = [];
  let endIdx = startIdx;

  // Patterns for matrix items
  // Column A: (A), (B), (C), (D) or A), B), C), D)
  const colAPattern = /^[\(]?([A-D])[\)]?\s*[.):\-→]?\s*(.+)/i;
  // Column B: (P), (Q), (R), (S) or (1), (2), (3), (4) or P), Q), R), S)
  const colBPattern = /^[\(]?([PQRS1-4])[\)]?\s*[.):\-]?\s*(.+)/i;
  // Combined row: (A) text... (P) text... or separated by tab
  const combinedRowPattern = /^[\(]?([A-D])[\)]?\s*[.):\-]?\s*(.+?)\s+[\(]?([PQRS1-4])[\)]?\s*[.):\-]?\s*(.+)/i;
  // Arrow pattern: A → P, Q or A - 1, 2
  const arrowPattern = /^[\(]?([A-D])[\)]?\s*[→\-:]\s*(.+)/i;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();

    // Stop if we hit an answer marker or next question
    if (ANSWER_PATTERN.test(line) || ANSWER_WITH_VALUE_PATTERN.test(line) ||
        QUESTION_NUMBER_PATTERN.test(line) || QUESTION_WITH_TEXT_PATTERN.test(line) ||
        QUESTION_WITH_TAB_PATTERN.test(line) || SOLUTION_PATTERN.test(line)) {
      endIdx = i;
      break;
    }

    // Skip Column-I, Column-II headers
    if (/^column[\s\-]*(i|ii|1|2|a|b)/i.test(line)) {
      continue;
    }

    // Try combined row pattern (both columns in one line)
    const combinedMatch = line.match(combinedRowPattern);
    if (combinedMatch) {
      columnA.push({ id: combinedMatch[1].toUpperCase(), text: combinedMatch[2].trim() });
      columnB.push({ id: combinedMatch[3].toUpperCase(), text: combinedMatch[4].trim() });
      endIdx = i + 1;
      continue;
    }

    // Try Column A pattern
    const colAMatch = line.match(colAPattern);
    if (colAMatch && !line.match(colBPattern)) {
      columnA.push({ id: colAMatch[1].toUpperCase(), text: colAMatch[2].trim() });
      endIdx = i + 1;
      continue;
    }

    // Try Column B pattern
    const colBMatch = line.match(colBPattern);
    if (colBMatch) {
      columnB.push({ id: colBMatch[1].toUpperCase(), text: colBMatch[2].trim() });
      endIdx = i + 1;
      continue;
    }

    endIdx = i + 1;
  }

  return { columnA, columnB, endIdx };
};

// ==================== WORD PARSER SERVICE ====================

class WordParserService {
  private uploadsDir: string;
  private imageMap: Map<string, string> = new Map(); // Map rId to saved path

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads', 'question-papers');
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Extract full text content from Word document XML, preserving equations as image references
   */
  private extractTextFromDocxXml(filePath: string): { text: string; imageRefs: Map<string, string> } {
    const imageRefs = new Map<string, string>();

    try {
      const zip = new AdmZip(filePath);
      const documentXml = zip.readAsText('word/document.xml');

      if (!documentXml) return { text: '', imageRefs };

      // Build relationship map (rId -> target)
      const relsXml = zip.readAsText('word/_rels/document.xml.rels');
      const rIdToTarget = new Map<string, string>();

      if (relsXml) {
        const relsParser = new DOMParser();
        const relsDoc = relsParser.parseFromString(relsXml, 'text/xml');
        const relationships = relsDoc.getElementsByTagName('Relationship');

        for (let i = 0; i < relationships.length; i++) {
          const rel = relationships[i];
          const rId = rel.getAttribute('Id');
          const target = rel.getAttribute('Target');
          if (rId && target) {
            rIdToTarget.set(rId, target);
          }
        }
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(documentXml, 'text/xml');

      // Get document body
      const body = doc.getElementsByTagName('w:body')[0];
      if (!body) return { text: '', imageRefs };

      const text = this.extractTextFromElement(body, rIdToTarget, imageRefs);
      return { text, imageRefs };
    } catch (error) {
      console.error('Error extracting text from DOCX XML:', error);
      return { text: '', imageRefs };
    }
  }

  /**
   * Recursively extract text from XML element, handling equations inline
   */
  private extractTextFromElement(
    element: Element,
    rIdToTarget: Map<string, string>,
    imageRefs: Map<string, string>
  ): string {
    let result = '';
    const childNodes = element.childNodes;

    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes[i];

      if (node.nodeType === 1) { // Element node
        const el = node as Element;
        const tagName = el.tagName || el.nodeName;

        // Handle paragraph - add newline
        if (tagName === 'w:p') {
          result += this.extractTextFromElement(el, rIdToTarget, imageRefs) + '\n';
        }
        // Handle text run
        else if (tagName === 'w:r') {
          result += this.extractTextFromElement(el, rIdToTarget, imageRefs);
        }
        // Handle actual text
        else if (tagName === 'w:t') {
          result += el.textContent || '';
        }
        // Handle tab
        else if (tagName === 'w:tab') {
          result += '\t';
        }
        // Handle break
        else if (tagName === 'w:br') {
          result += '\n';
        }
        // Handle drawing (images)
        else if (tagName === 'w:drawing' || tagName === 'w:pict' || tagName === 'w:object') {
          // Try to find embedded image reference
          const blips = el.getElementsByTagName('a:blip');
          const imageData = el.getElementsByTagName('v:imagedata');

          let imageId = '';

          // Check for a:blip (modern Office format)
          if (blips.length > 0) {
            imageId = blips[0].getAttribute('r:embed') || '';
          }
          // Check for v:imagedata (legacy format)
          else if (imageData.length > 0) {
            imageId = imageData[0].getAttribute('r:id') || '';
          }

          if (imageId && rIdToTarget.has(imageId)) {
            const target = rIdToTarget.get(imageId)!;
            const savedPath = this.imageMap.get(path.basename(target));
            if (savedPath) {
              // Check if it's an unsupported format
              if (savedPath.startsWith('[UNSUPPORTED:')) {
                result += ' [EQ] '; // Show equation placeholder for WMF/EMF
              } else {
                result += ` [IMG:${savedPath}] `;
                imageRefs.set(imageId, savedPath);
              }
            } else {
              result += ` [EQ_IMG] `;
            }
          } else {
            result += ' [EQ] ';
          }
        }
        // Handle OMML equation - convert to text representation
        else if (tagName === 'm:oMath' || tagName === 'm:oMathPara') {
          const eqText = this.ommlToLatex(el);
          result += eqText ? ` ${eqText} ` : ' [EQ] ';
        }
        // Handle OLE objects (embedded equations)
        else if (tagName === 'o:OLEObject') {
          result += ' [EQ_OBJ] ';
        }
        // Handle tables - extract as tab-separated rows
        else if (tagName === 'w:tbl') {
          const rows = el.getElementsByTagName('w:tr');
          for (let r = 0; r < rows.length; r++) {
            const row = rows[r];
            const cells = row.getElementsByTagName('w:tc');
            const cellTexts: string[] = [];
            for (let c = 0; c < cells.length; c++) {
              const cellText = this.extractTextFromElement(cells[c], rIdToTarget, imageRefs).trim().replace(/\n/g, ' ');
              cellTexts.push(cellText);
            }
            // Output cells as tab-separated, followed by newline
            result += cellTexts.join('\t') + '\n';
          }
        }
        // Handle table row (if not already handled by w:tbl)
        else if (tagName === 'w:tr') {
          result += this.extractTextFromElement(el, rIdToTarget, imageRefs);
        }
        // Handle table cell
        else if (tagName === 'w:tc') {
          result += this.extractTextFromElement(el, rIdToTarget, imageRefs);
        }
        // Handle other elements recursively
        else {
          result += this.extractTextFromElement(el, rIdToTarget, imageRefs);
        }
      }
    }

    return result;
  }

  /**
   * Extract and convert OMML equations from Word document
   */
  private async extractEquationsFromDocx(filePath: string): Promise<Map<number, string>> {
    const equationMap = new Map<number, string>();

    try {
      const zip = new AdmZip(filePath);
      const documentXml = zip.readAsText('word/document.xml');

      if (!documentXml) return equationMap;

      const parser = new DOMParser();
      const doc = parser.parseFromString(documentXml, 'text/xml');

      // Find all OMML equations (m:oMath and m:oMathPara elements)
      const equations = doc.getElementsByTagName('m:oMath');
      const equationParas = doc.getElementsByTagName('m:oMathPara');

      let eqIndex = 0;

      // Process m:oMath elements
      for (let i = 0; i < equations.length; i++) {
        const eq = equations[i];
        const latexText = this.ommlToLatex(eq);
        if (latexText) {
          equationMap.set(eqIndex++, latexText);
        }
      }

      // Process m:oMathPara elements
      for (let i = 0; i < equationParas.length; i++) {
        const eq = equationParas[i];
        const latexText = this.ommlToLatex(eq);
        if (latexText) {
          equationMap.set(eqIndex++, latexText);
        }
      }
    } catch (error) {
      console.error('Error extracting equations:', error);
    }

    return equationMap;
  }

  /**
   * Convert OMML element to LaTeX-like text representation
   */
  private ommlToLatex(element: Element): string {
    const serializer = new XMLSerializer();
    const xml = serializer.serializeToString(element);

    // Extract text content from OMML
    let result = '';

    // Get all text nodes (m:t elements)
    const textNodes = element.getElementsByTagName('m:t');
    for (let i = 0; i < textNodes.length; i++) {
      const text = textNodes[i].textContent || '';
      result += text;
    }

    // Handle fractions (m:f)
    const fractions = element.getElementsByTagName('m:f');
    if (fractions.length > 0) {
      for (let i = 0; i < fractions.length; i++) {
        const frac = fractions[i];
        const num = frac.getElementsByTagName('m:num')[0];
        const den = frac.getElementsByTagName('m:den')[0];
        if (num && den) {
          const numText = this.getTextContent(num);
          const denText = this.getTextContent(den);
          result = result || `(${numText})/(${denText})`;
        }
      }
    }

    // Handle radicals (m:rad)
    const radicals = element.getElementsByTagName('m:rad');
    if (radicals.length > 0) {
      for (let i = 0; i < radicals.length; i++) {
        const rad = radicals[i];
        const deg = rad.getElementsByTagName('m:deg')[0];
        const base = rad.getElementsByTagName('m:e')[0];
        if (base) {
          const baseText = this.getTextContent(base);
          const degText = deg ? this.getTextContent(deg) : '2';
          result = result || `√${degText !== '2' ? `[${degText}]` : ''}(${baseText})`;
        }
      }
    }

    // Handle superscripts (m:sup)
    const superscripts = element.getElementsByTagName('m:sSup');
    if (superscripts.length > 0) {
      for (let i = 0; i < superscripts.length; i++) {
        const sup = superscripts[i];
        const base = sup.getElementsByTagName('m:e')[0];
        const exp = sup.getElementsByTagName('m:sup')[0];
        if (base && exp) {
          const baseText = this.getTextContent(base);
          const expText = this.getTextContent(exp);
          result = result || `${baseText}^${expText}`;
        }
      }
    }

    // Handle subscripts (m:sub)
    const subscripts = element.getElementsByTagName('m:sSub');
    if (subscripts.length > 0) {
      for (let i = 0; i < subscripts.length; i++) {
        const sub = subscripts[i];
        const base = sub.getElementsByTagName('m:e')[0];
        const idx = sub.getElementsByTagName('m:sub')[0];
        if (base && idx) {
          const baseText = this.getTextContent(base);
          const idxText = this.getTextContent(idx);
          result = result || `${baseText}_${idxText}`;
        }
      }
    }

    // Clean up and return
    return result.trim() || this.getTextContent(element);
  }

  /**
   * Get text content from an element
   */
  private getTextContent(element: Element): string {
    let result = '';
    const textNodes = element.getElementsByTagName('m:t');
    for (let i = 0; i < textNodes.length; i++) {
      result += textNodes[i].textContent || '';
    }
    return result || element.textContent || '';
  }

  // Web-compatible image formats
  private static WEB_FORMATS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
  private static WMF_FORMATS = ['.wmf', '.emf', '.x-wmf', '.x-emf'];

  /**
   * Check if ImageMagick is available
   */
  private static imageMagickAvailable: boolean | null = null;

  private checkImageMagick(): boolean {
    if (WordParserService.imageMagickAvailable !== null) {
      return WordParserService.imageMagickAvailable;
    }
    try {
      if (fs.existsSync(IMAGEMAGICK_PATH)) {
        execSync(`"${IMAGEMAGICK_PATH}" --version`, { stdio: 'ignore' });
        WordParserService.imageMagickAvailable = true;
        console.log('ImageMagick available for WMF conversion');
      } else {
        WordParserService.imageMagickAvailable = false;
      }
    } catch {
      WordParserService.imageMagickAvailable = false;
    }
    return WordParserService.imageMagickAvailable;
  }

  /**
   * Convert WMF/EMF to PNG using ImageMagick
   */
  private convertWmfToPng(wmfPath: string, pngPath: string): boolean {
    try {
      // Use ImageMagick to convert WMF to PNG with white background
      execSync(`"${IMAGEMAGICK_PATH}" "${wmfPath}" -background white -flatten "${pngPath}"`, {
        stdio: 'ignore',
        timeout: 10000
      });
      return fs.existsSync(pngPath);
    } catch (error) {
      console.error(`Failed to convert ${wmfPath}:`, error);
      return false;
    }
  }

  /**
   * Check if an image format is web-compatible
   */
  private isWebCompatible(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return WordParserService.WEB_FORMATS.includes(ext);
  }

  /**
   * Extract images from DOCX and save them
   */
  private async extractImagesFromDocx(filePath: string): Promise<Map<string, string>> {
    const imageMap = new Map<string, string>();
    let webCompatibleCount = 0;
    let convertedCount = 0;
    let failedCount = 0;

    const hasImageMagick = this.checkImageMagick();

    try {
      const zip = new AdmZip(filePath);
      const entries = zip.getEntries();

      for (const entry of entries) {
        if (entry.entryName.startsWith('word/media/')) {
          const imageBuffer = entry.getData();
          const ext = path.extname(entry.entryName).toLowerCase().slice(1) || 'png';
          const extWithDot = '.' + ext;
          const imageId = uuidv4();
          const originalName = path.basename(entry.entryName);

          // Handle WMF/EMF formats
          if (WordParserService.WMF_FORMATS.includes(extWithDot)) {
            if (hasImageMagick) {
              // Save WMF temporarily and convert to PNG
              const tempWmfPath = path.join(this.uploadsDir, `${imageId}.${ext}`);
              const pngPath = path.join(this.uploadsDir, `${imageId}.png`);

              fs.writeFileSync(tempWmfPath, imageBuffer);

              if (this.convertWmfToPng(tempWmfPath, pngPath)) {
                // Delete the temp WMF file
                try { fs.unlinkSync(tempWmfPath); } catch {}
                imageMap.set(originalName, `/uploads/question-papers/${imageId}.png`);
                convertedCount++;
              } else {
                // Conversion failed, mark as unsupported
                try { fs.unlinkSync(tempWmfPath); } catch {}
                imageMap.set(originalName, `[UNSUPPORTED:${ext}]`);
                failedCount++;
              }
            } else {
              // No ImageMagick, mark as unsupported
              imageMap.set(originalName, `[UNSUPPORTED:${ext}]`);
              failedCount++;
            }
            continue;
          }

          // Web-compatible format - save directly
          const imagePath = path.join(this.uploadsDir, `${imageId}.${ext}`);
          fs.writeFileSync(imagePath, imageBuffer);
          webCompatibleCount++;
          imageMap.set(originalName, `/uploads/question-papers/${imageId}.${ext}`);
        }
      }

      console.log(`Image extraction: ${webCompatibleCount} native, ${convertedCount} converted from WMF, ${failedCount} failed`);
      if (failedCount > 0 && !hasImageMagick) {
        console.log('Install ImageMagick to convert WMF equations');
      }

      // Also try to get relationships to map rIds
      const relsXml = zip.readAsText('word/_rels/document.xml.rels');
      if (relsXml) {
        const parser = new DOMParser();
        const relsDoc = parser.parseFromString(relsXml, 'text/xml');
        const relationships = relsDoc.getElementsByTagName('Relationship');

        for (let i = 0; i < relationships.length; i++) {
          const rel = relationships[i];
          const rId = rel.getAttribute('Id');
          const target = rel.getAttribute('Target');

          if (rId && target && target.startsWith('media/')) {
            const originalName = path.basename(target);
            const savedPath = imageMap.get(originalName);
            if (savedPath) {
              imageMap.set(rId, savedPath);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error extracting images:', error);
    }

    return imageMap;
  }

  /**
   * Parse a Word document and extract questions
   */
  async parseWordDocument(filePath: string): Promise<ParseResult> {
    const result: ParseResult = {
      success: false,
      sections: [],
      totalQuestions: 0,
      questions: [],
      passages: [],
      warnings: [],
      errors: [],
    };

    try {
      // Extract equations from DOCX XML first
      const equations = await this.extractEquationsFromDocx(filePath);
      if (equations.size > 0) {
        result.warnings.push(`Found ${equations.size} mathematical equations`);
      }

      // Extract images from DOCX
      this.imageMap = await this.extractImagesFromDocx(filePath);
      if (this.imageMap.size > 0) {
        // Count web-compatible vs unsupported images
        let displayableCount = 0;
        let unsupportedCount = 0;
        for (const [_, value] of this.imageMap) {
          if (value.startsWith('[UNSUPPORTED:')) {
            unsupportedCount++;
          } else if (value.startsWith('/uploads/')) {
            displayableCount++;
          }
        }
        result.warnings.push(`Images: ${displayableCount} displayable (including converted equations), ${unsupportedCount} failed`);
        if (unsupportedCount > 0) {
          result.warnings.push('Note: Some images could not be converted. Check ImageMagick installation.');
        }
      }

      // Define custom style mappings for better HTML output
      const styleMap = [
        "p[style-name='Normal'] => p:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "b => strong",
        "i => em",
        "u => u",
        "strike => s",
      ];

      // Extract HTML for rich content with custom image handler
      const htmlResult = await mammoth.convertToHtml(
        { path: filePath },
        {
          styleMap: styleMap,
          convertImage: mammoth.images.imgElement(async (image: any) => {
            try {
              // Save images to uploads folder
              const buffer = await image.readAsBuffer();
              const ext = image.contentType?.split('/')[1] || 'png';
              const imageId = uuidv4();
              const imagePath = path.join(this.uploadsDir, `${imageId}.${ext}`);
              fs.writeFileSync(imagePath, buffer);
              return { src: `/uploads/question-papers/${imageId}.${ext}` };
            } catch (err) {
              console.error('Error saving image:', err);
              return { src: '' };
            }
          }),
        }
      );
      result.rawHtml = htmlResult.value;

      // Log mammoth messages for debugging
      if (htmlResult.messages.length > 0) {
        htmlResult.messages.forEach(msg => {
          result.warnings.push(`Mammoth: ${msg.message}`);
        });
      }

      // Extract text directly from DOCX XML to preserve equations as image references
      const xmlExtract = this.extractTextFromDocxXml(filePath);

      // Also get mammoth text as fallback
      const textResult = await mammoth.extractRawText({ path: filePath });

      // Use XML text - it includes image/equation placeholders
      result.rawText = xmlExtract.text || textResult.value;

      console.log('XML text length:', xmlExtract.text.length, 'Mammoth text length:', textResult.value.length);
      console.log('Image refs found:', xmlExtract.imageRefs.size);

      // Parse using the extracted text with equations
      const lines = result.rawText.split('\n').map(line => line.trim()).filter(line => line);
      const parsed = this.parseLines(lines, result.rawHtml);

      result.sections = parsed.sections;
      result.questions = parsed.questions;
      result.passages = parsed.passages;
      result.totalQuestions = parsed.questions.length;
      result.warnings = [...result.warnings, ...parsed.warnings];

      result.success = result.questions.length > 0;

      if (!result.success) {
        // Fall back to text-based parsing
        result.warnings.push('HTML parsing found no questions, trying text-based parsing...');
        const lines = textResult.value.split('\n').map(line => line.trim()).filter(line => line);
        const textParsed = this.parseLines(lines, result.rawHtml);

        result.sections = textParsed.sections;
        result.questions = textParsed.questions;
        result.passages = textParsed.passages;
        result.totalQuestions = textParsed.questions.length;
        result.warnings = [...result.warnings, ...textParsed.warnings];
        result.success = result.questions.length > 0;
      }

      if (!result.success) {
        result.errors.push('No questions were parsed from the document. Make sure questions are numbered (1., 2., etc.) with options (a), b), c), d)) and answers marked.');
      }

    } catch (error: any) {
      console.error('Parse error:', error);
      result.errors.push(`Failed to parse document: ${error.message}`);
    }

    return result;
  }

  /**
   * Parse questions from HTML content for better formatting preservation
   */
  private parseFromHtml(html: string, equations: Map<number, string>): {
    sections: ParsedSection[];
    questions: ParsedQuestion[];
    passages: ParsedPassage[];
    warnings: string[];
  } {
    const sections: ParsedSection[] = [];
    const questions: ParsedQuestion[] = [];
    const passages: ParsedPassage[] = [];
    const warnings: string[] = [];

    // Split HTML into paragraphs
    const paragraphs = html.split(/<\/p>|<br\s*\/?>/gi)
      .map(p => p.replace(/<[^>]*>/g, ' ').trim())
      .filter(p => p.length > 0);

    let currentSection: ParsedSection | null = null;
    let currentQuestion: ParsedQuestion | null = null;
    let currentPassage: ParsedPassage | null = null;
    let currentMode: 'question' | 'option' | 'answer' | 'solution' | 'passage' = 'question';
    let currentOptionId: string | null = null;
    let waitingForAnswer = false;
    let questionHtmlBuffer: string[] = [];

    // Extract HTML blocks for each question
    const htmlBlocks = html.split(/(?=<p[^>]*>\s*\d+\s*[.)]\s*)/gi);
    let htmlBlockIndex = 0;

    const finishQuestion = () => {
      if (currentQuestion) {
        // Validate question
        if (!currentQuestion.questionText || currentQuestion.questionText.length < 3) {
          warnings.push(`Question ${currentQuestion.questionNumber}: Empty or too short question text`);
        }
        if (currentQuestion.options.length < 2 &&
            currentQuestion.questionType !== 'INTEGER_TYPE' &&
            currentQuestion.questionType !== 'MATRIX_MATCH') {
          warnings.push(`Question ${currentQuestion.questionNumber}: Less than 2 options detected (found ${currentQuestion.options.length})`);
        }
        if (!currentQuestion.correctAnswer && !currentQuestion.correctAnswers?.length) {
          warnings.push(`Question ${currentQuestion.questionNumber}: No answer detected`);
        }

        // Assign HTML content
        if (questionHtmlBuffer.length > 0 && htmlBlockIndex < htmlBlocks.length) {
          currentQuestion.questionHtml = htmlBlocks[htmlBlockIndex] || '';
          htmlBlockIndex++;
        }

        questions.push(currentQuestion);

        if (currentSection) {
          currentSection.questions.push(currentQuestion);
          currentSection.endQuestion = currentQuestion.questionNumber;
        }

        if (currentPassage) {
          currentPassage.questionIds.push(currentQuestion.id);
        }
      }
      currentQuestion = null;
      questionHtmlBuffer = [];
      currentMode = 'question';
      currentOptionId = null;
      waitingForAnswer = false;
    };

    const finishPassage = () => {
      if (currentPassage) {
        passages.push(currentPassage);
        if (currentSection) {
          currentSection.passages = currentSection.passages || [];
          currentSection.passages.push(currentPassage);
        }
      }
      currentPassage = null;
    };

    for (let i = 0; i < paragraphs.length; i++) {
      const line = paragraphs[i];

      // Check for section headers
      let sectionType: ParsedQuestionType | null = null;
      for (const [type, pattern] of Object.entries(SECTION_PATTERNS)) {
        if (pattern.test(line)) {
          sectionType = type as ParsedQuestionType;
          break;
        }
      }

      if (sectionType) {
        finishQuestion();
        finishPassage();

        currentSection = {
          name: line,
          questionType: sectionType,
          startQuestion: questions.length + 1,
          endQuestion: questions.length + 1,
          questions: [],
        };
        sections.push(currentSection);
        continue;
      }

      // Check for passage
      const passageMatch = line.match(PASSAGE_PATTERN);
      if (passageMatch) {
        finishQuestion();
        finishPassage();

        currentPassage = {
          id: uuidv4(),
          title: line,
          passageText: '',
          questionIds: [],
        };

        // Read passage content until we hit a question number
        const passageLines: string[] = [];
        let j = i + 1;
        while (j < paragraphs.length) {
          const nextLine = paragraphs[j];
          if (QUESTION_NUMBER_PATTERN.test(nextLine) || QUESTION_WITH_TEXT_PATTERN.test(nextLine) ||
              QUESTION_WITH_TAB_PATTERN.test(nextLine)) {
            break;
          }
          passageLines.push(nextLine);
          j++;
        }
        currentPassage.passageText = passageLines.join('\n');
        i = j - 1;
        continue;
      }

      // Handle answer waiting
      if (waitingForAnswer && currentQuestion) {
        const multiMatch = line.match(MULTI_LETTER_ANSWER_PATTERN);
        const singleMatch = line.match(SINGLE_LETTER_ANSWER_PATTERN);

        if (multiMatch || singleMatch) {
          const answers = this.parseAnswer(line, currentQuestion.questionType);
          if (answers.length > 0) {
            if (currentQuestion.questionType === ParsedQuestionType.MULTIPLE_CORRECT) {
              currentQuestion.correctAnswers = answers;
            } else {
              currentQuestion.correctAnswer = answers[0];
            }
          }
          waitingForAnswer = false;
          currentMode = 'answer';
          continue;
        }
        waitingForAnswer = false;
      }

      // Check for question number
      const standaloneMatch = line.match(QUESTION_NUMBER_PATTERN);
      const withTextMatch = line.match(QUESTION_WITH_TEXT_PATTERN);

      if (standaloneMatch || withTextMatch) {
        finishQuestion();

        let questionNum: number;
        let questionText: string;

        if (withTextMatch) {
          questionNum = parseInt(withTextMatch[1], 10);
          questionText = withTextMatch[2].trim();
        } else {
          questionNum = parseInt(standaloneMatch![1], 10);
          questionText = '';
        }

        currentQuestion = {
          id: uuidv4(),
          questionNumber: questionNum,
          questionType: currentSection?.questionType || ParsedQuestionType.SINGLE_CORRECT,
          questionText: questionText,
          options: [],
          parseWarnings: [],
        };

        if (currentPassage) {
          currentQuestion.passageId = currentPassage.id;
          currentQuestion.questionType = ParsedQuestionType.COMPREHENSION;
        }

        currentMode = 'question';
        continue;
      }

      // Check for option
      const optionMatch = matchOption(line);
      if (optionMatch && currentQuestion) {
        currentOptionId = optionMatch.id;
        const optionText = optionMatch.text;

        const existingOpt = currentQuestion.options.find(o => o.id === currentOptionId);
        if (!existingOpt) {
          currentQuestion.options.push({
            id: currentOptionId,
            text: optionText,
          });
        }

        currentMode = 'option';
        continue;
      }

      // Check for answer with value
      const answerWithValueMatch = line.match(ANSWER_WITH_VALUE_PATTERN);
      if (answerWithValueMatch && currentQuestion) {
        const answerText = answerWithValueMatch[1].trim();
        const answers = this.parseAnswer(answerText, currentQuestion.questionType);

        if (answers.length > 0) {
          if (currentQuestion.questionType === ParsedQuestionType.MULTIPLE_CORRECT) {
            currentQuestion.correctAnswers = answers;
          } else {
            currentQuestion.correctAnswer = answers[0];
          }
        }
        currentMode = 'answer';
        continue;
      }

      // Check for answer marker
      if (ANSWER_PATTERN.test(line) && currentQuestion) {
        waitingForAnswer = true;
        currentMode = 'answer';
        continue;
      }

      // Check for solution
      if (SOLUTION_PATTERN.test(line)) {
        currentMode = 'solution';
        continue;
      }

      // Handle continuation lines
      if (currentQuestion) {
        if (currentMode === 'question') {
          if (currentQuestion.questionText) {
            currentQuestion.questionText += ' ' + line;
          } else {
            currentQuestion.questionText = line;
          }
        } else if (currentMode === 'option' && currentOptionId) {
          const opt = currentQuestion.options.find(o => o.id === currentOptionId);
          if (opt) {
            opt.text += ' ' + line;
          }
        } else if (currentMode === 'solution') {
          if (currentQuestion.solution) {
            currentQuestion.solution += ' ' + line;
          } else {
            currentQuestion.solution = line;
          }
        }
      }
    }

    // Finish last question and passage
    finishQuestion();
    finishPassage();

    return { sections, questions, passages, warnings };
  }

  /**
   * Parse lines of text to extract questions
   */
  private parseLines(lines: string[], html?: string): {
    sections: ParsedSection[];
    questions: ParsedQuestion[];
    passages: ParsedPassage[];
    warnings: string[];
  } {
    const sections: ParsedSection[] = [];
    const questions: ParsedQuestion[] = [];
    const passages: ParsedPassage[] = [];
    const warnings: string[] = [];

    let currentSection: ParsedSection | null = null;
    let currentQuestion: ParsedQuestion | null = null;
    let currentPassage: ParsedPassage | null = null;
    let currentMode: 'question' | 'option' | 'answer' | 'solution' | 'passage' | 'matrix' = 'question';
    let currentOptionId: string | null = null;
    let lineBuffer: string[] = [];
    let waitingForAnswer = false;
    let lastQuestionNumber = 0; // Track last question number to validate sequence
    const seenQuestionNumbers = new Set<number>(); // Track already parsed question numbers
    // Matrix match tracking
    let matrixColumnA: { id: string; text: string }[] = [];
    let matrixColumnB: { id: string; text: string }[] = [];
    let matrixState: {
      currentId?: string;
      currentColumn?: 'A' | 'B';
      currentText: string;
    } = { currentText: '' };

    // Patterns for matrix items (ID only, without requiring text on same line)
    const matrixColAIdOnly = /^[\(]?([A-D]|I{1,3}V?|IV)[\)]?\.?\s*$/i;     // A), B), C), D), I), II), III), IV)
    const matrixColBIdOnly = /^[\(]?([PQRS1-4])[\)]?\.?\s*$/i;             // P), Q), R), S), 1), 2), 3), 4)
    const matrixColAWithText = /^[\(]?([A-D]|I{1,3}V?|IV)[\)]?\s*[.):\-→]?\s*(.+)/i;  // A) text or A) - text
    const matrixColBWithText = /^[\(]?([PQRS1-4])[\)]?\s*[.):\-]?\s*(.+)/i;  // P) text

    const finishQuestion = () => {
      if (currentQuestion) {
        // Save any pending matrix state before finishing
        if (matrixState.currentId && matrixState.currentColumn && matrixState.currentText.length > 0) {
          if (matrixState.currentColumn === 'A') {
            if (!matrixColumnA.find(c => c.id === matrixState.currentId)) {
              matrixColumnA.push({ id: matrixState.currentId, text: matrixState.currentText });
              console.log(`[MATRIX Q${currentQuestion.questionNumber}] Added Col A (final): (${matrixState.currentId}) ${matrixState.currentText.substring(0, 50)}...`);
            }
          } else {
            if (!matrixColumnB.find(c => c.id === matrixState.currentId)) {
              matrixColumnB.push({ id: matrixState.currentId, text: matrixState.currentText });
              console.log(`[MATRIX Q${currentQuestion.questionNumber}] Added Col B (final): (${matrixState.currentId}) ${matrixState.currentText.substring(0, 50)}...`);
            }
          }
        }
        matrixState = { currentText: '' };

        // Process any remaining buffer
        if (lineBuffer.length > 0) {
          if (currentMode === 'solution') {
            // Append to existing solution if any
            const bufferText = lineBuffer.join(' ').trim();
            if (currentQuestion.solution) {
              currentQuestion.solution += ' ' + bufferText;
            } else {
              currentQuestion.solution = bufferText;
            }
          } else if (currentMode === 'option' && currentOptionId) {
            const opt = currentQuestion.options.find(o => o.id === currentOptionId);
            if (opt) {
              opt.text += ' ' + lineBuffer.join(' ').trim();
            }
          }
        }

        // Add matrix data for MATRIX_MATCH questions
        if (currentQuestion.questionType === ParsedQuestionType.MATRIX_MATCH) {
          if (matrixColumnA.length > 0 || matrixColumnB.length > 0) {
            currentQuestion.matrixData = {
              leftColumn: matrixColumnA,
              rightColumn: matrixColumnB,
            };
            console.log(`[MATRIX Q${currentQuestion.questionNumber}] Column I: ${matrixColumnA.length} items, Column II: ${matrixColumnB.length} items`);
            matrixColumnA.forEach(item => console.log(`  Col I: (${item.id}) ${item.text.substring(0, 50)}...`));
            matrixColumnB.forEach(item => console.log(`  Col II: (${item.id}) ${item.text.substring(0, 50)}...`));
          } else {
            console.log(`[MATRIX Q${currentQuestion.questionNumber}] WARNING: No matrix columns found!`);
          }
        }

        // Debug: Log parsed question summary
        console.log(`[Q${currentQuestion.questionNumber}] Type: ${currentQuestion.questionType}, Options: ${currentQuestion.options.length}, Answer: ${currentQuestion.correctAnswer || currentQuestion.correctAnswers?.join(',') || 'none'}`);
        if (currentQuestion.options.length > 0) {
          currentQuestion.options.forEach(opt => {
            console.log(`  - ${opt.id}: "${opt.text.substring(0, 40)}..."`);
          });
        }

        // Validate question
        if (!currentQuestion.questionText || currentQuestion.questionText.length < 3) {
          warnings.push(`Question ${currentQuestion.questionNumber}: Empty or too short question text`);
        }
        if (currentQuestion.options.length < 2 &&
            currentQuestion.questionType !== 'INTEGER_TYPE' &&
            currentQuestion.questionType !== 'MATRIX_MATCH') {
          warnings.push(`Question ${currentQuestion.questionNumber}: Less than 2 options detected (found ${currentQuestion.options.length})`);
        }
        if (!currentQuestion.correctAnswer && !currentQuestion.correctAnswers?.length) {
          warnings.push(`Question ${currentQuestion.questionNumber}: No answer detected`);
        }

        questions.push(currentQuestion);

        if (currentSection) {
          currentSection.questions.push(currentQuestion);
          currentSection.endQuestion = currentQuestion.questionNumber;
        }

        if (currentPassage) {
          currentPassage.questionIds.push(currentQuestion.id);
        }
      }
      currentQuestion = null;
      lineBuffer = [];
      currentMode = 'question';
      currentOptionId = null;
      waitingForAnswer = false;
    };

    const finishPassage = () => {
      if (currentPassage) {
        passages.push(currentPassage);
        if (currentSection) {
          currentSection.passages = currentSection.passages || [];
          currentSection.passages.push(currentPassage);
        }
      }
      currentPassage = null;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for section headers
      let sectionType: ParsedQuestionType | null = null;
      for (const [type, pattern] of Object.entries(SECTION_PATTERNS)) {
        if (pattern.test(line)) {
          sectionType = type as ParsedQuestionType;
          break;
        }
      }

      if (sectionType) {
        finishQuestion();
        finishPassage();

        currentSection = {
          name: line,
          questionType: sectionType,
          startQuestion: questions.length + 1,
          endQuestion: questions.length + 1,
          questions: [],
        };
        sections.push(currentSection);
        continue;
      }

      // Check for passage
      const passageMatch = line.match(PASSAGE_PATTERN);
      if (passageMatch) {
        finishQuestion();
        finishPassage();

        currentPassage = {
          id: uuidv4(),
          title: line,
          passageText: '',
          questionIds: [],
        };

        // Read passage content until we hit a question number
        const passageLines: string[] = [];
        let j = i + 1;
        while (j < lines.length) {
          const nextLine = lines[j];
          // Check if this looks like a question number (standalone, with period, or with tab)
          if (QUESTION_NUMBER_PATTERN.test(nextLine) || QUESTION_WITH_TEXT_PATTERN.test(nextLine) ||
              QUESTION_WITH_TAB_PATTERN.test(nextLine)) {
            break;
          }
          passageLines.push(nextLine);
          j++;
        }
        currentPassage.passageText = passageLines.join('\n');
        i = j - 1; // Adjust index
        continue;
      }

      // If we're waiting for answer (saw "Ans." on previous line), check if this is the answer
      if (waitingForAnswer && currentQuestion) {
        // For INTEGER_TYPE, look for numeric answer
        if (currentQuestion.questionType === ParsedQuestionType.INTEGER_TYPE) {
          const numericMatch = line.match(/^[-]?\d+(?:\.\d+)?$/);
          if (numericMatch) {
            currentQuestion.correctAnswer = numericMatch[0];
            waitingForAnswer = false;
            currentMode = 'answer';
            continue;
          }
        } else {
          // For MCQ types, look for letter answers
          const multiMatch = line.match(MULTI_LETTER_ANSWER_PATTERN);
          const singleMatch = line.match(SINGLE_LETTER_ANSWER_PATTERN);

          if (multiMatch || singleMatch) {
            const answers = this.parseAnswer(line, currentQuestion.questionType);
            if (answers.length > 0) {
              if (currentQuestion.questionType === ParsedQuestionType.MULTIPLE_CORRECT) {
                currentQuestion.correctAnswers = answers;
              } else {
                currentQuestion.correctAnswer = answers[0];
              }
            }
            waitingForAnswer = false;
            currentMode = 'answer';
            continue;
          }
        }
        waitingForAnswer = false;
      }

      // Check for question number (standalone like "1." or "1", or with text like "1. Text" or "1\tText")
      const standaloneMatch = line.match(QUESTION_NUMBER_PATTERN);
      const withTextMatch = line.match(QUESTION_WITH_TEXT_PATTERN);
      const withTabMatch = line.match(QUESTION_WITH_TAB_PATTERN);

      if (standaloneMatch || withTextMatch || withTabMatch) {
        let questionNum: number;
        let questionText: string;

        if (withTextMatch) {
          questionNum = parseInt(withTextMatch[1], 10);
          questionText = withTextMatch[2].trim();
        } else if (withTabMatch) {
          questionNum = parseInt(withTabMatch[1], 10);
          questionText = withTabMatch[2].trim();
        } else {
          questionNum = parseInt(standaloneMatch![1], 10);
          questionText = '';
        }

        // Validate question number to avoid false positives
        // Skip if:
        // 1. Number is too large (likely a year, page count, etc.) - allow up to 500 for large tests
        // 2. We've already seen this question number (duplicate)
        // 3. We're in solution mode and this looks like a random number in text
        const isValidQuestionNumber = (num: number): boolean => {
          // Maximum reasonable question number
          if (num > 500) return false;

          // Already seen this question
          if (seenQuestionNumbers.has(num)) return false;

          // If we're in solution mode, be stricter
          if (currentMode === 'solution') {
            // Only accept if it's the next expected question OR a reasonable new question
            // This prevents numbers in solution text from being treated as questions
            if (num !== lastQuestionNumber + 1) {
              // Allow if it's within expected range but not a random large number
              if (num > lastQuestionNumber + 5 || num < lastQuestionNumber) {
                return false;
              }
            }
          }

          // If this is the first question, accept small numbers (1-10)
          if (lastQuestionNumber === 0) {
            return num <= 10; // First question should be 1-10 typically
          }

          // For subsequent questions:
          // - Allow sequential numbers
          // - Allow reasonable jumps (sections might skip numbers)
          // - But reject huge jumps that indicate parsing errors

          // If number is less than what we've seen, it's probably not a new question
          // unless it's a multi-section paper starting fresh
          if (num < lastQuestionNumber && num !== 1) {
            // Check if this could be a section restart
            if (num > 10) return false; // High numbers going backwards = not valid
          }

          return true;
        };

        if (!isValidQuestionNumber(questionNum)) {
          // Not a valid question number - treat as continuation text
          if (currentQuestion) {
            if (currentMode === 'question') {
              if (currentQuestion.questionText) {
                currentQuestion.questionText += ' ' + line;
              } else {
                currentQuestion.questionText = line;
              }
            } else if (currentMode === 'solution') {
              lineBuffer.push(line);
            }
          }
          continue;
        }

        finishQuestion();

        // Reset matrix columns for new question
        matrixColumnA = [];
        matrixColumnB = [];
        matrixState = { currentText: '' };

        currentQuestion = {
          id: uuidv4(),
          questionNumber: questionNum,
          questionType: currentSection?.questionType || ParsedQuestionType.SINGLE_CORRECT,
          questionText: questionText,
          options: [],
          parseWarnings: [],
        };

        // Track this question number
        seenQuestionNumbers.add(questionNum);
        lastQuestionNumber = questionNum;

        if (currentPassage) {
          currentQuestion.passageId = currentPassage.id;
          currentQuestion.questionType = ParsedQuestionType.COMPREHENSION;
        }

        // Set matrix mode for MATRIX_MATCH questions
        if (currentQuestion.questionType === ParsedQuestionType.MATRIX_MATCH) {
          currentMode = 'matrix';
        } else {
          currentMode = 'question';
        }
        continue;
      }

      // Detect matrix match content based on "Column I" / "Column II" headers
      // This allows matrix match detection even without a separate section header
      if (currentQuestion && /^column[\s\-]*(i|ii|1|2)\b/i.test(line)) {
        // Found a Column header - this is likely a matrix match question
        if (currentQuestion.questionType !== ParsedQuestionType.MATRIX_MATCH) {
          console.log(`[Q${currentQuestion.questionNumber}] Detected as MATRIX_MATCH based on column header: "${line}"`);
          currentQuestion.questionType = ParsedQuestionType.MATRIX_MATCH;
          currentMode = 'matrix';
        }
        continue; // Skip the column header line
      }

      // Detect matrix from tab-separated table header row (e.g., "Column I\tColumn II")
      if (currentQuestion && line.includes('\t') && /column[\s\-]*(i|1)/i.test(line) && /column[\s\-]*(ii|2)/i.test(line)) {
        console.log(`[Q${currentQuestion.questionNumber}] Detected as MATRIX_MATCH based on table header: "${line}"`);
        currentQuestion.questionType = ParsedQuestionType.MATRIX_MATCH;
        currentMode = 'matrix';
        continue; // Skip the header row
      }

      // Detect matrix from tab-separated row with matching items
      // Format can be: A)\ttext\tP)\ttext OR (A) text\t(P) text
      if (currentQuestion && line.includes('\t')) {
        const rawParts = line.split('\t');
        console.log(`[MATRIX RAW Q${currentQuestion.questionNumber}] Raw tab parts (${rawParts.length}): ${JSON.stringify(rawParts.map(p => p.substring(0, 50)))}`);

        let tabParts = line.split('\t').map(p => p.trim()).filter(p => p);

        // Pre-process: Merge cells where ID letter and closing paren are in separate cells
        // Pattern: ["A", ")", "text"] should become ["A)", "text"]
        // Also handles: ["(", "A", ")", "text"] -> ["(A)", "text"] and ["A", ")", "B", ")", ...] matrix IDs
        const mergedParts: string[] = [];
        for (let i = 0; i < tabParts.length; i++) {
          const part = tabParts[i];
          const nextPart = tabParts[i + 1];

          // Check if current part is just a letter (A-D or P-S or 1-4) and next is just paren/punctuation
          if (/^[\(]?[A-DPQRS1-4]$/i.test(part) && /^[\)\.]$/.test(nextPart || '')) {
            // Merge current and next
            mergedParts.push(part + nextPart);
            i++; // Skip next part
          }
          // Check if current is opening paren and next is letter
          else if (part === '(' && /^[A-DPQRS1-4]$/i.test(nextPart || '')) {
            // Check if part after that is closing paren
            const afterNext = tabParts[i + 2];
            if (afterNext === ')') {
              mergedParts.push('(' + nextPart + ')');
              i += 2; // Skip next two parts
            } else {
              mergedParts.push(part);
            }
          } else {
            mergedParts.push(part);
          }
        }

        // Use merged parts if we actually merged anything
        if (mergedParts.length !== tabParts.length) {
          console.log(`[MATRIX MERGE] Original: ${JSON.stringify(tabParts.slice(0, 8))} -> Merged: ${JSON.stringify(mergedParts.slice(0, 8))}`);
          tabParts = mergedParts;
        }

        // Debug: Log tab parts for matrix detection
        if (tabParts.length >= 2 && /^[\(]?[A-D][\)]?/i.test(tabParts[0])) {
          console.log(`[MATRIX DEBUG Q${currentQuestion.questionNumber}] Tab parts (${tabParts.length}): ${JSON.stringify(tabParts.map(p => p.substring(0, 60)))}`);
        }

        // Pattern for ID only: A) or (A) or A. etc
        const idOnlyPattern = /^[\(]?([A-D])[\)]?\.?$/i;
        const idOnlyPatternB = /^[\(]?([PQRS1-4])[\)]?\.?$/i;
        // Pattern for ID with text: (A) text or A) text
        const idWithTextPattern = /^[\(]?([A-D])[\)]?\s*[.):\-]?\s*(.+)/i;
        const idWithTextPatternB = /^[\(]?([PQRS1-4])[\)]?\s*[.):\-]?\s*(.+)/i;

        // Check for format: ID\tText\tID\tText (4+ parts where even indices are IDs)
        if (tabParts.length >= 4) {
          const firstIdMatch = tabParts[0].match(idOnlyPattern);
          const thirdIdMatch = tabParts[2].match(idOnlyPatternB);

          if (firstIdMatch && thirdIdMatch) {
            // This is matrix format: A)\tText A\tP)\tText P
            if (currentQuestion.questionType !== ParsedQuestionType.MATRIX_MATCH) {
              console.log(`[Q${currentQuestion.questionNumber}] Detected as MATRIX_MATCH based on table row: "${line.substring(0, 80)}..."`);
              currentQuestion.questionType = ParsedQuestionType.MATRIX_MATCH;
            }

            const colAId = firstIdMatch[1].toUpperCase();
            const colAText = (tabParts[1] || '').trim();
            const colBId = thirdIdMatch[1].toUpperCase();
            const colBText = (tabParts[3] || '').trim();

            // Log the actual values for debugging
            console.log(`  [MATRIX ROW] ColA: id=${colAId}, text="${colAText.substring(0, 30)}", ColB: id=${colBId}, text="${colBText.substring(0, 30)}"`);

            // Only add if text is meaningful (not just punctuation)
            const isValidText = (t: string) => t && t.length > 2 && !/^[\)\.\,\s]+$/.test(t);

            if (!matrixColumnA.find(c => c.id === colAId) && isValidText(colAText)) {
              matrixColumnA.push({ id: colAId, text: colAText });
              console.log(`    Added Col I: (${colAId}) ${colAText.substring(0, 50)}...`);
            }
            if (!matrixColumnB.find(c => c.id === colBId) && isValidText(colBText)) {
              matrixColumnB.push({ id: colBId, text: colBText });
              console.log(`    Added Col II: (${colBId}) ${colBText.substring(0, 50)}...`);
            }

            currentMode = 'matrix';
            continue;
          }
        }

        // Check for format: ID\tID (IDs only, no text - texts might be in next row)
        if (tabParts.length >= 2) {
          const firstIdMatch = tabParts[0].match(idOnlyPattern);
          const secondIdMatch = tabParts[1].match(idOnlyPatternB);

          if (firstIdMatch && secondIdMatch && tabParts.length === 2) {
            // Row with just IDs like "A)\tP)" - mark as matrix and expect text on next row
            if (currentQuestion.questionType !== ParsedQuestionType.MATRIX_MATCH) {
              console.log(`[Q${currentQuestion.questionNumber}] Detected as MATRIX_MATCH based on ID-only row: "${line}"`);
              currentQuestion.questionType = ParsedQuestionType.MATRIX_MATCH;
            }

            const colAId = firstIdMatch[1].toUpperCase();
            const colBId = secondIdMatch[1].toUpperCase();

            // Add with placeholder text - will be updated when we find the actual text
            if (!matrixColumnA.find(c => c.id === colAId)) {
              matrixColumnA.push({ id: colAId, text: `[${colAId}]` });
              console.log(`  Added Col I placeholder: (${colAId})`);
            }
            if (!matrixColumnB.find(c => c.id === colBId)) {
              matrixColumnB.push({ id: colBId, text: `[${colBId}]` });
              console.log(`  Added Col II placeholder: (${colBId})`);
            }

            currentMode = 'matrix';
            continue;
          }

          // Check if this is a text-only row that follows ID-only rows
          // Format: "Motion\tTwo dim" - texts for previous IDs
          if (!firstIdMatch && !secondIdMatch && matrixColumnA.length > 0 && matrixColumnB.length > 0) {
            // Check if we have placeholders that need to be filled
            const colAWithPlaceholder = matrixColumnA.find(c => c.text.startsWith('['));
            const colBWithPlaceholder = matrixColumnB.find(c => c.text.startsWith('['));

            if (colAWithPlaceholder && tabParts[0] && tabParts[0].length > 2) {
              console.log(`  Updated Col I (${colAWithPlaceholder.id}) text: "${tabParts[0].substring(0, 30)}..."`);
              colAWithPlaceholder.text = tabParts[0];
            }
            if (colBWithPlaceholder && tabParts[1] && tabParts[1].length > 2) {
              console.log(`  Updated Col II (${colBWithPlaceholder.id}) text: "${tabParts[1].substring(0, 30)}..."`);
              colBWithPlaceholder.text = tabParts[1];
            }

            if (colAWithPlaceholder || colBWithPlaceholder) {
              currentMode = 'matrix';
              continue;
            }
          }
        }

        // Check for format: (A) text\t(P) text (2 parts with ID+text combined)
        if (tabParts.length >= 2) {
          const colAMatch = tabParts[0].match(idWithTextPattern);
          // Look for Column B pattern in any remaining part
          for (let partIdx = 1; partIdx < tabParts.length; partIdx++) {
            const colBMatch = tabParts[partIdx].match(idWithTextPatternB);
            if (colAMatch && colBMatch && colAMatch[2] && colBMatch[2]) {
              // This is a matrix row with both Column A and Column B items
              if (currentQuestion.questionType !== ParsedQuestionType.MATRIX_MATCH) {
                console.log(`[Q${currentQuestion.questionNumber}] Detected as MATRIX_MATCH based on combined row: "${line.substring(0, 60)}..."`);
                currentQuestion.questionType = ParsedQuestionType.MATRIX_MATCH;
              }

              const colAId = colAMatch[1].toUpperCase();
              const colBId = colBMatch[1].toUpperCase();

              if (!matrixColumnA.find(c => c.id === colAId)) {
                matrixColumnA.push({ id: colAId, text: colAMatch[2].trim() });
                console.log(`  Added Col I: (${colAId}) ${colAMatch[2].substring(0, 50)}...`);
              }
              if (!matrixColumnB.find(c => c.id === colBId)) {
                matrixColumnB.push({ id: colBId, text: colBMatch[2].trim() });
                console.log(`  Added Col II: (${colBId}) ${colBMatch[2].substring(0, 50)}...`);
              }

              currentMode = 'matrix';
              break;
            }
          }
          if (currentMode === 'matrix') continue;
        }
      }

      // For MATRIX_MATCH questions (or questions with matrix content detected), parse column items using state machine
      if (currentQuestion && (currentQuestion.questionType === ParsedQuestionType.MATRIX_MATCH ||
          currentMode === 'matrix')) {
        const trimmedLine = line.trim();

        // State machine for matrix parsing:
        // 1. If we see an ID pattern (with or without text), record it
        // 2. If we see non-ID text and have a pending ID, assign text to that ID
        // 3. Handle both combined format (ID + text on same line) and separate format (ID on one line, text on next)

        // Try to match Column A ID (with text on same line)
        const colAWithTextMatch = trimmedLine.match(matrixColAWithText);
        if (colAWithTextMatch && currentMode === 'matrix') {
          const id = colAWithTextMatch[1].toUpperCase();
          const text = colAWithTextMatch[2]?.trim() || '';
          if (text && !matrixColumnA.find(c => c.id === id)) {
            matrixColumnA.push({ id, text });
            console.log(`[MATRIX Q${currentQuestion.questionNumber}] Added Col A: (${id}) ${text.substring(0, 50)}...`);
            currentMode = 'matrix';
            continue;
          }
        }

        // Try to match Column B ID (with text on same line)
        const colBWithTextMatch = trimmedLine.match(matrixColBWithText);
        if (colBWithTextMatch && currentMode === 'matrix') {
          const id = colBWithTextMatch[1].toUpperCase();
          const text = colBWithTextMatch[2]?.trim() || '';
          if (text && !matrixColumnB.find(c => c.id === id)) {
            matrixColumnB.push({ id, text });
            console.log(`[MATRIX Q${currentQuestion.questionNumber}] Added Col B: (${id}) ${text.substring(0, 50)}...`);
            currentMode = 'matrix';
            continue;
          }
        }

        // Try to match Column A ID only (ID by itself, text on next line)
        const colAIdMatch = trimmedLine.match(matrixColAIdOnly);
        if (colAIdMatch && currentMode === 'matrix') {
          // Save any pending text from previous ID
          if (matrixState.currentId && matrixState.currentColumn && matrixState.currentText.length > 0) {
            if (matrixState.currentColumn === 'A') {
              if (!matrixColumnA.find(c => c.id === matrixState.currentId)) {
                matrixColumnA.push({ id: matrixState.currentId, text: matrixState.currentText });
                console.log(`[MATRIX Q${currentQuestion.questionNumber}] Added Col A (from state): (${matrixState.currentId}) ${matrixState.currentText.substring(0, 50)}...`);
              }
            } else {
              if (!matrixColumnB.find(c => c.id === matrixState.currentId)) {
                matrixColumnB.push({ id: matrixState.currentId, text: matrixState.currentText });
                console.log(`[MATRIX Q${currentQuestion.questionNumber}] Added Col B (from state): (${matrixState.currentId}) ${matrixState.currentText.substring(0, 50)}...`);
              }
            }
          }

          // Start new Column A ID
          matrixState.currentId = colAIdMatch[1].toUpperCase();
          matrixState.currentColumn = 'A';
          matrixState.currentText = '';

          if (currentQuestion.questionType !== ParsedQuestionType.MATRIX_MATCH) {
            currentQuestion.questionType = ParsedQuestionType.MATRIX_MATCH;
          }
          currentMode = 'matrix';
          continue;
        }

        // Try to match Column B ID only (ID by itself, text on next line)
        const colBIdMatch = trimmedLine.match(matrixColBIdOnly);
        if (colBIdMatch && currentMode === 'matrix' && matrixColumnA.length > 0) {
          // Save any pending Column A text
          if (matrixState.currentId && matrixState.currentColumn === 'A' && matrixState.currentText.length > 0) {
            if (!matrixColumnA.find(c => c.id === matrixState.currentId)) {
              matrixColumnA.push({ id: matrixState.currentId, text: matrixState.currentText });
              console.log(`[MATRIX Q${currentQuestion.questionNumber}] Added Col A (from state): (${matrixState.currentId}) ${matrixState.currentText.substring(0, 50)}...`);
            }
          }

          // Start new Column B ID
          matrixState.currentId = colBIdMatch[1].toUpperCase();
          matrixState.currentColumn = 'B';
          matrixState.currentText = '';

          currentMode = 'matrix';
          continue;
        }

        // If we're in matrix mode and have a pending ID, this line might be its text
        if (matrixState.currentId && matrixState.currentColumn && trimmedLine.length > 2 &&
            !trimmedLine.match(/^[\t\s]*$/) &&
            !matrixColAIdOnly.test(trimmedLine) &&
            !matrixColBIdOnly.test(trimmedLine)) {
          // This line is text for the pending ID
          if (matrixState.currentText) {
            matrixState.currentText += ' ' + trimmedLine;
          } else {
            matrixState.currentText = trimmedLine;
          }
          currentMode = 'matrix';
          continue;
        }
      }

      // Check for option (skip for INTEGER_TYPE questions - they don't have options)
      const optionMatch = matchOption(line);
      if (optionMatch && currentQuestion && currentQuestion.questionType !== ParsedQuestionType.INTEGER_TYPE) {
        // Save previous option content
        if (currentOptionId && lineBuffer.length > 0) {
          const opt = currentQuestion.options.find(o => o.id === currentOptionId);
          if (opt) {
            opt.text += ' ' + lineBuffer.join(' ').trim();
          }
        }
        lineBuffer = [];

        currentOptionId = optionMatch.id;
        const optionText = optionMatch.text;

        // Only add if we don't already have this option
        const existingOpt = currentQuestion.options.find(o => o.id === currentOptionId);
        if (!existingOpt) {
          currentQuestion.options.push({
            id: currentOptionId,
            text: optionText,
          });
        }

        currentMode = 'option';
        continue;
      }

      // Check for integer/numeric answer first (for INTEGER_TYPE questions)
      const integerAnswerMatch = line.match(INTEGER_ANSWER_PATTERN);
      if (integerAnswerMatch && currentQuestion && currentQuestion.questionType === ParsedQuestionType.INTEGER_TYPE) {
        currentQuestion.correctAnswer = integerAnswerMatch[1].trim();
        currentMode = 'answer';
        currentOptionId = null;
        lineBuffer = [];
        continue;
      }

      // Check for answer with value on same line (Ans. A or Ans. A,B,C) - for MCQ types
      const answerWithValueMatch = line.match(ANSWER_WITH_VALUE_PATTERN);
      if (answerWithValueMatch && currentQuestion && currentQuestion.questionType !== ParsedQuestionType.INTEGER_TYPE) {
        // Save current option buffer first
        if (currentMode === 'option' && currentOptionId && lineBuffer.length > 0) {
          const opt = currentQuestion.options.find(o => o.id === currentOptionId);
          if (opt) {
            opt.text += ' ' + lineBuffer.join(' ').trim();
          }
        }

        const answerText = answerWithValueMatch[1].trim();
        const answers = this.parseAnswer(answerText, currentQuestion.questionType);

        if (answers.length > 0) {
          if (currentQuestion.questionType === ParsedQuestionType.MULTIPLE_CORRECT) {
            currentQuestion.correctAnswers = answers;
          } else {
            currentQuestion.correctAnswer = answers[0];
          }
        }
        currentMode = 'answer';
        currentOptionId = null;
        lineBuffer = [];
        continue;
      }

      // Check for answer marker without value (Ans. on its own line)
      if (ANSWER_PATTERN.test(line) && currentQuestion) {
        // Save current option buffer first
        if (currentMode === 'option' && currentOptionId && lineBuffer.length > 0) {
          const opt = currentQuestion.options.find(o => o.id === currentOptionId);
          if (opt) {
            opt.text += ' ' + lineBuffer.join(' ').trim();
          }
        }
        waitingForAnswer = true;
        currentMode = 'answer';
        currentOptionId = null;
        lineBuffer = [];
        continue;
      }

      // Check for solution with content on same line (Sol. explanation here)
      const solutionWithValueMatch = line.match(SOLUTION_WITH_VALUE_PATTERN);
      if (solutionWithValueMatch && currentQuestion) {
        // Save current option buffer first
        if (currentMode === 'option' && currentOptionId && lineBuffer.length > 0) {
          const opt = currentQuestion.options.find(o => o.id === currentOptionId);
          if (opt) {
            opt.text += ' ' + lineBuffer.join(' ').trim();
          }
        }
        currentQuestion.solution = solutionWithValueMatch[1].trim();
        currentMode = 'solution';
        currentOptionId = null;
        lineBuffer = [];
        continue;
      }

      // Check for solution marker without content (Sol. on its own line)
      if (SOLUTION_PATTERN.test(line) && currentQuestion) {
        // Save current option buffer first
        if (currentMode === 'option' && currentOptionId && lineBuffer.length > 0) {
          const opt = currentQuestion.options.find(o => o.id === currentOptionId);
          if (opt) {
            opt.text += ' ' + lineBuffer.join(' ').trim();
          }
        }
        currentMode = 'solution';
        currentOptionId = null;
        lineBuffer = [];
        continue;
      }

      // Handle continuation lines based on current mode
      if (currentQuestion) {
        // Before adding to any buffer, check if this line is actually a section header
        // This handles cases where section headers appear after solutions
        const possibleSectionType = isSectionHeader(line);
        if (possibleSectionType && (currentMode === 'solution' || currentMode === 'answer')) {
          // This is a section header, not continuation - process it
          finishQuestion();
          finishPassage();

          currentSection = {
            name: line,
            questionType: possibleSectionType,
            startQuestion: questions.length + 1,
            endQuestion: questions.length + 1,
            questions: [],
          };
          sections.push(currentSection);
          continue;
        }

        if (currentMode === 'question') {
          if (currentQuestion.questionText) {
            currentQuestion.questionText += ' ' + line;
          } else {
            currentQuestion.questionText = line;
          }
        } else if (currentMode === 'option' && currentOptionId) {
          lineBuffer.push(line);
        } else if (currentMode === 'solution') {
          lineBuffer.push(line);
        }
      }
    }

    // Finish last question and passage
    finishQuestion();
    finishPassage();

    // Add summary info for debugging
    if (questions.length > 0) {
      const questionNumbers = questions.map(q => q.questionNumber).sort((a, b) => a - b);
      const minQ = questionNumbers[0];
      const maxQ = questionNumbers[questionNumbers.length - 1];
      const expectedCount = maxQ - minQ + 1;

      console.log(`Parsed ${questions.length} questions (Q${minQ} to Q${maxQ})`);

      if (questions.length !== expectedCount) {
        warnings.push(`Gap detected: Found ${questions.length} questions from Q${minQ} to Q${maxQ} (expected ${expectedCount})`);

        // Find missing question numbers
        const missing: number[] = [];
        for (let i = minQ; i <= maxQ; i++) {
          if (!seenQuestionNumbers.has(i)) {
            missing.push(i);
          }
        }
        if (missing.length > 0 && missing.length <= 10) {
          warnings.push(`Missing question numbers: ${missing.join(', ')}`);
        }
      }
    }

    return { sections, questions, passages, warnings };
  }

  /**
   * Parse answer text to extract correct options
   */
  private parseAnswer(answerText: string, questionType: ParsedQuestionType): string[] {
    const answers: string[] = [];

    // Handle various answer formats
    // "A" or "a" or "1" or "2"
    // "A, B, C" or "A,B,C" or "1,2,3"
    // "(A)" or "(A,B)" or "(1)" or "(1,2)"

    const cleaned = answerText.toLowerCase().replace(/[()]/g, '');

    // Map numeric to letter: 1->a, 2->b, 3->c, 4->d
    const numToLetter: Record<string, string> = { '1': 'a', '2': 'b', '3': 'c', '4': 'd' };

    // Split by comma, space, or 'and'
    const parts = cleaned.split(/[,\s]+|and/i).filter(p => p);

    for (const part of parts) {
      const trimmed = part.trim();
      // Check for letter answer (a-d)
      if (/^[a-d]$/.test(trimmed)) {
        answers.push(trimmed);
      }
      // Check for numeric answer (1-4) and convert to letter
      else if (/^[1-4]$/.test(trimmed)) {
        answers.push(numToLetter[trimmed]);
      }
    }

    // If no answers found, try to extract any letter or digit
    if (answers.length === 0) {
      // Try letter first
      const letterMatch = cleaned.match(/[a-d]/);
      if (letterMatch) {
        answers.push(letterMatch[0]);
      } else {
        // Try digit
        const digitMatch = cleaned.match(/[1-4]/);
        if (digitMatch) {
          answers.push(numToLetter[digitMatch[0]]);
        }
      }
    }

    return answers;
  }

  /**
   * Parse with pattern validation
   * Validates parsed questions against a pattern
   */
  async parseWithPattern(
    filePath: string,
    pattern: {
      sections: {
        name: string;
        questionType: string;
        totalQuestions: number;
        requiredAttempts?: number;
        startQuestion: number;
        endQuestion: number;
      }[];
    }
  ): Promise<ParseResult & { patternValidation: { valid: boolean; errors: string[] } }> {
    const result = await this.parseWordDocument(filePath);

    const validation = {
      valid: true,
      errors: [] as string[],
    };

    // Validate against pattern
    let expectedTotal = 0;
    for (const section of pattern.sections) {
      expectedTotal += section.totalQuestions;

      const sectionQuestions = result.questions.filter(
        q => q.questionNumber >= section.startQuestion && q.questionNumber <= section.endQuestion
      );

      if (sectionQuestions.length !== section.totalQuestions) {
        validation.valid = false;
        validation.errors.push(
          `Section "${section.name}": Expected ${section.totalQuestions} questions (Q${section.startQuestion}-Q${section.endQuestion}), found ${sectionQuestions.length}`
        );
      }
    }

    if (result.totalQuestions !== expectedTotal) {
      validation.valid = false;
      validation.errors.push(
        `Total questions mismatch: Expected ${expectedTotal}, found ${result.totalQuestions}`
      );
    }

    return { ...result, patternValidation: validation };
  }

  /**
   * Convert parsed questions to database format
   */
  convertToDbFormat(
    questions: ParsedQuestion[],
    metadata: {
      subjectId: string;
      classId: string;
      createdById: string;
      chapterId?: string;
    }
  ) {
    return questions.map(q => ({
      questionText: q.questionText,
      questionHtml: q.questionHtml,
      questionImage: q.questionImage,
      questionType: this.mapQuestionType(q.questionType),
      options: q.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        isCorrect: q.correctAnswer === opt.id || q.correctAnswers?.includes(opt.id) || false,
      })),
      correctAnswer: q.correctAnswer,
      correctOptions: q.correctAnswers || [],
      answerExplanation: q.solution,
      marks: 4, // Default marks
      negativeMarks: 1, // Default negative marks
      source: 'IMPORTED' as const,
      subjectId: metadata.subjectId,
      classId: metadata.classId,
      chapterId: metadata.chapterId,
      createdById: metadata.createdById,
      comprehensionPassageId: q.passageId,
      matrixData: q.matrixData,
    }));
  }

  private mapQuestionType(type: ParsedQuestionType): string {
    const mapping: Record<ParsedQuestionType, string> = {
      [ParsedQuestionType.SINGLE_CORRECT]: 'SINGLE_CORRECT',
      [ParsedQuestionType.MULTIPLE_CORRECT]: 'MULTIPLE_CORRECT',
      [ParsedQuestionType.INTEGER_TYPE]: 'INTEGER_TYPE',
      [ParsedQuestionType.COMPREHENSION]: 'COMPREHENSION',
      [ParsedQuestionType.MATRIX_MATCH]: 'MATRIX_MATCH',
      [ParsedQuestionType.ASSERTION_REASONING]: 'ASSERTION_REASONING',
    };
    return mapping[type] || 'SINGLE_CORRECT';
  }
}

export const wordParserService = new WordParserService();
