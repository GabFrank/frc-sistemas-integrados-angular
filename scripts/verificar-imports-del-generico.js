/**
 * Chequeo estático: nadie lee, al cargarse el archivo, un valor importado de `generic-crud.service`.
 *
 * `generic-crud.service` está en un ciclo de imports. Un `const X = { timeoutMs: TIMEOUT_… }` a nivel
 * de módulo que tome la constante de ahí puede quedar evaluado antes que el servicio en el bundle de
 * producción, y la app empaquetada queda en blanco (alphas .125 a .164, 2026-10). Esas constantes viven
 * en `generic-crud.constantes.ts`, que no puede entrar al ciclo: por eso también se verifica que ese
 * archivo no importe nada en tiempo de ejecución.
 *
 * «Al cargarse» = todo lo que corre fuera del cuerpo de una función: sentencias del módulo, `static`,
 * argumentos de decoradores. Los inicializadores de propiedades de instancia corren en el constructor.
 *
 * Es barato y no ejecuta nada. No reemplaza a `npm run verificar:arranque`, que abre el bundle de verdad.
 * No ve: una función definida en el archivo e invocada a nivel de módulo (`const X = f()`), `@Inject(VALOR)`
 * en un constructor, ni un import que no sea relativo.
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const RAIZ = path.join(__dirname, '..');
const SRC = path.join(RAIZ, 'src');
const SERVICIO = path.join(SRC, 'app', 'generics', 'generic-crud.service');
const CONSTANTES = path.join(SRC, 'app', 'generics', 'generic-crud.constantes.ts');

function archivosTs(dir, salida = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) archivosTs(p, salida);
    else if (p.endsWith('.ts') && !p.endsWith('.spec.ts') && !p.endsWith('.d.ts')) salida.push(p);
  }
  return salida;
}

const leer = (archivo) => ts.createSourceFile(archivo, fs.readFileSync(archivo, 'utf8'), ts.ScriptTarget.Latest, true);
const relativo = (archivo) => path.relative(RAIZ, archivo).split(path.sep).join('/');

/** Nombres importados como valor (no `import type`) desde `generic-crud.service`. */
function valoresDelServicio(sf) {
  const nombres = new Set();
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause || st.importClause.isTypeOnly) continue;
    const spec = st.moduleSpecifier.text;
    if (!spec.startsWith('.') || path.resolve(path.dirname(sf.fileName), spec) !== SERVICIO) continue;
    const nb = st.importClause.namedBindings;
    if (st.importClause.name) nombres.add(st.importClause.name.text);
    if (nb && ts.isNamespaceImport(nb)) nombres.add(nb.name.text);
    if (nb && ts.isNamedImports(nb)) for (const e of nb.elements) if (!e.isTypeOnly) nombres.add(e.name.text);
  }
  return nombres;
}

function lecturasAlCargar(sf, nombres) {
  const hallazgos = [];
  const visitar = (n) => {
    if (ts.isFunctionLike(n)) return;
    if (ts.isTypeNode(n) || ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n) || ts.isImportDeclaration(n)) return;
    if (ts.isHeritageClause(n)) {
      // `extends X` se evalúa al definir la clase; `implements` es solo tipo.
      if (n.token === ts.SyntaxKind.ExtendsKeyword) n.types.forEach((t) => visitar(t.expression));
      return;
    }
    if (ts.isPropertyDeclaration(n) && !(n.modifiers || []).some((m) => m.kind === ts.SyntaxKind.StaticKeyword)) {
      (n.modifiers || []).forEach((m) => ts.isDecorator(m) && visitar(m));
      return;
    }
    if (ts.isIdentifier(n) && nombres.has(n.text)) {
      const p = n.parent;
      const esNombre =
        (ts.isPropertyAssignment(p) && p.name === n) ||
        (ts.isPropertyAccessExpression(p) && p.name === n) ||
        (ts.isVariableDeclaration(p) && p.name === n);
      if (!esNombre) {
        const { line } = sf.getLineAndCharacterOfPosition(n.getStart());
        hallazgos.push(`${relativo(sf.fileName)}:${line + 1}  ${n.text}`);
      }
    }
    ts.forEachChild(n, visitar);
  };
  sf.statements.forEach(visitar);
  return hallazgos;
}

/** `import type { A }` o `import { type A, type B }`: TypeScript los borra enteros. */
function soloTipos(clausula) {
  if (!clausula) return false;
  if (clausula.isTypeOnly) return true;
  const nb = clausula.namedBindings;
  return !clausula.name && !!nb && ts.isNamedImports(nb) && nb.elements.length > 0 && nb.elements.every((e) => e.isTypeOnly);
}

/** Imports y re-exports de `generic-crud.constantes.ts` que sobreviven a la compilación. */
function importsDeEjecucion(sf) {
  const hallazgos = [];
  for (const st of sf.statements) {
    const esImport = ts.isImportDeclaration(st) && !soloTipos(st.importClause);
    const esReexport = ts.isExportDeclaration(st) && st.moduleSpecifier && !st.isTypeOnly;
    if (!esImport && !esReexport) continue;
    const { line } = sf.getLineAndCharacterOfPosition(st.getStart());
    hallazgos.push(`${relativo(sf.fileName)}:${line + 1}  ${st.getText().split('\n')[0]}`);
  }
  return hallazgos;
}

let fallo = false;

if (!fs.existsSync(CONSTANTES)) {
  console.error(`Falta ${relativo(CONSTANTES)}: las constantes del genérico tienen que vivir ahí.`);
  fallo = true;
} else {
  const imports = importsDeEjecucion(leer(CONSTANTES));
  if (imports.length) {
    console.error(
      `${relativo(CONSTANTES)} no puede importar nada en tiempo de ejecución (solo \`import type\`):\n  ${imports.join('\n  ')}`
    );
    fallo = true;
  }
}

const lecturas = [];
for (const archivo of archivosTs(SRC)) {
  const sf = leer(archivo);
  const nombres = valoresDelServicio(sf);
  if (nombres.size) lecturas.push(...lecturasAlCargar(sf, nombres));
}
if (lecturas.length) {
  console.error(
    `${lecturas.length} lectura(s) al cargarse el archivo de valores importados de generic-crud.service.\n` +
      'Importalos de `generics/generic-crud.constantes` (o usalos dentro de un método):\n  ' +
      lecturas.join('\n  ')
  );
  fallo = true;
}

if (fallo) process.exit(1);
console.log('Imports del genérico OK: ninguna lectura al cargarse el archivo.');
