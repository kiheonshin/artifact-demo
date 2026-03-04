import React from "react";
import ReactDOM from "react-dom/client";
import TamaverseApp from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TamaverseApp />
  </React.StrictMode>
);

// 체류시간 이벤트: 30초, 60초, 180초
[30, 60, 180].forEach((s) => {
  setTimeout(() => {
    if (window.gtag) gtag("event", "engaged_time", { event_category: "engagement", value: s, event_label: s + "s_on_tamaverse" });
  }, s * 1000);
});
