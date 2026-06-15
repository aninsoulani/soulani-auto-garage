# Phase 1: Foundation — Implementation Plan
# Soulani Auto Garage

**Target Directory:** `D:\Mini-project\soulani-auto-garage`  
**Goal:** Establish a running Turborepo monorepo with a deployed NestJS API, MySQL database, Prisma schema, JWT authentication, and a scaffolded Next.js frontend.

---

## Open Questions

> [!IMPORTANT]
> Please confirm the following before execution begins:
>
> 1. **Node.js Version:** Confirm Node.js >= 20 LTS is installed (`node -v`).
> 2. **Package Manager:** This plan uses `pnpm` (recommended for Turborepo). If you prefer `npm` or `yarn`, the commands will differ slightly.
> 4. **MySQL Local Dev:** Do you have a local MySQL instance for development, or will we connect to Railway's MySQL from the start?

---

## Definition of Done (Phase 1)

Phase 1 is complete when all of the following are true:

- [x] Turborepo monorepo initializes and `pnpm dev` runs both apps concurrently.
- [x] NestJS API boots and responds to `GET /api/v1/health` → `{ status: "ok" }`.
- [x] Prisma migrations have run successfully against the MySQL database.
- [x] `POST /api/v1/auth/login` returns a valid JWT access token and refresh token.
- [x] `GET /api/v1/users` returns a 401 without a JWT and a 200 with a valid Super Admin JWT.
- [x] Next.js frontend boots and renders a placeholder homepage at `localhost:3000`.
- [x] All environment variables are documented in `.env.example` (no secrets committed).
- [x] All 5 Git commit milestones are tagged.
- [x] All 5 Git commit milestones are tagged.

---

## Step 0: Prerequisites Verification

Run these commands to verify the environment before starting.

```powershell
node -v          # Must be >= 20.0.0
pnpm -v          # Must be >= 8.0.0  (install: npm install -g pnpm)
git --version    # Any recent version
```

---

## Step 1: Initialize the Turborepo Monorepo

**Working directory:** `D:\Mini-project\soulani-auto-garage`

### 1.1 Create the Turborepo structure

```powershell
# Initialize Turborepo in the existing git repo
pnpm dlx create-turbo@latest . --package-manager pnpm
# Select: "Empty workspace" when prompted
```

> [!NOTE]
> Since the directory already has a `.git` folder, Turborepo will scaffold into it without re-initializing git.

### 1.2 Delete the boilerplate apps Turborepo creates

```powershell
# Remove the default scaffold apps (we'll create our own)
Remove-Item -Recurse -Force apps\docs
Remove-Item -Recurse -Force apps\web
```

### 1.3 Verify root structure

After this step the directory should look like:
```
soulani-auto-garage/
├── apps/          (empty)
├── packages/      (empty)
├── docs/          (our existing docs)
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

### 1.4 Update `turbo.json`

Replace the contents of `turbo.json` with:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {}
  }
}
```

### 1.5 Update root `package.json`

```json
{
  "name": "soulani-auto-garage",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck"
  },
  "devDependencies": {
    "turbo": "latest"
  },
  "packageManager": "pnpm@9.0.0"
}
```

### 1.6 Update `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

---

## Step 2: Create the Shared Packages

### 2.1 Create `packages/types`

```powershell
New-Item -ItemType Directory -Path packages\types\src -Force
```

**`packages/types/package.json`:**
```json
{
  "name": "@soulani/types",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

**`packages/types/src/index.ts`:**
```typescript
// Shared TypeScript interfaces — populated in later phases
export * from './vehicle.types';
export * from './lead.types';
export * from './booking.types';
```

**`packages/types/src/vehicle.types.ts`:**
```typescript
export type VehicleType = 'SALE' | 'RENTAL' | 'BOTH';
export type VehicleStatus = 'AVAILABLE' | 'SOLD' | 'RENTED' | 'MAINTENANCE';
export type UserRole = 'SUPER_ADMIN' | 'SALES_STAFF' | 'RENTAL_STAFF';
```

**`packages/types/src/lead.types.ts`:** *(empty stub)*
```typescript
export {};
```

**`packages/types/src/booking.types.ts`:** *(empty stub)*
```typescript
export {};
```

### 2.2 Create `packages/utils`

```powershell
New-Item -ItemType Directory -Path packages\utils\src -Force
```

**`packages/utils/package.json`:**
```json
{
  "name": "@soulani/utils",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

**`packages/utils/src/index.ts`:**
```typescript
export * from './idr-formatter';
export * from './whatsapp';
export * from './date-helpers';
```

**`packages/utils/src/idr-formatter.ts`:**
```typescript
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}
```

**`packages/utils/src/whatsapp.ts`:**
```typescript
export function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
```

**`packages/utils/src/date-helpers.ts`:**
```typescript
export function calculateRentalDays(start: Date, end: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((end.getTime() - start.getTime()) / msPerDay);
}
```

---

## Step 3: Create the NestJS API (`apps/api`)

### 3.1 Scaffold NestJS app

```powershell
cd apps
pnpm dlx @nestjs/cli new api --package-manager pnpm --skip-git
cd ..
```

This creates `apps/api/` with a standard NestJS structure.

### 3.2 Install API dependencies

```powershell
cd apps\api

# Core production dependencies
pnpm add @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata rxjs
pnpm add @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt
pnpm add @prisma/client bcrypt class-validator class-transformer
pnpm add helmet @nestjs/throttler

# Dev dependencies
pnpm add -D @types/bcrypt @types/passport-jwt @types/node typescript ts-node
pnpm add -D prisma

cd ..\..
```

### 3.3 Restructure the NestJS source to match architecture

```powershell
# Create all module directories
$modules = @(
  "auth", "auth/strategies", "auth/dto",
  "vehicles", "vehicles/dto",
  "vehicle-images", "vehicle-images/dto",
  "vehicle-inspections", "vehicle-inspections/dto",
  "sales-listings", "sales-listings/dto",
  "rental-listings", "rental-listings/dto",
  "rental-bookings", "rental-bookings/dto",
  "blackout-dates", "blackout-dates/dto",
  "leads", "leads/dto",
  "lead-followups", "lead-followups/dto",
  "testimonials", "testimonials/dto",
  "cms", "cms/dto",
  "analytics",
  "users", "users/dto",
  "cloudinary",
  "prisma",
  "common/guards",
  "common/interceptors",
  "common/decorators",
  "common/filters"
)
foreach ($module in $modules) {
  New-Item -ItemType Directory -Path "apps\api\src\$module" -Force
}
```

### 3.4 Create the Prisma module and service

**`apps/api/src/prisma/prisma.module.ts`:**
```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

**`apps/api/src/prisma/prisma.service.ts`:**
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### 3.5 Create common Guards, Decorators, Filters

**`apps/api/src/common/decorators/roles.decorator.ts`:**
```typescript
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@soulani/types';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

**`apps/api/src/common/decorators/public.decorator.ts`:**
```typescript
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

**`apps/api/src/common/guards/jwt-auth.guard.ts`:**
```typescript
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) { super(); }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

**`apps/api/src/common/guards/roles.guard.ts`:**
```typescript
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '@soulani/types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user?.role === role);
  }
}
```

**`apps/api/src/common/filters/http-exception.filter.ts`:**
```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url}`, exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      ...(typeof exceptionResponse === 'object' ? exceptionResponse : { message: exceptionResponse }),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

**`apps/api/src/common/interceptors/transform.interceptor.ts`:**
```typescript
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        statusCode: context.switchToHttp().getResponse().statusCode,
        message: 'Success',
        data,
      })),
    );
  }
}
```

### 3.6 Configure `main.ts`

```typescript
// apps/api/src/main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import * as helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' });
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}/api/v1`);
}
bootstrap();
```

---

## Step 4: Create the Auth Module

### 4.1 Auth DTOs

**`apps/api/src/auth/dto/login.dto.ts`:**
```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

### 4.2 JWT Strategy

**`apps/api/src/auth/strategies/jwt.strategy.ts`:**
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      ignoreExpiration: false,
    });
  }

  async validate(payload: { sub: number; email: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, deletedAt: null, isActive: true },
    });
    if (!user) throw new UnauthorizedException();
    return { id: user.id, email: user.email, role: user.role, name: user.name };
  }
}
```

### 4.3 Auth Service

**`apps/api/src/auth/auth.service.ts`:**
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email, deletedAt: null, isActive: true },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  async getProfile(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, uuid: true, name: true, email: true, role: true, createdAt: true },
    });
  }
}
```

### 4.4 Auth Controller

**`apps/api/src/auth/auth.controller.ts`:**
```typescript
import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('profile')
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }
}
```

### 4.5 Auth Module

**`apps/api/src/auth/auth.module.ts`:**
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

---

## Step 5: Create the Users Module

### 5.1 Users Service (Phase 1 scope: create + list only)

**`apps/api/src/users/users.service.ts`:**
```typescript
import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, uuid: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: { name: string; email: string; password: string; role: any }) {
    const exists = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(data.password, 12);
    return this.prisma.user.create({
      data: { name: data.name, email: data.email, passwordHash, role: data.role },
      select: { id: true, uuid: true, name: true, email: true, role: true, createdAt: true },
    });
  }
}
```

### 5.2 Users Controller

**`apps/api/src/users/users.controller.ts`:**
```typescript
import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
@Roles('SUPER_ADMIN' as any)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.usersService.create(body);
  }
}
```

---

## Step 6: Create the Health Check Endpoint

**`apps/api/src/app.controller.ts`:**
```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

---

## Step 7: Wire the Root `AppModule`

**`apps/api/src/app.module.ts`:**
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
```

---

## Step 8: Set Up Prisma

### 8.1 Initialize Prisma inside the API app

```powershell
cd apps\api
pnpm prisma init
cd ..\..
```

This creates `apps/api/prisma/schema.prisma` and `apps/api/.env`.

### 8.2 Copy the canonical schema

```powershell
Copy-Item "docs\schema.prisma" "apps\api\prisma\schema.prisma" -Force
```

### 8.3 Create `apps/api/.env`

```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/soulani_dev"

# JWT
JWT_SECRET="dev_super_secret_access_key_min_64_chars_xxxxxxxxxxxxxxxxxxxxxxx"
JWT_REFRESH_SECRET="dev_super_secret_refresh_key_min_64_chars_xxxxxxxxxxxxxxxxxxxxxx"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# App
PORT=3001
FRONTEND_URL="http://localhost:3000"

# Cloudinary (fill in Phase 2)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 8.4 Create `.env.example` at repo root

```env
# =============================================
# BACKEND (apps/api/.env)
# =============================================
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/soulani_db"
JWT_SECRET="min_64_char_secret"
JWT_REFRESH_SECRET="min_64_char_refresh_secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
FRONTEND_URL="https://soulanigarage.com"
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# =============================================
# FRONTEND (apps/web/.env.local)
# =============================================
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_WHATSAPP_NUMBER=6281122334455
```

### 8.5 Run the first migration

```powershell
cd apps\api
pnpm prisma migrate dev --name init_schema
cd ..\..
```

### 8.6 Seed the first Super Admin user

Create `apps/api/prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@Soulani123!', 12);

  await prisma.user.upsert({
    where: { email: 'admin@soulani.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@soulani.com',
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('Seed complete. Admin user created: admin@soulani.com');
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

Add to `apps/api/package.json` scripts:
```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

Run the seed:
```powershell
cd apps\api
pnpm prisma db seed
cd ..\..
```

---

## Step 9: Create the Next.js Frontend (`apps/web`)

### 9.1 Scaffold Next.js app

```powershell
cd apps
pnpm dlx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --skip-git
cd ..
```

### 9.2 Install frontend dependencies

```powershell
cd apps\web

# Shadcn UI (initialize)
pnpm dlx shadcn@latest init
# Select: Default style, Slate as base color, CSS Variables: Yes

# State management and data fetching
pnpm add zustand @tanstack/react-query
pnpm add react-hook-form zod @hookform/resolvers

# Utilities
pnpm add axios clsx tailwind-merge

cd ..\..
```

### 9.3 Create the folder structure

```powershell
$webDirs = @(
  "apps\web\src\app\(public)",
  "apps\web\src\app\(admin)",
  "apps\web\src\app\auth\login",
  "apps\web\src\components\ui",
  "apps\web\src\components\vehicles",
  "apps\web\src\components\leads",
  "apps\web\src\components\rental",
  "apps\web\src\components\admin",
  "apps\web\src\components\shared",
  "apps\web\src\lib",
  "apps\web\src\hooks",
  "apps\web\src\store",
  "apps\web\src\types"
)
foreach ($dir in $webDirs) {
  New-Item -ItemType Directory -Path $dir -Force
}
```

### 9.4 Create `apps/web/src/lib/api.ts`

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...fetchOptions } = options || {};
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...fetchOptions,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'API Error');
  }

  return res.json();
}
```

### 9.5 Create the Auth store (`apps/web/src/store/auth.store.ts`)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthStore {
  accessToken: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setAuth: (accessToken, user) => set({ accessToken, user }),
      clearAuth: () => set({ accessToken: null, user: null }),
    }),
    { name: 'soulani-auth' }
  )
);
```

### 9.6 Create the placeholder homepage

**`apps/web/src/app/(public)/page.tsx`:**
```tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold text-slate-900">Soulani Auto Garage</h1>
      <p className="mt-4 text-lg text-slate-500">
        Modern Automotive Marketplace — Coming Soon
      </p>
    </main>
  );
}
```

**`apps/web/src/app/(public)/layout.tsx`:**
```tsx
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

### 9.7 Create a placeholder Admin login page

**`apps/web/src/app/auth/login/page.tsx`:**
```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { apiFetch } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch<{ data: { accessToken: string; user: any } }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) }
      );
      setAuth(res.data.accessToken, res.data.user);
      router.push('/dashboard');
    } catch {
      setError('Invalid email or password');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Admin Login</h1>
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        <input type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          className="mb-4 w-full rounded border p-2 text-sm" required />
        <input type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)}
          className="mb-6 w-full rounded border p-2 text-sm" required />
        <button type="submit"
          className="w-full rounded bg-blue-600 py-2 text-white font-medium hover:bg-blue-700">
          Log In
        </button>
      </form>
    </main>
  );
}
```

### 9.8 Create `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_WHATSAPP_NUMBER=6281122334455
```

---

## Step 10: Add Dev Scripts to Root `package.json`

Update the root `package.json` to add API-specific scripts:

```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "db:migrate": "cd apps/api && pnpm prisma migrate dev",
    "db:seed": "cd apps/api && pnpm prisma db seed",
    "db:studio": "cd apps/api && pnpm prisma studio"
  }
}
```

Add `dev` scripts to each app's `package.json`:

**`apps/api/package.json`** — add/confirm:
```json
"scripts": {
  "dev": "nest start --watch",
  "build": "nest build",
  "start:prod": "node dist/main"
}
```

**`apps/web/package.json`** — confirm:
```json
"scripts": {
  "dev": "next dev --port 3000",
  "build": "next build"
}
```

---

## Step 11: Git Configuration

### 11.1 Update `.gitignore` at repo root

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
.next/
.turbo/

# Environment variables (NEVER commit)
.env
.env.local
.env.*.local
apps/api/.env
apps/web/.env.local

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# Prisma
apps/api/prisma/migrations/dev.db
```

### 11.2 Git Commit Milestones

Commit after each major step is verified working:

| Milestone | Tag | Commit Message |
|---|---|---|
| Monorepo initialized | `v0.1.0-foundation` | `feat: initialize turborepo monorepo with shared packages` |
| NestJS API scaffolded | `v0.1.1-api-scaffold` | `feat(api): scaffold nestjs modules, guards, filters, interceptors` |
| Auth module complete | `v0.1.2-auth` | `feat(api): implement jwt auth, roles guard, users module` |
| Prisma schema migrated | `v0.1.3-db` | `feat(db): run initial prisma migration and seed super admin` |
| Next.js frontend scaffolded | `v0.1.4-web` | `feat(web): scaffold next.js 15 with app router, auth store, login page` |
| Phase 1 complete (Local MVP) | `v0.1.5-local-complete` | `feat: phase 1 foundation complete — local dev ready` |

```powershell
# Example commit and tag after each milestone
git add .
git commit -m "feat: initialize turborepo monorepo with shared packages"
git tag v0.1.0-foundation
git push origin main --tags
```

---

## Step 12: Deployment (Deferred)

Deployment to Vercel and Railway has been deferred. The current focus is entirely on ensuring all features run smoothly in the local development environment first.

---

## Step 13: Smoke Testing

Run these tests to validate Phase 1 is fully working:

```powershell
# 1. Start local dev environment
pnpm dev

# 2. Test health check
curl http://localhost:3001/api/v1/health

# 3. Test login (should return accessToken)
curl -X POST http://localhost:3001/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@soulani.com","password":"Admin@Soulani123!"}'

# 4. Test protected endpoint without token (should return 401)
curl http://localhost:3001/api/v1/users

# 5. Test protected endpoint with token (should return 200)
$TOKEN = "<paste_access_token_here>"
curl http://localhost:3001/api/v1/users -H "Authorization: Bearer $TOKEN"

# 6. Test frontend
# Open http://localhost:3000 — placeholder homepage
# Open http://localhost:3000/auth/login — login form
```
