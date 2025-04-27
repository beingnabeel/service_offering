# Vehicle Booking Service Offering Microservice

## Overview

The Service Offering microservice manages the catalog of automotive services, their categorization, components, and service center-specific offerings in the Vehicle Booking System. This service enables service centers to define and publish their service offerings with detailed pricing, components, and vehicle compatibility.

## Features

- Service categorization (maintenance, repairs, etc.)
- Detailed service type definitions with components
- Service center-specific offerings with pricing
- Vehicle brand/model-specific service variations
- Seasonal discounts and package offerings

## Technology Stack

- Node.js and Express
- PostgreSQL database with Prisma ORM
- JWT authentication
- Custom query builder with adapter pattern for Prisma

## Installation and Setup

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL
- npm

### Setup Steps

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd service_offering
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables (copy .env.example to .env and update)
   ```bash
   cp .env.example .env
   ```

4. Run database migrations
   ```bash
   npx prisma migrate dev
   ```

5. Start the service
   ```bash
   npm run dev
   ```

## Environment Configuration

Create a `.env` file with the following variables:

```
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/service_offering
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
```

## API Documentation

### Authentication

All protected endpoints require a valid JWT token in the Authorization header.

```
Authorization: Bearer <your_token>
```

### Service Category Endpoints

#### Get All Service Categories
- **URL**: `GET /api/v1/categories`
- **Auth**: Required
- **Query Parameters**:
  - `vehicleType`: Filter by CAR or BIKE
  - `isPopular`: Filter popular categories (true/false)
  - `page`: Page number for pagination
  - `limit`: Results per page
  - `sort`: Sort field (e.g., name, createdAt)
- **Response**: List of service categories

#### Create Service Category
- **URL**: `POST /api/v1/categories`
- **Auth**: Required (ADMIN only)
- **Payload**:
  ```json
  {
    "name": "Regular Maintenance",
    "description": "Routine maintenance services",
    "vehicleType": "CAR",
    "icon": "url_to_icon",
    "displayOrder": 1,
    "isPopular": true
  }
  ```
- **Response**: Created service category

#### Get Category by ID
- **URL**: `GET /api/v1/categories/:id`
- **Auth**: Required
- **Response**: Service category details

#### Update Category
- **URL**: `PATCH /api/v1/categories/:id`
- **Auth**: Required (ADMIN only)
- **Payload**: Same fields as Create (partial updates allowed)
- **Response**: Updated service category

#### Delete Category
- **URL**: `DELETE /api/v1/categories/:id`
- **Auth**: Required (ADMIN only)
- **Response**: Deletion confirmation

#### Get Service Types by Category
- **URL**: `GET /api/v1/categories/:id/types`
- **Auth**: Required
- **Query Parameters**: Same as Get All Categories
- **Response**: List of service types in the category

### Service Type Endpoints

#### Get All Service Types
- **URL**: `GET /api/v1/types`
- **Auth**: Required
- **Query Parameters**:
  - `categoryId`: Filter by service category
  - `vehicleType`: Filter by vehicle type
  - `isPopular`: Filter by popularity
  - `page`, `limit`, `sort`: Pagination and sorting
- **Response**: List of service types

#### Create Service Type
- **URL**: `POST /api/v1/types`
- **Auth**: Required (ADMIN only)
- **Payload**:
  ```json
  {
    "name": "Basic Service",
    "description": "Standard vehicle service",
    "longDescription": "Detailed description of the service",
    "estimatedDuration": 120,
    "displayImage": "url_to_image",
    "categoryId": "uuid-of-category",
    "recommendedFrequency": "6 months or 5000 km",
    "warningThreshold": 5500,
    "displayOrder": 1,
    "isPopular": true
  }
  ```
- **Response**: Created service type

#### Get Service Type by ID
- **URL**: `GET /api/v1/types/:id`
- **Auth**: Required
- **Response**: Service type details

#### Update Service Type
- **URL**: `PATCH /api/v1/types/:id`
- **Auth**: Required (ADMIN only)
- **Payload**: Same fields as Create (partial updates allowed)
- **Response**: Updated service type

#### Delete Service Type
- **URL**: `DELETE /api/v1/types/:id`
- **Auth**: Required (ADMIN only)
- **Response**: Deletion confirmation

#### Get Components for Service Type
- **URL**: `GET /api/v1/types/:id/components`
- **Auth**: Required
- **Response**: List of components for the service type

### Service Component Endpoints

#### Get All Service Components
- **URL**: `GET /api/v1/components`
- **Auth**: Required
- **Query Parameters**:
  - `vehicleType`: Filter by vehicle type
  - `name`: Search by component name
  - `page`, `limit`, `sort`: Pagination and sorting
- **Response**: List of service components

#### Create Service Component
- **URL**: `POST /api/v1/components`
- **Auth**: Required (ADMIN only)
- **Payload**:
  ```json
  {
    "name": "Oil Filter Replacement",
    "description": "Replacing the oil filter",
    "estimatedDuration": 15,
    "vehicleType": "CAR"
  }
  ```
- **Response**: Created service component

#### Get Service Component by ID
- **URL**: `GET /api/v1/components/:id`
- **Auth**: Required
- **Response**: Service component details

#### Update Service Component
- **URL**: `PATCH /api/v1/components/:id`
- **Auth**: Required (ADMIN only)
- **Payload**: Same fields as Create (partial updates allowed)
- **Response**: Updated service component

#### Delete Service Component
- **URL**: `DELETE /api/v1/components/:id`
- **Auth**: Required (ADMIN only)
- **Response**: Deletion confirmation

### Service Center Offering Endpoints

#### Get All Service Center Offerings
- **URL**: `GET /api/v1/service-centers/offerings`
- **Auth**: Required
- **Query Parameters**:
  - `serviceCenterId`: Filter by service center
  - `serviceTypeId`: Filter by service type
  - `status`: Filter by service status
  - `hasPickupDropService`: Filter by pickup/drop service
  - `hasEmergencyService`: Filter by emergency service
  - `priceMin`, `priceMax`: Filter by price range
  - `page`, `limit`, `sort`: Pagination and sorting
- **Response**: List of service center offerings

#### Create Service Center Offering
- **URL**: `POST /api/v1/service-centers/offerings`
- **Auth**: Required (ADMIN only)
- **Payload**:
  ```json
  {
    "serviceCenterId": "uuid-of-service-center",
    "serviceTypeId": "uuid-of-service-type",
    "status": "ACTIVE",
    "basePrice": 1500.00,
    "discountPercentage": 10.00,
    "discountValidUntil": "2025-12-31T23:59:59Z",
    "timeToComplete": 120,
    "availablePriorities": ["NORMAL", "EXPRESS"],
    "priorityPrices": {"EXPRESS": 200.00},
    "minimumAdvanceBooking": 24,
    "termsAndConditions": "Service terms and conditions",
    "paymentPolicy": "PAYMENT_AFTER_SERVICE",
    "warrantyDays": 90,
    "warrantyKilometers": 1000,
    "hasPickupDropService": true,
    "pickupDropFee": 200.00,
    "hasEmergencyService": false
  }
  ```
- **Response**: Created service center offering

#### Get Service Center Offering by ID
- **URL**: `GET /api/v1/service-centers/offerings/:id`
- **Auth**: Required
- **Response**: Service center offering details

#### Update Service Center Offering
- **URL**: `PATCH /api/v1/service-centers/offerings/:id`
- **Auth**: Required (ADMIN only)
- **Payload**: Same fields as Create (partial updates allowed)
- **Response**: Updated service center offering

#### Delete Service Center Offering
- **URL**: `DELETE /api/v1/service-centers/offerings/:id`
- **Auth**: Required (ADMIN only)
- **Response**: Deletion confirmation

### Vehicle Brand Service Offering Endpoints

#### Get All Vehicle Brand Service Offerings
- **URL**: `GET /api/v1/service-centers/offerings/:offeringId/vehicle-brands`
- **Auth**: Required
- **Query Parameters**:
  - `brandId`: Filter by vehicle brand
  - `modelId`: Filter by vehicle model
  - `status`: Filter by service status
  - `page`, `limit`, `sort`: Pagination and sorting
- **Response**: List of vehicle brand service offerings

#### Create Vehicle Brand Service Offering
- **URL**: `POST /api/v1/service-centers/offerings/:offeringId/vehicle-brands`
- **Auth**: Required (ADMIN only)
- **Payload**:
  ```json
  {
    "brandId": "uuid-of-brand",
    "modelId": "uuid-of-model",
    "manufactureYearStart": 2018,
    "manufactureYearEnd": 2023,
    "fuelType": "PETROL",
    "status": "ACTIVE",
    "price": 1200.00,
    "discountPercentage": 5.00,
    "timeToComplete": 90,
    "specialNotes": "Special notes for this model",
    "partsIncluded": true
  }
  ```
- **Response**: Created vehicle brand service offering

## Error Handling

The API returns standard HTTP status codes:

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

Error responses follow this format:

```json
{
  "status": "error",
  "message": "Error description",
  "statusCode": 400
}
```

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Deployment

For production deployment, set the `NODE_ENV` environment variable to `production`:

```bash
NODE_ENV=production npm start
```