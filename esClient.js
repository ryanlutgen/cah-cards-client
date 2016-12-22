let elasticsearch = require('elasticsearch');
let _ = require('lodash');

let client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'error'
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
        client.bulk({
            body: bulkBody
        }, function (err, resp) {
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