describe('Bonegrid.Row', function() {
    describe('when instantiated', function() {
        beforeEach(function() {
            this.model = new Backbone.Model({
                name : 'Foo',
                lastname : 'Bar'
            });
            this.columns = [
                { key : 'name' },
                { key : 'lastname' }
            ];
            this.row = new Bonegrid.Row({
                model : this.model,
                columns : this.columns
            });
        });

        it('renders correct number of cells', function() {
            expect(this.row.model).toBe(this.model);
            expect(this.row.columns).toBe(this.columns);

            var spy = sinon.spy(this.row, 'view');
            this.row.render();
            expect(spy).toHaveBeenCalledTwice();
        });

        it('produces correct markup', function() {
            var elems = this.row.render().el[0].childNodes;
            expect(this.row.el[0].tagName.toLowerCase()).toBe(this.row.tagName);
            expect(elems.length).toEqual(this.row.cells.length);
            for (var i = 0; i < this.columns.length; i++) {
                expect(elems[i].tagName.toLowerCase()).toBe(this.row.cells[i].tagName);
            }
        });
    });
});
