#Bonegrid.js

Badass Backbone.js Grid

##Simple usage
```js
var data = [
    {name:'Cranium', position:'Head'},
    {name:'Clavicle', position:'Torso'},
    {name:'Sternum', position:'Torso'},
    {name:'Patella', position:'Foot'}
];
var grid = new Bonegrid.Grid({
    el : $('div.grid'),
    data : data,
    columns : [
        {
            id : 'name',
            name : 'Name'
        },
        {
            id : 'position',
            name : 'Placement on body'
        },
    ]
}).render();
```
