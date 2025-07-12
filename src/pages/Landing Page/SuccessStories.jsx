import React from "react";
import Cart from "./components/Cart";
import img1 from "../../assets/images/card-1.png";
import img2 from "../../assets/images/card-2.png";
import img3 from "../../assets/images/card-3.png";

export default function SuccessStories() {
  return (
    <section className="text-[#141414] flex flex-col gap-10 px-4 py-10 ">
      <div className="flex flex-col gap-4">
        <h2 className="text-4xl font-extrabold">Success Stories</h2>

        <p className="text-base max-w-[720px]">
          See how SkillSwap has transformed lives by enabling skill sharing and
          personal growth.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="w-full md:w-1/3">
          <Cart
            imgSrc={img1}
            imgAlt="img 1"
            withoutBorder
            title="Photography Enthusiast"
            desc="Sarah, a passionate photographer, taught her skills to aspiring artists and gained new perspectives in return."
          />
        </div>
        <div className="w-full md:w-1/3">
          <Cart
            imgSrc={img2}
            imgAlt="img 2"
            withoutBorder
            title="Coding Mentor"
            desc="Mark, an experienced software developer, mentored beginners and enhanced his teaching abilities."
          />
        </div>
        <div className="w-full md:w-1/3">
          <Cart
            imgSrc={img3}
            imgAlt="img 3"
            withoutBorder
            title="Yoga Instructor"
            desc="Emily, a certified yoga instructor, expanded her reach and connected with students globally."
          />
        </div>
      </div>
    </section>
  );
}
