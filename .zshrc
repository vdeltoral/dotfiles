
########################################################################
# GET MACHINE INFO
########################################################################

case "$OSTYPE" in
    darwin*) IS_MACOS=true ;;
    linux*)  IS_LINUX=true ;;
    *)       echo "Unknown OS: $OSTYPE" && exit 1 ;;
esac

case "$(uname -n)" in
    VDT-*)   COMPUTER_LOGO="" ;;
    PI-GP)   IS_PI=true; COMPUTER_LOGO="π" ;;
    PI-NELSON) IS_PI=true; COMPUTER_LOGO="π2" ;;
    *)       echo "Unknown computer: $(uname -n)" ;;
esac

########################################################################
# ZSH
########################################################################

export ZSH="${HOME}/.oh-my-zsh"

ZSH_THEME="agnoster"

plugins=(git ssh-agent)

fpath+=${ZSH_CUSTOM:-${ZSH:-~/.oh-my-zsh}/custom}/plugins/zsh-completions/src

source ${ZSH}/oh-my-zsh.sh


########################################################################
# MISC
########################################################################


###########
# ALIASES
###########
alias agi='ag --ignore test --ignore tests --ignore "*.xml" --ignore "*.html" --ignore "*.log*" '
alias c='clear '
alias cl='clear '
alias empty='echo > '
alias ff='find . -name ' # find file by name
alias hg='history | grep ' # searches history
alias ld='ll | grep "^d" | cut -d ":" -f 2 | cut -c 1-3 --complement | grep -v -e "^\.$" -e "^\.\.$"' # ls directories only
alias lh='ll -d .?* ' # ls only hidden '.' files
alias ll='ls -laG --color=auto '
alias perms='stat -c "%U %a %n" ' # gets octal permissions for
alias sudo='sudo ' #allows sudoing of aliases
alias sz='source ${HOME}/.zshrc' #reload .zshrc
alias t='tree -C ' # quick tree
alias ti='treei '
alias treei='tree -C -I "node_modules|__pycache__|lib|venv|soapfish|*~|*#|*.pyc" '
alias watchf="watch -t -d -n 1 'ls ${1} 2> /dev/null'" # Watches for changes in files. If using *, make sure to put arg in quotes.
alias watchft="watch -t -d -n 1 'date; ls ${1} 2>/dev/null'" # watchf with time included
alias igreel='yt-dlp --cookies-from-browser firefox --no-overwrites -f "bestvideo[height<=1080]+bestaudio/best[height<=1080]"'
alias foldersize='du -sh '
alias s='subl '
alias sl='subl '
alias ez='subl ~/.zshrc ' # Edit zshrc
alias dl='cd ~/Downloads '
alias dlo='open ~/Downloads '
alias myip='curl -4 -s https://api64.ipify.org; echo'
alias myip-local='ip -4 addr show | awk "/inet / {print \$2}" | cut -d/ -f1 | tail -n 1'
alias neofetch='fastfetch'

# disables TLDR updating almost every time it's run
export TLDR_AUTO_UPDATE_DISABLED='true'

# Cross-platform ls
if [ "$IS_MACOS" = true ]; then
    alias ll='ls -laG'

else
    alias ll='ls -la --color=auto'
fi

# Machine-specific
[ "$IS_MACOS" = true ] && alias brewup='brew update; brew upgrade; brew cleanup; brew doctor'
[ "$IS_MACOS" = true ] && export DISPLAY='localhost:0'
[ -f "/var/mail/${USER}" ] && alias mymail='tail /var/mail/${USER}'

###########
# YOUTUBE-DLP
###########

# Base alias with common options
alias yt-base='yt-dlp --cookies-from-browser firefox --no-overwrites --output "./%(title)s.%(ext)s"'

# MP3 extraction (one alias, no duplicates)
alias yt-mp3='yt-base -x --audio-format mp3'
alias mp3='yt-mp3'

# MP4 downloads with different quality levels
alias yt-mp4='yt-base -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4] / bv*+ba/b"'
alias yt-mp4-720='yt-mp4 -f "bestvideo[height<=720]+bestaudio/best[height<=720]"'
alias yt-mp4-1080='yt-mp4 -f "bestvideo[height<=1080]+bestaudio/best[height<=1080]"'

# Instagram reels (matches yt-mp4-1080 behavior)
alias igreel='yt-base -f "bestvideo[height<=1080]+bestaudio/best[height<=1080]"'

###########
# FUNCTIONS
###########
lt() { # only display N most recently touched files in directory. N and dir are optional, and can be in any order
    local dir="." count=11
    while [ $# -gt 0 ]; do
        if [[ "$1" =~ ^[0-9]+$ ]]; then
            count=$(( $1 + 1 ))
        else
            dir="$1"
        fi
        shift
    done
    ls -la -t "$dir" | head -n "$count" | grep -v '^total'
}
take() {
    mkdir ${1} && cd ${1}
}
check_newline() {
    git grep --cached -Il '' | xargs -L1 bash -c 'if test "$(tail -c 1 "$0")"; then echo "$0"; exit 1; fi'
}
empty_and_tail() {
    empty ${1} && clear && tail -f ${1}
}

ppath() { # prints the path variable, each entry on a new line
    tr ':' '\n' <<< ${PATH}
}
pathprepend() { [ -d "$1" ] && PATH="$1${PATH:+:$PATH}"; } # Prepends a dir to $PATH if it exists and is not already in $PATH
pathappend() { [ -d "$1" ] && PATH="${PATH:+${PATH}:}$1"; } # Appends a dir to $PATH if it exists and is not already in $PATH
typeset -U PATH  # Ensures no duplicates in PATH

pathremove() { # Removes a dir from $PATH if it exists
    if [[ ":$PATH:" == *":$1:"* ]]; then
        PATH=$(echo "$PATH" | sed -e "s#:$1##" -e 's#^:##' -e 's#:*$##')
        export PATH
    fi
}

pathappend ${HOME}/bin
pathremove /opt/homebrew/bin && pathprepend /opt/homebrew/bin
pathappend /opt/homebrew/sbin

[ -d "/usr/local/go/bin" ] && pathappend "/usr/local/go/bin"
[ -d "${HOME}/go/bin" ] && pathappend "${HOME}/go/bin"

[[ $0 = *zsh ]] && [ -f ${HOME}/.fzf.zsh ] && source ${HOME}/.fzf.zsh

SAVEHIST=10000000
export EDITOR='nano'

########################################################################
# PROMPT
########################################################################

# Display non-0 exit codes
# https://zenbro.github.io/2015/07/23/show-exit-code-of-last-command-in-zsh.html
check_last_exit_code() {
    local LAST_EXIT_CODE=$?
    if [[ ${LAST_EXIT_CODE} -ne 0 ]]; then
        local EXIT_CODE_PROMPT=' '
        EXIT_CODE_PROMPT+="%F{red}[$LAST_EXIT_CODE]%f"

        echo ${EXIT_CODE_PROMPT}
    fi
}

setopt prompt_subst
RPROMPT='$(check_last_exit_code)'

if [ -n "$COMPUTER_LOGO" ]; then
  # Context: user@hostname (who am I and where am I)
  prompt_context() {
    if [[ "$USER" != "$DEFAULT_USER" || -n "$SSH_CLIENT" ]]; then
      prompt_segment black default $COMPUTER_LOGO
    fi
}
fi

########################################################################
# PYTHON
########################################################################

# direnv to automatically load & unload virtual environments
command -v direnv >/dev/null && eval "$(direnv hook zsh)"
export DIRENV_LOG_FORMAT="" # remove chatter

alias pyr='find . -type d -name __pycache__ -prune | xargs rm -rf; find . -name "*.pyc" | xargs rm -f;' # removes .pyc files and __pycache__ folders

alias make_python_env='python -m venv .venv && echo "source .venv/bin/activate" > .envrc && direnv allow'
alias venv='[[ -f ./.venv/bin/activate ]] && source ./.venv/bin/activate'


pathappend $PYENV_ROOT/bin
eval "$(pyenv init --path)"
eval "$(pyenv init - zsh)"


########################################################################
# MAN PAGES
########################################################################

# colorize man pages
export LESS_TERMCAP_mb=$'\e[1;32m'
export LESS_TERMCAP_md=$'\e[1;32m'
export LESS_TERMCAP_me=$'\e[0m'
export LESS_TERMCAP_se=$'\e[0m'
export LESS_TERMCAP_so=$'\e[01;33m'
export LESS_TERMCAP_ue=$'\e[0m'
export LESS_TERMCAP_us=$'\e[1;4;31m'

########################################################################
# TMUX
########################################################################

create_primary_session() {
    if ! tmux has-session -t PRIMARY 2>/dev/null; then
        tmux new-session -s PRIMARY -d
        tmux new-window -t PRIMARY:2
        tmux new-window -t PRIMARY:3
        tmux select-window -t PRIMARY:1
    fi
}

create_secondary_session() {
    if ! tmux has-session -t SECONDARY 2>/dev/null; then
        tmux new-session -s SECONDARY -d
        tmux new-window -t SECONDARY:2
        tmux new-window -t SECONDARY:3
        tmux select-window -t SECONDARY:1
    fi
}

create_tmux_sessions() {
    create_primary_session
    create_secondary_session
}

# Run on new shell
# create_tmux_sessions &


alias tmuxrs='tmux kill-server 2>/dev/null; create_tmux_sessions'
alias tmuxrsa='tmux kill-server 2>/dev/null; create_tmux_sessions; tmux attach-session -t PRIMARY'
alias tmuxrsb='tmux kill-server 2>/dev/null; create_tmux_sessions; tmux attach-session -t SECONDARY'
alias tma='create_primary_session; tmux attach-session -t PRIMARY'
alias tmb='create_secondary_session; tmux attach-session -t SECONDARY'

########################################################################
# GIT
########################################################################

git_current_branch() {
    git symbolic-ref -q HEAD | sed -e 's|^refs/heads/||'
}
alias gco='git checkout'
alias gcb='git checkout -b'
alias gpsup='[ "$(git_current_branch)" != "main" ] && [ "$(git_current_branch)" != "master" ] && git push --set-upstream origin $(git_current_branch) || echo "Use a branch other than main/master."'
alias gbr='gco "master" && git branch | grep -v "master" | xargs git branch -D'
alias ga='git add '
alias gap='git add -p .'
alias gds='git diff --staged '
alias grfm='git fetch origin master:master' # update master branch without switching
git_touched() {
    TOUCHED_FILES=$(git status -s | grep '^A\|^\ M' | rev | cut -d' ' -f1 | rev)
}


########################################################################
# DOCKER
########################################################################

dbash() {
    # If exact container name matches, exec in
    # Else use it as container name for docker-compose
    if [[ $(docker ps -f name=${1} | grep -w ${1}) ]]; then
        docker exec -it ${1} /bin/bash;
    else
        docker-compose exec ${1} /bin/bash;
    fi
}

docker_nuke() {
    # Deletes all
    if read -q "choice?PRESS 'Y/y' TO DELETE ALL docker CONTNAINERS AND IMAGES!!! : "; then
        echo
        docker stop $(docker ps -a -q)
        docker rm $(docker ps -a -q)
        docker volume prune -f
    else
        echo
        echo "'$choice' not 'Y' or 'y'. Exiting..."
    fi
}

alias pishrink='docker run -it --rm --privileged=true -v $(pwd):/workdir pishrink'

########################################################################
# OUTSIDE OF VERSION CONTROL
########################################################################

if [ -f ~/.zshrc_personal ]; then
    source ~/.zshrc_personal
fi
