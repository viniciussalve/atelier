import type { CSSProperties, ReactNode } from "react";
import { groundOf } from "@/components/library/shared/grounds";
import { parseWeights, weightName, weightRoles, type WeightRoles } from "@/lib/library/fonts";
import type { Asset } from "@/lib/library/types";
import type { PaneSettings } from "@/lib/library/workspace-model";
import { cn } from "@/lib/utils";
import { SpecimenScreen, SpecimenSection } from "./section";

const ROLES: { id: keyof WeightRoles; label: string }[] = [
  { id: "texto", label: "Texto" },
  { id: "rotulo", label: "Rótulos" },
  { id: "titulo", label: "Títulos" },
];

/**
 * The font at work: six small screens, sized in em of the pane's "Corpo"
 * (0.875em is 14 px at 16), each part in the weight the font has for its role.
 */
export function FontInterface({
  asset,
  paneId,
  settings,
}: {
  asset: Asset;
  paneId: string;
  settings: PaneSettings;
}) {
  const ground = groundOf(settings.ground);
  const roles = weightRoles(parseWeights(asset.weights));
  const w = (role: keyof WeightRoles): CSSProperties => ({ fontWeight: roles[role] });
  const ui = {
    w,
    primary: ground.dark ? "bg-paper text-paper-fg" : "bg-ink text-fg",
    // The switch knob is cut from the ground, so it reads on light and dark alike.
    knob: ground.surface,
  };
  const single = roles.texto === roles.titulo;

  return (
    <div style={{ fontSize: settings.fontSize }}>
      <SpecimenSection
        title="Interface"
        section="interface"
        asset={asset}
        paneId={paneId}
        onPaper={!ground.dark}
      >
        {/* The legend is set in the weights it names. */}
        <p
          className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-[0.875em]"
          style={{ fontFamily: asset.family }}
        >
          {ROLES.map((role) => (
            <span key={role.id} style={w(role.id)}>
              {role.label}{" "}
              <span className="font-sans text-xs font-normal opacity-60 tabular-nums">
                {roles[role.id]} {weightName(roles[role.id])}
              </span>
            </span>
          ))}
          {single ? (
            <span className="font-sans text-xs opacity-60">Esta fonte tem um peso só.</span>
          ) : null}
        </p>
        <div
          className="mt-6 grid items-start gap-x-6 gap-y-8 @3xl:grid-cols-2"
          style={{ fontFamily: asset.family, ...w("texto") }}
        >
          <SpecimenScreen title="Conversa">
            <Chat {...ui} />
          </SpecimenScreen>
          <SpecimenScreen title="Formulário">
            <Form {...ui} />
          </SpecimenScreen>
          <SpecimenScreen title="Tabela">
            <Table {...ui} />
          </SpecimenScreen>
          <SpecimenScreen title="Métricas">
            <Metrics {...ui} />
          </SpecimenScreen>
          <SpecimenScreen title="Menu e aviso">
            <Menu {...ui} />
          </SpecimenScreen>
          <SpecimenScreen title="Configurações">
            <Settings {...ui} />
          </SpecimenScreen>
        </div>
      </SpecimenSection>
    </div>
  );
}

type Ui = { w: (role: keyof WeightRoles) => CSSProperties; primary: string; knob: string };

function Button({
  children,
  primary,
  style,
}: {
  children: ReactNode;
  primary?: string;
  style: CSSProperties;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[2.25em] shrink-0 items-center rounded-md px-[0.85em] text-[0.875em]",
        primary ?? "border border-current/20",
      )}
      style={style}
    >
      {children}
    </span>
  );
}

function Chat({ w, primary }: Ui) {
  return (
    <div className="space-y-3 p-3 text-[0.875em] leading-snug">
      <p className="flex items-baseline gap-2">
        <span style={w("titulo")}>Assistente</span>
        <span className="text-[0.857em] opacity-60">agora</span>
      </p>
      <p className="max-w-[34ch] rounded-lg bg-current/[0.06] px-3 py-2">
        Encontrei 3 voos para Recife na sexta. O mais barato sai às 6h40, por {"R$\u00a0489,90"}.
      </p>
      <p className="ml-auto max-w-[28ch] rounded-lg border border-current/15 px-3 py-2">
        Pode reservar o das 6h40.
      </p>
      <div className="flex items-center gap-2 text-[1.143em]">
        <span className="flex h-[2.25em] min-w-0 flex-1 items-center rounded-md border border-current/20 px-[0.75em] text-[0.875em] opacity-60">
          <span className="truncate">Escreva uma mensagem</span>
        </span>
        <Button primary={primary} style={w("rotulo")}>
          Enviar
        </Button>
      </div>
    </div>
  );
}

function Form({ w, primary }: Ui) {
  return (
    <div className="space-y-3 p-3 text-[0.875em]">
      <p className="text-[1.143em]" style={w("titulo")}>
        Criar conta
      </p>
      <label className="block space-y-1">
        <span className="block text-[0.857em]" style={w("rotulo")}>
          Nome completo
        </span>
        <span className="flex h-[2.4em] items-center rounded-md border border-current/20 px-[0.75em]">
          Ana Lúcia Ribeiro
        </span>
      </label>
      <label className="block space-y-1">
        <span className="block text-[0.857em]" style={w("rotulo")}>
          E-mail
        </span>
        <span className="flex h-[2.4em] items-center rounded-md border-2 border-current/60 px-[0.75em]">
          ana@exemplo
        </span>
        <span className="block text-[0.857em] opacity-75">
          Falta o domínio, como em ana@exemplo.com.br
        </span>
      </label>
      <p className="flex items-center gap-2">
        <span className="grid size-[1.15em] place-items-center rounded-[0.25em] border border-current/40 text-[0.8em] leading-none">
          ✓
        </span>
        Aceito os termos de uso
      </p>
      <div className="flex justify-end gap-2 text-[1.143em]">
        <Button style={w("rotulo")}>Cancelar</Button>
        <Button primary={primary} style={w("rotulo")}>
          Criar conta
        </Button>
      </div>
    </div>
  );
}

const ORDERS: [string, string, string, string][] = [
  ["Ana Ribeiro", "12/10", "R$ 1.250,00", "Pago"],
  ["Ícaro Lima", "11/10", "R$ 89,90", "Pendente"],
  ["Olívia Duarte", "09/10", "R$ 12.004,10", "Pago"],
  ["Iuri Nogueira", "08/10", "R$ 310,00", "Cancelado"],
];

function Table({ w }: Ui) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[0.875em]">
        <thead>
          <tr className="border-b border-current/15 text-left text-[0.857em]">
            <th className="px-2 py-2 @md:px-3" style={w("rotulo")}>
              Cliente
            </th>
            <th className="px-2 py-2 @md:px-3" style={w("rotulo")}>
              Data
            </th>
            <th className="px-2 py-2 @md:px-3 text-right" style={w("rotulo")}>
              Valor
            </th>
            <th className="px-2 py-2 @md:px-3" style={w("rotulo")}>
              Situação
            </th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {ORDERS.map(([client, date, value, status]) => (
            <tr key={client} className="border-b border-current/10 last:border-0">
              <td className="px-2 py-2 @md:px-3 whitespace-nowrap">{client}</td>
              <td className="px-2 py-2 @md:px-3">{date}</td>
              <td className="px-2 py-2 @md:px-3 text-right whitespace-nowrap">{value}</td>
              <td className="px-2 py-2 @md:px-3">
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[0.857em]",
                    status === "Pago" ? "border-current/40" : "border-current/15 opacity-70",
                  )}
                  style={w("rotulo")}
                >
                  {status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const METRICS: [string, string, string][] = [
  ["Receita do mês", "R$ 48,3 mil", "+12,4% sobre setembro"],
  ["Clientes ativos", "1.208", "+38 nesta semana"],
  ["Respondidas em 1 h", "98,6%", "−0,3 ponto"],
];

function Metrics({ w }: Ui) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(10em,1fr))]">
      {METRICS.map(([label, value, delta]) => (
        <div key={label} className="p-3">
          <p className="text-[0.75em] opacity-70" style={w("rotulo")}>
            {label}
          </p>
          <p
            className="mt-1 text-[1.75em] leading-none whitespace-nowrap tabular-nums"
            style={w("titulo")}
          >
            {value}
          </p>
          <p className="mt-1.5 text-[0.75em] tabular-nums opacity-70">{delta}</p>
        </div>
      ))}
    </div>
  );
}

const MENU: [string, number | null][] = [
  ["Início", null],
  ["Mensagens", 12],
  ["Relatórios", null],
  ["Configurações", 1],
];

function Menu({ w }: Ui) {
  return (
    <div className="text-[0.875em]">
      <ul className="p-1">
        {MENU.map(([item, count], index) => (
          <li
            key={item}
            className={cn(
              "flex h-[2.3em] items-center justify-between rounded-md px-3",
              index === 0 && "bg-current/[0.06]",
            )}
            style={index === 0 ? w("rotulo") : undefined}
          >
            {item}
            {count ? (
              <span
                className="rounded-full bg-current/10 px-1.5 text-[0.857em] tabular-nums"
                style={w("rotulo")}
              >
                {count}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-3 border-t border-current/15 px-3 py-2.5">
        <span>Alterações salvas às 14h32.</span>
        <span className="underline underline-offset-2" style={w("rotulo")}>
          Desfazer
        </span>
      </div>
    </div>
  );
}

const PREFERENCES: [string, string, boolean][] = [
  ["Resumo por e-mail", "Um por dia, às 8h, com o que ficou pendente.", true],
  ["Modo compacto", "Mostra mais linhas em cada tela.", false],
  ["Sons de aviso", "Toca quando uma resposta chega.", false],
];

function Settings({ w, knob }: Ui) {
  return (
    <ul className="divide-y divide-current/10 text-[0.875em]">
      {PREFERENCES.map(([title, detail, on]) => (
        <li key={title} className="flex items-center justify-between gap-4 px-3 py-2.5">
          <span className="min-w-0">
            <span className="block" style={w("rotulo")}>
              {title}
            </span>
            <span className="block text-[0.857em] opacity-70">{detail}</span>
          </span>
          <span
            aria-hidden
            className={cn(
              "flex h-[1.25em] w-[2.2em] shrink-0 items-center rounded-full p-[0.15em]",
              on ? "justify-end bg-current/70" : "bg-current/15",
            )}
          >
            <span className={cn("size-[0.95em] rounded-full", knob)} />
          </span>
        </li>
      ))}
    </ul>
  );
}
