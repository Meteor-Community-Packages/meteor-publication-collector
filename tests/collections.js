import { Mongo } from 'meteor/mongo';

export const Documents = new Mongo.Collection('documents');
export const Books = new Mongo.Collection('books');
