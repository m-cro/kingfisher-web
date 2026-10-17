FROM node:22-alpine AS build

WORKDIR /app

# Install git so Vite can embed the real commit hash at build time.
RUN apk add --no-cache git

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Allow overriding the commit info via build args; otherwise git rev-parse is used.
ARG COMMIT_HASH=dev
ARG COMMIT_SHORT=dev
ENV COMMIT_HASH=$COMMIT_HASH
ENV COMMIT_SHORT=$COMMIT_SHORT

RUN npm run build

FROM oven/bun:slim

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY server.js ./

EXPOSE 5903

CMD ["bun", "run", "server.js"]
