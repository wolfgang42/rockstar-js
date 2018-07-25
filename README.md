This is a work-in-progress implementation of the [Rockstar](https://github.com/dylanbeattie/rockstar) language.

It transpiles Rockstar code to JavaScript.

Usage:
```
yarn install
./rockstar program.rock
node program.js
```

**Note:** Due to the extremely fast speed of updates to Rockstar, this implementation may not always match the current spec. [wolfgang42/rockstar](https://github.com/wolfgang42/rockstar) has the version of this spec targeted by this implementation. View differences between the two here: [wolfgang42/master...dylanbeattie/master](https://github.com/wolfgang42/rockstar/compare/master...dylanbeattie:master)

Also, since this is a WIP not all of Rockstar works properly yet.

Contributions welcome!

# Design
Transpilation is broken up into three stages: parsing, block grouping, and code generation.

## Parsing
First, the text of the program is parsed into statements and expressions. The resulting tokens are objects which have a `t` property containing the type of the token, plus other properties (generally a single mnemonic letter) with additional information about the token.

Parsing is currently implemented using [PEG.js](https://pegjs.org/), a JS Parser Generator. I'm not entirely convinced that this was the best choice but it seems to work OK so far.

For example, the poetic string literal:
```
Billy says hello world!
```
is parsed by this expression:
```
PoeticString = v:Variable _ 'says' ' ' t:$[^\n]*
	{ return {t: 'Set', v: v, e: {t: 'Literal', v: t}} }
```
into this token:
```javascript
{t: "Set", v: {t: "Variable", n: "Billy"}, e: {t: "Literal", v: "hello world!"}}
```
(Notice that this token contains two other tokens, `v` and `e`.)

**Note for developers:** After changing `rockstar-parser.peg`, make sure you run `yarn build` to regenerate the parser code.

## Block grouping
The parsing step returns a series of statements, but does not know about blocks. This step (implemented by the `groupBlocks` function) finds statements which begin blocks (`If`, `While`, and so on) and groups the statements together inside a `Block` token, removing `BlankLine` tokens.

## Code generation
This stage takes the tokens and emits JavaScript code. Each token has a function in the `generators` object which takes a token and returns a string. Many of these operate recursively, calling `expr()` on a token to generate code to be included.

For example, the `Set` token generator:
```javascript
Set: s => `${expr(s.v)}=${expr(s.e)};`,
```
takes a Token like this:
```javascript
{t: "Set", v: {t: "Variable", n: "Billy"}, e: {t: "Literal", v: "hello world!"}}
```
and returns this code:
```javascript
Billy="hello world!";
```
