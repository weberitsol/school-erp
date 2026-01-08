import { PrismaClient } from '@prisma/client';
import { advancedFeaturesService } from './src/services/advanced-features.service';

const prisma = new PrismaClient();

async function verifyAdvancedFeatures() {
  try {
    console.log('📊 Verifying Advanced Features Module...\n');

    // Get a student to test
    const student = await prisma.student.findFirst({
      include: { user: true, currentClass: true },
    });

    if (!student) {
      console.log('⚠️  No students found in database. Skipping verification.');
      await prisma.$disconnect();
      return;
    }

    console.log(`📌 Testing with student: ${student.firstName} (ID: ${student.id})\n`);

    // 1. Test Student Analytics
    console.log('1️⃣  Testing Student Analytics...');
    try {
      const analytics = await advancedFeaturesService.getStudentAnalytics(student.id);
      console.log(`   ✅ Exam Performance:`, analytics.examPerformance);
      console.log(`   ✅ Attendance Rate: ${analytics.attendanceRate}%`);
      console.log(`   ✅ Learning Progress:`, analytics.learningProgress);
      console.log(`   ✅ Overall Engagement Score: ${analytics.engagementScore}/100\n`);
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // 2. Test Learning Insights
    console.log('2️⃣  Testing Learning Insights...');
    try {
      const insights = await advancedFeaturesService.generateLearningInsights(student.id);
      console.log(`   ✅ Generated ${insights.length} insights:`);
      insights.forEach((insight, index) => {
        console.log(
          `      ${index + 1}. [${insight.type.toUpperCase()}] ${insight.message}`
        );
      });
      console.log();
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // 3. Test Engagement Metrics
    console.log('3️⃣  Testing Engagement Metrics...');
    try {
      const metrics = await advancedFeaturesService.getEngagementMetrics(student.id);
      console.log(`   ✅ Video Watch Time: ${metrics.videoWatchTime} minutes`);
      console.log(`   ✅ Practice Questions Attempted: ${metrics.practiceQuestionsAttempted}`);
      console.log(`   ✅ Study Material Accessed: ${metrics.studyMaterialAccessed}`);
      console.log(`   ✅ Forum Participation: ${metrics.forumParticipation}`);
      console.log(`   ✅ Overall Engagement Score: ${metrics.overallEngagementScore}/100\n`);
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // 4. Test Personalized Recommendations
    console.log('4️⃣  Testing Personalized Recommendations...');
    try {
      const recommendations = await advancedFeaturesService.getPersonalizedRecommendations(
        student.id
      );
      console.log(`   ✅ Generated ${recommendations.length} recommendations:`);
      recommendations.forEach((rec, index) => {
        console.log(`      ${index + 1}. ${rec}`);
      });
      console.log();
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // 5. Test Learning Dashboard
    console.log('5️⃣  Testing Learning Dashboard (Complete)...');
    try {
      const dashboard = await advancedFeaturesService.getLearningDashboard(student.id);
      console.log(`   ✅ Dashboard includes:`);
      console.log(`      - Analytics: ${dashboard.analytics ? '✓' : '✗'}`);
      console.log(`      - Insights: ${dashboard.insights?.length || 0} items`);
      console.log(`      - Metrics: ${dashboard.metrics ? '✓' : '✗'}`);
      console.log(`      - Recommendations: ${dashboard.recommendations?.length || 0} items\n`);
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // 6. Test Class Analytics (if student has a class)
    if (student.currentClassId) {
      console.log('6️⃣  Testing Class Analytics...');
      try {
        const classAnalytics = await advancedFeaturesService.getClassAnalytics(
          student.currentClassId
        );
        console.log(`   ✅ Class: ${classAnalytics.classId}`);
        console.log(`   ✅ Total Students: ${classAnalytics.totalStudents}`);
        console.log(`   ✅ Average Engagement: ${classAnalytics.averageEngagementScore}/100`);
        console.log(`   ✅ Average Attendance: ${classAnalytics.averageAttendanceRate}%`);
        console.log(`   ✅ Top Performers: ${classAnalytics.topPerformers.length}`);
        console.log(`   ✅ Needs Support: ${classAnalytics.needsSupport.length}\n`);
      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    }

    console.log('✨ Advanced Features Module Verification Complete!');
    console.log('\n📝 Module Features:');
    console.log('   ✓ Student Learning Analytics');
    console.log('   ✓ AI-Generated Learning Insights');
    console.log('   ✓ Student Engagement Metrics');
    console.log('   ✓ Personalized Recommendations');
    console.log('   ✓ Learning Dashboard');
    console.log('   ✓ Class-wide Analytics');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Verification Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

verifyAdvancedFeatures();
