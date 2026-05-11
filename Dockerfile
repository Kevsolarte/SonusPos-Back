FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres" \
    DIRECT_URL="postgresql://postgres:postgres@localhost:5432/postgres" \
    npx prisma generate

RUN npm run build

ENV PORT=10000

EXPOSE 10000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]