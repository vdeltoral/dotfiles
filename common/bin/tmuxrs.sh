#!/usr/bin/env bash

[ ! -Z ${TMUX} ] && echo "Cannot restart tmux from within in a tmux session." && return

tmux kill-server > /dev/null 2>&1
sleep 0.1
tmux new -d -s "ONE"
tmux new-window
tmux new-window
tmux next-window # go to first window
tmux new -d -s "TWO"
tmux new-window
tmux new-window
tmux next-window # go to first window
tmux new -d -s "THREE"
tmux new-window
tmux new-window
tmux next-window # go to first window
#tmux ls
