# single-stage, без tsc
FROM node:20-alpine
WORKDIR /app

# только то, что нужно приложению
COPY package*.json ./
RUN npm install --omit=dev

# наш рантайм-файл
COPY backend/server_v3.js backend/server_v3.js

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node","backend/server_v3.js"]