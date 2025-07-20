# API Documentation

## Overview

The Classified Ads Platform provides a comprehensive RESTful API for managing categories, users, custom fields, and administrative operations. All endpoints follow professional REST conventions with consistent error handling and response formats.

## Base URL

```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication

The API uses session-based authentication with cookies. Most endpoints require authentication and specific role permissions.

### Authentication Headers
```
Content-Type: application/json
```

### Session Management
- Login: `POST /api/auth/login`
- Logout: `POST /api/auth/logout`
- Current User: `GET /api/auth/me`

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "data": {...},
  "message": "Operation completed successfully",
  "success": true
}
```

### Error Response
```json
{
  "error": "Error description",
  "details": "Additional error details (if applicable)",
  "success": false
}
```

## Authentication Endpoints

### POST /api/auth/login
Authenticate user with email/username and password.

**Request Body:**
```json
{
  "emailOrUsername": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "corporate",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "corporate",
  "companyName": "Acme Corp"
}
```

### GET /api/auth/me
Get current authenticated user information.

**Response (200):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "role": "corporate"
}
```

### POST /api/auth/logout
Logout current user and destroy session.

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

## Category Management

### GET /api/categories
Get all categories with hierarchical structure.

**Query Parameters:**
- `parentId` (optional): Filter by parent category ID
- `active` (optional): Filter by active status

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Vasıta",
    "slug": "vasita",
    "parentId": null,
    "icon": "vehicle-icon.png",
    "isActive": true,
    "adCount": 150,
    "children": [...]
  }
]
```

### GET /api/categories/:id
Get specific category by ID.

**Response (200):**
```json
{
  "id": 1,
  "name": "Vasıta",
  "slug": "vasita",
  "description": "Vehicles category",
  "parentId": null,
  "icon": "vehicle-icon.png",
  "isActive": true,
  "adCount": 150
}
```

### GET /api/categories/:id/path
Get category breadcrumb path with custom labels.

**Response (200):**
```json
[
  {
    "category": {
      "id": 1,
      "name": "Vasıta",
      "slug": "vasita"
    },
    "label": "Ana Kategori"
  },
  {
    "category": {
      "id": 14,
      "name": "Otomobil",
      "slug": "otomobil"
    },
    "label": "Kategori"
  }
]
```

### POST /api/categories
Create new category (Admin only).

**Request Body:**
```json
{
  "name": "New Category",
  "slug": "new-category",
  "description": "Category description",
  "parentId": 1,
  "icon": "category-icon.png"
}
```

### PATCH /api/categories/:id
Update existing category (Admin only).

**Request Body:**
```json
{
  "name": "Updated Category",
  "description": "Updated description",
  "isActive": true
}
```

### DELETE /api/categories/:id
Delete category (Admin only).

**Response (204):** No content

### PUT /api/categories/:id/metadata
Update category metadata label (Admin only).

**Request Body:**
```json
{
  "labelKey": "Marka"
}
```

## Custom Fields Management

### GET /api/categories/:id/custom-fields
Get custom fields for a category with inheritance.

**Response (200):**
```json
[
  {
    "id": 1,
    "categoryId": 14,
    "fieldName": "Motor Hacmi",
    "fieldKey": "engine_volume",
    "fieldType": "number",
    "isRequired": true,
    "placeholder": "Örn: 1600",
    "hasUnits": true,
    "unitOptions": ["cc", "lt"],
    "defaultUnit": "cc",
    "minValue": 50,
    "maxValue": 9999,
    "sortOrder": 1
  }
]
```

### POST /api/categories/:id/custom-fields
Create custom field for category (Admin only).

**Request Body:**
```json
{
  "fieldName": "Motor Hacmi",
  "fieldKey": "engine_volume",
  "fieldType": "number",
  "isRequired": true,
  "placeholder": "Örn: 1600",
  "hasUnits": true,
  "unitOptions": ["cc", "lt"],
  "defaultUnit": "cc",
  "minValue": 50,
  "maxValue": 9999
}
```

### PATCH /api/categories/custom-fields/:fieldId
Update custom field (Admin only).

**Request Body:**
```json
{
  "fieldName": "Updated Field Name",
  "isRequired": false,
  "unitOptions": ["cc", "lt", "ml"]
}
```

### DELETE /api/categories/custom-fields/:fieldId
Delete custom field (Admin only).

**Response (204):** No content

## User Management

### PATCH /api/user/profile
Update user profile information.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Acme Corp",
  "username": "john_doe_updated"
}
```

### POST /api/user/profile-image
Upload profile image (Corporate users only).

**Request:** Multipart form data with 'profileImage' file field

**Response (200):**
```json
{
  "message": "Profile image uploaded successfully",
  "imageUrl": "/uploads/users/1/profile-images/profile_123456789.jpg"
}
```

### DELETE /api/user/profile-image
Remove profile image (Corporate users only).

**Response (200):**
```json
{
  "message": "Profile image removed successfully"
}
```

### PATCH /api/user/change-email
Update user email address.

**Request Body:**
```json
{
  "email": "newemail@example.com"
}
```

### PATCH /api/user/change-password
Update user password.

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

## Authorized Personnel Management

### GET /api/authorized-personnel
Get authorized personnel for current corporate user.

**Response (200):**
```json
[
  {
    "id": 1,
    "companyUserId": 5,
    "email": "employee@company.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "mobilePhone": "+90 555 123 4567",
    "whatsappNumber": "+90 555 123 4567",
    "isActive": true,
    "createdAt": "2025-07-19T10:30:00Z"
  }
]
```

### POST /api/authorized-personnel
Create new authorized personnel (Corporate users only).

**Request Body:**
```json
{
  "email": "employee@company.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "mobilePhone": "+90 555 123 4567",
  "whatsappNumber": "+90 555 123 4567"
}
```

### PATCH /api/authorized-personnel/:id
Update authorized personnel information.

**Request Body:**
```json
{
  "firstName": "Jane Updated",
  "mobilePhone": "+90 555 999 8888"
}
```

### PATCH /api/authorized-personnel/:id/toggle-status
Activate/deactivate authorized personnel.

**Response (200):**
```json
{
  "id": 1,
  "isActive": false,
  "message": "Personnel status updated successfully"
}
```

### DELETE /api/authorized-personnel/:id
Permanently delete authorized personnel.

**Response (204):** No content

## File Upload

### POST /api/categories/upload-icon
Upload category icon (Admin only).

**Request:** Multipart form data with 'icon' file field
- **Accepted formats:** PNG only
- **Maximum size:** 2MB

**Response (200):**
```json
{
  "filename": "1234567890-icon.png",
  "message": "Icon uploaded successfully"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created successfully |
| 204 | No content (successful deletion) |
| 400 | Bad request / Validation error |
| 401 | Unauthorized / Authentication required |
| 403 | Forbidden / Insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict / Duplicate resource |
| 422 | Unprocessable entity / Invalid data |
| 500 | Internal server error |

## Rate Limiting

- **General endpoints:** 100 requests per minute per IP
- **Authentication endpoints:** 5 requests per minute per IP
- **File upload endpoints:** 10 requests per minute per user

## CORS Policy

Cross-Origin Resource Sharing (CORS) is configured to allow requests from:
- Development: `http://localhost:3000`, `http://localhost:5000`
- Production: Your configured domain

## Security Features

- **Password Hashing:** bcrypt with 12 rounds
- **Session Security:** Secure, HttpOnly cookies
- **Input Validation:** Comprehensive Zod schema validation
- **File Upload Security:** Type and size validation
- **SQL Injection Protection:** Parameterized queries with Drizzle ORM

## Performance Features

- **Caching:** 5-minute TTL on frequently accessed data
- **Database Indexes:** Strategic indexing for optimal performance
- **Query Optimization:** Batch operations and reduced N+1 queries
- **Response Compression:** Gzip compression enabled

## Versioning

Current API version: **v1**

Future versions will be accessible via:
```
/api/v2/...
```

## Support

For API support and questions:
- Documentation: This file
- Architecture: See ARCHITECTURE.md
- Code Standards: See CODE_STANDARDS.md