import jwt from "jsonwebtoken";

const ACCESS_EXPIRES = "15m";
const REFRESH_EXPIRES = "7d";

const ACCESS_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

type TokenPayload = {
  publicId: string;
};

/* ---------------- ACCESS TOKEN ---------------- */

export const generateAccessToken = (publicId: string) => {
  return jwt.sign({ publicId }, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  });
};

/* ---------------- REFRESH TOKEN ---------------- */

export const generateRefreshToken = (publicId: string) => {
  return jwt.sign({ publicId }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  });
};

/* ---------------- VERIFY ACCESS ---------------- */

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
};

/* ---------------- VERIFY REFRESH ---------------- */

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
};
