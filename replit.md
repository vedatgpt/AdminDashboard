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

### UI Component Modernization (July 19, 2025)
- Created reusable ModernNavbar component in components/ModernNavbar.tsx
- Applied modern Tailwind CSS theme to Login and Register pages
- Implemented clean, minimalist design with proper spacing and typography
- Used flex-1 for proper full-height layouts and responsive design
- Integrated orange (#EC7830) brand color in focus states and buttons
- Maintained password visibility toggles and form validation in new design
- Landing page now uses ModernNavbar component for consistency
- All authentication pages follow the same modern design pattern