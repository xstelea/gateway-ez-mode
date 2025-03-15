#!/bin/bash

pnpm format \
&& pnpm all-checks \
&& echo "## Pre-commit checks passed ##"