var TestView = Bonegrid.View.extend({
    isTest : true,
    _view : {
        test : Bonegrid.View
    }
});
describe('Bonegrid.View', function() {
    describe('.view()', function() {
        beforeEach(function() {
            this.view = new TestView;
        });
        it('returns a view', function() {
            var second = this.view.view('test');
            expect('cid' in second).toBeTruthy();
        });

        it('supports argument forwarding', function() {
            var second = this.view.view('test', {tagName : 'a'});
            expect(second.tagName).toBe('a');
        });

        it('is overridable', function() {
            var data = {
                view : TestView
            };
            var second = this.view.view('test', data);
            expect(second.isTest).toBeTruthy();
        });
    });
});
