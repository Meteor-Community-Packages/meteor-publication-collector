/* eslint-env mocha */
/* global Documents, spies, Books */

import { assert } from 'meteor/practicalmeteor:chai';
import { Mongo } from 'meteor/mongo';

PublicationCollector = Package['johanbrook:publication-collector'].PublicationCollector;

describe('PublicationCollector', () => {

  afterEach(() => {
    Documents.remove({});
    Documents.find().fetch();
    _.times(10, () => Documents.insert({foo: 'bar'}));
  });

  it('should be able to instantiate', () => {
    const instance = new PublicationCollector();
    assert.ok(instance);
  });

  describe('Collect', () => {

    it('should collect documents from a publication', (done) => {
      const collector = new PublicationCollector();

      collector.collect('publication', collections => {
        assert.typeOf(collections.documents, 'array');
        assert.equal(collections.documents.length, 10, 'collects 10 documents');
        done();
      });
    });

    it('should allow a ObjectID as _id', done => {
      Documents.remove({});
      Documents.insert({_id: new Mongo.ObjectID()});

      const collector = new PublicationCollector();

      collector.collect('publication', collections => {
        assert.typeOf(collections.documents, 'array');
        assert.equal(collections.documents.length, 1);
        done();
      });
    });

    it('should return cursor results as a dictionary, with collection names as keys', (done) => {
      Books.remove({});
      Meteor.users.remove({});

      _.times(5, () => Books.insert({foo: 'bar'}));
      _.times(2, () => Meteor.users.insert({foo: 'bar'}));

      const collector = new PublicationCollector();

      collector.collect('publicationWithSeveralCursors', collections => {
        assert.typeOf(collections.documents, 'array');
        assert.typeOf(collections.books, 'array');
        assert.typeOf(collections.users, 'array');
        assert.equal(collections.documents.length, 10);
        assert.equal(collections.books.length, 5);
        assert.equal(collections.users.length, 2);

        done();
      });
    });

    it('should return an empty array for when there are no documents', (done) => {
      Documents.remove({});
      assert.equal(Documents.find().fetch().length, 0);

      const collector = new PublicationCollector();

      collector.collect('publication', collections => {
        assert.typeOf(collections.documents, 'array');
        assert.equal(collections.documents.length, 0);
        done();
      });
    });

    it('should pass the correct scope to the publication', (done) => {
      const collector = new PublicationCollector({userId: 'foo'});

      collector.collect('publicationWithUser', collections => {
        assert.ok(collections.documents);
        assert.equal(collections.documents.length, 10, 'collects 10 documents');
        done();
      });
    });

    it('should emit ready event', () => {
      const collector = new PublicationCollector();

      collector.on('ready', spies.create('ready'));

      collector.collect('publication');
      assert.ok(spies.ready.calledOnce, 'ready was called');
    });

    it('should pass arguments to publication', (done) => {
      Meteor.publish('publicationWithArgs', function(arg1, arg2) {
        assert.equal(arg1, 'foo');
        assert.equal(arg2, 'bar');
        this.ready();
        done();
      });

      const collector = new PublicationCollector();

      collector.collect('publicationWithArgs', 'foo', 'bar');
    });
  });

  describe('Added', () => {

    it('should add a document to the local data store', () => {
      const collector = new PublicationCollector();

      const id = Random.id();
      const doc = {_id: id, foo: 'bar'};
      collector.added('documents', doc._id, doc);

      assert.deepEqual(collector.responseData.documents[id], doc);
    });
  });

  describe('Removed', () => {

    it('should remove a document to the local data store', () => {
      const collector = new PublicationCollector();

      const doc = Documents.findOne();
      collector.collect('publication');
      collector.removed('documents', doc._id);

      assert.notOk(collector.responseData.documents[doc._id]);
      assert.equal(Object.keys(collector.responseData.documents).length, 9);
    });
  });

  describe('Error', () => {

    it('should throw error when .error() is called in publication', () => {
      // We're not passing a user context here to trigger error.
      const collector = new PublicationCollector();

      assert.throws(() => {
        collector.collect('publicationError');
      }, Meteor.Error, /Not authorized/);
    });
  });

  describe('_generateResponse', () => {

    it('should generate a response with collection names as keys', (done) => {
      const collector = new PublicationCollector();

      collector.collect('publication', collections => {
        assert.equal(Object.keys(collections).length, 1);
        assert.equal(Object.keys(collections)[0], 'documents');
        done();
      });
    });
  });
});
