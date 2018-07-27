const test_examples = [
	'fizzbuzz-idiomatic',
	'fizzbuzz-minimalist',
	'listen',
	'treesort',
]

const rockstar = require('../src/rockstar')
const fs = require('fs')
const child_process = require('child_process')

function promisify(fn, ...args) {
	return new Promise((resolve, reject) => fn(...args, (...result) => resolve(result)))
}
async function promisify_one(fn, ...args) {
	const r = await promisify(fn, ...args)
	if (r.length !== 1) throw new Error('promisify_one called with returning '+r.length+' args')
	return r[0]
}
async function promisify_err(fn, ...args) {
	const r = await promisify(fn, ...args)
	if (r.length !== 2) throw new Error('promisify_one called with returning '+r.length+' args')
	if (r[0]) throw r[0]
	return r[1]
}
const readFile = filename => promisify_err(fs.readFile, filename, 'utf-8')
const fileExists = filename => promisify_one(fs.exists, filename)

function runJs(code) {
	return new Promise((resolve, reject) => {
		let output = ''
		const node = child_process.spawn('node')
		node.stdout.on('data', data => output += data)
		node.on('close', () => resolve(output))
		node.stdin.end(code)
	})
}

describe('Examples', () => {
	test_examples.forEach(example => it(example, async () => {
		example = `${__dirname}/../examples/${example}`
		const rsCode = await readFile(example+'.rock')
		const jsCode = rockstar.compile(rsCode)
		if (await fileExists(example+'.out.txt')) {
			const expectOutput = await readFile(example+'.out.txt')
			const realOutput = await runJs(jsCode)
			if (expectOutput != realOutput) throw new Error('Actual output does not match expected output')
		}
	}))
})
