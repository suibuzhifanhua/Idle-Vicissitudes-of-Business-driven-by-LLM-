#!/usr/bin/env bash
# ==================================================
# run-tests.sh — 三件套回归测试（Git Bash 环境）
#   1) verify-gameplay.mjs    玩法断言（89 项）
#   2) balance-simulation.mjs 真跑 doTick 双场景经济模拟
#   3) test_server_api.py     服务端 API 测试（8 项）
#
# 用法: bash run-tests.sh [SEED] [SIM_HOURS]
#   SEED       随机种子（默认 1）
#   SIM_HOURS  模拟观察点（默认 1,24,72,720；快速版用 1,24,72）
#
# 环境机制说明（本沙箱实测 2026-11-12）：
#   a) node 进程的 fs 写盘与 stdout（文件重定向）均被缓冲，进程死亡前对外不可见 →
#      哨兵与输出标记都只能在进程死后读到，仅作为退出码的补充来源；
#   b) 脚本计算耗时与"进程退出滞留"成固定比例（实测滞留 ≈ 9 × in-script，
#      120h/240h/480h/720h 四档线性验证，与 heap 大小无关，拆分进程无法规避）→
#      720h 全量回归 ≈ 3.5 分钟是本环境物理下限；日常迭代用快速版（SIM_HOURS=1,24,72 ≈ 25s）；
#   c) 退出码优先从输出内容推导（balance 解析 "ok": true/false；verify 解析 FAIL 数），
#      哨兵可见时覆盖（kill -0 失效走 wait 拿真实退出码）。
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
SEED="${1:-1}"
HOURS="${2:-1,24,72,720}"
TMP="C:/Users/A1/AppData/Local/Temp"

# $1=输出文件  $2=完成标记(固定串)  $3=哨兵文件(备份)  其余=命令
run_node_with_marker() {
  local out="$1" marker="$2" sentinel="$3"; shift 3
  : > "$out"
  rm -f "$sentinel"   # 必须清掉上一轮的旧哨兵，否则残留退出码会污染本轮判定
  "$@" > "$out" 2>&1 &
  local pid=$!
  local i code=""
  for i in $(seq 1 960); do   # 最多等 480s
    if grep -qF "$marker" "$out" 2>/dev/null; then
      # 标记后预留 2s：verify 的"捕获异常/警告"段写在结果行之后；同时等哨兵（可能已不可见，无所谓）
      sleep 2
      if [ -f "$sentinel" ]; then code="$(cat "$sentinel")"; fi
      [ -z "$code" ] && code=0
      taskkill //PID "$pid" //F >/dev/null 2>&1 || true
      break
    fi
    if ! kill -0 "$pid" 2>/dev/null; then
      wait "$pid"
      code=$?
      break
    fi
    sleep 0.5
  done
  if [ -z "$code" ]; then
    taskkill //PID "$pid" //F >/dev/null 2>&1 || true
    code=124
  fi
  echo "$code"
}

overall=0

echo "=== 1/3 verify-gameplay (SEED=$SEED) ==="
t0=$(date +%s)
code=$(run_node_with_marker "$TMP/vg.out" "结果:" "/c/Users/A1/AppData/Local/Temp/verify-gameplay.done" env SEED="$SEED" VERIFY_SENTINEL="C:/Users/A1/AppData/Local/Temp/verify-gameplay.done" node "$DIR/verify-gameplay.mjs")
t1=$(date +%s)
summary=$(grep -E "^结果:" "$TMP/vg.out" | tail -1)
# 退出码从输出推导（哨兵在进程死亡前不可见，不可依赖）：
# 失败条件 = 无结果行 / 有 FAIL / 加载错误 / 捕获异常
grep -qE "^结果: [0-9]+ PASS / 0 FAIL$" "$TMP/vg.out" || code=1
grep -q "LOAD ERRORS" "$TMP/vg.out" && code=1
grep -q "捕获异常" "$TMP/vg.out" && code=1
if [ "$code" = "0" ]; then echo "  [OK] ($((t1-t0))s) $summary"; else echo "  [FAIL] exit=$code ($((t1-t0))s)"; echo "$summary"; overall=1; fi

echo "=== 2/3 balance-simulation (SEED=$SEED HOURS=$HOURS) ==="
t0=$(date +%s)
code=$(run_node_with_marker "$TMP/bs.out" '"ok":' "/c/Users/A1/AppData/Local/Temp/balance-sim.done" env SEED="$SEED" SIM_HOURS="$HOURS" SIM_SENTINEL="C:/Users/A1/AppData/Local/Temp/balance-sim.done" node "$DIR/balance-simulation.mjs")
t1=$(date +%s)
# 退出码从输出推导：解析 "ok": true/false
okline=$(grep -oE '"ok": (true|false)' "$TMP/bs.out" | head -1)
case "$okline" in
  '"ok": true') code=0 ;;
  '"ok": false') code=1 ;;
  '') code=1 ;;
esac
if [ "$code" = "0" ]; then
  echo "  [OK] ($((t1-t0))s)"
  node -e "const r=JSON.parse(require('fs').readFileSync('$TMP/bs.out','utf8')); console.log('    in-script: '+r.wallSeconds+'s'); console.log('    scheduled:', JSON.stringify(r.scheduled.horizons), ' passive:', JSON.stringify(r.passive.horizons), ' delta:', JSON.stringify(r.delta));" 2>/dev/null | head -6
else
  echo "  [FAIL] exit=$code ($((t1-t0))s)"; head -c 600 "$TMP/bs.out"; overall=1
fi

echo "=== 3/3 test_server_api.py ==="
t0=$(date +%s)
if timeout 180 python "$DIR/test_server_api.py" -v > "$TMP/api.out" 2>&1; then
  t1=$(date +%s)
  echo "  [OK] ($((t1-t0))s) $(tail -2 "$TMP/api.out" | head -1)"
else
  t1=$(date +%s)
  echo "  [FAIL] ($((t1-t0))s)"; tail -15 "$TMP/api.out"; overall=1
fi

echo
if [ "$overall" = "0" ]; then echo ">>> 三件套全部通过 (SEED=$SEED HOURS=$HOURS)"; else echo ">>> 存在失败项 (SEED=$SEED HOURS=$HOURS)"; fi
exit "$overall"
