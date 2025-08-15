# Simple Node.js without TypeScript
FROM node:20-alpine
WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN npm install --production

# No TypeScript compilation needed
EXPOSE 3000
CMD ["node","backend/server_v3.js"]