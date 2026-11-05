const fs = require("node:fs");
const path = require("node:path");

// expo-router'ın isteğe bağlı bağımlılıkları olarak kurulurlar ama kullanılmazlar.
const unused = ["react-native-gesture-handler", "react-native-reanimated", "react-native-worklets"];

// Bu modüllerin C++ nesne yolları Windows'ta ninja'nın 260 karakter sınırını aşıyor.
// Derleme, depo yanındaki `.ll` klasöründen kısa bağlantılarla (junction) yapılır.
const longPathModules = {
  "react-native-safe-area-context": { link: "sac", cmake: "android/src/main/jni/CMakeLists.txt" },
  "react-native-screens": { link: "scr", cmake: "android/src/main/jni/CMakeLists.txt" },
};

const repoRoot = path.resolve(__dirname, "../..");
const shortRoot = path.resolve(repoRoot, "..", ".ll");

function shortCmakeOverride(name, { link, cmake }) {
  const moduleDir = path.join(repoRoot, "node_modules", name);
  const linkDir = path.join(shortRoot, link);
  fs.mkdirSync(shortRoot, { recursive: true });
  if (!fs.existsSync(linkDir)) fs.symlinkSync(moduleDir, linkDir, "junction");
  return {
    platforms: {
      android: {
        cmakeListsPath: path.relative(path.join(moduleDir, "android"), path.join(linkDir, cmake)),
      },
    },
  };
}

const dependencies = Object.fromEntries(
  unused.map((name) => [name, { platforms: { android: null, ios: null } }]),
);
if (process.platform === "win32") {
  for (const [name, options] of Object.entries(longPathModules)) {
    dependencies[name] = shortCmakeOverride(name, options);
  }
}

module.exports = { dependencies };
