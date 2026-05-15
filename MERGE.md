ssh-keygen -t rsa -b 4096

cat ~/.ssh/id_rsa.pub

nano ~/.ssh/authorized_keys

chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

scp file1.txt ubuntu@10.0.1.20:/home/ubuntu/

sudo nano /etc/ssh/sshd_config

PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes

sudo systemctl restart ssh
