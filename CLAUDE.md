# CLAUDE.md — Collaboration Standards

## Code Quality

### Correctness First
- Write bug-free code. Before finishing any implementation, mentally trace the execution path for the happy path, common edge cases, and error conditions.
- Never leave subtle off-by-one errors, race conditions, null dereferences, or silent failures. If a corner case is hard to handle cleanly, say so explicitly rather than patching it with a hack.
- Optimize for correctness first, then readability, then performance. Do not sacrifice the first two for the third.

### Readability
- Use descriptive, unambiguous names for variables, functions, and types. A reader should understand intent without reading the body.
- Keep functions short and focused on one responsibility. If a function needs a multi-line comment to explain what it does, it should be split.
- Prefer explicit over clever. Avoid language tricks that obscure intent even when they save lines.

### Avoiding Over-Engineering
- Do not add abstractions, interfaces, or patterns beyond what the task requires.
- Do not add parameters, flags, or configuration hooks for hypothetical future requirements.
- Do not introduce error handling for scenarios that cannot happen given the calling context.

### Comments
- Default to writing no comments. Only add one when the WHY is non-obvious: a hidden constraint, a subtle invariant, or a workaround for a known external bug.
- Never write comments that restate what the code does. Never write multi-line comment blocks as documentation padding.

---

## Accuracy

### No Hallucinations
- Never invent API methods, function signatures, library features, or CLI flags. If you are not certain a method exists, say so and verify by reading source or documentation before using it.
- Never claim code works without being able to trace its execution. Do not speculate that something "should work."
- If a task requires knowing the current behavior of a system (database schema, API response shape, config values), read the actual source first. Do not assume based on pattern matching against similar projects.

### No Fake Implementations
- Do not stub, mock, or skeleton a function and present it as a working implementation unless explicitly asked for a stub. Placeholders must be labeled clearly (e.g., `raise NotImplementedError` or `// TODO: implement`).
- Do not write tests that trivially pass without exercising real logic. Tests must assert meaningful behavior.
- If you cannot complete a task correctly, say so. Partial or incorrect code is worse than an honest gap.

### Verify Before Asserting
- Before stating that a file, function, class, or configuration key exists, read the file or grep for it. Recalled knowledge can be stale.
- Before recommending a solution, confirm it applies to the actual version of the library or runtime in use.

---

## Supply Chain Security

This is a high-priority concern. Malicious packages, dependency confusion attacks, and typosquatted libraries are active threats. Apply the following rules whenever introducing or updating third-party dependencies.

### Library Selection Criteria

**Only use libraries that meet ALL of the following:**

1. **Established provenance** — The library must have a clear, verifiable origin: an official organization, a well-known author with a track record, or a major open-source foundation. Prefer libraries that are direct dependencies of major frameworks or runtimes.

2. **Substantial adoption** — Prefer libraries with large, long-standing user bases (millions of downloads/month, thousands of GitHub stars, years of active maintenance). Avoid libraries with very low download counts or that appeared recently with no community behind them.

3. **Not too new** — Avoid libraries released or significantly updated within the past 90 days unless there is a specific, justified need. New releases have not had time for the community to discover injected malicious code or supply chain compromises.

4. **Active, reputable maintenance** — The repository should show a genuine history of commits, issues, and releases over time. A burst of activity followed by silence, or a sudden ownership transfer, is a red flag.

5. **Minimal transitive dependencies** — Prefer libraries with few or no transitive dependencies. Every indirect dependency is an additional attack surface. If a library pulls in dozens of packages to do a simple task, consider an alternative or implement the functionality directly.

### Package Name Verification (Typosquatting)

- Always verify the exact package name against the official repository or framework documentation before adding it. Do not rely on memory.
- Cross-check the package name on the registry (npm, PyPI, crates.io, etc.) against the GitHub repo to confirm they match.
- Be alert to common typosquatting patterns: transposed characters (`reqeusts` vs `requests`), added characters (`colourama` vs `colorama`), different separators (`python-dateutil` vs `python_dateutil`), and namespace confusion (`@companyname/package` vs `companyname-package`).

### Version Pinning and Lock Files

- Always pin dependencies to exact versions in production code. Do not use open ranges (`^`, `~`, `>=`) unless there is a specific reason, and document why.
- Commit lock files (`package-lock.json`, `poetry.lock`, `Cargo.lock`, `requirements.txt` with pinned versions). Lock files prevent silent upgrades to compromised versions.
- Do not run `npm update`, `pip install --upgrade`, or equivalent upgrade-all commands without first reviewing what will change.

### Code Vetting for Third-Party Inclusions

When code from a third-party source is copied directly into the project (vendored code, snippets, scripts), apply the following checks before including it:

- **Read the entire snippet.** Do not include any code you have not fully read and understood.
- **Check for exfiltration patterns:** network calls to unexpected hosts, environment variable reads (especially `HOME`, `PATH`, API keys, tokens), file system access outside the project directory, subprocess or shell execution.
- **Check for obfuscation:** base64-encoded strings that are decoded and executed, `eval()` on constructed strings, unusual use of `exec`, `__import__`, `importlib`, `reflect`, or dynamic code loading.
- **Check for install-time execution:** `postinstall` scripts (npm), `setup.py` with network calls, anything that runs at install or import time beyond what the library's stated purpose requires.
- **Check for environment probing:** code that reads environment variables or checks for specific hostnames, CI indicators, or developer machine fingerprints (common in targeted malware that activates only in certain environments).

### Dependency Integrity Verification

- When possible, verify package integrity using hashes. For Python: use `pip install --require-hashes` with a `requirements.txt` that includes `--hash=sha256:...`. For npm: `package-lock.json` includes `integrity` hashes — do not modify them manually.
- For critical dependencies, cross-check the hash listed on the registry against a known-good source or a prior install.
- Be suspicious of any workflow that disables hash checking or instructs ignoring SSL certificate errors during install.

### What to Do When Uncertain

- If a library is unfamiliar, unknown, or cannot be verified against the above criteria, do not use it. State the concern and suggest a vetted alternative or implementing the functionality directly.
- If the task requires a library that does not yet meet the "not too new" threshold, flag this explicitly so the user can make an informed decision.
- Never silently add a dependency. Always name what is being added, where it comes from, and why it was chosen over alternatives.

---

## General Workflow Rules

- Read relevant files before editing them. Do not write to a file based solely on assumed content.
- Do not run destructive operations (deleting files, dropping tables, force-pushing) without explicit user confirmation.
- When a task is ambiguous, ask one focused clarifying question rather than guessing and implementing a wrong interpretation.
- Report blockers honestly. If a task cannot be done correctly given current constraints, say so clearly.
