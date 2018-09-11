FROM node:7
WORKDIR /app

# Install Dependencies
COPY package.json /app
RUN npm install
RUN npm rebuild

# Copy the rest
COPY . /app
CMD node index.js