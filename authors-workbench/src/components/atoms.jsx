import React, { useState } from "react";
import { X } from "lucide-react";
import { INK, PANEL, PANEL_RAISED, HAIRLINE, BRASS, PAPER, PAPER_DIM, sans, serif, mono } from "../lib/tokens";
import { wordCount, capWords } from "../lib/utils";

export function IconButton({ onClick, title, children, danger, active }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 30, height: 30, borderRadius: 7, border: `1px solid ${active ? BRASS : HAIRLINE}`,
        background: active ? "rgba(201,162,75,0.12)" : "transparent", color: danger ? "#C77B63" : (active ? BRASS : PAPER_DIM),
        cursor: "pointer", transition: "all .15s", flexShrink: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = PANEL_RAISED; e.currentTarget.style.color = danger ? "#E08A6F" : PAPER; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = active ? "rgba(201,162,75,0.12)" : "transparent"; e.currentTarget.style.color = danger ? "#C77B63" : (active ? BRASS : PAPER_DIM); }}
    >
      {children}
    </button>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: sans }}>
      <span style={{ display: "flex", justifyContent: "space-between", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: PAPER_DIM }}>
        <span>{label}</span>
        {hint && <span style={{ textTransform: "none", letterSpacing: 0, opacity: 0.8 }}>{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export const inputStyle = {
  background: INK, border: `1px solid ${HAIRLINE}`, borderRadius: 8,
  padding: "9px 11px", color: PAPER, fontFamily: sans, fontSize: 14, outline: "none", width: "100%",
};

export function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}
export function TextArea(props) {
  return <textarea {...props} style={{ ...inputStyle, resize: "vertical", fontFamily: serif, lineHeight: 1.6, ...(props.style || {}) }} />;
}


export function LimitedTextArea({ value, onChange, max = 200, rows = 3, placeholder, style }) {
  const count = wordCount(value);
  const atLimit = count >= max;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <TextArea
        rows={rows}
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(capWords(e.target.value, max))}
        style={style}
      />
      <span style={{ alignSelf: "flex-end", fontFamily: mono, fontSize: 10.5, color: atLimit ? BRASS : PAPER_DIM }}>
        {count} / {max} words
      </span>
    </div>
  );
}


export function ProseArea({ value, onChange, rows = 10, placeholder, style }) {
  const count = wordCount(value);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <TextArea
        rows={rows}
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ fontSize: 14.5, lineHeight: 1.75, ...style }}
      />
      <span style={{ alignSelf: "flex-end", fontFamily: mono, fontSize: 10.5, color: PAPER_DIM }}>
        {count.toLocaleString()} word{count === 1 ? "" : "s"}
      </span>
    </div>
  );
}

export function PrimaryButton({ children, onClick, disabled, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
        background: disabled ? HAIRLINE : BRASS, color: disabled ? PAPER_DIM : "#221C0E",
        border: "none", borderRadius: 9, padding: "10px 16px", fontFamily: sans, fontWeight: 600,
        fontSize: 13.5, cursor: disabled ? "not-allowed" : "pointer", ...style,
      }}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        background: "transparent", border: `1px solid ${HAIRLINE}`, borderRadius: 8,
        padding: "7px 12px", color: PAPER_DIM, fontFamily: sans, fontSize: 12.5, cursor: "pointer", ...style,
      }}
    >
      {children}
    </button>
  );
}

export function SegmentedControl({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", background: INK, border: `1px solid ${HAIRLINE}`, borderRadius: 9, padding: 3, gap: 2 }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <div
            key={opt.value} onClick={() => onChange(opt.value)}
            style={{
              padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontFamily: sans, fontSize: 12.5,
              color: active ? "#221C0E" : PAPER_DIM, background: active ? BRASS : "transparent",
              fontWeight: active ? 600 : 400, whiteSpace: "nowrap",
            }}
          >
            {opt.label}
          </div>
        );
      })}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "48px 20px", color: PAPER_DIM }}>
      {Icon && <Icon size={26} color={HAIRLINE} />}
      <div style={{ fontFamily: serif, fontSize: 16 }}>{title}</div>
      {hint && <div style={{ fontFamily: sans, fontSize: 12.5, textAlign: "center", maxWidth: 320, lineHeight: 1.6 }}>{hint}</div>}
    </div>
  );
}

export function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: PANEL, border: `1px solid ${HAIRLINE}`, borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
      <span style={{ fontFamily: sans, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: PAPER_DIM }}>{label}</span>
      <span style={{ fontFamily: mono, fontSize: 22, color: BRASS }}>{value}</span>
      {sub && <span style={{ fontFamily: sans, fontSize: 11, color: PAPER_DIM }}>{sub}</span>}
    </div>
  );
}


export function TagInput({ tags, onChange, placeholder }) {
  const [draft, setDraft] = useState("");
  const commit = () => {
    const v = draft.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setDraft("");
  };
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", background: INK,
      border: `1px solid ${HAIRLINE}`, borderRadius: 8, padding: "7px 9px",
    }}>
      {tags.map((t) => (
        <span key={t} style={{
          display: "flex", alignItems: "center", gap: 5, background: PANEL_RAISED, borderRadius: 20,
          padding: "3px 6px 3px 10px", fontFamily: sans, fontSize: 12, color: PAPER,
        }}>
          {t}
          <span onClick={() => onChange(tags.filter((x) => x !== t))} style={{ display: "flex", cursor: "pointer", opacity: 0.6 }}>
            <X size={11} />
          </span>
        </span>
      ))}
      <input
        value={draft} placeholder={tags.length ? "" : placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(); } }}
        onBlur={commit}
        style={{ background: "transparent", border: "none", outline: "none", color: PAPER, fontFamily: sans, fontSize: 13, flex: 1, minWidth: 90 }}
      />
    </div>
  );
}

export function ColorSwatchPicker({ palette, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {palette.map((c) => (
        <div
          key={c} onClick={() => onChange(c)}
          style={{
            width: 20, height: 20, borderRadius: 6, background: c, cursor: "pointer",
            border: `2px solid ${value === c ? PAPER : "transparent"}`, boxShadow: value === c ? `0 0 0 1px ${HAIRLINE}` : "none",
          }}
        />
      ))}
    </div>
  );
}

export function Avatar({ name, color, size = 40, onClick }) {
  const initials = (name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return (
    <div
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: "50%", background: color, color: "#1A1710",
        display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontWeight: 700,
        fontSize: size * 0.36, cursor: onClick ? "pointer" : "default", flexShrink: 0, border: `2px solid ${HAIRLINE}`,
      }}
    >
      {initials || "?"}
    </div>
  );
}

export function Modal({ onClose, width = 480, children }) {
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(10,9,12,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width, maxWidth: "92vw", maxHeight: "88vh", overflowY: "auto", background: PANEL, border: `1px solid ${HAIRLINE}`, borderRadius: 14, padding: 24 }}
      >
        {children}
      </div>
    </div>
  );
}
