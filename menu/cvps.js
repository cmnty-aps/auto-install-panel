const fetch = require("node-fetch");

const settings = require("../settings/config.js");
const {
    loadJsonData,
    saveJsonData,
    addVPS,
    getVPS
} = require("../lib/function");

const RESSVPS_FILE = './db/users/resellerVps.json';
const OWNER_ID = settings.ownerId;

const userStates = {};
const vpsSpecs = {
  r1c1:  { size: "s-1vcpu-1gb",        name: "Ram 1GB Core 1",  icon: "📦" },
  r2c2:  { size: "s-2vcpu-2gb",        name: "Ram 2GB Core 2",  icon: "💽" },
  r4c2:  { size: "s-2vcpu-4gb",        name: "Ram 4GB Core 2",  icon: "🖥️" },
  r8c4:  { size: "s-4vcpu-8gb",        name: "Ram 8GB Core 4",  icon: "⚙️" },
  r16c4: { size: "s-4vcpu-16gb-amd",   name: "Ram 16GB Core 4", icon: "🛠️" },
  r16c8: { size: "s-8vcpu-16gb-amd",   name: "Ram 16GB Core 8", icon: "🚀" },
  r32c8: { size: "s-8vcpu-32gb-amd",   name: "Ram 32GB Core 8", icon: "🏆" }
};

const vpsImages = {
  ubuntu20: { image: "ubuntu-20-04-x64", name: "Ubuntu 20.04 LTS", icon: "🟠" },
  ubuntu22: { image: "ubuntu-22-04-x64", name: "Ubuntu 22.04 LTS", icon: "🔵" },
  ubuntu24: { image: "ubuntu-24-04-x64", name: "Ubuntu 24.04 LTS", icon: "🟣" },
  debian11: { image: "debian-11-x64",   name: "Debian 11", icon: "🔴" },
  debian12: { image: "debian-12-x64",   name: "Debian 12", icon: "⚪" },
  centos9: { image: "centos-stream-9-x64", name: "CentOS Stream 9", icon: "🟢" }
};

const vpsRegions = {
  sgp1: { name: "Singapore", flag: "🇸🇬", latency: "Tercepat untuk Asia" },
  nyc1: { name: "New York", flag: "🇺🇸", latency: "USA Pantai Timur" },
  sfo3: { name: "San Francisco", flag: "🇺🇸", latency: "USA Pantai Barat" },
  lon1: { name: "London", flag: "🇬🇧", latency: "Eropa Barat" },
  fra1: { name: "Frankfurt", flag: "🇩🇪", latency: "Eropa Tengah" },
  ams3: { name: "Amsterdam", flag: "🇳🇱", latency: "Eropa Barat" },
  tor1: { name: "Toronto", flag: "🇨🇦", latency: "Amerika Utara" },
  blr1: { name: "Bangalore", flag: "🇮🇳", latency: "Asia Selatan" }
};

module.exports = (bot) => {
async function createVPSDroplet(apiKey, hostname, spec, os, region, password) {
  const dropletData = {
    name: hostname.toLowerCase().trim(),
    region,
    size: vpsSpecs[spec].size,
    image: vpsImages[os].image,
    ssh_keys: null,
    backups: false,
    ipv6: true,
    user_data: `#cloud-config\npassword: ${password}\nchpasswd: { expire: False }\nssh_pwauth: True`,
    private_networking: null,
    volumes: null,
    tags: ["AnggaDev-VPS", "pay-tama.vercel.app", new Date().toISOString().split("T")[0]]
  };

  const response = await fetch("https://api.digitalocean.com/v2/droplets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(dropletData)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to create VPS");
  return data.droplet.id;
}

async function getDropletIP(apiKey, dropletId) {
  const response = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch droplet info");
  return data.droplet.networks.v4.find(net => net.type === "public").ip_address;
}

async function getDropletInfo(apiKey, dropletId) {
  const response = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Gagal ambil info VPS (HTTP ${response.status})`);
  }

  return data.droplet;
}
    
async function getDropletInfo(apiKey, dropletId) {
  const response = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Gagal ambil info VPS (HTTP ${response.status})`);
  }

  return data.droplet;
}

async function deleteVPS(apiKey, dropletId) {
  const response = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Gagal delete VPS (HTTP ${response.status})`);
  }

  return true;
}

async function getAllVPS(apiKey) {
  const response = await fetch("https://api.digitalocean.com/v2/droplets", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    }
  });
  const data = await response.json();
  return data.droplets || [];
}

async function getListVps(apiKey) {
  const response = await fetch("https://api.digitalocean.com/v2/droplets", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`Gagal ambil daftar VPS: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.droplets || [];
}

async function getVpsDetail(apiKey, dropletId) {
  const response = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`Gagal ambil detail VPS: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.droplet;
}

function formatVPSStatus(status) {
  if (status === "active") return "🟢 Active"
  if (status === "off") return "🔴 Off"
  return "⚪ " + status
}

function formatUptime(createdAt) {
  const created = new Date(createdAt)
  const now = new Date()
  const diffMs = now - created
  const diffHrs = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffHrs / 24)
  return diffDays > 0 ? `${diffDays}d ${diffHrs % 24}h` : `${diffHrs}h`
}
    
    // status d.o
bot.onText(/^\/statusdo$/, async (msg) => {
  const chatId = msg.chat.id
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🌐 1", callback_data: "infodo_1" },
        { text: "🌐 2", callback_data: "infodo_2" },
        { text: "🌐 3", callback_data: "infodo_3" }],
        [{ text: "🌐 4", callback_data: "infodo_4" },
        { text: "🌐 5", callback_data: "infodo_5" },
        { text: "🌐 6", callback_data: "infodo_6" }],
        [{ text: "🌐 7", callback_data: "infodo_7" },
        { text: "🌐 8", callback_data: "infodo_8" },
        { text: "🌐 9", callback_data: "infodo_9" }],
        [{ text: "🌐 Digital Ocean 10", callback_data: "infodo_10" }]
      ]
    }
  }
  bot.sendMessage(chatId, `📂 Menu Status D.O
ᴛʜᴀɴᴋꜱ ꜰʀᴏᴍ @${settings.dev}

Digital Ocean Account:`, { reply_to_message_id: msg.message_id, ...opts })
})

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id
  const data = query.data

  if (data.startsWith("infodo_")) {
    let apiKey
    switch (data) {
      case "infodo_1": apiKey = settings.apiDigitalOcean; break
      case "infodo_2": apiKey = settings.apiDigitalOcean2; break
      case "infodo_3": apiKey = settings.apiDigitalOcean3; break
      case "infodo_4": apiKey = settings.apiDigitalOcean4; break
      case "infodo_5": apiKey = settings.apiDigitalOcean5; break
      case "infodo_6": apiKey = settings.apiDigitalOcean6; break
      case "infodo_7": apiKey = settings.apiDigitalOcean7; break
      case "infodo_8": apiKey = settings.apiDigitalOcean8; break
      case "infodo_9": apiKey = settings.apiDigitalOcean9; break
      case "infodo_10": apiKey = settings.apiDigitalOcean10; break
    }

    if (!apiKey) return bot.answerCallbackQuery(query.id, { text: "API Key belum diatur!" })

    try {
      const accountRes = await fetch("https://api.digitalocean.com/v2/account", {
        headers: { Authorization: `Bearer ${apiKey}` }
      })
      const account = await accountRes.json()

      const dropletRes = await fetch("https://api.digitalocean.com/v2/droplets", {
        headers: { Authorization: `Bearer ${apiKey}` }
      })
      const droplets = await dropletRes.json()

      const billingRes = await fetch("https://api.digitalocean.com/v2/billing/payment_methods", {
        headers: { Authorization: `Bearer ${apiKey}` }
      })
      const billing = await billingRes.json()

      const balanceRes = await fetch("https://api.digitalocean.com/v2/customers/my/balance", {
        headers: { Authorization: `Bearer ${apiKey}` }
      })
      const balance = await balanceRes.json()

      if (account.account && account.account.email) {
        let paymentMethod = "Tidak diketahui"
        if (billing.payment_methods && billing.payment_methods.length > 0) {
          paymentMethod = billing.payment_methods[0].type === "credit_card" ? "VCC / Credit Card" : 
                          billing.payment_methods[0].type === "paypal" ? "PayPal" : billing.payment_methods[0].type
        }

        let msgText = `📊 Status Akun: ${account.account.status}\n`
        msgText += `Total Droplet: ${account.account.droplet_limit}\n`
        msgText += `VPS Aktif: ${droplets.droplets.length}\n`
        msgText += `💰 Sisa Droplet: ${account.account.droplet_limit - droplets.droplets.length}\n`

        bot.editMessageText(msgText, {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: "Markdown"
        })
      } else {
        bot.editMessageText("❌ API Key tidak valid atau akun tidak aktif", {
          chat_id: chatId,
          message_id: query.message.message_id
        })
      }
    } catch (e) {
      bot.editMessageText("⚠️ Gagal mengambil data dari DigitalOcean", {
        chat_id: chatId,
        message_id: query.message.message_id
      })
    }
  }
})
    
    // khusus reseller
bot.onText(/^\/createvps$/, async msg => {
    const ressVps = loadJsonData(RESSVPS_FILE);
    if (msg.from.id !== OWNER_ID && !ressVps.includes(msg.from.id)) {
        return bot.sendMessage(msg.chat.id, '❌ ᴋʜᴜꜱᴜꜱ ʀᴇꜱᴇʟʟᴇʀ ᴠᴘꜱ');
    }

  const keyboard = [
    [{ text: "🌐 Digital Ocean 1", callback_data: "createvps_1" }],
    [{ text: "🌐 Digital Ocean 2", callback_data: "createvps_2" }],
    [{ text: "🌐 Digital Ocean 3", callback_data: "createvps_3" }]
  ];

  bot.sendMessage(msg.chat.id, `📡 *Menu Create VPS*
ᴛʜᴀɴᴋꜱ ꜰʀᴏᴍ @${settings.dev}

Digital Ocean Account:`, {
    parse_mode: "Markdown",
    reply_to_message_id: msg.message_id,
    reply_markup: { inline_keyboard: keyboard }
  });
});

bot.on("callback_query", async cb => {
  const chatId = cb.message.chat.id;
  const data = cb.data;

  if (data.startsWith("createvps_") && data.split("_").length === 2) {
    const accId = data.split("_")[1];

    const keyboard = Object.entries(vpsSpecs).map(([id, spec]) => ([{
      text: `${spec.icon} ${spec.name}`,
      callback_data: `spec_${accId}_${id}`
    }]));

    bot.editMessageText(
      `📡 *Menu Create VPS*\n\nᴅɪɢɪᴛᴀʟ ᴏᴄᴇᴀɴ: 🌐 *${accId}*\nSekarang pilih spesifikasi:`,
      {
        chat_id: chatId,
        message_id: cb.message.message_id,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: keyboard }
      }
    );
  }

  if (data.startsWith("spec_")) {
    const [_, accId, specId] = data.split("_");
    const spec = vpsSpecs[specId];

    const keyboard = Object.entries(vpsImages).map(([id, img]) => ([{
      text: `${img.icon} ${img.name}`,
      callback_data: `image_${accId}_${specId}_${id}`
    }]));

    bot.editMessageText(
      `📦 Spesifikasi VPS\n*${spec.name}*\n\nSekarang pilih OS image:`,
      {
        chat_id: chatId,
        message_id: cb.message.message_id,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: keyboard }
      }
    );
  }

  if (data.startsWith("image_")) {
    const [_, accId, specId, imageId] = data.split("_");
    const spec = vpsSpecs[specId];
    const img = vpsImages[imageId];

    const keyboard = Object.entries(vpsRegions).map(([id, reg]) => ([{
      text: `${reg.flag} ${reg.name}`,
      callback_data: `region_${accId}_${specId}_${imageId}_${id}`
    }]));

    bot.editMessageText(
      `📦 Spesifikasi VPS\n*${spec.name}*\n💿 Image: *${img.name}*\n\nSekarang pilih region:`,
      {
        chat_id: chatId,
        message_id: cb.message.message_id,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: keyboard }
      }
    );
  }

  if (data.startsWith("region_")) {
  const [_, accId, specId, imageId, regionId] = data.split("_");
  const spec = vpsSpecs[specId];
  const img = vpsImages[imageId];
  const reg = vpsRegions[regionId];

  let apiKey;
  if (accId === "1") apiKey = settings.apiDigitalOcean;
  if (accId === "2") apiKey = settings.apiDigitalOcean2;
  if (accId === "3") apiKey = settings.apiDigitalOcean3;

  bot.editMessageText(
    `📡 Memulai create VPS...\n\n📦 *${spec.name}*\n💿 *${img.name}*\n🌍 ${reg.flag} *${reg.name}*\n\n⏳ Sedang proses...`,
    {
      chat_id: chatId,
      message_id: cb.message.message_id,
      reply_to_message_id: cb.message_id,
      parse_mode: "Markdown"
    }
  );

  try {
    const hostname = `${settings.hostname}`;
    const password = Math.random().toString(36).slice(-10);

    const dropletId = await createVPSDroplet(apiKey, hostname, specId, imageId, regionId, password);

    // Tunggu sampai IP keluar
    const getIpAddress = async () => {
      const droplet = await getDropletInfo(apiKey, dropletId);
      return droplet?.networks?.v4?.find(n => n.type === "public")?.ip_address || null;
    };

    let ipAddress = null;
    while (!ipAddress) {
      await new Promise(res => setTimeout(res, 5000));
      ipAddress = await getIpAddress();
    }

    addVPS(dropletId, {
      hostname,
      dropletId,
      ip: ipAddress,
      spec: spec.name,
      os: img.name,
      region: `${reg.flag} ${reg.name}`,
      password,
      owner: chatId
    });

    bot.sendMessage(chatId,
      `✅ <b>Sukses create VPS!</b>
<blockquote expandable>🌐 IP VPS: <code>${ipAddress}</code>
🔐 Password: <code>${password}</code>
🖥️ Hostname: <code>${hostname}</code>
🆔 Droplet: <code>${dropletId}</code>

📦 Spec: ${spec.name}
💿 OS: ${img.name}
🌍 Region: ${reg.flag} ${reg.name}</blockquote>

📡 ᴅᴇᴛᴀɪʟ ʟᴏɢɪɴ ᴠᴘꜱ:
<code>root@${ipAddress}:22</code>

<blockquote expandable>⚠️ T.O.S VPS:
• Tidak boleh untuk hacking, mining, torrent, atau DDoS  
• Dilarang overload (CPU 100%)  
• Jangan gunakan untuk aktivitas ilegal  

🏪 T.O.S TOKO:
• Web toko down karena DDoS tapi VPS aktif → Garansi tetap  
• VPS down karena DDoS → Garansi hangus  
• VPS aktif tapi CPU 100% → Garansi hangus  
• Simpan data VPS, kehilangan data = garansi hangus  

📛 RULES DIGITALOCEAN:
• Akun DO suspend → Garansi hangus  

📝 CLAIM GARANSI:
1. Bukti transfer  
2. Screenshot chat pembelian  
3. Tanggal pembelian  
4. Data VPS (IP/User/dll)
</blockquote>
`,
      { parse_mode: "HTML", reply_to_message_id: cb.message_id });

  bot.answerCallbackQuery(cb.id);
  } catch (err) {
    bot.sendMessage(chatId, `❌ Gagal membuat VPS\n\nError: ${err.message}`);
  }
}
});

bot.onText(/^\/cekdata (\d+)$/, (msg, match) => {
  const chatId = msg.chat.id;
  const dropletId = match[1];
    
  const ressVps = loadJsonData(RESSVPS_FILE);
  if (msg.from.id !== OWNER_ID && !ressVps.includes(msg.from.id)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ʀᴇꜱᴇʟʟᴇʀ ᴠᴘꜱ');
  }

  const vps = getVPS(dropletId);
  if (!vps) return bot.sendMessage(chatId, `❌ Data VPS dengan Droplet ID ${dropletId} tidak ditemukan!`);

  bot.sendMessage(chatId,
    `📄 Menampilkan Data VPS:

🖥️ Hostname: \`${vps.hostname}\`
🔐 Password: \`${vps.password}\`
🆔 Droplet ID: \`${vps.dropletId}\`

📦 Spec: ${vps.spec}
💿 OS: ${vps.os}
🌍 Region: ${vps.region}
👤 Owner ID: \`${vps.owner}\``,
    { parse_mode: "Markdown", reply_to_message_id: msg.message_id }
  );
});
    
    // khusus reseller
bot.onText(/^\/listvps$/, async msg => {
  const chatId = msg.chat.id;

  const ressVps = loadJsonData(RESSVPS_FILE);
  if (msg.from.id !== OWNER_ID && !ressVps.includes(msg.from.id)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ʀᴇꜱᴇʟʟᴇʀ ᴠᴘꜱ');
  }

  const keyboard = [
    [{ text: "🌐 Digital Ocean 1", callback_data: "listdo_1" }],
    [{ text: "🌐 Digital Ocean 2", callback_data: "listdo_2" }],
    [{ text: "🌐 Digital Ocean 3", callback_data: "listdo_3" }]
  ];

  await bot.sendMessage(chatId, `*📋 Menu List VPS*
ᴛʜᴀɴᴋꜱ ꜰʀᴏᴍ @${settings.dev}

Digital Ocean Account:`, {
    parse_mode: "Markdown",
    reply_to_message_id: msg.message_id,
    reply_markup: { inline_keyboard: keyboard }
  });
});

bot.on("callback_query", async query => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data.startsWith("listdo_")) {
    const accId = data.split("_")[1];
    let apiKey;
    if (accId === "1") apiKey = settings.apiDigitalOcean;
    if (accId === "2") apiKey = settings.apiDigitalOcean2;
    if (accId === "3") apiKey = settings.apiDigitalOcean3;

    try {
      await bot.editMessageText("🔍 Mengambil daftar VPS...", {
        chat_id: chatId,
        message_id: query.message.message_id
      });

      const droplets = await getListVps(apiKey);

      if (droplets.length === 0) {
        return bot.editMessageText("📭 Tidak ada VPS yang ditemukan.", {
          chat_id: chatId,
          message_id: query.message.message_id
        });
      }

      const keyboard = droplets.map(vps => {
        const ip = vps.networks?.v4?.find(net => net.type === "public")?.ip_address || "No IP";
        const region = vpsRegions[vps.region.slug] || { flag: "🏳️", name: "Unknown" };
        const status = formatVPSStatus(vps.status);
        const uptime = formatUptime(vps.created_at);

        return [{
          text: `🖥️ ${vps.name} | ${status} | ${region.flag} ${region.name} | ${ip} | ${uptime}`,
          callback_data: `vpsinfo_${accId}_${vps.id}`
        }];
      });

      await bot.editMessageText(
        `🛰️ *Monitoring Vps*\n\n📊 Total VPS: *${droplets.length}*\nSilahkan klik untuk detail:`,
        {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: keyboard }
        }
      );
    } catch (err) {
      console.error("[LIST VPS ERROR]", err);
      bot.sendMessage(chatId, `❌ Gagal ambil daftar VPS\n\n🧾 Error: ${err.message}`);
    }
  }

  if (data.startsWith("vpsinfo_")) {
    const [_, accId, dropletId] = data.split("_");
    let apiKey;
    if (accId === "1") apiKey = settings.apiDigitalOcean;
    if (accId === "2") apiKey = settings.apiDigitalOcean2;
    if (accId === "3") apiKey = settings.apiDigitalOcean3;

    try {
      const droplet = await getVpsDetail(apiKey, dropletId);

      const ip = droplet?.networks?.v4?.find(net => net.type === "public")?.ip_address || "Belum tersedia";
      const region = vpsRegions[droplet?.region?.slug] || { flag: "🏳️", name: "Unknown" };
      const status = formatVPSStatus(droplet?.status);
      const uptime = droplet?.created_at ? formatUptime(droplet.created_at) : "Belum tersedia";

      const info = [
        `🖥️ *${droplet?.name || "Unknown"}*`,
        ``,
        `🆔 ID: \`${droplet?.id || "???"}\``,
        `🌐 IP: \`${ip}\``,
        `📦 Spec: ${droplet?.size_slug || "???"}`,
        `🖥️ OS: ${droplet?.image?.distribution || "???"} ${droplet?.image?.name || ""}`,
        `🌍 Region: ${region.flag} ${region.name}`,
        `📡 Status: ${status}`,
        `⏱️ Uptime: ${uptime}`
      ].join("\n");

      await bot.sendMessage(chatId, info, { parse_mode: "Markdown" });
    } catch (err) {
      console.error("[VPS DETAIL ERROR]", err);
      bot.sendMessage(chatId, `❌ Gagal ambil detail VPS\n\n🧾 Error: ${err.message}`);
    }
  }

  bot.answerCallbackQuery(query.id);
});

bot.onText(/^\/delvps (.+)$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const dropletId = match[1].trim();
    
    const ressVps = loadJsonData(RESSVPS_FILE);
    if (msg.from.id !== OWNER_ID && !ressVps.includes(msg.from.id)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ʀᴇꜱᴇʟʟᴇʀ ᴠᴘꜱ');
    }

  if (!dropletId) {
    return bot.sendMessage(chatId, "❌ ID VPS tidak valid");
  }

  bot.sendMessage(chatId, `*♻️ Menu Delete VPS*
ᴛʜᴀɴᴋꜱ ꜰʀᴏᴍ @${settings.dev}

Digital Ocean Account:`, {
    parse_mode: "Markdown",
    reply_to_message_id: msg.message_id,
    reply_markup: {
      inline_keyboard: [
          [{ text: "🌐 Digital Ocean 1", callback_data: `delvpsacc_1_${dropletId}` }],
          [{ text: "🌐 Digital Ocean 2", callback_data: `delvpsacc_2_${dropletId}` }],
          [{ text: "🌐 Digital Ocean 3", callback_data: `delvpsacc_3_${dropletId}` }]
      ]
    }
  });
});

bot.on("callback_query", async (cbq) => {
  const chatId = cbq.message.chat.id;
  const data = cbq.data;

  if (data.startsWith("delvpsacc_")) {
    const parts = data.split("_");
    const accIndex = parts[1];
    const dropletId = parts[2];

    let apiKey;
    if (accIndex === "1") apiKey = settings.apiDigitalOcean;
    if (accIndex === "2") apiKey = settings.apiDigitalOcean2;
    if (accIndex === "3") apiKey = settings.apiDigitalOcean3;

    try {
      const vps = await getDropletInfo(apiKey, dropletId);

      const confirmMsg = [
        `⚠️ *KONFIRMASI DELETE VPS*`,
        ``,
        `🖥️ Name: *${vps.name}*`,
        `🆔 ID: \`${dropletId}\``,
        `🌐 IP: \`${vps.networks?.v4?.[0]?.ip_address || "No IP"}\``,
        ``,
        `❗ *PERINGATAN:*`,
        `• Semua data akan hilang permanen`,
        `• VPS tidak dapat dikembalikan`,
        `• Proses delete tidak bisa dibatalkan`,
        ``,
        `Yakin ingin menghapus VPS ini?`
      ].join("\n");

      bot.sendMessage(chatId, confirmMsg, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Ya, Hapus", callback_data: `confirmdel_${accIndex}_${dropletId}` },
              { text: "❌ Batal", callback_data: "canceldelete" }
            ]
          ]
        }
      });
    } catch (err) {
      bot.sendMessage(chatId, `❌ Gagal ambil info VPS\n\n🧾 Error: ${err.message}`);
    }
  }

  if (data.startsWith("confirmdel_")) {
    const parts = data.split("_");
    const accIndex = parts[1];
    const dropletId = parts[2];

    let apiKey;
    if (accIndex === "1") apiKey = settings.apiDigitalOcean;
    if (accIndex === "2") apiKey = settings.apiDigitalOcean2;
    if (accIndex === "3") apiKey = settings.apiDigitalOcean3;

    try {
      await deleteVPS(apiKey, dropletId);
      bot.sendMessage(chatId, `✅ VPS \`${dropletId}\` berhasil dihapus`, { parse_mode: "Markdown" });
    } catch (err) {
      bot.sendMessage(chatId, `❌ Gagal delete VPS\n\n🧾 Error: ${err.message}`);
    }
  }

  if (data === "canceldelete") {
    bot.sendMessage(chatId, "❌ Delete VPS dibatalkan.");
  }

  bot.answerCallbackQuery(cbq.id).catch(() => {});
});

}