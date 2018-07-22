This is a work-in-progress implementation of the [Rockstar](https://github.com/dylanbeattie/rockstar) language.

It transpiles Rockstar code to JavaScript.

Usage:
```
yarn install
node_modules/.bin/pegjs src/rockstar-parser.peg
node ./src/rockstar.js program.rock
```

**Note:** Due to the extremely fast speed of updates to Rockstar, this implementation may not always match the current spec. [wolfgang42/rockstar](https://github.com/wolfgang42/rockstar) has the version of this spec targeted by this implementation.

Also, since this is a WIP not all of Rockstar works properly yet.

Contributions welcome!
