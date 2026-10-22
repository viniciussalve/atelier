import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";

/**
 * AC-03: transpile explicit TS/TSX modules in memory with the installed compiler.
 * Node retains resolution/package/JSON semantics; this is not Vite or typecheck.
 * AC-01: syntax/read failures propagate with original source diagnostics.
 */
export async function load(url, context, nextLoad) {
  const parsed = new URL(url);
  if (parsed.protocol !== "file:" || !/\.tsx?$/.test(parsed.pathname)) {
    // AC-03: do not reinterpret JavaScript, packages, JSON or non-file URLs.
    return nextLoad(url, context);
  }
  const fileName = fileURLToPath(parsed);
  if (Object.keys(context.importAttributes ?? {}).length) {
    // AC-03: shortCircuit bypasses Node's validation; TS/TSX supports no import attributes.
    throw new TypeError(
      `Import attributes ${JSON.stringify(context.importAttributes)} are not supported for TypeScript module ${fileName}`,
    );
  }
  const source = await readFile(parsed, "utf8");
  const result = ts.transpileModule(source, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      verbatimModuleSyntax: true,
      inlineSourceMap: true,
      inlineSources: true,
    },
  });
  const errors = (result.diagnostics ?? []).filter(
    (d) => d.category === ts.DiagnosticCategory.Error,
  );
  if (errors.length) {
    // AC-01/03: transpileModule can emit despite syntax errors; never run that output.
    const diagnostics = errors.map((diagnostic) => {
      const position = diagnostic.file?.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
      const location = position ? `${position.line + 1}:${position.character + 1}` : "1:1";
      return `${fileName}:${location} TS${diagnostic.code}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`;
    });
    throw new SyntaxError(diagnostics.join("\n"));
  }
  // AC-03: no emitted files and no dependency on Node's optional amaro build.
  return { format: "module", source: result.outputText, shortCircuit: true };
}
