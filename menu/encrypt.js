const crypto = require("crypto");
const fs = require("fs-extra");
const JsConfuser = require("js-confuser");
const path = require("path");
const { webcrack } = require("webcrack");
const settings = require("../settings/config.js");

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
    
function createProgressBar(percent = 0, size = 20) {
    
  let p = Number(percent);
  if (!isFinite(p)) p = 0;
  p = Math.max(0, Math.min(100, Math.round(p)));

  const filled = Math.max(0, Math.min(size, Math.round((p / 100) * size)));
  const empty = Math.max(0, size - filled);

  const barFilled = '█'.repeat(filled);
  const barEmpty = '░'.repeat(empty);
  return `${barFilled}${barEmpty} ${p}%`;
}

async function updateProgress(bot, chatId, messageId, percent = 0, label = '') {
  try {

    let p = Number(percent);
    if (!isFinite(p)) p = 0;
    p = Math.max(0, Math.min(100, Math.round(p)));

    const bar = createProgressBar(p, 20);

    const text =
`\`\`\`@naeldev
🔒 Encrypted...
 ${label} (${p}%)
 ${bar}
\`\`\`
`;

    if (messageId) {
      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown"
      }).catch(err => {
      
        console.error("updateProgress.editMessageText error:", err && err.message ? err.message : err);
      });
    } else {
    
      await bot.sendMessage(chatId, text, { parse_mode: "Markdown" }).catch(()=>{});
    }
  } catch (err) {
    console.error("updateProgress error:", err && err.message ? err.message : err);
  }
}
    
const log = (message, error = null) => {
    const timestamp = new Date().toISOString().replace("T", " ").replace("Z", "");
    const timeStyle = `\x1b[33m[${timestamp}]\x1b[0m`;
    const msgStyle = `\x1b[32m${message}\x1b[0m`;
    console.log(`${timeStyle} ${msgStyle}`);
    if (error) {
        const errorStyle = `\x1b[31m✖ Error: ${error.message || error}\x1b[0m`;
        console.error(`${timeStyle} ${errorStyle}`);
        if (error.stack) console.error(`\x1b[90m${error.stack}\x1b[0m`);
    }
};

const obfuscateTimeLocked = async (fileContent, days) => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(days));
    const expiryTimestamp = expiryDate.getTime();
    try {
        const obfuscated = await JsConfuser.obfuscate(
            `(function(){const expiry=${expiryTimestamp};if(new Date().getTime()>expiry){throw new Error('Script has expired after ${days} days');}${fileContent}})();`,
            {
                target: "node",
                compact: true,
                renameVariables: true,
                renameGlobals: true,
                identifierGenerator: "randomized",
                stringCompression: true,
                stringConcealing: true,
                stringEncoding: true,
                controlFlowFlattening: 0.75,
                flatten: true,
                shuffle: true,
                rgf: false,
                opaquePredicates: {
                    count: 6,
                    complexity: 4
                },
                dispatcher: true,
                globalConcealing: true,
                lock: {
                    selfDefending: true,
                    antiDebug: (code) => `if(typeof debugger!=='undefined'||process.env.NODE_ENV==='debug')throw new Error('Debugging disabled');${code}`,
                    integrity: true,
                    tamperProtection: (code) => `if(!((function(){return eval('1+1')===2;})()))throw new Error('Tamper detected');${code}`
                },
                duplicateLiteralsRemoval: true
            }
        );
        let obfuscatedCode = obfuscated.code || obfuscated;
        if (typeof obfuscatedCode !== "string") {
            throw new Error("Hasil obfuscation bukan string");
        }
        return obfuscatedCode;
    } catch (error) {
        throw new Error(`Gagal obfuscate: ${error.message}`);
    }
};

// Konstanta fungsi async untuk obfuscation Quantum Vortex Encryption
const obfuscateQuantum = async (fileContent) => {
  
    const generateTimeBasedIdentifier = () => {
        const timeStamp = new Date().getTime().toString().slice(-5);
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$#@&*";
        let identifier = "qV_";
        for (let i = 0; i < 7; i++) {
            identifier += chars[Math.floor((parseInt(timeStamp[i % 5]) + i * 2) % chars.length)];
        }
        return identifier;
    };

    const currentMilliseconds = new Date().getMilliseconds();
    const phantomCode = currentMilliseconds % 3 === 0 ? `if(Math.random()>0.999)console.log('PhantomTrigger');` : "";

    try {
        const obfuscated = await JsConfuser.obfuscate(fileContent + phantomCode, {
            target: "node",
            compact: true,
            renameVariables: true,
            renameGlobals: true,
            identifierGenerator: generateTimeBasedIdentifier,
            stringCompression: true,
            stringConcealing: false,
            stringEncoding: true,
            controlFlowFlattening: 0.85, 
            flatten: true,
            shuffle: true,
            rgf: true,
            opaquePredicates: {
                count: 8, 
                complexity: 5
            },
            dispatcher: true,
            globalConcealing: true,
            lock: {
                selfDefending: true,
                antiDebug: (code) => `if(typeof debugger!=='undefined'||(typeof process!=='undefined'&&process.env.NODE_ENV==='debug'))throw new Error('Debugging disabled');${code}`,
                integrity: true,
                tamperProtection: (code) => `if(!((function(){return eval('1+1')===2;})()))throw new Error('Tamper detected');${code}`
            },
            duplicateLiteralsRemoval: true
        });
        let obfuscatedCode = obfuscated.code || obfuscated;
        if (typeof obfuscatedCode !== "string") {
            throw new Error("Hasil obfuscation bukan string");
        }
        // Self-evolving code dengan XOR dinamis
        const key = currentMilliseconds % 256;
        obfuscatedCode = `(function(){let k=${key};return function(c){return c.split('').map((x,i)=>String.fromCharCode(x.charCodeAt(0)^(k+(i%16)))).join('');}('${obfuscatedCode}');})()`;
        return obfuscatedCode;
    } catch (error) {
        throw new Error(`Gagal obfuscate: ${error.message}`);
    }
};

// Konfigurasi obfuscation untuk Siu + Calcrick style dengan keamanan ekstrem
const getSiuCalcrickObfuscationConfig = () => {
    const generateSiuCalcrickName = () => {
        // Identifier generator pseudo-random tanpa crypto
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let randomPart = "";
        for (let i = 0; i < 6; i++) { // 6 karakter untuk keseimbangan
            randomPart += chars[Math.floor(Math.random() * chars.length)];
        }
        return `气CalceKarik和SiuSiu无${randomPart}`;
    };

    return {
    target: "node",
    compact: true,
    renameVariables: true,
    renameGlobals: true,
    identifierGenerator: generateSiuCalcrickName,
    stringCompression: true,       
        stringEncoding: true,           
        stringSplitting: true,      
    controlFlowFlattening: 0.95,
    shuffle: true,
        rgf: false,
        flatten: true,
    duplicateLiteralsRemoval: true,
    deadCode: true,
    calculator: true,
    opaquePredicates: true,
    lock: {
        selfDefending: true,
        antiDebug: true,
        integrity: true,
        tamperProtection: true
        }
    };
};

// Konfigurasi obfuscation untuk Nebula style dengan banyak opsi aktif
const getNebulaObfuscationConfig = () => {
    const generateNebulaName = () => {
        // Identifier generator pseudo-random tanpa crypto atau timeHash
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const prefix = "NX";
        let randomPart = "";
        for (let i = 0; i < 4; i++) {
            randomPart += chars[Math.floor(Math.random() * chars.length)];
        }
        return `${prefix}${randomPart}`;
    };

    return {
        target: "node",
        compact: true,                  // Minimalkan whitespace
        renameVariables: true,          // Rename variabel
        renameGlobals: true,            // Rename global untuk keamanan
        identifierGenerator: generateNebulaName,
        stringCompression: true,        // Kompresi string
        stringConcealing: false,         // Sembunyikan string
        stringEncoding: true,           // Enkripsi string
        stringSplitting: false,          // Pecah string untuk kebingungan
        controlFlowFlattening: 0.75,     // Aktif dengan intensitas sedang
        flatten: true,                  // Ratakan struktur kode
        shuffle: true,                  // Acak urutan eksekusi
        rgf: true,                      // Randomized Global Functions
        deadCode: true,                 // Tambah kode mati untuk kebingungan
        opaquePredicates: true,         // Predikat buram
        dispatcher: true,               // Acak eksekusi fungsi
        globalConcealing: true,         // Sembunyikan variabel global
        objectExtraction: true,         // Ekstrak objek untuk kebingungan
        duplicateLiteralsRemoval: true,// Pertahankan duplikat untuk kebingungan
        lock: {
            selfDefending: true,        // Lindungi dari modifikasi
            antiDebug: true,            // Cegah debugging
            integrity: true,            // Pastikan integritas
            tamperProtection: true      // Lindungi dari tampering
        }
    };
};

// Fungsi invisible encoding yang efisien dan kecil
function encodeInvisible(text) {
    try {
        // Kompresi kode dengan menghapus spasi berlebih
        const compressedText = text.replace(/\s+/g, ' ').trim();
        // Gunakan base64 untuk efisiensi
        const base64Text = Buffer.from(compressedText).toString('base64');
        // Tambahkan penanda invisible di awal
        return '\u200B' + base64Text; // Hanya penanda awal untuk invisibility minimal
    } catch (e) {
        log("Gagal encode invisible", e);
        return Buffer.from(text).toString('base64'); // Fallback ke base64
    }
}

// Konfigurasi obfuscation untuk Nova style
const getNovaObfuscationConfig = () => {
    const generateNovaName = () => {
        // Identifier generator unik dan keren
        const prefixes = ["nZ", "nova", "nx"];
        const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const hash = crypto.createHash('sha256')
            .update(crypto.randomBytes(8))
            .digest('hex')
            .slice(0, 6); // Ambil 6 karakter pertama dari hash SHA-256
        const suffix = Math.random().toString(36).slice(2, 5); // Sufiks acak 3 karakter
        return `${randomPrefix}_${hash}_${suffix}`;
    };

    return {
        target: "node",
        compact: true,
        renameVariables: true,
        renameGlobals: true,
        identifierGenerator: generateNovaName, 
        stringCompression: true,
        stringConcealing: true,
        stringEncoding: true,
        stringSplitting: false,
        controlFlowFlattening: 0.5, 
        flatten: true,
        shuffle: true,
        rgf: false,
        deadCode: false, 
        opaquePredicates: true,
        dispatcher: true,
        globalConcealing: true,
        objectExtraction: true,
        duplicateLiteralsRemoval: true,
        lock: {
            selfDefending: true,
            antiDebug: true,
            integrity: true,
            tamperProtection: true
        }
    };
};

// Fungsi decode invisible yang efisien
function decodeInvisible(encodedText) {
    try {
        if (!encodedText.startsWith('\u200B')) return encodedText; // Fallback jika tidak ada penanda
        const base64Text = encodedText.slice(1); // Hapus penanda invisible
        return Buffer.from(base64Text, 'base64').toString('utf-8');
    } catch (e) {
        log("Gagal decode invisible", e);
        return encodedText; // Fallback ke teks asli
    }
}

// Konfigurasi obfuscation untuk X style
const getXObfuscationConfig = () => {
    const generateXName = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return "xZ" + crypto.randomUUID().slice(0, 4); // Nama pendek dan unik
    };

    return {
        target: "node",
        compact: true,
        renameVariables: true,
        renameGlobals: true,
        identifierGenerator: () => generateXName(),
        stringCompression: true,
        stringConcealing: true,
        stringEncoding: true,
        stringSplitting: false,
        controlFlowFlattening: 0.5, // Stabil dan aman
        flatten: true,
        shuffle: true,
        rgf: true,
        deadCode: false, // Nonaktif untuk ukuran kecil
        opaquePredicates: true,
        dispatcher: true,
        globalConcealing: true,
        objectExtraction: true,
        duplicateLiteralsRemoval: true,
        lock: {
            selfDefending: true,
            antiDebug: true,
            integrity: true,
            tamperProtection: true
        }
    };
};

// Konfigurasi obfuscation untuk Max style dengan intensitas yang dapat diatur
const getMaxObfuscationConfig = (intensity) => {
    const generateMaxName = () => {
        // Nama variabel unik: prefiks "mX" + kombinasi acak
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const length = Math.floor(Math.random() * 4) + 4; // 4-7 karakter
        let name = "mX";
        for (let i = 0; i < length; i++) {
            name += chars[Math.floor(Math.random() * chars.length)];
        }
        return name;
    };

    // Skala intensitas dari 1-10 ke 0.1-1.0 untuk controlFlowFlattening
    const flatteningLevel = intensity / 10;

    return {
        target: "node",
        compact: true,
        renameVariables: true,
        renameGlobals: true,
        identifierGenerator: () => generateMaxName(),
        stringCompression: true, // Kompresi string
        stringConcealing: true, // Menyembunyikan string
        stringEncoding: true, // Enkripsi string
        stringSplitting: true, // Memecah string
        controlFlowFlattening: flatteningLevel, // Intensitas berdasarkan input (0.1-1.0)
        flatten: true, // Meratakan struktur kontrol
        shuffle: true, // Mengacak urutan
        rgf: true, // Randomized Global Functions
        calculator: true, // Mengacak operasi matematika
        deadCode: true,
        opaquePredicates: true,
        dispatcher: true, // Mengacak eksekusi
        globalConcealing: true, // Menyembunyikan variabel global
        objectExtraction: true, // Mengekstrak objek untuk kebingungan
        duplicateLiteralsRemoval: false, // Menjaga redundansi
        lock: {
            selfDefending: true,
            antiDebug: true,
            integrity: true,
            tamperProtection: true
        }
    };
};

// Konfigurasi obfuscation standar (diperkuat dan aman)
const getObfuscationConfig = (level = "high") => ({
    target: "node",
    compact: true,
    renameVariables: true,
    renameGlobals: true,
    identifierGenerator: "mangled",
    stringEncoding: true,
    stringSplitting: true,
    controlFlowFlattening: level === "high" ? 0.95 : level === "medium" ? 0.75 : 0.5,
    shuffle: true,
    duplicateLiteralsRemoval: true,
    deadCode: true,
    calculator: true,
    opaquePredicates: true,
    lock: {
        selfDefending: true,
        antiDebug: true,
        integrity: true,
        tamperProtection: true
    }
});

// Konfigurasi obfuscation untuk Strong style (diperbaiki berdasarkan dokumentasi)
const getStrongObfuscationConfig = () => {
    return {
        target: "node",
        compact: true,
        renameVariables: true,
        renameGlobals: true,
        identifierGenerator: "randomized", // Valid: menghasilkan nama acak
        stringEncoding: true, // Valid: mengenkripsi string
        stringSplitting: true, // Valid: memecah string
        controlFlowFlattening: 0.75, // Valid: mengacak alur kontrol
        duplicateLiteralsRemoval: true, // Valid: menghapus literal duplikat
        calculator: true, // Valid: mengacak operasi matematika
        dispatcher: true, // Valid: mengacak eksekusi dengan dispatcher
        deadCode: true, // Valid: menambahkan kode mati
        opaquePredicates: true, // Valid: menambahkan predikat buram
        lock: {
            selfDefending: true, // Valid: mencegah modifikasi
            antiDebug: true, // Valid: mencegah debugging
            integrity: true, // Valid: memastikan integritas
            tamperProtection: true // Valid: perlindungan tamper
        }
    };
};

// Konfigurasi obfuscation untuk Big style (ukuran file besar)
const getBigObfuscationConfig = () => {
    const generateBigName = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const length = Math.floor(Math.random() * 5) + 5; // Nama 5-9 karakter
        let name = "";
        for (let i = 0; i < length; i++) {
            name += chars[Math.floor(Math.random() * chars.length)];
        }
        return name;
    };

    return {
        target: "node",
        compact: true,
        renameVariables: true,
        renameGlobals: true,
        identifierGenerator: () => generateBigName(),
        stringEncoding: true,
        stringSplitting: true,
        controlFlowFlattening: 0.75, // Stabil dan kuat
        shuffle: true,
        duplicateLiteralsRemoval: true,
        deadCode: true,
        opaquePredicates: true,
        lock: {
            selfDefending: true,
            antiDebug: true,
            integrity: true,
            tamperProtection: true
        }
    };
};

// Konfigurasi obfuscation untuk Invisible style (diperbaiki)
const getInvisObfuscationConfig = () => {
    const generateInvisName = () => {
        const length = Math.floor(Math.random() * 4) + 3; // Panjang 3-6 karakter
        let name = "";
        for (let i = 0; i < length; i++) {
            name += "_"; // Menggunakan underscore untuk "invis" yang aman
        }
        // Tambahkan variasi acak agar unik
        return name + Math.random().toString(36).substring(2, 5);
    };

    return {
        target: "node",
        compact: true,
        renameVariables: true,
        renameGlobals: true,
        identifierGenerator: () => generateInvisName(),
        stringEncoding: true,
        stringSplitting: true,
        controlFlowFlattening: 0.95,
        shuffle: true,
        duplicateLiteralsRemoval: true,
        deadCode: true,
        calculator: true,
        opaquePredicates: true,
        lock: {
            selfDefending: true,
            antiDebug: true,
            integrity: true,
            tamperProtection: true
        }
    };
};

// Konfigurasi obfuscation untuk Stealth style (diperbaiki untuk stabilitas)
const getStealthObfuscationConfig = () => {
    const generateStealthName = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const length = Math.floor(Math.random() * 3) + 1; // Nama pendek 1-3 karakter
        let name = "";
        for (let i = 0; i < length; i++) {
            name += chars[Math.floor(Math.random() * chars.length)];
        }
        return name;
    };

    return {
        target: "node",
        compact: true,
        renameVariables: true,
        renameGlobals: true,
        identifierGenerator: () => generateStealthName(),
        stringEncoding: true,
        stringSplitting: true,
        controlFlowFlattening: 0.75, // Dikurangi untuk stabilitas
        shuffle: true,
        duplicateLiteralsRemoval: true,
        deadCode: true,
        opaquePredicates: true,
        lock: {
            selfDefending: true,
            antiDebug: true,
            integrity: true,
            tamperProtection: true
        }
    };
};

// Konfigurasi obfuscation untuk Custom style (dengan nama kustom)
const getCustomObfuscationConfig = (customName) => {
    const generateCustomName = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const randomSuffixLength = Math.floor(Math.random() * 3) + 2; // Sufiks acak 2-4 karakter
        let suffix = "";
        for (let i = 0; i < randomSuffixLength; i++) {
            suffix += chars[Math.floor(Math.random() * chars.length)];
        }
        // Gunakan nama kustom sebagai prefiks, tambahkan sufiks acak
        return `${customName}_${suffix}`;
    };

    return {
        target: "node",
        compact: true,
        renameVariables: true,
        renameGlobals: true,
        identifierGenerator: () => generateCustomName(),
        stringEncoding: true,
        stringSplitting: true,
        controlFlowFlattening: 0.75, // Stabil dan kuat
        shuffle: true,
        duplicateLiteralsRemoval: true,
        deadCode: true,
        opaquePredicates: true,
        lock: {
            selfDefending: true,
            antiDebug: true,
            integrity: true,
            tamperProtection: true
        }
    };
};

// Konfigurasi obfuscation untuk Mandarin style (diperkuat dan aman)
const getMandarinObfuscationConfig = () => {
    const mandarinChars = [
        "龙", "虎", "风", "云", "山", "河", "天", "地", "雷", "电",
        "火", "水", "木", "金", "土", "星", "月", "日", "光", "影",
        "峰", "泉", "林", "海", "雪", "霜", "雾", "冰", "焰", "石"
    ];

    const generateMandarinName = () => {
        const length = Math.floor(Math.random() * 4) + 3;
        let name = "";
        for (let i = 0; i < length; i++) {
            name += mandarinChars[Math.floor(Math.random() * mandarinChars.length)];
        }
        return name;
    };

    return {
        target: "node",
        compact: true,
        renameVariables: true,
        renameGlobals: true,
        identifierGenerator: () => generateMandarinName(),
        stringEncoding: true,
        stringSplitting: true,
        controlFlowFlattening: 0.95,
        shuffle: true,
        duplicateLiteralsRemoval: true,
        deadCode: true,
        calculator: true,
        opaquePredicates: true,
        lock: {
            selfDefending: true,
            antiDebug: true,
            integrity: true,
            tamperProtection: true
        }
    };
};

// Konfigurasi obfuscation untuk Arab style (diperkuat dan aman)
const getArabObfuscationConfig = () => {
    const arabicChars = [
        "أ", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر",
        "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف",
        "ق", "ك", "ل", "م", "ن", "ه", "و", "ي"
    ];

    const generateArabicName = () => {
        const length = Math.floor(Math.random() * 4) + 3;
        let name = "";
        for (let i = 0; i < length; i++) {
            name += arabicChars[Math.floor(Math.random() * arabicChars.length)];
        }
        return name;
    };

    return {
        target: "node",
        compact: true,
        renameVariables: true,
        renameGlobals: true,
        identifierGenerator: () => generateArabicName(),
        stringEncoding: true,
        stringSplitting: true,
        controlFlowFlattening: 0.95,
        shuffle: true,
        duplicateLiteralsRemoval: true,
        deadCode: true,
        calculator: true,
        opaquePredicates: true,
        lock: {
            selfDefending: true,
            antiDebug: true,
            integrity: true,
            tamperProtection: true
        }
    };
};

const getJapanxArabObfuscationConfig = () => {
    const japaneseXArabChars = [
        "あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ",
        "さ", "し", "す", "せ", "そ", "た", "ち", "つ", "て", "と",
        "な", "に", "ぬ", "ね", "の", "は", "ひ", "ふ", "へ", "ほ",
        "ま", "み", "む", "め", "も", "や", "ゆ", "よ","أ", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر",
        "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف",
        "ق", "ك", "ل", "م", "ن", "ه", "و", "ي","ら", "り", "る", "れ", "ろ", "わ", "を", "ん" 
    ];

    const generateJapaneseXArabName = () => {
        const length = Math.floor(Math.random() * 4) + 3; // Panjang 3-6 karakter
        let name = "";
        for (let i = 0; i < length; i++) {
            name += japaneseXArabChars[Math.floor(Math.random() * japaneseXArabChars.length)];
        }
        return name;
    };

    return {
        target: "node",
        compact: true,
        renameVariables: true,
        renameGlobals: true,
        identifierGenerator: () => generateJapaneseXArabName(),
        stringCompression: true, // Kompresi string
        stringConcealing: true, // Menyembunyikan string
        stringEncoding: true, // Enkripsi string
        stringSplitting: true, // Memecah string        
        controlFlowFlattening: 0.95, // Sedikit lebih rendah untuk variasi
        flatten: true,              // Metode baru: mengganti struktur kontrol
        shuffle: true,
        rgf: false,
        dispatcher: true,
        duplicateLiteralsRemoval: true,
        deadCode: true,
        calculator: true,
        opaquePredicates: true,
        lock: {
            selfDefending: true,
            antiDebug: true,
            integrity: true,
            tamperProtection: true
        }
    };
};

const getUltraObfuscationConfig = () => {
    const generateUltraName = () => {
        const chars = "abcdefghijklmnopqrstuvwxyz";
        const numbers = "0123456789";
        const randomNum = numbers[Math.floor(Math.random() * numbers.length)];
        const randomChar = chars[Math.floor(Math.random() * chars.length)];
        return `z${randomNum}${randomChar}${Math.random().toString(36).substring(2, 6)}`;
    };

    return {
        target: "node",
        compact: true,
        renameVariables: true,
        renameGlobals: true,
        identifierGenerator: () => generateUltraName(),
        stringCompression: true, // Kompresi string untuk keamanan tinggi
        stringEncoding: true,
        stringSplitting: true,
        controlFlowFlattening: 0.9,
        flatten: true,
        shuffle: true,
        rgf: true, // Randomized Global Functions
        deadCode: true,
        opaquePredicates: true,
        dispatcher: true,
        lock: {
            selfDefending: true,
            antiDebug: true,
            integrity: true,
            tamperProtection: true
        }
    };
};

// Konfigurasi obfuscation untuk Japan style (diperkuat dan aman)
const getJapanObfuscationConfig = () => {
    const japaneseChars = [
        "あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ",
        "さ", "し", "す", "せ", "そ", "た", "ち", "つ", "て", "と",
        "な", "に", "ぬ", "ね", "の", "は", "ひ", "ふ", "へ", "ほ",
        "ま", "み", "む", "め", "も", "や", "ゆ", "よ",
        "ら", "り", "る", "れ", "ろ", "わ", "を", "ん"
    ];

    const generateJapaneseName = () => {
        const length = Math.floor(Math.random() * 4) + 3; // Panjang 3-6 karakter
        let name = "";
        for (let i = 0; i < length; i++) {
            name += japaneseChars[Math.floor(Math.random() * japaneseChars.length)];
        }
        return name;
    };

    return {
        target: "node",
        compact: true,
        renameVariables: true,
        renameGlobals: true,
        identifierGenerator: () => generateJapaneseName(),
        stringEncoding: true,
        stringSplitting: true,
        controlFlowFlattening: 0.9, // Sedikit lebih rendah untuk variasi
        flatten: true,              // Metode baru: mengganti struktur kontrol
        shuffle: true,
        duplicateLiteralsRemoval: true,
        deadCode: true,
        calculator: true,
        opaquePredicates: true,
        lock: {
            selfDefending: true,
            antiDebug: true,
            integrity: true,
            tamperProtection: true
        }
    };
};

// Konfigurasi obfuscation untuk /encnew (diperkuat dan aman)
const getNewObfuscationConfig = () => ({
    target: "node",
    compact: true,
    renameVariables: true,
    renameGlobals: true,
    identifierGenerator: "mangled",
    stringEncoding: true,
    stringSplitting: true,
    controlFlowFlattening: 0.95,
    shuffle: true,
    duplicateLiteralsRemoval: true,
    deadCode: true,
    calculator: true,
    opaquePredicates: true,
    lock: {
        selfDefending: true,
        antiDebug: true,
        integrity: true,
        tamperProtection: true
    }
});

    // enc
command(/^\/enc(?:\s+(low|medium|high))?$/, async (msg, match) => {
    const chatId = msg.chat.id;

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js dengan `/enc [level]`!", { parse_mode: "Markdown" });
    }

    const file = msg.reply_to_message.document;

    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }

    // Get encryption level from command arguments
    const encryptionLevel = match[1] && ["low", "medium", "high"].includes(match[1]) ? match[1] : "high";
    const encryptedPath = path.join(__dirname, `encrypted-${file.file_name}`);
    let progressMessage = null;

    try {
        progressMessage = await bot.sendMessage(
            chatId,
            "```@naeldev\n" +
            "🔒 Starting Encrypted...\n" +
            ` ⚙️ Memulai (${encryptionLevel}) (1%)\n` +
            ` ${createProgressBar(1)}\n` +
            "```\n",
            { parse_mode: "Markdown" }
        );

        const fileLink = await bot.getFileLink(file.file_id);
        log(`Mengunduh file: ${file.file_name}`);
        await updateProgress(bot, chatId, progressMessage.message_id, 10, "Mengunduh");

        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(bot, chatId, progressMessage.message_id, 20, "Mengunduh Selesai");

        log(`Memvalidasi kode: ${file.file_name}`);
        await updateProgress(bot, chatId, progressMessage.message_id, 30, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode tidak valid: ${syntaxError.message}`);
        }

        log(`Mengenkripsi file dengan level: ${encryptionLevel}`);
        await updateProgress(bot, chatId, progressMessage.message_id, 40, "Inisialisasi Hardened Enkripsi");

        const obfuscated = await JsConfuser.obfuscate(fileContent, getObfuscationConfig(encryptionLevel));
        await updateProgress(bot, chatId, progressMessage.message_id, 60, "Transformasi Kode");

        await fs.writeFile(encryptedPath, obfuscated.code);
        await updateProgress(bot, chatId, progressMessage.message_id, 80, "Finalisasi Enkripsi");

        log(`Memvalidasi hasil obfuscation: ${file.file_name}`);
        try {
            new Function(obfuscated.code);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        log(`Mengirim file terenkripsi: encrypted-${file.file_name}`);
        await bot.sendDocument(chatId, encryptedPath, {
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
            filename: `enc-${file.file_name}`
        });

        await updateProgress(bot, chatId, progressMessage.message_id, 100, `Enkripsi (${encryptionLevel}) Selesai`);

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
            // ignore delete errors
        }

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`file sementara dihapus: ${encryptedPath}`);
        }
    } catch (error) {
        log("Kesalahan saat mengenkripsi", error);

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
            // ignore
        }

        await bot.sendMessage(
            chatId,
            `❌ ${error.message || "Tidak diketahui"}`,
            { parse_mode: "Markdown" }
        );

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`File sementara dihapus setelah error: ${encryptedPath}`);
        }
    }
});

    // enc eval
command(/^\/enceval(?:\s+(low|medium|high))?$/, async (msg, match) => {
    const chatId = msg.chat.id;

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js dengan `/enceval [level]`!", { parse_mode: "Markdown" });
    }

    const file = msg.reply_to_message.document;

    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }

    const encryptionLevel = match[1] && ["low", "medium", "high"].includes(match[1]) ? match[1] : "high";
    const encryptedPath = path.join(__dirname, `eval-encrypted-${file.file_name}`);
    let progressMessage = null;

    try {
        progressMessage = await bot.sendMessage(
            chatId,
            "```@naeldev\n" +
            "🔒 Starting Encrypted...\n" +
            ` ⚙️ Memulai Evaluasi (${encryptionLevel}) (1%)\n` +
            ` ${createProgressBar(1)}\n` +
            "```\n",
            { parse_mode: "Markdown" }
        );

        const fileLink = await bot.getFileLink(file.file_id);
        log(`Mengunduh file untuk evaluasi: ${file.file_name}`);
        await updateProgress(bot, chatId, progressMessage.message_id, 10, "Mengunduh");

        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(bot, chatId, progressMessage.message_id, 20, "Mengunduh Selesai");

        let evalResult;
        try {
            await updateProgress(bot, chatId, progressMessage.message_id, 30, "Mengevaluasi Kode Asli");
            evalResult = eval(fileContent);
            if (typeof evalResult === "function") {
                evalResult = "Function detected (cannot display full output)";
            } else if (evalResult === undefined) {
                evalResult = "No return value";
            }
        } catch (evalError) {
            evalResult = `Evaluation error: ${evalError.message}`;
        }

        log(`Memvalidasi kode: ${file.file_name}`);
        await updateProgress(bot, chatId, progressMessage.message_id, 40, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode tidak valid: ${syntaxError.message}`);
        }

        log(`Mengenkripsi dan mengevaluasi file dengan level: ${encryptionLevel}`);
        await updateProgress(bot, chatId, progressMessage.message_id, 50, "Inisialisasi Hardened Enkripsi");

        const obfuscated = await JsConfuser.obfuscate(fileContent, getObfuscationConfig(encryptionLevel));
        await updateProgress(bot, chatId, progressMessage.message_id, 70, "Transformasi Kode");

        await fs.writeFile(encryptedPath, obfuscated.code);
        await updateProgress(bot, chatId, progressMessage.message_id, 90, "Finalisasi Enkripsi");

        log(`Memvalidasi hasil obfuscation: ${file.file_name}`);
        try {
            new Function(obfuscated.code);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        log(`Mengirim file terenkripsi dan hasil evaluasi: ${file.file_name}`);
        await bot.sendMessage(
            chatId,
            `*Original Code Result:* \n\`\`\`javascript\n${evalResult}\n\`\`\`\n`,
            { parse_mode: "Markdown" }
        );

        await bot.sendDocument(chatId, encryptedPath, {
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
            filename: `eval-enc-${file.file_name}`
        });

        await updateProgress(bot, chatId, progressMessage.message_id, 100, `Evaluasi & Enkripsi (${encryptionLevel}) Selesai`);

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`file sementara dihapus: ${encryptedPath}`);
        }
    } catch (error) {
        log("Kesalahan saat mengenkripsi/evaluasi", error);

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        await bot.sendMessage(
            chatId,
            `❌ ${error.message || "Tidak diketahui"}`,
            { parse_mode: "Markdown" }
        );

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`File sementara dihapus setelah error: ${encryptedPath}`);
        }
    }
});

    // enc china
command(/^\/encchina$/, async (msg) => {
    const chatId = msg.chat.id;

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js dengan `/encchina`!", { parse_mode: "Markdown" });
    }

    const file = msg.reply_to_message.document;

    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }

    const encryptedPath = path.join(__dirname, `china-encrypted-${file.file_name}`);
    let progressMessage = null;

    try {
        progressMessage = await bot.sendMessage(
            chatId,
            "```@naeldev\n" +
            "🔒 Starting Encrypted...\n" +
            ` ⚙️ Memulai (Hardened Mandarin) (1%)\n` +
            ` ${createProgressBar(1)}\n` +
            "```\n",
            { parse_mode: "Markdown" }
        );

        const fileLink = await bot.getFileLink(file.file_id);
        log(`Mengunduh file untuk Mandarin obfuscation: ${file.file_name}`);
        await updateProgress(bot, chatId, progressMessage.message_id, 10, "Mengunduh");

        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(bot, chatId, progressMessage.message_id, 20, "Mengunduh Selesai");

        log(`Memvalidasi kode: ${file.file_name}`);
        await updateProgress(bot, chatId, progressMessage.message_id, 30, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode tidak valid: ${syntaxError.message}`);
        }

        log(`Mengenkripsi file dengan gaya Mandarin yang diperkuat`);
        await updateProgress(bot, chatId, progressMessage.message_id, 40, "Inisialisasi Hardened Mandarin Obfuscation");

        const obfuscated = await JsConfuser.obfuscate(fileContent, getMandarinObfuscationConfig());
        await updateProgress(bot, chatId, progressMessage.message_id, 60, "Transformasi Kode");

        await fs.writeFile(encryptedPath, obfuscated.code);
        await updateProgress(bot, chatId, progressMessage.message_id, 80, "Finalisasi Enkripsi");

        log(`Memvalidasi hasil obfuscation: ${file.file_name}`);
        try {
            new Function(obfuscated.code);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        log(`Mengirim file terenkripsi gaya Mandarin: ${file.file_name}`);
        await bot.sendDocument(chatId, encryptedPath, {
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
            filename: `china-enc-${file.file_name}`
        });

        await updateProgress(bot, chatId, progressMessage.message_id, 100, "Hardened Mandarin Obfuscation Selesai");

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`file sementara dihapus: ${encryptedPath}`);
        }
    } catch (error) {
        log("Kesalahan saat Mandarin obfuscation", error);

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        await bot.sendMessage(
            chatId,
            `❌ ${error.message || "Tidak diketahui"}`,
            { parse_mode: "Markdown" }
        );

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`File sementara dihapus setelah error: ${encryptedPath}`);
        }
    }
});
    
    // enc arab
command(/^\/encarab$/, async (msg) => {
    const chatId = msg.chat.id;

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js dengan `/encarab`!", { parse_mode: "Markdown" });
    }

    const file = msg.reply_to_message.document;

    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }

    const encryptedPath = path.join(__dirname, `arab-encrypted-${file.file_name}`);
    let progressMessage = null;

    try {
        progressMessage = await bot.sendMessage(
            chatId,
            "```@naeldev\n" +
            "🔒 Starting Encrypted...\n" +
            ` ⚙️ Memulai (Hardened Arab) (1%)\n` +
            ` ${createProgressBar(1)}\n` +
            "```\n",
            { parse_mode: "Markdown" }
        );

        const fileLink = await bot.getFileLink(file.file_id);
        log(`Mengunduh file untuk Arab obfuscation: ${file.file_name}`);
        await updateProgress(bot, chatId, progressMessage.message_id, 10, "Mengunduh");

        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(bot, chatId, progressMessage.message_id, 20, "Mengunduh Selesai");

        log(`Memvalidasi kode: ${file.file_name}`);
        await updateProgress(bot, chatId, progressMessage.message_id, 30, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode tidak valid: ${syntaxError.message}`);
        }

        log(`Mengenkripsi file dengan gaya Arab yang diperkuat`);
        await updateProgress(bot, chatId, progressMessage.message_id, 40, "Inisialisasi Hardened Arab Obfuscation");

        const obfuscated = await JsConfuser.obfuscate(fileContent, getArabObfuscationConfig());
        await updateProgress(bot, chatId, progressMessage.message_id, 60, "Transformasi Kode");

        await fs.writeFile(encryptedPath, obfuscated.code);
        await updateProgress(bot, chatId, progressMessage.message_id, 80, "Finalisasi Enkripsi");

        log(`Memvalidasi hasil obfuscation: ${file.file_name}`);
        try {
            new Function(obfuscated.code);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        log(`Mengirim file terenkripsi gaya Arab: ${file.file_name}`);
        await bot.sendDocument(chatId, encryptedPath, {
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
            filename: `arab-enc-${file.file_name}`
        });

        await updateProgress(bot, chatId, progressMessage.message_id, 100, "Hardened Arab Obfuscation Selesai");

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`file sementara dihapus: ${encryptedPath}`);
        }
    } catch (error) {
        log("Kesalahan saat Arab obfuscation", error);

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        await bot.sendMessage(
            chatId,
            `❌ ${error.message || "Tidak diketahui"}`,
            { parse_mode: "Markdown" }
        );

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`File sementara dihapus setelah error: ${encryptedPath}`);
        }
    }
});
    
    // enc japan
command(/^\/encjapan$/, async (msg) => {
    const chatId = msg.chat.id;

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js dengan `/encjapan`!", { parse_mode: "Markdown" });
    }

    const file = msg.reply_to_message.document;

    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }

    const encryptedPath = path.join(__dirname, `japan-encrypted-${file.file_name}`);
    let progressMessage = null;

    try {
        progressMessage = await bot.sendMessage(
            chatId,
            "```@naeldev\n" +
            "🔒 Starting Encrypted...\n" +
            ` ⚙️ Memulai (Hardened Japan) (1%)\n` +
            ` ${createProgressBar(1)}\n` +
            "```\n",
            { parse_mode: "Markdown" }
        );

        const fileLink = await bot.getFileLink(file.file_id);
        log(`Mengunduh file untuk Japan obfuscation: ${file.file_name}`);
        await updateProgress(bot, chatId, progressMessage.message_id, 10, "Mengunduh");

        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(bot, chatId, progressMessage.message_id, 20, "Mengunduh Selesai");

        log(`Memvalidasi kode: ${file.file_name}`);
        await updateProgress(bot, chatId, progressMessage.message_id, 30, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode tidak valid: ${syntaxError.message}`);
        }

        log(`Mengenkripsi file dengan gaya Japan yang diperkuat`);
        await updateProgress(bot, chatId, progressMessage.message_id, 40, "Inisialisasi Hardened Japan Obfuscation");

        const obfuscated = await JsConfuser.obfuscate(fileContent, getJapanObfuscationConfig());
        await updateProgress(bot, chatId, progressMessage.message_id, 60, "Transformasi Kode");

        await fs.writeFile(encryptedPath, obfuscated.code);
        await updateProgress(bot, chatId, progressMessage.message_id, 80, "Finalisasi Enkripsi");

        log(`Memvalidasi hasil obfuscation: ${file.file_name}`);
        try {
            new Function(obfuscated.code);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        log(`Mengirim file terenkripsi gaya Japan: ${file.file_name}`);
        await bot.sendDocument(chatId, encryptedPath, {
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
            filename: `japan-enc-${file.file_name}`
        });

        await updateProgress(bot, chatId, progressMessage.message_id, 100, "Hardened Japan Obfuscation Selesai");

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`file sementara dihapus: ${encryptedPath}`);
        }
    } catch (error) {
        log("Kesalahan saat Japan obfuscation", error);

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        await bot.sendMessage(
            chatId,
            `❌ ${error.message || "Tidak diketahui"}`,
            { parse_mode: "Markdown" }
        );

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`File sementara dihapus setelah error: ${encryptedPath}`);
        }
    }
});
    
    // enc japxab
command(/^\/encjapxab$/, async (msg) => {
    const chatId = msg.chat.id;

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js dengan `/encjapxab`!", { parse_mode: "Markdown" });
    }

    const file = msg.reply_to_message.document;

    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }

    const encryptedPath = path.join(__dirname, `japan-arab-encrypted-${file.file_name}`);
    let progressMessage = null;

    try {
        progressMessage = await bot.sendMessage(
            chatId,
            "```@naeldev\n" +
            "🔒 Starting Encrypted...\n" +
            ` ⚙️ Memulai (Hardened Japan X Arab) (1%)\n` +
            ` ${createProgressBar(1)}\n` +
            "```\n",
            { parse_mode: "Markdown" }
        );

        const fileLink = await bot.getFileLink(file.file_id);
        await updateProgress(bot, chatId, progressMessage.message_id, 10, "Mengunduh");

        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(bot, chatId, progressMessage.message_id, 20, "Mengunduh Selesai");

        await updateProgress(bot, chatId, progressMessage.message_id, 30, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode tidak valid: ${syntaxError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 40, "Inisialisasi Hardened Japan X Arab Obfuscation");

        const obfuscated = await JsConfuser.obfuscate(fileContent, getJapanxArabObfuscationConfig());
        await updateProgress(bot, chatId, progressMessage.message_id, 60, "Transformasi Kode");

        await fs.writeFile(encryptedPath, obfuscated.code);
        await updateProgress(bot, chatId, progressMessage.message_id, 80, "Finalisasi Enkripsi");

        try {
            new Function(obfuscated.code);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        await bot.sendDocument(chatId, encryptedPath, {
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
            filename: `japan-arab-enc-${file.file_name}`
        });

        await updateProgress(bot, chatId, progressMessage.message_id, 100, "Hardened Japan X Arab Obfuscation Selesai");

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    } catch (error) {
        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        await bot.sendMessage(
            chatId,
            `❌ ${error.message || "Tidak diketahui"}`,
            { parse_mode: "Markdown" }
        );

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    }
});
    
    // enc new
command(/^\/encnew$/, async (msg) => {
    const chatId = msg.chat.id;

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js dengan `/encnew`!", { parse_mode: "Markdown" });
    }

    const file = msg.reply_to_message.document;

    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }

    const encryptedPath = path.join(__dirname, `new-encrypted-${file.file_name}`);
    let progressMessage = null;

    try {
        progressMessage = await bot.sendMessage(
            chatId,
            "```@naeldev\n" +
            "🔒 Starting Encrypted...\n" +
            ` ⚙️ Memulai (Hardened Advanced) (1%)\n` +
            ` ${createProgressBar(1)}\n` +
            "```\n",
            { parse_mode: "Markdown" }
        );

        const fileLink = await bot.getFileLink(file.file_id);
        await updateProgress(bot, chatId, progressMessage.message_id, 10, "Mengunduh");

        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(bot, chatId, progressMessage.message_id, 20, "Mengunduh Selesai");

        await updateProgress(bot, chatId, progressMessage.message_id, 30, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode tidak valid: ${syntaxError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 40, "Inisialisasi Hardened Advanced Obfuscation");

        const obfuscated = await JsConfuser.obfuscate(fileContent, getNewObfuscationConfig());
        await updateProgress(bot, chatId, progressMessage.message_id, 60, "Transformasi Kode");

        await fs.writeFile(encryptedPath, obfuscated.code);
        await updateProgress(bot, chatId, progressMessage.message_id, 80, "Finalisasi Enkripsi");

        try {
            new Function(obfuscated.code);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        await bot.sendDocument(chatId, encryptedPath, {
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
            filename: `new-enc-${file.file_name}`
        });

        await updateProgress(bot, chatId, progressMessage.message_id, 100, "Hardened Advanced Obfuscation Selesai");

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    } catch (error) {
        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        await bot.sendMessage(
            chatId,
            `❌ ${error.message || "Tidak diketahui"}`,
            { parse_mode: "Markdown" }
        );

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    }
});
    
    // invis hard
command(/^\/invishard$/, async (msg) => {
    const chatId = msg.chat.id;

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js dengan `/invishard`!", { parse_mode: "Markdown" });
    }

    const file = msg.reply_to_message.document;

    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }

    const encryptedPath = path.join(__dirname, `invisible-encrypted-${file.file_name}`);
    let progressMessage = null;

    try {
        progressMessage = await bot.sendMessage(
            chatId,
            "```@naeldev\n" +
            "🔒 Starting Encrypted...\n" +
            ` ⚙️ Memulai (InvisiBle) (1%)\n` +
            ` ${createProgressBar(1)}\n` +
            "```\n",
            { parse_mode: "Markdown" }
        );

        const fileLink = await bot.getFileLink(file.file_id);
        log(`Mengunduh File Untuk Invisible Obfuscation: ${file.file_name}`);
        await updateProgress(bot, chatId, progressMessage.message_id, 10, "Mengunduh");

        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(bot, chatId, progressMessage.message_id, 20, "Mengunduh Selesai");

        log(`Memvalidasi kode awal: ${file.file_name}`);
        await updateProgress(bot, chatId, progressMessage.message_id, 30, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`syntaxError: Kode tidak valid ${syntaxError.message}`);
        }

        log(`Mengenkripsi File Dengan Gaya Invisible Hardened`);
        await updateProgress(bot, chatId, progressMessage.message_id, 40, "Inisialisasi Hardened Invisible Obfuscation");

        const obfuscated = await JsConfuser.obfuscate(fileContent, getStrongObfuscationConfig());
        let obfuscatedCode = obfuscated.code || obfuscated;
        if (typeof obfuscatedCode !== "string") {
            throw new Error("Hasil Obfuscation Bukan String");
        }
        log(`Hasil Obfuscation (50 Char Pertama): ${obfuscatedCode.substring(0, 50)}...`);
        await updateProgress(bot, chatId, progressMessage.message_id, 60, "Transformasi Kode");

        log(`Memvalidasi Hasil Obfuscation: ${file.file_name}`);
        try {
            new Function(obfuscatedCode);
        } catch (postObfuscationError) {
            throw new Error(`Hasil Obfuscation Tidak Valid: ${postObfuscationError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 80, "Finalisasi Enkripsi");
        await fs.writeFile(encryptedPath, obfuscatedCode);

        log(`Mengirim File Terenkripsi Gaya Invisible: ${file.file_name}`);
        await bot.sendDocument(chatId, encryptedPath, {
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
            filename: `Invisible-Enc-${file.file_name}`
        });

        await updateProgress(bot, chatId, progressMessage.message_id, 100, "Hardened Invisible Obfuscation Selesai");

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`file sementara dihapus: ${encryptedPath}`);
        }
    } catch (error) {
        log("Kesalahan Saat Invisible Obfuscation", error);

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        await bot.sendMessage(
            chatId,
            `❌ ${error.message || "Tidak diketahui"}`,
            { parse_mode: "Markdown" }
        );

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`File sementara dihapus setelah error: ${encryptedPath}`);
        }
    }
});
    
    // enc invis
command(/^\/encinvis$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js dengan `/encinvis`!", { parse_mode: "Markdown" });
    }

    const file = msg.reply_to_message.document;

    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }

    const encryptedPath = path.join(__dirname, `invis-encrypted-${file.file_name}`);
    let progressMessage = null;

    try {
        progressMessage = await bot.sendMessage(
            chatId,
            "```@naeldev\n" +
            "🔒 Starting Encrypted...\n" +
            ` ⚙️ Memulai (Hardened Invisible) (1%)\n` +
            ` ${createProgressBar(1)}\n` +
            "```\n",
            { parse_mode: "Markdown" }
        );

        const fileLink = await bot.getFileLink(file.file_id);
        log(`Mengunduh file untuk Invisible obfuscation: ${file.file_name}`);
        await updateProgress(bot, chatId, progressMessage.message_id, 10, "Mengunduh");

        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(bot, chatId, progressMessage.message_id, 20, "Mengunduh Selesai");

        log(`Memvalidasi kode: ${file.file_name}`);
        await updateProgress(bot, chatId, progressMessage.message_id, 30, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode tidak valid: ${syntaxError.message}`);
        }

        log(`Mengenkripsi file dengan gaya Invisible yang diperkuat`);
        await updateProgress(bot, chatId, progressMessage.message_id, 40, "Inisialisasi Hardened Invisible Obfuscation");

        const obfuscated = await JsConfuser.obfuscate(fileContent, getInvisObfuscationConfig());
        await updateProgress(bot, chatId, progressMessage.message_id, 60, "Transformasi Kode");

        await fs.writeFile(encryptedPath, obfuscated.code);
        await updateProgress(bot, chatId, progressMessage.message_id, 80, "Finalisasi Enkripsi");

        log(`Memvalidasi hasil obfuscation: ${file.file_name}`);
        try {
            new Function(obfuscated.code);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        log(`Mengirim file terenkripsi gaya Invisible: ${file.file_name}`);
        await bot.sendDocument(chatId, encryptedPath, {
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
            filename: `invis-enc-${file.file_name}`
        });

        await updateProgress(bot, chatId, progressMessage.message_id, 100, "Hardened Invisible Obfuscation Selesai");

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
            // ignore delete errors
        }

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`file sementara dihapus: ${encryptedPath}`);
        }
    } catch (error) {
        log("Kesalahan saat Invisible obfuscation", error);

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
            // ignore
        }

        await bot.sendMessage(
            chatId,
            `❌ ${error.message || "Tidak diketahui"}`,
            { parse_mode: "Markdown" }
        );

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`File sementara dihapus setelah error: ${encryptedPath}`);
        }
    }
});
    
    // enc stealth
command(/^\/encstealth$/, async (msg) => {
    const chatId = msg.chat.id;

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js dengan `/encstealth`!", { parse_mode: "Markdown" });
    }

    const file = msg.reply_to_message.document;

    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }

    const encryptedPath = path.join(__dirname, `stealth-encrypted-${file.file_name}`);
    let progressMessage = null;

    try {
        progressMessage = await bot.sendMessage(
            chatId,
            "```@naeldev\n" +
            "🔒 Starting Encrypted...\n" +
            ` ⚙️ Memulai (Hardened Stealth) (1%)\n` +
            ` ${createProgressBar(1)}\n` +
            "```\n",
            { parse_mode: "Markdown" }
        );

        const fileLink = await bot.getFileLink(file.file_id);
        await updateProgress(bot, chatId, progressMessage.message_id, 10, "Mengunduh");

        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(bot, chatId, progressMessage.message_id, 20, "Mengunduh Selesai");

        await updateProgress(bot, chatId, progressMessage.message_id, 30, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode tidak valid: ${syntaxError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 40, "Inisialisasi Hardened Stealth Obfuscation");

        const obfuscated = await JsConfuser.obfuscate(fileContent, getStealthObfuscationConfig());
        await updateProgress(bot, chatId, progressMessage.message_id, 60, "Transformasi Kode");

        await fs.writeFile(encryptedPath, obfuscated.code);
        await updateProgress(bot, chatId, progressMessage.message_id, 80, "Finalisasi Enkripsi");

        try {
            new Function(obfuscated.code);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        await bot.sendDocument(chatId, encryptedPath, {
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
            filename: `stealth-enc-${file.file_name}`
        });

        await updateProgress(bot, chatId, progressMessage.message_id, 100, "Hardened Stealth Obfuscation Selesai");

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    } catch (error) {
        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        await bot.sendMessage(
            chatId,
            `❌ ${error.message || "Tidak diketahui"}`,
            { parse_mode: "Markdown" }
        );

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    }
});
    
    // custom enc
command(/^\/customenc (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;

    const customName = match[1].replace(/[^a-zA-Z0-9_]/g, "");
    if (!customName) {
        return bot.sendMessage(chatId, "❌ *Error:* Nama kustom harus berisi huruf, angka, atau underscore!", { parse_mode: "Markdown" });
    }

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js dengan `/customenc <nama>`!", { parse_mode: "Markdown" });
    }

    const file = msg.reply_to_message.document;

    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }

    const encryptedPath = path.join(__dirname, `custom-${customName}-encrypted-${file.file_name}`);
    let progressMessage = null;

    try {
        progressMessage = await bot.sendMessage(
            chatId,
            "```@naeldev\n" +
            "🔒 Starting Encrypted...\n" +
            ` ⚙️ Memulai (Hardened Custom: ${customName}) (1%)\n` +
            ` ${createProgressBar(1)}\n` +
            "```\n",
            { parse_mode: "Markdown" }
        );

        const fileLink = await bot.getFileLink(file.file_id);
        await updateProgress(bot, chatId, progressMessage.message_id, 10, "Mengunduh");

        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(bot, chatId, progressMessage.message_id, 20, "Mengunduh Selesai");

        await updateProgress(bot, chatId, progressMessage.message_id, 30, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode awal tidak valid: ${syntaxError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 40, "Inisialisasi Hardened Custom Obfuscation");

        const obfuscated = await JsConfuser.obfuscate(fileContent, getCustomObfuscationConfig(customName));
        await updateProgress(bot, chatId, progressMessage.message_id, 60, "Transformasi Kode");

        try {
            new Function(obfuscated.code);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        await fs.writeFile(encryptedPath, obfuscated.code);
        await updateProgress(bot, chatId, progressMessage.message_id, 80, "Finalisasi Enkripsi");

        await bot.sendDocument(chatId, encryptedPath, {
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
            filename: `custom-${customName}-enc-${file.file_name}`
        });

        await updateProgress(bot, chatId, progressMessage.message_id, 100, `Hardened Custom (${customName}) Obfuscation Selesai`);

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    } catch (error) {
        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        await bot.sendMessage(
            chatId,
            `❌ ${error.message || "Tidak diketahui"}`,
            { parse_mode: "Markdown" }
        );

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    }
});
    
    // enc strong
command(/^\/encstrong$/, async (msg) => {
    const chatId = msg.chat.id;

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js dengan `/encstrong`!", { parse_mode: "Markdown" });
    }

    const file = msg.reply_to_message.document;

    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }

    const encryptedPath = path.join(__dirname, `strong-encrypted-${file.file_name}`);
    let progressMessage = null;

    try {
        progressMessage = await bot.sendMessage(
            chatId,
            "```@naeldev\n" +
            "🔒 Starting Encrypted...\n" +
            ` ⚙️ Memulai (Hardened Strong) (1%)\n` +
            ` ${createProgressBar(1)}\n` +
            "```\n",
            { parse_mode: "Markdown" }
        );

        const fileLink = await bot.getFileLink(file.file_id);
        await updateProgress(bot, chatId, progressMessage.message_id, 10, "Mengunduh");

        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(bot, chatId, progressMessage.message_id, 20, "Mengunduh Selesai");

        await updateProgress(bot, chatId, progressMessage.message_id, 30, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode tidak valid: ${syntaxError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 40, "Inisialisasi Hardened Strong Obfuscation");

        const obfuscated = await JsConfuser.obfuscate(fileContent, getStrongObfuscationConfig());
        let obfuscatedCode = obfuscated.code || obfuscated;
        if (typeof obfuscatedCode !== "string") {
            throw new Error("Hasil obfuscation bukan string");
        }
        await updateProgress(bot, chatId, progressMessage.message_id, 60, "Transformasi Kode");

        try {
            new Function(obfuscatedCode);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 80, "Finalisasi Enkripsi");
        await fs.writeFile(encryptedPath, obfuscatedCode);

        await bot.sendDocument(chatId, encryptedPath, {
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
            filename: `strong-enc-${file.file_name}`
        });

        await updateProgress(bot, chatId, progressMessage.message_id, 100, "Hardened Strong Obfuscation Selesai");

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    } catch (error) {
        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        await bot.sendMessage(
            chatId,
            `❌ ${error.message || "Tidak diketahui"}`,
            { parse_mode: "Markdown" }
        );

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    }
});

    // enc big
command(/^\/encbig (\d+)$/, async (msg, match) => {
    const chatId = msg.chat.id;

    const targetSizeMB = Math.max(1, parseInt(match[1], 10));

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js dengan `/encbig <size_in_mb>`!", { parse_mode: "Markdown" });
    }

    const file = msg.reply_to_message.document;

    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }

    const encryptedPath = path.join(__dirname, `big-encrypted-${file.file_name}`);
    let progressMessage = null;

    try {
        progressMessage = await bot.sendMessage(
            chatId,
            "```@naeldev\n" +
            "🔒 Starting Encrypted...\n" +
            ` ⚙️ Memulai (Hardened Big: ${targetSizeMB}MB) (1%)\n` +
            ` ${createProgressBar(1)}\n` +
            "```\n",
            { parse_mode: "Markdown" }
        );

        const fileLink = await bot.getFileLink(file.file_id);
        await updateProgress(bot, chatId, progressMessage.message_id, 10, "Mengunduh");

        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(bot, chatId, progressMessage.message_id, 20, "Mengunduh Selesai");

        await updateProgress(bot, chatId, progressMessage.message_id, 30, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode tidak valid: ${syntaxError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 40, "Inisialisasi Hardened Big Obfuscation");

        const obfuscated = await JsConfuser.obfuscate(fileContent, getBigObfuscationConfig());
        let obfuscatedCode = obfuscated.code || obfuscated;
        if (typeof obfuscatedCode !== "string") {
            throw new Error("Hasil obfuscation bukan string");
        }
        await updateProgress(bot, chatId, progressMessage.message_id, 60, "Transformasi Kode");

        const currentSizeBytes = Buffer.byteLength(obfuscatedCode, "utf8");
        const targetSizeBytes = targetSizeMB * 1024 * 1024;
        if (currentSizeBytes < targetSizeBytes) {
            const paddingSize = targetSizeBytes - currentSizeBytes;
            const padding = crypto.randomBytes(paddingSize).toString("base64");
            obfuscatedCode += `\n/* Binary Padding (${paddingSize} bytes) */\n// ${padding}`;
        }

        try {
            new Function(obfuscatedCode);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid setelah padding: ${postObfuscationError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 80, "Finalisasi Enkripsi");
        await fs.writeFile(encryptedPath, obfuscatedCode);

        await bot.sendDocument(chatId, encryptedPath, {
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
            filename: `big-enc-${file.file_name}`
        });

        await updateProgress(bot, chatId, progressMessage.message_id, 100, `Hardened Big (${targetSizeMB}MB) Obfuscation Selesai`);

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    } catch (error) {
        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        await bot.sendMessage(
            chatId,
            `❌ ${error.message || "Tidak diketahui"}`,
            { parse_mode: "Markdown" }
        );

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    }
});
    
    // enc ultra
command(/^\/encultra$/, async (msg) => {
    const chatId = msg.chat.id;

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js dengan `/encultra`!", { parse_mode: "Markdown" });
    }

    const file = msg.reply_to_message.document;

    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }

    const encryptedPath = path.join(__dirname, `ultra-encrypted-${file.file_name}`);
    let progressMessage = null;

    try {
        progressMessage = await bot.sendMessage(
            chatId,
            "```@naeldev\n" +
            "🔒 Starting Encrypted...\n" +
            ` ⚙️ Memulai (Hardened Ultra) (1%)\n` +
            ` ${createProgressBar(1)}\n` +
            "```\n",
            { parse_mode: "Markdown" }
        );

        const fileLink = await bot.getFileLink(file.file_id);
        await updateProgress(bot, chatId, progressMessage.message_id, 10, "Mengunduh");

        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(bot, chatId, progressMessage.message_id, 20, "Mengunduh Selesai");

        await updateProgress(bot, chatId, progressMessage.message_id, 30, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode tidak valid: ${syntaxError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 40, "Inisialisasi Hardened Ultra Obfuscation");

        const obfuscated = await JsConfuser.obfuscate(fileContent, getUltraObfuscationConfig());
        let obfuscatedCode = obfuscated.code || obfuscated;
        if (typeof obfuscatedCode !== "string") {
            throw new Error("Hasil obfuscation bukan string");
        }
        await updateProgress(bot, chatId, progressMessage.message_id, 60, "Transformasi Kode");

        try {
            new Function(obfuscatedCode);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 80, "Finalisasi Enkripsi");
        await fs.writeFile(encryptedPath, obfuscatedCode);

        await bot.sendDocument(chatId, encryptedPath, {
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
            filename: `ultra-enc-${file.file_name}`
        });

        await updateProgress(bot, chatId, progressMessage.message_id, 100, "Hardened Ultra Obfuscation Selesai");

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    } catch (error) {
        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        await bot.sendMessage(
            chatId,
            `❌ ${error.message || "Tidak diketahui"}`,
            { parse_mode: "Markdown" }
        );

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    }
});
    
    // enc max
command(/^\/encmax (\d+)$/, async (msg, match) => {
    const chatId = msg.chat.id;

    const intensity = Math.min(Math.max(1, parseInt(match[1], 10)), 10);

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js dengan `/encmax <intensity>`!", { parse_mode: "Markdown" });
    }

    const file = msg.reply_to_message.document;

    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }

    const encryptedPath = path.join(__dirname, `max-encrypted-${file.file_name}`);
    let progressMessage = null;

    try {
        progressMessage = await bot.sendMessage(
            chatId,
            "```@naeldev\n" +
            "🔒 Starting Encrypted...\n" +
            ` ⚙️ Memulai (Hardened Max Intensity ${intensity}) (1%)\n` +
            " " + createProgressBar(1) + "\n" +
            "```\n",
            { parse_mode: "Markdown" }
        );

        const fileLink = await bot.getFileLink(file.file_id);
        await updateProgress(bot, chatId, progressMessage.message_id, 10, "Mengunduh");

        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(bot, chatId, progressMessage.message_id, 20, "Mengunduh Selesai");

        await updateProgress(bot, chatId, progressMessage.message_id, 30, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode tidak valid: ${syntaxError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 40, "Inisialisasi Hardened Max Obfuscation");

        const obfuscated = await JsConfuser.obfuscate(fileContent, getMaxObfuscationConfig(intensity));
        let obfuscatedCode = obfuscated.code || obfuscated;
        if (typeof obfuscatedCode !== "string") {
            throw new Error("Hasil obfuscation bukan string");
        }
        await updateProgress(bot, chatId, progressMessage.message_id, 60, "Transformasi Kode");

        try {
            new Function(obfuscatedCode);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 80, "Finalisasi Enkripsi");
        await fs.writeFile(encryptedPath, obfuscatedCode);

        await bot.sendDocument(chatId, encryptedPath, {
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
            filename: `max-enc-${file.file_name}`
        });

        await updateProgress(bot, chatId, progressMessage.message_id, 100, `Hardened Max (Intensity ${intensity}) Obfuscation Selesai`);

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    } catch (error) {
        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        await bot.sendMessage(
            chatId,
            `❌ ${error.message || "Tidak diketahui"}`,
            { parse_mode: "Markdown" }
        );

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    }
});

    // enc quantum
command(/^\/encquantum$/, async (msg) => {
    const chatId = msg.chat.id;

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js dengan `/encquantum`!", { parse_mode: "Markdown" });
    }

    const file = msg.reply_to_message.document;

    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }

    const encryptedPath = path.join(__dirname, `quantum-encrypted-${file.file_name}`);
    let progressMessage = null;

    try {
        progressMessage = await bot.sendMessage(
            chatId,
            "```@naeldev\n" +
            "🔒 Starting Encrypted...\n" +
            " ⚙️ Memulai (Quantum Vortex Encryption) (1%)\n" +
            " " + createProgressBar(1) + "\n" +
            "```\n",
            { parse_mode: "Markdown" }
        );

        const fileLink = await bot.getFileLink(file.file_id);
        await updateProgress(bot, chatId, progressMessage.message_id, 10, "Mengunduh");

        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(bot, chatId, progressMessage.message_id, 20, "Mengunduh Selesai");

        await updateProgress(bot, chatId, progressMessage.message_id, 30, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode awal tidak valid: ${syntaxError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 40, "Inisialisasi Quantum Vortex Encryption");

        const obfuscatedCode = await obfuscateQuantum(fileContent);
        await updateProgress(bot, chatId, progressMessage.message_id, 60, "Transformasi Kode");

        try {
            new Function(obfuscatedCode);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 80, "Finalisasi Enkripsi");
        await fs.writeFile(encryptedPath, obfuscatedCode);

        await bot.sendDocument(chatId, encryptedPath, {
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
            filename: `quantum-enc-${file.file_name}`
        });

        await updateProgress(bot, chatId, progressMessage.message_id, 100, "Quantum Vortex Encryption Selesai");

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    } catch (error) {
        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        await bot.sendMessage(
            chatId,
            `❌ ${error.message || "Tidak diketahui"}`,
            { parse_mode: "Markdown" }
        );

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    }
});

    // encx
command(/^\/encx$/, async (msg) => {
    const chatId = msg.chat.id;

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js dengan `/encx`!", { parse_mode: "Markdown" });
    }

    const file = msg.reply_to_message.document;

    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }

    const encryptedPath = path.join(__dirname, `x-encrypted-${file.file_name}`);
    let progressMessage = null;

    try {
        progressMessage = await bot.sendMessage(
            chatId,
            "```@naeldev\n" +
            "🔒 Starting Encrypted...\n" +
            " ⚙️ Memulai (Hardened X Invisible) (1%)\n" +
            " " + createProgressBar(1) + "\n" +
            "```\n",
            { parse_mode: "Markdown" }
        );

        const fileLink = await bot.getFileLink(file.file_id);
        await updateProgress(bot, chatId, progressMessage.message_id, 10, "Mengunduh");

        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(bot, chatId, progressMessage.message_id, 20, "Mengunduh Selesai");

        await updateProgress(bot, chatId, progressMessage.message_id, 30, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode awal tidak valid: ${syntaxError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 40, "Inisialisasi Hardened X Obfuscation");

        const obfuscated = await JsConfuser.obfuscate(fileContent, getXObfuscationConfig());
        let obfuscatedCode = obfuscated.code || obfuscated;
        if (typeof obfuscatedCode !== "string") {
            throw new Error("Hasil obfuscation bukan string");
        }

        const encodedInvisible = encodeInvisible(obfuscatedCode);
        const finalCode = `
        (function(){
            function decodeInvisible(encodedText) {
                if (!encodedText.startsWith('\u200B')) return encodedText;
                try {
                    return Buffer.from(encodedText.slice(1), 'base64').toString('utf-8');
                } catch (e) {
                    return encodedText;
                }
            }
            try {
                const hiddenCode = "${encodedInvisible}";
                const decodedCode = decodeInvisible(hiddenCode);
                if (!decodedCode || decodedCode === hiddenCode) throw new Error("Decoding failed");
                eval(decodedCode);
            } catch (e) {
                console.error("Execution error:", e);
            }
        })();
        `;
        await updateProgress(bot, chatId, progressMessage.message_id, 60, "Transformasi Kode");

        try {
            new Function(finalCode);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 80, "Finalisasi Enkripsi");
        await fs.writeFile(encryptedPath, finalCode);

        await bot.sendDocument(chatId, encryptedPath, {
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
            filename: `x-enc-${file.file_name}`
        });

        await updateProgress(bot, chatId, progressMessage.message_id, 100, "Hardened X Invisible Obfuscation Selesai");

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    } catch (error) {
        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        await bot.sendMessage(
            chatId,
            `❌ ${error.message || "Tidak diketahui"}`,
            { parse_mode: "Markdown" }
        );

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    }
});
    
    // enc nova
command(/^\/encnova$/, async (msg) => {
    const chatId = msg.chat.id;

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js dengan `/encnova`!", { parse_mode: "Markdown" });
    }

    const file = msg.reply_to_message.document;

    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }

    const encryptedPath = path.join(__dirname, `nova-encrypted-${file.file_name}`);
    let progressMessage = null;

    try {
        progressMessage = await bot.sendMessage(
            chatId,
            "```@naeldev\n" +
            "🔒 Starting Encrypted...\n" +
            " ⚙️ Memulai (Nova Dynamic) (1%)\n" +
            " " + createProgressBar(1) + "\n" +
            "```\n",
            { parse_mode: "Markdown" }
        );

        const fileLink = await bot.getFileLink(file.file_id);
        await updateProgress(bot, chatId, progressMessage.message_id, 10, "Mengunduh");

        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(bot, chatId, progressMessage.message_id, 20, "Mengunduh Selesai");

        await updateProgress(bot, chatId, progressMessage.message_id, 30, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode awal tidak valid: ${syntaxError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 40, "Inisialisasi Nova Dynamic Obfuscation");

        const obfuscated = await JsConfuser.obfuscate(fileContent, getNovaObfuscationConfig());
        let obfuscatedCode = obfuscated.code || obfuscated;
        if (typeof obfuscatedCode !== "string") {
            throw new Error("Hasil obfuscation bukan string");
        }
        await updateProgress(bot, chatId, progressMessage.message_id, 60, "Transformasi Kode");

        try {
            new Function(obfuscatedCode);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 80, "Finalisasi Enkripsi");
        await fs.writeFile(encryptedPath, obfuscatedCode);

        await bot.sendDocument(chatId, encryptedPath, {
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
            filename: `nova-enc-${file.file_name}`
        });

        await updateProgress(bot, chatId, progressMessage.message_id, 100, "Nova Dynamic Obfuscation Selesai");

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    } catch (error) {
        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        await bot.sendMessage(
            chatId,
            `❌ ${error.message || "Tidak diketahui"}`,
            { parse_mode: "Markdown" }
        );

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    }
});

    // enc nebula
command(/^\/encnebula$/, async (msg) => {
    const chatId = msg.chat.id;

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js dengan `/encnebula`!", { parse_mode: "Markdown" });
    }

    const file = msg.reply_to_message.document;

    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }

    const encryptedPath = path.join(__dirname, `nebula-encrypted-${file.file_name}`);
    let progressMessage = null;

    try {
        progressMessage = await bot.sendMessage(
            chatId,
            "```@naeldev\n" +
            "🔒 Starting Encrypted...\n" +
            " ⚙️ Memulai (Nebula Polymorphic Storm) (1%)\n" +
            " " + createProgressBar(1) + "\n" +
            "```\n",
            { parse_mode: "Markdown" }
        );

        const fileLink = await bot.getFileLink(file.file_id);
        await updateProgress(bot, chatId, progressMessage.message_id, 10, "Mengunduh");

        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(bot, chatId, progressMessage.message_id, 20, "Mengunduh Selesai");

        await updateProgress(bot, chatId, progressMessage.message_id, 30, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode awal tidak valid: ${syntaxError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 40, "Inisialisasi Nebula Polymorphic Storm");

        const obfuscated = await JsConfuser.obfuscate(fileContent, getNebulaObfuscationConfig());
        let obfuscatedCode = obfuscated.code || obfuscated;
        if (typeof obfuscatedCode !== "string") {
            throw new Error("Hasil obfuscation bukan string");
        }
        await updateProgress(bot, chatId, progressMessage.message_id, 60, "Transformasi Kode");

        try {
            new Function(obfuscatedCode);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 80, "Finalisasi Enkripsi");
        await fs.writeFile(encryptedPath, obfuscatedCode);

        await bot.sendDocument(chatId, encryptedPath, {
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
            filename: `nebula-enc-${file.file_name}`
        });

        await updateProgress(bot, chatId, progressMessage.message_id, 100, "Nebula Polymorphic Storm Selesai");

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    } catch (error) {
        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        await bot.sendMessage(
            chatId,
            `❌ ${error.message || "Tidak diketahui"}`,
            { parse_mode: "Markdown" }
        );

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    }
});

    // enc siu
command(/^\/encsiu$/, async (msg) => {
    const chatId = msg.chat.id;

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js dengan `/encsiu`!", { parse_mode: "Markdown" });
    }

    const file = msg.reply_to_message.document;

    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }

    const encryptedPath = path.join(__dirname, `siucalcrick-encrypted-${file.file_name}`);
    let progressMessage = null;

    try {
        progressMessage = await bot.sendMessage(
            chatId,
            "```@naeldev\n" +
            "🔒 Starting Encrypted...\n" +
            " ⚙️ Memulai (Calcrick Chaos Core) (1%)\n" +
            " " + createProgressBar(1) + "\n" +
            "```\n",
            { parse_mode: "Markdown" }
        );

        const fileLink = await bot.getFileLink(file.file_id);
        await updateProgress(bot, chatId, progressMessage.message_id, 10, "Mengunduh");

        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(bot, chatId, progressMessage.message_id, 20, "Mengunduh Selesai");

        await updateProgress(bot, chatId, progressMessage.message_id, 30, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode awal tidak valid: ${syntaxError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 40, "Inisialisasi Calcrick Chaos Core");

        const obfuscated = await JsConfuser.obfuscate(fileContent, getSiuCalcrickObfuscationConfig());
        let obfuscatedCode = obfuscated.code || obfuscated;
        if (typeof obfuscatedCode !== "string") {
            throw new Error("Hasil obfuscation bukan string");
        }
        await updateProgress(bot, chatId, progressMessage.message_id, 60, "Transformasi Kode");

        try {
            new Function(obfuscatedCode);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 80, "Finalisasi Enkripsi");
        await fs.writeFile(encryptedPath, obfuscatedCode);

        await bot.sendDocument(chatId, encryptedPath, {
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
            filename: `siucalcrick-enc-${file.file_name}`
        });

        await updateProgress(bot, chatId, progressMessage.message_id, 100, "Calcrick Chaos Core Selesai");

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    } catch (error) {
        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        await bot.sendMessage(
            chatId,
            `❌ ${error.message || "Tidak diketahui"}`,
            { parse_mode: "Markdown" }
        );

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    }
});

    // enc locked
command(/^\/enclocked (\d+)$/, async (msg, match) => {
    const chatId = msg.chat.id;

    const days = match[1];
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(days));
    const expiryFormatted = expiryDate.toLocaleDateString();

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js dengan `/enclocked [1-365]`!", { parse_mode: "Markdown" });
    }

    const file = msg.reply_to_message.document;

    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }

    const encryptedPath = path.join(__dirname, `locked-encrypted-${file.file_name}`);
    let progressMessage = null;

    try {
        progressMessage = await bot.sendMessage(
            chatId,
            "```@naeldev\n" +
            "🔒 Starting Encrypted...\n" +
            " ⚙️ Memulai (Time-Locked Encryption) (1%)\n" +
            " " + createProgressBar(1) + "\n" +
            "```\n",
            { parse_mode: "Markdown" }
        );

        const fileLink = await bot.getFileLink(file.file_id);
        await updateProgress(bot, chatId, progressMessage.message_id, 10, "Mengunduh");

        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(bot, chatId, progressMessage.message_id, 20, "Mengunduh Selesai");

        await updateProgress(bot, chatId, progressMessage.message_id, 30, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode awal tidak valid: ${syntaxError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 40, "Inisialisasi Time-Locked Encryption");

        const obfuscatedCode = await obfuscateTimeLocked(fileContent, days);
        await updateProgress(bot, chatId, progressMessage.message_id, 60, "Transformasi Kode");

        try {
            new Function(obfuscatedCode);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 80, "Finalisasi Enkripsi");
        await fs.writeFile(encryptedPath, obfuscatedCode);

        await bot.sendMessage(
            chatId,
            `⏰ Masa aktif: ${days} hari\n` +
            `(Kadaluwarsa: ${expiryFormatted})`,
            { parse_mode: "Markdown" }
        );

        await bot.sendDocument(chatId, encryptedPath, {
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
            filename: `locked-enc-${file.file_name}`
        });

        await updateProgress(bot, chatId, progressMessage.message_id, 100, "Time-Locked Encryption Selesai");

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    } catch (error) {
        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        await bot.sendMessage(
            chatId,
            `❌ ${error.message || "Tidak diketahui"}`,
            { parse_mode: "Markdown" }
        );

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
        }
    }
});

    // deobfuscate
command(/^\/deobfuscate$/, async (msg) => {
    const chatId = msg.chat.id;

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js yang diobfuscate dengan `/deobfuscate`!", { parse_mode: "Markdown" });
    }

    const file = msg.reply_to_message.document;

    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }

    const deobfuscatedPath = path.join(__dirname, `Cracked-By-@naeldev-${file.file_name}`);
    let progressMessage = null;

    try {
        progressMessage = await bot.sendMessage(
            chatId,
            "```@naeldev\n" +
            "🔒 Starting Decrypted...\n" +
            ` ⚙️ Memulai Deobfuscation (1%)\n` +
            ` ${createProgressBar(1)}\n` +
            "```\n",
            { parse_mode: "Markdown" }
        );

        const fileLink = await bot.getFileLink(file.file_id);
        await updateProgress(bot, chatId, progressMessage.message_id, 10, "Mengunduh");

        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(bot, chatId, progressMessage.message_id, 20, "Mengunduh Selesai");

        await updateProgress(bot, chatId, progressMessage.message_id, 30, "Memvalidasi Kode Awal");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode awal tidak valid: ${syntaxError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 40, "Memulai Deobfuscation");
        const result = await webcrack(fileContent);
        let deobfuscatedCode = result.code;

        let bundleInfo = "";
        if (result.bundle) {
            bundleInfo = "// Detected as bundled code (e.g., Webpack/Browserify)\n";
        }

        if (!deobfuscatedCode || typeof deobfuscatedCode !== "string" || deobfuscatedCode.trim() === fileContent.trim()) {
            deobfuscatedCode = `${bundleInfo}// Webcrack Tidak Dapat Mendekode Sepenuhnya Atau Hasil Invalid\n${fileContent}`;
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 60, "Memvalidasi Kode Hasil");
        let isValid = true;
        try {
            new Function(deobfuscatedCode);
        } catch (syntaxError) {
            deobfuscatedCode = `${bundleInfo}// Kesalahan validasi: ${syntaxError.message}\n${deobfuscatedCode}`;
            isValid = false;
        }

        await updateProgress(bot, chatId, progressMessage.message_id, 80, "Menyimpan Hasil");
        await fs.writeFile(deobfuscatedPath, deobfuscatedCode);

        await bot.sendDocument(chatId, deobfuscatedPath, {
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
            filename: `Cracked-By-@naeldev-${file.file_name}`
        });

        await updateProgress(bot, chatId, progressMessage.message_id, 100, "Cracked Selesai");

        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        if (await fs.pathExists(deobfuscatedPath)) {
            await fs.unlink(deobfuscatedPath);
        }
    } catch (error) {
        try {
            if (progressMessage && progressMessage.message_id) {
                await bot.deleteMessage(chatId, progressMessage.message_id);
            }
        } catch (e) {
        }

        await bot.sendMessage(
            chatId,
            `❌ ${error.message || "Tidak diketahui"}`,
            { parse_mode: "Markdown" }
        );

        if (await fs.pathExists(deobfuscatedPath)) {
            await fs.unlink(deobfuscatedPath);
        }
    }
});
}