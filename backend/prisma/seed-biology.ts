import { PrismaClient, QuestionType, DifficultyLevel, QuestionSource } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧬 Adding Biology questions...\n');

  // Get the school, class, subject, and teacher
  const school = await prisma.school.findUnique({ where: { code: 'WEBER001' } });
  if (!school) throw new Error('School not found. Run main seed first.');

  const biology = await prisma.subject.findUnique({
    where: { schoolId_code: { schoolId: school.id, code: 'BIO' } },
  });
  if (!biology) throw new Error('Biology subject not found. Run main seed first.');

  const class11 = await prisma.class.findUnique({
    where: { schoolId_code: { schoolId: school.id, code: '11' } },
  });
  if (!class11) throw new Error('Class 11 not found. Run main seed first.');

  const teacherUser = await prisma.user.findUnique({
    where: { email: 'teacher@weberacademy.edu' },
  });
  if (!teacherUser) throw new Error('Teacher not found. Run main seed first.');

  console.log(`School: ${school.name}`);
  console.log(`Subject: ${biology.name}`);
  console.log(`Class: ${class11.name}`);
  console.log(`Teacher: ${teacherUser.email}\n`);

  // ============================================================
  // BIOLOGY QUESTIONS - Class 11 NEET Level (50 Questions)
  // ============================================================

  const biologyQuestions = [
    // UNIT: The Living World (5 questions)
    {
      questionText: 'The basic unit of classification is:',
      options: [
        { id: 'a', text: 'Genus', isCorrect: false },
        { id: 'b', text: 'Species', isCorrect: true },
        { id: 'c', text: 'Family', isCorrect: false },
        { id: 'd', text: 'Order', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Species is the basic unit of classification. It is a group of organisms that can interbreed.',
      chapter: 'The Living World',
      topic: 'Taxonomy',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Binomial nomenclature was introduced by:',
      options: [
        { id: 'a', text: 'Aristotle', isCorrect: false },
        { id: 'b', text: 'Linnaeus', isCorrect: true },
        { id: 'c', text: 'Darwin', isCorrect: false },
        { id: 'd', text: 'Mendel', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Carolus Linnaeus introduced the binomial nomenclature system in 1753.',
      chapter: 'The Living World',
      topic: 'Nomenclature',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The correct sequence of taxonomic categories in ascending order is:',
      options: [
        { id: 'a', text: 'Species → Genus → Family → Order → Class → Phylum → Kingdom', isCorrect: true },
        { id: 'b', text: 'Kingdom → Phylum → Class → Order → Family → Genus → Species', isCorrect: false },
        { id: 'c', text: 'Species → Family → Genus → Order → Class → Phylum → Kingdom', isCorrect: false },
        { id: 'd', text: 'Species → Genus → Order → Family → Class → Phylum → Kingdom', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'Taxonomic hierarchy: Species → Genus → Family → Order → Class → Phylum → Kingdom.',
      chapter: 'The Living World',
      topic: 'Taxonomic Categories',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'Herbarium is a:',
      options: [
        { id: 'a', text: 'Garden for herbs', isCorrect: false },
        { id: 'b', text: 'Collection of preserved plant specimens', isCorrect: true },
        { id: 'c', text: 'Museum of animals', isCorrect: false },
        { id: 'd', text: 'Laboratory for plant study', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Herbarium is a collection of dried, pressed plant specimens mounted on sheets for study.',
      chapter: 'The Living World',
      topic: 'Taxonomic Aids',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The scientific name of humans is:',
      options: [
        { id: 'a', text: 'Homo erectus', isCorrect: false },
        { id: 'b', text: 'Homo sapiens', isCorrect: true },
        { id: 'c', text: 'Homo habilis', isCorrect: false },
        { id: 'd', text: 'Homo neanderthalensis', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'The scientific name of modern humans is Homo sapiens (wise man).',
      chapter: 'The Living World',
      topic: 'Nomenclature',
      difficulty: DifficultyLevel.EASY,
    },

    // UNIT: Biological Classification (5 questions)
    {
      questionText: 'Five kingdom classification was proposed by:',
      options: [
        { id: 'a', text: 'Linnaeus', isCorrect: false },
        { id: 'b', text: 'Whittaker', isCorrect: true },
        { id: 'c', text: 'Copeland', isCorrect: false },
        { id: 'd', text: 'Haeckel', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'R.H. Whittaker proposed the five kingdom classification in 1969.',
      chapter: 'Biological Classification',
      topic: 'Kingdom Classification',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Bacteria are classified under kingdom:',
      options: [
        { id: 'a', text: 'Protista', isCorrect: false },
        { id: 'b', text: 'Plantae', isCorrect: false },
        { id: 'c', text: 'Monera', isCorrect: true },
        { id: 'd', text: 'Fungi', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Bacteria are prokaryotes and belong to Kingdom Monera.',
      chapter: 'Biological Classification',
      topic: 'Kingdom Monera',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Cell wall of fungi is made up of:',
      options: [
        { id: 'a', text: 'Cellulose', isCorrect: false },
        { id: 'b', text: 'Chitin', isCorrect: true },
        { id: 'c', text: 'Peptidoglycan', isCorrect: false },
        { id: 'd', text: 'Pectin', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Fungal cell wall is made of chitin, a nitrogen-containing polysaccharide.',
      chapter: 'Biological Classification',
      topic: 'Kingdom Fungi',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Viruses are:',
      options: [
        { id: 'a', text: 'Living inside host only', isCorrect: true },
        { id: 'b', text: 'Always living', isCorrect: false },
        { id: 'c', text: 'Always non-living', isCorrect: false },
        { id: 'd', text: 'Unicellular organisms', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'Viruses are obligate parasites - living only inside host cells, non-living outside.',
      chapter: 'Biological Classification',
      topic: 'Viruses',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'Lichens are symbiotic association between:',
      options: [
        { id: 'a', text: 'Algae and fungi', isCorrect: true },
        { id: 'b', text: 'Bacteria and fungi', isCorrect: false },
        { id: 'c', text: 'Algae and bacteria', isCorrect: false },
        { id: 'd', text: 'Two fungi', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'Lichens are symbiotic association between algae (photobiont) and fungi (mycobiont).',
      chapter: 'Biological Classification',
      topic: 'Symbiosis',
      difficulty: DifficultyLevel.EASY,
    },

    // UNIT: Plant Kingdom (5 questions)
    {
      questionText: 'Which of the following is not a characteristic of bryophytes?',
      options: [
        { id: 'a', text: 'Lack vascular tissue', isCorrect: false },
        { id: 'b', text: 'Dominant gametophyte', isCorrect: false },
        { id: 'c', text: 'Have true roots', isCorrect: true },
        { id: 'd', text: 'Require water for fertilization', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Bryophytes lack true roots, stems, and leaves. They have rhizoids instead of roots.',
      chapter: 'Plant Kingdom',
      topic: 'Bryophytes',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'The first vascular plants are:',
      options: [
        { id: 'a', text: 'Bryophytes', isCorrect: false },
        { id: 'b', text: 'Pteridophytes', isCorrect: true },
        { id: 'c', text: 'Gymnosperms', isCorrect: false },
        { id: 'd', text: 'Angiosperms', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Pteridophytes are the first vascular plants with xylem and phloem.',
      chapter: 'Plant Kingdom',
      topic: 'Pteridophytes',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Gymnosperms are characterized by:',
      options: [
        { id: 'a', text: 'Naked seeds', isCorrect: true },
        { id: 'b', text: 'Enclosed seeds', isCorrect: false },
        { id: 'c', text: 'No seeds', isCorrect: false },
        { id: 'd', text: 'Spore formation only', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'Gymnosperms have naked seeds (not enclosed in fruit). Greek: gymnos = naked, sperma = seed.',
      chapter: 'Plant Kingdom',
      topic: 'Gymnosperms',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Double fertilization is characteristic of:',
      options: [
        { id: 'a', text: 'Bryophytes', isCorrect: false },
        { id: 'b', text: 'Pteridophytes', isCorrect: false },
        { id: 'c', text: 'Gymnosperms', isCorrect: false },
        { id: 'd', text: 'Angiosperms', isCorrect: true },
      ],
      correctAnswer: 'd',
      answerExplanation: 'Double fertilization (fusion forming zygote and endosperm) is unique to angiosperms.',
      chapter: 'Plant Kingdom',
      topic: 'Angiosperms',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Alternation of generations is most prominent in:',
      options: [
        { id: 'a', text: 'Algae', isCorrect: false },
        { id: 'b', text: 'Bryophytes', isCorrect: true },
        { id: 'c', text: 'Gymnosperms', isCorrect: false },
        { id: 'd', text: 'Angiosperms', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Bryophytes show clear alternation between gametophyte (dominant) and sporophyte generations.',
      chapter: 'Plant Kingdom',
      topic: 'Life Cycle',
      difficulty: DifficultyLevel.MEDIUM,
    },

    // UNIT: Animal Kingdom (5 questions)
    {
      questionText: 'Coelom is absent in:',
      options: [
        { id: 'a', text: 'Annelida', isCorrect: false },
        { id: 'b', text: 'Arthropoda', isCorrect: false },
        { id: 'c', text: 'Platyhelminthes', isCorrect: true },
        { id: 'd', text: 'Mollusca', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Platyhelminthes (flatworms) are acoelomates - they lack a true body cavity.',
      chapter: 'Animal Kingdom',
      topic: 'Body Cavity',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'Notochord is present in:',
      options: [
        { id: 'a', text: 'Arthropoda', isCorrect: false },
        { id: 'b', text: 'Mollusca', isCorrect: false },
        { id: 'c', text: 'Chordata', isCorrect: true },
        { id: 'd', text: 'Echinodermata', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Notochord is a defining characteristic of phylum Chordata.',
      chapter: 'Animal Kingdom',
      topic: 'Chordata',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Water vascular system is found in:',
      options: [
        { id: 'a', text: 'Arthropoda', isCorrect: false },
        { id: 'b', text: 'Echinodermata', isCorrect: true },
        { id: 'c', text: 'Mollusca', isCorrect: false },
        { id: 'd', text: 'Annelida', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Water vascular system for locomotion and feeding is unique to Echinodermata (starfish, etc.).',
      chapter: 'Animal Kingdom',
      topic: 'Echinodermata',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Metameric segmentation is found in:',
      options: [
        { id: 'a', text: 'Mollusca', isCorrect: false },
        { id: 'b', text: 'Annelida', isCorrect: true },
        { id: 'c', text: 'Nematoda', isCorrect: false },
        { id: 'd', text: 'Porifera', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'True metameric segmentation (repeated body segments) is characteristic of Annelida.',
      chapter: 'Animal Kingdom',
      topic: 'Annelida',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Jointed appendages are characteristic of:',
      options: [
        { id: 'a', text: 'Annelida', isCorrect: false },
        { id: 'b', text: 'Arthropoda', isCorrect: true },
        { id: 'c', text: 'Mollusca', isCorrect: false },
        { id: 'd', text: 'Echinodermata', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Arthropoda (arthros = joint, poda = foot) is named for its jointed appendages.',
      chapter: 'Animal Kingdom',
      topic: 'Arthropoda',
      difficulty: DifficultyLevel.EASY,
    },

    // UNIT: Morphology of Flowering Plants (5 questions)
    {
      questionText: 'Tap root system is found in:',
      options: [
        { id: 'a', text: 'Monocots', isCorrect: false },
        { id: 'b', text: 'Dicots', isCorrect: true },
        { id: 'c', text: 'Both', isCorrect: false },
        { id: 'd', text: 'None', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Dicots have tap root system; monocots have fibrous root system.',
      chapter: 'Morphology of Flowering Plants',
      topic: 'Root System',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Phyllotaxy refers to:',
      options: [
        { id: 'a', text: 'Arrangement of flowers', isCorrect: false },
        { id: 'b', text: 'Arrangement of leaves', isCorrect: true },
        { id: 'c', text: 'Structure of leaf', isCorrect: false },
        { id: 'd', text: 'Venation pattern', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Phyllotaxy is the arrangement of leaves on stem (alternate, opposite, whorled).',
      chapter: 'Morphology of Flowering Plants',
      topic: 'Leaf',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Reticulate venation is found in:',
      options: [
        { id: 'a', text: 'Monocots', isCorrect: false },
        { id: 'b', text: 'Dicots', isCorrect: true },
        { id: 'c', text: 'Gymnosperms', isCorrect: false },
        { id: 'd', text: 'Pteridophytes', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Dicots show reticulate (net-like) venation; monocots show parallel venation.',
      chapter: 'Morphology of Flowering Plants',
      topic: 'Venation',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The edible part of apple is:',
      options: [
        { id: 'a', text: 'Mesocarp', isCorrect: false },
        { id: 'b', text: 'Thalamus', isCorrect: true },
        { id: 'c', text: 'Endocarp', isCorrect: false },
        { id: 'd', text: 'Epicarp', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Apple is a false fruit where fleshy thalamus (receptacle) is the edible part.',
      chapter: 'Morphology of Flowering Plants',
      topic: 'Fruit',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'Racemose inflorescence has flowers arranged:',
      options: [
        { id: 'a', text: 'In centripetal order', isCorrect: true },
        { id: 'b', text: 'In centrifugal order', isCorrect: false },
        { id: 'c', text: 'In random order', isCorrect: false },
        { id: 'd', text: 'In spiral order only', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'In racemose inflorescence, older flowers are at base, younger at apex (centripetal/acropetal).',
      chapter: 'Morphology of Flowering Plants',
      topic: 'Inflorescence',
      difficulty: DifficultyLevel.MEDIUM,
    },

    // UNIT: Anatomy of Flowering Plants (5 questions)
    {
      questionText: 'Meristematic tissue is characterized by:',
      options: [
        { id: 'a', text: 'Thick cell walls', isCorrect: false },
        { id: 'b', text: 'Actively dividing cells', isCorrect: true },
        { id: 'c', text: 'Large vacuoles', isCorrect: false },
        { id: 'd', text: 'Dead cells', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Meristematic tissue consists of actively dividing, undifferentiated cells.',
      chapter: 'Anatomy of Flowering Plants',
      topic: 'Meristematic Tissue',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Xylem is responsible for:',
      options: [
        { id: 'a', text: 'Transport of food', isCorrect: false },
        { id: 'b', text: 'Transport of water', isCorrect: true },
        { id: 'c', text: 'Photosynthesis', isCorrect: false },
        { id: 'd', text: 'Respiration', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Xylem transports water and minerals from roots to leaves (ascent of sap).',
      chapter: 'Anatomy of Flowering Plants',
      topic: 'Vascular Tissue',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Collenchyma provides:',
      options: [
        { id: 'a', text: 'Rigidity', isCorrect: false },
        { id: 'b', text: 'Flexibility', isCorrect: true },
        { id: 'c', text: 'Storage', isCorrect: false },
        { id: 'd', text: 'Conduction', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Collenchyma has thickened corners providing flexibility and mechanical support to growing parts.',
      chapter: 'Anatomy of Flowering Plants',
      topic: 'Ground Tissue',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Secondary growth is due to:',
      options: [
        { id: 'a', text: 'Apical meristem', isCorrect: false },
        { id: 'b', text: 'Lateral meristem', isCorrect: true },
        { id: 'c', text: 'Intercalary meristem', isCorrect: false },
        { id: 'd', text: 'Ground meristem', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Secondary growth (increase in girth) is due to lateral meristems - vascular and cork cambium.',
      chapter: 'Anatomy of Flowering Plants',
      topic: 'Secondary Growth',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'Casparian strips are found in:',
      options: [
        { id: 'a', text: 'Epidermis', isCorrect: false },
        { id: 'b', text: 'Endodermis', isCorrect: true },
        { id: 'c', text: 'Pericycle', isCorrect: false },
        { id: 'd', text: 'Cortex', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Casparian strips are waterproof bands of suberin in endodermal cell walls.',
      chapter: 'Anatomy of Flowering Plants',
      topic: 'Root Anatomy',
      difficulty: DifficultyLevel.MEDIUM,
    },

    // UNIT: Cell: The Unit of Life (5 questions)
    {
      questionText: 'The cell theory was proposed by:',
      options: [
        { id: 'a', text: 'Robert Hooke', isCorrect: false },
        { id: 'b', text: 'Schleiden and Schwann', isCorrect: true },
        { id: 'c', text: 'Virchow', isCorrect: false },
        { id: 'd', text: 'Leeuwenhoek', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Cell theory was proposed by Schleiden (botanist) and Schwann (zoologist) in 1838-39.',
      chapter: 'Cell: The Unit of Life',
      topic: 'Cell Theory',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Ribosomes are the site of:',
      options: [
        { id: 'a', text: 'Respiration', isCorrect: false },
        { id: 'b', text: 'Protein synthesis', isCorrect: true },
        { id: 'c', text: 'Photosynthesis', isCorrect: false },
        { id: 'd', text: 'Lipid synthesis', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Ribosomes are the sites of protein synthesis (translation of mRNA).',
      chapter: 'Cell: The Unit of Life',
      topic: 'Ribosomes',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The powerhouse of the cell is:',
      options: [
        { id: 'a', text: 'Nucleus', isCorrect: false },
        { id: 'b', text: 'Chloroplast', isCorrect: false },
        { id: 'c', text: 'Mitochondria', isCorrect: true },
        { id: 'd', text: 'Golgi apparatus', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Mitochondria produce ATP through cellular respiration, hence called powerhouse.',
      chapter: 'Cell: The Unit of Life',
      topic: 'Mitochondria',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Plasma membrane is:',
      options: [
        { id: 'a', text: 'Completely permeable', isCorrect: false },
        { id: 'b', text: 'Impermeable', isCorrect: false },
        { id: 'c', text: 'Selectively permeable', isCorrect: true },
        { id: 'd', text: 'Freely permeable', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Plasma membrane is selectively permeable, allowing only certain substances to pass.',
      chapter: 'Cell: The Unit of Life',
      topic: 'Cell Membrane',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Lysosomes are called suicidal bags because:',
      options: [
        { id: 'a', text: 'They kill foreign cells', isCorrect: false },
        { id: 'b', text: 'They can digest the cell itself', isCorrect: true },
        { id: 'c', text: 'They produce toxins', isCorrect: false },
        { id: 'd', text: 'They divide rapidly', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Lysosomes contain digestive enzymes that can destroy the cell itself (autolysis).',
      chapter: 'Cell: The Unit of Life',
      topic: 'Lysosomes',
      difficulty: DifficultyLevel.EASY,
    },

    // UNIT: Biomolecules (5 questions)
    {
      questionText: 'The most abundant protein in the human body is:',
      options: [
        { id: 'a', text: 'Hemoglobin', isCorrect: false },
        { id: 'b', text: 'Collagen', isCorrect: true },
        { id: 'c', text: 'Albumin', isCorrect: false },
        { id: 'd', text: 'Keratin', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Collagen makes up 25-35% of body protein, found in connective tissues.',
      chapter: 'Biomolecules',
      topic: 'Proteins',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'Enzymes are:',
      options: [
        { id: 'a', text: 'Carbohydrates', isCorrect: false },
        { id: 'b', text: 'Lipids', isCorrect: false },
        { id: 'c', text: 'Proteins', isCorrect: true },
        { id: 'd', text: 'Nucleic acids', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Enzymes are biological catalysts, mostly proteins (some are RNA - ribozymes).',
      chapter: 'Biomolecules',
      topic: 'Enzymes',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The basic unit of nucleic acid is:',
      options: [
        { id: 'a', text: 'Amino acid', isCorrect: false },
        { id: 'b', text: 'Nucleotide', isCorrect: true },
        { id: 'c', text: 'Fatty acid', isCorrect: false },
        { id: 'd', text: 'Monosaccharide', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Nucleotides (sugar + phosphate + nitrogenous base) are monomers of nucleic acids.',
      chapter: 'Biomolecules',
      topic: 'Nucleic Acids',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Starch is a polymer of:',
      options: [
        { id: 'a', text: 'Fructose', isCorrect: false },
        { id: 'b', text: 'Glucose', isCorrect: true },
        { id: 'c', text: 'Galactose', isCorrect: false },
        { id: 'd', text: 'Ribose', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Starch is a polysaccharide made of glucose units (amylose and amylopectin).',
      chapter: 'Biomolecules',
      topic: 'Carbohydrates',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Which of the following is a saturated fatty acid?',
      options: [
        { id: 'a', text: 'Oleic acid', isCorrect: false },
        { id: 'b', text: 'Linoleic acid', isCorrect: false },
        { id: 'c', text: 'Palmitic acid', isCorrect: true },
        { id: 'd', text: 'Arachidonic acid', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Palmitic acid (C16:0) has no double bonds - it is saturated.',
      chapter: 'Biomolecules',
      topic: 'Lipids',
      difficulty: DifficultyLevel.MEDIUM,
    },

    // UNIT: Cell Cycle and Cell Division (5 questions)
    {
      questionText: 'During which phase of cell cycle DNA replication occurs?',
      options: [
        { id: 'a', text: 'G1 phase', isCorrect: false },
        { id: 'b', text: 'S phase', isCorrect: true },
        { id: 'c', text: 'G2 phase', isCorrect: false },
        { id: 'd', text: 'M phase', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'S phase (Synthesis phase) is when DNA replication occurs in the cell cycle.',
      chapter: 'Cell Cycle and Cell Division',
      topic: 'Cell Cycle',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Crossing over occurs during:',
      options: [
        { id: 'a', text: 'Leptotene', isCorrect: false },
        { id: 'b', text: 'Zygotene', isCorrect: false },
        { id: 'c', text: 'Pachytene', isCorrect: true },
        { id: 'd', text: 'Diplotene', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Crossing over (exchange of genetic material) occurs during pachytene of prophase I.',
      chapter: 'Cell Cycle and Cell Division',
      topic: 'Meiosis',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'The number of chromosomes in human gametes is:',
      options: [
        { id: 'a', text: '46', isCorrect: false },
        { id: 'b', text: '23', isCorrect: true },
        { id: 'c', text: '44', isCorrect: false },
        { id: 'd', text: '22', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Human gametes are haploid with 23 chromosomes (n=23); somatic cells have 46 (2n=46).',
      chapter: 'Cell Cycle and Cell Division',
      topic: 'Chromosome Number',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Spindle fibers are made up of:',
      options: [
        { id: 'a', text: 'Actin', isCorrect: false },
        { id: 'b', text: 'Tubulin', isCorrect: true },
        { id: 'c', text: 'Myosin', isCorrect: false },
        { id: 'd', text: 'Keratin', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Spindle fibers are microtubules made of tubulin protein.',
      chapter: 'Cell Cycle and Cell Division',
      topic: 'Mitosis',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'Cytokinesis in plant cells occurs by:',
      options: [
        { id: 'a', text: 'Cleavage furrow', isCorrect: false },
        { id: 'b', text: 'Cell plate formation', isCorrect: true },
        { id: 'c', text: 'Both', isCorrect: false },
        { id: 'd', text: 'Neither', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Plant cells divide by forming cell plate (centrifugal); animal cells by cleavage furrow.',
      chapter: 'Cell Cycle and Cell Division',
      topic: 'Cytokinesis',
      difficulty: DifficultyLevel.EASY,
    },

    // UNIT: Photosynthesis in Higher Plants (5 questions)
    {
      questionText: 'The site of light reaction in photosynthesis is:',
      options: [
        { id: 'a', text: 'Stroma', isCorrect: false },
        { id: 'b', text: 'Thylakoid membrane', isCorrect: true },
        { id: 'c', text: 'Outer membrane', isCorrect: false },
        { id: 'd', text: 'Inner membrane', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Light reactions occur in thylakoid membranes; dark reactions in stroma.',
      chapter: 'Photosynthesis',
      topic: 'Light Reaction',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The primary acceptor of CO₂ in C3 plants is:',
      options: [
        { id: 'a', text: 'PEP', isCorrect: false },
        { id: 'b', text: 'RuBP', isCorrect: true },
        { id: 'c', text: 'OAA', isCorrect: false },
        { id: 'd', text: 'Pyruvic acid', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'In C3 plants, RuBP (5C) accepts CO₂ to form 3-PGA via RuBisCO enzyme.',
      chapter: 'Photosynthesis',
      topic: 'Calvin Cycle',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'Oxygen evolved during photosynthesis comes from:',
      options: [
        { id: 'a', text: 'CO₂', isCorrect: false },
        { id: 'b', text: 'H₂O', isCorrect: true },
        { id: 'c', text: 'Glucose', isCorrect: false },
        { id: 'd', text: 'Chlorophyll', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Photolysis of water releases O₂. Proved by ¹⁸O isotope tracer experiments.',
      chapter: 'Photosynthesis',
      topic: 'Photolysis',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'C4 plants are more efficient because they:',
      options: [
        { id: 'a', text: 'Have more chlorophyll', isCorrect: false },
        { id: 'b', text: 'Avoid photorespiration', isCorrect: true },
        { id: 'c', text: 'Have larger leaves', isCorrect: false },
        { id: 'd', text: 'Need less water', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'C4 plants avoid photorespiration by concentrating CO₂ in bundle sheath cells.',
      chapter: 'Photosynthesis',
      topic: 'C4 Pathway',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'Photophosphorylation produces:',
      options: [
        { id: 'a', text: 'ATP only', isCorrect: false },
        { id: 'b', text: 'NADPH only', isCorrect: false },
        { id: 'c', text: 'ATP and NADPH', isCorrect: true },
        { id: 'd', text: 'Glucose', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Light reactions produce ATP (via photophosphorylation) and NADPH (via NADP+ reduction).',
      chapter: 'Photosynthesis',
      topic: 'Light Reaction Products',
      difficulty: DifficultyLevel.EASY,
    },

    // UNIT: Breathing and Exchange of Gases (5 questions)
    {
      questionText: 'The respiratory pigment in humans is:',
      options: [
        { id: 'a', text: 'Myoglobin', isCorrect: false },
        { id: 'b', text: 'Hemoglobin', isCorrect: true },
        { id: 'c', text: 'Hemocyanin', isCorrect: false },
        { id: 'd', text: 'Chlorocruorin', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Hemoglobin in RBCs is the respiratory pigment that carries O₂ and CO₂.',
      chapter: 'Breathing and Exchange of Gases',
      topic: 'Respiratory Pigment',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The vital capacity is:',
      options: [
        { id: 'a', text: 'Tidal volume + IRV', isCorrect: false },
        { id: 'b', text: 'ERV + Tidal volume', isCorrect: false },
        { id: 'c', text: 'IRV + Tidal volume + ERV', isCorrect: true },
        { id: 'd', text: 'Total lung capacity', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Vital capacity = IRV + TV + ERV (maximum air that can be breathed in and out).',
      chapter: 'Breathing and Exchange of Gases',
      topic: 'Lung Volumes',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'Gas exchange in alveoli occurs by:',
      options: [
        { id: 'a', text: 'Active transport', isCorrect: false },
        { id: 'b', text: 'Diffusion', isCorrect: true },
        { id: 'c', text: 'Osmosis', isCorrect: false },
        { id: 'd', text: 'Facilitated diffusion', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Gas exchange occurs by simple diffusion down concentration gradients.',
      chapter: 'Breathing and Exchange of Gases',
      topic: 'Gas Exchange',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Bohr effect refers to:',
      options: [
        { id: 'a', text: 'Effect of pH on O₂ binding', isCorrect: true },
        { id: 'b', text: 'Effect of temperature on respiration', isCorrect: false },
        { id: 'c', text: 'Effect of CO₂ on breathing rate', isCorrect: false },
        { id: 'd', text: 'Effect of O₂ on heart rate', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'Bohr effect: Lower pH (higher CO₂) reduces hemoglobin\'s O₂ affinity, promoting O₂ release.',
      chapter: 'Breathing and Exchange of Gases',
      topic: 'Oxygen Transport',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'The respiratory centre is located in:',
      options: [
        { id: 'a', text: 'Cerebrum', isCorrect: false },
        { id: 'b', text: 'Cerebellum', isCorrect: false },
        { id: 'c', text: 'Medulla oblongata', isCorrect: true },
        { id: 'd', text: 'Hypothalamus', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Primary respiratory centre is in medulla oblongata; pons has pneumotaxic centre.',
      chapter: 'Breathing and Exchange of Gases',
      topic: 'Regulation of Respiration',
      difficulty: DifficultyLevel.EASY,
    },
  ];

  // Insert Biology questions
  let biologyCount = 0;
  for (const q of biologyQuestions) {
    await prisma.question.create({
      data: {
        questionText: q.questionText,
        questionType: QuestionType.MCQ,
        difficulty: q.difficulty,
        marks: 4,
        negativeMarks: 1,
        estimatedTime: 120,
        subjectId: biology.id,
        classId: class11.id,
        chapter: q.chapter,
        topic: q.topic,
        tags: ['NEET', 'Class 11', 'Biology'],
        correctAnswer: q.correctAnswer,
        options: q.options,
        answerExplanation: q.answerExplanation,
        source: QuestionSource.MANUAL,
        isVerified: true,
        createdById: teacherUser.id,
        isActive: true,
      },
    });
    biologyCount++;
  }
  console.log(`✅ Created ${biologyCount} Biology questions\n`);

  console.log('🎉 Biology seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Biology seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
