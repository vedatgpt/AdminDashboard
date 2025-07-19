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

### Current Test Accounts
- Admin: email "admin@example.com" OR username "admin", password "admin123"
- Corporate user: email "updated@test.com", username "updatedcorporateuser", password "newpass123"
- Individual user: email "newindividualupdated@test.com", username "testindividual8980", password "newerpass123"