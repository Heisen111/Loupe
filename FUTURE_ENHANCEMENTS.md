# Loupe Future Enhancements

I built the core auditing engine and Foundry test generator this weekend, but my vision for automated Web3 security goes way further. Here is the roadmap for the next evolution of Loupe.

### Core AI & Architecture Upgrades
*   **Frontier Model Integration (Enterprise Tier):** Upgrade the OpenRouter pipeline to route deep dive vulnerability checks through top tier models like Claude 4.6 Sonnet and GPT-5.5. The current architecture is entirely model agnostic. Unlocking these high precision, current gen models simply requires the API funding to scale.
*   **Multi Agent Consensus System:** Transition from a single agent pass to a Swarm architecture. I plan to deploy 3 distinct LLM agents (an Attacker, a Defender, and a Judge) to peer review findings, debate edge cases, and eliminate false positives before generating the final JSON.
*   **Exploit Database Cross Referencing:** Integrate with live threat intelligence feeds like the Rekt Database and Web3 Exploit DB to automatically match found vulnerabilities with historical on chain hacks.

### Integrations & Workflow
*   **Direct GitHub Repo Scanning:** Move beyond single file pasting. Users will be able to input a GitHub repo URL, and the backend will clone, map the file tree, and analyze the entire architecture with cross file context (libraries, interfaces, imports).
*   **Automated Report Dispatch:** Add webhook and SMTP integrations to automatically deliver the final PDF or JSON audit reports directly to a team's email or Slack channel upon completion.
*   **GitHub CI/CD Action:** Build a native GitHub Action to automatically run Loupe on every new Pull Request, blocking merges if critical vulnerabilities are found.

### Engine & Infrastructure
*   **Database Persistence:** Transition from a stateless architecture to Postgres to save, query, and share past audit histories.
*   **Expanded Chain Support:** Add explicit scaffolding for L2s and non EVM chains like Solana and Starknet.
*   **Local LLM Mode:** Integrate Ollama so developers can run audits entirely locally for maximum privacy and zero API costs.