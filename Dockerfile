# backe - end 
FROM node:latest
WORKDIR /usr/app/src

COPY package*.json ./

RUN npm install -qy

COPY . .
