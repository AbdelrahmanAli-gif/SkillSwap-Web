import { createContext } from "react";

export const AuthContext = createContext({
  user: null,
  loading: false,
  error: null,
  signUp: async function () {},
  logIn: async function () {},
  logOut: async function () {},
  signInWithGoogle: async function () {},
});
