---
name: fable-5-prompting
description: Write, review, or improve prompts, system prompts, skills, or agent scaffolding for Claude Fable 5 (or Claude Mythos 5). Use whenever the user asks for "a prompt for Fable", mentions prompting/steering claude-fable-5, migrating prompts from Opus/Sonnet to Fable 5, or building agents/harnesses that run on Fable 5.
---

# Prompting Claude Fable 5

Guidance distilled from Anthropic's official guide:
https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5

Claude Fable 5 (and Claude Mythos 5, the same underlying model) is a Mythos-class model above Opus in capability. It excels at long-horizon autonomy, first-shot correctness on well-specified complex problems, ambiguity navigation, parallel subagents, vision, and code review/debugging. It is NOT intended for offensive cybersecurity or biology/life-sciences work — those can return `stop_reason: "refusal"`; configure fallback to Claude Opus 4.8 for declined requests.

## Core principles when writing a Fable 5 prompt

1. **Trust the model — trim, don't enumerate.** Instruction following is strong enough that one brief instruction steers a whole class of behaviors. Prompts and skills written for older models are often too prescriptive and DEGRADE Fable 5's output. When migrating, remove instructions and check whether default behavior is already better.
2. **Give the reason, not only the request.** Fable 5 performs better when it knows intent:
   > I'm working on [the larger task] for [who it's for]. They need [what the output enables]. With that in mind: [request].
3. **Start at the top of your difficulty range.** Assign tasks harder than you'd give prior models; testing only simple workloads undersells it. Have it scope, ask clarifying questions, then execute.
4. **Effort is the primary intelligence/latency/cost dial.** Default `high`; `xhigh` for capability-sensitive work; `medium`/`low` for routine tasks (still strong — often beats prior models at `xhigh`). Lower effort if tasks complete but take too long.
5. **Never ask the model to echo or explain its internal reasoning in the response.** That triggers the `reasoning_extraction` refusal category. Read structured `thinking` blocks from adaptive thinking instead; use a send-to-user tool for progress visibility.
6. **Expect longer turns.** Hard tasks can run many minutes per request; autonomous runs for hours. Adjust client timeouts, streaming, and progress UX; prefer async check-ins over blocking.

## Proven snippet library

Insert these verbatim (or lightly adapted) into system prompts when the corresponding behavior matters.

### Prevent overplanning on ambiguous tasks
```text
When you have enough information to act, act. Do not re-derive facts already established in the conversation, re-litigate a decision the user has already made, or narrate options you will not pursue in user-facing messages. If you are weighing a choice, give a recommendation, not an exhaustive survey. This does not apply to thinking blocks.
```

### Prevent unrequested tidying/refactoring at high effort
```text
Don't add features, refactor, or introduce abstractions beyond what the task requires. A bug fix doesn't need surrounding cleanup and a one-shot operation usually doesn't need a helper. Don't design for hypothetical future requirements: do the simplest thing that works well. Avoid premature abstraction and half-finished implementations. Don't add error handling, fallbacks, or validation for scenarios that cannot happen. Trust internal code and framework guarantees. Only validate at system boundaries (user input, external APIs). Don't use feature flags or backwards-compatibility shims when you can just change the code.
```

### Brevity / output style (one short instruction beats enumerating patterns)
```text
Lead with the outcome. Your first sentence after finishing should answer "what happened" or "what did you find": the thing the user would ask for if they said "just give me the TLDR." Supporting detail and reasoning come after. Being readable and being concise are different things, and readability matters more.

The way to keep output short is to be selective about what you include (drop details that don't change what the reader would do next), not to compress the writing into fragments, abbreviations, arrow chains like A → B → fails, or jargon.
```

### Checkpoints — stop only when genuinely needed
```text
Pause for the user only when the work genuinely requires them: a destructive or irreversible action, a real scope change, or input that only they can provide. If you hit one of these, ask and end the turn, rather than ending on a promise.
```

### Ground progress claims on long runs (nearly eliminates fabricated status reports)
```text
Before reporting progress, audit each claim against a tool result from this session. Only report work you can point to evidence for; if something is not yet verified, say so explicitly. Report outcomes faithfully: if tests fail, say so with the output; if a step was skipped, say that; when something is done and verified, state it plainly without hedging.
```

### State the boundaries (prevent unrequested actions)
```text
When the user is describing a problem, asking a question, or thinking out loud rather than requesting a change, the deliverable is your assessment. Report your findings and stop. Don't apply a fix until they ask for one. Before running a command that changes system state (restarts, deletes, config edits), check that the evidence actually supports that specific action. A signal that pattern-matches to a known failure may have a different cause.
```

### Parallel subagents
```text
Delegate independent subtasks to subagents and keep working while they run. Intervene if a subagent goes off track or is missing relevant context.
```
Prefer async orchestrator↔subagent communication over blocking; long-lived subagents that keep context across subtasks save cost via cache reads.

### Memory system (a Markdown file is enough)
```text
Store one lesson per file with a one-line summary at the top. Record corrections and confirmed approaches alike, including why they mattered. Don't save what the repo or chat history already records; update an existing note rather than creating a duplicate; delete notes that turn out to be wrong.
```
Bootstrap from history: "Reflect on the previous sessions we've had together. Use subagents to identify core themes and lessons, and store them in [X]. Make sure you know to reference [X] for future use."

### Autonomous pipelines — prevent early stopping / permission-asking
```text
You are operating autonomously. The user is not watching in real time and cannot answer questions mid-task, so asking "Want me to…?" or "Shall I…?" will block the work. For reversible actions that follow from the original request, proceed without asking. Offering follow-ups after the task is done is fine; asking permission after already discussing with the user before doing the work is not. Before ending your turn, check your last paragraph. If it is a plan, an analysis, a question, a list of next steps, or a promise about work you have not done ("I'll…", "let me know when…"), do that work now with tool calls. End your turn only when the task is complete or you are blocked on input only the user can provide.
```

### Context-budget reassurance (if harness shows remaining-token counts)
```text
You have ample context remaining. Do not stop, summarize, or suggest a new session on account of context limits. Continue the work.
```
Better: avoid surfacing explicit context-budget countdowns to the model at all.

### Readability of final summaries in long agentic sessions
```text
Terse shorthand is fine between tool calls (that's you thinking out loud, and brevity there is good). Your final summary is different: it's for a reader who didn't see any of that.

If you've been working for a while without the user watching (overnight, across many tool calls, since they last spoke), your final message is their first look at any of it. Write it as a re-grounding, not a continuation of your working thread: the outcome first, then the one or two things you need from them, each explained as if new. The vocabulary you built up while working is yours, not theirs; leave it behind unless you re-introduce it.

When you write the summary at the end, drop the working shorthand. Write complete sentences. Spell out terms. Don't use arrow chains, hyphen-stacked compounds, or labels you made up earlier. When you mention files, commits, flags, or other identifiers, give each one its own plain-language clause. Open with the outcome: one sentence on what happened or what you found. Then the supporting detail. If you have to choose between short and clear, choose clear.
```

### Self-verification in long-run prompts
```text
Establish a method for checking your own work at an interval of [X] as you build. Run this every [X interval], verifying your work with subagents against the specification.
```
Separate fresh-context verifier subagents outperform self-critique.

### send_to_user tool (long async agents)
For UX that must deliver content verbatim mid-task (deliverables, numeric progress, direct answers), define a client-side tool — tool inputs are never summarized:
```json
{
  "name": "send_to_user",
  "description": "Display a message directly to the user. Use this for progress updates, partial results, or content the user must see exactly as written before the task finishes.",
  "input_schema": {
    "type": "object",
    "properties": {
      "message": { "type": "string", "description": "The content to display to the user." }
    },
    "required": ["message"]
  }
}
```
Defining it is not enough — pair with elicitation language:
```text
Between tool calls, when you have content the user must read verbatim (a partial deliverable, a direct answer to their question), call the send_to_user tool with that content. Use send_to_user only for user-facing content, not for narration or reasoning.
```
Do not route narration or internal reasoning through it.

## Migration checklist (Opus/Sonnet → Fable 5)

- [ ] Raise client timeouts; add streaming and progress indicators; consider async run check-ins instead of blocking.
- [ ] Set effort: default `high`; API uses adaptive thinking only (no extended-thinking budgets); thinking output is summarized-only.
- [ ] Audit prompts/skills: delete over-prescriptive instructions; test default behavior first.
- [ ] Remove any "show your reasoning / explain your thinking in the response" instructions (refusal risk).
- [ ] Add fallback handling for `stop_reason: "refusal"` (route to Claude Opus 4.8).
- [ ] Add grounding, boundary, and autonomy snippets from above as needed for long runs.
- [ ] Provide a memory file and a send_to_user tool for long-running agents.

## Workflow when this skill is invoked

1. Ask (or infer) the deployment shape: interactive chat, coding agent, or long-running autonomous pipeline — the snippet set differs.
2. Draft the prompt: intent/context first ("give the reason"), then the request, then only the behavioral snippets that the use case needs. Keep it short; do not stack all snippets by default.
3. If migrating an existing prompt, diff it against the core principles above and cut anything Fable 5 does well by default.
4. Sanity-check: no reasoning-echo instructions, no token-countdown exposure, refusal fallback considered, effort level stated.
