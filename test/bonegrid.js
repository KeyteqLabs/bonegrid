describe('Bonegrid.Grid', function() {
    describe('settings()', function() {
        it('is overridable per instance', function() {
            var first = new Bonegrid.Grid;
            first.settings('body', {on : false});
            expect(first.settings('body').on).toBe(false);
        });
        it('leaves no trace between instances', function() {
            var first = new Bonegrid.Grid;
            first.settings('body', {on : false});
            var second = new Bonegrid.Grid;
            expect(second.settings('body').on).toBe(true);
        });
    });
});
