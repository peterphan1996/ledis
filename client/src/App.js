import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";

const App = () => {
  const [inputValue, setInputValue] = useState("");
  const [data, setData] = useState([]);

  const postCommand = async (command) => {
    const response = await fetch("/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: `command=${command}`,
    });
    const body = await response.json();

    if (response.status !== 200) {
      throw Error(body.message);
    }
    setData((prev) => [...prev, `> ${command}`, body.data]);
  };

  const search = (ele) => {
    if (event.key === "Enter") {
      postCommand(inputValue);
      setInputValue("");
    }
  };

  return (
    <div className="App">
      <div className="screen">
        {data.map((info, index) => (
          <p className="screen-text" key={index}>
            {info}
          </p>
        ))}
      </div>
      <input
        type="text"
        className="command-input"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={search}
      />
    </div>
  );
};

export default App;
