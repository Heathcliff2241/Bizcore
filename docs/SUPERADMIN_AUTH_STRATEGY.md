# Super Admin Sign-In Strategy - Analysis & Recommendations

## Current Auth System Overview

### ✅ What's Already Implemented

- NextAuth.js with JWT strategy
- Credentials provider (email/password)
- Prisma database integration
- Role-based user model (admin, tenant_owner, tenant_user, user)
- Session management with tenant tracking
- Bcrypt password hashing

### Current Flow

```
Sign In Page (/auth/signin)
  ↓
NextAuth Credentials Provider
  ↓
Verify email/password
  ↓
Create JWT token
  ↓
Redirect based on tenant assignment
  └─ Tenant Owner/Admin → /dashboard/[subdomain]
  └─ Regular User → /dashboard
```

---

## 🎯 Best Approach: Smart Role-Based Routing

### **RECOMMENDED SOLUTION: Single Sign-In with Intelligent Routing**

Use the **same sign-in page** but enhance it to intelligently route users based on their role:

```tsx
// Current: /auth/signin/page.tsx (Enhanced)

After successful authentication:
1. Check User.role in JWT callback
2. Route accordingly:
   - If role === 'admin' → /admin (Super Admin)
   - If role === 'tenant_owner' → /dashboard/[subdomain]
   - If role === 'tenant_user' → /dashboard/[subdomain]
   - If role === 'user' → /dashboard
```

### Why This Approach?

✅ **Pros**

- Single, unified authentication system
- Familiar sign-in experience for all users
- Easier to manage sessions
- Consistent security model
- Leverages existing NextAuth setup
- Better user experience
- No duplicate code

❌ **Cons**

- Must verify role before routing
- Slight delay for role checking

---

## Alternative Options (Not Recommended)

### Option 1: Separate Admin Sign-In Page

```
/auth/signin → Tenant users
/auth/admin/signin → Super admin only
```

❌ Problems:

- Duplicate authentication logic
- Separate session management
- Confusing for users
- More code to maintain
- Security surface area increases

### Option 2: Admin Portal Subdomain

```
admin.bizcore.local → Super admin only
app.bizcore.local → Tenant users
```

❌ Problems:

- Complex setup (DNS, SSL certs)
- Deployment complications
- Overkill for single app
- Harder to test locally

### Option 3: Magic Links/SSO

```
Sign-in via magic links or OAuth
```

❌ Problems:

- More complex to implement
- Adds external dependencies
- Not necessary for internal admin
- Slower than credentials

---

## 🚀 Implementation Plan: Smart Role-Based Routing

### Phase 1: Enhance JWT Callback to Include Role

**File: `/lib/auth.ts`** (Update JWT callback)

```typescript
async jwt({ token, user }) {
  if (user) {
    const userIdNumber = typeof user.id === 'string' ? Number(user.id) : user.id
    token.id = user.id?.toString()
    token.email = user.email
    token.name = user.name
    token.token = randomUUID()
    
    // ✅ ADD THIS: Include user role in token
    const dbUser = await prisma.user.findUnique({
      where: { id: userIdNumber },
      select: { role: true }
    })
    token.role = dbUser?.role || 'user'
    
    // ... rest of existing logic
  }
  return token
}
```

### Phase 2: Update Session Callback

```typescript
async session({ session, token }) {
  if (token && session.user) {
    session.user = {
      ...session.user,
      id: token.id as string,
      token: token.token as string,
      role: token.role as string,  // ✅ ADD THIS
      tenantId: token.tenantId as string | undefined,
      email: token.email as string | undefined,
      name: token.name as string | undefined
    }
  }
  return session
}
```

### Phase 3: Create Routing Helper Function

**File: `/lib/auth-routing.ts`** (New file)

```typescript
import { Session } from 'next-auth'
import { redirect } from 'next/navigation'

export function redirectAfterSignIn(session: Session | null) {
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const userRole = session.user.role

  switch (userRole) {
    case 'admin':
      redirect('/admin')
    
    case 'tenant_owner':
    case 'tenant_user':
      if (session.user.tenantId) {
        redirect(`/dashboard/${session.user.tenantId}`)
      }
      redirect('/dashboard')
    
    case 'user':
    default:
      redirect('/dashboard')
  }
}
```

### Phase 4: Update Sign-In Page

**File: `/app/auth/signin/page.tsx`** (Update redirect logic)

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  try {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false
    })

    if (result?.error) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    if (result?.ok) {
      // Get session with role
      const session = await fetch('/api/auth/session').then(r => r.json())
      
      if (session?.user) {
        const userRole = session.user.role

        // ✅ Smart routing based on role
        if (userRole === 'admin') {
          router.push('/admin')
        } else if (session.user.tenantId) {
          router.push(`/dashboard/${session.user.tenantId}`)
        } else {
          router.push('/dashboard')
        }
      }
    }
  } catch (err: unknown) {
    setError('Login failed. Please try again.')
  } finally {
    setLoading(false)
  }
}
```

### Phase 5: Add Middleware Protection

**File: `/middleware.ts`** (Create/Update)

```typescript
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token

    // Protect /admin routes - only admins
    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Protect /dashboard routes - only authenticated
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
  ],
}
```

---

## 🔐 Security Considerations

### ✅ Already Handled

- Password hashing with bcrypt
- JWT tokens
- Session validation
- Email uniqueness

### ✅ To Add

- [x] Role checking in middleware
- [x] Role stored in JWT token
- [x] Admin route protection
- [ ] Rate limiting on sign-in attempts
- [ ] Session timeout (optional)
- [ ] Login activity logging

### Middleware Protection Flow

```
Request to /admin/*
  ↓
Check middleware.ts
  ↓
Is token present? ✓
  ↓
Is token.role === 'admin'? ✓
  ↓
Allow access to /admin
  ↓
Otherwise → Redirect to /dashboard
```

---

## 👤 User Types & Their Routes

### Super Admin (role: 'admin')

```
Sign In → /auth/signin
After Auth → /admin (Super Admin Dashboard)
Routes Allowed:
  ✓ /admin
  ✓ /admin/tenants
  ✓ /admin/users
  ✓ /admin/analytics
  ✗ /dashboard (redirect to /admin)
```

### Tenant Owner (role: 'tenant_owner')

```
Sign In → /auth/signin
After Auth → /dashboard/[subdomain] (Tenant Dashboard)
Routes Allowed:
  ✓ /dashboard/[subdomain]
  ✗ /admin (redirect to /dashboard)
```

### Tenant User (role: 'tenant_user')

```
Sign In → /auth/signin
After Auth → /dashboard/[subdomain]
Routes Allowed:
  ✓ /dashboard/[subdomain]
  ✗ /admin (redirect to /dashboard)
```

### Regular User (role: 'user')

```
Sign In → /auth/signin
After Auth → /dashboard
Routes Allowed:
  ✓ /dashboard
  ✗ /admin (redirect to /dashboard)
```

---

## 📋 Implementation Checklist

- [ ] Update `/lib/auth.ts` to include role in JWT
- [ ] Update `/lib/auth.ts` session callback
- [ ] Create `/lib/auth-routing.ts` helper
- [ ] Update `/app/auth/signin/page.tsx` redirect logic
- [ ] Create/update `/middleware.ts`
- [ ] Test super admin sign-in
- [ ] Test tenant owner sign-in
- [ ] Test role-based redirects
- [ ] Add login attempt rate limiting (optional)
- [ ] Add session timeout (optional)

---

## 🧪 Testing Guide

### Test Case 1: Super Admin Sign-In

```
1. Create/use admin user (role = 'admin')
2. Go to /auth/signin
3. Enter credentials
4. Should redirect to /admin
5. Verify sidebar appears
6. Check session.user.role === 'admin'
```

### Test Case 2: Tenant Owner Sign-In

```
1. Create/use tenant owner (role = 'tenant_owner')
2. Go to /auth/signin
3. Enter credentials
4. Should redirect to /dashboard/[subdomain]
5. Verify tenant dashboard appears
6. Check session.user.role === 'tenant_owner'
```

### Test Case 3: Permission Blocking

```
1. Sign in as tenant owner
2. Try to access /admin directly
3. Should redirect to /dashboard
4. Verify /admin is not accessible
```

### Test Case 4: Role Check in Middleware

```
1. Create user with role = 'user'
2. Try to access /admin (no sign-in)
3. Should redirect to /auth/signin
4. Sign in
5. Should redirect to /dashboard (not /admin)
```

---

## 🎨 UI Enhancements (Optional)

### Sign-In Page: Show User Type Hint

```tsx
// After email input, show hint based on email
if (email.includes('@admin') || email === 'admin@bizcore.com') {
  showBadge('Super Admin Access')
} else {
  showBadge('Tenant Account')
}
```

### Sign-In Page: Demo Accounts

```tsx
const demoAccounts = [
  { email: 'admin@bizcore.com', password: 'password', role: 'admin' },
  { email: 'owner@coffee.com', password: 'password', role: 'tenant_owner' },
  { email: 'staff@coffee.com', password: 'password', role: 'tenant_user' },
]
```

---

## 📚 Database Requirements

### User Table (Already Exists)

```prisma
model User {
  id       Int
  email    String @unique
  password String
  role     UserRole  // admin, tenant_owner, tenant_user, user
  isActive Boolean
  // ... other fields
}

enum UserRole {
  admin
  tenant_owner
  tenant_user
  user
}
```

### Required Records

```sql
-- Super Admin
INSERT INTO users (firstName, lastName, email, password, role, isActive)
VALUES ('System', 'Admin', 'admin@bizcore.com', '$2a$10$...', 'admin', true);

-- Test Tenant Owner
INSERT INTO users (firstName, lastName, email, password, role, isActive)
VALUES ('John', 'Doe', 'owner@coffee.com', '$2a$10$...', 'tenant_owner', true);
```

---

## ✅ Recommendation Summary

### Use This Approach

1. **Single sign-in page** at `/auth/signin`
2. **Enhanced JWT callback** to include role
3. **Smart routing function** based on user role
4. **Middleware protection** on /admin routes
5. **Session validation** with role checking

### Don't Use

- ❌ Separate admin sign-in page
- ❌ Separate admin subdomain
- ❌ Magic links/complex auth
- ❌ OAuth (unnecessary)

### Benefits

✅ Clean, maintainable code
✅ Single authentication system
✅ Better user experience
✅ Easier testing
✅ Leverages existing NextAuth setup
✅ Production-ready
✅ Scales easily

---

## Next Steps

1. **Phase 1**: Update auth configuration (1-2 hours)
2. **Phase 2**: Update sign-in page (1 hour)
3. **Phase 3**: Add middleware protection (30 minutes)
4. **Phase 4**: Test all scenarios (1-2 hours)
5. **Phase 5**: Deploy and monitor (30 minutes)

---

**Estimated Total Time**: 4-6 hours

**Difficulty**: Medium (mostly configuration changes)

**Risk Level**: Low (well-established patterns)
