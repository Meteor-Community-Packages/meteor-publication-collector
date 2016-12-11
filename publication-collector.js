import { Mongo } from 'meteor/mongo';
import { MongoID } from 'meteor/mongo-id';
import { EventEmitter } from 'events';

const validMongoId = Match.OneOf(String, Mongo.ObjectID);

/*
  This class describes something like Subscription in
  meteor/meteor/packages/ddp/livedata_server.js, but instead of sending
  over a socket it just collects data.
*/
PublicationCollector = class PublicationCollector extends EventEmitter {

  constructor(context = {}) {
    super();
    check(context.userId, Match.Optional(String));

    // Object where the keys are collection names, and then the keys are _ids
    this._documents = {};
    this.unblock = () => {};
    this.userId = context.userId;
    this.observeHandles = [];
    this._idFilter = {
      idStringify: MongoID.idStringify,
      idParse: MongoID.idParse
    };
  }

  collect(name, ...args) {
    if (_.isFunction(args[args.length - 1])) {
      const callback = args.pop();
      this.on('ready', collections => {
        callback(collections);
        this.observeHandles.forEach(handle => handle.stop());
      });
    }

    const handler = Meteor.server.publish_handlers[name];
    const result = handler.call(this, ...args);

    // TODO -- we should check that result has _publishCursor? What does _runHandler do?
    if (result) {
      // array-ize
      this.observeHandles = [].concat(result).map(cur => {
        if (cur._cursorDescription && cur._cursorDescription.collectionName) {
          this._ensureCollectionInRes(cur._cursorDescription.collectionName);
        }

        return cur._publishCursor(this);
      });
    }

    this.ready();
  }

  added(collection, id, fields) {
    check(collection, String);
    check(id, validMongoId);

    this._ensureCollectionInRes(collection);

    // Make sure to ignore the _id in fields
    const addedDocument = _.extend({_id: id}, _.omit(fields, '_id'));
    this._documents[collection][id] = addedDocument;
  }

  changed(collection, id, fields) {
    check(collection, String);
    check(id, validMongoId);

    this._ensureCollectionInRes(collection);

    const existingDocument = this._documents[collection][id];
    const fieldsNoId = _.omit(fields, '_id');

    if (existingDocument) {
      _.extend(existingDocument, fieldsNoId);

      // Delete all keys that were undefined in fields (except _id)
      _.forEach(fields, (value, key) => {
        if (value === undefined) {
          delete existingDocument[key];
        }
      });
    }
  }

  removed(collection, id) {
    check(collection, String);
    check(id, validMongoId);

    this._ensureCollectionInRes(collection);

    delete this._documents[collection][id];

    if (_.isEmpty(this._documents[collection])) {
      delete this._documents[collection];
    }
  }

  ready() {
    this.emit('ready', this._generateResponse());
  }

  onStop() {
    // no-op
  }

  stop() {
    // no-op
  }

  error(error) {
    throw error;
  }

  _ensureCollectionInRes(collection) {
    this._documents[collection] = this._documents[collection] || {};
  }

  _generateResponse() {
    const output = {};

    _.forEach(this._documents, (documents, collectionName) => {
      output[collectionName] = _.values(documents);
    });

    return output;
  }
};
