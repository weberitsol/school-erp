// Mathematics Class 11 - Comprehensive Question Bank
// Based on NCERT syllabus with JEE style questions

export const MATHEMATICS_QUESTIONS = {
  // Chapter 1: Sets
  chapter1: [
    { questionText: 'If A = {1, 2, 3} and B = {2, 3, 4}, then A ∪ B is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: '{1, 2, 3, 4}' }, { id: 'b', text: '{2, 3}' }, { id: 'c', text: '{1, 4}' }, { id: 'd', text: '{1, 2, 3}' }], correctAnswer: 'a', answerExplanation: 'Union contains all elements from both sets: {1, 2, 3, 4}', marks: 4, negativeMarks: 1, topic: 'Set Operations' },
    { questionText: 'If A = {1, 2, 3} and B = {2, 3, 4}, then A ∩ B is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: '{1, 2, 3, 4}' }, { id: 'b', text: '{2, 3}' }, { id: 'c', text: '{1, 4}' }, { id: 'd', text: '{1}' }], correctAnswer: 'b', answerExplanation: 'Intersection contains common elements: {2, 3}', marks: 4, negativeMarks: 1, topic: 'Set Operations' },
    { questionText: 'Power set of {1, 2} has how many elements?', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: '2' }, { id: 'b', text: '3' }, { id: 'c', text: '4' }, { id: 'd', text: '6' }], correctAnswer: 'c', answerExplanation: 'Power set has 2ⁿ elements. For n=2, P(A) has 4 elements.', marks: 4, negativeMarks: 1, topic: 'Power Set' },
    { questionText: 'If n(A) = 5, n(B) = 7, n(A ∩ B) = 3, then n(A ∪ B) is:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: '12' }, { id: 'b', text: '9' }, { id: 'c', text: '15' }, { id: 'd', text: '8' }], correctAnswer: 'b', answerExplanation: 'n(A ∪ B) = n(A) + n(B) - n(A ∩ B) = 5 + 7 - 3 = 9', marks: 4, negativeMarks: 1, topic: 'Set Operations' },
    { questionText: 'Empty set is subset of:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Only empty set' }, { id: 'b', text: 'Every set' }, { id: 'c', text: 'No set' }, { id: 'd', text: 'Only finite sets' }], correctAnswer: 'b', answerExplanation: 'Empty set φ is subset of every set (vacuously true).', marks: 4, negativeMarks: 1, topic: 'Subsets' },
    { questionText: 'If A has 3 elements, number of subsets is:', questionType: 'INTEGER_TYPE', difficulty: 'EASY', integerAnswer: 8, answerExplanation: 'Number of subsets = 2ⁿ = 2³ = 8', marks: 4, negativeMarks: 0, topic: 'Subsets' },
    { questionText: 'If A ∪ B = A ∩ B, then:', questionType: 'SINGLE_CORRECT', difficulty: 'HARD', options: [{ id: 'a', text: 'A ⊂ B' }, { id: 'b', text: 'B ⊂ A' }, { id: 'c', text: 'A = B' }, { id: 'd', text: 'A and B are disjoint' }], correctAnswer: 'c', answerExplanation: 'If union equals intersection, then A = B.', marks: 4, negativeMarks: 1, topic: 'Set Operations' },
  ],

  // Chapter 2: Relations and Functions
  chapter2: [
    { questionText: 'If A = {1, 2} and B = {a, b}, then A × B has:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: '2 elements' }, { id: 'b', text: '4 elements' }, { id: 'c', text: '6 elements' }, { id: 'd', text: '8 elements' }], correctAnswer: 'b', answerExplanation: 'n(A × B) = n(A) × n(B) = 2 × 2 = 4', marks: 4, negativeMarks: 1, topic: 'Cartesian Product' },
    { questionText: 'A function f: A → B is one-one if:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Every element of A has image in B' }, { id: 'b', text: 'Different elements of A have different images' }, { id: 'c', text: 'Every element of B is image of some element' }, { id: 'd', text: 'Range equals codomain' }], correctAnswer: 'b', answerExplanation: 'One-one (injective): f(x₁) = f(x₂) ⟹ x₁ = x₂', marks: 4, negativeMarks: 1, topic: 'Functions' },
    { questionText: 'Domain of f(x) = √(x-1) is:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'x ≥ 0' }, { id: 'b', text: 'x ≥ 1' }, { id: 'c', text: 'x > 1' }, { id: 'd', text: 'All real numbers' }], correctAnswer: 'b', answerExplanation: 'For √(x-1), we need x-1 ≥ 0, so x ≥ 1', marks: 4, negativeMarks: 1, topic: 'Domain and Range' },
    { questionText: 'If f(x) = x² and g(x) = x+1, then (fog)(x) is:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'x² + 1' }, { id: 'b', text: '(x+1)²' }, { id: 'c', text: 'x² + 2x + 1' }, { id: 'd', text: 'Both b and c' }], correctAnswer: 'd', answerExplanation: '(fog)(x) = f(g(x)) = f(x+1) = (x+1)² = x² + 2x + 1', marks: 4, negativeMarks: 1, topic: 'Composition' },
    { questionText: 'Number of functions from A to B where |A|=2, |B|=3:', questionType: 'INTEGER_TYPE', difficulty: 'MEDIUM', integerAnswer: 9, answerExplanation: 'Number of functions = |B|^|A| = 3² = 9', marks: 4, negativeMarks: 0, topic: 'Functions' },
  ],

  // Chapter 3: Trigonometric Functions
  chapter3: [
    { questionText: 'Value of sin 30° is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: '1/2' }, { id: 'b', text: '√3/2' }, { id: 'c', text: '1' }, { id: 'd', text: '1/√2' }], correctAnswer: 'a', answerExplanation: 'sin 30° = 1/2 (standard value)', marks: 4, negativeMarks: 1, topic: 'Trigonometric Values' },
    { questionText: 'sin²θ + cos²θ equals:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: '0' }, { id: 'b', text: '1' }, { id: 'c', text: '2' }, { id: 'd', text: 'Depends on θ' }], correctAnswer: 'b', answerExplanation: 'Fundamental identity: sin²θ + cos²θ = 1', marks: 4, negativeMarks: 1, topic: 'Identities' },
    { questionText: 'Period of sin x is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'π' }, { id: 'b', text: '2π' }, { id: 'c', text: 'π/2' }, { id: 'd', text: '4π' }], correctAnswer: 'b', answerExplanation: 'sin x has period 2π: sin(x + 2π) = sin x', marks: 4, negativeMarks: 1, topic: 'Periodicity' },
    { questionText: 'tan(45°) equals:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: '0' }, { id: 'b', text: '1' }, { id: 'c', text: '√3' }, { id: 'd', text: '1/√3' }], correctAnswer: 'b', answerExplanation: 'tan 45° = sin 45°/cos 45° = (1/√2)/(1/√2) = 1', marks: 4, negativeMarks: 1, topic: 'Trigonometric Values' },
    { questionText: 'sin(A+B) equals:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'sinA cosB + cosA sinB' }, { id: 'b', text: 'sinA cosB - cosA sinB' }, { id: 'c', text: 'cosA cosB + sinA sinB' }, { id: 'd', text: 'cosA cosB - sinA sinB' }], correctAnswer: 'a', answerExplanation: 'Sum formula: sin(A+B) = sinA cosB + cosA sinB', marks: 4, negativeMarks: 1, topic: 'Sum Formulas' },
    { questionText: 'Value of cos 60° (as fraction with denominator 2):', questionType: 'INTEGER_TYPE', difficulty: 'EASY', integerAnswer: 1, answerExplanation: 'cos 60° = 1/2, numerator is 1', marks: 4, negativeMarks: 0, topic: 'Trigonometric Values' },
    { questionText: 'Which are correct trigonometric identities?', questionType: 'MULTIPLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'sin²θ + cos²θ = 1' }, { id: 'b', text: '1 + tan²θ = sec²θ' }, { id: 'c', text: '1 + cot²θ = cosec²θ' }, { id: 'd', text: 'sin²θ - cos²θ = 1' }], correctOptions: ['a', 'b', 'c'], answerExplanation: 'sin²θ - cos²θ ≠ 1 (it equals -cos2θ)', marks: 4, negativeMarks: 2, topic: 'Identities' },
  ],

  // Chapter 5: Complex Numbers
  chapter5: [
    { questionText: 'i² equals:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: '1' }, { id: 'b', text: '-1' }, { id: 'c', text: 'i' }, { id: 'd', text: '-i' }], correctAnswer: 'b', answerExplanation: 'By definition, i = √(-1), so i² = -1', marks: 4, negativeMarks: 1, topic: 'Complex Numbers' },
    { questionText: 'Modulus of 3 + 4i is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: '5' }, { id: 'b', text: '7' }, { id: 'c', text: '25' }, { id: 'd', text: '1' }], correctAnswer: 'a', answerExplanation: '|3 + 4i| = √(3² + 4²) = √25 = 5', marks: 4, negativeMarks: 1, topic: 'Modulus' },
    { questionText: 'Conjugate of 2 - 3i is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: '2 + 3i' }, { id: 'b', text: '-2 + 3i' }, { id: 'c', text: '-2 - 3i' }, { id: 'd', text: '3 - 2i' }], correctAnswer: 'a', answerExplanation: 'Conjugate changes sign of imaginary part: (2-3i)* = 2+3i', marks: 4, negativeMarks: 1, topic: 'Conjugate' },
    { questionText: 'i⁴ equals:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'i' }, { id: 'b', text: '-i' }, { id: 'c', text: '1' }, { id: 'd', text: '-1' }], correctAnswer: 'c', answerExplanation: 'i⁴ = (i²)² = (-1)² = 1', marks: 4, negativeMarks: 1, topic: 'Powers of i' },
    { questionText: 'Value of i + i² + i³ + i⁴ is:', questionType: 'INTEGER_TYPE', difficulty: 'MEDIUM', integerAnswer: 0, answerExplanation: 'i + (-1) + (-i) + 1 = 0', marks: 4, negativeMarks: 0, topic: 'Powers of i' },
  ],

  // Chapter 7: Permutations and Combinations
  chapter7: [
    { questionText: '5! equals:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: '20' }, { id: 'b', text: '60' }, { id: 'c', text: '120' }, { id: 'd', text: '720' }], correctAnswer: 'c', answerExplanation: '5! = 5 × 4 × 3 × 2 × 1 = 120', marks: 4, negativeMarks: 1, topic: 'Factorial' },
    { questionText: 'ⁿPᵣ formula is:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'n!/(n-r)!' }, { id: 'b', text: 'n!/r!' }, { id: 'c', text: 'n!/(n-r)!r!' }, { id: 'd', text: '(n-r)!/n!' }], correctAnswer: 'a', answerExplanation: 'ⁿPᵣ = n!/(n-r)! (permutation formula)', marks: 4, negativeMarks: 1, topic: 'Permutations' },
    { questionText: 'ⁿCᵣ formula is:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'n!/(n-r)!' }, { id: 'b', text: 'n!/r!' }, { id: 'c', text: 'n!/(n-r)!r!' }, { id: 'd', text: 'r!/(n-r)!' }], correctAnswer: 'c', answerExplanation: 'ⁿCᵣ = n!/((n-r)!r!) (combination formula)', marks: 4, negativeMarks: 1, topic: 'Combinations' },
    { questionText: '⁵C₂ equals:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: '10' }, { id: 'b', text: '20' }, { id: 'c', text: '25' }, { id: 'd', text: '5' }], correctAnswer: 'a', answerExplanation: '⁵C₂ = 5!/(3!2!) = 120/(6×2) = 10', marks: 4, negativeMarks: 1, topic: 'Combinations' },
    { questionText: 'Value of ¹⁰C₀ + ¹⁰C₁₀:', questionType: 'INTEGER_TYPE', difficulty: 'EASY', integerAnswer: 2, answerExplanation: '¹⁰C₀ = 1, ¹⁰C₁₀ = 1, sum = 2', marks: 4, negativeMarks: 0, topic: 'Combinations' },
    { questionText: 'Value of ⁶P₃:', questionType: 'INTEGER_TYPE', difficulty: 'MEDIUM', integerAnswer: 120, answerExplanation: '⁶P₃ = 6!/3! = 720/6 = 120', marks: 4, negativeMarks: 0, topic: 'Permutations' },
  ],

  // Chapter 9: Sequences and Series
  chapter9: [
    { questionText: 'Sum of first n natural numbers is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'n(n+1)' }, { id: 'b', text: 'n(n+1)/2' }, { id: 'c', text: 'n²' }, { id: 'd', text: '(n+1)/2' }], correctAnswer: 'b', answerExplanation: 'Sum = 1+2+...+n = n(n+1)/2', marks: 4, negativeMarks: 1, topic: 'Arithmetic Progression' },
    { questionText: 'nth term of AP with first term a and common difference d:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'a + nd' }, { id: 'b', text: 'a + (n-1)d' }, { id: 'c', text: 'a × d^n' }, { id: 'd', text: 'a × d^(n-1)' }], correctAnswer: 'b', answerExplanation: 'aₙ = a + (n-1)d for AP', marks: 4, negativeMarks: 1, topic: 'Arithmetic Progression' },
    { questionText: 'For GP with first term a and ratio r, sum to infinity (|r|<1) is:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'a/(1-r)' }, { id: 'b', text: 'a/(1+r)' }, { id: 'c', text: 'a(1-r)' }, { id: 'd', text: 'ar/(1-r)' }], correctAnswer: 'a', answerExplanation: 'S∞ = a/(1-r) for |r| < 1', marks: 4, negativeMarks: 1, topic: 'Geometric Progression' },
    { questionText: 'Sum of first 10 natural numbers:', questionType: 'INTEGER_TYPE', difficulty: 'EASY', integerAnswer: 55, answerExplanation: 'Sum = 10×11/2 = 55', marks: 4, negativeMarks: 0, topic: 'Arithmetic Progression' },
    { questionText: '5th term of AP: 2, 5, 8, 11... is:', questionType: 'INTEGER_TYPE', difficulty: 'EASY', integerAnswer: 14, answerExplanation: 'a=2, d=3, a₅ = 2 + 4×3 = 14', marks: 4, negativeMarks: 0, topic: 'Arithmetic Progression' },
  ],

  // Chapter 13: Limits and Derivatives
  chapter13: [
    { questionText: 'lim(x→0) sin x/x equals:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: '0' }, { id: 'b', text: '1' }, { id: 'c', text: '∞' }, { id: 'd', text: 'Does not exist' }], correctAnswer: 'b', answerExplanation: 'Standard limit: lim(x→0) sin x/x = 1', marks: 4, negativeMarks: 1, topic: 'Limits' },
    { questionText: 'Derivative of xⁿ is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'xⁿ⁻¹' }, { id: 'b', text: 'nxⁿ⁻¹' }, { id: 'c', text: 'nxⁿ' }, { id: 'd', text: 'xⁿ/n' }], correctAnswer: 'b', answerExplanation: 'd/dx(xⁿ) = nxⁿ⁻¹ (power rule)', marks: 4, negativeMarks: 1, topic: 'Derivatives' },
    { questionText: 'Derivative of sin x is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'cos x' }, { id: 'b', text: '-cos x' }, { id: 'c', text: 'sin x' }, { id: 'd', text: '-sin x' }], correctAnswer: 'a', answerExplanation: 'd/dx(sin x) = cos x', marks: 4, negativeMarks: 1, topic: 'Derivatives' },
    { questionText: 'Derivative of eˣ is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'xeˣ⁻¹' }, { id: 'b', text: 'eˣ' }, { id: 'c', text: 'eˣ/x' }, { id: 'd', text: 'ln x' }], correctAnswer: 'b', answerExplanation: 'd/dx(eˣ) = eˣ (exponential function)', marks: 4, negativeMarks: 1, topic: 'Derivatives' },
    { questionText: 'lim(x→2) (x²-4)/(x-2) equals:', questionType: 'INTEGER_TYPE', difficulty: 'MEDIUM', integerAnswer: 4, answerExplanation: '(x²-4)/(x-2) = (x+2)(x-2)/(x-2) = x+2 → 4 as x→2', marks: 4, negativeMarks: 0, topic: 'Limits' },
    { questionText: 'Derivative of x³ at x=2 is:', questionType: 'INTEGER_TYPE', difficulty: 'MEDIUM', integerAnswer: 12, answerExplanation: 'd/dx(x³) = 3x², at x=2: 3(4) = 12', marks: 4, negativeMarks: 0, topic: 'Derivatives' },
  ],

  // Chapter 16: Probability
  chapter16: [
    { questionText: 'Probability of getting head in one coin toss:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: '0' }, { id: 'b', text: '1/2' }, { id: 'c', text: '1' }, { id: 'd', text: '1/4' }], correctAnswer: 'b', answerExplanation: 'P(H) = 1/2 for fair coin', marks: 4, negativeMarks: 1, topic: 'Basic Probability' },
    { questionText: 'If P(A) = 0.3 and P(B) = 0.4, P(A∪B) for mutually exclusive events:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: '0.12' }, { id: 'b', text: '0.7' }, { id: 'c', text: '0.1' }, { id: 'd', text: '0.58' }], correctAnswer: 'b', answerExplanation: 'For mutually exclusive: P(A∪B) = P(A) + P(B) = 0.7', marks: 4, negativeMarks: 1, topic: 'Addition Theorem' },
    { questionText: 'P(A) + P(A\') equals:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: '0' }, { id: 'b', text: '1' }, { id: 'c', text: '2' }, { id: 'd', text: 'P(A)' }], correctAnswer: 'b', answerExplanation: 'P(A) + P(not A) = 1 (complementary events)', marks: 4, negativeMarks: 1, topic: 'Complementary Events' },
    { questionText: 'Probability of getting 6 on a fair die:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: '1/2' }, { id: 'b', text: '1/3' }, { id: 'c', text: '1/6' }, { id: 'd', text: '1/12' }], correctAnswer: 'c', answerExplanation: 'P(6) = 1/6 for fair die', marks: 4, negativeMarks: 1, topic: 'Basic Probability' },
    { questionText: 'Number of outcomes when 2 dice are thrown:', questionType: 'INTEGER_TYPE', difficulty: 'EASY', integerAnswer: 36, answerExplanation: '6 × 6 = 36 outcomes', marks: 4, negativeMarks: 0, topic: 'Sample Space' },
  ],
};

export function getAllMathematicsQuestions() {
  const allQuestions: any[] = [];

  Object.entries(MATHEMATICS_QUESTIONS).forEach(([chapter, questions]) => {
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

export default MATHEMATICS_QUESTIONS;
