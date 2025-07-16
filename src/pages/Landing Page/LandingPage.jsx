import React from "react";
import HeroSection from "./Hero";
import HowWorkSection from "./HowWork";
import SuccessStories from "./SuccessStories";
import LandingFooter from "./Footer";
import Button from "../../components/Button";
import { useTranslation } from "react-i18next";
import { FaArrowRight } from "react-icons/fa";
import Header from "../../components/Header";

export default function LandingPage() {
  const { t, i18n } = useTranslation();

  return (
    <>
      <div className="w-full bg-white">
        

        <Header>
          <Button
            value={i18n.language === "en" ? "English" : "العربية"}
            onPress={() =>
              i18n.language === "en"
                ? i18n.changeLanguage("ar")
                : i18n.changeLanguage("en")
            }
            variant="secondary"
          />
          <Button
          value={"Next"}
          onPress={() => {}}
          icon={<FaArrowRight size={14} />}
        />
        </Header>

        <HeroSection />
        <div className="container max-w-[1000px] mx-auto">
          <HowWorkSection />
          <SuccessStories />

          <section className="flex flex-col justify-content:center align-center gap-8 px-10 py-20">
            <h2 className="text-4xl font-extrabold text-center">
              {t("LandingSection.title")}
            </h2>
            <div className="text-center">
              <button className="relative overflow-hidden px-4 py-2 font-semibold text-white bg-black rounded-md shadow group">
                <span className="relative z-10 transition duration-1000 group-hover:text-black">
                  {t("LandingSection.button")}
                </span>
                <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-[800ms] ease-in-out group-hover:w-full"></span>
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
