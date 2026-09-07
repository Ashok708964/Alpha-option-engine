#!/usr/bin/env bash
# ==============================================================================
# OmniAlpha Quant Engine - OS-Level Optimization & Kernel Tuning Blueprint
# Target Environment: Ubuntu 22.04 / 24.04 LTS High-Frequency Quantitative Node
# ==============================================================================

set -euo pipefail

echo "======================================================================"
echo " OmniAlpha Quant Engine - Low-Latency Linux System Tuning Blueprint   "
echo "======================================================================"

# ------------------------------------------------------------------------------
# 1. TCP Stack & Socket Buffer Sizing (/etc/sysctl.conf)
# ------------------------------------------------------------------------------
cat << 'EOF' > /tmp/99-omnialpha-sysctl.conf
# Maximum Socket Receive/Send Buffers (64 MB)
net.core.rmem_max = 67108864
net.core.wmem_max = 67108864
net.core.rmem_default = 33554432
net.core.wmem_default = 33554432

# TCP Auto-tuning Buffer Limits: min default max (64 MB)
net.ipv4.tcp_rmem = 4096 87380 67108864
net.ipv4.tcp_wmem = 4096 65536 67108864

# Socket Polling (Sub-4us NIC-to-App Latency)
net.core.busy_poll = 50
net.core.busy_read = 50

# TCP Optimization for Streaming Market Data
net.ipv4.tcp_low_latency = 1
net.ipv4.tcp_timestamps = 0
net.ipv4.tcp_sack = 1
net.ipv4.tcp_window_scaling = 1
net.ipv4.tcp_fastopen = 3

# Virtual Memory & Shared Memory Sizing
vm.max_map_count = 262144
vm.swappiness = 1
fs.file-max = 2097152
EOF

echo "[*] Generated sysctl blueprint in /tmp/99-omnialpha-sysctl.conf"
echo "    Apply with: sudo cp /tmp/99-omnialpha-sysctl.conf /etc/sysctl.d/ && sudo sysctl --system"

# ------------------------------------------------------------------------------
# 2. POSIX Shared Memory (/dev/shm) Remounting
# ------------------------------------------------------------------------------
echo "[*] Shared Memory Mount Blueprint:"
echo "    sudo mount -o remount,size=4G /dev/shm"

# ------------------------------------------------------------------------------
# 3. CPU Core Pinning & NUMA Node Isolation Blueprint
# ------------------------------------------------------------------------------
echo "[*] CPU Core Isolation Blueprint (GRUB /etc/default/grub):"
echo "    GRUB_CMDLINE_LINUX_DEFAULT=\"quiet splash isolcpus=2-7 nohz_full=2-7 rcu_nocbs=2-7 processor.max_cstate=1 intel_idle.max_cstate=0 idle=poll\""

echo "[*] Taskset Execution Map:"
echo "    Core 2 (High Priority): taskset -c 2 python3 -m engine.websocket_sharding_ingestion (Shard 0: Nifty Options)"
echo "    Core 3: taskset -c 3 (Shard 1: Megacap Banking & Tech)"
echo "    Core 4: taskset -c 4 (Shard 2: Auto & Consumer)"
echo "    Core 5: taskset -c 5 (Shard 3: Metals & Commodities)"
echo "    Core 6: taskset -c 6 (Shard 4: Pharma & Secondary IT)"
echo "    Core 7: taskset -c 7 (Shard 5: Retail & Midcaps)"
echo "    Cores 8-15: taskset -c 8-15 (NEXUS 17-Subsystem Ensemble & Dispersion Solvers)"

# ------------------------------------------------------------------------------
# 4. Network Interface Card (NIC) Tuning (ethtool)
# ------------------------------------------------------------------------------
echo "[*] NIC Ring Buffer & Interrupt Moderation Blueprint:"
echo "    sudo ethtool -C eth0 rx-usecs 0 adaptive-rx off || true"
echo "    sudo ethtool -G eth0 rx 4096 tx 4096 || true"

# ------------------------------------------------------------------------------
# 5. Systemd Service Blueprint
# ------------------------------------------------------------------------------
cat << 'EOF' > /tmp/omnialpha-ingestion.service
[Unit]
Description=OmniAlpha High-Frequency WebSocket Ingestion Daemon
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/workspace
ExecStart=/usr/bin/python3 -m engine.websocket_sharding_ingestion
Restart=always
RestartSec=2
CPUAffinity=2-7
LimitNOFILE=1048576
LimitMEMLOCK=infinity

[Install]
WantedBy=multi-user.target
EOF

echo "[*] Generated systemd unit file in /tmp/omnialpha-ingestion.service"
echo "======================================================================"
echo "[+] Blueprint ready for institutional deployment."
