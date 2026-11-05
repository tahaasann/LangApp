const { withAppBuildGradle } = require("expo/config-plugins");

const MARKER = "buildStagingDirectory";
// `rootDir` apps/mobile/android'dir; `.ll` depo yanındadır (bkz. react-native.config.js).
const SNIPPET = `
    if (System.getProperty("os.name").toLowerCase().contains("windows")) {
        // Windows yol sınırı için C++ derleme klasörü kısa bir yola alınır.
        externalNativeBuild { cmake { ${MARKER} file("\${rootDir}/../../../../.ll/c") } }
    }`;

module.exports = function withShortCmakeObjectPaths(config) {
  return withAppBuildGradle(config, (gradle) => {
    if (gradle.modResults.contents.includes(MARKER)) return gradle;
    gradle.modResults.contents = gradle.modResults.contents.replace(
      /^android\s*\{/m,
      (match) => `${match}${SNIPPET}`,
    );
    return gradle;
  });
};
