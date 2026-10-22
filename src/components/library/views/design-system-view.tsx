import { useState } from "react";
import { Check, X } from "lucide-react";
import { FaceIcon } from "@/components/ui/face-icon";
import { IconButton } from "@/components/ui/icon-button";
import { Segmented } from "@/components/ui/segmented";
import { GRUPOS, TOKENS, type Token } from "@/lib/ds/tokens.gen";

/** Tokens of a group, in the order the stylesheet declares them. */
const doGrupo = (grupo: string) => TOKENS.filter((t) => t.grupo === grupo);

/**
 * The value rides as a CSS variable, never as a literal: rename the token in
 * `@theme` and this breaks on the next `ds:gerar` instead of lying.
 */
const comoVariavel = (token: Token) => `var(${token.nome})`;

/**
 * The live design system (article 2164), as pane content and as a page.
 *
 * One component, two hosts: `/design-system` and the `vista:sistema` tab. If the
 * pane rendered its own copy of the token list, the route could drift from it
 * and the agent would read a view that is no longer what the app uses.
 */
export function DesignSystemView() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold tracking-tight text-fg">Sistema de design</h2>
        <p className="max-w-prose text-sm text-muted">
          Gerado de <code className="font-mono text-fg">src/styles.css</code> por{" "}
          <code className="font-mono text-fg">npm run ds:gerar</code>. Se um token aparece aqui, ele
          existe no atelier. Mudar um valor é mudar o <code className="font-mono text-fg">@theme</code>.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-fg">{GRUPOS.color ?? "color"}</h3>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {doGrupo("color").map((token) => (
            <li
              key={token.nome}
              className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3"
            >
              <div
                aria-hidden
                className="h-12 w-full rounded-md border border-border"
                style={{ background: comoVariavel(token) }}
              />
              <p className="truncate font-mono text-xs text-fg">{token.nome}</p>
              <p className="truncate text-xs text-muted">{token.valor}</p>
              <p className="truncate text-xs text-subtle">{token.classe}</p>
              {token.nota ? <p className="text-xs text-muted">{token.nota}</p> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-fg">{GRUPOS.font ?? "font"}</h3>
        <ul className="flex flex-col gap-3">
          {doGrupo("font").map((token) => (
            <li
              key={token.nome}
              className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-3"
            >
              <p className="font-mono text-xs text-muted">{token.nome}</p>
              <p className="text-xl text-fg" style={{ fontFamily: comoVariavel(token) }}>
                O rascunho marca a prova — 0123456789
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-fg">{GRUPOS.radius ?? "radius"}</h3>
        <ul className="flex flex-wrap gap-3">
          {doGrupo("radius").map((token) => (
            <li
              key={token.nome}
              className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface p-3"
            >
              <div
                aria-hidden
                className="size-16 border border-border bg-elevated"
                style={{ borderRadius: comoVariavel(token) }}
              />
              <p className="font-mono text-xs text-fg">{token.nome}</p>
              <p className="text-xs text-muted">{token.valor}</p>
            </li>
          ))}
        </ul>
      </section>

      <Gallery />
    </div>
  );
}

/** Real components, at their real styling: the page shows the parts it preaches. */
function Gallery() {
  const [vista, setVista] = useState<"grade" | "lista">("grade");
  const [ativo, setAtivo] = useState(true);

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-base font-semibold text-fg">Componentes</h3>

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
        <p className="text-xs text-muted">Segmented</p>
        <Segmented
          label="Vista"
          value={vista}
          onChange={setVista}
          options={[
            { value: "grade", label: "Grade" },
            { value: "lista", label: "Lista" },
          ]}
          className="max-w-xs"
        />
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
        <p className="text-xs text-muted">IconButton e FaceIcon</p>
        <div className="flex items-center gap-2">
          <IconButton label="Marcar como usar" active={ativo} onClick={() => setAtivo((v) => !v)}>
            <Check className="size-4" />
          </IconButton>
          <IconButton label="Marcar como evitar" onClick={() => setAtivo(false)}>
            <X className="size-4" />
          </IconButton>
          <span className="flex items-center gap-1.5 text-sm text-muted">
            {[1, 2, 3, 4, 5].map((nivel) => (
              <FaceIcon key={nivel} level={nivel as 1 | 2 | 3 | 4 | 5} />
            ))}
          </span>
        </div>
      </div>
    </section>
  );
}
