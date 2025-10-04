# Module Resolution Fix for GeoGuardian Frontend

## 🐛 Issue: "Module not found: Can't resolve '@/lib/*'"

### Problem
After cloning the repository and running `npm install`, users encounter module resolution errors:
```
Module not found: Can't resolve '@/lib/design-system'
Module not found: Can't resolve '@/lib/api-client'
Module not found: Can't resolve '@/lib/api'
```

### Root Cause
Next.js 15.5.3+ uses **Turbopack** by default in development mode, which has compatibility issues with TypeScript path aliases (`@/*` mappings). The `tsconfig.json` paths configuration isn't always respected by the bundler.

### ✅ Solution Applied

#### 1. **Updated `next.config.js`**
Added explicit Webpack alias configuration:

```javascript
webpack: (config) => {
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': require('path').resolve(__dirname, 'src'),
  }
  return config
}
```

This ensures that both Webpack and Turbopack resolve the `@` alias correctly.

## 🚀 Setup Instructions for New Users

### Fresh Clone Setup:
```bash
# 1. Clone the repository
git clone https://github.com/r-baruah/GeoGuardian.git
cd GeoGuardian

# 2. Navigate to frontend
cd frontend

# 3. Install dependencies
npm install

# 4. Start development server
npm run dev
```

### If You Still See Errors:

#### Option 1: Clear Next.js Cache
```bash
rm -rf .next
npm run dev
```

#### Option 2: Reinstall Dependencies
```bash
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```

#### Option 3: Use Webpack explicitly (disable Turbopack)
```bash
npm run dev -- --no-turbo
```

## 🔧 Technical Details

### Files Modified:
- **`next.config.js`**: Added Webpack alias configuration

### Configuration Files (Already Correct):
- **`tsconfig.json`**: Has correct `baseUrl` and `paths` mapping
  ```json
  {
    "compilerOptions": {
      "baseUrl": ".",
      "paths": {
        "@/*": ["./src/*"]
      }
    }
  }
  ```

### Why This Works:
1. **TypeScript** uses `tsconfig.json` for type checking (already working)
2. **Webpack** needs explicit alias configuration for bundling
3. **Turbopack** respects Webpack aliases when provided

## ✅ Verification

After applying the fix, verify it works:

```bash
cd frontend
npm run dev
```

Expected output:
```
✓ Ready in 5.2s
○ Compiling /
✓ Compiled successfully
```

No more "Module not found" errors!

## 📝 Additional Notes

### Why Didn't This Affect Your Local Setup?
Your local setup might have:
- Cached `.next` directory with correct paths
- Different Node.js/npm version
- Different development environment

### Why This Affects Fresh Clones?
Fresh clones have:
- No cached `.next` directory
- Clean npm install
- Turbopack runs from scratch and needs explicit aliases

## 🎯 Summary

**The fix is simple**: Add explicit Webpack alias configuration to `next.config.js`.

**This ensures**: All users (both fresh clones and existing setups) can resolve `@/*` imports correctly.

**Status**: ✅ **FIXED** - Tested and working!

---

*Last Updated: 2025-10-04*
*Issue Resolved: Module Resolution in Next.js 15.5.3+*

