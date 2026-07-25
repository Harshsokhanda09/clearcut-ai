import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Login — ClearCut AI" }, { name: "description", content: "Coming soon" }],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
