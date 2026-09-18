"use client";

import { useState } from "react";
import { useL } from "@/lib/i18n";
import { SampleBanner } from "@/components/SampleBanner";
import { Lock, Unlock, ShieldCheck } from "lucide-react";

export default function PolicyPage() {
  const L = useL();
  const [perTx, setPerTx] = useState("1");
  const [daily, setDaily] = useState("5");
  const [slippage, setSlippage] = useState("50");
  // 原值是编造的地址（"0x0000…bEEF, 0xKuruRouter…"）：前者不是地址，后者是占位符。
  // 改成空串并给中性提示，不假装这里预填了任何真实白名单。
  const [whitelist, setWhitelist] = useState("");

  return (
    <div className="mx-auto max-w-5xl">
      <SampleBanner
        note={L(
          "本页是未接后端的界面原型：参数不读链上策略、两个按钮都没有接线，所有值均为占位。链上真实策略边界见总览页（读 /api/config），策略变更的真实流程是改 challenger-policy.json 后跑 challenger/policy-attest.mjs --execute。",
          "UI prototype with no backend: the fields do not read on-chain policy, neither button is wired, and every value is a placeholder. For the real on-chain policy boundary see Overview (reads /api/config); the real change flow is to edit challenger-policy.json then run challenger/policy-attest.mjs --execute."
        )}
      />
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{L("策略编辑器", "Policy Editor")}</h1>
        <div className="flex gap-2">
          {/* 两个按钮原本无 onClick：点了既不保存也不报错，最坏情况下会让人以为
              "已经上链生效了"。改为禁用并标未实现。 */}
          <button
            disabled
            title={L("未实现", "not implemented")}
            className="cursor-not-allowed rounded-lg border border-border-base px-3 py-1.5 text-xs text-primary opacity-50"
          >
            {L("保存（收紧·立即）（未实现）", "Save (tighten · instant) (not implemented)")}
          </button>
          <button
            disabled
            title={L("未实现", "not implemented")}
            className="cursor-not-allowed rounded-lg bg-cyan px-3 py-1.5 text-xs font-medium text-base opacity-50"
          >
            {L("提交放宽（时间锁）（未实现）", "Submit loosen (timelock) (not implemented)")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* basic params */}
        <div className="card space-y-4 p-5">
          <div className="text-sm font-medium">{L("基础参数（占位）", "Base parameters (placeholder)")}</div>
          <Field label={L("单笔限额 (MON)", "Per-tx limit (MON)")}>
            <input value={perTx} onChange={(e) => setPerTx(e.target.value)} className="inp mono" disabled />
          </Field>
          <Field label={L("每日限额 (MON)", "Daily limit (MON)")}>
            <input value={daily} onChange={(e) => setDaily(e.target.value)} className="inp mono" disabled />
          </Field>
          <Field label={L("最大滑点 (bps)", "Max slippage (bps)")}>
            <input value={slippage} onChange={(e) => setSlippage(e.target.value)} className="inp mono" disabled />
          </Field>
          <Field label={L("白名单标的", "Whitelisted targets")}>
            <textarea
              value={whitelist}
              onChange={(e) => setWhitelist(e.target.value)}
              placeholder={L("（无数据源：链上白名单见总览页）", "(no data source: see Overview for the on-chain whitelist)")}
              className="inp mono min-h-[64px]"
              disabled
            />
          </Field>
        </div>

        {/* guardrail */}
        <div className="card space-y-4 p-5">
          <div className="text-sm font-medium">{L("护栏规则（占位）", "Guardrail rules (placeholder)")}</div>
          {/* "v1" 与 "0xd72be318…" 此前被当作实际配置值展示；真实 guardrailHash 由
              对策略求 attestedGuardrailHash(δ) 得到（见总览页/收据），这里没有读它。 */}
          <Row k={L("护栏版本", "Guardrail version")} v="—" />
          <div className="flex items-center justify-between rounded-lg bg-input px-3 py-2 text-xs">
            <span className="flex items-center gap-2 text-tertiary">
              <ShieldCheck className="h-3.5 w-3.5" /> Membrane
            </span>
            <span className="text-tertiary">{L("规划中", "planned")}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-input px-3 py-2 text-xs">
            <span className="text-secondary">OPA</span>
            <span className="text-tertiary">{L("规划中", "planned")}</span>
          </div>
          <div className="mono rounded-lg bg-input px-3 py-2 text-[11px] text-muted">
            guardrailHash = {L("（本页无数据源）", "(no data source on this page)")}
          </div>
        </div>
      </div>

      {/* asymmetric */}
      <div className="card mt-4 p-5">
        {/* 这一整块是设计意图，不是已实现的能力：链上没有"时间锁"合约，也没有"用户确认"
            的链上路径（SOA 目标层只对单笔做 ε-检查，不改策略）。原文案用绿/琥珀色块写成
            已生效状态，会让人以为放宽已经受时间锁保护。改为中性色 + 显式"规划中"。 */}
        <div className="mb-2 text-sm font-medium">{L("非对称升级（设计意图，未实现）", "Asymmetric upgrade (design intent, not implemented)")}</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg bg-input px-3 py-3">
            <Lock className="h-4 w-4 text-tertiary" />
            <div>
              <div className="text-xs text-secondary">{L("收紧（降限额/缩白名单）", "Tighten (lower limits / shrink whitelist)")}</div>
              <div className="text-[11px] text-muted">{L("设计上即时生效", "by design, instant")}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-input px-3 py-3">
            <Unlock className="h-4 w-4 text-tertiary" />
            <div>
              <div className="text-xs text-secondary">{L("放宽（提限额）", "Loosen (raise limits)")}</div>
              <div className="text-[11px] text-muted">{L("设计上需时间锁 + 用户确认", "by design, needs timelock + user confirmation")}</div>
            </div>
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

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-tertiary">{k}</span>
      <span className="mono text-secondary">{v}</span>
    </div>
  );
}
