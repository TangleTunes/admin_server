FROM node:19

# Set Web Application working directory
RUN mkdir /app
WORKDIR /app

# Build the node project
COPY package*.json .
RUN npm install
COPY . .

#Set up required directories
RUN mkdir /app/wallet
RUN mkdir /app/static/uploads

# Fix potential windows line terminator error
RUN sed -i 's/\r//g' scripts/*.sh

# Install commands
RUN bash scripts/install.sh

# Run the web application
EXPOSE 80
EXPOSE 3000
CMD ["node", "index.js"]