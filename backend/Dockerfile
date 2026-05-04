FROM node:20-alpine

WORKDIR /app

COPY package.json .
RUN npm install --production

COPY src ./src

RUN mkdir -p uploads

EXPOSE 5000

# Run migrations then start
CMD node src/db/migrate.js && node src/index.js
