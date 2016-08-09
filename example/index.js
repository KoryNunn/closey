var closey = require('../');

var dooby = closey(20);

for(var i = 0; i < 100; i++){
    var x = parseInt(Math.random() * 100),
        y = parseInt(Math.random() * 100),
        item = [x, y, x + Math.random() * 3, y + Math.random() * 3];

    item.velocity = [
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1
    ];

    dooby.add(item);
}

var searchRegions = [];

for(var i = 0; i < 10; i++){
    var x = parseInt(Math.random() * 100),
        y = parseInt(Math.random() * 100),
        searchRegion = [x, y, x + Math.random() * 30, y + Math.random() * 30];

    searchRegion.velocity = [
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1
    ];

    searchRegions.push(searchRegion);
}

var results = [];

setInterval(function(){
    searchRegions.forEach(function(region){
        region[0] += region.velocity[0];
        region[1] += region.velocity[1];
        region[2] += region.velocity[0];
        region[3] += region.velocity[1];
    });
    dooby.all().forEach(function(item){
        item[0] += item.velocity[0];
        item[1] += item.velocity[1];
        item[2] += item.velocity[0];
        item[3] += item.velocity[1];
    });
    results = searchRegions.map(dooby.search);

    dooby.update();
}, 16);

function renderBox(context, box, color){
    context.fillStyle = color || 'rgba(0,0,0,0.1)';
    context.fillRect(
        box[0] * 10,
        box[1] * 10,
        (box[2] - box[0]) * 10,
        (box[3] - box[1]) * 10
    );
    context.strokeRect(
        box[0] * 10,
        box[1] * 10,
        (box[2] - box[0]) * 10,
        (box[3] - box[1]) * 10
    );
}

function renderNode(context, node){
    if(!node){
        return;
    }

    renderBox(context, node.bounds);

    if(node.quadrants){
        node.quadrants.forEach(function(node){
            renderNode(context, node);
        });
    }
}

window.onload = function(){

    var canvas = document.createElement('canvas'),
        context = canvas.getContext('2d');

    canvas.height = 1000;
    canvas.width = 1000;

    function render(){

        context.clearRect(0, 0, canvas.width, canvas.height);

        renderNode(context, dooby.root());

        searchRegions.forEach(function(searchRegion){
            renderBox(context, searchRegion, 'rgba(0,0,255,0.5)');
        })

        dooby.all().forEach(function(item){
            renderBox(context,
                [
                    item[0],
                    item[1],
                    item[2],
                    item[3],
                ],
                'rgba(255,0,0,0.5)'
            );
        });

        var renderResults = new Set();

        results.forEach(function(items){
            items.forEach(function(item){
                renderResults.add(item);
            });
        });

        renderResults.forEach(function(item){
            renderBox(context,
                [
                    item[0],
                    item[1],
                    item[2],
                    item[3],
                ],
                'rgba(0,255,0,0.5)'
            );
        });

        requestAnimationFrame(render);
    }

    render();

    document.body.appendChild(canvas);
}