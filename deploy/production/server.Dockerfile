FROM node:20-alpine AS deps
WORKDIR /app
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY server ./server
WORKDIR /app/server
EXPOSE 8787
CMD ["npm", "run", "start"]

