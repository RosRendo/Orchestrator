# ==============================================================================
# RendoOS Unified Fullstack Dockerfile
# Combines Next.js 16 (Frontend) + NestJS (Backend) into 1 Single Container & Port
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Install native compilation dependencies for node-pty and node-gyp
RUN apk add --no-cache python3 make g++ libc6-compat git

# 1. Install & Build Backend
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/
RUN cd backend && npm install
COPY backend ./backend/
RUN cd backend && npx prisma generate && npm run build

# 2. Install & Build Frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend ./frontend/
RUN cd frontend && npm run build

# ==============================================================================
# Runner Image (Lean production layer)
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache python3 make g++ bash git libc6-compat

ENV NODE_ENV=production
ENV PORT=3000
ENV BACKEND_PORT=3005

# Copy built backend
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/backend/prisma ./backend/prisma

# Copy built frontend
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=builder /app/frontend/package*.json ./frontend/
COPY --from=builder /app/frontend/next.config.ts ./frontend/

# Copy unified runner & root package
COPY runner.js ./
COPY package.json ./

EXPOSE 3000

CMD ["node", "runner.js"]
