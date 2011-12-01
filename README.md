#Bonegrid.js

Badass Backbone.js Grid

##Documentation
```html
<div class="grid"></div>
```
```js
var data = [
    {name:'Cranium', position:'Head'},
    {name:'Clavicle', position:'Torso'},
    {name:'Sternum', position:'Torso'},
    {name:'Patella', position:'Foot'}
];
```
###Bare minimum
```js
var grid = new Bonegrid.Grid({
    el : $('div.grid'),
    data : data
}).render();
```

###Nicer column names
```js
var grid = new Bonegrid.Grid({
    el : $('div.grid'),
    data : data,
    columns : [
        {
            key : 'name',
            name : 'Name'
        },
        {
            key : 'position',
            name : 'Placement on body'
        },
    ]
}).render();
```

##Column specification
You can control Bonegrid behaviour through the `columns` option.
It has hooks for handling how the grid is rendered:

 * **key**
    What attribute name to get from the model.
    The model will receive this value in `model.get(<key>)`

 * **name**
    The name to use when rendering the column header.

 * **cell**
    Use to specify what Backone.View to use for rendering this cell type
    
    * **view**
        Specify your own Bonegrid.View to handle rendering of each cell
    * **className**
        Specify what html class to set on each cell

 * **header**
    Can be used to specify what Backbone.View to use for rendering the column header

    * **view**
        Specify your own Bonegrid.View to handle rendering of each cell
    * **className**
        Specify what html class to set on each cell

###Override cell rendering
Lets override cell rendering for the `name` field.

```js
var PrettyCell = Bonegrid.Cell.extend({
    render : function() {
        $(this.el).html($('<strong>' + this.model.get(this.key) + '</strong>'));
        return this;
    }
});
var grid = new Bonegrid.Grid({
    el : $('div.grid'),
    data : data,
    columns : [
        {
            key : 'name',
            name : 'Name',
            cell : {
                view : PrettyCell
            }
        },
        {
            key : 'position',
            name : 'Placement on body'
        },
    ]
}).render();
```
