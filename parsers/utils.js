"use strict";

let _ = require('lodash');

module.exports = {
    mergeArrays: function(arrayOne, arrayTwo) {
        return arrayOne.concat(arrayTwo);
    },
    stripNewlineChars: function(value) {
        return value.replace(/\n/g, "");
    },
    formatListForElasticsearch: function(cards){
        let masterObj = {};

        _.each(cards, (card) => {
            if (masterObj[card.card_set] === undefined) {
                masterObj[card.card_set] = [];
            }

            masterObj[card.card_set].push(card);
        });

        return masterObj;
    }
};