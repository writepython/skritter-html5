/**
 * @module Skritter
 * @submodule Model
 * @param Scheduler
 * @param StudyReview
 * @author Joshua McFarland
 * 
 * Properties
 * id
 * part
 * vocabIds
 * style
 * timeStudied
 * next
 * last
 * interval
 * vocabListIds
 * sectionIds
 * reviews
 * successes
 * created
 * changed
 * previousSuccess
 * previousInterval
 * 
 */
define([
    'Scheduler',
    'model/StudyReview',
    'backbone'
], function(Scheduler, StudyReview) {
    /**
     * @class StudyItem
     */
    var StudyItem = Backbone.Model.extend({
        initialize: function() {
            this.on('change', this.cache);
        },
        /**
         * @method cache
         * @param {Function} callback
         */
        cache: function(callback) {
            Skritter.storage.setItem('items', this.toJSON(), function() {
                if (typeof callback === 'function')
                    callback();
            });
        },
        /**
         * @method getCharacterCount
         * @returns {Number}
         */
        getCharacterCount: function() {
            return this.getVocabs()[0].getCharacterCount();
        },
        /**
         * @method getContained
         * @return {Array}
         */
        getContained: function() {
            var items = [];
            var contained = this.getVocabs()[0].get('containedVocabIds');
            for (var i in contained)
            {
                var id = Skritter.user.get('user_id') + '-' + contained[i] + '-' + this.get('part');
                var item = Skritter.study.items.findWhere({id: id});
                if (item)
                    items.push(item);
            }
            return items;
        },
        /**
         * @method getReadiness
         * @return {Number}
         */
        getReadiness: function() {
            //todo: make this more robust
            var readiness = (Skritter.fn.getUnixTime() - this.get('last')) / (this.get('next') - this.get('last'));
            return readiness;
        },
        /**
         * @method getVocabs
         * @return {Array}
         */
        getVocabs: function() {
            var vocabs = [];
            for (var i in this.get('vocabIds'))
            {
                vocabs.push(Skritter.study.vocabs.findWhere({id: this.get('vocabIds')[i]}));
            }
            return vocabs;
        },
        /**
         * @method isActive
         * @return {Boolean}
         */
        isActive: function() {
            if (this.get('vocabIds').length > 0)
                return true;
            return false;
        },
        /**
         * @method play
         * @return {undefined}
         */
        play: function() {
            var vocab = this.getVocabs()[0];
            vocab.play();
        },
        /**
         * @method spawnReview
         * @param {Number} grade
         * @param {Number} reviewTime
         * @param {Number} startTime
         * @param {Number} thinkingTime
         * @param {String} wordGroup
         * @param {Boolean} bearTime
         * @return {StudyItem}
         */
        spawnReview: function(grade, reviewTime, startTime, thinkingTime, wordGroup, bearTime) {
            bearTime = (bearTime) ? true : false;
            var currentTime = Skritter.fn.getUnixTime();
            var actualInterval = startTime - this.get('last');
            var newInterval = new Scheduler().getNewInterval(this, grade);
            var previousInterval = (this.get('previousInterval')) ? this.get('previousInterval') : 0;
            var previousSuccess = (this.get('previousSuccess')) ? this.get('previousSuccess') : false;

            var review = new StudyReview();
            review.set({
                itemId: this.get('id'),
                score: parseInt(grade, 10),
                bearTime: bearTime,
                submitTime: startTime,
                reviewTime: parseFloat(reviewTime),
                thinkingTime: parseFloat(thinkingTime),
                currentInterval: this.get('interval'),
                actualInterval: actualInterval,
                newInterval: newInterval,
                wordGroup: wordGroup,
                previousInterval: previousInterval,
                previousSuccess: previousSuccess
            });
            Skritter.study.reviews.add(review);

            this.set({
                last: currentTime,
                next: currentTime + newInterval,
                interval: newInterval,
                previousInterval: this.get('interval'),
                previousSuccess: (this.get('grade') > 1) ? true : false,
                reviews: this.get('reviews') + 1,
                successes: (grade > 1) ? this.get('successes') + 1 : this.get('successes')
            });

            return this;
        }
    });


    return StudyItem;
});