# Step 1: Build the React Application
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Pass build environment variables if needed
ENV VITE_API_URL=http://localhost:8000
RUN npm run build

# Step 2: Nginx Web Server Container
FROM nginx:1.25-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
