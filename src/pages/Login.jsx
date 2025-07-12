import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import logo from "../assets/images/skill.png"
import { validateEmail, validatePassword } from "../utils/validation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../firebase"

export const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailValidError, setEmailValidError] = useState("")
  const [passwordValidError, setPasswordValidError] = useState("")
  const [triedSubmit, setTriedSubmit] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setTriedSubmit(true)

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user
        // ...
        alert("Login successful")
      })
      .catch((error) => {
        const errorCode = error.code
        const errorMessage = error.message
        alert("Login failed, " + errorMessage)
      })
  }

  useEffect(() => {
    if (triedSubmit) {
      setEmailValidError(validateEmail(email))
      setPasswordValidError(validatePassword(password))
    }
  }, [email, password, triedSubmit])

  return (
    <>
      <header className="border-[#E5E8EB] border-b-2 border-solid">
        <div className="py-3 mx-auto container px-4 sm:px-0 flex gap-1 items-end">
          <img src={logo} alt="logo" className="w-8 h-8" />
          <h1 className="font-bold text-2xl">SkillSwap</h1>
        </div>
      </header>

      <main className="flex flex-col justify-center items-center mx-auto pt-16 container">
        <h1 className="font-normal text-3xl text-center">Welcome to SkillSwap</h1>

        <form
          className="flex flex-col mt-8 mb-6 min-w-[80%] sm:min-w-3/4 lg:min-w-[500px]"
          onSubmit={(e) => handleSubmit(e)}
        >
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
            }}
            className="mx-3 p-3 border-[#CFDBE8] border-2 border-solid rounded-md outline-[#6A8FD9] placeholder:text-[#4A739C] transition-all duration-300"
          />

          <p className="text-red-500 mb-6 mx-3">{emailValidError}</p>

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
            }}
            className="mx-3 p-3 border-[#CFDBE8] border-2 border-solid rounded-md outline-[#6A8FD9] placeholder:text-[#4A739C] transition-all duration-300"
          />

          <p className="text-red-500 mb-6 mx-3">{passwordValidError}</p>

          <input
            type="submit"
            value="Log In"
            className="bg-[#0D80F2] hover:shadow-md p-2 rounded-md w-full text-[#F7FAFC] transition-all duration-300 cursor-pointer"
          />
        </form>

        <Link
          to="/forgot-password"
          className="mb-3 text-[#4A739C] hover:text-[#0D80F2] underline transition-all duration-300"
        >
          Forgot Password?
        </Link>

        <p className="mb-6 text-[#4A739C]">Or log in with</p>

        <button className="bg-[#0D80F2] hover:shadow-md mb-6 p-2 rounded-md min-w-[80%] sm:min-w-3/4 lg:min-w-[500px] text-[#F7FAFC] transition-all duration-300 cursor-pointer">
          Continue with Google
        </button>

        <Link
          to="/register"
          className="mb-3 text-[#4A739C] hover:text-[#0D80F2] underline transition-all duration-300"
        >
          Don't have an account? Sign up
        </Link>
      </main>
    </>
  )
}
