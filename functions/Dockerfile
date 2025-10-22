FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package manifests first for better caching
COPY package*.json tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript to lib/
RUN npm run build

# Expose port used by local server (v2 server uses PORT=3000)
EXPOSE 3000

# Default command runs the compiled JS server for v2 (lib/v2/server.js)
CMD ["node", "lib/v2/server.js"]
