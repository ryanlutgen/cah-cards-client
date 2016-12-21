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
let mainSetCards = mainSet.parse(sheets[0]).cards;
let expansionsCards = expansions.parse(sheets[1]).cards;
let packsCards = packs.parse(sheets[2]).cards;
let thirdPartyCommercialCards = thirdPartyCommercial.parse(sheets[3]).cards;

cards.push(mainSetCards);
cards.push(expansionsCards);
cards.push(packsCards);
cards.push(thirdPartyCommercialCards);

_.each(cards, (cardSet) => {
    console.log(cardSet.length);
});


//mainSet.parse(sheets[0]).cards
//expansions.parse(sheets[1]).cards
//packs.parse(sheets[2]).cards
//thirdPartyCommercial.parse(sheets[3]).cards


fs.writeFileSync('./output/cah_main.json', JSON.stringify(mainSetCards, null, 4));
fs.writeFileSync('./output/cah_expansions.json', JSON.stringify(expansionsCards, null, 4));
fs.writeFileSync('./output/cah_packs.json', JSON.stringify(packsCards, null, 4));
fs.writeFileSync('./output/third_party_commerical.json', JSON.stringify(thirdPartyCommercialCards, null, 4));