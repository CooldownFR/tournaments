/**
 * This module is create to reset the spreadsheet to have empty frames
 */
module.exports = class ResetSpreadsheet{

    static async reset(doc){
        console.log(`ENTER: reset()`)

        await doc.loadInfo()
        const checkInSheet = doc.sheetsByTitle["Participants"]
        await checkInSheet.loadCells()
        const standingSheet = doc.sheetsByTitle["Standing 32"]
        await standingSheet.loadCells()

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
        await checkInSheet.saveUpdatedCells()

        for(let line=0 ; line<8 ; line++){
            //Reset of qualif
            for(let column=1 ; column <=13 ; column+=4){
                let cellName1 = standingSheet.getCell(line+9, column)
                cellName1.value = ""
                let cellScore1 = standingSheet.getCell(line+9, column+2)
                cellScore1.value = ""
                let cellScore2 = standingSheet.getCell(line+23, column+2)
                cellScore2.value = ""
            }
            //Reset of demis
            for(let column=1 ; column <=5 ; column+=4){
                let cellScoreDemis1 = standingSheet.getCell(line+51, column+2)
                cellScoreDemis1.value = ""
                let cellScoreDemis2 = standingSheet.getCell(line+65, column+2)
                cellScoreDemis2.value = ""
            }
            let cellNameDemis1 = standingSheet.getCell(line+54, 11)
            cellNameDemis1.value = ""
            let cellPointsDemis1 = standingSheet.getCell(line+54, 13)
            cellPointsDemis1.value = ""
            let cellNameDemis2 = standingSheet.getCell(line+62, 11)
            cellNameDemis2.value = ""
            let cellPointsDemis2 = standingSheet.getCell(line+62, 13)
            cellPointsDemis2.value = ""
            //Reset of final
            let cellNameFinal = standingSheet.getCell(line+106, 3)
            cellNameFinal.value = ""
            let cellScoreFinal = standingSheet.getCell(line+93, 5)
            cellScoreFinal.value = ""
            let cellScore32Final = standingSheet.getCell(line+106, 5)
            cellScore32Final.value = ""
            let cellScore16Final = standingSheet.getCell(line+106, 6)
            cellScore16Final.value = ""
        }
        await standingSheet.saveUpdatedCells()

        console.log(`EXIT: reset()`)
    }
}