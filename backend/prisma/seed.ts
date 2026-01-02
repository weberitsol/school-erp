import { PrismaClient, UserRole, Gender, QuestionType, DifficultyLevel, QuestionSource } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // 1. Create School
  console.log('Creating school...');
  const school = await prisma.school.upsert({
    where: { code: 'WEBER001' },
    update: {},
    create: {
      name: 'Weber Academy',
      code: 'WEBER001',
      address: '123 Education Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400001',
      phone: '+91 9876543210',
      email: 'info@weberacademy.edu',
      boardType: 'CBSE',
      isActive: true,
    },
  });
  console.log(`✅ School created: ${school.name} (${school.id})\n`);

  // 2. Create Admin User
  console.log('Creating admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@weberacademy.edu' },
    update: {},
    create: {
      email: 'admin@weberacademy.edu',
      password: hashedPassword,
      role: UserRole.ADMIN,
      schoolId: school.id,
      isActive: true,
    },
  });
  console.log(`✅ Admin user created: ${adminUser.email} (${adminUser.id})\n`);

  // 3. Create Teacher User (for creating questions)
  console.log('Creating teacher user...');
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@weberacademy.edu' },
    update: {},
    create: {
      email: 'teacher@weberacademy.edu',
      password: hashedPassword,
      role: UserRole.TEACHER,
      schoolId: school.id,
      isActive: true,
    },
  });

  // Create teacher profile
  await prisma.teacher.upsert({
    where: { employeeId: 'TCH001' },
    update: { userId: teacherUser.id },
    create: {
      userId: teacherUser.id,
      employeeId: 'TCH001',
      firstName: 'Rajesh',
      lastName: 'Kumar',
      gender: Gender.MALE,
      phone: '+91 9876543211',
      qualification: 'M.Sc., B.Ed.',
      specialization: 'Physics, Chemistry, Biology',
      experience: 10,
    },
  });
  console.log(`✅ Teacher user created: ${teacherUser.email} (${teacherUser.id})\n`);

  // 4. Create Student User
  console.log('Creating student user...');
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@weberacademy.edu' },
    update: {},
    create: {
      email: 'student@weberacademy.edu',
      password: hashedPassword,
      role: UserRole.STUDENT,
      schoolId: school.id,
      isActive: true,
    },
  });
  console.log(`✅ Student user created: ${studentUser.email} (${studentUser.id})\n`);

  // 5. Create Class 11
  console.log('Creating Class 11...');
  const class11 = await prisma.class.upsert({
    where: { schoolId_code: { schoolId: school.id, code: '11' } },
    update: {},
    create: {
      name: 'Class 11',
      code: '11',
      displayOrder: 11,
      schoolId: school.id,
      isActive: true,
    },
  });
  console.log(`✅ Class created: ${class11.name} (${class11.id})\n`);

  // 6. Create Section A for Class 11
  console.log('Creating Section A...');
  const sectionA = await prisma.section.upsert({
    where: { classId_name: { classId: class11.id, name: 'A' } },
    update: {},
    create: {
      name: 'A',
      capacity: 40,
      classId: class11.id,
      isActive: true,
    },
  });
  console.log(`✅ Section created: ${sectionA.name} (${sectionA.id})\n`);

  // 7. Create Student Profile and assign to class
  console.log('Creating student profile...');
  await prisma.student.upsert({
    where: { admissionNo: 'STU2024001' },
    update: {
      userId: studentUser.id,
      currentClassId: class11.id,
      currentSectionId: sectionA.id,
    },
    create: {
      userId: studentUser.id,
      admissionNo: 'STU2024001',
      rollNo: '01',
      firstName: 'Amit',
      lastName: 'Sharma',
      dateOfBirth: new Date('2008-05-15'),
      gender: Gender.MALE,
      phone: '+91 9876543212',
      currentClassId: class11.id,
      currentSectionId: sectionA.id,
      isActive: true,
    },
  });
  console.log(`✅ Student profile created and assigned to Class 11-A\n`);

  // 8. Create Subjects
  console.log('Creating subjects...');
  const physics = await prisma.subject.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'PHY' } },
    update: {},
    create: {
      name: 'Physics',
      code: 'PHY',
      description: 'Class 11 Physics - JEE Preparation',
      schoolId: school.id,
      isActive: true,
    },
  });
  console.log(`✅ Subject created: ${physics.name} (${physics.id})`);

  const chemistry = await prisma.subject.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'CHEM' } },
    update: {},
    create: {
      name: 'Chemistry',
      code: 'CHEM',
      description: 'Class 11 Chemistry - JEE Preparation',
      schoolId: school.id,
      isActive: true,
    },
  });
  console.log(`✅ Subject created: ${chemistry.name} (${chemistry.id})`);

  const biology = await prisma.subject.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'BIO' } },
    update: {},
    create: {
      name: 'Biology',
      code: 'BIO',
      description: 'Class 11 Biology - NEET Preparation',
      schoolId: school.id,
      isActive: true,
    },
  });
  console.log(`✅ Subject created: ${biology.name} (${biology.id})\n`);

  // 9. Create Academic Year
  console.log('Creating academic year...');
  const academicYear = await prisma.academicYear.upsert({
    where: { schoolId_name: { schoolId: school.id, name: '2024-25' } },
    update: {},
    create: {
      name: '2024-25',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2025-03-31'),
      isCurrent: true,
      schoolId: school.id,
    },
  });
  console.log(`✅ Academic year created: ${academicYear.name}\n`);

  // ============================================================
  // PHYSICS QUESTIONS - Class 11 JEE Level (50 Questions)
  // ============================================================
  console.log('Creating Physics questions...');

  const physicsQuestions = [
    // UNIT: Units and Measurements (5 questions)
    {
      questionText: 'The dimensional formula of Planck\'s constant is:',
      options: [
        { id: 'a', text: '[ML²T⁻¹]', isCorrect: true },
        { id: 'b', text: '[ML²T⁻²]', isCorrect: false },
        { id: 'c', text: '[MLT⁻¹]', isCorrect: false },
        { id: 'd', text: '[ML²T⁻³]', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'Planck\'s constant h has units of J·s = kg·m²/s. Therefore, dimensional formula is [ML²T⁻¹].',
      chapter: 'Units and Measurements',
      topic: 'Dimensional Analysis',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'The number of significant figures in 0.00340200 is:',
      options: [
        { id: 'a', text: '3', isCorrect: false },
        { id: 'b', text: '5', isCorrect: false },
        { id: 'c', text: '6', isCorrect: true },
        { id: 'd', text: '8', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Leading zeros are not significant. The significant figures are 3, 4, 0, 2, 0, 0 = 6 significant figures.',
      chapter: 'Units and Measurements',
      topic: 'Significant Figures',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'If force (F), velocity (V) and time (T) are taken as fundamental quantities, the dimensional formula of mass would be:',
      options: [
        { id: 'a', text: '[FVT⁻¹]', isCorrect: false },
        { id: 'b', text: '[FV⁻¹T]', isCorrect: true },
        { id: 'c', text: '[FVT]', isCorrect: false },
        { id: 'd', text: '[FV⁻¹T⁻¹]', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'F = ma, so m = F/a = F/(V/T) = FT/V = [FV⁻¹T]',
      chapter: 'Units and Measurements',
      topic: 'Dimensional Analysis',
      difficulty: DifficultyLevel.HARD,
    },
    {
      questionText: 'The dimensional formula of coefficient of viscosity is:',
      options: [
        { id: 'a', text: '[ML⁻¹T⁻¹]', isCorrect: true },
        { id: 'b', text: '[MLT⁻¹]', isCorrect: false },
        { id: 'c', text: '[ML⁻¹T⁻²]', isCorrect: false },
        { id: 'd', text: '[M⁻¹LT⁻¹]', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'Viscosity η = F/(A × dv/dx). Dimensions: [MLT⁻²]/[L² × T⁻¹] = [ML⁻¹T⁻¹]',
      chapter: 'Units and Measurements',
      topic: 'Dimensional Analysis',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'Which of the following pairs has same dimensions?',
      options: [
        { id: 'a', text: 'Torque and Work', isCorrect: true },
        { id: 'b', text: 'Stress and Energy', isCorrect: false },
        { id: 'c', text: 'Force and Stress', isCorrect: false },
        { id: 'd', text: 'Force and Work', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'Both Torque and Work have dimensions [ML²T⁻²]. Torque = r × F and Work = F × d.',
      chapter: 'Units and Measurements',
      topic: 'Dimensional Analysis',
      difficulty: DifficultyLevel.EASY,
    },

    // UNIT: Motion in a Straight Line (5 questions)
    {
      questionText: 'A particle starts from rest with uniform acceleration. The ratio of distance covered in 1st, 2nd and 3rd seconds is:',
      options: [
        { id: 'a', text: '1 : 2 : 3', isCorrect: false },
        { id: 'b', text: '1 : 3 : 5', isCorrect: true },
        { id: 'c', text: '1 : 4 : 9', isCorrect: false },
        { id: 'd', text: '1 : 1 : 1', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Distance in nth second = u + a(2n-1)/2. For u=0: ratio = 1:3:5 (odd number series)',
      chapter: 'Motion in a Straight Line',
      topic: 'Uniformly Accelerated Motion',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'A ball is thrown vertically upward with velocity 20 m/s. The time taken to reach maximum height is (g = 10 m/s²):',
      options: [
        { id: 'a', text: '1 s', isCorrect: false },
        { id: 'b', text: '2 s', isCorrect: true },
        { id: 'c', text: '3 s', isCorrect: false },
        { id: 'd', text: '4 s', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'At maximum height, v = 0. Using v = u - gt: 0 = 20 - 10t, so t = 2 s.',
      chapter: 'Motion in a Straight Line',
      topic: 'Motion Under Gravity',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The displacement-time graph of a moving particle is shown as a curve. At a point where the tangent makes an angle of 45° with the time axis, the velocity is:',
      options: [
        { id: 'a', text: '0', isCorrect: false },
        { id: 'b', text: '1 unit', isCorrect: true },
        { id: 'c', text: '√2 units', isCorrect: false },
        { id: 'd', text: '2 units', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Velocity = slope of x-t graph = tan 45° = 1 unit.',
      chapter: 'Motion in a Straight Line',
      topic: 'Graphical Analysis',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'Two bodies are dropped from heights h and 2h. The ratio of times taken to reach the ground is:',
      options: [
        { id: 'a', text: '1 : 2', isCorrect: false },
        { id: 'b', text: '1 : √2', isCorrect: true },
        { id: 'c', text: '√2 : 1', isCorrect: false },
        { id: 'd', text: '2 : 1', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Time of fall t = √(2h/g). Ratio = √h : √(2h) = 1 : √2',
      chapter: 'Motion in a Straight Line',
      topic: 'Free Fall',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'A car accelerates from rest at constant rate α for some time, then decelerates at constant rate β to come to rest. If total time elapsed is t, the maximum velocity acquired by car is:',
      options: [
        { id: 'a', text: 'αβt/(α+β)', isCorrect: true },
        { id: 'b', text: '(α+β)t/αβ', isCorrect: false },
        { id: 'c', text: 'αt/β', isCorrect: false },
        { id: 'd', text: 'βt/α', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'If v_max is reached at time t₁, then t₁ = v/α and t₂ = v/β. Total t = t₁ + t₂ = v(α+β)/αβ. So v = αβt/(α+β).',
      chapter: 'Motion in a Straight Line',
      topic: 'Variable Acceleration',
      difficulty: DifficultyLevel.HARD,
    },

    // UNIT: Motion in a Plane (5 questions)
    {
      questionText: 'A projectile is thrown with velocity v at angle θ with horizontal. The maximum height reached is:',
      options: [
        { id: 'a', text: 'v²sin²θ/g', isCorrect: false },
        { id: 'b', text: 'v²sin²θ/2g', isCorrect: true },
        { id: 'c', text: 'v²cos²θ/2g', isCorrect: false },
        { id: 'd', text: 'v²/2g', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'H = u²sin²θ/2g where u is initial velocity. Maximum height depends on vertical component.',
      chapter: 'Motion in a Plane',
      topic: 'Projectile Motion',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'For what angle of projection is the range of a projectile maximum?',
      options: [
        { id: 'a', text: '30°', isCorrect: false },
        { id: 'b', text: '45°', isCorrect: true },
        { id: 'c', text: '60°', isCorrect: false },
        { id: 'd', text: '90°', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Range R = u²sin2θ/g is maximum when sin2θ = 1, i.e., 2θ = 90°, so θ = 45°.',
      chapter: 'Motion in a Plane',
      topic: 'Projectile Motion',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'A particle is moving in a circle of radius r with constant speed v. The acceleration of the particle is:',
      options: [
        { id: 'a', text: 'Zero', isCorrect: false },
        { id: 'b', text: 'v/r', isCorrect: false },
        { id: 'c', text: 'v²/r', isCorrect: true },
        { id: 'd', text: 'v²r', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'In uniform circular motion, centripetal acceleration a = v²/r directed towards the center.',
      chapter: 'Motion in a Plane',
      topic: 'Circular Motion',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Two projectiles are thrown with same speed at angles θ and (90°-θ) with horizontal. The ratio of their maximum heights is:',
      options: [
        { id: 'a', text: '1 : 1', isCorrect: false },
        { id: 'b', text: 'tan²θ : 1', isCorrect: true },
        { id: 'c', text: '1 : tan²θ', isCorrect: false },
        { id: 'd', text: 'tanθ : 1', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'H₁/H₂ = sin²θ/sin²(90-θ) = sin²θ/cos²θ = tan²θ',
      chapter: 'Motion in a Plane',
      topic: 'Projectile Motion',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'A boat crosses a river with velocity 10 km/h. The river flows with velocity 6 km/h. The resultant velocity of boat is:',
      options: [
        { id: 'a', text: '16 km/h', isCorrect: false },
        { id: 'b', text: '4 km/h', isCorrect: false },
        { id: 'c', text: '8 km/h', isCorrect: false },
        { id: 'd', text: '√136 km/h', isCorrect: true },
      ],
      correctAnswer: 'd',
      answerExplanation: 'Resultant = √(10² + 6²) = √(100 + 36) = √136 km/h ≈ 11.66 km/h',
      chapter: 'Motion in a Plane',
      topic: 'Relative Motion',
      difficulty: DifficultyLevel.MEDIUM,
    },

    // UNIT: Laws of Motion (5 questions)
    {
      questionText: 'A body of mass 5 kg is acted upon by two perpendicular forces 8 N and 6 N. The acceleration produced is:',
      options: [
        { id: 'a', text: '2 m/s²', isCorrect: true },
        { id: 'b', text: '2.8 m/s²', isCorrect: false },
        { id: 'c', text: '1.4 m/s²', isCorrect: false },
        { id: 'd', text: '14 m/s²', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'Net force = √(8² + 6²) = √(64 + 36) = 10 N. Acceleration = F/m = 10/5 = 2 m/s².',
      chapter: 'Laws of Motion',
      topic: 'Newton\'s Second Law',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'A lift is moving down with acceleration a. A man in the lift drops a ball inside. The acceleration of ball as observed by man in lift is:',
      options: [
        { id: 'a', text: 'g', isCorrect: false },
        { id: 'b', text: 'g - a', isCorrect: true },
        { id: 'c', text: 'g + a', isCorrect: false },
        { id: 'd', text: 'a', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'In non-inertial frame of lift, pseudo force acts upward. Effective g = g - a.',
      chapter: 'Laws of Motion',
      topic: 'Pseudo Force',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'The coefficient of static friction between two surfaces is 0.5. The angle of friction is:',
      options: [
        { id: 'a', text: '30°', isCorrect: false },
        { id: 'b', text: '45°', isCorrect: false },
        { id: 'c', text: '26.6°', isCorrect: true },
        { id: 'd', text: '60°', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Angle of friction λ = tan⁻¹(μ) = tan⁻¹(0.5) = 26.6°',
      chapter: 'Laws of Motion',
      topic: 'Friction',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'Two masses m₁ and m₂ are connected by a string passing over a frictionless pulley. The acceleration of the system is (m₁ > m₂):',
      options: [
        { id: 'a', text: '(m₁ + m₂)g/(m₁ - m₂)', isCorrect: false },
        { id: 'b', text: '(m₁ - m₂)g/(m₁ + m₂)', isCorrect: true },
        { id: 'c', text: 'm₁g/(m₁ + m₂)', isCorrect: false },
        { id: 'd', text: 'm₂g/(m₁ + m₂)', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Net force = (m₁ - m₂)g, Total mass = m₁ + m₂. Acceleration = (m₁ - m₂)g/(m₁ + m₂).',
      chapter: 'Laws of Motion',
      topic: 'Atwood Machine',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'A block of mass m is placed on a rough inclined plane of inclination θ. If coefficient of friction is μ, the acceleration down the plane is:',
      options: [
        { id: 'a', text: 'g(sinθ - μcosθ)', isCorrect: true },
        { id: 'b', text: 'g(sinθ + μcosθ)', isCorrect: false },
        { id: 'c', text: 'g(cosθ - μsinθ)', isCorrect: false },
        { id: 'd', text: 'gsinθ', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'Net force = mgsinθ - μmgcosθ. Acceleration = g(sinθ - μcosθ).',
      chapter: 'Laws of Motion',
      topic: 'Friction on Inclined Plane',
      difficulty: DifficultyLevel.MEDIUM,
    },

    // UNIT: Work, Energy and Power (5 questions)
    {
      questionText: 'The work done by centripetal force on a body moving in a circular path is:',
      options: [
        { id: 'a', text: 'Positive', isCorrect: false },
        { id: 'b', text: 'Negative', isCorrect: false },
        { id: 'c', text: 'Zero', isCorrect: true },
        { id: 'd', text: 'Depends on speed', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Centripetal force is always perpendicular to velocity. W = F·d·cos90° = 0.',
      chapter: 'Work, Energy and Power',
      topic: 'Work Done',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'A body of mass 2 kg moving with velocity 4 m/s collides with a body of mass 6 kg at rest. If the collision is perfectly inelastic, the loss in kinetic energy is:',
      options: [
        { id: 'a', text: '12 J', isCorrect: true },
        { id: 'b', text: '16 J', isCorrect: false },
        { id: 'c', text: '8 J', isCorrect: false },
        { id: 'd', text: '24 J', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'Initial KE = ½(2)(4²) = 16 J. Final velocity = 2×4/8 = 1 m/s. Final KE = ½(8)(1²) = 4 J. Loss = 12 J.',
      chapter: 'Work, Energy and Power',
      topic: 'Collision',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'A spring of force constant k is stretched by x. The work done is:',
      options: [
        { id: 'a', text: 'kx', isCorrect: false },
        { id: 'b', text: '½kx', isCorrect: false },
        { id: 'c', text: '½kx²', isCorrect: true },
        { id: 'd', text: 'kx²', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Work done in stretching spring = ½kx² (stored as potential energy).',
      chapter: 'Work, Energy and Power',
      topic: 'Potential Energy',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Power of an engine which can lift 600 kg of water per minute to a height of 20 m is (g = 10 m/s²):',
      options: [
        { id: 'a', text: '1 kW', isCorrect: false },
        { id: 'b', text: '2 kW', isCorrect: true },
        { id: 'c', text: '12 kW', isCorrect: false },
        { id: 'd', text: '120 kW', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Work = mgh = 600 × 10 × 20 = 120000 J. Power = 120000/60 = 2000 W = 2 kW.',
      chapter: 'Work, Energy and Power',
      topic: 'Power',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Two bodies of masses m and 4m have equal kinetic energies. The ratio of their momenta is:',
      options: [
        { id: 'a', text: '1 : 2', isCorrect: true },
        { id: 'b', text: '2 : 1', isCorrect: false },
        { id: 'c', text: '1 : 4', isCorrect: false },
        { id: 'd', text: '4 : 1', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'KE = p²/2m. If KE is same, p² ∝ m. So p₁/p₂ = √(m/4m) = 1/2.',
      chapter: 'Work, Energy and Power',
      topic: 'Momentum and KE Relation',
      difficulty: DifficultyLevel.MEDIUM,
    },

    // UNIT: System of Particles and Rotational Motion (5 questions)
    {
      questionText: 'The moment of inertia of a solid sphere about its diameter is:',
      options: [
        { id: 'a', text: '(2/5)MR²', isCorrect: true },
        { id: 'b', text: '(2/3)MR²', isCorrect: false },
        { id: 'c', text: '(1/2)MR²', isCorrect: false },
        { id: 'd', text: 'MR²', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'For solid sphere about diameter, I = 2MR²/5 = (2/5)MR².',
      chapter: 'System of Particles and Rotational Motion',
      topic: 'Moment of Inertia',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The radius of gyration of a disc of mass M and radius R about an axis perpendicular to plane passing through center is:',
      options: [
        { id: 'a', text: 'R', isCorrect: false },
        { id: 'b', text: 'R/2', isCorrect: false },
        { id: 'c', text: 'R/√2', isCorrect: true },
        { id: 'd', text: '2R', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'I = MR²/2 = MK². So K² = R²/2, K = R/√2.',
      chapter: 'System of Particles and Rotational Motion',
      topic: 'Radius of Gyration',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'A disc is rolling without slipping. The ratio of rotational KE to total KE is:',
      options: [
        { id: 'a', text: '1 : 2', isCorrect: false },
        { id: 'b', text: '1 : 3', isCorrect: true },
        { id: 'c', text: '2 : 3', isCorrect: false },
        { id: 'd', text: '1 : 4', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'For disc: KE_rot = (1/4)Mv², KE_total = (3/4)Mv². Ratio = (1/4)/(3/4) = 1/3.',
      chapter: 'System of Particles and Rotational Motion',
      topic: 'Rolling Motion',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'Angular momentum is conserved when:',
      options: [
        { id: 'a', text: 'Force is zero', isCorrect: false },
        { id: 'b', text: 'Torque is zero', isCorrect: true },
        { id: 'c', text: 'Linear momentum is conserved', isCorrect: false },
        { id: 'd', text: 'Angular velocity is constant', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Angular momentum L is conserved when external torque τ = 0. (τ = dL/dt)',
      chapter: 'System of Particles and Rotational Motion',
      topic: 'Angular Momentum',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'A solid cylinder and a hollow cylinder of same mass and radius roll down an inclined plane. Which reaches bottom first?',
      options: [
        { id: 'a', text: 'Solid cylinder', isCorrect: true },
        { id: 'b', text: 'Hollow cylinder', isCorrect: false },
        { id: 'c', text: 'Both reach together', isCorrect: false },
        { id: 'd', text: 'Depends on angle of incline', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'Acceleration a = gsinθ/(1 + I/MR²). Solid cylinder has smaller I/MR² (1/2 vs 1), so higher acceleration.',
      chapter: 'System of Particles and Rotational Motion',
      topic: 'Rolling on Inclined Plane',
      difficulty: DifficultyLevel.MEDIUM,
    },

    // UNIT: Gravitation (5 questions)
    {
      questionText: 'The escape velocity from Earth is 11.2 km/s. The escape velocity from a planet having twice the radius and same mean density as Earth is:',
      options: [
        { id: 'a', text: '11.2 km/s', isCorrect: false },
        { id: 'b', text: '22.4 km/s', isCorrect: true },
        { id: 'c', text: '5.6 km/s', isCorrect: false },
        { id: 'd', text: '15.8 km/s', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'v_e = √(2gR) = √(8πGρR²/3). For same ρ, v_e ∝ R. So v_e = 2 × 11.2 = 22.4 km/s.',
      chapter: 'Gravitation',
      topic: 'Escape Velocity',
      difficulty: DifficultyLevel.HARD,
    },
    {
      questionText: 'The ratio of acceleration due to gravity at a height h from surface to that at depth h below surface of Earth (h << R) is:',
      options: [
        { id: 'a', text: '1 : 1', isCorrect: false },
        { id: 'b', text: '(R - h) : (R - 2h)', isCorrect: false },
        { id: 'c', text: '(R - 2h) : R', isCorrect: true },
        { id: 'd', text: 'R : (R - h)', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'g_h = g(1 - 2h/R), g_d = g(1 - h/R). Ratio = (R-2h)/R.',
      chapter: 'Gravitation',
      topic: 'Variation of g',
      difficulty: DifficultyLevel.HARD,
    },
    {
      questionText: 'The orbital velocity of a satellite at height h from Earth surface is (R = radius of Earth):',
      options: [
        { id: 'a', text: '√(gR)', isCorrect: false },
        { id: 'b', text: '√(gR²/(R+h))', isCorrect: true },
        { id: 'c', text: '√(g(R+h))', isCorrect: false },
        { id: 'd', text: '√(2gR)', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'v_o = √(GM/(R+h)) = √(gR²/(R+h)) since g = GM/R².',
      chapter: 'Gravitation',
      topic: 'Satellite Motion',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'The time period of a geostationary satellite is:',
      options: [
        { id: 'a', text: '12 hours', isCorrect: false },
        { id: 'b', text: '24 hours', isCorrect: true },
        { id: 'c', text: '48 hours', isCorrect: false },
        { id: 'd', text: '6 hours', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Geostationary satellite has same time period as Earth\'s rotation = 24 hours.',
      chapter: 'Gravitation',
      topic: 'Satellites',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'According to Kepler\'s third law, T² is proportional to:',
      options: [
        { id: 'a', text: 'r', isCorrect: false },
        { id: 'b', text: 'r²', isCorrect: false },
        { id: 'c', text: 'r³', isCorrect: true },
        { id: 'd', text: '1/r²', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Kepler\'s third law: T² ∝ r³ (T² = 4π²r³/GM).',
      chapter: 'Gravitation',
      topic: 'Kepler\'s Laws',
      difficulty: DifficultyLevel.EASY,
    },

    // UNIT: Mechanical Properties of Solids (5 questions)
    {
      questionText: 'The Young\'s modulus of a wire is Y. If the wire is stretched to double its length, the Young\'s modulus becomes:',
      options: [
        { id: 'a', text: 'Y', isCorrect: true },
        { id: 'b', text: '2Y', isCorrect: false },
        { id: 'c', text: 'Y/2', isCorrect: false },
        { id: 'd', text: '4Y', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'Young\'s modulus is a material property and doesn\'t change with dimensions.',
      chapter: 'Mechanical Properties of Solids',
      topic: 'Elasticity',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'Two wires of same material have length in ratio 1:2 and diameter in ratio 2:1. The ratio of their extensions under same load is:',
      options: [
        { id: 'a', text: '1 : 8', isCorrect: true },
        { id: 'b', text: '8 : 1', isCorrect: false },
        { id: 'c', text: '1 : 4', isCorrect: false },
        { id: 'd', text: '4 : 1', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'ΔL = FL/AY. ΔL ∝ L/d². Ratio = (1/4)/(2/1) = 1/8.',
      chapter: 'Mechanical Properties of Solids',
      topic: 'Stress and Strain',
      difficulty: DifficultyLevel.HARD,
    },
    {
      questionText: 'The bulk modulus of a gas at constant temperature is equal to:',
      options: [
        { id: 'a', text: 'γP', isCorrect: false },
        { id: 'b', text: 'P', isCorrect: true },
        { id: 'c', text: 'P/γ', isCorrect: false },
        { id: 'd', text: 'γ/P', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'For isothermal process, PV = constant. Bulk modulus B = -V(dP/dV) = P.',
      chapter: 'Mechanical Properties of Solids',
      topic: 'Bulk Modulus',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'Poisson\'s ratio can have values between:',
      options: [
        { id: 'a', text: '-1 to 0.5', isCorrect: true },
        { id: 'b', text: '0 to 1', isCorrect: false },
        { id: 'c', text: '-1 to 1', isCorrect: false },
        { id: 'd', text: '0 to 0.5', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'Theoretical limits of Poisson\'s ratio are -1 to 0.5 for stable materials.',
      chapter: 'Mechanical Properties of Solids',
      topic: 'Poisson\'s Ratio',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'The energy stored per unit volume in a stretched wire is:',
      options: [
        { id: 'a', text: '(1/2) × stress × strain', isCorrect: true },
        { id: 'b', text: 'stress × strain', isCorrect: false },
        { id: 'c', text: '(1/2) × stress / strain', isCorrect: false },
        { id: 'd', text: '2 × stress × strain', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'Energy per unit volume = (1/2) × stress × strain = (1/2)σε.',
      chapter: 'Mechanical Properties of Solids',
      topic: 'Elastic Potential Energy',
      difficulty: DifficultyLevel.EASY,
    },

    // UNIT: Thermodynamics (5 questions)
    {
      questionText: 'In an isothermal process, the change in internal energy is:',
      options: [
        { id: 'a', text: 'Positive', isCorrect: false },
        { id: 'b', text: 'Negative', isCorrect: false },
        { id: 'c', text: 'Zero', isCorrect: true },
        { id: 'd', text: 'Cannot be determined', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'In isothermal process, T = constant. For ideal gas, ΔU = nCvΔT = 0.',
      chapter: 'Thermodynamics',
      topic: 'Isothermal Process',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The efficiency of Carnot engine working between T₁ and T₂ (T₁ > T₂) is:',
      options: [
        { id: 'a', text: '1 - T₁/T₂', isCorrect: false },
        { id: 'b', text: '1 - T₂/T₁', isCorrect: true },
        { id: 'c', text: 'T₂/T₁', isCorrect: false },
        { id: 'd', text: 'T₁/T₂', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Carnot efficiency η = 1 - T_cold/T_hot = 1 - T₂/T₁.',
      chapter: 'Thermodynamics',
      topic: 'Heat Engines',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'For an adiabatic process, the relation between P and V is:',
      options: [
        { id: 'a', text: 'PV = constant', isCorrect: false },
        { id: 'b', text: 'PV^γ = constant', isCorrect: true },
        { id: 'c', text: 'P/V = constant', isCorrect: false },
        { id: 'd', text: 'PV² = constant', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'In adiabatic process, Q = 0 and PV^γ = constant, where γ = Cp/Cv.',
      chapter: 'Thermodynamics',
      topic: 'Adiabatic Process',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The work done by an ideal gas in free expansion is:',
      options: [
        { id: 'a', text: 'Positive', isCorrect: false },
        { id: 'b', text: 'Negative', isCorrect: false },
        { id: 'c', text: 'Zero', isCorrect: true },
        { id: 'd', text: 'Depends on gas', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'In free expansion, P_ext = 0, so W = ∫P_ext dV = 0.',
      chapter: 'Thermodynamics',
      topic: 'Free Expansion',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'The ratio Cp/Cv for a monoatomic gas is:',
      options: [
        { id: 'a', text: '5/3', isCorrect: true },
        { id: 'b', text: '7/5', isCorrect: false },
        { id: 'c', text: '4/3', isCorrect: false },
        { id: 'd', text: '9/7', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'For monoatomic gas, f = 3. γ = Cp/Cv = 1 + 2/f = 1 + 2/3 = 5/3.',
      chapter: 'Thermodynamics',
      topic: 'Specific Heat',
      difficulty: DifficultyLevel.EASY,
    },

    // UNIT: Oscillations (5 questions)
    {
      questionText: 'The time period of a simple pendulum is doubled when its length is:',
      options: [
        { id: 'a', text: 'Doubled', isCorrect: false },
        { id: 'b', text: 'Quadrupled', isCorrect: true },
        { id: 'c', text: 'Halved', isCorrect: false },
        { id: 'd', text: 'Unchanged', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'T = 2π√(L/g), so T ∝ √L. For T to double, L must be quadrupled.',
      chapter: 'Oscillations',
      topic: 'Simple Pendulum',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'In SHM, when displacement is half of amplitude, the ratio of KE to PE is:',
      options: [
        { id: 'a', text: '3 : 1', isCorrect: true },
        { id: 'b', text: '1 : 3', isCorrect: false },
        { id: 'c', text: '1 : 1', isCorrect: false },
        { id: 'd', text: '4 : 1', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'KE = (1/2)k(A² - x²), PE = (1/2)kx². At x = A/2: KE/PE = (A² - A²/4)/(A²/4) = 3.',
      chapter: 'Oscillations',
      topic: 'Energy in SHM',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'The phase difference between velocity and acceleration in SHM is:',
      options: [
        { id: 'a', text: '0', isCorrect: false },
        { id: 'b', text: 'π/4', isCorrect: false },
        { id: 'c', text: 'π/2', isCorrect: true },
        { id: 'd', text: 'π', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'v = Aωcos(ωt), a = -Aω²sin(ωt). Phase difference = π/2.',
      chapter: 'Oscillations',
      topic: 'SHM Kinematics',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'Two springs of force constants k₁ and k₂ are connected in series. The effective force constant is:',
      options: [
        { id: 'a', text: 'k₁ + k₂', isCorrect: false },
        { id: 'b', text: 'k₁k₂/(k₁ + k₂)', isCorrect: true },
        { id: 'c', text: '(k₁ + k₂)/k₁k₂', isCorrect: false },
        { id: 'd', text: '√(k₁k₂)', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'In series: 1/k_eff = 1/k₁ + 1/k₂. So k_eff = k₁k₂/(k₁ + k₂).',
      chapter: 'Oscillations',
      topic: 'Spring Combination',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'A particle executes SHM with amplitude A and time period T. The maximum velocity is:',
      options: [
        { id: 'a', text: 'A/T', isCorrect: false },
        { id: 'b', text: '2πA/T', isCorrect: true },
        { id: 'c', text: 'πA/T', isCorrect: false },
        { id: 'd', text: '4πA/T', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'v_max = Aω = A(2π/T) = 2πA/T.',
      chapter: 'Oscillations',
      topic: 'SHM Parameters',
      difficulty: DifficultyLevel.EASY,
    },

    // UNIT: Waves (5 questions)
    {
      questionText: 'The speed of sound in air at NTP is approximately:',
      options: [
        { id: 'a', text: '230 m/s', isCorrect: false },
        { id: 'b', text: '332 m/s', isCorrect: true },
        { id: 'c', text: '440 m/s', isCorrect: false },
        { id: 'd', text: '550 m/s', isCorrect: false },
      ],
      correctAnswer: 'b',
      answerExplanation: 'Speed of sound in air at 0°C and 1 atm is approximately 332 m/s.',
      chapter: 'Waves',
      topic: 'Speed of Sound',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'In a closed organ pipe, the frequency ratio of first three overtones is:',
      options: [
        { id: 'a', text: '1 : 2 : 3', isCorrect: false },
        { id: 'b', text: '1 : 3 : 5', isCorrect: false },
        { id: 'c', text: '3 : 5 : 7', isCorrect: true },
        { id: 'd', text: '2 : 4 : 6', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Closed pipe has only odd harmonics. Overtones are 3f, 5f, 7f. Ratio = 3:5:7.',
      chapter: 'Waves',
      topic: 'Standing Waves',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      questionText: 'The phenomenon of beats is due to:',
      options: [
        { id: 'a', text: 'Interference', isCorrect: true },
        { id: 'b', text: 'Diffraction', isCorrect: false },
        { id: 'c', text: 'Reflection', isCorrect: false },
        { id: 'd', text: 'Refraction', isCorrect: false },
      ],
      correctAnswer: 'a',
      answerExplanation: 'Beats are produced by superposition (interference) of two waves of slightly different frequencies.',
      chapter: 'Waves',
      topic: 'Beats',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'If two tuning forks of frequencies 256 Hz and 260 Hz are sounded together, the beat frequency is:',
      options: [
        { id: 'a', text: '516 Hz', isCorrect: false },
        { id: 'b', text: '258 Hz', isCorrect: false },
        { id: 'c', text: '4 Hz', isCorrect: true },
        { id: 'd', text: '2 Hz', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Beat frequency = |f₁ - f₂| = |260 - 256| = 4 Hz.',
      chapter: 'Waves',
      topic: 'Beats',
      difficulty: DifficultyLevel.EASY,
    },
    {
      questionText: 'The Doppler effect is applicable for:',
      options: [
        { id: 'a', text: 'Sound waves only', isCorrect: false },
        { id: 'b', text: 'Light waves only', isCorrect: false },
        { id: 'c', text: 'Both sound and light waves', isCorrect: true },
        { id: 'd', text: 'Neither sound nor light', isCorrect: false },
      ],
      correctAnswer: 'c',
      answerExplanation: 'Doppler effect applies to all waves including sound and light waves.',
      chapter: 'Waves',
      topic: 'Doppler Effect',
      difficulty: DifficultyLevel.EASY,
    },
  ];

  // Insert Physics questions
  let physicsCount = 0;
  for (const q of physicsQuestions) {
    await prisma.question.create({
      data: {
        questionText: q.questionText,
        questionType: QuestionType.MCQ,
        difficulty: q.difficulty,
        marks: 4,
        negativeMarks: 1,
        estimatedTime: 120,
        subjectId: physics.id,
        classId: class11.id,
        chapter: q.chapter,
        topic: q.topic,
        tags: ['JEE', 'Class 11', 'Physics'],
        correctAnswer: q.correctAnswer,
        options: q.options,
        answerExplanation: q.answerExplanation,
        source: QuestionSource.MANUAL,
        isVerified: true,
        createdById: teacherUser.id,
        isActive: true,
      },
    });
    physicsCount++;
  }
  console.log(`✅ Created ${physicsCount} Physics questions\n`);

  // ============================================================
  // BOOK CATEGORIES - NCERT Hierarchical Structure
  // ============================================================
  console.log('Creating book categories...');

  // Root Category - NCERT
  const ncertRoot = await prisma.bookCategory.upsert({
    where: { id: 'ncert-root' },
    update: {},
    create: {
      id: 'ncert-root',
      name: 'NCERT',
      description: 'National Council of Educational Research and Training',
      boardType: 'NCERT',
      displayOrder: 1,
      iconName: 'book',
      isActive: true,
      schoolId: school.id,
    },
  });
  console.log(`✅ Created root category: ${ncertRoot.name}`);

  // Class 11 Category
  const class11Category = await prisma.bookCategory.upsert({
    where: { id: 'ncert-class-11' },
    update: {},
    create: {
      id: 'ncert-class-11',
      name: 'Class 11',
      description: 'NCERT Class 11 Books',
      parentId: ncertRoot.id,
      boardType: 'NCERT',
      classLevel: '11',
      displayOrder: 1,
      isActive: true,
      schoolId: school.id,
    },
  });
  console.log(`✅ Created category: ${class11Category.name}`);

  // Class 12 Category
  const class12Category = await prisma.bookCategory.upsert({
    where: { id: 'ncert-class-12' },
    update: {},
    create: {
      id: 'ncert-class-12',
      name: 'Class 12',
      description: 'NCERT Class 12 Books',
      parentId: ncertRoot.id,
      boardType: 'NCERT',
      classLevel: '12',
      displayOrder: 2,
      isActive: true,
      schoolId: school.id,
    },
  });
  console.log(`✅ Created category: ${class12Category.name}`);

  // Class 10 Category
  const class10Category = await prisma.bookCategory.upsert({
    where: { id: 'ncert-class-10' },
    update: {},
    create: {
      id: 'ncert-class-10',
      name: 'Class 10',
      description: 'NCERT Class 10 Books',
      parentId: ncertRoot.id,
      boardType: 'NCERT',
      classLevel: '10',
      displayOrder: 0,
      isActive: true,
      schoolId: school.id,
    },
  });
  console.log(`✅ Created category: ${class10Category.name}`);

  // Subject Categories for Class 11
  const physicsCategory11 = await prisma.bookCategory.upsert({
    where: { id: 'ncert-11-physics' },
    update: {},
    create: {
      id: 'ncert-11-physics',
      name: 'Physics',
      description: 'Class 11 Physics Books',
      parentId: class11Category.id,
      boardType: 'NCERT',
      classLevel: '11',
      subjectCode: 'PHY',
      displayOrder: 1,
      isActive: true,
      schoolId: school.id,
    },
  });

  const chemistryCategory11 = await prisma.bookCategory.upsert({
    where: { id: 'ncert-11-chemistry' },
    update: {},
    create: {
      id: 'ncert-11-chemistry',
      name: 'Chemistry',
      description: 'Class 11 Chemistry Books',
      parentId: class11Category.id,
      boardType: 'NCERT',
      classLevel: '11',
      subjectCode: 'CHEM',
      displayOrder: 2,
      isActive: true,
      schoolId: school.id,
    },
  });

  const biologyCategory11 = await prisma.bookCategory.upsert({
    where: { id: 'ncert-11-biology' },
    update: {},
    create: {
      id: 'ncert-11-biology',
      name: 'Biology',
      description: 'Class 11 Biology Books',
      parentId: class11Category.id,
      boardType: 'NCERT',
      classLevel: '11',
      subjectCode: 'BIO',
      displayOrder: 3,
      isActive: true,
      schoolId: school.id,
    },
  });

  const mathsCategory11 = await prisma.bookCategory.upsert({
    where: { id: 'ncert-11-maths' },
    update: {},
    create: {
      id: 'ncert-11-maths',
      name: 'Mathematics',
      description: 'Class 11 Mathematics Books',
      parentId: class11Category.id,
      boardType: 'NCERT',
      classLevel: '11',
      subjectCode: 'MATH',
      displayOrder: 4,
      isActive: true,
      schoolId: school.id,
    },
  });

  console.log('✅ Created subject categories for Class 11');

  // Subject Categories for Class 12
  const physicsCategory12 = await prisma.bookCategory.upsert({
    where: { id: 'ncert-12-physics' },
    update: {},
    create: {
      id: 'ncert-12-physics',
      name: 'Physics',
      description: 'Class 12 Physics Books',
      parentId: class12Category.id,
      boardType: 'NCERT',
      classLevel: '12',
      subjectCode: 'PHY',
      displayOrder: 1,
      isActive: true,
      schoolId: school.id,
    },
  });

  const chemistryCategory12 = await prisma.bookCategory.upsert({
    where: { id: 'ncert-12-chemistry' },
    update: {},
    create: {
      id: 'ncert-12-chemistry',
      name: 'Chemistry',
      description: 'Class 12 Chemistry Books',
      parentId: class12Category.id,
      boardType: 'NCERT',
      classLevel: '12',
      subjectCode: 'CHEM',
      displayOrder: 2,
      isActive: true,
      schoolId: school.id,
    },
  });

  const biologyCategory12 = await prisma.bookCategory.upsert({
    where: { id: 'ncert-12-biology' },
    update: {},
    create: {
      id: 'ncert-12-biology',
      name: 'Biology',
      description: 'Class 12 Biology Books',
      parentId: class12Category.id,
      boardType: 'NCERT',
      classLevel: '12',
      subjectCode: 'BIO',
      displayOrder: 3,
      isActive: true,
      schoolId: school.id,
    },
  });

  const mathsCategory12 = await prisma.bookCategory.upsert({
    where: { id: 'ncert-12-maths' },
    update: {},
    create: {
      id: 'ncert-12-maths',
      name: 'Mathematics',
      description: 'Class 12 Mathematics Books',
      parentId: class12Category.id,
      boardType: 'NCERT',
      classLevel: '12',
      subjectCode: 'MATH',
      displayOrder: 4,
      isActive: true,
      schoolId: school.id,
    },
  });

  console.log('✅ Created subject categories for Class 12\n');

  // ============================================================
  // SAMPLE BOOKS
  // ============================================================
  console.log('Creating sample books...');

  // Physics Part 1 - Class 11
  const physicsBook1 = await prisma.book.upsert({
    where: { id: 'physics-11-part1' },
    update: {},
    create: {
      id: 'physics-11-part1',
      title: 'Physics Part 1 - Class 11',
      description: 'NCERT Physics Part 1 textbook for Class 11. Covers units and measurements, motion, laws of motion, work energy and power, motion of system of particles.',
      author: 'NCERT',
      sourceType: 'EXTERNAL_URL',
      externalUrl: 'https://ncert.nic.in/textbook/pdf/keph101.pdf',  // Chapter 1 - Physical World
      externalProvider: 'ncert',
      categoryId: physicsCategory11.id,
      subjectId: physics.id,
      classLevel: '11',
      status: 'PUBLISHED',
      uploadedById: teacherUser.id,
      tags: ['NCERT', 'Physics', 'Class 11', 'JEE'],
      schoolId: school.id,
    },
  });
  console.log(`✅ Created book: ${physicsBook1.title}`);

  // Physics Part 2 - Class 11
  const physicsBook2 = await prisma.book.upsert({
    where: { id: 'physics-11-part2' },
    update: {},
    create: {
      id: 'physics-11-part2',
      title: 'Physics Part 2 - Class 11',
      description: 'NCERT Physics Part 2 textbook for Class 11. Covers gravitation, mechanical properties, thermodynamics, kinetic theory, oscillations and waves.',
      author: 'NCERT',
      sourceType: 'EXTERNAL_URL',
      externalUrl: 'https://ncert.nic.in/textbook/pdf/keph201.pdf',  // Chapter 8 - Gravitation
      externalProvider: 'ncert',
      categoryId: physicsCategory11.id,
      subjectId: physics.id,
      classLevel: '11',
      status: 'PUBLISHED',
      uploadedById: teacherUser.id,
      tags: ['NCERT', 'Physics', 'Class 11', 'JEE'],
      schoolId: school.id,
    },
  });
  console.log(`✅ Created book: ${physicsBook2.title}`);

  // Chemistry Part 1 - Class 11
  const chemistryBook1 = await prisma.book.upsert({
    where: { id: 'chemistry-11-part1' },
    update: {},
    create: {
      id: 'chemistry-11-part1',
      title: 'Chemistry Part 1 - Class 11',
      description: 'NCERT Chemistry Part 1 textbook for Class 11. Covers basic concepts, atomic structure, periodic table, chemical bonding, states of matter.',
      author: 'NCERT',
      sourceType: 'EXTERNAL_URL',
      externalUrl: 'https://ncert.nic.in/textbook/pdf/kech101.pdf',  // Chapter 1 - Some Basic Concepts
      externalProvider: 'ncert',
      categoryId: chemistryCategory11.id,
      subjectId: chemistry.id,
      classLevel: '11',
      status: 'PUBLISHED',
      uploadedById: teacherUser.id,
      tags: ['NCERT', 'Chemistry', 'Class 11', 'JEE', 'NEET'],
      schoolId: school.id,
    },
  });
  console.log(`✅ Created book: ${chemistryBook1.title}`);

  // Biology - Class 11
  const biologyBook1 = await prisma.book.upsert({
    where: { id: 'biology-11' },
    update: {},
    create: {
      id: 'biology-11',
      title: 'Biology - Class 11',
      description: 'NCERT Biology textbook for Class 11. Covers diversity of living organisms, structural organization, cell structure, plant physiology, human physiology.',
      author: 'NCERT',
      sourceType: 'EXTERNAL_URL',
      externalUrl: 'https://ncert.nic.in/textbook/pdf/kebo101.pdf',  // Chapter 1 - The Living World
      externalProvider: 'ncert',
      categoryId: biologyCategory11.id,
      subjectId: biology.id,
      classLevel: '11',
      status: 'PUBLISHED',
      uploadedById: teacherUser.id,
      tags: ['NCERT', 'Biology', 'Class 11', 'NEET'],
      schoolId: school.id,
    },
  });
  console.log(`✅ Created book: ${biologyBook1.title}`);

  // Mathematics - Class 11
  const mathsBook1 = await prisma.book.upsert({
    where: { id: 'maths-11' },
    update: {},
    create: {
      id: 'maths-11',
      title: 'Mathematics - Class 11',
      description: 'NCERT Mathematics textbook for Class 11. Covers sets, relations and functions, trigonometry, algebra, coordinate geometry, calculus, statistics.',
      author: 'NCERT',
      sourceType: 'EXTERNAL_URL',
      externalUrl: 'https://ncert.nic.in/textbook/pdf/kemh101.pdf',  // Chapter 1 - Sets
      externalProvider: 'ncert',
      categoryId: mathsCategory11.id,
      classLevel: '11',
      status: 'PUBLISHED',
      uploadedById: teacherUser.id,
      tags: ['NCERT', 'Mathematics', 'Class 11', 'JEE'],
      schoolId: school.id,
    },
  });
  console.log(`✅ Created book: ${mathsBook1.title}`);

  // Physics Part 1 - Class 12
  const physicsBook12_1 = await prisma.book.upsert({
    where: { id: 'physics-12-part1' },
    update: {},
    create: {
      id: 'physics-12-part1',
      title: 'Physics Part 1 - Class 12',
      description: 'NCERT Physics Part 1 textbook for Class 12. Covers electrostatics, current electricity, magnetic effects, electromagnetic induction, alternating current.',
      author: 'NCERT',
      sourceType: 'EXTERNAL_URL',
      externalUrl: 'https://ncert.nic.in/textbook/pdf/leph101.pdf',  // Chapter 1 - Electric Charges and Fields
      externalProvider: 'ncert',
      categoryId: physicsCategory12.id,
      subjectId: physics.id,
      classLevel: '12',
      status: 'PUBLISHED',
      uploadedById: teacherUser.id,
      tags: ['NCERT', 'Physics', 'Class 12', 'JEE'],
      schoolId: school.id,
    },
  });
  console.log(`✅ Created book: ${physicsBook12_1.title}`);

  // Physics Part 2 - Class 12
  const physicsBook12_2 = await prisma.book.upsert({
    where: { id: 'physics-12-part2' },
    update: {},
    create: {
      id: 'physics-12-part2',
      title: 'Physics Part 2 - Class 12',
      description: 'NCERT Physics Part 2 textbook for Class 12. Covers electromagnetic waves, ray optics, wave optics, dual nature of matter, atoms, nuclei, semiconductors.',
      author: 'NCERT',
      sourceType: 'EXTERNAL_URL',
      externalUrl: 'https://ncert.nic.in/textbook/pdf/leph201.pdf',  // Chapter 9 - Ray Optics
      externalProvider: 'ncert',
      categoryId: physicsCategory12.id,
      subjectId: physics.id,
      classLevel: '12',
      status: 'PUBLISHED',
      uploadedById: teacherUser.id,
      tags: ['NCERT', 'Physics', 'Class 12', 'JEE'],
      schoolId: school.id,
    },
  });
  console.log(`✅ Created book: ${physicsBook12_2.title}\n`);

  // Grant book access to Class 11
  console.log('Granting book access to Class 11...');
  const booksToGrant = [physicsBook1, physicsBook2, chemistryBook1, biologyBook1, mathsBook1];

  for (const book of booksToGrant) {
    // Check if access already exists
    const existingAccess = await prisma.bookAccess.findFirst({
      where: {
        bookId: book.id,
        classId: class11.id,
        sectionId: sectionA.id,
      },
    });

    if (!existingAccess) {
      await prisma.bookAccess.create({
        data: {
          bookId: book.id,
          classId: class11.id,
          sectionId: sectionA.id,
          academicYearId: academicYear.id,
          canDownload: true,
          canAnnotate: true,
          createdById: teacherUser.id,
        },
      });
    }
  }
  console.log(`✅ Granted access to ${booksToGrant.length} books for Class 11-A\n`);

  console.log('🎉 Seed completed successfully!\n');
  console.log('Summary:');
  console.log(`  - School: ${school.name}`);
  console.log(`  - Admin: ${adminUser.email} (password: admin123)`);
  console.log(`  - Teacher: ${teacherUser.email} (password: admin123)`);
  console.log(`  - Student: ${studentUser.email} (password: admin123)`);
  console.log(`  - Class: ${class11.name}`);
  console.log(`  - Subjects: Physics, Chemistry, Biology`);
  console.log(`  - Physics Questions: ${physicsCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
