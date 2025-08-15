# Simple build without npm ci
FROM node:20-alpine
WORKDIR /app

# Copy all files
COPY . .

# Install only production dependencies directly
RUN npm install express@4.18.2 cors@2.8.5 @octokit/rest@20.0.2

# Try to build TypeScript if exists, ignore if fails
RUN npx tsc -p tsconfig.json || echo "No TypeScript files to compile"

EXPOSE 3000
CMD ["node","backend/server_v3.js"]