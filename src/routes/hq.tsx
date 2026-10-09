import { createFileRoute } from "@tanstack/react-router";
import { Headquarters } from "@/components/opencto/headquarters";

export const Route = createFileRoute("/hq")({ component: Headquarters });
