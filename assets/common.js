// 여러 페이지에서 공용으로 쓰는 유틸

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function normalizeMathText(raw) {
  return String(raw)
    .replace(/\\\\([()[\]])/g, "\\$1")
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) =>
      `\\[${math.replace(/\\\(|\\\)/g, "").replace(/\s*\n\s*/g, " ")}\\]`,
    );
}

// **bold**, `code`, 줄바꿈을 처리하고 수식 구분자는 KaTeX에 넘길 수 있게
// 정상화한다. 실제 수식 렌더링은 아래 renderMath에서 수행한다.
function formatText(raw) {
  if (!raw) return "";
  let s = escapeHtml(normalizeMathText(raw));
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\n/g, "<br>");
  return s;
}

async function loadJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} 로드 실패 (${res.status})`);
  return res.json();
}

const CIRCLED = ["①", "②", "③", "④"];

// data/*.json 은 인라인 수식을 \(...\), 블록 수식을 \[...\] 로 담고 있다.
// KaTeX auto-render가 로드돼 있으면 해당 구간을 실제 수식으로 렌더링한다.
function renderMath(el) {
  if (!window.renderMathInElement) return;

  // 일부 기존 데이터에는 이미 수식 구분자가 붙은 원문을 생성기가 다시
  // 감싸면서 `\\\\(`처럼 백슬래시가 중복돼 있다. 텍스트 노드에서 이를
  // 정상 구분자로 복구하고, 블록 수식 안에 중첩된 인라인 구분자도 제거한다.
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    node.nodeValue = node.nodeValue
      .replace(/\\\\([()[\]])/g, "\\$1")
      .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) =>
        `\\[${math.replace(/\\\(|\\\)/g, "")}\\]`,
      );
  }

  renderMathInElement(el, {
    delimiters: [
      { left: "\\[", right: "\\]", display: true },
      { left: "\\(", right: "\\)", display: false },
    ],
    throwOnError: false,
  });
}
