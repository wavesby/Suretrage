# Sport Arbitrage Installation Guide

This guide provides step-by-step instructions for installing and setting up the Sport Arbitrage application with real-time data from bookmakers.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- **Chrome or Chromium** browser (for Playwright)

## Installation Steps

### 1. Install Node.js and npm

#### Windows
1. Download the installer from [nodejs.org](https://nodejs.org/)
2. Run the installer and follow the installation wizard
3. Verify installation by opening a command prompt and running:
   ```bash
   node -v
   npm -v
   ```

#### macOS
1. Using Homebrew:
   ```bash
   brew install node
   ```
   
   Or download the installer from [nodejs.org](https://nodejs.org/)
2. Verify installation:
   ```bash
   node -v
   npm -v
   ```

#### Linux (Ubuntu/Debian)
1. Install using apt:
   ```bash
   sudo apt update
   sudo apt install nodejs npm
   ```
2. Verify installation:
   ```bash
   node -v
   npm -v
   ```

### 2. Clone the Repository

```bash
git clone https://github.com/yourusername/sport-arbitrage.git
cd sport-arbitrage
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Install Playwright Browser

```bash
npx playwright install chromium
```

### 5. Create Environment Variables

Create a `.env` file in the project root directory:

```bash
# Create .env file
cat > .env << EOL
VITE_PROXY_SERVER=http://localhost:3001
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
EOL
```

Replace `your_supabase_url` and `your_supabase_anon_key` with your actual Supabase credentials if you're using Supabase for authentication. If not, you can leave them as is for now.

### 6. Create Cache Directory

```bash
mkdir -p cache
```

### 7. Validate the Code

Run the validation script to ensure everything is set up correctly:

```bash
npm run validate
```

This will check for any issues in the code before running the application.

## Running the Application

### Option 1: Using the Start Script (Recommended)

The start script will run both the proxy server and frontend application:

```bash
./start.sh
```

### Option 2: Running Components Separately

#### Terminal 1: Start the Proxy Server

```bash
npm run server
```

#### Terminal 2: Start the Frontend Application

```bash
npm run dev
```

## Verifying the Installation

1. Open your browser and navigate to:
   - Frontend: `http://localhost:8080`
   - Proxy Server Health Check: `http://localhost:3001/health`

2. Test the API endpoints:
   ```bash
   npm run test:server
   ```

3. Check the browser console for any errors

## Troubleshooting

### Node.js Not Found

If you see `command not found: node`, make sure Node.js is installed and in your PATH.

### Dependency Installation Errors

If you encounter errors during dependency installation:

```bash
# Clear npm cache
npm cache clean --force

# Try installing again
npm install
```

### Playwright Browser Installation Issues

If Playwright browser installation fails:

```bash
# Try with sudo
sudo npx playwright install chromium

# Or set a custom browser path
export PLAYWRIGHT_BROWSERS_PATH=/path/to/browsers
npx playwright install chromium
```

### CORS Errors

If you see CORS errors in the browser console:

1. Ensure the proxy server is running
2. Check that the VITE_PROXY_SERVER environment variable is set correctly
3. Verify that CORS is enabled in the server.js file

### No Data Being Fetched

If no data is being fetched:

1. Check that the proxy server is running
2. Verify network connectivity
3. Check if bookmaker websites have changed their structure
4. Run the selector update tool:
   ```bash
   npm run update-selectors
   ```

## Next Steps

After successful installation:

1. Explore the application and its features
2. Review the documentation in README.md
3. Check REAL-DATA-IMPLEMENTATION.md for details on the real data implementation
4. Refer to DEPLOYMENT.md for production deployment instructions

## Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)

## Support

If you encounter any issues during installation or setup, please:

1. Check the troubleshooting section above
2. Review the documentation
3. Check for similar issues in the project repository
4. Reach out to the project maintainers for assistance 