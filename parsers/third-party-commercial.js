"use strict";

let _ = require('lodash');
let util = require('./utils');

const HEADERS = {
    "card_type": 0,
    "card_name": 1,
    "special": 2
};

const CARD_TEMPLATE = {
    "card_type": "",
    "card_name": "",
    "card_special": "",
    "card_set": ""
};

/**
 * returns an object of coordinate locations and names of each pack
 * @param sheet
 * @returns {{}}
 */
function findSetNamesAndCoords(sheet) {
    let coordTemplate = {"x": 0, "y": 0, "name": ""};
    let coords = [];

    _.each(sheet.data, (row, rowIndex) => {
        _.each(row, (item, itemIndex, itemArray) => {
            if (itemIndex !== 0 && item !== undefined) {
                if (itemArray[itemIndex - 1] === "Set" && itemArray[itemIndex + 1] === "Special") {
                    //console.log("x: " + (rowIndex + 2) + ", y = " + (itemIndex + 1) + " name: " + item);
                    let cahSet = _.clone(coordTemplate);
                    cahSet["x"] = rowIndex;
                    cahSet["y"] = itemIndex;
                    cahSet["name"] = util.formatSetName(util.stripNewlineChars(item));
                    coords.push(cahSet);
                }
            }
        });
    });

    return coords;
}

function findLastCardSetX(coord, sheet, name) {
    let y = coord.y - 1;

    let firstResponseX = 0;
    let lastResponseX = 0;
    for (let i = coord.x + 1; i < sheet.data.length; i++) {
        let row = sheet.data[i];

        //if there are no cards listed for this set, and we got to the one below it.
        if (row[y] === 'Set') {
            console.log(`${name}: No cards listed for set, iteration has reached the next set listed vertically, aborting`);
            break;
        }

        if (row[y] === 'Response' && firstResponseX === 0) {
            firstResponseX = i;
        }

        if (row[y] === undefined && firstResponseX !== 0) {
            lastResponseX = i - 1;
            break;
        }

        if (i === sheet.data.length - 1) {
            console.log(`${name}: Reached the end of scanning response cards, nothing found`);
        }
    }

    if (lastResponseX === 0) {
        console.log(`${name}: Set is not registering any response cards, assuming it is all prompts`);
        for (let i = coord.x + 1; i < sheet.data.length; i++) {
            let row = sheet.data[i];

            //if there are no cards listed for this set, and we got to the one below it.
            if (row[y] === 'Set') {
                console.log(`${name}: No cards listed for set, iteration has reached the next set listed vertically, aborting`);
                break;
            }

            if (row[y] === 'Prompt' && firstResponseX === 0) {
                firstResponseX = i;
            }

            if (row[y] === undefined && firstResponseX !== 0) {
                lastResponseX = i - 1;
                break;
            }

            if (i === sheet.data.length - 1) {
                console.log(`${name}: Reached the end of scanning prompt cards, nothing found`);
            }
        }
    }

    return {"x": lastResponseX, "y": y}
}

module.exports = {
    parse: function(sheet) {
        let cards = [];
        let coords = findSetNamesAndCoords(sheet);

        //similar to official packs, latch onto the set name, then find the last response row.  Iterate from
        //the set name to the last response row
        _.each(coords, (coord) => {
            let x = coord["x"], y = coord["y"], name = coord["name"];
            let cardTypeCoordY =  y - 1;
            let cardSet = [];
            let lastResponseCoord = findLastCardSetX(coord, sheet, name);

            for (let i = x; i <= lastResponseCoord.x; i++) {
                let row = sheet.data[i];

                let cardType = row[cardTypeCoordY];
                if (cardType === "Prompt" || cardType === "Response") {
                    let card = _.clone(CARD_TEMPLATE);
                    card.card_type = cardType;
                    card.card_name = row[cardTypeCoordY + HEADERS["card_name"]];
                    card.card_special = row[cardTypeCoordY + HEADERS["card_special"]];
                    card.card_set = coord["name"];
                    cardSet.push(card);
                }
            }

            cards = util.mergeArrays(cards, cardSet);
        });

        return {"set": sheet.name, "cards": cards};
    }
};