# Project Structure

## Root Directory
```
├── miniprogram/           # Mini program source code
├── cloudfunctions/        # Cloud functions (currently empty)
├── project.config.json    # WeChat project configuration
├── project.private.config.json # Private project settings
├── README.md             # Project documentation
└── uploadCloudFunction.sh # Cloud function deployment script
```

## Miniprogram Directory Structure
```
miniprogram/
├── app.js                # Application entry point
├── app.json             # App configuration (pages, tabBar, etc.)
├── app.wxss             # Global styles
├── envList.js           # Environment configuration
├── sitemap.json         # SEO configuration
├── package.json         # Dependencies
├── components/          # Custom components
│   └── cloudTipModal/   # Cloud tip modal component
├── custom-tab-bar/      # Custom tab bar implementation
├── images/              # Static image assets
│   └── icons/           # Icon assets
├── pages/               # Application pages
└── miniprogram_npm/     # Compiled npm packages (Vant WeApp)
```

## Page Structure Convention
Each page follows WeChat Mini Program standard structure:
```
pages/[page-name]/
├── [page-name].js       # Page logic and lifecycle
├── [page-name].json     # Page configuration
├── [page-name].wxml     # Page template (markup)
└── [page-name].wxss     # Page styles
```

## Key Pages
- `index/` - Main landing page
- `garage/` - Vehicle management (list, edit, delete)
- `car-add/` - Add new vehicle
- `car-edit/` - Edit existing vehicle
- `lease-new/` - Create new lease
- `lease-extend/` - Extend existing lease
- `lease-end/` - End lease and settlement
- `notice/` - Notifications
- `user/` - User profile
- `home/` - Home dashboard

## Component Architecture
- **Custom Tab Bar**: Implemented as custom component using Vant WeApp
- **Vant WeApp Components**: UI library components imported from miniprogram_npm
- **Page Components**: Standard WeChat Mini Program page structure

## Asset Organization
- `images/` - Static assets organized by type
- `images/icons/` - UI icons for navigation and actions
- Cloud storage used for user-uploaded vehicle images

## Configuration Files
- `app.json` - Defines page routes, tab bar, and global window settings
- Page-level `.json` files - Configure individual page properties and component usage