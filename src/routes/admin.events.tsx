import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/events")({
  head: () => ({
    meta: [
      { title: "Eventy — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <Outlet />,
});
