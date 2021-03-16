const Battlefy = require('battlefy-api')
const Discord = require('discord.js')
const axios = require('axios')

/**
 * Some const for IDs in discord
 */
const channelsId = {
    tournois: "706967090409635840",
    tftFlood: "591856700009742348"
}

Date.prototype.isSameDay = function(otherDate){
    return this.getFullYear() == otherDate.getFullYear() && this.getMonth() == otherDate.getMonth() && this.getDate() == otherDate.getDate()
}

async function getBattlefyId(){
    const response = await axios.get("https://dtmwra1jsgyb0.cloudfront.net/organizations/5880c1d568b4923b03d60b17/tournaments")
    for(let i=response.data.length-1 ; i>=0 ; i--){
        const tournament = response.data[i]
        if(tournament.isPublic && tournament.isPublished && (new Date(tournament.startTime).isSameDay(new Date())) && tournament.gameID == "5d153eb296a540140d92221f"){
            console.log(`LOG: Found ${tournament["_id"]}`)
            return tournament["_id"]
        }
    }
    return null
}

/**
 * This module is create to generate formated discord message
 */
module.exports = class MsgNotif{

    /**
     * Generate the check in message to post on public channel
     * @param {*} bot 
     * @param {*} doc 
     */
    static async generateCheckInMessage(bot){
        const datas = await Battlefy.getTournamentData(await getBattlefyId())
        const url = `https://battlefy.com/cooldowntv/${datas.slug}/${id}/info`
        const embed = new Discord.MessageEmbed()
            .setTitle(datas.name)
            .setColor("#008bff")
            .setURL(url)
            .setThumbnail("https://static-cdn.jtvnw.net/jtv_user_pictures/b387ebe0-4dd8-4430-aab5-e91a1486a20c-profile_image-300x300.png")
            .setDescription(`Le Check-in est maintenant ouvert sur Battlefy.\n*[lien](${url})*\n\n`
                            + `Check-in is now open on Battlefy.\n*[link](${url})*`)
        
        bot.channels.cache.get(channelsId.tournois).send(embed)
        bot.channels.cache.get(channelsId.tftFlood).send(embed)
    }

    /**
     * Generate the pool message to post on public channel
     * @param {*} bot 
     * @param {*} doc 
     */
    static async generatePoolsMessage(bot){
        const datas = await Battlefy.getTournamentData(await getBattlefyId())
        const url = "https://docs.google.com/spreadsheets/d/15xow2CpBy9Q5MZuDEarpQX88G-teRRpVoqV3x3lMzzs"
        const embed = new Discord.MessageEmbed()
            .setTitle(datas.name)
            .setColor("#008bff")
            .setURL(url)
            .setThumbnail("https://static-cdn.jtvnw.net/jtv_user_pictures/b387ebe0-4dd8-4430-aab5-e91a1486a20c-profile_image-300x300.png")
            .setDescription(`Les poules sont générées.\n*[lien](${url})*\n\n`
                            + `Pools are generated.\n*[link](${url})*`)
        
        bot.channels.cache.get(channelsId.tournois).send(embed)
        bot.channels.cache.get(channelsId.tftFlood).send(embed)
    }

}