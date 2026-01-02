const mammoth = require('mammoth');
const path = require('path');

async function demonstrateMatrixExtraction() {
  const docPath = path.join(__dirname, '..', 'sample-test.docx.docx');

  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                   MATRIX TABLE EXTRACTION DEMONSTRATION                    ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

  try {
    // Extract both raw text and HTML
    const [rawResult, htmlResult] = await Promise.all([
      mammoth.extractRawText({ path: docPath }),
      mammoth.convertToHtml({ path: docPath })
    ]);

    const lines = rawResult.value.split('\n');
    const questions = [
      { num: 18, name: 'Biology - Set Theory' },
      { num: 36, name: 'Physics - Motion Types' },
      { num: 54, name: 'Chemistry - Chemical Formulas' }
    ];

    for (const { num, name } of questions) {
      console.log('\n' + '═'.repeat(80));
      console.log(`  QUESTION ${num}: ${name}`);
      console.log('═'.repeat(80));

      // Find question in text
      let qIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === `${num}.`) {
          qIndex = i;
          break;
        }
      }

      if (qIndex === -1) {
        console.log('❌ Question not found');
        continue;
      }

      // Extract 35 lines
      console.log('\n┌─ RAW TEXT EXTRACTION ──────────────────────────────────────────────────┐\n');

      const extracted = [];
      for (let i = 0; i < 35 && (qIndex + i) < lines.length; i++) {
        const line = lines[qIndex + i];
        const trimmed = line.trim();

        if (trimmed.length > 0) {
          // Identify column markers
          let marker = '  ';
          if (/^[\(]?[A-D][\)]?$/.test(trimmed)) marker = '🔵'; // Column A ID
          else if (/^[\(]?[I]{1,3}V?|IV[\)]?$/.test(trimmed)) marker = '🔵'; // Roman numeral
          else if (/^[\(]?[PQRS][\)]?$/.test(trimmed)) marker = '🟢'; // Column B ID (letter)
          else if (/^[\(]?[1-4][\)]?$/.test(trimmed)) marker = '🟡'; // Column B ID (number)
          else if (/^(List|Column)[\s\-]*(I{1,3}|1)/i.test(trimmed)) marker = '📋'; // Header
          else if (/^(List|Column)[\s\-]*(II|2)/i.test(trimmed)) marker = '📋'; // Header
          else if (trimmed.match(/^[a-d]\)/)) marker = '📝'; // Answer option
          else if (/^Ans/i.test(trimmed)) marker = '✅'; // Answer
          else if (trimmed.length > 5) marker = '💬'; // Text content

          extracted.push(`${marker} ${trimmed}`);
        } else if (line.includes('\t')) {
          extracted.push(`⭕ [TAB LINE]`);
        }
      }

      extracted.forEach(line => console.log(line));

      // Check for HTML table
      console.log('\n└────────────────────────────────────────────────────────────────────────┘');
      console.log('\n┌─ HTML TABLE STRUCTURE ─────────────────────────────────────────────────┐\n');

      const qRegex = new RegExp(`<p>${num}\\.?</p>[\\s\\S]{0,5000}`, 'i');
      const htmlMatch = htmlResult.value.match(qRegex);

      if (htmlMatch) {
        const tableMatch = htmlMatch[0].match(/<table>[\s\S]*?<\/table>/);

        if (tableMatch) {
          console.log('✓ HTML TABLE FOUND\n');

          // Parse rows
          const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
          let rowMatch;
          let rowNum = 0;

          while ((rowMatch = rowRegex.exec(tableMatch[0])) !== null) {
            rowNum++;
            const rowContent = rowMatch[1];

            // Extract cells
            const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
            let cellMatch;
            const cells = [];

            while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
              let cellText = cellMatch[1]
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/g, ' ')
                .trim();
              cells.push(cellText);
            }

            if (cells.length > 0) {
              const cellDisplay = cells.map((c, i) => {
                const display = c.length > 30 ? c.substring(0, 27) + '...' : c;
                return `Cell ${i+1}: "${display}"`;
              }).join('\n       ');

              console.log(`  Row ${rowNum}: ${cellDisplay}\n`);
            }
          }
        } else {
          console.log('✗ NO HTML TABLE - Must parse line-by-line');
        }
      } else {
        console.log('✗ Question not found in HTML');
      }

      console.log('\n└────────────────────────────────────────────────────────────────────────┘');

      // Attempt to parse matrix structure
      console.log('\n┌─ PARSED MATRIX STRUCTURE ──────────────────────────────────────────────┐\n');

      const columnA = [];
      const columnB = [];

      for (let i = qIndex; i < qIndex + 35 && i < lines.length; i++) {
        const line = lines[i].trim();

        // Column A patterns
        const colAMatch = line.match(/^[\(]?([A-D]|I{1,3}V?|IV)[\)]?$/i);
        if (colAMatch) {
          const id = colAMatch[1].toUpperCase();
          // Look ahead for text
          let text = '';
          for (let j = i + 1; j < i + 5 && j < lines.length; j++) {
            const nextLine = lines[j].trim();
            if (nextLine && !nextLine.match(/^[\(]?[A-DPQRS1-4][\)]?$/i) && nextLine.length > 2) {
              text = nextLine;
              break;
            }
          }
          if (!text) text = '[Image or missing text]';
          columnA.push({ id, text });
        }

        // Column B patterns
        const colBMatch = line.match(/^[\(]?([PQRS1-4])[\)]?$/i);
        if (colBMatch) {
          const id = colBMatch[1].toUpperCase();
          // Look ahead for text
          let text = '';
          for (let j = i + 1; j < i + 5 && j < lines.length; j++) {
            const nextLine = lines[j].trim();
            if (nextLine && !nextLine.match(/^[\(]?[A-DPQRS1-4][\)]?$/i) && nextLine.length > 2) {
              text = nextLine;
              break;
            }
          }
          if (!text) text = '[Image or missing text]';
          columnB.push({ id, text });
        }
      }

      if (columnA.length > 0 || columnB.length > 0) {
        console.log('  Column I (Left):');
        if (columnA.length === 0) {
          console.log('    (No items detected)');
        } else {
          columnA.forEach(({ id, text }) => {
            const display = text.length > 50 ? text.substring(0, 47) + '...' : text;
            console.log(`    ${id}) ${display}`);
          });
        }

        console.log('\n  Column II (Right):');
        if (columnB.length === 0) {
          console.log('    (No items detected)');
        } else {
          columnB.forEach(({ id, text }) => {
            const display = text.length > 50 ? text.substring(0, 47) + '...' : text;
            console.log(`    ${id}) ${display}`);
          });
        }
      } else {
        console.log('  ✗ No matrix structure detected');
      }

      console.log('\n└────────────────────────────────────────────────────────────────────────┘');
    }

    console.log('\n\n' + '═'.repeat(80));
    console.log('  LEGEND');
    console.log('═'.repeat(80));
    console.log('  🔵 Column A ID (A-D or I-IV)');
    console.log('  🟢 Column B ID (P-S)');
    console.log('  🟡 Column B ID (1-4)');
    console.log('  📋 Column Header');
    console.log('  💬 Text Content');
    console.log('  📝 Answer Option (a-d)');
    console.log('  ✅ Answer Line');
    console.log('  ⭕ Tab Character Line');
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

demonstrateMatrixExtraction()
  .then(() => {
    console.log('✓ Analysis complete!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
