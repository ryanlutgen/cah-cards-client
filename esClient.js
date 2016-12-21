let elasticsearch = require('elasticsearch');
let _ = require('lodash');

let client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'error'
});

const INDEX_NAME = 'cards-against-humanity-cards';

function prepareBulkBody(type, cards) {
    let body = [];
    let bodies = [];
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

    let i = 0;

    _.each(cards, (card) => {
        body.push({ index:  { _index: INDEX_NAME, _type: type } });
        body.push(card);
        i++;

        if (i > 200) {
            bodies.push(body);
            body = [];
            i = 0;
        }
    });

    bodies.push(body);

    return bodies;
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
        let bulkBodies = prepareBulkBody(type, cards);
        _.each(bulkBodies, (bulkBody) => {
            client.bulk({
                body: bulkBody
            }, function (err, resp) {
                console.log(`done bulk indexing ${type}`);
            });
        });
    }
};