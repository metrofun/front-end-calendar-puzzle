/*global tmpl */

(function () {
    /**
     * Creates a new vertex of tree,
     * that represents an event
     *
     * @constuctor
     *
     * @param {Object} item
     * @param {Number} [item.start = 0] beginning of event
     * @param {Number} [item.end = 0] end of event
     */
    function Vertex(item) {
        item = item || {};
        this.start = item.start || 0;
        this.end = item.end || 0;
        this.maxSubtreeEnd = this.end;
        this.height = 1;
        this.childs = [];
    }
    Vertex.prototype = {
        /**
         * Adds new childs to the vertex,
         * and sets correct height of tree rooted in current vertex
         *
         * @param {Object} item
         * @param {Object} [item.start = 0] beginning of event
         * @param {Object} [item.end = 0] end of event
         *
         * @returns {Number} this.height, current height of tree
         */
        addChild: function (item) {
            var lastChild;

            if (item.end > this.maxSubtreeEnd) {
                this.maxSubtreeEnd = item.end;
            }
            if (this.childs.length) {
                lastChild = this.childs[this.childs.length - 1];
                if (lastChild.end > item.start) {
                    this.height = lastChild.addChild(item) + 1;
                    return this.height;
                }
            }
            this.height = 2;
            this.childs.push(new Vertex(item));
            return this.height;
        }
    };

    /**
     * @param {Object} event
     * @param {Number} event.start
     * @param {Number} event.end
     *
     * @returns {Boolean}
     */
    function isEventValid(event) {
        return (event.start >= 0)
            && (event.end >= event.start)
            && (event.end <= 720);
    }
    /**
     * Disgards all invalid input items,
     * builds tree of remaining event items
     * and returns  array of event trees
     *
     * @param {Array} input
     *
     * @returns {Array} array of tree roots
     */
    function buildEventsTrees(input) {
        var rootVertex = new Vertex();

        // filter and sort ascending by start time
        input = input.filter(isEventValid).sort(function (a, b) {
            return a.start > b.start ? 1:(a.start === b.start ? 0:-1);
        });
        input.forEach(function (item) {
            rootVertex.addChild(item);
        });

        return rootVertex.childs;
    }

    /**
     * Collides event trees in time,
     * and returns tree groups with maximum height of tree in group.
     * Height of tree corrsponds to number of columns with events
     *
     * @param {Array} trees
     *
     * @returns {<Array>} Each item contains 'height' and 'tree' properties
     */
    function collideTrees(trees) {
        var collidingGroups = [];

        trees
            .sort(function (a, b) {
                return a.maxSubtreeEnd > b.maxSubtreeEnd ? 1:(a.maxSubtreeEnd === b.maxSubtreeEnd ? 0:-1);
            })
            .forEach(function (vertex) {
                var length = collidingGroups.length,
                    lastTree, lastVertex;

                if (length) {
                    lastTree = collidingGroups[length - 1];
                    lastVertex = lastTree.trees[lastTree.trees.length - 1];
                    if (vertex.start < lastVertex.maxSubtreeEnd) {
                        lastTree.columns = Math.max(lastTree.columns, vertex.height);
                        lastTree.trees.push(vertex);
                        return;
                    }
                }
                collidingGroups.push({
                    height: vertex.height,
                    trees: [vertex]
                });
            });

        return collidingGroups;
    }

    /**
     * Recursively builds html of events in a tree.
     *
     * @param {Object} params
     * @param {Vertex} params.root Root vertex of a tree
     * @param {Number} params.columns Number of columns in a event grid
     * @param {Number} params.offset Grid offset for the tree
     *
     * @returns {String}
     */
    function getEventTreeHtml(params) {
        var root = params.root,
            width = 100 / params.columns,
            htmlTokens = [tmpl('event', {
                top: root.start,
                left:  width * params.offset,
                width: width,
                height: root.end - root.start
            })];

        root.childs.forEach(function (vertex) {
            htmlTokens.push(getEventTreeHtml({
                root: vertex,
                offset: params.offset + 1,
                columns: params.columns
            }));
        });

        return htmlTokens.join('');
    }

    /**
     * Displays all valid events on a timeline
     *
     * @param {Array} input
     */
    function layOutDay(input) {
        var htmlTokens = [];

        collideTrees(buildEventsTrees(input)).forEach(function (group) {
            group.trees.forEach(function (tree) {
                htmlTokens.push(getEventTreeHtml({
                    root: tree,
                    offset: 0,
                    columns: group.height
                }));
            });
        });

        document.querySelector('.calendar__events-inner').innerHTML = htmlTokens.join('');
    }

    function layOutAxis() {
        var i, hour, period, htmlTokens = [];

        for (i = 8; i < 21; i++) {
            hour = i % 12 + 1;
            period = i < 11 ? 'AM':'PM';
            htmlTokens.push(tmpl('time_period_yes', {
                hours: hour + ':00',
                period: period
            }));
            if (i < 20) {
                htmlTokens.push(tmpl('time', {
                    hours: hour + ':30',
                    period: period
                }));
            }
        }
        document.querySelector('.calendar__timeline').innerHTML = htmlTokens.join('');
    }

    layOutAxis();
    layOutDay([
        {start: 30, end: 150},
        {start: 540, end: 600},
        {start: 560, end: 620},
        {start: 610, end: 670}
    ]);

    // expose to global
    window.layOutDay = layOutDay;
})();
