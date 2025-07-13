import React from "react";
import logo from "../assets/images/skill.png";

export default function Header() {
  return (
    <header className="border-[#E5E8EB] border-b-2 border-solid">
      <div className="py-3 mx-auto container px-4 sm:px-0 flex gap-1 items-end">
        <img src={logo} alt="logo" className="w-8 h-8" />
        <h1 className="font-bold text-2xl">SkillSwap</h1>
      </div>
    </header>
  );
}
