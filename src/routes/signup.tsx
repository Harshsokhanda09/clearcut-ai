import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [{ title: "Sign Up — ClearCut AI" }, { name: "description", content: "Coming soon" }],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
