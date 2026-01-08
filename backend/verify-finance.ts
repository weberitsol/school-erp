import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyFinanceData() {
  try {
    console.log('📊 Verifying Finance Module Data...\n');

    // Count fee structures
    const feeStructures = await prisma.feeStructure.findMany({});
    console.log(`✅ Fee Structures: ${feeStructures.length}`);
    feeStructures.forEach((fs) => {
      console.log(`   - ${fs.name} (${fs.frequency}): ₹${fs.amount}`);
    });

    // Count invoices with details
    const invoices = await prisma.feeInvoice.findMany({
      include: { lineItems: true, student: true },
    });
    console.log(`\n✅ Invoices: ${invoices.length}`);
    invoices.forEach((inv) => {
      console.log(`   - ${inv.invoiceNo} (${inv.status}): ₹${inv.totalAmount}`);
      console.log(`     Student: ${inv.student.firstName} ${inv.student.lastName}`);
      console.log(`     Line Items: ${inv.lineItems.length}`);
    });

    // Count payments
    const payments = await prisma.feePayment.findMany({});
    console.log(`\n✅ Payments: ${payments.length}`);
    payments.forEach((payment) => {
      console.log(`   - ${payment.receiptNo} (${payment.paymentStatus}): ₹${payment.amount}`);
    });

    console.log('\n🎉 Finance data verification complete!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

verifyFinanceData();
