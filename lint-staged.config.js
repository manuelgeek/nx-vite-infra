module.exports = {
  // This will lint and format TypeScript, Vue and  //JavaScript files
  "(apps|libs)/**/*.(ts|tsx|js|vue)": (filenames) => [
    `yarn eslint --fix ${filenames.join(" ")}`,
    `yarn prettier --write ${filenames.join(" ")}`,
  ],

  // this will Format MarkDown and JSON // json
  "**/*.(json|md)": (filenames) =>
    `yarn prettier --write ${filenames.join(" ")}`,
}
