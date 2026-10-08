const chalk = require('chalk');

async function startBot(bot) {
  console.clear();
  console.log('• Connecting to Telegram API...');
  await new Promise(r => setTimeout(r, 800));

  console.log('• Authenticating credentials...');
  await new Promise(r => setTimeout(r, 600));

  console.log('• Initializing bot services...\n');
  await new Promise(r => setTimeout(r, 600));

  const info = await bot.getMe();
  console.clear();

  await new Promise(r => setTimeout(r, 1000));
  console.clear();

  console.log(
    chalk.cyan.bold(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       Naeri Asistant
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  );
  console.log(
    chalk.white.bold(`\n     Creator: @hamzanjal80
       Version: 5.0.0
      Type: JavaScript\n`)
  );

  console.log(chalk.gray('\nType a Command...'));
}

module.exports = startBot;