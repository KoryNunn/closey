var closey = require('../');

var dooby = closey(10);

var render = [];

for(var i = 0; i < 100; i++){
    dooby.add([parseInt(Math.random() * 100), parseInt(Math.random() * 100)]);
}

dooby.add([74, 50])

for(var i = 0; i < 100*100; i++){
    render[parseInt(i/100)] = render[parseInt(i/100)] || [];
    render[parseInt(i/100)].push(0);
}

var searchRegion = [25,25,75,75],
    results = dooby.search(searchRegion);

function renderBox(box, highlight){
    var xMin = Math.min(Math.max(box[0], 0), 99);
    var xMax = Math.min(Math.max(box[2], 0), 99);
    var yMin = Math.min(Math.max(box[1], 0), 99);
    var yMax = Math.min(Math.max(box[3], 0), 99);

    for(var i = xMin; i < xMax; i++){
        for(var j = yMin; j < yMax; j++){
            if(highlight){
                render[i][j]+= 10;
            }else{
                render[i][j]++;
            }
        }
    }
}

function renderNode(node){
    if(!node){
        return;
    }

    renderBox(node.bounds);

    if(node.quadrants){
        node.quadrants.forEach(renderNode);
    }
}

renderNode(dooby.root());
renderBox(searchRegion, true);

dooby.all().forEach(function(item){
    console.log(item[0], item[1]);
    render[item[1]][item[0]] = ~results.indexOf(item) ? true : false;
});

function renderCell(value){
    var cell = document.createElement('span');
    if(typeof value === 'boolean'){
        cell.setAttribute('style', 'background-color:' + (value ? 'red' : 'blue'));
    }else{
        cell.setAttribute('style', 'background-color:rgba(0,0,0,' + 1 / value + ')');
    }
    return cell;
}

var output = render.reduce(function(result, row){
    result.appendChild(row.reduce(function(result, cell){
        result.appendChild(renderCell(cell));
        return result;
    }, document.createElement('div')));
    return result;
}, document.createDocumentFragment());

window.onload = function(){
    document.body.appendChild(output);
}