# Warehouse Management System (WMS Pro)

## Overview

This is a comprehensive warehouse management system built with a modern full-stack architecture. The application provides inventory tracking, zone management, product management, and real-time dashboard analytics for warehouse operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **Development**: Vite for frontend bundling and hot reload

### Database Design
- **ORM**: Drizzle with PostgreSQL dialect
- **Connection**: Neon serverless PostgreSQL
- **Schema**: Shared types between frontend and backend
- **Migrations**: Drizzle-kit for schema management

## Key Components

### Database Tables
- **users**: User authentication and profile data
- **sessions**: Session storage for authentication
- **zones**: Warehouse location/zone management
- **products**: Product inventory with zone relationships
- **movements**: Stock movement tracking (IN/OUT operations)

### Authentication System
- Replit Auth integration with OpenID Connect
- Session-based authentication with PostgreSQL storage
- Protected routes with middleware
- User profile management

### Core Features
- **Dashboard**: Real-time metrics and analytics
- **Inventory Management**: Product CRUD operations with filtering
- **Zone Management**: Warehouse zone organization
- **Movement Tracking**: Stock movement logs and history
- **Reporting**: Business intelligence and analytics

### API Structure
- RESTful API with Express.js
- Protected routes with authentication middleware
- Structured error handling
- Request/response logging
- Database operations through storage layer

## Data Flow

### Authentication Flow
1. User visits application
2. Redirected to Replit Auth if not authenticated
3. OpenID Connect authentication
4. Session creation and storage
5. Access to protected routes

### Inventory Operations
1. User performs inventory action (add/update/delete)
2. API validates request and user permissions
3. Database transaction through Drizzle ORM
4. Movement log created for stock changes
5. Real-time UI updates via TanStack Query

### Dashboard Metrics
1. Aggregated data queries from multiple tables
2. Real-time calculations for stock levels
3. Zone utilization metrics
4. Recent activity tracking

## External Dependencies

### Database
- **Neon**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database operations
- **connect-pg-simple**: PostgreSQL session store

### Authentication
- **Replit Auth**: OpenID Connect provider
- **Passport.js**: Authentication middleware
- **openid-client**: OpenID Connect client

### Frontend Libraries
- **TanStack Query**: Server state management
- **React Hook Form**: Form handling
- **Zod**: Schema validation
- **date-fns**: Date manipulation
- **Radix UI**: Accessible component primitives

### Development Tools
- **Vite**: Frontend build tool and dev server
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Backend bundling for production

## Deployment Strategy

### Development
- Vite dev server for frontend with hot reload
- tsx for TypeScript execution in development
- Integrated development environment on Replit
- Database migrations with drizzle-kit

### Production Build
- Frontend built with Vite to static assets
- Backend bundled with ESBuild for Node.js
- Environment variables for database and auth configuration
- Session persistence through PostgreSQL

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string
- **SESSION_SECRET**: Session encryption key
- **REPL_ID**: Replit environment identifier
- **ISSUER_URL**: OpenID Connect issuer URL

The application follows modern full-stack practices with type safety, real-time updates, and scalable architecture suitable for warehouse management operations.