/* eslint-disable prefer-arrow-callback */
import { Books, Documents } from "./collections";

Meteor.publish("publication", () => Documents.find());

Meteor.publish("publicationWithSeveralCursors", () => [
	Documents.find(),
	Books.find(),
	Meteor.users.find(),
]);

Meteor.publish("publicationUsingLowLevelACRInterface", async function () {
	const count = await Documents.countDocuments();

	Meteor.setTimeout(() => {
		this.added("counts", "Documents", { count });
		this.ready();
	}, 100);
});

Meteor.publish("publicationWithPostReadyChanges", async function () {
	const count = await Documents.countDocuments();

	this.ready();

	Meteor.setTimeout(() => {
		this.added("counts", "Documents", { count });
	}, 100);
});

Meteor.publish("publicationWithUser", function () {
	if (!this.userId || this.userId !== "foo") {
		return this.ready();
	}

	return Documents.find();
});

Meteor.publish("publicationError", function () {
	if (!this.userId) {
		this.error(new Meteor.Error("not-authorized", "Not authorized"));
	}

	return Documents.find();
});

Meteor.publish("async.publication", async () => Documents.find());
