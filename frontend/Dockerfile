FROM node:22-slim AS build

WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
RUN npm run lint && npm run build


FROM node:22-slim AS runtime

ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
    && npm cache clean --force

COPY server.js ./
COPY --from=build /app/dist ./dist

EXPOSE 8080

USER node

CMD ["node", "server.js"]
