"use client";

import { useEffect, useState } from "react";
import { api, type ChainReceipt } from "./aegis";
import { getReceiptViews } from "./chain";
import type { Receipt } from "./mock";

/**
 * 收据数据走统一入口：orchestrator 的 /api/receipts（索引器产物，真实链上哈希 + tx 哈希）。
 * 浏览器内不再扫 getLogs —— Monad 的 eth_getLogs 严格限 100 块，浏览器分窗扫描每个
 * 窗口都会失败，旧实现会静默回退到 mock（假哈希假金额）。orchestrator 不可达时返回
 * 空列表，由页面显示"离线"，绝不回退到看起来像真数据的占位值。
 *
 * 两级来源：
 *   ① 浏览器内直读 ReceiptSubmitted 富事件（getReceiptViews）——executionHash/nonce/
 *      guardrailHash 都是事件里带的真值，用于展示哈希链；只覆盖最近若干块窗口。
 *   ② orchestrator 索引器（/api/receipts）——覆盖深历史，但只带 4 个字段。
 * ① 命中就用 ①（字段更全），否则退回 ②；两者都拿不到才显示离线。
 */
export function useReceipts(agentId = 1): { receipts: Receipt[]; live: boolean } {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      // ① 浏览器直读：字段最全（含 executionHash / nonce / guardrailHash）
      try {
        const rich = await getReceiptViews(BigInt(agentId));
        if (!alive) return;
        if (rich.length) {
          setReceipts(rich);
          setLive(true);
          return;
        }
      } catch {
        // 落到 ②
      }
      // ② orchestrator 索引器：深历史，字段较少
      const r = await api.receipts(agentId);
      if (!alive) return;
      if (r && r.length) {
        setReceipts(r.map(toView));
        setLive(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [agentId]);

  return { receipts, live };
}

function toView(c: ChainReceipt): Receipt {
  return {
    id: c.receiptHash.slice(2, 6),
    type: c.isHeartbeat ? "heartbeat" : "trade",
    action: c.isHeartbeat ? "心跳" : "交易",
    blockHeight: c.blockHeight,
    // 索引器接口只带 4 个字段；这些字段的真值由上面 ① 的富事件路径提供
    blockHash: "—",
    executionHash: "—",
    nonce: "—",
    guardrailHash: "—",
    prevReceiptHash: "—",
    receiptHash: c.receiptHash,
    isHeartbeat: c.isHeartbeat,
    timestamp: Date.now(),
    txHash: c.txHash,
  };
}
