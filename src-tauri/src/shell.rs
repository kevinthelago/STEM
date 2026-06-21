/// Resolve the shell binary to spawn for a PTY session. On Windows, bare "bash"
/// resolves to the WSL launcher in System32 — which fails when no WSL distro is
/// installed. We locate Git Bash explicitly and fall back to bare "bash" last.
pub(crate) fn resolve_shell() -> String {
    if let Ok(s) = std::env::var("SHELL") {
        if !s.is_empty() && std::path::Path::new(&s).exists() {
            return s;
        }
    }
    #[cfg(windows)]
    if let Some(b) = find_git_bash() {
        return b;
    }
    "bash".to_string()
}

/// Locate Git Bash's bash.exe (never WSL's System32 stub) from known install roots
/// and any Git directory derivable from `git.exe` on PATH.
#[cfg(windows)]
pub(crate) fn find_git_bash() -> Option<String> {
    use std::path::PathBuf;
    let mut roots: Vec<PathBuf> = Vec::new();
    for var in ["ProgramFiles", "ProgramFiles(x86)", "ProgramW6432"] {
        if let Ok(p) = std::env::var(var) {
            roots.push(PathBuf::from(p).join("Git"));
        }
    }
    if let Ok(p) = std::env::var("LOCALAPPDATA") {
        roots.push(PathBuf::from(p).join("Programs").join("Git"));
    }
    roots.push(PathBuf::from(r"C:\Program Files\Git"));
    if let Some(path_var) = std::env::var_os("PATH") {
        for dir in std::env::split_paths(&path_var) {
            if dir.join("git.exe").exists() {
                if let Some(root) = dir.parent() {
                    roots.push(root.to_path_buf());
                }
            }
        }
    }
    bash_in_roots(&roots, &|p| p.exists())
}

#[cfg(windows)]
fn bash_in_roots(
    roots: &[std::path::PathBuf],
    exists: &dyn Fn(&std::path::Path) -> bool,
) -> Option<String> {
    for root in roots {
        let bin = root.join("bin").join("bash.exe");
        if exists(&bin) {
            return Some(bin.to_string_lossy().into_owned());
        }
        let usr = root.join("usr").join("bin").join("bash.exe");
        if exists(&usr) {
            return Some(usr.to_string_lossy().into_owned());
        }
    }
    None
}

/// Verify that `claude` is on PATH and return its path, or an error message.
pub(crate) fn find_claude() -> Result<String, String> {
    // Check PATH entries for claude / claude.cmd / claude.exe
    let names: &[&str] = if cfg!(windows) {
        &["claude.cmd", "claude.exe", "claude"]
    } else {
        &["claude"]
    };
    if let Some(path_var) = std::env::var_os("PATH") {
        for dir in std::env::split_paths(&path_var) {
            for name in names {
                let candidate = dir.join(name);
                if candidate.exists() {
                    return Ok(candidate.to_string_lossy().into_owned());
                }
            }
        }
    }
    Err("`claude` not found on PATH. Install Claude Code (https://claude.ai/code) and ensure it is on your PATH.".to_string())
}

#[cfg(test)]
mod tests {
    #[cfg(windows)]
    use super::bash_in_roots;

    #[cfg(windows)]
    #[test]
    fn bash_in_roots_returns_none_for_empty_roots() {
        let result = bash_in_roots(&[], &|_| false);
        assert!(result.is_none());
    }

    #[cfg(windows)]
    #[test]
    fn bash_in_roots_finds_bin_first() {
        use std::path::PathBuf;
        let root = PathBuf::from(r"C:\Program Files\Git");
        let found = bash_in_roots(&[root.clone()], &|p| {
            p == root.join("bin").join("bash.exe")
        });
        assert!(found.is_some());
        assert!(found.unwrap().ends_with("bin\\bash.exe"));
    }
}
