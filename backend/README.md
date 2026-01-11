# Backend

Express + TypeScript API server for the Academic Manager application.

## Setup

1. Copy `.env.example` to `.env` and configure your environment variables
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`

## Scripts

- `npm run dev` - Start development server with nodemon
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server

## API Documentation

See main README.md for complete API endpoint documentation.

## Project Structure

```
backend/
├── src/
│   ├── config/         # Database and external service configs
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth middleware
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API route definitions
│   ├── utils/          # Helper functions
│   └── server.ts       # Application entry point
├── package.json
└── tsconfig.json
```

## Environment Variables

Required:
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens

Optional:
- `CLOUDINARY_CLOUD_NAME` - For file uploads
- `CLOUDINARY_API_KEY` - For file uploads
- `CLOUDINARY_API_SECRET` - For file uploads
