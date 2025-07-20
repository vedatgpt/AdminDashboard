# Project Documentation

## Overview

This is a full-stack classified ads platform built with a modern TypeScript stack. The application serves both individual and corporate users, allowing them to post and manage classified advertisements with hierarchical categories and custom fields.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Custom components with Radix UI primitives
- **Styling**: Tailwind CSS with Preline UI components
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Session Management**: Express-session with PostgreSQL store
- **Authentication**: Passport.js with local strategy
- **File Uploads**: Multer for handling multipart/form-data

### Database Architecture
- **Database**: PostgreSQL with Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations
- **Connection**: Connection pooling with @neondatabase/serverless

## Key Components

### Authentication System
- Session-based authentication using express-session
- Role-based access control (admin, corporate, individual, authorized_personnel)
- Password hashing with bcryptjs
- Protected routes with middleware functions

### Category Management
- Hierarchical category structure with unlimited nesting
- Slug-based URLs for SEO optimization
- Custom fields per category with inheritance
- Lazy loading for performance optimization
- Tree-like data structure with parent-child relationships

### User Management
- Multiple user roles with different capabilities
- Corporate users can manage authorized personnel
- Profile management with image uploads
- Contact information management

### Caching System
- In-memory cache with TTL support for performance
- Optimized queries with React Query stale-time configuration
- Cache invalidation strategies for data consistency

## Data Flow

### Category System
1. Categories are loaded lazily as tree structures
2. Custom fields are inherited from parent categories
3. Category metadata includes labeling for different languages
4. Breadcrumb navigation tracks category hierarchy

### User Authentication
1. Login/register through API endpoints
2. Session data stored in PostgreSQL
3. User context managed through React Query
4. Role-based redirects after authentication

### File Management
- Profile images uploaded via multer
- Images processed and stored in uploads directory
- File validation for type and size limits

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations
- **express**: Web application framework
- **react**: Frontend user interface library
- **@tanstack/react-query**: Server state management

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **preline**: Pre-built UI components
- **lucide-react**: Icon library

### Development Tools
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler

## Deployment Strategy

### Build Process
1. Frontend: Vite builds React application to `dist/public`
2. Backend: ESBuild bundles server code to `dist/index.js`
3. Database: Drizzle migrations applied via `db:push` command

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Session secret for secure cookie signing
- Development vs production mode configuration

### File Structure
```
├── client/          # React frontend application
├── server/          # Express backend application
├── shared/          # Shared TypeScript types and schemas
├── migrations/      # Database migration files
└── uploads/         # File upload storage directory
```

### Development Workflow
- `npm run dev`: Start development server with hot reload
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run db:push`: Apply database schema changes

The application is designed to be deployed on platforms that support Node.js applications with PostgreSQL databases, with Replit being the primary target environment.