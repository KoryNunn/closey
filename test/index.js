var test = require('tape'),
    closey = require('../'),
    itemsToAdd = 1e4;

function randomBox(){
    var x1 = Math.random() * 100,
        y1 = Math.random() * 100,
        x2 = x1 + Math.random() * 10,
        y2 = y1 + Math.random() * 10;

    return [x1, y1, x2, y2];
}

test('fkloads the same', function(t){
    var dooby = closey(10);

    var start = Date.now();
    for(var i = 0; i < itemsToAdd; i++){
        dooby.add([1, 1, 2, 2]);
    }
    console.log([
        itemsToAdd,
        ' items added in ',
        Date.now() - start,
        'ms'
    ].join(''));
    t.end();
});

test('fkloads random', function(t){
    var dooby = closey(10);

    var start = Date.now();
    for(var i = 0; i < itemsToAdd; i++){
        dooby.add(randomBox());
    }
    console.log([
        itemsToAdd,
        ' items added in ',
        Date.now() - start,
        'ms'
    ].join(''));
    t.end();
});

test('search many', function(t){
    var dooby = closey(10);

    for(var i = 0; i < itemsToAdd; i++){
        dooby.add(randomBox());
    }

    var start = Date.now();
    var results = dooby.search([0,0,50,50]);
    console.log([
        itemsToAdd,
        ' items searched, ',
        results.length,
        ' found in ',
        Date.now() - start,
        'ms'
    ].join(''));

    t.end();
});

test('search many small target', function(t){
    var dooby = closey(10);

    for(var i = 0; i < itemsToAdd; i++){
        dooby.add(randomBox());
    }

    var start = Date.now();
    var results = dooby.search([0,0,10,10]);
    console.log([
        itemsToAdd,
        ' items searched, ',
        results.length,
        ' found in ',
        Date.now() - start,
        'ms'
    ].join(''));

    t.end();
});

test('remove', function(t){
    t.plan(1);

    var dooby = closey(10);

    dooby.add([2, 2, 4, 4]);

    var results1 = dooby.search([0,0,4,4]);

    dooby.remove(results1[0]);

    var results2 = dooby.search([0,0,4,4]);

    t.equal(results2.length, results1.length - 1);
});

test('remove with many', function(t){
    t.plan(1);

    var dooby = closey(10);

    for(var i = 0; i < itemsToAdd; i++){
        dooby.add(randomBox());
    }

    var results1 = dooby.search([0,0,200,200]);

    dooby.remove(results1[0]);

    var results2 = dooby.search([0,0,200,200]);

    t.equal(results2.length, results1.length - 1);
});

test('simple', function(t){
    t.plan(1);

    var dooby = closey(10);

    var topLeft = [0,0, 30, 30];
    var middle = [30,30, 40, 40];
    var bottomRight = [40,40, 64, 64];

    dooby.add(topLeft);
    dooby.add(middle);
    dooby.add(bottomRight);

    var results1 = dooby.search([0,0,32,32]);

    dooby.remove(middle);

    var results2 = dooby.search([0,0,32,32]);

    t.equal(results2.length, results1.length - 1);
});