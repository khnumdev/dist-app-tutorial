# Use the official Node.js image as the base
FROM node:16

# Set the working directory inside the container
WORKDIR /app

# Copy application files into the container
COPY package*.json ./
COPY orchestrator.js ./

# Install Node.js dependencies
RUN npm install

# Expose the port that your API will run on
EXPOSE 4000

# Start the Node.js application
CMD ["node", "orchestrator.js"]
