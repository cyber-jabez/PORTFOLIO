/**
 * terminal.js — Hidden Interactive Cybersecurity CLI Terminal
 * Triggered via [Ctrl + Alt + T] or terminal launcher pill.
 * Features a Virtual File System (VFS) with working ls, cd, cat, pwd,
 * tab-autocompletion, command history, and custom cybersecurity tools.
 */

(function () {
  'use strict';

  // Virtual File System Tree
  const VFS = {
    name: '~',
    type: 'dir',
    children: {
      'about.txt': {
        type: 'file',
        content: `[JABEZ GABRIELRAJ E]
Title: Cybersecurity Student & Blue Team Operations
Location: Coimbatore, Tamil Nadu, India
Specialization: Linux Hardening, Threat Detection, Cloud Defense (AWS), SIEM Analysis
Philosophy: "Defense in depth — assume breach, verify continuously, automate response."
Status: Available for security engineering, blue-team & SOC internships.`
      },
      'contact.txt': {
        type: 'file',
        content: `[SECURE COMMS & REACHABILITY]
Email:    jabezgabrielraj@gmail.com
LinkedIn: https://linkedin.com/in/jabez-gabrielraj
GitHub:   https://github.com/cyber-jabez
Location: Coimbatore, India (IST · UTC+5:30)
Security: OpenPGP Key ID: 0x9F8E7D6C5B4A3928
Status:   Direct messages open for defensive security collaborations.`
      },
      'resume.txt': {
        type: 'file',
        content: `[EXECUTIVE SUMMARY — JABEZ GABRIELRAJ E]
Education: B.Tech in Cybersecurity
Download:  Type 'open resume' or navigate to /Jabez_Gabrielraj_Resume.pdf

Core Capabilities:
  • Network Analysis & Packet Inspection: Wireshark, Zeek, Suricata, Snort
  • SIEM & Threat Detection: Splunk, Elastic SIEM, Wazuh, Sysmon
  • Cloud Security & IAM: AWS IAM, CloudTrail, GuardDuty, S3 security policies
  • Incident Containment: Linux kernel hardening, iptables/nftables, PAM security`
      },
      'skills': {
        type: 'dir',
        children: {
          'cloud-security.txt': {
            type: 'file',
            content: `[SUBSYSTEM: CLOUD SECURITY ARCHITECTURE]
- Cloud Providers: AWS (IAM least privilege, VPC peering, CloudTrail, GuardDuty)
- Container Security: Hardened Dockerfiles, non-root daemons, attack surface reduction
- Infrastructure as Code: Defensive baseline configurations, zero-trust perimeter enforcement`
          },
          'threat-analysis.txt': {
            type: 'file',
            content: `[SUBSYSTEM: THREAT HUNTING & DETECTION ENGINEERING]
- SIEM Platforms: Splunk, Wazuh, ELK Stack
- Rule Engineering: Sigma rules, custom detection queries for brute-force & lateral movement
- Artifact Analysis: Memory dump examination (Volatility), event log timeline correlation`
          },
          'linux-hardening.txt': {
            type: 'file',
            content: `[SUBSYSTEM: LINUX HARDENING & OPERATIONAL SECURITY]
- Kernel Tuning: sysctl stack protection (disable ICMP redirects, TCP syncookies, randomize va_space)
- Authentication: Enforced SSH ed25519 public-keys, fail2ban rate limiting, sudoers lockdown
- Auditing: Linux auditd daemon rules monitoring execve, ptrace, and unauthorized /etc modifications`
          },
          'network-defense.txt': {
            type: 'file',
            content: `[SUBSYSTEM: NETWORK DEFENSE & RESILIENCE]
- Stateful Filtering: iptables, nftables, pfSense firewall routing
- Traffic Inspection: Deep packet inspection with Wireshark, anomaly detection with Zeek
- Segmentation: 802.1Q VLAN enclaves, DMZ isolation, air-gap architecture`
          }
        }
      },
      'projects': {
        type: 'dir',
        children: {
          'cira.txt': {
            type: 'file',
            content: `[PROJECT: CIRA — Cyber Incident Response Automation]
Overview: An automated SOAR engine that ingests intrusion detection alerts, isolates affected host nodes, and enriches IOCs via VirusTotal and AlienVault OTX APIs.
Tech Stack: Python, FastAPI, Docker, Redis, Snort/Suricata
Repository: https://github.com/cyber-jabez
Status: Production Ready`
          },
          'sandbox-malware.txt': {
            type: 'file',
            content: `[PROJECT: Automated Behavioral Malware Sandbox]
Overview: Isolated virtualization chamber for automated execution and analysis of suspect PE binaries, tracking process injection, registry tampering, and outbound beacon attempts.
Tech Stack: C, Python, QEMU/KVM, Wireshark, Volatility
Status: Research & Active Engineering`
          },
          'risk-rank.txt': {
            type: 'file',
            content: `[PROJECT: RiskRank — Vulnerability Prioritization Matrix]
Overview: Enterprise security triage engine that merges CVSS v3.1/v4.0 scoring with real-world EPSS exploit likelihood and active threat intelligence feeds to optimize patching schedules.
Tech Stack: TypeScript, Node.js, SQLite, Chart.js
Status: Live Deployment`
          }
        }
      },
      'certifications': {
        type: 'dir',
        children: {
          'certifications.txt': {
            type: 'file',
            content: `[VERIFIED CREDENTIALS & TRAINING]
• Blue Team Operations & Incident Response Fundamentals
• Practical Ethical Hacking & Defensive Hardening Methodologies
• TryHackMe: Top 5% Global Ranking (SOC Analyst Level 1, Pre-Security Path)
• HackTheBox: Active Participant in Defensive Security & CTF Labs`
          }
        }
      },
      'secrets': {
        type: 'dir',
        children: {
          'flag.txt': {
            type: 'file',
            content: `[FLAG DISCOVERED!]
🚩 JGR{b1u3_t34m_d3f3nd3r_ctrl_alt_t_2026}
Verification: Terminal Easter Egg unlocked!
Tip: Try typing 'matrix' for cyber visualizer, or 'theme light' / 'theme dark' to switch UI.`
          }
        }
      }
    }
  };

  // State Management
  let terminalModal = null;
  let terminalBody = null;
  let terminalInput = null;
  let currentPromptPath = null;
  let isOpen = false;
  let isMaximized = false;
  let currentPath = ['~']; // Array representing current directory stack
  const commandHistory = [];
  let historyIndex = -1;

  // Resolve VFS node from relative or absolute path string
  function resolveNode(pathStr) {
    if (!pathStr || pathStr.trim() === '') {
      return { node: getNodeAtCurrentPath(), path: [...currentPath] };
    }

    const trimmed = pathStr.trim();
    let tokens = trimmed.split('/').filter(Boolean);
    let resolvedPath = [];

    if (trimmed.startsWith('~') || trimmed.startsWith('/')) {
      resolvedPath = ['~'];
      if (trimmed.startsWith('~')) tokens = tokens.slice(1);
    } else {
      resolvedPath = [...currentPath];
    }

    let currentNode = VFS;
    for (let i = 1; i < resolvedPath.length; i++) {
      currentNode = currentNode.children[resolvedPath[i]];
    }

    for (const token of tokens) {
      if (token === '.') {
        continue;
      } else if (token === '..') {
        if (resolvedPath.length > 1) {
          resolvedPath.pop();
          currentNode = VFS;
          for (let i = 1; i < resolvedPath.length; i++) {
            currentNode = currentNode.children[resolvedPath[i]];
          }
        }
      } else {
        if (!currentNode.children || !currentNode.children[token]) {
          return { error: `No such file or directory: ${token}` };
        }
        currentNode = currentNode.children[token];
        resolvedPath.push(token);
      }
    }

    return { node: currentNode, path: resolvedPath };
  }

  function getNodeAtCurrentPath() {
    let node = VFS;
    for (let i = 1; i < currentPath.length; i++) {
      node = node.children[currentPath[i]];
    }
    return node;
  }

  function getDisplayPath() {
    return currentPath.join('/');
  }

  // Create & Inject Terminal DOM
  function createTerminalDOM() {
    if (document.getElementById('cyberTerminalModal')) {
      return document.getElementById('cyberTerminalModal');
    }

    const modal = document.createElement('div');
    modal.id = 'cyberTerminalModal';
    modal.className = 'cyber-terminal-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', 'Interactive Security Terminal');
    modal.setAttribute('aria-hidden', 'true');

    modal.innerHTML = `
      <div class="cyber-terminal-backdrop" id="cyberTerminalBackdrop"></div>
      <div class="cyber-terminal-window" id="cyberTerminalWindow">
        <!-- Titlebar -->
        <div class="cyber-terminal-header">
          <div class="cyber-terminal-dots">
            <button class="cyber-terminal-dot dot-close" id="termCloseBtn" title="Close Terminal (ESC)" aria-label="Close Terminal"></button>
            <button class="cyber-terminal-dot dot-min" id="termMinBtn" title="Minimize Terminal" aria-label="Minimize Terminal"></button>
            <button class="cyber-terminal-dot dot-max" id="termMaxBtn" title="Toggle Fullscreen" aria-label="Toggle Fullscreen"></button>
          </div>
          <div class="cyber-terminal-title">
            <span class="cyber-term-icon" aria-hidden="true">⚡</span>
            <span class="cyber-term-title-text">guest@jgr-sec: ${getDisplayPath()} (jgr-sh v2.4)</span>
          </div>
          <div class="cyber-terminal-badge">
            <span class="cyber-badge-dot"></span>
            <span>SEC-AIRGAP // ONLINE</span>
          </div>
        </div>

        <!-- Terminal Output Scroll Area -->
        <div class="cyber-terminal-body" id="cyberTerminalBody">
          <div class="cyber-term-banner">
            <pre class="cyber-ascii-art">
   __  ____  ___     ____  __  _____  ___  ___  ___  __
  / / / ___// _ \\   / __/ / / / / _ )/ _ \\/ _ \\/ _ \\/ /
 / /_/ (_ // // /  _\\ \\  / /_/ / _  / // / // / // /_/ 
 \\____/___//____/  /___/  \\____/____/____/____/____(_)  
            </pre>
            <div class="cyber-term-meta">
              <span>SYSTEM: <strong>JGR-CyberOS 2026.4</strong></span>
              <span>KERNEL: <strong>Linux 6.8.0-blue-team (x86_64)</strong></span>
              <span>HOST: <strong>cyber-jabez.github.io</strong></span>
              <span>SHELL: <strong>jgr-sh v2.4 (x86_64-pc-linux-gnu)</strong></span>
            </div>
            <p class="cyber-term-welcome">
              Welcome to the Interactive Security Shell. Type <span class="term-highlight">help</span> to list commands, or use <span class="term-highlight">ls</span> and <span class="term-highlight">cd</span> to navigate the security dossiers.
            </p>
          </div>

          <div id="cyberTerminalHistory"></div>

          <!-- Active Prompt Line -->
          <div class="cyber-terminal-line cyber-active-line">
            <span class="cyber-prompt">
              <span class="prompt-user">guest</span><span class="prompt-at">@</span><span class="prompt-host">jgr-sec</span>:<span class="prompt-path" id="termPromptPath">${getDisplayPath()}</span><span class="prompt-char">$</span>
            </span>
            <input type="text" id="cyberTerminalInput" class="cyber-terminal-input" autocomplete="off" spellcheck="false" autofocus aria-label="Terminal Command Input" />
          </div>
        </div>

        <!-- Terminal Footer Status Bar -->
        <div class="cyber-terminal-footer">
          <span>Shortcuts: <kbd>Ctrl+Alt+T</kbd> Toggle • <kbd>Tab</kbd> Autocomplete • <kbd>↑/↓</kbd> History • <kbd>ESC</kbd> Close</span>
          <span class="term-footer-clock" id="termFooterClock">--:--:-- IST</span>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Cache elements
    terminalModal = modal;
    terminalBody = modal.querySelector('#cyberTerminalBody');
    terminalInput = modal.querySelector('#cyberTerminalInput');
    currentPromptPath = modal.querySelector('#termPromptPath');

    // Event Bindings
    modal.querySelector('#cyberTerminalBackdrop').addEventListener('click', closeTerminal);
    modal.querySelector('#termCloseBtn').addEventListener('click', closeTerminal);
    modal.querySelector('#termMinBtn').addEventListener('click', closeTerminal);
    modal.querySelector('#termMaxBtn').addEventListener('click', toggleMaximize);

    terminalBody.addEventListener('click', () => {
      if (terminalInput) terminalInput.focus();
    });

    terminalInput.addEventListener('keydown', handleInputKeydown);

    // Terminal Footer Clock
    const footerClock = modal.querySelector('#termFooterClock');
    if (footerClock) {
      const updateClock = () => {
        try {
          const now = new Date();
          const str = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false });
          footerClock.textContent = str + ' IST';
        } catch (e) {}
      };
      updateClock();
      setInterval(updateClock, 1000);
    }

    return modal;
  }

  // Terminal Window Control
  function openTerminal() {
    if (!terminalModal) createTerminalDOM();
    terminalModal.classList.add('open');
    terminalModal.setAttribute('aria-hidden', 'false');
    isOpen = true;
    updatePromptPath();
    setTimeout(() => {
      if (terminalInput) {
        terminalInput.focus();
        scrollToBottom();
      }
    }, 50);
  }

  function closeTerminal() {
    if (!terminalModal) return;
    terminalModal.classList.remove('open');
    terminalModal.setAttribute('aria-hidden', 'true');
    isOpen = false;
  }

  function toggleTerminal() {
    if (isOpen) {
      closeTerminal();
    } else {
      openTerminal();
    }
  }

  function toggleMaximize() {
    if (!terminalModal) return;
    const win = terminalModal.querySelector('#cyberTerminalWindow');
    if (win) {
      isMaximized = !isMaximized;
      win.classList.toggle('maximized', isMaximized);
    }
  }

  function updatePromptPath() {
    if (currentPromptPath) {
      currentPromptPath.textContent = getDisplayPath();
    }
    if (terminalModal) {
      const title = terminalModal.querySelector('.cyber-term-title-text');
      if (title) {
        title.textContent = `guest@jgr-sec: ${getDisplayPath()} (jgr-sh v2.4)`;
      }
    }
  }

  function scrollToBottom() {
    if (terminalBody) {
      terminalBody.scrollTop = terminalBody.scrollHeight;
    }
  }

  // Print helper
  function printOutput(htmlContent, isError = false) {
    const historyContainer = document.getElementById('cyberTerminalHistory');
    if (!historyContainer) return;

    const row = document.createElement('div');
    row.className = `cyber-output-block ${isError ? 'output-error' : ''}`;
    row.innerHTML = htmlContent;
    historyContainer.appendChild(row);
    scrollToBottom();
  }

  function printEcho(rawCommand) {
    const historyContainer = document.getElementById('cyberTerminalHistory');
    if (!historyContainer) return;

    const row = document.createElement('div');
    row.className = 'cyber-terminal-line';
    row.innerHTML = `
      <span class="cyber-prompt">
        <span class="prompt-user">guest</span><span class="prompt-at">@</span><span class="prompt-host">jgr-sec</span>:<span class="prompt-path">${getDisplayPath()}</span><span class="prompt-char">$</span>
      </span>
      <span class="cyber-command-echo">${escapeHtml(rawCommand)}</span>
    `;
    historyContainer.appendChild(row);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Command Execution Dispatcher
  function executeCommand(rawInput) {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      printEcho('');
      return;
    }

    printEcho(trimmed);
    commandHistory.push(trimmed);
    historyIndex = commandHistory.length;

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
      case '?':
        cmdHelp();
        break;

      case 'ls':
      case 'dir':
        cmdLs(args);
        break;

      case 'cd':
        cmdCd(args);
        break;

      case 'cat':
        cmdCat(args);
        break;

      case 'pwd':
        cmdPwd();
        break;

      case 'clear':
      case 'cls':
        cmdClear();
        break;

      case 'whoami':
        cmdWhoami();
        break;

      case 'uname':
        cmdUname(args);
        break;

      case 'sysinfo':
      case 'neofetch':
        cmdSysinfo();
        break;

      case 'date':
        cmdDate();
        break;

      case 'echo':
        cmdEcho(args);
        break;

      case 'theme':
        cmdTheme(args);
        break;

      case 'open':
      case 'goto':
        cmdGoto(args);
        break;

      case 'ping':
        cmdPing(args);
        break;

      case 'history':
        cmdHistory();
        break;

      case 'matrix':
      case 'hack':
        cmdMatrix();
        break;

      case 'exit':
      case 'quit':
        closeTerminal();
        break;

      default:
        printOutput(`jgr-sh: command not found: <span class="term-err">${escapeHtml(cmd)}</span>. Type <span class="term-highlight">help</span> for available commands.`, true);
        break;
    }

    scrollToBottom();
  }

  // Commands Implementation
  function cmdHelp() {
    const html = `
<div class="cyber-help-table">
  <div class="cyber-help-header">AVAILABLE SHELL COMMANDS:</div>
  <div class="cyber-help-row"><span class="cmd-name">ls [path]</span><span class="cmd-desc">List files and directories in current or specified path</span></div>
  <div class="cyber-help-row"><span class="cmd-name">cd &lt;dir&gt;</span><span class="cmd-desc">Change directory (e.g. 'cd skills', 'cd ..', 'cd ~')</span></div>
  <div class="cyber-help-row"><span class="cmd-name">cat &lt;file&gt;</span><span class="cmd-desc">Display file contents (e.g. 'cat about.txt', 'cat resume.txt')</span></div>
  <div class="cyber-help-row"><span class="cmd-name">pwd</span><span class="cmd-desc">Print current working directory path</span></div>
  <div class="cyber-help-row"><span class="cmd-name">whoami</span><span class="cmd-desc">Display current authenticated identity and security roles</span></div>
  <div class="cyber-help-row"><span class="cmd-name">sysinfo</span><span class="cmd-desc">Display system specs, hardware profile & defense telemetry</span></div>
  <div class="cyber-help-row"><span class="cmd-name">goto &lt;page&gt;</span><span class="cmd-desc">Navigate to section: [home | about | experience | projects | skills | contact | resume]</span></div>
  <div class="cyber-help-row"><span class="cmd-name">theme &lt;mode&gt;</span><span class="cmd-desc">Switch site theme: 'theme dark', 'theme light', or 'theme toggle'</span></div>
  <div class="cyber-help-row"><span class="cmd-name">ping [host]</span><span class="cmd-desc">Simulate ICMP gateway latency check (default: gateway)</span></div>
  <div class="cyber-help-row"><span class="cmd-name">matrix</span><span class="cmd-desc">Trigger high-density cyber digital rain sequence</span></div>
  <div class="cyber-help-row"><span class="cmd-name">clear</span><span class="cmd-desc">Clear the terminal output screen</span></div>
  <div class="cyber-help-row"><span class="cmd-name">history</span><span class="cmd-desc">List recently executed commands</span></div>
  <div class="cyber-help-row"><span class="cmd-name">exit</span><span class="cmd-desc">Close this terminal session (or press ESC)</span></div>
</div>
`;
    printOutput(html);
  }

  function cmdLs(args) {
    const showDetails = args.includes('-l');
    const pathArg = args.find(a => !a.startsWith('-')) || '';

    const res = resolveNode(pathArg);
    if (res.error) {
      printOutput(`ls: cannot access '${escapeHtml(pathArg)}': ${res.error}`, true);
      return;
    }

    const targetNode = res.node;
    if (targetNode.type === 'file') {
      printOutput(`<span class="ls-file">${escapeHtml(pathArg)}</span>`);
      return;
    }

    const items = Object.entries(targetNode.children || {});
    if (items.length === 0) {
      printOutput(`<span class="term-dim">(empty directory)</span>`);
      return;
    }

    if (showDetails) {
      let output = `<div class="ls-long-listing">`;
      items.forEach(([name, item]) => {
        const isDir = item.type === 'dir';
        const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
        const size = String(isDir ? '4096' : (item.content ? item.content.length : '1024'));
        const user = 'jabez';
        const group = 'cyber';
        const date = 'Nov 28 17:00';
        const nameHtml = isDir
          ? `<span class="ls-dir">${name}/</span>`
          : `<span class="ls-file">${name}</span>`;

        output += `<div class="ls-row"><code>${perms} 1 ${user} ${group} ${size.padStart(6, ' ')} ${date}</code> ${nameHtml}</div>`;
      });
      output += `</div>`;
      printOutput(output);
    } else {
      let output = `<div class="ls-grid">`;
      items.forEach(([name, item]) => {
        if (item.type === 'dir') {
          output += `<span class="ls-dir">${name}/</span>`;
        } else {
          output += `<span class="ls-file">${name}</span>`;
        }
      });
      output += `</div>`;
      printOutput(output);
    }
  }

  function cmdCd(args) {
    if (args.length === 0 || args[0] === '~' || args[0] === '') {
      currentPath = ['~'];
      updatePromptPath();
      return;
    }

    const targetPathStr = args[0];
    const res = resolveNode(targetPathStr);

    if (res.error) {
      printOutput(`cd: ${escapeHtml(targetPathStr)}: ${res.error}`, true);
      return;
    }

    if (res.node.type !== 'dir') {
      printOutput(`cd: not a directory: ${escapeHtml(targetPathStr)}`, true);
      return;
    }

    currentPath = res.path;
    updatePromptPath();
  }

  function cmdCat(args) {
    if (args.length === 0) {
      printOutput(`usage: cat &lt;filename&gt; (e.g. 'cat about.txt')`, true);
      return;
    }

    const targetPathStr = args[0];
    const res = resolveNode(targetPathStr);

    if (res.error) {
      printOutput(`cat: ${escapeHtml(targetPathStr)}: ${res.error}`, true);
      return;
    }

    if (res.node.type === 'dir') {
      printOutput(`cat: ${escapeHtml(targetPathStr)}: Is a directory`, true);
      return;
    }

    const formatted = escapeHtml(res.node.content).replace(/\n/g, '<br/>');
    printOutput(`<div class="cat-content">${formatted}</div>`);
  }

  function cmdPwd() {
    const full = '/home/jabez' + (currentPath.length > 1 ? '/' + currentPath.slice(1).join('/') : '');
    printOutput(`<code>${full}</code>`);
  }

  function cmdClear() {
    const historyContainer = document.getElementById('cyberTerminalHistory');
    if (historyContainer) historyContainer.innerHTML = '';
  }

  function cmdWhoami() {
    printOutput(`
<div class="whoami-card">
  <span>UID: <strong>1000 (guest)</strong></span>
  <span>GID: <strong>1000 (guest-analyst)</strong></span>
  <span>ROLES: <strong>[blue-team, threat-hunting, cloud-sec, air-gap-auditor]</strong></span>
  <span>HOST: <strong>cyber-jabez.github.io</strong></span>
</div>`);
  }

  function cmdUname(args) {
    if (args.includes('-a')) {
      printOutput(`Linux jgr-sec 6.8.0-blue-team-hardening #42-SMP PREEMPT_DYNAMIC GNU/Linux x86_64`);
    } else {
      printOutput(`Linux`);
    }
  }

  function cmdSysinfo() {
    printOutput(`
<div class="cyber-sysinfo-box">
  <div class="sysinfo-header">=== SYSTEM & ARCHITECTURE DIAGNOSTICS ===</div>
  <div>OPERATOR:      Jabez Gabrielraj E [Cybersecurity Specialist]</div>
  <div>OS:            JGR-CyberOS 2026.4 (Ubuntu Kernel 6.8 Hardened)</div>
  <div>UPTIME:        99.98% High-Availability Gateway</div>
  <div>SECURITY:      SELinux Enforcing // Zero-Trust Air-Gap Enabled</div>
  <div>LOCATION:      Coimbatore, Tamil Nadu, India</div>
  <div>LATENCY:       12ms to Secure Gateway</div>
  <div>DEFCON LEVEL:  DEFCON 4 (NORMAL READINESS // BLUE TEAM ACTIVE)</div>
</div>`);
  }

  function cmdDate() {
    const now = new Date();
    const ist = now.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
    const utc = now.toUTCString();
    printOutput(`IST: ${ist}<br/>UTC: ${utc}`);
  }

  function cmdEcho(args) {
    printOutput(escapeHtml(args.join(' ')));
  }

  function cmdTheme(args) {
    const mode = (args[0] || 'toggle').toLowerCase();
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';

    let nextTheme = currentTheme;
    if (mode === 'dark') nextTheme = 'dark';
    else if (mode === 'light') nextTheme = 'light';
    else if (mode === 'toggle') nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    else {
      printOutput(`usage: theme [dark | light | toggle] (currently: ${currentTheme})`, true);
      return;
    }

    document.documentElement.setAttribute('data-theme', nextTheme);
    document.documentElement.style.colorScheme = nextTheme;
    localStorage.setItem('portfolio-theme', nextTheme);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: nextTheme } }));

    printOutput(`[THEME ALTERED] Switched site display theme to: <strong>${nextTheme.toUpperCase()}</strong>`);
  }

  function cmdGoto(args) {
    if (args.length === 0) {
      printOutput(`usage: goto [home | about | experience | projects | skills | contact | resume]`, true);
      return;
    }

    const target = args[0].toLowerCase();
    const targets = {
      home: 'index.html#hero',
      hero: 'index.html#hero',
      about: 'index.html#about',
      experience: 'index.html#experience',
      projects: 'projects.html',
      skills: 'skills.html',
      contact: 'contact.html',
      resume: 'Jabez_Gabrielraj_Resume.pdf'
    };

    if (!targets[target]) {
      printOutput(`Unknown target '${escapeHtml(target)}'. Available: home, about, experience, projects, skills, contact, resume`, true);
      return;
    }

    const url = targets[target];
    printOutput(`Redirecting viewport to <strong>${target}</strong>...`);

    setTimeout(() => {
      closeTerminal();
      if (target === 'resume') {
        window.open(url, '_blank');
      } else {
        window.location.href = url;
      }
    }, 600);
  }

  function cmdPing(args) {
    const host = args[0] || 'gateway.jgr-sec.local';
    let count = 0;
    const maxPings = 4;

    printOutput(`PING ${escapeHtml(host)} (127.0.0.1) 56(84) bytes of data.`);

    const interval = setInterval(() => {
      count++;
      const ms = (Math.random() * 8 + 10).toFixed(2);
      printOutput(`64 bytes from ${escapeHtml(host)} (127.0.0.1): icmp_seq=${count} ttl=64 time=${ms} ms`);
      scrollToBottom();

      if (count >= maxPings) {
        clearInterval(interval);
        printOutput(`--- ${escapeHtml(host)} ping statistics ---<br/>${maxPings} packets transmitted, ${maxPings} received, 0% packet loss`);
        scrollToBottom();
      }
    }, 350);
  }

  function cmdHistory() {
    if (commandHistory.length === 0) {
      printOutput(`(No command history yet)`);
      return;
    }
    let html = `<div class="history-list">`;
    commandHistory.forEach((c, idx) => {
      html += `<div><code>${String(idx + 1).padStart(3, ' ')}</code> ${escapeHtml(c)}</div>`;
    });
    html += `</div>`;
    printOutput(html);
  }

  function cmdMatrix() {
    printOutput(`<div class="matrix-text" id="termMatrixRain">Initializing secure cipher feed...</div>`);
    const container = document.getElementById('termMatrixRain');
    if (!container) return;

    let frames = 0;
    const glyphs = '01アイウエオカキクケコサシスセソタチツテト0123456789ABCDEF!@#$%^&*<>[]{}';
    const interval = setInterval(() => {
      frames++;
      let line = '';
      for (let i = 0; i < 48; i++) {
        line += glyphs[Math.floor(Math.random() * glyphs.length)];
      }
      container.innerHTML += `<div class="matrix-line">${line}</div>`;
      scrollToBottom();

      if (frames > 12) {
        clearInterval(interval);
        printOutput(`<span class="term-highlight">[CIPHER FEED TERMINATED // OPERATIONAL INTEGRITY 100%]</span>`);
        scrollToBottom();
      }
    }, 80);
  }

  // Keyboard navigation & Autocomplete
  function handleInputKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = terminalInput.value;
      terminalInput.value = '';
      executeCommand(val);
      return;
    }

    // Up Arrow: Previous History
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex > 0) {
        historyIndex--;
        terminalInput.value = commandHistory[historyIndex] || '';
      }
      return;
    }

    // Down Arrow: Next History
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        terminalInput.value = commandHistory[historyIndex] || '';
      } else {
        historyIndex = commandHistory.length;
        terminalInput.value = '';
      }
      return;
    }

    // Tab: Autocomplete commands and file/directory names
    if (e.key === 'Tab') {
      e.preventDefault();
      autocomplete();
      return;
    }

    // Ctrl + L: Clear terminal
    if ((e.ctrlKey || e.metaKey) && (e.key === 'l' || e.key === 'L')) {
      e.preventDefault();
      cmdClear();
      return;
    }

    // Ctrl + C: Abort current line
    if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      printEcho(terminalInput.value + '^C');
      terminalInput.value = '';
      return;
    }

    // Escape: Close terminal
    if (e.key === 'Escape') {
      e.preventDefault();
      closeTerminal();
      return;
    }
  }

  function autocomplete() {
    const val = terminalInput.value;
    const parts = val.split(' ');

    // Autocomplete first command
    if (parts.length === 1) {
      const prefix = parts[0].toLowerCase();
      const allCommands = [
        'help', 'ls', 'cd', 'cat', 'pwd', 'clear', 'whoami',
        'uname', 'sysinfo', 'neofetch', 'date', 'echo', 'theme',
        'goto', 'open', 'ping', 'history', 'matrix', 'exit'
      ];
      const matches = allCommands.filter(c => c.startsWith(prefix));
      if (matches.length === 1) {
        terminalInput.value = matches[0] + ' ';
      } else if (matches.length > 1) {
        printEcho(val);
        printOutput(matches.join('   '));
      }
      return;
    }

    // Autocomplete path for cd, ls, cat
    const cmd = parts[0].toLowerCase();
    if (['cd', 'ls', 'cat'].includes(cmd)) {
      const targetPrefix = parts[parts.length - 1];
      const currentNode = getNodeAtCurrentPath();
      if (!currentNode || !currentNode.children) return;

      const children = Object.keys(currentNode.children);
      const matches = children.filter(name => name.startsWith(targetPrefix));

      if (matches.length === 1) {
        const item = currentNode.children[matches[0]];
        const suffix = item.type === 'dir' ? '/' : ' ';
        parts[parts.length - 1] = matches[0] + suffix;
        terminalInput.value = parts.join(' ');
      } else if (matches.length > 1) {
        printEcho(val);
        printOutput(matches.map(m => currentNode.children[m].type === 'dir' ? m + '/' : m).join('   '));
      }
    }
  }

  // Global Keybinding Listener: Ctrl + Alt + T
  window.addEventListener('keydown', function (e) {
    // Check for Ctrl + Alt + T or Cmd + Option + T (Mac)
    const isCtrlAltT = (e.ctrlKey || e.metaKey) && e.altKey && (e.key === 't' || e.key === 'T');

    if (isCtrlAltT) {
      e.preventDefault();
      toggleTerminal();
      return;
    }

    // ESC closes terminal if open
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      closeTerminal();
    }
  });

  // Inject a Floating / Sticky Trigger Pill in Footer or Header for Discoverability
  function injectTerminalTriggerButton() {
    if (document.getElementById('terminalLauncherPill')) return;

    const btn = document.createElement('button');
    btn.id = 'terminalLauncherPill';
    btn.className = 'terminal-launcher-pill';
    btn.setAttribute('type', 'button');
    btn.setAttribute('title', 'Open Hidden Terminal (Ctrl + Alt + T)');
    btn.setAttribute('aria-label', 'Open Cyber Terminal');
    btn.innerHTML = `
      <span class="term-pill-icon" aria-hidden="true">&gt;_</span>
      <span class="term-pill-text">Terminal</span>
      <kbd class="term-pill-kbd">Ctrl+Alt+T</kbd>
    `;

    btn.addEventListener('click', () => {
      toggleTerminal();
    });

    document.body.appendChild(btn);
  }

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createTerminalDOM();
      injectTerminalTriggerButton();
    });
  } else {
    createTerminalDOM();
    injectTerminalTriggerButton();
  }

  // Expose API for external buttons/links
  window.cyberTerminal = {
    open: openTerminal,
    close: closeTerminal,
    toggle: toggleTerminal
  };
})();
