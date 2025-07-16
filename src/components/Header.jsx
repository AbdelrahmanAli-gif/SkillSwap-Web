import React from "react";
import logo from "../assets/images/skill.png";

export default function Header({ children }) {
  return (
    <header className="border-[#E5E8EB] border-b-2 border-solid">
      <div className="py-3 mx-auto container px-4 sm:px-0 flex justify-between items-center">
        <div className="flex items-end gap-1">
          <img src={logo} alt="logo" className="w-8 h-8" />
          <h1 className="font-bold text-2xl">SkillSwap</h1>
        </div>
        <div className="flex gap-1">{children}</div>
      </div>
    </header>
  );
}
