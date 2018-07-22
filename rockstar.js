const parser = require('./rockstar-parser')
const fs = require('fs-extra')

const block = []
const generators = {
	FunctionDeclaration: f => {
		block.push('function')
		return `function ${f.n} (${f.a.join(', ')}) {`
	},
	FunctionCall: f => `${f.f}(${f.a.map(expr).join(', ')})`,
	Loop: w => {
		block.push('loop')
		let cond = expr(w.e)
		if (w.c === 'Until') cond = `!(${cond})`
		return `while (${cond}) {`
	},
	Continue: _ => 'continue',
	Break: _ => 'break',
	If: i => {
		block.push('if')
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
	Arithmetic: a => `${a.v} ${a.o=='add'?'+':'-'}= ${expr(a.e)}`,
	Set: s => `${s.v} = ${expr(s.e)}`,
	Number: n => n.v,
	String: s => JSON.stringify(s.v),
	GiveBack: g => {
		let ret = ''
		// Close all blocks to end of function
		while (block.pop() != 'function') {
			if (block.length === 0) throw new Error('Blank line not ending function')
			ret += '}'
		}
		block.push('endfn')
		return ret + `return ${expr(g.e)}`
	},
	BlankLine: _ => {
		if (block.pop() != 'endfn') throw new Error('Blank line without end of function')
		return '}'
	},
	Say: s=>`console.log(${expr(s.e)})`,
	End: _ => {
		if (block.pop() != 'loop') throw new Error('End keyword without end of loop')
		return '}'
	},
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
		console.log(expr(stmt.e))
		const nextAnd = statements[i+1] && statements[i+1].a
		if (stmt.e.t != 'If' && block[block.length-1] == 'if' && !nextAnd) {
			console.log('}')
			block.pop()
		}
	})
}

compile(process.argv[2]).then(null, e => {
	console.error(e)
	process.exit(1)
})

