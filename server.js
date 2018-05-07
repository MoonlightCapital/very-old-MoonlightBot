const http = require('http');
const express = require('express');
const app = express();

app.get("/", (request, response) => {
 console.log(Date.now() + " Just got pinged!");
 response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
 http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 279999);

const config = require('./config.json');
//const guild = require('./guildsettings.json');


  const {promisify} = require('util')
const writeFileAsync = promisify(require('fs').writeFile)

const SQLite = require("better-sqlite3");
const sql = new SQLite('./guilds.sqlite');

const Discord = require("discord.js");
const client = new Discord.Client();

const cooldown = new Set();


let help = "```\n \
==General commands== \n \n \
m:help | Need any help \n \
m:ping | Pong! \n \
m:botinfo | Shows bot information \n \
m:servers | In how many servers am I? \n \
m:support | Need any help? \n \
m:invite | Invite me to your server \n \
m:vote | Vote for me <3 \n \
m:userinfo <user> | Shows information about provided user \n \
\n \
==Moderator commands== \n \n \
m:kick <user> <reason> | Kicks an user \n \
m:ban <user> <reason> | Bans an user \n \
m:mute <user> <reason> | Mutes an user \n \
m:unmute <user> <reason> | Unmutes an user \n \
\n \
==Management commands== \n \
m:setlogchannel #channel | Sets the channel where to post moderation logs. \n \
m:addmodrole Role name | Adds a role to the list of mod roles \n \
          ```";

/*const { stringify } = require('querystring');
const { request } = require('https');

const update = () => {
  const data = stringify({ server_count: client.guilds.size });
  const req = request({
    host: 'discordbots.org',
    path: `/api/bots/${client.user.id}/stats`,
    method: 'POST',
    headers: {
      'Authorization': config.DBLkey,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(data)
    }
  });
  req.write(data);
  req.end();
};

client.on('ready', update);
client.on('guildCreate', update);
client.on('guildRemove', update);*/

client.on("ready", () => {
  console.log("Bot started successfully!");
  client.user.setActivity(config.prefix+'help', { type: 'PLAYING' });
  
  const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'guilds';").get();
  if (!table['count(*)']) {
    // If the table isn't there, create it and setup the database correctly.
    sql.prepare("CREATE TABLE guilds (id TEXT PRIMARY KEY, mutedrole TEXT, modlogchannel TEXT, badwords TEXT);").run();
    // Ensure that the "id" row is always unique and indexed.
    sql.prepare("CREATE UNIQUE INDEX id ON guilds (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }
  
  const modtable = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'modroles';").get();
  if (!modtable['count(*)']) {
    // If the table isn't there, create it and setup the database correctly.
    sql.prepare("CREATE TABLE modroles (guild2 TEXT, role TEXT PRIMARY KEY);").run();
    // Ensure that the "id" row is always unique and indexed.
    sql.prepare("CREATE UNIQUE INDEX role ON modroles (role);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }
  //sql.prepare('ALTER TABLE modroles ADD COLUMN guild2 TEXT;').run();
  client.getGuild = sql.prepare("SELECT * FROM guilds WHERE id = ?");
  //client.updateGuild = sql.prepare('UPDATE guilds SET ? = ? WHERE id = ?');
  
});

var statustags = {
  'online' : '<:online:415517547945918474> Online',
  'dnd' : '<:dnd:415517547861901312> Do not disturb',
  'idle' : '<:away:415517547719557121> Idle',
  'invisible' : '<:invisible:415517547715231745> Invisible', 
  'offline'  : '<:invisible:415517547715231745> Invisible',
};

client.on('guildCreate', (guild) => {
  
  sql.prepare(`INSERT OR REPLACE INTO guilds (id, mutedrole, modlogchannel, badwords) VALUES (${guild.id}, 'Muted', '0', '{"words": []}');`).run();
  
  /*var defaultsettings = {
    
    "modroles": [],
    
    "exemptroles": [],
    
    "mutedrole": "Muted",
    
    "badwords": [],
    
    "modlogchannel": "0"
    
  };
  
  writeFileAsync('./guilds/'+guild.id+'.json', JSON.stringify(defaultsettings)).then(console.log('File created successfully!')).catch(console.error);*/
  
});

client.on('guildMemberAdd', (member) => {
  
  let guild = client.getGuild.get(member.guild.id);
  if(!guild) sql.prepare(`INSERT OR REPLACE INTO guilds (id, mutedrole, modlogchannel, badwords) VALUES (${member.guild.id}, 'Muted', '0', '{"words": []}');`).run();
  
  let joinembed = {embed: {
    color: 0xB8E986,

    title: ":arrow_right: User joined",

    fields: [{
        name: ":bust_in_silhouette: User",
        value: member.user.tag + ' **['+member.id+']**'
      }
    ],
    timestamp: new Date()
  }
};
  
  if(guild.modlogchannel !== null && guild.modlogchannel !== '0')
      client.channels.get(guild.modlogchannel).send(joinembed);
  
});

client.on('guildMemberRemove', (member) => {  
  
  let guild = client.getGuild.get(member.guild.id);
  if(!guild) sql.prepare(`INSERT OR REPLACE INTO guilds (id, mutedrole, modlogchannel, badwords) VALUES (${member.guild.id}, 'Muted', '0', '{"words": []}');`).run();

  let leaveembed = {embed: {
    color: 0xE87D5D,

    title: ":arrow_left: User left",

    fields: [{
        name: ":bust_in_silhouette: User",
        value: member.user.tag + ' **['+member.id+']**'
      }
    ],
    timestamp: new Date()
  }
};
  
  try { client.channels.get(guild.modlogchannel).send(leaveembed);} catch(error) {};
  
});

client.on("messageDelete", (message) => {
  
  let guild = client.getGuild.get(message.guild.id);
  if(!guild) sql.prepare(`INSERT OR REPLACE INTO guilds (id, mutedrole, modlogchannel, badwords) VALUES (${message.guild.id}, 'Muted', '0', '{"words": []}');`).run();
  

  let deleteembed = {embed: {
    color: 0xFFA500,
    author: {
      name: message.author.name,
      icon_url: message.author.avatarURL
    },
    title: ":scissors: Message deleted",

    fields: [{
        name: ":bust_in_silhouette: User",
        value: message.author.tag + ' **['+message.author.id+']**'
      },
      {
        name: ":notepad_spiral: Message content",
        value: message.content
      },
      {
        name: ":bookmark_tabs: Channel",
        value: message.channel.name + ' **[' + message.channel.id + ']**',
        inline: true
      },
      {
        name: ":id: ID",
        value: message.id,
        inline: true
      }
    ],
    timestamp: new Date()
  }
};
  
  
  try { client.channels.get(guild.modlogchannel).send(deleteembed); } catch(error) { console.error;}
  
});

client.on("message", (message) => {
  if(message.author.bot) return;
  
  if(!message.guild) return;

  
  var guildid = message.guild.id;
  
  //let guild = require('./guilds/' + message.guild.id + '.json');
  let guild = client.getGuild.get(guildid);
  if(!guild) sql.prepare(`INSERT OR REPLACE INTO guilds (id, mutedrole, modlogchannel, badwords) VALUES (${guildid}, 'Muted', '0', '{"words": []}');`).run();
  
  guild.modroles = [];
  
  guild.modroles = sql.prepare('SELECT role FROM modroles WHERE guild2 = ?').all(guildid).map(x=>x.role);
  
  guild.badwords = JSON.parse(guild.badwords).words;
  
  if(guild.badwords.some(word => message.content.includes(word)) ) {
    
    var msg = message;
    
  try  { message.delete()} catch(error) {console.error};

  }

  if (!message.content.startsWith(config.prefix)) return;
  
  if (cooldown.has(message.author.id))
  return message.channel.send(':timer: You\'re going too fast! Please wait a moment!');
  
    cooldown.add(message.author.id);
setTimeout(() => {

  cooldown.delete(message.author.id);
}, config.cooldowntimer);
  
  var commands = ['blessedimage', 'oof','help', 'ping', 'invite', 'support', 'vote', 'servers', 'botinfo', 'setstatus', 'kick', 'ban', 'softban', 'mute', 'userinfo', 'unmute', 'dbtest', 'setlogchannel', 'addmodrole', 'settings', 'memory'];
  
  var commandname = message.content.replace(config.prefix, '');
  
  var n = commandname.indexOf(' ');
  commandname = commandname.substring(0, n != -1 ? n : commandname.length + 1);
  
  var commandbody = message.content.replace(config.prefix + commandname, '');
  
  if(commands.indexOf(commandname) < 0) return;
  
  switch (commandname) {
      
    case 'help':
      message.channel.send(help);
      
      break;
      
    case 'ping':
      message.channel.send('Pong!');
      
      break;
    
    case 'invite':
      message.channel.send('Invite me to your server: <https://discordapp.com/api/oauth2/authorize?client_id=314110696071888896&permissions=470133958&scope=bot>');
      
      break;
      
    case 'support':
      message.channel.send('Please join our support server: https://discord.gg/yjnZUQH');
      
      break;
    
    case 'servers':
      message.channel.send('I\'m in ' + client.guilds.size + ' servers.');
      
      break;
    
    case 'botinfo':
      
      let infoembed = {embed: {
    color: 0x008080,
    title: ":information_source: MoonlightBot info",

    fields: [{
        name: ":id: ID ",
        value: client.user.id
      },
      {
        name: ":tickets: Discriminator",
        value: client.user.tag,
      },
      {
        name: ":battery: Status",
        value: statustags[client.user.presence.status]
      }
    ],
    timestamp: new Date()
  }
};
      
      message.channel.send(infoembed);
      
      break;
    
    case 'vote':
      message.channel.send('Go vote MoonlightBot for president: https://discordbots.org/bot/314110696071888896/vote');
      
      break;
    
    case 'setstatus':
      if(message.author.id !== config.owner) { message.channel.send('Only bot owner can do this.'); return;}
      
      var args = commandbody.split(' ');
      
      client.user.setPresence({ status: args[1] })
  .then(message.channel.send('New status: ' + client.user.presence.status));
      
      break;
    
    case 'kick':
      

      if(!message.member.roles.some(r=>guild.modroles.includes(r.id)) ) return message.reply("You need a mod role to use this command!");
    
      var args = commandbody.split(' ');
      
    var member = message.mentions.members.first();    
    
    if(!member)
      return message.reply("Member supplied is not valid");
    if(!member.kickable) 
      return message.reply("Couldn't kick user: Either the user has an higher role than mine or i miss `KICK_MEMBERS` permissions.");
    
    if(member.id == config.owner) return message.channel.send('no.');
    
 
    let reason = args.slice(2).join(' ');
    let target_tag = member.user.tag;
    
      let kickembed = {embed: {
    color: 0xFF0000,
    author: {
      name: message.author.name,
      icon_url: message.author.avatarURL
    },
    title: ":cd: User kicked",

    fields: [{
        name: ":bust_in_silhouette: User",
        value: target_tag + ' **['+member.id+']**'
      },
      {
        name: ":notepad_spiral: Reason",
        value: reason == '' || reason == null || reason == undefined ? 'No reason specified' : reason,
      },
      {
        name: ":cop: Responsible moderator",
        value: message.author.tag + ' **['+message.author.id+']**'
      }
    ],
    timestamp: new Date()
  }
};
      

    member.kick('Member kicked by '+ message.author.tag + ' ['+message.author.id+'], Reason: ' + reason)
      .then(message.channel.send('User kicked successfully!'))
           .then(client.channels.get(guild.modlogchannel).send(kickembed))
      .catch(error => message.reply('I was unable to kick the user.'));

      
      break;
      
      case 'ban':
      

      if(!message.member.roles.some(r=>guild.modroles.includes(r.id)) ) return message.reply("You need a mod role to use this command!");
    
      var args = commandbody.split(' ');

    var member = message.mentions.members.first();
    

      
    
    if(!member)
      return message.reply("Member supplied is not valid. Please note that you can ban only members in the server at the moment.");
    if(!member.bannable) 
      return message.reply("Couldn't ban user: Either the user has an higher role than mine or i miss `BAN_MEMBERS` permissions.");
    
    if(member.id == config.owner) return message.channel.send('no.');
    

    let reasonb = args.slice(2).join(' ');
    let target_tagb = member.user.tag;
    
      let banembed = {embed: {
    color: 0xFF0000,
    author: {
      name: message.author.name,
      icon_url: message.author.avatarURL
    },
    title: ":dvd: User banned",

    fields: [{
        name: ":bust_in_silhouette: User",
        value: target_tagb + ' **['+member.id+']**'
      },
      {
        name: ":notepad_spiral: Reason",
        value: reasonb == '' || reasonb == null || reasonb == undefined ? 'No reason specified' : reasonb,
      },
      {
        name: ":cop: Responsible moderator",
        value: message.author.tag + ' **['+message.author.id+']**'
      }
    ],
    timestamp: new Date()
  }
};
      

    member.ban('Member banned by '+ message.author.tag + ' ['+message.author.id+'], Reason: ' + reasonb)
      .then(message.channel.send('User banned successfully!'))
           .then(client.channels.get(guild.modlogchannel).send(banembed))
      .catch(error => message.reply('I was unable to ban the user.'));

      
      break;
    
    
    case 'softban':
      
      if(!message.member.roles.some(r=>guild.modroles.includes(r.id)) ) return message.reply("You need a mod role to use this command!");
    
      var args = commandbody.split(' ');

    var member = message.mentions.members.first();
    
      
    if(!member) 
      return message.reply("Member supplied is not valid. Please note that you can ban only members in the server at the moment.");

    if(!member.bannable) 
      return message.reply("Couldn't ban user: Either the user has an higher role than mine or i miss `BAN_MEMBERS` permissions.");
    
    if(member.id == config.owner) return message.channel.send('no.');
    

    let reasonsb = args.slice(2).join(' ');
    let target_tagsb = member.user.tag;
    
      let sbanembed = {embed: {
    color: 0xFF0000,
    author: {
      name: message.author.name,
      icon_url: message.author.avatarURL
    },
    title: ":dvd: User softbanned",

    fields: [{
        name: ":bust_in_silhouette: User",
        value: target_tagsb + ' **['+member.id+']**'
      },
      {
        name: ":notepad_spiral: Reason",
        value: reasonsb == '' || reasonsb == null || reasonsb == undefined ? 'No reason specified' : reasonsb,
      },
      {
        name: ":cop: Responsible moderator",
        value: message.author.tag + ' **['+message.author.id+']**'
      }
    ],
    timestamp: new Date()
  }
};
      

    member.ban({reason: 'Member softbanned by '+ message.author.tag + ' ['+message.author.id+'], Reason: ' + reasonsb, days: 7})
      .then(message.channel.send('User softbanned successfully!'))
           .then(client.channels.get(guild.modlogchannel).send(sbanembed))
      .catch(error => message.reply('I was unable to softban the user.'));
      
      message.guild.unban(member.id, 'Softban');
      
      break;
    
    case 'mute':
      
      if(!message.member.roles.some(r=>guild.modroles.includes(r.id)) ) return message.reply("You need a mod role to use this command!");
      
      var args = commandbody.split(' ');
      let reasonm = args.slice(2).join(' ');
      
      let role = message.guild.roles.find("name", guild.mutedrole);

      let guytomute = message.mentions.members.first();
      if(!guytomute)
      return message.reply("Member supplied is not valid.");
      
      if(guytomute.id == config.owner) return message.channel.send('no.');
      
    let muteembed = {embed: {
    color: 0xFF0000,
    author: {
      name: message.author.name,
      icon_url: message.author.avatarURL
    },
    title: ":zipper_mouth: User muted",

    fields: [{
        name: ":bust_in_silhouette: User",
        value: guytomute.user.tag + ' **['+guytomute.id+']**'
      },
      {
        name: ":notepad_spiral: Reason",
        value: reasonm == '' || reasonm == null || reasonm == undefined ? 'No reason specified' : reasonm,
      },
      {
        name: ":cop: Responsible moderator",
        value: message.author.tag + ' **['+message.author.id+']**'
      }
    ],
    timestamp: new Date()
  }
};

      guytomute.addRole(role, 'Member muted by '+ message.author.tag + ' ['+message.author.id+'], Reason: ' + reasonm)
        .then(client.channels.get(guild.modlogchannel).send(muteembed), message.channel.send('User muted successfully!'))
        .catch(console.error);
      
      break;
      
    case 'unmute':
      
      if(!message.member.roles.some(r=>guild.modroles.includes(r.id)) ) return message.reply("You need a mod role to use this command!");
      
      var args = commandbody.split(' ');
      let reasonum = args.slice(2).join(' ');
      
      let mrole = message.guild.roles.find("name", guild.mutedrole);

      let guytounmute = message.mentions.members.first();
      if(!guytounmute)
      return message.reply("Member supplied is not valid.");
      
      
    let unmuteembed = {embed: {
    color: 0x1CB119,
    author: {
      name: message.author.name,
      icon_url: message.author.avatarURL
    },
    title: ":smile: User unmuted",

    fields: [{
        name: ":bust_in_silhouette: User",
        value: guytounmute.user.tag + ' **['+guytounmute.id+']**'
      },
      {
        name: ":notepad_spiral: Reason",
        value: reasonum == '' || reasonum == null || reasonum == undefined ? 'No reason specified' : reasonum,
      },
      {
        name: ":cop: Responsible moderator",
        value: message.author.tag + ' **['+message.author.id+']**'
      }
    ],
    timestamp: new Date()
  }
};
      // Add the role!
      guytounmute.removeRole(mrole, 'Member unmuted by '+ message.author.tag + ' ['+message.author.id+'], Reason: ' + reasonum)
        .then(client.channels.get(guild.modlogchannel).send(unmuteembed), message.channel.send('User muted successfully!'))
        .catch(console.error);
      
      break;
    
    case 'userinfo':
      
      var args = commandbody.split(' ');
let cooldude;
      
      if(message.mentions.members.size > 0){
      cooldude = message.mentions.members.first().user;
      } else if (args[1].length == 18 && args[1].match(/^[0-9]+$/) !== null) {
          let cooldude = client.fetchUser(args[1]).then().catch(console.error);
      } else {
        cooldude = message.author;
      }

      
      let uiembed = {embed: {
    color: 0x4A90E2,
    title: "Profile for " + cooldude.username,
        
    "thumbnail": {
      "url": cooldude.avatarURL
    },
    
    fields: [{
        name: ":tickets: Discriminator",
        value: cooldude.tag,
      inline: true
      },
      {
        name: ":id: ID",
        value: cooldude.id,
        inline: true
      },
      {
        name: ":battery: Status",
        value: cooldude.presence.status !== null || cooldude.presence.status !== undefined ? statustags[cooldude.presence.status] : statustags['offline']
      },
      {
        name: ":robot: Bot",
        value: cooldude.bot
      },
      {
        name: ":comet: Account created on:",
        value: cooldude.createdAt
      }
    ],
    timestamp: new Date()
  }
};
      message.channel.send(uiembed);
      
      break;
      
    case 'dbtest':
      if(message.author.id !== config.owner) return;
      
      break;
      
    case 'setlogchannel':
      
      
            let perms = message.member.permissions;
      let cdi = message.member.hasPermission("MANAGE_GUILD");
      
      if(message.author.id == config.owner) cdi = true;
      
      if(cdi == false || message.author.id !== config.owner) return message.channel.send('You need manage server permissions in order to do this.');
      
      let channel = message.mentions.channels.first();
      
      if(!channel) return message.channel.send('Please supply a valid channel!');
      
      let gm = message.guild.id
      
      guild.modlogchannel = channel.id;
      

      
      sql.prepare('UPDATE guilds SET modlogchannel = ? WHERE id = ?').run(guild.modlogchannel, gm);
      
      message.channel.send(':scroll: <#'+channel.id+'> is now the mod log channel.');
      
      
      break;
      
      case 'addmodrole':
          
      let nperms = message.member.permissions;
      let ncdi = message.member.hasPermission("MANAGE_ROLES_OR_PERMISSIONS");
      
      var args = commandbody.split(' ');
      
      if(message.author.id == config.owner) ncdi = true;
      
      if(ncdi == false) return message.channel.send('You need manage roles permissions in order to do this.');
      
      if(args.length < 1) return message.channel.send('You need to suppy a role name!');
      
      let addrole = message.guild.roles.find("name", args.slice(1).join(' '));
      
      if(!addrole) return message.channel.send('No such role with that name found.');
      
      let mdrole = sql.prepare('SELECT * FROM modroles WHERE guild2 = ? AND role = ?').get(message.guild.id, addrole.id);
      
      if(!mdrole) {
      
      sql.prepare('INSERT into modroles (guild2, role) VALUES (?, ?);').run(guildid, addrole.id);
      
      message.channel.send('Role `'+addrole.name+'` has been added in the mod roles list.');
                 }
      
      else return message.channel.send('Role `'+addrole.name+'` is already present in the mod roles list.');
      
      break;
      
    case 'oof':
      if(message.author.id !== config.owner) return;
      let maor = client.guilds.map(g => g.name).join(', ');
      
      message.channel.send(maor);
      
      break;
    
    case 'blessedimage':
      //ignore this command lol
      message.channel.send('https://cdn.nekos.life/neko/neko142.jpeg');
      break;
      
    case 'settings':
      
      let mutedrole = guild.mutedrole ? guild.mutedrole: 'None';
      let logchannel = typeof guild.modlogchannel.name == undefined ? 'None' : '<#'+guild.modlogchannel+'>';
      
      let settingsembed = {embed: {
    color: 0x4A90E2,
    title: "Server settings",
        
    "thumbnail": {
      "url": message.guild.iconURL
    },
    
    fields: [{
        name: ":zipper_mouth: Muted role",
        value: mutedrole
      },
      {
        name: ":scroll: Mod log channel",
        value: logchannel
      },
    ],
    timestamp: new Date()
  }
};
      message.channel.send(settingsembed);
      
      break;
    
      case 'memory':
       if(message.member.id !== config.owner) return;
       const used = process.memoryUsage().heapUsed / 1024 / 1024;
       message.channel.send(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
    
    break;             }
  
});

client.login(config.token);
