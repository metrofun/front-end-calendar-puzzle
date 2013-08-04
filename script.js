/*global tmpl */
(function (tmpl) {
    // Timeline upper bound in minutes
    var MAXINUM_END_TIME = 720;
    /**
     * Returns groups of not colliding in time events
     *
     * @param {Array} events
     *
     * @returns {Array} Groups of colliding events
     */
    function collideEvents(events) {
        var groups = [],
            lastGroup,
            // stores maximum end-time of events in the lastGroup
            maxGroupEnd = 0;

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
     * but not colliding with existing events in a column/
     *
     * @param {Array} events
     *
     * @returns {Array} Columns
     */
    function compactEvents(events) {
        var columns = [],
            firstEndEvent;

        events = events.sort(function (a, b) {
            return a.end > b.end ? 1:(a.end === b.end ? 0:-1);
        });

        if (events.length) {
            // initialize columns with a single column,
            // that contains event with closest end-time
            firstEndEvent = events.shift();
            columns.push({
                events: [firstEndEvent],
                maxEnd: firstEndEvent.end
            });

            events.forEach(function (event) {
                // try to fit an event into exisiting columns
                var isFitting = columns.some(function (column) {
                    if (event.start >= column.maxEnd) {
                        column.maxEnd = event.end;
                        return column.events.push(event);
                    }
                });
                // create a new column from an event,
                // if it doesn't fit
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
     * Disgards event with formally incorrect start and end times.
     *
     * @example
     * // returns false
     * isEventValid({start: 50, end: 20});
     * isEventValid({start: -10, end: 20});
     * isEventValid({start: 10, end: 9999});
     *
     * @param {Object} event
     * @param {Number} event.start
     * @param {Number} event.end
     *
     * @returns {Boolean}
     */
    function isEventValid(event) {
        return (event.start >= 0)
            && (event.end >= event.start)
            && (event.end <= MAXINUM_END_TIME);
    }
    /**
     * Returns hours, minutes and period information
     * for minutes since 09:00 AM
     *
     * @param {Number} offset Minutes since 09:00 AM
     *
     * @returns {{hours: String, minutes: String, period: String}}
     */
    function getTimeFromMinutes(offset) {
        var hours = 9 + Math.floor(offset / 60),
            minutes = offset % 60,
            period = hours < 12 ? 'AM':'PM';

        return {
            hours: String(hours % 12),
            minutes: String(minutes > 9 ? minutes:'0' + minutes),
            period: period
        };
    }
    /**
     * Returns human time in a format: "hh:mm AM/PM"
     * for minutes since 09:00 AM
     *
     * @param {Number} offset minutes since 09:00 AM
     *
     * @returns {String}
     */
    function getHumanTime(offset) {
        var timeInfo = getTimeFromMinutes(offset);

        return [timeInfo.hours, ':', timeInfo.minutes, ' ', timeInfo.period].join('');
    }
    /**
     * Displays all valid events on a timeline.
     *
     * Every event snippet will have a title attribute,
     * useful when content is overflowed (e.g. too short event).
     * Event snippet follows hCalendar microformat
     * @see http://microformats.org/wiki/hcalendar
     *
     * @param {Array} input
     */
    function layOutDay(input) {
        var htmlTokens = [];

        // disgard invalid events and group them into not colliding groups
        collideEvents(input.filter(isEventValid)).forEach(function (events) {
            // every group of events should be compactly distributed into columns
            compactEvents(events).forEach(function (column, offset, columns) {
                // generate html for every event in a column

                var width = 100 / columns.length;

                column.events.forEach(function (event) {
                    // startDate is required by hCalendar
                    var startDate = new Date();

                    startDate.setUTCHours(
                        Math.floor(9 + (event.start / 60)), //hours
                        event.start % 60, //minutes
                        0, //seconds
                        0 //milliseconds
                    );

                    htmlTokens.push([tmpl('event', {
                        top: event.start,
                        left:  width * offset,
                        width: width,
                        height: event.end - event.start,
                        startTime: getHumanTime(event.start),
                        endTime: getHumanTime(event.end),
                        startDate: startDate.toISOString()
                    })]);
                });
            });
        });

        document.querySelector('.calendar__events-inner').innerHTML = htmlTokens.join('');
    }
    /**
     * Displays axis of a timeline
     */
    function layOutAxis() {
        var minutes, step = 30, htmlTokens = [];

        for (minutes = 0; minutes <= MAXINUM_END_TIME; minutes += step) {
            htmlTokens.push(tmpl(
                minutes % 60 ? 'time':'time_period_yes',
                getTimeFromMinutes(minutes)
            ));
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
    this.layOutDay = layOutDay;
}).call(this, tmpl);
