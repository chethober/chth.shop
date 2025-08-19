# MerchCraft - Dark Mode Merchandise Platform for Artists

A full-stack dark-mode merchandise platform that enables artists to create, customize, and sell their designs through an interactive 3D design studio.

![MerchCraft Platform](logo-white.png)

## 🌟 Features

### Frontend (React + Next.js + Tailwind CSS + Framer Motion)
- **Single-Page Application** with smooth scroll and animated transitions
- **3 Main Sections**: About, Collaboration, and Design
- **Interactive 3D Design Studio** using React Three Fiber
- **Dark Theme** with modern minimal design and hover effects
- **Responsive Layout** for desktop and mobile
- **JWT Authentication** with protected routes
- **Artist Collaboration** platform

### Backend (Node.js + Express + PostgreSQL + Prisma)
- **REST API** with comprehensive endpoints
- **JWT Authentication** with bcrypt password hashing
- **Prisma ORM** for type-safe database operations
- **Artist & Product Management**
- **CORS enabled** for frontend requests
- **Security features** including rate limiting and input validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd shop
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your database credentials

# Set up database
npm run prisma:generate
npm run prisma:migrate
npm run db:seed

# Start backend server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with backend API URL

# Start frontend development server
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **API Health Check**: http://localhost:5000/api/health

## 📁 Project Structure

```
shop/
├── frontend/                 # Next.js React application
│   ├── app/                 # App Router pages
│   │   ├── account/         # Artist account management
│   │   ├── design/          # 3D design studio
│   │   ├── login/           # Authentication
│   │   ├── register/
│   │   └── [username]/      # Artist profile pages
│   ├── components/          # Reusable components
│   ├── store/              # Zustand state management
│   ├── types/              # TypeScript definitions
│   └── public/             # Static assets
├── backend/                 # Express.js API server
│   ├── routes/             # API route handlers
│   ├── prisma/             # Database schema and migrations
│   ├── scripts/            # Database seeding
│   └── lib/                # Utility functions
└── README.md               # This file
```

## 🎨 Key Features

### 3D Design Studio
- **Product Types**: T-shirts, Hoodies, Pants
- **Real-time Customization**: Color changes, 3D preview
- **Interactive Controls**: Rotate, zoom, pan
- **Design Saving**: Add designs to artist store

### Artist Collaboration
- **Artist Profiles**: Bio, store name, portfolio
- **Product Management**: Create, edit, delete products
- **Revenue Sharing**: Commission-based earnings
- **Store Customization**: Personal branding

### Authentication & Security
- **JWT Tokens**: Secure authentication
- **Password Hashing**: bcrypt with salt rounds
- **Protected Routes**: Role-based access control
- **Input Validation**: Request sanitization

## 🗄️ Database Schema

### Users
```sql
- id (Primary Key)
- username (Unique)
- email (Unique)
- password (Hashed)
- createdAt, updatedAt
```

### Artists
```sql
- id (Primary Key)
- userId (Foreign Key to Users)
- bio (Text)
- storeName (String)
- createdAt, updatedAt
```

### Products
```sql
- id (Primary Key)
- name (String)
- type (Enum: tshirt, hoodie, pants)
- price (Decimal)
- imageUrl (String)
- artistId (Foreign Key to Users)
- createdAt, updatedAt
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/me` - Get current user profile

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create new product (auth required)
- `GET /api/products/:id` - Get specific product
- `GET /api/products/artist/:username` - Get artist's products

### Artists
- `GET /api/artists` - List all artists
- `GET /api/artists/:username` - Get artist profile
- `POST /api/artists` - Create artist profile (auth required)
- `PUT /api/artists` - Update artist profile (auth required)

## 🎯 Demo Accounts

The platform comes with pre-seeded demo data:

### Artist Account
- **Email**: `cosmic@example.com`
- **Password**: `password123`
- **Username**: `cosmic_artist`

### Artist Account 2
- **Email**: `street@example.com`
- **Password**: `password123`
- **Username**: `street_designer`

## 🛠️ Development

### Backend Commands
```bash
npm run dev          # Start development server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio
npm run db:seed         # Seed database
```

### Frontend Commands
```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run start  # Start production server
npm run lint   # Run ESLint
```

## 🌐 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/merch_platform"
JWT_SECRET="your-super-secret-jwt-key"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

## 🔒 Security Features

- **CORS Protection**: Configured for frontend domain
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Request body validation
- **Security Headers**: Helmet middleware
- **Password Security**: bcrypt hashing with salt rounds

## 📱 Responsive Design

The platform is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- Touch devices

## 🎨 Design System

- **Dark Theme**: Modern dark mode with gray-900 background
- **Color Palette**: Primary, accent, and semantic colors
- **Typography**: Inter font family
- **Components**: Glass morphism effects, smooth animations
- **Icons**: Lucide React icon library

## 🚀 Deployment

### Backend Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy to your preferred platform (Heroku, Vercel, etc.)

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or your preferred platform
3. Configure environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js** for the React framework
- **Prisma** for the database ORM
- **React Three Fiber** for 3D graphics
- **Tailwind CSS** for styling
- **Framer Motion** for animations

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/frontend/README.md` and `/backend/README.md`
- Review the API documentation above

---

**Built with ❤️ for artists and creators**