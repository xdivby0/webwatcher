# Telegram Bot Boilerplate for Continuous Deployment with Jenkins on Docker
This repository is meant to be a boilerplate to start a telegram bot. It works with Jenkins continuous Integration and starts a Docker container after the build.

# Setup
## Telegram Bot
Follow [the official Telegram Tutorial on how to create a Bot](https://core.telegram.org/bots#3-how-do-i-create-a-bot) (takes a few minutes only). This bot will be your development bot, no one except you will use it. As soon as you have the API Token/Secret, come back here :).

## Local setup
First clone the repository to your local dev-machine and run `npm install` inside the root directory to download necessary dependencies. Then create a file `.env` inside the root directory with this content:

```
LOCAL=true
BOT_SECRET=<your-telegram-bot-token>
```

Important: The value for LOCAL has to be exactly the string "true"

## Test Run
Let's try it, run `npm start` inside your root directory. The following output should return:
```
Started server
Registered proxy URL: <someurl>
Webhook set was successful
```
If everything worked, you should be able to write to your bot (`/help` or `/roll`).

## Jenkins / Server Setup
If you want to continuously deploy while developing, you have to create a second Telgram bot, which will be your deployment Bot that is always running and on your server.

Next setup a git repository with the contents of this one or fork this one.

For the next steps with Jenkins I used a pipeline created with Jenkins Blue Ocean. I don't know if this matters but now you have the info :)

Then setup a Pipeline in Jenkins to deploy your node.js application (connect with the newly created repository). In my case I used Jenkins to deploy the node.js app in a docker container. If you want to do that too, simply use the `Jenkinsfile` buildscript in the root directory (it will automatically be used if you don't rename or delete it).

You will then create global Jenkins text-credentials, named `dice_master_env`. There you paste the following content as the secret:
`BOT_SECRET=<second-telegram-bot-token>`
You can also name the credentials differently, but then you will also have to change the name in the `Jenkinsfile`.

## Jenkins Build
If everything is setup right, you should be able to make a push to your own repositorys master branch and see Jenkins building your node.js application and deploying it with docker. After you [setup a webhook so telegram finds your server](https://core.telegram.org/bots/api#getting-updates), you should be able to write to your deployment bot too. 
