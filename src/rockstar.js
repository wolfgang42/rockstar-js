const parser = require('./rockstar-parser')

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
	Else: _ => 'else',
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
	Rement: r => `${expr(r.v)}${r.o};`,
	Arithmetic: a => `${expr(a.l)}${a.o}${expr(a.r)}`,
	Set: s => `${expr(s.v)}=${expr(s.e)};`,
	Literal: l => JSON.stringify(l.v),
	GiveBack: g => `return ${expr(g.e)};`,
	Say: s=>`console.log(${expr(s.e)});`,
	Listen: ({ v }) => `${varname(v.n)} = $readLineSync();`
}

const dependencies = {
	addReadLine: `
		function $readLineSync() {
			const line = [];
			const buffer = Buffer.alloc(1);
			while (true) {
				const bytes = $fs.readSync(1, buffer, 0, 1, null);
				if (!bytes) break;
				if (buffer[0] === 10 || buffer[0] === 13) break;
				line.push(buffer[0]);
			}
			return Buffer.from(line).toString('utf-8');
		}
		`,
	fs: `const $fs = require('fs');`,
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

function _groupBlocks(statements) {
	let ret = []
	let stmt
	while (stmt = statements.shift()) {
		if (stmt.t == 'BlankLine') return ret
		ret.push(stmt)
		if (stmt.t == 'If' || stmt.t == 'Else' || stmt.t == 'Loop' || stmt.t == 'FunctionDeclaration') {
			ret.push({
				t: 'Block',
				s: _groupBlocks(statements),
			})
		}
	}
	return ret
}
function groupBlocks(statements) {
	const ret = _groupBlocks(statements)
	if (statements.length !== 0) throw new Error('Too many blank lines, left last block with some program left')
	return ret
}

function computeDependencies(statements) {
	const deps = [];
	if (statements.some(s => s.t === 'Listen')) {
		deps.push('fs', 'addReadLine');
	}
	// TODO: (eventually) remove dup `deps`
	return deps;
}

function generateDependencies(deps) {
	return deps.map(d => dependencies[d]);
}

function parse(programText) {
	return parser.parse(programText)
}

function compile(programText) {
	const statements = parse(programText)
	const dependencies = generateDependencies(computeDependencies(statements));
	const program = groupBlocks(statements)

	return [
		...dependencies,
		...program.map(expr)
	].join('')
}

module.exports = {
	varname,
	expr,
	groupBlocks,
	parse,
	compile,
	computeDependencies,
	generateDependencies,
}
