// Include Babel
// it will parse all code that comes after it.
// (Not recommended for production use). //TODO: get a webpack.prod.js and run it.

require('@babel/register')({
  //ignore: [/\/(build|node_modules)\//],
  presets: ["@babel/preset-env"]
});

require('./src/index.js');
