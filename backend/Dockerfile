# ---- Build stage -----------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# Alpine 3.21+ ships OpenSSL 3 in /usr/lib and has no libssl.so.1.1. Prisma 5.22
# only looks in /lib here and falls back to `openssl version -v`, so without this
# it can't detect a version and picks the openssl-1.1.x engines, which then fail
# to load ("Error loading shared library libssl.so.1.1").
RUN apk add --no-cache openssl

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

# Required in the runtime stage too: the boot command runs `prisma generate`
# and `prisma migrate deploy`, and the schema engine needs a detectable OpenSSL
# before it will start.
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 3000

# Generate the client, apply committed migrations, then start the API.
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/main.js"]
