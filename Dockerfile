FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
RUN npm run build:web

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8787
ENV MULTIPROD_DATA_DIR=/data
COPY --from=build /app/dist ./dist
COPY server ./server
EXPOSE 8787
VOLUME ["/data"]
CMD ["node", "server/server.mjs"]
