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
        },

        render : function(models, options)
        {
            var defaults = {
                append : true
            };
            options = options || defaults;
            this.el = $(this.el);
            var row = this.el, cell;

            _(this.model.attributes).each(function(value, name) {
                cell = new Bonegrid.Cell({
                    model : this.model,
                    key : name
                });
                row.append(cell.render().el);
            }, this);
            return this;
        }
    });

    Bonegrid.Header = Backbone.View.extend({
        render : function() {
            return this;
        }
    });

    Bonegrid.Body = Backbone.View.extend({
        grid : false,
        initialize : function(options) {
            options || (options = {});
            _.bindAll(this, 'render', 'addRow');

            if ('grid' in options) this.grid = options.grid;
        },

        render : function() {
            this.el = $(this.el);
            if (this.grid) {
                this.grid.showing().each(function(model) {
                    this.addRow(model);
                }, this);
            }
            return this;
        },

        addRow : function(model, container)
        {
            var container = container || this.el;
            var rowRender = this.grid.row();
            var row = new rowRender({
                model : model
            });
            container.append(row.render().el);
        }
    });

    Bonegrid.Grid = Backbone.View.extend({
        data : null,
        options : {
            collection : Bonegrid.Collection,
            row : Bonegrid.Row,
            cell : Bonegrid.Cell,
            header : Bonegrid.Header,
            body : Bonegrid.Body,
            footer : false,
            limit : 50,
            start : 0
        },
        current : {
            start : 0
        },

        initialize : function(options)
        {
            options || (options={});

            _.bindAll(this, 'render', 'showing', 'row');

            for (key in this.options)
            {
                if (key in options)
                    this.options[key] = options[key];
            }

            var data = ('data' in options) ? options.data : [];
            this.data = new this.options['collection'](data);
            return this;
        },

        render : function()
        {
            this.el.html('<table><thead></thead><tbody></tbody><tfooter></tfooter></table>');
            if (this.options['header']) {
                this.current.header = new this.options['header']({
                    el : this.$('thead'),
                    grid : this
                }).render();
            }
            this.current.body = new this.options['body']({
                el : this.$('tbody'),
                grid : this
            }).render();

            return this;
        },

        showing : function()
        {
            var start = this.current.start, end = this.current.start + this.options.limit;
            var show = this.data.toArray().slice(start, end);
            this.data.reset(show);
            return this.data;
        },

        row : function()
        {
            return this.options['row'];
        }
    }); 
}).call(this);

