# Visa Portal - Installation Guide

## System Requirements
- Windows 10/11
- Node.js (v18 or higher)
- MongoDB Community Server (v7 or higher)

## Quick Installation

### Option 1: Automated (Run as Administrator)
1. Double-click `installer\setup.bat`
2. It will:
   - Check Node.js and MongoDB
   - Start MongoDB if not running
   - Install npm packages
   - Seed test client data
   - Start the server on port 4500
   - Open your browser

### Option 2: Manual
1. Install MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Make sure MongoDB service is running
3. Open terminal in this folder
4. Run: `npm install`
5. Run: `node database\seed.js`
6. Run: `node server\server.js`
7. Open http://localhost:4500 in your browser

## Access

| Page | URL | Credentials |
|------|-----|-------------|
| Admin Dashboard | http://localhost:4500/admin.html | admin / admin123 |
| Serbia Auth | http://localhost:4500/pages/serbia-auth.html | KO345678 / serbia2026 |
| Norway Landing | http://localhost:4500/pages/norway-landing.html | KN11223344 / norway2026 |
| Australia Landing | http://localhost:4500/pages/australia-landing.html | AU998877 / australia2026 |
| Slovakia Landing | http://localhost:4500/pages/slovakia-landing.html | SK556644 / slovakia2026 |

## Test Flow
1. Open Admin Dashboard -> Login (auto-filled)
2. Click any country sidebar (Serbia, Norway, Australia, Slovakia)
3. Click the link icon next to a client to open their landing page
4. Login with the passport + password above
5. View visa status
