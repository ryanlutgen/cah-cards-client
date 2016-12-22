"use strict";

let _ = require('lodash');

module.exports = {
    mergeArrays: function(arrayOne, arrayTwo) {
        return arrayOne.concat(arrayTwo);
    },
    stripNewlineChars: function(value) {
        return value.replace(/\n/g, "");
    },
    nestCardsBySet: function(cards){
        let masterObj = {};

        _.each(cards, (card) => {
            if (masterObj[card.card_set] === undefined) {
                masterObj[card.card_set] = [];
            }

            masterObj[card.card_set].push(card);
        });

        return masterObj;
    },
    formatESTypeFromSetName: function(setName) {
        return setName.replace(/-/g, "").replace(/,/g, "").replace(/\s+/g, "-").replace(/:/g, "").toLowerCase();
    }
};