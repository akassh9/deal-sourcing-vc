# Dockerfile (lives in backend/Dockerfile)

# 1. Start FROM a base blueprint
#    "Get me a standard, minimal Linux environment that already has Node.js version 18 installed."
FROM node:18-slim

# 2. Set the main folder WORKDIR inside the blueprint
#    "Inside this environment, create a folder named '/usr/src/app' and make it the active directory for the next steps."
WORKDIR /usr/src/app

# 3. COPY only the package lists first
#    "Copy the 'package.json' and 'package-lock.json' files from my computer's 'backend' folder into the '/usr/src/app' folder inside the blueprint."
#    (Doing this separately helps Docker build faster later if only code changes, not dependencies)
COPY package*.json ./

# 4. RUN the installation command
#    "Inside the blueprint's environment, run the command 'npm install --omit=dev'. This installs only the necessary libraries specified in package.json, skipping development tools."
RUN npm install --omit=dev

# 5. COPY the rest of your application code
#    "Now, copy everything else from my computer's 'backend' folder into the '/usr/src/app' folder inside the blueprint."
COPY . .

# 6. Tell Docker which network port the app uses (Documentation)
#    "Just for information, the application inside will listen for network traffic on port 8080."
#    (Cloud Run actually uses an environment variable, but this is good practice)
EXPOSE 8080

# 7. Define the default Command (CMD) to run the app
#    "When someone creates a container from this blueprint, the default command to start the application should be 'node server.js'."
CMD [ "node", "server.js" ]