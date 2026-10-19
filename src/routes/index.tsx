import { createFileRoute } from "@tanstack/react-router";
import { Atelier } from "@/components/library/atelier";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Atelier />;
}
