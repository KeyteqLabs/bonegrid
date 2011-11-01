//     Bonegrid.js 0.1.0
//     (c) 2011 Raymond Julin, Keyteq AS
//     Bonegrid may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://KeyteqLabs.github.com/bonegrid

Bonegrid = {};
(function(){
    Bonegrid.Collection = Backbone.Collection.extend({
    }); 
    Bonegrid.Cell = Backbone.View.extend({
        tagName : 'td',
        initialize : function(options)
        {
            this.model = options.model;
            this.key = options.key;
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

            _(this.columns).each(function(col) {
                render = ('render' in col) ? col.render : Bonegrid.Cell;
                cell = new render({
                    model : this.model,
                    key : col.id
                });
                row.append(cell.render().el);
            }, this);
            return this;
        }
    });

    Bonegrid.Header = Backbone.View.extend({
        grid : false,
        columns : [],
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
            var cells = this.grid.row(1).children();
            _(this.columns).each(function(col, key) {
                render = ('header' in col) ? col.header : this.renderCol;
                var result = render(col).css({
                    width : cells.eq(key).outerWidth()
                });
                this.$('tr').append(result);
            }, this);
            return this;
        },

        renderCol : function(data) {
            return $('<th class="sort-asc"><a>' + data.name + '</a></th>');
        }
    });

    Bonegrid.Footer = Backbone.View.extend({
        grid : false,
        columns : [],
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
        initialize : function(options) {
            options || (options = {});
            _.bindAll(this, 'render', 'addRow', 'page', 'row');

            // Keep a reference back to Bonegrid.Grid
            if ('grid' in options) this.grid = options.grid;
            if ('pager' in options) this.pager = options.pager;
        },

        render : function() {
            // Ensure `el` always is a jQuery element
            var table = $('<table><tbody></tbody></table>');
            this.el.html(table);
            var container = this.$('tbody');
            if (this.grid) {
                this.grid.showing().each(function(model) {
                    this.addRow(model, container);
                }, this);
            }

            if (this.pager) {
                var rowHeight = this.rowHeight();
            }

            return this;
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
            var container = container || this.el;
            var rowRender = this.grid.row();
            var row = new rowRender({
                model : model,
                columns : this.grid.columns
            });
            container.append(row.render().el);
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
        data : [],
        columns : [],
        options : {
            collection : Bonegrid.Collection,
            row : Bonegrid.Row,
            cell : Bonegrid.Cell,
            header : Bonegrid.Header,
            body : Bonegrid.Body,
            footer : false,
            pager : false,
            limit : 50,
            start : 0
        },
        current : {
            start : 0
        },

        initialize : function(options)
        {
            options || (options={});

            _.bindAll(this, 'render', 'showing', 'row', 'columnize');

            for (key in this.options)
            {
                if (key in options)
                    this.options[key] = options[key];
            }

            var data = ('data' in options) ? options.data : [];
            this.data = new this.options['collection'](data);

            this.columns = ('columns' in options)
                ? options.columns : this.columnize(this.data);
            return this;
        },

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
            var body = $('<section class="bonegrid-body"></section>');
            this.el.append(body);
            this.el.addClass('bonegrid');
            this.current.body = new this.options['body']({
                el : body,
                grid : this,
                pager : this.options.pager
            }).render();

            if (this.options['header']) {
                this.current.header = new this.options['header']({
                    columns : this.columns,
                    grid : this
                }).render();
                this.el.prepend(this.current.header.el);
            }

            if (this.options['footer']) {
                this.current.footer = new this.options['footer']({
                    grid : this
                }).render();
                this.el.append(this.current.footer.el);
            }

            return this;
        },

        showing : function()
        {
            var start = this.current.start, end = this.current.start + this.options.limit;
            var show = this.data.toArray().slice(start, end);
            this.data.reset(show);
            return this.data;
        },

        row : function(nth)
        {
            return nth ? this.current.body.row(nth) : this.options['row'];
        }
    }); 
}).call(this);

