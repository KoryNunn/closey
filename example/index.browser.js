(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
            bottom = index>=2;

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

    function addSearchResult(item){
        var box = this[0];

        if(
            item[0] >= box[0] &&
            item[0] < box[2] &&
            item[1] >= box[1] &&
            item[1] < box[3]
        ){
            this[1].push(item);
        }
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

        node.items.forEach(addSearchResult, this);
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlL2luZGV4LmpzIiwiaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBjbG9zZXkgPSByZXF1aXJlKCcuLi8nKTtcblxudmFyIGRvb2J5ID0gY2xvc2V5KDEwKTtcblxuZm9yKHZhciBpID0gMDsgaSA8IDEwMDsgaSsrKXtcbiAgICAvLyBkb29ieS5hZGQoW3BhcnNlSW50KGkgLyAxMCkqMTAsIGklMTAqMTBdKTtcbiAgICBkb29ieS5hZGQoW3BhcnNlSW50KE1hdGgucmFuZG9tKCkgKiAxMDApLCBwYXJzZUludChNYXRoLnJhbmRvbSgpICogMTAwKV0pO1xufVxuY29uc29sZS5sb2coZG9vYnkuYWxsKCkpXG5cbnZhciBzZWFyY2hSZWdpb24gPSBbMjUsMjUsNzUsNzVdLFxuICAgIHJlc3VsdHMgPSBkb29ieS5zZWFyY2goc2VhcmNoUmVnaW9uKTtcblxuZnVuY3Rpb24gcmVuZGVyQm94KGNvbnRleHQsIGJveCwgY29sb3Ipe1xuICAgIGNvbnRleHQuZmlsbFN0eWxlID0gY29sb3IgfHwgJ3JnYmEoMCwwLDAsMC4xKSc7XG4gICAgY29udGV4dC5maWxsUmVjdChcbiAgICAgICAgYm94WzBdICogMTAsXG4gICAgICAgIGJveFsxXSAqIDEwLFxuICAgICAgICAoYm94WzJdIC0gYm94WzBdKSAqIDEwLFxuICAgICAgICAoYm94WzNdIC0gYm94WzFdKSAqIDEwXG4gICAgKTtcbiAgICBjb250ZXh0LnN0cm9rZVJlY3QoXG4gICAgICAgIGJveFswXSAqIDEwLFxuICAgICAgICBib3hbMV0gKiAxMCxcbiAgICAgICAgKGJveFsyXSAtIGJveFswXSkgKiAxMCxcbiAgICAgICAgKGJveFszXSAtIGJveFsxXSkgKiAxMFxuICAgICk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlck5vZGUoY29udGV4dCwgbm9kZSl7XG4gICAgaWYoIW5vZGUpe1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmVuZGVyQm94KGNvbnRleHQsIG5vZGUuYm91bmRzKTtcblxuICAgIGlmKG5vZGUucXVhZHJhbnRzKXtcbiAgICAgICAgbm9kZS5xdWFkcmFudHMuZm9yRWFjaChmdW5jdGlvbihub2RlKXtcbiAgICAgICAgICAgIHJlbmRlck5vZGUoY29udGV4dCwgbm9kZSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCl7XG5cbiAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyksXG4gICAgICAgIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIGNhbnZhcy5oZWlnaHQgPSAxMDAwO1xuICAgIGNhbnZhcy53aWR0aCA9IDEwMDA7XG5cbiAgICBmdW5jdGlvbiByZW5kZXIoKXtcblxuICAgICAgICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXG4gICAgICAgIHJlbmRlck5vZGUoY29udGV4dCwgZG9vYnkucm9vdCgpKTtcbiAgICAgICAgcmVuZGVyQm94KGNvbnRleHQsIHNlYXJjaFJlZ2lvbiwgJ3JnYmEoMCwwLDI1NSwwLjUpJyk7XG5cbiAgICAgICAgZG9vYnkuYWxsKCkuZm9yRWFjaChmdW5jdGlvbihpdGVtKXtcbiAgICAgICAgICAgIHJlbmRlckJveChjb250ZXh0LFxuICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgaXRlbVswXSxcbiAgICAgICAgICAgICAgICAgICAgaXRlbVsxXSxcbiAgICAgICAgICAgICAgICAgICAgaXRlbVswXSsxLFxuICAgICAgICAgICAgICAgICAgICBpdGVtWzFdKzEsXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAncmdiYSgyNTUsMCwwLDAuNSknXG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXN1bHRzLmZvckVhY2goZnVuY3Rpb24oaXRlbSl7XG4gICAgICAgICAgICByZW5kZXJCb3goY29udGV4dCxcbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1bMF0sXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1bMV0sXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1bMF0rMSxcbiAgICAgICAgICAgICAgICAgICAgaXRlbVsxXSsxLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgJ3JnYmEoMCwyNTUsMCwwLjUpJ1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlbmRlcik7XG4gICAgfVxuXG4gICAgcmVuZGVyKCk7XG5cbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNhbnZhcyk7XG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihtYXhCaW5TaXplLCBtaW5SZXNvbHV0aW9uKXtcbiAgICBtYXhCaW5TaXplID0gbWF4QmluU2l6ZSB8fCAxMDtcbiAgICBtaW5SZXNvbHV0aW9uID0gbWluUmVzb2x1dGlvbiB8fCAwLjAxO1xuXG4gICAgZnVuY3Rpb24gY3JlYXRlTm9kZShib3VuZHMsIGlzTWluUmVzb2x1dGlvbil7XG4gICAgICAgIHZhciBzaXplID0gYm91bmRzWzJdIC0gYm91bmRzWzBdLFxuICAgICAgICAgICAgbm9kZSA9IHtcbiAgICAgICAgICAgICAgICBib3VuZHM6IGJvdW5kcyxcbiAgICAgICAgICAgICAgICBzaXplOiBzaXplLFxuICAgICAgICAgICAgICAgIGhhbGZTaXplOiBzaXplIC8gMixcbiAgICAgICAgICAgICAgICBpdGVtczogW10sXG4gICAgICAgICAgICAgICAgbWF4SXRlbXM6IGlzTWluUmVzb2x1dGlvbiA/IEluZmluaXR5IDogbWF4QmluU2l6ZVxuICAgICAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG5cbiAgICB2YXIgcm9vdCxcbiAgICAgICAgYWxsSXRlbXM7XG5cbiAgICBmdW5jdGlvbiByZXNldCgpe1xuICAgICAgICByb290ID0gY3JlYXRlTm9kZShbMCwgMCwgNjQsIDY0XSk7XG4gICAgICAgIGFsbEl0ZW1zID0gbmV3IFNldCgpO1xuICAgIH1cbiAgICByZXNldCgpO1xuXG4gICAgZnVuY3Rpb24gYWRkUXVhZHJhbnQocGFyZW50LCBpbmRleCl7XG4gICAgICAgIHZhciBwYXJlbnRTaXplID0gcGFyZW50LnNpemUsXG4gICAgICAgICAgICBoYWxmU2l6ZSA9IHBhcmVudC5oYWxmU2l6ZSxcbiAgICAgICAgICAgIHJpZ2h0ID0gaW5kZXglMixcbiAgICAgICAgICAgIGJvdHRvbSA9IGluZGV4Pj0yO1xuXG4gICAgICAgIHJldHVybiBjcmVhdGVOb2RlKFtcbiAgICAgICAgICAgIHBhcmVudC5ib3VuZHNbMF0gKyAocmlnaHQgPyBoYWxmU2l6ZSA6IDApLFxuICAgICAgICAgICAgcGFyZW50LmJvdW5kc1sxXSArIChib3R0b20gPyBoYWxmU2l6ZSA6IDApLFxuICAgICAgICAgICAgcGFyZW50LmJvdW5kc1syXSAtIChyaWdodCA/IDAgOiBoYWxmU2l6ZSksXG4gICAgICAgICAgICBwYXJlbnQuYm91bmRzWzNdIC0gKGJvdHRvbSA/IDAgOiBoYWxmU2l6ZSlcbiAgICAgICAgXSwgcGFyZW50U2l6ZSA8IG1pblJlc29sdXRpb24pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkZFBhcmVudE5vZGUob2Zmc2V0LCBjaGlsZE5vZGUpe1xuICAgICAgICB2YXIgY2hpbGRUb0xlZnQgPSBvZmZzZXRbMF0gPiAwLFxuICAgICAgICAgICAgY2hpbGRUb1RvcCA9IG9mZnNldFsxXSA+IDAsXG4gICAgICAgICAgICBjaGlsZFNpemUgPSBjaGlsZE5vZGUuc2l6ZTtcblxuICAgICAgICByb290ID0gY3JlYXRlTm9kZShbXG4gICAgICAgICAgICBjaGlsZE5vZGUuYm91bmRzWzBdIC0gKGNoaWxkVG9MZWZ0ID8gMCA6IGNoaWxkU2l6ZSksXG4gICAgICAgICAgICBjaGlsZE5vZGUuYm91bmRzWzFdIC0gKGNoaWxkVG9Ub3AgPyAwIDogY2hpbGRTaXplKSxcbiAgICAgICAgICAgIGNoaWxkTm9kZS5ib3VuZHNbMl0gKyBjaGlsZFNpemUgKiAoY2hpbGRUb0xlZnQgPyAxIDogMCksXG4gICAgICAgICAgICBjaGlsZE5vZGUuYm91bmRzWzNdICsgY2hpbGRTaXplICogKGNoaWxkVG9Ub3AgPyAxIDogMClcbiAgICAgICAgXSk7XG5cbiAgICAgICAgcm9vdC5xdWFkcmFudHMgPSBbXG4gICAgICAgICAgICAoY2hpbGRUb0xlZnQgJiYgY2hpbGRUb1RvcCkgPyBjaGlsZE5vZGUgOiBhZGRRdWFkcmFudChyb290LCAwKSxcbiAgICAgICAgICAgICghY2hpbGRUb0xlZnQgJiYgY2hpbGRUb1RvcCkgPyBjaGlsZE5vZGUgOiBhZGRRdWFkcmFudChyb290LCAxKSxcbiAgICAgICAgICAgIChjaGlsZFRvTGVmdCAmJiAhY2hpbGRUb1RvcCkgPyBjaGlsZE5vZGUgOiBhZGRRdWFkcmFudChyb290LCAyKSxcbiAgICAgICAgICAgICghY2hpbGRUb0xlZnQgJiYgIWNoaWxkVG9Ub3ApID8gY2hpbGROb2RlIDogYWRkUXVhZHJhbnQocm9vdCwgMylcbiAgICAgICAgXTtcblxuICAgICAgICByZXR1cm4gcm9vdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbnNlcnRJbnRvUXVhZHJhbnQobm9kZSwgcG9zaXRpb24pe1xuICAgICAgICBpZighbm9kZS5xdWFkcmFudHMpe1xuICAgICAgICAgICAgbm9kZS5xdWFkcmFudHMgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBpbmRleCA9IChwb3NpdGlvblswXSA8IG5vZGUuYm91bmRzWzBdICsgbm9kZS5oYWxmU2l6ZSA/IDAgOiAxKSArXG4gICAgICAgICAgICAgICAgKHBvc2l0aW9uWzFdIDwgbm9kZS5ib3VuZHNbMV0gKyBub2RlLmhhbGZTaXplID8gMCA6IDIpO1xuXG4gICAgICAgIGluc2VydEludG8obm9kZS5xdWFkcmFudHNbaW5kZXhdIHx8IChub2RlLnF1YWRyYW50c1tpbmRleF0gPSBhZGRRdWFkcmFudChub2RlLCBpbmRleCkpLCBwb3NpdGlvbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW5zZXJ0SW50byhub2RlLCBwb3NpdGlvbil7XG4gICAgICAgIGlmKG5vZGUucXVhZHJhbnRzKXtcbiAgICAgICAgICAgIGluc2VydEludG9RdWFkcmFudChub2RlLCBwb3NpdGlvbik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBub2RlLml0ZW1zLnB1c2gocG9zaXRpb24pO1xuXG4gICAgICAgIGlmKFxuICAgICAgICAgICAgbm9kZS5pdGVtcy5sZW5ndGggPiBub2RlLm1heEl0ZW1zXG4gICAgICAgICl7XG4gICAgICAgICAgICB3aGlsZShub2RlLml0ZW1zLmxlbmd0aCl7XG4gICAgICAgICAgICAgICAgaW5zZXJ0SW50b1F1YWRyYW50KG5vZGUsIG5vZGUuaXRlbXMucG9wKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkKHBvc2l0aW9uKXtcbiAgICAgICAgYWxsSXRlbXMuYWRkKHBvc2l0aW9uKTtcblxuICAgICAgICB2YXIgdGFyZ2V0Tm9kZSA9IHJvb3Q7XG5cbiAgICAgICAgdmFyIHggPSBwb3NpdGlvblswXSA8IHRhcmdldE5vZGUuYm91bmRzWzBdID8gLTEgOiBwb3NpdGlvblswXSA+PSB0YXJnZXROb2RlLmJvdW5kc1syXSA/IDEgOiAwO1xuICAgICAgICB2YXIgeSA9IHBvc2l0aW9uWzFdIDwgdGFyZ2V0Tm9kZS5ib3VuZHNbMV0gPyAtMSA6IHBvc2l0aW9uWzFdID49IHRhcmdldE5vZGUuYm91bmRzWzNdID8gMSA6IDA7XG5cbiAgICAgICAgaWYoeCB8fCB5KXtcbiAgICAgICAgICAgIHRhcmdldE5vZGUgPSBhZGRQYXJlbnROb2RlKFt4LCB5XSwgdGFyZ2V0Tm9kZSk7XG4gICAgICAgICAgICBhZGQocG9zaXRpb24pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaW5zZXJ0SW50byh0YXJnZXROb2RlLCBwb3NpdGlvbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkU2VhcmNoUmVzdWx0KGl0ZW0pe1xuICAgICAgICB2YXIgYm94ID0gdGhpc1swXTtcblxuICAgICAgICBpZihcbiAgICAgICAgICAgIGl0ZW1bMF0gPj0gYm94WzBdICYmXG4gICAgICAgICAgICBpdGVtWzBdIDwgYm94WzJdICYmXG4gICAgICAgICAgICBpdGVtWzFdID49IGJveFsxXSAmJlxuICAgICAgICAgICAgaXRlbVsxXSA8IGJveFszXVxuICAgICAgICApe1xuICAgICAgICAgICAgdGhpc1sxXS5wdXNoKGl0ZW0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2VhcmNoTm9kZShub2RlKXtcbiAgICAgICAgdmFyIGJveCA9IHRoaXNbMF0sXG4gICAgICAgICAgICByZXN1bHRzID0gdGhpc1sxXTtcblxuICAgICAgICBpZihcbiAgICAgICAgICAgIG5vZGUuYm91bmRzWzBdID4gYm94WzJdIHx8XG4gICAgICAgICAgICBub2RlLmJvdW5kc1syXSA8PSBib3hbMF0gfHxcbiAgICAgICAgICAgIG5vZGUuYm91bmRzWzFdID4gYm94WzNdIHx8XG4gICAgICAgICAgICBub2RlLmJvdW5kc1szXSA8PSBib3hbMV1cbiAgICAgICAgKXtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKG5vZGUucXVhZHJhbnRzKXtcbiAgICAgICAgICAgIHJldHVybiBub2RlLnF1YWRyYW50cy5mb3JFYWNoKHNlYXJjaE5vZGUsIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoXG4gICAgICAgICAgICBub2RlLmJvdW5kc1swXSA+PSBib3hbMF0gJiZcbiAgICAgICAgICAgIG5vZGUuYm91bmRzWzJdIDwgYm94WzJdICYmXG4gICAgICAgICAgICBub2RlLmJvdW5kc1sxXSA+PSBib3hbMV0gJiZcbiAgICAgICAgICAgIG5vZGUuYm91bmRzWzNdIDwgYm94WzNdXG4gICAgICAgICl7XG4gICAgICAgICAgICByZXN1bHRzLnB1c2guYXBwbHkocmVzdWx0cywgbm9kZS5pdGVtcyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBub2RlLml0ZW1zLmZvckVhY2goYWRkU2VhcmNoUmVzdWx0LCB0aGlzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZWFyY2goYm94KXtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcblxuICAgICAgICBzZWFyY2hOb2RlLmNhbGwoW2JveCwgcmVzdWx0c10sIHJvb3QpO1xuXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlbW92ZShwb3NpdGlvbil7XG4gICAgICAgIGFsbEl0ZW1zLmRlbGV0ZShwb3NpdGlvbik7XG4gICAgICAgIHVwZGF0ZSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVwZGF0ZSgpe1xuICAgICAgICB2YXIgcHJldmlvdXNJdGVtcyA9IGFsbEl0ZW1zO1xuICAgICAgICByZXNldCgpO1xuICAgICAgICBwcmV2aW91c0l0ZW1zLmZvckVhY2goYWRkKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBhZGQ6IGFkZCxcbiAgICAgICAgcmVtb3ZlOiByZW1vdmUsXG4gICAgICAgIHVwZGF0ZTogdXBkYXRlLFxuICAgICAgICBzZWFyY2g6IHNlYXJjaCxcbiAgICAgICAgcm9vdDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiByb290O1xuICAgICAgICB9LFxuICAgICAgICBhbGw6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gQXJyYXkuZnJvbShhbGxJdGVtcyk7XG4gICAgICAgIH1cbiAgICB9O1xufSJdfQ==
