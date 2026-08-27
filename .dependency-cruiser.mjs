export default {
  forbidden: [
    {
      name: "web-must-not-import-services",
      comment: "The website talks to services over HTTP only — never imports their code.",
      severity: "error",
      from: { path: "web/src" },
      to: { path: "services/" },
    },
    {
      name: "no-cross-service-imports-from-listings",
      comment: "listings must not import code from other services.",
      severity: "error",
      from: { path: "services/listings/src" },
      to: { path: "services/(?!listings)" },
    },
    {
      name: "no-cross-service-imports-from-availability",
      comment: "availability must not import code from other services.",
      severity: "error",
      from: { path: "services/availability/src" },
      to: { path: "services/(?!availability)" },
    },
    {
      name: "core-data-must-not-import-features-or-shell",
      comment:
        "Inner rule: core data (db/, lib/) may only be depended on — never depend on routes/ or the entrypoint.",
      severity: "error",
      from: { path: "services/[^/]+/src/(db|lib)/" },
      to: { path: "services/[^/]+/src/(routes|index)" },
    },
    {
      name: "shell-imports-inward-only",
      comment: "No file may import the service entrypoint; it is the composition root.",
      severity: "error",
      from: { path: "services/[^/]+/src/", pathNot: "services/[^/]+/src/index" },
      to: { path: "services/[^/]+/src/index" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
  },
};