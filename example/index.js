var closey = require('../');

var dooby = closey(10);

for(var i = 0; i < 100; i++){
    // dooby.add([parseInt(i / 10)*10, i%10*10]);
    dooby.add([parseInt(Math.random() * 100), parseInt(Math.random() * 100)]);
}
console.log(dooby.all())

var searchRegion = [25,25,75,75],
    results = dooby.search(searchRegion);

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
        renderBox(context, searchRegion, 'rgba(0,0,255,0.5)');

        dooby.all().forEach(function(item){
            renderBox(context,
                [
                    item[0],
                    item[1],
                    item[0]+1,
                    item[1]+1,
                ],
                'rgba(255,0,0,0.5)'
            );
        });

        results.forEach(function(item){
            renderBox(context,
                [
                    item[0],
                    item[1],
                    item[0]+1,
                    item[1]+1,
                ],
                'rgba(0,255,0,0.5)'
            );
        });

        requestAnimationFrame(render);
    }

    render();

    document.body.appendChild(canvas);
}