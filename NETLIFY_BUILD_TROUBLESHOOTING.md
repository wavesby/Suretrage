# 🔧 Netlify Build Troubleshooting Guide

## 🚨 Common Build Issues & Solutions

### Issue 1: npm install fails with ENOENT error

**Error:**
```
npm error code ENOENT
npm error syscall open
npm error path /opt/buildhome/node_modules/package.json
npm error errno -2
npm error enoent Could not read package.json
```

**Solution:**
- ✅ **Fixed**: Removed problematic `NPM_FLAGS` from `netlify.toml`
- ✅ **Fixed**: Updated build command to use `npm ci && npm run build`
- ✅ **Fixed**: Added proper Node.js version specification

### Issue 2: ES Module compatibility issues

**Error:**
```
ReferenceError: require is not defined in ES module scope
```

**Solution:**
- ✅ **Fixed**: Updated verification script to use ES module syntax
- ✅ **Fixed**: Added proper import/export statements
- ✅ **Fixed**: Configured package.json with `"type": "module"`

### Issue 3: Function deployment issues

**Error:**
```
Function not found or invalid
```

**Solution:**
- ✅ **Fixed**: Proper function structure in `/netlify/functions/`
- ✅ **Fixed**: Correct export format for Netlify Functions
- ✅ **Fixed**: Added function package.json for dependency management

## 🔍 Build Verification

Run this command to verify your build configuration:

```bash
npm run verify:build
```

Expected output:
```
🔍 Verifying build configuration...

✅ package.json is valid
✅ netlify.toml exists
✅ netlify/functions directory exists
✅ src directory exists
✅ vite.config.ts exists
✅ Node.js version: v18.x.x
✅ .nvmrc specifies Node.js 18

🎉 Build verification completed successfully!
```

## 🛠️ Manual Build Testing

Test your build locally before deploying:

```bash
# Clean install dependencies
npm ci

# Test build
npm run build

# Verify dist folder was created
ls -la dist/
```

## 📋 Build Configuration Checklist

### ✅ Required Files
- [ ] `package.json` (valid JSON)
- [ ] `netlify.toml` (proper configuration)
- [ ] `vite.config.ts` (build configuration)
- [ ] `src/` directory (source code)
- [ ] `netlify/functions/` directory (serverless functions)

### ✅ Build Settings
- [ ] Build command: `npm ci && npm run build`
- [ ] Publish directory: `dist`
- [ ] Functions directory: `netlify/functions`
- [ ] Node.js version: 18 (specified in `.nvmrc`)

### ✅ Environment Variables
- [ ] `ODDS_API_KEY` (optional, for real data)
- [ ] `VITE_PROXY_SERVER` (your Netlify URL)

## 🚀 Deployment Steps

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Fix Netlify build configuration"
   git push origin main
   ```

2. **Connect to Netlify:**
   - Go to [app.netlify.com](https://app.netlify.com/)
   - Click "New site from Git"
   - Select your repository
   - Build settings are auto-configured

3. **Set Environment Variables:**
   - Go to Site Settings → Environment Variables
   - Add required variables

4. **Deploy:**
   - Click "Deploy site"
   - Monitor build logs

## 📊 Build Log Analysis

### Successful Build Log:
```
✅ Installing dependencies
✅ Building site
✅ Deploying functions
✅ Site is live
```

### Failed Build Log:
```
❌ Installing dependencies
❌ Build failed
```

**Check these common issues:**
1. **Dependency conflicts** - Check package.json
2. **Node.js version** - Ensure .nvmrc is set to 18
3. **Build command** - Verify netlify.toml configuration
4. **File permissions** - Ensure all files are committed

## 🔧 Advanced Troubleshooting

### Check Build Logs in Netlify Dashboard:
1. Go to your site in Netlify dashboard
2. Click on the failed deployment
3. Check "Build log" tab
4. Look for specific error messages

### Common Error Patterns:

#### Pattern 1: Module not found
```
Error: Cannot find module 'some-package'
```
**Solution:** Add missing dependency to package.json

#### Pattern 2: Syntax error
```
SyntaxError: Unexpected token
```
**Solution:** Check for ES module vs CommonJS conflicts

#### Pattern 3: Build timeout
```
Build exceeded maximum time limit
```
**Solution:** Optimize build process or upgrade plan

## 📞 Getting Help

1. **Netlify Documentation:** [docs.netlify.com](https://docs.netlify.com/)
2. **Build Logs:** Available in Netlify dashboard
3. **Community:** [Netlify Community](https://community.netlify.com/)
4. **Support:** [Netlify Support](https://www.netlify.com/support/)

## 🎯 Quick Fix Commands

```bash
# Verify build configuration
npm run verify:build

# Test build locally
npm run build

# Check for issues
npm run lint

# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

**Remember:** Most build issues are resolved by ensuring proper configuration files and dependencies. The verification script will catch most common issues before deployment.

*Developed by mwaveslimited with ❤️* 