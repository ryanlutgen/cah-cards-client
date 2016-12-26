"use strict";

let fs = require('fs');
let xlsx = require('node-xlsx');
let _ = require('lodash');
let mkdirp = require('mkdirp');
let path = require('path');

let mainSet = require('./parsers/main-set');
let expansions = require('./parsers/expansions');
let packs = require('./parsers/packs');
let thirdPartyCommercial = require('./parsers/third-party-commercial');

let util = require('./parsers/utils');
let esclient = require('./esClient');
var argv = require('minimist')(process.argv.slice(2));


const worksheet = xlsx.parse(`${__dirname}/data/cah-cards.xlsx`);

var sheetsToScan = ["CAH Main Deck", "CAH Expansions", "CAH Packs", "Third Party Commercial", "Kickstarter", "Stand Alone Games", "Print On Demand",
    "Special Purpose", "Fan Expansions", "Custom - White", "Custom - Black", "More Custom Cards"];

let sheets = [];
_.each(worksheet, (sheet) => {
    var index = _.findIndex(sheetsToScan, (sheetScanned) => { return sheetScanned === sheet.name; });
    if (index !== -1) {
        sheets.push(sheet);
    }
});

let cardsMasterList = [];
// let cardsBySheet = [];


cardsMasterList = util.mergeArrays(cardsMasterList, mainSet.parse(sheets[0]).cards);                    //main set
cardsMasterList = util.mergeArrays(cardsMasterList, expansions.parse(sheets[1]).cards);                 //official xpacks
cardsMasterList = util.mergeArrays(cardsMasterList, packs.parse(sheets[2]).cards);                      //official packs
cardsMasterList = util.mergeArrays(cardsMasterList, thirdPartyCommercial.parse(sheets[3]).cards);       //third party commercial
cardsMasterList = util.mergeArrays(cardsMasterList, thirdPartyCommercial.parse(sheets[4]).cards);       //kickstarter
cardsMasterList = util.mergeArrays(cardsMasterList, thirdPartyCommercial.parse(sheets[5]).cards);       //stand alone games
cardsMasterList = util.mergeArrays(cardsMasterList, thirdPartyCommercial.parse(sheets[6]).cards);       //print on demand
cardsMasterList = util.mergeArrays(cardsMasterList, thirdPartyCommercial.parse(sheets[7]).cards);       //special purpose
cardsMasterList = util.mergeArrays(cardsMasterList, thirdPartyCommercial.parse(sheets[7]).cards);       //fan expansions

// cardsBySheet.push(mainSetCards);
// cardsBySheet.push(expansionsCards);
// cardsBySheet.push(packsCards);
// cardsBySheet.push(thirdPartyCommercialCards);

let cardsNestedBySet = util.nestCardsBySet(cardsMasterList);

mkdirp.sync(path.resolve('./output'));
mkdirp.sync(path.resolve('./output/sets'));

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
    console.log(`${setName} length: ${cardSet.length} | Black cards: ${numOfPrompt}, White cards: ${numOfResponse}`);

    let cardInfo = [];
    cardInfo.push({name: setName, length: cardSet.length, prompts: numOfPrompt, responses: numOfResponse});
    cardInfo.push(cardSet);
    fs.writeFileSync(`./output/sets/${setName.replace(/:/g, "").replace(/\//g, "")}.json`, JSON.stringify(cardInfo, null, 4));
});

util.validateSetLengths(cardsNestedBySet);

console.log(`total cards: ${cardsMasterList.length}`);
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

//console.log(argv);
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
fs.writeFileSync('./output/es_data_view.json', JSON.stringify(cardsNestedBySet, null, 4));
fs.writeFileSync('./output/duplicate_cards.json', JSON.stringify(duplicates, null, 4));