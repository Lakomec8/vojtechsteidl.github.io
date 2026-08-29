(() => {
  "use strict";

  const content = document.getElementById("selfCheckContent");
  if (!content) return;

  const MATH_HINT = /\^|\b\d+\/\d+\b|·/;

  function mathFragment(text) {
    const fragment = document.createDocumentFragment();
    let buffer = "";

    const flush = () => {
      if (!buffer) return;
      fragment.append(document.createTextNode(buffer));
      buffer = "";
    };

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];

      if (char === "^") {
        flush();
        let exponent = "";
        const next = text[i + 1];

        if (next === "(") {
          const end = text.indexOf(")", i + 2);
          if (end !== -1) {
            exponent = text.slice(i + 2, end);
            i = end;
          }
        } else {
          let j = i + 1;
          if (text[j] === "+" || text[j] === "-") {
            exponent += text[j];
            j += 1;
          }
          while (j < text.length && /[A-Za-z0-9]/.test(text[j])) {
            exponent += text[j];
            j += 1;
          }
          i = j - 1;
        }

        if (exponent) {
          const sup = document.createElement("sup");
          sup.className = "math-sup";
          sup.textContent = exponent.replace(/\*/g, "·");
          fragment.append(sup);
          continue;
        }

        buffer += char;
        continue;
      }

      if (char === "(") {
        const end = text.indexOf(")", i + 1);
        if (end !== -1) {
          const inside = text.slice(i + 1, end);
          const fraction = inside.match(/^\s*([A-Za-z0-9,+-]+)\s*\/\s*([A-Za-z0-9,+-]+)\s*$/);
          if (fraction) {
            flush();
            const wrap = document.createElement("span");
            wrap.className = "math-paren-frac";
            wrap.append(document.createTextNode("("));
            const frac = document.createElement("span");
            frac.className = "math-frac";
            const num = document.createElement("span");
            num.className = "math-frac-num";
            num.textContent = fraction[1];
            const den = document.createElement("span");
            den.className = "math-frac-den";
            den.textContent = fraction[2];
            frac.append(num, den);
            wrap.append(frac, document.createTextNode(")"));
            fragment.append(wrap);
            i = end;
            continue;
          }
        }
      }

      buffer += char === "*" ? "·" : char;
    }

    flush();
    return fragment;
  }

  function renderNode(textNode) {
    const text = textNode.nodeValue || "";
    if (!MATH_HINT.test(text)) return;
    const parent = textNode.parentElement;
    if (!parent || parent.closest(".math-rendered, script, style, textarea")) return;

    const wrapper = document.createElement("span");
    wrapper.className = "math-rendered";
    wrapper.append(mathFragment(text));
    textNode.replaceWith(wrapper);
  }

  function renderMath(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(renderNode);
  }

  let scheduled = false;
  const scheduleRender = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      renderMath(content);
    });
  };

  const observer = new MutationObserver(scheduleRender);
  observer.observe(content, { childList: true, subtree: true });
  renderMath(content);
})();
