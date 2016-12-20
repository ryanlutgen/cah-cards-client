"use strict";

let fs = require('fs');
let xlsx = require('node-xlsx');
let _ = require('lodash');
let mainSet = require('./parsers/main-set');
let expansions = require('./parsers/expansions');
let packs = require('./parsers/packs');
let thirdPartyCommercial = require('./parsers/third-party-commercial');

const worksheet = xlsx.parse(`${__dirname}/data/cah-cards.xlsx`);

var sheetsToScan = ["CAH Main Deck", "CAH Expansions", "CAH Packs", "Third Party Commercial", "Kickstarter", "Stand Alone Games", "Print On Demand",
    "Special Purpose", "Fan Expansions", "Misc. Unofficial Decks - Black", "Misc. Unofficial Decks - White", "Custom - White", "Custom - Black", "More Custom Cards"];

let sheets = [];
_.each(worksheet, (sheet) => {
    var index = _.findIndex(sheetsToScan, (sheetScanned) => { return sheetScanned === sheet.name; });
    if (index !== -1) {
        sheets.push(sheet);
    }
});

let cards = [];
//keep cards in seperate arrays for now to debug
cards.push(mainSet.parse(sheets[0]).cards);
cards.push(expansions.parse(sheets[1]).cards);
cards.push(packs.parse(sheets[2]).cards);
cards.push(thirdPartyCommercial.parse(sheets[3]).cards);


fs.writeFileSync('./output/test.json', JSON.stringify(cards, null, 4));