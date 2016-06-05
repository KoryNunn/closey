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

        if(!node ||
            node.bounds[0] > box[2] ||
            node.bounds[2] <= box[0] ||
            node.bounds[1] > box[3] ||
            node.bounds[3] <= box[1]
        ){
            return;
        }

        if(node.quadrants){
            for(var i = 0; i < node.quadrants.length; i++){
                searchNode.call(this, node.quadrants[i]);
            }
            return;
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