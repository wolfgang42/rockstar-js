const test_examples = [
	'fizzbuzz-idiomatic',
	'fizzbuzz-minimalist',
	'listen',
	'treesort',
]

const rockstar = require('../src/rockstar')
const fs = require('fs')

function promisify(fn, ...args) {
	return new Promise((resolve, reject) => fn(...args, (err, result) => {
		if (err) {
			reject(err)
		} else {
			resolve(result)
		}
	}))
}
const readFile = filename => promisify(fs.readFile, filename, 'utf-8')

describe('Examples', () => {
	test_examples.forEach(example => it(example, async () => {
		example = `${__dirname}/../examples/${example}`
		const rsCode = await readFile(example+'.rock')
		const jsCode = rockstar.compile(rsCode)
	}))
})
