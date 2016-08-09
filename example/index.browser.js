(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"../":2}],2:[function(require,module,exports){
module.exports = function(maxBinSize){
    maxBinSize = maxBinSize || 10;
    function createNode(bounds){
        var size = bounds[2] - bounds[0],
            node = {
                bounds: bounds,
                size: size,
                halfSize: size / 2,
                items: []
            };

        return node;
    }

    var root,
        allItems;

    function reset(){
        root = createNode([0, 0, 64, 64]);
        allItems = new Set();
    }
    reset();

    function addQuadrant(parent, index){
        var parentSize = parent.size,
            halfSize = parent.halfSize,
            right = index%2,
            bottom = index>=2;

        return createNode([
            parent.bounds[0] + (right ? halfSize : 0),
            parent.bounds[1] + (bottom ? halfSize : 0),
            parent.bounds[2] - (right ? 0 : halfSize),
            parent.bounds[3] - (bottom ? 0 : halfSize)
        ]);
    }

    function addParentNode(offset, childNode){
        var childToLeft = offset[0] > 0,
            childToTop = offset[1] > 0,
            childSize = childNode.size;

        root = createNode([
            childNode.bounds[0] - (childToLeft ? 0 : childSize),
            childNode.bounds[1] - (childToTop ? 0 : childSize),
            childNode.bounds[2] + childSize * (childToLeft ? 1 : 0),
            childNode.bounds[3] + childSize * (childToTop ? 1 : 0)
        ]);

        root.quadrants = [
            (childToLeft && childToTop) ? childNode : addQuadrant(root, 0),
            (!childToLeft && childToTop) ? childNode : addQuadrant(root, 1),
            (childToLeft && !childToTop) ? childNode : addQuadrant(root, 2),
            (!childToLeft && !childToTop) ? childNode : addQuadrant(root, 3)
        ];

        return root;
    }

    function insertInto(node, box){
        var fits =
            box[0] - box[2] < node.halfSize &&
            box[1] - box[3] < node.halfSize,
            horizCentre = node.bounds[0] + node.halfSize,
            vertCentre = node.bounds[1] + node.halfSize,
            left = box[2] < horizCentre,
            right = box[0] > horizCentre,
            horiz = left ^ right,
            top = box[3] < vertCentre,
            bottom = box[1] > vertCentre,
            vert = top ^ bottom;

        if(node.items.length > maxBinSize && fits && horiz && vert){
            var index =
                (left ? 0 : 1) +
                (top ? 0 : 2);

            if(!node.quadrants){
                node.quadrants = [];
            }


            insertInto(
                node.quadrants[index] || (
                    node.quadrants[index] = addQuadrant(node, index)
                ), box);
            return;
        }

        node.items.push(box);
    }

    function add(box){
        allItems.add(box);

        var targetNode = root;

        var x = box[0] < targetNode.bounds[0] ? -1 : box[2] >= targetNode.bounds[2] ? 1 : 0;
        var y = box[1] < targetNode.bounds[1] ? -1 : box[3] >= targetNode.bounds[3] ? 1 : 0;

        if(x || y){
            targetNode = addParentNode([x, y], targetNode);
            add(box);
            return;
        }

        insertInto(targetNode, box);
    }

    function addSearchResult(item){
        var box = this[0];

        if(
            item[0] <= box[2] &&
            item[2] >= box[0] &&
            item[1] <= box[3] &&
            item[3] >= box[1]
        ){
            this[1].push(item);
        }
    }

    function searchNode(node){
        var searchBox = this[0],
            results = this[1];

        if(!node ||
            node.bounds[0] > searchBox[2] ||
            node.bounds[2] <= searchBox[0] ||
            node.bounds[1] > searchBox[3] ||
            node.bounds[3] <= searchBox[1]
        ){
            return;
        }

        if(node.quadrants){
            searchNode.call(this, node.quadrants[0]);
            searchNode.call(this, node.quadrants[1]);
            searchNode.call(this, node.quadrants[2]);
            searchNode.call(this, node.quadrants[3]);
        }

        if(
            node.bounds[0] >= searchBox[0] &&
            node.bounds[2] < searchBox[2] &&
            node.bounds[1] >= searchBox[1] &&
            node.bounds[3] < searchBox[3]
        ){
            results.push.apply(results, node.items);
            return;
        }

        for(var i = 0; i < node.items.length; i++){
            addSearchResult.call(this, node.items[i]);
        }
    }

    function search(box){
        var results = [];

        searchNode.call([box, results], root);

        return results;
    }

    function remove(position){
        allItems.delete(position);
        update();
    }

    function update(){
        var previousItems = allItems;
        reset();
        previousItems.forEach(add);
    }

    return {
        add: add,
        remove: remove,
        update: update,
        search: search,
        root: function(){
            return root;
        },
        all: function(){
            return Array.from(allItems);
        }
    };
}
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlL2luZGV4LmpzIiwiaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBjbG9zZXkgPSByZXF1aXJlKCcuLi8nKTtcblxudmFyIGRvb2J5ID0gY2xvc2V5KDIwKTtcblxuZm9yKHZhciBpID0gMDsgaSA8IDEwMDsgaSsrKXtcbiAgICB2YXIgeCA9IHBhcnNlSW50KE1hdGgucmFuZG9tKCkgKiAxMDApLFxuICAgICAgICB5ID0gcGFyc2VJbnQoTWF0aC5yYW5kb20oKSAqIDEwMCksXG4gICAgICAgIGl0ZW0gPSBbeCwgeSwgeCArIE1hdGgucmFuZG9tKCkgKiAzLCB5ICsgTWF0aC5yYW5kb20oKSAqIDNdO1xuXG4gICAgaXRlbS52ZWxvY2l0eSA9IFtcbiAgICAgICAgKE1hdGgucmFuZG9tKCkgLSAwLjUpICogMC4xLFxuICAgICAgICAoTWF0aC5yYW5kb20oKSAtIDAuNSkgKiAwLjFcbiAgICBdO1xuXG4gICAgZG9vYnkuYWRkKGl0ZW0pO1xufVxuXG52YXIgc2VhcmNoUmVnaW9ucyA9IFtdO1xuXG5mb3IodmFyIGkgPSAwOyBpIDwgMTA7IGkrKyl7XG4gICAgdmFyIHggPSBwYXJzZUludChNYXRoLnJhbmRvbSgpICogMTAwKSxcbiAgICAgICAgeSA9IHBhcnNlSW50KE1hdGgucmFuZG9tKCkgKiAxMDApLFxuICAgICAgICBzZWFyY2hSZWdpb24gPSBbeCwgeSwgeCArIE1hdGgucmFuZG9tKCkgKiAzMCwgeSArIE1hdGgucmFuZG9tKCkgKiAzMF07XG5cbiAgICBzZWFyY2hSZWdpb24udmVsb2NpdHkgPSBbXG4gICAgICAgIChNYXRoLnJhbmRvbSgpIC0gMC41KSAqIDAuMSxcbiAgICAgICAgKE1hdGgucmFuZG9tKCkgLSAwLjUpICogMC4xXG4gICAgXTtcblxuICAgIHNlYXJjaFJlZ2lvbnMucHVzaChzZWFyY2hSZWdpb24pO1xufVxuXG52YXIgcmVzdWx0cyA9IFtdO1xuXG5zZXRJbnRlcnZhbChmdW5jdGlvbigpe1xuICAgIHNlYXJjaFJlZ2lvbnMuZm9yRWFjaChmdW5jdGlvbihyZWdpb24pe1xuICAgICAgICByZWdpb25bMF0gKz0gcmVnaW9uLnZlbG9jaXR5WzBdO1xuICAgICAgICByZWdpb25bMV0gKz0gcmVnaW9uLnZlbG9jaXR5WzFdO1xuICAgICAgICByZWdpb25bMl0gKz0gcmVnaW9uLnZlbG9jaXR5WzBdO1xuICAgICAgICByZWdpb25bM10gKz0gcmVnaW9uLnZlbG9jaXR5WzFdO1xuICAgIH0pO1xuICAgIGRvb2J5LmFsbCgpLmZvckVhY2goZnVuY3Rpb24oaXRlbSl7XG4gICAgICAgIGl0ZW1bMF0gKz0gaXRlbS52ZWxvY2l0eVswXTtcbiAgICAgICAgaXRlbVsxXSArPSBpdGVtLnZlbG9jaXR5WzFdO1xuICAgICAgICBpdGVtWzJdICs9IGl0ZW0udmVsb2NpdHlbMF07XG4gICAgICAgIGl0ZW1bM10gKz0gaXRlbS52ZWxvY2l0eVsxXTtcbiAgICB9KTtcbiAgICByZXN1bHRzID0gc2VhcmNoUmVnaW9ucy5tYXAoZG9vYnkuc2VhcmNoKTtcblxuICAgIGRvb2J5LnVwZGF0ZSgpO1xufSwgMTYpO1xuXG5mdW5jdGlvbiByZW5kZXJCb3goY29udGV4dCwgYm94LCBjb2xvcil7XG4gICAgY29udGV4dC5maWxsU3R5bGUgPSBjb2xvciB8fCAncmdiYSgwLDAsMCwwLjEpJztcbiAgICBjb250ZXh0LmZpbGxSZWN0KFxuICAgICAgICBib3hbMF0gKiAxMCxcbiAgICAgICAgYm94WzFdICogMTAsXG4gICAgICAgIChib3hbMl0gLSBib3hbMF0pICogMTAsXG4gICAgICAgIChib3hbM10gLSBib3hbMV0pICogMTBcbiAgICApO1xuICAgIGNvbnRleHQuc3Ryb2tlUmVjdChcbiAgICAgICAgYm94WzBdICogMTAsXG4gICAgICAgIGJveFsxXSAqIDEwLFxuICAgICAgICAoYm94WzJdIC0gYm94WzBdKSAqIDEwLFxuICAgICAgICAoYm94WzNdIC0gYm94WzFdKSAqIDEwXG4gICAgKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyTm9kZShjb250ZXh0LCBub2RlKXtcbiAgICBpZighbm9kZSl7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZW5kZXJCb3goY29udGV4dCwgbm9kZS5ib3VuZHMpO1xuXG4gICAgaWYobm9kZS5xdWFkcmFudHMpe1xuICAgICAgICBub2RlLnF1YWRyYW50cy5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpe1xuICAgICAgICAgICAgcmVuZGVyTm9kZShjb250ZXh0LCBub2RlKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG53aW5kb3cub25sb2FkID0gZnVuY3Rpb24oKXtcblxuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKSxcbiAgICAgICAgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgY2FudmFzLmhlaWdodCA9IDEwMDA7XG4gICAgY2FudmFzLndpZHRoID0gMTAwMDtcblxuICAgIGZ1bmN0aW9uIHJlbmRlcigpe1xuXG4gICAgICAgIGNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cbiAgICAgICAgcmVuZGVyTm9kZShjb250ZXh0LCBkb29ieS5yb290KCkpO1xuXG4gICAgICAgIHNlYXJjaFJlZ2lvbnMuZm9yRWFjaChmdW5jdGlvbihzZWFyY2hSZWdpb24pe1xuICAgICAgICAgICAgcmVuZGVyQm94KGNvbnRleHQsIHNlYXJjaFJlZ2lvbiwgJ3JnYmEoMCwwLDI1NSwwLjUpJyk7XG4gICAgICAgIH0pXG5cbiAgICAgICAgZG9vYnkuYWxsKCkuZm9yRWFjaChmdW5jdGlvbihpdGVtKXtcbiAgICAgICAgICAgIHJlbmRlckJveChjb250ZXh0LFxuICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgaXRlbVswXSxcbiAgICAgICAgICAgICAgICAgICAgaXRlbVsxXSxcbiAgICAgICAgICAgICAgICAgICAgaXRlbVsyXSxcbiAgICAgICAgICAgICAgICAgICAgaXRlbVszXSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICdyZ2JhKDI1NSwwLDAsMC41KSdcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciByZW5kZXJSZXN1bHRzID0gbmV3IFNldCgpO1xuXG4gICAgICAgIHJlc3VsdHMuZm9yRWFjaChmdW5jdGlvbihpdGVtcyl7XG4gICAgICAgICAgICBpdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pe1xuICAgICAgICAgICAgICAgIHJlbmRlclJlc3VsdHMuYWRkKGl0ZW0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlbmRlclJlc3VsdHMuZm9yRWFjaChmdW5jdGlvbihpdGVtKXtcbiAgICAgICAgICAgIHJlbmRlckJveChjb250ZXh0LFxuICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgaXRlbVswXSxcbiAgICAgICAgICAgICAgICAgICAgaXRlbVsxXSxcbiAgICAgICAgICAgICAgICAgICAgaXRlbVsyXSxcbiAgICAgICAgICAgICAgICAgICAgaXRlbVszXSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICdyZ2JhKDAsMjU1LDAsMC41KSdcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXIpO1xuICAgIH1cblxuICAgIHJlbmRlcigpO1xuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjYW52YXMpO1xufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obWF4QmluU2l6ZSl7XG4gICAgbWF4QmluU2l6ZSA9IG1heEJpblNpemUgfHwgMTA7XG4gICAgZnVuY3Rpb24gY3JlYXRlTm9kZShib3VuZHMpe1xuICAgICAgICB2YXIgc2l6ZSA9IGJvdW5kc1syXSAtIGJvdW5kc1swXSxcbiAgICAgICAgICAgIG5vZGUgPSB7XG4gICAgICAgICAgICAgICAgYm91bmRzOiBib3VuZHMsXG4gICAgICAgICAgICAgICAgc2l6ZTogc2l6ZSxcbiAgICAgICAgICAgICAgICBoYWxmU2l6ZTogc2l6ZSAvIDIsXG4gICAgICAgICAgICAgICAgaXRlbXM6IFtdXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cblxuICAgIHZhciByb290LFxuICAgICAgICBhbGxJdGVtcztcblxuICAgIGZ1bmN0aW9uIHJlc2V0KCl7XG4gICAgICAgIHJvb3QgPSBjcmVhdGVOb2RlKFswLCAwLCA2NCwgNjRdKTtcbiAgICAgICAgYWxsSXRlbXMgPSBuZXcgU2V0KCk7XG4gICAgfVxuICAgIHJlc2V0KCk7XG5cbiAgICBmdW5jdGlvbiBhZGRRdWFkcmFudChwYXJlbnQsIGluZGV4KXtcbiAgICAgICAgdmFyIHBhcmVudFNpemUgPSBwYXJlbnQuc2l6ZSxcbiAgICAgICAgICAgIGhhbGZTaXplID0gcGFyZW50LmhhbGZTaXplLFxuICAgICAgICAgICAgcmlnaHQgPSBpbmRleCUyLFxuICAgICAgICAgICAgYm90dG9tID0gaW5kZXg+PTI7XG5cbiAgICAgICAgcmV0dXJuIGNyZWF0ZU5vZGUoW1xuICAgICAgICAgICAgcGFyZW50LmJvdW5kc1swXSArIChyaWdodCA/IGhhbGZTaXplIDogMCksXG4gICAgICAgICAgICBwYXJlbnQuYm91bmRzWzFdICsgKGJvdHRvbSA/IGhhbGZTaXplIDogMCksXG4gICAgICAgICAgICBwYXJlbnQuYm91bmRzWzJdIC0gKHJpZ2h0ID8gMCA6IGhhbGZTaXplKSxcbiAgICAgICAgICAgIHBhcmVudC5ib3VuZHNbM10gLSAoYm90dG9tID8gMCA6IGhhbGZTaXplKVxuICAgICAgICBdKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRQYXJlbnROb2RlKG9mZnNldCwgY2hpbGROb2RlKXtcbiAgICAgICAgdmFyIGNoaWxkVG9MZWZ0ID0gb2Zmc2V0WzBdID4gMCxcbiAgICAgICAgICAgIGNoaWxkVG9Ub3AgPSBvZmZzZXRbMV0gPiAwLFxuICAgICAgICAgICAgY2hpbGRTaXplID0gY2hpbGROb2RlLnNpemU7XG5cbiAgICAgICAgcm9vdCA9IGNyZWF0ZU5vZGUoW1xuICAgICAgICAgICAgY2hpbGROb2RlLmJvdW5kc1swXSAtIChjaGlsZFRvTGVmdCA/IDAgOiBjaGlsZFNpemUpLFxuICAgICAgICAgICAgY2hpbGROb2RlLmJvdW5kc1sxXSAtIChjaGlsZFRvVG9wID8gMCA6IGNoaWxkU2l6ZSksXG4gICAgICAgICAgICBjaGlsZE5vZGUuYm91bmRzWzJdICsgY2hpbGRTaXplICogKGNoaWxkVG9MZWZ0ID8gMSA6IDApLFxuICAgICAgICAgICAgY2hpbGROb2RlLmJvdW5kc1szXSArIGNoaWxkU2l6ZSAqIChjaGlsZFRvVG9wID8gMSA6IDApXG4gICAgICAgIF0pO1xuXG4gICAgICAgIHJvb3QucXVhZHJhbnRzID0gW1xuICAgICAgICAgICAgKGNoaWxkVG9MZWZ0ICYmIGNoaWxkVG9Ub3ApID8gY2hpbGROb2RlIDogYWRkUXVhZHJhbnQocm9vdCwgMCksXG4gICAgICAgICAgICAoIWNoaWxkVG9MZWZ0ICYmIGNoaWxkVG9Ub3ApID8gY2hpbGROb2RlIDogYWRkUXVhZHJhbnQocm9vdCwgMSksXG4gICAgICAgICAgICAoY2hpbGRUb0xlZnQgJiYgIWNoaWxkVG9Ub3ApID8gY2hpbGROb2RlIDogYWRkUXVhZHJhbnQocm9vdCwgMiksXG4gICAgICAgICAgICAoIWNoaWxkVG9MZWZ0ICYmICFjaGlsZFRvVG9wKSA/IGNoaWxkTm9kZSA6IGFkZFF1YWRyYW50KHJvb3QsIDMpXG4gICAgICAgIF07XG5cbiAgICAgICAgcmV0dXJuIHJvb3Q7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW5zZXJ0SW50byhub2RlLCBib3gpe1xuICAgICAgICB2YXIgZml0cyA9XG4gICAgICAgICAgICBib3hbMF0gLSBib3hbMl0gPCBub2RlLmhhbGZTaXplICYmXG4gICAgICAgICAgICBib3hbMV0gLSBib3hbM10gPCBub2RlLmhhbGZTaXplLFxuICAgICAgICAgICAgaG9yaXpDZW50cmUgPSBub2RlLmJvdW5kc1swXSArIG5vZGUuaGFsZlNpemUsXG4gICAgICAgICAgICB2ZXJ0Q2VudHJlID0gbm9kZS5ib3VuZHNbMV0gKyBub2RlLmhhbGZTaXplLFxuICAgICAgICAgICAgbGVmdCA9IGJveFsyXSA8IGhvcml6Q2VudHJlLFxuICAgICAgICAgICAgcmlnaHQgPSBib3hbMF0gPiBob3JpekNlbnRyZSxcbiAgICAgICAgICAgIGhvcml6ID0gbGVmdCBeIHJpZ2h0LFxuICAgICAgICAgICAgdG9wID0gYm94WzNdIDwgdmVydENlbnRyZSxcbiAgICAgICAgICAgIGJvdHRvbSA9IGJveFsxXSA+IHZlcnRDZW50cmUsXG4gICAgICAgICAgICB2ZXJ0ID0gdG9wIF4gYm90dG9tO1xuXG4gICAgICAgIGlmKG5vZGUuaXRlbXMubGVuZ3RoID4gbWF4QmluU2l6ZSAmJiBmaXRzICYmIGhvcml6ICYmIHZlcnQpe1xuICAgICAgICAgICAgdmFyIGluZGV4ID1cbiAgICAgICAgICAgICAgICAobGVmdCA/IDAgOiAxKSArXG4gICAgICAgICAgICAgICAgKHRvcCA/IDAgOiAyKTtcblxuICAgICAgICAgICAgaWYoIW5vZGUucXVhZHJhbnRzKXtcbiAgICAgICAgICAgICAgICBub2RlLnF1YWRyYW50cyA9IFtdO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIGluc2VydEludG8oXG4gICAgICAgICAgICAgICAgbm9kZS5xdWFkcmFudHNbaW5kZXhdIHx8IChcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5xdWFkcmFudHNbaW5kZXhdID0gYWRkUXVhZHJhbnQobm9kZSwgaW5kZXgpXG4gICAgICAgICAgICAgICAgKSwgYm94KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG5vZGUuaXRlbXMucHVzaChib3gpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkZChib3gpe1xuICAgICAgICBhbGxJdGVtcy5hZGQoYm94KTtcblxuICAgICAgICB2YXIgdGFyZ2V0Tm9kZSA9IHJvb3Q7XG5cbiAgICAgICAgdmFyIHggPSBib3hbMF0gPCB0YXJnZXROb2RlLmJvdW5kc1swXSA/IC0xIDogYm94WzJdID49IHRhcmdldE5vZGUuYm91bmRzWzJdID8gMSA6IDA7XG4gICAgICAgIHZhciB5ID0gYm94WzFdIDwgdGFyZ2V0Tm9kZS5ib3VuZHNbMV0gPyAtMSA6IGJveFszXSA+PSB0YXJnZXROb2RlLmJvdW5kc1szXSA/IDEgOiAwO1xuXG4gICAgICAgIGlmKHggfHwgeSl7XG4gICAgICAgICAgICB0YXJnZXROb2RlID0gYWRkUGFyZW50Tm9kZShbeCwgeV0sIHRhcmdldE5vZGUpO1xuICAgICAgICAgICAgYWRkKGJveCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpbnNlcnRJbnRvKHRhcmdldE5vZGUsIGJveCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkU2VhcmNoUmVzdWx0KGl0ZW0pe1xuICAgICAgICB2YXIgYm94ID0gdGhpc1swXTtcblxuICAgICAgICBpZihcbiAgICAgICAgICAgIGl0ZW1bMF0gPD0gYm94WzJdICYmXG4gICAgICAgICAgICBpdGVtWzJdID49IGJveFswXSAmJlxuICAgICAgICAgICAgaXRlbVsxXSA8PSBib3hbM10gJiZcbiAgICAgICAgICAgIGl0ZW1bM10gPj0gYm94WzFdXG4gICAgICAgICl7XG4gICAgICAgICAgICB0aGlzWzFdLnB1c2goaXRlbSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZWFyY2hOb2RlKG5vZGUpe1xuICAgICAgICB2YXIgc2VhcmNoQm94ID0gdGhpc1swXSxcbiAgICAgICAgICAgIHJlc3VsdHMgPSB0aGlzWzFdO1xuXG4gICAgICAgIGlmKCFub2RlIHx8XG4gICAgICAgICAgICBub2RlLmJvdW5kc1swXSA+IHNlYXJjaEJveFsyXSB8fFxuICAgICAgICAgICAgbm9kZS5ib3VuZHNbMl0gPD0gc2VhcmNoQm94WzBdIHx8XG4gICAgICAgICAgICBub2RlLmJvdW5kc1sxXSA+IHNlYXJjaEJveFszXSB8fFxuICAgICAgICAgICAgbm9kZS5ib3VuZHNbM10gPD0gc2VhcmNoQm94WzFdXG4gICAgICAgICl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZihub2RlLnF1YWRyYW50cyl7XG4gICAgICAgICAgICBzZWFyY2hOb2RlLmNhbGwodGhpcywgbm9kZS5xdWFkcmFudHNbMF0pO1xuICAgICAgICAgICAgc2VhcmNoTm9kZS5jYWxsKHRoaXMsIG5vZGUucXVhZHJhbnRzWzFdKTtcbiAgICAgICAgICAgIHNlYXJjaE5vZGUuY2FsbCh0aGlzLCBub2RlLnF1YWRyYW50c1syXSk7XG4gICAgICAgICAgICBzZWFyY2hOb2RlLmNhbGwodGhpcywgbm9kZS5xdWFkcmFudHNbM10pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoXG4gICAgICAgICAgICBub2RlLmJvdW5kc1swXSA+PSBzZWFyY2hCb3hbMF0gJiZcbiAgICAgICAgICAgIG5vZGUuYm91bmRzWzJdIDwgc2VhcmNoQm94WzJdICYmXG4gICAgICAgICAgICBub2RlLmJvdW5kc1sxXSA+PSBzZWFyY2hCb3hbMV0gJiZcbiAgICAgICAgICAgIG5vZGUuYm91bmRzWzNdIDwgc2VhcmNoQm94WzNdXG4gICAgICAgICl7XG4gICAgICAgICAgICByZXN1bHRzLnB1c2guYXBwbHkocmVzdWx0cywgbm9kZS5pdGVtcyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgbm9kZS5pdGVtcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICBhZGRTZWFyY2hSZXN1bHQuY2FsbCh0aGlzLCBub2RlLml0ZW1zW2ldKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNlYXJjaChib3gpe1xuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuXG4gICAgICAgIHNlYXJjaE5vZGUuY2FsbChbYm94LCByZXN1bHRzXSwgcm9vdCk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVtb3ZlKHBvc2l0aW9uKXtcbiAgICAgICAgYWxsSXRlbXMuZGVsZXRlKHBvc2l0aW9uKTtcbiAgICAgICAgdXBkYXRlKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdXBkYXRlKCl7XG4gICAgICAgIHZhciBwcmV2aW91c0l0ZW1zID0gYWxsSXRlbXM7XG4gICAgICAgIHJlc2V0KCk7XG4gICAgICAgIHByZXZpb3VzSXRlbXMuZm9yRWFjaChhZGQpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGFkZDogYWRkLFxuICAgICAgICByZW1vdmU6IHJlbW92ZSxcbiAgICAgICAgdXBkYXRlOiB1cGRhdGUsXG4gICAgICAgIHNlYXJjaDogc2VhcmNoLFxuICAgICAgICByb290OiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuIHJvb3Q7XG4gICAgICAgIH0sXG4gICAgICAgIGFsbDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiBBcnJheS5mcm9tKGFsbEl0ZW1zKTtcbiAgICAgICAgfVxuICAgIH07XG59Il19
