## VM hardening (Ubuntu 24.04)

These steps reduce risk for a production VM.

### 1) Create a non-root user

```bash
adduser coachscribe
usermod -aG sudo coachscribe
mkdir -p /home/coachscribe/.ssh
cp /root/.ssh/authorized_keys /home/coachscribe/.ssh/authorized_keys
chown -R coachscribe:coachscribe /home/coachscribe/.ssh
chmod 700 /home/coachscribe/.ssh
chmod 600 /home/coachscribe/.ssh/authorized_keys
```

Test login from your PC:

```bash
ssh coachscribe@91.99.170.73
```

### 2) Disable SSH password login and root login

Edit SSH config:

```bash
nano /etc/ssh/sshd_config
```

Set:

- `PasswordAuthentication no`
- `PermitRootLogin no`

Then restart SSH:

```bash
systemctl restart ssh
```

### 3) Enable automatic security updates

```bash
apt update
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

### 4) Tighten Hetzner firewall for SSH

Once you have a stable home IP, restrict port 22 inbound to that IP only.

