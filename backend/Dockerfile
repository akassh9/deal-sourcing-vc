# Use the current LTS Node.js version (Node 20)
FROM node:20-slim

# Set the working directory inside the container image
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install application dependencies using npm
RUN npm install --omit=dev

# Copy the rest of your backend application source code
COPY . .

# Inform Docker that the container listens on port 8080 at runtime
EXPOSE 8080

# Define the command to run your application when the container starts
CMD [ "node", "server.js" ]