# Publication Collector

[![CircleCI](https://img.shields.io/circleci/project/johanbrook/meteor-publication-collector.svg?maxAge=2592000)]()

This package makes testing publications in Meteor easier and nicer.

Instead of resorting to exporting or exposing your publication functions for doing testing, this package lets you "subscribe" to a given publication and assert its returned results.

## Installation

```
meteor add johanbrook:publication-collector
```

## Usage

```js
// In a typical BDD style test suite:

describe('Publication', function() {
  it('should publish 10 documents', function(done) {
    // Pass user context in constructor.
    const collector = new PublicationCollector({userId: Random.id()});

    // Collect documents from a subscription with 'collect(name, [arguments...], [callback])'
    collector.collect('publicationName', 'someArgument', (collections) => {
      assert.equal(collections.myCollection.length, 10);
      done();
    });
  });
});
```

An instance of `PublicationCollector` also is an `EventEmitter`, and emits a `ready` event when the publication is marked as ready.

## Tests

Run tests once with

```
npm test
```

Run tests in watch mode (in console) with

```
npm run test:dev
```

## History

This project was originally a part of MDG's [Todos](https://github.com/meteor/todos) example Meteor app, but later extracted as a separate test package.

Based on https://github.com/stubailo/meteor-rest/blob/devel/packages/rest/http-subscription.js.

## Releases

- `1.0.5` - Fix an issue when publish handlers are using default arguments ([#15](https://github.com/johanbrook/meteor-publication-collector/pull/15)). Thanks @dmihal!
- `1.0.4` - Don't try to operate on a document that doesn't exist in `changed` callback. Thanks @zenweasel, from [#13](https://github.com/johanbrook/meteor-publication-collector/pull/13)!
- `1.0.3` - Fix compatibility with `peerlibrary:reactive-publish` package (bug #3), fixed in [#10](https://github.com/johanbrook/meteor-publication-collector/pull/10). Thanks [@hexsprite](https://github.com/hexsprite)!
- `1.0.2` - Fix bug where `ready()` wasn't called if there were no results from a publication handler.
- `1.0.1`
  - Fixes inconsistent results from publication collector (thanks @PhilippSpo in [#2](https://github.com/johanbrook/meteor-publication-collector/issues/2)).
  - Return an empty array if there are no returned documents from a publication ([#5](https://github.com/johanbrook/meteor-publication-collector/issues/5)).
  - Accept `Mongo.ObjectID` as `_id` attribute ([#8](https://github.com/johanbrook/meteor-publication-collector/issues/8)).
- `1.0.0` - First public release.

## To do

- [x] Make tests pass.
- [ ] More docs.
- [ ] Support Promises.
