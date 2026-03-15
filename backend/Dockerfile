# Time Manager — Backend (multi-stage)
# Stage 1 : dépendances + génération Prisma
FROM node:20-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci && npx prisma generate

# Stage 2 : runner (prod) — l'image node:20-alpine a déjà l'utilisateur node
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY package*.json ./
COPY prisma ./prisma/
COPY --chown=node:node src ./src
RUN mkdir -p /app/logs && chown -R node:node /app/logs
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
