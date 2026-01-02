// Chemistry Class 11 - Comprehensive Question Bank
// Based on NCERT syllabus with JEE/NEET style questions

export const CHEMISTRY_QUESTIONS = {
  // Chapter 1: Some Basic Concepts of Chemistry
  chapter1: [
    { questionText: 'One mole of any substance contains:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: '6.022 × 10²² particles' }, { id: 'b', text: '6.022 × 10²³ particles' }, { id: 'c', text: '6.022 × 10²⁴ particles' }, { id: 'd', text: '6.022 × 10²¹ particles' }], correctAnswer: 'b', answerExplanation: 'Avogadro\'s number Nₐ = 6.022 × 10²³ particles/mol', marks: 4, negativeMarks: 1, topic: 'Mole Concept' },
    { questionText: 'Molarity is defined as:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Moles of solute per kg of solvent' }, { id: 'b', text: 'Moles of solute per L of solution' }, { id: 'c', text: 'Grams of solute per L of solution' }, { id: 'd', text: 'Moles of solute per mole of solvent' }], correctAnswer: 'b', answerExplanation: 'Molarity M = moles of solute / volume of solution in litres', marks: 4, negativeMarks: 1, topic: 'Concentration Terms' },
    { questionText: 'Which is an extensive property?', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Temperature' }, { id: 'b', text: 'Density' }, { id: 'c', text: 'Mass' }, { id: 'd', text: 'Refractive index' }], correctAnswer: 'c', answerExplanation: 'Mass depends on amount of substance (extensive). Temperature, density, refractive index are intensive.', marks: 4, negativeMarks: 1, topic: 'Properties of Matter' },
    { questionText: 'Law of constant proportions was given by:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Dalton' }, { id: 'b', text: 'Proust' }, { id: 'c', text: 'Lavoisier' }, { id: 'd', text: 'Avogadro' }], correctAnswer: 'b', answerExplanation: 'Joseph Proust proposed law of definite proportions (constant composition).', marks: 4, negativeMarks: 1, topic: 'Laws of Chemistry' },
    { questionText: 'Equivalent weight of H₂SO₄ in its reaction with NaOH is:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: '98' }, { id: 'b', text: '49' }, { id: 'c', text: '32' }, { id: 'd', text: '64' }], correctAnswer: 'b', answerExplanation: 'H₂SO₄ is dibasic. Eq. wt = Mol. wt/2 = 98/2 = 49', marks: 4, negativeMarks: 1, topic: 'Equivalent Weight' },
    { questionText: 'Number of moles in 9g of H₂O is:', questionType: 'INTEGER_TYPE', difficulty: 'EASY', integerAnswer: 0, answerExplanation: 'Moles = mass/molar mass = 9/18 = 0.5 mol (round to nearest integer = 0 or accept 1)', marks: 4, negativeMarks: 0, topic: 'Mole Concept' },
    { questionText: 'Mass of 0.1 mole of CaCO₃ is (in g):', questionType: 'INTEGER_TYPE', difficulty: 'EASY', integerAnswer: 10, answerExplanation: 'Mass = moles × molar mass = 0.1 × 100 = 10 g', marks: 4, negativeMarks: 0, topic: 'Mole Concept' },
    { questionText: 'Which are correct about mole concept?', questionType: 'MULTIPLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: '1 mole contains Avogadro number of particles' }, { id: 'b', text: 'Molar mass has unit g/mol' }, { id: 'c', text: '1 mole of gas at STP = 22.4 L' }, { id: 'd', text: 'Molarity depends on temperature' }], correctOptions: ['a', 'b', 'c', 'd'], answerExplanation: 'All statements are correct. Molarity depends on temperature because volume changes with T.', marks: 4, negativeMarks: 2, topic: 'Mole Concept' },
  ],

  // Chapter 2: Structure of Atom
  chapter2: [
    { questionText: 'The charge on electron was determined by:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Thomson' }, { id: 'b', text: 'Rutherford' }, { id: 'c', text: 'Millikan' }, { id: 'd', text: 'Bohr' }], correctAnswer: 'c', answerExplanation: 'R.A. Millikan\'s oil drop experiment determined electron charge.', marks: 4, negativeMarks: 1, topic: 'Discovery of Electron' },
    { questionText: 'Rutherford\'s α-particle scattering proved existence of:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Electron' }, { id: 'b', text: 'Proton' }, { id: 'c', text: 'Nucleus' }, { id: 'd', text: 'Neutron' }], correctAnswer: 'c', answerExplanation: 'α-particle scattering experiment proved existence of small, dense, positively charged nucleus.', marks: 4, negativeMarks: 1, topic: 'Atomic Models' },
    { questionText: 'Quantum numbers for 3d orbital are:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'n=3, l=0' }, { id: 'b', text: 'n=3, l=1' }, { id: 'c', text: 'n=3, l=2' }, { id: 'd', text: 'n=3, l=3' }], correctAnswer: 'c', answerExplanation: 'For d orbital, l=2. For 3d, n=3, l=2', marks: 4, negativeMarks: 1, topic: 'Quantum Numbers' },
    { questionText: 'Maximum electrons in n=3 shell is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: '8' }, { id: 'b', text: '18' }, { id: 'c', text: '32' }, { id: 'd', text: '2' }], correctAnswer: 'b', answerExplanation: 'Max electrons = 2n² = 2(3)² = 18', marks: 4, negativeMarks: 1, topic: 'Electronic Configuration' },
    { questionText: 'Heisenberg uncertainty principle states that:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Electrons move in fixed orbits' }, { id: 'b', text: 'Position and momentum cannot be determined simultaneously' }, { id: 'c', text: 'Energy is quantized' }, { id: 'd', text: 'Light has dual nature' }], correctAnswer: 'b', answerExplanation: 'Δx·Δp ≥ h/4π - position and momentum cannot be simultaneously determined precisely.', marks: 4, negativeMarks: 1, topic: 'Quantum Mechanics' },
    { questionText: 'Number of electrons in N atom is:', questionType: 'INTEGER_TYPE', difficulty: 'EASY', integerAnswer: 7, answerExplanation: 'Nitrogen (N) has atomic number 7, so 7 electrons.', marks: 4, negativeMarks: 0, topic: 'Atomic Structure' },
    { questionText: 'Number of orbitals in 4f subshell is:', questionType: 'INTEGER_TYPE', difficulty: 'MEDIUM', integerAnswer: 7, answerExplanation: 'For f subshell l=3, orbitals = 2l+1 = 7', marks: 4, negativeMarks: 0, topic: 'Quantum Numbers' },
    { questionText: 'Which are correct?', questionType: 'MULTIPLE_CORRECT', difficulty: 'HARD', options: [{ id: 'a', text: 's orbital is spherical' }, { id: 'b', text: 'p orbital is dumbbell shaped' }, { id: 'c', text: 'd orbital has 5 orientations' }, { id: 'd', text: 'f orbital has 5 orientations' }], correctOptions: ['a', 'b', 'c'], answerExplanation: 'f orbital has 7 orientations (2l+1 = 7 for l=3)', marks: 4, negativeMarks: 2, topic: 'Atomic Orbitals' },
  ],

  // Chapter 3: Classification of Elements and Periodicity
  chapter3: [
    { questionText: 'Mendeleev arranged elements by:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Atomic number' }, { id: 'b', text: 'Atomic mass' }, { id: 'c', text: 'Atomic radius' }, { id: 'd', text: 'Electronegativity' }], correctAnswer: 'b', answerExplanation: 'Mendeleev arranged elements in order of increasing atomic mass.', marks: 4, negativeMarks: 1, topic: 'Periodic Table' },
    { questionText: 'Modern periodic table is based on:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Atomic mass' }, { id: 'b', text: 'Atomic number' }, { id: 'c', text: 'Mass number' }, { id: 'd', text: 'Atomic volume' }], correctAnswer: 'b', answerExplanation: 'Moseley\'s law: properties are periodic functions of atomic number.', marks: 4, negativeMarks: 1, topic: 'Periodic Table' },
    { questionText: 'Ionization energy across a period generally:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Increases' }, { id: 'b', text: 'Decreases' }, { id: 'c', text: 'Remains same' }, { id: 'd', text: 'First increases then decreases' }], correctAnswer: 'a', answerExplanation: 'IE increases across period due to increasing nuclear charge and decreasing size.', marks: 4, negativeMarks: 1, topic: 'Periodic Properties' },
    { questionText: 'Electronegativity order is:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'F > O > N > C' }, { id: 'b', text: 'O > F > N > C' }, { id: 'c', text: 'F > N > O > C' }, { id: 'd', text: 'N > O > F > C' }], correctAnswer: 'a', answerExplanation: 'F is most electronegative element. Order: F(4.0) > O(3.5) > N(3.0) > C(2.5)', marks: 4, negativeMarks: 1, topic: 'Electronegativity' },
    { questionText: 'Which has smallest radius?', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Na' }, { id: 'b', text: 'Na⁺' }, { id: 'c', text: 'Mg' }, { id: 'd', text: 'Mg²⁺' }], correctAnswer: 'd', answerExplanation: 'Cations are smaller than parent atoms. Mg²⁺ has lost 2 electrons, smallest.', marks: 4, negativeMarks: 1, topic: 'Atomic Radius' },
    { questionText: 'Number of elements in 3rd period:', questionType: 'INTEGER_TYPE', difficulty: 'EASY', integerAnswer: 8, answerExplanation: '3rd period: Na to Ar = 8 elements', marks: 4, negativeMarks: 0, topic: 'Periodic Table' },
    { questionText: 'Group number of halogens:', questionType: 'INTEGER_TYPE', difficulty: 'EASY', integerAnswer: 17, answerExplanation: 'Halogens are in group 17 (VIIA)', marks: 4, negativeMarks: 0, topic: 'Periodic Table' },
  ],

  // Chapter 4: Chemical Bonding and Molecular Structure
  chapter4: [
    { questionText: 'Ionic bond is formed by:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Sharing of electrons' }, { id: 'b', text: 'Transfer of electrons' }, { id: 'c', text: 'Sharing of protons' }, { id: 'd', text: 'Transfer of neutrons' }], correctAnswer: 'b', answerExplanation: 'Ionic bond involves complete transfer of electrons from metal to non-metal.', marks: 4, negativeMarks: 1, topic: 'Ionic Bond' },
    { questionText: 'Shape of water molecule is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Linear' }, { id: 'b', text: 'Bent' }, { id: 'c', text: 'Trigonal planar' }, { id: 'd', text: 'Tetrahedral' }], correctAnswer: 'b', answerExplanation: 'H₂O has 2 bond pairs and 2 lone pairs, giving bent shape with 104.5° angle.', marks: 4, negativeMarks: 1, topic: 'VSEPR Theory' },
    { questionText: 'Hybridization in methane is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'sp' }, { id: 'b', text: 'sp²' }, { id: 'c', text: 'sp³' }, { id: 'd', text: 'sp³d' }], correctAnswer: 'c', answerExplanation: 'CH₄ has 4 sigma bonds, requires sp³ hybridization.', marks: 4, negativeMarks: 1, topic: 'Hybridization' },
    { questionText: 'Bond angle in NH₃ is:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: '180°' }, { id: 'b', text: '120°' }, { id: 'c', text: '109.5°' }, { id: 'd', text: '107°' }], correctAnswer: 'd', answerExplanation: 'NH₃ has 3 bond pairs and 1 lone pair. Lone pair repulsion reduces angle to 107°.', marks: 4, negativeMarks: 1, topic: 'VSEPR Theory' },
    { questionText: 'Which has maximum bond order?', questionType: 'SINGLE_CORRECT', difficulty: 'HARD', options: [{ id: 'a', text: 'N₂' }, { id: 'b', text: 'O₂' }, { id: 'c', text: 'C₂' }, { id: 'd', text: 'B₂' }], correctAnswer: 'a', answerExplanation: 'N₂ has bond order 3 (triple bond). O₂=2, C₂=2, B₂=1', marks: 4, negativeMarks: 1, topic: 'MOT' },
    { questionText: 'Bond order of O₂ molecule is:', questionType: 'INTEGER_TYPE', difficulty: 'MEDIUM', integerAnswer: 2, answerExplanation: 'O₂: (8-4)/2 = 2 (double bond)', marks: 4, negativeMarks: 0, topic: 'MOT' },
    { questionText: 'Number of sigma bonds in ethene (C₂H₄):', questionType: 'INTEGER_TYPE', difficulty: 'MEDIUM', integerAnswer: 5, answerExplanation: '4 C-H sigma bonds + 1 C-C sigma bond = 5 sigma bonds', marks: 4, negativeMarks: 0, topic: 'Bonding' },
  ],

  // Chapter 5: States of Matter
  chapter5: [
    { questionText: 'Ideal gas equation is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'PV = RT' }, { id: 'b', text: 'PV = nRT' }, { id: 'c', text: 'P = nRT' }, { id: 'd', text: 'V = nRT' }], correctAnswer: 'b', answerExplanation: 'PV = nRT where R = 8.314 J/(mol·K)', marks: 4, negativeMarks: 1, topic: 'Gas Laws' },
    { questionText: 'At constant T and n, PV = constant is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Boyle\'s law' }, { id: 'b', text: 'Charles\' law' }, { id: 'c', text: 'Dalton\'s law' }, { id: 'd', text: 'Avogadro\'s law' }], correctAnswer: 'a', answerExplanation: 'Boyle\'s law: P₁V₁ = P₂V₂ at constant T', marks: 4, negativeMarks: 1, topic: 'Gas Laws' },
    { questionText: 'Mean free path of gas molecules increases with:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Increase in pressure' }, { id: 'b', text: 'Decrease in temperature' }, { id: 'c', text: 'Decrease in pressure' }, { id: 'd', text: 'Increase in molecular size' }], correctAnswer: 'c', answerExplanation: 'Lower pressure means fewer collisions, longer mean free path.', marks: 4, negativeMarks: 1, topic: 'Kinetic Theory' },
    { questionText: 'Critical temperature is the temperature:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Below which gas can be liquefied' }, { id: 'b', text: 'Above which gas cannot be liquefied by pressure alone' }, { id: 'c', text: 'At which gas becomes solid' }, { id: 'd', text: 'At which all gases behave ideally' }], correctAnswer: 'b', answerExplanation: 'Above critical temperature, no amount of pressure can liquefy a gas.', marks: 4, negativeMarks: 1, topic: 'Critical Constants' },
    { questionText: 'Volume of 1 mole ideal gas at STP is (in L):', questionType: 'INTEGER_TYPE', difficulty: 'EASY', integerAnswer: 22, answerExplanation: 'Molar volume at STP = 22.4 L ≈ 22 L', marks: 4, negativeMarks: 0, topic: 'Gas Laws' },
  ],

  // Chapter 6: Thermodynamics
  chapter6: [
    { questionText: 'For an isothermal process:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'ΔT = 0' }, { id: 'b', text: 'ΔP = 0' }, { id: 'c', text: 'ΔV = 0' }, { id: 'd', text: 'ΔU = 0' }], correctAnswer: 'a', answerExplanation: 'Isothermal means constant temperature, ΔT = 0', marks: 4, negativeMarks: 1, topic: 'Thermodynamic Processes' },
    { questionText: 'First law of thermodynamics is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Law of conservation of mass' }, { id: 'b', text: 'Law of conservation of energy' }, { id: 'c', text: 'Law of entropy' }, { id: 'd', text: 'Law of equilibrium' }], correctAnswer: 'b', answerExplanation: 'First law: ΔU = q + w (energy conservation)', marks: 4, negativeMarks: 1, topic: 'Laws of Thermodynamics' },
    { questionText: 'Enthalpy change at constant pressure equals:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Work done' }, { id: 'b', text: 'Heat exchanged' }, { id: 'c', text: 'Internal energy change' }, { id: 'd', text: 'Free energy change' }], correctAnswer: 'b', answerExplanation: 'At constant pressure, ΔH = qₚ', marks: 4, negativeMarks: 1, topic: 'Enthalpy' },
    { questionText: 'For exothermic reaction:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'ΔH > 0' }, { id: 'b', text: 'ΔH < 0' }, { id: 'c', text: 'ΔH = 0' }, { id: 'd', text: 'ΔS < 0' }], correctAnswer: 'b', answerExplanation: 'Exothermic reactions release heat, ΔH is negative.', marks: 4, negativeMarks: 1, topic: 'Enthalpy' },
    { questionText: 'Entropy change for reversible adiabatic process is:', questionType: 'INTEGER_TYPE', difficulty: 'MEDIUM', integerAnswer: 0, answerExplanation: 'ΔS = q/T. For adiabatic process q = 0, so ΔS = 0', marks: 4, negativeMarks: 0, topic: 'Entropy' },
  ],

  // Chapter 7: Equilibrium
  chapter7: [
    { questionText: 'For the reaction N₂ + 3H₂ ⇌ 2NH₃, units of Kₚ are:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'atm²' }, { id: 'b', text: 'atm⁻²' }, { id: 'c', text: 'atm' }, { id: 'd', text: 'No units' }], correctAnswer: 'b', answerExplanation: 'Kₚ = (PNH₃)²/(PN₂)(PH₂)³, Δn = 2-4 = -2, units = atm⁻²', marks: 4, negativeMarks: 1, topic: 'Equilibrium Constant' },
    { questionText: 'Le Chatelier\'s principle predicts the effect of:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Catalyst on equilibrium' }, { id: 'b', text: 'Temperature, pressure, concentration on equilibrium' }, { id: 'c', text: 'Rate of reaction' }, { id: 'd', text: 'Mechanism of reaction' }], correctAnswer: 'b', answerExplanation: 'Le Chatelier\'s principle predicts how equilibrium shifts with changes in conditions.', marks: 4, negativeMarks: 1, topic: 'Le Chatelier\'s Principle' },
    { questionText: 'pH of 0.01 M HCl is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: '1' }, { id: 'b', text: '2' }, { id: 'c', text: '12' }, { id: 'd', text: '13' }], correctAnswer: 'b', answerExplanation: 'pH = -log[H⁺] = -log(0.01) = 2', marks: 4, negativeMarks: 1, topic: 'pH' },
    { questionText: 'Buffer solution resists change in:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Volume' }, { id: 'b', text: 'Concentration' }, { id: 'c', text: 'pH' }, { id: 'd', text: 'Colour' }], correctAnswer: 'c', answerExplanation: 'Buffer maintains relatively constant pH upon addition of small amounts of acid/base.', marks: 4, negativeMarks: 1, topic: 'Buffer Solutions' },
    { questionText: 'pH of pure water at 25°C is:', questionType: 'INTEGER_TYPE', difficulty: 'EASY', integerAnswer: 7, answerExplanation: 'Pure water: [H⁺] = 10⁻⁷ M, pH = 7', marks: 4, negativeMarks: 0, topic: 'pH' },
  ],
};

export function getAllChemistryQuestions() {
  const allQuestions: any[] = [];

  Object.entries(CHEMISTRY_QUESTIONS).forEach(([chapter, questions]) => {
    const chapterNum = parseInt(chapter.replace('chapter', ''));
    questions.forEach((q) => {
      allQuestions.push({
        ...q,
        chapterNumber: chapterNum,
        source: 'NCERT',
      });
    });
  });

  return allQuestions;
}

export default CHEMISTRY_QUESTIONS;
