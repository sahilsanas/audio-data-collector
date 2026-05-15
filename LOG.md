#############################################
# 🏗️ CENTRALIZED LOGGING SYSTEM (FULL SETUP)
# VPC + SUBNET + SG + VM CONFIG + RSYSLOG
#############################################

#################################################
# 🌐 1. VPC DESIGN (AWS EXAMPLE)
#################################################

VPC CIDR:
10.0.0.0/16

Subnets:
- Public Subnet (optional bastion): 10.0.0.0/24
- Private Subnet (Log Server):     10.0.1.0/24
- Private Subnet (Clients):        10.0.2.0/24

-------------------------------------------------

#################################################
# 🖥️ 2. IP ASSIGNMENT
#################################################

Log Server VM:
- Private IP: 10.0.1.10

Client VM1:
- Private IP: 10.0.2.11

Client VM2:
- Private IP: 10.0.2.12

-------------------------------------------------

#################################################
# 🔐 3. SECURITY GROUP CONFIGURATION
#################################################

### Log Server SG (sg-logserver)

Inbound Rules:
- SSH  (22)  → Your IP only (for admin access)
- TCP 514    → 10.0.0.0/16 (all VMs in VPC)

Outbound Rules:
- All traffic (default)

-------------------------------------------------

### Client SG (sg-clients)

Inbound Rules:
- SSH 22 → Your IP (optional for login)

Outbound Rules:
- TCP 514 → 10.0.1.10 (Log Server IP)

OR (simpler):
- All traffic allowed (default)

-------------------------------------------------

#################################################
# 🖥️ 4. LOG SERVER SETUP COMMANDS
#################################################

sudo apt update
sudo apt install rsyslog -y

sudo nano /etc/rsyslog.conf

# ENABLE TCP RECEIVER:
# module(load="imtcp")
# input(type="imtcp" port="514")

sudo systemctl restart rsyslog
sudo systemctl enable rsyslog

-------------------------------------------------

#################################################
# 🖥️ 5. CLIENT VM SETUP COMMANDS
#################################################

sudo apt update
sudo apt install rsyslog -y

sudo nano /etc/rsyslog.d/50-default.conf

# ADD THIS LINE:
*.* @@10.0.1.10:514

sudo systemctl restart rsyslog

-------------------------------------------------

#################################################
# 🧪 6. TESTING

# On CLIENT VM:
logger "Hello from Client VM1"

# On LOG SERVER:
tail -f /var/log/syslog

-------------------------------------------------

#################################################
# 📂 7. OPTIONAL (SEPARATE LOGS PER VM)

sudo nano /etc/rsyslog.conf

ADD:

$template RemoteLogs,"/var/log/%HOSTNAME%/remote.log"
*.* ?RemoteLogs
& stop

sudo systemctl restart rsyslog

-------------------------------------------------

#################################################
# 🔐 8. KEY SECURITY POINTS (FOR VIVA)

- No public IP for log server
- Only private IP communication (10.0.0.0/16)
- Port 514 restricted to VPC only
- SSH restricted to your IP
- Key-based authentication only

#################################################
