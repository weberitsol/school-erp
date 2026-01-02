# Matrix Match Table Analysis - Word Document Parsing

## Summary of Findings

This document analyzes how matrix match tables are extracted from Word documents using the mammoth library and how they are currently being parsed.

---

## Key Findings

### 1. **Raw Text Extraction Format**

When using `mammoth.extractRawText()`, matrix tables are extracted in a **line-by-line** format with **NO tab separation between columns**:

```
18.
Consider the following lists
List – I
List – II
I)
[empty line with just tab]
P)
Has two elements
II)

Q)
Has three elements
III)

R)
Has four elements
```

**Important Observations:**
- Each column item (I), P), Q), etc.) appears on its **own separate line**
- There are **NO tabs** between column identifiers and their text
- There is usually an empty line (sometimes with a single tab character) between rows
- Column text appears **immediately after** the column identifier on the next line

### 2. **HTML Extraction Format**

When using `mammoth.convertToHtml()`, matrix tables are extracted differently:

**Q36 (which DOES have proper table in HTML):**
```html
<table>
  <tr>
    <td colspan="2"><p>Column – I</p></td>
    <td colspan="2"><p>Column – II</p></td>
  </tr>
  <tr>
    <td><p>A)</p></td>
    <td><p>Motion of dropped ball</p></td>
    <td><p>P)</p></td>
    <td><p>Two dimensional motion</p></td>
  </tr>
  <tr>
    <td><p>B)</p></td>
    <td><p>Motion of a snake</p></td>
    <td><p>Q)</p></td>
    <td><p>Three dimensional motion</p></td>
  </tr>
  ...
</table>
```

**Structure:**
- Row 1: Headers with colspan=2
- Rows 2-5: 4 cells per row
  - Cell 1: Column A identifier (A), B), C), D))
  - Cell 2: Column A text
  - Cell 3: Column B identifier (P), Q), R), S))
  - Cell 4: Column B text

**Q18 and Q54 (which DON'T have proper HTML tables):**
- No `<table>` tags found
- Content is in plain paragraph format
- Same line-by-line structure as raw text extraction

---

## 3. **Differences Between Questions**

### Q36 - Proper Table Format
- **Raw Text:** Line-by-line format
- **HTML:** Proper `<table>` with structured rows and cells
- **Parsing:** Can be parsed from HTML table structure

### Q18 and Q54 - Non-Table Format
- **Raw Text:** Line-by-line format
- **HTML:** No table tags, just paragraphs
- **Parsing:** Must be parsed line-by-line from raw text

---

## 4. **Current Parser Logic (word-parser.service.ts)**

The current parser handles matrix tables using **multiple detection patterns**:

### Pattern 1: Tab-Separated Table (4+ parts)
```typescript
// Detects: A)\tText A\tP)\tText P
if (tabParts.length >= 4) {
  const firstIdMatch = tabParts[0].match(/^[\(]?([A-D])[\)]?\.?$/i);
  const thirdIdMatch = tabParts[2].match(/^[\(]?([PQRS1-4])[\)]?\.?$/i);

  if (firstIdMatch && thirdIdMatch) {
    // Extract: ColA ID, ColA Text, ColB ID, ColB Text
  }
}
```

### Pattern 2: ID-Only Tab Rows (2 parts)
```typescript
// Detects: A)\tP) (IDs only, text on next line)
if (tabParts.length === 2) {
  const firstIdMatch = tabParts[0].match(idOnlyPattern);
  const secondIdMatch = tabParts[1].match(idOnlyPatternB);

  if (firstIdMatch && secondIdMatch) {
    // Add placeholders, update with text from next row
  }
}
```

### Pattern 3: Combined Text in Tab Parts
```typescript
// Detects: (A) text\t(P) text
const colAMatch = tabParts[0].match(/^[\(]?([A-D])[\)]?\s*[.):\-]?\s*(.+)/i);
const colBMatch = tabParts[partIdx].match(/^[\(]?([PQRS1-4])[\)]?\s*[.):\-]?\s*(.+)/i);
```

### Pattern 4: Line-by-Line (Non-Tab)
```typescript
// Detects individual column items on separate lines
const colAMatch = line.match(/^[\(]?([A-D])[\)]?\s*[.):\-]?\s*(.+)/i);
const colBMatch = line.match(/^[\(]?([PQRS1-4])[\)]?\s*[.):\-]?\s*(.+)/i);
```

---

## 5. **Tab Character Analysis**

Only **ONE line** in the entire document contains a tab character (in Q18):

```
Line 644: "	"   <- Just a tab between two empty strings
Parts: ["", ""]
```

This means:
- **Tab separation is NOT consistently used** in this document
- The parser **cannot rely on tabs** for matrix table detection
- **Line-by-line parsing** is the primary method needed

---

## 6. **Actual Extraction Examples**

### Q18 (Matrix Match - Biology)
```
Line 634: "18."
Line 636: "Consider the following lists "
Line 638: "List – I"
Line 640: "List – II"
Line 642: "I)"              <- Column A ID
Line 644: "\t"              <- Empty tab line (likely separator)
Line 646: "P)"              <- Column B ID
Line 648: "Has two elements"<- Column B text
Line 650: "II)"             <- Column A ID
Line 654: "Q)"              <- Column B ID
Line 656: "Has three elements"
```

**Pattern:**
1. Column A ID (I))
2. Empty line or tab
3. Column B ID (P))
4. Column B text
5. Repeat...

**Issue:** Column A text is **MISSING** (likely embedded in images/equations that didn't extract)

### Q36 (Matrix Match - Physics)
```
Line 1380: "36."
Line 1382: "Match the following "
Line 1384: "Column – I"
Line 1386: "Column – II"
Line 1388: "A)"                    <- Column A ID
Line 1390: "Motion of dropped ball"<- Column A text
Line 1392: "P)"                    <- Column B ID
Line 1394: "Two dimensional motion"<- Column B text
Line 1396: "B)"
Line 1398: "Motion of a snake"
```

**Pattern:**
1. Column A ID (A))
2. Column A text
3. Column B ID (P))
4. Column B text
5. Repeat...

**Success:** Both columns have text extracted properly

### Q54 (Matrix Match - Chemistry)
```
Line 2160: "54."
Line 2164: "List – I (Name)"
Line 2166: "List – II (Formula)"
Line 2168: "A)"           <- Column A ID
Line 2170: "Pyrogallol"   <- Column A text
Line 2172: "1)"           <- Column B ID (numeric)
Line 2174: ""             <- Column B text MISSING
```

**Pattern:** Similar to Q36 but Column B text is missing (likely images)

---

## 7. **Recommendations**

### For Robust Matrix Table Parsing:

1. **Don't rely on tabs** - they are inconsistent

2. **Use line-by-line state machine approach:**
   ```typescript
   State: EXPECT_COL_A_ID -> EXPECT_COL_A_TEXT -> EXPECT_COL_B_ID -> EXPECT_COL_B_TEXT
   ```

3. **Detect Column A vs Column B by ID pattern:**
   - Column A: A-D or I-IV (Roman numerals)
   - Column B: P-S or 1-4 (numbers)

4. **Handle missing text gracefully:**
   - If text line is empty, it's likely an image
   - Use placeholder: `"[Image]"` or extract from HTML if available

5. **Prefer HTML extraction when available:**
   - Check HTML for `<table>` tags first
   - Fall back to line-by-line parsing if no table found

6. **Merge approaches:**
   ```typescript
   // Pseudo-code
   if (hasHtmlTable(question)) {
     return parseMatrixFromHtml(htmlContent);
   } else {
     return parseMatrixFromLines(textLines);
   }
   ```

---

## 8. **Code Example: Improved Parser**

```typescript
function parseMatrixMatchQuestion(lines: string[], htmlContent: string) {
  // Try HTML first
  const htmlTable = extractTableFromHtml(htmlContent);
  if (htmlTable && htmlTable.rows.length > 1) {
    return parseMatrixFromHtmlTable(htmlTable);
  }

  // Fall back to line-by-line parsing
  const columnA: Array<{id: string, text: string}> = [];
  const columnB: Array<{id: string, text: string}> = [];

  let currentColA: {id: string, text: string} | null = null;
  let currentColB: {id: string, text: string} | null = null;
  let expectingText: 'colA' | 'colB' | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Match Column A ID (A-D or I-IV)
    const colAMatch = trimmed.match(/^[\(]?([A-D]|I{1,3}V?|IV)[\)]?\s*$/i);
    if (colAMatch) {
      if (currentColA) columnA.push(currentColA);
      currentColA = { id: colAMatch[1].toUpperCase(), text: '' };
      expectingText = 'colA';
      continue;
    }

    // Match Column B ID (P-S or 1-4)
    const colBMatch = trimmed.match(/^[\(]?([PQRS1-4])[\)]?\s*$/i);
    if (colBMatch) {
      if (currentColB) columnB.push(currentColB);
      currentColB = { id: colBMatch[1].toUpperCase(), text: '' };
      expectingText = 'colB';
      continue;
    }

    // Accumulate text
    if (expectingText && trimmed.length > 0 && !trimmed.match(/^[\t\s]+$/)) {
      if (expectingText === 'colA' && currentColA) {
        currentColA.text += (currentColA.text ? ' ' : '') + trimmed;
      } else if (expectingText === 'colB' && currentColB) {
        currentColB.text += (currentColB.text ? ' ' : '') + trimmed;
      }
    }
  }

  // Push remaining items
  if (currentColA) columnA.push(currentColA);
  if (currentColB) columnB.push(currentColB);

  return { columnA, columnB };
}
```

---

## 9. **Testing Data**

To test matrix parsing, use these three questions from the sample document:

- **Q18:** Biology - Has empty/missing Column A text (images)
- **Q36:** Physics - Has proper HTML table with all text
- **Q54:** Chemistry - Has numeric Column B IDs (1-4) with missing text (images)

Each represents a different parsing challenge:
1. Missing content (images not extracted)
2. Proper table structure
3. Numeric vs letter IDs

---

## Conclusion

The key insight is that **mammoth extracts Word tables inconsistently**:
- Some tables become HTML `<table>` elements (Q36)
- Some tables become line-by-line text (Q18, Q54)
- Tab characters are **rarely present**

The parser must handle both formats and use a **state machine approach** for line-by-line parsing when HTML tables are not available.
