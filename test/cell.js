describe('Bonegrid.Cell', function() {
    describe('when instantiated', function() {
        beforeEach(function() {
            this.model = new Backbone.Model({
                name : 'Foo'
            });
        });

        it('throws on missing model', function() {
            expect(function() {new Bonegrid.Cell()}).toThrow('Model missing');
        });

        it('renders', function() {
            var cell = new Bonegrid.Cell({
                model:this.model,
                key : 'name'
            });
            var el = cell.render().$el;
            expect(el.text()).toBe('Foo');
            expect(el[0].nodeName.toLowerCase()).toBe('td');
            expect(el.hasClass(cell.className)).toBeTruthy();
        });
    });

    describe('when overriden', function() {
        beforeEach(function() {
            this.cell = Bonegrid.Cell.extend({
                render : function() {
                }
            });
            this.model = new Backbone.Model({
                name : 'Foo'
            });
        });

        it('', function() {
            var cell = new Bonegrid.Cell({
                model:this.model,
                key : 'name'
            });
            var el = cell.render().$el;
            expect(el.text()).toBe('Foo');
            expect(el[0].nodeName.toLowerCase()).toBe('td');
            expect(el.hasClass(cell.className)).toBeTruthy();
        });
    });
});
