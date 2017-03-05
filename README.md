# How to get it working:

1. Clone the repo and get into the folder.
2. Create a certificate for the mumble connection and save them to `key.pem` and `cert.pem`:
  `openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem`
3. Edit the environment file:
  `cp default.env .env`
  `vi .env`
4. Add the Telegram Bot Token to the environment. Ask @BotFather for an API token and paste it after the __=__ char.
5. Change the Server-URL and the Mumble Username to whatever you desire.
6. Close the file.
7. Run `npm install` to recieve the required packages.

# Contribute

If you want to, you can surely contribute to this project. Just send a PR!