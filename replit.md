# Replit.md

## Overview

This is a full-stack web application built with React, Express.js, and PostgreSQL. It appears to be an admin panel for managing users, ads, categories, and locations. The application uses modern web technologies including TypeScript, Tailwind CSS, and shadcn/ui components.

## User Preferences

Preferred communication style: Simple, everyday language.

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

The application is in early development with:
- Basic UI structure and navigation implemented
- Database schema defined for users
- In-memory storage as temporary data layer
- Empty state components for all main sections
- Ready for API implementation and database integration

The storage layer is currently using MemStorage class but is designed to be easily replaced with actual database operations using the Drizzle ORM setup.