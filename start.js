const fs = require("fs");
const fetch = require("node-fetch");
const os = require("os");
const { exec } = require("child_process");

const usersFile = "./db/users/users.json";
const adminfile = "./db/users/adminID.json";
const premiumUsersFile = "./db/users/premiumUsers.json";
const ressUsersFile = "./db/users/ressellerUsers.json";
const privateUsers = JSON.parse(fs.readFileSync("./db/users/private/privateID.json"));

const settings = require("./settings/config.js");
const config = require("./settings/config.js");

const developer = settings.dev;
const pp = settings.pp;
const ppVid = settings.ppVid;

let ownerUsers = [];
let premiumUsers = [];
let ressUsers = [];
    
let users = [];
let userState = {};
let userUploads = {}
let web2zipSessions = {}

if (fs.existsSync(adminfile)) {
  ownerUsers = JSON.parse(fs.readFileSync(adminfile));
}

if (fs.existsSync(premiumUsersFile)) {
  premiumUsers = JSON.parse(fs.readFileSync(premiumUsersFile));
}
    
if (fs.existsSync(ressUsersFile)) {
  ressUsers = JSON.parse(fs.readFileSync(ressUsersFile));
}
    
const now = new Date();
const waktu = now.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" });

module.exports = (bot) => {
/*const joined = await isMember(msg.from.id);
    
  if (!joined) {
    await sendJoinChannel(msg);
    return;
  }*/

const isMember = async (userId) => {
  try {
    const member = await bot.getChatMember(`${settings.chUsn}`, userId);
    return ['creator','administrator','member'].includes(member.status);
  } catch {
    return false;
  }
};

// kirim tombol verifikasi
const sendJoinChannel = async (msg) => {
  const chatId = msg.chat.id;
  const opts = {
    reply_to_message_id: msg.message_id,
    reply_markup: {
      inline_keyboard: [
        [{ text: "Sudah Join", callback_data: "verify_join_channel" }]
      ]
    }
  };
  await bot.sendMessage(chatId, `❌ Kamu belum join channel\n${settings.chUsn}`, opts);
};

// callback tombol verifikasi
bot.on('callback_query', async (callbackQuery) => {
  const msg = callbackQuery.message;
  const userId = callbackQuery.from.id;
  const chatId = msg.chat.id;

  if (callbackQuery.data === "verify_join_channel") {
    try {
      const joined = await isMember(userId);
      
      await bot.answerCallbackQuery(callbackQuery.id);
    } catch (err) {
      await bot.sendMessage(chatId, `❌ Gagal mengecek status join, coba lagi nanti.`);
      await bot.answerCallbackQuery(callbackQuery.id);
    }
  }
});
    
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
    
  const joined = await isMember(msg.from.id);
    
  if (!joined) {
    await sendJoinChannel(msg);
    return;
  }
    
  let targetUser = msg.from;
  const senderId = targetUser.id;
  
  // runtime vps
  const vpsUptime = os.uptime();
  const vpsUptimeStr = `${Math.floor(vpsUptime / 86400)}d ${Math.floor((vpsUptime % 86400) / 3600)}h ${Math.floor((vpsUptime % 3600) / 60)}m`;
 
  const status = ownerUsers.includes(userId)
    ? "Owner"
    : premiumUsers.includes(userId)
    ? "Premium"
    : premiumUsers.includes(userId)
    ? "Reseller"
    : "User";
  
  let userSave = JSON.parse(fs.readFileSync(usersFile));
    if (!userSave.includes(senderId)) {
      userSave.push(senderId);
      fs.writeFileSync(usersFile, JSON.stringify(userSave, null, 2));
    }
    
    if (fs.existsSync(usersFile)) {
        users = JSON.parse(fs.readFileSync(usersFile));
    }
    const total = users.length;
    
  const menuText = `<blockquote>( 👤 ) - 情報, @${msg.from.username}</blockquote>
안녕하세요 사용자, 환영합니다!

<blockquote><b>상태 :</b> ${status}
<b>총 사용자 :</b> ${total} User
<b>시간 :</b> ${waktu}</blockquote>

이것은 패널의 활성 기간입니다.
<blockquote>📡 ${vpsUptimeStr}</blockquote>
`;

  const keyboard = {
    caption: menuText,
    parse_mode: "HTML",
    reply_to_message_id: msg.message_id,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "⿻ ᴘʀɪᴠᴀᴛᴇ ᴍᴇɴᴜ", callback_data: "privmenu" },
          { text: "⿻ ᴄʀᴇᴀᴛᴇ ᴘᴀɴᴇʟ", callback_data: "createpanel" },
        ],
        [
          { text: "ɪɴꜱᴛᴀʟʟ ᴍᴇɴᴜ", callback_data: "installmenu" },
          { text: "ᴄʀᴇᴀᴛᴇ ᴠᴘꜱ", callback_data: "cvpsmenu" },
          { text: "ᴏᴛʜᴇʀ ᴍᴇɴᴜ", callback_data: "othermenu" }
        ],
        [
          { text: "⿻ ᴇɴᴄʀʏᴘᴛ ᴍᴇɴᴜ", callback_data: "obfmenu" },
          { text: "⿻ ᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ", callback_data: "protectmenu" }
        ],
        [
          { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ", callback_data: "ownermenu" }
        ],
        [
          { text: "ʙᴜʏ ꜱᴄʀɪᴘᴛ", url: "https://t.me/kinzxxoffc1" }
        ]
      ],
    },
  };
  
  bot.sendPhoto(chatId, pp, keyboard);
  //bot.sendVideo(chatId, ppVid, keyboard);
    
  /*bot.sendAudio(chatId, "./audio.mp3", {
    title: "lagu.mp3",
    performer: "kinzxx"
  });*/
});

bot.onText(/^\/cek$/, async (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  let targetUser = msg.from;
  if (msg.reply_to_message) targetUser = msg.reply_to_message.from;

  const userId = targetUser.id;
  const firstName = targetUser.first_name || "User";

  try {
    await bot.sendMessage(
      userId,
      "Start bot ulang!"
    );

    // simpen id ke database      
    let users = JSON.parse(fs.readFileSync(usersFile));
    if (!users.includes(userId)) {
      users.push(userId);
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    }

    // kirim ke grup
    await bot.sendMessage(
      chatId,
      `✅ [${firstName}](tg://user?id=${userId}) sudah start bot! silahkan create.`,
      { parse_mode: "Markdown", reply_to_message_id: msg.message_id }
    );
  } catch (err) {
    await bot.sendMessage(
      chatId,
      `❌ [${firstName}](tg://user?id=${userId}) belum start bot di private chat. dilarang create!`,
      { parse_mode: "Markdown", reply_to_message_id: msg.message_id }
    );
  }
});
    
bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "createpanel") {
    bot.answerCallbackQuery(callbackQuery.id);
     const text = `\`\`\`
╭──✧ <b>ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ</b> ✧
│ ⪼ Version : 1.0.0
│ ⪼ Owner : @${developer}
│ ⪼ Type : Public
╰────────────⧽

╭──✧ ᴏᴡɴᴇʀ ᴍᴇɴᴜ ✧
│ ⪼ /addprem <id>
│ ⪼ /delprem <id>
│ ⪼ /address <id>
│ ⪼ /delress <id>
╰────────────⧽

╭──✧ ᴘʀᴇᴍɪᴜᴍ ᴍᴇɴᴜ ✧
│ ⪼ /listsrv
│ ⪼ /listsrvoff
│ ⪼ /listadmin
│ ⪼ /deladm <id>
│ ⪼ /delusroff
│ ⪼ /delsrv <id>
│ ⪼ /delsrvoff
│ ⪼ /totalserver
│ ⪼ /servercpu
│ ⪼ /cadp nama,id
╰────────────⧽

╭──✧ ʀᴇꜱᴇʟʟᴇʀ ᴍᴇɴᴜ ✧
│ ⪼ /1gb-/10gb nama,id
│ ⪼ /unli nama,id
╰────────────⧽
\`\`\``;
 bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
        [
            { text: "⿻ ᴘʀɪᴠᴀᴛᴇ ᴍᴇɴᴜ", callback_data: "privmenu" },
            { text: "<<", callback_data: "back" },
        ],
        [
            { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ", callback_data: "ownermenu" }
        ],
        [
          { text: "ꜱᴇʀᴠᴇʀ 2", callback_data: "serverdua" },
          { text: "ꜱᴇʀᴠᴇʀ 3", callback_data: "servertiga" },
          { text: "ꜱᴇʀᴠᴇʀ 4", callback_data: "serverempat" }
        ],
        [
          { text: "ꜱᴇʀᴠᴇʀ 5", callback_data: "serverlima" }
        ]
      ],
      },
    });
  }
});
    
bot.on("callback_query", (callbackQuery) => {
    if (callbackQuery.data === "privmenu") {
    bot.answerCallbackQuery(callbackQuery.id);

    const userId = callbackQuery.from.id.toString();

    if (!privateUsers.includes(userId)) {  bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Akses ditolak! Menu ini hanya untuk User Private",
        show_alert: true
      });
      return;
    }

    const text = `\`\`\`
╭──✧ ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ ✧
│ ⪼ Version : 1.0.0
│ ⪼ Owner : @${developer}
│ ⪼ Type : Private
╰────────────⧽

╭──✧ ᴏᴡɴᴇʀ ᴘʀɪᴠᴀᴛᴇ ✧
│ ⪼ /pinfo
│ ⪼ /addpremp <id>
│ ⪼ /addressp <id>
╰────────────⧽

╭──✧ ᴘʀᴇᴍɪᴜᴍ ᴘʀɪᴠᴀᴛᴇ ✧
│ ⪼ /srvlist
│ ⪼ /srvofflist
│ ⪼ /admlist
│ ⪼ /srvdel <id>
│ ⪼ /srvoffdel
│ ⪼ /totalsrv
│ ⪼ /srvcpu
│ ⪼ /cadmin nama,id
╰────────────⧽

╭──✧ ʀᴇꜱᴇʟʟᴇʀ ᴘʀɪᴠᴀᴛᴇ ✧
│ ⪼ /1gbp-/10gbp nama,id
│ ⪼ /cunli nama,id
╰────────────⧽
\`\`\``;

    bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "<<", callback_data: "back" },
            { text: "⿻ ᴄʀᴇᴀᴛᴇ ᴘᴀɴᴇʟ", callback_data: "createpanel" },
          ],
          [
            { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ", callback_data: "ownermenu" }
          ]
        ],
      },
    });
  }
});

bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "serverdua") {
      
      const userId = callbackQuery.from.id.toString();
    const isResellerV2 = JSON.parse(fs.readFileSync("./db/users/version/resellerV2.json"));

    if (!isResellerV2.includes(userId)) {
      return;
    }
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `<blockquote>┌─⧼ <b>ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ</b> ⧽
├ ⬡ Version : 2.0.0
├ ⬡ Owner : @${developer}
├ ⬡ Language : JavaScript
╰─────────────

┌─⧼ <b>ᴍᴇɴᴜ ᴏᴡɴᴇʀ ᴠ2</b> ⧽
├ /addowner — Add Owner
├ /delowner — Hapus Owner
├ /addpremv2 — Add Premium V2
├ /delpremv2 — Del Premium V2
╰──────────────

┌─⧼ <b>ᴍᴇɴᴜ ᴘʀᴇᴍɪᴜᴍ ᴠ2</b> ⧽
├ /addressv2 — Add Reseller V2
├ /delressv2 — Del Reseller V2
├ /cadpv2 nama,id
╰──────────────

┌─⧼ <b>ᴍᴇɴᴜ ᴀᴅᴍɪɴ ᴠ2</b> ⧽
├ /listsrv2
├ /listadmin2
├ /delsrv2
╰──────────────

┌─⧼ <b>ʀᴇꜱᴇʟʟᴇʀ ᴍᴇɴᴜ ᴠ2</b> ⧽ 
├ /1gbv2-/10gbv2 nama,id
├ /unliv2 nama,id
╰──────────────
</blockquote>`;
    bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
        [
            { text: "⿻ ᴘʀɪᴠᴀᴛᴇ ᴍᴇɴᴜ", callback_data: "privmenu" },
            { text: "⿻ ᴄʀᴇᴀᴛᴇ ᴘᴀɴᴇʟ", callback_data: "createpanel" },
          ],
        [
            { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ", callback_data: "ownermenu" }
        ],
        [
          { text: "<<", callback_data: "back" },
          { text: "ꜱᴇʀᴠᴇʀ 3", callback_data: "servertiga" },
          { text: "ꜱᴇʀᴠᴇʀ 4", callback_data: "serverempat" }
        ],
        [
          { text: "ꜱᴇʀᴠᴇʀ 5", callback_data: "serverlima" }
        ]
      ],
      },
    });
  }
});
  
bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "servertiga") {
      
      const userId = callbackQuery.from.id.toString();
    const isResellerV3 = JSON.parse(fs.readFileSync("./db/users/version/resellerV3.json"));

    if (!isResellerV3.includes(userId)) {
      return;
    }
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `<blockquote>┌─⧼ <b>ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ</b> ⧽
├ ⬡ Version : 3.0.0
├ ⬡ Owner : @${developer}
├ ⬡ Language : JavaScript
╰─────────────

┌─⧼ <b>ᴍᴇɴᴜ ᴏᴡɴᴇʀ ᴠ3</b> ⧽
├ /addowner — Add Owner
├ /delowner — Hapus Owner
├ /addpremv3 — Add Premium V3
├ /delpremv3 — Del Premium V3
╰──────────────

┌─⧼ <b>ᴍᴇɴᴜ ᴘʀᴇᴍɪᴜᴍ ᴠ3</b> ⧽
├ /addressv3 — Add Reseller V3
├ /delressv3 — Del Reseller V3
╰──────────────

┌─⧼ <b>ᴍᴇɴᴜ ᴀᴅᴍɪɴ ᴠ3</b> ⧽
├ /listsrv3
├ /listadmin3
├ /delsrv3
├ /cadpv3 nama,id
╰──────────────

┌─⧼ <b>ʀᴇꜱᴇʟʟᴇʀ ᴍᴇɴᴜ ᴠ3</b> ⧽ 
├ /1gbv3-/10gbv3 nama,id
├ /unliv3 nama,id
╰──────────────
</blockquote>
`;
    bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
        [
            { text: "⿻ ᴘʀɪᴠᴀᴛᴇ ᴍᴇɴᴜ", callback_data: "privmenu" },
            { text: "⿻ ᴄʀᴇᴀᴛᴇ ᴘᴀɴᴇʟ", callback_data: "createpanel" },
          ],
        [
            { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ", callback_data: "ownermenu" }
        ],
        [
          { text: "ꜱᴇʀᴠᴇʀ 2", callback_data: "serverdua" },
          { text: "<<", callback_data: "back" },
          { text: "ꜱᴇʀᴠᴇʀ 4", callback_data: "serverempat" }
        ],
        [
          { text: "ꜱᴇʀᴠᴇʀ 5", callback_data: "serverlima" }
        ]
      ],
      },
    });
  }
});
    
bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "serverempat") {
      
      const userId = callbackQuery.from.id.toString();
    const isResellerV4 = JSON.parse(fs.readFileSync("./db/users/version/resellerV4.json"));

    if (!isResellerV4.includes(userId)) {
      return;
    }
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `<blockquote>┌─⧼ <b>ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ</b> ⧽
├ ⬡ Version : 4.0.0
├ ⬡ Owner : @${developer}
├ ⬡ Language : JavaScript
╰─────────────

┌─⧼ <b>ᴍᴇɴᴜ ᴏᴡɴᴇʀ ᴠ4</b> ⧽
├ /addowner — Add Owner
├ /delowner — Hapus Owner
├ /addpremv4 — Add Premium V4
├ /delpremv4 — Del Premium V4
╰──────────────

┌─⧼ <b>ᴍᴇɴᴜ ᴘʀᴇᴍɪᴜᴍ ᴠ4</b> ⧽
├ /address4 — Add Reseller V4
├ /delressv4 — Del Reseller V4
╰──────────────

┌─⧼ <b>ᴍᴇɴᴜ ᴀᴅᴍɪɴ ᴠ4</b> ⧽
├ /listsrv4
├ /listadmin4
├ /delsrv4
├ /cadpv4 nama,id
╰──────────────

┌─⧼ <b>ʀᴇꜱᴇʟʟᴇʀ ᴍᴇɴᴜ ᴠ4</b> ⧽ 
├ /1gbv4-/10gbv4 nama,id
├ /unliv4 nama,id
╰──────────────
</blockquote>
`;
    bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
        [
            { text: "⿻ ᴘʀɪᴠᴀᴛᴇ ᴍᴇɴᴜ", callback_data: "privmenu" },
            { text: "⿻ ᴄʀᴇᴀᴛᴇ ᴘᴀɴᴇʟ", callback_data: "createpanel" },
          ],
        [
            { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ", callback_data: "ownermenu" }
        ],
        [
          { text: "ꜱᴇʀᴠᴇʀ 2", callback_data: "serverdua" },
          { text: "ꜱᴇʀᴠᴇʀ 3", callback_data: "servertiga" },
          { text: "<<", callback_data: "back" }
        ],
        [
          { text: "ꜱᴇʀᴠᴇʀ 5", callback_data: "serverlima" }
        ]
      ],
      },
    });
  }
});
    
bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "serverlima") {
      
      const userId = callbackQuery.from.id.toString();
    const isResellerV5 = JSON.parse(fs.readFileSync("./db/users/version/resellerV5.json"));

    if (!isResellerV5.includes(userId)) {
      return;
    }
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `<blockquote>┌─⧼ <b>ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ</b> ⧽
├ ⬡ Version : 5.0.0
├ ⬡ Owner : @${developer}
├ ⬡ Language : JavaScript
╰─────────────

┌─⧼ <b>ᴍᴇɴᴜ ᴏᴡɴᴇʀ ᴠ5</b> ⧽
├ /addowner — Add Owner
├ /delowner — Hapus Owner
├ /addpremv5 — Add Premium V5
├ /delpremv5 — Del Premium V5
╰──────────────

┌─⧼ <b>ᴍᴇɴᴜ ᴘʀᴇᴍɪᴜᴍ ᴠ5</b> ⧽
├ /address5 — Add Reseller V5
├ /delressv5 — Del Reseller V5
╰──────────────

┌─⧼ <b>ᴍᴇɴᴜ ᴀᴅᴍɪɴ ᴠ5</b> ⧽
├ /listsrv5
├ /listadmin5
├ /delsrv5
├ /cadpv5 nama,id
╰──────────────

┌─⧼ <b>ʀᴇꜱᴇʟʟᴇʀ ᴍᴇɴᴜ ᴠ5</b> ⧽ 
├ /1gbv5-/10gbv5 nama,id
├ /unliv5 nama,id
╰──────────────
</blockquote>
`;
    bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
        [
            { text: "⿻ ᴘʀɪᴠᴀᴛᴇ ᴍᴇɴᴜ", callback_data: "privmenu" },
            { text: "⿻ ᴄʀᴇᴀᴛᴇ ᴘᴀɴᴇʟ", callback_data: "createpanel" },
          ],
        [
            { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ", callback_data: "ownermenu" }
        ],
        [
          { text: "ꜱᴇʀᴠᴇʀ 2", callback_data: "serverdua" },
          { text: "ꜱᴇʀᴠᴇʀ 3", callback_data: "servertiga" },
          { text: "ꜱᴇʀᴠᴇʀ 4", callback_data: "serverempat" }
        ],
        [
          { text: "<<", callback_data: "back" }
        ]
      ],
      },
    });
  }
});
 
bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "ownermenu") {
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `\`\`\`
╭──✧ ᴏᴡɴᴇʀ ʙᴏᴛ ✧
│ ⪼ /addtk <id>
│ ⪼ /addpt <id>
│ ⪼ /addown <id>
│ ⪼ /addpr <id>
╰────────────⧽

╭──✧ ᴋʜᴜꜱᴜꜱ ᴅᴇᴠ ✧
│ ⪼ /broadcast
│ ⪼ /setcd
│ ⪼ /backup
│ ⪼ /setting
│ ⪼ /reqpair
╰────────────⧽

╭──✧ ᴀᴅᴅ ᴜꜱᴇʀ ɪᴅ ✧
│ ⪼ /addpublic
│ ⪼ /addprivate
│ ⪼ /add – All Type
╰────────────⧽

╭──✧ ᴏᴡɴᴇʀ ᴘᴀɴᴇʟ ✧
│ ⪼ /address <id>
│ ⪼ /delress <id>
│ ⪼ /addprem <id>
│ ⪼ /delprem <id>
╰────────────⧽
\`\`\``;
    bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
        [
            { text: "⿻ ᴘʀɪᴠᴀᴛᴇ ᴍᴇɴᴜ", callback_data: "privmenu" },
            { text: "⿻ ᴄʀᴇᴀᴛᴇ ᴘᴀɴᴇʟ", callback_data: "createpanel" },
          ],
          [
            { text: "ɪɴꜱᴛᴀʟʟ ᴍᴇɴᴜ", callback_data: "installmenu" },
            { text: "<<", callback_data: "back" },
            { text: "ᴏᴛʜᴇʀ ᴍᴇɴᴜ", callback_data: "othermenu" }
          ],
          [
            { text: "⿻ ᴇɴᴄʀʏᴘᴛ ᴍᴇɴᴜ", callback_data: "obfmenu" },
            { text: "⿻ ᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ", callback_data: "protectmenu" }
          ],
        ],
      },
    });
 }
});

bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "obfmenu") {
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `\`\`\`
╭──✧ ᴅᴇᴏʙꜰᴜꜱᴄᴀᴛᴇ ᴍᴇɴᴜ ✧
│ ⪼ /deobfuscate
╰────────────⧽

╭──✧ ᴇɴᴄʀʏᴘᴛᴇᴅ ʙᴀꜱɪᴄ ✧
│ ⪼ /enc <low/medium/high>
│ ⪼ /enceval <low/medium/high>
│ ⪼ /enclocked <1-365>
│ ⪼ /encx
│ ⪼ /encstrong
│ ⪼ /encbig
╰────────────⧽

╭──✧ ᴇɴᴄʀʏᴘᴛᴇᴅ ᴘʀᴇᴍɪᴜᴍ ✧
│ ⪼ /encultra
│ ⪼ /encmax
│ ⪼ /encquantum
│ ⪼ /encnova
│ ⪼ /encnebula
│ ⪼ /encsiu
│ ⪼ /encchina
│ ⪼ /encarab
│ ⪼ /encjapan
│ ⪼ /encjapxab
│ ⪼ /encnew
│ ⪼ /encinvis
│ ⪼ /invishard
│ ⪼ /encstealth
│ ⪼ /customenc
╰────────────⧽
\`\`\``;
    bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
        [
            { text: "⿻ ᴘʀɪᴠᴀᴛᴇ ᴍᴇɴᴜ", callback_data: "privmenu" },
            { text: "⿻ ᴄʀᴇᴀᴛᴇ ᴘᴀɴᴇʟ", callback_data: "createpanel" },
          ],
          [
            { text: "ɪɴꜱᴛᴀʟʟ ᴍᴇɴᴜ", callback_data: "installmenu" },
            { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ", callback_data: "ownermenu" },
            { text: "ᴏᴛʜᴇʀ ᴍᴇɴᴜ", callback_data: "othermenu" }
          ],
          [
            { text: "<<", callback_data: "back" },
            { text: "⿻ ᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ", callback_data: "protectmenu" }
          ],
        ],
      },
    });
 }
});
    
bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "protectmenu") {
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `\`\`\`
╭──✧ ꜱᴇᴄᴜʀɪᴛʏ ᴍᴇɴᴜ ✧
│ ⪼ /installprotect <option>
│ ⪼ /uninstallprotect <option>
╰────────────⧽

╭──✧ ʀᴇꜰʀᴇꜱʜ ᴍᴇɴᴜ ✧
│ ⪼ /refreshvps <ipvps,pwvps>
╰────────────⧽
\`\`\``;
    bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
        [
            { text: "⿻ ᴘʀɪᴠᴀᴛᴇ ᴍᴇɴᴜ", callback_data: "privmenu" },
            { text: "⿻ ᴄʀᴇᴀᴛᴇ ᴘᴀɴᴇʟ", callback_data: "createpanel" },
          ],
          [
            { text: "ɪɴꜱᴛᴀʟʟ ᴍᴇɴᴜ", callback_data: "installmenu" },
            { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ", callback_data: "ownermenu" },
            { text: "ᴏᴛʜᴇʀ ᴍᴇɴᴜ", callback_data: "othermenu" }
          ],
          [
            { text: "⿻ ᴇɴᴄʀʏᴘᴛ ᴍᴇɴᴜ", callback_data: "obfmenu" },
            { text: "<<", callback_data: "back" }
          ],
        ],
      },
    });
 }
});
    
bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "othermenu") {
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `\`\`\`
╭──✧ ᴄᴏɴᴠᴇʀᴛ ᴍᴇɴᴜ ✧
│ ⪼ /tourl <reply>
│ ⪼ /shortlink <link>
│ ⪼ /ytmp3 <link>
╰────────────⧽

╭──✧ ꜱᴛᴀʟᴋ ᴍᴇɴᴜ ✧
│ ⪼ /stalkgithub <user>
│ ⪼ /stalkyt <username>
│ ⪼ /stalkig <username>
│ ⪼ /stalktiktok <user>
╰────────────⧽

╭──✧ ᴍᴇᴅɪᴀ ᴍᴇɴᴜ ✧
│ ⪼ /pin <teks>
│ ⪼ /spotify <judul>
│ ⪼ /xnxx <teks|catbox>
│ ⪼ /brat <teks>
│ ⪼ /qc <teks>
│ ⪼ /iqc <ss iphone>
╰────────────⧽

╭──✧ ᴘʀɪᴍʙᴏɴ ᴍᴇɴᴜ ✧
│ ⪼ /artinama <nama>
│ ⪼ /jodoh <nama|nama>
│ ⪼ /lacakip <ip>
╰────────────⧽
\`\`\`
`;
    bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
        [
            { text: "⿻ ᴘʀɪᴠᴀᴛᴇ ᴍᴇɴᴜ", callback_data: "privmenu" },
            { text: "⿻ ᴄʀᴇᴀᴛᴇ ᴘᴀɴᴇʟ", callback_data: "createpanel" },
          ],
          [
            { text: "ɪɴꜱᴛᴀʟʟ ᴍᴇɴᴜ", callback_data: "installmenu" },
            { text: "⿻ ᴏᴡɴᴇʀ ᴍᴇɴᴜ", callback_data: "ownermenu" },
            { text: "<<", callback_data: "back" }
          ],
          [
            { text: "⿻ ᴇɴᴄʀʏᴘᴛ ᴍᴇɴᴜ", callback_data: "obfmenu" },
            { text: "⿻ ᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ", callback_data: "protectmenu" }
          ],
        ],
      },
    });
 }
});
    
bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "installmenu") {
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `\`\`\`
╭──✧ ɪɴꜱᴛᴀʟʟ ᴍᴇɴᴜ ✧
│ ⪼ /install <option>
╰────────────⧽

╭──✧ ᴜɴɪɴꜱᴛᴀʟʟ ᴍᴇɴᴜ ✧
│ ⪼ /uninstallpanel <option>
│ ⪼ /uninstallwings <option>
│ ⪼ /uninstalltema <ipvps,pwvps>
│ ⪼ /uninstalltemabg <ipvps,pwvps>
╰────────────⧽

╭──✧ ᴄʀᴇᴀᴛᴇ ɴᴏᴅᴇ ✧
│ ⪼ /createnode <ipvps,pwvps>
│ ⪼ /swings <ipvps,pwvps,token>
│ ⪼ /cwings <ipvps,pwvps>
╰────────────⧽

╭──✧ ʜᴀᴄᴋʙᴀᴄᴋ ᴘᴀɴᴇʟ ✧
│ ⪼ /usrpanel <ipvps,pwvps>
│ ⪼ /usrpasswd <ipvps,pwvps>
│ ⪼ /hbpanel <ipvps,pwvps>
│ ⪼ /clearall <ipvps,pwvps>
│ ⪼ /clearstorage <ipvps,pwvps>
╰────────────⧽

╭──✧ ʀᴜɴᴛɪᴍᴇ ᴠᴘꜱ ✧
│ ⪼ /spekvps <ipvps,pwvps>
│ ⪼ /cpuvps <ipvps,pwvps>
│ ⪼ /runtimevps <ipvps,pwvps>
│ ⪼ /refreshvps <ipvps,pwvps>
│ ⪼ /setpwvps <ipvps,pwlama,pwbaru>
╰────────────⧽

╭──✧ ꜱᴜʙᴅᴏᴍᴀɪɴ ✧
│ ⪼ /listsubdo
│ ⪼ /subdo <name,ipvps>
│ ⪼ /cleardns
╰────────────⧽

╭──✧ ɪɴꜱᴛᴀʟʟ ᴛᴇᴍᴀ ✧
│ ⪼ /installdepend (wajib)
│ ⪼ /installtemanebula <ipvps,pwvps>
│ ⪼ /installtemabg <ipvps,pwvps>
│ ⪼ /uninstalltema <ipvps,pwvps>
╰────────────⧽
\`\`\`
`;
    bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
        [
            { text: "⿻ ᴘʀɪᴠᴀᴛᴇ ᴍᴇɴᴜ", callback_data: "privmenu" },
            { text: "⿻ ᴄʀᴇᴀᴛᴇ ᴘᴀɴᴇʟ", callback_data: "createpanel" },
          ],
          [
            { text: "<<", callback_data: "back" },
            { text: "⿻ ᴏᴡɴᴇʀ ᴍᴇɴᴜ", callback_data: "ownermenu" },
            { text: "ᴏᴛʜᴇʀ ᴍᴇɴᴜ", callback_data: "othermenu" }
          ],
          [
            { text: "⿻ ᴇɴᴄʀʏᴘᴛ ᴍᴇɴᴜ", callback_data: "obfmenu" },
            { text: "⿻ ᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ", callback_data: "protectmenu" }
          ],
          [
            { text: "ᴄʀᴇᴀᴛᴇ ᴠᴘꜱ", callback_data: "cvpsmenu" }
          ]
        ],
      },
    });
 }
});

bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "cvpsmenu") {
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `\`\`\`
╭──✧ ɪɴꜱᴛᴀʟʟ ᴠᴘꜱ ✧
│ ⪼ /createvps <option>
│ ⪼ /statusdo <option>
╰────────────⧽

╭──✧ ꜱᴛᴀᴛᴜꜱ ᴠᴘꜱ ✧
│ ⪼ /cekdata <dropletId>
│ ⪼ /listvps <option>
│ ⪼ /delvps <dropletId>
╰────────────⧽
\`\`\`
`;
    bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
        [
            { text: "⿻ ᴘʀɪᴠᴀᴛᴇ ᴍᴇɴᴜ", callback_data: "privmenu" },
            { text: "⿻ ᴄʀᴇᴀᴛᴇ ᴘᴀɴᴇʟ", callback_data: "createpanel" },
          ],
          [
            { text: "ɪɴꜱᴛᴀʟʟ ᴍᴇɴᴜ", callback_data: "installmenu" },
            { text: "⿻ ᴏᴡɴᴇʀ ᴍᴇɴᴜ", callback_data: "ownermenu" },
            { text: "ᴏᴛʜᴇʀ ᴍᴇɴᴜ", callback_data: "othermenu" }
          ],
          [
            { text: "⿻ ᴇɴᴄʀʏᴘᴛ ᴍᴇɴᴜ", callback_data: "obfmenu" },
            { text: "⿻ ᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ", callback_data: "protectmenu" }
          ],
          [
            { text: "<<", callback_data: "back" }
          ]
        ],
      },
    });
 }
});

bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "back") {
  bot.answerCallbackQuery(callbackQuery.id);
      
   const userId = callbackQuery.from.id.toString();

  // runtime vps
  const vpsUptime = os.uptime();
  const vpsUptimeStr = `${Math.floor(vpsUptime / 86400)}d ${Math.floor((vpsUptime % 86400) / 3600)}h ${Math.floor((vpsUptime % 3600) / 60)}m`;
      
  const status = ownerUsers.includes(userId)
    ? "Owner"
    : premiumUsers.includes(userId)
    ? "Premium"
    : premiumUsers.includes(userId)
    ? "Reseller"
    : "User";
      
  if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile));
  }
  const total = users.length;
    
  const menuText = `<blockquote>( 👤 ) - 情報, @${callbackQuery.from.username}</blockquote>
안녕하세요 사용자, 환영합니다!

<blockquote><b>상태 :</b> ${status}
<b>총 사용자 :</b> ${total} User
<b>시간 :</b> ${waktu}</blockquote>

이것은 패널의 활성 기간입니다.
<blockquote>📡 ${vpsUptimeStr}</blockquote>`;
      
  bot.editMessageCaption(menuText, {
    chat_id: callbackQuery.message.chat.id,
    message_id: callbackQuery.message.message_id,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "⿻ ᴘʀɪᴠᴀᴛᴇ ᴍᴇɴᴜ", callback_data: "privmenu" },
          { text: "⿻ ᴄʀᴇᴀᴛᴇ ᴘᴀɴᴇʟ", callback_data: "createpanel" },
        ],
        [
          { text: "ɪɴꜱᴛᴀʟʟ ᴍᴇɴᴜ", callback_data: "installmenu" },
          { text: "ᴄʀᴇᴀᴛᴇ ᴠᴘꜱ", callback_data: "cvpsmenu" },
          { text: "ᴏᴛʜᴇʀ ᴍᴇɴᴜ", callback_data: "othermenu" }
        ],
        [
          { text: "⿻ ᴇɴᴄʀʏᴘᴛ ᴍᴇɴᴜ", callback_data: "obfmenu" },
          { text: "⿻ ᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ", callback_data: "protectmenu" }
        ],
        [
          { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ", callback_data: "ownermenu" }
        ],
        [
          { text: "ʙᴜʏ ꜱᴄʀɪᴘᴛ", url: "https://t.me/kinzxxoffc1" }
        ]
        ]
      }
  });
}
});
}