# cooldown-tournaments
A simple module for a small project. Allows you handle tournaments up to 48 participants from Battlefy to Google Spreadsheet on TFT.
 
# Credit
This module is an adaptation from [Floliroy/CooldownCupBot](https://github.com/Floliroy/CooldownCupBot) to fit our new sheet design and be able to modify the design later on if needed. Core functions are from [Floliroy](https://github.com/Floliroy).
 
# Installation
**Node.JS 14.0.0 or newer is required.**
```
npm install MushAsterion/cooldown-tournaments
```

# Initialization
```JavaScript
const CooldownTournament = require('cooldown-tournament');
const Tournament = new CooldownTournament({
    'google_account': {
        'client_email': '',
        'private_key': ''
    },
    'riot': {
        'region': '',
        'apikey': ''
    },
    'spreadsheet': {
        'id': '',
        'battlefy': {
            'sheetId': '',
            'tournament_id': [ 0, 0 ]
        },
        'checkins': {
            'checked': {
                'sheetId': '',
                'first_gametag': [ 0, 0 ],
                'first_discordtag': [ 0, 0 ]
            },
            'nonchecked': {
                'sheetId': '',
                'first_gametag': [ 0, 0 ],
                'first_discordtag': [ 0, 0 ]
            }
        },
        'round1': {
            'A': {
                'sheetId': '',
                'lobby_creator': [ 0, 0 ],
                'first_gametag': [ 0, 0 ],
                'first_game1': [ 0, 0 ],
                'first_game2': [ 0, 0 ]
            },
            'B': {
                'sheetId': '',
                'lobby_creator': [ 0, 0 ],
                'first_gametag': [ 0, 0 ],
                'first_game1': [ 0, 0 ],
                'first_game2': [ 0, 0 ]
            },
            'C': {
                'sheetId': '',
                'lobby_creator': [ 0, 0 ],
                'first_gametag': [ 0, 0 ],
                'first_game1': [ 0, 0 ],
                'first_game2': [ 0, 0 ]
            },
            'D': {
                'sheetId': '',
                'lobby_creator': [ 0, 0 ],
                'first_gametag': [ 0, 0 ],
                'first_game1': [ 0, 0 ],
                'first_game2': [ 0, 0 ]
            },
            'E': {
                'sheetId': '',
                'lobby_creator': [ 0, 0 ],
                'first_gametag': [ 0, 0 ],
                'first_game1': [ 0, 0 ],
                'first_game2': [ 0, 0 ]
            },
            'F': {
                'sheetId': '',
                'lobby_creator': [ 0, 0 ],
                'first_gametag': [ 0, 0 ],
                'first_game1': [ 0, 0 ],
                'first_game2': [ 0, 0 ]
            }
        },
        'round1_48': {
            'A': {
                'sheetId': '',
                'lobby_creator': [ 0, 0 ],
                'first_gametag': [ 0, 0 ],
                'first_game1': [ 0, 0 ],
                'first_game2': [ 0, 0 ]
            },
            'B': {
                'sheetId': '',
                'lobby_creator': [ 0, 0 ],
                'first_gametag': [ 0, 0 ],
                'first_game1': [ 0, 0 ],
                'first_game2': [ 0, 0 ]
            },
            'C': {
                'sheetId': '',
                'lobby_creator': [ 0, 0 ],
                'first_gametag': [ 0, 0 ],
                'first_game1': [ 0, 0 ],
                'first_game2': [ 0, 0 ]
            },
            'D': {
                'sheetId': '',
                'lobby_creator': [ 0, 0 ],
                'first_gametag': [ 0, 0 ],
                'first_game1': [ 0, 0 ],
                'first_game2': [ 0, 0 ]
            },
            'E': {
                'sheetId': '',
                'lobby_creator': [ 0, 0 ],
                'first_gametag': [ 0, 0 ],
                'first_game1': [ 0, 0 ],
                'first_game2': [ 0, 0 ]
            },
            'F': {
                'sheetId': '',
                'lobby_creator': [ 0, 0 ],
                'first_gametag': [ 0, 0 ],
                'first_game1': [ 0, 0 ],
                'first_game2': [ 0, 0 ]
            }
        },
        'round2': {
            'A': {
                'sheetId': '',
                'lobby_creator': [ 0, 0 ],
                'first_gametag': [ 0, 0 ],
                'first_game1': [ 0, 0 ],
                'first_game2': [ 0, 0 ]
            },
            'B': {
                'sheetId': '',
                'lobby_creator': [ 0, 0 ],
                'first_gametag': [ 0, 0 ],
                'first_game1': [ 0, 0 ],
                'first_game2': [ 0, 0 ]
            }
        },
        'round2_48': {
            'A': {
                'sheetId': '',
                'lobby_creator': [ 0, 0 ],
                'first_gametag': [ 0, 0 ],
                'first_game1': [ 0, 0 ],
                'first_game2': [ 0, 0 ]
            },
            'B': {
                'sheetId': '',
                'lobby_creator': [ 0, 0 ],
                'first_gametag': [ 0, 0 ],
                'first_game1': [ 0, 0 ],
                'first_game2': [ 0, 0 ]
            },
            'C': {
                'sheetId': '',
                'lobby_creator': [ 0, 0 ],
                'first_gametag': [ 0, 0 ],
                'first_game1': [ 0, 0 ],
                'first_game2': [ 0, 0 ]
            }
        },
        'round3': {
            'A': {
                'sheetId': '',
                'lobby_creator': [ 0, 0 ],
                'first_gametag': [ 0, 0 ],
                'first_game1': [ 0, 0 ]
            }
        },
        'round3_48': {
            'A': {
                'sheetId': '',
                'lobby_creator': [ 0, 0 ],
                'first_gametag': [ 0, 0 ],
                'first_game1': [ 0, 0 ]
            }
        }
    }
});
```
 
Regarding rounds feel free to fill only the ones you need to use.
 
# Usage
### Properties
* `architecture` Saved version of the spritesheet options entered when initialized.
* `TFT` TFT module used (from module [riotgames-gg](https://www.npmjs.com/package/riotgames-gg))

### Methods
```JavaScript
// Reset the sheet. A list of Discord usernames + # is returned on success.
Tournament.reset().then(console.log).catch(console.error);

// Check if we have enough info on architecture to action a cell.
Tournament.verify(ROUND, GROUP, GAME);

// Update list of checked-ins and non-checked-in.
Tournament.updateCheckIn(RESET).then(console.log).catch(console.error);

// Fetch results from lobby creator using TFT API.
Tournament.getResults(LOBBY_CREATOR).then(console.log).catch(console.error);

// Update results for a certain game.
Tournament.updateResults(ROUND, GROUP, GAME, RESET).then(console.log).catch(console.error);

// Reset results for a certain game.
Tournament.resetResults(ROUND, GROUP, GAME).then(console.log).catch(console.error);
```
