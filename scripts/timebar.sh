#!/bin/bash
# Real-time work progress bar
# Usage: bash scripts/timebar.sh
#   or add to .bashrc: source scripts/timebar.sh && timebar

timebar() {
  while true; do
    hour=$(date +%H)
    min=$(date +%M)
    dow=$(date +%u)
    day_name=$(date +%a)
    time_str=$(date +%H:%M)

    # Daily (9am-23pm = 14h window)
    ws=9; we=23; wt=$((we - ws))
    ch=$hour
    [ $ch -lt $ws ] && ch=$ws
    [ $ch -gt $we ] && ch=$we
    de=$((ch - ws))
    dp=$((de * 100 / wt))
    df=$((dp * 10 / 100)); dr=$((10 - df))
    db=""; for i in $(seq 1 $df); do db="${db}▓"; done
    db="${db}│"; for i in $(seq 1 $dr); do db="${db}░"; done

    # Weekly (Mon-Fri, 14h/day = 70h)
    wkt=70
    [ $dow -le 5 ] && wke=$(( (dow-1)*14 + de )) || wke=$wkt
    wp=$((wke * 100 / wkt))
    wf=$((wp * 10 / 100)); wr=$((10 - wf))
    wb=""; for i in $(seq 1 $wf); do wb="${wb}▓"; done
    wb="${wb}│"; for i in $(seq 1 $wr); do wb="${wb}░"; done

    printf "\r  day (%s)  %s %3d%%  │  wk (%s) %s %3d%% " \
      "$time_str" "$db" "$dp" "$day_name" "$wb" "$wp"

    sleep 60
  done
}

timebar
