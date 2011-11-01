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

##Column specification
You can control Bonegrid behaviour through the _columns_ option.
It has hooks for handling how the grid is rendered:
* id
    What attribute name to get from the model.
    The model will receive this value in _model.get(<id>)_
* name
    The name to use when rendering the column header.
* render
    Can be used to specify what Backone.View to use for rendering this cell type
* header
    Can be used to specify what Backbone.View to use for rendering the column header

###Override cell rendering
Lets override cell rendering for the _name_ field.

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
            id : 'name',
            name : 'Name',
            render : PrettyCell
        },
        {
            id : 'position',
            name : 'Placement on body'
        },
    ]
}).render();
```
