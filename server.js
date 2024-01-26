import express from "express"
import { getSpellingBee, getCrossword } from "./scrape.js"
const app = express()

app.use(express.static("public"))

app.get("/api/crossword", async (_, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(await getCrossword());
})

app.get("/api/spellingbee", async (_, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(await getSpellingBee());
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}.`));
