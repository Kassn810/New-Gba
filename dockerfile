# Use Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Expose port 8080
EXPOSE 8080

# Run dev server
CMD ["npm", "start"]
