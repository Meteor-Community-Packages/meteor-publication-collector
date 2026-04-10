/* eslint-disable prefer-arrow-callback */

Package.describe({
  name: "communitypackages:publication-collector",
  version: "2.0.0-rc.2",
  summary: "Test a Meteor publication by collecting its output.",
  documentation: "README.md",
  git: "https://github.com/johanbrook/meteor-publication-collector.git",
  debugOnly: true,
});

Package.onUse(function (api) {
  api.versionsFrom(["3.0"]);
  api.use(["ecmascript", "mongo", "check"], "server");
  api.mainModule("publication-collector.js", "server");
});

Package.onTest(function (api) {
  api.versionsFrom(["3.0"]);
  api.use(
    [
      "ecmascript",
      "mongo",
      "random",
      "meteortesting:mocha@3.3.0",
      "accounts-password",
    ],
    "server"
  );

  api.addFiles("./tests/collections.js", "server");
  api.mainModule("publication-collector.test.js", "server");
});
