import Cookies from "js-cookie";

const COOKIE_OPTIONS = { path: "/", sameSite: "Lax" };

export const setCookie = (name, value, days) => {
  const options = { ...COOKIE_OPTIONS };
  if (typeof days === "number") {
    options.expires = days;
  }
  Cookies.set(name, value, options);
};

export const getCookie = (name) => {
  return Cookies.get(name) || null;
};

export const removeCookie = (name) => {
  Cookies.remove(name, COOKIE_OPTIONS);
};
