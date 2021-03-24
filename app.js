const express = require("express");
const prisma = require("@prisma/client");
const app = express();
const PORT = 3000;
const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";
const client = new prisma.PrismaClient();
const morgan = require("morgan");
const { compare, hash } = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const cookieParser = require("cookie-parser");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieParser());

const passportOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: ACCESS_SECRET,
};

passport.use(
  new JwtStrategy(passportOptions, async (jwtPayload, done) => {
    try {
      const user = await client.users.findUnique({
        where: {
          id: jwtPayload.sub,
        },
        select: {
          id: true,
          email: true,
          firstname: true,
          secondname: true,
        },
      });
      if (!user) throw new Error("not such user exists");
      return done(null, user);
    } catch (error) {
      console.log(error);
      return done(error, false);
    }
  })
);

app.use(passport.initialize());

app.get("/", (req, res) => {
  res.send("Heya there!");
});

app.post("/refresh_token", async (req, res) => {
  try {
    if (!req.cookies.rtok) throw new Error("no rtok");
    const jwtPayload = jwt.verify(req.cookies.rtok, REFRESH_SECRET);
    const user = await client.users.findUnique({
      where: {
        id: jwtPayload.sub,
      },
      select: {
        id: true,
        email: true,
        firstname: true,
        secondname: true,
      },
    });
    if (!user) throw new Error("no such user");
    const accessToken = jwt.sign({ sub: user.id }, ACCESS_SECRET, {
      expiresIn: "20s",
    });
    const refreshToken = jwt.sign({ sub: user.id }, REFRESH_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("rtok", refreshToken, { httpOnly: true });
    res.json({ accessToken: accessToken });

    //provide refersh token
    //receive access token
    // and new access token
  } catch (error) {
    res.status(401).json({ ok: false });
  }
});
app.get(
  "/users",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    console.log(req.user);
    client.users
      .findMany({
        select: { id: true, firstname: true, secondname: true, email: true },
      })
      .then((users) => {
        res.json(users);
      });
  }
);

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

app.post("/login", async (req, res) => {
  try {
    const user = await client.users.findUnique({
      where: { email: req.body.email },
    });
    if (!user) throw new Error("Email is not registered!");
    const passwordsMatch = await compare(req.body.password, user.password);
    if (!passwordsMatch) throw new Error("Email or password is invalid");

    const accessToken = jwt.sign({ sub: user.id }, ACCESS_SECRET, {
      expiresIn: "20s",
    });
    const refreshToken = jwt.sign({ sub: user.id }, REFRESH_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("rtok", refreshToken, { httpOnly: true });
    res.json({ accessToken: accessToken });
    console.log(accessToken);
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

app.post(
  "/dolist",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const userId = req.user.id;
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
  }
);

app.listen(PORT, () => {
  console.log("Server is listening on 3000!");
});
