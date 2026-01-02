const mammoth = require('mammoth');
const path = require('path');

async function analyzeMatrixTables() {
  const docPath = path.join(__dirname, '..', 'sample-test.docx.docx');

  console.log('='.repeat(80));
  console.log('DETAILED MATRIX TABLE ANALYSIS');
  console.log('='.repeat(80));

  try {
    // Extract raw text
    const rawResult = await mammoth.extractRawText({ path: docPath });
    const fullText = rawResult.value;
    const lines = fullText.split('\n');

    // Find Q18, Q36, Q54
    const questions = [18, 36, 54];

    for (const qNum of questions) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`QUESTION ${qNum} - RAW EXTRACTION`);
      console.log('='.repeat(80));

      // Find the question start
      let qIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === `${qNum}.` || line === `${qNum}`) {
          qIndex = i;
          break;
        }
      }

      if (qIndex === -1) {
        console.log(`Question ${qNum} not found`);
        continue;
      }

      // Extract 50 lines from this point
      console.log(`\nFound at line ${qIndex}. Extracting next 50 lines:\n`);

      for (let i = 0; i < 50 && (qIndex + i) < lines.length; i++) {
        const lineNum = qIndex + i;
        const line = lines[lineNum];
        const trimmed = line.trim();

        // Show line with metadata
        console.log(`Line ${lineNum}: "${line}"`);

        // If line contains tabs, analyze them
        if (line.includes('\t')) {
          const parts = line.split('\t');
          console.log(`  ├─ Contains TABS: ${parts.length} parts`);
          parts.forEach((part, idx) => {
            console.log(`  │  Part[${idx}]: "${part}"`);
          });
        }

        // If line is not empty and looks like a table row
        if (trimmed.length > 0) {
          // Check if it matches column patterns
          if (/^[A-Z]\)/.test(trimmed) || /^[IVX]+\)/.test(trimmed) || /^[PQRSTpqrst]\)/.test(trimmed)) {
            console.log(`  ├─ IDENTIFIED: Possible column item (${trimmed.substring(0, 5)}...)`);
          }

          // Show character codes for special analysis
          if (line.length < 50 && line.length > 0) {
            const chars = line.split('').map(c => {
              const code = c.charCodeAt(0);
              if (code === 9) return '[TAB]';
              if (code === 32) return '_';
              if (code === 13) return '[CR]';
              if (code === 10) return '[LF]';
              if (code < 32) return `[${code}]`;
              return c;
            }).join('');
            console.log(`  └─ Chars: ${chars}`);
          }
        }

        console.log('');
      }

      // Now look for the actual table content in HTML to compare
      console.log('\n' + '-'.repeat(80));
      console.log('HTML VERSION FOR COMPARISON');
      console.log('-'.repeat(80));

      const htmlResult = await mammoth.convertToHtml({ path: docPath });
      const htmlText = htmlResult.value;

      // Find this question in HTML
      const qRegex = new RegExp(`<p>${qNum}\\.?</p>[\\s\\S]{0,3000}`, 'i');
      const htmlMatch = htmlText.match(qRegex);

      if (htmlMatch) {
        // Extract table if present
        const tableRegex = /<table>[\s\S]*?<\/table>/g;
        const tables = htmlMatch[0].match(tableRegex);

        if (tables) {
          console.log(`\nFound ${tables.length} table(s) in HTML:\n`);
          tables.forEach((table, idx) => {
            console.log(`Table ${idx + 1}:`);
            // Extract rows
            const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
            let rowMatch;
            let rowNum = 0;
            while ((rowMatch = rowRegex.exec(table)) !== null) {
              rowNum++;
              const rowContent = rowMatch[1];
              // Extract cells
              const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
              let cellMatch;
              const cells = [];
              while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
                // Remove HTML tags from cell content
                let cellText = cellMatch[1]
                  .replace(/<[^>]+>/g, '')
                  .replace(/&nbsp;/g, ' ')
                  .trim();
                cells.push(cellText);
              }
              console.log(`  Row ${rowNum}: [${cells.length} cells] ${cells.map((c, i) => `"${c}"`).join(' | ')}`);
            }
            console.log('');
          });
        } else {
          console.log('No HTML tables found for this question');
        }
      }
    }

    // Additional: Show all lines that look like table rows with tabs
    console.log('\n' + '='.repeat(80));
    console.log('ALL TAB-SEPARATED LINES (First 30)');
    console.log('='.repeat(80));

    const tabLines = lines
      .map((line, idx) => ({ line, idx }))
      .filter(({ line }) => line.includes('\t'))
      .slice(0, 30);

    tabLines.forEach(({ line, idx }) => {
      console.log(`\nLine ${idx}:`);
      const parts = line.split('\t');
      console.log(`  Parts (${parts.length}):`);
      parts.forEach((part, i) => {
        const display = part.length > 50 ? part.substring(0, 47) + '...' : part;
        console.log(`    [${i}]: "${display}"`);
      });
    });

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

analyzeMatrixTables()
  .then(() => {
    console.log('\n\nAnalysis complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
