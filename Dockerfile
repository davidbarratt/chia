FROM node:lts-alpine AS base
RUN mkdir -p /opt/chia
WORKDIR /opt/chia

LABEL org.opencontainers.image.source https://github.com/davidbarratt/chia

# Add the dependencies to the PATH
ENV PATH="/opt/chia/node_modules/.bin:${PATH}"

# # Install dependencies only when needed
FROM base AS builderdeps
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
COPY --from=builderdeps /opt/chia/package.json /opt/chia/package-lock.json  ./
COPY --from=builderdeps /opt/chia/node_modules ./node_modules
COPY app ./app
COPY public ./public
COPY styles ./styles
COPY postcss.config.js remix.config.js remix.env.d.ts tailwind.config.js tsconfig.json ./

RUN tailwindcss -m -i ./styles/app.css -o app/styles/app.css \
    && remix build

FROM builderdeps AS serverdeps
RUN npm ci --production --ignore-scripts

# Production image, copy all the files and run remix
FROM base AS server

COPY --from=serverdeps /opt/chia/node_modules ./node_modules
COPY --from=builder /opt/chia/public ./public
COPY --from=builder /opt/chia/remix.config.js /opt/chia/package.json /opt/chia/package-lock.json ./
COPY --from=builder --chown=node:node /opt/chia/build ./build

EXPOSE 3000

USER node

CMD ["remix-serve", "build"]
