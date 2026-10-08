const fs = require('fs');
const { loadJsonData, saveJsonData } = require('../lib/function');
const settings = require('../settings/config.js');

const OWNER_ID = settings.ownerId;
const OWNER_FILE = './db/users/adminID.json';

const OWNERP_FILE = './db/users/ownerID.json';
const PREMIUM_FILE = './db/users/premiumUsers.json';
const RESS_FILE = './db/users/resellerUsers.json';
const RESSSC_FILE = './db/users/resellerSc.json';
const RESSVPS_FILE = './db/users/resellerVps.json';
const BUYERVPS_FILE = './db/users/buyerVps.json';

module.exports = (bot) => {
  const isMember = async (userId) => {
    try {
      const member = await bot.getChatMember(`${settings.chUsn}`, userId);
      return ['creator','administrator','member'].includes(member.status);
    } catch {
      return false;
    }
  };

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

  const command = (regex, callback) => {
    bot.onText(regex, async (msg, match) => {
      const userId = msg.from.id;
      const joined = await isMember(userId);

      if (!joined) return sendJoinChannel(msg);
        
      callback(msg, match);
    });
  };
    
// command /addall
command(/^\/add(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const targetId = match[1];

  if (!targetId) return bot.sendMessage(chatId, '❌ Format salah!\nContoh:\n/add 123456789');

  const owners = loadJsonData(OWNER_FILE);
  if (msg.from.id !== OWNER_ID && !owners.includes(msg.from.id)) {
    return bot.sendMessage(chatId, '❌ Khusus owner bot');
  }

  try {
    const targetUser = await bot.getChat(targetId).catch(() => null);
    if (!targetUser) {
      return bot.sendMessage(chatId, '❌ User tidak ditemukan atau bot belum pernah chat dengan user.');
    }

    // Load semua role
    const roles = {
      CEO: loadJsonData("./db/users/ceoID.json"),
      TK: loadJsonData("./db/users/tkID.json"),
      Partner: loadJsonData("./db/users/partnerID.json"),
      Owner: loadJsonData("./db/users/ownerID.json"),
      Premium: loadJsonData("./db/users/premiumUsers.json"),
      Reseller: loadJsonData("./db/users/resellerUsers.json")
    };

    const textMsg = `Username: @${targetUser.username || '-'}\nID: \`${targetId}\`\nType: User Panel`;

    const inlineKeyboard = [
      [
        { text: `CEO ${roles.CEO.includes(targetId) ? '✅' : '❌'}`, callback_data: `toggle_CEO:${targetId}` },
        { text: `TK ${roles.TK.includes(targetId) ? '✅' : '❌'}`, callback_data: `toggle_TK:${targetId}` }
      ],
      [
        { text: `Partner ${roles.Partner.includes(targetId) ? '✅' : '❌'}`, callback_data: `toggle_Partner:${targetId}` },
        { text: `Owner ${roles.Owner.includes(targetId) ? '✅' : '❌'}`, callback_data: `toggle_Owner:${targetId}` }
      ],
      [
        { text: `Premium ${roles.Premium.includes(targetId) ? '✅' : '❌'}`, callback_data: `toggle_Premium:${targetId}` },
        { text: `Reseller ${roles.Reseller.includes(targetId) ? '✅' : '❌'}`, callback_data: `toggle_Reseller:${targetId}` }
      ]
    ];

    await bot.sendMessage(chatId, textMsg, {
      parse_mode: "Markdown",
      reply_to_message_id: msg.message_id,
      reply_markup: { inline_keyboard: inlineKeyboard }
    });

  } catch (err) {
    console.error("Error di /add:", err.message);
    bot.sendMessage(chatId, "❌ Terjadi kesalahan.");
  }
});

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const [action, targetId] = query.data.split(":");
    
  const owners = loadJsonData(OWNER_FILE).map(id => id.toString());
  if (!owners.includes(query.from.id.toString())) return;

  const roleMap = {
    toggle_CEO: "./db/users/ceoID.json",
    toggle_TK: "./db/users/tkID.json",
    toggle_Partner: "./db/users/partnerID.json",
    toggle_Owner: "./db/users/ownerID.json",
    toggle_Premium: "./db/users/premiumUsers.json",
    toggle_Reseller: "./db/users/resellerUsers.json"
  };

  const labelMap = {
    toggle_CEO: "CEO",
    toggle_TK: "TK",
    toggle_Partner: "Partner",
    toggle_Owner: "Owner",
    toggle_Premium: "Premium",
    toggle_Reseller: "Reseller"
  };

  if (!roleMap[action]) return;

  try {
    let json = loadJsonData(roleMap[action]);
    let updatedText;

    if (json.includes(targetId)) {
      json = json.filter(id => id !== targetId);
      updatedText = `❌ User ${targetId} dihapus dari ${labelMap[action]}`;
    } else {
      json.push(targetId);
      updatedText = `✅ User ${targetId} ditambahkan ke ${labelMap[action]}`;
    }
    saveJsonData(roleMap[action], json);

    // reload semua role untuk update inline keyboard
    const roles = {
      CEO: loadJsonData("./db/users/ceoID.json"),
      TK: loadJsonData("./db/users/tkID.json"),
      Partner: loadJsonData("./db/users/partnerID.json"),
      Owner: loadJsonData("./db/users/ownerID.json"),
      Premium: loadJsonData("./db/users/premiumUsers.json"),
      Reseller: loadJsonData("./db/users/resellerUsers.json")
    };

    const keyboard = [
      [
        { text: `CEO ${roles.CEO.includes(targetId) ? '✅' : '❌'}`, callback_data: `toggle_CEO:${targetId}` },
        { text: `TK ${roles.TK.includes(targetId) ? '✅' : '❌'}`, callback_data: `toggle_TK:${targetId}` }
      ],
      [
        { text: `Partner ${roles.Partner.includes(targetId) ? '✅' : '❌'}`, callback_data: `toggle_Partner:${targetId}` },
        { text: `Owner ${roles.Owner.includes(targetId) ? '✅' : '❌'}`, callback_data: `toggle_Owner:${targetId}` }
      ],
      [
        { text: `Premium ${roles.Premium.includes(targetId) ? '✅' : '❌'}`, callback_data: `toggle_Premium:${targetId}` },
        { text: `Reseller ${roles.Reseller.includes(targetId) ? '✅' : '❌'}`, callback_data: `toggle_Reseller:${targetId}` }
      ]
    ];

    await bot.editMessageReplyMarkup({ inline_keyboard: keyboard }, { chat_id: chatId, message_id: messageId });
    bot.answerCallbackQuery(query.id, { text: updatedText });

  } catch (err) {
    console.error(err);
    bot.answerCallbackQuery(query.id, { text: "❌ Terjadi kesalahan saat update user" });
  }
});

    
// command /addprem
command(/^\/addprem(?:\s+(\d+))?$/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    const owners = loadJsonData(OWNERP_FILE);
    if (msg.from.id !== OWNER_ID && !owners.includes(userId)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ᴘᴀɴᴇʟ');
    }

    let targetUserId;

    if (match[1]) {
        // kalau pakai ID di command
        targetUserId = match[1];
    } else if (msg.reply_to_message) {
        // kalau reply pesan
        targetUserId = msg.reply_to_message.from.id.toString();
    } else {
        return bot.sendMessage(chatId, '❌ Reply ke pesan user!\nContoh:\n/addprem id');
    }

    const premUsers = loadJsonData(PREMIUM_FILE);

    if (!premUsers.includes(targetUserId)) {
        premUsers.push(targetUserId);
        saveJsonData(PREMIUM_FILE, premUsers);
        return bot.sendMessage(chatId, `✅ User ID ${targetUserId} berhasil ditambahkan sebagai Premium!`, {
            parse_mode: "Markdown",
            reply_to_message_id: msg.message_id
        });
    } else {
        return bot.sendMessage(chatId, `⚠️ User ID ${targetUserId} sudah menjadi Premium!`);
    }
});

// command /address
command(/^\/address(?:\s+(\d+))?$/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    const owners = loadJsonData(OWNERP_FILE);
    if (msg.from.id !== OWNER_ID && !owners.includes(userId)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ᴘᴀɴᴇʟ');
    }

    let targetUserId;

    if (match[1]) {
        targetUserId = match[1];
    } else if (msg.reply_to_message) {
        targetUserId = msg.reply_to_message.from.id.toString();
    } else {
        return bot.sendMessage(chatId, '❌ Reply ke pesan user!\nContoh:\n/address id');
    }

    const ressUsers = loadJsonData(RESS_FILE);

    if (!ressUsers.includes(targetUserId)) {
        ressUsers.push(targetUserId);
        saveJsonData(RESS_FILE, ressUsers);
        return bot.sendMessage(chatId, `✅ User ID ${targetUserId} berhasil ditambahkan sebagai Reseller Panel!`, {
            parse_mode: "Markdown",
            reply_to_message_id: msg.message_id
        });
    } else {
        return bot.sendMessage(chatId, `⚠️ User ID ${targetUserId} sudah menjadi Reseller Panel!`);
    }
});

// command /addrsc
command(/^\/addrsc(?:\s+(\d+))?$/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    const owners = loadJsonData(OWNER_FILE);
    if (msg.from.id !== OWNER_ID && !owners.includes(userId)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ');
    }

    let targetUserId;

    if (match[1]) {
        targetUserId = match[1];
    } else if (msg.reply_to_message) {
        targetUserId = msg.reply_to_message.from.id.toString();
    } else {
        return bot.sendMessage(chatId, '❌ Reply ke pesan user!\nContoh:\n/addrsc id');
    }

    const ressUsers = loadJsonData(RESSSC_FILE);

    if (!ressUsers.includes(targetUserId)) {
        ressUsers.push(targetUserId);
        saveJsonData(RESSSC_FILE, ressUsers);
        return bot.sendMessage(chatId, `✅ User ID ${targetUserId} berhasil ditambahkan sebagai Reseller Script!`, {
            parse_mode: "Markdown",
            reply_to_message_id: msg.message_id
        });
    } else {
        return bot.sendMessage(chatId, `⚠️ User ID ${targetUserId} sudah menjadi Reseller Script!`);
    }
});

    // command /delprem
bot.onText(/^\/delprem(?:\s+(.+))?$/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    const owners = loadJsonData(OWNER_FILE);
    if (msg.from.id !== OWNER_ID && !owners.includes(userId)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ʙᴏᴛ');
    }

    let targetUserId;

    if (match[1]) {
        targetUserId = match[1].trim();
    } else if (msg.reply_to_message) {
        targetUserId = msg.reply_to_message.from.id.toString();
    } else {
        return bot.sendMessage(chatId, '❌ Reply ke Pesan User atau tambahkan ID!');
    }

    if (!/^\d+$/.test(targetUserId)) {
        return bot.sendMessage(chatId, '❌ User ID harus berupa angka!');
    }

    let premUsers = loadJsonData(PREMIUM_FILE);

    if (premUsers.includes(targetUserId)) {
        premUsers = premUsers.filter(uid => uid !== targetUserId);
        saveJsonData(PREMIUM_FILE, premUsers);

        bot.sendMessage(chatId, `✅ User ID ${targetUserId} berhasil dihapus dari Premium!`, {
            parse_mode: "Markdown",
            reply_to_message_id: msg.message_id
        });
    } else {
        bot.sendMessage(chatId, `⚠️ User ID ${targetUserId} tidak ditemukan di daftar Premium!`);
    }
});

    // command /delress
bot.onText(/^\/delress(?:\s+(.+))?$/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    const owners = loadJsonData(OWNER_FILE);
    if (msg.from.id !== OWNER_ID && !owners.includes(userId)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ʙᴏᴛ');
    }

    let targetUserId;

    if (match[1]) {
        targetUserId = match[1].trim();
    } else if (msg.reply_to_message) {
        targetUserId = msg.reply_to_message.from.id.toString();
    } else {
        return bot.sendMessage(chatId, '❌ Reply ke Pesan User atau tambahkan ID!');
    }

    if (!/^\d+$/.test(targetUserId)) {
        return bot.sendMessage(chatId, '❌ User ID harus berupa angka!');
    }

    let ressUsers = loadJsonData(RESS_FILE);

    if (ressUsers.includes(targetUserId)) {
        ressUsers = ressUsers.filter(uid => uid !== targetUserId);
        saveJsonData(RESS_FILE, ressUsers);

        bot.sendMessage(chatId, `✅ User ID ${targetUserId} berhasil dihapus dari Reseller Panel!`, {
            parse_mode: "Markdown",
            reply_to_message_id: msg.message_id
        });
    } else {
        bot.sendMessage(chatId, `⚠️ User ID ${targetUserId} tidak ditemukan di daftar Reseller Panel!`);
    }
});
    
    // command /delown
bot.onText(/^\/delown(?:\s+(.+))?$/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    const owners = loadJsonData(OWNER_FILE);
    if (msg.from.id !== OWNER_ID && !owners.includes(userId)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ʙᴏᴛ');
    }

    let targetUserId;

    if (match[1]) {
        targetUserId = match[1].trim();
    } else if (msg.reply_to_message) {
        targetUserId = msg.reply_to_message.from.id.toString();
    } else {
        return bot.sendMessage(chatId, '❌ Reply ke Pesan User atau tambahkan ID!');
    }

    if (!/^\d+$/.test(targetUserId)) {
        return bot.sendMessage(chatId, '❌ User ID harus berupa angka!');
    }

    let premUsers = loadJsonData(PREMIUM_FILE);
    let ressUsers = loadJsonData(RESS_FILE);
    let ownerUsers = loadJsonData(OWNERP_FILE);

    let deletedFromPrem = false;
    let deletedFromRess = false;
    let deletedFromOwner = false;

    if (premUsers.includes(targetUserId)) {
        premUsers = premUsers.filter(uid => uid !== targetUserId);
        saveJsonData(PREMIUM_FILE, premUsers);
        deletedFromPrem = true;
    }

    if (ressUsers.includes(targetUserId)) {
        ressUsers = ressUsers.filter(uid => uid !== targetUserId);
        saveJsonData(RESS_FILE, ressUsers);
        deletedFromRess = true;
    }

    if (ownerUsers.includes(targetUserId)) {
        if (targetUserId === userId) {
            return bot.sendMessage(chatId, '❌ Gagal menghapus diri sendiri sebagai Owner!');
        }
        ownerUsers = ownerUsers.filter(id => id !== targetUserId);
        saveJsonData(OWNERP_FILE, ownerUsers);
        deletedFromOwner = true;
    }

    let resultMessage = '';
    if (deletedFromPrem || deletedFromRess || deletedFromOwner) {
        resultMessage = `✅ User ID ${targetUserId} berhasil dihapus dari:`;
        if (deletedFromPrem) resultMessage += '\n• Premium';
        if (deletedFromRess) resultMessage += '\n• Reseller Panel';
        if (deletedFromOwner) resultMessage += '\n• Owner';
    } else {
        resultMessage = `⚠️ User ID ${targetUserId} tidak ditemukan di daftar Premium, Reseller, atau Owner!`;
    }

    bot.sendMessage(chatId, resultMessage, {
        parse_mode: "Markdown",
        reply_to_message_id: msg.message_id
    });
});
    
// command /addpublic
command(/^\/addpublic(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const targetId = match[1];

  if (!targetId) {
    return bot.sendMessage(chatId, '❌ Format salah!\nContoh:\n/addpublic 123456789');
  }

  const owners = loadJsonData(OWNER_FILE);
  if (msg.from.id !== OWNER_ID && !owners.includes(msg.from.id)) {
    return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ʙᴏᴛ');
  }

  try {
    // cek apakah target bisa diakses
    const targetUser = await bot.getChat(targetId).catch(() => null);
    if (!targetUser) {
      return bot.sendMessage(chatId, '❌ User tidak ditemukan atau bot belum pernah chat dengan user tersebut.');
    }

    const ownerData = loadJsonData("./db/users/ownerID.json");
    const premiumData = loadJsonData("./db/users/premiumUsers.json");
    const resellerData = loadJsonData("./db/users/resellerUsers.json");

    const ownerMark = ownerData.includes(targetId) ? "✅" : "❌";
    const premiumMark = premiumData.includes(targetId) ? "✅" : "❌";
    const resellerMark = resellerData.includes(targetId) ? "✅" : "❌";

    const textMsg = `Username: @${targetUser.username || '-'}\nID: \`${targetId}\`\nType: User Public`;

    await bot.sendMessage(chatId, textMsg, {
      parse_mode: "Markdown",
      reply_to_message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [
          [
            { text: `ᴏᴡɴᴇʀ ${ownerMark}`, callback_data: `toggle_owner:${targetId}` }
          ],
          [
            { text: `ᴘʀᴇᴍɪᴜᴍ ${premiumMark}`, callback_data: `toggle_premium:${targetId}` },
            { text: `ʀᴇꜱᴇʟʟᴇʀ ${resellerMark}`, callback_data: `toggle_reseller:${targetId}` }
          ]
        ]
      }
    });
  } catch (err) {
    console.error("Error di /addpublic:", err.message);
    bot.sendMessage(chatId, "❌ Terjadi kesalahan.");
  }
});

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const [action, targetId] = query.data.split(":");
    
  const owners = loadJsonData(OWNER_FILE);

if (!owners.includes(query.from.id.toString())) {
  return
}

  let filePath, label;
  if (action === "toggle_owner") {
    filePath = "./db/users/ownerID.json"; label = "ᴏᴡɴᴇʀ";
  }
  if (action === "toggle_premium") {
    filePath = "./db/users/premiumUsers.json"; label = "ᴘʀᴇᴍɪᴜᴍ";
  }
  if (action === "toggle_reseller") {
    filePath = "./db/users/resellerUsers.json"; label = "ʀᴇꜱᴇʟʟᴇʀ";
  }
  if (!filePath) return;

  try {
    let json = loadJsonData(filePath);
    let updated;

    if (json.includes(targetId)) {
      json = json.filter(id => id !== targetId); // hapus
      updated = `❌ User ID ${targetId} dihapus dari ${label}`;
    } else {
      json.push(targetId); // tambah
      updated = `✅ User ID ${targetId} ditambahkan ke ${label}`;
    }
    saveJsonData(filePath, json);

    // cek ulang semua file buat update status
    const ownerData = loadJsonData("./db/users/ownerID.json");
    const premiumData = loadJsonData("./db/users/premiumUsers.json");
    const resellerData = loadJsonData("./db/users/resellerUsers.json");

    const ownerMark = ownerData.includes(targetId) ? "✅" : "❌";
    const premiumMark = premiumData.includes(targetId) ? "✅" : "❌";
    const resellerMark = resellerData.includes(targetId) ? "✅" : "❌";

    const keyboard = [
      [
        { text: `ᴏᴡɴᴇʀ ${ownerMark}`, callback_data: `toggle_owner:${targetId}` }],
        [{ text: `ᴘʀᴇᴍɪᴜᴍ ${premiumMark}`, callback_data: `toggle_premium:${targetId}` },
        { text: `ʀᴇꜱᴇʟʟᴇʀ ${resellerMark}`, callback_data: `toggle_reseller:${targetId}` }
      ]
    ];

    await bot.editMessageReplyMarkup(
      { inline_keyboard: keyboard },
      { chat_id: chatId, message_id: messageId }
    );

    bot.answerCallbackQuery(query.id, { text: updated });
  } catch (err) {
    console.error(err);
    bot.answerCallbackQuery(query.id, { text: "❌ Error saat update user!" });
  }
});
    
// command /addpriv
command(/^\/addprivate(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const targetId = match[1];
    
    if (!targetId) {
        bot.sendMessage(chatId, '❌ Format salah!\nContoh:\n/addpriv 123456789');
        return;
    }
    
  const owners = loadJsonData(OWNER_FILE);
    if (msg.from.id !== OWNER_ID && !owners.includes(msg.from.id)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ʙᴏᴛ');
    }

  const ownerPriv = loadJsonData("./db/users/private/privateID.json");
  const premiumPriv = loadJsonData("./db/users/private/privPrem.json");
  const resellerPriv = loadJsonData("./db/users/private/privRess.json");

  const ownerCheck = ownerPriv.includes(targetId) ? "✅" : "❌";
  const premiumCheck = premiumPriv.includes(targetId) ? "✅" : "❌";
  const resellerCheck = resellerPriv.includes(targetId) ? "✅" : "❌";

  const targetUser = await bot.getChat(targetId);

const textMsg = `Username: @${targetUser.username || '-'}
ID: \`${targetId}\`
Type: User Private`;

bot.sendMessage(chatId, textMsg, {
    parse_mode: "Markdown",
    reply_to_message_id: msg.message_id,
    reply_markup: {
      inline_keyboard: [
        [
          { text: `ᴏᴡɴᴇʀ ${ownerCheck}`, callback_data: `private_owner:${targetId}` }],
          [{ text: `ᴘʀᴇᴍɪᴜᴍ ${premiumCheck}`, callback_data: `private_premium:${targetId}` },
          { text: `ʀᴇꜱᴇʟʟᴇʀ ${resellerCheck}`, callback_data: `private_reseller:${targetId}` }
        ]
      ]
    }
  });
});

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const [action, targetId] = query.data.split(":");
    
  const owners = loadJsonData(OWNER_FILE);

if (!owners.includes(query.from.id.toString())) {
  return
}

  let filePath, label;
  if (action === "private_owner") {
    filePath = "./db/users/private/privateID.json"; label = "ᴏᴡɴᴇʀ";
  }
  if (action === "private_premium") {
    filePath = "./db/users/private/privatePrem.json"; label = "ᴘʀᴇᴍɪᴜᴍ";
  }
  if (action === "private_reseller") {
    filePath = "./db/users/private/privateRess.json"; label = "ʀᴇꜱᴇʟʟᴇʀ";
  }
  if (!filePath) return;

  try {
    let json = loadJsonData(filePath);
    let updated;

    if (json.includes(targetId)) {
      json = json.filter(id => id !== targetId); // hapus
      updated = `❌ User ID ${targetId} dihapus dari ${label}`;
    } else {
      json.push(targetId); // tambah
      updated = `✅ User ID ${targetId} ditambahkan ke ${label}`;
    }
    saveJsonData(filePath, json);

    // cek ulang semua file buat update status
    const ownerPriv = loadJsonData("./db/users/private/privateID.json");
    const premiumPriv = loadJsonData("./db/users/private/privatePrem.json");
    const resellerPriv = loadJsonData("./db/users/private/privateRess.json");

    const ownerCheck = ownerPriv.includes(targetId) ? "✅" : "❌";
    const premiumCheck = premiumPriv.includes(targetId) ? "✅" : "❌";
    const resellerCheck = resellerPriv.includes(targetId) ? "✅" : "❌";

    const keyboard = [
      [
        { text: `ᴏᴡɴᴇʀ ${ownerCheck}`, callback_data: `private_owner:${targetId}` }],
        [{ text: `ᴘʀᴇᴍɪᴜᴍ ${premiumCheck}`, callback_data: `private_premium:${targetId}` },
        { text: `ʀᴇꜱᴇʟʟᴇʀ ${resellerCheck}`, callback_data: `private_reseller:${targetId}` }
      ]
    ];

    await bot.editMessageReplyMarkup(
      { inline_keyboard: keyboard },
      { chat_id: chatId, message_id: messageId }
    );

    bot.answerCallbackQuery(query.id, { text: updated });
  } catch (err) {
    console.error(err);
    bot.answerCallbackQuery(query.id, { text: "❌ Error saat update user!" });
  }
});

// command /addrvps
command(/^\/addrvps(?:\s+(.+))?$/, (msg, match) => { 
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    
    // cek owner
    const owners = loadJsonData(OWNER_FILE);
    if (msg.from.id !== OWNER_ID && !owners.includes(userId)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ʙᴏᴛ');
    }
    
    const text = match[1];
    if (!text) {
        bot.sendMessage(chatId, '❌ Format salah!\nContoh: /addrvps 123456789');
        return;
    }

    const targetUserId = match[1].trim();

    // validasi id
    if (!/^\d+$/.test(targetUserId)) {
        return bot.sendMessage(chatId, '❌ User ID harus berupa angka!');
    }

    // load file
    const ressVps = loadJsonData(RESSVPS_FILE);

    let addedRessVps = false;
    
    // tambahkan ke owner
    if (!ressVps.includes(targetUserId)) {
        ressVps.push(targetUserId);
        saveJsonData(RESSVPS_FILE, ressVps);
        addedRessVps = true;
    }

    if (addedRessVps) {
        bot.sendMessage(chatId, `✅ User ID ${targetUserId} berhasil ditambahkan sebagai Reseller VPS!`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
    } else {
        bot.sendMessage(chatId, `⚠️ User ID ${targetUserId} sudah menjadi Reseller VPS!`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
    }
});
    
// command /addbvps
command(/^\/addbvps(?:\s+(.+))?$/, (msg, match) => { 
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    
    // cek owner
    const owners = loadJsonData(OWNER_FILE);
    if (msg.from.id !== OWNER_ID && !owners.includes(userId)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ʙᴏᴛ');
    }
    
    const text = match[1];
    if (!text) {
        bot.sendMessage(chatId, '❌ Format salah!\nContoh:\n/addbvps 123456789');
        return;
    }

    const targetUserId = match[1].trim();

    // validasi id
    if (!/^\d+$/.test(targetUserId)) {
        return bot.sendMessage(chatId, '❌ User ID harus berupa angka!');
    }

    // load file
    const buyerVps = loadJsonData(BUYERVPS_FILE);

    let addedBuyVps = false;
    
    // tambahkan ke owner
    if (!buyerVps.includes(targetUserId)) {
        buyerVps.push(targetUserId);
        saveJsonData(BUYERVPS_FILE, buyerVps);
        addedBuyVps = true;
    }

    if (addedBuyVps) {
        bot.sendMessage(chatId, `✅ User ID ${targetUserId} berhasil ditambahkan sebagai Buyer VPS!`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
    } else {
        bot.sendMessage(chatId, `⚠️ User ID ${targetUserId} sudah menjadi Buyer VPS!`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
    }
});
    
// command /addtk
command(/^\/addtk(?:\s+(.+))?$/, (msg, match) => { 
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    
    // cek owner
    const owners = loadJsonData(OWNER_FILE);
    if (msg.from.id !== OWNER_ID && !owners.includes(userId)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ʙᴏᴛ');
    }
    
    const text = match[1];
    if (!text) {
        bot.sendMessage(chatId, '❌ Format salah!\nContoh: /addtk 123456789');
        return;
    }

    const targetUserId = match[1].trim();

    // validasi id
    if (!/^\d+$/.test(targetUserId)) {
        return bot.sendMessage(chatId, '❌ User ID harus berupa angka!');
    }

    // load file
    const premiumUsers = loadJsonData(PREMIUM_FILE);
    const ressUsers = loadJsonData(RESS_FILE);
    const ownerUsers = loadJsonData(OWNER_FILE);

    let addedPrem = false;
    let addedRes = false;
    let addedOwner = false;

    // tambahkan ke premium
    if (!premiumUsers.includes(targetUserId)) {
        premiumUsers.push(targetUserId);
        saveJsonData(PREMIUM_FILE, premiumUsers);
        addedPrem = true;
    }

    // tambahkan ke reseller
    if (!ressUsers.includes(targetUserId)) {
        ressUsers.push(targetUserId);
        saveJsonData(RESS_FILE, ressUsers);
        addedRes = true;
    }
    
    // tambahkan ke owner
    if (!ownerUsers.includes(targetUserId)) {
        ownerUsers.push(targetUserId);
        saveJsonData(OWNER_FILE, ownerUsers);
        addedOwner = true;
    }

    if (addedPrem || addedRes || addedOwner) {
        bot.sendMessage(chatId, `✅ User ID ${targetUserId} berhasil ditambahkan sebagai Tangan Kanan Panel!`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
    } else {
        bot.sendMessage(chatId, `⚠️ User ID ${targetUserId} sudah menjadi Tangan Kanan Panel!`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
    }
});

// command /addpt
command(/^\/addpt(?:\s+(.+))?$/, (msg, match) => { 
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    
    // cek owner
    const owners = loadJsonData(OWNER_FILE);
    if (msg.from.id !== OWNER_ID && !owners.includes(userId)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ʙᴏᴛ');
    }
    
    const text = match[1];
    if (!text) {
        bot.sendMessage(chatId, '❌ Format salah!\nContoh: /addpt 123456789');
        return;
    }

    const targetUserId = match[1].trim();

    // validasi id
    if (!/^\d+$/.test(targetUserId)) {
        return bot.sendMessage(chatId, '❌ User ID harus berupa angka!');
    }

    // load file
    const premiumUsers = loadJsonData(PREMIUM_FILE);
    const ressUsers = loadJsonData(RESS_FILE);
    const ownerUsers = loadJsonData(OWNER_FILE);

    let addedPrem = false;
    let addedRes = false;
    let addedOwner = false;

    // tambahkan ke premium
    if (!premiumUsers.includes(targetUserId)) {
        premiumUsers.push(targetUserId);
        saveJsonData(PREMIUM_FILE, premiumUsers);
        addedPrem = true;
    }

    // tambahkan ke reseller
    if (!ressUsers.includes(targetUserId)) {
        ressUsers.push(targetUserId);
        saveJsonData(RESS_FILE, ressUsers);
        addedRes = true;
    }
    
    // tambahkan ke owner
    if (!ownerUsers.includes(targetUserId)) {
        ownerUsers.push(targetUserId);
        saveJsonData(OWNER_FILE, ownerUsers);
        addedOwner = true;
    }

    if (addedPrem || addedRes || addedOwner) {
        bot.sendMessage(chatId, `✅ User ID ${targetUserId} berhasil ditambahkan sebagai Partner Panel`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
    } else {
        bot.sendMessage(chatId, `⚠️ User ID ${targetUserId} sudah menjadi Partner Panel!`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
    }
});

// command /addown panel
command(/^\/addown(?:\s+(.+))?$/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    
    // cek owner
    const owners = loadJsonData(OWNERP_FILE);
    if (msg.from.id !== OWNER_ID && !owners.includes(userId)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ᴘᴀɴᴇʟ');
    }

    let targetUserId;

    if (match[1]) {
        targetUserId = match[1].trim();
    } else if (msg.reply_to_message) {
        targetUserId = msg.reply_to_message.from.id.toString();
    } else {
        return bot.sendMessage(chatId, '❌ Reply ke pesan user/tambahkan ID!');
    }

    // validasi id
    if (!/^\d+$/.test(targetUserId)) {
        return bot.sendMessage(chatId, '❌ User ID harus berupa angka!');
    }

    // load file
    const premiumUsers = loadJsonData(PREMIUM_FILE);
    const ressUsers = loadJsonData(RESS_FILE);
    const ownerpUsers = loadJsonData(OWNERP_FILE);

    let addedPrem = false;
    let addedRes = false;
    let addedOwnerP = false;

    // tambahkan ke premium
    if (!premiumUsers.includes(targetUserId)) {
        premiumUsers.push(targetUserId);
        saveJsonData(PREMIUM_FILE, premiumUsers);
        addedPrem = true;
    }

    // tambahkan ke reseller
    if (!ressUsers.includes(targetUserId)) {
        ressUsers.push(targetUserId);
        saveJsonData(RESS_FILE, ressUsers);
        addedRes = true;
    }
    
    // tambahkan ke owner
    if (!ownerpUsers.includes(targetUserId)) {
        ownerpUsers.push(targetUserId);
        saveJsonData(OWNERP_FILE, ownerpUsers);
        addedOwnerP = true;
    }

    if (addedPrem || addedRes || addedOwnerP) {
        bot.sendMessage(chatId, `✅ User ID ${targetUserId} berhasil ditambahkan sebagai Owner Panel!`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
    } else {
        bot.sendMessage(chatId, `⚠️ User ID ${targetUserId} sudah menjadi Owner Panel!`);
    }
});
    
// command add premium & reseller
command(/^\/addpr(?:\s+(.+))?$/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    
    // cek owner
    const owners = loadJsonData(OWNERP_FILE);
    if (msg.from.id !== OWNER_ID && !owners.includes(userId)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜsᴜs ᴏᴡɴᴇʀ');
    }

    let targetUserId;

    if (match[1]) {
        targetUserId = match[1].trim();
    } else if (msg.reply_to_message) {
        targetUserId = msg.reply_to_message.from.id.toString();
    } else {
        return bot.sendMessage(chatId, '❌ Reply ke pesan user/tambahkan ID!');
    }

    // validasi id
    if (!/^\d+$/.test(targetUserId)) {
        return bot.sendMessage(chatId, '❌ User ID harus berupa angka!');
    }

    // load file
    const premiumUsers = loadJsonData(PREMIUM_FILE);
    const ressUsers = loadJsonData(RESS_FILE);

    let addedPrem = false;
    let addedRes = false;

    // tambahkan ke premium
    if (!premiumUsers.includes(targetUserId)) {
        premiumUsers.push(targetUserId);
        saveJsonData(PREMIUM_FILE, premiumUsers);
        addedPrem = true;
    }

    // tambahkan ke reseller
    if (!ressUsers.includes(targetUserId)) {
        ressUsers.push(targetUserId);
        saveJsonData(RESS_FILE, ressUsers);
        addedRes = true;
    }

    if (addedPrem || addedRes) {
        bot.sendMessage(chatId, `✅ User ID ${targetUserId} berhasil ditambahkan menjadi Premium & Reseller`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
    } else {
        bot.sendMessage(chatId, `⚠️ User ID ${targetUserId} sudah menjadi Premium & Reseller!`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
    }
});   
}