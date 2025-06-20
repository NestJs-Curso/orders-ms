FROM node:24-alpine3.22

WORKDIR /usr/src/app

COPY package-lock.json ./
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000