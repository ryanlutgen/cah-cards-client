"use strict";

let fs = require('fs');
let xlsx = require('node-xlsx');
let _ = require('lodash');
let mainSet = require('./parsers/main-set');
let expansions = require('./parsers/expansions');
let packs = require('./parsers/packs');

const worksheet = xlsx.parse(`${__dirname}/data/cah-cards.xlsx`);

let cards = [];
//keep cards in seperate arrays for now to debug
cards.push(mainSet.parse(worksheet[3]).cards);
cards.push(expansions.parse(worksheet[4]).cards);
cards.push(packs.parse(worksheet[5]).cards);


fs.writeFileSync('./output/test.json', JSON.stringify(cards, null, 4));