import React from "react";
import cricketBall from "@assets/Cricket_ball.svg"

const Loader = () => {
  return (
    <div className="w-screen h-screen flex justify-center items-center my-4">
      <img
        src={cricketBall}
        className="w-16 h-16 animate-spin"
        loading="lazy"
      />
    </div>
  );
};

export default Loader;
