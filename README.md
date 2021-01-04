# Webwatcher With Telegram
This telegram bot can give you notifications as soon as something changes on websites you give it to track. Pull Requests are welcome!

# Setup
## Local setup
First clone the repository to your local dev-machine and run `npm install` inside the root directory to download necessary dependencies. Then create a file `.env` inside the root directory with this content:

```
LOCAL=true
BOT_SECRET=<your-telegram-bot-token>
```

Important: The value for LOCAL has to be exactly the string "true"

### Test Run Locally
(You can skip this part if you don't want a local setup)
Let's try it, run `npm start` inside your root directory. The following output should return:
```
Started server
Registered proxy URL: <someurl>
Webhook set was successful
```
If everything worked, you should be able to message your bot (`/create` for example).

## Server Setup
Follow [the official Telegram Tutorial on how to create a Bot](https://core.telegram.org/bots#3-how-do-i-create-a-bot) (takes a few minutes only). As soon as you have the API Token/Secret, come back here :).

Next, simply `git clone` this repository on your server and run `npm install` to install all necessary dependencies. Since the webwatcher needs to run 24/7, you need to daemonize it instead of simply running npm start. You can do that with [PM2](https://pm2.io/) or with Docker (docker-compose.yml file is included, exposed port is 8020).

Also create a file `/.env` and set the `BOT_SECRET` var to your bot secret.

You also need a MongoDB at `mongodb://localhost:27017` (yes no auth since my mongodb is only running in localhost mode). If you can't meet this requirement, change `/index.js` accordingly.

Then start the webwatcher with pm2, Docker (`docker-compose up -d`) or whatever daemonizing solution you chose. Voila, your bot should now react to a `/create` message.

## Server Setup with CI/CD
I developed this using Jenkins and two telegram bots (one for my local instance and one for the current live bot on my server). I found this the only convenient way. If someone would want to do this, the Jenkinsfile is in the repo too. All it does is basically do all the steps in the previous section automatically.

## Jenkins Build
If everything is setup right, you should be able to make a push to your own repositorys master branch and see Jenkins building your node.js application and deploying it with docker. After you [setup a webhook so telegram finds your server](https://core.telegram.org/bots/api#getting-updates), you should be able to write to your deployment bot too. 
