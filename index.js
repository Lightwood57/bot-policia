require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  AttachmentBuilder,
  EmbedBuilder,
} = require("discord.js");
const { createCanvas, loadImage } = require("@napi-rs/canvas");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,      // ADICIONE
    GatewayIntentBits.MessageContent,     // ADICIONE
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});
client.once("clientReady", () => {
  console.log(`🚔 Bot da Polícia online como ${client.user.tag}`);
});

function limitText(text, max) {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

async function makePoliceWelcomeImage({ avatarUrl, username, memberCount, guildName }) {
  const width = 900;
  const height = 280;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // ===== Fundo Azul Escuro =====
  ctx.fillStyle = "#0a1a2f";
  ctx.fillRect(0, 0, width, height);

  // ===== Faixa Vermelha (giroflex) =====
  ctx.fillStyle = "#b30000";
  ctx.fillRect(0, 0, width, 60);

  ctx.fillStyle = "#1e90ff";
  ctx.fillRect(0, 60, width, 5);

  // ===== Caixa principal =====
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(30, 85, width - 60, 170);

  // ===== Avatar circular =====
  const avatarSize = 160;
  const avatarX = 40;
  const avatarY = 105;

  try {
    const avatar = await loadImage(avatarUrl);

    ctx.save();
    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2,
      0,
      Math.PI * 2
    );
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    ctx.strokeStyle = "#1e90ff";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2 + 3,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  } catch {}

  // ===== Textos =====
  ctx.fillStyle = "#ffffff";
ctx.font = "bold 30px Arial";
ctx.fillText("BEM-VINDO(A) À CORPORAÇÃO", 230, 135);

ctx.fillStyle = "#1e90ff";
ctx.font = "bold 28px Arial";
ctx.fillText(limitText(username.toUpperCase(), 20), 230, 175);

ctx.fillStyle = "#ffffff";
ctx.font = "22px Arial";
ctx.fillText(`Servidor: ${limitText(guildName, 28)}`, 230, 210);

ctx.fillStyle = "#cccccc";
ctx.font = "20px Arial";
ctx.fillText(`Recruta nº ${memberCount}`, 230, 240);
}

client.on("guildMemberAdd", async (member) => {
  const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
  const autoRoleId = process.env.AUTO_ROLE_ID;
  const rulesChannelId = process.env.RULES_CHANNEL_ID;

  // ===== Cargo automático =====
  if (autoRoleId) {
    try {
      await member.roles.add(autoRoleId);
    } catch {
      console.log("Erro ao dar cargo.");
    }
  }

  // ===== DM =====
  try {
    await member.send(
      `🚔 **ALISTAMENTO CONFIRMADO**\n\n` +
      `Recruta ${member.user.username}, seja bem-vindo(a) a ${member.guild.name}.\n` +
      `📜 Leia as regras em <#${rulesChannelId}>.\n\n` +
      `Boa sorte em sua jornada!`
    );
  } catch {}

  // ===== Canal =====
  const channel = member.guild.channels.cache.get(welcomeChannelId);
  if (!channel) return;

  const memberCount = member.guild.memberCount;
  const avatarUrl = member.user.displayAvatarURL({ extension: "png", size: 256 });

  const imageBuffer = await makePoliceWelcomeImage({
    avatarUrl,
    username: member.user.username,
    memberCount,
    guildName: member.guild.name,
  });

  const attachment = new AttachmentBuilder(imageBuffer, { name: "policia.png" });

  const embed = new EmbedBuilder()
    .setColor("#1e90ff")
    .setTitle("🚨 NOVO RECRUTA")
    .setDescription(
      `O recruta ${member} acaba de ingressar na corporação.\n` +
      `📊 Total de membros: **${memberCount}**`
    )
    .setImage("attachment://policia.png")
    .setFooter({ text: "Polícia Militar • Servir e Proteger" });

  await channel.send({ embeds: [embed], files: [attachment] });
});
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!testarboasvindas") {

    const avatarUrl = message.author.displayAvatarURL({ extension: "png", size: 256 });
    const memberCount = message.guild.memberCount;

    const imageBuffer = await makePoliceWelcomeImage({
      avatarUrl,
      username: message.author.username,
      memberCount,
      guildName: message.guild.name,
    });

    const attachment = new AttachmentBuilder(imageBuffer, { name: "policia.png" });

    const embed = new EmbedBuilder()
      .setColor("#1e90ff")
      .setTitle("🚨 TESTE DE BOAS-VINDAS")
      .setDescription(
        `Simulação para ${message.author}\n` +
        `📊 Total de membros: **${memberCount}**`
      )
      .setImage("attachment://policia.png")
      .setFooter({ text: "Sistema de Boas-Vindas • Polícia Militar" });

    await message.channel.send({ embeds: [embed], files: [attachment] });
  }
});
client.login(process.env.DISCORD_TOKEN);