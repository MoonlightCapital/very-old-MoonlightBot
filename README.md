# MoonlightBot
This is a Discord bot written in JS for easy moderation and logging.
Note: this repository is meant for ones who'd like to make improvements to the current (total garbage) code, not for running your own instance.

Join bot support server: https://discord.gg/yjnZUQH

Invite bot: https://discordapp.com/api/oauth2/authorize?client_id=314110696071888896&permissions=470133958&scope=bot

#Config file

`config.json` is the file needed to run the bot properly, here is how it's structured:

```json

{
	"prefix": "m:",
	"token": "YOUR_TOKEN_HERE",
  "owner": "YOUR_USER_ID",
  "DBLkey": "OPTIONAL",
  "beta": false,
  "cooldowntimer": 3000
  
}
```
**Prefix:** Bot prefix. Any message starting with this wil trigger the bot.

**Token:** You get this from your Discord application page.

**Owner:** Your Discord user ID, like `256460316660072448`

**DBLkey:** You can ignore this if you don't want to post statistics to a site.

**Beta:** Internal flag for me to check if it's running the test version or production. You can ignore this as well.

**Cooldowntimer:** Interval of time between a command and another (in milliseconds)
