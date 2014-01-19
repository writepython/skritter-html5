/**
 * @module Skritter
 * @param templateTone
 * @param Canvas
 * @param CanvasStroke
 * @param LeapController
 * @param Prompt
 * @param Recognizer
 * @author Joshua McFarland
 */
define([
    'require.text!templates/prompt-tone.html',
    'views/prompts/Canvas',
    'models/CanvasStroke',
    'models/LeapController',
    'views/prompts/Prompt',
    'Recognizer'
], function(templateTone, Canvas, CanvasStroke, LeapController, Prompt, Recognizer) {
    /**
     * @class PromptTone
     */
    var Tone = Prompt.extend({
        /**
         * @method initialize
         */
        initialize: function() {
            Prompt.prototype.initialize.call(this);
            skritter.timer.setReviewLimit(15);
            skritter.timer.setThinkingLimit(10);
            Tone.canvas = new Canvas();
            Tone.failedAttempts = 0;
            Tone.leap = new LeapController();
            Tone.maxFailedAttempts = 3;
            Tone.minStrokeDistance = 10;
            Tone.result = null;
            this.listenTo(Tone.canvas, 'input:down', this.handleInputDown);
            this.listenTo(Tone.canvas, 'input:up', this.handleInputUp);
        },
        /**
         * @method render
         * @returns {Backbone.View}
         */
        render: function() {
            this.$el.html(templateTone);
            Tone.canvas.setElement(this.$('#canvas-container')).render();
            hammer(this.$('#canvas-container')[0]).on('doubletap', this.handleDoubleTap);
            hammer(this.$('#canvas-container')[0]).on('hold', this.handleHold);
            hammer(this.$('#canvas-container')[0]).on('tap', this.handleTap);
            Prompt.prototype.render.call(this);
            return this;
        },
        /**
         * @method clear
         */
        clear: function() {
            Prompt.gradingButtons.hide(true);
            Tone.canvas.clear('background');
            Tone.canvas.clear('hint');
            Tone.canvas.clear('stroke');
            Tone.canvas.clear('feedback');
        },
        /**
         * @method handleCharacterComplete
         */
        handleCharacterComplete: function() {
            Prompt.dataItem.set('finished', true);
            //TODO: figure out how to properly inject a color
            //checks if we should snap or just glow the result
            if (skritter.user.getSetting('squigs')) {
                window.setTimeout(function() {
                    for (var i in Prompt.dataItem.get('character').models) {
                        var stroke = Prompt.dataItem.get('character').models[i];
                        console.log('stroke', stroke);
                        Tone.canvas.tweenShape('background', stroke.getUserSprite(), stroke.getInflatedSprite());
                    }
                    Tone.canvas.setLayerAlpha('stroke', 0.3);
                    Tone.canvas.injectLayer('background', Prompt.gradeColorHex[Prompt.gradingButtons.grade()]);
                }, 100);
            } else {
                Tone.canvas.injectLayer('stroke', Prompt.gradeColorHex[Prompt.gradingButtons.grade()]);
            }
            this.load();
        },
        /**
         * @method handleDoubleTap
         */
        handleDoubleTap: function() {
            if (!Prompt.finished) {
                Prompt.gradingButtons.select(1).collapse();
                Tone.canvas.drawContainer('hint', Prompt.dataItem.get('character').targets[Prompt.dataItem.get('character').getVariationIndex()]
                        .getCharacterSprite(Prompt.dataItem.get('character').getExpectedStroke().get('position'), 'grey'), 0.3);
                // ISSUE #132: Also flash next stroke when full-character hint is requested.
                var nextStroke = Prompt.dataItem.get('character').getExpectedStroke();
                if (nextStroke)
                    Tone.canvas.drawShape('hint', nextStroke.getInflatedSprite('#87cefa'));
            }
        },
        /**
         * @method handleInputDown
         */
        handleInputDown: function() {
            //ISSUE #60: thinking timer should stop when the first stroke is attempted
            skritter.timer.stopThinking();
            //fade hints when a new stroke is started
            Tone.canvas.fadeLayer('hint');
        },
        /**
         * @method handleInputUp
         * @param {Arrau} points
         * @param {CreateJS.Shape} shape
         */
        handleInputUp: function(points, shape) {
            this.process(points, shape);
        },
        /**
         * @method handleStrokeDrawn
         * @param {Backbone.Model} result
         */
        handleStrokeDrawn: function(result) {
            //prevents multiple simultaneous strokes from firing the character complete event
            result.set('isTweening', false);
            //check if the character has been completed yet or not with enforced tween checks
            if (Prompt.dataItem.get('character').getStrokeCount(true) >= Prompt.dataItem.get('character').getTargetStrokeCount())
                this.handleCharacterComplete();
        },
        /**
         * @method handleHold
         */
        handleHold: function() {
            Prompt.this.reset();
            Prompt.this.load();
        },
        /**
         * @method handleTap
         */
        handleTap: function() {
            if (Prompt.dataItem.isFinished())
                Prompt.this.handleGradeSelected(Prompt.gradingButtons.grade());
        },
        /**
         * @method load
         */
        load: function() {
            console.log('PROMPT ITEM', Prompt.dataItem);
            if (Prompt.dataItem.isFinished()) {
                skritter.timer.stop();
                Tone.canvas.disableInput();
                Prompt.gradingButtons.select().collapse();        
                Prompt.data.show.readingAt(0, true);
            } else {
                skritter.timer.start();
                Tone.canvas.enableInput();
                Tone.canvas.clear('background');
                Tone.canvas.drawCharacterFromFont('background', Prompt.data.vocab.getCharacters()[Prompt.data.position - 1], Prompt.data.vocab.getFontName(), 1, '#000000');
                Prompt.data.show.definition();
                Prompt.data.show.readingAt();
                Prompt.data.show.style();
                Prompt.data.show.writing();
            }
        },
        /**
         * @method process
         * @param {Array} points
         * @param {CreateJS.Shape} shape
         * @param {Boolean} ignoreCheck
         * @param {Boolean} enforceOrder
         */
        process: function(points, shape, ignoreCheck, enforceOrder) {
            if (points.length > 0 && skritter.fn.getDistance(points[0], points[points.length - 1]) > Tone.minStrokeDistance) {
                //check that a minimum distance is met
                if (skritter.fn.getDistance(points[0], points[points.length - 1]) > Tone.minStrokeDistance) {
                    //create the stroke from the points to analyze
                    var stroke = new CanvasStroke().set('points', points);
                    //recognize a stroke based on user input and targets
                    var result = new Recognizer(Prompt.dataItem.get('character'), stroke, Prompt.dataItem.get('character').targets).recognize(ignoreCheck, enforceOrder);
                    //check if a result exists and that it's not a duplicate
                    if (result && !Prompt.dataItem.get('character').containsStroke(result)) {
                        //store the result for resizing later if needed
                        Tone.result = result;
                        //select the grade as 3 for a corrent answer
                        Prompt.gradingButtons.select(3);
                        //add the stroke to the users character
                        Prompt.dataItem.get('character').add(result);
                        //draw the stroke on the canvas without tweening
                        Tone.canvas.tweenShape('stroke', result.getUserSprite(), result.getInflatedSprite());

                    } else {
                        //store the result for resizing later if needed
                        Tone.result = Prompt.dataItem.get('character').targets[0].at(0);
                        //markes the incorrect answer as grade 1
                        Prompt.gradingButtons.select(1).collapse();
                        //fade incorrect strokes out
                        Tone.canvas.fadeShape('background', shape);
                        //select the first possible tone and display it as wrong
                        Tone.canvas.drawShape('stroke', Tone.result.getInflatedSprite());
                    }
                }
            } else {
                //ISSUE #69: count clicks as a neutral fifth tone
                var index = _.pluck(Prompt.dataItem.get('character').targets, 'name').indexOf('tone5');
                if (index >= 0) {
                    Prompt.gradingButtons.select(3).collapse();
                    Tone.result = Prompt.dataItem.get('character').targets[index].at(0);
                    Tone.canvas.drawShape('stroke', Tone.result.getInflatedSprite());
                } else {
                    Prompt.gradingButtons.select(1).collapse();
                    Tone.result = Prompt.dataItem.get('character').targets[0].at(0);
                    Tone.canvas.drawShape('stroke', Tone.result.getInflatedSprite());
                }
            }
            this.handleCharacterComplete();
        },
        /**
         * @method redraw
         */
        redraw: function() {
            if (Prompt.dataItem.isFinished()) {
                Tone.canvas.drawContainer('stroke', Prompt.dataItem.get('character').getCharacterSprite(null, Prompt.gradeColorHex[Prompt.dataItem.getGrade()]));
            } else {
                Tone.canvas.drawContainer('stroke', Prompt.dataItem.get('character').getCharacterSprite());
            }
        },
        /**
         * @method reset
         */
        reset: function() {
            Prompt.dataItem.get('character').reset();
            Prompt.dataItem.set('finished', false);
            this.clear();
        }
    });

    return Tone;
});