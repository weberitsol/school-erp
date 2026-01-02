import { wordParserService } from './src/services/word-parser.service';
import * as path from 'path';

async function testParser() {
  console.log('Testing Word Parser...\n');

  const testFilePath = path.join(__dirname, '..', 'sample-test.docx.docx');

  try {
    console.log(`Parsing file: ${testFilePath}\n`);

    const result = await wordParserService.parseWordDocument(testFilePath);

    console.log('=== Parse Results ===');
    console.log(`Success: ${result.success}`);
    console.log(`Total Questions: ${result.totalQuestions}`);
    console.log(`Sections Found: ${result.sections.length}`);
    console.log(`Passages Found: ${result.passages.length}`);
    console.log(`Warnings: ${result.warnings.length}`);
    console.log(`Errors: ${result.errors.length}`);

    console.log('\n=== Sections ===');
    for (const section of result.sections) {
      console.log(`  - ${section.name}`);
      console.log(`    Type: ${section.questionType}`);
      console.log(`    Questions: Q${section.startQuestion}-Q${section.endQuestion} (${section.questions.length} total)`);
    }

    console.log('\n=== First 5 Questions Sample ===');
    for (const q of result.questions.slice(0, 5)) {
      console.log(`\nQ${q.questionNumber} [${q.questionType}]`);
      console.log(`  Text: ${q.questionText.substring(0, 100)}...`);
      console.log(`  Options: ${q.options.length}`);
      console.log(`  Answer: ${q.correctAnswer || q.correctAnswers?.join(', ') || 'Not found'}`);
      if (q.parseWarnings?.length) {
        console.log(`  Warnings: ${q.parseWarnings.join(', ')}`);
      }
    }

    if (result.warnings.length > 0) {
      console.log('\n=== Warnings ===');
      result.warnings.slice(0, 10).forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
    }

    if (result.errors.length > 0) {
      console.log('\n=== Errors ===');
      result.errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    }

  } catch (error: any) {
    console.error('Parse error:', error.message);
  }
}

testParser();
