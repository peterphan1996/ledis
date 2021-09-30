import React, { useState, useRef, useEffect } from "react";
import "./App.css";

const App = () => {
  const [inputValue, setInputValue] = useState("");
  const [data, setData] = useState([]);

  const messageEl = useRef(null);

  useEffect(() => {
    if (messageEl) {
      messageEl.current.addEventListener("DOMNodeInserted", (event) => {
        const { currentTarget: target } = event;
        target.scroll({ top: target.scrollHeight, behavior: "smooth" });
      });
    }
  }, []);

  const postCommand = async (command) => {
    const response = await fetch("/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: `command=${command}`,
    });
    const body = await response.json();
    const data = Array.isArray(body.data) ? body.data : [body.data];

    if (response.status !== 200) {
      throw Error(body.message);
    }
    setData((prev) => [...prev, `> ${command}`, ...data]);
  };

  const search = () => {
    if (event.key === "Enter") {
      postCommand(inputValue);
      setInputValue("");
    }
  };

  return (
    <div className="App">
      <div className="screen" ref={messageEl}>
        {data.map((info, index) => (
          <p className="screen-text" key={index}>
            {info}
          </p>
        ))}
      </div>
      <div className="command-container">
        <p className="prompt">>Ledis: </p>
        <input
          type="text"
          className="command-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={search}
        />
      </div>
    </div>
  );
};

export default App;
