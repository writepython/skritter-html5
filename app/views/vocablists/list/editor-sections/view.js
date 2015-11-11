var Component = require('base/component');

var Vocab = require('models/vocab');

/**
 * @class VocablistsListEditorSections
 * @extends {Component}
 */
module.exports = Component.extend({
    /**
     * @method initialize
     * @param {Object} options
     * @constructor
     */
    initialize: function(options) {
        this.editing = false;
        this.vocablist = options.vocablist;
        this.listenTo(this.vocablist, 'change:sections', this.render);
        this.listenTo(this.vocablistSection, 'change:vocabs', this.render);
    },
    /**
     * @property events
     * @type {Object}
     */
    events: {},
    /**
     * @property template
     * @type {Function}
     */
    template: require('./template'),
    /**
     * @method render
     * @returns {VocablistsListEditorSections}
     */
    render: function() {
        this.renderTemplate();
    },
    /**
     * @method addSection
     * @param {String} name
     */
    addSection: function(name) {
        this.vocablist.get('sections').push({name: name, rows: []});
        this.render();
    },
    /**
     * @method addWord
     * @param {String} query
     */
    addWord: function(query) {
        var vocab = new Vocab({q: query});
        this.vocablistSection.get('vocabs').push(vocab);
        vocab.fetch({
            data: {q: query},
            error: function(a, b) {},
            success: _.bind(function(model) {
                var vocabs = model.get('Vocabs');
                if (vocabs.length) {
                    model.set('vocabId', vocabs[0].vocabId);
                    model.set('tradVocabId', vocabs[0].tradVocabId);
                    model.set(vocabs[0], {merge: true});
                }
                this.render();
            }, this)
        });
        this.render();
    }
});
