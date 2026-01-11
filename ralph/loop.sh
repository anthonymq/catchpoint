#!/bin/bash
# RALPH Loop for Catchpoint (OpenCode Edition)
# The Ralph Wiggum Technique - autonomous AI development loop
#
# Usage: ./loop.sh [plan] [max_iterations] [--verbose|-v]
# Examples:
#   ./loop.sh              # Build mode, unlimited iterations
#   ./loop.sh 20           # Build mode, max 20 iterations
#   ./loop.sh plan         # Plan mode, unlimited iterations
#   ./loop.sh plan 5       # Plan mode, max 5 iterations
#   ./loop.sh --verbose    # Build mode with full debug logging
#   ./loop.sh plan -v      # Plan mode with full debug logging
#
# Modes:
#   PLAN  - Gap analysis only, creates/updates IMPLEMENTATION_PLAN.md
#   BUILD - Implements from plan, runs tests, commits changes
#
# Flags:
#   --verbose, -v  Enable full debug logging (saved to ralph/logs/)
#
# Based on: https://github.com/ghuntley/how-to-ralph-wiggum

set -e

# Change to project root (parent of ralph/)
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
MODE="build"
PROMPT_FILE="ralph/PROMPT_build.md"
MAX_ITERATIONS=0
VERBOSE=false

for arg in "$@"; do
    case $arg in
        plan)
            MODE="plan"
            PROMPT_FILE="ralph/PROMPT_plan.md"
            ;;
        --verbose|-v)
            VERBOSE=true
            ;;
        *)
            if [[ "$arg" =~ ^[0-9]+$ ]]; then
                MAX_ITERATIONS=$arg
            fi
            ;;
    esac
done

# Create logs directory if verbose mode
LOGS_DIR="ralph/logs"
if [ "$VERBOSE" = true ]; then
    mkdir -p "$LOGS_DIR"
    # Generate session ID for this run
    SESSION_ID=$(date '+%Y%m%d_%H%M%S')
    echo -e "${GREEN}Logs will be saved to: $LOGS_DIR/session_${SESSION_ID}_*.log${NC}"
fi

ITERATION=0
CURRENT_BRANCH=$(git branch --show-current)

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  CATCHPOINT RALPH LOOP${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Mode:    ${YELLOW}$MODE${NC}"
echo -e "  Prompt:  $PROMPT_FILE"
echo -e "  Branch:  $CURRENT_BRANCH"
echo -e "  Project: $PROJECT_ROOT"
[ $MAX_ITERATIONS -gt 0 ] && echo -e "  Max:     ${YELLOW}$MAX_ITERATIONS iterations${NC}"
[ "$VERBOSE" = true ] && echo -e "  Verbose: ${GREEN}ON${NC} (logs in $LOGS_DIR/)"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verify prompt file exists
if [ ! -f "$PROMPT_FILE" ]; then
    echo -e "${RED}Error: $PROMPT_FILE not found${NC}"
    exit 1
fi

# Check opencode is installed
if ! command -v opencode &> /dev/null; then
    echo -e "${RED}Error: opencode CLI not found${NC}"
    echo "Install: curl -fsSL https://opencode.ai/install | bash"
    exit 1
fi

# Trap Ctrl+C for clean exit
trap 'echo -e "\n${YELLOW}RALPH loop interrupted by user${NC}"; exit 0' INT

while true; do
    if [ $MAX_ITERATIONS -gt 0 ] && [ $ITERATION -ge $MAX_ITERATIONS ]; then
        echo -e "${GREEN}Reached max iterations: $MAX_ITERATIONS${NC}"
        break
    fi

    ITERATION=$((ITERATION + 1))
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "  ${GREEN}RALPH ITERATION $ITERATION${NC} - $TIMESTAMP"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo ""

    # Read prompt content
    PROMPT_CONTENT=$(cat "$PROMPT_FILE")
    
    # Run opencode with the prompt (using Sisyphus agent)
    if [ "$VERBOSE" = true ]; then
        LOG_FILE="$LOGS_DIR/session_${SESSION_ID}_iter_$(printf '%03d' $ITERATION).log"
        echo -e "${BLUE}[RALPH] Logging to: $LOG_FILE${NC}"
        
        # Run with debug logging and tee output to both terminal and log file
        opencode run --agent Sisyphus --log-level DEBUG "$PROMPT_CONTENT" 2>&1 | tee "$LOG_FILE"
    else
        opencode run --agent Sisyphus "$PROMPT_CONTENT"
    fi

    # Check if there are changes to push
    if git diff --quiet HEAD 2>/dev/null && git diff --cached --quiet 2>/dev/null; then
        echo -e "${YELLOW}[RALPH] No changes to push${NC}"
    else
        # Check if there are uncommitted changes
        if ! git diff --quiet HEAD 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
            echo -e "${YELLOW}[RALPH] Warning: Uncommitted changes detected${NC}"
        fi
        
        # Push if there are new commits
        LOCAL=$(git rev-parse @ 2>/dev/null)
        REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "none")
        
        if [ "$REMOTE" != "none" ] && [ "$LOCAL" != "$REMOTE" ]; then
            echo -e "${GREEN}[RALPH] Pushing changes...${NC}"
            git push origin "$CURRENT_BRANCH" 2>/dev/null || {
                echo -e "${YELLOW}[RALPH] Creating remote branch...${NC}"
                git push -u origin "$CURRENT_BRANCH"
            }
        fi
    fi

    # Brief pause between iterations to prevent runaway loops
    # and allow for Ctrl+C interrupt window
    sleep 2
done

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  RALPH LOOP COMPLETE - $ITERATION iterations${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
