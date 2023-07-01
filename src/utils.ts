import { Abstraction, Application, Term, Variable } from './ast';

export function join<T extends { toString(): string }>(
	set: Set<T>,
	separator: string
): string {
	let joined = '',
		first = true;
	set.forEach(val => {
		if (first) {
			joined += val.toString();
			first = false;
			return;
		}
		joined += `${separator}${val.toString()}`;
	});
	return joined;
}

// TODO: https://medium.com/@fillopeter/pattern-matching-with-typescript-done-right-94049ddd671c

export function transformTerm<T>(
	root: Term,
	funcs: {
		absf: (abs: Abstraction, body: T) => T;
		appf: (app: Application, func: T, arg: T) => T;
		vf: (v: Variable) => T;
	}
): T {
	switch (root.type) {
		case 'abs': {
			const body = transformTerm(root.body, funcs);
			return funcs.absf(root, body);
		}
		case 'app': {
			const func = transformTerm(root.func, funcs),
				arg = transformTerm(root.arg, funcs);
			return funcs.appf(root, func, arg);
		}
		case 'var':
			return funcs.vf(root);
		default:
			throw Error('Term traversal failed');
	}
	// if (root instanceof Abstraction) {
	// 	const body = transformTerm(root.body, funcs);
	// 	return funcs.absf(root, body);
	// } else if (root instanceof Application) {
	// 	const func = transformTerm(root.func, funcs),
	// 		arg = transformTerm(root.argument, funcs);
	// 	return funcs.appf(root, func, arg);
	// } else if (root instanceof Variable) {
	// 	return funcs.vf(root);
	// } else {
	// 	throw Error('Term traversal failed');
	// }
}

export function traverseTerm(
	root: Term,
	funcs: {
		absf?: (abs: Abstraction) => void;
		appf?: (app: Application) => void;
		vf?: (v: Variable) => void;
	}
) {
	transformTerm<void>(root, {
		absf: abs => funcs.absf?.(abs),
		appf: app => funcs.appf?.(app),
		vf: v => funcs.vf?.(v),
	});
}

export function stringify(term: Term): string {
	return transformTerm<string>(term, {
		absf: (abs, body) => `(λ${abs.name}. ${body})`,
		appf: (_, func, arg) => `(${func} ${arg})`,
		vf: v => v.name,
	});
}

export function clone(term: Term, new_parent: Term | null = null) {
	const cloned: Term = transformTerm<Term>(term, {
		absf: (abs, body) => new Abstraction(abs.name, abs.id, body),
		appf: (_, func, arg) => new Application(func, arg),
		vf: v => Variable.fromOther(v),
	});
	cloned.parent = new_parent;
	return cloned;
}
