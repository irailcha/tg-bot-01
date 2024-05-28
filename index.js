import telegramAPI from "node-telegram-bot-api";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import "dotenv/config";

const PORT = process.env.PORT;
const bot = new telegramAPI(process.env.TOKEN, {
  webHook: {
    port: PORT,
  },
  request: {
    agentOptions: {
      keepAlive: true,
      family: 4,
    },
    url: "https://api.telegram.org",
  },
});

bot.setWebHook(`${process.env.WEB_APP_URL}/bot${process.env.TOKEN}`);

const app = express();
app.use(express.json());
app.use(cors());

app.use(bodyParser.json());

app.post(`/bot${process.env.TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
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
    await bot.sendMessage(
      chatId,
      "Hello! To place an order click on the button Store"
    );
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

app.post("/", async (req, res) => {
  const { products, totalPrice, queryid } = req.body;
  try {
    await bot.answerWebAppQuery(queryid, {
      type: "article",
      id: queryid,
      title: "success purchase ",
      input_message_content: {
        message_text: `You bought a product, your total price is amount ${totalPrice}. Your product list ${products
          .map((item) => item.title)
          .join("")}`,
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

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
