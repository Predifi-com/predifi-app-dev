import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OrderFormProps {
  asset: string;
  yesProb: number;
  onSideChange?: (side: "yes" | "no") => void;
  externalLimitPrice?: number | null;
}

export function OrderForm({ asset, yesProb, onSideChange, externalLimitPrice }: OrderFormProps) {
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("10");
  const [limitPrice, setLimitPrice] = useState("");
  const [slippage] = useState(0.5);

  // When a price is clicked in the order book, switch to limit and fill
  useEffect(() => {
    if (externalLimitPrice != null) {
      setLimitPrice(externalLimitPrice.toFixed(1));
      setOrderType("limit");
    }
  }, [externalLimitPrice]);

  const noProb = 100 - yesProb;
  const currentPrice = side === "yes" ? yesProb : noProb;
  const estimatedShares = Number(amount) / (currentPrice / 100);

  const handleSideChange = (s: "yes" | "no") => {
    setSide(s);
    onSideChange?.(s);
  };

  return (
    <div className="p-3 space-y-3">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order</span>

      <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "market" | "limit")}>
        <TabsList className="w-full h-7">
          <TabsTrigger value="market" className="flex-1 text-[10px] h-6">Market</TabsTrigger>
          <TabsTrigger value="limit" className="flex-1 text-[10px] h-6">Limit</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 gap-1">
        <Button
          size="sm"
          variant={side === "yes" ? "default" : "outline"}
          className={cn("h-7 text-xs", side === "yes" && "bg-emerald-500 hover:bg-emerald-600 text-white")}
          onClick={() => handleSideChange("yes")}
        >
          Buy Yes {yesProb.toFixed(0)}¢
        </Button>
        <Button
          size="sm"
          variant={side === "no" ? "default" : "outline"}
          className={cn("h-7 text-xs", side === "no" && "bg-red-500 hover:bg-red-600 text-white")}
          onClick={() => handleSideChange("no")}
        >
          Buy No {noProb.toFixed(0)}¢
        </Button>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">Amount (USDC)</Label>
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-8 text-sm" placeholder="0.00" />
        <div className="flex gap-1">
          {[5, 10, 25, 50].map((v) => (
            <Button key={v} variant="outline" size="sm" className="h-5 text-[9px] flex-1 px-0" onClick={() => setAmount(String(v))}>
              ${v}
            </Button>
          ))}
        </div>
      </div>

      {/* Fixed-height slot for limit price */}
      <div className={cn("space-y-1", orderType !== "limit" && "invisible")}>
        <Label className="text-[10px] text-muted-foreground">Limit Price (¢)</Label>
        <Input type="number" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} className="h-8 text-sm" placeholder={currentPrice.toFixed(1)} />
      </div>

      <div className="rounded-md bg-muted/50 p-2 space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Avg Price</span>
          <span className="font-medium tabular-nums">{currentPrice.toFixed(1)}¢</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Est. Shares</span>
          <span className="font-medium tabular-nums">{isFinite(estimatedShares) ? estimatedShares.toFixed(1) : "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Max Payout</span>
          <span className="font-medium tabular-nums text-emerald-500">
            ${isFinite(estimatedShares) ? estimatedShares.toFixed(2) : "—"}
          </span>
        </div>
      </div>

      <Button
        className={cn(
          "w-full h-9 text-xs font-bold",
          side === "yes" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"
        )}
      >
        {orderType === "market" ? "Place Market Order" : "Place Limit Order"}
      </Button>

      <p className="text-[9px] text-muted-foreground text-center">Slippage tolerance: {slippage}%</p>
    </div>
  );
}
