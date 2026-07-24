#!/usr/bin/env npx tsx
/**
 * MX Kiro Setup Script
 * 
 * Sets up the complete Kiro × MX Creative Console integration:
 * 1. Creates config directory (~/.kiro-mx/)
 * 2. Generates default config
 * 3. Installs Kiro hooks
 * 4. Configures MCP server
 * 5. Copies steering files
 * 
 * Usage: npx tsx scripts/setup.ts
 */

import { mkdirSync, writeFileSync, copyFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const HOME = homedir();
const KIRO_DIR = join(HOME, '.kiro');
const KIRO_MX_DIR = join(HOME, '.kiro-mx');
const PROJECT_DIR = join(import.meta.dirname, '..');

console.log('🎛️  MX Kiro Setup');
console.log('==================\n');

// Step 1: Create config directory
console.log('1️⃣  Creating config directory...');
mkdirSync(KIRO_MX_DIR, { recursive: true });
console.log(`   ✅ ${KIRO_MX_DIR}`);

// Step 2: Generate default config (if not exists)
const configPath = join(KIRO_MX_DIR, 'config.json');
if (!existsSync(configPath)) {
  console.log('\n2️⃣  Generating default config...');
  const defaultConfig = {
    bridge: { port: 9847, host: 'localhost' },
    pages: [
      {
        name: 'Prompts',
        buttons: [
          { index: 0, type: 'skill', value: '/criticize', label: 'Eleştir', icon: '🔍' },
          { index: 1, type: 'skill', value: '/refactor', label: 'Refactor', icon: '♻️' },
          { index: 2, type: 'skill', value: '/test-write', label: 'Test Yaz', icon: '🧪' },
          { index: 3, type: 'skill', value: '/explain', label: 'Açıkla', icon: '💡' },
          { index: 4, type: 'skill', value: '/fix-bug', label: 'Fix Bug', icon: '🐛' },
          { index: 5, type: 'skill', value: '/optimize', label: 'Optimize', icon: '⚡' },
          { index: 6, type: 'skill', value: '/review', label: 'Review', icon: '👀' },
          { index: 7, type: 'skill', value: '/document', label: 'Dokümante', icon: '📝' },
          { index: 8, type: 'skill', value: '/simplify', label: 'Basitleştir', icon: '✂️' },
        ],
      },
    ],
    sessionHealth: { warnAt: 30000, alertAt: 50000, criticalAt: 70000 },
  };
  writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  console.log(`   ✅ ${configPath}`);
} else {
  console.log('\n2️⃣  Config already exists, skipping.');
}

// Step 3: Install global steering files
console.log('\n3️⃣  Installing steering files...');
const steeringDir = join(KIRO_DIR, 'steering');
mkdirSync(steeringDir, { recursive: true });

const powerSteeringDir = join(PROJECT_DIR, 'packages', 'kiro-power', 'steering');
if (existsSync(powerSteeringDir)) {
  const files = readdirSync(powerSteeringDir).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const dest = join(steeringDir, `mx-${file}`);
    if (!existsSync(dest)) {
      copyFileSync(join(powerSteeringDir, file), dest);
      console.log(`   ✅ ${file} → ~/.kiro/steering/mx-${file}`);
    }
  }
}

// Step 4: Install global skills
console.log('\n4️⃣  Installing skills...');
const skillsDir = join(KIRO_DIR, 'skills');
mkdirSync(skillsDir, { recursive: true });

const powerSkillsDir = join(PROJECT_DIR, 'packages', 'kiro-power', 'skills');
if (existsSync(powerSkillsDir)) {
  const skillFolders = readdirSync(powerSkillsDir);
  for (const folder of skillFolders) {
    const destDir = join(skillsDir, folder);
    mkdirSync(destDir, { recursive: true });
    const skillFile = join(powerSkillsDir, folder, 'SKILL.md');
    if (existsSync(skillFile)) {
      copyFileSync(skillFile, join(destDir, 'SKILL.md'));
      console.log(`   ✅ ${folder}/SKILL.md`);
    }
  }
}

// Step 5: MCP config hint
console.log('\n5️⃣  MCP Server configuration:');
console.log('   Add this to your .kiro/settings/mcp.json:');
console.log('');
console.log('   {');
console.log('     "mcpServers": {');
console.log('       "mx-console": {');
console.log(`         "command": "node",`);
console.log(`         "args": ["${join(PROJECT_DIR, 'packages', 'bridge', 'dist', 'mcp-entry.js')}"],`);
console.log('         "autoApprove": ["mx_send_notification", "mx_update_buttons", "mx_show_animation", "mx_set_status"]');
console.log('       }');
console.log('     }');
console.log('   }');

// Done
console.log('\n==================');
console.log('✅ Setup complete!\n');
console.log('Next steps:');
console.log('  1. Start the bridge:  npm run dev:bridge');
console.log('  2. Install the Logi plugin in Logi Options+');
console.log('  3. Open Kiro and start coding with your MX Console! 👻');
