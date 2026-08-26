FROM ghcr.io/pnpm/pnpm:11
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install -F broadcaster-admin --frozen-lockfile

COPY . .

RUN pnpm build -F broadcaster-admin

CMD ["pnpm", "start"]
