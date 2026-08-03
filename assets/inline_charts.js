/*
 * Copy this file into the single-file evaluation_report.html <script> block.
 * Input rows use: {id, title, research_family, adjusted_score,
 * innovation_score, feasibility_score, risk_deduction}.
 */
(function (global) {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var FONT = "16px system-ui, 'Microsoft JhengHei', sans-serif";

  function svgEl(name, attrs) {
    var node = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    return node;
  }

  function text(svg, x, y, value, attrs) {
    var node = svgEl("text", Object.assign({x: x, y: y, fill: "#14213d", "font-size": 16}, attrs || {}));
    node.textContent = String(value);
    svg.appendChild(node);
    return node;
  }

  function frame(container, label, height) {
    container.replaceChildren();
    var width = Math.max(640, container.clientWidth || 760);
    var svg = svgEl("svg", {viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": label, width: "100%", height: height});
    svg.style.font = FONT;
    container.appendChild(svg);
    return {svg: svg, width: width, height: height};
  }

  function scale(value, min, max, start, end) {
    return start + ((value - min) / (max - min || 1)) * (end - start);
  }

  function labelFor(row) {
    return row.id || row.title || "未命名題目";
  }

  function renderTopScoreBars(container, rows) {
    var view = frame(container, "前十名校正分數長條圖", Math.max(360, rows.length * 42 + 80));
    var left = 190, right = 55, top = 28, bar = 24, gap = 18;
    text(view.svg, left, 18, "校正分數（0–100）", {"font-weight": "700"});
    rows.slice().sort(function (a, b) { return (a.rank || 999) - (b.rank || 999); }).slice(0, 10).forEach(function (row, i) {
      var y = top + i * (bar + gap);
      var score = Number(row.adjusted_score) || 0;
      text(view.svg, left - 10, y + 18, labelFor(row), {"text-anchor": "end"});
      view.svg.appendChild(svgEl("rect", {x: left, y: y, width: scale(score, 0, 100, 0, view.width - left - right), height: bar, rx: 4, fill: "#087f8c"}));
      text(view.svg, left + scale(score, 0, 100, 0, view.width - left - right) + 8, y + 18, score, {"font-weight": "700"});
    });
  }

  function renderInnovationFeasibility(container, rows) {
    var view = frame(container, "創新性與可行性散點圖", 440);
    var left = 90, right = 34, top = 34, bottom = 68;
    var x0 = left, x1 = view.width - right, y0 = view.height - bottom, y1 = top;
    view.svg.appendChild(svgEl("rect", {x: x0, y: y1, width: x1 - x0, height: y0 - y1, fill: "#f5f8fc", stroke: "#b9c7d8"}));
    text(view.svg, (x0 + x1) / 2, view.height - 18, "創新性（0–15）", {"text-anchor": "middle", "font-weight": "700"});
    text(view.svg, 20, (y0 + y1) / 2, "可行性", {"text-anchor": "middle", "font-weight": "700", transform: "rotate(-90 20 " + ((y0 + y1) / 2) + ")"});
    [0, 5, 10, 15].forEach(function (tick) { var x = scale(tick, 0, 15, x0, x1); text(view.svg, x, y0 + 25, tick, {"text-anchor": "middle"}); });
    [0, 5, 10].forEach(function (tick) { var y = scale(tick, 0, 10, y0, y1); text(view.svg, x0 - 12, y + 5, tick, {"text-anchor": "end"}); });
    rows.forEach(function (row) {
      var innovation = Number(row.innovation_score);
      var feasibility = Number(row.feasibility_score);
      if (!Number.isFinite(innovation) || !Number.isFinite(feasibility)) return;
      var circle = svgEl("circle", {cx: scale(innovation, 0, 15, x0, x1), cy: scale(feasibility, 0, 10, y0, y1), r: 7, fill: "#e07a5f", stroke: "#7d2e1d", "data-id": labelFor(row)});
      circle.appendChild(svgEl("title", {})).textContent = labelFor(row) + "：創新 " + innovation + "/15，可行 " + feasibility + "/10";
      view.svg.appendChild(circle);
      text(view.svg, Number(circle.getAttribute("cx")) + 10, Number(circle.getAttribute("cy")) + 5, labelFor(row), {"font-size": 16});
    });
  }

  function renderRiskBars(container, rows) {
    var view = frame(container, "風險扣分分布圖", Math.max(360, rows.length * 32 + 70));
    var left = 190, right = 55, top = 26, bar = 18, gap = 14;
    text(view.svg, left, 16, "風險扣分（越高代表目前規畫風險越高）", {"font-weight": "700"});
    rows.slice().sort(function (a, b) { return (Number(b.risk_deduction) || 0) - (Number(a.risk_deduction) || 0); }).forEach(function (row, i) {
      var y = top + i * (bar + gap), risk = Number(row.risk_deduction) || 0;
      text(view.svg, left - 10, y + 14, labelFor(row), {"text-anchor": "end"});
      view.svg.appendChild(svgEl("rect", {x: left, y: y, width: scale(risk, 0, 20, 0, view.width - left - right), height: bar, rx: 4, fill: "#d95d39"}));
      text(view.svg, left + scale(risk, 0, 20, 0, view.width - left - right) + 8, y + 14, "-" + risk, {"font-weight": "700"});
    });
  }

  global.ScienceFairCharts = {
    renderTopScoreBars: renderTopScoreBars,
    renderInnovationFeasibility: renderInnovationFeasibility,
    renderRiskBars: renderRiskBars,
    renderAll: function (rows, selectors) {
      selectors = selectors || {top: "#chart-top10", scatter: "#chart-innovation-feasibility", risk: "#chart-risk"};
      var top = document.querySelector(selectors.top), scatter = document.querySelector(selectors.scatter), risk = document.querySelector(selectors.risk);
      if (top) renderTopScoreBars(top, rows);
      if (scatter) renderInnovationFeasibility(scatter, rows);
      if (risk) renderRiskBars(risk, rows);
    }
  };
})(window);
