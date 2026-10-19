import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Command,
  Folder,
  Menu,
  MessageSquare,
  PanelLeft,
  PanelRight,
  Plus,
  Search,
  Settings2,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import {
  Chat,
  STORAGE_KEY,
  Tier,
  UsageWindow,
  makePreview,
  parseStoredChats,
  remainingPercent,
  resetText,
  tierNames,
} from "./domain";
import "./style.css";

const prompts = [
  {
    icon: MessageSquare,
    title: "가볍게 정리하기",
    text: "아래 글을 세 문장으로 요약해 줘.",
    note: "요약 · 번역 · 글쓰기",
  },
  {
    icon: Command,
    title: "함께 문제 풀기",
    text: "이 코드의 문제를 찾아 해결 방법을 제안해 줘.",
    note: "코드 · 디버깅 · 분석",
  },
  {
    icon: Sparkles,
    title: "깊이 생각하기",
    text: "데스크톱 앱의 동기화 아키텍처를 설계해 줘.",
    note: "설계 · 추론 · 복잡한 작업",
  },
];
function readSaved() {
  try {
    return parseStoredChats(localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}
function App() {
  const [chats, setChats] = useState<Chat[]>(readSaved);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [tier, setTier] = useState<Tier>("standard");
  const [sidebar, setSidebar] = useState(true);
  const [usageOpen, setUsageOpen] = useState(true);
  const [dialog, setDialog] = useState<"search" | "settings" | null>(null);
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState("light");
  const [saveHistory, setSaveHistory] = useState(() => readSaved().length > 0);
  const [storageError, setStorageError] = useState(false);
  const [sample, setSample] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [sampleStart] = useState(Date.now());
  const input = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const active = chats.find((c) => c.id === activeId);
  const windows: UsageWindow[] = [
    {
      id: "session",
      label: "5시간 한도",
      usedPercent: sample ? 28 : null,
      resetsAt: sample ? sampleStart + (2 * 60 + 34) * 60000 : null,
    },
    {
      id: "week",
      label: "주간 한도",
      usedPercent: sample ? 59 : null,
      resetsAt: sample ? sampleStart + (3 * 24 + 8) * 3600000 : null,
    },
  ];
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    try {
      if (saveHistory) localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
      else localStorage.removeItem(STORAGE_KEY);
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [chats, saveHistory]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length]);
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDialog(null);
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setDialog("search");
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        newChat();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);
  useEffect(() => {
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    const modal = document.querySelector<HTMLElement>('[role="dialog"]');
    modal?.querySelector<HTMLElement>("input, button")?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !modal) return;
      const controls = [
        ...modal.querySelectorAll<HTMLElement>("button,input,select"),
      ];
      const first = controls[0],
        last = controls.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [dialog]);
  function newChat() {
    setActiveId(null);
    setDraft("");
    setDialog(null);
    input.current?.focus();
  }
  function openChat(chat: Chat) {
    setActiveId(chat.id);
    setTier(chat.tier);
    setDraft("");
    setDialog(null);
  }
  function send() {
    const text = draft.trim();
    if (!text) return;
    const messages = [
      { id: crypto.randomUUID(), role: "user" as const, text },
      {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        text: makePreview(text),
      },
    ];
    if (active)
      setChats((prev) =>
        prev.map((c) =>
          c.id === active.id
            ? { ...c, messages: [...c.messages, ...messages], tier }
            : c,
        ),
      );
    else {
      const chat: Chat = {
        id: crypto.randomUUID(),
        title: text.slice(0, 38),
        messages,
        tier,
      };
      setChats((prev) => [chat, ...prev]);
      setActiveId(chat.id);
    }
    setDraft("");
    input.current?.focus();
  }
  const minRemaining = sample
    ? Math.min(...windows.map((w) => remainingPercent(w.usedPercent)!))
    : null;
  return (
    <div
      className={`app ${sidebar ? "" : "sidebar-closed"} ${usageOpen ? "" : "usage-closed"}`}
    >
      <aside className="sidebar" aria-label="사이드바">
        <div className="window-space" />
        <div className="brand">
          <span className="brand-mark">
            a<span>✦</span>
          </span>
          <strong>Aurora</strong>
          <button
            className="icon-button"
            title="사이드바 접기"
            aria-label="사이드바 접기"
            onClick={() => setSidebar(false)}
          >
            <PanelLeft size={17} />
          </button>
        </div>
        <nav className="primary-nav">
          <button
            className={!active ? "nav-item selected" : "nav-item"}
            onClick={newChat}
          >
            <Plus size={18} />
            <span>새 대화</span>
            <kbd>⌘ N</kbd>
          </button>
          <button className="nav-item" onClick={() => setDialog("search")}>
            <Search size={17} />
            <span>대화 검색</span>
            <kbd>⌘ K</kbd>
          </button>
        </nav>
        <div className="section-label">워크스페이스</div>
        <div className="workspace-row">
          <Folder size={16} />
          <span>Aurora</span>
          <span className="local-dot" title="로컬 워크스페이스" />
        </div>
        <div className="section-label chat-label">
          <span>대화</span>
          <span>{chats.length}</span>
        </div>
        <div className="chat-list">
          {chats.length === 0 ? (
            <div className="empty-history">
              생각의 시작을 여기에.
              <br />
              <span>새 대화가 이곳에 모입니다.</span>
            </div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                className={`chat-item ${activeId === chat.id ? "active" : ""}`}
                onClick={() => openChat(chat)}
              >
                <MessageSquare size={14} />
                <span>{chat.title}</span>
              </button>
            ))
          )}
        </div>
        <div className="sidebar-bottom">
          <button
            className="mini-usage"
            onClick={() => setUsageOpen((v) => !v)}
            aria-label="사용량 패널 전환"
          >
            <div>
              <Activity size={15} />
              <span>남은 사용량</span>
              <span className="sample-tag">{sample ? "샘플" : "미연결"}</span>
            </div>
            <div className="mini-meter">
              <span style={{ width: `${minRemaining ?? 0}%` }} />
            </div>
            <small>
              {sample
                ? `가장 적게 남은 한도 ${minRemaining}%`
                : "계정 연결 전입니다"}
              <ChevronRight size={13} />
            </small>
          </button>
          <button className="account" onClick={() => setDialog("settings")}>
            <span className="avatar">A</span>
            <span>
              <strong>로컬 워크스페이스</strong>
              <small>계정 미연결</small>
            </span>
            <Settings2 size={16} />
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">
            {!sidebar && (
              <button
                className="icon-button"
                aria-label="사이드바 열기"
                onClick={() => setSidebar(true)}
              >
                <Menu size={18} />
              </button>
            )}
            <span>Aurora</span>
            <ChevronRight size={13} />
            <strong>{active?.title ?? "새 대화"}</strong>
          </div>
          <div className="top-actions">
            <span className="preview-badge">
              <span />
              로컬 미리보기
            </span>
            <button
              className={`icon-button ${usageOpen ? "pressed" : ""}`}
              aria-label="사용량 패널 전환"
              title="사용량"
              onClick={() => setUsageOpen((v) => !v)}
            >
              <PanelRight size={17} />
            </button>
          </div>
        </header>
        <div className="conversation">
          {!active ? (
            <section className="welcome">
              <div className="welcome-symbol">
                <Sparkles size={27} strokeWidth={1.25} />
              </div>
              <div className="eyebrow">A LITTLE CLARITY, A BETTER START</div>
              <h1>무엇부터 시작할까요?</h1>
              <p>익숙한 작업 공간에서, 필요한 만큼의 AI로.</p>
              <div className="prompt-grid">
                {prompts.map((p) => (
                  <button
                    key={p.title}
                    className="prompt-card"
                    onClick={() => {
                      setDraft(p.text);
                      input.current?.focus();
                    }}
                  >
                    <p.icon size={18} strokeWidth={1.5} />
                    <strong>
                      {p.title}
                      <ArrowUpRight size={14} />
                    </strong>
                    <span>{p.note}</span>
                  </button>
                ))}
              </div>
              <div className="welcome-note">
                <span className="tiny-spark">✧</span> 좋은 결과에 필요한 모델을
                함께 찾아갑니다.
              </div>
            </section>
          ) : (
            <section className="messages" aria-label="대화 내용">
              {active.messages.map((message) => (
                <article key={message.id} className={`message ${message.role}`}>
                  <div className="message-author">
                    {message.role === "assistant" ? (
                      <>
                        <span className="assistant-symbol">✦</span> Aurora{" "}
                        <span className="sample-tag">로컬 추천</span>
                      </>
                    ) : (
                      "나"
                    )}
                  </div>
                  <div className="message-text">{message.text}</div>
                </article>
              ))}
              <div ref={end} />
            </section>
          )}
        </div>
        <div className="composer-area">
          <div className="composer">
            <textarea
              ref={input}
              aria-label="메시지"
              placeholder="무엇이든 물어보세요. 함께 시작해 봐요."
              maxLength={20000}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <div className="composer-toolbar">
              <div className="model-control">
                <Sparkles size={14} />
                <select
                  aria-label="모델 등급"
                  value={tier}
                  onChange={(e) => setTier(e.target.value as Tier)}
                >
                  {Object.entries(tierNames).map(([value, name]) => (
                    <option value={value} key={value}>
                      {name} 모델
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} />
                <span className="toolbar-divider" />
                <span>직접 선택</span>
              </div>
              <button
                className="send-button"
                aria-label="메시지 보내기"
                disabled={!draft.trim()}
                onClick={send}
              >
                <ArrowUp size={19} />
              </button>
            </div>
          </div>
          <div className="composer-footnote">
            <span>
              <span className="status-dot" />
              외부 전송 없음 · 로컬 추천만 동작
            </span>
            <span>Enter 전송 · Shift + Enter 줄바꿈</span>
          </div>
        </div>
        <footer className="statusbar">
          <span>
            <span className="status-dot" />
            Aurora · Desktop Preview
          </span>
          <span>
            {saveHistory ? "이 기기에 대화 저장 중" : "대화 저장 꺼짐"}
          </span>
        </footer>
      </main>
      {usageOpen && (
        <aside className="usage-panel" aria-label="사용량">
          <div className="usage-heading">
            <span>
              <Activity size={16} />
              사용량
            </span>
            <button
              className="icon-button"
              aria-label="사용량 닫기"
              onClick={() => setUsageOpen(false)}
            >
              <X size={15} />
            </button>
          </div>
          <div className="usage-scroll">
            <div className="usage-intro">
              <div className="eyebrow">ROOM TO THINK</div>
              <h2>
                얼마나 더<br />할 수 있을까요?
              </h2>
              <p>
                남은 한도를 미리 확인하고
                <br />
                다음 작업을 이어가세요.
              </p>
            </div>
            <div className="data-source">
              <span className="source-dot" />
              <span>{sample ? "샘플 데이터" : "계정 미연결"}</span>
              <button onClick={() => setSample((v) => !v)}>
                {sample ? "샘플 끄기" : "샘플 보기"}
              </button>
            </div>
            {windows.map((window, index) => {
              const remaining = remainingPercent(window.usedPercent);
              return (
                <section
                  className={`usage-card ${index ? "weekly" : ""}`}
                  key={window.id}
                >
                  <div className="usage-card-title">
                    <span>{window.label}</span>
                    <span>{index ? "WEEKLY" : "SESSION"}</span>
                  </div>
                  <div className="usage-number">
                    {remaining === null ? "—" : remaining}
                    <span>{remaining === null ? "" : "%"}</span>
                    <small>{remaining === null ? "확인 전" : "남음"}</small>
                  </div>
                  <div
                    className="usage-meter"
                    role="progressbar"
                    aria-label={`${window.label} 남은 비율`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={remaining ?? undefined}
                    aria-valuetext={
                      remaining === null ? "데이터 없음" : `${remaining}% 남음`
                    }
                  >
                    <span style={{ width: `${remaining ?? 0}%` }} />
                  </div>
                  <div className="usage-meta">
                    <span>{resetText(window.resetsAt, now)}</span>
                    {remaining !== null && <span>{100 - remaining}% 사용</span>}
                  </div>
                </section>
              );
            })}
            <div className="usage-explanation">
              <CircleHelp size={15} />
              <p>
                {sample
                  ? "화면 확인용 예시입니다. 실제 계정의 잔여량이나 사용 가능 횟수를 나타내지 않습니다."
                  : "사용량 데이터가 연결되지 않았습니다. 확인되지 않은 한도는 숫자로 표시하지 않습니다."}
              </p>
            </div>
            <div className="next-section">
              <div className="next-icon">
                <Zap size={17} />
              </div>
              <div>
                <strong>충분한 모델, 더 오래.</strong>
                <p>
                  작업에 알맞은 모델을 고르면
                  <br />
                  고성능 모델은 필요할 때 쓸 수 있어요.
                </p>
              </div>
            </div>
            <button
              className="usage-settings"
              onClick={() => setDialog("settings")}
            >
              <Settings2 size={14} />
              사용량 및 데이터 설정
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="panel-footer">
            <span className="status-dot" />
            실제 사용량 연동 준비 중
          </div>
        </aside>
      )}
      {dialog && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDialog(null);
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
          >
            <header>
              <h2 id="dialog-title">
                {dialog === "search" ? "대화 검색" : "워크스페이스 설정"}
              </h2>
              <button
                className="icon-button"
                aria-label="닫기"
                onClick={() => setDialog(null)}
              >
                <X size={18} />
              </button>
            </header>
            {dialog === "search" ? (
              <>
                <div className="search-input">
                  <Search size={18} />
                  <input
                    aria-label="대화 검색어"
                    placeholder="제목이나 메시지로 검색"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="search-results">
                  {chats
                    .filter((c) =>
                      `${c.title} ${c.messages.map((m) => m.text).join(" ")}`
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                    )
                    .map((c) => (
                      <button key={c.id} onClick={() => openChat(c)}>
                        <MessageSquare size={16} />
                        <span>{c.title}</span>
                        <ChevronRight size={14} />
                      </button>
                    ))}
                  {!chats.some((c) =>
                    `${c.title} ${c.messages.map((m) => m.text).join(" ")}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  ) && <p>일치하는 대화가 없습니다.</p>}
                </div>
              </>
            ) : (
              <>
                <label className="setting-row">
                  <span>
                    <strong>화면 테마</strong>
                    <small>작업 공간의 밝기를 선택하세요.</small>
                  </span>
                  <select
                    aria-label="화면 테마"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                  >
                    <option value="light">라이트</option>
                    <option value="dark">다크</option>
                  </select>
                </label>
                <label className="setting-row">
                  <span>
                    <strong>이 기기에 대화 저장</strong>
                    <small>
                      끄면 저장된 사본을 지웁니다. 현재 창의 대화는 유지됩니다.
                    </small>
                  </span>
                  <input
                    type="checkbox"
                    checked={saveHistory}
                    onChange={(e) => setSaveHistory(e.target.checked)}
                  />
                </label>
                <label className="setting-row">
                  <span>
                    <strong>사용량 샘플 표시</strong>
                    <small>
                      실제 계정 정보가 아닌 화면 확인용 데이터입니다.
                    </small>
                  </span>
                  <input
                    type="checkbox"
                    checked={sample}
                    onChange={(e) => setSample(e.target.checked)}
                  />
                </label>
                <div className="connection-info">
                  <Check size={16} />
                  <span>
                    현재 외부로 전송되는 데이터는 없습니다.
                    <br />
                    계정 연결과 실제 AI 응답은 아직 제공하지 않습니다.
                  </span>
                </div>
              </>
            )}
          </section>
        </div>
      )}
      {storageError && (
        <div className="toast" role="alert">
          대화를 저장하지 못했습니다. 현재 창을 닫기 전에 내용을 복사해 주세요.
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
