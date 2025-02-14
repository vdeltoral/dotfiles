
########################################################################
# GET MACHINE INFO
########################################################################

if [[ $OSTYPE == linux* ]];then
    IS_LINUX=true
elif [[ $OSTYPE == darwin* ]];then
    IS_MACOS=true
else
    echo $0 unknown os type $OSTYPE
    exit 1
fi


if [[ $(uname -n) == VDT-* ]];then
    COMPUTER_LOGO=
elif [[ $(uname -n) == PI-GP ]];then
    IS_PI=true
    COMPUTER_LOGO=π
elif [[ $(uname -n) == PI-NELSON ]];then
    IS_PI=true
    COMPUTER_LOGO=π2
else
    echo $fg[red] "$0 unknown computer $(uname -n)"
fi

########################################################################
# ZSH
########################################################################

export ZSH="${HOME}/.oh-my-zsh"

ZSH_THEME="agnoster"

plugins=(git ssh-agent)

fpath+=${ZSH_CUSTOM:-${ZSH:-~/.oh-my-zsh}/custom}/plugins/zsh-completions/src

[[ $0 = *zsh ]] && source ${ZSH}/oh-my-zsh.sh


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
alias yt-mp4='yt-dlp --cookies-from-browser firefox --no-overwrites --output "~/Downloads/%(title)s.%(ext)s" -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4] / bv*+ba/b" '
alias yt-mp4-720='yt-mp4 -f "bestvideo[height<=720]+bestaudio/best[height<=720]" --output "~/Downloads/%(title)s.%(ext)s" '
alias yt-mp4-1080='yt-mp4 -f "bestvideo[height<=1080]+bestaudio/best[height<=1080]" --output "~/Downloads/%(title)s.%(ext)s" '
alias yt='yt-dlp --cookies-from-browser firefox -x --audio-format mp3 --no-overwrites --output "~/Downloads/%(title)s.%(ext)s" '
#alias yt-mp3='yt-dlp --cookies-from-browser firefox -x --audio-format mp3 --no-overwrites --output "%(title)s.%(ext)s" '
alias yt-mp3='yt-dlp --cookies-from-browser firefox -x --audio-format mp3 --no-overwrites --output "~/Downloads/%(title)s.%(ext)s" '
alias mp3='yt-mp3 '
alias igreel='yt-dlp --cookies-from-browser firefox --no-overwrites -f "bestvideo[height<=1080]+bestaudio/best[height<=1080]"'
alias foldersize='du -sh '
alias s='cot '
alias sl='cot '
alias cz='cot ~/.zshrc '
alias dl='cd ~/Downloads '
alias dlo='open ~/Downloads '
alias myip='curl -s https://api64.ipify.org; echo'
alias myip-local='ip -4 addr show | awk "/inet / {print \$2}" | cut -d/ -f1 | tail -n 1'
[ -f "/var/mail/${USER}" ] && alias mymail='tail /var/mail/${USER} '

# disables TLDR updating almost every time it's run
export TLDR_AUTO_UPDATE_DISABLED='true'


### Machine specific Aliases
if [ "$IS_MACOS" = true ] ; then
    alias ll='ls -laG ' # OSX doesn't use ls --color
    alias brewup='brew update; brew upgrade; brew cleanup; brew doctor'
    export DISPLAY='localhost:0'
fi

###########
# FUNCTIONS
###########
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
pathprepend() { # Prepends a dir to $PATH if it exists and is not already in $PATH
    if [ -d "$1" ] && [[ ":$PATH:" != *":$1:"* ]]; then
        PATH="$1:${PATH:+"$PATH"}"
        export PATH
    fi
}
pathappend() { # Appends a dir to $PATH if it exists and is not already in $PATH
    if [ -d "$1" ] && [[ ":$PATH:" != *":$1:"* ]]; then
        PATH="${PATH:+"$PATH:"}$1"
        export PATH
    fi
}
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
[[ $0 = bash ]] && [ -f ${HOME}/.fzf.bash ] && source ${HOME}/.fzf.bash

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

# https://realpython.com/intro-to-pyenv/
# pyenv install --list | grep " 3\.[678]"
# python3 -m virtualenv --python=/Users/vincent/.pyenv/versions/3.6.9/bin/python myenv-3.6.9


### Machine specific paths
if [ "$IS_MACOS" = true ] ; then
    pathappend "/Users/vincent/Library/Python/3.9/bin"
elif [ "$IS_PI" = true ] ; then
    pathappend "/home/pi/.pyenv/bin"
fi

alias pyr='find . -type d -name __pycache__ -prune | xargs rm -rf; find . -name "*.pyc" | xargs rm -f;' # removes .pyc files and __pycache__ folders

make_python_env () {
    if [ $# -eq 0 ]
      then
        echo "Supply a python version. e.g. 'make_python_env 3.6.9'"
        return
    fi
    PYENV_DIR=$HOME/.pyenv/versions/${1}
    PYENV_BIN=$PYENV_DIR/bin/python
    [ ! -d $PYENV_DIR  ] && pyenv install ${1}
    echo "Creating virtualenv for python version ${1}"
    python3 -m virtualenv --python=$PYENV_BIN myenv-${1} \
    && echo "To activate run:" && echo "source ./myenv-${1}/bin/activate"
}

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

if [ -f ~/.zshrc_personal ]; then
    source ~/.zshrc_personal
fi
