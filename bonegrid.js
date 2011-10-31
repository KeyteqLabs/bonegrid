//     Bonegrid.js 0.1.0
//     (c) 2011 Raymond Julin, Keyteq AS
//     Bonegrid may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://KeyteqLabs.github.com/bonegrid

(function(){
    Bonegrid = Backbone.View.extend({
        data : null,
        initialize : function(options)
        {
            this.data = options.data || new Bonegrid.Collection;
            if (typeof this.data == 'array')
                this.data = new Bonegrid.Collection(this.data);
        },

        render : function()
        {
            this.el.html('<table><thead></thead><tbody></tbody><tfooter></tfooter></table>');
            this.body = this.$('tbody');
            this.data.each(function(model) {
                this.addRow(model);
            }, this);
            return this;
        },

        addRow : function(model)
        {
            var row = new Bonegrid.Row({ model : model });
            this.body.append(row.render().el);
        },

        display : function(start, length)
        {
            var models = new Backbone.Collection;
            for (var i = 0; i<length; i++)
            {
                models.add(this.data.at(start + i));
            }
            this.body.render(models, {append : false });
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
                append : true,
                defer : false
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
    Bonegrid.Collection = Backbone.Collection.extend({
    }); 
}).call(this);

