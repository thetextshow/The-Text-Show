FROM node:16

WORKDIR /usr/src/app

COPY index/package*.json ./

RUN npm install

COPY index/ index/

COPY messaging/ messaging/

ENV PORT=8080

EXPOSE 8080

CMD ["node", "index/index.js"]