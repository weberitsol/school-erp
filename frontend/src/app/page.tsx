import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-xl font-bold text-white">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              School ERP
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-primary"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Future-Ready
            <span className="text-primary"> School Management</span>
            <br />
            Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            An intelligent, multilingual school management system with AI-powered
            document processing. Upload any PDF and auto-generate tests instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 text-lg font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 text-lg font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              View Features
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="mt-32 grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon="🤖"
            title="AI Document Parser"
            description="Upload PDF/Word files and let AI extract questions automatically. Generate tests in seconds."
          />
          <FeatureCard
            icon="🌐"
            title="Multilingual Support"
            description="20+ languages with RTL support. Hindi, Arabic, Chinese, and more."
          />
          <FeatureCard
            icon="📱"
            title="Mobile Apps"
            description="Native Android & iOS apps for teachers, students, and parents."
          />
          <FeatureCard
            icon="📊"
            title="Smart Analytics"
            description="Real-time dashboards, performance tracking, and predictive insights."
          />
          <FeatureCard
            icon="💰"
            title="Fee Management"
            description="Online payments, installments, reminders, and financial reports."
          />
          <FeatureCard
            icon="📚"
            title="Complete ERP"
            description="Attendance, exams, transport, library, hostel - all in one platform."
          />
        </div>

        {/* Roles Section */}
        <div className="mt-32">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Built for Everyone
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <RoleCard
              role="Admin"
              color="bg-cyan-500"
              description="Complete control over school operations"
            />
            <RoleCard
              role="Teacher"
              color="bg-green-500"
              description="Attendance, grading, AI test creation"
            />
            <RoleCard
              role="Student"
              color="bg-purple-500"
              description="Online tests, assignments, progress"
            />
            <RoleCard
              role="Parent"
              color="bg-red-500"
              description="Child tracking, fees, communication"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>School ERP - Future-Ready Education Management</p>
          <p className="mt-2 text-sm">Built with Next.js, Express, and AI</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}

function RoleCard({
  role,
  color,
  description,
}: {
  role: string;
  color: string;
  description: string;
}) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-center">
      <div
        className={`w-16 h-16 ${color} rounded-full flex items-center justify-center mx-auto mb-4`}
      >
        <span className="text-2xl font-bold text-white">{role[0]}</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {role}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}
