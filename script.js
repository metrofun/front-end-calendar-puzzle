/*global tmpl */

(function () {
    /**
     * Returns groups of not colliding in time events
     *
     * @param {<Array<Object>>} events
     *
     * @returns {<Array<Array>>}
     */
    function collideEvents(events) {
        var groups = [], lastGroup, maxGroupEnd = 0;
        // filter and sort ascending by start time
        events.sort(function (a, b) {
            return a.start > b.start ? 1:(a.start === b.start ? 0:-1);
        }).forEach(function (event) {
            if (!lastGroup || maxGroupEnd < event.start) {
                lastGroup = [event];
                groups.push(lastGroup);
                maxGroupEnd = event.end;
            } else {
                lastGroup.push(event);
                maxGroupEnd = Math.max(maxGroupEnd, event.end);
            }
        });

        return groups;
    }
    /**
     * Compact events into fewest number of columns
     * and returns these columns.
     * To minimize columns number,
     * we maximize events number in a single column using next approach:
     * we take event with closest ending time and any start time,
     * but not colliding with existing events in a column
     *
     * @param {Array} events
     *
     * @returns {Array}
     */
    function compactEvents(events) {
        var columns = [], firstEndEvent;

        events = events.sort(function (a, b) {
            return a.end > b.end ? 1:(a.end === b.end ? 0:-1);
        });

        if (events.length) {
            firstEndEvent = events.shift();
            columns.push({
                events: [firstEndEvent],
                maxEnd: firstEndEvent.end
            });

            events.forEach(function (event) {
                var isFitting = columns.some(function (column) {
                    if (event.start >= column.maxEnd) {
                        column.maxEnd = event.end;
                        return column.events.push(event);
                    }
                });
                if (!isFitting) {
                    columns.push({
                        events: [event],
                        maxEnd: event.end
                    });
                }
            });
        }

        return columns;
    }
    /**
     * @param {Object} event
     * @param {Number} event.start
     * @param {Number} event.end
     *
     * @returns {Boolean}
     */
    function isEventValid(event) {
        var MINIMUM_START_TIME = 0,
            MAXINUM_END_TIME = 720;

        return (event.start >= MINIMUM_START_TIME)
            && (event.end >= event.start)
            && (event.end <= MAXINUM_END_TIME);
    }
    /**
     * Returns human time in format: "hh:mm AM/PM"
     * for minutes since 09:00 AM
     *
     * @param {Number} offset minutes since 09:00 AM
     *
     * @returns {String}
     */
    function getHumanTime(offset) {
        var hours = 9 + Math.floor(offset / 60),
            minutes = offset % 60,
            period = hours < 12 ? 'AM':'PM';

        return [hours % 12, ':', (minutes > 9 ? minutes:'0' + minutes), ' ', period].join('');
    }
    /**
     * Displays all valid events on a timeline
     *
     * @param {Array} input
     */
    function layOutDay(input) {
        var htmlTokens = [];

        collideEvents(input.filter(isEventValid)).forEach(function (events) {
            compactEvents(events).forEach(function (column, offset, columns) {
                // width in percents
                var width = 100 / columns.length;

                column.events.forEach(function (event) {
                    var startDate = new Date();

                    startDate.setUTCHours(
                        Math.floor(9 + (event.start / 60)),
                        event.start % 60,
                        0,
                        0
                    );

                    htmlTokens.push([tmpl('event', {
                        top: event.start,
                        left:  width * offset,
                        width: width,
                        height: event.end - event.start,
                        startTime: getHumanTime(event.start),
                        endTime: getHumanTime(event.end),
                        dtstart: startDate.toISOString()
                    })]);
                });
            });
        });

        document.querySelector('.calendar__events-inner').innerHTML = htmlTokens.join('');
    }
    /**
     * Displays axis of timeline
     */
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
