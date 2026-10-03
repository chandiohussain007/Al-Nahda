# ---- Build stage -----------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

ENV NODE_ENV=development

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# ---- Runtime stage ---------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 3000

# Generate the client, apply committed migrations, then start the API.
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/main.js"]
