/* eslint-disable prefer-arrow-callback */

Package.describe({
  name: 'johanbrook:publication-collector',
  version: '1.0.6',
  summary: 'Test a Meteor publication by collecting its output.',
  documentation: 'README.md',
  git: 'https://github.com/johanbrook/meteor-publication-collector.git',
  debugOnly: true
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.2');

  api.use([
    'ecmascript',
    'underscore',
    'mongo',
    'check'
  ], 'server');

  api.addFiles('publication-collector.js', 'server');

  api.export('PublicationCollector', 'server');
});

Package.onTest(function(api) {
  api.use([
    'ecmascript',
    'mongo',
    'random',
    'dispatch:mocha',
    'accounts-password@1.3.1',
    'practicalmeteor:sinon',
    'practicalmeteor:chai@2.1.0_1',
    'underscore'
  ], 'server');

  api.use('johanbrook:publication-collector');

  api.addFiles([
    'tests/publications.js',
    'tests/publication-collector.test.js'
  ], 'server');
});
