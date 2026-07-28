FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma/ prisma/
RUN npx prisma generate

COPY . .

EXPOSE 3000
CMD ["node", "src/index.js"]
