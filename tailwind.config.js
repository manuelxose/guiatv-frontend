module.exports = {
  prefix: "",

  content: ["./src/**/*.{html,ts}"],

  theme: {
    extend: {},
  },
  variants: {
    extend: {
      display: ["first"],
      content: ["before"],
    },
  },

  plugins: [
    require("tailwindcss-icons"),
    require("tailwindcss-textshadow"),
    require("tailwind-scrollbar-hide"),
    require("tailwind-scrollbar"),
    // ...
  ],
};
