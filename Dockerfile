# Build stage
FROM node:25.6.1-alpine3.22 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage

FROM node:25.6.1-alpine3.22

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["node", "dist/main.js"]