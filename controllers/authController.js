const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  const { first_name, last_name, email, password } = req.body;
  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ message: "all fieled are required" });
  }
  const foundUser = await User.findOne({ email: email }).exec();
  if (foundUser) {
    return res.status(401).json({ message: "user already exist" });
  }
  const hashedPasword = await bcrypt.hash(password, 10);
  const user = await User.create({
    first_name,
    last_name,
    email,
    password: hashedPasword,
  });
  const accessToken = jwt.sign(
    {
      UserInfo: {
        id: user._id,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: 30 }
  );
  const refreshToken = jwt.sign(
    {
      UserInfo: {
        id: user._id,
      },
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  res.cookie("jwt", refreshToken, {
    httpOnly: true, //only by web server
    secure: true, //https
    samesite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
  res.json({
    accessToken,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    password: user.password,
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "all fieled are required" });
  }
  const foundUser = await User.findOne({ email: email }).exec();
  if (!foundUser) {
    return res.status(401).json({ message: "user daes not exist" });
  }
  const match = await bcrypt.compare(password, foundUser.password);

  if (!match) {
    return res.json({ message: "password is wrong" });
  }

  const accessToken = jwt.sign(
    {
      UserInfo: {
        id: foundUser._id,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: 30 }
  );

  const refreshToken = jwt.sign(
    {
      UserInfo: {
        id: foundUser._id,
      },
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  res.cookie("jwt", refreshToken, {
    httpOnly: true, //only by web server
    secure: true, //https
    samesite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  res.json({
    accessToken,
    email: foundUser.email,
  });
};

const refresh = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });
  const refreshToken = cookies.jwt;
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbiden" });
      const foundUser = await User.findById(decoded.UserInfo.id).exec();
      if (!foundUser) return res.status(401).json({ message: "Unauthorized" });
      const accessToken = jwt.sign(
        {
          UserInfo: {
            id: foundUser._id,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: 20 }
      );
      res.json({ accessToken });
    }
  );
};

const logout = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.status(204); //no content
  res.clearCookie("jwt", {
    httpOnly: true,
    samesite: "none",
    secure: true,
  });

  res.json({ message: "logout seccess" });
};

module.exports = {
  register,
  login,
  refresh,
  logout,
};
