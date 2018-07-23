const parser = require('./rockstar-parser')
const fs = require('fs-extra')

let it
const generators = {
	Block: b => `{${b.s.map(expr).join('')}}`,
	FunctionDeclaration: f => `function ${expr(f.n)}(${f.a.map(varname).join(',')})`,
	FunctionCall: f => `${expr(f.f)}(${f.a.map(expr).join(',')})`,
	Loop: w => {
		let cond = expr(w.e)
		if (w.c === 'Until') cond = `!(${cond})`
		return `while(${cond})`
	},
	Continue: _ => 'continue;',
	Break: _ => 'break;',
	If: i => `if(${expr(i.e)})`,
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
	BooleanOperation: b => `${expr(b.l)}${b.b=='and'?'&&':'||'}${expr(b.r)}`,
	Variable: v => {
		it = v
		return varname(v.n)
	},
	Pronoun: p => expr(it),
	Rement: r => `${r.v}${r.o};`,
	Arithmetic: a => `${expr(a.l)}${a.o}${expr(a.r)}`,
	Set: s => `${expr(s.v)}=${expr(s.e)};`,
	Literal: l => JSON.stringify(l.v),
	GiveBack: g => `return ${expr(g.e)};`,
	Say: s=>`console.log(${expr(s.e)});`,
}

function varname(v) {
	return v.replace(/ /g, '')
}

function expr(e) {
	if (!(e.t in generators)) {
		console.log(e)
		throw new Error('Unknown statement type: '+e.t)
	}
	return generators[e.t](e)
}

function ast(statements) {
	let ret = []
	let stmt
	while (stmt = statements.shift()) {
		if (stmt.t == 'BlankLine') return ret
		ret.push(stmt)
		if (stmt.t == 'If' || stmt.t == 'Loop' || stmt.t == 'FunctionDeclaration') {
			ret.push({
				t: 'Block',
				s: ast(statements),
			})
		}
	}
	return ret
}


async function compile(filename) {
	const statements = parser.parse(await fs.readFile(filename, 'utf-8'))
	const program = ast(statements)
	if (statements.length !== 0) throw new Error('Too many blank lines, left last block with some program left')
	return program.map(expr).join('')
}

compile(process.argv[2]).then(
	code => fs.writeFile(process.argv[2].replace('.rock', '.js'), code)
).then(null, e => {
	console.error(e)
	process.exit(1)
})

