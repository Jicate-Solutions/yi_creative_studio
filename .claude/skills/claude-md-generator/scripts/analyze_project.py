#!/usr/bin/env python3
"""
Project Analyzer for CLAUDE.md Generation

Analyzes any project directory and outputs structured information
about tech stack, patterns, commands, and conventions.

Usage:
    python analyze_project.py [project_path]

If no path provided, analyzes current directory.
"""

import os
import sys
import json
import re
from pathlib import Path
from typing import Dict, List, Optional, Any

class ProjectAnalyzer:
    def __init__(self, project_path: str = "."):
        self.project_path = Path(project_path).resolve()
        self.analysis = {
            "project_name": self.project_path.name,
            "tech_stack": {},
            "commands": {},
            "structure": {},
            "conventions": {},
            "env_vars": [],
            "database": None,
            "testing": {},
            "important_files": []
        }

    def analyze(self) -> Dict[str, Any]:
        """Run full project analysis."""
        self._detect_tech_stack()
        self._extract_commands()
        self._analyze_structure()
        self._detect_conventions()
        self._find_env_vars()
        self._detect_database()
        self._detect_testing()
        self._find_important_files()
        return self.analysis

    def _detect_tech_stack(self):
        """Detect frameworks, languages, and tools."""
        stack = self.analysis["tech_stack"]
        
        # Node.js / JavaScript / TypeScript
        package_json = self.project_path / "package.json"
        if package_json.exists():
            with open(package_json, 'r', encoding='utf-8') as f:
                try:
                    pkg = json.load(f)
                    deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
                    
                    # Framework detection
                    if "next" in deps:
                        version = deps.get("next", "").replace("^", "").replace("~", "")
                        stack["framework"] = f"Next.js {version}"
                    elif "nuxt" in deps:
                        stack["framework"] = "Nuxt.js"
                    elif "gatsby" in deps:
                        stack["framework"] = "Gatsby"
                    elif "vue" in deps:
                        stack["framework"] = "Vue.js"
                    elif "react" in deps:
                        stack["framework"] = "React"
                    elif "express" in deps:
                        stack["framework"] = "Express.js"
                    elif "fastify" in deps:
                        stack["framework"] = "Fastify"
                    
                    # Language
                    if "typescript" in deps:
                        stack["language"] = "TypeScript"
                    else:
                        stack["language"] = "JavaScript"
                    
                    # UI Framework
                    if "tailwindcss" in deps:
                        stack["styling"] = "Tailwind CSS"
                    if "@mui/material" in deps:
                        stack["styling"] = "Material UI"
                    if "styled-components" in deps:
                        stack["styling"] = "styled-components"
                    
                    # shadcn/ui detection
                    if (self.project_path / "components.json").exists():
                        stack["ui_components"] = "shadcn/ui"
                    
                    # State Management
                    if "@tanstack/react-query" in deps:
                        stack["state"] = "React Query"
                    elif "zustand" in deps:
                        stack["state"] = "Zustand"
                    elif "@reduxjs/toolkit" in deps or "redux" in deps:
                        stack["state"] = "Redux"
                    
                    # ORM
                    if "@prisma/client" in deps:
                        stack["orm"] = "Prisma"
                    elif "drizzle-orm" in deps:
                        stack["orm"] = "Drizzle"
                    
                except json.JSONDecodeError:
                    pass
        
        # Python
        if (self.project_path / "requirements.txt").exists():
            stack["language"] = "Python"
            with open(self.project_path / "requirements.txt", 'r') as f:
                reqs = f.read().lower()
                if "django" in reqs:
                    stack["framework"] = "Django"
                elif "fastapi" in reqs:
                    stack["framework"] = "FastAPI"
                elif "flask" in reqs:
                    stack["framework"] = "Flask"
        
        if (self.project_path / "pyproject.toml").exists():
            stack["language"] = "Python"
        
        # Rust
        if (self.project_path / "Cargo.toml").exists():
            stack["language"] = "Rust"
        
        # Go
        if (self.project_path / "go.mod").exists():
            stack["language"] = "Go"
        
        # Ruby
        if (self.project_path / "Gemfile").exists():
            stack["language"] = "Ruby"
            if (self.project_path / "config" / "routes.rb").exists():
                stack["framework"] = "Ruby on Rails"
        
        # Java
        if (self.project_path / "pom.xml").exists():
            stack["language"] = "Java"
            stack["build_tool"] = "Maven"
        elif (self.project_path / "build.gradle").exists():
            stack["language"] = "Java/Kotlin"
            stack["build_tool"] = "Gradle"
        
        # .NET
        csproj_files = list(self.project_path.glob("*.csproj"))
        if csproj_files:
            stack["language"] = "C#"
            stack["framework"] = ".NET"

    def _extract_commands(self):
        """Extract available commands from package.json, Makefile, etc."""
        commands = self.analysis["commands"]
        
        # package.json scripts
        package_json = self.project_path / "package.json"
        if package_json.exists():
            with open(package_json, 'r', encoding='utf-8') as f:
                try:
                    pkg = json.load(f)
                    scripts = pkg.get("scripts", {})
                    
                    # Categorize scripts
                    for name, cmd in scripts.items():
                        if name in ["dev", "start", "serve"]:
                            commands.setdefault("development", {})[name] = cmd
                        elif name in ["build", "compile"]:
                            commands.setdefault("build", {})[name] = cmd
                        elif "test" in name:
                            commands.setdefault("test", {})[name] = cmd
                        elif name in ["lint", "format", "prettier", "eslint"]:
                            commands.setdefault("quality", {})[name] = cmd
                        elif "db" in name or "migrate" in name or "seed" in name:
                            commands.setdefault("database", {})[name] = cmd
                        else:
                            commands.setdefault("other", {})[name] = cmd
                except json.JSONDecodeError:
                    pass
        
        # Makefile
        makefile = self.project_path / "Makefile"
        if makefile.exists():
            with open(makefile, 'r', encoding='utf-8') as f:
                content = f.read()
                targets = re.findall(r'^([a-zA-Z_-]+):', content, re.MULTILINE)
                commands["make_targets"] = targets

    def _analyze_structure(self):
        """Analyze directory structure."""
        structure = self.analysis["structure"]
        
        # Common directories to look for
        common_dirs = [
            "app", "src", "pages", "components", "lib", "utils", 
            "hooks", "services", "api", "types", "interfaces",
            "models", "views", "controllers", "routes", "middleware",
            "config", "public", "static", "assets", "styles",
            "tests", "__tests__", "spec", "test"
        ]
        
        for dir_name in common_dirs:
            dir_path = self.project_path / dir_name
            if dir_path.is_dir():
                # Count files
                files = list(dir_path.rglob("*"))
                file_count = len([f for f in files if f.is_file()])
                structure[dir_name] = {
                    "exists": True,
                    "file_count": file_count,
                    "purpose": self._guess_dir_purpose(dir_name)
                }

    def _guess_dir_purpose(self, dir_name: str) -> str:
        """Guess the purpose of a directory by name."""
        purposes = {
            "app": "Next.js App Router pages and layouts",
            "src": "Source code",
            "pages": "Page components / routes",
            "components": "Reusable UI components",
            "lib": "Utility functions and shared code",
            "utils": "Utility/helper functions",
            "hooks": "Custom React hooks",
            "services": "Business logic and API services",
            "api": "API routes",
            "types": "TypeScript type definitions",
            "interfaces": "TypeScript interfaces",
            "models": "Data models",
            "views": "View templates",
            "controllers": "Request handlers",
            "routes": "Route definitions",
            "middleware": "Middleware functions",
            "config": "Configuration files",
            "public": "Static assets (served as-is)",
            "static": "Static files",
            "assets": "Images, fonts, etc.",
            "styles": "CSS/styling files",
            "tests": "Test files",
            "__tests__": "Jest test files",
            "spec": "Test specifications",
            "test": "Test files"
        }
        return purposes.get(dir_name, "")

    def _detect_conventions(self):
        """Detect naming and coding conventions."""
        conventions = self.analysis["conventions"]
        
        # Check component files for naming convention
        components_dir = self.project_path / "components"
        if not components_dir.exists():
            components_dir = self.project_path / "src" / "components"
        
        if components_dir.exists():
            files = list(components_dir.glob("**/*.tsx")) + list(components_dir.glob("**/*.jsx"))
            if files:
                sample = files[:5]
                names = [f.stem for f in sample]
                
                if all(n[0].isupper() for n in names if n):
                    conventions["component_naming"] = "PascalCase"
                elif all("-" in n for n in names if n):
                    conventions["component_naming"] = "kebab-case"
                elif all("_" in n for n in names if n):
                    conventions["component_naming"] = "snake_case"
        
        # Check for hooks naming
        hooks_dir = self.project_path / "hooks"
        if not hooks_dir.exists():
            hooks_dir = self.project_path / "src" / "hooks"
        
        if hooks_dir.exists():
            files = list(hooks_dir.glob("**/*.ts")) + list(hooks_dir.glob("**/*.tsx"))
            if files:
                sample = [f.stem for f in files[:5]]
                if all(n.startswith("use") for n in sample if n):
                    conventions["hook_naming"] = "useXxx (camelCase with 'use' prefix)"

    def _find_env_vars(self):
        """Find environment variable patterns."""
        env_files = [".env", ".env.local", ".env.example", ".env.sample"]
        
        for env_file in env_files:
            env_path = self.project_path / env_file
            if env_path.exists():
                with open(env_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            var_name = line.split("=")[0].strip()
                            # Don't include actual values, just names
                            if var_name not in self.analysis["env_vars"]:
                                self.analysis["env_vars"].append(var_name)

    def _detect_database(self):
        """Detect database type and configuration."""
        # Supabase
        if (self.project_path / "supabase").exists():
            self.analysis["database"] = "Supabase"
            return
        
        # Check env vars for hints
        for var in self.analysis["env_vars"]:
            var_upper = var.upper()
            if "SUPABASE" in var_upper:
                self.analysis["database"] = "Supabase"
                return
            elif "MONGODB" in var_upper or "MONGO" in var_upper:
                self.analysis["database"] = "MongoDB"
                return
            elif "POSTGRES" in var_upper or "PG_" in var_upper:
                self.analysis["database"] = "PostgreSQL"
                return
            elif "MYSQL" in var_upper:
                self.analysis["database"] = "MySQL"
                return
            elif "FIREBASE" in var_upper:
                self.analysis["database"] = "Firebase"
                return

    def _detect_testing(self):
        """Detect testing framework and setup."""
        testing = self.analysis["testing"]
        
        package_json = self.project_path / "package.json"
        if package_json.exists():
            with open(package_json, 'r', encoding='utf-8') as f:
                try:
                    pkg = json.load(f)
                    deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
                    
                    if "jest" in deps:
                        testing["framework"] = "Jest"
                    elif "vitest" in deps:
                        testing["framework"] = "Vitest"
                    elif "mocha" in deps:
                        testing["framework"] = "Mocha"
                    
                    if "@testing-library/react" in deps:
                        testing["utilities"] = "React Testing Library"
                    if "playwright" in deps or "@playwright/test" in deps:
                        testing["e2e"] = "Playwright"
                    if "cypress" in deps:
                        testing["e2e"] = "Cypress"
                except json.JSONDecodeError:
                    pass

    def _find_important_files(self):
        """Find important configuration files."""
        important = [
            "README.md", "CONTRIBUTING.md", "LICENSE",
            "tsconfig.json", "next.config.js", "next.config.mjs", "next.config.ts",
            "tailwind.config.js", "tailwind.config.ts",
            "prisma/schema.prisma", "drizzle.config.ts",
            ".eslintrc.js", ".eslintrc.json", "eslint.config.js",
            ".prettierrc", ".prettierrc.json",
            "docker-compose.yml", "Dockerfile"
        ]
        
        for file_path in important:
            if (self.project_path / file_path).exists():
                self.analysis["important_files"].append(file_path)

    def generate_claude_md(self) -> str:
        """Generate CLAUDE.md content based on analysis."""
        a = self.analysis
        stack = a["tech_stack"]
        
        md = f"""# CLAUDE.md - {a['project_name']}

## Project Overview
[TODO: Add brief description of what this project does]

## Tech Stack
"""
        # Tech stack section
        if stack.get("framework"):
            md += f"- **Framework:** {stack['framework']}\n"
        if stack.get("language"):
            md += f"- **Language:** {stack['language']}\n"
        if a.get("database"):
            md += f"- **Database:** {a['database']}\n"
        if stack.get("styling"):
            md += f"- **Styling:** {stack['styling']}\n"
        if stack.get("ui_components"):
            md += f"- **UI Components:** {stack['ui_components']}\n"
        if stack.get("state"):
            md += f"- **State Management:** {stack['state']}\n"
        if stack.get("orm"):
            md += f"- **ORM:** {stack['orm']}\n"

        # Commands section
        md += "\n## Quick Commands\n```bash\n"
        
        for category, cmds in a["commands"].items():
            if category == "make_targets":
                continue
            md += f"# {category.title()}\n"
            if isinstance(cmds, dict):
                for name, _ in cmds.items():
                    md += f"npm run {name}\n"
            md += "\n"
        
        md += "```\n"

        # Structure section
        md += "\n## Project Structure\n```\n"
        for dir_name, info in a["structure"].items():
            if info.get("exists"):
                purpose = info.get("purpose", "")
                md += f"{dir_name}/".ljust(20) + f"# {purpose}\n"
        md += "```\n"

        # Conventions section
        if a["conventions"]:
            md += "\n## Code Conventions\n\n### Naming\n"
            if a["conventions"].get("component_naming"):
                md += f"- Components: {a['conventions']['component_naming']}\n"
            if a["conventions"].get("hook_naming"):
                md += f"- Hooks: {a['conventions']['hook_naming']}\n"

        # Env vars section
        if a["env_vars"]:
            md += "\n## Environment Variables\n```env\n"
            for var in a["env_vars"][:10]:  # Limit to first 10
                md += f"{var}=\n"
            md += "```\n"

        # Testing section
        if a["testing"]:
            md += "\n## Testing\n"
            if a["testing"].get("framework"):
                md += f"- **Framework:** {a['testing']['framework']}\n"
            if a["testing"].get("utilities"):
                md += f"- **Utilities:** {a['testing']['utilities']}\n"
            if a["testing"].get("e2e"):
                md += f"- **E2E:** {a['testing']['e2e']}\n"

        # Important notes section
        md += """
## Important Notes
- [TODO: Add any gotchas or important information]
- [TODO: Add specific patterns to follow]
- [TODO: Add things to avoid]

## Session Management

### Starting a New Session
1. Review recent changes: `git log --oneline -5`
2. Check current branch: `git branch --show-current`
3. Understand context before making changes

### During Development
- Test changes incrementally
- Commit logical units of work
- Update this file if patterns change
"""

        return md

    def to_json(self) -> str:
        """Return analysis as JSON."""
        return json.dumps(self.analysis, indent=2)


def main():
    # Filter out flags to get project path
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    project_path = args[0] if args else "."
    
    analyzer = ProjectAnalyzer(project_path)
    analysis = analyzer.analyze()
    
    # Output format based on args
    if "--json" in sys.argv:
        print(analyzer.to_json())
    elif "--generate" in sys.argv:
        claude_md = analyzer.generate_claude_md()
        print(claude_md)
        
        # Optionally write to file
        if "--write" in sys.argv:
            output_path = Path(project_path) / "CLAUDE.md"
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(claude_md)
            print(f"\nWritten to: {output_path}", file=sys.stderr)
    else:
        # Default: print summary
        print(f"Project: {analysis['project_name']}")
        print(f"\nTech Stack:")
        for key, value in analysis['tech_stack'].items():
            print(f"  - {key}: {value}")
        
        print(f"\nDatabase: {analysis.get('database', 'Not detected')}")
        
        print(f"\nDirectories Found:")
        for dir_name, info in analysis['structure'].items():
            print(f"  - {dir_name}/ ({info.get('file_count', 0)} files)")
        
        print(f"\nEnvironment Variables: {len(analysis['env_vars'])} found")
        
        print("\nRun with --generate to create CLAUDE.md content")
        print("Run with --generate --write to write CLAUDE.md file")


if __name__ == "__main__":
    main()
