module.exports = {
  prefix: "",

  content: ["./src/**/*.{html,ts}"],

  theme: {
    extend: {
      animation: {
        fadeIn: "fadeIn .6s cubic-bezier(.74,.01,.81,.75)",
      },
      keyFrames: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        translate: {
          "-452": "-452px",
        },
      },
    },
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
