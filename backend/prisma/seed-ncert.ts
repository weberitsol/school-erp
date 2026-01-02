import { PrismaClient, QuestionType, DifficultyLevel, QuestionSource } from '@prisma/client';

const prisma = new PrismaClient();

// ==================== NCERT CLASS 11 CHAPTER DATA ====================

const PHYSICS_CHAPTERS_CLASS_11 = [
  { chapterNumber: 1, name: 'Physical World', ncertBook: 'NCERT Physics Part 1', pageRange: '1-13' },
  { chapterNumber: 2, name: 'Units and Measurements', ncertBook: 'NCERT Physics Part 1', pageRange: '14-36' },
  { chapterNumber: 3, name: 'Motion in a Straight Line', ncertBook: 'NCERT Physics Part 1', pageRange: '37-58' },
  { chapterNumber: 4, name: 'Motion in a Plane', ncertBook: 'NCERT Physics Part 1', pageRange: '59-84' },
  { chapterNumber: 5, name: 'Laws of Motion', ncertBook: 'NCERT Physics Part 1', pageRange: '85-116' },
  { chapterNumber: 6, name: 'Work, Energy and Power', ncertBook: 'NCERT Physics Part 1', pageRange: '117-144' },
  { chapterNumber: 7, name: 'System of Particles and Rotational Motion', ncertBook: 'NCERT Physics Part 1', pageRange: '145-178' },
  { chapterNumber: 8, name: 'Gravitation', ncertBook: 'NCERT Physics Part 1', pageRange: '179-204' },
  { chapterNumber: 9, name: 'Mechanical Properties of Solids', ncertBook: 'NCERT Physics Part 2', pageRange: '205-224' },
  { chapterNumber: 10, name: 'Mechanical Properties of Fluids', ncertBook: 'NCERT Physics Part 2', pageRange: '225-256' },
  { chapterNumber: 11, name: 'Thermal Properties of Matter', ncertBook: 'NCERT Physics Part 2', pageRange: '257-282' },
  { chapterNumber: 12, name: 'Thermodynamics', ncertBook: 'NCERT Physics Part 2', pageRange: '283-306' },
  { chapterNumber: 13, name: 'Kinetic Theory', ncertBook: 'NCERT Physics Part 2', pageRange: '307-328' },
  { chapterNumber: 14, name: 'Oscillations', ncertBook: 'NCERT Physics Part 2', pageRange: '329-358' },
  { chapterNumber: 15, name: 'Waves', ncertBook: 'NCERT Physics Part 2', pageRange: '359-392' },
];

const CHEMISTRY_CHAPTERS_CLASS_11 = [
  { chapterNumber: 1, name: 'Some Basic Concepts of Chemistry', ncertBook: 'NCERT Chemistry Part 1', pageRange: '1-27' },
  { chapterNumber: 2, name: 'Structure of Atom', ncertBook: 'NCERT Chemistry Part 1', pageRange: '28-62' },
  { chapterNumber: 3, name: 'Classification of Elements and Periodicity', ncertBook: 'NCERT Chemistry Part 1', pageRange: '63-94' },
  { chapterNumber: 4, name: 'Chemical Bonding and Molecular Structure', ncertBook: 'NCERT Chemistry Part 1', pageRange: '95-134' },
  { chapterNumber: 5, name: 'States of Matter', ncertBook: 'NCERT Chemistry Part 1', pageRange: '135-160' },
  { chapterNumber: 6, name: 'Thermodynamics', ncertBook: 'NCERT Chemistry Part 1', pageRange: '161-192' },
  { chapterNumber: 7, name: 'Equilibrium', ncertBook: 'NCERT Chemistry Part 1', pageRange: '193-236' },
  { chapterNumber: 8, name: 'Redox Reactions', ncertBook: 'NCERT Chemistry Part 2', pageRange: '237-264' },
  { chapterNumber: 9, name: 'Hydrogen', ncertBook: 'NCERT Chemistry Part 2', pageRange: '265-286' },
  { chapterNumber: 10, name: 'The s-Block Elements', ncertBook: 'NCERT Chemistry Part 2', pageRange: '287-316' },
  { chapterNumber: 11, name: 'The p-Block Elements', ncertBook: 'NCERT Chemistry Part 2', pageRange: '317-354' },
  { chapterNumber: 12, name: 'Organic Chemistry: Basic Principles', ncertBook: 'NCERT Chemistry Part 2', pageRange: '355-396' },
  { chapterNumber: 13, name: 'Hydrocarbons', ncertBook: 'NCERT Chemistry Part 2', pageRange: '397-432' },
  { chapterNumber: 14, name: 'Environmental Chemistry', ncertBook: 'NCERT Chemistry Part 2', pageRange: '433-456' },
];

const BIOLOGY_CHAPTERS_CLASS_11 = [
  { chapterNumber: 1, name: 'The Living World', ncertBook: 'NCERT Biology', pageRange: '1-16' },
  { chapterNumber: 2, name: 'Biological Classification', ncertBook: 'NCERT Biology', pageRange: '17-34' },
  { chapterNumber: 3, name: 'Plant Kingdom', ncertBook: 'NCERT Biology', pageRange: '35-54' },
  { chapterNumber: 4, name: 'Animal Kingdom', ncertBook: 'NCERT Biology', pageRange: '55-78' },
  { chapterNumber: 5, name: 'Morphology of Flowering Plants', ncertBook: 'NCERT Biology', pageRange: '79-108' },
  { chapterNumber: 6, name: 'Anatomy of Flowering Plants', ncertBook: 'NCERT Biology', pageRange: '109-130' },
  { chapterNumber: 7, name: 'Structural Organisation in Animals', ncertBook: 'NCERT Biology', pageRange: '131-158' },
  { chapterNumber: 8, name: 'Cell: The Unit of Life', ncertBook: 'NCERT Biology', pageRange: '159-180' },
  { chapterNumber: 9, name: 'Biomolecules', ncertBook: 'NCERT Biology', pageRange: '181-204' },
  { chapterNumber: 10, name: 'Cell Cycle and Cell Division', ncertBook: 'NCERT Biology', pageRange: '205-220' },
  { chapterNumber: 11, name: 'Transport in Plants', ncertBook: 'NCERT Biology', pageRange: '221-242' },
  { chapterNumber: 12, name: 'Mineral Nutrition', ncertBook: 'NCERT Biology', pageRange: '243-260' },
  { chapterNumber: 13, name: 'Photosynthesis in Higher Plants', ncertBook: 'NCERT Biology', pageRange: '261-282' },
  { chapterNumber: 14, name: 'Respiration in Plants', ncertBook: 'NCERT Biology', pageRange: '283-300' },
  { chapterNumber: 15, name: 'Plant Growth and Development', ncertBook: 'NCERT Biology', pageRange: '301-320' },
  { chapterNumber: 16, name: 'Digestion and Absorption', ncertBook: 'NCERT Biology', pageRange: '321-340' },
  { chapterNumber: 17, name: 'Breathing and Exchange of Gases', ncertBook: 'NCERT Biology', pageRange: '341-358' },
  { chapterNumber: 18, name: 'Body Fluids and Circulation', ncertBook: 'NCERT Biology', pageRange: '359-378' },
  { chapterNumber: 19, name: 'Excretory Products and their Elimination', ncertBook: 'NCERT Biology', pageRange: '379-398' },
  { chapterNumber: 20, name: 'Locomotion and Movement', ncertBook: 'NCERT Biology', pageRange: '399-416' },
  { chapterNumber: 21, name: 'Neural Control and Coordination', ncertBook: 'NCERT Biology', pageRange: '417-440' },
  { chapterNumber: 22, name: 'Chemical Coordination and Integration', ncertBook: 'NCERT Biology', pageRange: '441-460' },
];

const MATHEMATICS_CHAPTERS_CLASS_11 = [
  { chapterNumber: 1, name: 'Sets', ncertBook: 'NCERT Mathematics', pageRange: '1-28' },
  { chapterNumber: 2, name: 'Relations and Functions', ncertBook: 'NCERT Mathematics', pageRange: '29-54' },
  { chapterNumber: 3, name: 'Trigonometric Functions', ncertBook: 'NCERT Mathematics', pageRange: '55-92' },
  { chapterNumber: 4, name: 'Principle of Mathematical Induction', ncertBook: 'NCERT Mathematics', pageRange: '93-106' },
  { chapterNumber: 5, name: 'Complex Numbers and Quadratic Equations', ncertBook: 'NCERT Mathematics', pageRange: '107-134' },
  { chapterNumber: 6, name: 'Linear Inequalities', ncertBook: 'NCERT Mathematics', pageRange: '135-156' },
  { chapterNumber: 7, name: 'Permutations and Combinations', ncertBook: 'NCERT Mathematics', pageRange: '157-182' },
  { chapterNumber: 8, name: 'Binomial Theorem', ncertBook: 'NCERT Mathematics', pageRange: '183-202' },
  { chapterNumber: 9, name: 'Sequences and Series', ncertBook: 'NCERT Mathematics', pageRange: '203-234' },
  { chapterNumber: 10, name: 'Straight Lines', ncertBook: 'NCERT Mathematics', pageRange: '235-268' },
  { chapterNumber: 11, name: 'Conic Sections', ncertBook: 'NCERT Mathematics', pageRange: '269-308' },
  { chapterNumber: 12, name: 'Introduction to Three Dimensional Geometry', ncertBook: 'NCERT Mathematics', pageRange: '309-326' },
  { chapterNumber: 13, name: 'Limits and Derivatives', ncertBook: 'NCERT Mathematics', pageRange: '327-368' },
  { chapterNumber: 14, name: 'Mathematical Reasoning', ncertBook: 'NCERT Mathematics', pageRange: '369-390' },
  { chapterNumber: 15, name: 'Statistics', ncertBook: 'NCERT Mathematics', pageRange: '391-420' },
  { chapterNumber: 16, name: 'Probability', ncertBook: 'NCERT Mathematics', pageRange: '421-450' },
];

// ==================== DEFAULT PATTERNS ====================

const DEFAULT_PATTERNS = [
  {
    name: 'JEE Main Pattern',
    description: 'Standard JEE Main examination pattern with 75 questions across Physics, Chemistry, and Mathematics. Total duration: 3 hours.',
    patternType: 'JEE_MAIN' as const,
    isDefault: true,
    sections: [
      {
        name: 'Physics',
        subjectCode: 'PHY',
        questionTypes: [
          { type: 'SINGLE_CORRECT', count: 20, marksPerQuestion: 4, negativeMarks: 1 },
          { type: 'INTEGER_TYPE', count: 5, marksPerQuestion: 4, negativeMarks: 0 },
        ],
        totalMarks: 100,
        duration: 60,
      },
      {
        name: 'Chemistry',
        subjectCode: 'CHEM',
        questionTypes: [
          { type: 'SINGLE_CORRECT', count: 20, marksPerQuestion: 4, negativeMarks: 1 },
          { type: 'INTEGER_TYPE', count: 5, marksPerQuestion: 4, negativeMarks: 0 },
        ],
        totalMarks: 100,
        duration: 60,
      },
      {
        name: 'Mathematics',
        subjectCode: 'MATH',
        questionTypes: [
          { type: 'SINGLE_CORRECT', count: 20, marksPerQuestion: 4, negativeMarks: 1 },
          { type: 'INTEGER_TYPE', count: 5, marksPerQuestion: 4, negativeMarks: 0 },
        ],
        totalMarks: 100,
        duration: 60,
      },
    ],
    scoringRules: {
      SINGLE_CORRECT: { marks: 4, negative: 1 },
      INTEGER_TYPE: { marks: 4, negative: 0 },
    },
    totalMarks: 300,
    totalQuestions: 75,
    totalDuration: 180,
  },
  {
    name: 'JEE Advanced Pattern',
    description: 'JEE Advanced examination pattern with multiple question types including Multiple Correct and Matrix Match. Total duration: 3 hours per paper.',
    patternType: 'JEE_ADVANCED' as const,
    isDefault: true,
    sections: [
      {
        name: 'Physics',
        subjectCode: 'PHY',
        questionTypes: [
          { type: 'SINGLE_CORRECT', count: 6, marksPerQuestion: 3, negativeMarks: 1 },
          { type: 'MULTIPLE_CORRECT', count: 6, marksPerQuestion: 4, negativeMarks: 2, partialMarking: true },
          { type: 'INTEGER_TYPE', count: 6, marksPerQuestion: 3, negativeMarks: 0 },
          { type: 'MATRIX_MATCH', count: 2, marksPerQuestion: 3, negativeMarks: 1 },
        ],
        totalMarks: 60,
        duration: 60,
      },
      {
        name: 'Chemistry',
        subjectCode: 'CHEM',
        questionTypes: [
          { type: 'SINGLE_CORRECT', count: 6, marksPerQuestion: 3, negativeMarks: 1 },
          { type: 'MULTIPLE_CORRECT', count: 6, marksPerQuestion: 4, negativeMarks: 2, partialMarking: true },
          { type: 'INTEGER_TYPE', count: 6, marksPerQuestion: 3, negativeMarks: 0 },
          { type: 'MATRIX_MATCH', count: 2, marksPerQuestion: 3, negativeMarks: 1 },
        ],
        totalMarks: 60,
        duration: 60,
      },
      {
        name: 'Mathematics',
        subjectCode: 'MATH',
        questionTypes: [
          { type: 'SINGLE_CORRECT', count: 6, marksPerQuestion: 3, negativeMarks: 1 },
          { type: 'MULTIPLE_CORRECT', count: 6, marksPerQuestion: 4, negativeMarks: 2, partialMarking: true },
          { type: 'INTEGER_TYPE', count: 6, marksPerQuestion: 3, negativeMarks: 0 },
          { type: 'MATRIX_MATCH', count: 2, marksPerQuestion: 3, negativeMarks: 1 },
        ],
        totalMarks: 60,
        duration: 60,
      },
    ],
    scoringRules: {
      SINGLE_CORRECT: { marks: 3, negative: 1 },
      MULTIPLE_CORRECT: { marks: 4, negative: 2, partial: true },
      INTEGER_TYPE: { marks: 3, negative: 0 },
      MATRIX_MATCH: { marks: 3, negative: 1 },
    },
    totalMarks: 180,
    totalQuestions: 60,
    totalDuration: 180,
  },
  {
    name: 'NEET Pattern',
    description: 'NEET UG examination pattern with 180 questions across Physics, Chemistry, and Biology. Total duration: 3 hours 20 minutes.',
    patternType: 'NEET' as const,
    isDefault: true,
    sections: [
      {
        name: 'Physics',
        subjectCode: 'PHY',
        questionTypes: [
          { type: 'SINGLE_CORRECT', count: 35, marksPerQuestion: 4, negativeMarks: 1 },
          { type: 'ASSERTION_REASONING', count: 10, marksPerQuestion: 4, negativeMarks: 1 },
        ],
        totalMarks: 180,
        duration: 50,
      },
      {
        name: 'Chemistry',
        subjectCode: 'CHEM',
        questionTypes: [
          { type: 'SINGLE_CORRECT', count: 35, marksPerQuestion: 4, negativeMarks: 1 },
          { type: 'ASSERTION_REASONING', count: 10, marksPerQuestion: 4, negativeMarks: 1 },
        ],
        totalMarks: 180,
        duration: 50,
      },
      {
        name: 'Biology (Botany)',
        subjectCode: 'BOT',
        questionTypes: [
          { type: 'SINGLE_CORRECT', count: 35, marksPerQuestion: 4, negativeMarks: 1 },
          { type: 'ASSERTION_REASONING', count: 10, marksPerQuestion: 4, negativeMarks: 1 },
        ],
        totalMarks: 180,
        duration: 50,
      },
      {
        name: 'Biology (Zoology)',
        subjectCode: 'ZOO',
        questionTypes: [
          { type: 'SINGLE_CORRECT', count: 35, marksPerQuestion: 4, negativeMarks: 1 },
          { type: 'ASSERTION_REASONING', count: 10, marksPerQuestion: 4, negativeMarks: 1 },
        ],
        totalMarks: 180,
        duration: 50,
      },
    ],
    scoringRules: {
      SINGLE_CORRECT: { marks: 4, negative: 1 },
      ASSERTION_REASONING: { marks: 4, negative: 1 },
    },
    totalMarks: 720,
    totalQuestions: 180,
    totalDuration: 200,
  },
];

// ==================== SEED FUNCTIONS ====================

async function seedSubjectsAndChapters(schoolId: string) {
  console.log('Seeding subjects and chapters...');

  // Create or get subjects
  const subjects = [
    { name: 'Physics', code: 'PHY', chapters: PHYSICS_CHAPTERS_CLASS_11 },
    { name: 'Chemistry', code: 'CHEM', chapters: CHEMISTRY_CHAPTERS_CLASS_11 },
    { name: 'Biology', code: 'BIO', chapters: BIOLOGY_CHAPTERS_CLASS_11 },
    { name: 'Mathematics', code: 'MATH', chapters: MATHEMATICS_CHAPTERS_CLASS_11 },
  ];

  const subjectMap: Record<string, string> = {};

  for (const subjectData of subjects) {
    // Upsert subject
    const subject = await prisma.subject.upsert({
      where: { schoolId_code: { schoolId, code: subjectData.code } },
      create: {
        name: subjectData.name,
        code: subjectData.code,
        description: `${subjectData.name} - NCERT Class 11 & 12`,
        schoolId,
      },
      update: {},
    });

    subjectMap[subjectData.code] = subject.id;
    console.log(`  ✓ Subject: ${subjectData.name} (${subject.id})`);

    // Create chapters
    for (const chapterData of subjectData.chapters) {
      try {
        await prisma.chapter.upsert({
          where: {
            subjectId_chapterNumber_classLevel: {
              subjectId: subject.id,
              chapterNumber: chapterData.chapterNumber,
              classLevel: '11',
            },
          },
          create: {
            name: chapterData.name,
            chapterNumber: chapterData.chapterNumber,
            description: `Chapter ${chapterData.chapterNumber}: ${chapterData.name}`,
            subjectId: subject.id,
            classLevel: '11',
            ncertBook: chapterData.ncertBook,
            pageRange: chapterData.pageRange,
          },
          update: {},
        });
      } catch (e) {
        // Skip if chapter exists
      }
    }

    console.log(`    ✓ ${subjectData.chapters.length} chapters created for ${subjectData.name}`);
  }

  return subjectMap;
}

async function seedDefaultPatterns() {
  console.log('\nSeeding default test patterns...');

  for (const pattern of DEFAULT_PATTERNS) {
    const existing = await prisma.testPattern.findFirst({
      where: { patternType: pattern.patternType, isDefault: true },
    });

    if (existing) {
      console.log(`  ⏭ Skipped: ${pattern.name} (already exists)`);
      continue;
    }

    await prisma.testPattern.create({
      data: {
        name: pattern.name,
        description: pattern.description,
        patternType: pattern.patternType,
        isDefault: pattern.isDefault,
        sections: pattern.sections,
        scoringRules: pattern.scoringRules,
        totalMarks: pattern.totalMarks,
        totalQuestions: pattern.totalQuestions,
        totalDuration: pattern.totalDuration,
      },
    });

    console.log(`  ✓ Created: ${pattern.name}`);
  }
}

// ==================== SAMPLE QUESTIONS ====================

interface SampleQuestion {
  questionText: string;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  options?: { id: string; text: string }[];
  correctAnswer?: string;
  correctOptions?: string[];
  integerAnswer?: number;
  matrixData?: any;
  assertionData?: any;
  answerExplanation: string;
  marks: number;
  negativeMarks: number;
  source: QuestionSource;
  topic?: string;
}

// Physics Chapter 1: Physical World - Sample Questions
const PHYSICS_CH1_QUESTIONS: SampleQuestion[] = [
  // Single Correct Questions
  {
    questionText: 'Which of the following is a fundamental force in nature?',
    questionType: 'SINGLE_CORRECT',
    difficulty: 'EASY',
    options: [
      { id: 'a', text: 'Frictional force' },
      { id: 'b', text: 'Gravitational force' },
      { id: 'c', text: 'Tension force' },
      { id: 'd', text: 'Normal reaction force' },
    ],
    correctAnswer: 'b',
    answerExplanation: 'Gravitational force is one of the four fundamental forces of nature. The others are electromagnetic force, strong nuclear force, and weak nuclear force. Friction, tension, and normal reaction are contact forces derived from electromagnetic interactions.',
    marks: 4,
    negativeMarks: 1,
    source: 'NCERT',
    topic: 'Fundamental Forces',
  },
  {
    questionText: 'The branch of physics that deals with the study of motion of objects is called:',
    questionType: 'SINGLE_CORRECT',
    difficulty: 'EASY',
    options: [
      { id: 'a', text: 'Thermodynamics' },
      { id: 'b', text: 'Optics' },
      { id: 'c', text: 'Mechanics' },
      { id: 'd', text: 'Electrodynamics' },
    ],
    correctAnswer: 'c',
    answerExplanation: 'Mechanics is the branch of physics that deals with the study of motion of objects and the forces causing the motion. It is divided into kinematics (study of motion without considering forces) and dynamics (study of motion with forces).',
    marks: 4,
    negativeMarks: 1,
    source: 'NCERT',
    topic: 'Branches of Physics',
  },
  {
    questionText: 'Which of the following scientists unified electricity and magnetism?',
    questionType: 'SINGLE_CORRECT',
    difficulty: 'MEDIUM',
    options: [
      { id: 'a', text: 'Isaac Newton' },
      { id: 'b', text: 'James Clerk Maxwell' },
      { id: 'c', text: 'Albert Einstein' },
      { id: 'd', text: 'Galileo Galilei' },
    ],
    correctAnswer: 'b',
    answerExplanation: 'James Clerk Maxwell unified electricity and magnetism into electromagnetism through his famous Maxwell\'s equations. He showed that electric and magnetic fields are manifestations of a single phenomenon - the electromagnetic field.',
    marks: 4,
    negativeMarks: 1,
    source: 'NCERT',
    topic: 'Unification in Physics',
  },
  {
    questionText: 'The scientific method involves:',
    questionType: 'SINGLE_CORRECT',
    difficulty: 'EASY',
    options: [
      { id: 'a', text: 'Only observation' },
      { id: 'b', text: 'Only experimentation' },
      { id: 'c', text: 'Systematic observation, experimentation, and theory formulation' },
      { id: 'd', text: 'Random guessing' },
    ],
    correctAnswer: 'c',
    answerExplanation: 'The scientific method is a systematic approach that involves careful observation, controlled experimentation, analysis of results, and formulation of theories. It is an iterative process that refines our understanding of natural phenomena.',
    marks: 4,
    negativeMarks: 1,
    source: 'NCERT',
    topic: 'Scientific Method',
  },
  {
    questionText: 'Conservation laws are related to:',
    questionType: 'SINGLE_CORRECT',
    difficulty: 'MEDIUM',
    options: [
      { id: 'a', text: 'Symmetries in nature' },
      { id: 'b', text: 'Random phenomena' },
      { id: 'c', text: 'Man-made laws' },
      { id: 'd', text: 'Arbitrary definitions' },
    ],
    correctAnswer: 'a',
    answerExplanation: 'According to Noether\'s theorem, every symmetry in nature corresponds to a conservation law. For example, translational symmetry leads to conservation of momentum, rotational symmetry leads to conservation of angular momentum, and time symmetry leads to conservation of energy.',
    marks: 4,
    negativeMarks: 1,
    source: 'NCERT',
    topic: 'Conservation Laws',
  },
  // Multiple Correct Questions
  {
    questionText: 'Which of the following are fundamental forces of nature?',
    questionType: 'MULTIPLE_CORRECT',
    difficulty: 'MEDIUM',
    options: [
      { id: 'a', text: 'Gravitational force' },
      { id: 'b', text: 'Electromagnetic force' },
      { id: 'c', text: 'Friction force' },
      { id: 'd', text: 'Strong nuclear force' },
    ],
    correctOptions: ['a', 'b', 'd'],
    answerExplanation: 'The four fundamental forces of nature are: (1) Gravitational force, (2) Electromagnetic force, (3) Strong nuclear force, and (4) Weak nuclear force. Friction is not a fundamental force; it arises from electromagnetic interactions between surfaces.',
    marks: 4,
    negativeMarks: 2,
    source: 'NCERT',
    topic: 'Fundamental Forces',
  },
  {
    questionText: 'Which of the following statements about physics are correct?',
    questionType: 'MULTIPLE_CORRECT',
    difficulty: 'MEDIUM',
    options: [
      { id: 'a', text: 'Physics deals with the study of nature and natural phenomena' },
      { id: 'b', text: 'Physics uses mathematical language to describe natural phenomena' },
      { id: 'c', text: 'Physics has no connection with other sciences' },
      { id: 'd', text: 'Physics provides the foundation for all natural sciences' },
    ],
    correctOptions: ['a', 'b', 'd'],
    answerExplanation: 'Physics is the study of nature and natural phenomena, uses mathematical formalism for precise descriptions, and provides foundational principles for all other natural sciences including chemistry, biology, and earth sciences.',
    marks: 4,
    negativeMarks: 2,
    source: 'NCERT',
    topic: 'Nature of Physics',
  },
  // Integer Type Questions
  {
    questionText: 'How many fundamental forces exist in nature according to the Standard Model of physics?',
    questionType: 'INTEGER_TYPE',
    difficulty: 'EASY',
    integerAnswer: 4,
    answerExplanation: 'According to the Standard Model, there are exactly 4 fundamental forces in nature: (1) Gravitational force, (2) Electromagnetic force, (3) Strong nuclear force, and (4) Weak nuclear force.',
    marks: 4,
    negativeMarks: 0,
    source: 'NCERT',
    topic: 'Fundamental Forces',
  },
  {
    questionText: 'In what century was classical mechanics fully developed by Newton?',
    questionType: 'INTEGER_TYPE',
    difficulty: 'EASY',
    integerAnswer: 17,
    answerExplanation: 'Classical mechanics was developed by Isaac Newton in the 17th century (1687, with the publication of Principia Mathematica). Newton formulated the laws of motion and universal gravitation.',
    marks: 4,
    negativeMarks: 0,
    source: 'NCERT',
    topic: 'History of Physics',
  },
  // Assertion-Reasoning Questions
  {
    questionText: 'Consider the following assertion and reason:',
    questionType: 'ASSERTION_REASONING',
    difficulty: 'HARD',
    assertionData: {
      assertion: 'Physics is considered the most fundamental of natural sciences.',
      reason: 'The principles of physics form the foundation for understanding all other sciences like chemistry, biology, geology, etc.',
      correctOption: 'a',
    },
    answerExplanation: 'Both assertion and reason are true, and the reason correctly explains the assertion. Physics provides the basic principles (like laws of motion, thermodynamics, electromagnetism) that are essential for understanding phenomena in chemistry (molecular interactions), biology (biomechanics, neural signals), and other sciences.',
    marks: 4,
    negativeMarks: 1,
    source: 'NCERT',
    topic: 'Nature of Physics',
  },
  {
    questionText: 'Consider the following assertion and reason:',
    questionType: 'ASSERTION_REASONING',
    difficulty: 'MEDIUM',
    assertionData: {
      assertion: 'Electromagnetic force is responsible for holding atoms and molecules together.',
      reason: 'Electromagnetic force acts between charged particles.',
      correctOption: 'a',
    },
    answerExplanation: 'Both assertion and reason are true, and the reason correctly explains the assertion. The electromagnetic force between positively charged nuclei and negatively charged electrons holds atoms together. Similarly, intermolecular forces are electromagnetic in nature.',
    marks: 4,
    negativeMarks: 1,
    source: 'NCERT',
    topic: 'Electromagnetic Force',
  },
];

// Physics Chapter 2: Units and Measurements - Sample Questions
const PHYSICS_CH2_QUESTIONS: SampleQuestion[] = [
  {
    questionText: 'The SI unit of luminous intensity is:',
    questionType: 'SINGLE_CORRECT',
    difficulty: 'EASY',
    options: [
      { id: 'a', text: 'Lumen' },
      { id: 'b', text: 'Candela' },
      { id: 'c', text: 'Lux' },
      { id: 'd', text: 'Watt' },
    ],
    correctAnswer: 'b',
    answerExplanation: 'Candela (cd) is the SI base unit of luminous intensity. Lumen is the unit of luminous flux, lux is the unit of illuminance, and watt is the unit of power.',
    marks: 4,
    negativeMarks: 1,
    source: 'NCERT',
    topic: 'SI Units',
  },
  {
    questionText: 'The dimensional formula of work is:',
    questionType: 'SINGLE_CORRECT',
    difficulty: 'MEDIUM',
    options: [
      { id: 'a', text: '[MLT⁻²]' },
      { id: 'b', text: '[ML²T⁻²]' },
      { id: 'c', text: '[ML²T⁻³]' },
      { id: 'd', text: '[MLT⁻¹]' },
    ],
    correctAnswer: 'b',
    answerExplanation: 'Work = Force × Distance = [MLT⁻²] × [L] = [ML²T⁻²]. This is also the dimensional formula for energy.',
    marks: 4,
    negativeMarks: 1,
    source: 'NCERT',
    topic: 'Dimensional Analysis',
  },
  {
    questionText: 'If the error in measurement of radius of a sphere is 2%, then the error in its volume is:',
    questionType: 'SINGLE_CORRECT',
    difficulty: 'MEDIUM',
    options: [
      { id: 'a', text: '2%' },
      { id: 'b', text: '4%' },
      { id: 'c', text: '6%' },
      { id: 'd', text: '8%' },
    ],
    correctAnswer: 'c',
    answerExplanation: 'Volume of sphere V = (4/3)πr³. The percentage error in volume = 3 × percentage error in radius = 3 × 2% = 6%. For a quantity raised to power n, the percentage error is n times the percentage error in the base quantity.',
    marks: 4,
    negativeMarks: 1,
    source: 'NCERT',
    topic: 'Error Analysis',
  },
  {
    questionText: 'The number of significant figures in 0.00340 is:',
    questionType: 'INTEGER_TYPE',
    difficulty: 'EASY',
    integerAnswer: 3,
    answerExplanation: 'In 0.00340, the leading zeros are not significant. The significant figures are 3, 4, and the trailing 0 (which is significant because it comes after the decimal point following significant digits). Therefore, there are 3 significant figures.',
    marks: 4,
    negativeMarks: 0,
    source: 'NCERT',
    topic: 'Significant Figures',
  },
  {
    questionText: 'How many base units are there in the SI system?',
    questionType: 'INTEGER_TYPE',
    difficulty: 'EASY',
    integerAnswer: 7,
    answerExplanation: 'There are 7 base units in SI: meter (length), kilogram (mass), second (time), ampere (electric current), kelvin (temperature), mole (amount of substance), and candela (luminous intensity).',
    marks: 4,
    negativeMarks: 0,
    source: 'NCERT',
    topic: 'SI Units',
  },
  {
    questionText: 'Which of the following pairs have the same dimensions?',
    questionType: 'MULTIPLE_CORRECT',
    difficulty: 'HARD',
    options: [
      { id: 'a', text: 'Work and Torque' },
      { id: 'b', text: 'Stress and Pressure' },
      { id: 'c', text: 'Momentum and Impulse' },
      { id: 'd', text: 'Force and Energy' },
    ],
    correctOptions: ['a', 'b', 'c'],
    answerExplanation: 'Work = Force × Distance = [ML²T⁻²], Torque = Force × Distance = [ML²T⁻²]. Stress = Force/Area = [ML⁻¹T⁻²], Pressure = Force/Area = [ML⁻¹T⁻²]. Momentum = mass × velocity = [MLT⁻¹], Impulse = Force × time = [MLT⁻¹]. Force and Energy have different dimensions.',
    marks: 4,
    negativeMarks: 2,
    source: 'NCERT',
    topic: 'Dimensional Analysis',
  },
];

async function seedSampleQuestions(
  schoolId: string,
  classId: string,
  createdById: string,
  subjectMap: Record<string, string>
) {
  console.log('\nSeeding sample questions...');

  const physicsSubjectId = subjectMap['PHY'];

  // Get chapter IDs for Physics
  const physicsChapters = await prisma.chapter.findMany({
    where: { subjectId: physicsSubjectId, classLevel: '11' },
    orderBy: { chapterNumber: 'asc' },
  });

  const chapterMap: Record<number, string> = {};
  physicsChapters.forEach((ch) => {
    chapterMap[ch.chapterNumber] = ch.id;
  });

  // Seed Physics Chapter 1 Questions
  console.log('  Seeding Physics Chapter 1 questions...');
  for (const q of PHYSICS_CH1_QUESTIONS) {
    await prisma.question.create({
      data: {
        questionText: q.questionText,
        questionType: q.questionType,
        difficulty: q.difficulty,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        options: q.options,
        correctAnswer: q.correctAnswer,
        correctOptions: q.correctOptions || [],
        integerAnswer: q.integerAnswer,
        assertionData: q.assertionData,
        answerExplanation: q.answerExplanation,
        subjectId: physicsSubjectId,
        classId: classId,
        chapterId: chapterMap[1],
        chapter: 'Physical World',
        topic: q.topic,
        source: q.source,
        createdById: createdById,
        isVerified: true,
      },
    });
  }
  console.log(`    ✓ Created ${PHYSICS_CH1_QUESTIONS.length} questions for Chapter 1`);

  // Seed Physics Chapter 2 Questions
  console.log('  Seeding Physics Chapter 2 questions...');
  for (const q of PHYSICS_CH2_QUESTIONS) {
    await prisma.question.create({
      data: {
        questionText: q.questionText,
        questionType: q.questionType,
        difficulty: q.difficulty,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        options: q.options,
        correctAnswer: q.correctAnswer,
        correctOptions: q.correctOptions || [],
        integerAnswer: q.integerAnswer,
        assertionData: q.assertionData,
        answerExplanation: q.answerExplanation,
        subjectId: physicsSubjectId,
        classId: classId,
        chapterId: chapterMap[2],
        chapter: 'Units and Measurements',
        topic: q.topic,
        source: q.source,
        createdById: createdById,
        isVerified: true,
      },
    });
  }
  console.log(`    ✓ Created ${PHYSICS_CH2_QUESTIONS.length} questions for Chapter 2`);
}

// ==================== MAIN SEED FUNCTION ====================

export async function seedNCERT() {
  console.log('='.repeat(60));
  console.log('NCERT DATA SEEDING');
  console.log('='.repeat(60));

  // Get the first school
  const school = await prisma.school.findFirst();
  if (!school) {
    console.error('No school found! Please run the main seed first.');
    return;
  }
  console.log(`\nUsing school: ${school.name} (${school.id})`);

  // Get a class (preferably Class 11)
  let targetClass = await prisma.class.findFirst({
    where: { schoolId: school.id, code: '11' },
  });
  if (!targetClass) {
    targetClass = await prisma.class.findFirst({
      where: { schoolId: school.id },
    });
  }
  if (!targetClass) {
    console.error('No class found! Please run the main seed first.');
    return;
  }
  console.log(`Using class: ${targetClass.name} (${targetClass.id})`);

  // Get a user to assign as creator
  const adminUser = await prisma.user.findFirst({
    where: { schoolId: school.id, role: { in: ['ADMIN', 'SUPER_ADMIN', 'TEACHER'] } },
  });
  if (!adminUser) {
    console.error('No admin/teacher user found! Please run the main seed first.');
    return;
  }
  console.log(`Using creator: ${adminUser.email} (${adminUser.id})\n`);

  // Seed subjects and chapters
  const subjectMap = await seedSubjectsAndChapters(school.id);

  // Seed default patterns
  await seedDefaultPatterns();

  // Seed sample questions
  await seedSampleQuestions(school.id, targetClass.id, adminUser.id, subjectMap);

  console.log('\n' + '='.repeat(60));
  console.log('NCERT SEEDING COMPLETED!');
  console.log('='.repeat(60));

  // Print summary
  const questionCount = await prisma.question.count({ where: { classId: targetClass.id } });
  const chapterCount = await prisma.chapter.count();
  const patternCount = await prisma.testPattern.count({ where: { isDefault: true } });

  console.log(`\nSummary:`);
  console.log(`  - Subjects: 4 (Physics, Chemistry, Biology, Mathematics)`);
  console.log(`  - Chapters: ${chapterCount}`);
  console.log(`  - Default Patterns: ${patternCount}`);
  console.log(`  - Sample Questions: ${questionCount}`);
}

// Import question banks
import { getAllPhysicsQuestions } from './seeds/physics-questions';
import { getAllChemistryQuestions } from './seeds/chemistry-questions';
import { getAllBiologyQuestions } from './seeds/biology-questions';
import { getAllMathematicsQuestions } from './seeds/mathematics-questions';

// Seed all questions for a subject
async function seedSubjectQuestions(
  subjectId: string,
  classId: string,
  createdById: string,
  chapterMap: Record<number, string>,
  questions: any[],
  subjectName: string
) {
  console.log(`\n  Seeding ${subjectName} questions...`);
  let created = 0;
  let failed = 0;

  for (const q of questions) {
    try {
      await prisma.question.create({
        data: {
          questionText: q.questionText,
          questionType: q.questionType,
          difficulty: q.difficulty,
          marks: q.marks,
          negativeMarks: q.negativeMarks,
          options: q.options,
          correctAnswer: q.correctAnswer,
          correctOptions: q.correctOptions || [],
          integerAnswer: q.integerAnswer,
          assertionData: q.assertionData,
          matrixData: q.matrixData,
          answerExplanation: q.answerExplanation,
          subjectId: subjectId,
          classId: classId,
          chapterId: chapterMap[q.chapterNumber],
          chapter: q.chapter || `Chapter ${q.chapterNumber}`,
          topic: q.topic,
          source: q.source || 'NCERT',
          createdById: createdById,
          isVerified: true,
        },
      });
      created++;
    } catch (error: any) {
      failed++;
      // Skip duplicate or invalid questions silently
    }
  }

  console.log(`    ✓ Created ${created} questions (${failed} skipped)`);
  return { created, failed };
}

// Enhanced seeding with all subjects
async function seedAllQuestions(
  schoolId: string,
  classId: string,
  createdById: string,
  subjectMap: Record<string, string>
) {
  console.log('\n' + '='.repeat(60));
  console.log('SEEDING ALL SUBJECT QUESTIONS');
  console.log('='.repeat(60));

  const results: Record<string, { created: number; failed: number }> = {};

  // Physics
  const physicsChapters = await prisma.chapter.findMany({
    where: { subjectId: subjectMap['PHY'], classLevel: '11' },
  });
  const physicsChapterMap: Record<number, string> = {};
  physicsChapters.forEach((ch) => (physicsChapterMap[ch.chapterNumber] = ch.id));
  results['Physics'] = await seedSubjectQuestions(
    subjectMap['PHY'],
    classId,
    createdById,
    physicsChapterMap,
    getAllPhysicsQuestions(),
    'Physics'
  );

  // Chemistry
  const chemistryChapters = await prisma.chapter.findMany({
    where: { subjectId: subjectMap['CHEM'], classLevel: '11' },
  });
  const chemistryChapterMap: Record<number, string> = {};
  chemistryChapters.forEach((ch) => (chemistryChapterMap[ch.chapterNumber] = ch.id));
  results['Chemistry'] = await seedSubjectQuestions(
    subjectMap['CHEM'],
    classId,
    createdById,
    chemistryChapterMap,
    getAllChemistryQuestions(),
    'Chemistry'
  );

  // Biology
  const biologyChapters = await prisma.chapter.findMany({
    where: { subjectId: subjectMap['BIO'], classLevel: '11' },
  });
  const biologyChapterMap: Record<number, string> = {};
  biologyChapters.forEach((ch) => (biologyChapterMap[ch.chapterNumber] = ch.id));
  results['Biology'] = await seedSubjectQuestions(
    subjectMap['BIO'],
    classId,
    createdById,
    biologyChapterMap,
    getAllBiologyQuestions(),
    'Biology'
  );

  // Mathematics
  const mathChapters = await prisma.chapter.findMany({
    where: { subjectId: subjectMap['MATH'], classLevel: '11' },
  });
  const mathChapterMap: Record<number, string> = {};
  mathChapters.forEach((ch) => (mathChapterMap[ch.chapterNumber] = ch.id));
  results['Mathematics'] = await seedSubjectQuestions(
    subjectMap['MATH'],
    classId,
    createdById,
    mathChapterMap,
    getAllMathematicsQuestions(),
    'Mathematics'
  );

  return results;
}

// Enhanced main seed function
export async function seedNCERTFull() {
  console.log('='.repeat(60));
  console.log('NCERT FULL DATA SEEDING');
  console.log('='.repeat(60));

  const school = await prisma.school.findFirst();
  if (!school) {
    console.error('No school found! Please run the main seed first.');
    return;
  }
  console.log(`\nUsing school: ${school.name} (${school.id})`);

  let targetClass = await prisma.class.findFirst({
    where: { schoolId: school.id, code: '11' },
  });
  if (!targetClass) {
    targetClass = await prisma.class.findFirst({ where: { schoolId: school.id } });
  }
  if (!targetClass) {
    // Create Class 11 if it doesn't exist
    console.log('No class found, creating Class 11...');
    targetClass = await prisma.class.create({
      data: {
        name: 'Class 11',
        code: '11',
        schoolId: school.id,
        displayOrder: 11,
      },
    });
    console.log(`Created class: ${targetClass.name} (${targetClass.id})`);
  } else {
    console.log(`Using class: ${targetClass.name} (${targetClass.id})`);
  }

  const adminUser = await prisma.user.findFirst({
    where: { schoolId: school.id, role: { in: ['ADMIN', 'SUPER_ADMIN', 'TEACHER'] } },
  });
  if (!adminUser) {
    console.error('No admin/teacher user found!');
    return;
  }
  console.log(`Using creator: ${adminUser.email} (${adminUser.id})\n`);

  // Seed subjects and chapters
  const subjectMap = await seedSubjectsAndChapters(school.id);

  // Seed default patterns
  await seedDefaultPatterns();

  // Seed all questions
  const questionResults = await seedAllQuestions(
    school.id,
    targetClass.id,
    adminUser.id,
    subjectMap
  );

  // Print final summary
  console.log('\n' + '='.repeat(60));
  console.log('SEEDING COMPLETED!');
  console.log('='.repeat(60));

  const totalCreated = Object.values(questionResults).reduce((sum, r) => sum + r.created, 0);
  console.log(`\nQuestion Summary:`);
  Object.entries(questionResults).forEach(([subject, result]) => {
    console.log(`  - ${subject}: ${result.created} questions`);
  });
  console.log(`  - TOTAL: ${totalCreated} questions`);

  const patternCount = await prisma.testPattern.count({ where: { isDefault: true } });
  const chapterCount = await prisma.chapter.count();
  console.log(`\nOther Data:`);
  console.log(`  - Chapters: ${chapterCount}`);
  console.log(`  - Default Patterns: ${patternCount}`);
}

// Run if called directly
if (require.main === module) {
  seedNCERTFull()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
