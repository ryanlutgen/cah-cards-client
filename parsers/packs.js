"use strict";

let _ = require('lodash');

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
            if (rowIndex !== 0 && itemIndex !== 0 && item !== undefined) {
                //if cell has the name "pack", and row above it is empty
                //also check that the cell to its left does not have a card type, to ensure we don't falsely flag cards that have the word "pack" in them
                if ((item.indexOf("Pack") !== -1 || item.indexOf("PAX Prime") !== -1 || item.indexOf("PAX East") !== -1) && sheet.data[rowIndex - 1].length === 0 &&
                    itemArray[itemIndex - 1] !== "Response" && itemArray[itemIndex - 1] !== "Prompt") {
                    //console.log("x: " + (rowIndex + 2) + ", y = " + (itemIndex + 1) + " name: " + item);
                    let cahSet = _.clone(coordTemplate);
                    cahSet["x"] = rowIndex;
                    cahSet["y"] = itemIndex;
                    cahSet["name"] = item;
                    coords.push(cahSet);
                }
            }
        });
    });

    return coords;
}

module.exports = {
    parse: function(sheet) {
        let cards = [];
        let coords = findSetNamesAndCoords(sheet);

        //Since the sets on the CAH Packs sheet are formatted randomly on a grid, we get the coordinates of the set names,
        //then move downward lifting the card data until rows below it are undefined
        _.each(coords, (coord) => {
            let x = coord["x"], y = coord["y"], name = coord["name"];
            let cardTypeCoordY =  y - 1;
            let cardSet = [];

            //checks blank rows.  As soon as we pass the set row, the desc row, a blank row, and another black row after
            //cards, break out of the loop
            let numOfUndefinedRows = 0;

            for (let i = x; i < sheet.data.length; i++) {
                let row = sheet.data[i];

                let cardType = row[cardTypeCoordY];
                if (cardType === undefined) {
                    numOfUndefinedRows++;
                }
                else if (cardType === "Prompt" || cardType === "Response") {
                    let card = _.clone(CARD_TEMPLATE);
                    card.card_type = cardType;
                    card.card_name = row[cardTypeCoordY + HEADERS["card_name"]];
                    card.card_special = row[cardTypeCoordY + HEADERS["card_special"]];
                    card.card_set = coord["name"];
                    cardSet.push(card);
                }

                if (numOfUndefinedRows === 4) {
                    break;
                }
            }

            cards.push(cardSet);
        });

        return {"set": sheet.name, "cards": cards};
    }
};