/**
 * @module Framework
 */
define([], function() {
    /**
     * @class BaseView
     * @extends Backbone.View
     */
    return Backbone.View.extend({
        /**
         * @property elements
         * @type Object
         */
        elements: {},
        /**
         * @property events
         * @type Object
         */
        events: {
            'click .navigate': 'handleNavigateClicked'
        },
        /**
         * @method handleNavigateClicked
         * @param {Event}
         */
        handleNavigateClicked: function(event) {
            event.preventDefault();
            var url = $(event.currentTarget).data('url');
            var replace = $(event.currentTarget).data('replace');
            var trigger = $(event.currentTarget).data('trigger');
            app.router.navigate(url, {
                replace: replace === undefined ? false : replace,
                trigger: trigger === undefined ? true : trigger
            });
        },
        /**
         * @method remove
         * @returns {BaseView}
         */
        remove: function() {
            this.$el.empty();
            this.stopListening();
            this.undelegateEvents();
            return this;
        }
    });
});
