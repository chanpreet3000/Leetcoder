// Maps LeetCode's language slug (stored in each ./problems/*.json) to the label
// shown in the editor's dropdown. Add an entry to support a new language.
export const LANGUAGE_DISPLAY_MAP = {
  cpp: "C++",
  java: "Java",
  python: "Python",
  python3: "Python3",
  c: "C",
  csharp: "C#",
  javascript: "JavaScript",
  typescript: "TypeScript",
  php: "PHP",
  swift: "Swift",
  kotlin: "Kotlin",
  dart: "Dart",
  golang: "Go",
  ruby: "Ruby",
  scala: "Scala",
  rust: "Rust",
  racket: "Racket",
  erlang: "Erlang",
  elixir: "Elixir",
  bash: "Bash",
  mysql: "MySQL",
  mssql: "MS SQL Server",
};

export const LEETCODER_ASCII_ART = `
     _                    _                _           
    | |                  | |              | |          
    | |     ___  ___  ___| |_ ___ ___   __| | ___ _ __ 
    | |    / _ \\/ _ \\/ _ \\ __/ __/ _ \\ / _| |/ _ \\  __|
    | |___|  __/  __/  __/ || (_| (_) | (_| |  __/ |   
    \\_____/\\___|\\___|\\___|\\__\\___\\___/ \\__,_|\\___|_|
    
    Developed by : Chanpreet Singh
    Github Link : https://github.com/chanpreet3000/Leetcoder
    `;

export const LEETCODER_MODE_QUESTION = `
     Select a mode
     [L] Login to LeetCode (do this first / whenever your session expires).
     [1] Start Leetcode Bot.
     [2] Scrape Solved Leetcode Problems.
     [3] Solve Daily Challenge.
     [F] Review failed problems: why each failed, and skip the ones you want to give up on.
     [C] Check that the LeetCode page still matches what the bot expects (submits nothing).
     [other] Exit.
    `;

export const EXITING_LEETCODER = `Thanks for using Leetcoder. Please report any bugs/issues Github Link : https://github.com/chanpreet3000/Leetcoder`;