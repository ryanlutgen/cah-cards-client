let elasticsearch = require('elasticsearch');
let _ = require('lodash');

let client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'error'
});

const INDEX_NAME = 'cards-against-humanity-cards';

function prepareBulkBody(type, cards) {
    let body = [];
    // [
    //     // action description
    //     { index:  { _index: 'myindex', _type: 'mytype', _id: 1 } },
    //     // the document to index
    //     { title: 'foo' },
    //     // action description
    //     { update: { _index: 'myindex', _type: 'mytype', _id: 2 } },
    //     // the document to update
    //     { doc: { title: 'foo' } },
    //     // action description
    //     { delete: { _index: 'myindex', _type: 'mytype', _id: 3 } },
    //     // no document needed for this delete
    // ]

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