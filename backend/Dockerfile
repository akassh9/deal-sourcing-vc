# Use an official Node.js LTS image that includes Yarn
FROM node:18-alpine

# Set the working directory inside the container to /app
WORKDIR /app

# Copy the backend package files to take advantage of Docker caching
COPY package.json yarn.lock ./

# Install only production dependencies
RUN yarn install --production

# Copy the entire backend directory contents into the container
COPY . .

# Expose the port that your backend listens on (match this with your app's port)
EXPOSE 3001

# Use yarn start as the default command to run your backend
CMD [ "yarn", "start" ]
