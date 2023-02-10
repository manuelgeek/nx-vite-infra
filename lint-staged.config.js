module.exports = {
  // this will check Typescript files
  "(apps/libs)/**/*.(ts|tsx)": () => "yarn tsc --noEmit",

  // This will lint and format TypeScript, Vue and  //JavaScript files
  "(apps/libs)/**/*.(ts|tsx|js|vue)": (filenames) => [
    `yarn eslint --fix ${filenames.join(" ")}`,
    `yarn prettier --write ${filenames.join(" ")}`,
  ],

  // this will Format MarkDown and JSON
  "(apps/libs)/**/*.(md|json)": (filenames) =>
    `yarn prettier --write ${filenames.join(" ")}`,
}
