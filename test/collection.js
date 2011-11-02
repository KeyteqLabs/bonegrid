var models = [
    {id:1,name:'Lorem'},
    {id:2,name:'Ipsum'}
];
describe('Bonegrid.Collection', function() {
    beforeEach(function() {
        this.collection = new Bonegrid.Collection(models);
    });

    describe('when instantiated', function() {
        it('it should accept data', function() {
            expect(this.collection.length).toBe(models.length);
        });

    });

    describe('getRange', function() {
        it('it should call reset', function() {
            var spy = sinon.spy();
            this.collection.bind('reset', spy);
            this.collection.getRange(0,1);
            expect(spy).toHaveBeenCalled();
        });
    });
});
