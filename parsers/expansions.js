"use strict";

let _ = require('lodash');

const HEADERS = {
    "card_type": 0,
    "card_name": 1,
    "special": 2,
    "1.0": 3,
    "1.1": 4,
    "1.2": 5,
    "1.3": 6,
    "1.4": 7,
    "1.5": 8,
    "1.6": 10
};

const CARD_TEMPLATE = {
    "card_type": "",
    "card_name": "",
    "card_special": "",
    "card_set": "",
    "card_in_1.0": false,
    "card_in_1.1": false,
    "card_in_1.2": false,
    "card_in_1.3": false,
    "card_in_1.4": false,
    "card_in_1.5": false,
    "card_in_1.6": false
};

/**
 * Returns an array, representing version numbers.  True = card has the cooresponding version number
 * @param atLeastOneVersionArray
 * @param row
 * @returns {*}
 */
function checkVersions(atLeastOneVersionArray, row) {
    _.each(atLeastOneVersionArray, (version, index, array) => {
        if (!atLeastOneVersionArray[index] && row[HEADERS["1." + index]] !== undefined) {
            atLeastOneVersionArray[index] = true;
        }
    });

    return atLeastOneVersionArray;
}

function checkCardSetVersions(cardSet, atLeastOneVersion) {
    _.each(cardSet, (card, index) => {
        _.each(atLeastOneVersion, (version, indexVersion) => {
            if (!version) {
                delete card["card_in_1." + indexVersion];
            }
        });
    });

    return cardSet;
}

module.exports = {
    parse: function(sheet) {
        let cards = [];
        let setName = "";
        let expansionNum = 0;

        //check if at least one card has a version
        let atLeastOneVersion = [];
        let cardSet = [];

        let resetValues = function() {
            atLeastOneVersion = [false, false, false, false, false, false, false];
            cardSet = [];
        };

        resetValues();

        _.each(sheet.data, (row) => {

            if (row[0] === "Set") {
                if (cards.length === 0) {
                    cards = checkCardSetVersions(cardSet, atLeastOneVersion)
                }
                else {
                    cards.push(checkCardSetVersions(cardSet, atLeastOneVersion));
                }

                expansionNum++;
                resetValues();
                setName = row[1];
            }

            if (row[0] === "Prompt" || row[0] === "Response") {
                let card = _.clone(CARD_TEMPLATE);

                card.card_type = row[HEADERS.card_type];
                card.card_name = row[HEADERS.card_name];
                card.card_special = row[HEADERS.special];
                card.card_set = setName;
                card["card_in_1.0"] = row[HEADERS["1.0"]] !== undefined;
                card["card_in_1.1"] = row[HEADERS["1.1"]] !== undefined;
                card["card_in_1.2"] = row[HEADERS["1.2"]] !== undefined;
                card["card_in_1.3"] = row[HEADERS["1.3"]] !== undefined;
                card["card_in_1.4"] = row[HEADERS["1.4"]] !== undefined;
                card["card_in_1.5"] = row[HEADERS["1.5"]] !== undefined;
                card["card_in_1.6"] = row[HEADERS["1.6"]] !== undefined;

                cardSet.push(card);

                atLeastOneVersion = checkVersions(atLeastOneVersion, row);
            }
        });

        cards.push(checkCardSetVersions(cardSet, atLeastOneVersion));

        return {"set": sheet.name, "cards": cards};
    }
};