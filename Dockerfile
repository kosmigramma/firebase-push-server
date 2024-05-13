FROM node:14

WORKDIR /app
COPY package.json server.ts tsconfig.json ./
RUN npm install

CMD npm start
