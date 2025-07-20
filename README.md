# Classified Ads Platform

A high-performance, scalable classified ads platform built with modern web technologies. Features advanced category management, dynamic custom fields, role-based access control, and optimized performance infrastructure.

## 🚀 Features

### Core Functionality
- **Multi-level Category Management**: Hierarchical category system with unlimited depth
- **Dynamic Custom Fields**: Flexible field system with inheritance from parent categories
- **Advanced User Management**: Role-based access control (Admin, Corporate, Individual)
- **Authorized Personnel System**: Corporate users can manage authorized personnel
- **Performance Optimized**: In-memory caching, database indexing, lazy loading

### Category System
- **Hierarchical Structure**: Unlimited category depth with parent-child relationships
- **Custom Field Inheritance**: Automatic field inheritance from parent categories
- **Category Metadata**: Custom labels for hierarchy levels (Ana Kategori, Marka, Seri, Model)
- **Icon Support**: PNG icon upload for visual category identification
- **Smart Navigation**: Breadcrumb navigation with URL-based routing

### Custom Fields System
- **Multiple Field Types**: Text, Number, Select, Number Range, Checkbox, Boolean
- **Unit System**: Flexible unit system for all field types with dropdown selection
- **Value Validation**: Min/max limits for number fields with real-time validation
- **Field Inheritance**: Automatic inheritance from parent categories
- **Professional UI**: Preline UI integration for modern interface design

### User Management
- **Role-Based Access**: Different user types with specific permissions
- **Profile Management**: Complete user profile system with image upload
- **Session Management**: Secure authentication with bcrypt password hashing
- **Contact Information**: Phone numbers, WhatsApp, business phone support

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **Wouter** for lightweight client-side routing
- **TanStack Query** for efficient server state management
- **Preline UI** + **Tailwind CSS** for modern responsive design
- **React Hook Form** with Zod validation for form management

### Backend
- **Express.js** with TypeScript for robust API development
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** with performance indexes for scalability
- **Session-based Authentication** with secure password hashing
- **File Upload Support** with Sharp for image processing

### Performance Infrastructure
- **In-Memory Caching**: Custom cache system with TTL support
- **Database Indexing**: Strategic indexes for optimal query performance
- **Lazy Loading**: Progressive data loading for large datasets
- **Smart Cache Invalidation**: Targeted cache clearing for data consistency
- **Query Optimization**: Reduced database calls through intelligent caching

## 📁 Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages organized by feature
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions and configurations
├── server/                # Backend Express application
│   ├── routes/           # API route handlers
│   ├── cache.ts          # In-memory caching system
│   ├── storage.ts        # Database abstraction layer
│   └── db.ts             # Database connection and configuration
├── shared/               # Shared TypeScript types and schemas
└── uploads/              # File upload storage
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Environment variables configured

### Installation & Development

```bash
# Install dependencies
npm install

# Set up database
npm run db:push

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔧 Configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment (development/production)
- `SESSION_SECRET`: Session encryption key

### Database Schema
The application uses Drizzle ORM with automatic migrations. Schema files are located in `shared/schema.ts`.

## 📊 Performance Features

### Caching Strategy
- **Memory Cache**: 5-minute TTL for categories and custom fields
- **Query Optimization**: Batch operations and reduced database calls
- **Smart Invalidation**: Targeted cache clearing on data mutations

### Database Optimization
- **Strategic Indexes**: Performance indexes on frequently queried columns
- **Efficient Queries**: Optimized joins and data fetching patterns
- **Connection Pooling**: Managed database connections for scalability

## 🔐 Security Features

- **Secure Authentication**: bcrypt password hashing with session management
- **Role-Based Access Control**: Different permission levels for user types
- **Input Validation**: Comprehensive validation using Zod schemas
- **File Upload Security**: Type and size validation for uploaded files

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first responsive interface
- **Modern UI Components**: Preline UI integration for professional appearance
- **Intuitive Navigation**: Clear breadcrumbs and hierarchical navigation
- **Real-time Feedback**: Instant validation and user feedback
- **Accessibility**: ARIA compliant components and keyboard navigation

## 🧪 Code Quality

- **TypeScript**: Full type safety across frontend and backend
- **ESLint Configuration**: Consistent code style and best practices
- **Modular Architecture**: Clean separation of concerns
- **Error Handling**: Comprehensive error handling and user feedback
- **Performance Monitoring**: Built-in performance tracking and optimization

## 📈 Scalability

The platform is designed for scalability with:
- **Modular Architecture**: Easy to extend and maintain
- **Performance Caching**: Reduces database load significantly
- **Optimized Queries**: Efficient database operations
- **Clean API Design**: RESTful API with clear endpoint structure

## 🤝 Development Guidelines

- **Component-Based Architecture**: Reusable, maintainable components
- **TypeScript Best Practices**: Strict typing and interface definitions
- **Performance First**: All features built with performance in mind
- **Security Conscious**: Security considerations in all implementations
- **User Experience Focused**: Intuitive interfaces and smooth interactions

---

Built with ❤️ by a professional development team using modern web technologies and best practices.