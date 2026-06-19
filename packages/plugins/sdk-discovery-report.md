
================================================================================
PHASE 1: SDK DISCOVERY REPORT
================================================================================

RELEVANT FOLDERS/FILES:
-----------------------
1. SDK Package:
   - D:\Internship\Levi\packages\plugins\sdk\src\define-plugin.ts  (Plugin factory)
   - D:\Internship\Levi\packages\plugins\sdk\src\index.ts           (Main exports)
   - D:\Internship\Levi\packages\plugins\sdk\src	ypes.ts           (All type definitions)
   - D:\Internship\Levi\packages\plugins\sdk\src\protocol.ts       (JSON-RPC protocol)
   - D:\Internship\Levi\packages\plugins\sdk\src	esting.ts        (Test harnesses)
   - D:\Internship\Levi\packages\plugins\sdk\src\worker-rpc-host.ts (Worker runtime)

2. Shared Constants:
   - D:\Internship\Levi\packages\shared\src\constants.ts         (PluginEventType, capabilities)

3. Plugin Examples:
   - D:\Internship\Levi\packages\plugins\examples\plugin-hello-world-example
   - D:\Internship\Levi\packages\plugins\examples\plugin-kitchen-sink-example

4. Plugin Scaffold Tool:
   - D:\Internship\Levi\packages\plugins\create-paperclip-plugin

5. Documentation:
   - D:\Internship\Levi\doc\plugins\PLUGIN_AUTHORING_GUIDE.md
   - D:\Internship\Levi\doc\plugins\LOCAL_PLUGIN_DEVELOPMENT.md
   - D:\Internship\Levi\doc\plugins\PLUGIN_SPEC.md

HOW PLUGINS ARE REGISTERED:
---------------------------
1. Plugins are defined using `definePlugin()` from `@paperclipai/plugin-sdk`
2. The plugin exports a default manifest (src/manifest.ts) and worker (src/worker.ts)
3. The manifest declares: id, version, capabilities, entrypoints, UI slots, jobs, webhooks, tools
4. Plugins are installed via CLI: `paperclipai plugin install <path>`
5. The host reads the manifest and starts the worker process

HOW PLUGINS SUBSCRIBE TO EVENTS:
--------------------------------
Inside the `setup(ctx)` function:
  ctx.events.on("issue.created", async (event: PluginEvent) => {
    // handle event
  });

Available events (from constants.ts):
  - issue.created, issue.updated
  - issue.comment.created
  - issue.document.created/updated/deleted
  - issue.relations.updated
  - issue.checked_out, issue.released
  - agent.created, agent.updated, agent.status_changed
  - agent.run.started/finished/failed/cancelled
  - goal.created, goal.updated
  - project.created, project.updated
  - company.created, company.updated
  - And plugin-namespaced events: `plugin.<pluginId>.<eventName>`

HOW PLUGINS STORE STATE:
------------------------
Using `ctx.state` (PluginStateClient):
  - ctx.state.get({ scopeKind: "company", scopeId: "...", stateKey: "..." }) -> Promise<unknown>
  - ctx.state.set({ scopeKind: "company", scopeId: "...", stateKey: "..." }, value) -> Promise<void>
  - ctx.state.delete({ scopeKind: "company", scopeId: "...", stateKey: "..." }) -> Promise<void>

Scope kinds: "instance", "company", "project", "issue", "agent", "user"
State is isolated per plugin (plugin A cannot read plugin B's state).

HOW PLUGINS ACCESS SECRETS:
--------------------------
Using `ctx.secrets` (PluginSecretsClient):
  - ctx.secrets.resolve("MY_API_KEY") -> Promise<string>

Secrets are configured in the Paperclip secret provider.
The plugin manifest can declare `instanceConfigSchema` with a field for the secret ref.
The operator configures the secret reference in the plugin settings UI.
The plugin resolves the actual value at runtime - must never cache or log secrets.

KEY CAPABILITIES NEEDED FOR GITHUB INTEGRATION:
---------------------------------------------
- "events.subscribe" - to listen for issue.created
- "issues.read" - to read issue details
- "http.outbound" - to call GitHub API
- "secrets.read-ref" - to access GitHub PAT
- "activity.log.write" - to log sync activity
- "plugin.state.read" / "plugin.state.write" - to store sync state
- "issues.create" - if we need to create issues in Paperclip from GitHub

================================================================================
