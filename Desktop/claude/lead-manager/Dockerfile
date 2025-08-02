# Build stage  
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy frontend source code (exclude backend directory)
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig*.json ./

# Set build-time environment variables
ARG VITE_PAYRIX_MERCHANT_ID
ARG VITE_PAYRIX_API_KEY
ARG VITE_PAYRIX_ENVIRONMENT
ARG VITE_FIELDROUTES_BASE_URL
ARG VITE_FIELDROUTES_AUTH_KEY
ARG VITE_FIELDROUTES_AUTH_TOKEN

ENV VITE_PAYRIX_MERCHANT_ID=$VITE_PAYRIX_MERCHANT_ID
ENV VITE_PAYRIX_API_KEY=$VITE_PAYRIX_API_KEY
ENV VITE_PAYRIX_ENVIRONMENT=$VITE_PAYRIX_ENVIRONMENT
ENV VITE_FIELDROUTES_BASE_URL=$VITE_FIELDROUTES_BASE_URL
ENV VITE_FIELDROUTES_AUTH_KEY=$VITE_FIELDROUTES_AUTH_KEY
ENV VITE_FIELDROUTES_AUTH_TOKEN=$VITE_FIELDROUTES_AUTH_TOKEN

# Build the application
RUN npm run build

# Production stage - Use Node.js to serve with our custom server
FROM node:20-alpine

WORKDIR /app

# Copy package.json for production dependencies
COPY package*.json ./

# Install only production dependencies (express, etc.)
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy ONLY the frontend server (not the backend server)
COPY server.js ./frontend-server.js

# Set port
ENV PORT=3000
EXPOSE 3000

# Start the frontend server (renamed to avoid confusion)
CMD ["node", "frontend-server.js"]