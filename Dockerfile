# Stage 1: Build the app
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm install

# Copy the source code
COPY . .

# Build the app (this will also copy prisma to dist from your build script)
RUN npm run build

# Stage 2: Run the app
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Copy only the needed files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Expose application port
EXPOSE 3000

# Start the app
CMD ["node", "dist/main.js"]
