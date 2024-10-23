import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { useSelector } from "react-redux";

function App() {
  const count = useSelector((state) => state.counter.value);

  function handleIncreamentClick() {}
  function handleDecreamentClick() {}

  return (
    <>
      <button onClick={handleIncreamentClick}>+</button>
      <p>count: </p>
      <button onClick={handleDecreamentClick}>-</button>
    </>
  );
}

export default App;




