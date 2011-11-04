//     Bonegrid.js 0.1.0
//     (c) 2011 Raymond Julin, Keyteq AS
//     Bonegrid may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://KeyteqLabs.github.com/bonegrid

Bonegrid = {};
(function(){
    // EventProxy helps to cut down inter-dependencies between
    // Bonegrid components (Body -> Collection)
    Bonegrid.EventProxy = function(options) {
        // Call initialize
        this.initialize(options);
    };

    // Actual implementation
    _.extend(Bonegrid.EventProxy.prototype, Backbone.Events, {
        // Reference to Bonegrid.Collection
        collection : null,

        // Constructor
        initialize : function(options) {
            // Default to empty options
            options || (options = {});

            if ('collection' in options) {
                this.collection = options.collection;
                // Proxy some events to the collection
                this.proxyCollection(this.collection, ['add', 'remove', 'reset']);
            }
        },

        // Set up proxies for collection events
        proxyCollection : function(collection, events) {
            for (var key in events) {
                // Bind to a curried _proxy
                collection.bind(events[key],
                    _.bind(this._proxy, this, events[key]));
            }
        },

        // Original proxy method
        _proxy : function() {
            var args =  Array.prototype.slice.call(arguments);
            var event = args.shift();
            args.unshift(event);
            this.trigger.apply(this, args);
        }
    });

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
        model : null,
        options : {
            name : false,
            key : false
        },
        initialize : function(options)
        {
            options || (options={});
            if (this.model === null && !('model' in options))
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
        model : false,
        render : function() {
            this.el = $(this.el);
            this.el.html($('<th class="sort-asc"><a>' + this.options.name + '</a></th>'));
            return this;
        }
    });
    Bonegrid.Row = Bonegrid.View.extend({
        tagName : 'tr',
        cells : [],

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
                this.cells[key] = this.view('cell', conf);
                row.append(this.cells[key].render().el);
            }, this);
            return this;
        }
    });

    Bonegrid.Header = Bonegrid.View.extend({
        columns : [],
        cells : [],
        model : false,
        tagName : 'section',
        className : 'bonegrid-head',
        tmpl : '<table><thead><tr></tr></thead></table>',

        _view : {
            cell : Bonegrid.HeaderCell
        },

        initialize : function(options) {
            options || (options = {});
            _.bindAll(this, 'render', 'view');

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

    Bonegrid.Body = Bonegrid.View.extend({
        _rows : {},
        _view : {
            header : Bonegrid.Header,
            row : Bonegrid.Row
        },
        showing : 0,
        tmpl : '<table><tbody></tbody></table>',
        tagName : 'section',
        className : 'bonegrid-body',

        // Will hold a Bonegrid.Collection
        proxy : {},

        // Array of column definition data
        columns : [],

        initialize : function(options) {
            options || (options = {});
            if (!('proxy' in options))
                throw 'Bonegrid.Body missing proxy';
            this.proxy = options.proxy;

            _.bindAll(this, 'render', 'addRow', 'onReset', 'onAdd', 'onRm', 'row');

            for (key in this.options)
            {
                if (key in options)
                    this.options[key] = options[key];
            }

            if ('columns' in options) this.columns = options.columns;

            this.proxy.bind('reset', this.onReset);
            this.proxy.bind('add', this.onAdd);
            this.proxy.bind('rm', this.onRm);

            return this;
        },

        render : function() {
            // Ensure `el` always is a jQuery element
            this.el = $(this.el).html($(this.tmpl));

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
            collection.each(function(model) {
                this.addRow(model, container);
            }, this);
        },

        append : function(num)
        {
            this.proxy.range(this.showing, this.showing + num);
        },

        addRow : function(model, container)
        {
            var container = container || this.$('tbody');
            var row = this.view('row', {
                model : model,
                columns : this.columns
            });
            this._rows[model.cid] = row;
            container.append(row.render().el);
            this.showing++;
            this.trigger('add', row, row.el.children());
            return row;
        },

        rowHeight : function()
        {
            if (this._rows.length > 0) {
                var model = this.collection.at(0);
                return this._rows[model.cid].height();
            }
            else
                return 25;
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
            footer : false
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
            data : [],
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

        events : {
            'scroll' : 'page'
        },

        page : function(e)
        {
            var distance = this.current.body.el.height() - (this.el.height() + this.el.scrollTop());
            if (distance <= 10)
                this.current.body.append(this.options.limit);
        },

        initialize : function(options)
        {
            options || (options={});

            _.bindAll(this, 'render', 'columnize', 'onAdd', 'createBody', 'autosize', 'page');

            for (key in this.options)
            {
                if (key in options)
                    this.options[key] = options[key];
            }

            if ('collection' in options) this._view.collection = options.collection;
            if ('body' in options) this.settings('body', options.body);
            if ('header' in options) this.settings('header', options.header);

            // Build the Collection object
            this.collection = this.view('collection');
            this.collection.setCriteria(this.options.criteria);
            this.collection.setLimit(this.options.limit);

            // The event proxy handles all communication between delegates of Grid
            this.proxy = new Bonegrid.EventProxy({
                collection : this.collection
            });

            this.columns = ('columns' in options)
                ? this.columnize(options.columns) : this.columnize(null, this.collection);

            this.createBody();
            this.proxy.bind('add', this.onAdd);

            return this;
        },

        // Helper to create Bonegrid.Body
        createBody : function()
        {
            options = this.settings('body');
            _.defaults(options, {
                proxy : this.proxy,
                columns : this.columns
            });

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
        },

        // Render the container view for Backbone.Grid
        render : function()
        {
            // Always use the bonegrid class for CSS hooks
            this.el.addClass('bonegrid');

            // Render Bonegrid.Body onto Grid
            this.el.append(this.current.body.render().el);

            if (this.options.autosize)
                this.autosize(this.options.autosize);

            // If there is no pre-loaded data in the collection
            // make sure to call `Bonegrid.Collection#getRange`
            if (this.options.data.length > 0)
                this.collection.reset(this.options.data);
            else
                this.collection.getRange(this.current.start, this.current.start + this.options.limit);

            // Prepend header element if header is turned on
            if (this.options['header']) {
                this.current.header = this.view('header', {
                    columns : this.columns,
                    grid : this
                });
                this.el.prepend(this.current.header.render().el);
            }

            // Make chainable
            return this;
        },

        // Automatically size body of grid to fill container
        autosize : function(type)
        {
            switch (type) {
                case 'height':
                    var rowHeight = this.current.body.rowHeight();
                    var height = ($(window).height() - this.el.offset().top);
                    this.el.height(height);
                    this.options.limit = Math.round(this.el.height() / rowHeight);
                    break;
                case 'width':
                    break;
                default:
                    break;
            }
        },

        // Callback for when the Bonegrid.Body view triggers _add_
        onAdd : function(row, cells)
        {
            if ('header' in this.current && this.settings('header').autosize) {
                this.current.header.resizeLike(cells);
            }
        }
    }); 
}).call(this);

