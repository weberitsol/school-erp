import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function seedFinanceData() {
  try {
    console.log('🌱 Starting Finance Module Seed...\n');

    // Get the first school
    const school = await prisma.school.findFirst();
    if (!school) {
      throw new Error('No school found in database. Please seed school data first.');
    }
    const schoolId = school.id;
    console.log(`📍 Using school: ${school.name} (${schoolId})\n`);

    // Clean up existing Finance data
    console.log('🧹 Cleaning up existing Finance data...');
    await prisma.feePayment.deleteMany({});
    await prisma.invoiceLineItem.deleteMany({});
    await prisma.feeInvoice.deleteMany({});
    await prisma.feeStructure.deleteMany({});
    console.log('✅ Cleaned up existing data\n');

    // 1. Get or create Academic Year
    console.log('📅 Setting up Academic Year...');
    let academicYear = await prisma.academicYear.findFirst({
      where: { schoolId },
    });

    if (!academicYear) {
      academicYear = await prisma.academicYear.create({
        data: {
          name: '2024-2025',
          startDate: new Date('2024-04-01'),
          endDate: new Date('2025-03-31'),
          isActive: true,
          schoolId,
        },
      });
    }
    console.log(`✅ Using Academic Year: ${academicYear.name}\n`);

    // 2. Get classes
    console.log('🏫 Getting available classes...');
    const classes = await prisma.class.findMany({
      where: { schoolId },
    });

    if (classes.length === 0) {
      throw new Error('No classes found. Please create classes first.');
    }
    console.log(`✅ Found ${classes.length} classes\n`);

    // 3. Create Fee Structures
    console.log('💰 Creating Fee Structures...');
    const feeStructures = await Promise.all([
      prisma.feeStructure.create({
        data: {
          name: 'Monthly Tuition Fee',
          description: 'Regular monthly tuition for classroom education',
          schoolId,
          academicYearId: academicYear.id,
          classId: classes[0].id,
          amount: new Decimal('50000'),
          frequency: 'Monthly',
          dueDay: 5,
          lateFee: new Decimal('500'),
          lateFeeAfterDays: 15,
          isActive: true,
        },
      }),
      prisma.feeStructure.create({
        data: {
          name: 'Transport Fee',
          description: 'Monthly transportation fee',
          schoolId,
          academicYearId: academicYear.id,
          classId: classes[0].id,
          amount: new Decimal('5000'),
          frequency: 'Monthly',
          dueDay: 5,
          lateFee: new Decimal('100'),
          lateFeeAfterDays: 15,
          isActive: true,
        },
      }),
      prisma.feeStructure.create({
        data: {
          name: 'Sports & Activities Fee',
          description: 'Annual fee for sports and extra-curricular activities',
          schoolId,
          academicYearId: academicYear.id,
          classId: classes[0].id,
          amount: new Decimal('15000'),
          frequency: 'Annually',
          dueDay: 10,
          lateFee: new Decimal('200'),
          lateFeeAfterDays: 30,
          isActive: true,
        },
      }),
      prisma.feeStructure.create({
        data: {
          name: 'Library & Technology Fee',
          description: 'Annual library and technology access fee',
          schoolId,
          academicYearId: academicYear.id,
          classId: classes[Math.min(1, classes.length - 1)].id,
          amount: new Decimal('8000'),
          frequency: 'Annually',
          dueDay: 10,
          lateFee: new Decimal('150'),
          lateFeeAfterDays: 30,
          isActive: true,
        },
      }),
      prisma.feeStructure.create({
        data: {
          name: 'Examination Fee',
          description: 'Examination and assessment fee',
          schoolId,
          academicYearId: academicYear.id,
          classId: classes[Math.min(2, classes.length - 1)].id,
          amount: new Decimal('3000'),
          frequency: 'Quarterly',
          dueDay: 1,
          lateFee: new Decimal('100'),
          lateFeeAfterDays: 10,
          isActive: true,
        },
      }),
    ]);
    console.log(`✅ Created ${feeStructures.length} fee structures\n`);

    // 4. Get students
    console.log('👨‍🎓 Getting students for invoicing...');
    const students = await prisma.student.findMany({
      where: { currentClassId: classes[0].id },
      take: 8,
      include: { parents: true },
    });

    if (students.length === 0) {
      throw new Error('No students found in selected class.');
    }
    console.log(`✅ Found ${students.length} students\n`);

    // 5. Create Invoices
    console.log('📄 Creating Invoices...');
    const invoices = [];

    for (let i = 0; i < Math.min(students.length, 5); i++) {
      const student = students[i];
      const selectedFees = feeStructures.slice(0, 3); // Tuition, Transport, Sports

      // Calculate totals
      const subtotal = selectedFees.reduce(
        (sum, fee) => sum.plus(fee.amount),
        new Decimal(0)
      );
      const discount = new Decimal(Math.random() > 0.7 ? 2500 : 0); // 30% chance of discount
      const tax = subtotal.minus(discount).times(new Decimal('0.05')); // 5% tax
      const totalAmount = subtotal.minus(discount).plus(tax);

      const invoice = await prisma.feeInvoice.create({
        data: {
          invoiceNo: `INV-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
          schoolId,
          studentId: student.id,
          subtotal,
          discount,
          tax,
          totalAmount,
          dueDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          status: i === 0 ? 'PAID' : i === 1 ? 'PARTIAL' : 'PENDING',
          lineItems: {
            create: selectedFees.map((fee) => ({
              feeStructureId: fee.id,
              description: fee.name,
              quantity: 1,
              unitPrice: fee.amount,
              amount: fee.amount,
            })),
          },
        },
        include: { lineItems: true },
      });

      invoices.push(invoice);
    }
    console.log(`✅ Created ${invoices.length} invoices\n`);

    // 6. Create Payments
    console.log('💳 Creating Payments...');
    const payments = [];

    // Payment for first invoice (fully paid)
    const paidInvoice = invoices[0];
    const payment1 = await prisma.feePayment.create({
      data: {
        receiptNo: `RCP-${new Date().getFullYear()}-001`,
        studentId: paidInvoice.studentId,
        feeStructureId: feeStructures[0].id,
        invoiceId: paidInvoice.id,
        amount: paidInvoice.totalAmount,
        totalAmount: paidInvoice.totalAmount,
        paymentStatus: 'PAID',
        paymentMethod: 'BANK_TRANSFER',
        paymentDate: new Date(),
        transactionId: 'TXN-2024-00001',
        forMonth: new Date(new Date().getFullYear(), new Date().getMonth()),
      },
    });
    payments.push(payment1);

    // Partial payment for second invoice
    if (invoices.length > 1) {
      const partialInvoice = invoices[1];
      const payment2 = await prisma.feePayment.create({
        data: {
          receiptNo: `RCP-${new Date().getFullYear()}-002`,
          studentId: partialInvoice.studentId,
          feeStructureId: feeStructures[0].id,
          invoiceId: partialInvoice.id,
          amount: partialInvoice.totalAmount.times(new Decimal('0.5')), // 50% payment
          totalAmount: partialInvoice.totalAmount.times(new Decimal('0.5')),
          paymentStatus: 'PARTIAL',
          paymentMethod: 'ONLINE',
          paymentDate: new Date(new Date().getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          transactionId: 'TXN-2024-00002',
          forMonth: new Date(new Date().getFullYear(), new Date().getMonth()),
        },
      });
      payments.push(payment2);
    }

    // Pending payment (not yet paid)
    if (invoices.length > 2) {
      const pendingInvoice = invoices[2];
      const payment3 = await prisma.feePayment.create({
        data: {
          receiptNo: `RCP-${new Date().getFullYear()}-003`,
          studentId: pendingInvoice.studentId,
          feeStructureId: feeStructures[1].id,
          invoiceId: pendingInvoice.id,
          amount: pendingInvoice.totalAmount,
          totalAmount: pendingInvoice.totalAmount,
          paymentStatus: 'PENDING',
          paymentMethod: undefined,
          paymentDate: undefined,
          forMonth: new Date(new Date().getFullYear(), new Date().getMonth()),
        },
      });
      payments.push(payment3);
    }

    // Additional payments for variety
    for (let i = 3; i < Math.min(students.length, 5); i++) {
      if (i < payments.length + 2) {
        const student = students[i];
        const payment = await prisma.feePayment.create({
          data: {
            receiptNo: `RCP-${new Date().getFullYear()}-${String(i + 1).padStart(3, '0')}`,
            studentId: student.id,
            feeStructureId: feeStructures[Math.floor(Math.random() * 3)].id,
            amount: feeStructures[0].amount,
            totalAmount: feeStructures[0].amount,
            paymentStatus: i % 2 === 0 ? 'PAID' : 'OVERDUE',
            paymentMethod: ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER'][Math.floor(Math.random() * 4)] as any,
            paymentDate: i % 2 === 0 ? new Date() : undefined,
            transactionId: i % 2 === 0 ? `TXN-2024-${String(i).padStart(5, '0')}` : undefined,
            forMonth: new Date(new Date().getFullYear(), new Date().getMonth() - (i % 3)),
          },
        });
        payments.push(payment);
      }
    }

    console.log(`✅ Created ${payments.length} payments\n`);

    // 7. Summary
    console.log('✨ Finance Module Seed Completed Successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Fee Structures: ${feeStructures.length}`);
    console.log(`   - Invoices: ${invoices.length}`);
    console.log(`   - Payments: ${payments.length}`);
    console.log(`   - Students with invoices: ${new Set(invoices.map((i) => i.studentId)).size}`);
    console.log(`\n🎉 Ready to test Finance module pages!`);

    await prisma.$disconnect();
  } catch (error: any) {
    console.error('❌ Seed Error:', error.message || error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seedFinanceData();
