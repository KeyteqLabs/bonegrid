describe('Bonegrid.EventProxy', function() {
    describe('when instantiated', function() {
        it('is eventbound', function() {
            var proxy = new Bonegrid.EventProxy();
            var spy = sinon.spy();

            proxy.bind('test', spy);
            proxy.trigger('test');

            expect(spy).toHaveBeenCalledOnce();
        });

        describe('proxies', function() {
            beforeEach(function() {
                this.collection = new Backbone.Collection();
                this.spy = sinon.spy();
                this.proxy = new Bonegrid.EventProxy({
                    collection : this.collection
                });
            });
            it('add, remove and reset to collection', function() {
                this.proxy.bind('add', this.spy);
                this.collection.trigger('add', 'model');
                expect(this.spy).toHaveBeenCalledOnce();

                this.proxy.bind('remove', this.spy);
                this.collection.trigger('remove', 'model');
                expect(this.spy).toHaveBeenCalledTwice();

                this.proxy.bind('reset', this.spy);
                this.collection.trigger('reset', 'collection');
                expect(this.spy).toHaveBeenCalledThrice();
            });

            it('page directly', function() {
                this.proxy.bind('page', this.spy);
                this.collection.trigger('page');
                this.proxy.trigger('page');
                expect(this.spy).toHaveBeenCalledOnce();
            });
        });
    });
});
