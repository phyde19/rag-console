#!/bin/bash

# create venv if not exists

base_dir="/home/phyde19/dev/chat-simulation/backend"
venv_dir="$base_dir/venv"

if [[ ! -d "$venv_dir" ]]; then
    echo "creating virtual environment $venv_dir"
    python -m venv "$venv_dir"
else
    echo "virtual environment $venv_dir already exists"
fi


# source venv if not active

if [[ -z "$VIRTUAL_ENV" ]]; then
    echo "activating venv at $venv_dir"
    source "$venv_dir/bin/activate"
else
    echo "virtual environment already active"
    echo "run 'deactivate' to deactivate"
fi

