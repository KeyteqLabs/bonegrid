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

###Taking control — supported options
You can take control of how Bonegrid acts by passing in various bits to the constructor.
The supported options are:

 * **el** This is a regular `Backbone.View` so you can pass a DOM node to render the grid in
 * **body** Specific parameters to the `Bonegrid.Body` view
 * **data** An array of objects to use as the data. Nice for small and simple grids and to get going quickly.
 * **model** Instead of passing `data` you can go one step further and supply a `Bonegrid.Collection` instance yourself
 * **fill**
    The ony global option that modifies CSS styles for the grid. Make the entire grid fill the dimensions of
    another element. Will use the grids offset and the height of the `fill` to calculate a height for the grid
 * **columns** 
    Used to specify what columns to display. Each column supports a number of keys that are documented further down
    Read on for specific options for each column

###Column specification
You can control Bonegrid behaviour through the `columns` option.
It has hooks for handling how the grid is rendered:

 * **key**
    What attribute name to get from the model.
    The model will receive this value in `model.get(<key>)`

 * **name**
    The name to use when rendering the column header.

 * **cell**
    Use to specify overrides for rendering the `Bonegrid.Cell` of the current column
    
    * **view**
        Specify your own Bonegrid.View to handle rendering of each cell
    * **className**
        Specify what html class to set on each cell

 * **header**
    Use to specify overrides for rendering the `Bonegrid.Header` view

    * **view**
        Specify your own Bonegrid.View to handle rendering of each cell
    * **className**
        Specify what html class to set on each cell

####Nicer column names
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

####Override cell rendering
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
