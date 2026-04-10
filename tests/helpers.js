import { assert } from "chai";

export const times = async (n, fn) => {
	for (let i = 0; i < n; i++) {
		await fn(i);
	}
};

export const shouldThrow = async ({
	fn,
	error,
	name,
	message,
	reason,
	details,
}) => {
	try {
		await fn();
		assert.fail("should have thrown an error");
	} catch (e) {
		if (error) {
			assert.equal(e.error, error, "error code matches");
		}
		if (name) {
			assert.equal(e.name, name, "error name matches");
		}
		if (message) {
			assert.equal(e.message, message, "error message matches");
		}
		if (reason) {
			assert.equal(e.reason, reason, "error reason matches");
		}
		if (details) {
			assert.deepEqual(e.details, details, "error details matches");
		}
	}
};
