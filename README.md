# Car Company - White Label Platform

A production-ready, security-first white-label car company website built with Next.js, featuring 2FA authentication, role-based access control, and comprehensive security measures.

## Features

- **Security First**: 2FA with Google Authenticator, rate limiting, OWASP Top 10 protection
- **Role-Based Access Control**: ADMIN, MANAGER, and VIEWER roles with granular permissions
- **Production Ready**: Monitoring, error tracking, CI/CD pipelines
- **Type-Safe API**: tRPC for end-to-end type safety
- **Modern Stack**: Next.js 14+, TypeScript, Prisma, PostgreSQL
- **Pay-as-you-go**: Deployed on Cloudflare Pages with serverless architecture

## Tech Stack

### Frontend & Backend
- **Framework**: Next.js 14+ (App Router) with TypeScript
- **API Layer**: tRPC (type-safe APIs)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand + TanStack Query

### Database & Storage
- **Database**: PostgreSQL via Neon (serverless)
- **ORM**: Prisma
- **Cache/Rate Limiting**: Upstash Redis
- **File Storage**: Cloudflare R2

### Authentication & Security
- **Auth**: NextAuth.js v5
- **2FA**: otpauth + qrcode
- **Password Hashing**: bcryptjs (12 rounds)
- **Input Validation**: Zod
- **Rate Limiting**: @upstash/ratelimit

### Infrastructure
- **Hosting**: Cloudflare Pages + Workers
- **Email**: Resend
- **Error Tracking**: Sentry
- **Monitoring**: Cloudflare Web Analytics

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (we recommend [Neon](https://neon.tech) for serverless)
- Upstash Redis account (for rate limiting)
- Cloudflare account (for R2 storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd riadne
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your actual values:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`: From Upstash dashboard
   - Other service credentials as needed

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
riadne/
├── app/                      # Next.js App Router
│   ├── (public)/             # Public routes
│   ├── admin/                # Admin panel (protected)
│   ├── auth/                 # Authentication pages
│   └── api/                  # API routes
├── components/               # React components
│   ├── ui/                   # shadcn/ui components
│   ├── public/               # Public site components
│   └── admin/                # Admin panel components
├── server/                   # Backend logic
│   ├── api/routers/          # tRPC routers
│   ├── auth/                 # Auth config, 2FA, RBAC
│   └── db/                   # Prisma client
├── lib/                      # Utilities
│   ├── validators/           # Zod schemas
│   └── security/             # Security utilities
├── prisma/                   # Database schema
└── tests/                    # Tests
```

## Security Features

### Authentication
- Email/password authentication via NextAuth.js
- Mandatory 2FA with Google Authenticator (QR code generation)
- JWT session strategy with 30-day expiry
- Secure password hashing with bcryptjs (12 rounds)

### Role-Based Access Control
- **ADMIN**: Full access (vehicles, users, settings)
- **MANAGER**: Vehicle management only
- **VIEWER**: Read-only access

### Rate Limiting
- **Auth endpoints**: 5 requests per 15 minutes
- **API endpoints**: 100 requests per minute
- **Public pages**: 1000 requests per minute

### OWASP Top 10 Protection
- ✅ Broken Access Control → RBAC + session validation
- ✅ Cryptographic Failures → bcrypt, HTTPS, secure tokens
- ✅ Injection → Prisma ORM, Zod validation
- ✅ Insecure Design → 2FA, rate limiting, audit logs
- ✅ Security Misconfiguration → Security headers in middleware
- ✅ Vulnerable Components → Dependabot, npm audit in CI
- ✅ Authentication Failures → 2FA, account lockout
- ✅ Software Integrity → CI/CD, database migrations
- ✅ Logging Failures → Sentry, audit log table
- ✅ SSRF → URL validation, allowlists

### Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)
- Content-Security-Policy (CSP)
- Referrer-Policy: strict-origin-when-cross-origin

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Lint code
npm run type-check   # TypeScript type checking

# Database
npx prisma studio    # Open Prisma Studio (visual DB editor)
npx prisma generate  # Generate Prisma Client
npx prisma db push   # Push schema changes to DB
npx prisma migrate dev  # Create and apply migrations
```

## Environment Variables

Required environment variables (see `.env.example` for full list):

```bash
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# File Storage (Cloudflare R2)
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="car-images"

# Email (Resend)
RESEND_API_KEY="re_..."
FROM_EMAIL="noreply@yourdomain.com"

# Monitoring (Sentry)
SENTRY_DSN="https://..."
```

## Deployment

### Cloudflare Pages

1. **Install Cloudflare adapter**
   ```bash
   npm install -D @cloudflare/next-on-pages
   ```

2. **Update build command in Cloudflare Pages**
   ```
   npx @cloudflare/next-on-pages
   ```

3. **Connect GitHub repository**
   - Go to Cloudflare Pages dashboard
   - Create new project
   - Connect your GitHub repo
   - Set environment variables
   - Deploy

4. **Run migrations**
   ```bash
   npx prisma migrate deploy
   ```

### Environment Variables in Production

Set all environment variables in the Cloudflare Pages dashboard under Settings > Environment Variables.

## Cost Estimate

### Free Tier (MVP/Testing)
- **Total**: $0/month

### 10K Users
- Cloudflare Workers: $5/month
- Neon DB: $19/month
- Upstash Redis: $0 (under free tier)
- Cloudflare R2: $1/month
- **Total**: ~$25-35/month

### 100K Users
- Cloudflare Workers: $25/month
- Neon DB: $69/month
- Upstash Redis: $10/month
- Cloudflare R2: $5/month
- Resend: $20/month
- Sentry: $26/month
- **Total**: ~$155/month

## Development Roadmap

### Week 1-2: Foundation
- [x] Next.js project setup
- [x] Database schema and Prisma
- [x] Authentication with 2FA
- [x] RBAC system
- [x] Rate limiting

### Week 3-4: Admin Panel
- [ ] Admin layout and dashboard
- [ ] Vehicle CRUD operations
- [ ] User management
- [ ] 2FA setup flow

### Week 5-6: Public Site
- [ ] Homepage
- [ ] Vehicle listing page
- [ ] Vehicle detail page
- [ ] Contact form

### Week 7: Testing & Security
- [ ] OWASP security audit
- [ ] Penetration testing
- [ ] E2E tests with Playwright
- [ ] Load testing

### Week 8: Production
- [ ] Cloudflare Pages deployment
- [ ] Custom domain setup
- [ ] Monitoring setup
- [ ] Post-launch monitoring

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues and questions, please open a GitHub issue.
