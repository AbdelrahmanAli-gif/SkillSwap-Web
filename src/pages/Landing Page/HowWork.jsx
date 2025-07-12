import React from "react";
import Cart from "./components/Cart";
import icon1 from "../../assets/images/icon-1.svg";
import icon2 from "../../assets/images/icon-2.svg";
import icon3 from "../../assets/images/icon-3.svg";
export default function HowWorkSection() {
  return (
    <section className="text-[#141414] flex flex-col gap-10 px-4 py-10">
      <div className="flex flex-col gap-4">
        <h2 className="text-4xl font-extrabold">How SkillSwap Works</h2>

        <p className="text-base max-w-[720px]">
          Our platform connects individuals eager to share their expertise with
          those seeking to learn. It's a community-driven exchange where skills
          are valued and shared freely.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="w-full md:w-1/3">
          <Cart
            imgSrc={icon1}
            imgAlt="icon 1"
            title="Connect with Experts"
            desc="Find skilled individuals ready to share their knowledge in various fields."
            isIcon
          />
        </div>
        <div className="w-full md:w-1/3">
          <Cart
            imgSrc={icon2}
            imgAlt="icon 2"
            title="Explore Diverse Skills"
            desc="From coding to cooking, discover a wide range of skills to learn and master."
            isIcon
          />
        </div>
        <div className="w-full md:w-1/3">
          <Cart
            imgSrc={icon3}
            imgAlt="icon 3"
            title="Collaborate and Grow"
            desc="Engage in collaborative learning experiences that foster growth and development."
            isIcon
          />
        </div>
      </div>
    </section>
  );
}
