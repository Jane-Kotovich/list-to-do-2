const express = require("express");
const prisma = require("@prisma/client");
const app = express();
const PORT = 3000;
const client = new prisma.PrismaClient();
const morgan = require("morgan");
const { compare, hash } = require("bcryptjs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("Heya there!");
});
app.get("/users", (req, res) => {
  client.users
    .findMany({
      select: { id: true, firstname: true, secondname: true, email: true },
    })
    .then((users) => {
      res.json(users);
    });
});

app.post("/users", async (req, res) => {
  try {
    const hashedPassword = await hash(req.body.password, 10);
    const user = await client.users.create({
      data: {
        email: req.body.email,
        firstname: req.body.firstname,
        secondname: req.body.secondname,
        password: hashedPassword,
        active: true,
      },
    });
    if (!user) throw new Error("Email taken");
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(401).json({ ok: false, error: error.message });
  }
});

app.post("/users", (req, res) => {
  console.log(req.body);
  client.users
    .create({
      data: {
        email: req.body.email,
        firstname: req.body.firstname,
        secondname: req.body.secondname,
        password: req.body.password,
        active: true,
      },
    })
    .then((users) => {
      res.json(users);
    });
});

app.get("/users/:id", (req, res) => {
  const userId = req.params.id;
  client.users.findUnique({ where: { id: Number(userId) } }).then((user) => {
    res.json(user);
  });
});

app.get("/dolist", (req, res) => {
  client.list_to_do.findMany().then((item_to_do) => {
    res.json(item_to_do);
  });
});

app.post("/dolist", (req, res) => {
  // pretend we obtain userId from the JWT
  const userId = 1;
  client.list_to_do
    .create({
      data: {
        item_to_do: req.body.item_to_do,
        authorId: userId,
        done: false,
      },
    })
    .then((list_to_do) => {
      client.list_to_do
        .findMany({
          where: { id: list_to_do.id },
          include: { author: true },
        })
        .then((itemsToDoWithUser) => {
          res.json(itemsToDoWithUser);
        });
    });
});

app.listen(PORT, () => {
  console.log("Server is listening on 3000!");
});
