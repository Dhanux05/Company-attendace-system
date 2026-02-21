import Cookies from "js-cookie";

const DEFAULT_DAYS = 7;
const COOKIE_OPTIONS = { path: "/", sameSite: "Lax" };

export const setCookie = (name, value, days = DEFAULT_DAYS) => {
  Cookies.set(name, value, { ...COOKIE_OPTIONS, expires: days });
};

export const getCookie = (name) => {
  return Cookies.get(name) || null;
};

export const removeCookie = (name) => {
  Cookies.remove(name, COOKIE_OPTIONS);
};
