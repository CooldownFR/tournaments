const { GoogleSpreadsheet } = require('google-spreadsheet');
const { Tft } = require('riotgames-gg');
const Battlefy = require('battlefy-api');
const validate = require('../modules/validate');

class CooldownTournament {
    /**
     * A module to handle tournaments up to 48 participants from Battlefy to Google Spreadsheet on TFT.
     * @param {Object} options Options for this module.
     * @param {Object} options.riot RIOT API options.
     * @param {"BR"|"EUN"|"EUW"|"JP"|"KR"|"LAN"|"LAS"|"NA"|"OCE"|"TR"|"RU"} options.riot.region RIOT API region.
     * @param {string} options.riot.apikey RIOT API key.
     * @param {Object} options.google_account Google bot.
     * @param {string} options.google_account.client_email Email for the Google Bot user.
     * @param {string} options.google_account.private_key Token for the Google Bot user.
     * @param {Object} options.spreadsheet Spreadsheet used for results. This module only handle results fetching, you must handle the rest by yourself.
     * @param {string} options.spreadsheet.id ID for the spreadsheet.
     * @param {round} options.spreadsheet.round1 1st round for tournaments under 48 participants.
     * @param {round} options.spreadsheet.round2 2nd round for tournaments under 48 participants.
     * @param {round} options.spreadsheet.round3 3rd round for tournaments under 48 participants.
     * @param {round} options.spreadsheet.round1_48 1st round for tournaments of 48 participants.
     * @param {round} options.spreadsheet.round2_48 2nd round for tournaments of 48 participants.
     * @param {round} options.spreadsheet.round3_48 3rd round for tournaments of 48 participants.
     * @param {Object} options.spreadsheet.battlefy Battlefy options.
     * @param {string} options.spreadsheet.battlefy.sheetId ID of the sheet owning the tournament ID.
     * @param {cell} options.spreadsheet.battlefy.tournament_id Cell position for tournament ID. First is line, second is column. A3 would be [ 3, 1 ].
     * @param {Object} options.spreadsheet.checkins Check-ins options.
     * @param {check} options.spreadsheet.checkins.checked Options for checked participants.
     * @param {check} options.spreadsheet.checkins.nonchecked Options for non-checked participants.
     */
    constructor(options) {
        /** @type {{ round1: round, round2: round, round3: round, round1_48: round, round2_48: round, round3_48: round }} */
        this.architecture = validate('object', options.spreadsheet);
        delete this.architecture.id;

        this.spreadsheet = new GoogleSpreadsheet(validate('string', options && options.spreadsheet ? options.spreadsheet.id : ''));
        this.spreadsheet.useServiceAccountAuth({
            'client_email': validate('string', options && options.google_account ? options.google_account.client_email : ''),
            'private_key': validate('string', options && options.google_account ? options.google_account.private_key : '')
        });

        this.TFT = new Tft({
            'region': [ 'BR', 'EUN', 'EUW', 'JP', 'KR', 'LAN', 'LAS', 'NA', 'OCE', 'TR', 'RU' ].includes(options && options.riot ? options.riot.region : '') ? options.riot.region : 'EUW',
            'apikey': validate('string', options && options.riot ? options.riot.apikey : '')
        });
    }

    /**
     * Retrieve the number of players checked-in.
     * @returns {Promise<number>}
     */
    async playersCount() {
        return new Promise((resolve, reject) => {
            if (this.verify('checkins', 'checked', 'first_discordtag')) {
                this.spreadsheet.loadInfo().then(() => {
                    const checkedSheet = this.spreadsheet.sheetsById[this.architecture.checkins.checked.sheetId];
                    checkedSheet.loadCells().then(() => {
                        resolve((new Array(48)).map((u, i) => {
                            return checkedSheet.getCell(this.architecture.checkins.checked.first_discordtag[0] + i, this.architecture.checkins.checked.first_discordtag[1]).value || undefined;
                        }).filter((p) => { return p ? true : false; }).length);
                    }).catch(reject);
                }).catch(reject);
            }
            else { resolve(0); }
        });
    }

    /**
     * Reset the sheet. A list of Discord usernames + # is returned on success.
     * @returns {Promise<string[]>}
     */
    async reset() {
        return new Promise((resolve, reject) => {
            const rounds = [ 'round1', 'round2', 'round3', 'round1_48', 'round2_48', 'round3_48' ];
            const groups = [ 'A', 'B', 'C', 'D', 'E', 'F' ];
            const games = [ 'game1', 'game2' ];

            Promise.all(
                rounds.map((round) => {
                    return new Promise((resolve, reject) => {
                        Promise.all(
                            groups.map((group) => {
                                return new Promise((resolve, reject) => {
                                    Promise.all(
                                        games.map((game) => { return this.resetResults(round, group, game); })
                                    ).then(resolve).catch(resolve);
                                });
                            })
                        ).then(resolve).catch(resolve);
                    });
                })
            ).then(() => {
                this.updateCheckIn(true)
                .then(resolve)
                .catch(reject);
            }).catch(reject);
        });
    }

    /**
     * Check if we have enough info on architecture to action a cell.
     * @param {"checkins"|"round1"|"round2"|"round3"|"round1_48"|"round2_48"|"round3_48"} round 
     * @param {"checked"|"nonchecked"|"A"|"B"|"C"|"D"|"E"|"F"} group 
     * @param {"first_discordtag"|"lobby_creator"|"first_gametag"|"first_game1"|"first_game2"} cell 
     * @returns {boolean}
     */
    verify(round, group, cell) {
        return this.architecture[round]
        && this.architecture[round][group]
        && this.architecture[round][group][cell]
        && typeof this.architecture[round][group][cell][0] === 'number'
        && typeof this.architecture[round][group][cell][1] === 'number'
        && typeof this.architecture[round][group].sheetId === 'string'
        && this.architecture[round][group].first_gametag
        && typeof this.architecture[round][group].first_gametag[0] === 'number'
        && typeof this.architecture[round][group].first_gametag[1] === 'number'
        ? true : false;
    }

    /**
     * Update list of checked-ins and non-checked-in.
     * @param {boolean} reset Whether or not you only want to reset and not fetch new results.
     * @returns {Promise<string[]>} Participant Discord IDs.
     */
    async updateCheckIn(reset) {
        return new Promise((resolve, reject) => {
            if (
                this.architecture.battlefy
                && typeof this.architecture.battlefy.sheetId === 'string'
                && this.architecture.battlefy.tournament_id
                && typeof this.architecture.battlefy.tournament_id[0] === 'number'
                && typeof this.architecture.battlefy.tournament_id[1] === 'number'
                && this.verify('checkins', 'checked', 'first_discordtag')
                && this.verify('checkins', 'nonchecked', 'first_discordtag')
            ) {
                this.spreadsheet.loadInfo().then(() => {
                    const checkedSheet = this.spreadsheet.sheetsById[this.architecture.checkins.checked.sheetId];
                    checkedSheet.loadCells().then(() => {
                        const participants = (new Array(48)).map((u, i) => {
                            return checkedSheet.getCell(this.architecture.checkins.checked.first_discordtag[0] + i, this.architecture.checkins.checked.first_discordtag[1]).value || undefined;
                        }).filter((p) => { return p ? true : false; });

                        const nonCheckedSheet = this.spreadsheet.sheetsById[this.architecture.checkins.nonchecked.sheetId];
                        nonCheckedSheet.loadCells().then(() => {
                            const update = async (type, values) => {
                                return new Promise((resolve, reject) => {
                                    for (let i = 0; i < 48; i++) {
                                        (type === 'checked' ? checkedSheet : nonCheckedSheet).getCell(this.architecture.checkins[type].first_gametag[0] + i, this.architecture.checkins[type].first_gametag[1]).value = values[i] ? values[i].gametag || '' : '';
                                        (type === 'checked' ? checkedSheet : nonCheckedSheet).getCell(this.architecture.checkins[type].first_discordtag[0] + i, this.architecture.checkins[type].first_discordtag[1]).value = values[i] ? values[i].discordtag || '' : '';
                                    }
        
                                    (type === 'checked' ? checkedSheet : nonCheckedSheet).saveUpdatedCells().then(resolve).catch(reject);
                                });
                            };

                            if (reset) {
                                Promise.all([
                                    update('checked', []),
                                    update('nonchecked', [])
                                ]).then(() => { resolve(participants); }).catch(reject);
                            }
                            else {
                                const battlefySheet = this.spreadsheet.sheetsById[this.architecture.battlefy.sheetId];
                                battlefySheet.loadCells().then(() => {

                                    Battlefy.getTournamentTeams(battlefySheet.getCell(this.architecture.battlefy.tournament_id[0], this.architecture.battlefy.tournament_id[1]).value).then(async (teams) => {
                                        const players = validate('array', teams).map((t) => {
                                            return {
                                                'gametag': t.players[0] ? t.players[0].inGameName : '',
                                                'discordtag': t.customFields[0] ? t.customFields[0].value : '',
                                                'checked': t.checkedInAt
                                            };
                                        });
    
                                        Promise.all([
                                            update('checked', players.filter((p) => { return p.checked ? true : false; }).sort((a, b) => { return new Date(a.checked) - new Date(b.checked); })),
                                            update('nonchecked', players.filter((p) => { return p.checked ? false : true; }))
                                        ]).then(() => { resolve(participants); }).catch(reject);
                                    }).catch(reject);
                                }).catch(reject);
                            }
                        }).catch(reject);
                    }).catch(reject);
                }).catch(reject);
            }
            else { reject('UNKNOWN_ERROR'); }
        });
    }

    /**
     * Fetch results from lobby creator.
     * @param {string} lobby_creator Lobby creator for the game to get results from.
     * @returns {Promise<Object.<string, number>>}
     */
    async getResults(lobby_creator) {
        return new Promise((resolve, reject) => {
            if (!lobby_creator) { reject('UNKNOWN_ERROR'); }
            else {
                this.TFT.Match.matchesByName(encodeURI(lobby_creator), 1).then((matchId) => {
                    if (matchId && matchId[0]) {
                        this.TFT.Match.matchesByMatchId(matchId[0]).then((matchData) => {
                            if (matchData.info.queue_id === 1090 && (new Date(matchData.info.game_datetime)).getTime() < Date.now() + 1800000) {
                                Promise.all(
                                    matchData.info.participants.map((p) => {
                                        return new Promise((resolve, reject) => {
                                            this.TFT.Summoner.summonerByPuuid(p.puuid)
                                            .then((s) => { resolve({ 'name': s.name, 'score': p.placement }); })
                                            .catch(reject);
                                        });
                                    })
                                ).then((results) => {
                                    resolve(results.reduce((obj, r) => (obj[r.name] = r.score, obj), {}));
                                }).catch(reject);
                            }
                            else { reject('UNKNOWN_ERROR'); }
                        }).catch(reject);
                    }
                    else { reject('UNKNOWN_ERROR'); }
                }).catch(reject);
            }
        });
    }

    /**
     * Update results for a certain game.
     * @param {"round1"|"round2"|"round3"|"round1_48"|"round2_48"|"round3_48"} round Round the game belongs to.
     * @param {"A"|"B"|"C"|"D"|"E"|"F"} group Group the game belongs to.
     * @param {"game1"|"game2"} game Game to update.
     * @param {boolean} reset Whether or not to reset the results.
     * @returns {Promise<>}
     */
    async updateResult(round, group, game, reset) {
        return new Promise((resolve, reject) => {
            if (![ 'round1', 'round2', 'round3', 'round1_48', 'round2_48', 'round3_48' ].includes(round) || ![ 'A', 'B', 'C', 'D', 'E', 'F' ].includes(group) || ![ 'game1', 'game2' ].includes(game)) { reject('UNKNOWN_ERROR'); }
            else if (this.verify(round, group, `first_${game}`)) {
                this.spreadsheet.loadInfo().then(() => {
                    const sheet = this.spreadsheet.sheetsById[this.architecture[round][group].sheetId];
                    sheet.loadCells().then(() => {
                        (new Promise((resolve, reject) => {
                            if (reset) { resolve({}); }
                            else { this.getResults(this.architecture[round][group].lobby_creator).then(resolve).catch(reject); }
                        })).then((results) => {
                            for (let i = 0; i < 8; i++) {
                                sheet.getCell(
                                    this.architecture[round][group][`first_${game}`][0] + i,
                                    this.architecture[round][group][`first_${game}`][1]
                                ).value = reset ? '' : results[sheet.getCell(
                                    this.architecture[round][group].first_gametag[0] + i,
                                    this.architecture[round][group].first_gametag[1]
                                ).value] || '';
                            }
    
                            sheet.saveUpdatedCells().then(resolve).catch(reject);
                        }).catch(reject);
                    }).catch(reject);
                }).catch(reject);
            }
            else { reject('UNKNOWN_ERROR'); }
        });
    }

    /**
     * Reset results for a certain game.
     * @param {"round1"|"round2"|"round3"|"round1_48"|"round2_48"|"round3_48"} round Round the game belongs to.
     * @param {"A"|"B"|"C"|"D"|"E"|"F"} group Group the game belongs to.
     * @param {"game1"|"game2"} game Game to reset.
     * @returns {Promise<>}
     */
    async resetResults(round, group, game) { return this.updateResult(round, group, game, true); }
}

module.exports = CooldownTournament;

/**
 * @typedef {{ A: group, B: group, C: group, D: group, E: group, F: group }} round Round
 * 
 * @typedef {Object} group Group
 * @property {string} group.sheetId
 * @property {cell} group.lobby_creator
 * @property {cell} group.first_gametag
 * @property {cell} group.first_game1
 * @property {cell} group.first_game2
 * 
 * @typedef {Object} check Check
 * @property {string} check.sheetId
 * @property {cell} check.first_gametag
 * @property {cell} check.first_discordtag
 * 
 * @typedef {[ number, number ]} cell A cell. First is line, second is column. A3 would be [ 2, 0 ] as count starts at 0.
 */