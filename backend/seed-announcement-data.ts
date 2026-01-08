import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAnnouncementData() {
  try {
    console.log('🌱 Starting Announcement Module Seed...\n');

    // 1. Get school
    const school = await prisma.school.findFirst();
    if (!school) {
      throw new Error('No school found. Please create a school first.');
    }
    console.log(`📍 Using school: ${school.name}\n`);

    // 2. Clean existing announcement data
    console.log('🧹 Cleaning up existing announcement data...');
    await prisma.announcement.deleteMany({});
    console.log('✅ Cleaned up existing data\n');

    // 3. Get admin user
    console.log('👤 Getting admin user...');
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN', schoolId: school.id },
    });

    if (!adminUser) {
      throw new Error('No admin user found. Please create an admin user first.');
    }
    console.log(`✅ Using admin: ${adminUser.email}\n`);

    // 4. Get some classes for targeted announcements
    const classes = await prisma.class.findMany({
      where: { schoolId: school.id },
      take: 3,
    });
    console.log(`✅ Found ${classes.length} classes\n`);

    // 5. Create announcements
    console.log('📢 Creating Announcements...');

    // Announcement 1: School Holiday - All audiences, published, no expiry
    const ann1 = await prisma.announcement.create({
      data: {
        title: 'School Holiday Notice',
        content: 'The school will remain closed on 26th January 2025 for Republic Day celebration. Regular classes will resume on 27th January 2025.',
        schoolId: school.id,
        createdById: adminUser.id,
        targetAudience: ['ALL'],
        targetClasses: [],
        attachments: [],
        isPublished: true,
        publishedAt: new Date('2025-01-20'),
      },
    });
    console.log(`   ✅ Created: "${ann1.title}"`);

    // Announcement 2: Important Notice - Teachers, students, parents, with expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const ann2 = await prisma.announcement.create({
      data: {
        title: 'Annual Examination Schedule Released',
        content: 'The annual examination schedule for all classes has been released. Students should prepare according to their class timings. Detailed schedule is attached below.',
        schoolId: school.id,
        createdById: adminUser.id,
        targetAudience: ['TEACHERS', 'STUDENTS', 'PARENTS'],
        targetClasses: classes.slice(0, 2).map(c => c.id),
        attachments: ['exam_schedule_2025.pdf'],
        isPublished: true,
        publishedAt: new Date('2025-01-15'),
        expiresAt,
      },
    });
    console.log(`   ✅ Created: "${ann2.title}"`);

    // Announcement 3: Parent-Teacher Meeting - Parents and teachers only, published
    const ann3 = await prisma.announcement.create({
      data: {
        title: 'Parent-Teacher Meeting Schedule',
        content: 'Parent-teacher meeting will be held on every Saturday from 10:00 AM to 1:00 PM. Parents are requested to meet teachers to discuss their ward\'s academic progress.',
        schoolId: school.id,
        createdById: adminUser.id,
        targetAudience: ['PARENTS', 'TEACHERS'],
        targetClasses: [],
        attachments: [],
        isPublished: true,
        publishedAt: new Date('2025-01-10'),
      },
    });
    console.log(`   ✅ Created: "${ann3.title}"`);

    // Announcement 4: Sports Event - Students only, published
    const ann4 = await prisma.announcement.create({
      data: {
        title: 'Annual Sports Day Announcement',
        content: 'Annual sports day will be held on 15th February 2025. All students are requested to participate in various events like running, jumping, ball games, and team sports. Registration details will be shared soon.',
        schoolId: school.id,
        createdById: adminUser.id,
        targetAudience: ['STUDENTS'],
        targetClasses: classes.slice(0, 1).map(c => c.id),
        attachments: ['sports_event_rules.pdf', 'event_list.pdf'],
        isPublished: true,
        publishedAt: new Date('2025-01-08'),
      },
    });
    console.log(`   ✅ Created: "${ann4.title}"`);

    // Announcement 5: Library Update - Teachers, not published (draft)
    const ann5 = await prisma.announcement.create({
      data: {
        title: 'New Books Added to Library',
        content: 'The school library has recently acquired new books in various categories. Teachers are requested to guide their students to visit the library and avail the new reading materials.',
        schoolId: school.id,
        createdById: adminUser.id,
        targetAudience: ['TEACHERS'],
        targetClasses: [],
        attachments: [],
        isPublished: false,
      },
    });
    console.log(`   ✅ Created: "${ann5.title}" (Draft)`);

    // Announcement 6: Fees Related - Parents only, published, expired
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 5);

    const ann6 = await prisma.announcement.create({
      data: {
        title: 'Fee Submission Deadline Extended',
        content: 'The fee submission deadline has been extended to 31st January 2025. Parents are requested to complete the fee payment before the deadline to avoid late charges.',
        schoolId: school.id,
        createdById: adminUser.id,
        targetAudience: ['PARENTS'],
        targetClasses: [],
        attachments: ['fee_schedule.pdf'],
        isPublished: true,
        publishedAt: new Date('2024-12-30'),
        expiresAt: expiredDate,
      },
    });
    console.log(`   ✅ Created: "${ann6.title}" (Expired)`);

    // Announcement 7: Class Specific - All audiences, specific classes, published
    const ann7 = await prisma.announcement.create({
      data: {
        title: 'Class 10 & 12 Board Exam Preparation',
        content: 'Special coaching classes for board exam preparation will start from 1st February 2025. Classes will be held on weekdays from 4:00 PM to 6:00 PM. All students must attend these sessions.',
        schoolId: school.id,
        createdById: adminUser.id,
        targetAudience: ['ALL'],
        targetClasses: classes.length >= 3 ? classes.slice(1, 3).map(c => c.id) : [],
        attachments: [],
        isPublished: true,
        publishedAt: new Date('2025-01-12'),
      },
    });
    console.log(`   ✅ Created: "${ann7.title}"`);

    // Announcement 8: Important Emergency - All audiences, published
    const ann8 = await prisma.announcement.create({
      data: {
        title: 'Updated COVID-19 Safety Guidelines',
        content: 'In light of recent developments, the school has updated its COVID-19 safety guidelines. All students, teachers, and staff must follow the guidelines strictly. Health and safety remain our top priority.',
        schoolId: school.id,
        createdById: adminUser.id,
        targetAudience: ['ALL'],
        targetClasses: [],
        attachments: ['covid_guidelines_2025.pdf'],
        isPublished: true,
        publishedAt: new Date('2025-01-18'),
      },
    });
    console.log(`   ✅ Created: "${ann8.title}"`);

    console.log(`\n✅ Created 8 announcements\n`);

    // 6. Get statistics
    console.log('📈 Announcement Summary:');
    const totalCount = await prisma.announcement.count();
    const publishedCount = await prisma.announcement.count({ where: { isPublished: true } });
    const draftCount = await prisma.announcement.count({ where: { isPublished: false } });

    const now = new Date();
    const activeCount = await prisma.announcement.count({
      where: {
        isPublished: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });

    const expiredCount = await prisma.announcement.count({
      where: {
        isPublished: true,
        expiresAt: { lte: now },
      },
    });

    console.log(`   - Total Announcements: ${totalCount}`);
    console.log(`   - Published: ${publishedCount}`);
    console.log(`   - Drafts: ${draftCount}`);
    console.log(`   - Active: ${activeCount}`);
    console.log(`   - Expired: ${expiredCount}`);

    // 7. Print details
    console.log('\n📋 Announcement Details:');
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'asc' },
    });

    announcements.forEach((ann, index) => {
      const status = ann.isPublished ? '📢' : '📝';
      const audiences = ann.targetAudience.join(', ');
      const hasExpiry = ann.expiresAt ? '⏰' : '∞';
      console.log(
        `   ${index + 1}. ${status} ${ann.title.substring(0, 40)}... [${audiences}] ${hasExpiry}`
      );
    });

    console.log('\n🎉 Announcement Module Seed Completed Successfully!');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Seed Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seedAnnouncementData();
