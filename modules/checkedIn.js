const Battlefy = require('battlefy-api')

/**
 * This method will organize the array by putting player who checkedin first at the beggining
 */
Array.prototype.orderByDate = function(){
    this.sort(function(a, b){
        return new Date(a.checkIn) - new Date(b.checkIn)
    })
}

/**
 * This module is create to ask datas to Battlefy to know which player are checked in or not
 */
module.exports = class CheckedIn{

    /**
     * Ask datas to Battlefy and then insert it in the doc
     * @param {*} doc 
     */
    static async importFromBattlefy(doc){
        console.log(`ENTER: importFromBattlefy()`)

        //Load document
        await doc.loadInfo()
        const checkInSheet = doc.sheetsByTitle["Participants"]
        await checkInSheet.loadCells()

        //Get tournament id
        const cellId = checkInSheet.getCell(0, 6)
        const id = cellId.value

        let playersChecked = new Array()
        let playersNoCheck = new Array()

        try{
            //Ask for battlfy datas of the tournament
            const datas = await Battlefy.getTournamentTeams(id)

            //Check if the players are checked in or not
            for await(let data of datas){
                let riotName = data.players[0].inGameName ? data.players[0].inGameName : ""
                let discordName = data.customFields[0].value ? data.customFields[0].value : ""
                if(data.checkedInAt){
                    playersChecked.push({riotName: riotName, discordName: discordName, checkIn: data.checkedInAt})
                }else{
                    playersNoCheck.push({riotName: riotName, discordName: discordName})
                }
            }
            playersChecked.orderByDate()
        }catch(err){
            console.log("LOG: No tournament ID specified")
        }

        //Reset spreadsheet
        let endOfLoop = false
        let cpt = 2
        //Reset of participants
        do{
            let cellNameIn = checkInSheet.getCell(cpt, 0)
            let cellDiscIn = checkInSheet.getCell(cpt, 1)
            let cellNameNo = checkInSheet.getCell(cpt, 2)
            let cellDiscNo = checkInSheet.getCell(cpt, 3)
            if(!cellNameIn.value && !cellNameNo.value){
                endOfLoop = true
            }

            cellNameIn.value = ""
            cellDiscIn.value = ""
            cellNameNo.value = ""
            cellDiscNo.value = ""

            cpt++
        }while(!endOfLoop)

        //Place players in the checkin column one by one
        cpt = 2
        for await(let player of playersChecked){
            let cellRiot = checkInSheet.getCell(cpt, 0)
            let cellDiscord = checkInSheet.getCell(cpt, 1)
            cellRiot.value = player.riotName
            cellDiscord.value = player.discordName
            cpt++
        }

        //Place players in the non-checkin column one by one
        cpt = 2
        for await(let player of playersNoCheck){
            let cellRiot = checkInSheet.getCell(cpt, 2)
            let cellDiscord = checkInSheet.getCell(cpt, 3)
            cellRiot.value = player.riotName
            cellDiscord.value = player.discordName
            cpt++
        }
        //Save updated document
        await checkInSheet.saveUpdatedCells()

        console.log(`EXIT: importFromBattlefy()`)
        return playersChecked
    }

    static async canCheckIn(doc){
        console.log(`ENTER: canCheckIn()`)

        //Load document
        await doc.loadInfo()
        const checkInSheet = doc.sheetsByTitle["Participants"]
        await checkInSheet.loadCells()

        //Get tournament id
        const cellId = checkInSheet.getCell(0, 6)
        if(!cellId.value){
            console.log("LOG: No tournament ID specified")
        }

        console.log(`EXIT: canCheckIn()`)
        return cellId.value
    }
}