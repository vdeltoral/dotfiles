# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A macOS dotfiles repository managed with GNU Stow. Files in this repo are symlinked to `$HOME` via Stow, preserving the directory structure (e.g., `bin/` maps to `~/bin/`).

## Installation Commands

```bash
./run_stow.sh          # dry run — preview what will be symlinked
./run_stow.sh run      # install dotfiles (symlink to $HOME)
./run_stow.sh force    # install with --adopt (overwrites conflicts)
brew bundle            # install Homebrew packages from Brewfile
```

## How Stow Works Here

- `run_stow.sh` runs `stow -d <repo> -t $HOME .` to symlink everything
- `.stow-global-ignore` excludes: `.DS_Store`, `run_stow.sh`, `.git`, `.gitignore`, `readme.md`, `Brewfile`
- Any new top-level file/directory added to the repo will be symlinked to `$HOME` unless added to `.stow-global-ignore`
- Files that should NOT be symlinked (repo-only metadata, docs) must be listed in `.stow-global-ignore`

## Key Files

- `.zshrc` — Zsh config with Oh-My-Zsh (agnoster theme), aliases, functions, direnv/pyenv setup
- `.tmux.conf` — Tmux config with custom keybindings and status bar (calls `bin/tmux-status-right.py`)
- `Brewfile` — Homebrew taps, formulas, casks, and VS Code extensions
- `.gitignore_global` — Global gitignore for macOS, Python, Node.js, VS Code

## bin/ Scripts

Custom utilities symlinked to `~/bin/`. All Python scripts use `#!/usr/bin/env python3`. Key ones:

- `camera_import` — DJI/camera media import tool (uses Rich library for UI)
- `grid_splitter` — Split reference sheet images into individual panels (PIL)
- `media_cleanup` / `library_backup` — Media organization and backup tools
- `video_batch` — Batch download videos via yt-dlp
- `dji_lrf_cleanup` — Remove orphaned DJI .LRF sidecar files
- `localip` / `publicip` / `giturl` — Network and git URL utilities

## photoshop/scripts/

JSX scripts for Adobe Photoshop automation (frame overlay compositing, carousel splitting). These are symlinked to `~/photoshop/scripts/`.

## Conventions

- Shell aliases and functions go in `.zshrc` (organized by section: general, docker, git, yt-dlp, tmux)
- New CLI utilities go in `bin/` as executable Python scripts
- Homebrew packages go in `Brewfile` (organized: taps, then brews, then casks, then VS Code extensions)
- The repo targets macOS primarily but `.zshrc` has Linux detection for cross-platform sections
