// Bonegrid.js 0.1.0
// (c) 2011 Raymond Julin, Keyteq AS
// Bonegrid may be freely distributed under the MIT license.
// For all details and documentation:
// http://KeyteqLabs.github.com/bonegrid

Bonegrid = {};
(function(){
    // EventProxy helps to cut down inter-dependencies between
    // Bonegrid components (Body -> Collection)
    Bonegrid.EventProxy = function(options) {
        // Call initialize
        this.initialize(options);
    };

    // Helper to calculate scrollbarwidths
    Bonegrid._scrollbarWidth = function() {
        var width, tmpl = '<div><div /></div>', x=-999,w=100,
            css = {width:w,height:w,position:'absolute',top:x,left:x,overflow:'scroll'},
            div = $(tmpl).css(css).appendTo('body').find('div').css({width: '100%',height:200});
        width = 100 - div.width();
        div.parent().remove();
        return width;
    };

    // Actual implementation
    _.extend(Bonegrid.EventProxy.prototype, Backbone.Events, {
        // Reference to Bonegrid.Collection
        collection : null,

        // Constructor
        initialize : function(options) {
            // Default to empty options
            options = options || ({});

            _.bindAll(this, 'range', 'sort');

            if (options.hasOwnProperty('collection')) {
                this.collection = options.collection;
                // Proxy some events to the collection
                this.proxyCollection(this.collection, ['add', 'remove', 'reset']);
            }
        },

        sort : function(options)
        {
            var data = this.collection.sortBy(function(model) {
                return model.get(options.key);
            });
            this.collection.reset(data);
        },

        // Set up proxies for collection events
        proxyCollection : function(collection, events) {
            var key;
            for (key in events) {
                if (events.hasOwnProperty(key)) {
                    // Bind to a curried _proxy
                    collection.bind(events[key],
                        _.bind(this._proxy, this, events[key]));
                }
            }
        },

        // Original proxy method
        _proxy : function() {
            var args =  Array.prototype.slice.call(arguments);
            var event = args.shift();
            args.unshift(event);
            this.trigger.apply(this, args);
        },

        // Ask to load a range in Bonegrid.Collection with current
        // loaded criteria and existing data
        // This results in multiple adds probably
        range : function(start, end) {
            this.collection.getRange(start, end);
        }
    });

    Bonegrid.Collection = Backbone.Collection.extend({
        criteria : new Backbone.Model(),
        _limit : 10,
        getRange : function(start, end) {
            end = (end || this._limit);
            this.reset(this.toArray().slice(start, end));
        },

        setCriteria : function(criteria) {
            this.criteria.set(criteria);
            return this;
        },

        setLimit : function(limit) {
            this._limit = limit;
        }
    });
    Bonegrid.View = Backbone.View.extend({
        _view : {},
        view : function(scope, data) {
            data = data || ({});
            var use = (data.hasOwnProperty('view')) ? data.view : this._view[scope];
            delete data.view;
            return new use(data);
        }
    });

    Bonegrid.Cell = Bonegrid.View.extend(
    {
        tagName : 'td',
        className : 'bonegrid-cell',
        model : null,
        proxy : null,
        options :
        {
            name : false,
            key : false
        },

        initialize : function(options)
        {
            _.bindAll(this, 'render');

            options = options || ({});

            if (this.model === null && !options.hasOwnProperty('model'))
                throw 'Model missing';

            this.model = options.model;
            this.model.bind('change', this.render);

            this.proxy = options.proxy;

            var option;

            for (option in options)
            {
                if (options.hasOwnProperty(option))
                {
                    if (this.options.hasOwnProperty(option))
                        this.options[option] = options[option];
                }
            }
        },

        render : function()
        {
            var value = this.model.get(this.options.key);
            this.$el.text(value);

            return this;
        }
    });

    Bonegrid.Row = Bonegrid.View.extend(
    {
        tagName : 'tr',
        cells : [],

        _view :
        {
            cell : Bonegrid.Cell
        },

        initialize : function(options)
        {
            _.bindAll(this, 'render', 'remove', 'onChange');

            this.model = options.model;

            this.columns = options.columns;
            this.proxy = options.proxy;

            this.model.bind('remove', this.remove);
            this.model.bind('change', this.onChange);
        },

        onChange : function(className, toggle)
        {
            this.$el.toggleClass(this.model.get('activeClass'), this.model.get('selected'));

            if (this.model.has('actionState'))
            {
                var actionState = this.model.get('actionState');

                if (actionState.hasOwnProperty('className') && actionState.hasOwnProperty('active'))
                    this.$el.toggleClass(actionState.className, actionState.active);
            }
        },

        validPermissions : function(column)
        {
            var valid = true;

            if ('cell' in column)
            {
                _(column.cell.requiredPermissions).each(function(permission)
                {
                    if (!this.model.has(permission) || this.model.get(permission) === false)
                        valid = false;
                }, this);
            }

            return valid;
        },

        render : function()
        {
            this.$el.attr('id', this.model.cid);

            var row = this.$el, cell, render;
            row.html('');

            var conf;

            _(this.columns).each(function(col, key)
            {
                // Append model and position to options sent to Bonegrid.Row
                conf = {proxy : this.proxy, disabled : !this.validPermissions(col)};

                _.defaults(conf, col.cell, {model : this.model, position : key});

                var cellView = this.view('cell', conf);
                row.append(cellView.el);
                cellView.render();
                this.cells[key] = cellView;
            }, this);

            return this;
        }
    });

    Bonegrid.HeaderCell = Bonegrid.Cell.extend(
    {
        tagName : 'th',
        className : 'sort-asc',
        model : false,
        asc : true,
        proxy : null,
        performRender : true,
        events :
        {
            'click a' : 'sort'
        },

        initialize : function(options) {

            if (!options.hasOwnProperty('proxy')) throw 'Bonegrid.HeaderCell requires EventProxy';
            this.proxy = options.proxy;

            if (options.hasOwnProperty('render'))
                this.performRender = options.render;
        },

        render : function()
        {
            if (this.performRender === true)
                this.$el.html(this.make('a', {'class':'sort-asc'}, this.options.name));

            return this;
        },

        // Handle sort event triggering
        sort : function(e)
        {
            this.asc = !this.asc;
            this.proxy.sort(
            {
                direction : ((this.asc) ? 'asc' : 'desc'),
                key : this.options.key
            });
        }
    });

    Bonegrid.Action = Bonegrid.View.extend(
    {
        tagName : 'li',
        className : 'actionElement',
        callback : null,
        actionTag : 'button',
        actionClass : 'gridAction',
        displayName : null,
        requiresSelectedModel : false,

        initialize : function(options)
        {
            _.bindAll(this, 'render', 'onSelectionChanged');
            _.extend(this, options);

            if (this.requiresSelectedModel === true)
                this.proxy.collection.bind('row:selectedCount', this.onSelectionChanged);
        },

        onSelectionChanged : function(count)
        {
            var tagElement = this.$(this.actionTag);

            if (count === 0)
                tagElement.hide();
            else
                tagElement.show();
        },

        events : function()
        {
            if (this.callback !== null)
            {
                var events = [];
                events['click .' + this.actionClass] = this.callback;

                return events;
            }
        },

        render : function()
        {
            var actionObject = this.make(this.actionTag, {'class' : this.actionClass}, this.displayName);

            this.$el.append(actionObject);
            this.delegateEvents();

            if (this.requiresSelectedModel)
                this.$(this.actionTag).hide();

            return this;
        }
    });

    Bonegrid.Actions = Bonegrid.View.extend(
    {
        actions : null,
        tagName : 'section',
        className : 'bonegrid-actions',
        tmpl : '<ul></ul>',

        initialize : function(options)
        {
            if (options.hasOwnProperty('actions'))
                this.actions = options.actions;
            if (options.hasOwnProperty('proxy'))
                this.proxy = options.proxy;
        },

        render : function()
        {
            if (this.actions !== null)
            {
                var ul = $(this.tmpl);

               _(this.actions).each(function(action)
               {
                   ul.append(action.render().el);
               }, this);

                this.$el.append(ul);
            }
        }
    });

    Bonegrid.Header = Bonegrid.View.extend({
        columns : [],
        proxy : null,
        cells : [],
        model : false,
        tagName : 'section',
        className : 'bonegrid-head',
        tmpl : '<table><thead><tr></tr></thead></table>',

        _view : {
            cell : Bonegrid.HeaderCell
        },

        initialize : function(options) {
            options = options || ({});
            _.bindAll(this, 'render', 'view', 'onRender');

            // Reference column definition
            if (options.hasOwnProperty('columns')) this.columns = options.columns;
            // And EventProxy
            if (options.hasOwnProperty('proxy')) this.proxy = options.proxy;
            this.proxy.bind('render', this.onRender);
        },
        render : function() {
            this.$el.html($(this.tmpl));

            _(this.columns).each(function(col, key) {
                // Make sure we pass on the EventProxy in the column header options
                col.header.proxy = this.proxy;
                // Load the view, possibly overloaded
                this.cells[key] = this.view('cell', col.header).render();
                // Append the cell on the row
                this.$('tr').append(this.cells[key].el);
            }, this);
            this.proxy.trigger('render', 'header');
            return this;
        },

        // Callback when the proxy fires a render call
        // This happens a lot so we attempt to update the cell
        // width quite a bit
        onRender : function(component, data) {
            if (component === 'body' && data && data.hasOwnProperty('cells')) {
                _(data.cells).each(function(cell, key) {
                    this.cells[key].$el.css('width', cell);
                }, this);
            }
        }
    });

    Bonegrid.Body = Bonegrid.View.extend(
    {
        _rows : null,
        _view : {
            header : Bonegrid.Header,
            row : Bonegrid.Row
        },

        fill : false,
        showing : 0,
        tmpl : '<table><tbody></tbody></table>',
        tagName : 'div',
        className : 'bonegrid-body',

        // Will hold a Bonegrid.Collection
        proxy : null,

        // Array of column definition data
        columns : [],

        // Cached container node
        container : null,

        initialize : function(options)
        {
            options = (options || {});

            // Require a proxy object
            if (!options.hasOwnProperty('proxy'))
                throw 'Bonegrid.Body requires proxy';
            this.proxy = options.proxy;

            // Will hold the actual view objects, not row data
            this._rows = new Backbone.Collection();

            // Bind methods to this
            _.bindAll(this, 'render', 'addRow', 'reset', 'removeRow', 'row', 'cellWidths', 'autosize', 'checkRenderDefaultRow');

            // Take column definitions
            if (options.hasOwnProperty('columns')) this.columns = options.columns;

            // Bind to proxy methods for updating the content
            this.proxy.on('reset', this.reset);
            this.proxy.on('add', this.addRow);
            this.proxy.on('rm', this.removeRow);
            // TODO Should be handled in reset/addRow/removeRow instead of a new binding?
            this.proxy.collection.bind('fetch:complete remove', this.checkRenderDefaultRow);

            // When an element to fill has been sent, hook into the proxy
            // render event to ensure we always still fill the container
            // after a render somewhere
            if (options.hasOwnProperty('fill'))
            {
                this.fill = options.fill;
                this.proxy.on('render resize', this.autosize);
            }

            // Use scroll based paging if set
            if (options.hasOwnProperty('pager') && options.pager === 'scroll')
                this.delegateEvents({'scroll' : 'pager'});

            return this;
        },

        pager : function(e)
        {
            // Calculate distance left before scrollbar hits the bottom
            var distance = this.$('table').height() - (this.$el.height() + this.$el.scrollTop());
            if (distance <= parseInt(this.$el.height() / 10, 10))
                this.proxy.range(this.showing);
        },

        // Initially just fill with an empty table
        render : function()
        {
            this.$el.html($(this.tmpl));
            this.container = this.$('tbody');
            this.proxy.trigger('render', 'body', {cells:this.cellWidths()});
            return this;
        },

        append : function(num)
        {
            this.proxy.range(this.showing, this.showing + num);
        },

        removeRow : function(model)
        {
            model.view.remove();
            this._rows.remove(model);
        },

        reset : function(collection)
        {
            this.container.html('');
            this.showing = 0;
            collection.each(function(model, index, collection)
            {
                this.addRow(model, collection, {index:index});
            }, this);
        },

        checkRenderDefaultRow : function()
        {
            var collection = this.proxy.collection;

            if (collection.models.length > 0 || collection.defaultRow === null)
                return;

            var defaultRow = collection.defaultRow;

            if (defaultRow.hasOwnProperty('template'))
                this.container.append($(defaultRow.template).tmpl());

            if (defaultRow.hasOwnProperty('rowClassName'))
                this.$('tr').addClass(defaultRow.rowClassName);
        },

        addRow : function(model, collection, options)
        {
            options = options || ({});
            var row = this.view('row',
            {
                model : model,
                columns : this.columns,
                proxy : this.proxy
            });

            model.view = row;

            if (!(this._rows._byCid[model.cid] || this._rows._byId[model.id]))
                this._rows.add(model);

            var rowElement = row.render().el, newIndex = options.index;

            if (this.container.children('tr').length === 0 || options.index === 0)
                this.container.prepend(rowElement);
            else
               this.container.children('tr').eq(newIndex - 1).after(rowElement);

            this.showing++;

            // TODO This will be called _a lot_, up for improvement
            this.proxy.trigger('render', 'body', this.cellWidths());
            return row;
        },

        rowHeight : function()
        {
            if (this._rows.length > 0) {
                var model = this._rows.at(0);
                return model.view.$el.height();
            }
            else
                return 25;
        },

        cellWidths : function()
        {
            if (this._rows.length > 0) {
                var row = this._rows.at(0);
                return _(row.view.cells).map(function(cell) {
                    return cell.$el.width();
                });
            }
            return false;
        },

        // Automatically size body of grid to fill a container
        // TODO This method is most likely called on every
        // row render and its rather slow.
        // Should be optimized
        autosize : function()
        {
            // Find border sizes
            var hasHeight = parseInt(this.$el.outerHeight() - this.$el.height(), 10);
            var height = parseInt(this.fill.height() - (this.$el.offset().top - this.fill.offset().top), 10);
            this.$el.css({
                overflow : 'auto',
                height : height - hasHeight,
                '-webkit-overflow-scrolling': 'touch'
            });

            // Figure out how many rows I can contain in viewport
            var rowHeight = this.rowHeight();
            this.options.limit = Math.round(this.$el.height() / rowHeight);
            return this;
        },

        row : function(nth)
        {
            return this.$('tr:nth(' + nth + ')');
        }
    });

    Bonegrid.Grid = Bonegrid.View.extend(
    {
        collection : null,
        columns : [],
        actions : null,
        _view :
        {
            body : Bonegrid.Body,
            collection : Bonegrid.Collection,
            row : Bonegrid.Row,
            cell : Bonegrid.Cell,
            header : Bonegrid.Header,
            actions : Bonegrid.Actions,
            action : Bonegrid.Action,
            footer : false
        },
        options :
        {
            footer : false,
            fill : false,
            criteria : {},
            data : [],
            limit : 50,
            start : 0
        },
        current :
        {
            start : 0
        },
        _settings : {},

        // Sets a number of defaults values for a grid
        setDefaults : function()
        {
            this._settings =
            {
                body : {on : true, autosize : true},
                header : {on : true, autosize : false},
                actions : {on : false, autosize : false}
            };
        },

        settings : function(scope, settings)
        {
            return _.extend(this._settings[scope], (settings || {}));
        },

        initialize : function(options)
        {
            options = (options || {});

            _.bindAll(this, 'render', 'columnize', 'onAdd', 'createBody');

            this.setDefaults();

            var key;
            for (key in this.options)
            {
                if (this.options.hasOwnProperty(key) && options.hasOwnProperty(key))
                    this.options[key] = options[key];
            }

            if (options.hasOwnProperty('body')) this.settings('body', options.body);
            if (options.hasOwnProperty('header')) this.settings('header', options.header);
            if (options.hasOwnProperty('actions')) this.settings('actions', options.actions);
            if (options.hasOwnProperty('collection')) this._view.collection = options.collection;

            if (options.hasOwnProperty('fill'))
            {
                this.settings('body', {fill:options.fill});
                this.settings('header', {fill:options.fill});
            }

            // If a model has been sent use it, if not create a new collection
            this.collection = (this.model || this.view('collection'));
            this.collection.setCriteria(this.options.criteria);
            this.collection.setLimit(this.options.limit);

            // The event proxy handles all communication between delegates of Grid
            this.proxy = new Bonegrid.EventProxy({
                collection : this.collection
            });

            if (options.hasOwnProperty('actionDefinitions'))
            {
                this.actions = [];
                _(options.actionDefinitions).each(function(actionDefinition)
                {
                    actionDefinition.proxy = this.proxy;
                    this.actions.push(this.view('action', actionDefinition));
                }, this);
            }

            this.columns = (options.hasOwnProperty('columns')) ?
                this.columnize(options.columns) : this.columnize(null, this.collection);

            this.createBody();
            this.proxy.bind('add', this.onAdd);

            return this;
        },

        // Helper to create Bonegrid.Body
        createBody : function()
        {
            options = this.settings('body');

            _.defaults(options,
            {
                proxy : this.proxy,
                columns : this.columns
            });

            // Update reference to current body and return it
            this.current.body = this.view('body', options);

            return this.current.body;
        },

        // Take a collection with models and read column information based on the first
        // models attribute names
        columnize : function(columns, collection)
        {
            if (!columns && collection.length > 0)
            {
                var keys =  _(collection.at(0).attributes).keys();
                columns = _(keys).map(function(key)
                {
                    return { id : key, name : key };
                });
            }

            var cell, header;
            return _(columns).map(function(col)
            {
                cell = {};
                header = {};

                if (col.hasOwnProperty('cell'))
                {
                    cell = col.cell;
                    delete col.cell;
                }

                if (col.hasOwnProperty('header'))
                {
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
            this.$el.addClass('bonegrid');

            // Render Bonegrid.Body onto Grid
            this.$el.append(this.current.body.el);

            // Prepend header element if header is turned on
            var header = this.settings('header');
            if (header.on) {
                this.current.header = this.view('header', {
                    columns : this.columns,
                    proxy : this.proxy
                });
                this.$el.prepend(this.current.header.el);
            }

            // Prepend actions element if actions is turned on
            var actions = this.settings('actions');
            if (actions.on)
            {
                this.current.actions = this.view('actions', {actions : this.actions, proxy : this.proxy});
                this.$el.prepend(this.current.actions.el);
            }

            // Rendered before body because of autosize-calculation
            if (this.current.actions)
                this.current.actions.render();

            // Header should render first as body size is calculated given it
            if (this.current.header)
                this.current.header.render();

            // Render body
            if (this.current.body)
                this.current.body.render();

            // If there is no pre-loaded data in the collection
            // make sure to call `Bonegrid.Collection#getRange`
            if (this.options.data.length > 0)
                this.collection.reset(this.options.data);
            // Trigger the proxy reset to render a if a collection with elements exists
            else if (this.collection.length)
                this.proxy.trigger('reset', this.collection);

            // Make chainable
            return this;
        },

        // Callback for when the Bonegrid.Body view triggers _add_
        onAdd : function(row)
        {
            if (this.current.hasOwnProperty('header') && this.settings('header').autosize) {
                var cells = _(row.view.cells).map(function(cell) {
                    return cell.$el.width();
                });
                this.current.header.resizeLike(cells);
            }
        }
    });
}).call(this);
