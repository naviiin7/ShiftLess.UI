# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Inside this build stage only, point the app at the API the browser
# will reach through the published port. Your source file isn't touched.
RUN printf "export const environment = {\n  production: true,\n  apiUrl: 'http://localhost:7098/api'\n};\n" > src/environments/environment.ts

RUN npm run build

# ---- Serve stage ----
FROM nginx:alpine
COPY --from=build /app/dist/ShiftLess.UI/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80