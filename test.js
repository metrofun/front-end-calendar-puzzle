/*global layOutDay */
document.body.onkeypress = function () {
    var length = Math.ceil(Math.random() * 100),
    input = [], i;

    for (i = 0; i < length; i++) {
        input.push({
            start: Math.ceil(Math.random() * 720),
            end: Math.ceil(Math.random() * 720)
        });
    }

    layOutDay(input);
}
