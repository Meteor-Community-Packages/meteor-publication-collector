/* global Documents: true, Books: true */
/* eslint-disable prefer-arrow-callback */

Documents = new Mongo.Collection('documents');
Books = new Mongo.Collection('books');

Meteor.publish('publication', function() {
  return Documents.find();
});

Meteor.publish('publicationWithSeveralCursors', function() {
  return [Documents.find(), Books.find(), Meteor.users.find()];
});

Meteor.publish('publicationUsingLowLevelACRInterface', function() {
  const count = Documents.find().count();

  Meteor.setTimeout(() => {
    this.added('counts', 'Documents', { count });
    this.ready();
  }, 100);
});

Meteor.publish('publicationWithPostReadyChanges', function() {
  const count = Documents.find().count();

  this.ready();

  Meteor.setTimeout(() => {
    this.added('counts', 'Documents', { count });
  }, 100);
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
