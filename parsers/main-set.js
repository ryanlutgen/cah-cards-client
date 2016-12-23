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
    "1.6UK": 9,
    "1.6": 10
};

const CARD_TEMPLATE = {
    "card_type": "",
    "card_name": "",
    "card_special": "",
    "card_set": "",
    "card_in_1_0": false,
    "card_in_1_1": false,
    "card_in_1_2": false,
    "card_in_1_3": false,
    "card_in_1_4": false,
    "card_in_1_5": false,
    "card_in_1_6": false
};

module.exports = {
    parse: function(sheet) {
        let cards = [];
        let setName = "";

        _.each(sheet.data, (row) => {
            if (row[0] === "Set") {
                setName = row[1];
            }

            if (row[0] === "Prompt" || row[0] === "Response") {
                let card = _.clone(CARD_TEMPLATE);

                card.card_type = row[HEADERS.card_type];
                card.card_name = row[HEADERS.card_name];
                card.card_special = row[HEADERS.special];
                card.card_set = setName;
                card["card_in_1_0"] = row[HEADERS["1.0"]] !== undefined;
                card["card_in_1_1"] = row[HEADERS["1.1"]] !== undefined;
                card["card_in_1_2"] = row[HEADERS["1.2"]] !== undefined;
                card["card_in_1_3"] = row[HEADERS["1.3"]] !== undefined;
                card["card_in_1_4"] = row[HEADERS["1.4"]] !== undefined;
                card["card_in_1_5"] = row[HEADERS["1.5"]] !== undefined;
                card["card_in_1_6"] = row[HEADERS["1.6"]] !== undefined;

                cards.push(card);
            }
        });

        return {"set": sheet.name, "cards": cards};
    }
};