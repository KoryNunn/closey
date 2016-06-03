var test = require('tape'),
    closey = require('../'),
    itemsToAdd = 1e4;

test('fkloads the same', function(t){
    var dooby = closey(10);

    var start = Date.now();
    for(var i = 0; i < itemsToAdd; i++){
        dooby.add([1, 1]);
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
        dooby.add([Math.random() * 100, Math.random() * 100]);
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
        dooby.add([Math.random() * 100, Math.random() * 100]);
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
        dooby.add([Math.random() * 100, Math.random() * 100]);
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

    dooby.add([2, 2]);

    var results1 = dooby.search([0,0,4,4]);

    dooby.remove(results1[0]);

    var results2 = dooby.search([0,0,4,4]);

    t.equal(results2.length, results1.length - 1);
});

test('remove with many', function(t){
    t.plan(1);

    var dooby = closey(10);

    for(var i = 0; i < itemsToAdd; i++){
        dooby.add([Math.random() * 100, Math.random() * 100]);
    }

    var results1 = dooby.search([0,0,50,50]);

    dooby.remove(results1[0]);

    var results2 = dooby.search([0,0,50,50]);

    t.equal(results2.length, results1.length - 1);
});

test('simple', function(t){
    t.plan(1);

    var dooby = closey(10);

    var topLeft = [0,0];
    var middle = [1,1];
    var bottomRight = [2,2];

    dooby.add(topLeft);
    dooby.add(middle);
    dooby.add(bottomRight);

    var results1 = dooby.search([1,1,2,2]);

    dooby.remove(middle);

    var results2 = dooby.search([1,1,2,2]);

    t.equal(results2.length, results1.length - 1);
});

test('simple 2', function(t){
    t.plan(2);

    var dooby = closey(10);

    var topLeft = [0,0];
    var middle = [1,1];
    var bottomRight = [2,2];

    dooby.add(topLeft);
    dooby.add(middle);
    dooby.add(bottomRight);

    var results1 = dooby.search([0.5,0.5,1.5,1.5]);
    t.equal(results1.length, 1);

    dooby.remove(middle);

    var results2 = dooby.search([0.5,0.5,1.5,1.5]);

    t.equal(results2.length, 0);
});