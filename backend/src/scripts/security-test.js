const { execCommand } = require('./src/services/sshClient');
const results = [];

async function test(desc, cmd) {
  const r = await execCommand('sudo su - student_a -c ' + JSON.stringify(cmd));
  const blocked = r.code !== 0 || r.stderr.includes('denied') || r.stderr.includes('not permitted') || r.stderr.includes('cannot') || r.stderr.includes('only root');
  results.push({ desc, blocked, detail: (r.stdout || r.stderr).trim().slice(0, 60).replace(/\n/g, ' | ') });
}

async function main() {
  // 1. Escalada de privilegios
  await test('sudo su', 'sudo su -c whoami 2>&1');
  await test('sudo -i', 'sudo -i whoami 2>&1');
  await test('sudo bash', 'sudo bash -c whoami 2>&1');
  await test('sudo passwd root', 'echo a | sudo passwd root 2>&1');
  await test('su root', 'echo | su -c whoami root 2>&1');
  await test('su labadmin', 'echo | su -c "echo ok" labadmin 2>&1');
  await test('su other student', 'echo | su -c "echo ok" student_b 2>&1');
  let r = await execCommand('sudo su - student_a -c "echo test >> /etc/sudoers 2>&1"');
  results.push({ desc: 'echo to sudoers', blocked: r.code !== 0, detail: (r.stderr || r.stdout).trim().slice(0, 60) });

  // 2. Acceso al sistema de archivos
  await test('cat /etc/shadow', 'cat /etc/shadow 2>&1');
  await test('cat /etc/sudoers', 'cat /etc/sudoers 2>&1');
  await test('cat /etc/ssh/sshd_config', 'cat /etc/ssh/sshd_config 2>&1');
  await test('ls /home/labadmin/', 'ls /home/labadmin/ 2>&1');
  await test('ls /root/', 'ls /root/ 2>&1');
  await test('echo >> /etc/passwd', 'echo x >> /etc/passwd 2>&1');
  await test('echo >> /etc/hosts', 'echo x >> /etc/hosts 2>&1');
  await test('ls /home/sec_test/', 'ls /home/sec_test/ 2>&1 || echo DENIED');

  // 3. Agotamiento de recursos
  await test('ulimit -u', 'ulimit -u');
  await test('ulimit -f', 'ulimit -f');

  // 4. Acceso a la red
  await test('curl google', 'curl --connect-timeout 2 https://google.com 2>&1');
  await test('wget google', 'wget --timeout=2 https://google.com 2>&1');
  await test('ping 8.8.8.8', 'ping -c 1 -W 2 8.8.8.8 2>&1');

  // 5. Visibilidad de procesos
  await test('ps aux (other users)', 'ps aux | tail -5');
  r = await execCommand('sudo su - student_b -c "sleep 30 & echo \$!"');
  const pid = r.stdout.trim();
  await test('kill other process', 'kill -9 ' + pid + ' 2>&1');

  // 6. Manipulacion del entorno
  await test('chsh', 'chsh -s /bin/sh 2>&1');
  await test('chmod u+s', 'chmod u+s ~/nothing.sh 2>&1');

  // 7. Abuso de comandos del temario
  await test('find .key files', 'find / -name "*.key" 2>/dev/null | head -3');
  await test('grep password /etc', 'grep -r "password" /etc/ 2>/dev/null | head -3');
  await test('ln -s /etc/shadow', 'ln -sf /etc/shadow /tmp/link && cat /tmp/link 2>&1');

  // 8. Variables de entorno
  await test('PATH hijack', 'export PATH=~/:$PATH && echo '#!/bin/bash' > ~/sudo && echo bash >> ~/sudo && chmod +x ~/sudo && sudo 2>&1');
  await test('LD_PRELOAD', 'export LD_PRELOAD=/home/student_a/mal.so 2>&1');

  // 10. Persistencia maliciosa
  await test('crontab -e', 'crontab -e 2>&1');
  await test('echo >> /etc/cron.d', 'echo "* * * * * root bash" >> /etc/cron.d/mal 2>&1');
  await test('echo >> /etc/bash.bashrc', 'echo "sudo bash" >> /etc/bash.bashrc 2>&1');

  // Print results
  console.log('\n═══════════════════════════════════════');
  console.log('     RESULTADOS DE SEGURIDAD');
  console.log('═══════════════════════════════════════\n');
  let pass = 0, fail = 0;
  for (const t of results) {
    const icon = t.blocked ? '✅' : '❌';
    if (t.blocked) pass++; else fail++;
    console.log(icon, (t.blocked ? 'RESTRINGIDO' : 'ACCESIBLE').padEnd(14), '-', t.desc.padEnd(30), '|', t.detail);
  }
  console.log(`\n${'='.repeat(50)}`);
  console.log(`  Total: ${results.length} | Protegidos: ${pass} | Vulnerables: ${fail}`);
  console.log(`${'='.repeat(50)}`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
