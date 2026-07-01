import { createFileRoute } from "@tanstack/react-router";
import { PartyPage } from "@/components/PartyPage";
export const Route = createFileRoute("/fournisseurs")({ component: () => <PartyPage kind="fournisseur" /> });
