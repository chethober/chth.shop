# CHTH | چث Frontend

A modern, dark-mode merchandise platform for artists built with Next.js, React, and Three.js.

## Features

- 🎨 **3D Design Studio** - Interactive 3D product customization with React Three Fiber
- 🌙 **Dark Mode** - Beautiful dark theme with modern UI components
- 📱 **Responsive Design** - Works perfectly on desktop and mobile devices
- ⚡ **Smooth Animations** - Framer Motion powered transitions and micro-interactions
- 🔐 **Authentication** - JWT-based user authentication and authorization
- 🎯 **Artist Collaboration** - Platform for artists to showcase and sell their designs
- 🛍️ **Product Management** - Create, edit, and manage merchandise products

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **3D Graphics**: React Three Fiber + @react-three/drei
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (see backend README)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the frontend directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── account/           # Artist account management
│   ├── design/            # 3D design studio
│   ├── login/             # Authentication pages
│   ├── register/
│   └── [username]/        # Artist profile pages
├── components/            # Reusable React components
│   ├── 3d/               # Three.js components
│   ├── Header.tsx        # Navigation header
│   └── Footer.tsx        # Site footer
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
├── store/                # Zustand state management
├── types/                # TypeScript type definitions
└── public/               # Static assets
    └── models/           # 3D model files
```

## Key Features

### 3D Design Studio

The design studio allows users to:
- Switch between T-shirt, Hoodie, and Pants models
- Customize colors in real-time
- Preview designs with 3D rendering
- Save designs to their store

### Artist Collaboration

Artists can:
- Create and manage their profiles
- Upload and showcase their designs
- Set up their own merchandise stores
- Track sales and performance

### Authentication

- JWT-based authentication
- Protected routes
- User profile management
- Session persistence

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5000/api` |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 