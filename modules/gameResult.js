/**
 * Riot TFT module and authentification
 */
const {Tft} = require('riotgames-gg')
const tft = new Tft({region: "EUW", apikey: process.env.API_KEY_RIOT_TFT_COOLDOWN})

/**
 * Map containing datas of each games
 */
const lineColumnByGame = new Map()
lineColumnByGame.set(1,  {line:9,  column:1,    name: "PA G1"})
lineColumnByGame.set(2,  {line:9,  column:5,    name: "PB G1"})
lineColumnByGame.set(3,  {line:9,  column:9,    name: "PC G1"})
lineColumnByGame.set(4,  {line:9,  column:13,   name: "PD G1"})
lineColumnByGame.set(5,  {line:23, column:1,    name: "PA G2"})
lineColumnByGame.set(6,  {line:23, column:5,    name: "PB G2"})
lineColumnByGame.set(7,  {line:23, column:9,    name: "PC G2"})
lineColumnByGame.set(8,  {line:23, column:13,   name: "PD G2"})
lineColumnByGame.set(9,  {line:51, column:1,    name: "PA G1"})
lineColumnByGame.set(10, {line:51, column:5,    name: "PB G1"})
lineColumnByGame.set(11, {line:65, column:1,    name: "PA G2"})
lineColumnByGame.set(12, {line:65, column:5,    name: "PB G2"})
lineColumnByGame.set(13, {line:93, column:3,    name: "Final"})

/**
 * Get element of an array by the .name
 */
Array.prototype.getByName = function(playerName){
    for(player of this){
        if(encodeURI(player.name.toLowerCase()) == encodeURI(playerName.toLowerCase())){
            return player
        }
    }
}

/**
 * This module is create to get result of a game asking Riot API
 */
module.exports = class GameResult{

    /**
     * Import a match in the doc
     * @param {*} doc 
     * @param {*} matchNb 
     */
    static async importByMatch(doc, matchNb, matchIdChecked){
        console.log(`ENTER: importByMatch(${matchNb})`)

        //Load document
        await doc.loadInfo()
        const sheet = doc.sheetsByTitle["Standing 32"]
        await sheet.loadCells()

        //Get line and column of the match
        const column = lineColumnByGame.get(matchNb).column
        let line = lineColumnByGame.get(matchNb).line

        //Get first summoner name of the match
        let cellSummonerName = sheet.getCell(line, column)

        let players = new Array()
        try{
            //Get last match datas of the first summoner of the match
            const matchId = await tft.Match.matchesByName(encodeURI(cellSummonerName.value), 1)
            if(!matchIdChecked.includes(matchId)){
                matchIdChecked.push(matchId)
                const matchData = await tft.Match.matchesByMatchId(matchId[0])
    
                //Get names of all summoners in the match
                for await(let player of matchData.info.participants){
                    const summoner = await tft.Summoner.summonerByPuuid(player.puuid)
                    //Add to the array name of the player and placement in the match
                    players.push({name: summoner.name, score:player.placement})
                }
            }
        }catch(err){
            console.log(err)
        }
        
        //Place placement corresponding to the player
        if(players.length > 0){
            for(let i=0 ; i<8 ; i++){
                const cellName = sheet.getCell(line + i, column)
                let cellScore = sheet.getCell(line + i, column + 2)
                if(cellName.value && players.getByName(cellName.value)){
                    cellScore.value = players.getByName(cellName.value).score
                }
            }
            //Save updated document
            await sheet.saveUpdatedCells()
        }

        console.log(`EXIT: importByMatch()`)
        return {name: lineColumnByGame.get(matchNb).name, list: matchIdChecked}
    }
}