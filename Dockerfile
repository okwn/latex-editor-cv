FROM node:20-slim AS base

# Install LaTeX + build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-xetex \
    texlive-latex-extra \
    texlive-fonts-extra \
    latexmk \
    fontconfig \
    fonts-liberation \
    fonts-dejavu \
    fonts-droid-fallback \
    fonts-noto-core \
    fontconfig \
    curl \
  && fc-cache -f \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 --group nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN chown -R nextjs:nodejs /app/public /app/.next

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
