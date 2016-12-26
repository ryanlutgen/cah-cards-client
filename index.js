"use strict";

let fs = require('fs');
let xlsx = require('node-xlsx');
let _ = require('lodash');
let mkdirp = require('mkdirp');
let path = require('path');
let log4js = require('log4js');

let mainSet = require('./parsers/main-set');
let expansions = require('./parsers/expansions');
let packs = require('./parsers/packs');
let thirdPartyCommercial = require('./parsers/third-party-commercial');

let util = require('./parsers/utils');
let esclient = require('./esClient');
var argv = require('minimist')(process.argv.slice(2));

util.deleteFolderRecursive(path.resolve('./output'));
mkdirp.sync(path.resolve('./output'));
mkdirp.sync(path.resolve('./output/sets'));
//dealing with large arrays, we run the risk of running out of JS heap.  Store anything we don't need at the given time in files
//mkdirp.sync(path.resolve('./temp'));

log4js.configure({
    appenders: [
        { type: 'console' },
        { type: 'file', filename: 'output/logs.log', category: 'logs' }
    ]
});
let logger = log4js.getLogger('logs');
logger.setLevel(argv.logLevel.toUpperCase() || 'DEBUG');

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

let masterList = [];


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SCANNING
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
masterList = util.mergeArrays(masterList, mainSet.parse(sheets[0]));                    //main set
masterList = util.mergeArrays(masterList, expansions.parse(sheets[1]));                 //official xpacks
masterList = util.mergeArrays(masterList, packs.parse(sheets[2]));                      //official packs
masterList = util.mergeArrays(masterList, thirdPartyCommercial.parse(sheets[3]));       //third party commercial
masterList = util.mergeArrays(masterList, thirdPartyCommercial.parse(sheets[4]));       //kickstarter
masterList = util.mergeArrays(masterList, thirdPartyCommercial.parse(sheets[5]));       //stand alone games
masterList = util.mergeArrays(masterList, thirdPartyCommercial.parse(sheets[6]));       //print on demand
masterList = util.mergeArrays(masterList, thirdPartyCommercial.parse(sheets[7]));       //special purpose
masterList = util.mergeArrays(masterList, thirdPartyCommercial.parse(sheets[8]));       //fan expansions

//fs.writeFileSync('./temp/card-master-list.json', JSON.stringify(masterList));

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// NEST BY SET
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

logSetLengths();
function logSetLengths() {
    logger.debug("Logging set lengths...");
    let cardsNestedBySet = util.nestCardsBySet(masterList);

    _.each(masterList, (sheet) => {
        mkdirp.sync(path.resolve(`./output/sets/${sheet.set}`));
    });

    //given a set name, finds the sheet name from the master list.  This is used to nest output for easier reading
    let findSheetNameFromSet = function(setName) {
        let sheetName = "";
        _.each(masterList, (sheet) => {
            _.each(sheet.cards, (card) => {
                if (card["card_set"] === setName) {
                    sheetName = sheet.set;
                }
            })
        });
        return sheetName;
    };

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
        logger.info(`${setName} length: ${cardSet.length} | Black cards: ${numOfPrompt}, White cards: ${numOfResponse}`);

        let cardInfo = [];
        cardInfo.push({name: setName, length: cardSet.length, prompts: numOfPrompt, responses: numOfResponse});
        cardInfo.push(cardSet);
        fs.writeFileSync(`./output/sets/${findSheetNameFromSet(setName)}/${setName.replace(/:/g, "").replace(/\//g, "")}.json`, JSON.stringify(cardInfo, null, 4));
    });

    util.validateSetLengths(cardsNestedBySet);
    fs.writeFileSync(`./output/es_data_view.json`, JSON.stringify(cardsNestedBySet, null, 4));
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DETECT DUPLICATES
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
logger.debug("Detecting duplicates...");
detectDuplicates();
function detectDuplicates() {
    let duplicates = [];

    //need to rip out cards from master list
    let cardsMasterListCards = [];
    _.each(masterList, (sheet) => {
        cardsMasterListCards = util.mergeArrays(cardsMasterListCards, sheet.cards);
    });

    /**
     * Checks if a card with supplied text and set is in duplicates array.
     * No clean way to do this in lodash that actually works...
     * @param card
     * @returns {boolean}
     */
    let cardInDuplicates = function(card) {
        let present = false;
        _.each(duplicates, (duplicateCard) => {
            if (card["card_text"] === duplicateCard["card_text"] && card["card_set"] === duplicateCard["card_set"]) {
                present = true;
            }
        });
        return present;
    };

    /**
     * Checks adjacent card and adds it to duplicates array if needed
     * @param adjacentIndex
     * @param currentCard
     * @param cardArray
     */
    let checkAdjacentCard = function(adjacentIndex, currentCard, cardArray) {
        let adjacentCard = cardArray[adjacentIndex];

        if (adjacentCard["card_text"] === currentCard["card_text"]) {
            let trimmedCard = {"card_type": adjacentCard["card_type"], "card_text": adjacentCard["card_text"], "card_set": adjacentCard["card_set"]};
            let trimmedCard2 = {"card_type": currentCard["card_type"], "card_text": currentCard["card_text"], "card_set": currentCard["card_set"]};
            if (!cardInDuplicates(trimmedCard)) {
                duplicates.push(trimmedCard);
            }
            if (!cardInDuplicates(trimmedCard2)) {
                duplicates.push(trimmedCard2);
            }
        }
    };

    //sort the cards by card_text, then iterate through them and if adjacent cards have the same card text, add them to the
    //duplicates array if they are not already there.  Initially this was done with 2 deep _.eachs, but that caused JS heap issues
    //this method is also faster, because nested _.each is O(n)^2, and for the current size of the card collection (~13000), that sucks
    let sorted = _.sortBy(cardsMasterListCards, [(card) => { return card["card_text"]; }]);
    _.each(sorted, (card, index, list) => {
        let checkPrev = false, checkNext = false;

        //check both adjacent cards if not at start or end of cards list
        if (index !== 0 && index !== list.length - 1) {
            checkNext = checkPrev = true;
        }
        else if (index !== 0) {
            checkPrev = true;
        }
        else {
            checkNext = true;
        }

        if (checkPrev) {
            checkAdjacentCard(index - 1, card, list);
        }
        if (checkNext) {
            checkAdjacentCard(index + 1, card, list);
        }
    });

    fs.writeFileSync('./output/duplicate_cards.json', JSON.stringify(duplicates, null, 4));
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Elasticsearch
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
insertIntoElasticsearch();
function insertIntoElasticsearch() {
//console.log(argv);
    if (argv.insertToElasticsearch === 'true') {
        esclient.initIndex(function () {
            setTimeout(function () {
                let currentTime = 0;
                let increment = 1000;
                // esclient.insertIntoElasticsearch(util.formatESTypeFromSetName(mainSetCards[0].card_set), mainSetCards);
                _.each(cardsNestedBySet, (cardSet) => {
                    setTimeout(function () {
                        if (cardSet.length > 0) {
                            esclient.insertIntoElasticsearch(util.formatESTypeFromSetName(cardSet[0].card_set), cardSet);
                        }
                    }, currentTime);
                    currentTime += increment;
                });
            }, 1000);
        });
    }
}

util.deleteFolderRecursive(path.resolve('./temp'));