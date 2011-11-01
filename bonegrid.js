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
            return this.toArray().slice(start, end);
        },

        setCriteria : function(criteria) {
            this._criteria = criteria;
        },

        setLimit : function(limit) {
            this._limit = limit;
        }
    }); 
    Bonegrid.Pager = Backbone.View.extend({
    }); 
    Bonegrid.Cell = Backbone.View.extend({
        tagName : 'td',
        className : 'bonegrid-cell',
        initialize : function(options)
        {
            this.model = options.model;
            this.key = options.key;
            this.name = options.name;
        },
        render : function()
        {
            this.el = $(this.el);
            var value = this.model.get(this.key);
            this.el.text(value);
            return this;
        }
    });
    Bonegrid.Row = Backbone.View.extend({
        template : '<tr id="${id}" class="${class}">${cells}</tr>',
        tagName : 'tr',

        initialize : function(options)
        {
            this.model = options.model;
            this.columns = options.columns;
        },

        render : function()
        {
            this.el = $(this.el);
            var row = this.el, cell, render;

            _(this.columns).each(function(col, key) {
                render = ('render' in col) ? col.render : Bonegrid.Cell;
                // Append model and position to options sent to Bonegrid.Row
                col.model = this.model;
                col.position = key;
                cell = new render(col);
                row.append(cell.render().el);
            }, this);
            return this;
        }
    });

    Bonegrid.Header = Backbone.View.extend({
        grid : false,
        columns : [],
        cells : [],
        tagName : 'section',
        className : 'bonegrid-head',
        tmpl : '<table><thead><tr></tr></thead></table>',

        initialize : function(options) {
            options || (options = {});
            _.bindAll(this, 'render', 'renderCol');

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
                if ('header' in col)
                    render = new col['header'](col).render().el;
                else
                    render  = this.renderCol(col);

                this.cells[key] = render;
                this.$('tr').append(this.cells[key]);
            }, this);
            return this;
        },

        resizeLike : function(cells) {
            _(this.cells).each(function(cell, key) {
                cell.css({
                    width : cells.eq(key).outerWidth()
                });
            }, this);
        },

        renderCol : function(data) {
            return $('<th class="sort-asc"><a>' + data.name + '</a></th>');
        }
    });

    Bonegrid.Footer = Backbone.View.extend({
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

    Bonegrid.Body = Backbone.View.extend({
        grid : false,
        pager : false,
        collection : {},
        tmpl : '<table><tbody></tbody></table>',
        tagName : 'section',
        className : 'bonegrid-body',
        _rows : {},
        initialize : function(options) {
            options || (options = {});
            _.bindAll(this, 'render', 'addRow', 'page', 'onReset', 'onAdd', 'onRm', 'row');

            // Keep a reference back to Bonegrid.Grid
            if ('grid' in options) this.grid = options.grid;
            if ('pager' in options) this.pager = options.pager;
            if ('collection' in options) this.collection = options.collection;

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

            if (this.pager) {
                var rowHeight = this.rowHeight();
            }

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
            console.log(scrollTop, height, offset);
        },

        addRow : function(model, container)
        {
            var container = container || this.$('tbody');
            var rowRender = this.grid.row();
            var row = new rowRender({
                model : model,
                columns : this.grid.columns
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

    Bonegrid.Grid = Backbone.View.extend({
        collection : null,
        columns : [],
        _views : {
            body : Bonegrid.Body
        },
        options : {
            collection : Bonegrid.Collection,
            row : Bonegrid.Row,
            cell : Bonegrid.Cell,
            header : Bonegrid.Header,
            footer : false,
            pager : false,
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
                if ('render' in settings) {
                    this._view[scope] = settings.render;
                    delete settings.render;
                }
                this._settings[scope] = settings;
            }
            return this._settings[scope];
        },

        initialize : function(options)
        {
            options || (options={});

            _.bindAll(this, 'render', 'row', 'columnize', 'onRowAdd');

            for (key in this.options)
            {
                if (key in options)
                    this.options[key] = options[key];
            }

            if ('body' in options) this.settings('body', options.body);
            if ('header' in options) this.settings('header', options.header);

            var data = ('data' in options) ? options.data : [];
            this.collection = new this.options['collection'](data);
            this.collection.setCriteria(this.options.criteria);
            this.collection.setLimit(this.options.limit);

            this.columns = ('columns' in options)
                ? options.columns : this.columnize(this.collection);

            this.createBody();

            this.current.body.bind('add', this.onRowAdd);

            return this;
        },

        createBody : function()
        {
            options = this.settings('body');
            options.grid = this;
            options.collection = this.collection;
            options.pager = this.options.pager

            return this.current.body = new this._views['body'](options);
        },

        /**
        * Take a collection with models and read column information based on the first
        * models attribute names
        *
        * @param Bonegrid.Collection
        * @return array
        */
        columnize : function(collection)
        {
            if (collection.length === 0) return [];
            var keys =  _(collection.at(0).attributes).keys();
            return _(keys).map(function(key) {
                return { id : key, name : key }
            });
        },

        render : function()
        {
            this.el.addClass('bonegrid');
            this.el.append(this.current.body.render().el);
            if (this.collection.length === 0)
                this.collection.getRange(this.current.start, this.current.start + this.options.limit);

            if (this.options['header']) {
                this.current.header = new this.options['header']({
                    columns : this.columns,
                    grid : this
                }).render();
                this.el.prepend(this.current.header.el);
                //this.current.header.resizeLike(this.row(1));
            }

            if (this.options['footer']) {
                this.current.footer = new this.options['footer']({
                    grid : this
                }).render();
                this.el.append(this.current.footer.el);
            }

            return this;
        },

        onRowAdd : function(row, cells)
        {
            if ('header' in this.current)
                this.current.header.resizeLike(cells);
        },

        row : function(nth)
        {
            return nth ? this.current.body.row(nth) : this.options['row'];
        }
    }); 
}).call(this);

