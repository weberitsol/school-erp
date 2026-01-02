# School ERP - Technical Specifications

**Version:** 1.0
**Date:** 2025-12-16
**Authors:** Amelia (Developer) + Barry (Quick Flow Solo Dev)
**Status:** Technical Blueprint

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SCHOOL ERP PLATFORM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    CLIENTS                          │           CDN                         │
│    ┌──────────────┐                 │      ┌──────────────┐                │
│    │ Web App      │                 │      │ CloudFront/  │                │
│    │ (React/Next) │─────────────────┼─────>│ Azure CDN    │                │
│    ├──────────────┤                 │      └──────────────┘                │
│    │ Mobile Apps  │                 │             │                         │
│    │ (Flutter)    │                 │             ▼                         │
│    ├──────────────┤                 │      ┌──────────────┐                │
│    │ Admin Portal │                 │      │ Load Balancer│                │
│    │ (React)      │                 │      │ (ALB/NGINX)  │                │
│    └──────────────┘                 │      └──────────────┘                │
│                                     │             │                         │
├─────────────────────────────────────┼─────────────┼─────────────────────────┤
│                                     │             ▼                         │
│    API GATEWAY                      │      ┌──────────────┐                │
│    ┌──────────────────────────────────────│ Kong/AWS API │                │
│    │ • Rate Limiting                │     │ Gateway      │                │
│    │ • Authentication               │      └──────────────┘                │
│    │ • Request Routing              │             │                         │
│    │ • API Versioning               │             │                         │
│    └──────────────────────────────────────────────┼─────────────────────────┤
│                                     │             │                         │
│    MICROSERVICES                    │             ▼                         │
│    ┌─────────────────────────────────────────────────────────────────────┐ │
│    │                                                                      │ │
│    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │
│    │  │ Identity │ │ Academic │ │  Exam    │ │ Finance  │ │ Comms    │ │ │
│    │  │ Service  │ │ Service  │ │ Service  │ │ Service  │ │ Service  │ │ │
│    │  │ (NestJS) │ │ (NestJS) │ │ (NestJS) │ │ (NestJS) │ │ (NestJS) │ │ │
│    │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │ │
│    │                                                                      │ │
│    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │ │
│    │  │ Document │ │ Analytics│ │ Transport│ │ Library  │              │ │
│    │  │ AI Svc   │ │ Service  │ │ Service  │ │ Service  │              │ │
│    │  │ (Python) │ │ (NestJS) │ │ (NestJS) │ │ (NestJS) │              │ │
│    │  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │ │
│    └─────────────────────────────────────────────────────────────────────┘ │
│                                     │                                       │
├─────────────────────────────────────┼───────────────────────────────────────┤
│                                     │                                       │
│    DATA LAYER                       │                                       │
│    ┌─────────────────────────────────────────────────────────────────────┐ │
│    │                                                                      │ │
│    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │
│    │  │PostgreSQL│ │ MongoDB  │ │  Redis   │ │ Elastic  │ │ S3/Blob  │ │ │
│    │  │ (Primary)│ │ (Docs)   │ │ (Cache)  │ │ (Search) │ │ (Files)  │ │ │
│    │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │ │
│    │                                                                      │ │
│    └─────────────────────────────────────────────────────────────────────┘ │
│                                     │                                       │
├─────────────────────────────────────┼───────────────────────────────────────┤
│                                     │                                       │
│    INFRASTRUCTURE                   │                                       │
│    ┌─────────────────────────────────────────────────────────────────────┐ │
│    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │ │
│    │  │Kubernetes│ │ Docker   │ │ Terraform│ │ GitHub   │              │ │
│    │  │ (EKS/AKS)│ │ Registry │ │ (IaC)    │ │ Actions  │              │ │
│    │  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │ │
│    └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Decisions

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Frontend Web** | Next.js 14 + React 18 | SSR, great DX, large ecosystem |
| **Mobile Apps** | Flutter 3.x | Single codebase for iOS/Android, great performance |
| **API Services** | NestJS (TypeScript) | Enterprise patterns, TypeScript, modular |
| **AI Service** | FastAPI (Python) | ML ecosystem, async, high performance |
| **Primary DB** | PostgreSQL 15 | ACID, JSON support, excellent performance |
| **Document DB** | MongoDB 7 | Flexible schema for parsed content |
| **Cache** | Redis 7 | Session, cache, pub/sub, queues |
| **Search** | Elasticsearch 8 | Full-text search, analytics |
| **Message Queue** | Bull (Redis-based) | Simple, reliable, good monitoring |
| **File Storage** | AWS S3 / Azure Blob | Scalable, CDN-ready |
| **Container Orchestration** | Kubernetes | Auto-scaling, self-healing |
| **CI/CD** | GitHub Actions | Integrated, powerful, free tier |

---

## 2. Backend Architecture

### 2.1 Microservices Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    MICROSERVICES MAP                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Core Services (NestJS)                                         │
│  ├── identity-service      (Port 3001)                         │
│  │   └── Auth, Users, Roles, Permissions, SSO                  │
│  ├── academic-service      (Port 3002)                         │
│  │   └── Classes, Subjects, Timetable, Curriculum              │
│  ├── student-service       (Port 3003)                         │
│  │   └── Students, Guardians, Enrollment, Attendance           │
│  ├── exam-service          (Port 3004)                         │
│  │   └── Exams, Tests, Assignments, Grading, Reports           │
│  ├── finance-service       (Port 3005)                         │
│  │   └── Fees, Payments, Invoices, Refunds                     │
│  └── communication-service (Port 3006)                         │
│      └── Announcements, Messages, Notifications                │
│                                                                 │
│  AI Services (Python/FastAPI)                                   │
│  └── document-ai-service   (Port 8001)                         │
│      └── Document parsing, Question detection, Generation      │
│                                                                 │
│  Extended Services (NestJS)                                     │
│  ├── transport-service     (Port 3007)                         │
│  ├── library-service       (Port 3008)                         │
│  ├── hostel-service        (Port 3009)                         │
│  ├── hr-service            (Port 3010)                         │
│  └── analytics-service     (Port 3011)                         │
│                                                                 │
│  Shared Services                                                │
│  ├── notification-worker   (Background)                        │
│  ├── report-generator      (Background)                        │
│  └── scheduler-service     (Cron jobs)                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 NestJS Service Structure

```
school-erp-backend/
├── apps/
│   ├── api-gateway/                 # Main API Gateway
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   └── config/
│   │   └── Dockerfile
│   │
│   ├── identity-service/            # Identity & Access
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   ├── google.strategy.ts
│   │   │   │   │   └── local.strategy.ts
│   │   │   │   └── guards/
│   │   │   ├── users/
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   ├── dto/
│   │   │   │   └── entities/
│   │   │   ├── roles/
│   │   │   └── permissions/
│   │   └── Dockerfile
│   │
│   ├── academic-service/
│   ├── student-service/
│   ├── exam-service/
│   ├── finance-service/
│   └── communication-service/
│
├── libs/
│   ├── common/                      # Shared utilities
│   │   ├── src/
│   │   │   ├── decorators/
│   │   │   ├── filters/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   ├── pipes/
│   │   │   └── utils/
│   │   └── package.json
│   │
│   ├── database/                    # Database module
│   │   ├── src/
│   │   │   ├── postgres/
│   │   │   ├── mongodb/
│   │   │   └── redis/
│   │   └── package.json
│   │
│   ├── dto/                         # Shared DTOs
│   │   └── src/
│   │
│   └── interfaces/                  # TypeScript interfaces
│       └── src/
│
├── prisma/                          # Prisma schema
│   └── schema.prisma
│
├── docker-compose.yml
├── nest-cli.json
├── package.json
└── tsconfig.json
```

### 2.3 API Gateway Configuration

```typescript
// apps/api-gateway/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Service Proxies
    IdentityProxyModule,
    AcademicProxyModule,
    StudentProxyModule,
    ExamProxyModule,
    FinanceProxyModule,
    CommunicationProxyModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
```

### 2.4 Authentication Flow

```typescript
// libs/common/src/guards/jwt-auth.guard.ts

import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}

// JWT Token Structure
interface JwtPayload {
  sub: string;           // User ID
  email: string;
  tenantId: string;      // School/Tenant ID
  role: string;          // Role code
  permissions: string[]; // Permission codes
  iat: number;
  exp: number;
}

// Token Generation
@Injectable()
export class AuthService {
  async generateTokens(user: User, tenant: Tenant) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: tenant.id,
      role: user.role.code,
      permissions: user.role.permissions.map(p => p.code),
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '7d' }
    );

    // Store refresh token in Redis
    await this.redis.set(
      `refresh_token:${user.id}`,
      refreshToken,
      'EX',
      7 * 24 * 60 * 60
    );

    return { accessToken, refreshToken };
  }
}
```

### 2.5 Multi-Tenancy Implementation

```typescript
// libs/common/src/middleware/tenant.middleware.ts

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Extract tenant from JWT or subdomain
    const tenantId = req.user?.tenantId ||
                     this.extractFromSubdomain(req) ||
                     req.headers['x-tenant-id'];

    if (!tenantId) {
      throw new UnauthorizedException('Tenant not identified');
    }

    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant || tenant.status !== 'active') {
      throw new ForbiddenException('Invalid or inactive tenant');
    }

    // Attach tenant to request
    req.tenant = tenant;

    // Set PostgreSQL schema for this request
    await this.tenantService.setSchema(tenant.schemaName);

    next();
  }

  private extractFromSubdomain(req: Request): string | null {
    const host = req.headers.host;
    // school1.schoolerp.com → school1
    const match = host?.match(/^([^.]+)\.schoolerp\.com/);
    return match ? match[1] : null;
  }
}

// Prisma with dynamic schema
@Injectable()
export class TenantService {
  async setSchema(schemaName: string) {
    await this.prisma.$executeRawUnsafe(
      `SET search_path TO "${schemaName}", public`
    );
  }
}
```

---

## 3. Frontend Architecture

### 3.1 Web Application (Next.js)

```
school-erp-web/
├── src/
│   ├── app/                         # App Router (Next.js 14)
│   │   ├── (auth)/                  # Auth group
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   │
│   │   ├── (dashboard)/             # Protected routes
│   │   │   ├── layout.tsx           # Dashboard layout
│   │   │   ├── page.tsx             # Dashboard home
│   │   │   │
│   │   │   ├── students/
│   │   │   │   ├── page.tsx         # Student list
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx     # Student detail
│   │   │   │   └── new/
│   │   │   │       └── page.tsx     # Add student
│   │   │   │
│   │   │   ├── academics/
│   │   │   │   ├── classes/
│   │   │   │   ├── subjects/
│   │   │   │   └── timetable/
│   │   │   │
│   │   │   ├── examinations/
│   │   │   │   ├── exams/
│   │   │   │   ├── tests/
│   │   │   │   ├── assignments/
│   │   │   │   ├── question-bank/
│   │   │   │   └── document-parser/  # AI Document Upload
│   │   │   │
│   │   │   ├── finance/
│   │   │   │   ├── fees/
│   │   │   │   ├── payments/
│   │   │   │   └── reports/
│   │   │   │
│   │   │   ├── attendance/
│   │   │   ├── communication/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   │
│   │   ├── api/                     # API Routes
│   │   │   └── [...proxy]/
│   │   │
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Landing page
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   │
│   │   ├── common/                  # Shared components
│   │   │   ├── DataTable/
│   │   │   ├── FileUpload/
│   │   │   ├── LanguageSelector/
│   │   │   └── ...
│   │   │
│   │   ├── forms/                   # Form components
│   │   │   ├── StudentForm/
│   │   │   ├── ExamForm/
│   │   │   └── ...
│   │   │
│   │   └── layouts/
│   │       ├── DashboardLayout/
│   │       ├── AuthLayout/
│   │       └── Sidebar/
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useStudents.ts
│   │   ├── useDebounce.ts
│   │   └── ...
│   │
│   ├── lib/
│   │   ├── api/                     # API client
│   │   │   ├── client.ts
│   │   │   ├── students.ts
│   │   │   ├── exams.ts
│   │   │   └── ...
│   │   │
│   │   ├── i18n/                    # Internationalization
│   │   │   ├── config.ts
│   │   │   └── locales/
│   │   │       ├── en.json
│   │   │       ├── hi.json
│   │   │       ├── ar.json
│   │   │       └── ...
│   │   │
│   │   └── utils/
│   │       ├── formatters.ts
│   │       ├── validators.ts
│   │       └── ...
│   │
│   ├── providers/
│   │   ├── AuthProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   ├── QueryProvider.tsx
│   │   └── I18nProvider.tsx
│   │
│   ├── store/                       # Zustand stores
│   │   ├── authStore.ts
│   │   ├── uiStore.ts
│   │   └── ...
│   │
│   └── types/
│       ├── api.ts
│       ├── student.ts
│       └── ...
│
├── public/
│   ├── locales/                     # Translation files
│   └── images/
│
├── tailwind.config.ts
├── next.config.js
└── package.json
```

### 3.2 State Management (Zustand + React Query)

```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, tenant: Tenant, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, tenant, token) =>
        set({
          user,
          tenant,
          accessToken: token,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          tenant: null,
          accessToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

// src/hooks/useStudents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '@/lib/api/students';

export function useStudents(filters?: StudentFilters) {
  return useQuery({
    queryKey: ['students', filters],
    queryFn: () => studentApi.getAll(filters),
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: () => studentApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studentApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}
```

### 3.3 Internationalization Setup

```typescript
// src/lib/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

export const supportedLanguages = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'hi', name: 'हिंदी', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
  { code: 'es', name: 'Español', dir: 'ltr' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
  { code: 'zh', name: '中文', dir: 'ltr' },
  { code: 'ta', name: 'தமிழ்', dir: 'ltr' },
  { code: 'te', name: 'తెలుగు', dir: 'ltr' },
];

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: supportedLanguages.map(l => l.code),
    ns: ['common', 'dashboard', 'students', 'exams', 'finance'],
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

// Usage in components
import { useTranslation } from 'react-i18next';

function StudentList() {
  const { t } = useTranslation('students');

  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{t('addStudent')}</button>
    </div>
  );
}

// Locale file: /public/locales/en/students.json
{
  "title": "Students",
  "addStudent": "Add Student",
  "columns": {
    "name": "Name",
    "admissionNo": "Admission No",
    "class": "Class",
    "section": "Section"
  }
}

// Locale file: /public/locales/hi/students.json
{
  "title": "छात्र",
  "addStudent": "छात्र जोड़ें",
  "columns": {
    "name": "नाम",
    "admissionNo": "प्रवेश संख्या",
    "class": "कक्षा",
    "section": "अनुभाग"
  }
}
```

---

## 4. Mobile Application Architecture (Flutter)

### 4.1 Project Structure

```
school_erp_mobile/
├── lib/
│   ├── main.dart
│   ├── app.dart
│   │
│   ├── core/
│   │   ├── config/
│   │   │   ├── app_config.dart
│   │   │   ├── routes.dart
│   │   │   └── themes.dart
│   │   │
│   │   ├── constants/
│   │   │   ├── api_constants.dart
│   │   │   ├── storage_keys.dart
│   │   │   └── assets.dart
│   │   │
│   │   ├── network/
│   │   │   ├── api_client.dart
│   │   │   ├── api_interceptors.dart
│   │   │   └── network_info.dart
│   │   │
│   │   ├── storage/
│   │   │   ├── secure_storage.dart
│   │   │   └── local_storage.dart
│   │   │
│   │   ├── localization/
│   │   │   ├── app_localizations.dart
│   │   │   └── l10n/
│   │   │       ├── app_en.arb
│   │   │       ├── app_hi.arb
│   │   │       ├── app_ar.arb
│   │   │       └── ...
│   │   │
│   │   └── utils/
│   │       ├── validators.dart
│   │       ├── formatters.dart
│   │       └── helpers.dart
│   │
│   ├── data/
│   │   ├── models/
│   │   │   ├── user_model.dart
│   │   │   ├── student_model.dart
│   │   │   ├── attendance_model.dart
│   │   │   └── ...
│   │   │
│   │   ├── repositories/
│   │   │   ├── auth_repository.dart
│   │   │   ├── student_repository.dart
│   │   │   ├── attendance_repository.dart
│   │   │   └── ...
│   │   │
│   │   └── datasources/
│   │       ├── remote/
│   │       │   ├── auth_remote_datasource.dart
│   │       │   └── ...
│   │       └── local/
│   │           ├── auth_local_datasource.dart
│   │           └── ...
│   │
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── user.dart
│   │   │   ├── student.dart
│   │   │   └── ...
│   │   │
│   │   ├── repositories/
│   │   │   ├── i_auth_repository.dart
│   │   │   └── ...
│   │   │
│   │   └── usecases/
│   │       ├── auth/
│   │       │   ├── login_usecase.dart
│   │       │   ├── logout_usecase.dart
│   │       │   └── ...
│   │       └── ...
│   │
│   ├── presentation/
│   │   ├── bloc/                    # BLoC state management
│   │   │   ├── auth/
│   │   │   │   ├── auth_bloc.dart
│   │   │   │   ├── auth_event.dart
│   │   │   │   └── auth_state.dart
│   │   │   │
│   │   │   ├── attendance/
│   │   │   ├── students/
│   │   │   └── ...
│   │   │
│   │   ├── pages/
│   │   │   ├── splash/
│   │   │   │   └── splash_page.dart
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── login_page.dart
│   │   │   │   └── forgot_password_page.dart
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard_page.dart
│   │   │   │   └── widgets/
│   │   │   │
│   │   │   ├── students/
│   │   │   │   ├── student_list_page.dart
│   │   │   │   ├── student_detail_page.dart
│   │   │   │   └── widgets/
│   │   │   │
│   │   │   ├── attendance/
│   │   │   │   ├── mark_attendance_page.dart
│   │   │   │   └── attendance_report_page.dart
│   │   │   │
│   │   │   ├── exams/
│   │   │   │   ├── online_test_page.dart
│   │   │   │   ├── assignment_page.dart
│   │   │   │   └── results_page.dart
│   │   │   │
│   │   │   ├── fees/
│   │   │   │   ├── fee_status_page.dart
│   │   │   │   └── payment_page.dart
│   │   │   │
│   │   │   ├── communication/
│   │   │   │   ├── announcements_page.dart
│   │   │   │   └── messages_page.dart
│   │   │   │
│   │   │   └── settings/
│   │   │       ├── settings_page.dart
│   │   │       └── language_page.dart
│   │   │
│   │   └── widgets/
│   │       ├── common/
│   │       │   ├── app_button.dart
│   │       │   ├── app_text_field.dart
│   │       │   ├── loading_overlay.dart
│   │       │   └── ...
│   │       │
│   │       └── role_specific/
│   │           ├── teacher/
│   │           ├── student/
│   │           └── parent/
│   │
│   └── injection_container.dart      # Dependency injection
│
├── test/
│   ├── unit/
│   ├── widget/
│   └── integration/
│
├── android/
│   └── app/
│       └── build.gradle
│
├── ios/
│   └── Runner/
│       └── Info.plist
│
├── pubspec.yaml
└── analysis_options.yaml
```

### 4.2 Core Dependencies (pubspec.yaml)

```yaml
name: school_erp_mobile
description: School ERP Mobile Application
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter

  # State Management
  flutter_bloc: ^8.1.3
  equatable: ^2.0.5

  # Network
  dio: ^5.3.3
  connectivity_plus: ^5.0.1

  # Storage
  flutter_secure_storage: ^9.0.0
  shared_preferences: ^2.2.2
  hive_flutter: ^1.1.0

  # Navigation
  go_router: ^12.1.1

  # UI Components
  flutter_svg: ^2.0.9
  cached_network_image: ^3.3.0
  shimmer: ^3.0.0
  pull_to_refresh: ^2.0.0

  # Forms
  flutter_form_builder: ^9.1.1
  form_builder_validators: ^9.1.0

  # Camera & Files
  image_picker: ^1.0.4
  file_picker: ^6.1.1
  permission_handler: ^11.1.0

  # PDF
  flutter_pdfview: ^1.3.1
  pdf: ^3.10.6

  # Biometric Auth
  local_auth: ^2.1.7

  # Push Notifications
  firebase_core: ^2.24.2
  firebase_messaging: ^14.7.9

  # Analytics
  firebase_analytics: ^10.7.4

  # Payments
  razorpay_flutter: ^1.3.5  # For India
  # stripe_flutter: ^x.x.x   # For global

  # Localization
  intl: ^0.18.1

  # Utils
  logger: ^2.0.2+1
  get_it: ^7.6.4
  injectable: ^2.3.2
  freezed_annotation: ^2.4.1
  json_annotation: ^4.8.1
  dartz: ^0.10.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.1
  build_runner: ^2.4.7
  freezed: ^2.4.5
  json_serializable: ^6.7.1
  injectable_generator: ^2.4.1
  mockito: ^5.4.4
  bloc_test: ^9.1.5

flutter:
  uses-material-design: true
  generate: true  # For localization

  assets:
    - assets/images/
    - assets/icons/
    - assets/fonts/

  fonts:
    - family: Poppins
      fonts:
        - asset: assets/fonts/Poppins-Regular.ttf
        - asset: assets/fonts/Poppins-Medium.ttf
          weight: 500
        - asset: assets/fonts/Poppins-SemiBold.ttf
          weight: 600
        - asset: assets/fonts/Poppins-Bold.ttf
          weight: 700
```

### 4.3 API Client Implementation

```dart
// lib/core/network/api_client.dart

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  late final Dio _dio;
  final FlutterSecureStorage _storage;

  ApiClient(this._storage) {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    _dio.interceptors.addAll([
      AuthInterceptor(_storage),
      LoggingInterceptor(),
      RetryInterceptor(),
    ]);
  }

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    return _dio.get<T>(path, queryParameters: queryParameters);
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
  }) async {
    return _dio.post<T>(path, data: data);
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
  }) async {
    return _dio.put<T>(path, data: data);
  }

  Future<Response<T>> delete<T>(String path) async {
    return _dio.delete<T>(path);
  }

  Future<Response<T>> uploadFile<T>(
    String path,
    File file, {
    Map<String, dynamic>? additionalData,
    void Function(int, int)? onProgress,
  }) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        file.path,
        filename: file.path.split('/').last,
      ),
      ...?additionalData,
    });

    return _dio.post<T>(
      path,
      data: formData,
      onSendProgress: onProgress,
    );
  }
}

// Auth Interceptor
class AuthInterceptor extends Interceptor {
  final FlutterSecureStorage _storage;

  AuthInterceptor(this._storage);

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.read(key: StorageKeys.accessToken);
    final tenantId = await _storage.read(key: StorageKeys.tenantId);

    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    if (tenantId != null) {
      options.headers['X-Tenant-ID'] = tenantId;
    }

    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Try to refresh token
      final refreshed = await _refreshToken();
      if (refreshed) {
        // Retry the request
        final response = await _dio.fetch(err.requestOptions);
        return handler.resolve(response);
      }
    }
    handler.next(err);
  }

  Future<bool> _refreshToken() async {
    // Implementation
    return false;
  }
}
```

### 4.4 BLoC Pattern Implementation

```dart
// lib/presentation/bloc/attendance/attendance_bloc.dart

import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'attendance_event.dart';
part 'attendance_state.dart';
part 'attendance_bloc.freezed.dart';

class AttendanceBloc extends Bloc<AttendanceEvent, AttendanceState> {
  final MarkAttendanceUseCase _markAttendanceUseCase;
  final GetAttendanceUseCase _getAttendanceUseCase;

  AttendanceBloc({
    required MarkAttendanceUseCase markAttendanceUseCase,
    required GetAttendanceUseCase getAttendanceUseCase,
  })  : _markAttendanceUseCase = markAttendanceUseCase,
        _getAttendanceUseCase = getAttendanceUseCase,
        super(const AttendanceState.initial()) {
    on<LoadStudentsForAttendance>(_onLoadStudents);
    on<MarkStudentAttendance>(_onMarkAttendance);
    on<SubmitAttendance>(_onSubmitAttendance);
  }

  Future<void> _onLoadStudents(
    LoadStudentsForAttendance event,
    Emitter<AttendanceState> emit,
  ) async {
    emit(const AttendanceState.loading());

    final result = await _getAttendanceUseCase(
      sectionId: event.sectionId,
      date: event.date,
    );

    result.fold(
      (failure) => emit(AttendanceState.error(failure.message)),
      (data) => emit(AttendanceState.loaded(
        students: data.students,
        date: data.date,
        existingAttendance: data.attendance,
      )),
    );
  }

  Future<void> _onMarkAttendance(
    MarkStudentAttendance event,
    Emitter<AttendanceState> emit,
  ) async {
    state.maybeWhen(
      loaded: (students, date, attendance) {
        final updated = Map<String, AttendanceStatus>.from(attendance);
        updated[event.studentId] = event.status;
        emit(AttendanceState.loaded(
          students: students,
          date: date,
          existingAttendance: updated,
        ));
      },
      orElse: () {},
    );
  }

  Future<void> _onSubmitAttendance(
    SubmitAttendance event,
    Emitter<AttendanceState> emit,
  ) async {
    emit(const AttendanceState.submitting());

    final result = await _markAttendanceUseCase(event.attendanceData);

    result.fold(
      (failure) => emit(AttendanceState.error(failure.message)),
      (_) => emit(const AttendanceState.submitted()),
    );
  }
}

// attendance_event.dart
@freezed
class AttendanceEvent with _$AttendanceEvent {
  const factory AttendanceEvent.loadStudents({
    required String sectionId,
    required DateTime date,
  }) = LoadStudentsForAttendance;

  const factory AttendanceEvent.markAttendance({
    required String studentId,
    required AttendanceStatus status,
  }) = MarkStudentAttendance;

  const factory AttendanceEvent.submit({
    required List<AttendanceRecord> attendanceData,
  }) = SubmitAttendance;
}

// attendance_state.dart
@freezed
class AttendanceState with _$AttendanceState {
  const factory AttendanceState.initial() = _Initial;
  const factory AttendanceState.loading() = _Loading;
  const factory AttendanceState.loaded({
    required List<Student> students,
    required DateTime date,
    required Map<String, AttendanceStatus> existingAttendance,
  }) = _Loaded;
  const factory AttendanceState.submitting() = _Submitting;
  const factory AttendanceState.submitted() = _Submitted;
  const factory AttendanceState.error(String message) = _Error;
}
```

### 4.5 Offline Support

```dart
// lib/core/storage/offline_manager.dart

import 'package:hive_flutter/hive_flutter.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

class OfflineManager {
  static const String _pendingActionsBox = 'pending_actions';
  static const String _cachedDataBox = 'cached_data';

  late Box<PendingAction> _pendingBox;
  late Box _cacheBox;

  Future<void> initialize() async {
    await Hive.initFlutter();
    Hive.registerAdapter(PendingActionAdapter());
    _pendingBox = await Hive.openBox<PendingAction>(_pendingActionsBox);
    _cacheBox = await Hive.openBox(_cachedDataBox);
  }

  // Queue action for offline
  Future<void> queueAction(PendingAction action) async {
    await _pendingBox.add(action);
  }

  // Sync when online
  Future<void> syncPendingActions() async {
    final connectivity = await Connectivity().checkConnectivity();
    if (connectivity == ConnectivityResult.none) return;

    final pendingActions = _pendingBox.values.toList();

    for (final action in pendingActions) {
      try {
        await _executeAction(action);
        await action.delete();
      } catch (e) {
        // Keep in queue if failed
        action.retryCount++;
        await action.save();
      }
    }
  }

  // Cache data for offline access
  Future<void> cacheData(String key, dynamic data) async {
    await _cacheBox.put(key, {
      'data': data,
      'timestamp': DateTime.now().toIso8601String(),
    });
  }

  // Get cached data
  T? getCachedData<T>(String key) {
    final cached = _cacheBox.get(key);
    if (cached == null) return null;
    return cached['data'] as T;
  }

  Future<void> _executeAction(PendingAction action) async {
    // Execute based on action type
    switch (action.type) {
      case ActionType.markAttendance:
        await _apiClient.post('/attendance', data: action.payload);
        break;
      case ActionType.submitAssignment:
        await _apiClient.post('/assignments/submit', data: action.payload);
        break;
      // ... other action types
    }
  }
}

@HiveType(typeId: 0)
class PendingAction extends HiveObject {
  @HiveField(0)
  final ActionType type;

  @HiveField(1)
  final Map<String, dynamic> payload;

  @HiveField(2)
  final DateTime createdAt;

  @HiveField(3)
  int retryCount;

  PendingAction({
    required this.type,
    required this.payload,
    required this.createdAt,
    this.retryCount = 0,
  });
}
```

### 4.6 Role-Based UI

```dart
// lib/presentation/pages/dashboard/dashboard_page.dart

class DashboardPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        return state.maybeWhen(
          authenticated: (user) => _buildDashboard(context, user),
          orElse: () => const SizedBox.shrink(),
        );
      },
    );
  }

  Widget _buildDashboard(BuildContext context, User user) {
    switch (user.role) {
      case UserRole.admin:
        return const AdminDashboard();
      case UserRole.teacher:
        return const TeacherDashboard();
      case UserRole.student:
        return const StudentDashboard();
      case UserRole.parent:
        return const ParentDashboard();
      default:
        return const DefaultDashboard();
    }
  }
}

// Teacher Dashboard
class TeacherDashboard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.dashboard)),
      body: GridView.count(
        crossAxisCount: 2,
        padding: const EdgeInsets.all(16),
        children: [
          DashboardCard(
            icon: Icons.how_to_reg,
            title: l10n.markAttendance,
            onTap: () => context.push('/attendance/mark'),
          ),
          DashboardCard(
            icon: Icons.assignment,
            title: l10n.assignments,
            onTap: () => context.push('/assignments'),
          ),
          DashboardCard(
            icon: Icons.quiz,
            title: l10n.onlineTests,
            onTap: () => context.push('/tests'),
          ),
          DashboardCard(
            icon: Icons.grade,
            title: l10n.enterMarks,
            onTap: () => context.push('/marks'),
          ),
          DashboardCard(
            icon: Icons.upload_file,
            title: l10n.uploadDocument,
            subtitle: l10n.aiParsing,
            onTap: () => context.push('/document-parser'),
          ),
          DashboardCard(
            icon: Icons.chat,
            title: l10n.messages,
            onTap: () => context.push('/messages'),
          ),
        ],
      ),
    );
  }
}

// Student Dashboard
class StudentDashboard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.dashboard)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Today's Classes
          TodayClassesCard(),
          const SizedBox(height: 16),

          // Quick Actions Grid
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 3,
            children: [
              QuickActionTile(
                icon: Icons.calendar_today,
                label: l10n.timetable,
                onTap: () => context.push('/timetable'),
              ),
              QuickActionTile(
                icon: Icons.assignment,
                label: l10n.assignments,
                badge: '3', // Pending count
                onTap: () => context.push('/assignments'),
              ),
              QuickActionTile(
                icon: Icons.quiz,
                label: l10n.tests,
                onTap: () => context.push('/tests'),
              ),
              QuickActionTile(
                icon: Icons.grade,
                label: l10n.results,
                onTap: () => context.push('/results'),
              ),
              QuickActionTile(
                icon: Icons.library_books,
                label: l10n.studyMaterial,
                onTap: () => context.push('/materials'),
              ),
              QuickActionTile(
                icon: Icons.payment,
                label: l10n.fees,
                onTap: () => context.push('/fees'),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Recent Announcements
          RecentAnnouncementsCard(),
        ],
      ),
    );
  }
}
```

---

## 5. DevOps & Infrastructure

### 5.1 Docker Configuration

```dockerfile
# apps/identity-service/Dockerfile

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run build
RUN npx prisma generate

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

USER nestjs

EXPOSE 3001

CMD ["node", "dist/main"]
```

### 5.2 Docker Compose (Development)

```yaml
# docker-compose.yml

version: '3.8'

services:
  # Databases
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: school_erp
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: school_erp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  mongodb:
    image: mongo:7
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    volumes:
      - es_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"

  # Services
  api-gateway:
    build:
      context: ./apps/api-gateway
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=development
      - PORT=3000
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis

  identity-service:
    build:
      context: ./apps/identity-service
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://school_erp:${DB_PASSWORD}@postgres:5432/school_erp
      - REDIS_URL=redis://redis:6379
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis

  document-ai-service:
    build:
      context: ./services/document-ai
      dockerfile: Dockerfile
    environment:
      - MONGODB_URL=mongodb://admin:${MONGO_PASSWORD}@mongodb:27017
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    ports:
      - "8001:8001"
    depends_on:
      - mongodb
      - redis

  # Frontend
  web:
    build:
      context: ./school-erp-web
      dockerfile: Dockerfile
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3000
    ports:
      - "3100:3000"
    depends_on:
      - api-gateway

volumes:
  postgres_data:
  mongo_data:
  redis_data:
  es_data:
```

### 5.3 Kubernetes Deployment

```yaml
# k8s/deployments/identity-service.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: identity-service
  namespace: school-erp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: identity-service
  template:
    metadata:
      labels:
        app: identity-service
    spec:
      containers:
        - name: identity-service
          image: school-erp/identity-service:latest
          ports:
            - containerPort: 3001
          env:
            - name: NODE_ENV
              value: production
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-secrets
                  key: postgres-url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: db-secrets
                  key: redis-url
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: jwt-secret
          resources:
            requests:
              memory: "256Mi"
              cpu: "200m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          readinessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 15
            periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: identity-service
  namespace: school-erp
spec:
  selector:
    app: identity-service
  ports:
    - port: 3001
      targetPort: 3001
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: identity-service-hpa
  namespace: school-erp
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: identity-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### 5.4 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml

name: Build and Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run tests
        run: npm run test:cov

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    strategy:
      matrix:
        service:
          - api-gateway
          - identity-service
          - academic-service
          - student-service
          - exam-service
          - finance-service
          - communication-service

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: ./apps/${{ matrix.service }}
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/${{ matrix.service }}:${{ github.sha }}
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/${{ matrix.service }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Setup kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-1

      - name: Update kubeconfig
        run: aws eks update-kubeconfig --name school-erp-staging

      - name: Deploy to staging
        run: |
          kubectl set image deployment/api-gateway \
            api-gateway=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/api-gateway:${{ github.sha }} \
            -n school-erp-staging

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Setup kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-1

      - name: Update kubeconfig
        run: aws eks update-kubeconfig --name school-erp-production

      - name: Deploy to production
        run: |
          kubectl set image deployment/api-gateway \
            api-gateway=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/api-gateway:${{ github.sha }} \
            -n school-erp-production

  build-mobile:
    needs: test
    runs-on: macos-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.0'
          channel: 'stable'

      - name: Install dependencies
        working-directory: ./school_erp_mobile
        run: flutter pub get

      - name: Run tests
        working-directory: ./school_erp_mobile
        run: flutter test

      - name: Build Android APK
        working-directory: ./school_erp_mobile
        run: flutter build apk --release

      - name: Build iOS
        working-directory: ./school_erp_mobile
        run: flutter build ios --release --no-codesign

      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: android-apk
          path: school_erp_mobile/build/app/outputs/flutter-apk/app-release.apk
```

---

## 6. Security Specifications

### 6.1 Authentication & Authorization

| Mechanism | Implementation |
|-----------|----------------|
| Password Hashing | bcrypt (cost factor: 12) |
| Token Type | JWT (RS256) |
| Access Token Expiry | 15 minutes |
| Refresh Token Expiry | 7 days |
| MFA | TOTP (Google Authenticator compatible) |
| Session Management | Redis-backed |
| Password Policy | Min 8 chars, 1 upper, 1 lower, 1 number |

### 6.2 Data Protection

| Layer | Protection |
|-------|------------|
| In Transit | TLS 1.3 |
| At Rest | AES-256 |
| PII Fields | Application-level encryption |
| Backups | Encrypted with separate keys |
| Logs | PII redaction |

### 6.3 API Security

```typescript
// Security headers middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// Rate limiting by endpoint
const rateLimits = {
  '/auth/login': { windowMs: 15 * 60 * 1000, max: 5 },
  '/auth/register': { windowMs: 60 * 60 * 1000, max: 3 },
  '/api/*': { windowMs: 60 * 1000, max: 100 },
};
```

---

## 7. Monitoring & Observability

### 7.1 Metrics (Prometheus)

```yaml
# Key metrics to track
- http_request_duration_seconds
- http_requests_total
- db_query_duration_seconds
- cache_hits_total
- cache_misses_total
- active_users_gauge
- document_processing_duration
- payment_transactions_total
```

### 7.2 Logging (ELK Stack)

```typescript
// Structured logging format
{
  "timestamp": "2025-12-16T10:30:00.000Z",
  "level": "info",
  "service": "identity-service",
  "traceId": "abc123",
  "userId": "user-uuid",
  "tenantId": "tenant-uuid",
  "message": "User logged in successfully",
  "metadata": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### 7.3 Alerting Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Error Rate | > 5% of requests fail | Critical |
| High Latency | P95 > 2s | Warning |
| Database Connection Pool | > 80% utilized | Warning |
| Memory Usage | > 85% | Warning |
| Disk Space | < 10% free | Critical |
| Failed Payments | > 3 in 5 minutes | Critical |

---

*Technical Specifications by Amelia (Dev) + Barry (Quick Flow Solo Dev) - BMAD Agent Team*
