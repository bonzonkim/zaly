# OpenAI Codex with a ChatGPT subscription

zaly can authenticate to the **OpenAI Codex** backend using its supported OAuth
flows. This lets eligible ChatGPT accounts use subscription-backed Codex access
without supplying an OpenAI API key.

::: info Two different forms of OpenAI access
**OpenAI Codex** (`openai-codex`) uses ChatGPT-backed access.
**OpenAI** API-key access uses your API credentials and API billing.
A ChatGPT subscription is not an API key or a guarantee of API credits.
:::

## Sign in

1. Start `zaly` in your project.
2. Run `/login` and choose **OpenAI Codex**.
3. Select the browser or device-code method offered in your environment.
4. Follow the displayed authorization URL/instructions and finish signing in.
5. Run `/model` and select a model under the `openai-codex` provider.

After login, `/login --model` can authenticate against the currently selected
model's provider. On a remote/headless machine, use device login when offered;
follow the prompts rather than assuming a local browser callback is reachable.

## What to expect

Access depends on your account, subscription, model availability, and OpenAI's
current limits. Subscription-backed access is not unlimited usage. Rate-limit
or quota errors are not necessarily a problem with your credentials.

OAuth credentials are stored locally in the user state directory's `auth.json`.
Do not copy tokens into project files or commit them. zaly uses its own provider
integration; signing into another client should not be assumed to sign zaly in.

## If it doesn't work

Check that the selected model belongs to **OpenAI Codex**, not the OpenAI API-key
provider. Retry the offered login flow and inspect the actual error. A successful
login can still be followed by account/model access restrictions.

See [authentication](./models.md) for precedence and [troubleshooting](../guide/troubleshooting.md)
for diagnostics and safe reporting.
