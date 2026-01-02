// app.config.js - Dynamic Expo configuration for multiple app builds
// This allows building 4 separate apps from the same codebase

const APP_VARIANT = process.env.APP_VARIANT || 'student';

const appConfig = {
  student: {
    name: 'School ERP - Student',
    slug: 'school-erp-student',
    bundleIdentifier: 'com.schoolerp.student',
    package: 'com.schoolerp.student',
    icon: './assets/icons/student-icon.png',
    splash: {
      backgroundColor: '#4F46E5', // Indigo
    },
  },
  teacher: {
    name: 'School ERP - Teacher',
    slug: 'school-erp-teacher',
    bundleIdentifier: 'com.schoolerp.teacher',
    package: 'com.schoolerp.teacher',
    icon: './assets/icons/teacher-icon.png',
    splash: {
      backgroundColor: '#059669', // Emerald
    },
  },
  parent: {
    name: 'School ERP - Parent',
    slug: 'school-erp-parent',
    bundleIdentifier: 'com.schoolerp.parent',
    package: 'com.schoolerp.parent',
    icon: './assets/icons/parent-icon.png',
    splash: {
      backgroundColor: '#D97706', // Amber
    },
  },
  admin: {
    name: 'School ERP - Admin',
    slug: 'school-erp-admin',
    bundleIdentifier: 'com.schoolerp.admin',
    package: 'com.schoolerp.admin',
    icon: './assets/icons/admin-icon.png',
    splash: {
      backgroundColor: '#DC2626', // Red
    },
  },
};

const config = appConfig[APP_VARIANT];

export default {
  expo: {
    name: config.name,
    slug: config.slug,
    version: '1.0.0',
    orientation: 'portrait',
    icon: config.icon,
    scheme: config.slug,
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: config.splash.backgroundColor,
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: config.bundleIdentifier,
      infoPlist: {
        NSCameraUsageDescription: 'This app uses the camera to take photos for profile and documents.',
        NSPhotoLibraryUsageDescription: 'This app accesses your photos to upload profile pictures and documents.',
        NSLocationWhenInUseUsageDescription: 'This app needs your location to track bus position and provide accurate ETA.',
        NSLocationAlwaysAndWhenInUseUsageDescription: 'This app needs your location in the background to track bus position.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: config.icon,
        backgroundColor: config.splash.backgroundColor,
      },
      package: config.package,
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
      ],
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: config.splash.backgroundColor,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      appVariant: APP_VARIANT,
      apiUrl: process.env.API_URL || 'http://localhost:5000/api/v1',
      eas: {
        projectId: 'your-eas-project-id',
      },
    },
  },
};
