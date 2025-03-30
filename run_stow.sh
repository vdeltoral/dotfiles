#!/bin/bash

# Check if stow is installed
if ! command -v stow &> /dev/null; then
  echo "stow is not installed. Please install it first."
  exit 1
fi

# Get the directory of the install.sh script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Determine if this is a dry run or actual run
if [[ "$1" == "run" ]]; then
  stow -d "$SCRIPT_DIR" -t "$HOME" .
elif [[ "$1" == "force" ]]; then
  stow --adopt -d "$SCRIPT_DIR" -t "$HOME" .
else
  stow -n -v -d "$SCRIPT_DIR" -t "$HOME" .
  echo "Dry run mode (no changes made). Run './install.sh run' to run normally or './install.sh force' to overwrite files."
fi
