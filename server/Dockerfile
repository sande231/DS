FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY tsconfig.json ./
COPY src ./src

RUN npm install -g tsx

EXPOSE 3001

CMD ["tsx", "src/server.ts"]
