const Battlefy = require('battlefy-api')
const Discord = require('discord.js')

/**
 * Some const for IDs in discord
 */
const channelsId = {
    tournois: "706967090409635840",
    tftFlood: "591856700009742348"
}

async function getBattlefyId(doc){
    //Load document
    await doc.loadInfo()
    const checkInSheet = doc.sheetsByTitle["Participants"]
    await checkInSheet.loadCells()

    //Get tournament id
    const cellId = checkInSheet.getCell(0, 6)
    return cellId.value
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
    static async generateCheckInMessage(bot, doc){
        const id = await getBattlefyId(doc)
        const datas = await Battlefy.getTournamentData(id)
        const embed = new Discord.MessageEmbed()
            .setTitle(datas.name)
            .setColor("#008bff")
            .setURL(`https://battlefy.com/cooldowntv/${datas.slug}/${id}/info`)
            .setThumbnail("https://static-cdn.jtvnw.net/jtv_user_pictures/b387ebe0-4dd8-4430-aab5-e91a1486a20c-profile_image-300x300.png")
            .setDescription("Le Check-in est maintenant ouvert sur Battlefy.\n*(cliquez sur le titre pour accéder au lien)*\n\n"
                            + "Check-in is now open on Battlefy.\n*(click on title to access the link)*")
        
        bot.channels.cache.get(channelsId.tournois).send(embed)
        bot.channels.cache.get(channelsId.tftFlood).send(embed)
    }

    /**
     * Generate the pool message to post on public channel
     * @param {*} bot 
     * @param {*} doc 
     */
    static async generatePoolsMessage(bot, doc){
        const id = await getBattlefyId(doc)
        const datas = await Battlefy.getTournamentData(id)
        const embed = new Discord.MessageEmbed()
            .setTitle(datas.name)
            .setColor("#008bff")
            .setURL("https://docs.google.com/spreadsheets/d/15xow2CpBy9Q5MZuDEarpQX88G-teRRpVoqV3x3lMzzs")
            .setThumbnail("https://static-cdn.jtvnw.net/jtv_user_pictures/b387ebe0-4dd8-4430-aab5-e91a1486a20c-profile_image-300x300.png")
            .setDescription("Les poules sont générées.\n*(cliquez sur le titre pour accéder au lien)*\n\n"
                            + "Pools are generated.\n*(click on title to access the link)*")
        
        bot.channels.cache.get(channelsId.tournois).send(embed)
        bot.channels.cache.get(channelsId.tftFlood).send(embed)
    }

}