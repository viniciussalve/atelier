import { createFileRoute } from "@tanstack/react-router";
import { DesignSystemView } from "@/components/library/views/design-system-view";

/** The live design system: the same tokens the site uses, rendered. */
export const Route = createFileRoute("/design-system")({ component: DesignSystem });

/**
 * The page is a host, not an owner: the body lives in `DesignSystemView` so the
 * `vista:sistema` pane shows exactly what this page shows.
 */
function DesignSystem() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-fg">Sistema de design</h1>
      <DesignSystemView />
    </main>
  );
}
