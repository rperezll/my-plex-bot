FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm i

COPY . .

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

CMD ["node", "dist/bot.js"]