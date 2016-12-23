let elasticsearch = require('elasticsearch');
let _ = require('lodash');
let config = require('./config.json');

let client = new elasticsearch.Client({
    host: config.esHost,
    log: 'info'
});

const INDEX_NAME = 'cards-against-humanity-cards';

function prepareBulkBody(type, cards) {
    let body = [];

    _.each(cards, (card) => {
        body.push({ index:  { _index: INDEX_NAME, _type: type } });
        body.push(card);
    });

    return body;
}

module.exports = {
    initIndex: function(callback) {
        //for now, delete the old index first if one is there and make it again
        client.indices.delete({
            index: INDEX_NAME
        }, function (err, resp) {
            client.indices.create({
                index: INDEX_NAME
            }, function (err, resp) {
                callback();
            });
        });
    },
    insertIntoElasticsearch: function(type, cards) {
        let bulkBody = prepareBulkBody(type, cards);
        //console.log(bulkBody);
        client.bulk({
            body: bulkBody
        }, function (err, resp) {
            if (err) {
            }
            if (resp) {
                if (resp.errors) {
                    _.each(resp.items, (item) => {
                        console.log(item);
                    });
                }
            }
            console.log(`done bulk indexing ${type}`);
        });
    }
};

/*
    example query:
     {
         "query": {
             "multi_match" : {
                 "query" : "gary",
                 "fields" : "card_name",
                 "fuzziness" : "0"
             }
         }
     }
 */