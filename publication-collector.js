import { Meteor } from "meteor/meteor";
import { Match, check } from "meteor/check";
import { Mongo } from "meteor/mongo";
import { MongoID } from "meteor/mongo-id";
import { EventEmitter } from "events";

const validMongoId = Match.OneOf(String, Mongo.ObjectID);
const isEmpty = obj => {
  const safeObj = obj || {};
  return [Object, Array].includes(safeObj.constructor) && !Object.entries(safeObj).length;
};

/*
 This class describes something like Subscription in
 meteor/meteor/packages/ddp/livedata_server.js, but instead of sending
 over a socket it just collects data.
 */
export class PublicationCollector extends EventEmitter {
  constructor (opts = {}) {
    super();
    check(opts.userId, Match.Optional(String));
    check(opts.delayInMs, Match.Optional(Match.Integer));

    // Object where the keys are collection names, and then the keys are _ids
    this._documents = Object.create(null);
    this.unblock = () => {
    };
    this.userId = opts.userId;
    this._idFilter = {
      idStringify: MongoID.idStringify,
      idParse: MongoID.idParse
    };
    this._isDeactivated = () => {
    };

    this.delayInMs = opts.delayInMs;
  }

  collect (name, ...args) {
    let callback;
    // extracts optional callback from latest argument
    if (typeof (args[args.length - 1]) === 'function') {
      callback = args.pop();
    }

    const handler = Meteor.server.publish_handlers[name];

    if (!handler) {
      throw new Error(
        `PublicationCollector: Couldn't find publication "${name}"! Did you misspell it?`
      );
    }

    return new Promise((resolve, reject) => {
      const done = (...res) => {
        if (callback) {
          try {
            callback(...res);
          } catch (e) {
            // if the callback throws an error, we reject the promise
            return reject(e);
          }
        }
        return resolve(...res);
      };

      const completeCollecting = (collections) => {
        try {
          done(collections);
        } finally {
          // stop the subscription
          this.stop();
        }
      };

      // adds a one time listener function for the "ready" event
      this.once("ready", (collections) => {
        if (this.delayInMs) {
          Meteor.setTimeout(() => {
            // collections is out of date, so we need to regenerate
            collections = this._generateResponse();
            completeCollecting(collections);
          }, this.delayInMs);
        }
        else {
          // immediately complete
          completeCollecting(collections);
        }
      });

      const result = handler.call(this, ...args);
      const onPublish = (res) => this._publishHandlerResult(res).catch(reject);
      if (typeof result?.then === "function") {
        result.then(onPublish);
      }
      else {
        onPublish(result);
      }
    });
  }

  /**
   * Reproduces "_publishHandlerResult" processing
   * @see {@link https://github.com/meteor/meteor/blob/master/packages/ddp-server/livedata_server.js#L1045}
   */
  async _publishHandlerResult (res) {
    const cursors = [];

    // publication handlers can return a collection cursor, an array of cursors or nothing.
    if (this._isCursor(res)) {
      cursors.push(res);
    }
    else if (Array.isArray(res)) {
      // check all the elements are cursors
      const areCursors = res.reduce(
        (valid, cur) => valid && this._isCursor(cur),
        true
      );
      if (!areCursors) {
        this.error(
          new Error(
            "PublicationCollector: Publish function returned an array of non-Cursors"
          )
        );
        return;
      }
      // find duplicate collection names
      const collectionNames = Object.create(null);
      for (let i = 0; i < res.length; ++i) {
        const collectionName = res[i]._getCollectionName();
        if ({}.hasOwnProperty.call(collectionNames, collectionName)) {
          this.error(
            new Error(
              `PublicationCollector: Publish function returned multiple cursors for collection ${collectionName}`
            )
          );
          return;
        }
        collectionNames[collectionName] = true;
        cursors.push(res[i]);
      }
    }
    else if (res) {
      // truthy values other than cursors or arrays are probably a
      // user mistake (possible returning a Mongo document via, say,
      // `coll.findOne()`).
      this.error(
        new Error(
          "PublicationCollector: Publish function can only return a Cursor or an array of Cursors"
        )
      );
    }

    if (cursors.length > 0 || Array.isArray(res)) {
      try {
        // for each cursor we call _publishCursor method which starts observing the cursor and
        // publishes the results.
        await Promise.all(cursors.map((cur) => {
          this._ensureCollectionInRes(cur._getCollectionName());
          return cur._publishCursor(this)
        }));
      } catch (e) {
        this.error(e);
        return;
      }

      // mark subscription as ready (_publishCursor does NOT call ready())
      this.ready();
    }
  }

  added (collection, id, fields) {
    check(collection, String);
    check(id, validMongoId);

    this._ensureCollectionInRes(collection);

    // Make sure to ignore the _id in fields
    this._documents[collection][id] = { ...fields, _id: id };
  }

  changed (collection, id, fields) {
    check(collection, String);
    check(id, validMongoId);

    this._ensureCollectionInRes(collection);

    let existingDocument = this._documents[collection][id];
    const { _id, ...fieldsNoId } = fields;

    if (existingDocument) {
      existingDocument = { ...existingDocument, ...fieldsNoId };

      // Delete all keys that were undefined in fields (except _id)
      Object.entries(fields).forEach(([key, value]) => {
        if (value === undefined) {
          delete existingDocument[key];
        }
      });
    }
  }

  removed (collection, id) {
    check(collection, String);
    check(id, validMongoId);

    this._ensureCollectionInRes(collection);

    delete this._documents[collection][id];

    if (isEmpty(this._documents[collection])) {
      delete this._documents[collection];
    }
  }

  ready () {
    // Synchronously calls each of the listeners registered for the "ready" event
    this.emit("ready", this._generateResponse());
  }

  onStop (callback) {
    // Adds a one time listener function for the "stop" event
    this.once("stop", callback);
  }

  stop () {
    // Synchronously calls each of the listeners registered for the "stop" event
    this.emit("stop");
  }

  error (error) {
    throw error;
  }

  _isCursor (c) {
    return c && c._publishCursor;
  }

  _ensureCollectionInRes (collection) {
    this._documents[collection] = this._documents[collection] || Object.create(null);
  }

  _generateResponse () {
    const output = Object.create(null);

    Object.entries(this._documents).forEach(([collectionName, documents]) => {
      output[collectionName] = Object.values(documents);
    });

    return output;
  }
}
