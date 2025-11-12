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

# Copy cached node_modules from deps layer
COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of your project files
COPY . .

# Build Next.js app
RUN npm run build

# ----------------------------
# Stage 3 — Runtime
# ----------------------------
FROM node:20-bullseye AS runner

WORKDIR /app
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only essentials from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.js ./next.config.js

# Expose the app port
EXPOSE 3000

# Default start command
CMD ["npm", "start"]
