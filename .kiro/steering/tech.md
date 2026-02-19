# Technology Stack

## Platform
- **WeChat Mini Program** - Native WeChat ecosystem application
- **WeChat Cloud Development** - Backend-as-a-Service platform

## Frontend Framework
- **WeChat Mini Program Framework** - Native WXML, WXSS, JavaScript
- **Vant WeApp** v1.11.7 - UI component library for WeChat Mini Programs

## Backend Services
- **WeChat Cloud Database** - NoSQL document database
- **WeChat Cloud Storage** - File storage for images
- **WeChat Cloud Functions** - Serverless functions (currently unused)

## Development Tools
- **WeChat Developer Tools** - Official IDE
- **Node.js/npm** - Package management

## Code Style & Conventions
- **Indentation**: 2 spaces (configured in project.config.json)
- **File naming**: kebab-case for pages and components
- **Component structure**: Standard WeChat Mini Program lifecycle methods

## Common Commands

### Development
```bash
# Install dependencies
npm install

# No build process required - WeChat Developer Tools handles compilation
# Open project in WeChat Developer Tools for development and testing
```

### Package Management
- Dependencies are managed via npm but compiled by WeChat Developer Tools
- Vant WeApp components are imported via miniprogram_npm after npm build in WeChat Developer Tools

## Configuration Files
- `project.config.json` - WeChat Mini Program project configuration
- `app.json` - Application configuration (pages, tabBar, window settings)
- `package.json` - npm dependencies
- `sitemap.json` - Search engine optimization settings