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

## Recent Changes (July 18, 2025)

### Migration and Setup
- Migrated project from Replit Agent to standard Replit environment
- Set up PostgreSQL database with environment variables
- Pushed database schema using Drizzle migrations
- Created admin user for testing
- Verified all security practices and client/server separation

### Enhanced Registration and Authentication
- Added firstName, lastName, and companyName fields to user schema
- Implemented auto-generated unique usernames (format: firstnamelastname4digits)
- Enhanced registration form with conditional company name field for corporate users
- Modified login to accept both email and username
- Added password visibility toggle to all password inputs
- Moved account type selection to top of registration form

### Navigation Improvements
- Updated logout functionality to use SPA navigation (no page refresh)
- Fixed logout buttons in both sidebar and header dropdown
- Implemented smooth transitions using wouter navigate()

### Profile System
- Created Instagram-style public profile pages accessible via /:username
- Added API endpoint for public user profiles (without sensitive data)
- Integrated profile routing with main application navigation

### Landing Page Enhancements
- Dynamic authentication state display in navbar
- Show "Giriş Yap" button for unauthenticated users
- Show user/company name and "Çıkış Yap" button for authenticated users
- Corporate users display company name, individual users show first/last name
- SPA-compliant logout with smooth navigation

### Admin Panel Structure
- Reorganized admin pages into dedicated `/pages/admin` folder
- Modular file structure for better maintainability
- Updated import paths and routing configuration
- All admin functionality grouped under admin namespace

### Current Test Accounts
- Admin: email "admin@example.com" OR username "admin", password "admin123"
- Sample user: username "velikara6028" (auto-generated from "Veli Kara")
- Corporate test user: username "orhanyenen2548" (auto-generated)