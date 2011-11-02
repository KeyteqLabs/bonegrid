//     Bonegrid.js 0.1.0
//     (c) 2011 Raymond Julin, Keyteq AS
//     Bonegrid may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://KeyteqLabs.github.com/bonegrid

Bonegrid = {};
(function(){
    Bonegrid.Collection = Backbone.Collection.extend({
        _criteria : {},
        _limit : 10,
        getRange : function(start, end) {
            this.reset(this.toArray().slice(start, end));
        },

        setCriteria : function(criteria) {
            this._criteria = criteria;
        },

        setLimit : function(limit) {
            this._limit = limit;
        }
    }); 
    Bonegrid.View = Backbone.View.extend({
        _view : {},
        view : function(scope, data) {
            data || (data = {});
            var use = (data && 'view' in data) ? data.view : this._view[scope];
            delete data.view;
            return new use(data);
        }
    });
    Bonegrid.Cell = Bonegrid.View.extend({
        tagName : 'td',
        className : 'bonegrid-cell',
        options : {
            name : false,
            key : false
        },
        initialize : function(options)
        {
            options || (options={});
            if (!('model' in options))
                throw 'Model missing';
            this.model = options.model;
            for (option in options) {
                if (option in this.options)
                    this.options[option] = options[option];
            }
        },
        render : function()
        {
            this.el = $(this.el);
            var value = this.model.get(this.options.key);
            this.el.text(value);
            return this;
        }
    });
    Bonegrid.HeaderCell = Bonegrid.Cell.extend({
        tagName : 'th',
        render : function() {
            this.el = $(this.el);
            this.el.html($('<th class="sort-asc"><a>' + this.options.name + '</a></th>'));
            return this;
        }
    });
    Bonegrid.Row = Bonegrid.View.extend({
        template : '<tr id="${id}" class="${class}">${cells}</tr>',
        tagName : 'tr',

        _view : {
            cell : Bonegrid.Cell
        },

        initialize : function(options)
        {
            this.model = options.model;
            this.columns = options.columns;
        },

        render : function()
        {
            this.el = $(this.el);
            this.el.attr('id', this.model.cid);
            var row = this.el, cell, render;

            var conf;
            _(this.columns).each(function(col, key) {
                // Append model and position to options sent to Bonegrid.Row
                conf = {};
                _.defaults(conf, col.cell, {model:this.model,position:key});
                cell = this.view('cell', conf);
                row.append(cell.render().el);
            }, this);
            return this;
        }
    });

    Bonegrid.Header = Bonegrid.View.extend({
        grid : false,
        columns : [],
        cells : [],
        tagName : 'section',
        className : 'bonegrid-head',
        tmpl : '<table><thead><tr></tr></thead></table>',

        _view : {
            cell : Bonegrid.HeaderCell
        },

        initialize : function(options) {
            options || (options = {});
            _.bindAll(this, 'render', 'view');

            // Keep a reference back to Bonegrid.Grid
            if ('grid' in options) this.grid = options.grid;

            // And accept columns as well
            if ('columns' in options) this.columns = options.columns;
        },
        render : function() {
            this.el = $(this.el);
            var render, html = $(this.tmpl);
            this.el.html(html);
            _(this.columns).each(function(col, key) {
                this.cells[key] = this.view('cell', col.header);
                this.$('tr').append(this.cells[key].render().el);
            }, this);
            return this;
        },

        resizeLike : function(cells) {
            _(this.cells).each(function(cell, key) {
                cell.el.css({
                    width : cells.eq(key).outerWidth()
                });
            }, this);
        },
    });

    Bonegrid.Footer = Bonegrid.View.extend({
        grid : false,
        tagName : 'section',
        className : 'bonegrid-foot',

        initialize : function(options) {
            options || (options = {});
            _.bindAll(this, 'render');

            // Keep a reference back to Bonegrid.Grid
            if ('grid' in options) this.grid = options.grid;

            // And accept columns as well
            if ('columns' in options) this.columns = options.columns;
        },
        render : function() {
            this.el = $(this.el);
            var render;
            _(this.columns).each(function(col) {
                render = ('header' in col) ? col.header : this.renderCol;
                this.el.append(render(col));
            }, this);
            return this;
        },

        renderCol : function(data) {
            return $('<th>' + data.name + '</th>');
        }
    });

    Bonegrid.Body = Bonegrid.View.extend({
        collection : {},
        tmpl : '<table><tbody></tbody></table>',
        tagName : 'section',
        className : 'bonegrid-body',
        _rows : {},
        _view : {
            header : Bonegrid.Header,
            row : Bonegrid.Row
        },
        initialize : function(options) {
            options || (options = {});
            _.bindAll(this, 'render', 'addRow', 'page', 'onReset', 'onAdd', 'onRm', 'row');

            if ('collection' in options) this.collection = options.collection;
            if ('columns' in options) this.columns = options.columns;

            this.collection.bind('reset', this.onReset);
            this.collection.bind('add', this.onAdd);
            this.collection.bind('rm', this.onRm);
        },

        render : function() {
            // Ensure `el` always is a jQuery element
            this.el = $(this.el);
            this.el.html($(this.tmpl));
            var container = this.$('tbody');
            this.collection.each(function(model) {
                this.addRow(model, container);
            }, this);

            return this;
        },

        onAdd : function(model)
        {
            this.addRow(model);
        },
        onRm : function(model)
        {
            this._rows[model.id].destroy();
            if (this._rows.length === 0)
                this.trigger('empty', [this.collection, this]);
        },
        onReset : function(collection)
        {
            var container = this.$('tbody');
            container.html('');
            this.collection.each(function(model) {
                this.addRow(model, container);
            }, this);
        },

        events : {
            //'scroll' : 'page'
        },

        page : function(e)
        {
            var scrollTop = this.el.scrollTop();
            var height = this.el.height();
            var offset = this.el.position().top;
        },

        addRow : function(model, container)
        {
            var container = container || this.$('tbody');
            var row = this.view('row', {
                model : model,
                columns : this.columns
            });
            this._rows[model.id] = row;
            container.append(row.render().el);
            this.trigger('add', row, row.el.children());
        },

        rowHeight : function()
        {
            var num = this.el.children().length;
            return this.el.height() / num;
        },

        row : function(nth)
        {
            return this.$('tr:nth(' + nth + ')');
        }
    });

    Bonegrid.Grid = Bonegrid.View.extend({
        collection : null,
        columns : [],
        _view : {
            body : Bonegrid.Body,
            collection : Bonegrid.Collection,
            row : Bonegrid.Row,
            cell : Bonegrid.Cell,
            header : Bonegrid.Header,
            footer : Bonegrid.Footer
        },
        options : {
            header : {
                on : true,
                autosize : false
            },
            body : true,
            footer : false,
            autosize : true,
            criteria : {},
            limit : 50,
            start : 0,
        },
        current : {
            start : 0
        },
        _settings : {
            body : {},
            header : {},
        },

        settings : function(scope, settings) {
            if (settings) {
                _.extend(this._settings[scope], settings);
            }
            return this._settings[scope];
        },

        initialize : function(options)
        {
            options || (options={});

            _.bindAll(this, 'render', 'columnize', 'onRowAdd', 'createBody');

            for (key in this.options)
            {
                if (key in options)
                    this.options[key] = options[key];
            }

            if ('collection' in options) this._view.collection = options.collection;
            if ('body' in options) this.settings('body', options.body);
            if ('header' in options) this.settings('header', options.header);

            var data = ('data' in options) ? options.data : [];
            this.collection = this.view('collection', data);
            this.collection.setCriteria(this.options.criteria);
            this.collection.setLimit(this.options.limit);

            this.columns = ('columns' in options)
                ? this.columnize(options.columns) : this.columnize(null, this.collection);

            this.createBody();

            this.current.body.bind('add', this.onRowAdd);

            return this;
        },

        // Helper to create Bonegrid.Body
        createBody : function()
        {
            options = this.settings('body');
            _.defaults(options, {collection : this.collection, columns : this.columns});
            // Update reference to current body and return it
            return this.current.body = this.view('body', options);
        },

        // Take a collection with models and read column information based on the first
        // models attribute names
        columnize : function(columns, collection)
        {
            if (!columns) {
                if (collection.length > 0) {
                    var keys =  _(collection.at(0).attributes).keys();
                    columns = _(keys).map(function(key) {
                        return { id : key, name : key }
                    });
                }
            }
            var cell, header;
            return _(columns).map(function(col) {
                cell = {};
                header = {};
                if ('cell' in col) {
                    cell = col.cell;
                    delete col.cell;
                }
                if ('header' in col) {
                    header = col.header;
                    delete col.header;
                }
                _.defaults(cell, col);
                _.defaults(header, col);
                return {cell : cell, header : header};
            });
            return columns;;
        },

        // Render the container view for Backbone.Grid
        render : function()
        {
            // Always use the bonegrid class for CSS hooks
            this.el.addClass('bonegrid');

            // Render Bonegrid.Body onto Grid
            this.el.append(this.current.body.render().el);

            // If there is no pre-loaded data in the collection
            // make sure to call `Bonegrid.Collection#getRange`
            if (this.collection.length === 0)
                this.collection.getRange(this.current.start, this.current.start + this.options.limit);

            // Prepend header element if header is turned on
            if (this.options['header']) {
                this.current.header = this.view('header', {
                    columns : this.columns,
                    grid : this
                });
                this.el.prepend(this.current.header.render().el);
            }

            // Append footer element if footer is turned on
            if (this.options['footer']) {
                this.current.footer = this.view('footer', {
                    grid : this
                }).render();
                this.el.append(this.current.footer.el);
            }

            // Make chainable
            return this;
        },

        // Callback for when the Bonegrid.Body view triggers _add_
        onRowAdd : function(row, cells)
        {
            if ('header' in this.current && this.settings('header').autosize) {
                this.current.header.resizeLike(cells);
            }
        }
    }); 
}).call(this);

