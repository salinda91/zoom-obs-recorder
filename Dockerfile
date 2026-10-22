FROM node:20-bookworm

WORKDIR /app

# Native build deps for better-sqlite3 fallback
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

COPY . .

CMD ["bash"]
