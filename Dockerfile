FROM node:carbon

RUN apt-get update && apt-get install -y wget --no-install-recommends \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install -y google-chrome-unstable --no-install-recommends \
  && rm -rf /var/lib/apt/lists/* \
  && rm -rf /src/*.deb

RUN mkdir -p /usr/src/app
COPY . /usr/src/app

WORKDIR /usr/src/app/server
RUN npm install

WORKDIR /usr/src/app/client
RUN npm install
RUN npm run build

WORKDIR /usr/src/app/server

CMD ["node", "index.js"]
