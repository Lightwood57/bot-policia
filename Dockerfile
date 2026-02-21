FROM node:22-bookworm-slim

# Dependência necessária para @napi-rs/canvas em alguns ambientes
RUN apt-get update && apt-get install -y --no-install-recommends libatomic1 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

CMD ["npm", "start"]