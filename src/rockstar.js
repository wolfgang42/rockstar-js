const parser = require('./rockstar-parser')
const fs = require('fs-extra')

let block = 0
const generators = {
	FunctionDeclaration: f => {
		block++
		return `function ${f.n} (${f.a.join(', ')}) {`
	},
	FunctionCall: f => `${f.f}(${f.a.map(expr).join(', ')})`,
	Loop: w => {
		block++
		let cond = expr(w.e)
		if (w.c === 'Until') cond = `!(${cond})`
		return `while (${cond}) {`
	},
	Continue: _ => 'continue',
	Break: _ => 'break',
	If: i => {
		block++
		return `if (${expr(i.e)}) {`
	},
	Comparison: c => {
		let ret = expr(c.l)
		if (c.c) {
			const comp = {
				gt: '>',
				lt: '<',
				ge: '>=',
				le: '<=',
			}
			ret += comp[c.c]
		} else {
			if (c.b) {
				ret += '==='
			} else {
				ret += '!=='
			}
		}
		ret += expr(c.r)
		if (!c && !b) ret = `!(${ret})`
		return ret
	},
	BooleanOperation: b => `${expr(b.l)} ${b.b=='and'?'&&':'||'} ${expr(b.r)}`,
	Variable: v => v.n,
	Rement: r => `${r.v}${r.o}`,
	Arithmetic: a => `${expr(a.l)} ${a.o} ${expr(a.r)}`,
	Set: s => `${s.v} = ${expr(s.e)}`,
	Number: n => n.v,
	String: s => JSON.stringify(s.v),
	GiveBack: g => `return ${expr(g.e)}`,
	BlankLine: _ => {
		block--
		return '}'
	},
	Say: s=>`console.log(${expr(s.e)})`,

}

function expr(e) {
	if (!(e.t in generators)) {
		console.log(e)
		throw new Error('Unknown statement type: '+e.t)
	}
	return generators[e.t](e)
}

async function compile(filename) {
	const statements = parser.parse(await fs.readFile(filename, 'utf-8'))
	statements.forEach((stmt, i) => {
		console.log(expr(stmt))
	})
	while (block--) console.log('}')
}

compile(process.argv[2]).then(null, e => {
	console.error(e)
	process.exit(1)
})

