# Production-ready Node.js backend image for SRMS
FROM node:20-alpine as build
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application source
COPY . .

# Build step (if needed for transpilation; otherwise just keep source)
# RUN npm run build

# Final image
FROM node:20-alpine
WORKDIR /usr/src/app

# Copy production dependencies and source code from build stage
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app .

# Environment defaults (can be overridden by docker-compose or .env)
ENV NODE_ENV=production
ENV APP_PORT=5000

# Expose backend API port
EXPOSE 5000

# Copy wait script for DB readiness
COPY wait-for-postgres.sh ./wait-for-postgres.sh
RUN chmod +x ./wait-for-postgres.sh

# Start command with DB wait handshake
CMD ["sh", "-c", "./wait-for-postgres.sh $DB_HOST:$DB_PORT -- npm run start"]