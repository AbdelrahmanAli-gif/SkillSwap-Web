import React from "react";

export default function Cart({
  imgSrc = "",
  imgAlt = "",
  title = "",
  desc = "",
  isIcon = false,
  withoutBorder = false,
}) {
  return (
    <div
      className={`
      rounded-lg flex flex-col gap-3 h-full w-full
      ${!withoutBorder ? "bg-[#F7FAFC] border border-[#DBDBDB] p-4" : ""}
    `}
    >
      {isIcon ? (
        <img
          src={imgSrc}
          alt={imgAlt}
          className="w-[24px] h-[16px] text-[#141414]"
        />
      ) : (
        <img
          src={imgSrc}
          alt={imgAlt}
          className="w-full h-[196px] rounded-lg object-cover text-[#141414]"
        />
      )}

      <h3 className="text-base font-bold text-[#141414] ">{title}</h3>

      <p className="text-sm text-[#737373] ">{desc}</p>
    </div>
  );
}
