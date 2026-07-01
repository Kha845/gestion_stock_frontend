import { createFileRoute } from "@tanstack/react-router";
import { PartyPage } from "@/components/PartyPage";
export const Route = createFileRoute("/clients")({ component: () => <PartyPage kind="client" /> });
