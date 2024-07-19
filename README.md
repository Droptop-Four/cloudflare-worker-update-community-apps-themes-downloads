# Cloudflare Worker Update Community Apps Themes Downloads

This Cloudflare Worker updates every day the number of times each Community App & Community Theme was downloaded.

It gets the number of downloads from a mongodb atlas database using the REALM API.

Then it updates the number of downloads in the GlobalData repository.


# Development

To start the dev server run `npm run dev`, to simulate a cron trigger, use `curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"`.
