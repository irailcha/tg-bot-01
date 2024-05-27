import TelegramBot from "node-telegram-bot-api";
import express from "express";
import cors from "cors";
import "dotenv/config";
// replace the value below with the Telegram token you receive from @BotFather

const bot = new TelegramBot(process.env.TOKEN, { polling: true });

const app = express();
app.use(express.json());
app.use(cors());

bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];

  bot.sendMessage(chatId, resp);
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  console.log("Received message:", msg);

  if (text === "/start") {
    console.log("Sending start messages...");
    await bot.sendMessage(chatId, "Привіт", {
      reply_markup: {
        keyboard: [
          [
            {
              text: "Заповни форму",
              web_app: { url: `${process.env.WEB_APP_URL}/form` },
            },
          ],
        ],
      },
    });
    await bot.sendMessage(chatId, "Зробити замовлення", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Натисни тут", web_app: { url: process.env.WEB_APP_URL } }],
        ],
      },
    });
  }

  if (msg?.web_app_data?.data) {
    try {
      const data = JSON.parse(msg.web_app_data.data);
      bot.sendMessage(chatId, "Thank you for an answer, " + data?.name);
      bot.sendMessage(chatId, "Your country: " + data?.country);
      bot.sendMessage(chatId, "Your city: " + data?.city);

      setTimeout(() => {
        bot.sendMessage(chatId, "Your answer will be published in this chat");
      }, 2000);
    } catch (error) {
      console.error("Error parsing web_app_data:", error);
      bot.sendMessage(chatId, "There was an error processing your data.");
    }
  }
});

app.post("/", async function (req, res) {
  const { products, total, queryid } = req.body;
  try {
    await bot.answerWebAppQuery(queryid, {
      type: "article",
      id: queryid,
      title: "success purchase ",
      input_message_content: {
        message_text: `You bought a product, your total price is amount ${total}. Your product list ${products}`,
      },
    });
    return res.status(200).json({});
  } catch (error) {
    await bot.answerWebAppQuery(queryid, {
      type: "article",
      id: queryid,
      title: "unsuccess purchase ",
      input_message_content: {
        message_text: `Sorry, could not buy the product`,
      },
    });
    return res.status(500).json({});
  }
});

app.listen(process.env.PORT, () =>
  console.log(`Server started on port ${process.env.PORT}`)
);
