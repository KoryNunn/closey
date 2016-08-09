module.exports = function(maxBinSize){
    maxBinSize = maxBinSize || 10;
    function createNode(bounds){
        var size = bounds[2] - bounds[0],
            node = {
                bounds: bounds,
                size: size,
                halfSize: size / 2,
                items: [],
                allItems: []
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
                ),
                box
            );
            node.allItems.push(box);

            return;
        }

        node.allItems.push(box);
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

        if(!
            (
                item[0] > box[2] ||
                item[2] < box[0] ||
                item[1] > box[3] ||
                item[3] < box[1]
            )
        ){
            this[1].push(item);
        }
    }

    function checkPartial(addResult, searchNode, node) {
        if(node.quadrants){
            searchNode(node.quadrants[0]);
            searchNode(node.quadrants[1]);
            searchNode(node.quadrants[2]);
            searchNode(node.quadrants[3]);
        }

        for(var i = 0; i < node.items.length; i+=1){
            node.items[i] && addResult(node.items[i]);
        }
    }

    function searchNode(node){
        var searchBox = this[0],
            results = this[1];

        if(
            !node ||
            node.bounds[0] > searchBox[2] ||
            node.bounds[2] <= searchBox[0] ||
            node.bounds[1] > searchBox[3] ||
            node.bounds[3] <= searchBox[1]
        ){
            return;
        }

        if(
            node.bounds[0] >= searchBox[0] &&
            node.bounds[2] < searchBox[2] &&
            node.bounds[1] >= searchBox[1] &&
            node.bounds[3] < searchBox[3]
        ){
            results.push.apply(results, node.allItems);
            return;
        }

        checkPartial(this[3], this[2], node);
    }

    function search(box){
        var results = [];

        var context = [box, results],
            currentSearch = searchNode.bind(context),
            addResult = addSearchResult.bind(context);

        context.push(currentSearch, addResult);
        currentSearch(root);

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
            return new Set(allItems);
        }
    };
}