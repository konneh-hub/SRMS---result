# University Backend API

A multi-tenant Node.js backend application built with Express.js for managing university systems with JWT authentication. This API supports multiple tenants (universities/campuses) with isolated data and provides CRUD operations for universities, students, and user management.

## Features

- **JWT Authentication**: Secure user authentication with role-based access control
- **Multi-tenant Architecture**: Each tenant has isolated data using tenant IDs with row-level security
- **PostgreSQL Connection Pooling**: Efficient database connection management with configurable pool settings
- **Express.js Framework**: Fast, unopinionated web framework with modular structure
- **Database Health Monitoring**: Built-in health checks and connection monitoring
- **Security Middleware**: Helmet for security headers, CORS support
- **Comprehensive Logging**: Request logging with Morgan and custom database query logging
- **Input Validation**: Server-side validation for all API endpoints
- **Error Handling**: Centralized error handling with appropriate HTTP status codes
- **Transaction Support**: Database transaction support for complex operations

## Project Structure

```
src/
├── config/
│   └── database.js          # Enhanced PostgreSQL connection pool with multi-tenant support
├── controllers/
│   ├── authController.js    # Authentication endpoints (login, register, profile)
│   ├── universityController.js  # HTTP request/response handling for universities
│   └── studentController.js     # HTTP request/response handling for students
├── middleware/
│   ├── auth.js              # JWT authentication and authorization middleware
│   └── tenant.js            # Multi-tenant middleware for request isolation
├── models/
│   └── schema.js            # Database schema definitions (including users table)
├── repositories/
│   ├── baseRepository.js    # Generic database operations base class
│   ├── userRepository.js    # User-specific data access operations
│   ├── universityRepository.js  # University-specific data access operations
│   └── studentRepository.js     # Student-specific data access operations
├── routes/
│   ├── auth.js              # Authentication API routes
│   ├── index.js             # Main router with health check
│   ├── universities.js      # University API routes
│   └── students.js          # Student API routes
├── services/
│   ├── authService.js       # Authentication business logic and JWT handling
│   ├── universityService.js # University business logic and validation
│   └── studentService.js    # Student business logic and validation
└── utils/
    └── helpers.js           # Utility functions and logger
```

## Architecture Overview

This application follows a **clean architecture** pattern with clear separation of concerns:

### **Controllers Layer**
- Handle HTTP requests and responses
- Input validation and error formatting
- HTTP status code management
- Thin layer focused only on web concerns

### **Services Layer**
- Business logic and validation
- Orchestration of complex operations
- Data transformation and processing
- Error handling and business rules

### **Repositories Layer**
- Data access abstraction
- Database query execution
- CRUD operations with tenant isolation
- Query optimization and performance

### **Routes Layer**
- API endpoint definitions
- Route organization and middleware
- Request routing and parameter extraction

### **Middleware Layer**
- Cross-cutting concerns (authentication, logging, tenant isolation)
- Request preprocessing
- Response postprocessing

### **Configuration Layer**
- Database connection management
- Environment configuration
- External service integrations

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd university-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env` file and update the values:
   ```env
   NODE_ENV=development
   PORT=3000
   DATABASE_URL=postgresql://username:password@localhost:5432/university_db

   # Database Pool Configuration
   DB_MAX_CONNECTIONS=20
   DB_IDLE_TIMEOUT=30000
   DB_CONNECTION_TIMEOUT=2000
   DB_ACQUIRE_TIMEOUT=60000

   # JWT Configuration
   JWT_SECRET=your_super_secure_jwt_secret_key_here_change_this_in_production
   JWT_EXPIRES_IN=24h
   ```

4. Set up the database:
   - Create a PostgreSQL database
   - Update the `DATABASE_URL` in your `.env` file
   - Initialize the database schema:
     ```bash
     npm run db:init
     ```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on the port specified in your `.env` file (default: 3000).

## Database Configuration

The application uses a sophisticated PostgreSQL connection pool with the following features:

- **Connection Pooling**: Configurable pool size with automatic connection management
- **Health Monitoring**: Real-time connection health checks
- **Query Logging**: Performance monitoring and slow query detection
- **Transaction Support**: Built-in transaction handling
- **Multi-tenant Isolation**: Row-level security ensuring tenant data isolation

### Pool Configuration Options

- `DB_MAX_CONNECTIONS`: Maximum number of connections in the pool (default: 20)
- `DB_IDLE_TIMEOUT`: Time in milliseconds to keep idle connections (default: 30000)
- `DB_CONNECTION_TIMEOUT`: Connection timeout in milliseconds (default: 2000)
- `DB_ACQUIRE_TIMEOUT`: Client acquisition timeout in milliseconds (default: 60000)

## API Endpoints

All endpoints require a `x-tenant-id` header for multi-tenant isolation. Protected endpoints also require a `Authorization: Bearer <jwt-token>` header.

### Authentication Endpoints

#### Register User
- `POST /api/auth/register` - Register a new user account
- **Body**: `{"email": "string", "password": "string", "firstName": "string", "lastName": "string", "role": "system_admin|university_admin|dean|hod|exam_officer|lecturer|student", "universityId": number, "department": "string"}`

#### Login
- `POST /api/auth/login` - Authenticate user and get JWT token
- **Body**: `{"email": "string", "password": "string"}`

#### Get User Profile
- `GET /api/auth/profile` - Get current user profile information

#### Change Password
- `PUT /api/auth/change-password` - Change user password
- **Body**: `{"oldPassword": "string", "newPassword": "string"}`

#### Admin: Get All Users
- `GET /api/auth/users` - Get all users for the tenant (admin only)

#### Admin: Update User Role
- `PUT /api/auth/users/:userId/role` - Update user role (admin only)
- **Body**: `{"role": "system_admin|university_admin|dean|hod|exam_officer|lecturer|student"}`

#### Admin: Delete User
- `DELETE /api/auth/users/:userId` - Delete user account (admin only)

### Universities Endpoints (Protected)

- `GET /api/universities` - Get all universities for the tenant
- `GET /api/universities/stats` - Get universities with student count statistics
- `GET /api/universities/:id` - Get a specific university
- `POST /api/universities` - Create a new university
- `PUT /api/universities/:id` - Update a university
- `DELETE /api/universities/:id` - Delete a university

### Students Endpoints (Protected)

- `GET /api/students` - Get all students for the tenant (with university info)
- `GET /api/students/stats` - Get student statistics for the tenant
- `GET /api/students/university/:universityId` - Get students by university
- `GET /api/students/:id` - Get a specific student
- `POST /api/students` - Create a new student
- `PUT /api/students/:id` - Update a student
- `DELETE /api/students/:id` - Delete a student

### Health Check

- `GET /api/health` - Comprehensive health check including database status

## Request Examples

### Authentication Examples

#### Register a System Admin
```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant123" \
  -d '{
    "email": "admin@university.edu",
    "password": "securepassword123",
    "firstName": "System",
    "lastName": "Administrator",
    "role": "system_admin"
  }'
```

#### Register a University Admin
```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant123" \
  -d '{
    "email": "uadmin@university.edu",
    "password": "securepassword123",
    "firstName": "University",
    "lastName": "Admin",
    "role": "university_admin",
    "universityId": 1
  }'
```

#### Register a Student
```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant123" \
  -d '{
    "email": "student@university.edu",
    "password": "securepassword123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "universityId": 1,
    "department": "Computer Science"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant123" \
  -d '{
    "email": "admin@university.edu",
    "password": "securepassword123"
  }'
```

#### Get User Profile
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     -H "x-tenant-id: tenant123" \
     http://localhost:3002/api/auth/profile
```

### Health Check
```bash
curl -H "x-tenant-id: tenant123" http://localhost:3000/api/health
```

### Create a University
```bash
curl -X POST http://localhost:3000/api/universities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "x-tenant-id: tenant123" \
  -d '{
    "name": "Example University",
    "location": "Example City",
    "established_year": 1900
  }'
```

### Get University Statistics
```bash
curl -H "x-tenant-id: tenant123" http://localhost:3000/api/universities/stats
```

### Get Student Statistics
```bash
curl -H "x-tenant-id: tenant123" http://localhost:3000/api/students/stats
```

### Get Students by University
```bash
curl -H "x-tenant-id: tenant123" http://localhost:3000/api/students/university/1
```

## Multi-Tenant Architecture

This application implements a **shared database with row-level isolation** multi-tenant architecture:

### Key Features:
- **Tenant Identification**: Each request must include `x-tenant-id` header
- **Data Isolation**: All queries include tenant filtering to ensure data separation
- **Schema Sharing**: Single database schema shared across tenants
- **Performance**: Optimized with tenant-specific indexes
- **Security**: Row-level security prevents cross-tenant data access

### Tenant Context:
- Tenant ID is extracted from request headers
- All database operations are scoped to the requesting tenant
- Foreign key relationships maintain referential integrity within tenant boundaries

## Authentication & Authorization

### JWT Authentication
- **Token-based Authentication**: Users receive JWT tokens upon login/registration
- **Token Expiration**: Configurable expiration time (default: 24 hours)
- **Secure Storage**: Tokens should be stored securely on the client side

### User Roles Hierarchy

The system implements a comprehensive role-based access control with the following roles:

#### **System Admin** (`system_admin`)
- **Highest Level Access**: Can manage all tenants and universities
- **Capabilities**: Full system administration, user management across all tenants
- **Restrictions**: Not assigned to specific universities

#### **University Admin** (`university_admin`)
- **University Management**: Can manage their assigned university
- **Capabilities**: Create/edit university data, manage university staff
- **Scope**: Limited to their assigned university

#### **Dean** (`dean`)
- **Academic Leadership**: Senior academic position
- **Capabilities**: Oversee academic programs, approve major decisions
- **Scope**: Limited to their assigned university

#### **Head of Department (HOD)** (`hod`)
- **Department Leadership**: Manage specific academic departments
- **Capabilities**: Department-level administration, staff supervision
- **Scope**: Limited to their department and university

#### **Exam Officer** (`exam_officer`)
- **Examination Management**: Handle examination processes
- **Capabilities**: Create/manage exams, results, academic records
- **Scope**: Limited to their assigned university

#### **Lecturer** (`lecturer`)
- **Teaching Staff**: Deliver course content
- **Capabilities**: Access student data, submit grades, course management
- **Scope**: Limited to their assigned university and courses

#### **Student** (`student`)
- **Basic User**: Access to personal academic data
- **Capabilities**: View grades, course registration, personal profile
- **Scope**: Limited to their own data within their university

### Role-Based Middleware

The system provides comprehensive middleware for access control:

#### **Individual Role Middleware**
- `requireSystemAdmin` - System admin only
- `requireUniversityAdmin` - University admin only
- `requireDean` - Dean only
- `requireHod` - Head of department only
- `requireExamOfficer` - Exam officer only
- `requireLecturer` - Lecturer only
- `requireStudent` - Student only

#### **Group Role Middleware**
- `requireAcademicStaff` - Dean, HOD, Exam Officer, Lecturer
- `requireAdministrativeStaff` - System Admin, University Admin
- `requireTeachingStaff` - HOD, Lecturer
- `requireManagementStaff` - Dean, HOD, Exam Officer
- `requireUniversityStaff` - All roles except System Admin

#### **Access Control Middleware**
- `requireAuthenticated` - Any authenticated user
- `requireUniversityAccess` - Ensures users can only access their assigned university
- `requireDepartmentAccess` - Department-level access control (extensible)

### Authorization Middleware
- **authenticate**: Verifies JWT token and attaches user info to request
- **authorize**: Role-based access control for specific roles
- **requireUniversityAccess**: University-scoped access control
- **requireDepartmentAccess**: Department-scoped access control

### Security Features
- **Password Hashing**: bcrypt with 12 salt rounds
- **Token Verification**: Server-side JWT validation
- **Role-based Access**: Granular permissions based on user roles
- **Tenant Isolation**: Users can only access data within their tenant
- **University Isolation**: Users can only access their assigned university (except system admins)

## Database Schema

### Users Table
- `id` (SERIAL PRIMARY KEY)
- `email` (VARCHAR(255) UNIQUE NOT NULL)
- `password_hash` (VARCHAR(255) NOT NULL)
- `first_name` (VARCHAR(100))
- `last_name` (VARCHAR(100))
- `role` (VARCHAR(50) NOT NULL) - system_admin, university_admin, dean, hod, exam_officer, lecturer, student
- `university_id` (INTEGER, FOREIGN KEY to universities.id)
- `department` (VARCHAR(100))
- `tenant_id` (VARCHAR(255) NOT NULL)
- `is_active` (BOOLEAN DEFAULT true)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

### Universities Table
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR(255) NOT NULL)
- `location` (VARCHAR(255))
- `established_year` (INTEGER)
- `tenant_id` (VARCHAR(255) NOT NULL)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

### Students Table
- `id` (SERIAL PRIMARY KEY)
- `first_name` (VARCHAR(100) NOT NULL)
- `last_name` (VARCHAR(100) NOT NULL)
- `email` (VARCHAR(255) UNIQUE NOT NULL)
- `university_id` (INTEGER, FOREIGN KEY)
- `tenant_id` (VARCHAR(255) NOT NULL)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

## Error Handling

The API provides comprehensive error handling:

- **400 Bad Request**: Invalid input data or missing required fields
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate data or constraint violations
- **500 Internal Server Error**: Server-side errors

All errors return JSON responses with consistent structure:
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.