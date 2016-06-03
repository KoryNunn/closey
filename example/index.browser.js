(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var closey = require('../');

var dooby = closey(10);

for(var i = 0; i < 100; i++){
    dooby.add([parseInt(Math.random() * 100), parseInt(Math.random() * 100)]);
}

dooby.add([74, 50]);

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
},{"../":2}],2:[function(require,module,exports){
module.exports = function(maxBinSize, minResolution){
    maxBinSize = maxBinSize || 10;
    minResolution = minResolution || 0.01;

    function createNode(bounds, isMinResolution){
        var size = bounds[2] - bounds[0],
            node = {
                bounds: bounds,
                size: size,
                halfSize: size / 2,
                items: [],
                maxItems: isMinResolution ? Infinity : maxBinSize
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
            bottom = index>2;

        return createNode([
            parent.bounds[0] + (right ? halfSize : 0),
            parent.bounds[1] + (bottom ? halfSize : 0),
            parent.bounds[2] - (right ? 0 : halfSize),
            parent.bounds[3] - (bottom ? 0 : halfSize)
        ], parentSize < minResolution);
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

    function insertIntoQuadrant(node, position){
        if(!node.quadrants){
            node.quadrants = [];
        }

        var index = (position[0] < node.bounds[0] + node.halfSize ? 0 : 1) +
                (position[1] < node.bounds[1] + node.halfSize ? 0 : 2);

        insertInto(node.quadrants[index] || (node.quadrants[index] = addQuadrant(node, index)), position);
    }

    function insertInto(node, position){
        if(node.quadrants){
            insertIntoQuadrant(node, position);
            return;
        }

        node.items.push(position);

        if(
            node.items.length > node.maxItems
        ){
            while(node.items.length){
                insertIntoQuadrant(node, node.items.pop());
            }
        }
    }

    function add(position){
        allItems.add(position);

        var targetNode = root;

        var x = position[0] < targetNode.bounds[0] ? -1 : position[0] >= targetNode.bounds[2] ? 1 : 0;
        var y = position[1] < targetNode.bounds[1] ? -1 : position[1] >= targetNode.bounds[3] ? 1 : 0;

        if(x || y){
            targetNode = addParentNode([x, y], targetNode);
            add(position);
            return;
        }

        insertInto(targetNode, position);
    }

    function searchNode(node){
        var box = this[0],
            results = this[1];

        if(
            node.bounds[0] > box[2] ||
            node.bounds[2] <= box[0] ||
            node.bounds[1] > box[3] ||
            node.bounds[3] <= box[1]
        ){
            return;
        }

        if(node.quadrants){
            return node.quadrants.forEach(searchNode, this);
        }

        if(
            node.bounds[0] >= box[0] &&
            node.bounds[2] < box[2] &&
            node.bounds[1] >= box[1] &&
            node.bounds[3] < box[3]
        ){
            results.push.apply(results, node.items);
            return;
        }

        node.items.forEach(function(item){
            if(
                item[0] >= box[0] &&
                item[0] < box[2] &&
                item[1] >= box[1] &&
                item[1] < box[3]
            ){
                results.push(item);
            }
        });
    }

    function search(box){
        var results = [];

        searchNode.call([box, results], root);

        return results;
    }

    function removeNode(node){
        var position = this;

        if(
            position[0] >= node.bounds[2] ||
            position[1] >= node.bounds[3] ||
            position[0] < node.bounds[0] ||
            position[1] < node.bounds[1]
        ){
            return;
        }

        if(node.quadrants){
            return node.quadrants.forEach(removeNode, this);
        }

        var index;

        while(index = node.items.indexOf(position), ~index){
            node.items.splice(index, 1);
        }
    }

    function remove(position){
        update();
        removeNode.call(position, root);
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlL2luZGV4LmpzIiwiaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGNsb3NleSA9IHJlcXVpcmUoJy4uLycpO1xuXG52YXIgZG9vYnkgPSBjbG9zZXkoMTApO1xuXG5mb3IodmFyIGkgPSAwOyBpIDwgMTAwOyBpKyspe1xuICAgIGRvb2J5LmFkZChbcGFyc2VJbnQoTWF0aC5yYW5kb20oKSAqIDEwMCksIHBhcnNlSW50KE1hdGgucmFuZG9tKCkgKiAxMDApXSk7XG59XG5cbmRvb2J5LmFkZChbNzQsIDUwXSk7XG5cbnZhciBzZWFyY2hSZWdpb24gPSBbMjUsMjUsNzUsNzVdLFxuICAgIHJlc3VsdHMgPSBkb29ieS5zZWFyY2goc2VhcmNoUmVnaW9uKTtcblxuZnVuY3Rpb24gcmVuZGVyQm94KGNvbnRleHQsIGJveCwgY29sb3Ipe1xuICAgIGNvbnRleHQuZmlsbFN0eWxlID0gY29sb3IgfHwgJ3JnYmEoMCwwLDAsMC4xKSc7XG4gICAgY29udGV4dC5maWxsUmVjdChcbiAgICAgICAgYm94WzBdICogMTAsXG4gICAgICAgIGJveFsxXSAqIDEwLFxuICAgICAgICAoYm94WzJdIC0gYm94WzBdKSAqIDEwLFxuICAgICAgICAoYm94WzNdIC0gYm94WzFdKSAqIDEwXG4gICAgKTtcbiAgICBjb250ZXh0LnN0cm9rZVJlY3QoXG4gICAgICAgIGJveFswXSAqIDEwLFxuICAgICAgICBib3hbMV0gKiAxMCxcbiAgICAgICAgKGJveFsyXSAtIGJveFswXSkgKiAxMCxcbiAgICAgICAgKGJveFszXSAtIGJveFsxXSkgKiAxMFxuICAgICk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlck5vZGUoY29udGV4dCwgbm9kZSl7XG4gICAgaWYoIW5vZGUpe1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmVuZGVyQm94KGNvbnRleHQsIG5vZGUuYm91bmRzKTtcblxuICAgIGlmKG5vZGUucXVhZHJhbnRzKXtcbiAgICAgICAgbm9kZS5xdWFkcmFudHMuZm9yRWFjaChmdW5jdGlvbihub2RlKXtcbiAgICAgICAgICAgIHJlbmRlck5vZGUoY29udGV4dCwgbm9kZSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCl7XG5cbiAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyksXG4gICAgICAgIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIGNhbnZhcy5oZWlnaHQgPSAxMDAwO1xuICAgIGNhbnZhcy53aWR0aCA9IDEwMDA7XG5cbiAgICBmdW5jdGlvbiByZW5kZXIoKXtcblxuICAgICAgICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXG4gICAgICAgIHJlbmRlck5vZGUoY29udGV4dCwgZG9vYnkucm9vdCgpKTtcbiAgICAgICAgcmVuZGVyQm94KGNvbnRleHQsIHNlYXJjaFJlZ2lvbiwgJ3JnYmEoMCwwLDI1NSwwLjUpJyk7XG5cbiAgICAgICAgZG9vYnkuYWxsKCkuZm9yRWFjaChmdW5jdGlvbihpdGVtKXtcbiAgICAgICAgICAgIHJlbmRlckJveChjb250ZXh0LFxuICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgaXRlbVswXSxcbiAgICAgICAgICAgICAgICAgICAgaXRlbVsxXSxcbiAgICAgICAgICAgICAgICAgICAgaXRlbVswXSsxLFxuICAgICAgICAgICAgICAgICAgICBpdGVtWzFdKzEsXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAncmdiYSgyNTUsMCwwLDAuNSknXG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXN1bHRzLmZvckVhY2goZnVuY3Rpb24oaXRlbSl7XG4gICAgICAgICAgICByZW5kZXJCb3goY29udGV4dCxcbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1bMF0sXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1bMV0sXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1bMF0rMSxcbiAgICAgICAgICAgICAgICAgICAgaXRlbVsxXSsxLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgJ3JnYmEoMCwyNTUsMCwwLjUpJ1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlbmRlcik7XG4gICAgfVxuXG4gICAgcmVuZGVyKCk7XG5cbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNhbnZhcyk7XG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihtYXhCaW5TaXplLCBtaW5SZXNvbHV0aW9uKXtcbiAgICBtYXhCaW5TaXplID0gbWF4QmluU2l6ZSB8fCAxMDtcbiAgICBtaW5SZXNvbHV0aW9uID0gbWluUmVzb2x1dGlvbiB8fCAwLjAxO1xuXG4gICAgZnVuY3Rpb24gY3JlYXRlTm9kZShib3VuZHMsIGlzTWluUmVzb2x1dGlvbil7XG4gICAgICAgIHZhciBzaXplID0gYm91bmRzWzJdIC0gYm91bmRzWzBdLFxuICAgICAgICAgICAgbm9kZSA9IHtcbiAgICAgICAgICAgICAgICBib3VuZHM6IGJvdW5kcyxcbiAgICAgICAgICAgICAgICBzaXplOiBzaXplLFxuICAgICAgICAgICAgICAgIGhhbGZTaXplOiBzaXplIC8gMixcbiAgICAgICAgICAgICAgICBpdGVtczogW10sXG4gICAgICAgICAgICAgICAgbWF4SXRlbXM6IGlzTWluUmVzb2x1dGlvbiA/IEluZmluaXR5IDogbWF4QmluU2l6ZVxuICAgICAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG5cbiAgICB2YXIgcm9vdCxcbiAgICAgICAgYWxsSXRlbXM7XG5cbiAgICBmdW5jdGlvbiByZXNldCgpe1xuICAgICAgICByb290ID0gY3JlYXRlTm9kZShbMCwgMCwgNjQsIDY0XSk7XG4gICAgICAgIGFsbEl0ZW1zID0gbmV3IFNldCgpO1xuICAgIH1cbiAgICByZXNldCgpO1xuXG4gICAgZnVuY3Rpb24gYWRkUXVhZHJhbnQocGFyZW50LCBpbmRleCl7XG4gICAgICAgIHZhciBwYXJlbnRTaXplID0gcGFyZW50LnNpemUsXG4gICAgICAgICAgICBoYWxmU2l6ZSA9IHBhcmVudC5oYWxmU2l6ZSxcbiAgICAgICAgICAgIHJpZ2h0ID0gaW5kZXglMixcbiAgICAgICAgICAgIGJvdHRvbSA9IGluZGV4PjI7XG5cbiAgICAgICAgcmV0dXJuIGNyZWF0ZU5vZGUoW1xuICAgICAgICAgICAgcGFyZW50LmJvdW5kc1swXSArIChyaWdodCA/IGhhbGZTaXplIDogMCksXG4gICAgICAgICAgICBwYXJlbnQuYm91bmRzWzFdICsgKGJvdHRvbSA/IGhhbGZTaXplIDogMCksXG4gICAgICAgICAgICBwYXJlbnQuYm91bmRzWzJdIC0gKHJpZ2h0ID8gMCA6IGhhbGZTaXplKSxcbiAgICAgICAgICAgIHBhcmVudC5ib3VuZHNbM10gLSAoYm90dG9tID8gMCA6IGhhbGZTaXplKVxuICAgICAgICBdLCBwYXJlbnRTaXplIDwgbWluUmVzb2x1dGlvbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkUGFyZW50Tm9kZShvZmZzZXQsIGNoaWxkTm9kZSl7XG4gICAgICAgIHZhciBjaGlsZFRvTGVmdCA9IG9mZnNldFswXSA+IDAsXG4gICAgICAgICAgICBjaGlsZFRvVG9wID0gb2Zmc2V0WzFdID4gMCxcbiAgICAgICAgICAgIGNoaWxkU2l6ZSA9IGNoaWxkTm9kZS5zaXplO1xuXG4gICAgICAgIHJvb3QgPSBjcmVhdGVOb2RlKFtcbiAgICAgICAgICAgIGNoaWxkTm9kZS5ib3VuZHNbMF0gLSAoY2hpbGRUb0xlZnQgPyAwIDogY2hpbGRTaXplKSxcbiAgICAgICAgICAgIGNoaWxkTm9kZS5ib3VuZHNbMV0gLSAoY2hpbGRUb1RvcCA/IDAgOiBjaGlsZFNpemUpLFxuICAgICAgICAgICAgY2hpbGROb2RlLmJvdW5kc1syXSArIGNoaWxkU2l6ZSAqIChjaGlsZFRvTGVmdCA/IDEgOiAwKSxcbiAgICAgICAgICAgIGNoaWxkTm9kZS5ib3VuZHNbM10gKyBjaGlsZFNpemUgKiAoY2hpbGRUb1RvcCA/IDEgOiAwKVxuICAgICAgICBdKTtcblxuICAgICAgICByb290LnF1YWRyYW50cyA9IFtcbiAgICAgICAgICAgIChjaGlsZFRvTGVmdCAmJiBjaGlsZFRvVG9wKSA/IGNoaWxkTm9kZSA6IGFkZFF1YWRyYW50KHJvb3QsIDApLFxuICAgICAgICAgICAgKCFjaGlsZFRvTGVmdCAmJiBjaGlsZFRvVG9wKSA/IGNoaWxkTm9kZSA6IGFkZFF1YWRyYW50KHJvb3QsIDEpLFxuICAgICAgICAgICAgKGNoaWxkVG9MZWZ0ICYmICFjaGlsZFRvVG9wKSA/IGNoaWxkTm9kZSA6IGFkZFF1YWRyYW50KHJvb3QsIDIpLFxuICAgICAgICAgICAgKCFjaGlsZFRvTGVmdCAmJiAhY2hpbGRUb1RvcCkgPyBjaGlsZE5vZGUgOiBhZGRRdWFkcmFudChyb290LCAzKVxuICAgICAgICBdO1xuXG4gICAgICAgIHJldHVybiByb290O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGluc2VydEludG9RdWFkcmFudChub2RlLCBwb3NpdGlvbil7XG4gICAgICAgIGlmKCFub2RlLnF1YWRyYW50cyl7XG4gICAgICAgICAgICBub2RlLnF1YWRyYW50cyA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGluZGV4ID0gKHBvc2l0aW9uWzBdIDwgbm9kZS5ib3VuZHNbMF0gKyBub2RlLmhhbGZTaXplID8gMCA6IDEpICtcbiAgICAgICAgICAgICAgICAocG9zaXRpb25bMV0gPCBub2RlLmJvdW5kc1sxXSArIG5vZGUuaGFsZlNpemUgPyAwIDogMik7XG5cbiAgICAgICAgaW5zZXJ0SW50byhub2RlLnF1YWRyYW50c1tpbmRleF0gfHwgKG5vZGUucXVhZHJhbnRzW2luZGV4XSA9IGFkZFF1YWRyYW50KG5vZGUsIGluZGV4KSksIHBvc2l0aW9uKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbnNlcnRJbnRvKG5vZGUsIHBvc2l0aW9uKXtcbiAgICAgICAgaWYobm9kZS5xdWFkcmFudHMpe1xuICAgICAgICAgICAgaW5zZXJ0SW50b1F1YWRyYW50KG5vZGUsIHBvc2l0aW9uKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG5vZGUuaXRlbXMucHVzaChwb3NpdGlvbik7XG5cbiAgICAgICAgaWYoXG4gICAgICAgICAgICBub2RlLml0ZW1zLmxlbmd0aCA+IG5vZGUubWF4SXRlbXNcbiAgICAgICAgKXtcbiAgICAgICAgICAgIHdoaWxlKG5vZGUuaXRlbXMubGVuZ3RoKXtcbiAgICAgICAgICAgICAgICBpbnNlcnRJbnRvUXVhZHJhbnQobm9kZSwgbm9kZS5pdGVtcy5wb3AoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGQocG9zaXRpb24pe1xuICAgICAgICBhbGxJdGVtcy5hZGQocG9zaXRpb24pO1xuXG4gICAgICAgIHZhciB0YXJnZXROb2RlID0gcm9vdDtcblxuICAgICAgICB2YXIgeCA9IHBvc2l0aW9uWzBdIDwgdGFyZ2V0Tm9kZS5ib3VuZHNbMF0gPyAtMSA6IHBvc2l0aW9uWzBdID49IHRhcmdldE5vZGUuYm91bmRzWzJdID8gMSA6IDA7XG4gICAgICAgIHZhciB5ID0gcG9zaXRpb25bMV0gPCB0YXJnZXROb2RlLmJvdW5kc1sxXSA/IC0xIDogcG9zaXRpb25bMV0gPj0gdGFyZ2V0Tm9kZS5ib3VuZHNbM10gPyAxIDogMDtcblxuICAgICAgICBpZih4IHx8IHkpe1xuICAgICAgICAgICAgdGFyZ2V0Tm9kZSA9IGFkZFBhcmVudE5vZGUoW3gsIHldLCB0YXJnZXROb2RlKTtcbiAgICAgICAgICAgIGFkZChwb3NpdGlvbik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpbnNlcnRJbnRvKHRhcmdldE5vZGUsIHBvc2l0aW9uKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZWFyY2hOb2RlKG5vZGUpe1xuICAgICAgICB2YXIgYm94ID0gdGhpc1swXSxcbiAgICAgICAgICAgIHJlc3VsdHMgPSB0aGlzWzFdO1xuXG4gICAgICAgIGlmKFxuICAgICAgICAgICAgbm9kZS5ib3VuZHNbMF0gPiBib3hbMl0gfHxcbiAgICAgICAgICAgIG5vZGUuYm91bmRzWzJdIDw9IGJveFswXSB8fFxuICAgICAgICAgICAgbm9kZS5ib3VuZHNbMV0gPiBib3hbM10gfHxcbiAgICAgICAgICAgIG5vZGUuYm91bmRzWzNdIDw9IGJveFsxXVxuICAgICAgICApe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYobm9kZS5xdWFkcmFudHMpe1xuICAgICAgICAgICAgcmV0dXJuIG5vZGUucXVhZHJhbnRzLmZvckVhY2goc2VhcmNoTm9kZSwgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZihcbiAgICAgICAgICAgIG5vZGUuYm91bmRzWzBdID49IGJveFswXSAmJlxuICAgICAgICAgICAgbm9kZS5ib3VuZHNbMl0gPCBib3hbMl0gJiZcbiAgICAgICAgICAgIG5vZGUuYm91bmRzWzFdID49IGJveFsxXSAmJlxuICAgICAgICAgICAgbm9kZS5ib3VuZHNbM10gPCBib3hbM11cbiAgICAgICAgKXtcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaC5hcHBseShyZXN1bHRzLCBub2RlLml0ZW1zKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG5vZGUuaXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKXtcbiAgICAgICAgICAgIGlmKFxuICAgICAgICAgICAgICAgIGl0ZW1bMF0gPj0gYm94WzBdICYmXG4gICAgICAgICAgICAgICAgaXRlbVswXSA8IGJveFsyXSAmJlxuICAgICAgICAgICAgICAgIGl0ZW1bMV0gPj0gYm94WzFdICYmXG4gICAgICAgICAgICAgICAgaXRlbVsxXSA8IGJveFszXVxuICAgICAgICAgICAgKXtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goaXRlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNlYXJjaChib3gpe1xuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuXG4gICAgICAgIHNlYXJjaE5vZGUuY2FsbChbYm94LCByZXN1bHRzXSwgcm9vdCk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVtb3ZlTm9kZShub2RlKXtcbiAgICAgICAgdmFyIHBvc2l0aW9uID0gdGhpcztcblxuICAgICAgICBpZihcbiAgICAgICAgICAgIHBvc2l0aW9uWzBdID49IG5vZGUuYm91bmRzWzJdIHx8XG4gICAgICAgICAgICBwb3NpdGlvblsxXSA+PSBub2RlLmJvdW5kc1szXSB8fFxuICAgICAgICAgICAgcG9zaXRpb25bMF0gPCBub2RlLmJvdW5kc1swXSB8fFxuICAgICAgICAgICAgcG9zaXRpb25bMV0gPCBub2RlLmJvdW5kc1sxXVxuICAgICAgICApe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYobm9kZS5xdWFkcmFudHMpe1xuICAgICAgICAgICAgcmV0dXJuIG5vZGUucXVhZHJhbnRzLmZvckVhY2gocmVtb3ZlTm9kZSwgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaW5kZXg7XG5cbiAgICAgICAgd2hpbGUoaW5kZXggPSBub2RlLml0ZW1zLmluZGV4T2YocG9zaXRpb24pLCB+aW5kZXgpe1xuICAgICAgICAgICAgbm9kZS5pdGVtcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVtb3ZlKHBvc2l0aW9uKXtcbiAgICAgICAgdXBkYXRlKCk7XG4gICAgICAgIHJlbW92ZU5vZGUuY2FsbChwb3NpdGlvbiwgcm9vdCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdXBkYXRlKCl7XG4gICAgICAgIHZhciBwcmV2aW91c0l0ZW1zID0gYWxsSXRlbXM7XG4gICAgICAgIHJlc2V0KCk7XG4gICAgICAgIHByZXZpb3VzSXRlbXMuZm9yRWFjaChhZGQpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGFkZDogYWRkLFxuICAgICAgICByZW1vdmU6IHJlbW92ZSxcbiAgICAgICAgdXBkYXRlOiB1cGRhdGUsXG4gICAgICAgIHNlYXJjaDogc2VhcmNoLFxuICAgICAgICByb290OiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuIHJvb3Q7XG4gICAgICAgIH0sXG4gICAgICAgIGFsbDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiBBcnJheS5mcm9tKGFsbEl0ZW1zKTtcbiAgICAgICAgfVxuICAgIH07XG59Il19
