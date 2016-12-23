"use strict";

let fs = require('fs');
let xlsx = require('node-xlsx');
let _ = require('lodash');
let mainSet = require('./parsers/main-set');
let expansions = require('./parsers/expansions');
let packs = require('./parsers/packs');
let thirdPartyCommercial = require('./parsers/third-party-commercial');
let util = require('./parsers/utils');
let esclient = require('./esClient');
var argv = require('minimist')(process.argv.slice(2));


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

let cardsMasterList = [];
// let cardsBySheet = [];


//keep cards in seperate arrays for now to debug
let mainSetCards = mainSet.parse(sheets[0]).cards;
let expansionsCards = expansions.parse(sheets[1]).cards;
let packsCards = packs.parse(sheets[2]).cards;
let thirdPartyCommercialCards = thirdPartyCommercial.parse(sheets[3]).cards;

cardsMasterList = util.mergeArrays(cardsMasterList, mainSetCards);
cardsMasterList = util.mergeArrays(cardsMasterList, expansionsCards);
cardsMasterList = util.mergeArrays(cardsMasterList, packsCards);
cardsMasterList = util.mergeArrays(cardsMasterList, thirdPartyCommercialCards);

// cardsBySheet.push(mainSetCards);
// cardsBySheet.push(expansionsCards);
// cardsBySheet.push(packsCards);
// cardsBySheet.push(thirdPartyCommercialCards);

let cardsNestedBySet = util.nestCardsBySet(cardsMasterList);

_.each(cardsNestedBySet, (cardSet, setName) => {
    let numOfPrompt = 0, numOfResponse = 0;
    _.each(cardSet, (card) => {
        if (card.card_type === "Prompt") {
            numOfPrompt++;
        }
        else {
            numOfResponse++;
        }
    });
    //console.log(`${setName} length: ${cardSet.length} | Black cards: ${numOfPrompt}, White cards: ${numOfResponse}`);
});

console.log(cardsMasterList.length);
let masterListSortedByText = _.sortBy(cardsMasterList, [(card) => { return card.card_name; }]);
let duplicates = [];
_.each(masterListSortedByText, (card) => {
    _.each(masterListSortedByText, (card2) => {
        if (card.card_name === card2.card_name && card.card_set !== card2.card_set) {
            duplicates.push(card);
            duplicates.push(card2);
        }
    });
});

duplicates = _.uniq(duplicates);

console.log(argv);
if (argv.insertToElasticsearch === 'true') {
    esclient.initIndex(function() {
        setTimeout(function() {
            let currentTime = 0;
            let increment = 1000;
            // esclient.insertIntoElasticsearch(util.formatESTypeFromSetName(mainSetCards[0].card_set), mainSetCards);
            _.each(cardsNestedBySet, (cardSet) => {
                setTimeout(function() {
                    if (cardSet.length > 0) {
                        esclient.insertIntoElasticsearch(util.formatESTypeFromSetName(cardSet[0].card_set), cardSet);
                    }
                }, currentTime);
                currentTime += increment;
            });
        }, 1000);
    });
}

fs.writeFileSync('./output/cah_main.json', JSON.stringify(mainSetCards, null, 4));
fs.writeFileSync('./output/cah_expansions.json', JSON.stringify(expansionsCards, null, 4));
fs.writeFileSync('./output/cah_packs.json', JSON.stringify(packsCards, null, 4));
fs.writeFileSync('./output/third_party_commerical.json', JSON.stringify(thirdPartyCommercialCards, null, 4));
fs.writeFileSync('./output/es_data_view.json', JSON.stringify(cardsNestedBySet, null, 4));
fs.writeFileSync('./output/duplicate_cards.json', JSON.stringify(duplicates, null, 4));