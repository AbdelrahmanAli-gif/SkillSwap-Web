import React from "react";
import HeroSection from "./Hero";
import HowWorkSection from "./HowWork";
import SuccessStories from "./SuccessStories";
import LandingFooter from "./Footer";

export default function LandingPage() {
  return (
    <>
      <div className="w-full bg-white">
          <HeroSection />
        <div className="container max-w-[1000px] mx-auto">
          <HowWorkSection />
          <SuccessStories />

          <section className="flex flex-col justify-content:center align-center gap-8 px-10 py-20">
            <h2 className="text-4xl font-extrabold text-center">
              Ready to Start Your Skill Sharing Journey?
            </h2>
            <div className="text-center">
              <button className="font-manrope bg-black text-white py-3 px-5 rounded-lg shadow-md hover:bg-gray-800 transition duration-300">
                Get Started
              </button>
            </div>
          </section>
        </div>
      </div>
      <div className="w-full bg-[#F7FAFC]">
        <div className="container max-w-[1000px] mx-auto">
          <LandingFooter />
        </div>
      </div>
    </>
  );
}
