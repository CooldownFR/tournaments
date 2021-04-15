/**
 * This method will randomize the order of the array
 */
Array.prototype.shuffle = function(){
    for(let i=this.length-1 ; i>0 ; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        let temp = this[i]
        this[i] = this[j]
        this[j] = temp
    }
}

/**
 * This method will organize the array by putting player with biggest scores at first
 */
Array.prototype.order = function(){
    this.sort(function(a, b){
        return b.points - a.points
    })
}

/**
 * Function to get the better pos of a player between pos1 and pos2
 */
function getBetterPos(player){
    if(player.pos1 > player.pos2){
        return player.pos1
    }else{
        return player.pos2
    }
}

/**
 * This method will reorganize the array by checking the better pos at first then the pos2 and then randomize it
 */
Array.prototype.reorder = function(){
    this.shuffle()
    //Order by pos2
    this.sort(function(a, b){
        return a.pos2 - b.pos2
    })
    //Check better pos
    this.sort(function(a, b){
        return getBetterPos(b) - getBetterPos(a)
    })
}

/**
 * This module is create to generate the initial pools, the demis, and the final
 */
module.exports = class GeneratePools{

    /**
     * Generate the initial pools taking a list of player
     * @param {*} doc 
     * @param {*} players 
     */
    static async generateInit(doc, players){
        console.log(`ENTER: generateInit()`)

        //Only keep the first 40 players
        if(players.lenght > 41){
            players.splice(48)
        }else{
            players.splice(40)
        }
        //Determine the number of pools
        const nbPools = Math.floor(players.length / 8) + (players.length % 8 == 0 ? 0 : 1)
        //Randomize order of the players
        players.shuffle()

        //Load document
        await doc.loadInfo()
        const sheet = doc.sheetsById["94998215"]
        await sheet.loadCells()

        //Place players in each pools one by one
        let pool = 0
        let line = 9
        for await(let player of players){
            const column = 4 * (pool + 1) - 3
            let cell = sheet.getCell(line, column)
            cell.value = player.riotName

            pool = (pool + 1) % nbPools
            if(pool == 0) line++
        }
        //Save updated document
        await sheet.saveUpdatedCells()

        console.log(`EXIT: generateInit()`)
    }

    /**
     * Generate the demis by looking at initial pools result
     * @param {*} doc 
     */
    static async generateDemis(doc){
        console.log(`ENTER: generateDemis()`)

        let players = new Array()

        //Load document
        await doc.loadInfo()
        const sheet = doc.sheetsById["94998215"]
        await sheet.loadCells()

        //Check for result of initial pools
        for(let pool=1 ; pool<=6 ; pool++){
            for(let cpt=0 ; cpt<8 ; cpt++){
                const column = 4 * pool - 3
                const line = 35 + cpt
                const cellName = sheet.getCell(line, column)
                const cellPoints = sheet.getCell(line, column + 2)
                const cellPos1 = sheet.getCell(line-26, column + 2)
                const cellPos2 = sheet.getCell(line-12, column + 2)
                if(cellName.value && cellName.value != ""){
                    players.push({name: cellName.value, points: cellPoints.value, pos1:cellPos1.value, pos2: cellPos2.value})
                }
            }
        }
        players.shuffle()
        players.order()

        const thirdDemi = players.length > 40

        //Check if there is a critical point of equality
        let playersToReorder = new Array()
        if((!thirdDemi && players[15].points == players[16].points) || (thirdDemi && players[23].points == players[24].points)){
            let cpt = 0
            let equalityPos
            //Get all the players of the equality
            for await(let player of players){
                if((!thirdDemi && player.points == players[15].points) || (thirdDemi && player.points == players[23].points)){
                    if(!equalityPos) equalityPos = cpt
                    playersToReorder.push(player)
                }
                cpt++
            }
            //Reorder players of the equality
            playersToReorder.reorder()
            //Reinsert in initial list the reordered players
            players.splice(equalityPos)
            for await(let player of playersToReorder){
                players.push(player)
            }
        }

        //Place players in each pools of demis one by one
        let line = 54
        const column = 13
        for(let i=0 ; i<(thirdDemi ? 24 : 16) ; i++){
            if(!thirdDemi && (i+1)%3 == 0){
                line++
            }else{
                let cellName = sheet.getCell(line, column)
                let cellPoints = sheet.getCell(line, column + 2)
                cellName.value = players[i].name
                cellPoints.value = players[i].points * 0.5
            }
            line++
        }
        //Save updated document
        await sheet.saveUpdatedCells()

        //Log the equality
        if(playersToReorder.length > 0){
            console.log("LOG: Demis critical point equality :")
            for(let player of playersToReorder){
                console.log(`   - ${player.name} | Pos1: ${player.pos1} | Pos2: ${player.pos2}`)
            }
        }

        console.log(`EXIT: generateDemis()`)
        return playersToReorder
    }

    static async generateFinal(doc){
        console.log(`ENTER: generateFinal()`)

        let players = new Array()

        //Load document
        await doc.loadInfo()
        const sheet = doc.sheetsById["94998215"]
        await sheet.loadCells()

        //Check for result of initial pools
        let column = 11
        for(let i=0 ; i<24 ; i++){
            const line = 54 + i
            const cellName = sheet.getCell(line, column)
            const cellPoints = sheet.getCell(line, column + 4)
            const cellTop32 = sheet.getCell(line, column + 2)
            const cellTop16 = sheet.getCell(line, column + 3)
            if(cellName.value && cellName.value != ""){
                players.push({name: cellName.value, points: cellPoints.value, top32: cellTop32.value, top16: cellTop16.value})
            }
        }
        players.order()

        //Check if there is a critical point of equality
        let equality = new Array()
        if(players[7].points == players[8].points){
            for await(let player of players){
                if(player.points == players[7].points){
                    equality.push(player)
                }
            }
        }
        
        //Place players in final one by one
        let line = 106
        column = 3
        for(let i=0 ; i<8 ; i++){
            let cellName = sheet.getCell(line, column)
            let cellTop32 = sheet.getCell(line, column + 2)
            let cellTop16 = sheet.getCell(line, column + 3)
            cellName.value = players[i].name
            cellTop32.value = players[i].top32
            cellTop16.value = players[i].top16
            line++
        }
        //Save updated document
        await sheet.saveUpdatedCells()

        //Log the equality
        if(equality.length > 0){
            console.log("LOG: Final critical point equality :")
            for(let player of equality){
                console.log(`   - ${player.name}`)
            }
        }

        console.log(`EXIT: generateFinal()`)
        return equality
    }
}