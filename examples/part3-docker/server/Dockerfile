# Use the linuxserver/blender Docker image as the base
FROM linuxserver/blender:latest

# Install Node.js and npm
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy application files into the container
COPY package*.json ./
COPY server.js ./

# Install Node.js dependencies
RUN npm install

# Expose the port that your API will run on
EXPOSE 3000

# Override the entrypoint to bypass starting Xvnc and Openbox
ENTRYPOINT []

# Start the Node.js application
CMD ["node", "server.js"]
