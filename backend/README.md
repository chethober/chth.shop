# MerchCraft Backend

A Node.js/Express API backend for the MerchCraft merchandise platform with Prisma ORM and PostgreSQL.

## Features

- 🔐 **JWT Authentication** - Secure user authentication with bcrypt password hashing
- 🎨 **Artist Management** - Artist profiles and collaboration features
- 🛍️ **Product Management** - CRUD operations for merchandise products
- 🗄️ **Database** - PostgreSQL with Prisma ORM for type-safe database operations
- 🔒 **Security** - CORS, rate limiting, and input validation
- 📊 **API Documentation** - RESTful API endpoints with clear documentation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Built-in validation with error handling

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the backend directory:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/merch_platform"
   
   # JWT Secret
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Frontend URL for CORS
   FRONTEND_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Run database migrations
   npm run prisma:migrate
   
   # Seed the database with sample data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Verify the API is running**
   Visit [http://localhost:5000/api/health](http://localhost:5000/api/health)

## Database Schema

### Users
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email address
- `password` - Hashed password
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

### Artists
- `id` - Primary key
- `userId` - Foreign key to Users table
- `bio` - Artist biography
- `storeName` - Artist's store name
- `createdAt` - Profile creation timestamp
- `updatedAt` - Last update timestamp

### Products
- `id` - Primary key
- `name` - Product name
- `type` - Product type (tshirt, hoodie, pants)
- `price` - Product price
- `imageUrl` - Product image URL
- `artistId` - Foreign key to Users table
- `createdAt` - Product creation timestamp
- `updatedAt` - Last update timestamp

## API Endpoints

### Authentication

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "username": "artist_name",
  "email": "artist@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "artist_name",
      "email": "artist@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST `/api/auth/login`
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "artist@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "artist_name",
      "email": "artist@example.com",
      "artist": {
        "id": 1,
        "bio": "Artist bio",
        "storeName": "Artist Store"
      }
    },
    "token": "jwt_token_here"
  }
}
```

#### GET `/api/auth/me`
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### Products

#### GET `/api/products`
Get all products.

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Galaxy Dreams Tee",
        "type": "tshirt",
        "price": 29.99,
        "imageUrl": "https://example.com/image.jpg",
        "artist": {
          "id": 1,
          "bio": "Artist bio",
          "storeName": "Artist Store",
          "user": {
            "username": "artist_name"
          }
        }
      }
    ]
  }
}
```

#### POST `/api/products`
Create a new product (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "New Product",
  "type": "tshirt",
  "price": 29.99,
  "imageUrl": "https://example.com/image.jpg"
}
```

#### GET `/api/products/:id`
Get a specific product by ID.

#### GET `/api/products/artist/:username`
Get all products by a specific artist.

### Artists

#### GET `/api/artists`
Get all artists.

#### GET `/api/artists/:username`
Get artist profile and products by username.

#### POST `/api/artists`
Create artist profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "bio": "Artist biography",
  "storeName": "Artist Store Name"
}
```

#### PUT `/api/artists`
Update artist profile (requires authentication).

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT tokens | Yes | - |
| `PORT` | Server port | No | 5000 |
| `NODE_ENV` | Environment mode | No | development |
| `FRONTEND_URL` | Frontend URL for CORS | No | http://localhost:3000 |

## Database Setup

### Using Docker (Recommended)

1. **Start PostgreSQL container**
   ```bash
   docker run --name merch-postgres \
     -e POSTGRES_DB=merch_platform \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=password \
     -p 5432:5432 \
     -d postgres:15
   ```

2. **Update DATABASE_URL in .env**
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/merch_platform"
   ```

### Using Local PostgreSQL

1. **Install PostgreSQL**
2. **Create database**
   ```sql
   CREATE DATABASE merch_platform;
   ```
3. **Update DATABASE_URL in .env**

## Seed Data

The database comes with sample data including:
- 2 demo artists (cosmic_artist, street_designer)
- 5 sample products
- Demo login credentials:
  - Email: `cosmic@example.com`
  - Password: `password123`

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **CORS Protection**: Configured for frontend domain
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Request body validation
- **Helmet**: Security headers

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 