FROM node as BUILD
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
FROM nginx:stable
COPY --from=BUILD /app/dist/MessagingFront/browser /usr/share/nginx/html
EXPOSE 80 4200