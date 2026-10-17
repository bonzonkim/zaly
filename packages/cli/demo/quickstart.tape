Source packages/cli/demo/settings.tape
Require asciinema

Output docs/public/demos/quickstart.webm

Hide
Type@1ms `export ZALY_DEMO_MAIN="$PWD/packages/cli/demo/quickstart.ts"; cast="${ZALY_DEMO_CAST:-$(mktemp)}"; zaly() { asciinema rec --quiet --overwrite --return --output-format asciicast-v2 --command 'bun "$ZALY_DEMO_MAIN" --yolo' "$cast"; }; unset PROMPT_COMMAND; PS1='❯ '; clear`
Enter
Sleep 500ms
Show

Type "zaly --yolo"
Sleep 400ms
Enter
Wait+Screen /demo\/quickstart/
Sleep 1s

Type "Fix the total calculation in @price.ts and run the tests."
Sleep 600ms
Enter
Wait+Screen /return price \* quantity/
Screenshot docs/public/demos/quickstart.png
Sleep 250ms
Wait+Screen /Both tests pass/
Sleep 4s

Hide
Ctrl+\
Sleep 250ms
Ctrl+c
Ctrl+c
Sleep 1s
