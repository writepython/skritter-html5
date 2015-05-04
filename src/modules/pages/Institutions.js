/**
 * @module Application
 * @submodule Pages
 */
define([
    'require.text!templates/institutions.html',
    'core/modules/GelatoPage'
], function(Template, GelatoPage) {

    /**
     * @class PageInstitutions
     * @extends GelatoPage
     */
    var PageInstitutions = GelatoPage.extend({
        /**
         * @method initialize
         * @constructor
         */
        initialize: function(options) {},
        /**
         * @property title
         * @type String
         */
        title: 'Institutions - ' + i18n.global.title,
        /**
         * @method render
         * @returns {PageInstitutions}
         */
        render: function() {
            this.renderTemplate(Template);
            return this;
        }
    });

    return PageInstitutions;

});