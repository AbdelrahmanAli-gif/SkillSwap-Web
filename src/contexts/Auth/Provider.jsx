import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../../firebase";
import { AuthContext } from "./context";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("@onAuthStateChanged ---- user =", user);
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function setDisplayName(userObject, name) {
    try {
      console.log("@setDisplayName() ---- will try updating displayName of user =", user?.email, "with value =", name);
      const res = await updateProfile(userObject, { displayName: name });
      console.log("@setDisplayName() ---- updating displayName success ---- res =", res);
    } catch (error) {
      console.log("@setDisplayName() ---- updating displayName failed ---- res =", error);
      throw error;
    }
  }

  async function signUp(email, password, name) {
    try {
      setError(null);
      setLoading(true);
      // setUser(null);
      const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
      console.log("@signUp() @AuthProvider ---- sign up success ---- userCredentials =", userCredentials);
      // set user and end loading
      const { user: registeredUser } = userCredentials;
      await setDisplayName(registeredUser, name);
      // setUser(registeredUser);
      // setUser((({ user:registeredUser } = userCredentials), registeredUser));
    } catch (error) {
      console.log("@signUp() @AuthProvider ---- sign up failure ---- error.code =", error.code, "---- error.message =", error.message);
      console.log("@signUp() @AuthProvider ---- sign up failure ---- error =", error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  }

  async function logIn(email, password) {
    try {
      setError(null);
      setLoading(true);
      // setUser(null);
      const userCredentials = await signInWithEmailAndPassword(auth, email, password);
      console.log("@logIn() @AuthProvider ---- log in success ---- userCredentials =", userCredentials);
      // setUser(userCredentials.user);
      // setUser((({ user:loggedUser } = userCredentials), loggedUser));
    } catch (error) {
      console.log("@logIn() @AuthProvider ---- log in failure ---- error.code =", error.code, "---- error.message =", error.message);
      console.log("@logIn() @AuthProvider ---- log in failure ---- error =", error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  }

  async function logOut() {
    try {
      setError(null);
      setLoading(true);
      await signOut(auth);
      console.log("@logOut() @AuthProvider ---- log out success");
      // setUser(null);
    } catch (error) {
      console.log("@logOut() @AuthProvider ---- log out failure ---- error.code =", error.code, "---- error.message =", error.message);
      console.log("@logOut() @AuthProvider ---- log out failure ---- error =", error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    try {
      console.log("@signInWithGoogle ---- will start signin with google");
      setLoading(true);
      setError(null);
      // setUser(null);
      const googleProvider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, googleProvider);
      console.log("@signInWithGoogle ---- signin with google success ---- result =", result);
      console.log("@signInWithGoogle ---- signin with google success ---- user =", result.user);
      // setUser(result.user);
    } catch (error) {
      console.log("@signInWithGoogle ---- signin with google failed ---- error =", error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  }

  function getErrorMessage(errorCode) {
    switch (errorCode) {
      case "auth/popup-closed-by-user":
        return "Sign-in was cancelled";
      case "auth/popup-blocked":
        return "Popup was blocked by browser";
      case "auth/cancelled-popup-request":
        return "Sign-in was cancelled";
      case "auth/network-request-failed":
        return "Network error occurred";
      case "auth/account-exists-with-different-credential":
        return "Account exists with different sign-in method";
      case "auth/user-not-found":
        return "No account found with this email";
      case "auth/wrong-password":
        return "Incorrect password";
      default:
        return "An error occurred";
    }
  }

  return <AuthContext.Provider value={{ user, loading, error, signUp, logIn, logOut, signInWithGoogle }}>{children}</AuthContext.Provider>;
}
