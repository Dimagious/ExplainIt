# ExplainIt! 🚀

AI-powered Chrome Extension for instant text explanations.

## Overview

**ExplainIt!** helps you understand any text on the web instantly. Simply select text, click the icon, and get an AI-powered explanation in your preferred language and tone.

### Features

- 🎯 **Instant Explanations**: Get explanations in ≤1.5 seconds
- 🌍 **Multi-language**: Support for English and Russian (MVP)
- 🎨 **3 Tone Levels**: Simple, Kid-friendly, or Expert explanations
- ⚡ **Fast & Lightweight**: Extension size <1MB
- 🔒 **Secure**: No data stored, privacy-focused

## Tech Stack

### Chrome Extension
- Vanilla JavaScript (ES2021+)
- Chrome Manifest V3
- Content Scripts + Background Service Worker

### Backend
- Node.js 18+
- Express.js
- OpenAI API (gpt-4o-mini)

## Local Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Chrome browser (latest)
- OpenAI API key

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/ExplainIt.git
cd ExplainIt
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your OpenAI API key to .env
# OPENAI_API_KEY=sk-your-actual-key-here

# Start development server
npm run dev
```

The backend will run on `http://localhost:3000`

**Verify backend is running**:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.45
}
```

### 3. Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `extension/` directory from this project
5. The ExplainIt! extension should now appear in your extensions list

**Verify extension is loaded**:
- You should see the ExplainIt! icon in your Chrome toolbar
- Click it to open the popup (should show "ExplainIt!" heading)

### 4. Test the Setup

1. Navigate to any webpage
2. Open Chrome DevTools (F12)
3. Check Console - you should see:
   ```
   ExplainIt! content script loaded
   ExplainIt! background service worker loaded
   ```

## Project Structure

```
ExplainIt/
├── extension/              # Chrome Extension
│   ├── manifest.json       # Extension manifest (MV3)
│   ├── content.js          # Content script (runs on webpages)
│   ├── content.css         # Content script styles
│   ├── background.js       # Background service worker
│   ├── popup.html          # Popup UI
│   ├── popup.js            # Popup logic
│   ├── popup.css           # Popup styles
│   └── icons/              # Extension icons
│
├── backend/                # Backend API
│   ├── server.js           # Express server entry point
│   ├── routes/             # API routes
│   ├── middleware/         # Express middleware
│   ├── services/           # Business logic (OpenAI, prompts)
│   ├── utils/              # Utilities (logger, constants)
│   ├── package.json        # Backend dependencies
│   └── .env.example        # Environment variables template
│
├── .bmad/                  # BMad project artifacts
│   ├── epics/              # Epic definitions
│   ├── stories/            # User stories
│   ├── tasks/              # Development tasks
│   ├── architecture/       # System architecture
│   └── ...                 # Other project docs
│
├── .eslintrc.json          # ESLint configuration
├── .prettierrc             # Prettier configuration
├── .editorconfig           # Editor configuration
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## Development Workflow

### Running Backend

```bash
cd backend

# Development mode (with auto-reload)
npm run dev

# Production mode
npm start

# Lint code
npm run lint

# Format code
npm run format
```

### Reloading Extension

After making changes to extension code:

1. Go to `chrome://extensions/`
2. Click the **Reload** button on ExplainIt! card
3. Refresh any webpages you're testing on

### Code Quality

This project uses:
- **ESLint**: Code linting (Airbnb style guide)
- **Prettier**: Code formatting
- **EditorConfig**: Editor consistency

```bash
# Run linter
cd backend && npm run lint

# Fix linting issues
cd backend && npm run lint:fix

# Format code
cd backend && npm run format
```

## Testing

### Manual Testing

1. **Text Selection**:
   - Go to any webpage
   - Select some text
   - Verify icon appears (TODO: US-001)

2. **Health Check**:
   ```bash
   curl http://localhost:3000/health
   ```

3. **Extension Popup**:
   - Click extension icon
   - Verify popup opens
   - Check DevTools Console for errors

### Automated Tests

Coming soon in v1.1:
- Unit tests (Jest)
- E2E tests (Playwright)
- Integration tests

## Environment Variables

### Backend (.env)

```bash
# Required
OPENAI_API_KEY=sk-...         # Your OpenAI API key

# Optional
PORT=3000                     # Server port (default: 3000)
NODE_ENV=development          # Environment (development|production)
RATE_LIMIT_MAX=10             # Max requests per minute
```

## Troubleshooting

### Backend won't start

- Check Node.js version: `node --version` (should be >=18)
- Verify `.env` file exists and has `OPENAI_API_KEY`
- Check port 3000 is not in use: `lsof -i :3000`

### Extension not loading

- Make sure you selected the `extension/` folder (not root)
- Check Chrome DevTools for errors
- Verify `manifest.json` is valid JSON

### Content script not running

- Reload the extension
- Refresh the webpage you're testing on
- Check Console in Chrome DevTools

## Documentation

Full project documentation available in `.bmad/`:

- [Product Vision](.bmad/product/vision.md)
- [Architecture](.bmad/architecture/system-architecture.md)
- [API Documentation](.bmad/api/api-documentation.md)
- [User Stories](.bmad/stories/)
- [Development Tasks](.bmad/tasks/)
- [Roadmap](.bmad/roadmap/product-roadmap.md)

## Development Status

**Current Phase**: Foundation Sprint Zero ✅  
**Next**: Sprint 1 - US-001 Text Selection

See [Roadmap](.bmad/roadmap/product-roadmap.md) for detailed timeline.

## Contributing

This project follows the BMad methodology. See:
- [Git Governance Rules](.cursor/rules/bmad/git-governance.mdc)
- [Traceability Matrix](.bmad/TRACEABILITY.md)

### Commit Message Format

```
<type>(scope): short description [US-###|TASK-###]

Examples:
feat(content-script): implement text selection detection [US-001]
fix(api): handle OpenAI timeout correctly [TASK-071]
chore: add ESLint configuration [SPRINT-0]
```

## License

MIT

## Support

- Email: support@explainit.app
- Issues: [GitHub Issues](https://github.com/yourusername/ExplainIt/issues)

---

**Status**: 🟢 Development  
**Version**: 1.0.0 (MVP in progress)  
**Last Updated**: 2024-01-15
