"use strict";

let _ = require('lodash');
let fs = require('fs');

module.exports = {
    mergeArrays: function(arrayOne, arrayTwo) {
        return arrayOne.concat(arrayTwo);
    },
    stripNewlineChars: function(value) {
        return value.replace(/\n/g, "");
    },
    nestCardsBySet: function(cardSheets){
        let masterObj = {};

        //_.each(cards, (card) => {
        //    if (masterObj[card.card_set] === undefined) {
        //        masterObj[card.card_set] = [];
        //    }
        //
        //    masterObj[card.card_set].push(card);
        //});

        _.each(cardSheets, (cardSheet) => {
            _.each(cardSheet.cards, (card) => {
                if (masterObj[card.card_set] === undefined) {
                    masterObj[card.card_set] = [];
                }

                masterObj[card.card_set].push(card);
            });
        });

        return masterObj;
    },
    formatESTypeFromSetName: function(setName) {
        return setName.replace(/-/g, "").replace(/,/g, "").replace(/\s+/g, "-").replace(/:/g, "").toLowerCase();
    },
    validateSetLengths: function(cardsNestedBySet) {
        let setsLengthObj = require('./../set-lengths.json');
        _.each(cardsNestedBySet, (cardSet, setName) => {
            let setSpecLength = setsLengthObj[setName];
            if (setSpecLength !== undefined && cardSet.length !== setSpecLength) {
                console.error(`${setName} length does not match specification!`);
                throw 'Error!';
            }
        })
    },
    //Some sets in the spreadsheet have a space before their name.  Instead of having to edit the sheet on every update, just filter through this
    formatSetName: function(setName) {
        if (setName[0] === ' ') {
            setName = setName.substr(1, setName.length);
        }

        return setName
    },
    deleteFolderRecursive: function(filePath) {
        if(fs.existsSync(filePath)) {
            fs.readdirSync(filePath).forEach((file, index) => {
                let curPath = filePath + "/" + file;

                if(fs.lstatSync(curPath).isDirectory()) {
                    this.deleteFolderRecursive(curPath);
                }
                else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(filePath);
        }
    },
    readGiantJSON: function(filePath) {
        var stream = fs.createReadStream(filePath, {flags: 'r', encoding: 'utf-8'});
        var buf = '';

        stream.on('data', function(d) {
            buf += d.toString(); // when data is read, stash it in a string buffer
            pump(); // then process the buffer
        });

        function pump() {
            var pos;

            while ((pos = buf.indexOf('\n')) >= 0) { // keep going while there's a newline somewhere in the buffer
                if (pos == 0) { // if there's more than one newline in a row, the buffer will now start with a newline
                    buf = buf.slice(1); // discard it
                    continue; // so that the next iteration will start with data
                }
                processLine(buf.slice(0,pos)); // hand off the line
                buf = buf.slice(pos+1); // and slice the processed data off the buffer
            }
        }

        function processLine(line) { // here's where we do something with a line

            if (line[line.length-1] == '\r') line=line.substr(0,line.length-1); // discard CR (0x0D)

            if (line.length > 0) { // ignore empty lines
                var obj = JSON.parse(line); // parse the JSON
                console.log(obj); // do something with the data here!
            }
        }
    }
};