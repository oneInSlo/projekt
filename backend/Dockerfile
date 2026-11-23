# Packages the backend-build artifact from CI, which already contains
# production node_modules, so no dependencies are installed here.
FROM node:24-slim

WORKDIR /app
ENV NODE_ENV=production

COPY . .

EXPOSE 3000
CMD ["node", "index.js"]
