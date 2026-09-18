"use client";

import { useState } from "react";
import { useL } from "@/lib/i18n";
import { SampleBanner } from "@/components/SampleBanner";
import { Sparkles, Check } from "lucide-react";

const STEPS = [
  { zh: "填写基础信息", en: "Basic info" },
  { zh: "铸造 ERC-8004 身份", en: "Mint ERC-8004 identity" },
  { zh: "绑定 TEE 度量白名单", en: "Bind TEE measurement allowlist" },
];

export default function CreateAgentPage() {
  const L = useL();
  const [step] = useState(1);

  return (
    <div className="mx-auto max-w-5xl">
      <SampleBanner
        note={L(
          "本页是未接后端的界面原型：表单不提交、身份铸造未接线，所有输入框均为占位（不读链上状态，也不写任何东西）。真实可验证的 agent 目前只有 agentId=1，其身份注册见「验证器」与「收据流」。",
          "This is a UI prototype with no backend: the form does not submit, identity minting is not wired up, and every input is a placeholder (it reads no chain state and writes nothing). The only real, verifiable agent today is agentId=1 — see Verifier and Receipts."
        )}
      />
      <div className="mb-5 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-cyan" />
        <h1 className="text-lg font-semibold">{L("创建 Agent", "Create Agent")}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* form */}
        <div className="card space-y-4 p-5">
          <Field label={L("名称", "Name")}>
            <input className="inp" placeholder="Aegis Alpha" disabled />
          </Field>
          <Field label={L("描述", "Description")}>
            <textarea className="inp min-h-[72px]" placeholder={L("策略简介…", "Strategy summary…")} disabled />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={L("策略类型", "Strategy type")}>
              <select className="inp" disabled>
                <option>趋势跟随</option>
                <option>网格</option>
                <option>稳定币收益</option>
              </select>
            </Field>
            <Field label={L("初始资金", "Initial capital")}>
              <input className="inp mono" placeholder="0.0 MON" disabled />
            </Field>
          </div>
          <Field label={L("TEE 派生地址", "TEE derived address")}>
            <input className="inp mono" placeholder="0x…" disabled />
          </Field>
          <Field label={L("度量白名单（MRTD/RTMR）", "Measurement allowlist (MRTD/RTMR)")}>
            <input className="inp mono" placeholder="a7f2c8d9… , b19e04f3…" disabled />
          </Field>
          {/* 原按钮无 onClick，点了毫无反应 —— 比 disabled 更容易被误读成"功能坏了"。
              明确禁用并说明原因，不再假装是可用功能。 */}
          <button
            disabled
            title={L("后端未实现", "backend not implemented")}
            className="w-full cursor-not-allowed rounded-lg bg-cyan py-2.5 text-sm font-medium text-base opacity-50"
          >
            {L("创建 Agent 并铸造身份（未实现）", "Create & mint identity (not implemented)")}
          </button>
        </div>

        {/* steps */}
        <div className="card p-5">
          <div className="mb-4 text-sm font-medium">{L("注册步骤", "Registration flow")}</div>
          <div className="space-y-4">
            {STEPS.map((s, i) => {
              const active = step === i + 1;
              const doneStep = step > i + 1;
              return (
                <div key={s.en} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                        doneStep
                          ? "bg-green/15 text-green"
                          : active
                            ? "bg-cyan/15 text-cyan"
                            : "bg-input text-muted"
                      }`}
                    >
                      {doneStep ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    {i < STEPS.length - 1 && <div className="my-1 h-8 w-px bg-border-base" />}
                  </div>
                  <div className="pt-1">
                    <div className={`text-sm ${active ? "text-primary" : "text-secondary"}`}>{L(s.zh, s.en)}</div>
                    <div className="text-[11px] text-muted">
                      {i === 0 && L("名称 / 描述 / 策略类型", "name / desc / type")}
                      {i === 1 && L("绑定唯一链上身份，可被市场发现", "unique on-chain identity, discoverable")}
                      {i === 2 && L("仅白名单度量可提交收据", "only allowlisted measurements may submit")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .inp {
          width: 100%;
          background: var(--bg-input);
          border: 1px solid var(--border-base);
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 13px;
          outline: none;
        }
        .inp:focus {
          border-color: rgba(0, 229, 204, 0.4);
        }
        .inp:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-tertiary">{label}</span>
      {children}
    </label>
  );
}
