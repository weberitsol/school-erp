// Physics Class 11 - Comprehensive Question Bank
// Based on NCERT syllabus with JEE/NEET style questions

export const PHYSICS_QUESTIONS = {
  // Chapter 1: Physical World
  chapter1: [
    // Single Correct
    { questionText: 'Which of the following is a fundamental force in nature?', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Frictional force' }, { id: 'b', text: 'Gravitational force' }, { id: 'c', text: 'Tension force' }, { id: 'd', text: 'Normal reaction' }], correctAnswer: 'b', answerExplanation: 'Gravitational force is one of the four fundamental forces. Friction, tension, and normal reaction are derived from electromagnetic interactions.', marks: 4, negativeMarks: 1, topic: 'Fundamental Forces' },
    { questionText: 'The branch of physics dealing with motion is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Thermodynamics' }, { id: 'b', text: 'Optics' }, { id: 'c', text: 'Mechanics' }, { id: 'd', text: 'Electrodynamics' }], correctAnswer: 'c', answerExplanation: 'Mechanics deals with motion of objects and forces causing motion.', marks: 4, negativeMarks: 1, topic: 'Branches of Physics' },
    { questionText: 'Who unified electricity and magnetism?', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Newton' }, { id: 'b', text: 'Maxwell' }, { id: 'c', text: 'Einstein' }, { id: 'd', text: 'Galileo' }], correctAnswer: 'b', answerExplanation: 'James Clerk Maxwell unified electricity and magnetism through Maxwell\'s equations.', marks: 4, negativeMarks: 1, topic: 'Unification' },
    { questionText: 'Conservation laws are related to:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Symmetries in nature' }, { id: 'b', text: 'Random phenomena' }, { id: 'c', text: 'Man-made laws' }, { id: 'd', text: 'Arbitrary definitions' }], correctAnswer: 'a', answerExplanation: 'By Noether\'s theorem, every symmetry corresponds to a conservation law.', marks: 4, negativeMarks: 1, topic: 'Conservation Laws' },
    { questionText: 'Which force is responsible for radioactive decay?', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Gravitational' }, { id: 'b', text: 'Electromagnetic' }, { id: 'c', text: 'Strong nuclear' }, { id: 'd', text: 'Weak nuclear' }], correctAnswer: 'd', answerExplanation: 'Weak nuclear force is responsible for beta decay and other radioactive processes.', marks: 4, negativeMarks: 1, topic: 'Fundamental Forces' },
    // Multiple Correct
    { questionText: 'Which are fundamental forces of nature?', questionType: 'MULTIPLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Gravitational' }, { id: 'b', text: 'Electromagnetic' }, { id: 'c', text: 'Friction' }, { id: 'd', text: 'Strong nuclear' }], correctOptions: ['a', 'b', 'd'], answerExplanation: 'Four fundamental forces: Gravitational, Electromagnetic, Strong nuclear, Weak nuclear. Friction is not fundamental.', marks: 4, negativeMarks: 2, topic: 'Fundamental Forces' },
    // Integer Type
    { questionText: 'How many fundamental forces exist in nature?', questionType: 'INTEGER_TYPE', difficulty: 'EASY', integerAnswer: 4, answerExplanation: 'Four fundamental forces: Gravitational, Electromagnetic, Strong nuclear, Weak nuclear.', marks: 4, negativeMarks: 0, topic: 'Fundamental Forces' },
    // Assertion Reasoning
    { questionText: 'Assertion and Reason:', questionType: 'ASSERTION_REASONING', difficulty: 'HARD', assertionData: { assertion: 'Physics is the most fundamental natural science.', reason: 'Physics principles form the foundation for all other sciences.', correctOption: 'a' }, answerExplanation: 'Both true; reason correctly explains assertion.', marks: 4, negativeMarks: 1, topic: 'Nature of Physics' },
  ],

  // Chapter 2: Units and Measurements
  chapter2: [
    { questionText: 'The SI unit of luminous intensity is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Lumen' }, { id: 'b', text: 'Candela' }, { id: 'c', text: 'Lux' }, { id: 'd', text: 'Watt' }], correctAnswer: 'b', answerExplanation: 'Candela (cd) is the SI base unit of luminous intensity.', marks: 4, negativeMarks: 1, topic: 'SI Units' },
    { questionText: 'The dimensional formula of work is:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: '[MLT⁻²]' }, { id: 'b', text: '[ML²T⁻²]' }, { id: 'c', text: '[ML²T⁻³]' }, { id: 'd', text: '[MLT⁻¹]' }], correctAnswer: 'b', answerExplanation: 'Work = Force × Distance = [MLT⁻²][L] = [ML²T⁻²]', marks: 4, negativeMarks: 1, topic: 'Dimensions' },
    { questionText: 'If error in radius is 2%, error in volume of sphere is:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: '2%' }, { id: 'b', text: '4%' }, { id: 'c', text: '6%' }, { id: 'd', text: '8%' }], correctAnswer: 'c', answerExplanation: 'V ∝ r³, so %error in V = 3 × %error in r = 6%', marks: 4, negativeMarks: 1, topic: 'Errors' },
    { questionText: '1 parsec equals:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: '3.26 light years' }, { id: 'b', text: '3.26 AU' }, { id: 'c', text: '1.5 × 10¹¹ m' }, { id: 'd', text: '9.46 × 10¹² km' }], correctAnswer: 'a', answerExplanation: '1 parsec = 3.26 light years = 3.08 × 10¹⁶ m', marks: 4, negativeMarks: 1, topic: 'Units' },
    { questionText: 'Dimensional formula of Planck\'s constant is:', questionType: 'SINGLE_CORRECT', difficulty: 'HARD', options: [{ id: 'a', text: '[ML²T⁻¹]' }, { id: 'b', text: '[ML²T⁻²]' }, { id: 'c', text: '[MLT⁻¹]' }, { id: 'd', text: '[ML²T⁻³]' }], correctAnswer: 'a', answerExplanation: 'h = E/ν = [ML²T⁻²]/[T⁻¹] = [ML²T⁻¹]', marks: 4, negativeMarks: 1, topic: 'Dimensions' },
    { questionText: 'Number of significant figures in 0.00340 is:', questionType: 'INTEGER_TYPE', difficulty: 'EASY', integerAnswer: 3, answerExplanation: 'Leading zeros not significant. 3, 4, and trailing 0 are significant = 3 figures.', marks: 4, negativeMarks: 0, topic: 'Significant Figures' },
    { questionText: 'How many base units in SI system?', questionType: 'INTEGER_TYPE', difficulty: 'EASY', integerAnswer: 7, answerExplanation: '7 base units: m, kg, s, A, K, mol, cd', marks: 4, negativeMarks: 0, topic: 'SI Units' },
    { questionText: 'Which pairs have same dimensions?', questionType: 'MULTIPLE_CORRECT', difficulty: 'HARD', options: [{ id: 'a', text: 'Work and Torque' }, { id: 'b', text: 'Stress and Pressure' }, { id: 'c', text: 'Momentum and Impulse' }, { id: 'd', text: 'Force and Energy' }], correctOptions: ['a', 'b', 'c'], answerExplanation: 'Work=Torque=[ML²T⁻²], Stress=Pressure=[ML⁻¹T⁻²], Momentum=Impulse=[MLT⁻¹]', marks: 4, negativeMarks: 2, topic: 'Dimensions' },
  ],

  // Chapter 3: Motion in a Straight Line
  chapter3: [
    { questionText: 'A particle moves with uniform velocity. Its acceleration is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Positive' }, { id: 'b', text: 'Negative' }, { id: 'c', text: 'Zero' }, { id: 'd', text: 'Variable' }], correctAnswer: 'c', answerExplanation: 'Uniform velocity means no change in velocity, hence acceleration = 0', marks: 4, negativeMarks: 1, topic: 'Kinematics' },
    { questionText: 'The slope of velocity-time graph gives:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Displacement' }, { id: 'b', text: 'Distance' }, { id: 'c', text: 'Acceleration' }, { id: 'd', text: 'Speed' }], correctAnswer: 'c', answerExplanation: 'Slope of v-t graph = dv/dt = acceleration', marks: 4, negativeMarks: 1, topic: 'Graphs' },
    { questionText: 'Area under v-t graph represents:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Acceleration' }, { id: 'b', text: 'Displacement' }, { id: 'c', text: 'Velocity' }, { id: 'd', text: 'Force' }], correctAnswer: 'b', answerExplanation: 'Area under v-t curve = ∫v dt = displacement', marks: 4, negativeMarks: 1, topic: 'Graphs' },
    { questionText: 'A ball is thrown vertically up. At highest point:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'v=0, a=0' }, { id: 'b', text: 'v=0, a=g' }, { id: 'c', text: 'v=max, a=0' }, { id: 'd', text: 'v=max, a=g' }], correctAnswer: 'b', answerExplanation: 'At highest point velocity=0, but acceleration=g (always acting downward)', marks: 4, negativeMarks: 1, topic: 'Free Fall' },
    { questionText: 'Two balls dropped from heights h and 2h reach ground in times t₁ and t₂. Ratio t₁:t₂ is:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: '1:2' }, { id: 'b', text: '1:√2' }, { id: 'c', text: '√2:1' }, { id: 'd', text: '2:1' }], correctAnswer: 'b', answerExplanation: 'h = ½gt², so t ∝ √h. t₁:t₂ = √h:√(2h) = 1:√2', marks: 4, negativeMarks: 1, topic: 'Free Fall' },
    { questionText: 'Velocity of particle at t=0 is 10 m/s, acceleration is -2 m/s². Time to stop is:', questionType: 'INTEGER_TYPE', difficulty: 'MEDIUM', integerAnswer: 5, answerExplanation: 'v = u + at, 0 = 10 + (-2)t, t = 5 seconds', marks: 4, negativeMarks: 0, topic: 'Kinematics' },
    { questionText: 'A car starts from rest with acceleration 2 m/s². Distance in 4th second is:', questionType: 'INTEGER_TYPE', difficulty: 'HARD', integerAnswer: 7, answerExplanation: 'Sₙ = u + a(n - ½) = 0 + 2(4 - 0.5) = 7 m', marks: 4, negativeMarks: 0, topic: 'Kinematics' },
    { questionText: 'Which are correct for uniformly accelerated motion?', questionType: 'MULTIPLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'v = u + at' }, { id: 'b', text: 's = ut + ½at²' }, { id: 'c', text: 'v² = u² + 2as' }, { id: 'd', text: 'a = v/t' }], correctOptions: ['a', 'b', 'c'], answerExplanation: 'First three are equations of motion. a = v/t only if u = 0.', marks: 4, negativeMarks: 2, topic: 'Equations of Motion' },
  ],

  // Chapter 4: Motion in a Plane
  chapter4: [
    { questionText: 'A projectile is fired at 45°. Its range is maximum when:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'θ = 30°' }, { id: 'b', text: 'θ = 45°' }, { id: 'c', text: 'θ = 60°' }, { id: 'd', text: 'θ = 90°' }], correctAnswer: 'b', answerExplanation: 'Range R = u²sin2θ/g is maximum when 2θ = 90°, i.e., θ = 45°', marks: 4, negativeMarks: 1, topic: 'Projectile Motion' },
    { questionText: 'Two vectors of magnitudes 3 and 4 are perpendicular. Resultant magnitude is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: '1' }, { id: 'b', text: '5' }, { id: 'c', text: '7' }, { id: 'd', text: '12' }], correctAnswer: 'b', answerExplanation: 'R = √(3² + 4²) = √25 = 5 (Pythagorean theorem)', marks: 4, negativeMarks: 1, topic: 'Vectors' },
    { questionText: 'In projectile motion, which remains constant?', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Vertical velocity' }, { id: 'b', text: 'Horizontal velocity' }, { id: 'c', text: 'Speed' }, { id: 'd', text: 'KE' }], correctAnswer: 'b', answerExplanation: 'No horizontal force, so horizontal velocity remains constant throughout.', marks: 4, negativeMarks: 1, topic: 'Projectile Motion' },
    { questionText: 'A particle moves in circle of radius 2m with angular velocity 3 rad/s. Centripetal acceleration is:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: '6 m/s²' }, { id: 'b', text: '12 m/s²' }, { id: 'c', text: '18 m/s²' }, { id: 'd', text: '36 m/s²' }], correctAnswer: 'c', answerExplanation: 'aᶜ = ω²r = 3² × 2 = 18 m/s²', marks: 4, negativeMarks: 1, topic: 'Circular Motion' },
    { questionText: 'If A⃗ = 3î + 4ĵ, magnitude of A⃗ is:', questionType: 'INTEGER_TYPE', difficulty: 'EASY', integerAnswer: 5, answerExplanation: '|A⃗| = √(3² + 4²) = 5', marks: 4, negativeMarks: 0, topic: 'Vectors' },
    { questionText: 'Projectile fired at 30° has same range as one fired at:', questionType: 'INTEGER_TYPE', difficulty: 'MEDIUM', integerAnswer: 60, answerExplanation: 'Complementary angles give same range. 90° - 30° = 60°', marks: 4, negativeMarks: 0, topic: 'Projectile Motion' },
    { questionText: 'Which statements about projectile motion are correct?', questionType: 'MULTIPLE_CORRECT', difficulty: 'HARD', options: [{ id: 'a', text: 'Path is parabolic' }, { id: 'b', text: 'Time of flight = 2u sinθ/g' }, { id: 'c', text: 'Max height = u²sin²θ/2g' }, { id: 'd', text: 'Range = u²sinθ/g' }], correctOptions: ['a', 'b', 'c'], answerExplanation: 'Range = u²sin2θ/g, not u²sinθ/g', marks: 4, negativeMarks: 2, topic: 'Projectile Motion' },
  ],

  // Chapter 5: Laws of Motion
  chapter5: [
    { questionText: 'Newton\'s first law defines:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Force' }, { id: 'b', text: 'Inertia' }, { id: 'c', text: 'Momentum' }, { id: 'd', text: 'Acceleration' }], correctAnswer: 'b', answerExplanation: 'First law is also called law of inertia - tendency to resist change in motion.', marks: 4, negativeMarks: 1, topic: 'Newton\'s Laws' },
    { questionText: 'A body of mass 2 kg is acted upon by force 4N. Acceleration is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: '1 m/s²' }, { id: 'b', text: '2 m/s²' }, { id: 'c', text: '4 m/s²' }, { id: 'd', text: '8 m/s²' }], correctAnswer: 'b', answerExplanation: 'F = ma, a = F/m = 4/2 = 2 m/s²', marks: 4, negativeMarks: 1, topic: 'Newton\'s Second Law' },
    { questionText: 'Action and reaction forces:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Act on same body' }, { id: 'b', text: 'Act on different bodies' }, { id: 'c', text: 'Cancel each other' }, { id: 'd', text: 'Are unequal' }], correctAnswer: 'b', answerExplanation: 'Action-reaction pair always act on different bodies, hence don\'t cancel.', marks: 4, negativeMarks: 1, topic: 'Newton\'s Third Law' },
    { questionText: 'Impulse equals change in:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Force' }, { id: 'b', text: 'Momentum' }, { id: 'c', text: 'Energy' }, { id: 'd', text: 'Velocity' }], correctAnswer: 'b', answerExplanation: 'Impulse J = FΔt = Δp (change in momentum)', marks: 4, negativeMarks: 1, topic: 'Impulse' },
    { questionText: 'Coefficient of friction μ is given by:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'f/N' }, { id: 'b', text: 'N/f' }, { id: 'c', text: 'f × N' }, { id: 'd', text: 'f + N' }], correctAnswer: 'a', answerExplanation: 'μ = f/N where f is friction force and N is normal reaction.', marks: 4, negativeMarks: 1, topic: 'Friction' },
    { questionText: 'Mass of 5 kg accelerates at 3 m/s². Force applied is (in N):', questionType: 'INTEGER_TYPE', difficulty: 'EASY', integerAnswer: 15, answerExplanation: 'F = ma = 5 × 3 = 15 N', marks: 4, negativeMarks: 0, topic: 'Newton\'s Second Law' },
    { questionText: 'A force of 10N acts for 2s on 5kg mass at rest. Final velocity is (in m/s):', questionType: 'INTEGER_TYPE', difficulty: 'MEDIUM', integerAnswer: 4, answerExplanation: 'a = F/m = 10/5 = 2 m/s², v = u + at = 0 + 2×2 = 4 m/s', marks: 4, negativeMarks: 0, topic: 'Impulse' },
  ],

  // Chapter 6: Work, Energy and Power
  chapter6: [
    { questionText: 'Work done when force is perpendicular to displacement is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Maximum' }, { id: 'b', text: 'Minimum' }, { id: 'c', text: 'Zero' }, { id: 'd', text: 'Negative' }], correctAnswer: 'c', answerExplanation: 'W = Fd cosθ = Fd cos90° = 0', marks: 4, negativeMarks: 1, topic: 'Work' },
    { questionText: 'Kinetic energy depends on:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Mass only' }, { id: 'b', text: 'Velocity only' }, { id: 'c', text: 'Both mass and velocity' }, { id: 'd', text: 'Neither' }], correctAnswer: 'c', answerExplanation: 'KE = ½mv², depends on both mass and velocity.', marks: 4, negativeMarks: 1, topic: 'Kinetic Energy' },
    { questionText: 'Power is rate of:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Force' }, { id: 'b', text: 'Work' }, { id: 'c', text: 'Energy' }, { id: 'd', text: 'Momentum' }], correctAnswer: 'b', answerExplanation: 'Power P = dW/dt = rate of doing work', marks: 4, negativeMarks: 1, topic: 'Power' },
    { questionText: 'A spring of constant k stretched by x stores energy:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'kx' }, { id: 'b', text: '½kx' }, { id: 'c', text: 'kx²' }, { id: 'd', text: '½kx²' }], correctAnswer: 'd', answerExplanation: 'Elastic PE = ½kx²', marks: 4, negativeMarks: 1, topic: 'Potential Energy' },
    { questionText: 'Work done by 10N force over 5m at 60° to displacement:', questionType: 'INTEGER_TYPE', difficulty: 'MEDIUM', integerAnswer: 25, answerExplanation: 'W = Fd cosθ = 10 × 5 × cos60° = 50 × 0.5 = 25 J', marks: 4, negativeMarks: 0, topic: 'Work' },
    { questionText: 'KE of 2kg mass moving at 3m/s is (in J):', questionType: 'INTEGER_TYPE', difficulty: 'EASY', integerAnswer: 9, answerExplanation: 'KE = ½mv² = ½ × 2 × 3² = 9 J', marks: 4, negativeMarks: 0, topic: 'Kinetic Energy' },
    { questionText: 'Which are scalar quantities?', questionType: 'MULTIPLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Work' }, { id: 'b', text: 'Energy' }, { id: 'c', text: 'Power' }, { id: 'd', text: 'Force' }], correctOptions: ['a', 'b', 'c'], answerExplanation: 'Work, energy, and power are scalars. Force is a vector.', marks: 4, negativeMarks: 2, topic: 'Scalars and Vectors' },
  ],

  // Chapter 7: System of Particles and Rotational Motion
  chapter7: [
    { questionText: 'Centre of mass of uniform rod lies at:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'One end' }, { id: 'b', text: 'Geometric centre' }, { id: 'c', text: 'Quarter length' }, { id: 'd', text: 'Outside the rod' }], correctAnswer: 'b', answerExplanation: 'For uniform body, COM lies at geometric centre.', marks: 4, negativeMarks: 1, topic: 'Centre of Mass' },
    { questionText: 'Moment of inertia depends on:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Angular velocity' }, { id: 'b', text: 'Torque' }, { id: 'c', text: 'Mass distribution about axis' }, { id: 'd', text: 'Linear momentum' }], correctAnswer: 'c', answerExplanation: 'I = Σmr², depends on how mass is distributed about rotation axis.', marks: 4, negativeMarks: 1, topic: 'Moment of Inertia' },
    { questionText: 'Torque is defined as:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Force × Distance' }, { id: 'b', text: 'r⃗ × F⃗' }, { id: 'c', text: 'F⃗ × r⃗' }, { id: 'd', text: 'r⃗ · F⃗' }], correctAnswer: 'b', answerExplanation: 'Torque τ⃗ = r⃗ × F⃗ (cross product)', marks: 4, negativeMarks: 1, topic: 'Torque' },
    { questionText: 'Angular momentum is conserved when:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Force is zero' }, { id: 'b', text: 'Torque is zero' }, { id: 'c', text: 'Energy is conserved' }, { id: 'd', text: 'Momentum is conserved' }], correctAnswer: 'b', answerExplanation: 'dL/dt = τ. If τ = 0, then L = constant.', marks: 4, negativeMarks: 1, topic: 'Angular Momentum' },
    { questionText: 'MOI of solid sphere about diameter is:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: '(2/5)MR²' }, { id: 'b', text: '(2/3)MR²' }, { id: 'c', text: 'MR²' }, { id: 'd', text: '(1/2)MR²' }], correctAnswer: 'a', answerExplanation: 'For solid sphere, I = (2/5)MR² about diameter.', marks: 4, negativeMarks: 1, topic: 'Moment of Inertia' },
  ],

  // Chapter 8: Gravitation
  chapter8: [
    { questionText: 'Gravitational force between two masses is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Attractive only' }, { id: 'b', text: 'Repulsive only' }, { id: 'c', text: 'Both' }, { id: 'd', text: 'Neither' }], correctAnswer: 'a', answerExplanation: 'Gravitational force is always attractive between masses.', marks: 4, negativeMarks: 1, topic: 'Newton\'s Law of Gravitation' },
    { questionText: 'Value of g at height h (h<<R) from Earth\'s surface:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'g(1-2h/R)' }, { id: 'b', text: 'g(1+2h/R)' }, { id: 'c', text: 'g(1-h/R)' }, { id: 'd', text: 'g(1+h/R)' }], correctAnswer: 'a', answerExplanation: 'gₕ = g(1 - 2h/R) for h << R', marks: 4, negativeMarks: 1, topic: 'Acceleration due to Gravity' },
    { questionText: 'Escape velocity from Earth is approximately:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: '7.9 km/s' }, { id: 'b', text: '11.2 km/s' }, { id: 'c', text: '15 km/s' }, { id: 'd', text: '3 km/s' }], correctAnswer: 'b', answerExplanation: 'vₑ = √(2gR) ≈ 11.2 km/s for Earth', marks: 4, negativeMarks: 1, topic: 'Escape Velocity' },
    { questionText: 'Kepler\'s second law is about:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Elliptical orbits' }, { id: 'b', text: 'Equal areas in equal times' }, { id: 'c', text: 'T² ∝ a³' }, { id: 'd', text: 'Circular orbits' }], correctAnswer: 'b', answerExplanation: 'Second law: line joining planet to sun sweeps equal areas in equal times.', marks: 4, negativeMarks: 1, topic: 'Kepler\'s Laws' },
    { questionText: 'If Earth\'s radius doubles but mass unchanged, g becomes:', questionType: 'SINGLE_CORRECT', difficulty: 'HARD', options: [{ id: 'a', text: 'g/2' }, { id: 'b', text: 'g/4' }, { id: 'c', text: '2g' }, { id: 'd', text: '4g' }], correctAnswer: 'b', answerExplanation: 'g = GM/R². If R → 2R, g → g/4', marks: 4, negativeMarks: 1, topic: 'Acceleration due to Gravity' },
  ],

  // More chapters can be added similarly...
  // Chapter 9-15 would follow the same pattern
};

// Export function to get all questions for seeding
export function getAllPhysicsQuestions() {
  const allQuestions: any[] = [];

  Object.entries(PHYSICS_QUESTIONS).forEach(([chapter, questions]) => {
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

export default PHYSICS_QUESTIONS;
