#!/bin/bash

# Source the .env file and store the output in a variable
ENV_VARS=$(cat .env | sed '/^$/d' | sed 's/^/export /')

# Export the environment variables
eval "$ENV_VARS"
