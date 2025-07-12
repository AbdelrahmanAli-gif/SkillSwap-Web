import React from "react";
import { Link } from "react-router-dom";

export default function LandingFooter() {
  return (
    <div className="py-10 px-5 flex flex-col gap-[24px] text-base text-[#737373]">
      <div className="flex flex-wrap justify-center gap-8">
        <Link to="#" className="text-base min-w-[160px] text-[#737373]">About</Link>
        <Link to="#" className="text-base min-w-[160px] text-[#737373]">Contact</Link>
        <Link to="#" className="text-base min-w-[160px] text-[#737373]">Terms of Service</Link>
        <Link to="#" className="text-base min-w-[160px] text-[#737373]">Privacy Policy</Link>
      </div>
      <p className="text-center">
        © 2023 SkillSwap All rights reserved.
      </p>
    </div>
  );
}
