FROM node:19

# Set Web Application working directory
RUN mkdir /app
RUN mkdir /app/wallet
WORKDIR /app

# Build the node project
COPY package*.json .
RUN npm install
COPY . .

# Fix potential windows line terminator error
RUN sed -i 's/\r//g' scripts/*.sh

# Install commands
RUN scripts/install.sh

# Run the web application
EXPOSE 80
EXPOSE 3000
CMD ["node", "index.js"]