import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { Order } from "../types";
import { 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  BarChart3, 
  PieChart, 
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";

interface D3FinancialOverviewProps {
  orders: Order[];
}

export default function D3FinancialOverview({ orders }: D3FinancialOverviewProps) {
  const lineChartRef = useRef<SVGSVGElement | null>(null);
  const pieChartRef = useRef<SVGSVGElement | null>(null);
  const barChartRef = useRef<SVGSVGElement | null>(null);

  const [timeRangeDays, setTimeRangeDays] = useState<number>(30);
  const [selectedBarData, setSelectedBarData] = useState<{ date: string; amount: number; count: number } | null>(null);

  // 1. Compute 30-day analytics dataset
  const analyticsData = useMemo(() => {
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - (timeRangeDays - 1));
    startDate.setHours(0, 0, 0, 0);

    // Initialize daily map for last N days
    const dailyMap = new Map<string, { date: string; displayDate: string; timestamp: number; revenue: number; successfulCount: number; failedCount: number; pendingCount: number }>();

    for (let i = 0; i < timeRangeDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const displayDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyMap.set(dateStr, {
        date: dateStr,
        displayDate,
        timestamp: d.getTime(),
        revenue: 0,
        successfulCount: 0,
        failedCount: 0,
        pendingCount: 0,
      });
    }

    let totalRevenue = 0;
    let successfulCount = 0;
    let failedCount = 0;
    let pendingCount = 0;

    orders.forEach((o) => {
      const oDate = o.createdAt ? new Date(o.createdAt) : new Date();
      const dateStr = oDate.toISOString().split("T")[0];
      const status = (o.paymentStatus || "").toLowerCase();

      const isPaid = status === "paid" || status === "success" || status === "completed";
      const isFailed = status === "failed" || status === "cancelled" || status === "declined";
      const isPending = status === "pending" || status === "awaiting payment";

      if (isPaid) successfulCount++;
      else if (isFailed) failedCount++;
      else isPendingCountIncrease();

      function isPendingCountIncrease() {
        if (isPending) pendingCount++;
      }

      if (dailyMap.has(dateStr)) {
        const entry = dailyMap.get(dateStr)!;
        if (isPaid) {
          entry.revenue += Number(o.totalAmount || 0);
          entry.successfulCount += 1;
          totalRevenue += Number(o.totalAmount || 0);
        } else if (isFailed) {
          entry.failedCount += 1;
        } else if (isPending) {
          entry.pendingCount += 1;
        }
      }
    });

    const dailyTrend = Array.from(dailyMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    const totalTransactions = successfulCount + failedCount + pendingCount;
    const successRate = totalTransactions > 0 ? Math.round((successfulCount / totalTransactions) * 100) : 0;
    const averageOrderValue = successfulCount > 0 ? Math.round(totalRevenue / successfulCount) : 0;

    return {
      dailyTrend,
      totalRevenue,
      successfulCount,
      failedCount,
      pendingCount,
      totalTransactions,
      successRate,
      averageOrderValue,
    };
  }, [orders, timeRangeDays]);

  // 2. Render D3 Daily Revenue Area / Line Chart
  useEffect(() => {
    if (!lineChartRef.current) return;

    const svg = d3.select(lineChartRef.current);
    svg.selectAll("*").remove();

    const width = lineChartRef.current.clientWidth || 600;
    const height = 260;
    const margin = { top: 20, right: 20, bottom: 40, left: 65 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const data = analyticsData.dailyTrend;

    // Scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => new Date(d.date)) as [Date, Date])
      .range([0, innerWidth]);

    const maxRev = d3.max(data, (d) => d.revenue) || 10000;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxRev * 1.15])
      .range([innerHeight, 0]);

    // Gradient definition
    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "revenue-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#C5A059")
      .attr("stop-opacity", 0.4);

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#C5A059")
      .attr("stop-opacity", 0.0);

    // Axes
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.min(data.length, 7))
      .tickFormat((d) => d3.timeFormat("%b %d")(d as Date));

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => `KES ${d3.format(".2s")(d)}`);

    // Draw Grid Lines
    g.append("g")
      .attr("class", "grid")
      .attr("color", "rgba(255,255,255,0.06)")
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(() => ""));

    // Render X Axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr("color", "rgba(255,255,255,0.4)")
      .selectAll("text")
      .attr("fill", "rgba(255,255,255,0.6)")
      .attr("font-size", "10px");

    // Render Y Axis
    g.append("g")
      .call(yAxis)
      .attr("color", "rgba(255,255,255,0.4)")
      .selectAll("text")
      .attr("fill", "rgba(255,255,255,0.6)")
      .attr("font-size", "10px");

    // Area Generator
    const area = d3
      .area<{ date: string; revenue: number }>()
      .x((d) => xScale(new Date(d.date)))
      .y0(innerHeight)
      .y1((d) => yScale(d.revenue))
      .curve(d3.curveMonotoneX);

    // Line Generator
    const line = d3
      .line<{ date: string; revenue: number }>()
      .x((d) => xScale(new Date(d.date)))
      .y((d) => yScale(d.revenue))
      .curve(d3.curveMonotoneX);

    // Render Area
    g.append("path")
      .datum(data)
      .attr("fill", "url(#revenue-gradient)")
      .attr("d", area);

    // Render Line
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#C5A059")
      .attr("stroke-width", 2.5)
      .attr("d", line);

    // Render Interactive Dots
    g.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(new Date(d.date)))
      .attr("cy", (d) => yScale(d.revenue))
      .attr("r", 4)
      .attr("fill", "#0D0D0D")
      .attr("stroke", "#C5A059")
      .attr("stroke-width", 2)
      .attr("class", "cursor-pointer transition-all hover:scale-150")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", 7).attr("fill", "#C5A059");
        setSelectedBarData({ date: d.displayDate, amount: d.revenue, count: d.successfulCount });
      })
      .on("mouseout", function () {
        d3.select(this).attr("r", 4).attr("fill", "#0D0D0D");
      });
  }, [analyticsData]);

  // 3. Render D3 Donut Chart for Payment Status Ratios
  useEffect(() => {
    if (!pieChartRef.current) return;

    const svg = d3.select(pieChartRef.current);
    svg.selectAll("*").remove();

    const width = 220;
    const height = 220;
    const radius = Math.min(width, height) / 2 - 10;

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const pieData = [
      { label: "Successful", value: analyticsData.successfulCount, color: "#10B981" },
      { label: "Failed", value: analyticsData.failedCount, color: "#EF4444" },
      { label: "Pending", value: analyticsData.pendingCount, color: "#F59E0B" },
    ].filter((d) => d.value > 0);

    if (pieData.length === 0) {
      g.append("text")
        .attr("text-anchor", "middle")
        .attr("fill", "rgba(255,255,255,0.4)")
        .attr("font-size", "12px")
        .text("No transactions yet");
      return;
    }

    const pie = d3.pie<{ label: string; value: number; color: string }>().value((d) => d.value);

    const arc = d3
      .arc<d3.PieArcDatum<{ label: string; value: number; color: string }>>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);

    const arcs = g.selectAll(".arc").data(pie(pieData)).enter().append("g").attr("class", "arc");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => d.data.color)
      .attr("stroke", "#0D0D0D")
      .attr("stroke-width", 2)
      .style("transition", "transform 0.2s ease")
      .on("mouseover", function () {
        d3.select(this).attr("transform", "scale(1.05)");
      })
      .on("mouseout", function () {
        d3.select(this).attr("transform", "scale(1)");
      });

    // Center text
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.2em")
      .attr("fill", "#FFFFFF")
      .attr("font-size", "22px")
      .attr("font-weight", "bold")
      .text(`${analyticsData.successRate}%`);

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.3em")
      .attr("fill", "rgba(255,255,255,0.5)")
      .attr("font-size", "10px")
      .text("Success Ratio");
  }, [analyticsData]);

  // 4. Render D3 Daily Transactions Bar Chart
  useEffect(() => {
    if (!barChartRef.current) return;

    const svg = d3.select(barChartRef.current);
    svg.selectAll("*").remove();

    const width = barChartRef.current.clientWidth || 600;
    const height = 180;
    const margin = { top: 15, right: 15, bottom: 35, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const data = analyticsData.dailyTrend.slice(-14); // Last 14 days for clean bars

    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.displayDate))
      .range([0, innerWidth])
      .padding(0.3);

    const maxCount = d3.max(data, (d) => d.successfulCount + d.failedCount) || 5;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxCount])
      .range([innerHeight, 0]);

    // X Axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .attr("color", "rgba(255,255,255,0.2)")
      .selectAll("text")
      .attr("fill", "rgba(255,255,255,0.5)")
      .attr("font-size", "9px");

    // Y Axis
    g.append("g")
      .call(d3.axisLeft(yScale).ticks(4))
      .attr("color", "rgba(255,255,255,0.2)")
      .selectAll("text")
      .attr("fill", "rgba(255,255,255,0.5)")
      .attr("font-size", "9px");

    // Bars
    g.selectAll(".bar-success")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(d.displayDate) || 0)
      .attr("y", (d) => yScale(d.successfulCount))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => innerHeight - yScale(d.successfulCount))
      .attr("fill", "#10B981")
      .attr("rx", 3);
  }, [analyticsData]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-[#C5A059]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider text-white/50 uppercase">
              30-Day Total Revenue
            </span>
            <div className="p-2 rounded-xl bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="font-sans font-bold text-2xl text-white tracking-tight">
              KES {analyticsData.totalRevenue.toLocaleString()}
            </h3>
            <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
              <ArrowUpRight className="w-3 h-3" />
              Verified M-Pesa STK settlements
            </p>
          </div>
        </div>

        {/* Successful M-Pesa Transactions */}
        <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider text-white/50 uppercase">
              Successful Payments
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="font-sans font-bold text-2xl text-white tracking-tight">
              {analyticsData.successfulCount}
            </h3>
            <p className="text-[10px] text-white/40 mt-1 font-mono">
              Cleared PIN completed orders
            </p>
          </div>
        </div>

        {/* Failed / Cancelled Ratio */}
        <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-red-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider text-white/50 uppercase">
              Failed / Declined
            </span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="font-sans font-bold text-2xl text-white tracking-tight">
              {analyticsData.failedCount}
            </h3>
            <p className="text-[10px] text-red-400/80 mt-1 font-mono flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              User cancelled or PIN error
            </p>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-[#C5A059]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider text-white/50 uppercase">
              Average Order Value
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="font-sans font-bold text-2xl text-white tracking-tight">
              KES {analyticsData.averageOrderValue.toLocaleString()}
            </h3>
            <p className="text-[10px] text-white/40 mt-1 font-mono">
              Per successful transaction
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Revenue Area Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-[#0D0D0D] border border-white/10 rounded-2xl p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#C5A059]" />
                Daily Revenue Trend (D3.js Visualization)
              </h3>
              <p className="text-white/40 text-xs mt-0.5">
                Real-time sales volume accrued over the last {timeRangeDays} days
              </p>
            </div>
            <div className="flex gap-2">
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => setTimeRangeDays(days)}
                  className={`px-2.5 py-1 text-[10px] font-mono rounded-lg transition-all cursor-pointer ${
                    timeRangeDays === days
                      ? "bg-[#C5A059] text-black font-bold"
                      : "bg-white/5 text-white/50 hover:bg-white/10"
                  }`}
                >
                  {days}D
                </button>
              ))}
            </div>
          </div>

          {selectedBarData && (
            <div className="bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-xl p-2.5 mb-3 flex items-center justify-between text-xs text-white">
              <span className="font-mono text-[11px]">Selected: {selectedBarData.date}</span>
              <span className="font-bold text-[#C5A059]">
                KES {selectedBarData.amount.toLocaleString()} ({selectedBarData.count} orders)
              </span>
            </div>
          )}

          <div className="w-full overflow-x-auto">
            <svg ref={lineChartRef} className="w-full h-auto" />
          </div>
        </div>

        {/* M-Pesa Transaction Ratio Donut Chart (1 Col) */}
        <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#C5A059]" />
              M-Pesa Transaction Ratio
            </h3>
            <p className="text-white/40 text-xs mt-0.5">
              Successful vs. Failed/Cancelled STK push attempts
            </p>
          </div>

          <div className="flex justify-center my-4">
            <svg ref={pieChartRef} className="w-52 h-52" />
          </div>

          {/* Legend */}
          <div className="space-y-2 border-t border-white/5 pt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-white/70">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Successful PIN Cleared
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                {analyticsData.successfulCount}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-white/70">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                Failed / Cancelled
              </span>
              <span className="font-mono text-red-400 font-bold">
                {analyticsData.failedCount}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-white/70">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Awaiting PIN / Pending
              </span>
              <span className="font-mono text-amber-400 font-bold">
                {analyticsData.pendingCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Bar Chart: Daily Completed Orders */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#C5A059]" />
              Daily Completed Order Volumes (14-Day View)
            </h3>
            <p className="text-white/40 text-xs mt-0.5">
              Number of verified completed transactions per day
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
            {analyticsData.totalTransactions} total attempts recorded
          </span>
        </div>
        <svg ref={barChartRef} className="w-full h-auto" />
      </div>
    </div>
  );
}
