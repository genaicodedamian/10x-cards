const primaryColors = {
  orange: "orange",
  blue: "blue",
  rose: "rose",
  green: "green",
  violet: "violet",
  yellow: "yellow",
  zinc: "zinc",
  slate: "slate",
  stone: "stone",
  gray: "gray",
  neutral: "neutral",
  red: "red",
};

const primaryColorCookie = document.cookie
  .split("; ")
  .find((row) => row.startsWith("primaryColor="))
  ?.split("=")[1];

const primaryColor = primaryColorCookie || "orange";

const themeCookie = document.cookie
  .split("; ")
  .find((row) => row.startsWith("theme="))
  ?.split("=")[1];

if (!themeCookie && window.matchMedia("(prefers-color-scheme: dark)").matches) {
  document.documentElement.classList.add("dark");
  document.documentElement.classList.add(`theme-${primaryColor}`);
} else if (themeCookie === "dark") {
  document.documentElement.classList.add("dark");
  document.documentElement.classList.add(`theme-${primaryColor}`);
} else if (themeCookie === "light") {
  document.documentElement.classList.remove("dark");
  document.documentElement.classList.add(`theme-${primaryColor}`);
} else {
  document.documentElement.classList.remove("dark");
  document.documentElement.classList.add(`theme-${primaryColor}`);
} 