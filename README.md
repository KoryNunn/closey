# closey

A hopefully fast, simple, quad-tree implementation.

## Usage

```javascript

var closey = require('../');

var tree = closey(10);

// Add recs (inc other data if ya want)
tree.add([10, 20, 15, 25 /*, anything, else, closey, dont, care */]); // etc...

var results = tree.search([5, 5, 30, 30]);

```