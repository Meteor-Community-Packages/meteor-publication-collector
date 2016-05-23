# Publication Collector

[![CircleCI](https://circleci.com/gh/johanbrook/meteor-publication-collector/tree/master.svg?style=svg)](https://circleci.com/gh/johanbrook/meteor-publication-collector/tree/master)

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
  if('should publish 10 documents', function() {
    // Pass user context in constructor.
    const collector = new PublicationCollector({userId: Random.id()});

    // Collect documents from a subscription with 'collect(name, [arguments...], [callback])'
    collector.collect('publicationName', 'someArgument', (collections) => {
      assert.equal(collections.myCollection.length, 10);
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

## To do

- [ ] Make tests pass.
- [ ] More docs.
- [ ] Support Promises.
