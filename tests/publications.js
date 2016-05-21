/* global Documents: true */
/* eslint-disable prefer-arrow-callback */

Documents = new Mongo.Collection('documents');

Meteor.publish('publication', function() {
  return Documents.find();
});

Meteor.publish('publicationWithUser', function() {

  if (!this.userId || this.userId !== 'foo') {
    return this.ready();
  }

  return Documents.find();
});

Meteor.publish('publicationError', function() {

  if (!this.userId) {
    this.error(new Meteor.Error('not-authorized', 'Not authorized'));
  }

  return Documents.find();
});
