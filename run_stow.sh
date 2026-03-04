#!/bin/bash

# Check if stow is installed
if ! command -v stow &> /dev/null; then
  echo "stow is not installed. Please install it first."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Detect platform
case "$OSTYPE" in
  darwin*) PLATFORM="macos" ;;
  linux*)  PLATFORM="linux" ;;
  *)
    echo "Error: Unsupported OS type '$OSTYPE'. Only macOS and Linux are supported."
    exit 1
    ;;
esac

# Stow a package with the given mode
stow_package() {
  local pkg="$1"
  case "${MODE}" in
    run)   stow -d "$SCRIPT_DIR" -t "$HOME" "$pkg" ;;
    force) stow --adopt -d "$SCRIPT_DIR" -t "$HOME" "$pkg" ;;
    *)     stow -n -v -d "$SCRIPT_DIR" -t "$HOME" "$pkg" ;;
  esac
}

MODE="$1"

# Always stow common
stow_package common

# Platform-specific
if [[ "$PLATFORM" == "macos" ]]; then
  stow_package macos
fi

if [[ "$MODE" != "run" && "$MODE" != "force" ]]; then
  echo "Dry run mode (no changes made). Run './run_stow.sh run' to run normally or './run_stow.sh force' to overwrite files."
fi
