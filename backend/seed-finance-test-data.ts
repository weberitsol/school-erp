import { PrismaClient, PaymentStatus, PaymentMethod } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting finance test data seed...\n');

  // Get the school
  const school = await prisma.school.findFirst();

  if (!school) {
    console.error('❌ No school found. Please run main seed first.');
    process.exit(1);
  }

  console.log(`Using school: ${school.name} (${school.id})\n`);

  // Get academic year
  let academicYear = await prisma.academicYear.findFirst({
    where: { schoolId: school.id, isCurrent: true }
  });

  if (!academicYear) {
    console.log('Creating current academic year...');
    academicYear = await prisma.academicYear.create({
      data: {
        name: '2024-25',
        schoolId: school.id,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2025-05-31'),
        isCurrent: true,
      }
    });
  }

  console.log(`Using academic year: ${academicYear.name}\n`);

  // Get a test student
  let student = await prisma.student.findFirst({
    where: { user: { schoolId: school.id } },
    include: { user: true }
  });

  if (!student) {
    console.log('Creating test student...');
    const studentUser = await prisma.user.create({
      data: {
        email: 'teststudent@weberacademy.edu',
        password: '$2a$10$K3p9QzZ7qJ7QzZ7qJ7QzZ', // hashed 'test123'
        role: 'STUDENT',
        schoolId: school.id,
        isActive: true,
      }
    });

    const class11 = await prisma.class.findFirst({
      where: { schoolId: school.id, code: '11' }
    });

    if (!class11) {
      console.error('❌ Class 11 not found');
      process.exit(1);
    }

    student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        admissionNo: 'TEST001',
        rollNo: 'TEST001',
        firstName: 'Test',
        lastName: 'Student',
        currentClassId: class11.id,
        dateOfBirth: new Date('2007-01-01'),
        gender: 'MALE',
      },
      include: { user: true }
    });
    console.log(`✅ Test student created: ${student.firstName} ${student.lastName}\n`);
  }

  console.log(`Using student: ${student.firstName} ${student.lastName} (${student.id})\n`);

  // Get class for student
  const class11 = student.currentClassId
    ? await prisma.class.findUnique({ where: { id: student.currentClassId } })
    : await prisma.class.findFirst({ where: { schoolId: school.id, code: '11' } });

  if (!class11) {
    console.error('❌ Class 11 not found');
    process.exit(1);
  }

  // Get or create test fee structures
  console.log('Getting fee structures...');
  let feeStructures = await prisma.feeStructure.findMany({
    where: { schoolId: school.id, academicYearId: academicYear.id },
    take: 2
  });

  if (feeStructures.length === 0) {
    console.log('Creating test fee structures...');
    feeStructures = [];

    const feeStructure1 = await prisma.feeStructure.create({
      data: {
        name: 'Monthly Tuition Fee',
        description: 'Monthly tuition fee for all classes',
        schoolId: school.id,
        academicYearId: academicYear.id,
        classId: class11.id,
        amount: 5000,
        frequency: 'MONTHLY',
        dueDay: 5,
        lateFee: 500,
        lateFeeAfterDays: 5,
      }
    });
    feeStructures.push(feeStructure1);

    const feeStructure2 = await prisma.feeStructure.create({
      data: {
        name: 'Sports Fee',
        description: 'Annual sports fee',
        schoolId: school.id,
        academicYearId: academicYear.id,
        classId: class11.id,
        amount: 1000,
        frequency: 'ANNUALLY',
        dueDay: 15,
        lateFee: 100,
        lateFeeAfterDays: 10,
      }
    });
    feeStructures.push(feeStructure2);

    console.log(`✅ Created ${feeStructures.length} test fee structures\n`);
  }

  // Create test invoice
  console.log('Creating test invoice...');
  const invoiceNo = `INV-${Date.now()}`;
  const invoice = await prisma.feeInvoice.create({
    data: {
      invoiceNo,
      schoolId: school.id,
      studentId: student.id,
      subtotal: 6000,
      discount: 0,
      tax: 0,
      totalAmount: 6000,
      paidAmount: 0,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'PENDING',
      lineItems: {
        create: feeStructures.slice(0, 2).map((fs) => ({
          feeStructureId: fs.id,
          description: fs.name,
          quantity: 1,
          unitPrice: fs.amount,
          amount: fs.amount,
        }))
      }
    },
    include: {
      lineItems: true,
      student: true,
      school: true,
    }
  });

  console.log(`✅ Invoice created: ${invoice.invoiceNo}\n`);

  // Create test payment
  console.log('Creating test payment...');
  const receiptNo = `RCP-${Date.now()}`;
  const payment = await prisma.feePayment.create({
    data: {
      receiptNo,
      studentId: student.id,
      feeStructureId: feeStructures[0].id,
      invoiceId: invoice.id,
      amount: 5000,
      lateFee: 0,
      discount: 0,
      totalAmount: 5000,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      transactionId: `TXN-${Date.now()}`,
      paymentDate: new Date(),
      remarks: 'Test payment for PDF download testing',
    },
    include: {
      student: true,
      feeStructure: true,
    }
  });

  console.log(`✅ Payment created: ${payment.receiptNo}\n`);

  // Create a partial payment invoice
  console.log('Creating partial payment invoice...');
  const invoiceNo2 = `INV-${Date.now() + 1000}`;
  const invoice2 = await prisma.feeInvoice.create({
    data: {
      invoiceNo: invoiceNo2,
      schoolId: school.id,
      studentId: student.id,
      subtotal: 10000,
      discount: 0,
      tax: 0,
      totalAmount: 10000,
      paidAmount: 5000,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      status: 'PARTIAL',
      lineItems: {
        create: feeStructures.map((fs, idx) => ({
          feeStructureId: fs.id,
          description: `${fs.name} (Part ${idx + 1})`,
          quantity: 1,
          unitPrice: fs.amount,
          amount: fs.amount,
        }))
      }
    },
    include: {
      lineItems: true,
      student: true,
      school: true,
    }
  });

  console.log(`✅ Partial invoice created: ${invoice2.invoiceNo}\n`);

  // Create second payment for the partial invoice
  console.log('Creating second payment for partial invoice...');
  const receiptNo2 = `RCP-${Date.now() + 1000}`;
  const payment2 = await prisma.feePayment.create({
    data: {
      receiptNo: receiptNo2,
      studentId: student.id,
      feeStructureId: feeStructures[1].id,
      invoiceId: invoice2.id,
      amount: 5000,
      lateFee: 0,
      discount: 0,
      totalAmount: 5000,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.CHEQUE,
      transactionId: `CHQ-12345`,
      paymentDate: new Date(),
      remarks: 'Partial payment - cheque',
    },
    include: {
      student: true,
      feeStructure: true,
    }
  });

  console.log(`✅ Second payment created: ${payment2.receiptNo}\n`);

  console.log('✅ Finance test data seed completed!\n');
  console.log('Test Data Summary:');
  console.log(`  Student: ${student.firstName} ${student.lastName}`);
  console.log(`  Invoice 1: ${invoice.invoiceNo} - Amount: ${invoice.totalAmount}`);
  console.log(`  Payment 1: ${payment.receiptNo} - Amount: ${payment.totalAmount}`);
  console.log(`  Invoice 2: ${invoice2.invoiceNo} - Amount: ${invoice2.totalAmount} (PARTIAL)`);
  console.log(`  Payment 2: ${payment2.receiptNo} - Amount: ${payment2.totalAmount}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
