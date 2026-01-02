import { PrismaClient, QuestionType, DifficultyLevel, QuestionSource } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Adding Chemistry questions...\n');

  // Get the school, class, subject, and teacher
  const school = await prisma.school.findUnique({ where: { code: 'WEBER001' } });
  if (!school) throw new Error('School not found. Run main seed first.');

  const chemistry = await prisma.subject.findUnique({
    where: { schoolId_code: { schoolId: school.id, code: 'CHEM' } },
  });
  if (!chemistry) throw new Error('Chemistry subject not found. Run main seed first.');

  const class11 = await prisma.class.findUnique({
    where: { schoolId_code: { schoolId: school.id, code: '11' } },
  });
  if (!class11) throw new Error('Class 11 not found. Run main seed first.');

  const teacherUser = await prisma.user.findUnique({
    where: { email: 'teacher@weberacademy.edu' },
  });
  if (!teacherUser) throw new Error('Teacher not found. Run main seed first.');

  console.log(`School: ${school.name}`);
  console.log(`Subject: ${chemistry.name}`);
  console.log(`Class: ${class11.name}`);
  console.log(`Teacher: ${teacherUser.email}\n`);

  // ============================================================
  // CHEMISTRY QUESTIONS - Class 11 JEE Level (50 Questions)
  // ============================================================

  const chemistryQuestions = [
    // UNIT: Some Basic Concepts of Chemistry (5 questions)
    {
      questionText: 'The number of moles of oxygen atoms in 18g of water is:',
      options: [
        { id: 'a', text: '0.5 mol', isCorrect: false },
        { id: 'b', text: '1 mol', isCorrect: true },
        { id: 'c', text: '2 mol', isCorrect: false },
        { id: 'd', text: '18 mol', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: '18g H₂O = 1 mole of H₂O. Each H₂O has 1 oxygen atom. So moles of O atoms = 1 mol.',
      chapter: 'Some Basic Concepts of Chemistry',
      topic: 'Mole Concept',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The mass of one molecule of water is:',
      options: [
        { id: 'a', text: '18 g', isCorrect: false },
        { id: 'b', text: '18 amu', isCorrect: true },
        { id: 'c', text: '18 kg', isCorrect: false },
        { id: 'd', text: '3 × 10⁻²³ g', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Molecular mass of H₂O = 2(1) + 16 = 18 amu. Mass of one molecule = 18 amu.',
      chapter: 'Some Basic Concepts of Chemistry',
      topic: 'Atomic and Molecular Mass',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The empirical formula of a compound with 40% carbon, 6.67% hydrogen, and 53.33% oxygen is:',
      options: [
        { id: 'a', text: 'CH₂O', isCorrect: true },
        { id: 'b', text: 'C₂H₄O₂', isCorrect: false },
        { id: 'c', text: 'CHO', isCorrect: false },
        { id: 'd', text: 'C₂H₆O', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'C:H:O = 40/12 : 6.67/1 : 53.33/16 = 3.33 : 6.67 : 3.33 = 1:2:1. Empirical formula = CH₂O.',
      chapter: 'Some Basic Concepts of Chemistry',
      topic: 'Empirical Formula',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'The number of atoms in 4.25g of NH₃ is approximately:',
      options: [
        { id: 'a', text: '6.02 × 10²³', isCorrect: false },
        { id: 'b', text: '1.5 × 10²³', isCorrect: false },
        { id: 'c', text: '6.02 × 10²²', isCorrect: false },
        { id: 'd', text: '6.02 × 10²³', isCorrect: true },
      ],
      correctAnswer: 'd',
      answerExplanation: '4.25g NH₃ = 4.25/17 = 0.25 mol. Each NH₃ has 4 atoms. Total atoms = 0.25 × 4 × 6.02 × 10²³ = 6.02 × 10²³.',
      chapter: 'Some Basic Concepts of Chemistry',
      topic: 'Mole Concept',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'In a reaction, 5.6 L of a gas at STP has a mass of 11g. The molecular mass of the gas is:',
      options: [
        { id: 'a', text: '22 g/mol', isCorrect: false },
        { id: 'b', text: '44 g/mol', isCorrect: true },
        { id: 'c', text: '28 g/mol', isCorrect: false },
        { id: 'd', text: '32 g/mol', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'At STP, 22.4 L = 1 mol. 5.6 L = 5.6/22.4 = 0.25 mol. M = 11/0.25 = 44 g/mol.',
      chapter: 'Some Basic Concepts of Chemistry',
      topic: 'Gas Laws',
      difficulty: DifficultyLevel.MEDIUM,
    },

    // UNIT: Structure of Atom (5 questions)
    {
      questionText: 'The maximum number of electrons in a shell with principal quantum number n is:',
      options: [
        { id: 'a', text: 'n', isCorrect: false },
        { id: 'b', text: '2n', isCorrect: false },
        { id: 'c', text: 'n²', isCorrect: false },
        { id: 'd', text: '2n²', isCorrect: true },
      ],
      correctAnswer: 'd',
      answerExplanation: 'Maximum electrons in a shell = 2n². For n=1: 2, n=2: 8, n=3: 18, etc.',
      chapter: 'Structure of Atom',
      topic: 'Quantum Numbers',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The shape of d-orbital is:',
      options: [
        { id: 'a', text: 'Spherical', isCorrect: false },
        { id: 'b', text: 'Dumbbell', isCorrect: false },
        { id: 'c', text: 'Double dumbbell (cloverleaf)', isCorrect: true },
        { id: 'd', text: 'Cone', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'd-orbitals have cloverleaf or double dumbbell shape (except dz² which is dumbbell with ring).',
      chapter: 'Structure of Atom',
      topic: 'Shapes of Orbitals',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The wavelength of an electron moving with velocity 2.05 × 10⁶ m/s is (mass of electron = 9.1 × 10⁻³¹ kg):',
      options: [
        { id: 'a', text: '3.55 × 10⁻¹⁰ m', isCorrect: true },
        { id: 'b', text: '3.55 × 10⁻¹² m', isCorrect: false },
        { id: 'c', text: '3.55 × 10⁻⁸ m', isCorrect: false },
        { id: 'd', text: '3.55 × 10⁻⁶ m', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'λ = h/mv = 6.626 × 10⁻³⁴/(9.1 × 10⁻³¹ × 2.05 × 10⁶) = 3.55 × 10⁻¹⁰ m.',
      chapter: 'Structure of Atom',
      topic: 'de Broglie Wavelength',
      difficulty: DifficultyLevel.HARD,
    },
    {
      questionText: 'The electronic configuration of Cu (Z=29) is:',
      options: [
        { id: 'a', text: '[Ar] 3d⁹ 4s²', isCorrect: false },
        { id: 'b', text: '[Ar] 3d¹⁰ 4s¹', isCorrect: true },
        { id: 'c', text: '[Ar] 3d¹⁰ 4s²', isCorrect: false },
        { id: 'd', text: '[Ar] 3d⁸ 4s²', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Cu has anomalous configuration [Ar] 3d¹⁰ 4s¹ due to extra stability of completely filled d-orbital.',
      chapter: 'Structure of Atom',
      topic: 'Electronic Configuration',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'According to Heisenberg uncertainty principle, the product of uncertainties in position and momentum is:',
      options: [
        { id: 'a', text: 'Zero', isCorrect: false },
        { id: 'b', text: 'Greater than or equal to h/4π', isCorrect: true },
        { id: 'c', text: 'Less than h/4π', isCorrect: false },
        { id: 'd', text: 'Equal to h', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Heisenberg principle: Δx × Δp ≥ h/4π or ℏ/2.',
      chapter: 'Structure of Atom',
      topic: 'Heisenberg Uncertainty',
      difficulty: DifficultyLevel.EASY,
    },

    // UNIT: Classification of Elements and Periodicity (5 questions)
    {
      questionText: 'The element with highest electronegativity is:',
      options: [
        { id: 'a', text: 'Oxygen', isCorrect: false },
        { id: 'b', text: 'Chlorine', isCorrect: false },
        { id: 'c', text: 'Fluorine', isCorrect: true },
        { id: 'd', text: 'Nitrogen', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Fluorine has the highest electronegativity (4.0 on Pauling scale) among all elements.',
      chapter: 'Classification of Elements',
      topic: 'Electronegativity',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Across a period, ionization energy:',
      options: [
        { id: 'a', text: 'Decreases', isCorrect: false },
        { id: 'b', text: 'Increases', isCorrect: true },
        { id: 'c', text: 'Remains constant', isCorrect: false },
        { id: 'd', text: 'First increases then decreases', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Across a period, nuclear charge increases while atomic size decreases, so ionization energy increases.',
      chapter: 'Classification of Elements',
      topic: 'Ionization Energy',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Which of the following has the largest atomic radius?',
      options: [
        { id: 'a', text: 'Na', isCorrect: false },
        { id: 'b', text: 'K', isCorrect: true },
        { id: 'c', text: 'Mg', isCorrect: false },
        { id: 'd', text: 'Al', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'K has the largest atomic radius as it has the most shells (4) among the options.',
      chapter: 'Classification of Elements',
      topic: 'Atomic Radius',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The electron affinity of noble gases is:',
      options: [
        { id: 'a', text: 'Highly positive', isCorrect: false },
        { id: 'b', text: 'Highly negative', isCorrect: false },
        { id: 'c', text: 'Zero', isCorrect: true },
        { id: 'd', text: 'Slightly positive', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Noble gases have stable, completely filled outer shells, so they don\'t accept electrons. EA = 0.',
      chapter: 'Classification of Elements',
      topic: 'Electron Affinity',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'Which of the following is an isoelectronic pair?',
      options: [
        { id: 'a', text: 'Na⁺ and K⁺', isCorrect: false },
        { id: 'b', text: 'Na⁺ and Ne', isCorrect: true },
        { id: 'c', text: 'Na and Ne', isCorrect: false },
        { id: 'd', text: 'Cl and Ar', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Na⁺ has 10 electrons (11-1), Ne also has 10 electrons. They are isoelectronic.',
      chapter: 'Classification of Elements',
      topic: 'Isoelectronic Species',
      difficulty: DifficultyLevel.MEDIUM,
    },

    // UNIT: Chemical Bonding and Molecular Structure (5 questions)
    {
      questionText: 'The hybridization of carbon in methane (CH₄) is:',
      options: [
        { id: 'a', text: 'sp', isCorrect: false },
        { id: 'b', text: 'sp²', isCorrect: false },
        { id: 'c', text: 'sp³', isCorrect: true },
        { id: 'd', text: 'sp³d', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'In CH₄, carbon forms 4 sigma bonds with 4 hydrogen atoms, requiring sp³ hybridization (tetrahedral).',
      chapter: 'Chemical Bonding',
      topic: 'Hybridization',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The bond angle in H₂O is approximately:',
      options: [
        { id: 'a', text: '180°', isCorrect: false },
        { id: 'b', text: '120°', isCorrect: false },
        { id: 'c', text: '109.5°', isCorrect: false },
        { id: 'd', text: '104.5°', isCorrect: true },
      ],
      correctAnswer: 'd',
      answerExplanation: 'H₂O has bent shape with sp³ hybridization. Due to 2 lone pairs, bond angle is reduced to 104.5°.',
      chapter: 'Chemical Bonding',
      topic: 'VSEPR Theory',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Which molecule has the highest dipole moment?',
      options: [
        { id: 'a', text: 'CO₂', isCorrect: false },
        { id: 'b', text: 'H₂O', isCorrect: true },
        { id: 'c', text: 'CCl₄', isCorrect: false },
        { id: 'd', text: 'CH₄', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'CO₂ and CCl₄ are non-polar (symmetric). H₂O is polar with bent shape, having highest dipole moment.',
      chapter: 'Chemical Bonding',
      topic: 'Dipole Moment',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'The number of sigma and pi bonds in acetylene (C₂H₂) are:',
      options: [
        { id: 'a', text: '3 sigma, 2 pi', isCorrect: true },
        { id: 'b', text: '2 sigma, 3 pi', isCorrect: false },
        { id: 'c', text: '4 sigma, 1 pi', isCorrect: false },
        { id: 'd', text: '5 sigma, 0 pi', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'C≡C has 1 sigma + 2 pi bonds. Each C-H has 1 sigma bond. Total: 3 sigma + 2 pi bonds.',
      chapter: 'Chemical Bonding',
      topic: 'Sigma and Pi Bonds',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'According to molecular orbital theory, O₂ is:',
      options: [
        { id: 'a', text: 'Diamagnetic', isCorrect: false },
        { id: 'b', text: 'Paramagnetic', isCorrect: true },
        { id: 'c', text: 'Ferromagnetic', isCorrect: false },
        { id: 'd', text: 'Antiferromagnetic', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'O₂ has 2 unpaired electrons in π*2p orbitals, making it paramagnetic.',
      chapter: 'Chemical Bonding',
      topic: 'Molecular Orbital Theory',
      difficulty: DifficultyLevel.MEDIUM,
    },

    // UNIT: States of Matter (5 questions)
    {
      questionText: 'At constant temperature, the pressure of a gas is inversely proportional to its volume. This is:',
      options: [
        { id: 'a', text: 'Charles\' law', isCorrect: false },
        { id: 'b', text: 'Boyle\'s law', isCorrect: true },
        { id: 'c', text: 'Avogadro\'s law', isCorrect: false },
        { id: 'd', text: 'Gay-Lussac\'s law', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Boyle\'s law: At constant T, PV = constant, or P ∝ 1/V.',
      chapter: 'States of Matter',
      topic: 'Gas Laws',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The value of R in J mol⁻¹ K⁻¹ is:',
      options: [
        { id: 'a', text: '0.0821', isCorrect: false },
        { id: 'b', text: '8.314', isCorrect: true },
        { id: 'c', text: '1.987', isCorrect: false },
        { id: 'd', text: '62.36', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Universal gas constant R = 8.314 J mol⁻¹ K⁻¹ = 0.0821 L atm mol⁻¹ K⁻¹.',
      chapter: 'States of Matter',
      topic: 'Ideal Gas',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The compressibility factor Z for an ideal gas is:',
      options: [
        { id: 'a', text: '0', isCorrect: false },
        { id: 'b', text: '1', isCorrect: true },
        { id: 'c', text: 'Greater than 1', isCorrect: false },
        { id: 'd', text: 'Less than 1', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Z = PV/nRT. For ideal gas, PV = nRT, so Z = 1.',
      chapter: 'States of Matter',
      topic: 'Real Gases',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'According to kinetic theory, the average kinetic energy of a gas molecule is proportional to:',
      options: [
        { id: 'a', text: 'Pressure', isCorrect: false },
        { id: 'b', text: 'Volume', isCorrect: false },
        { id: 'c', text: 'Absolute temperature', isCorrect: true },
        { id: 'd', text: 'Molecular mass', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'KE = (3/2)kT, where k is Boltzmann constant. KE is directly proportional to absolute temperature.',
      chapter: 'States of Matter',
      topic: 'Kinetic Theory',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'The root mean square velocity of a gas is:',
      options: [
        { id: 'a', text: '√(3RT/M)', isCorrect: true },
        { id: 'b', text: '√(2RT/M)', isCorrect: false },
        { id: 'c', text: '√(8RT/πM)', isCorrect: false },
        { id: 'd', text: 'RT/M', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'RMS velocity = √(3RT/M) where M is molar mass.',
      chapter: 'States of Matter',
      topic: 'Molecular Speeds',
      difficulty: DifficultyLevel.MEDIUM,
    },

    // UNIT: Thermodynamics (5 questions)
    {
      questionText: 'For an isothermal process, which quantity remains constant?',
      options: [
        { id: 'a', text: 'Pressure', isCorrect: false },
        { id: 'b', text: 'Volume', isCorrect: false },
        { id: 'c', text: 'Temperature', isCorrect: true },
        { id: 'd', text: 'Entropy', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Isothermal means constant temperature. iso = same, thermal = temperature.',
      chapter: 'Thermodynamics',
      topic: 'Thermodynamic Processes',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The enthalpy change for a reaction at constant pressure is:',
      options: [
        { id: 'a', text: 'Equal to work done', isCorrect: false },
        { id: 'b', text: 'Equal to heat absorbed', isCorrect: true },
        { id: 'c', text: 'Equal to internal energy change', isCorrect: false },
        { id: 'd', text: 'Zero', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'At constant pressure, ΔH = qp (heat absorbed at constant pressure).',
      chapter: 'Thermodynamics',
      topic: 'Enthalpy',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Hess\'s law is based on the conservation of:',
      options: [
        { id: 'a', text: 'Mass', isCorrect: false },
        { id: 'b', text: 'Energy', isCorrect: true },
        { id: 'c', text: 'Momentum', isCorrect: false },
        { id: 'd', text: 'Entropy', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Hess\'s law states enthalpy change is independent of path, based on energy conservation.',
      chapter: 'Thermodynamics',
      topic: 'Hess\'s Law',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'For a spontaneous process at constant T and P:',
      options: [
        { id: 'a', text: 'ΔG > 0', isCorrect: false },
        { id: 'b', text: 'ΔG < 0', isCorrect: true },
        { id: 'c', text: 'ΔG = 0', isCorrect: false },
        { id: 'd', text: 'ΔH < 0', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'A process is spontaneous when Gibbs free energy change ΔG < 0.',
      chapter: 'Thermodynamics',
      topic: 'Gibbs Free Energy',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'The standard enthalpy of formation of an element in its standard state is:',
      options: [
        { id: 'a', text: 'Positive', isCorrect: false },
        { id: 'b', text: 'Negative', isCorrect: false },
        { id: 'c', text: 'Zero', isCorrect: true },
        { id: 'd', text: 'Depends on the element', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Standard enthalpy of formation of elements in standard state is zero by definition.',
      chapter: 'Thermodynamics',
      topic: 'Enthalpy of Formation',
      difficulty: DifficultyLevel.EASY,
    },

    // UNIT: Equilibrium (5 questions)
    {
      questionText: 'For the reaction N₂ + 3H₂ ⇌ 2NH₃, the unit of Kp is:',
      options: [
        { id: 'a', text: 'atm²', isCorrect: false },
        { id: 'b', text: 'atm⁻²', isCorrect: true },
        { id: 'c', text: 'atm⁻¹', isCorrect: false },
        { id: 'd', text: 'No unit', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Δn = 2 - (1+3) = -2. Unit of Kp = atm^Δn = atm⁻².',
      chapter: 'Equilibrium',
      topic: 'Equilibrium Constant',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'Le Chatelier\'s principle states that when a system at equilibrium is disturbed:',
      options: [
        { id: 'a', text: 'It remains unchanged', isCorrect: false },
        { id: 'b', text: 'It shifts to counteract the change', isCorrect: true },
        { id: 'c', text: 'Equilibrium is destroyed', isCorrect: false },
        { id: 'd', text: 'Reaction stops', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Le Chatelier\'s principle: System shifts to oppose/counteract the applied change.',
      chapter: 'Equilibrium',
      topic: 'Le Chatelier\'s Principle',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The pH of 0.001 M HCl solution is:',
      options: [
        { id: 'a', text: '1', isCorrect: false },
        { id: 'b', text: '2', isCorrect: false },
        { id: 'c', text: '3', isCorrect: true },
        { id: 'd', text: '4', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'HCl is strong acid, fully dissociates. [H⁺] = 0.001 = 10⁻³ M. pH = -log(10⁻³) = 3.',
      chapter: 'Equilibrium',
      topic: 'pH Scale',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'A buffer solution can be prepared by mixing:',
      options: [
        { id: 'a', text: 'Strong acid and strong base', isCorrect: false },
        { id: 'b', text: 'Weak acid and its salt', isCorrect: true },
        { id: 'c', text: 'Two strong acids', isCorrect: false },
        { id: 'd', text: 'Two strong bases', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Buffer = weak acid + salt of weak acid (conjugate base) OR weak base + salt of weak base.',
      chapter: 'Equilibrium',
      topic: 'Buffer Solutions',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The solubility product of AgCl is 1.8 × 10⁻¹⁰. The solubility in mol/L is:',
      options: [
        { id: 'a', text: '1.34 × 10⁻⁵', isCorrect: true },
        { id: 'b', text: '1.8 × 10⁻¹⁰', isCorrect: false },
        { id: 'c', text: '1.8 × 10⁻⁵', isCorrect: false },
        { id: 'd', text: '3.6 × 10⁻⁵', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'Ksp = s² for AgCl. s = √(1.8 × 10⁻¹⁰) = 1.34 × 10⁻⁵ mol/L.',
      chapter: 'Equilibrium',
      topic: 'Solubility Product',
      difficulty: DifficultyLevel.MEDIUM,
    },

    // UNIT: Redox Reactions (5 questions)
    {
      questionText: 'In the reaction Zn + CuSO₄ → ZnSO₄ + Cu, zinc is:',
      options: [
        { id: 'a', text: 'Oxidized', isCorrect: true },
        { id: 'b', text: 'Reduced', isCorrect: false },
        { id: 'c', text: 'Neither oxidized nor reduced', isCorrect: false },
        { id: 'd', text: 'Both oxidized and reduced', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'Zn goes from 0 to +2 oxidation state, losing electrons. It is oxidized.',
      chapter: 'Redox Reactions',
      topic: 'Oxidation and Reduction',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The oxidation number of Mn in KMnO₄ is:',
      options: [
        { id: 'a', text: '+4', isCorrect: false },
        { id: 'b', text: '+5', isCorrect: false },
        { id: 'c', text: '+6', isCorrect: false },
        { id: 'd', text: '+7', isCorrect: true },
      ],
      correctAnswer: 'd',
      answerExplanation: 'K = +1, O = -2. So +1 + x + 4(-2) = 0. x = +7.',
      chapter: 'Redox Reactions',
      topic: 'Oxidation Number',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'A substance that can act as both oxidizing and reducing agent is called:',
      options: [
        { id: 'a', text: 'Catalyst', isCorrect: false },
        { id: 'b', text: 'Amphoteric', isCorrect: false },
        { id: 'c', text: 'Amphiprotic', isCorrect: false },
        { id: 'd', text: 'Both b and c', isCorrect: true },
      ],
      correctAnswer: 'd',
      answerExplanation: 'Such substances are called amphoteric (can donate/accept electrons) or amphiprotic (donate/accept protons).',
      chapter: 'Redox Reactions',
      topic: 'Redox Agents',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'In a galvanic cell, oxidation occurs at:',
      options: [
        { id: 'a', text: 'Cathode', isCorrect: false },
        { id: 'b', text: 'Anode', isCorrect: true },
        { id: 'c', text: 'Both electrodes', isCorrect: false },
        { id: 'd', text: 'Salt bridge', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'In a galvanic cell, oxidation occurs at anode (negative electrode), reduction at cathode.',
      chapter: 'Redox Reactions',
      topic: 'Electrochemical Cells',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The standard electrode potential of hydrogen electrode is:',
      options: [
        { id: 'a', text: '+1 V', isCorrect: false },
        { id: 'b', text: '-1 V', isCorrect: false },
        { id: 'c', text: '0 V', isCorrect: true },
        { id: 'd', text: '0.5 V', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Standard Hydrogen Electrode (SHE) is assigned 0 V as reference for all electrode potentials.',
      chapter: 'Redox Reactions',
      topic: 'Electrode Potential',
      difficulty: DifficultyLevel.EASY,
    },

    // UNIT: Organic Chemistry - Basic Principles (5 questions)
    {
      questionText: 'The IUPAC name of CH₃-CH(CH₃)-CH₂-CH₃ is:',
      options: [
        { id: 'a', text: 'Isobutane', isCorrect: false },
        { id: 'b', text: '2-methylbutane', isCorrect: true },
        { id: 'c', text: 'Isopentane', isCorrect: false },
        { id: 'd', text: 'Neopentane', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Longest chain has 4 carbons (butane), methyl group at position 2. IUPAC name: 2-methylbutane.',
      chapter: 'Organic Chemistry',
      topic: 'IUPAC Nomenclature',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The +I effect is shown by:',
      options: [
        { id: 'a', text: 'Alkyl groups', isCorrect: true },
        { id: 'b', text: 'Halogens', isCorrect: false },
        { id: 'c', text: '-NO₂ group', isCorrect: false },
        { id: 'd', text: '-COOH group', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'Alkyl groups are electron-donating and show positive inductive (+I) effect.',
      chapter: 'Organic Chemistry',
      topic: 'Inductive Effect',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Which carbocation is most stable?',
      options: [
        { id: 'a', text: 'CH₃⁺', isCorrect: false },
        { id: 'b', text: 'C₂H₅⁺', isCorrect: false },
        { id: 'c', text: '(CH₃)₂CH⁺', isCorrect: false },
        { id: 'd', text: '(CH₃)₃C⁺', isCorrect: true },
      ],
      correctAnswer: 'd',
      answerExplanation: 'Stability: 3° > 2° > 1° > CH₃⁺. (CH₃)₃C⁺ is tertiary, most stable due to hyperconjugation.',
      chapter: 'Organic Chemistry',
      topic: 'Carbocation Stability',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'Resonance involves:',
      options: [
        { id: 'a', text: 'Movement of sigma electrons', isCorrect: false },
        { id: 'b', text: 'Movement of pi electrons', isCorrect: true },
        { id: 'c', text: 'Movement of protons', isCorrect: false },
        { id: 'd', text: 'Movement of atoms', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Resonance involves delocalization of pi electrons (and lone pairs), not sigma electrons.',
      chapter: 'Organic Chemistry',
      topic: 'Resonance',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The number of isomers of C₄H₁₀ is:',
      options: [
        { id: 'a', text: '1', isCorrect: false },
        { id: 'b', text: '2', isCorrect: true },
        { id: 'c', text: '3', isCorrect: false },
        { id: 'd', text: '4', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'C₄H₁₀ has 2 structural isomers: n-butane and isobutane (2-methylpropane).',
      chapter: 'Organic Chemistry',
      topic: 'Isomerism',
      difficulty: DifficultyLevel.EASY,
    },

    // UNIT: Hydrocarbons (5 questions)
    {
      questionText: 'The general formula of alkenes is:',
      options: [
        { id: 'a', text: 'CₙH₂ₙ₊₂', isCorrect: false },
        { id: 'b', text: 'CₙH₂ₙ', isCorrect: true },
        { id: 'c', text: 'CₙH₂ₙ₋₂', isCorrect: false },
        { id: 'd', text: 'CₙHₙ', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Alkenes have one C=C double bond. General formula: CₙH₂ₙ.',
      chapter: 'Hydrocarbons',
      topic: 'Alkenes',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Markovnikov\'s rule applies to:',
      options: [
        { id: 'a', text: 'Addition of HBr to propene', isCorrect: true },
        { id: 'b', text: 'Addition of Br₂ to ethene', isCorrect: false },
        { id: 'c', text: 'Substitution in alkanes', isCorrect: false },
        { id: 'd', text: 'Elimination reactions', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'Markovnikov\'s rule: In addition of HX to unsymmetric alkene, H adds to C with more H atoms.',
      chapter: 'Hydrocarbons',
      topic: 'Markovnikov\'s Rule',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'Benzene undergoes:',
      options: [
        { id: 'a', text: 'Addition reactions readily', isCorrect: false },
        { id: 'b', text: 'Substitution reactions readily', isCorrect: true },
        { id: 'c', text: 'Elimination reactions', isCorrect: false },
        { id: 'd', text: 'No reactions', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Benzene undergoes electrophilic substitution to preserve its aromatic stability.',
      chapter: 'Hydrocarbons',
      topic: 'Aromatic Compounds',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The product of reaction between propene and HBr in presence of peroxide is:',
      options: [
        { id: 'a', text: '1-bromopropane', isCorrect: true },
        { id: 'b', text: '2-bromopropane', isCorrect: false },
        { id: 'c', text: 'Propane', isCorrect: false },
        { id: 'd', text: '1,2-dibromopropane', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'Peroxide causes anti-Markovnikov addition (Kharasch effect). Br adds to C with more H atoms.',
      chapter: 'Hydrocarbons',
      topic: 'Anti-Markovnikov Addition',
      difficulty: DifficultyLevel.HARD,
    },
    {
      questionText: 'Ozonolysis of ethene gives:',
      options: [
        { id: 'a', text: 'Methanol', isCorrect: false },
        { id: 'b', text: 'Formaldehyde', isCorrect: true },
        { id: 'c', text: 'Acetaldehyde', isCorrect: false },
        { id: 'd', text: 'Formic acid', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'CH₂=CH₂ on ozonolysis gives 2 molecules of HCHO (formaldehyde).',
      chapter: 'Hydrocarbons',
      topic: 'Ozonolysis',
      difficulty: DifficultyLevel.MEDIUM,
    },

    // UNIT: Environmental Chemistry (5 questions)
    {
      questionText: 'The major cause of ozone layer depletion is:',
      options: [
        { id: 'a', text: 'Carbon dioxide', isCorrect: false },
        { id: 'b', text: 'Chlorofluorocarbons (CFCs)', isCorrect: true },
        { id: 'c', text: 'Nitrogen oxides', isCorrect: false },
        { id: 'd', text: 'Sulfur dioxide', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'CFCs release Cl radicals which catalytically destroy ozone molecules.',
      chapter: 'Environmental Chemistry',
      topic: 'Ozone Depletion',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Acid rain is caused by:',
      options: [
        { id: 'a', text: 'CO₂ and CO', isCorrect: false },
        { id: 'b', text: 'SO₂ and NO₂', isCorrect: true },
        { id: 'c', text: 'CH₄ and H₂S', isCorrect: false },
        { id: 'd', text: 'O₃ and N₂', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'SO₂ and NO₂ form H₂SO₄ and HNO₃ in atmosphere, causing acid rain.',
      chapter: 'Environmental Chemistry',
      topic: 'Acid Rain',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The pH of normal rainwater is approximately:',
      options: [
        { id: 'a', text: '7.0', isCorrect: false },
        { id: 'b', text: '5.6', isCorrect: true },
        { id: 'c', text: '8.5', isCorrect: false },
        { id: 'd', text: '4.0', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Normal rainwater has pH ~5.6 due to dissolved CO₂ forming weak carbonic acid.',
      chapter: 'Environmental Chemistry',
      topic: 'Rainwater Chemistry',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'Greenhouse effect is caused mainly by:',
      options: [
        { id: 'a', text: 'Ozone', isCorrect: false },
        { id: 'b', text: 'Oxygen', isCorrect: false },
        { id: 'c', text: 'Carbon dioxide', isCorrect: true },
        { id: 'd', text: 'Nitrogen', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'CO₂ is the major greenhouse gas. It traps infrared radiation, causing global warming.',
      chapter: 'Environmental Chemistry',
      topic: 'Greenhouse Effect',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'BOD stands for:',
      options: [
        { id: 'a', text: 'Biological Oxygen Demand', isCorrect: true },
        { id: 'b', text: 'Biochemical Oxidation Degree', isCorrect: false },
        { id: 'c', text: 'Basic Oxygen Demand', isCorrect: false },
        { id: 'd', text: 'Biotic Oxygen Deficit', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'BOD = Biological Oxygen Demand, measures oxygen needed by microorganisms to decompose organic matter.',
      chapter: 'Environmental Chemistry',
      topic: 'Water Pollution',
      difficulty: DifficultyLevel.EASY,
    },
  ];

  // Insert Chemistry questions
  let chemistryCount = 0;
  for (const q of chemistryQuestions) {
    await prisma.question.create({
      data: {
        questionText: q.questionText,
        questionType: QuestionType.MCQ,
        difficulty: q.difficulty,
        marks: 4,
        negativeMarks: 1,
        estimatedTime: 120,
        subjectId: chemistry.id,
        classId: class11.id,
        chapter: q.chapter,
        topic: q.topic,
        tags: ['JEE', 'Class 11', 'Chemistry'],
        correctAnswer: q.correctAnswer,
        options: q.options,
        answerExplanation: q.answerExplanation,
        source: QuestionSource.MANUAL,
        isVerified: true,
        createdById: teacherUser.id,
        isActive: true,
      },
    });
    chemistryCount++;
  }
  console.log(`✅ Created ${chemistryCount} Chemistry questions\n`);

  console.log('🎉 Chemistry seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Chemistry seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
