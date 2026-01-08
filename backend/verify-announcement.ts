import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAnnouncementData() {
  try {
    console.log('📊 Verifying Announcement Module Data...\n');

    // Get announcements with full details
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'asc' },
    });

    console.log(`✅ Total Announcements: ${announcements.length}\n`);

    // Display each announcement
    announcements.forEach((ann, index) => {
      const status = ann.isPublished ? '📢 Published' : '📝 Draft';
      const audiences = ann.targetAudience.join(', ');
      const hasExpiry = ann.expiresAt ? new Date(ann.expiresAt).toLocaleDateString() : 'No expiry';
      const classInfo = ann.targetClasses.length > 0 ? ` (${ann.targetClasses.length} classes)` : ' (All classes)';

      console.log(`${index + 1}. [${status}] ${ann.title}`);
      console.log(`   📋 Content: ${ann.content.substring(0, 60)}...`);
      console.log(`   👥 Audience: ${audiences}`);
      console.log(`   📚 Classes${classInfo}`);
      console.log(`   📎 Attachments: ${ann.attachments.length > 0 ? ann.attachments.join(', ') : 'None'}`);
      console.log(`   ⏰ Expires: ${hasExpiry}`);
      console.log(`   📅 Published: ${ann.publishedAt ? new Date(ann.publishedAt).toLocaleDateString() : 'Not published'}`);
      console.log();
    });

    // Statistics
    console.log('📈 Statistics:');
    const now = new Date();

    const publishedCount = announcements.filter(a => a.isPublished).length;
    const draftCount = announcements.filter(a => !a.isPublished).length;
    const activeCount = announcements.filter(
      a => a.isPublished && (!a.expiresAt || new Date(a.expiresAt) > now)
    ).length;
    const expiredCount = announcements.filter(
      a => a.isPublished && a.expiresAt && new Date(a.expiresAt) <= now
    ).length;

    console.log(`   - Total: ${announcements.length}`);
    console.log(`   - Published: ${publishedCount}`);
    console.log(`   - Drafts: ${draftCount}`);
    console.log(`   - Active (not expired): ${activeCount}`);
    console.log(`   - Expired: ${expiredCount}`);

    // Audience coverage
    console.log('\n👥 Audience Coverage:');
    const audienceCounts: Record<string, number> = {};
    announcements.forEach(ann => {
      ann.targetAudience.forEach(aud => {
        audienceCounts[aud] = (audienceCounts[aud] || 0) + 1;
      });
    });

    Object.entries(audienceCounts).forEach(([audience, count]) => {
      console.log(`   - ${audience}: ${count} announcements`);
    });

    console.log('\n🎉 Announcement data verification complete!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

verifyAnnouncementData();
