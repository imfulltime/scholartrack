# 🔧 Vercel Deployment Fix Guide

## ❌ **Error: MIDDLEWARE_INVOCATION_FAILED**

This error typically occurs when the middleware fails during deployment. Here's how to fix it:

---

## 🔍 **Step 1: Check Environment Variables in Vercel**

### **Required Environment Variables:**
Go to your Vercel dashboard → Project → Settings → Environment Variables

Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
```

### **How to get these values:**
1. Go to Supabase Dashboard → Settings → API
2. Copy **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
3. Copy **anon public** key → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
4. Copy **service_role** key → Use for `SUPABASE_SERVICE_ROLE_KEY`
5. Set your Vercel app URL → Use for `NEXT_PUBLIC_APP_URL`

---

## 🛠️ **Step 2: Apply the Middleware Fix**

The middleware has been updated with better error handling:
- ✅ Environment variable validation
- ✅ Try-catch error handling
- ✅ Graceful fallback on errors
- ✅ Better static asset exclusion

---

## 🚀 **Step 3: Redeploy**

After adding environment variables:

1. **In Vercel Dashboard:**
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"

2. **Or push a new commit:**
   ```bash
   git add .
   git commit -m "fix: Update middleware error handling for Vercel"
   git push origin main
   ```

---

## 🔍 **Step 4: Check Vercel Function Logs**

If still failing:
1. Go to Vercel Dashboard → Functions tab
2. Click on the failing function
3. Check the logs for specific error messages

---

## 🆘 **Alternative: Temporarily Disable Middleware**

If you need to deploy quickly, you can temporarily comment out the middleware:

```typescript
// middleware.ts - TEMPORARY FIX
import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Temporarily bypass middleware for deployment
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

**⚠️ Remember to re-enable after fixing environment variables!**

---

## 🐛 **Common Issues & Solutions**

### **Issue 1: Environment Variables Not Set**
- **Symptom**: Missing env vars error in logs
- **Fix**: Add all required environment variables in Vercel dashboard

### **Issue 2: Wrong Environment Variable Names**
- **Symptom**: Supabase connection fails
- **Fix**: Ensure exact variable names (case-sensitive)

### **Issue 3: Middleware Running on Static Assets**  
- **Symptom**: Middleware errors on CSS/JS files
- **Fix**: Updated matcher pattern (already done above)

### **Issue 4: Supabase Region Mismatch**
- **Symptom**: Connection timeout errors
- **Fix**: Ensure Vercel deployment region matches Supabase region

### **Issue 5: Edge Runtime Issues**
- **Symptom**: Runtime errors in edge functions
- **Fix**: Check if all imports are edge-compatible

---

## ✅ **Verification Steps**

After deployment:
1. **Check Homepage**: Should load without errors
2. **Check Login**: Should redirect to login page when not authenticated
3. **Check Console**: No JavaScript errors
4. **Check Network**: API calls should work

---

## 📞 **If Still Failing**

Try these advanced debugging steps:

### **1. Check Build Logs**
Look for specific error messages in the build process

### **2. Test Locally with Production Build**
```bash
npm run build
npm start
```

### **3. Simplify Middleware Temporarily**
Remove complex logic and add it back gradually

### **4. Check Next.js Version Compatibility**
Ensure Supabase SSR package is compatible with Next.js 14

---

## 🎯 **Expected Result**

After fixing:
- ✅ Deployment succeeds
- ✅ Middleware runs without errors  
- ✅ Authentication works properly
- ✅ All pages load correctly

**Most likely fix: Adding missing environment variables in Vercel! 🚀**
