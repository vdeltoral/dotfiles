# If you come from bash you might have to change your $PATH.
# export PATH=$HOME/bin:/usr/local/bin:$PATH

if [[ $OSTYPE == linux* ]];then
    IS_LINUX=true
elif [[ $OSTYPE == darwin* ]];then
    IS_MACOS=true
else
    echo $0 unknown os type $OSTYPE
    exit 1
fi


if [[ $(uname -n) == WIL* ]];then
    IS_WORK=true
    COMPUTER_LOGO=÷
elif [[ $(uname -n) == VDT-SURFACE ]];then
    IS_HOME=true
    COMPUTER_LOGO=❖
elif [[ $(uname -n) == VDT-PI ]];then
    IS_PI=true
    COMPUTER_LOGO=π
else
    echo $0 unknown computer $(uname -n)
    exit 1
fi

# Path to your oh-my-zsh installation.
export ZSH="${HOME}/.oh-my-zsh"



# Set name of the theme to load --- if set to "random", it will
# load a random theme each time oh-my-zsh is loaded, in which case,
# to know which specific one was loaded, run: echo $RANDOM_THEME
# See https://github.com/robbyrussell/oh-my-zsh/wiki/Themes
ZSH_THEME="agnoster"

# Set list of themes to pick from when loading at random
# Setting this variable when ZSH_THEME=random will cause zsh to load
# a theme from this variable instead of looking in ~/.oh-my-zsh/themes/
# If set to an empty array, this variable will have no effect.
# ZSH_THEME_RANDOM_CANDIDATES=( "robbyrussell" "agnoster" )

# Uncomment the following line to use case-sensitive completion.
# CASE_SENSITIVE="true"

# Uncomment the following line to use hyphen-insensitive completion.
# Case-sensitive completion must be off. _ and - will be interchangeable.
# HYPHEN_INSENSITIVE="true"

# Uncomment the following line to disable bi-weekly auto-update checks.
# DISABLE_AUTO_UPDATE="true"

# Uncomment the following line to automatically update without prompting.
# DISABLE_UPDATE_PROMPT="true"

# Uncomment the following line to change how often to auto-update (in days).
# export UPDATE_ZSH_DAYS=13

# Uncomment the following line if pasting URLs and other text is messed up.
# DISABLE_MAGIC_FUNCTIONS=true

# Uncomment the following line to disable colors in ls.
# DISABLE_LS_COLORS="true"

# Uncomment the following line to disable auto-setting terminal title.
# DISABLE_AUTO_TITLE="true"

# Uncomment the following line to enable command auto-correction.
# ENABLE_CORRECTION="true"

# Uncomment the following line to display red dots whilst waiting for completion.
# COMPLETION_WAITING_DOTS="true"

# Uncomment the following line if you want to disable marking untracked files
# under VCS as dirty. This makes repository status check for large repositories
# much, much faster.
# DISABLE_UNTRACKED_FILES_DIRTY="true"

# Uncomment the following line if you want to change the command execution time
# stamp shown in the history command output.
# You can set one of the optional three formats:
# "mm/dd/yyyy"|"dd.mm.yyyy"|"yyyy-mm-dd"
# or set a custom format using the strftime function format specifications,
# see 'man strftime' for details.
# HIST_STAMPS="mm/dd/yyyy"

# Would you like to use another custom folder than $ZSH/custom?
# ZSH_CUSTOM=/path/to/new-custom-folder

# Which plugins would you like to load?
# Standard plugins can be found in ~/.oh-my-zsh/plugins/*
# Custom plugins may be added to ~/.oh-my-zsh/custom/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# Add wisely, as too many plugins slow down shell startup.
plugins=(git)

[[ $0 = *zsh ]] && source $ZSH/oh-my-zsh.sh

# User configuration

# export MANPATH="/usr/local/man:$MANPATH"

# You may need to manually set your language environment
# export LANG=en_US.UTF-8

# Preferred editor for local and remote sessions
# if [[ -n $SSH_CONNECTION ]]; then
#   export EDITOR='vim'
# else
#   export EDITOR='mvim'
# fi

# Compilation flags
# export ARCHFLAGS="-arch x86_64"

# Set personal aliases, overriding those provided by oh-my-zsh libs,
# plugins, and themes. Aliases can be placed here, though oh-my-zsh
# users are encouraged to define aliases within the ZSH_CUSTOM folder.
# For a full list of active aliases, run `alias`.
#
# Example aliases
# alias zshconfig="mate ~/.zshrc"
# alias ohmyzsh="mate ~/.oh-my-zsh"

########################################################################
# MISC ALIASES AND SHORTCUTS
########################################################################

alias sudo='sudo ' #allows sudoing of aliases
alias ll='ls -laG '
alias lh='ll -d .?* ' # ls only hidden '.' files
alias ld='ll | grep "^d" | cut -d ":" -f 2 | cut -c 1-3 --complement | grep -v -e "^\.$" -e "^\.\.$"' # ls directories only
lt() { # only display N most recently touched files in directory. N and dir are optional, and can be in any order
    re_num='^[0-9]+$'
    search_dir=$(pwd)
    display_count=11

    # 1 arg, either search_dir or display_count
    if ! [ -z "${1}" ] && [ -z "${2}" ]
    then
        if [[ "${1}" =~ ${re_num} ]]
        then
            display_count=$((${1} + 1))
        else
            search_dir=${1}
        fi
    fi

    # 2 args, 1 is search_dir, other is display_count
    if ! [ -z "${1}" ] && ! [ -z "${2}" ]
    then
        if [[ "${1}" =~ ${re_num} ]]
        then
            display_count=$((${1} + 1))
            search_dir=${2}
        else
            display_count=$((${2} + 1))
            search_dir=${1}
        fi
    fi

    ll -t ${search_dir} | head -n ${display_count} | grep -v '^total'
}
alias ppath="tr ':' '\n' <<< $PATH" # prints the path variable, each entry on a new line
alias hg='history | grep ' # searches history
alias perms='stat -c "%U %a %n" ' # gets octal permissions for
alias t='tree -C ' # quick tree
alias treei='tree -C -I "node_modules|__pycache__|lib|venv|soapfish|*~|*#|*.pyc" '
alias ti='treei '
alias agi='ag --ignore test --ignore tests --ignore "*.xml" --ignore "*.html" --ignore "*.log*" '
alias empty='echo > '
alias watchf="watch -t -d -n 1 'ls ${1} 2> /dev/null'" # Watches for changes in files. If using *, make sure to put arg in quotes.
alias watchft="watch -t -d -n 1 'date; ls ${1} 2>/dev/null'" # watchf with time included
alias ff='find . -name ' # find file by name
alias cl='clear '
alias c='clear '
alias s='subl ' #sublime
alias sl='subl ' #sublime
alias pyr='find . -type d -name __pycache__ -prune | xargs rm -rf; find . -name "*.pyc" | xargs rm -f;' # removes .pyc files and __pycache__ folders
alias youtube-dl='youtube-dl --no-overwrites --output "%(title)s.%(ext)s" '
alias catmd='mdcat '
alias sz='source ${HOME}/.zshrc'
alias ez='subl ${HOME}/.zshrc' #edit emacs

take() {
    mkdir ${1} && cd ${1}
}
check_newline() {
    git grep --cached -Il '' | xargs -L1 bash -c 'if test "$(tail -c 1 "$0")"; then echo "$0"; exit 1; fi'
}
empty_and_tail() {
    empty ${1} && clear && tail -f ${1}
}

pathadd() { # adds a dir to $PATH if it exists and is not already in $PATH
    if [ -d "$1" ] && [[ ":$PATH:" != *":$1:"* ]]; then
        PATH="${PATH:+"$PATH:"}$1"
    fi
}
pathadd ${HOME}/bin

if [ "$IS_MACOS" = true ] ; then
    alias ll='ls -laG '
    alias ppath="tr ':' '\n' <<< $PATH" # prints the path variable, each entry on a new line
    alias s='subl ' #sublime
    alias brewup='brew update; brew upgrade; brew cleanup; brew doctor'
else
    # Linux
    alias ll='ls -laG --color=auto '
    alias s='TODO ' #sublime
    alias wopen='wsl-open ' # npm package to "open" in WSL
fi

if [ "$IS_WORK" = true ] ; then
    alias handycommands='mdcat ${HOME}/handy_commands.md'
    export GITHUB_OAUTH_TOKEN=$(cat ${HOME}/.ssh/github-pull-repos-token)
fi


[[ $0 = *zsh ]] && [ -f ${HOME}/.fzf.zsh ] && source ${HOME}/.fzf.zsh
[[ $0 = bash ]] && [ -f ${HOME}/.fzf.bash ] && source ${HOME}/.fzf.bash

SAVEHIST=10000000

########################################################################
# EMACS
########################################################################

emacs_selected_version='/usr/local/bin/emacs'
emacs_window() {
    #DISPLAY=localhost:16.0 ${emacs_selected_version} ${1} &
    ${emacs_selected_version} ${1} &
}
alias emacsw=emacs_window ${1}
alias ew=emacs_window ${1}
alias emacs='${emacs_selected_version} -nw '
alias e='emacs '
ero() { # emacs read only
    ${emacs_selected_version} "${@}" --eval '(setq buffer-read-only t)'
}
alias emr="find . -name '#*#' -o -name '*~' | xargs rm -f" # remove emacs backup files in current directory and subdirectories



export EDITOR='emacs -nw '

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

tmuxrs() {
    [ ! -z ${TMUX} ] && echo "Cannot restart tmux from within in a tmux session." && return

    tmux kill-server
    sleep 0.1
    tmux new -d -s "PRIMARY"
    tmux new-window
    tmux new-window
    tmux next-window # go to first window
    tmux new -d -s "SECONDARY"
    tmux new-window
    tmux new-window
    tmux next-window # go to first window
    tmux ls
}
alias tma='tmux attach -t PRIMARY '
alias tmb='tmux attach -t SECONDARY '
alias tmuxrsa='tmuxrs && tma '

########################################################################
# GIT
########################################################################

git_current_branch() {
    git symbolic-ref -q HEAD | sed -e 's|^refs/heads/||'
}
alias gco='git checkout'
alias gcb='git checkout -b'
alias gpsup='[ $(git_current_branch) != "master" ] && git push --set-upstream origin $(git_current_branch) || echo "Use a branch other than master."'
alias gbr='gco "master" && git branch | grep -v "master" | xargs git branch -D'
alias ga='git add '
alias gap='git add -p .'
alias gds='git diff --staged '
alias grfm='git fetch origin master:master' # update master branch without switching


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
