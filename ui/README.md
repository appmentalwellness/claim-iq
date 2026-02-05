# ClaimIQ Frontend Application

A modern React + TypeScript + Vite application for the ClaimIQ AI-powered insurance denial recovery system.

## Features

- **Modern Stack**: React 18, TypeScript, Vite, Tailwind CSS
- **Authentication**: JWT-based authentication with protected routes
- **File Upload**: Drag & drop file upload with progress tracking
- **Dashboard**: Real-time statistics and claim monitoring
- **Responsive Design**: Mobile-first responsive design
- **API Integration**: Axios-based API client with interceptors

## Tech Stack

- **Frontend**: React 18, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Query (TanStack Query)
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Development**: ESLint, TypeScript

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or from project root
npm run dev:ui
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Lint code
npm run lint

# Type check
npm run type-check
```

## Project Structure

```
ui/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # Basic UI components (Button, Card, Input)
│   │   ├── layout/          # Layout components (Header, Layout)
│   │   └── forms/           # Form components
│   ├── pages/               # Page components
│   │   ├── auth/            # Authentication pages
│   │   ├── dashboard/       # Dashboard page
│   │   ├── claims/          # Claims management
│   │   └── upload/          # File upload page
│   ├── services/            # API services
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   └── styles/              # Global styles
├── public/                  # Static assets
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Pages

### 🔐 Authentication
- **Login Page**: JWT authentication with demo credentials
- **Protected Routes**: Automatic redirect for unauthenticated users

### 📊 Dashboard
- **Statistics Cards**: Total claims, pending, denied, success rate
- **Recent Claims**: Latest claim submissions with status
- **Quick Actions**: Upload new claims, view reports

### 📤 Upload Page
- **Drag & Drop**: Intuitive file upload interface
- **File Validation**: Type and size validation
- **Progress Tracking**: Real-time upload progress
- **Multi-file Support**: Upload multiple files simultaneously

## API Integration

The frontend integrates with the ClaimIQ backend API:

```typescript
// API Service Example
import { apiService } from '@/services/api';

// Upload file
const response = await apiService.requestFileUpload({
  filename: file.name,
  contentType: file.type,
  fileSize: file.size,
  tenantId: 'tenant-123',
  hospitalId: 'hospital-456',
});
```

## Environment Variables

Create a `.env.local` file:

```bash
# API Configuration
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=ClaimIQ
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=development

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

## Demo Credentials

For development and testing:

- **Email**: demo@claimiq.com
- **Password**: demo123

## Styling

The application uses Tailwind CSS with a custom design system:

- **Primary Colors**: Blue palette for main actions
- **Secondary Colors**: Gray palette for text and backgrounds
- **Status Colors**: Success (green), Warning (yellow), Error (red)
- **Typography**: Inter font family
- **Components**: Custom component classes with Tailwind

## Development Guidelines

### Component Structure
```typescript
// Component Template
import React from 'react';
import { cn } from '@/utils/cn';

interface ComponentProps {
  // Props definition
}

const Component: React.FC<ComponentProps> = ({ ...props }) => {
  return (
    <div className={cn('base-classes', className)}>
      {/* Component content */}
    </div>
  );
};

export default Component;
```

### API Integration
- Use React Query for data fetching
- Implement proper error handling
- Add loading states
- Cache responses appropriately

### Styling
- Use Tailwind utility classes
- Create reusable component variants
- Follow mobile-first responsive design
- Maintain consistent spacing and typography

## Building for Production

```bash
# Build the application
npm run build

# Preview the build
npm run preview
```

The build output will be in the `dist/` directory, ready for deployment to any static hosting service.

## Integration with Backend

The frontend is designed to work with the ClaimIQ backend services:

- **API Service**: `be/services/api/` - HTTP endpoints
- **Workflow Service**: `be/services/workflows/` - Background processing
- **Authentication**: JWT tokens from Cognito
- **File Upload**: S3 pre-signed URLs

## Future Enhancements

- [ ] Claims management page with filtering and search
- [ ] Reports and analytics dashboard
- [ ] Real-time notifications
- [ ] User management and roles
- [ ] Advanced file processing status
- [ ] Export functionality
- [ ] Mobile app support