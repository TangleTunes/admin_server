FROM node:19

# Set Smart Contract working directory
RUN mkdir /tangletunes
COPY abi.json /tangletunes/

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

# Run the web application
EXPOSE 3000
CMD ["node", "index.js"]