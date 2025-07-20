# Replit.md

## Overview

This is a full-stack web application built with React, Express.js, and PostgreSQL. It appears to be an admin panel for managing users, ads, categories, and locations. The application uses modern web technologies including TypeScript, Tailwind CSS, and shadcn/ui components.

## User Preferences

Preferred communication style: Simple, everyday language.
Primary color: #EC7830 (orange)
Background: White
No shadow effects anywhere
Font: Inter
URL structure: All admin pages under /admin prefix (e.g., /admin/users)
Logo: Custom logo in sidebar (attached_assets/logo_1752808818099.png)

## System Architecture

The application follows a monorepo structure with clear separation between client and server code:

- **Frontend**: React with TypeScript, Vite for bundling
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Bundler**: Vite with custom configuration for development and production
- **Routing**: Wouter for client-side routing
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for API state management

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Development**: Hot reloading with tsx
- **Production**: Compiled with esbuild

### Database Schema
- **Users Table**: Basic user management with id, username, password fields
- **Database**: PostgreSQL with Drizzle migrations support
- **Validation**: Zod schemas for type-safe validation

### UI Structure
- **Layout**: Responsive design with collapsible sidebar
- **Components**: Reusable data table, empty states, page headers
- **Navigation**: Multi-page admin interface (Users, Ads, Categories, Locations)
- **Theming**: Light/dark mode support with CSS custom properties

## Data Flow

1. **Client Requests**: React components use TanStack Query to fetch data
2. **API Layer**: Express.js routes handle HTTP requests (prefixed with /api)
3. **Storage Layer**: Currently using in-memory storage (MemStorage class)
4. **Database**: Drizzle ORM configured for PostgreSQL migrations

## External Dependencies

### Key Libraries
- **UI**: @radix-ui components, lucide-react icons
- **Forms**: react-hook-form with @hookform/resolvers
- **Database**: drizzle-orm, @neondatabase/serverless
- **Build Tools**: vite, esbuild, tsx
- **Styling**: tailwindcss, class-variance-authority, clsx

### Development Tools
- **Runtime**: Node.js with ES modules
- **TypeScript**: Strict mode enabled
- **Code Quality**: Path aliases configured for clean imports

## Deployment Strategy

### Development
- **Command**: `npm run dev` - Runs server with hot reloading
- **Environment**: NODE_ENV=development
- **Features**: Vite dev server, runtime error overlay, Replit integration

### Production
- **Build**: `npm run build` - Bundles client and server code
- **Server**: `npm start` - Runs compiled server
- **Output**: Client builds to `dist/public`, server to `dist/index.js`

### Database Management
- **Migrations**: `npm run db:push` - Pushes schema changes
- **Config**: Drizzle config expects DATABASE_URL environment variable

## Current State

The application has been successfully migrated to standard Replit environment with full authentication system:
- Complete admin panel with responsive design
- PostgreSQL database with user authentication (migrated from Replit Agent)
- Session-based authentication with bcrypt password hashing
- Role-based access control (Admin, Editor, Corporate, Individual)
- Login/Register pages with form validation
- Protected admin routes requiring admin role
- Landing page for non-admin users
- Database storage implemented with Drizzle ORM
- All dependencies installed and configured for Replit compatibility

Authentication features:
- Admin users access full admin panel
- Non-admin users redirected to landing page
- Session management with secure logout
- Form validation using Zod schemas
- Test admin account: username "admin", password "admin123"

## Recent Changes (July 19, 2025)

### Account Management System Enhancement
- Restructured account system with organized route structure
- Main account page at /account with navigation options
- Dedicated profile management at /account/profile
- Separate password change page at /account/change-password
- Separate email change page at /account/change-email
- Modular file organization under /pages/account/ directory

### Profile Image Management for Corporate Users
- Added profile image upload capability for corporate users only
- File restrictions: 5MB maximum, JPG/PNG formats only
- Image compression using Sharp (resize to 400x400, 85% quality)
- Organized file structure: `/uploads/users/{userId}/profile-images/`
- User-specific directories based on permanent userId (not username)
- Automatic cleanup of old profile images when new ones are uploaded

### Account Profile Features
- Profile information management (firstName, lastName)
- Company name field positioned above name fields for corporate users
- Username editing capability for corporate users only
- URL-friendly username validation and uniqueness checking
- Real-time preview of profile URL for username changes
- Form validation using Zod schemas with comprehensive error handling
- Improved cache invalidation for immediate UI updates

### Email Management
- Dedicated /account/change-email page for email updates
- Removed "current email" display field for cleaner interface
- Email uniqueness validation across all users
- Proper form reset after successful email updates

### Password Change Improvements  
- Simplified password change form (removed confirmation field)
- Current password verification required
- Minimum 6-character password validation
- Password visibility toggles on all password inputs
- Enhanced security with bcrypt hashing

### API Endpoints for User Management
- PATCH /api/user/profile - Update profile (firstName, lastName, companyName, username)
- PATCH /api/user/change-email - Separate email update endpoint
- PATCH /api/user/change-password - Secure password change with verification
- POST /api/user/profile-image - Upload profile image (corporate users only)
- DELETE /api/user/profile-image - Remove profile image (corporate users only)
- Role-based field access control throughout all endpoints

### Technical Improvements
- Fixed authentication middleware for consistent session handling
- Enhanced error handling and user feedback across all forms
- Improved cache invalidation and data synchronization
- Static file serving for user-uploaded content
- Comprehensive form state management with proper resets

### Navigation Updates
- "Hesap" (Account) button in navbar for authenticated users
- Account navigation added to admin sidebar
- Consistent SPA navigation throughout the application
- Logout functionality on main account page

### Contact Information Management (July 19, 2025)
- Added contact information fields to user schema: mobilePhone, whatsappNumber, businessPhone
- Enhanced profile management with "İletişim Bilgilerim" section
- Individual users: Mobile Phone and WhatsApp Number fields
- Corporate users: Mobile Phone, WhatsApp Number, and Business Phone fields
- Database schema updated with new contact fields
- API endpoints updated to handle contact information updates
- Real-time form updates and cache synchronization maintained

### Current Test Accounts
- Admin: email "admin@example.com" OR username "admin", password "admin123"
- Corporate user: email "updated@test.com", username "updatedcorporateuser", password "newpass123"
- Individual user: email "newindividualupdated@test.com", username "testindividual8980", password "newerpass123"

## Recent Changes (July 19, 2025) - Authorized Personnel System

### Comprehensive Authorized Personnel Management System
- Added complete database schema for authorized personnel with proper foreign key relationships
- Extended user management system to support corporate user hierarchy
- Implemented role-based access control for corporate users and their authorized personnel

### Database Schema Enhancements
- Created `authorized_personnel` table with fields: id, companyUserId, email, password, firstName, lastName, mobilePhone, whatsappNumber, isActive
- Added proper foreign key constraints with cascade delete for data integrity
- Implemented timestamps for creation and update tracking
- All personnel emails must be unique across the entire system

### Authorized Personnel Management Features
- Corporate users can create, edit, delete, and manage authorized personnel
- Personnel can be activated/deactivated without deletion
- Secure password hashing for all personnel accounts
- Email uniqueness validation across both users and authorized personnel tables
- Company-specific personnel lists (users can only manage their own personnel)

### API Endpoints for Personnel Management
- GET /api/authorized-personnel - List all personnel for current corporate user
- POST /api/authorized-personnel - Create new authorized personnel
- PATCH /api/authorized-personnel/:id - Update existing personnel information
- PATCH /api/authorized-personnel/:id/toggle-status - Activate/deactivate personnel
- DELETE /api/authorized-personnel/:id - Permanently delete personnel
- All endpoints include proper role validation and ownership verification

### User Interface Components
- Complete AuthorizedPersonnel.tsx page with comprehensive personnel management
- Add/Edit dialogs with form validation and password visibility toggles
- Personnel listing with status badges and action buttons
- Empty state handling for new corporate users
- Real-time status updates and cache synchronization
- Responsive design matching the overall application theme

### Security Features
- Role-based access (only corporate users can access personnel management)
- Ownership verification (users can only manage their own personnel)
- Secure password handling with bcrypt hashing
- Email uniqueness validation across entire system
- Proper error handling and user feedback

### Navigation Integration
- "Yetkili Kişiler" menu item added to corporate user account pages
- Role-based menu display (only shown to corporate users)
- Proper SPA navigation integration
- Consistent UI/UX with existing account management sections

### Technical Implementation
- Extended IStorage interface with comprehensive personnel management methods
- Database storage implementation with proper error handling
- Form validation using Zod schemas
- TanStack Query integration for efficient data management
- Comprehensive TypeScript typing throughout the system

### Authorized Personnel Authentication System - FULLY OPERATIONAL (July 19, 2025)
- Complete dual authentication flow supporting both regular users and authorized personnel
- Frontend-backend integration with proper field mapping (emailOrUsername → loginIdentifier)
- Email-based authentication for personnel with secure password verification
- Session management with "personnel" userType and "authorized_personnel" role
- Personnel dashboard with company information and personal details
- Proper session handling and logout functionality for all user types
- Role-based routing: admin → admin panel, personnel → personnel dashboard, others → landing page
- Authentication endpoints fully tested and operational for all user types
- Fixed session data handling to prevent data leakage between user types

### Code Modularization and Organization (July 19, 2025)
- AuthorizedPersonnel system completely refactored into modular components
- Created useAuthorizedPersonnel.ts custom hook for API operations and state management
- Separated AuthorizedPersonnelForm.tsx for all form operations (add/edit)
- Isolated AuthorizedPersonnelList.tsx for personnel listing and actions
- Reduced main AuthorizedPersonnel.tsx from 600+ lines to 109 lines
- Improved code reusability, testability, and maintainability

### Pages Directory Organization (July 19, 2025)
- Reorganized pages directory with logical folder structure:
  - `/auth/` - Login.tsx, Register.tsx (authentication pages)
  - `/public/` - Landing.tsx, Profile.tsx, not-found.tsx (public pages)
  - `/dashboard/` - PersonnelDashboard.tsx (dashboard pages)
  - `/account/` - Account management pages (existing structure maintained)
  - `/admin/` - Admin panel pages (existing structure maintained)
- Updated App.tsx imports to reflect new directory structure
- Improved project navigation and file organization

### UI Library Migration: Shadcn to Preline UI (July 19, 2025)
- Completely removed Shadcn UI library and all @radix-ui dependencies
- Successfully installed and configured Preline UI with Tailwind CSS integration
- Updated all AuthorizedPersonnel components to use native HTML elements:
  - AuthorizedPersonnelForm: Modal dialogs with native form elements
  - AuthorizedPersonnelList: Card layouts using plain HTML and Tailwind classes
  - Toast notifications: Simplified browser alerts (temporary solution)
- Removed passive/inactive button functionality from AuthorizedPersonnel system
- Updated Tailwind config to include Preline plugin and forms plugin
- Fixed CSS imports and JavaScript integration for Preline UI
- System now running without Shadcn dependencies - fully operational

### Modern Navbar Component Implementation (July 19, 2025)
- Created new ModernNavbar component in /components/Navbar.tsx using Preline UI
- Implemented comprehensive user dropdown with profile navigation
- Added search functionality with proper input handling
- Integrated component into Landing page with proper import structure
- Updated main.tsx with Preline UI JavaScript initialization
- Navbar features: responsive design, user authentication states, dropdown menus
- All components now use Preline UI standards instead of Shadcn components

### Performance Optimizations & Security Improvements (July 19, 2025)
- Fixed search input to remove all border/ring effects for cleaner UI
- Hidden admin profile from public access (/admin usernames blocked)
- Optimized useAuth hook with 5-minute staleTime and 10-minute cache time
- Reduced unnecessary API calls by disabling refetchOnWindowFocus and refetchOnMount
- Added caching to Profile component with 2-minute staleTime
- Improved dropdown menu implementation with individual button handlers
- Enhanced Preline UI dropdown initialization for better functionality

### Page-Based Category Management System with Icon Support (July 19, 2025)
- Migrated from tree view to page-based navigation system with full-width design
- URL-based navigation: /admin/categories/:parentId for hierarchical browsing with proper sidebar highlighting
- Categories display simplified with alt kategori sayısı next to category name (e.g., "Otomobil (3)")
- Completely removed description fields and parent/sorting fields from all forms and modals
- Added comprehensive category icon upload system (PNG format only, 2MB max)
- Icons displayed to the left of category names, similar to sahibinden.com design
- Category form supports icon upload, preview, and removal functionality with proper state management
- Enhanced drag & drop reordering with improved visual feedback and performance
- All categories clickable regardless of having children
- Breadcrumb navigation positioned next to search box for better UX
- Removed right panel for cleaner, full-width category management interface
- Enhanced hover effects with buttons (edit, delete, add child) visible on hover
- Real-time category count updates and optimized sort order management
- Static file serving for category icons via /uploads/category-icons/ endpoint
- Turkish character slug generation maintained (ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u)
- Full CRUD operations with comprehensive error handling and user feedback
- Fixed hierarchical slug management (same slug allowed in different parent categories)
- Mobile-responsive button layout matching other admin pages
- Proper form state management preventing icon persistence between form sessions

### Temporary Ad Posting Test Page Implementation (July 20, 2025)
- Created /post-ad test page accessible to all users for testing category and custom fields functionality
- Implemented step-by-step category selection with hierarchical navigation
- Added breadcrumb navigation showing selected category path with ability to go back to any level
- Custom fields automatically load when final category (leaf node) is selected
- Support for all custom field types: text, number, select, number_range, checkbox, boolean
- Visual feedback shows field type, placeholder, options, and required status
- Made custom fields API endpoint public (removed requireAdmin middleware)
- Added "İlan Ver" button to landing page for easy access
- Removed form submission - page focuses purely on testing category/custom field functionality
- Clean UI with success/completion messages when category selection is finished
- Test page clearly marked as temporary for category and custom fields validation

### Comprehensive Unit System Implementation (July 20, 2025)
- Added complete unit system to custom fields for all field types (text, number, select, checkbox, number_range, boolean)
- Database schema extended with hasUnits, unitOptions (JSON array), and defaultUnit fields
- CustomFieldsModal updated with "Birim Sistemi" section for unit configuration
- Unit options stored as JSON arrays (e.g., ["km", "mil", "metre"]) with validation
- PostAd page renders input + unit dropdown for fields with units enabled
- Value and unit stored separately in database: {value: "52000", unit: "km"}
- Unit dropdown positioned to the right of input field with 32px width (w-32)
- Default unit pre-selected from field configuration
- Complete form validation for unit options and default unit selection
- All field types support optional unit system - flexible and universal implementation
- Admin interface shows unit information in field listings with default unit display
- Smart unit dropdown: disabled (gray) when only 1 unit option exists - perfect for fields like motor power (300 hp)

### Number Field Min/Max Value Limits (July 20, 2025)
- Added minValue and maxValue fields to custom fields database schema for number type fields
- CustomFieldsModal updated with "Değer Sınırları" section showing min/max input fields (2-column grid)
- Real-time validation: max value must be greater than min value
- PostAd page enforces min/max limits during input - auto-corrects out-of-range values
- Admin interface displays value limits in field listings (Min: X, Max: Y)
- Perfect for fields like motor volume (max 9999cc), horsepower limits, year ranges
- Min/Max validation is optional - fields work normally when limits not set
- Smart input prevention: blocks characters that would exceed limits instead of auto-correcting

### Preline UI Integration for Unit Fields (July 20, 2025)
- Implemented Preline UI inline select design for all fields with units enabled
- Input field with integrated unit dropdown on the right side (similar to price/currency design)
- Unified design for text, number, and select fields when units are enabled
- Unit dropdown positioned absolutely within input container using pe-20 and pe-px classes
- Maintains all existing functionality: disabled state for single units, min/max validation
- Clean, professional appearance matching Preline UI standards