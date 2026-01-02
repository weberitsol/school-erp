const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

async function analyzeWordDocument() {
  const docPath = path.join(__dirname, '..', 'sample-test.docx.docx');

  console.log('='.repeat(80));
  console.log('ANALYZING WORD DOCUMENT STRUCTURE');
  console.log('='.repeat(80));
  console.log(`Document: ${docPath}\n`);

  try {
    // Extract raw text
    console.log('\n' + '='.repeat(80));
    console.log('1. RAW TEXT EXTRACTION');
    console.log('='.repeat(80));
    const rawResult = await mammoth.extractRawText({ path: docPath });
    console.log('Raw text (first 2000 chars):');
    console.log(rawResult.value.substring(0, 2000));
    console.log('\n...(truncated)\n');

    // Extract with HTML conversion to understand structure
    console.log('\n' + '='.repeat(80));
    console.log('2. HTML EXTRACTION (to understand structure)');
    console.log('='.repeat(80));
    const htmlResult = await mammoth.convertToHtml({ path: docPath });

    // Find Q18, Q36, Q54 sections in HTML
    const questions = [18, 36, 54];
    for (const qNum of questions) {
      const regex = new RegExp(`Q${qNum}[\\s\\S]{0,1500}`, 'i');
      const match = htmlResult.value.match(regex);
      if (match) {
        console.log(`\nQ${qNum} HTML Section:`);
        console.log('-'.repeat(80));
        console.log(match[0]);
        console.log('-'.repeat(80));
      }
    }

    // Extract plain text to analyze tab-separated content
    console.log('\n' + '='.repeat(80));
    console.log('3. PLAIN TEXT EXTRACTION - FOCUSING ON MATRIX TABLES');
    console.log('='.repeat(80));

    const textResult = await mammoth.extractRawText({ path: docPath });
    const lines = textResult.value.split('\n');

    // Find and display matrix match questions
    for (const qNum of questions) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`QUESTION ${qNum} - DETAILED ANALYSIS`);
      console.log('='.repeat(80));

      const qIndex = lines.findIndex(line => line.trim().startsWith(`Q${qNum}.`) || line.trim().startsWith(`Q${qNum} `));

      if (qIndex !== -1) {
        // Show 15 lines starting from question
        const relevantLines = lines.slice(qIndex, qIndex + 20);

        console.log('\nLines extracted:');
        relevantLines.forEach((line, idx) => {
          console.log(`Line ${qIndex + idx}: "${line}"`);

          // Analyze tab-separated content
          if (line.includes('\t')) {
            const parts = line.split('\t');
            console.log(`  -> TAB-SEPARATED PARTS (${parts.length} parts):`);
            parts.forEach((part, i) => {
              console.log(`     Part ${i}: "${part}"`);
            });
          }
        });

        console.log('\n--- Character Analysis of Table Lines ---');
        relevantLines.forEach((line, idx) => {
          if (line.trim().length > 0 && (line.includes('\t') || /^[A-D][).]/.test(line.trim()))) {
            console.log(`\nLine ${qIndex + idx}: Length=${line.length}`);
            // Show character codes for first 100 chars to see tabs
            const charCodes = line.substring(0, 100).split('').map((c, i) => {
              const code = c.charCodeAt(0);
              if (code === 9) return `[TAB]`;
              if (code === 32) return `[SP]`;
              if (code === 13) return `[CR]`;
              if (code === 10) return `[LF]`;
              return c;
            }).join('');
            console.log(`Characters: ${charCodes}`);
          }
        });
      } else {
        console.log(`Question ${qNum} not found in document`);
      }
    }

    // Additional analysis: Find all lines with tabs
    console.log('\n' + '='.repeat(80));
    console.log('4. ALL LINES CONTAINING TABS (showing first 50)');
    console.log('='.repeat(80));
    const tabLines = lines.filter(line => line.includes('\t')).slice(0, 50);
    tabLines.forEach((line, idx) => {
      console.log(`\nTab-line ${idx + 1}:`);
      console.log(`Raw: "${line}"`);
      const parts = line.split('\t');
      console.log(`Parts (${parts.length}):`);
      parts.forEach((part, i) => {
        console.log(`  [${i}]: "${part}"`);
      });
    });

    // Look for matrix/table patterns
    console.log('\n' + '='.repeat(80));
    console.log('5. SEARCHING FOR MATRIX MATCH PATTERN');
    console.log('='.repeat(80));

    const matrixPattern = /matrix|match|column|list/i;
    const matrixLines = [];
    let captureNext = 0;

    lines.forEach((line, idx) => {
      if (matrixPattern.test(line) || captureNext > 0) {
        matrixLines.push({ lineNum: idx, text: line });
        if (matrixPattern.test(line)) {
          captureNext = 10; // Capture next 10 lines
        } else {
          captureNext--;
        }
      }
    });

    console.log('\nLines matching matrix/match patterns:');
    matrixLines.forEach(({ lineNum, text }) => {
      console.log(`Line ${lineNum}: "${text}"`);
    });

    // Save full extraction to file for reference
    const outputPath = path.join(__dirname, 'word-doc-analysis.txt');
    const fullOutput = `
FULL RAW TEXT EXTRACTION
${'='.repeat(80)}

${textResult.value}

${'='.repeat(80)}
FULL HTML EXTRACTION
${'='.repeat(80)}

${htmlResult.value}
`;

    fs.writeFileSync(outputPath, fullOutput, 'utf8');
    console.log(`\n\nFull extraction saved to: ${outputPath}`);

  } catch (error) {
    console.error('Error analyzing document:', error);
    throw error;
  }
}

// Run the analysis
analyzeWordDocument()
  .then(() => {
    console.log('\n\nAnalysis complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
