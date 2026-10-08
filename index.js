const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const archiver = require("archiver");
const { createCanvas, loadImage } = require('canvas');
const crypto = require("crypto");
const chalk = require("chalk");
const fs = require("fs");
const os = require("os");
const { exec } = require("child_process");
const path = require("path");
const readline = require("readline");
const {
    loadJsonData,
    saveJsonData,
    checkCooldown,
    setCooldown
} = require('./lib/function');
const startBot = require('./@naeldev/main.js'); 

const settings = require("./settings/config.js");
const OWNER_ID = settings.ownerId;

// --- INISIALISASI BOT TANPA VERIFIKASI ---
const bot = new TelegramBot(settings.token, { polling: true });
startBot(bot);

console.log(chalk.green.bold("✅ Bot berhasil dijalankan tanpa batasan token/device."));

// Load external files
require("./start.js")(bot);
require("./menu/encrypt.js")(bot);
require("./menu/panel.js")(bot);
require("./menu/other.js")(bot);
require("./menu/private.js")(bot);
require("./menu/install.js")(bot);
require("./menu/cvps.js")(bot);
require("./menu/users.js")(bot);

const {
    ownerId,
    dev,
    qris,
    pp,
    ppVid,
    panel
} = settings;

const settingsPath = "./settings/config.js";

// file database
const PRIVATE_FILE = "./db/users/private/privateID.json";
const OWNER_FILE = './db/users/adminID.json';

// premium file
const PREMIUM_FILE = './db/users/premiumUsers.json';
const PREMV2_FILE = './db/users/version/premiumV2.json';
const PREMV3_FILE = './db/users/version/premiumV3.json';
const PREMV4_FILE = './db/users/version/premiumV4.json';
const PREMV5_FILE = './db/users/version/premiumV5.json';

// reseller file
const RESS_FILE = './db/users/resellerUsers.json';
const RESSV2_FILE = './db/users/version/resellerV2.json';
const RESSV3_FILE = './db/users/version/resellerV3.json';
const RESSV4_FILE = './db/users/version/resellerV4.json';
const RESSV5_FILE = './db/users/version/resellerV5.json';
const RESSSC_FILE = './db/users/resellerSc.json';

let knownCommands = [];
try {
  const data = fs.readFileSync('./db/commands.json', 'utf8');
  knownCommands = JSON.parse(data);
} catch (err) {
  console.error("Gagal memuat db/commands.json:", err);
}

// Info command
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || '';

  if (text.startsWith('/') && !knownCommands.some(cmd => text.startsWith(cmd))) {
    const name = msg.from.first_name || 'User';
    await bot.sendMessage(chatId, `Say what?`, {
      parse_mode: "Markdown",
      reply_to_message_id: msg.message_id
    }).catch(() => {});
  }
});

// log command
function notifyOwner(commandName, msg) {
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name;
    const chatId = msg.chat.id;
    const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

    const logMessage = `<blockquote>💬 Command: /${commandName}
User: @${username}
ID: ${userId}
Waktu: ${now}
</blockquote>
    `;
    bot.sendMessage(OWNER_ID, logMessage, { parse_mode: 'HTML' });
}

function addPremiumHandler(command, fileName, versi) {
    bot.onText(new RegExp(`^\\/${command}`), (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();

        const isCooldown = checkCooldown(msg);
        if (isCooldown) return bot.sendMessage(chatId, isCooldown);

        const owners = loadJsonData(OWNER_FILE);
        if (!owners.includes(userId)) {
            return bot.sendMessage(chatId, '❌ ᴋʜᴜsᴜs ᴏᴡɴᴇʀ');
        }

        const args = msg.text.trim().split(" ");
        if (args.length < 2) {
            return bot.sendMessage(chatId, `❌ Format salah!\nContoh: /${command} <id>`);
        }

        const targetUserId = args[1];
        if (!/^\d+$/.test(targetUserId)) {
            return bot.sendMessage(chatId, '❌ User ID harus berupa angka!');
        }

        const premUsers = loadJsonData(fileName);
        if (premUsers.includes(targetUserId)) {
            return bot.sendMessage(chatId, `⚠️ ᴜsᴇʀ ɪᴅ sᴜᴅᴀʜ ᴛᴇʀᴅᴀғᴛᴀʀ sᴇʙᴀɢᴀɪ ᴘʀᴇᴍɪᴜᴍ ${versi}!`);
        }

        premUsers.push(targetUserId);
        const success = saveJsonData(fileName, premUsers);

        if (success) {
            bot.sendMessage(chatId, `✅ ᴜꜱᴇʀ ɪᴅ ${targetUserId} ʙᴇʀʜᴀꜱɪʟ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ ꜱᴇʙᴀɢᴀɪ ᴘʀᴇᴍɪᴜᴍ ${versi}!`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
        } else {
            bot.sendMessage(chatId, `❌ Gagal menyimpan data Premium ${versi}!`);
        }
    });
}

// addprem
addPremiumHandler("addpremv2", PREMV2_FILE, "V2");
addPremiumHandler("addpremv3", PREMV3_FILE, "V3");
addPremiumHandler("addpremv4", PREMV4_FILE, "V4");
addPremiumHandler("addpremv5", PREMV5_FILE, "V5");

function delPremiumHandler(command, fileName, versi) {
    bot.onText(new RegExp(`^\\/${command}`), (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();

        const owners = loadJsonData(OWNER_FILE);
        if (!owners.includes(userId)) {
            return bot.sendMessage(chatId, '❌ ᴋʜᴜsᴜs ᴏᴡɴᴇʀ');
        }

        const args = msg.text.trim().split(" ");
        if (args.length < 2) {
            return bot.sendMessage(chatId, `❌ Format salah!\nContoh: /${command} <id>`);
        }

        const targetUserId = args[1];
        if (!/^\d+$/.test(targetUserId)) {
            return bot.sendMessage(chatId, '❌ User ID harus berupa angka!');
        }

        let premUsers = loadJsonData(fileName);
        if (!premUsers.includes(targetUserId)) {
            return bot.sendMessage(chatId, `⚠️ ᴜsᴇʀ ɪᴅ ${targetUserId} ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ ᴅɪ ᴘʀᴇᴍɪᴜᴍ ${versi}!`);
        }

        premUsers = premUsers.filter(id => id !== targetUserId);
        const success = saveJsonData(fileName, premUsers);

        if (success) {
            bot.sendMessage(chatId, `✅ ᴜꜱᴇʀ ɪᴅ ${targetUserId} ʙᴇʀʜᴀꜱɪʟ ᴅɪʜᴀᴘᴜꜱ ᴅᴀʀɪ ᴘʀᴇᴍɪᴜᴍ ${versi}!`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
        } else {
            bot.sendMessage(chatId, `❌ Gagal menyimpan perubahan Premium ${versi}!`);
        }
    });
}

// delprem
delPremiumHandler("delpremv2", PREMV2_FILE, "V2");
delPremiumHandler("delpremv3", PREMV3_FILE, "V3");
delPremiumHandler("delpremv4", PREMV4_FILE, "V4");
delResellerHandler("delpremv5", PREMV5_FILE, "V5");

function addResellerHandler(command, fileName, versi) {
    bot.onText(new RegExp(`^\\/${command}`), (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();

        const owners = loadJsonData(OWNER_FILE);
        if (!owners.includes(userId)) {
            return bot.sendMessage(chatId, '❌ ᴋʜᴜsᴜs ᴏᴡɴᴇʀ');
        }

        const args = msg.text.trim().split(" ");
        if (args.length < 2) {
            return bot.sendMessage(chatId, `⚠️ Format salah!\nGunakan: /${command} <user_id>`);
        }

        const targetUserId = args[1];
        if (!/^\d+$/.test(targetUserId)) {
            return bot.sendMessage(chatId, '❌ User ID harus berupa angka!');
        }

        const ressUsers = loadJsonData(fileName);
        if (ressUsers.includes(targetUserId)) {
            return bot.sendMessage(chatId, `⚠️ ᴜsᴇʀ ɪᴅ sᴜᴅᴀʜ ᴍᴇɴᴊᴀᴅɪ ʀᴇsᴇʟʟᴇʀ ${versi}!`);
        }

        ressUsers.push(targetUserId);
        const success = saveJsonData(fileName, ressUsers);

        if (success) {
            bot.sendMessage(chatId, `✅ ᴜꜱᴇʀ ɪᴅ ${targetUserId} ʙᴇʀʜᴀꜱɪʟ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ ꜱᴇʙᴀɢᴀɪ ʀᴇꜱᴇʟʟᴇʀ ${versi}!`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
        } else {
            bot.sendMessage(chatId, `❌ Gagal menyimpan data Reseller ${versi}!`);
        }
    });
}

// address
addResellerHandler("addressv2", RESSV2_FILE, "V2");
addResellerHandler("addressv3", RESSV3_FILE, "V3");
addResellerHandler("addressv4", RESSV4_FILE, "V4");
addResellerHandler("addressv5", RESSV5_FILE, "V5");

function delResellerHandler(command, fileName, versi) {
    bot.onText(new RegExp(`^\\/${command}`), (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();

        const owners = loadJsonData(OWNER_FILE);
        if (!owners.includes(userId)) {
            return bot.sendMessage(chatId, '❌ ᴋʜᴜsᴜs ᴏᴡɴᴇʀ');
        }

        // ambil argumen setelah command
        const args = msg.text.trim().split(" ");
        if (args.length < 2) {
            return bot.sendMessage(chatId, `⚠️ Format salah!\nGunakan: /${command} <id>`);
        }

        const targetUserId = args[1];
        if (!/^\d+$/.test(targetUserId)) {
            return bot.sendMessage(chatId, '❌ User ID harus berupa angka!');
        }

        let ressUsers = loadJsonData(fileName);
        if (!ressUsers.includes(targetUserId)) {
            return bot.sendMessage(chatId, `⚠️ ᴜsᴇʀ ɪᴅ ${targetUserId} ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ ᴅɪ ʀᴇsᴇʟʟᴇʀ ${versi}!`);
        }

        // hapus user dari array
        ressUsers = ressUsers.filter(id => id !== targetUserId);
        const success = saveJsonData(fileName, ressUsers);

        if (success) {
            bot.sendMessage(chatId, `✅ User ID ${targetUserId} berhasil dihapus dari Reseller ${versi}!`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
        } else {
            bot.sendMessage(chatId, `❌ Gagal menyimpan perubahan Reseller ${versi}!`);
        }
    });
}

// /delress
delResellerHandler("delressv2", RESSV2_FILE, "V2");
delResellerHandler("delressv3", RESSV3_FILE, "V3");
delResellerHandler("delressv4", RESSV4_FILE, "V4");
delResellerHandler("delressv5", RESSV5_FILE, "V5");

// create file premium
if (!fs.existsSync(PREMIUM_FILE)) {
    saveJsonData(PREMIUM_FILE, []);
}

if (!fs.existsSync(PREMV2_FILE)) {
    saveJsonData(PREMV2_FILE, []);
}

if (!fs.existsSync(PREMV3_FILE)) {
    saveJsonData(PREMV3_FILE, []);
}

if (!fs.existsSync(PREMV4_FILE)) {
    saveJsonData(PREMV4_FILE, []);
}

if (!fs.existsSync(PREMV5_FILE)) {
    saveJsonData(PREMV5_FILE, []);
}

// create file reseller
if (!fs.existsSync(RESS_FILE)) {
    saveJsonData(RESS_FILE, []);
}

if (!fs.existsSync(RESSV2_FILE)) {
    saveJsonData(RESSV2_FILE, []);
}

if (!fs.existsSync(RESSV3_FILE)) {
    saveJsonData(RESSV3_FILE, []);
}

if (!fs.existsSync(RESSV4_FILE)) {
    saveJsonData(RESSV4_FILE, []);
}

if (!fs.existsSync(RESSV5_FILE)) {
    saveJsonData(RESSV5_FILE, []);
}

if (!fs.existsSync(OWNER_FILE)) {
    saveJsonData(OWNER_FILE, []);
}
    
// command broadcast
bot.onText(/^\/broadcast$/, async (msg) => {
  const chatId = msg.chat.id;

  if (chatId !== OWNER_ID) {
    return bot.sendMessage(chatId, "❌ ᴋʜᴜsᴜs ᴏᴡɴᴇʀ");
  }

  if (!msg.reply_to_message) {
    return bot.sendMessage(chatId, "⚠️ ʀᴇᴘʟʏ ᴘᴇsᴀɴɴʏᴀ");
  }

  const usersFile = "./db/users/users.json";
  let users = [];
  if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile));
  }

  let sukses = 0, gagal = 0;
  for (let uid of users) {
    try {
      await bot.forwardMessage(uid, chatId, msg.reply_to_message.message_id);

      // Kirim button setelah forward
      await bot.sendMessage(uid, "💬", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Kirim Pesan", callback_data: `contact_owner` }]
          ]
        }
      });

      sukses++;
    } catch {
      gagal++;
    }
  }

  bot.sendMessage(chatId, `📢 *Broadcast Selesai:*\nSukses: ${sukses}\nGagal: ${gagal}`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
});

const notifOwner = settings.ownerId;
let waitingReply = {};

// handler tombol
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === "contact_owner") {
    waitingReply[chatId] = true;
    await bot.sendMessage(chatId, "Silahkan ketik pesannya :");
    await bot.answerCallbackQuery(query.id);
  }
});

// kirim & balas pesan user
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  // user kirim pesan ke owner
  if (waitingReply[chatId]) {
    const username = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;

    await bot.sendMessage(
      notifOwner,
      `📩 dari ${username}\n(ID: ${msg.from.id})\n\nMessage: ${msg.text}\n\n📨 balas pesan:\n\`/reply ${msg.from.id}\` pesan`, { parse_mode: "Markdown" });

    await bot.sendMessage(chatId, `✅ Sudah diteruskan ke Owner!`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });

    delete waitingReply[chatId];
    return;
  }

  // owner balas ke user
if (chatId === notifOwner && msg.text && msg.text.startsWith("/reply")) {
  const args = msg.text.split(" ");
  const targetId = args[1];
  const replyMsg = args.slice(2).join(" ");

  if (!targetId || !replyMsg) {
    return bot.sendMessage(chatId, `❌ Format salah!\nContoh:\n/reply <id_user> <pesan>`);
  }

  try {
    // Ambil data user buat dapetin username-nya
    const targetInfo = await bot.getChat(targetId);
    const targetName = targetInfo.username
      ? `@${targetInfo.username}`
      : targetInfo.first_name || "User";

    // Kirim balasan ke user
    await bot.sendMessage(targetId, `${replyMsg}`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "💬 Balas Pesan", callback_data: "contact_owner" }]
        ]
      }
    });

    // Konfirmasi ke owner
    await bot.sendMessage(chatId, `✅ Berhasil dikirim ke ${targetName}`);
  } catch (err) {
    await bot.sendMessage(chatId, `⚠️ Gagal mengirim pesan ke user ${targetId}`);
  }
}
});

const PANEL_URL = settings.domain; // Ganti
const API_KEY = settings.pltc; // Admin API key
const STORAGE_LIMIT = 70; // %
const RAM_LIMIT = 70; // %
const LOAD_LIMIT = 5.0; // rata-rata load CPU

// command id
bot.onText(/^\/id$/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, `This Group ID: \`${chatId}\``, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
});

// command pairing wa
bot.onText(/\/reqpair(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
    if (!text) {
        bot.sendMessage(chatId, '❌ Format salah!\nContoh: /reqpair 628123456789');
        return;
    }
    
  const botNumber = match[1].replace(/[^0-9]/g, "");

  try {
    await connectToWhatsApp(botNumber, chatId);
  } catch (error) {
    console.error("Error in addbot:", error);
    bot.sendMessage(
      chatId,
      "Terjadi kesalahan saat menghubungkan ke WhatsApp. Silakan coba lagi."
    );
  }
});

// command send message gb
bot.onText(/^\/sendmsg (.+)$/, async (msg, match) => {
  const chatId = msg.chat.id
  const replyTo = msg.reply_to_message
  const targetGroupId = match[1] // id group tujuan

  if (!replyTo) {
    return bot.sendMessage(chatId, "❌ Reply pesan yang diforward!")
  }

  try {
    await bot.forwardMessage(targetGroupId, chatId, replyTo.message_id)
    bot.sendMessage(chatId, `✅ Sukses diforward ke grup ${targetGroupId}`)
  } catch (err) {
    console.error(err)
    bot.sendMessage(chatId, "❌ Gagal forward pesan, cek lagi ID grupnya.")
  }
})

// command backup
let autoBackupInterval = null;

bot.onText(/\/backup/, (msg) => {
  const chatId = msg.chat.id;

  if (msg.from.id !== OWNER_ID) {
    return bot.sendMessage(
      chatId,
      `❌ Kamu bukan @${dev}!`,
      { parse_mode: "Markdown", reply_to_message_id: msg.message_id }
    );
  }

  const doBackup = () => {
    const backupFile = `KINZXX_BACKUP.zip`;
    const output = fs.createWriteStream(backupFile);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      bot.sendDocument(chatId, backupFile).then(() => {
        fs.unlinkSync(backupFile);
      });
    });

    archive.on("error", (err) => {
      console.error(err);
      bot.sendMessage(chatId, "❌ Gagal membuat backup!");
    });

    archive.pipe(output);

    ["index.js", "connect.js", "config.js", "start.js", "package.json"].forEach((file) => {
      if (fs.existsSync(file)) {
        archive.file(file, { name: path.basename(file) });
      }
    });

    ["menu", "lib", "db"].forEach((dir) => {
      if (fs.existsSync(dir)) {
        archive.directory(dir, dir);
      }
    });

    archive.finalize();
  };

  // langsung backup pertama kali
  doBackup();

  // clear interval lama kalau ada
  if (autoBackupInterval) clearInterval(autoBackupInterval);

  // auto backup tiap 30 menit
  autoBackupInterval = setInterval(doBackup, 30 * 60 * 1000);

  bot.sendMessage(chatId, "Auto-backup aktif setiap 30 menit.", { reply_to_message_id: msg.message_id });
});

// command setcd
bot.onText(/\/setcd (\d+[smh])/, (msg, match) => { 
    const chatId = msg.chat.id; 
    const response = setCooldown(match[1]);

    bot.sendMessage(chatId, response);
});

bot.onText(/^\/cekid$/, async (msg) => {
  notifyOwner('cekid', msg);
  const chatId = msg.chat.id;
  const user = msg.from;

  try {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    const username = user.username ? `@${user.username}` : '-';
    const userId = user.id.toString();
    const today = new Date().toISOString().split('T')[0];
    const dcId = (user.id >> 32) % 256;

    let photoUrl = null;
    try {
      const photos = await bot.getUserProfilePhotos(user.id, { limit: 1 });
      if (photos.total_count > 0) {
        const fileId = photos.photos[0][0].file_id;
        const file = await bot.getFile(fileId);
        photoUrl = `https://api.telegram.org/file/bot${settings.token}/${file.file_path}`;
      }
    } catch (e) {
      console.log('Gagal ambil foto profil:', e.message);
    }

    const canvas = createCanvas(800, 450);
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0a4f44');
    gradient.addColorStop(1, '#128C7E');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.roundRect(40, 40, canvas.width - 80, canvas.height - 80, 20);
    ctx.fill();

    ctx.fillStyle = '#0a4f44';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ID CARD TELEGRAM', canvas.width / 2, 80);

    ctx.strokeStyle = '#0a4f44';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 100);
    ctx.lineTo(canvas.width - 50, 100);
    ctx.stroke();

    if (photoUrl) {
      try {
        const response = await axios.get(photoUrl, { responseType: 'arraybuffer' });
        const avatar = await loadImage(response.data);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(150, 220, 70, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        
        ctx.drawImage(avatar, 80, 150, 140, 140);
        ctx.restore();
        
        ctx.strokeStyle = '#0a4f44';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(150, 220, 70, 0, Math.PI * 2, true);
        ctx.stroke();
      } catch (e) {
        console.log('Gagal memuat gambar:', e.message);
        ctx.fillStyle = '#ccc';
        ctx.beginPath();
        ctx.arc(150, 220, 70, 0, Math.PI * 2, true);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#ccc';
      ctx.beginPath();
      ctx.arc(150, 220, 70, 0, Math.PI * 2, true);
      ctx.fill();
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Informasi Pengguna:', 280, 150);
    
    ctx.font = '20px Arial';
    ctx.fillText(`Nama: ${fullName}`, 280, 190);
    ctx.fillText(`User ID: ${userId}`, 280, 220);
    ctx.fillText(`Username: ${username}`, 280, 250);
    ctx.fillText(`Tanggal: ${today}`, 280, 280);
    ctx.fillText(`DC ID: ${dcId}`, 280, 310);

    ctx.textAlign = 'center';
    ctx.font = 'italic 16px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText(`ID Card by Naeri Bot - @${dev}`, canvas.width / 2, canvas.height - 50);

    const buffer = canvas.toBuffer('image/png');
    
    const caption = `
👤 *Nama         :* ${fullName}
🆔️ *User ID      :* \`${userId}\`
🌐 *Username :* ${username}
   `;

    await bot.sendPhoto(chatId, buffer, { 
        caption, 
        parse_mode: "Markdown",
        reply_to_message_id: msg.message_id,
        reply_markup: {
            inline_keyboard: [
      [{ text: "ʙᴜʏ ꜱᴄʀɪᴘᴛ", url: `https://t.me/aboutnnaell/710` }]
    ]
  }
});

  } catch (err) {
    console.error('Gagal generate ID card:', err.message);
    bot.sendMessage(chatId, '❌ Gagal generate ID card. Silakan coba lagi.');
  }
});

// command /addowner bot
bot.onText(/^\/addowner(?:\s+(.+))?$/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    
    const owners = loadJsonData(OWNER_FILE);
    
    if (msg.from.id !== OWNER_ID && !owners.includes(userId)) {
        bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ʙᴏᴛ');
        return;
    }
    
    const targetUserId = match[1];
    if (!targetUserId) {
        bot.sendMessage(chatId, '❌ Format salah!\nContoh: /addowner 123456789');
        return;
    }
    
    if (!/^\d+$/.test(targetUserId)) {
        bot.sendMessage(chatId, '❌ User ID harus berupa angka!');
        return;
    }
    
    if (owners.includes(targetUserId)) {
        bot.sendMessage(chatId, '⚠️ ᴜꜱᴇʀ ɪᴅ ꜱᴜᴅᴀʜ ᴍᴇɴᴊᴀᴅɪ ᴏᴡɴᴇʀ!');
        return;
    }
    
    owners.push(targetUserId);
    const success = saveJsonData(OWNER_FILE, owners);
    
    if (success) {
        bot.sendMessage(chatId, `✅ User ID ${targetUserId} berhasil ditambahkan sebagai Owner Bot!`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
    } else {
        bot.sendMessage(chatId, '❌ Gagal menyimpan data owner!');
    }
});

// command /delowner bot
bot.onText(/^\/delowner(?:\s+(.+))?$/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    let owners = loadJsonData(OWNER_FILE);

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

    if (!owners.includes(targetUserId)) {
        return bot.sendMessage(chatId, '⚠️ ᴜsᴇʀ ɪᴅ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ ᴅɪ ᴅᴀғᴛᴀʀ ᴏᴡɴᴇʀ');
    }

    if (targetUserId === userId) {
        return bot.sendMessage(chatId, '❌ Gagal menghapus diri sendiri sebagai Owner!');
    }

    owners = owners.filter(id => id !== targetUserId);
    const success = saveJsonData(OWNER_FILE, owners);

    if (success) {
        bot.sendMessage(chatId, `✅ User ID ${targetUserId} berhasil dihapus dari Owner Bot!`);
    } else {
        bot.sendMessage(chatId, '❌ Gagal menyimpan perubahan data Owner!');
    }
});

// command payment
bot.onText(/^\/pay/, async (msg) => {
  const chatId = msg.chat.id;

  await bot.sendPhoto(chatId, qris, {
  caption: `<blockquote>💳 <b>Metode Pembayaran Qris</b>

Silahkan scan QRIS di atas untuk melakukan pembayaran.

<b>💰 DANA Payment</b>
Nomor: <code>${settings.noDana}</code> (salin)
a/n ${settings.namaDana}

Kirim bukti transfer dan hubungi owner atau pilih metode pembayaran Dana!
</blockquote>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "💬 ᴄʜᴀᴛ ᴏᴡɴᴇʀ", url: `https://t.me/${dev}` }]
      ]
    }
  });
});

// command /restart
bot.onText(/^\/restart$/, async (msg) => {
  const chatId = msg.chat.id;

    if (msg.from.id !== OWNER_ID) {
        bot.sendMessage(chatId, `❌ Kamu bukan ${settings.dev}`);
        return;
    }

  const bars = [
    "⏳ ᴘʀᴏᴄᴇꜱꜱ [░░░░░░░░░░] 0%",
    "⏳ ᴘʀᴏᴄᴇꜱꜱ [█░░░░░░░░░] 10%",
    "⏳ ᴘʀᴏᴄᴇꜱꜱ [██░░░░░░░░] 20%",
    "⏳ ᴘʀᴏᴄᴇꜱꜱ [███░░░░░░░] 30%",
    "⏳ ᴘʀᴏᴄᴇꜱꜱ [████░░░░░░] 40%",
    "⏳ ᴘʀᴏᴄᴇꜱꜱ [█████░░░░░] 50%",
    "⏳ ᴘʀᴏᴄᴇꜱꜱ [██████░░░░] 60%",
    "⏳ ᴘʀᴏᴄᴇꜱꜱ [███████░░░] 70%",
    "⏳ ᴘʀᴏᴄᴇꜱꜱ [████████░░] 80%",
    "⏳  [█████████░] 90%",
    "✅ ʀᴇꜱᴛᴀʀᴛ ᴄᴏᴍᴘʟᴇᴛᴇ\n[██████████] 100%",
    "👋 ɢᴏᴏᴅ ʙʏᴇ..."
  ];

  try {
    let sent = await bot.sendMessage(chatId, bars[0]);

    for (let i = 1; i < bars.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await bot.editMessageText(bars[i], {
        chat_id: chatId,
        message_id: sent.message_id
      });
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
    process.exit(0);
  } catch (e) {
    console.error(e);
    bot.sendMessage(chatId, "❌ Gagal restart bot.");
  }
});

// command /ping
bot.onText(/\/ping/, async (msg) => {
  const chatId = msg.chat.id;
    
  const waktu = checkCooldown(msg.from.id);
    if (waktu > 0) return bot.sendMessage(chatId, `⏳ Tunggu ${waktu} detik sebelum bisa pakai command /ping lagi!`, { reply_to_message_id: msg.message_id });

  const sentMsg = await bot.sendMessage(chatId, "⏳ ꜱᴛᴀᴛᴜꜱ ʙᴏᴛ...", { parse_mode: "Markdown", reply_to_message_id: msg.message_id });

  // Runtime bot
  const botUptime = process.uptime();
  const botUptimeStr = `${Math.floor(botUptime / 3600)}h ${Math.floor((botUptime % 3600) / 60)}m ${Math.floor(botUptime % 60)}s`;

  // Runtime VPS (pakai os.uptime)
  const vpsUptime = os.uptime();
  const vpsUptimeStr = `${Math.floor(vpsUptime / 86400)}d ${Math.floor((vpsUptime % 86400) / 3600)}h ${Math.floor((vpsUptime % 3600) / 60)}m`;

  const cpuModel = os.cpus()[0].model;
  const cpuCores = os.cpus().length;
  const totalMem = (os.totalmem() / (1024 ** 3)).toFixed(2) + " GB";
  const freeMem = (os.freemem() / (1024 ** 3)).toFixed(2) + " GB";

  const msgText = `🏓 𝖯𝗈𝗇𝗀 : ${botUptimeStr}
<blockquote expandable>↬ 𝖴𝗉𝖳𝗂𝗆𝖾 : ${vpsUptimeStr}
↬ 𝖢𝖯𝖴 : ${cpuModel} (${cpuCores} cores)
↬ 𝖣𝗂𝗌𝗄 : ${freeMem} / ${totalMem} GB
</blockquote>`;

  bot.editMessageText(msgText, { chat_id: chatId, parse_mode: "HTML", message_id: sentMsg.message_id });
});

// command setting otomatis
const allowedKeys = [
  "ownerId","groupId","exGroupId","exPGroupId","chUsn","domainPriv","pltaPriv","pltcPriv",
  "domain","plta","pltc","domainV2","pltaV2","pltcV2","domainV3","pltaV3","pltcV3",
  "domainV4","pltaV4","pltcV4","domainV5","pltaV5","pltcV5",
  "eggs","loc","dev","noDana","namaDana","pp","ppVid","panel","qris","hostname",
  "apiDigitalOcean","apiDigitalOcean2","apiDigitalOcean3","cfApiToken","cfZoneId"
];

bot.onText(/^\/setting(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const input = match[1] ? match[1].trim() : "";

  if (senderId !== OWNER_ID) {
    return bot.sendMessage(chatId, `❌ Kamu bukan @${dev}!`);
  }

  // kalau gak ada input → tampilkan menu tombol
  if (!input) {
    const keyboard = [];
    for (let i = 0; i < allowedKeys.length; i += 3) {
      keyboard.push(
        allowedKeys.slice(i, i + 3).map(k => ({
          text: k,
          callback_data: `set_${k}`
        }))
      );
    }

    return bot.sendMessage(chatId, "🔧 Setting yang ingin diubah:", {
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  // kalau ada input → multi setting
  if (!fs.existsSync(settingsPath)) {
    return bot.sendMessage(chatId, "❌ settings.js tidak ditemukan");
  }

  let fileContent = fs.readFileSync(settingsPath, "utf8");
  const updates = input.split(",").map(s => s.trim());
  let updatedKeys = [];

  updates.forEach(pair => {
    const [key, ...valParts] = pair.split(" ");
    const value = valParts.join(" ").trim();
    if (!allowedKeys.includes(key)) return;
    const regex = new RegExp(`(${key}\\s*:\\s*['"\`]).*?(['"\`])`, "g");
    fileContent = fileContent.replace(regex, `$1${value}$2`);
    updatedKeys.push(`${key} → ${value}`);
  });

  fs.writeFileSync(settingsPath, fileContent, "utf8");

  const sentMsg = await bot.sendMessage(
    chatId,
    `✅ ./config.js updated:\n<pre>${updatedKeys.join("\n")}</pre>`,
    { parse_mode: "HTML" }
  );

  // restart otomatis
  setTimeout(async () => {
    await bot.editMessageText("♻️ Restarting bot...", {
      chat_id: chatId,
      message_id: sentMsg.message_id
    });
    process.exit(0);
  }, 7000);
});

// handle tombol pilihan
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const senderId = query.from.id;
  const data = query.data;

  if (!data.startsWith("set_")) return;
  if (senderId !== OWNER_ID) return bot.answerCallbackQuery(query.id, { text: "❌ Khusus owner!" });

  const key = data.replace("set_", "");
  await bot.sendMessage(chatId, `Masukkan teks baru untuk \`${key}\``, { parse_mode: "Markdown" });

  bot.once("message", async (msg2) => {
    if (msg2.from.id !== OWNER_ID) return;
    const value = msg2.text.trim();

    if (!fs.existsSync(settingsPath)) {
      return bot.sendMessage(chatId, "❌ settings.js tidak ditemukan");
    }

    let fileContent = fs.readFileSync(settingsPath, "utf8");
    const regex = new RegExp(`(${key}\\s*:\\s*['"\`]).*?(['"\`])`, "g");
    fileContent = fileContent.replace(regex, `$1${value}$2`);
    fs.writeFileSync(settingsPath, fileContent, "utf8");

    const sentMsg = await bot.sendMessage(
      chatId,
      `✅ \`${key}\` diupdate menjadi:\n\`${value}\``,
      { parse_mode: "Markdown" }
    );

    setTimeout(async () => {
      await bot.editMessageText("♻️ Restarting bot...", {
        chat_id: chatId,
        message_id: sentMsg.message_id
      });
      process.exit(0);
    }, 7000);
  });
});

const foldersToDelete = ['.cache', '.npm', 'sampah'];

function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.rmSync(folderPath, { recursive: true, force: true });
    console.log(`🧹 "${folderPath}" berhasil dihapus`);
  }
}

foldersToDelete.forEach(folder => {
  const folderPath = path.join(process.cwd(), folder);
  deleteFolderRecursive(folderPath);
});

async function autoBackup() {
  const backupDir = path.join(process.cwd(), 'backup');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `NAERI_BACKUP.zip`;
  const backupPath = path.join(backupDir, backupName);

  const output = fs.createWriteStream(backupPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(output);

  const items = fs.readdirSync(process.cwd());
  for (const item of items) {
    if (['node_modules', 'backup'].includes(item)) continue;
    const fullPath = path.join(process.cwd(), item);
    if (fs.lstatSync(fullPath).isDirectory()) {
      archive.directory(fullPath, item);
    } else {
      archive.file(fullPath, { name: item });
    }
  }

  await archive.finalize();

  return new Promise((resolve, reject) => {
    output.on('close', () => resolve(backupPath));
    archive.on('error', err => reject(err));
  });
}

async function sendBackupToOwner() {
  const bot = new TelegramBot(settings.token);
  const backupPath = await autoBackup();

  await bot.sendDocument(OWNER_ID, backupPath);
}

sendBackupToOwner().catch(console.error);

async function sendStartMessage(msg) {
  const waktu = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  
  const pesan = `<b>✅ Sukses dijalankan!</b>
Waktu: ${waktu}
Olaaa, Developerku 👋🏻
<blockquote>Ketik /start untuk Lanjut!</blockquote>`;

 try {
    await bot.sendMessage(OWNER_ID, pesan, { parse_mode: 'HTML' });
  } catch (err) {
    console.error('❌ Gagal kirim pesan ke owner:', err.message);
  }
}
        
sendStartMessage();

// Error Handling
process.on("unhandledRejection", (reason, promise) => {
  console.log("⚠ Unhandled Rejection:", String(reason));
});

process.on("uncaughtException", (err) => {
  console.log("⚠ Uncaught Exception:", String(err));
});