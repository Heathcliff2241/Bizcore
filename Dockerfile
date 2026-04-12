# ----------------------------
# Stage 1 — Dependencies Cache
# ----------------------------
FROM node:20-bullseye AS deps

WORKDIR /app

# Copy only dependency files first
COPY package*.json ./

# Use npm ci for clean, deterministic installs
RUN npm ci --legacy-peer-deps

# ----------------------------
# Stage 2 — Build
# ----------------------------
FROM node:20-bullseye AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Accept build args for environment-dependent build
ARG NEXT_PUBLIC_APP_URL
ARG NEXTAUTH_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}

# Copy cached node_modules from deps layer
COPY --from=deps /app/node_modules ./node_modules

# Copy prisma schema early
COPY prisma ./prisma

# Copy the rest of your project files
COPY . .

# Ensure public directory exists
RUN mkdir -p /app/public

# Generate Prisma Client before building Next.js
RUN npx prisma generate

# Build Next.js app
RUN npm run build

# ----------------------------
# Stage 3 — Runtime
# ----------------------------
FROM node:20-bullseye AS runner

WORKDIR /app
# Use production environment for the runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only essentials from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/prisma ./prisma

# Create public directory and copy if it exists
RUN mkdir -p ./public
RUN [ -d /app/public ] && cp -r /app/public/* ./public/ || true

# Expose the app port
EXPOSE 3000

# Default start command
CMD ["npm", "start"]
