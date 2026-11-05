/** @type {import("jest").Config} */
module.exports = {
  preset: "jest-expo",
  // İlk dönüşüm React Native'i derlediği için soğuk başlangıç yavaştır.
  testTimeout: 30_000,
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  testPathIgnorePatterns: ["/node_modules/", "/android/"],
};
