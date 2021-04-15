require('dotenv').config()

/** 
 * My owns JS modules
 */
const CheckedIn = require('./modules/checkedIn.js')
const GeneratePools = require('./modules/generatePools.js')
const GameResult = require('./modules/gameResult.js')
const MsgGestion = require('./modules/msgGestion.js')
const ResetSpreadsheet = require('./modules/resetSpreadsheet.js')
const MsgNotif = require('./modules/msgNotif.js')

/** 
 * GoogleSpreadsheet module and doc authentification
 */
const {GoogleSpreadsheet} = require('google-spreadsheet')
const doc = new GoogleSpreadsheet("15xow2CpBy9Q5MZuDEarpQX88G-teRRpVoqV3x3lMzzs")
doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_EMAIL_COOLDOWN,
    private_key: process.env.GOOGLE_TOKEN_COOLDOWN.replace(/\\n/g, '\n')
})

/** 
 * DiscordJS module and bot authentification
 */
const Discord = require('discord.js')
const bot = new Discord.Client()
bot.login(process.env.DISCORD_TOKEN_COOLDOWN)

/**
 * Cron module
 */
const cron = require('node-cron')

/**
 * Replace basic console to add date and hour
 */
const basicConsole = console.log
Date.prototype.format = function(){
    return this.toLocaleDateString('fr-FR', { 'timeZone': 'Europe/Paris', 
        'day': '2-digit', 'month': '2-digit', 'year': 'numeric', 
        'hour': '2-digit', 'minute': '2-digit', 'second': '2-digit', 'hour12': false 
    }).replace('à', '-')
}
console.log = function(){
    const date = `[${new Date().format()}]`
    Array.prototype.unshift.call(arguments, date)
    basicConsole.apply(this, arguments)
}

/**
 * Some const for IDs in discord
 */
const channelsId = {
    gestion: process.env.DISCORD_CHANNELID_COOLDOWN_TOURNOI
}
const usersId = {
    dalziels: "139866734919286785",
    isillys: "185860788018348032"
}

/**
 * All the variables used during the tournament
 */
let messageGestion = null
let checkInLoop = null
let phaseNb = 0
let players = new Array()
let matchChecked = new Array()
let matchIdChecked = new Array()

/**
 * Event triggered when the bot is logged in
 */
bot.on('ready', function(){
    console.log(`LOG: Logged in as ${bot.user.tag}`)
})

/**
 * Cron triggered all Thursday at 19h00
 */
cron.schedule(`0 18 * * 5`, async function() {
    const channel = await bot.channels.fetch(channelsId.gestion)
    startTournament(channel)
}, {timezone: "Europe/Paris"})

/**
 * Function to start the tournament and post the menu's message in the given channel
 */
async function startTournament(channel){
    //If there is a tournament ID
    if(!await CheckedIn.canCheckIn(doc)) return

    MsgNotif.generateCheckInMessage(bot, doc)

    //Reset the variables
    phaseNb = 0
    players = new Array()
    matchChecked = new Array()
    matchIdChecked = new Array()

    //Reset the spreadsheet to have empty frames
    ResetSpreadsheet.reset(doc)

    //Run the auto-checkin each 5 minutes
    checkInLoop = setInterval(async function(){
        players = await CheckedIn.importFromBattlefy(doc)
    }, 1000 * 60 * 5)

    //Delete all previous messages from the channel
    await channel.messages.fetch().then(async function(messages){
        for await(let message of messages.array()){
            try{
                message.delete()
            }catch(err){}
        }
    })

    //Send the formated discord message with reactions in the channel
    let embed = MsgGestion.getMessageByPhase(0)
    channel.send(embed).then(function(msg){
        MsgGestion.addReactionsOnMessage(msg, 0)
        messageGestion = msg
    })
}

/**
 * Function to import a match and add it to the list of read's matches and add it to the footer of the discord message
 */
async function getMatch(message, matchNb){
    //Get match result from Riot API
    const response = await GameResult.importByMatch(doc, matchNb, matchIdChecked)
    matchIdChecked = response.list
    //Add the match to the list of read's matches
    matchChecked.push(matchNb)
    //Edit the footer of the discord message to prevents users that the task has ended
    MsgGestion.editMessageFooter(message, `${response.name} Ok !`)
}

/**
 * Event triggered when the bot see a new message
 * Mostly used for debug functions
 */
bot.on('message', async function(message){
    //Check if this is a command sended in the good channel of the good server
    if(message.channel.id != channelsId.gestion || !message.content.startsWith("/tournoi-")) return

    //Delete the command
    message.delete()

    //Run corresponding functions
    if(message.content == "/tournoi-help"){
        let help = new Discord.MessageEmbed()
            .setTitle(`Cooldown TFT Cup - Help`)
            .setColor("#008bff")
            .setURL("https://docs.google.com/spreadsheets/d/15xow2CpBy9Q5MZuDEarpQX88G-teRRpVoqV3x3lMzzs")
            .setThumbnail("https://static-cdn.jtvnw.net/jtv_user_pictures/b387ebe0-4dd8-4430-aab5-e91a1486a20c-profile_image-300x300.png")
            .setDescription(
                "`/tournoi-start` pour démarrer le tournoi\n"
                + "`/tournoi-checkin` pour lancer un checkin manuel\n"
                + "`/tournoi-pools` pour générer les poules aléaloirement\n"
                + "`/tournoi-demis` pour générer les demis en fonction des qualifs\n"
                + "`/tournoi-final` pour générer la finale en fonction des demis\n"
                + "`/tournoi-game num` pour récupérer les résultats de la game *num*\n"
            )
        message.member.createDM().then(function(DMChannel){
            DMChannel.send(help)
        })
    }else if(message.content == "/tournoi-start"){
        startTournament(message.channel)
    }else if(message.content == "/tournoi-checkin"){
        players = await CheckedIn.importFromBattlefy(doc)
    }else if(message.content == "/tournoi-pools"){
        GeneratePools.generateInit(doc, players)
    }else if(message.content == "/tournoi-demis"){
        GeneratePools.generateDemis(doc)
    }else if(message.content == "/tournoi-final"){
        GeneratePools.generateFinal(doc)
    }else if(message.content.startsWith("/tournoi-game ")){
        const response = GameResult.importByMatch(doc, parseInt(message.content.split(" ")[1]), matchIdChecked)
        matchIdChecked = response.list
    }
})

/**
 * Event triggered when the bot see a new reaction on a message
 * Used to get actions wanted during tournament
 */
bot.on("messageReactionAdd", async function(reaction, user){
    //Check if the reaction is on the good message and if its actualy a real user
    if(!messageGestion || reaction.message.id != messageGestion.id || user.id == bot.user.id) return

    //Remove this one reaction
    reaction.message.reactions.resolve(reaction.emoji.name).users.remove(user.id)

    //Edit the footer to prevents user that a task is running
    MsgGestion.editMessageFooter(reaction.message, "Loading...")

    let equality
    if(reaction.emoji.name == "➡️"){
        //This arrow is used when we do a phase changement
        if(phaseNb == 0){
            //Generate the initial pools and remove the auto-checkin
            await GeneratePools.generateInit(doc, players)
            MsgNotif.generatePoolsMessage(bot, doc)
            clearInterval(checkInLoop)
        }else if(phaseNb == 1){
            //Generate the demis
            equality = await GeneratePools.generateDemis(doc)
            //Ping the admins in case of an equality to make sure they check the result
            if(equality && equality.length > 0){
                reaction.message.channel.send(`<@${usersId.dalziels}> <@${usersId.isillys}>`).then(function(msg){
                    //Insta delete the ping to they get the notification but bot isnt flooding the channel
                    msg.delete()
                })
            }
        }else if(phaseNb == 2){
            //Generate the final
            equality = await GeneratePools.generateFinal(doc)
            //Ping the admins in case of an equality to make sure they will handle it
            if(equality && equality.length > 0){
                reaction.message.channel.send(`<@${usersId.dalziels}> <@${usersId.isillys}>`).then(function(msg){
                    //Insta delete the ping to they get the notification but bot isnt flooding the channel
                    msg.delete()
                })
            }
        }
        //Increament the phase
        phaseNb++

        //Remove all reactions from the message so we can actualy add the new ones corresponding to the phase
        reaction.message.reactions.removeAll()
        //Send the formated discord message with reactions in the channel
        let embed = MsgGestion.getMessageByPhase(phaseNb, equality)
        reaction.message.edit(embed).then(function(msg){
            MsgGestion.addReactionsOnMessage(msg, phaseNb)
            messageGestion = msg
        })
    }else if(reaction.emoji.name == "🔄" && phaseNb == 0){
        //This circle is used when we want to do a manual checkin
        players = await CheckedIn.importFromBattlefy(doc)
        MsgGestion.editMessageFooter(reaction.message, "CheckIn Ok !")
    }else if(reaction.emoji.name == "⬇️" && phaseNb == 3){
        //THis arrow is used to get the results of the final match
        getMatch(reaction.message, 19)
    }else if(phaseNb == 1){
        //Switch to get the good game nb during the qualif phase
        let matchNb
        switch(reaction.emoji.name){
            case "🇦":
                matchNb = !matchChecked.includes(1) ? 1 : 7
                break
            case "🇧":
                matchNb = !matchChecked.includes(2) ? 2 : 8
                break
            case "🇨":
                matchNb = !matchChecked.includes(3) ? 3 : 9
                break
            case "🇩":
                matchNb = !matchChecked.includes(4) ? 4 : 10
                break
            case "🇪":
                matchNb = !matchChecked.includes(5) ? 5 : 11
                break
            case "🇫":
                matchNb = !matchChecked.includes(6) ? 6 : 12
                break
        }
        getMatch(reaction.message, matchNb)
    }else if(phaseNb == 2){
        //Switch to get the good game nb during the demis phase
        let matchNb
        switch(reaction.emoji.name){
            case "🇦":
                matchNb = !matchChecked.includes(13) ? 13 : 16
                break
            case "🇧":
                matchNb = !matchChecked.includes(14) ? 14 : 17
                break
            case "🇨":
                matchNb = !matchChecked.includes(15) ? 15 : 18
                break
        }
        getMatch(reaction.message, matchNb)
    }
})