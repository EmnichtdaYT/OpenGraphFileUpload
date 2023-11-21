#!/bin/bash

# Source the .env file and store the output in a variable
ENV_VARS=$(grep -v '^#' .env | sed '/^$/d' | sed 's/^/export /')

# Export the environment variables
eval "$ENV_VARS"
